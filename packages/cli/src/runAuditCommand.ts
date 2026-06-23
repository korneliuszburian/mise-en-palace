import {
  execFile
} from "node:child_process";
import {
  readdir,
  readFile,
  stat
} from "node:fs/promises";
import path from "node:path";
import {
  promisify
} from "node:util";
import type {
  AuditFinding
} from "@krn/core";
import {
  runAuditChecks
} from "@krn/harness";
import type {
  AuditCheckResult,
  AuditFileSnapshot,
  AuditRepoSnapshot,
  AuditVerificationCommandSnapshot
} from "@krn/harness";

const execFileAsync = promisify(execFile);

export type AuditCommandScope = "repo" | "slice";
export type AuditCommandFormat = "text" | "json";

export interface AuditCliCommand {
  kind: "audit";
  scope: AuditCommandScope;
  repo?: string;
  since?: string;
  format: AuditCommandFormat;
  intendedFiles?: readonly string[];
  verificationCommands?: readonly AuditVerificationCommandSnapshot[];
}

export interface AuditCommandRuntime {
  cwd: string;
  now(): string;
  command: AuditCliCommand;
  readGitChangedFiles?(since: string, repoPath: string): Promise<string>;
}

export interface AuditCommandResult {
  exitCode: number;
  stdout: string;
}

interface AuditReport {
  kind: "krn.audit.report";
  scope: AuditCommandScope;
  repoPath: string;
  since?: string;
  verdict: "pass" | "advisory" | "fail";
  findingCount: number;
  blockingCount: number;
  warningCount: number;
  advisoryCount: number;
  findings: AuditFinding[];
}

const excludedDirectoryNames = new Set([
  ".git",
  "node_modules",
  "dist",
  "coverage",
  ".next",
  ".turbo"
]);

const includedExtensions = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".cjs",
  ".json",
  ".md",
  ".yml",
  ".yaml",
  ".toml"
]);

const resolveRepoPath = (cwd: string, repo?: string): string => {
  if (repo === undefined || repo.trim().length === 0) {
    return cwd;
  }

  return path.resolve(cwd, repo);
};

const isExcludedPath = (relativePath: string): boolean => {
  const normalized = relativePath.split(path.sep).join("/");

  return (
    normalized.startsWith("docs/materials/") ||
    normalized.endsWith(".test.ts") ||
    normalized.endsWith(".spec.ts") ||
    normalized.includes("/__tests__/") ||
    normalized.includes("/fixtures/")
  );
};

const isIncludedFile = (relativePath: string): boolean =>
  includedExtensions.has(path.extname(relativePath)) && !isExcludedPath(relativePath);

const readFileSnapshot = async (
  repoPath: string,
  relativePath: string
): Promise<AuditFileSnapshot | undefined> => {
  if (!isIncludedFile(relativePath)) {
    return undefined;
  }

  const absolutePath = path.join(repoPath, relativePath);
  const fileStat = await stat(absolutePath).catch(() => undefined);

  if (fileStat === undefined || !fileStat.isFile()) {
    return undefined;
  }

  return {
    path: relativePath.split(path.sep).join("/"),
    content: await readFile(absolutePath, "utf8")
  };
};

const collectRepoFiles = async (
  repoPath: string,
  relativeDirectory = ""
): Promise<AuditFileSnapshot[]> => {
  const absoluteDirectory = path.join(repoPath, relativeDirectory);
  const entries = await readdir(absoluteDirectory, {
    withFileTypes: true
  });
  const files: AuditFileSnapshot[] = [];

  for (const entry of entries) {
    const relativePath = path.join(relativeDirectory, entry.name);

    if (entry.isDirectory()) {
      if (!excludedDirectoryNames.has(entry.name)) {
        files.push(...await collectRepoFiles(repoPath, relativePath));
      }

      continue;
    }

    if (entry.isFile()) {
      const snapshot = await readFileSnapshot(repoPath, relativePath);

      if (snapshot !== undefined) {
        files.push(snapshot);
      }
    }
  }

  return files;
};

const defaultReadGitChangedFiles = async (
  since: string,
  repoPath: string
): Promise<string> => {
  const result = await execFileAsync("git", ["diff", "--name-only", since, "--"], {
    cwd: repoPath
  });

  return result.stdout;
};

