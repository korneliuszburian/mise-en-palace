import path from "node:path";
import {
  runActivationSmokeCheck,
  runBrainLoopSmokeCheck,
  runHarnessEvidenceSmokeCheck,
  runHarnessPlanSmokeCheck,
  runHeartbeatWorkerBoundarySmokeCheck,
  runInitConnectSmokeCheck,
  runMemoryGovernanceSmokeCheck,
  runPersistenceSmokeCheck,
  runRetrievalSubstrateSmokeCheck,
  runSourceGraphSmokeCheck,
  runWorkerJobSmokeCheck
} from "@krn/db/dev";
import {
  formatCodexAdapterSmokeReportLines,
  runCodexAdapterSmokeCheck
} from "./codexAdapterSmoke.js";
import {
  formatTargetRepoHarnessSmokeReportLines,
  runTargetRepoHarnessSmokeCheck
} from "./targetRepoHarnessSmoke.js";
import {
  formatWorkerJobSmokeReportLines
} from "./workerJobSmoke.js";
import {
  findRepoRoot
} from "./cliFileBoundary.js";
import {
  runRunShowDbSmokeCheck
} from "./runShowDbSmoke.js";
import {
  runBrainSearchDbSmokeCheck
} from "./runBrainSearchDbSmoke.js";

export interface DbSmokeRuntime {
  env: Record<string, string | undefined>;
  cwd: string;
  createId(prefix: string): string;
  target:
    | "project"
    | "harnessPlan"
    | "harnessEvidence"
    | "sourceGraph"
    | "memoryGovernance"
    | "retrievalSubstrate"
    | "activation"
    | "brainLoop"
    | "brainSearch"
    | "runShow"
    | "heartbeatWorkerBoundary"
    | "codexAdapter"
    | "workerJobs"
    | "initConnect"
    | "targetRepoHarness";
}

export interface DbSmokeResult {
  exitCode: number;
  stdout: string;
}

const localDatabaseUrl = "postgres://krn:krn@localhost:54329/krn";

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "unknown DB smoke error";

interface DbSmokeTargetMetadata {
  title: string;
  skippedLine: string;
  failureLabel: string;
}

interface DbSmokeCommandContext {
  repoRoot: string;
  migrationsFolder: string;
  relativeMigrationsFolder: string;
  databaseUrl: string;
}

type DbSmokeTarget = DbSmokeRuntime["target"];
type DbSmokeTargetHandler = (
  context: DbSmokeCommandContext,
  runtime: DbSmokeRuntime
) => Promise<DbSmokeResult>;

const dbSmokeTargetMetadata = {
  project: {
    title: "KRN DB Smoke",
    skippedLine: "Persistence smoke: skipped (database not configured)",
    failureLabel: "Persistence smoke"
  },
  harnessPlan: {
    title: "KRN Harness Plan Smoke",
    skippedLine: "Harness plan smoke: skipped (database not configured)",
    failureLabel: "Harness plan smoke"
  },
  harnessEvidence: {
    title: "KRN Harness Evidence Smoke",
    skippedLine: "Harness evidence smoke: skipped (database not configured)",
    failureLabel: "Harness evidence smoke"
  },
  sourceGraph: {
    title: "KRN Source Graph Smoke",
    skippedLine: "Source graph smoke: skipped (database not configured)",
    failureLabel: "Source graph smoke"
  },
  memoryGovernance: {
    title: "KRN Memory Governance Smoke",
    skippedLine: "Memory governance smoke: skipped (database not configured)",
    failureLabel: "Memory governance smoke"
  },
  retrievalSubstrate: {
    title: "KRN Retrieval Substrate Smoke",
    skippedLine: "Retrieval substrate smoke: skipped (database not configured)",
    failureLabel: "Retrieval substrate smoke"
  },
  activation: {
    title: "KRN Activation Smoke",
    skippedLine: "Activation smoke: skipped (database not configured)",
    failureLabel: "Activation smoke"
  },
  brainLoop: {
    title: "KRN Brain Loop Smoke",
    skippedLine: "Brain loop smoke: skipped (database not configured)",
    failureLabel: "Brain loop smoke"
  },
  brainSearch: {
    title: "KRN Brain Search Smoke",
    skippedLine: "Brain search smoke: skipped (database not configured)",
    failureLabel: "Brain search smoke"
  },
  runShow: {
    title: "KRN Run Show Smoke",
    skippedLine: "Run show smoke: skipped (database not configured)",
    failureLabel: "Run show smoke"
  },
  heartbeatWorkerBoundary: {
    title: "KRN Heartbeat Worker Boundary Smoke",
    skippedLine: "Heartbeat worker boundary smoke: skipped (database not configured)",
    failureLabel: "Heartbeat worker boundary smoke"
  },
  codexAdapter: {
    title: "KRN Codex Adapter Smoke",
    skippedLine: "Codex adapter smoke: skipped (database not configured)",
    failureLabel: "Codex adapter smoke"
  },
  workerJobs: {
    title: "KRN Worker Job Smoke",
    skippedLine: "Worker job smoke: skipped (database not configured)",
    failureLabel: "Worker job smoke"
  },
  initConnect: {
    title: "KRN Target Repo Init-Connect Smoke",
    skippedLine: "Init-connect smoke: skipped (database not configured)",
    failureLabel: "Init-connect smoke"
  },
  targetRepoHarness: {
    title: "KRN Target Repo Harness Smoke",
    skippedLine: "Target repo harness smoke: skipped (database not configured)",
    failureLabel: "Target repo harness smoke"
  }
} satisfies Record<DbSmokeRuntime["target"], DbSmokeTargetMetadata>;

