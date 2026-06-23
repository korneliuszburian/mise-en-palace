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
  AuditBundle,
  AuditFinding
} from "@krn/core";
import {
  createAuditDatabaseRuntime
} from "./databaseRuntime.js";
import type {
  AuditDatabaseRuntime,
  AuditDatabaseRuntimeInput
} from "./databaseRuntime.js";
import {
  runAuditChecks
} from "@krn/harness";
import type {
  AuditCheckResult,
  AuditFileSnapshot,
  AuditHandoffSnapshot,
  AuditRepoSnapshot,
  AuditVerificationCommandSnapshot
} from "@krn/harness";

const execFileAsync = promisify(execFile);

type AuditCommandScope = "repo" | "slice";
type AuditCommandFormat = "text" | "json";

interface AuditCliCommand {
  kind: "audit";
  scope: AuditCommandScope;
  repo?: string;
  since?: string;
  format: AuditCommandFormat;
  intendedFiles?: readonly string[];
  verificationCommands?: readonly AuditVerificationCommandSnapshot[];
  projectId?: string;
  retrievalRunId?: string;
  auditBundleId?: string;
  failOn?: "warning";
}

export interface AuditCommandRuntime {
  cwd: string;
  env?: Record<string, string | undefined>;
  now(): string;
  command: AuditCliCommand;
  readGitChangedFiles?(since: string, repoPath: string): Promise<string>;
  createAuditDatabaseRuntime?(input: AuditDatabaseRuntimeInput): Promise<AuditDatabaseRuntime>;
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
  semanticSnapshotCounts: AuditSemanticSnapshotCounts;
  findings: AuditFinding[];
}

interface AuditSemanticSnapshotCounts {
  memoryCandidateCount: number;
  memoryRecordCount: number;
  sourceClaimCount: number;
  sourceDecisionCount: number;
  evalCandidateCount: number;
  observationGroupCount: number;
  activationDecisionCount: number;
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

const readOptionalTextFile = async (
  repoPath: string,
  relativePath: string
): Promise<string | undefined> =>
  readFile(path.join(repoPath, relativePath), "utf8").catch(() => undefined);

const includesAny = (
  text: string,
  needles: readonly string[]
): boolean => needles.some((needle) => text.includes(needle));

const readRepoHandoffSnapshot = async (
  repoPath: string
): Promise<AuditHandoffSnapshot | undefined> => {
  const handoffFiles = await Promise.all([
    readOptionalTextFile(repoPath, "docs/handoff/handoff.md"),
    readOptionalTextFile(repoPath, "docs/handoff/progress.md"),
    readOptionalTextFile(repoPath, "docs/handoff/verification.md"),
    readOptionalTextFile(repoPath, "docs/handoff/blockers.md")
  ]);
  const presentFiles = handoffFiles.filter((content): content is string => content !== undefined);

  if (presentFiles.length === 0) {
    return undefined;
  }

  const text = presentFiles.join("\n").toLowerCase();

  return {
    exists: true,
    includesLastGoodCommit: includesAny(text, [
      "last good commit",
      "last verified state",
      "latest verified slice",
      "latest verified"
    ]),
    includesChangedFiles: includesAny(text, [
      "changed files",
      "intended files",
      "files likely touched"
    ]),
    includesVerification: includesAny(text, [
      "verification",
      "passed:",
      "passed"
    ]),
    includesRollbackPath: includesAny(text, [
      "rollback path",
      "git revert",
      "rollback"
    ]),
    includesNextAction: includesAny(text, [
      "next action",
      "next safest action",
      "next:"
    ])
  };
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
    snapshot: AuditRepoSnapshot;
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
    semanticSnapshotCounts: {
      memoryCandidateCount: input.snapshot.memoryCandidates?.length ?? 0,
      memoryRecordCount: input.snapshot.memoryRecords?.length ?? 0,
      sourceClaimCount: input.snapshot.sourceClaims?.length ?? 0,
      sourceDecisionCount: input.snapshot.sourceDecisions?.length ?? 0,
      evalCandidateCount: input.snapshot.evalCandidates?.length ?? 0,
      observationGroupCount: input.snapshot.observationGroups?.length ?? 0,
      activationDecisionCount: input.snapshot.activationDecisions?.length ?? 0
    },
    findings: [...input.findings]
  };
};

