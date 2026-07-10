import { execFileSync, spawnSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, relative } from "node:path";

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

function readSecurityBaseline() {
  return readJsonReport(join(process.cwd(), "security-baseline.json"));
}

function trackedTextFiles() {
  return execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
    .split("\0")
    .filter((path) => path.length > 0 && basename(path) !== ".env.example");
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

function exceptionNames(path, baseline) {
  const relativePath = relative(process.cwd(), path).replaceAll("\\", "/");
  return new Set(
    (baseline.secretExceptions ?? [])
      .filter((exception) => exception.path === relativePath)
      .map((exception) => exception.pattern),
  );
}

function secretFindingsForContent(path, content, baseline) {
  if (content === undefined || content.includes("\u0000")) {
    return [];
  }

  const exceptions = exceptionNames(path, baseline);
  return SECRET_PATTERNS.flatMap(({ name, pattern }) =>
    exceptions.has(name) || !pattern.test(content) ? [] : [`${path}: ${name}`],
  );
}

function secretFindings(path, baseline) {
  return candidateTextFiles(path).flatMap((file) =>
    secretFindingsForContent(file, readTextFile(file), baseline),
  );
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
  const findings = secretFindings(optionValue(argv, "--path"), readSecurityBaseline());

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
