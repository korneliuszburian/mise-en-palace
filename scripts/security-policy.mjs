import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
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
  if (Array.isArray(value)) {
    return value.flatMap((item) => objectSeverities(item));
  }

  if (!isRecord(value)) {
    return [];
  }

  return [
    ...(typeof value.severity === "string" ? [value.severity.toLowerCase()] : []),
    ...Object.entries(value).flatMap(([key, item]) =>
      key === "severity" ? [] : objectSeverities(item),
    ),
  ];
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
    ...objectSeverities(report),
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

function packageKeyIdentity(key) {
  const peerSuffixIndex = key.indexOf("(");
  const baseKey = peerSuffixIndex === -1 ? key : key.slice(0, peerSuffixIndex);
  const versionSeparator = baseKey.lastIndexOf("@");
  const name = baseKey.slice(0, versionSeparator);
  const version = baseKey.slice(versionSeparator + 1);

  if (versionSeparator < 1 || name.length === 0 || version.length === 0) {
    throw new Error(`pnpm lockfile package key lacks name/version identity: ${key}`);
  }

  return { name, version };
}

function unquoteYamlKey(value) {
  const match = /^(['"])(.*)\1$/u.exec(value);
  return match?.[2] ?? value;
}

function dependencyInventoryFromPnpmLock(lockfile) {
  const packagesHeader = /^packages:\s*$/mu.exec(lockfile);
  if (packagesHeader === null) {
    throw new Error("pnpm lockfile has no auditable packages section");
  }

  const packagesStart = packagesHeader.index + packagesHeader[0].length;
  const afterPackagesHeader = lockfile.slice(packagesStart).replace(/^\r?\n/u, "");
  const nextTopLevelSection = /^\S.*:\s*$/mu.exec(afterPackagesHeader);
  const packagesSection = nextTopLevelSection === null
    ? afterPackagesHeader
    : afterPackagesHeader.slice(0, nextTopLevelSection.index);
  const packageKeys = [...packagesSection.matchAll(/^  (\S.+):$/gmu)]
    .map((match) => unquoteYamlKey(match[1]));

  if (packageKeys.length === 0) {
    throw new Error("pnpm lockfile has no auditable packages section");
  }

  const inventory = new Map();
  for (const key of packageKeys) {
    const { name, version } = packageKeyIdentity(key);
    const versions = new Set(inventory.get(name) ?? []);
    versions.add(version);
    inventory.set(name, versions);
  }

  return Object.fromEntries([...inventory.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, versions]) => [name, [...versions].sort()]));
}

function dependencyBulkEndpoint(registry) {
  const url = new URL(registry);
  url.pathname = "/-/npm/v1/security/advisories/bulk";
  url.search = "";
  url.hash = "";
  return url;
}

async function requestBulkAdvisories(registry, inventory) {
  try {
    const response = await fetch(dependencyBulkEndpoint(registry), {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify(inventory),
      signal: AbortSignal.timeout(30_000),
    });
    return { status: "responded", response };
  } catch (error) {
    return {
      status: "failed",
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

async function parseBulkAdvisoryResponse(response) {
  const body = await response.text();
  if (!response.ok) {
    return {
      status: "failed",
      reason: `registry returned HTTP ${response.status}`,
    };
  }

  try {
    const report = JSON.parse(body);
    return isRecord(report)
      ? { status: "reported", report }
      : { status: "invalid", reason: "registry response is not a JSON object" };
  } catch {
    return { status: "invalid", reason: "registry response is not valid JSON" };
  }
}

async function bulkAdvisoryReport(registry, inventory) {
  const request = await requestBulkAdvisories(registry, inventory);
  return request.status === "failed"
    ? request
    : parseBulkAdvisoryResponse(request.response);
}

function runDependencyLockfileReport(argv) {
  const lockfile = readFileSync(requireOption(argv, "--lockfile"), "utf8");
  console.log(JSON.stringify(dependencyInventoryFromPnpmLock(lockfile)));
}

async function runDependencyAudit(argv) {
  const lockfilePath = optionValue(argv, "--lockfile") ?? join(process.cwd(), "pnpm-lock.yaml");
  const registry = optionValue(argv, "--registry") ??
    process.env.npm_config_registry ??
    "https://registry.npmjs.org/";
  const inventory = dependencyInventoryFromPnpmLock(readFileSync(lockfilePath, "utf8"));
  const result = await bulkAdvisoryReport(registry, inventory);
  const report = dependencyAuditReportOrFail(result);

  if (report === undefined) {
    return;
  }

  const findings = highOrCriticalFindings(report);
  if (findings.length > 0) {
    fail("high or critical dependency advisories detected", findings);
    return;
  }

  console.log(
    `Security policy passed: bulk dependency audit covered ${Object.keys(inventory).length} packages with no high or critical advisories.`,
  );
}

function dependencyAuditReportOrFail(result) {
  switch (result.status) {
    case "reported":
      return result.report;
    case "failed":
      fail("dependency scanner failed without a verifiable report", [result.reason]);
      return undefined;
    case "invalid":
      fail("dependency scanner returned an invalid report", [result.reason]);
      return undefined;
  }
}

async function main() {
  const [mode, ...argv] = process.argv.slice(2);

  const root = optionValue(argv, "--root");
  if (root !== undefined) {
    process.chdir(root);
  }

  const handlers = {
    secrets: () => runSecrets(argv),
    licenses: () => runLicenses(argv),
    "dependency-report": () => runDependencyReport(argv),
    "dependency-lockfile-report": () => runDependencyLockfileReport(argv),
    "dependency-audit": () => runDependencyAudit(argv),
  };
  const handler = handlers[mode];

  if (handler === undefined) {
      throw new Error("Usage: security-policy.mjs <secrets|licenses|dependency-report|dependency-lockfile-report|dependency-audit> [options]");
  }

  await handler();
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