const output = (lines: string[]): string => lines.join("\n") + "\n";

const configuredHeaderLines = (
  context: DbSmokeCommandContext,
  title: string
): string[] => [
  title,
  `Repo root: ${context.repoRoot}`,
  `Migrations folder: ${context.relativeMigrationsFolder}`,
  "Postgres config: configured"
];

const smokeResult = (
  exitCode: number,
  context: DbSmokeCommandContext,
  title: string,
  lines: string[]
): DbSmokeResult => ({
  exitCode,
  stdout: output([
    ...configuredHeaderLines(context, title),
    ...lines
  ])
});

const cleanupStatusLines = (cleanedUp: boolean, label: string): string[] => [
  `Cleanup: ${cleanedUp ? "completed" : "not completed"}`,
  `${label}: ${cleanedUp ? "passed" : "failed"}`
];

const smokeResultFromCleanup = (
  context: DbSmokeCommandContext,
  title: string,
  cleanedUp: boolean,
  lines: string[]
): DbSmokeResult =>
  smokeResult(cleanedUp ? 0 : 1, context, title, lines);

const runHarnessPlanSmokeTarget: DbSmokeTargetHandler = async (
  context,
  runtime
) => {
  const report = await runHarnessPlanSmokeCheck({
    databaseUrl: context.databaseUrl,
    migrationsFolder: context.migrationsFolder,
    smokeId: runtime.createId("harness-plan-smoke")
  });

  return smokeResultFromCleanup(
    context,
    "KRN Harness Plan Smoke",
    report.cleanedUp,
    [
      `Workspace smoke row: ${report.workspaceSlug}`,
      `Project smoke row: ${report.projectSlug}`,
      `Execution run: ${report.executionRunId}`,
      `Readback: ${report.readBackExecutionRunId === report.executionRunId ? "matched" : "mismatch"}`,
      `Evidence contract commands: ${report.evidenceCommandCount}`,
      `Run events: ${report.runEventCount}`,
      `Cleanup remaining marker count: ${report.remainingMarkerCount}`,
      ...cleanupStatusLines(report.cleanedUp, "Harness plan smoke")
    ]
  );
};

const runHarnessEvidenceSmokeTarget: DbSmokeTargetHandler = async (
  context,
  runtime
) => {
  const report = await runHarnessEvidenceSmokeCheck({
    databaseUrl: context.databaseUrl,
    migrationsFolder: context.migrationsFolder,
    smokeId: runtime.createId("harness-evidence-smoke")
  });

  return smokeResultFromCleanup(
    context,
    "KRN Harness Evidence Smoke",
    report.cleanedUp,
    [
      `Workspace smoke row: ${report.workspaceSlug}`,
      `Project smoke row: ${report.projectSlug}`,
      `Execution run: ${report.executionRunId}`,
      `Evidence bundle: ${report.evidenceBundleId}`,
      `Review assessment: ${report.reviewAssessmentId}`,
      `Feedback delta: ${report.feedbackDeltaId}`,
      `Evidence bundles: ${report.evidenceBundleCount}`,
      `Review assessments: ${report.reviewAssessmentCount}`,
      `Feedback deltas: ${report.feedbackDeltaCount}`,
      `Run events: ${report.runEventCount}`,
      `Cleanup remaining marker count: ${report.remainingMarkerCount}`,
      ...cleanupStatusLines(report.cleanedUp, "Harness evidence smoke")
    ]
  );
};

