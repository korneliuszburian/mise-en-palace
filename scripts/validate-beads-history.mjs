import { readFileSync } from "node:fs";

const ACTIVE_STATUSES = new Set(["open", "in_progress", "blocked"]);
const STATUSES = new Set(["open", "in_progress", "blocked", "closed", "deferred"]);
const LOCAL_DEVELOPMENT_POSTGRES_URI = "postgres://krn:krn@localhost:54329/krn";
const SENSITIVE_PATTERNS = [
  /\bAKIA[0-9A-Z]{16}\b/u,
  /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/u,
  /-----BEGIN (?:RSA|EC|OPENSSH|PGP) PRIVATE KEY-----/u,
  /(?:password|secret|token)\s*[:=]\s*\\?["'`]([A-Za-z0-9+/=_-]{20,})\\?["'`]/iu,
];
const POSTGRES_CREDENTIAL_PATTERN = /postgres(?:ql)?:\/\/[^/\s:@]+:[^@\s]+@/iu;

function optionValue(argv, option) {
  const index = argv.indexOf(option);
  const value = index === -1 ? undefined : argv[index + 1];

  if (value === undefined || value.startsWith("--")) {
    throw new Error(`${option} requires a path`);
  }

  return value;
}

function readJsonLines(path) {
  return readFileSync(path, "utf8")
    .split("\n")
    .map((line, index) => ({ line: line.trim(), lineNumber: index + 1 }))
    .filter(({ line }) => line.length > 0)
    .map(({ line, lineNumber }) => {
      try {
        return { value: JSON.parse(line), lineNumber };
      } catch {
        throw new Error(`${path}:${lineNumber}: invalid JSON`);
      }
    });
}

function issueIdSet(records, errors) {
  const ids = new Set();
  const issueRecords = records.flatMap(({ value, lineNumber }) => issueRecord(value, lineNumber, errors));

  for (const { value, lineNumber } of issueRecords) {
    if (ids.has(value.id)) {
      errors.push(`issues:${lineNumber}: duplicate issue id ${value.id}`);
    }
    ids.add(value.id);
  }

  return ids;
}

// fallow-ignore-next-line complexity -- schema predicate intentionally checks independent issue identity fields
function issueRecord(value, lineNumber, errors) {
  const valid = [
    value?._type === "issue",
    typeof value?.id === "string",
    value?.id?.length > 0,
  ].every(Boolean);

  if (!valid) {
    errors.push(`issues:${lineNumber}: expected an issue record with a non-empty id`);
    return [];
  }

  return [{ value, lineNumber }];
}

function validateIssueStatus(value, lineNumber) {
  if (!STATUSES.has(value.status)) {
    return `issues:${lineNumber}: invalid status ${String(value.status)}`;
  }
  return undefined;
}

function validateIssuePriority(value, lineNumber) {
  if (!Number.isInteger(value.priority) || value.priority < 0 || value.priority > 4) {
    return `issues:${lineNumber}: priority must be an integer from 0 to 4`;
  }
  return undefined;
}

function validateIssueLabels(value, lineNumber) {
  if (value.labels !== undefined && (!Array.isArray(value.labels) || value.labels.some((label) => typeof label !== "string"))) {
    return `issues:${lineNumber}: labels must be a string array`;
  }
  return undefined;
}

function validateIssueDependencies(value, lineNumber, ids) {
  const dependencies = value.dependencies ?? [];

  if (!Array.isArray(dependencies)) {
    return [`issues:${lineNumber}: dependencies must be an array`];
  }

  return dependencies.flatMap((dependency) =>
    validDependency(dependency, value.id, ids)
      ? []
      : [`issues:${lineNumber}: dependency edge is malformed or dangling`],
  );
}

// fallow-ignore-next-line complexity -- dependency validity is an explicit four-part graph invariant
function validDependency(dependency, issueId, ids) {
  return [
    dependency?.issue_id === issueId,
    typeof dependency?.depends_on_id === "string",
    ids.has(dependency?.depends_on_id),
    dependency?.depends_on_id !== issueId,
  ].every(Boolean);
}

function validateIssue(value, lineNumber, ids) {
  return [
    validateIssueStatus(value, lineNumber),
    validateIssuePriority(value, lineNumber),
    validateIssueLabels(value, lineNumber),
    ...validateIssueDependencies(value, lineNumber, ids),
  ].filter((error) => error !== undefined);
}

function validateSensitive(value, source, errors) {
  const serialized = JSON.stringify(value).replaceAll(
    LOCAL_DEVELOPMENT_POSTGRES_URI,
    "postgres://localhost:54329/krn",
  );

  if (
    POSTGRES_CREDENTIAL_PATTERN.test(serialized) ||
    SENSITIVE_PATTERNS.some((pattern) => pattern.test(serialized))
  ) {
    errors.push(`${source}: sensitive value pattern detected`);
  }
}

function validateInteractions(records, ids, errors) {
  const interactionIds = new Set();

  for (const { value, lineNumber } of records) {
    errors.push(...validateInteraction(value, lineNumber, interactionIds, ids));
    interactionIds.add(value.id);
  }
}

// fallow-ignore-next-line complexity -- interaction validation keeps identity, uniqueness, and reference errors distinct
function validateInteraction(value, lineNumber, interactionIds, issueIds) {
  return [
    validInteraction(value) ? undefined : `interactions:${lineNumber}: interaction requires id and kind`,
    interactionIds.has(value?.id) ? `interactions:${lineNumber}: duplicate interaction id ${value?.id}` : undefined,
    value?.issue_id !== undefined && !issueIds.has(value.issue_id)
      ? `interactions:${lineNumber}: interaction references unknown issue ${value.issue_id}`
      : undefined,
  ].filter((error) => error !== undefined);
}

function validInteraction(value) {
  return [
    typeof value?.id === "string",
    value?.id?.length > 0,
    typeof value?.kind === "string",
  ].every(Boolean);
}

function validateHistory(issuesPath, interactionsPath) {
  const issues = readJsonLines(issuesPath);
  const interactions = readJsonLines(interactionsPath);
  const errors = [];
  const ids = issueIdSet(issues, errors);

  for (const { value, lineNumber } of issues) {
    errors.push(...validateIssue(value, lineNumber, ids));
    validateSensitive(value, `issues:${lineNumber}`, errors);
  }
  validateInteractions(interactions, ids, errors);
  for (const { value, lineNumber } of interactions) {
    validateSensitive(value, `interactions:${lineNumber}`, errors);
  }

  return { issues, interactions, ids, errors };
}

function activeGraph(issues) {
  const activeIssues = issues
    .filter(({ value }) => ACTIVE_STATUSES.has(value.status))
    .map(({ value }) => value.id)
    .sort();
  const edges = issues
    .flatMap(({ value }) => (value.dependencies ?? []).map((dependency) =>
      `${dependency.issue_id}->${dependency.depends_on_id}:${dependency.type ?? "unknown"}`,
    ))
    .sort();

  return JSON.stringify({ activeIssues, edges });
}

function report(result, mode) {
  if (result.errors.length > 0) {
    console.error(`Beads ${mode} failed:`);
    for (const error of result.errors) {
      console.error(`- ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    `Beads ${mode} passed: ${result.issues.length} issue records, ${result.interactions.length} interactions, ${result.ids.size} unique issues.`,
  );
}

function runRoundtrip(result) {
  const before = activeGraph(result.issues);
  const serialized = JSON.stringify({ issues: result.issues, interactions: result.interactions });
  const restored = JSON.parse(serialized);
  const after = activeGraph(restored.issues);

  if (result.errors.length > 0 || before !== after) {
    report({ ...result, errors: [...result.errors, "active issue/dependency graph changed during round-trip"] }, "round-trip");
    return;
  }

  report(result, "round-trip");
}

function main() {
  const [mode = "validate", ...argv] = process.argv.slice(2);
  const issuesPath = optionValue(argv, "--issues");
  const interactionsPath = optionValue(argv, "--interactions");
  const result = validateHistory(issuesPath, interactionsPath);
  const handlers = {
    validate: () => report(result, "validation"),
    roundtrip: () => runRoundtrip(result),
  };
  const handler = handlers[mode];

  if (handler === undefined) {
    throw new Error("Usage: validate-beads-history.mjs <validate|roundtrip> --issues <path> --interactions <path>");
  }

  handler();
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
