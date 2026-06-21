import {
  execFile
} from "node:child_process";
import {
  promisify
} from "node:util";
import type {
  DiffRisk,
  EvidenceCommand,
  SourceDecision
} from "@krn/core";
import {
  createDatabaseRuntime
} from "./databaseRuntime.js";
import type {
  CreateDatabaseRuntime
} from "./runPlanCommand.js";

const execFileAsync = promisify(execFile);

export interface EvidenceCaptureRuntime {
  env: Record<string, string | undefined>;
  cwd: string;
  now(): string;
  createId(prefix: string): string;
  persist: boolean;
  runId?: string;
  readGitStatus?(): Promise<string>;
  createDatabaseRuntime?: CreateDatabaseRuntime;
}

export interface EvidenceCaptureResult {
  stdout: string;
}

interface ChangedFile {
  status: string;
  path: string;
}

interface PersistedEvidenceIdentity {
  evidenceBundleId: string;
  reviewAssessmentId: string;
  feedbackDeltaId: string;
}

const defaultWorkspaceSlug = "local";
const defaultProjectSlug = "mise-en-palace";

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

const sourceDecisionSignal = (file: ChangedFile): boolean => {
  const path = file.path.toLowerCase();

  return (
    path === "goal.md" ||
    path === "plan.md" ||
    path.startsWith("docs/decisions/") ||
    path.startsWith("docs/runs/") ||
    path.startsWith(".agents/skills/") ||
    path.includes("source")
  );
};

const buildSourceDecisionCandidates = (
  runtime: Pick<EvidenceCaptureRuntime, "createId" | "now">,
  changedFiles: readonly ChangedFile[]
): SourceDecision[] => {
  const candidateFiles = changedFiles.filter(sourceDecisionSignal);

  if (candidateFiles.length === 0) {
    return [];
  }

  const timestamp = runtime.now();
  const changedFilePaths = candidateFiles.map((file) => file.path);

  return [{
    id: runtime.createId("source-decision-candidate"),
    status: "defer",
    decision: "Review changed files for source graph decision updates.",
    rationale: `Changed files imply a possible source decision: ${changedFilePaths.join(", ")}`,
    falsifier:
      "Do not promote unless a SourceClaim with mechanism, doesNotProve, and consumer exists.",
    consumer: "krn evidence capture",
    metadata: {
      candidateType: "sourceDecisionCandidate",
      changedFiles: changedFilePaths,
      changedFileCount: changedFilePaths.length,
      promotion: "proposal-only"
    },
    createdAt: timestamp,
    updatedAt: timestamp
  }];
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

const persistenceLabel = (runtime: EvidenceCaptureRuntime): string =>
  runtime.persist
    ? "enabled (Postgres, explicit --persist)"
    : "disabled (explicit printed-only preview; use --persist to write)";

const renderChangedFiles = (changedFiles: readonly ChangedFile[]): string[] => {
  if (changedFiles.length === 0) {
    return ["- none"];
  }

  return changedFiles.map((file) => `- ${file.status} ${file.path}`);
};

const renderSourceDecisionCandidates = (
  candidates: readonly SourceDecision[]
): string[] => {
  if (candidates.length === 0) {
    return ["- none"];
  }

  return candidates.flatMap((candidate) => [
    `- ${candidate.id}: ${candidate.decision}`,
    `  status: ${candidate.status}`,
    `  consumer: ${candidate.consumer}`,
    `  falsifier: ${candidate.falsifier}`,
    "  No SourceClaim created"
  ]);
};

const persistEvidenceCapture = async (
  runtime: EvidenceCaptureRuntime,
  changedFiles: readonly ChangedFile[],
  commands: EvidenceCommand[],
  diffRisk: DiffRisk,
  sourceDecisionCandidates: readonly SourceDecision[]
): Promise<PersistedEvidenceIdentity> => {
  const databaseUrl = runtime.env.KRN_DATABASE_URL?.trim();
  const runId = runtime.runId?.trim();

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error("KRN_DATABASE_URL is required for krn evidence capture --persist");
  }

  if (runId === undefined || runId.length === 0) {
    throw new Error("--run-id is required for krn evidence capture --persist");
  }

  const createRuntime = runtime.createDatabaseRuntime ?? createDatabaseRuntime;
  const databaseRuntime = await createRuntime({
    databaseUrl,
    workspaceSlug: defaultWorkspaceSlug,
    projectSlug: defaultProjectSlug,
    now: runtime.now,
    createId: runtime.createId
  });

  try {
    const aggregate = await databaseRuntime.harnessRunRepository.getHarnessRunByExecutionRunId(runId);

    if (aggregate === undefined) {
      throw new Error(`No persisted harness run found for --run-id ${runId}`);
    }

    const nextSequence =
      aggregate.runEvents.reduce(
        (max, event) => Math.max(max, event.sequence),
        0
      ) + 1;
    const evidenceBundle = await databaseRuntime.harnessRunRepository.createEvidenceBundle({
      executionRunId: runId,
      status: "captured",
      changedFiles: changedFiles.map((file) => file.path),
      commands,
      diffRisk,
      reviewBurden: "Review changed files, command evidence, residual risk, and rollback path.",
      rollbackPath: "Revert the focused implementation commit or discard uncommitted changes.",
      event: {
        sequence: nextSequence,
        type: "evidence.captured",
        message: "Evidence captured from CLI",
        payload: {
          changedFileCount: changedFiles.length,
          commandCount: commands.length
        }
      },
      metadata: {
        command: "krn evidence capture --persist",
        runId
      }
    });
    const reviewAssessment = await databaseRuntime.harnessRunRepository.createReviewAssessment({
      evidenceBundleId: evidenceBundle.id,
      status: "pending",
      reviewer: "krn-cli",
      summary: "Evidence captured; human review still required.",
      findings: [],
      metadata: {
        runId,
        changedFileCount: changedFiles.length
      }
    });
    const feedbackDelta = await databaseRuntime.harnessRunRepository.createFeedbackDelta({
      reviewAssessmentId: reviewAssessment.id,
      status: "candidate",
      memoryCandidates: [],
      sourceDecisions: [...sourceDecisionCandidates],
      evalCandidates: [],
      metadata: {
        runId,
        changedFileCount: changedFiles.length,
        sourceDecisionCandidateCount: sourceDecisionCandidates.length
      }
    });

    return {
      evidenceBundleId: evidenceBundle.id,
      reviewAssessmentId: reviewAssessment.id,
      feedbackDeltaId: feedbackDelta.id
    };
  } finally {
    await databaseRuntime.close();
  }
};