const runSourceGraphSmokeTarget: DbSmokeTargetHandler = async (
  context,
  runtime
) => {
  const report = await runSourceGraphSmokeCheck({
    databaseUrl: context.databaseUrl,
    migrationsFolder: context.migrationsFolder,
    smokeId: runtime.createId("source-graph-smoke")
  });

  return smokeResultFromCleanup(
    context,
    "KRN Source Graph Smoke",
    report.cleanedUp,
    [
      `Workspace smoke row: ${report.workspaceSlug}`,
      `Project smoke row: ${report.projectSlug}`,
      `Execution run: ${report.executionRunId}`,
      `Source artifact: ${report.sourceArtifactId}`,
      `Source claim: ${report.sourceClaimId}`,
      `Temporal source claim: ${report.temporalSourceClaimId}`,
      `Duplicate source claim: ${report.duplicateSourceClaimId}`,
      `Source claim readback: ${
        report.readBackSourceClaimId === report.sourceClaimId ? "matched" : "mismatch"
      }`,
      `Source claim edge: ${report.sourceClaimEdgeId}`,
      `Duplicate source claim edge: ${report.duplicateSourceClaimEdgeId}`,
      `Source decision: ${report.sourceDecisionId}`,
      `Source decision edge: ${report.sourceDecisionEdgeId}`,
      `Source rejection: ${report.sourceRejectionId}`,
      `Run source claims: ${report.runClaimCount}`,
      `Source claim edges: ${report.sourceClaimEdgeCount}`,
      `Activation source candidates: ${report.activationCandidateCount}`,
      `Ranked-down source claim: ${report.rankedDownSourceClaimId}`,
      `Source graph rank-downs: ${report.sourceGraphRankDownCount}`,
      `Source graph rank-down edge kinds: ${report.sourceGraphRankDownEdgeKinds.join(", ")}`,
      `Influenced source claim: ${report.influencedSourceClaimId}`,
      `Source graph influences: ${report.sourceGraphInfluenceCount}`,
      `Source graph influence edge kinds: ${report.sourceGraphInfluenceEdgeKinds.join(", ")}`,
      `Run source decision edges: ${report.runDecisionEdgeCount}`,
      `Source rejections: ${report.rejectionCount}`,
      `Outbox events: ${report.outboxEventCount}`,
      `Cleanup remaining marker count: ${report.remainingMarkerCount}`,
      ...cleanupStatusLines(report.cleanedUp, "Source graph smoke")
    ]
  );
};

const runMemoryGovernanceSmokeTarget: DbSmokeTargetHandler = async (
  context,
  runtime
) => {
  const report = await runMemoryGovernanceSmokeCheck({
    databaseUrl: context.databaseUrl,
    migrationsFolder: context.migrationsFolder,
    smokeId: runtime.createId("memory-governance-smoke")
  });

  return smokeResultFromCleanup(
    context,
    "KRN Memory Governance Smoke",
    report.cleanedUp,
    [
      `Workspace smoke row: ${report.workspaceSlug}`,
      `Project smoke row: ${report.projectSlug}`,
      `Execution run: ${report.executionRunId}`,
      `Source claim: ${report.sourceClaimId}`,
      `Memory candidate: ${report.memoryCandidateId}`,
      `Memory candidate readback: ${
        report.readBackMemoryCandidateId === report.memoryCandidateId ? "matched" : "mismatch"
      }`,
      `Memory candidate reviewed status: ${report.reviewedMemoryCandidateStatus}`,
      `Memory record: ${report.memoryRecordId}`,
      `Memory record readback: ${
        report.readBackMemoryRecordId === report.memoryRecordId ? "matched" : "mismatch"
      }`,
      `Memory record version: ${report.memoryRecordVersionId}`,
      `Memory record invalidated status: ${report.invalidatedMemoryRecordStatus}`,
      `Active memory after invalidation: ${report.activeMemoryAfterInvalidationCount}`,
      `Memory application: ${report.memoryApplicationId}`,
      `Anti-memory candidate: ${report.antiMemoryCandidateId}`,
      `Anti-memory candidate reviewed status: ${report.reviewedAntiMemoryCandidateStatus}`,
      `Anti-memory record: ${report.antiMemoryRecordId}`,
      `Run anti-memory records: ${report.runAntiMemoryCount}`,
      `Project memory records: ${report.projectMemoryRecordCount}`,
      `Outbox events: ${report.outboxEventCount}`,
      `Cleanup remaining marker count: ${report.remainingMarkerCount}`,
      ...cleanupStatusLines(report.cleanedUp, "Memory governance smoke")
    ]
  );
};

