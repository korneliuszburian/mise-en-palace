import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { resolveCommittedRange } from "./resolve-committed-range.mjs";

const SECRET_PATTERNS = [
  { name: "AWS access key", pattern: /\bAKIA[0-9A-Z]{16}\b/u },
  { name: "GitHub token", pattern: /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/u },
  { name: "private key", pattern: /-----BEGIN (?:RSA|EC|OPENSSH|PGP) PRIVATE KEY-----/u },
  {
    name: "secret-shaped assignment",
    pattern: /(?:api[_-]?key|access[_-]?token|client[_-]?secret|password|secret)\s*[:=]\s*["'`]([A-Za-z0-9+/=_-]{20,})["'`]/iu,
  },
];

const severityRank = {
  low: 1,
  moderate: 2,
  high: 3,
  critical: 4,
};

function optionValue(argv, option) {
  const index = argv.indexOf(option);
  return index === -1 ? undefined : argv[index + 1];
}

function requireOption(argv, option) {
  const value = optionValue(argv, option);

  if (value === undefined || value.startsWith("--")) {
    throw new Error(`${option} requires a path`);
  }

  return value;
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readJsonReport(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

// fallow-ignore-next-line complexity -- baseline validation keeps exact exception fields fail-closed
function readSecurityBaseline() {
  const baseline = readJsonReport(join(process.cwd(), "security-baseline.json"));
  for (const exception of baseline.secretExceptions ?? []) {
    if (typeof exception.matchSha256 !== "string" || !/^[0-9a-f]{64}$/u.test(exception.matchSha256)) {
      throw new Error("security-baseline secret exceptions require an exact matchSha256");
    }
  }
  return baseline;
}

function trackedTextFiles() {
  return execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
    .split("\0")
    .filter((path) => path.length > 0);
}

function candidateTextFiles(path) {
  if (path !== undefined) {
    return statSync(path).isDirectory()
      ? readdirSync(path).map((entry) => join(path, entry))
      : [path];
  }

  return trackedTextFiles();
}

function readTextFile(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return undefined;
  }
}

function exceptionMatches(path, name, match, baseline) {
  const relativePath = relative(process.cwd(), path).replaceAll("\\", "/");
  const matchSha256 = createHash("sha256").update(match).digest("hex");
  return (baseline.secretExceptions ?? []).some((exception) =>
    exception.path === relativePath &&
    exception.pattern === name &&
    exception.matchSha256 === matchSha256
  );
}

function secretFindingsForContent(path, content, baseline) {
  if (content === undefined) {
    throw new Error(`unreadable tracked input: ${path}`);
  }

  if (content.includes("\u0000")) {
    return [];
  }

  return SECRET_PATTERNS.flatMap(({ name, pattern }) => {
    const globalPattern = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`);
    return [...content.matchAll(globalPattern)].some((match) =>
      !exceptionMatches(path, name, match[0], baseline)
    ) ? [`${path}: ${name}`] : [];
  });
}

function secretFindings(path, baseline) {
  return candidateTextFiles(path).flatMap((file) =>
    secretFindingsForContent(file, readTextFile(file), baseline),
  );
}

// fallow-ignore-next-line complexity -- patch parsing preserves added secrets across commit add/remove sequences
function historySecretFindings(range, baseline) {
  const patch = execFileSync(
    "git",
    ["log", "--format=", "--no-ext-diff", "--unified=0", `${range.baseSha}..${range.headSha}`],
    { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 },
  );
  let path;
  const findings = [];

  for (const line of patch.split("\n")) {
    if (line.startsWith("+++ b/")) {
      path = line.slice(6);
      continue;
    }
    if (path !== undefined && line.startsWith("+") && !line.startsWith("+++")) {
      findings.push(...secretFindingsForContent(path, line.slice(1), baseline));
    }
  }

  return findings;
}

function licenseFindings(report, baseline) {
  const allowedLicenses = new Set(baseline.allowedLicenses ?? []);
  return Object.keys(report).filter((license) => !allowedLicenses.has(license));
}

function objectSeverities(value) {
  if (!isRecord(value)) {
    return [];
  }

  return Object.values(value).flatMap((advisory) =>
    isRecord(advisory) && typeof advisory.severity === "string"
      ? [advisory.severity.toLowerCase()]
      : [],
  );
}

function metadataSeverities(report) {
  const vulnerabilities = isRecord(report.metadata) && isRecord(report.metadata.vulnerabilities)
    ? report.metadata.vulnerabilities
    : {};

  return Object.entries(vulnerabilities).flatMap(([severity, count]) =>
    typeof count === "number" && count > 0 ? [severity.toLowerCase()] : [],
  );
}

function advisorySeverities(report) {
  return [
    ...objectSeverities(report.advisories),
    ...objectSeverities(report.vulnerabilities),
    ...metadataSeverities(report),
  ];
}

function highOrCriticalFindings(report) {
  return advisorySeverities(report).filter((severity) => severityRank[severity] >= severityRank.high);
}

function fail(message, details = []) {
  console.error(`Security policy failed: ${message}`);
  for (const detail of details) {
    console.error(`- ${detail}`);
  }
  process.exitCode = 1;
}

function runSecrets(argv) {
  const baseline = readSecurityBaseline();
  const path = optionValue(argv, "--path");
  const findings = secretFindings(path, baseline);

  if (path === undefined) {
    const explicitBase = optionValue(argv, "--range-base");
    const range = resolveCommittedRange({
      env: explicitBase === undefined
        ? process.env
        : { ...process.env, KRN_COMMIT_EVENT: "push", KRN_COMMIT_BEFORE: explicitBase },
    });
    findings.push(...historySecretFindings(range, baseline));
  }

  if (findings.length > 0) {
    fail("secret-shaped content detected", findings);
    return;
  }

  console.log("Security policy passed: no supported secret patterns detected.");
}

function runLicenses(argv) {
  const report = readJsonReport(requireOption(argv, "--report"));
  const findings = licenseFindings(report, readSecurityBaseline());

  if (findings.length > 0) {
    fail("dependency license is outside the internal-alpha allowlist", findings);
    return;
  }

  console.log(`Security policy passed: ${Object.keys(report).length} dependency license families allowed.`);
}

function runDependencyReport(argv) {
  const report = readJsonReport(requireOption(argv, "--report"));
  const findings = highOrCriticalFindings(report);

  if (findings.length > 0) {
    fail("high or critical dependency advisories detected", findings);
    return;
  }

  console.log("Security policy passed: no high or critical dependency advisories detected.");
}

function parseAuditReport(result) {
  try {
    return { report: JSON.parse(result.stdout ?? "") };
  } catch {
    return { error: result.stderr?.trim() ?? "no diagnostic output" };
  }
}

function dependencyAuditFailure(result, findings) {
  if (findings.length > 0) {
    return {
      message: "high or critical dependency advisories detected",
      details: findings,
    };
  }

  return result.status !== 0
    ? {
        message: "dependency scanner failed without a verifiable report",
        details: [result.stderr?.trim() ?? `scanner exit code ${result.status}`],
      }
    : undefined;
}

function runDependencyAudit() {
  const result = spawnSync("pnpm", ["audit", "--audit-level=high", "--json"], {
    encoding: "utf8",
  });

  if (result.error !== undefined) {
    fail("dependency scanner could not start", [result.error.message]);
    return;
  }

  const parsed = parseAuditReport(result);

  if (parsed.error !== undefined) {
    fail("dependency scanner returned an invalid report", [parsed.error]);
    return;
  }

  const failure = dependencyAuditFailure(result, highOrCriticalFindings(parsed.report));

  if (failure !== undefined) {
    fail(failure.message, failure.details);
    return;
  }

  console.log("Security policy passed: dependency audit completed with no high or critical advisories.");
}

function main() {
  const [mode, ...argv] = process.argv.slice(2);

  const root = optionValue(argv, "--root");
  if (root !== undefined) {
    process.chdir(root);
  }

  const handlers = {
    secrets: () => runSecrets(argv),
    licenses: () => runLicenses(argv),
    "dependency-report": () => runDependencyReport(argv),
    "dependency-audit": () => runDependencyAudit(),
  };
  const handler = handlers[mode];

  if (handler === undefined) {
      throw new Error("Usage: security-policy.mjs <secrets|licenses|dependency-report|dependency-audit> [options]");
  }

  handler();
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