const hasSemanticSnapshotCounts = (counts: AuditSemanticSnapshotCounts): boolean =>
  counts.memoryCandidateCount > 0 ||
  counts.memoryRecordCount > 0 ||
  counts.sourceClaimCount > 0 ||
  counts.sourceDecisionCount > 0 ||
  counts.evalCandidateCount > 0 ||
  counts.observationGroupCount > 0 ||
  counts.activationDecisionCount > 0;

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

  if (hasSemanticSnapshotCounts(report.semanticSnapshotCounts)) {
    lines.push(
      `Semantic snapshots: memoryCandidates=${report.semanticSnapshotCounts.memoryCandidateCount} memoryRecords=${report.semanticSnapshotCounts.memoryRecordCount} sourceClaims=${report.semanticSnapshotCounts.sourceClaimCount} sourceDecisions=${report.semanticSnapshotCounts.sourceDecisionCount} evalCandidates=${report.semanticSnapshotCounts.evalCandidateCount} observationGroups=${report.semanticSnapshotCounts.observationGroupCount} activationDecisions=${report.semanticSnapshotCounts.activationDecisionCount}`
    );
  }

  if (report.findings.length > 0) {
    lines.push("", "Findings:");

    for (const finding of report.findings) {
      lines.push(`- [${finding.severity}] ${finding.title}: ${finding.summary}`);
    }
  }

  return `${lines.join("\n")}\n`;
};

const auditBundleVerificationCommands = (
  bundle: AuditBundle | undefined
): AuditVerificationCommandSnapshot[] =>
  (bundle?.verificationCommands ?? []).map((command) => ({
    command: command.command,
    status: command.status
  }));

const mergeUnique = (
  left: readonly string[],
  right: readonly string[]
): string[] => Array.from(new Set([...left, ...right]));

const resolveAuditDbRuntime = async (
  runtime: AuditCommandRuntime
): Promise<AuditDatabaseRuntime | undefined> => {
  const needsDatabase =
    runtime.command.auditBundleId !== undefined ||
    runtime.command.projectId !== undefined ||
    runtime.command.retrievalRunId !== undefined;

  if (!needsDatabase) {
    return undefined;
  }

  const databaseUrl = runtime.env?.KRN_DATABASE_URL?.trim();

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error("KRN_DATABASE_URL is required for audit semantic snapshots");
  }

  const createRuntime = runtime.createAuditDatabaseRuntime ?? createAuditDatabaseRuntime;

  return createRuntime({ databaseUrl });
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
  const handoff = runtime.command.scope === "slice"
    ? await readRepoHandoffSnapshot(repoPath)
    : undefined;
  const auditDbRuntime = await resolveAuditDbRuntime(runtime);
  let auditBundle: AuditBundle | undefined;
  let semanticSnapshots: Partial<AuditRepoSnapshot> = {};

  try {
    auditBundle = runtime.command.auditBundleId === undefined || auditDbRuntime === undefined
      ? undefined
      : await auditDbRuntime.getAuditBundleById(runtime.command.auditBundleId);

    if (runtime.command.auditBundleId !== undefined && auditBundle === undefined) {
      throw new Error(`AuditBundle not found: ${runtime.command.auditBundleId}`);
    }

    if (auditDbRuntime !== undefined) {
      const snapshotProjectId = runtime.command.projectId ?? auditBundle?.projectId;
      semanticSnapshots = await auditDbRuntime.readSemanticSnapshots({
        ...(snapshotProjectId === undefined ? {} : { projectId: snapshotProjectId }),
        ...(runtime.command.retrievalRunId === undefined
          ? {}
          : { retrievalRunId: runtime.command.retrievalRunId })
      });
    }
  } finally {
    await auditDbRuntime?.close();
  }

  const snapshot: AuditRepoSnapshot = {
    sliceId: runtime.command.scope === "slice" ? "audit-slice" : "audit-repo",
    capturedAt: runtime.now(),
    files,
    changedFiles,
    intendedFiles: mergeUnique(auditBundle?.intendedFiles ?? [], runtime.command.intendedFiles ?? []),
    verificationCommands: [
      ...auditBundleVerificationCommands(auditBundle),
      ...(runtime.command.verificationCommands ?? [])
    ],
    ...(handoff === undefined ? {} : { handoff }),
    ...semanticSnapshots
  };
  const checks = runAuditChecks(snapshot);
  const findings = flattenFindings(checks, runtime.command.scope === "slice");
  const report = createReport({
    command: runtime.command,
    repoPath,
    snapshot,
    findings
  });
  const shouldFailOnWarning =
    runtime.command.failOn === "warning" && report.warningCount > 0;

  return {
    exitCode: report.verdict === "fail" || shouldFailOnWarning ? 1 : 0,
    stdout: runtime.command.format === "json"
      ? `${JSON.stringify(report, null, 2)}\n`
      : formatReport(report)
  };
};