const runRetrievalSubstrateSmokeTarget: DbSmokeTargetHandler = async (
  context,
  runtime
) => {
  const report = await runRetrievalSubstrateSmokeCheck({
    databaseUrl: context.databaseUrl,
    migrationsFolder: context.migrationsFolder,
    smokeId: runtime.createId("retrieval-substrate-smoke")
  });

  return smokeResultFromCleanup(
    context,
    "KRN Retrieval Substrate Smoke",
    report.cleanedUp,
    [
      `Workspace smoke row: ${report.workspaceSlug}`,
      `Project smoke row: ${report.projectSlug}`,
      `Execution run: ${report.executionRunId}`,
      `Source claim: ${report.sourceClaimId}`,
      `Memory record: ${report.memoryRecordId}`,
      `Evidence bundle: ${report.evidenceBundleId}`,
      `Source decision: ${report.sourceDecisionId}`,
      `Search documents: ${report.searchDocumentCount}`,
      `Lexical results: ${report.lexicalResultCount}`,
      `Vector results: ${report.vectorResultCount}`,
      `Hybrid results: ${report.hybridResultCount}`,
      `Embedding model: ${report.embeddingModelId}`,
      `Embedding model provider: ${report.embeddingModelProvider}`,
      `Embedding model name: ${report.embeddingModelName}`,
      `Embedding model dimensions: ${report.embeddingModelDimensions}`,
      `Vector result embedding model: ${report.vectorResultEmbeddingModelId ?? "unavailable"}`,
      `Hybrid result embedding model: ${report.hybridResultEmbeddingModelId ?? "unavailable"}`,
      `Lexical embedding provenance: ${report.lexicalEmbeddingModelProvenance}`,
      `Embedding row: ${report.embeddingId}`,
      `Retrieval run: ${report.retrievalRunId}`,
      `Retrieval candidates: ${report.retrievalCandidateCount}`,
      `Activation decisions: ${report.activationDecisionCount}`,
      `Context items: ${report.contextItemCount}`,
      `Context exclusions: ${report.contextExclusionCount}`,
      `Cleanup remaining marker count: ${report.remainingMarkerCount}`,
      ...cleanupStatusLines(report.cleanedUp, "Retrieval substrate smoke")
    ]
  );
};

const runActivationSmokeTarget: DbSmokeTargetHandler = async (
  context,
  runtime
) => {
  const report = await runActivationSmokeCheck({
    databaseUrl: context.databaseUrl,
    migrationsFolder: context.migrationsFolder,
    smokeId: runtime.createId("activation-smoke")
  });

  return smokeResultFromCleanup(
    context,
    "KRN Activation Smoke",
    report.cleanedUp,
    [
      `Workspace smoke row: ${report.workspaceSlug}`,
      `Project smoke row: ${report.projectSlug}`,
      `Execution run: ${report.executionRunId}`,
      `Task contract: ${report.taskContractId}`,
      `Harness plan: ${report.harnessPlanId}`,
      `Retrieval run: ${report.retrievalRunId}`,
      `Retrieval run readback: ${
        report.readBackRetrievalRunId === report.retrievalRunId ? "matched" : "mismatch"
      }`,
      `Context assembly: ${report.contextAssemblyId}`,
      `Context assembly readback: ${
        report.readBackContextAssemblyId === report.contextAssemblyId ? "matched" : "mismatch"
      }`,
      `Source claims: ${report.sourceClaimCount}`,
      `Memory records: ${report.memoryRecordCount}`,
      `Anti-memory records: ${report.antiMemoryRecordCount}`,
      `Search documents: ${report.searchDocumentCount}`,
      `Search candidates: ${report.searchCandidateCount}`,
      `Retrieval candidates: ${report.retrievalCandidateCount}`,
      `Activation decisions: ${report.activationDecisionCount}`,
      `Included decisions: ${report.includedDecisionCount}`,
      `Excluded decisions: ${report.excludedDecisionCount}`,
      `Conflict decisions: ${report.conflictDecisionCount}`,
      `Stale decisions: ${report.staleDecisionCount}`,
      `Context items: ${report.contextItemCount}`,
      `Context exclusions: ${report.contextExclusionCount}`,
      `Observation prefix items: ${report.observationPrefixItemCount}`,
      `Raw evidence recall triggers: ${report.rawEvidenceRecallTriggerCount}`,
      `Cleanup remaining marker count: ${report.remainingMarkerCount}`,
      ...cleanupStatusLines(report.cleanedUp, "Activation smoke")
    ]
  );
};