export const runEvidenceCaptureCommand = async (
  runtime: EvidenceCaptureRuntime
): Promise<EvidenceCaptureResult> => {
  const statusOutput = await readGitStatus(runtime);
  const changedFiles = parseChangedFiles(statusOutput);
  const commands = defaultCommands();
  const diffRisk = diffRiskFromChangedFiles(changedFiles);
  const sourceDecisionCandidates = buildSourceDecisionCandidates(runtime, changedFiles);
  const persistedIdentity = runtime.persist
    ? await persistEvidenceCapture(
      runtime,
      changedFiles,
      commands,
      diffRisk,
      sourceDecisionCandidates
    )
    : undefined;
  const feedbackCandidate =
    changedFiles.length === 0
      ? "No changed files; no feedback candidate proposed."
      : "Review changed files and command evidence before promoting memory/source/eval candidates.";
  const lines = [
    "KRN Evidence Capture",
    `Captured at: ${runtime.now()}`,
    `Persistence: ${persistenceLabel(runtime)}`,
    ...(runtime.runId === undefined ? [] : [`Run ID: ${runtime.runId}`]),
    "Changed files:",
    ...renderChangedFiles(changedFiles),
    "Commands:",
    ...commands.map((command) => `${command.command}: ${command.status}`),
    `Diff risk: ${diffRisk}`,
    "Review burden: summarize changed files, command proof, residual risk, and rollback path.",
    "Rollback path: revert the focused implementation commit or discard uncommitted changes.",
    "Memory mutation: none",
    "Feedback candidates:",
    `- ${feedbackCandidate}`,
    "sourceDecisionCandidates:",
    ...renderSourceDecisionCandidates(sourceDecisionCandidates)
  ];

  if (persistedIdentity !== undefined) {
    lines.push(
      "Persisted IDs:",
      `evidenceBundle: ${persistedIdentity.evidenceBundleId}`,
      `reviewAssessment: ${persistedIdentity.reviewAssessmentId}`,
      `feedbackDelta: ${persistedIdentity.feedbackDeltaId}`
    );
  }

  return {
    stdout: `${lines.join("\n")}\n`
  };
};