const parseChangedFileList = (raw: string): string[] =>
  raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

const collectSliceFiles = async (
  repoPath: string,
  changedFiles: readonly string[]
): Promise<AuditFileSnapshot[]> => {
  const snapshots = await Promise.all(
    changedFiles.map((filePath) => readFileSnapshot(repoPath, filePath))
  );

  return snapshots.filter((snapshot): snapshot is AuditFileSnapshot => snapshot !== undefined);
};

const flattenFindings = (
  checkResult: AuditCheckResult,
  includeHandoff: boolean
): AuditFinding[] => [
  ...checkResult.repoSurfaceFindings,
  ...checkResult.architectureFindings,
  ...checkResult.boundaryFindings,
  ...checkResult.typeSafetyFindings,
  ...checkResult.memorySemanticsFindings,
  ...checkResult.sourceGroundingFindings,
  ...checkResult.evalFindings,
  ...checkResult.verificationFindings,
  ...(includeHandoff ? checkResult.handoffFindings : [])
];

const reportVerdict = (
  findings: readonly AuditFinding[]
): AuditReport["verdict"] => {
  if (findings.some((finding) => finding.severity === "blocking")) {
    return "fail";
  }

  if (findings.length > 0) {
    return "advisory";
  }

  return "pass";
};

const createReport = (
  input: {
    command: AuditCliCommand;
    repoPath: string;
    findings: readonly AuditFinding[];
  }
): AuditReport => {
  const blockingCount = input.findings.filter((finding) => finding.severity === "blocking").length;
  const warningCount = input.findings.filter((finding) => finding.severity === "warning").length;
  const advisoryCount = input.findings.filter((finding) => finding.severity === "advisory").length;

  return {
    kind: "krn.audit.report",
    scope: input.command.scope,
    repoPath: input.repoPath,
    ...(input.command.since === undefined ? {} : { since: input.command.since }),
    verdict: reportVerdict(input.findings),
    findingCount: input.findings.length,
    blockingCount,
    warningCount,
    advisoryCount,
    findings: [...input.findings]
  };
};

const formatReport = (report: AuditReport): string => {
  const title = report.scope === "repo" ? "KRN Audit Repo" : "KRN Audit Slice";
  const lines = [
    title,
    `Scope: ${report.scope}`,
    `Repo: ${report.repoPath}`,
    ...(report.since === undefined ? [] : [`Since: ${report.since}`]),
    `Verdict: ${report.verdict}`,
    `Findings: ${report.findingCount}`,
    `Blocking: ${report.blockingCount}`,
    `Warnings: ${report.warningCount}`,
    `Advisory: ${report.advisoryCount}`
  ];

  if (report.findings.length > 0) {
    lines.push("", "Findings:");

    for (const finding of report.findings) {
      lines.push(`- [${finding.severity}] ${finding.title}: ${finding.summary}`);
    }
  }

  return `${lines.join("\n")}\n`;
};

export const runAuditCommand = async (
  runtime: AuditCommandRuntime
): Promise<AuditCommandResult> => {
  const repoPath = resolveRepoPath(runtime.cwd, runtime.command.repo);
  const changedFiles = runtime.command.scope === "slice"
    ? parseChangedFileList(
      await (runtime.readGitChangedFiles ?? defaultReadGitChangedFiles)(
        runtime.command.since ?? "",
        repoPath
      )
    )
    : [];
  const files = runtime.command.scope === "slice"
    ? await collectSliceFiles(repoPath, changedFiles)
    : await collectRepoFiles(repoPath);
  const snapshot: AuditRepoSnapshot = {
    sliceId: runtime.command.scope === "slice" ? "audit-slice" : "audit-repo",
    capturedAt: runtime.now(),
    files,
    changedFiles,
    intendedFiles: runtime.command.intendedFiles ?? [],
    verificationCommands: runtime.command.verificationCommands ?? []
  };
  const checks = runAuditChecks(snapshot);
  const findings = flattenFindings(checks, runtime.command.scope === "slice");
  const report = createReport({
    command: runtime.command,
    repoPath,
    findings
  });

  return {
    exitCode: report.verdict === "fail" ? 1 : 0,
    stdout: runtime.command.format === "json"
      ? `${JSON.stringify(report, null, 2)}\n`
      : formatReport(report)
  };
};