const runBrainLoopSmokeTarget: DbSmokeTargetHandler = async (
  context,
  runtime
) => {
  const report = await runBrainLoopSmokeCheck({
    databaseUrl: context.databaseUrl,
    migrationsFolder: context.migrationsFolder,
    smokeId: runtime.createId("brain-loop-smoke")
  });

  return smokeResultFromCleanup(
    context,
    "KRN Brain Loop Smoke",
    report.cleanedUp,
    [
      `Workspace smoke row: ${report.workspaceSlug}`,
      `Project smoke row: ${report.projectSlug}`,
      `Execution run: ${report.executionRunId}`,
      `Evidence bundle: ${report.evidenceBundleId}`,
      `Review assessment: ${report.reviewAssessmentId}`,
      `Feedback delta: ${report.feedbackDeltaId}`,
      `Source claim: ${report.sourceClaimId}`,
      `Source decision: ${report.sourceDecisionId}`,
      `Source decision trace edges: ${report.sourceDecisionTraceEdgeCount}`,
      `Source decision trace targets: ${report.sourceDecisionTraceTargetTypes.join(", ")}`,
      `Source claim status: ${report.sourceClaimStatus}`,
      `Memory candidate: ${report.memoryCandidateId}`,
      `Memory candidate reviewed status: ${report.reviewedMemoryCandidateStatus}`,
      `Memory record: ${report.memoryRecordId}`,
      `Memory record readback: ${
        report.readBackMemoryRecordId === report.memoryRecordId ? "matched" : "mismatch"
      }`,
      `Memory record version: ${report.memoryRecordVersionId}`,
      `Retrieval run: ${report.retrievalRunId}`,
      `Context assembly: ${report.contextAssemblyId}`,
      `Context assembly readback: ${
        report.readBackContextAssemblyId === report.contextAssemblyId ? "matched" : "mismatch"
      }`,
      `Activation decisions: ${report.activationDecisionCount}`,
      `Included memory decisions: ${report.includedMemoryDecisionCount}`,
      `Context items: ${report.contextItemCount}`,
      `Memory application: ${report.memoryApplicationId}`,
      `Memory origin repo: ${report.memoryOriginRepoInstallationId}`,
      `Next-run task contract: ${report.nextRunTaskContractId}`,
      `Next-run retrieval run: ${report.nextRunRetrievalRunId}`,
      `Next-run repo ids: ${report.nextRunRepoInstallationIds.join(", ")}`,
      `Next-run cross-repo memory inclusion: ${report.nextRunCrossRepoMemoryInclusion ? "yes" : "no"}`,
      `Next-run context assembly: ${report.nextRunContextAssemblyId}`,
      `Next-run memory inclusions: ${report.nextRunMemoryInclusionCount}`,
      `Next-run included memory decisions: ${report.nextRunIncludedMemoryDecisionCount}`,
      `Downgraded memory negative feedback count: ${report.downgradedMemoryNegativeFeedbackCount}`,
      `Downgraded memory applications: ${report.downgradedMemoryApplicationCount}`,
      `Downgraded-run task contract: ${report.downgradedRunTaskContractId}`,
      `Downgraded-run retrieval run: ${report.downgradedRunRetrievalRunId}`,
      `Downgraded-run repo ids: ${report.downgradedRunRepoInstallationIds.join(", ")}`,
      `Downgraded-run cross-repo memory exclusion: ${report.downgradedRunCrossRepoMemoryExclusion ? "yes" : "no"}`,
      `Downgraded-run context assembly: ${report.downgradedRunContextAssemblyId}`,
      `Downgraded-run memory exclusions: ${report.downgradedRunMemoryExclusionCount}`,
      `Downgraded-run excluded memory decisions: ${report.downgradedRunExcludedMemoryDecisionCount}`,
      `Run events: ${report.runEventCount}`,
      `Cleanup remaining marker count: ${report.remainingMarkerCount}`,
      ...cleanupStatusLines(report.cleanedUp, "Brain loop smoke")
    ]
  );
};

