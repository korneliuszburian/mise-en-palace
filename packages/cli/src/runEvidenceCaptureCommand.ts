import {
  execFile
} from "node:child_process";
import {
  promisify
} from "node:util";
import type {
  DiffRisk,
  EvidenceCommand
} from "@krn/core";

const execFileAsync = promisify(execFile);

export interface EvidenceCaptureRuntime {
  env: Record<string, string | undefined>;
  cwd: string;
  now(): string;
  readGitStatus?(): Promise<string>;
}

export interface EvidenceCaptureResult {
  stdout: string;
}

interface ChangedFile {
  status: string;
  path: string;
}

const readGitStatus = async (runtime: EvidenceCaptureRuntime): Promise<string> => {
  if (runtime.readGitStatus !== undefined) {
    return runtime.readGitStatus();
  }

  const result = await execFileAsync("git", ["status", "--short"], {
    cwd: runtime.cwd
  });

  return result.stdout;
};

const parseChangedFiles = (statusOutput: string): ChangedFile[] =>
  statusOutput
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0)
    .map((line) => ({
      status: line.slice(0, 2).trim() || "changed",
      path: line.slice(3).trim()
    }))
    .filter((file) => file.path.length > 0);

const diffRiskFromChangedFiles = (changedFiles: readonly ChangedFile[]): DiffRisk => {
  if (changedFiles.length === 0) {
    return "low";
  }

  if (changedFiles.length <= 5) {
    return "medium";
  }

  return "high";
};

const defaultCommands = (): EvidenceCommand[] => [
  {
    command: "pnpm typecheck",
    status: "skipped"
  },
  {
    command: "pnpm test",
    status: "skipped"
  },
  {
    command: "git diff --check",
    status: "skipped"
  }
];

const persistenceLabel = (runtime: EvidenceCaptureRuntime): string => {
  if (runtime.env.KRN_DATABASE_URL === undefined || runtime.env.KRN_DATABASE_URL.trim().length === 0) {
    return "disabled (KRN_DATABASE_URL not set; printed only)";
  }

  if (
    runtime.env.KRN_EXECUTION_RUN_ID === undefined ||
    runtime.env.KRN_EXECUTION_RUN_ID.trim().length === 0
  ) {
    return "skipped (KRN_EXECUTION_RUN_ID missing; printed only)";
  }

  return "ready (execution run id configured; persistence adapter pending evidence bundle write)";
};

const renderChangedFiles = (changedFiles: readonly ChangedFile[]): string[] => {
  if (changedFiles.length === 0) {
    return ["- none"];
  }

  return changedFiles.map((file) => `- ${file.status} ${file.path}`);
};

export const runEvidenceCaptureCommand = async (
  runtime: EvidenceCaptureRuntime
): Promise<EvidenceCaptureResult> => {
  const statusOutput = await readGitStatus(runtime);
  const changedFiles = parseChangedFiles(statusOutput);
  const commands = defaultCommands();
  const diffRisk = diffRiskFromChangedFiles(changedFiles);
  const feedbackCandidate =
    changedFiles.length === 0
      ? "No changed files; no feedback candidate proposed."
      : "Review changed files and command evidence before promoting memory/source/eval candidates.";
  const lines = [
    "KRN Evidence Capture",
    `Captured at: ${runtime.now()}`,
    `Persistence: ${persistenceLabel(runtime)}`,
    "Changed files:",
    ...renderChangedFiles(changedFiles),
    "Commands:",
    ...commands.map((command) => `${command.command}: ${command.status}`),
    `Diff risk: ${diffRisk}`,
    "Review burden: summarize changed files, command proof, residual risk, and rollback path.",
    "Rollback path: revert the focused implementation commit or discard uncommitted changes.",
    "Memory mutation: none",
    "Feedback candidates:",
    `- ${feedbackCandidate}`
  ];

  return {
    stdout: `${lines.join("\n")}\n`
  };
};