const runBrainSearchSmokeTarget: DbSmokeTargetHandler = async (
  context,
  runtime
) => {
  const report = await runBrainSearchDbSmokeCheck({
    databaseUrl: context.databaseUrl,
    repoRoot: context.repoRoot,
    smokeId: runtime.createId("brain-search-smoke"),
    now: "2026-07-04T00:00:00.000Z"
  });

  return smokeResultFromCleanup(
    context,
    "KRN Brain Search Smoke",
    report.cleanedUp,
    [
      `Project: ${report.projectId}`,
      `Query: ${report.query}`,
      `Source artifact: ${report.sourceArtifactId}`,
      `Source claim: ${report.sourceClaimId}`,
      `Source decision: ${report.sourceDecisionId}`,
      `Source decision edge: ${report.sourceDecisionEdgeId}`,
      `Search document: ${report.searchDocumentId}`,
      `Baseline smoke SourceClaim selected: ${report.baselineSmokeSourceClaimSelected ? "yes" : "no"}`,
      `Baseline selectedKnowledge: ${report.baselineSelectedKnowledgeCount}`,
      `Baseline supporting claims: ${report.baselineSupportingClaimCount}`,
      `Baseline supporting documents: ${report.baselineSupportingDocumentCount}`,
      `Baseline source decision support: ${report.baselineSourceDecisionSupportCount}`,
      `Grounded smoke SourceClaim selected: ${report.groundedSmokeSourceClaimSelected ? "yes" : "no"}`,
      `Grounded selectedKnowledge: ${report.groundedSelectedKnowledgeCount}`,
      `Grounded supporting claims: ${report.groundedSupportingClaimCount}`,
      `Grounded supporting documents: ${report.groundedSupportingDocumentCount}`,
      `Grounded linked search documents: ${report.groundedLinkedSearchDocumentCount}`,
      `Grounded source decision support: ${report.groundedSourceDecisionSupportCount}`,
      `Grounded recommended next action: ${report.groundedRecommendedNextAction}`,
      `Cleanup remaining marker count: ${report.remainingMarkerCount}`,
      ...cleanupStatusLines(report.cleanedUp, "Brain search smoke")
    ]
  );
};

const runShowSmokeTarget: DbSmokeTargetHandler = async (
  context,
  runtime
) => {
  const report = await runRunShowDbSmokeCheck({
    databaseUrl: context.databaseUrl,
    migrationsFolder: context.migrationsFolder,
    smokeId: runtime.createId("run-show-smoke")
  });

  return smokeResultFromCleanup(
    context,
    "KRN Run Show Smoke",
    report.cleanedUp,
    [
      `Workspace smoke row: ${report.workspaceSlug}`,
      `Project smoke row: ${report.projectSlug}`,
      `Execution run: ${report.executionRunId}`,
      `Text readback: ${report.textReadbackMatched ? "matched" : "mismatch"}`,
      `JSON readback: ${report.jsonReadbackMatched ? "matched" : "mismatch"}`,
      `Readback kind: ${report.readbackKind}`,
      `Readback mutation: ${report.readbackMutation}`,
      `Cleanup remaining marker count: ${report.remainingMarkerCount}`,
      ...cleanupStatusLines(report.cleanedUp, "Run show smoke")
    ]
  );
};

const runHeartbeatWorkerBoundarySmokeTarget: DbSmokeTargetHandler = async (
  context,
  runtime
) => {
  const report = await runHeartbeatWorkerBoundarySmokeCheck({
    databaseUrl: context.databaseUrl,
    migrationsFolder: context.migrationsFolder,
    smokeId: runtime.createId("heartbeat-worker-boundary-smoke")
  });

  return smokeResultFromCleanup(
    context,
    "KRN Heartbeat Worker Boundary Smoke",
    report.cleanedUp,
    [
      `Workspace smoke row: ${report.workspaceSlug}`,
      `Project smoke row: ${report.projectSlug}`,
      `Execution run: ${report.executionRunId}`,
      `Source claim: ${report.sourceClaimId}`,
      `Memory record: ${report.memoryRecordId}`,
      `Memory record readback: ${
        report.readBackMemoryRecordId === report.memoryRecordId ? "matched" : "mismatch"
      }`,
      `Memory records loaded: ${report.memoryRecordCount}`,
      `Candidate: ${report.candidateId}`,
      `Candidate kind: ${report.candidateKind}`,
      `Candidate reviewability: ${report.candidateReviewability}`,
      `Candidate mutation: ${report.candidateMutation}`,
      `Memory staleness candidates: ${report.memoryStalenessCandidateCount}`,
      `Worker boundary jobType: ${report.workerJobType}`,
      `Worker boundary memoryCoreGate: ${report.workerMemoryCoreGate}`,
      `Worker boundary status: ${report.workerWriteBoundaryStatus}`,
      `Worker boundary mutation: ${report.workerWriteBoundaryMutation}`,
      `Cleanup remaining marker count: ${report.cleanupRemainingMarkerCount}`,
      ...cleanupStatusLines(report.cleanedUp, "Heartbeat worker boundary smoke")
    ]
  );
};

const runCodexAdapterSmokeTarget: DbSmokeTargetHandler = async (
  context,
  runtime
) => {
  const report = await runCodexAdapterSmokeCheck({
    databaseUrl: context.databaseUrl,
    migrationsFolder: context.migrationsFolder,
    smokeId: runtime.createId("codex-adapter-smoke")
  });

  return smokeResultFromCleanup(
    context,
    "KRN Codex Adapter Smoke",
    report.cleanedUp,
    formatCodexAdapterSmokeReportLines(report)
  );
};

const runWorkerJobsSmokeTarget: DbSmokeTargetHandler = async (
  context,
  runtime
) => {
  const report = await runWorkerJobSmokeCheck({
    databaseUrl: context.databaseUrl,
    migrationsFolder: context.migrationsFolder,
    smokeId: runtime.createId("worker-job-smoke")
  });

  return smokeResultFromCleanup(
    context,
    "KRN Worker Job Smoke",
    report.cleanedUp,
    formatWorkerJobSmokeReportLines(report)
  );
};

const targetRepoFixturePath = (context: DbSmokeCommandContext): string =>
  path.join(
    context.repoRoot,
    "tests",
    "fixtures",
    "target-repos",
    "typescript-basic"
  );

const runInitConnectSmokeTarget: DbSmokeTargetHandler = async (
  context,
  runtime
) => {
  const report = await runInitConnectSmokeCheck({
    databaseUrl: context.databaseUrl,
    migrationsFolder: context.migrationsFolder,
    smokeId: runtime.createId("init-connect-smoke"),
    targetRepoPath: targetRepoFixturePath(context)
  });

  return smokeResultFromCleanup(
    context,
    "KRN Target Repo Init-Connect Smoke",
    report.cleanedUp,
    [
      `Workspace smoke row: ${report.workspaceSlug}`,
      `Project: ${report.projectId}`,
      `Project readback by fingerprint: ${
        report.readBackProjectIdByFingerprint === report.projectId ? "matched" : "mismatch"
      }`,
      `Project readback by path: ${
        report.readBackProjectIdByPath === report.projectId ? "matched" : "mismatch"
      }`,
      `Repo installation: ${report.repoInstallationId}`,
      `Repo installation readback: ${
        report.readBackRepoInstallationId === report.repoInstallationId ? "matched" : "mismatch"
      }`,
      `ProjectKernel: ${report.projectKernelId}`,
      `ProjectKernel readback: ${
        report.readBackProjectKernelId === report.projectKernelId ? "matched" : "mismatch"
      }`,
      `Idempotent project reuse: ${report.reusedProjectId === report.projectId ? "matched" : "mismatch"}`,
      `Idempotent repo installation reuse: ${
        report.reusedRepoInstallationId === report.repoInstallationId ? "matched" : "mismatch"
      }`,
      `Idempotent ProjectKernel reuse: ${
        report.reusedProjectKernelId === report.projectKernelId ? "matched" : "mismatch"
      }`,
      `Refreshed ProjectKernel: ${report.refreshedProjectKernelId}`,
      `Refreshed ProjectKernel version: ${report.refreshedProjectKernelVersion}`,
      `Refreshed owner files: ${report.refreshedOwnerFilePaths.join(", ")}`,
      `Repo installations listed: ${report.repoInstallationCount}`,
      `Cleanup remaining marker count: ${report.remainingMarkerCount}`,
      ...cleanupStatusLines(report.cleanedUp, "Init-connect smoke")
    ]
  );
};

const runTargetRepoHarnessSmokeTarget: DbSmokeTargetHandler = async (
  context,
  runtime
) => {
  const report = await runTargetRepoHarnessSmokeCheck({
    databaseUrl: context.databaseUrl,
    migrationsFolder: context.migrationsFolder,
    smokeId: runtime.createId("target-repo-harness-smoke"),
    targetRepoPath: targetRepoFixturePath(context)
  });

  return smokeResultFromCleanup(
    context,
    "KRN Target Repo Harness Smoke",
    report.cleanedUp,
    formatTargetRepoHarnessSmokeReportLines(report)
  );
};

const runProjectSmokeTarget: DbSmokeTargetHandler = async (context, runtime) => {
  const report = await runPersistenceSmokeCheck({
    databaseUrl: context.databaseUrl,
    migrationsFolder: context.migrationsFolder,
    smokeId: runtime.createId("db-smoke")
  });

  return smokeResult(0, context, "KRN DB Smoke", [
    `Workspace smoke row: ${report.workspaceSlug}`,
    `Project smoke row: ${report.projectSlug}`,
    `Project readback: ${report.readBackProjectId === report.projectId ? "matched" : "mismatch"}`,
    `Cleanup: ${report.cleanedUp ? "completed" : "not completed"}`,
    "Persistence smoke: passed"
  ]);
};

const dbSmokeTargetHandlers = {
  project: runProjectSmokeTarget,
  harnessPlan: runHarnessPlanSmokeTarget,
  harnessEvidence: runHarnessEvidenceSmokeTarget,
  sourceGraph: runSourceGraphSmokeTarget,
  memoryGovernance: runMemoryGovernanceSmokeTarget,
  retrievalSubstrate: runRetrievalSubstrateSmokeTarget,
  activation: runActivationSmokeTarget,
  brainLoop: runBrainLoopSmokeTarget,
  brainSearch: runBrainSearchSmokeTarget,
  runShow: runShowSmokeTarget,
  heartbeatWorkerBoundary: runHeartbeatWorkerBoundarySmokeTarget,
  codexAdapter: runCodexAdapterSmokeTarget,
  workerJobs: runWorkerJobsSmokeTarget,
  initConnect: runInitConnectSmokeTarget,
  targetRepoHarness: runTargetRepoHarnessSmokeTarget
} satisfies Record<DbSmokeTarget, DbSmokeTargetHandler>;

export const runDbSmokeCommand = async (
  runtime: DbSmokeRuntime
): Promise<DbSmokeResult> => {
  const repoRoot = await findRepoRoot(runtime.cwd);
  const migrationsFolder = path.join(repoRoot, "packages", "db", "src", "migrations");
  const relativeMigrationsFolder = path.relative(repoRoot, migrationsFolder);
  const databaseUrl = runtime.env.KRN_DATABASE_URL?.trim();
  const targetMetadata = dbSmokeTargetMetadata[runtime.target];

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    return {
      exitCode: 1,
      stdout: output([
        targetMetadata.title,
        `Repo root: ${repoRoot}`,
        `Migrations folder: ${relativeMigrationsFolder}`,
        "Postgres config: missing KRN_DATABASE_URL",
        `Next action: export KRN_DATABASE_URL=${localDatabaseUrl} and start docker compose up -d krn-postgres`,
        targetMetadata.skippedLine
      ])
    };
  }

  const context = {
    repoRoot,
    migrationsFolder,
    relativeMigrationsFolder,
    databaseUrl
  };

  try {
    return await dbSmokeTargetHandlers[runtime.target](context, runtime);
  } catch (error) {
    return {
      exitCode: 1,
      stdout: output([
        targetMetadata.title,
        `Repo root: ${repoRoot}`,
        `Migrations folder: ${relativeMigrationsFolder}`,
        "Postgres config: configured",
        `${targetMetadata.failureLabel}: failed (${errorMessage(error)})`
      ])
    };
  }
};
