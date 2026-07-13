import path from "node:path";
import {
  runActivationSmokeCheck,
  runBrainLoopSmokeCheck,
  runHarnessEvidenceSmokeCheck,
  runHarnessPlanSmokeCheck,
  runMaintenanceBoundarySmokeCheck,
  runInitConnectSmokeCheck,
  runMemoryGovernanceSmokeCheck,
  runPersistenceSmokeCheck,
  runRetrievalSubstrateSmokeCheck,
  runSourceGraphSmokeCheck,
  runMaintenanceQueueSmokeCheck
} from "@krn/db/dev";
import {
  createExecutionBrief,
  renderExecutionBriefText
} from "@krn/codex-adapter";
import {
  formatCodexAdapterSmokeReportLines,
  runCodexAdapterSmokeCheck
} from "./internal/smoke/codex-adapter-smoke.js";
import {
  formatTargetRepoHarnessSmokeReportLines,
  runTargetRepoHarnessSmokeCheck
} from "./internal/smoke/target-repo-harness-smoke.js";
import {
  formatMaintenanceQueueSmokeReportLines
} from "./internal/smoke/maintenance-queue-smoke.js";
import {
  findRepoRoot
} from "./cli-file-boundary.js";
import {
  runRunShowDbSmokeCheck
} from "./internal/smoke/run-show-db-smoke.js";
import {
  runBrainSearchDbSmokeCheck
} from "./internal/smoke/run-brain-search-db-smoke.js";
import {
  runRealRecallAdvantageDbSmokeCheck
} from "./internal/smoke/run-real-recall-advantage-db-smoke.js";
import {
  runDecisionCorpusImportDbSmokeCheck
} from "./internal/smoke/run-decision-corpus-import-db-smoke.js";
import {
  type DecisionPacketReturnLoopSmokeReport,
  runDecisionPacketReturnLoopSmokeCheck
} from "./internal/smoke/decision-packet-return-loop-smoke.js";
import {
  runEvalFeedbackPersistenceSmokeCheck
} from "./internal/smoke/eval-feedback-persistence-smoke.js";
import {
  collectEnvironmentFingerprint,
  environmentFingerprintLines
} from "./environment-fingerprint.js";

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
    | "evalFeedbackPersistence"
    | "retrievalSubstrate"
    | "activation"
    | "brainLoop"
    | "brainSearch"
    | "runShow"
    | "maintenanceBoundary"
    | "codexAdapter"
    | "maintenanceQueue"
    | "initConnect"
    | "targetRepoHarness"
    | "decisionCorpusImport"
    | "realRecallAdvantage"
    | "decisionPacketReturnLoop";
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
  evalFeedbackPersistence: {
    title: "KRN Eval Feedback Persistence Smoke",
    skippedLine: "Eval feedback persistence smoke: skipped (database not configured)",
    failureLabel: "Eval feedback persistence smoke"
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
    title: "KRN Memory Loop Smoke",
    skippedLine: "Memory loop smoke: skipped (database not configured)",
    failureLabel: "Memory loop smoke"
  },
  brainSearch: {
    title: "KRN Memory Search Smoke",
    skippedLine: "Memory search smoke: skipped (database not configured)",
    failureLabel: "Memory search smoke"
  },
  runShow: {
    title: "KRN Run Show Smoke",
    skippedLine: "Run show smoke: skipped (database not configured)",
    failureLabel: "Run show smoke"
  },
  maintenanceBoundary: {
    title: "KRN Maintenance Boundary Smoke",
    skippedLine: "Maintenance boundary smoke: skipped (database not configured)",
    failureLabel: "Maintenance boundary smoke"
  },
  codexAdapter: {
    title: "KRN Codex Adapter Smoke",
    skippedLine: "Codex adapter smoke: skipped (database not configured)",
    failureLabel: "Codex adapter smoke"
  },
  maintenanceQueue: {
    title: "KRN Maintenance Queue Smoke",
    skippedLine: "Maintenance queue smoke: skipped (database not configured)",
    failureLabel: "Maintenance queue smoke"
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
  },
  decisionCorpusImport: {
    title: "KRN Decision Corpus Import Smoke",
    skippedLine: "Decision corpus import smoke: skipped (database not configured)",
    failureLabel: "Decision corpus import smoke"
  },
  realRecallAdvantage: {
    title: "KRN Real Recall Advantage Smoke",
    skippedLine: "Real recall advantage smoke: skipped (database not configured)",
    failureLabel: "Real recall advantage smoke"
  },
  decisionPacketReturnLoop: {
    title: "KRN Decision Packet Return Loop Smoke",
    skippedLine: "DecisionPacket return-loop smoke: skipped (database not configured)",
    failureLabel: "DecisionPacket return-loop smoke"
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

const yesNo = (value: boolean): "yes" | "no" =>
  value ? "yes" : "no";

const smokeResultFromCleanup = (
  context: DbSmokeCommandContext,
  title: string,
  cleanedUp: boolean,
  lines: string[]
): DbSmokeResult =>
  smokeResult(cleanedUp ? 0 : 1, context, title, lines);

const attachEnvironmentFingerprint = (
  result: DbSmokeResult,
  fingerprint: Awaited<ReturnType<typeof collectEnvironmentFingerprint>>
): DbSmokeResult => ({
  ...result,
  stdout: `${result.stdout}${output([...environmentFingerprintLines(fingerprint)])}`
});

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
      `Feedback outbox events: ${report.feedbackOutboxEventCount}`,
      `Feedback maintenance queue records: ${report.feedbackMaintenanceQueueCount}`,
      `Evidence bundles: ${report.evidenceBundleCount}`,
      `Review assessments: ${report.reviewAssessmentCount}`,
      `Feedback deltas: ${report.feedbackDeltaCount}`,
      `Project feedback deltas: ${report.projectFeedbackDeltaCount}`,
      `Subject feedback deltas: ${report.subjectFeedbackDeltaCount}`,
      `Subject feedback relevant: ${report.subjectFeedbackRelevant ? "yes" : "no"}`,
      `Source subject feedback retrieved: ${report.sourceSubjectFeedbackRetrieved ? "yes" : "no"}`,
      `Exact feedback lookup found: ${report.exactFeedbackLookupFound ? "yes" : "no"}`,
      `Wrong-project feedback lookup closed: ${report.wrongProjectFeedbackLookupClosed ? "yes" : "no"}`,
      `Missing feedback lookup distinct: ${report.missingFeedbackLookupDistinct ? "yes" : "no"}`,
      `Other project feedback deltas: ${report.otherProjectFeedbackDeltaCount}`,
      `Other project feedback excluded: ${report.otherProjectFeedbackDeltaExcluded ? "yes" : "no"}`,
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
      `Rejected source claim: ${report.rejectedSourceClaimId}`,
      `Source claim readback: ${
        report.readBackSourceClaimId === report.sourceClaimId ? "matched" : "mismatch"
      }`,
      `Source claim edge: ${report.sourceClaimEdgeId}`,
      `Duplicate source claim edge: ${report.duplicateSourceClaimEdgeId}`,
      `Missing-support source claim edge: ${report.missingSupportSourceClaimEdgeId}`,
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
      `Source consensus current authorities: ${report.sourceConsensusCurrentAuthorityCount}`,
      `Source consensus historical claims: ${report.sourceConsensusHistoricalCount}`,
      `Source consensus superseded claims: ${report.sourceConsensusSupersededCount}`,
      `Source consensus rejected claims: ${report.sourceConsensusRejectedCount}`,
      `Source consensus relation evidence gaps: ${report.sourceConsensusRelationEvidenceGapCount}`,
      `Unscoped foreign SourceClaim read leak: ${report.unscopedForeignSourceClaimReadLeaks}`,
      `Project-scoped foreign SourceDecision read rejected: ${report.scopedForeignSourceDecisionReadRejected}`,
      `Project-scoped foreign SourceClaimEdge read rejected: ${report.scopedForeignSourceClaimEdgeReadRejected}`,
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

const runEvalFeedbackPersistenceSmokeTarget: DbSmokeTargetHandler = async (
  context,
  runtime
) => {
  const report = await runEvalFeedbackPersistenceSmokeCheck({
    databaseUrl: context.databaseUrl,
    migrationsFolder: context.migrationsFolder,
    repoRoot: context.repoRoot,
    smokeId: runtime.createId("eval-feedback-persistence-smoke")
  });

  return smokeResultFromCleanup(
    context,
    "KRN Eval Feedback Persistence Smoke",
    report.cleanedUp,
    [
      `Smoke id: ${report.smokeId}`,
      `Project: ${report.projectId}`,
      `Execution run: ${report.executionRunId}`,
      `Failing eval candidates: ${report.failingEvalCandidateCount}`,
      `Persisted eval candidates: ${report.persistedEvalCandidateCount}`,
      `First persistence created: ${report.firstPersistenceCreated ? "yes" : "no"}`,
      `Retry persistence created: ${report.retryPersistenceCreated ? "yes" : "no"}`,
      `Retry feedback delta: ${report.retryFeedbackDeltaId}`,
      `Readback feedback delta: ${report.readbackFeedbackDeltaId}`,
      `Passing eval persisted: ${report.passingEvalPersisted ? "yes" : "no"}`,
      `Cleanup remaining marker count: ${report.cleanupRemainingMarkerCount}`,
      ...cleanupStatusLines(report.cleanedUp, "Eval feedback persistence smoke")
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
      `Relevant memory before bounded limit: ${report.relevantMemoryRetrieved ? "yes" : "no"}`,
      `Anti-memory records: ${report.antiMemoryRecordCount}`,
      `Search documents: ${report.searchDocumentCount}`,
      `Index-only stale search excluded: ${report.indexOnlySearchExcluded ? "yes" : "no"}`,
      `Cross-project search excluded: ${report.crossProjectIndexExcluded ? "yes" : "no"}`,
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
    smokeId: runtime.createId("memory-loop-smoke"),
    renderExecutionBrief: (packet) => renderExecutionBriefText(createExecutionBrief({ packet }))
  });

  return smokeResultFromCleanup(
    context,
    "KRN Memory Loop Smoke",
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
      `DecisionPacket governing decisions: ${report.decisionPacketGoverningDecisionIds.join(", ")}`,
      `DecisionPacket rejected paths: ${report.decisionPacketRejectedPathIds.join(", ")}`,
      `DecisionPacket falsifier commands: ${report.decisionPacketFalsifierCommands.join(", ")}`,
      `DecisionPacket non-proof boundaries: ${report.decisionPacketNonProofs.length}`,
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
      `Next-run Codex brief rendered: ${report.nextRunCodexBriefRendered ? "yes" : "no"}`,
      `Next-run Codex brief includes memory: ${report.nextRunCodexBriefIncludesMemory ? "yes" : "no"}`,
      `Next-run Codex brief non-proof boundary: ${report.nextRunCodexBriefIncludesNonProofBoundary ? "yes" : "no"}`,
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
      `Consolidation candidate: ${report.consolidationCandidateId}`,
      `Consolidation anti-memory candidate: ${report.consolidationAntiMemoryCandidateId}`,
      `Consolidation feedback event: ${report.consolidationMemoryFeedbackEventId}`,
      `Consolidation anti-memory record: ${report.consolidationAntiMemoryRecordId}`,
      `Consolidation-run task contract: ${report.consolidationRunTaskContractId}`,
      `Consolidation-run retrieval run: ${report.consolidationRunRetrievalRunId}`,
      `Consolidation-run context assembly: ${report.consolidationRunContextAssemblyId}`,
      `Consolidation-run memory exclusions: ${report.consolidationRunMemoryExclusionCount}`,
      `Consolidation-run excluded memory decisions: ${report.consolidationRunExcludedMemoryDecisionCount}`,
      `Consolidation-run anti-memory conflicts: ${report.consolidationRunAntiMemoryConflictCount}`,
      `Revision memory candidate: ${report.revisionMemoryCandidateId}`,
      `Revision feedback event: ${report.revisionMemoryFeedbackEventId}`,
      `Revision replacement memory record: ${report.revisionMemoryRecordId}`,
      `Revision source memory status: ${report.revisionSupersededMemoryStatus}`,
      `Revision-run task contract: ${report.revisionRunTaskContractId}`,
      `Revision-run retrieval run: ${report.revisionRunRetrievalRunId}`,
      `Revision-run context assembly: ${report.revisionRunContextAssemblyId}`,
      `Revision-run replacement inclusions: ${report.revisionRunReplacementInclusionCount}`,
      `Revision-run included replacement decisions: ${report.revisionRunIncludedReplacementDecisionCount}`,
      `Revision-run source memory inclusions: ${report.revisionRunSourceMemoryInclusionCount}`,
      `Revision-run superseded source excluded: ${report.revisionRunSupersededSourceExcluded ? "yes" : "no"}`,
      `Run events: ${report.runEventCount}`,
      `Cleanup remaining marker count: ${report.remainingMarkerCount}`,
      ...cleanupStatusLines(report.cleanedUp, "Memory loop smoke")
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
    smokeId: runtime.createId("memory-search-smoke"),
    now: "2026-07-04T00:00:00.000Z"
  });

  return smokeResultFromCleanup(
    context,
    "KRN Memory Search Smoke",
    report.cleanedUp,
    [
      `Project: ${report.projectId}`,
      `Smoke id: ${report.smokeId}`,
      `Challenge case: ${report.challengeCaseId}`,
      `Challenge standard: ${report.challengeStandardId}`,
      `Challenge expected decision: ${report.challengeExpectedDecision}`,
      `Challenge baseline failure mode: ${report.challengeBaselineFailureMode}`,
      `Challenge falsifier: ${report.challengeFalsifier}`,
      `Query: ${report.query}`,
      `Session A task contract: ${report.sessionATaskContractId}`,
      `Session A harness plan: ${report.sessionAHarnessPlanId}`,
      `Session A execution run: ${report.sessionAExecutionRunId}`,
      `Session A evidence bundle: ${report.sessionAEvidenceBundleId}`,
      `Session A review assessment: ${report.sessionAReviewAssessmentId}`,
      `Session A feedback delta: ${report.sessionAFeedbackDeltaId}`,
      `Source artifact: ${report.sourceArtifactId}`,
      `Source claim: ${report.sourceClaimId}`,
      `Source decision: ${report.sourceDecisionId}`,
      `Source decision edge: ${report.sourceDecisionEdgeId}`,
      `Search document: ${report.searchDocumentId}`,
      `Memory candidate: ${report.memoryCandidateId}`,
      `Memory record: ${report.memoryRecordId}`,
      `Baseline smoke SourceClaim selected: ${report.baselineSmokeSourceClaimSelected ? "yes" : "no"}`,
      `Baseline smoke MemoryRecord selected: ${report.baselineSmokeMemorySelected ? "yes" : "no"}`,
      `Baseline selectedKnowledge: ${report.baselineSelectedKnowledgeCount}`,
      `Baseline selectedKnowledge packets: ${report.baselineSelectedKnowledgePackets.join(", ")}`,
      `Baseline supporting claims: ${report.baselineSupportingClaimCount}`,
      `Baseline supporting documents: ${report.baselineSupportingDocumentCount}`,
      `Baseline source decision support: ${report.baselineSourceDecisionSupportCount}`,
      `Grounded smoke SourceClaim selected: ${report.groundedSmokeSourceClaimSelected ? "yes" : "no"}`,
      `Grounded smoke MemoryRecord selected: ${report.groundedSmokeMemorySelected ? "yes" : "no"}`,
      `Grounded selectedKnowledge: ${report.groundedSelectedKnowledgeCount}`,
      `Grounded selectedKnowledge packets: ${report.groundedSelectedKnowledgePackets.join(", ")}`,
      `Grounded supporting claims: ${report.groundedSupportingClaimCount}`,
      `Grounded supporting documents: ${report.groundedSupportingDocumentCount}`,
      `Grounded linked search documents: ${report.groundedLinkedSearchDocumentCount}`,
      `Grounded source decision support: ${report.groundedSourceDecisionSupportCount}`,
      `Grounded recommended next action: ${report.groundedRecommendedNextAction}`,
      `Grounded source contribution: ${report.groundedSourceContribution}`,
      `Limitation classification: ${report.limitationClassification}`,
      `Cleanup remaining marker count: ${report.remainingMarkerCount}`,
      ...cleanupStatusLines(report.cleanedUp, "Memory search smoke")
    ]
  );
};

const runRealRecallAdvantageSmokeTarget: DbSmokeTargetHandler = async (
  context,
  runtime
) => {
  const report = await runRealRecallAdvantageDbSmokeCheck({
    databaseUrl: context.databaseUrl,
    repoRoot: context.repoRoot,
    smokeId: runtime.createId("real-recall-advantage-smoke"),
    now: "2026-07-04T00:00:00.000Z"
  });

  return smokeResultFromCleanup(
    context,
    "KRN Real Recall Advantage Smoke",
    report.cleanedUp,
    [
      `Project: ${report.projectId}`,
      `Smoke id: ${report.smokeId}`,
      `Real decisions seeded: ${report.decisionCount}`,
      `Distractor-competition advantage wins: ${report.advantageWinCount}/${report.decisionCount}`,
      `Baseline distractor top picks: ${report.baselineDistractorTopCount}/${report.decisionCount}`,
      `Grounded governing top picks: ${report.groundedGoverningTopCount}/${report.decisionCount}`,
      ...report.decisions.map((decision) => [
        `Decision ${decision.decisionId} (${decision.standardId})`,
        `  Query: ${decision.query}`,
        `  Expected decision: ${decision.expectedDecision}`,
        `  Baseline top pick: ${decision.baselinePickedDistractor ? "distractor" : "other"}` +
          ` (candidates: ${decision.baselineIncludedCandidateCount}; governing: ${decision.baselineTopClaimId === decision.governingClaimId ? "yes" : "no"})`,
        `  Grounded top pick: ${decision.groundedPickedGoverning ? "governing" : "other"}`,
        `  Advantage win: ${decision.advantageWin ? "yes" : "no"}`
      ].join("\n")),
      `Limitation: ${report.limitationClassification}`,
      `Cleanup remaining marker count: ${report.remainingMarkerCount}`,
      ...cleanupStatusLines(report.cleanedUp, "Real recall advantage smoke")
    ]
  );
};

const runDecisionCorpusImportSmokeTarget: DbSmokeTargetHandler = async (
  context,
  runtime
) => {
  const report = await runDecisionCorpusImportDbSmokeCheck({
    databaseUrl: context.databaseUrl,
    repoRoot: context.repoRoot,
    smokeId: runtime.createId("decision-corpus-import-smoke"),
    now: "2026-07-06T00:00:00.000Z"
  });

  return smokeResultFromCleanup(
    context,
    "KRN Decision Corpus Import Smoke",
    report.cleanedUp,
    [
      `Project: ${report.projectId}`,
      `Smoke id: ${report.smokeId}`,
      `Fixture corpus: ${report.fixtureCorpusName}`,
      `Imported decisions: ${report.importedDecisionCount}`,
      `Imported cases: ${report.importedCaseCount}`,
      `Import replay stable: ${report.replayStable ? "yes" : "no"}`,
      `Replay persisted artifact count: ${report.replayPersistedArtifactCount}`,
      `Changed replay rejected: ${report.changedReplayRejected ? "yes" : "no"}`,
      `Atomic failure rolled back: ${report.atomicFailureRolledBack ? "yes" : "no"}`,
      `Reconciliation read-only: ${report.reconciliationReadOnly ? "yes" : "no"}`,
      `Reconciliation list limit: ${report.reconciliation.limit}`,
      `Reconciliation imports inspected: ${report.reconciliation.imports.returnedCount}/${report.reconciliation.imports.totalCount}`,
      `Reconciliation truncated: ${report.reconciliation.imports.truncated ? "yes" : "no"}`,
      ...report.reconciliation.imports.items.map((item) =>
        `Reconciliation import ${item.importId}: lifecycle=${item.lifecycle}, rows=${item.rowCount}, complete=${item.completeRowCount}, partial=${item.partialRowCount}, equivalentImportIds=${item.equivalentImportIds.items.join(", ") || "none"}`
      ),
      `Governing decision: ${report.governingDecisionId}`,
      `Governing evidence status: ${report.governingEvidenceStatus}`,
      `External evidence status: ${report.externalEvidenceStatus}`,
      `Source coverage: ${report.coverage.status}`,
      `Source coverage rows: declared=${report.coverage.declaredRowCount}, captured=${report.coverage.capturedRowCount}, missing=${report.coverage.missingRowCount}`,
      `Source coverage evidence: declared=${report.coverage.declaredEvidenceRefCount}, captured=${report.coverage.capturedEvidenceRefCount}, missing=${report.coverage.missingEvidenceRefCount}, mismatched=${report.coverage.mismatchedEvidenceRefCount}, externallyUnverified=${report.coverage.externallyUnverifiedEvidenceRefCount}`,
      `Source coverage missing evidence refs: ${report.coverage.missingEvidenceRefs.join(", ") || "none"}`,
      `Governing SourceClaim: ${report.governingSourceClaimId}`,
      `Governing SourceDecisionEdge: ${report.governingSourceDecisionEdgeId}`,
      `Governing SearchDocument: ${report.governingSearchDocumentId}`,
      `Source search selected governing claim: ${report.sourceSearchSelectedGoverningClaim ? "yes" : "no"}`,
      `Stale decision: ${report.staleDecisionId}`,
      `Stale SourceClaim status: ${report.staleSourceClaimStatus}`,
      `Stale SourceClaim revisitWhen: ${report.staleSourceClaimRevisitWhen}`,
      `Stale SourceDecision status: ${report.staleSourceDecisionStatus}`,
      `Stale SearchDocument validity: ${report.staleSearchDocumentValidityStatus}`,
      `Stale SourceDecisionEdge count: ${report.staleSourceDecisionEdgeCount}`,
      `Source search selected stale claim: ${report.sourceSearchSelectedStaleClaim ? "yes" : "no"}`,
      `Source search supporting claims: ${report.sourceSearchSupportingClaimCount}`,
      `Source search supporting documents: ${report.sourceSearchSupportingDocumentCount}`,
      `Source search decision support: ${report.sourceSearchDecisionSupportCount}`,
      `Limitation: ${report.limitationClassification}`,
      `Cleanup remaining marker count: ${report.remainingMarkerCount}`,
      ...cleanupStatusLines(report.cleanedUp, "Decision corpus import smoke")
    ]
  );
};

const formatDecisionPacketReturnLoopSmokeLines = (
  report: DecisionPacketReturnLoopSmokeReport
): string[] => [
  `Workspace smoke row: ${report.workspaceSlug}`,
  `Project smoke row: ${report.projectSlug}`,
  `Execution run: ${report.executionRunId}`,
  `Packet checksum: ${report.packetChecksum}`,
  `Packet evidence ref: ${report.packetEvidenceRef}`,
  `Return channel checksum binding: ${yesNo(report.returnChannelHasChecksum)}`,
  `Matching feedback delta: ${report.matchingFeedbackDeltaId}`,
  `Matching feedback outcome: ${report.matchingFeedbackOutcome}`,
  `Matching feedback stayed diagnostic: ${yesNo(report.matchingFeedbackStayedDiagnostic)}`,
  `Stale feedback delta: ${report.staleFeedbackDeltaId}`,
  `Stale feedback outcome: ${report.staleFeedbackOutcome}`,
  `Stale feedback stayed diagnostic: ${yesNo(report.staleFeedbackStayedDiagnostic)}`,
  `Mismatched feedback delta: ${report.mismatchedFeedbackDeltaId}`,
  `Mismatched feedback outcome: ${report.mismatchedFeedbackOutcome}`,
  `Mismatched feedback downgraded: ${yesNo(report.mismatchedFeedbackDowngraded)}`,
  `Mismatched feedback stayed out of next packet: ${yesNo(report.mismatchedFeedbackStayedOutOfNextPacket)}`,
  `Next packet governing decisions: ${report.nextPacketGoverningDecisionIds.join(", ")}`,
  `Next packet stale decisions: ${report.nextPacketStaleDecisionIds.join(", ")}`,
  `Next packet caveated source claims: ${report.nextPacketCaveatedSourceClaimIds.join(", ")}`,
  `Next packet retains activated decisions: ${yesNo(report.nextPacketRetainsActivatedDecision)}`,
  `Unresolved source dissent proof run: ${report.sourceDissentProofRunId}`,
  `Unresolved source dissent candidate claim: ${report.sourceDissentCandidateClaimId}`,
  `Unresolved source dissent peer claim: ${report.sourceDissentDissentingClaimId}`,
  `Unresolved source dissent candidate decision: ${report.sourceDissentCandidateDecisionId}`,
  `Unresolved source dissent packet source claims: ${report.sourceDissentPacketSourceClaimIds.join(", ")}`,
  `Unresolved source dissent conflicting claims: ${report.sourceDissentPacketConflictingSourceClaimIds.join(", ")}`,
  `Unresolved source dissent decision-linked claims: ${report.sourceDissentPacketDecisionLinkedSourceClaimIds.join(", ")}`,
  `Unresolved source dissent governing decisions: ${report.sourceDissentPacketGoverningDecisionIds.join(", ")}`,
  `Unresolved source dissent source decision edges: ${report.sourceDissentPacketSourceDecisionEdgeIds.join(", ")}`,
  `Unresolved source dissent packet status: ${report.sourceDissentPacketStatus}`,
  `Unresolved source dissent packet reasons: ${report.sourceDissentPacketReasons.join(", ")}`,
  `Unresolved source dissent brief stops execution: ${yesNo(report.sourceDissentBriefStopsExecution)}`,
  `Unresolved source dissent MCP preserves dissent and gap: ${yesNo(report.sourceDissentMcpPreservesDissentAndGap)}`,
  `Unresolved source dissent readbacks do not promote usefulness: ${yesNo(report.sourceDissentReadOnlyUsefulnessUnchanged)}`,
  `Selector proof run: ${report.selectorProofRunId}`,
  `Selector helped memory: ${report.selectorHelpedMemoryRecordId}`,
  `Selector stale memory: ${report.selectorStaleMemoryRecordId}`,
  `Selector helped memory application: ${report.selectorHelpedMemoryApplicationId}`,
  `Selector stale memory applications: ${report.selectorStaleMemoryApplicationIds.join(", ")}`,
  `Selector packet memory refs: ${report.selectorPacketMemoryRefs.join(", ")}`,
  `Selector packet includes helped memory: ${yesNo(report.selectorPacketIncludesHelpedMemory)}`,
  `Selector packet excludes stale memory: ${yesNo(report.selectorPacketExcludesStaleMemory)}`,
  `Selector maintenance candidate: ${report.selectorMaintenanceCandidateId}`,
  `Selector maintenance anti-memory candidate: ${report.selectorMaintenanceAntiMemoryCandidateId}`,
  `Selector maintenance feedback event: ${report.selectorMaintenanceFeedbackEventId}`,
  `Selector maintenance candidate linked to feedback delta: ${yesNo(report.selectorMaintenanceCandidateLinkedToFeedbackDelta)}`,
  `Feedback maintenance queue record: ${report.feedbackMaintenanceQueueRecordId}`,
  `Feedback maintenance queue status: ${report.feedbackMaintenanceQueueStatus}`,
  `Feedback maintenance handler boundary passed: ${yesNo(report.feedbackMaintenanceHandlerBoundaryPassed)}`,
  `Feedback maintenance anti-memory candidate: ${report.feedbackMaintenanceAntiMemoryCandidateId}`,
  `Feedback maintenance candidate linked to feedback delta: ${yesNo(report.feedbackMaintenanceCandidateLinkedToFeedbackDelta)}`,
  `Feedback maintenance delayed exact lookup: ${yesNo(report.feedbackMaintenanceDelayedLookupResolved)}`,
  `Feedback maintenance exact replay idempotent: ${yesNo(report.feedbackMaintenanceExactReplayIdempotent)}`,
  `Feedback maintenance direct mutation delta: ${report.feedbackMaintenanceDirectMutationDelta}`,
  `Cleanup remaining marker count: ${report.cleanupRemainingMarkerCount}`,
  ...cleanupStatusLines(report.cleanedUp, "DecisionPacket return-loop smoke")
];

const runDecisionPacketReturnLoopSmokeTarget: DbSmokeTargetHandler = async (
  context,
  runtime
) => {
  const report = await runDecisionPacketReturnLoopSmokeCheck({
    databaseUrl: context.databaseUrl,
    migrationsFolder: context.migrationsFolder,
    smokeId: runtime.createId("decision-packet-return-loop-smoke")
  });

  return smokeResultFromCleanup(
    context,
    "KRN Decision Packet Return Loop Smoke",
    report.cleanedUp,
    formatDecisionPacketReturnLoopSmokeLines(report)
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
      `Packet binding status: ${report.packetBindingStatus}`,
      `Packet binding stored checksum: ${report.packetBindingStoredChecksumMatched ? "matched" : "mismatch"}`,
      `Packet binding retry: ${report.packetBindingRetryStable ? "stable" : "mismatch"}`,
      `Packet binding counts: evidence=${report.evidenceBundleCount} review=${report.reviewAssessmentCount} feedback=${report.feedbackDeltaCount} events=${report.runEventCount}`,
      `Readback kind: ${report.readbackKind}`,
      `Readback mutation: ${report.readbackMutation}`,
      `Cleanup remaining marker count: ${report.remainingMarkerCount}`,
      ...cleanupStatusLines(report.cleanedUp, "Run show smoke")
    ]
  );
};

const runMaintenanceBoundarySmokeTarget: DbSmokeTargetHandler = async (
  context,
  runtime
) => {
  const report = await runMaintenanceBoundarySmokeCheck({
    databaseUrl: context.databaseUrl,
    migrationsFolder: context.migrationsFolder,
    smokeId: runtime.createId("maintenance-boundary-smoke")
  });

  return smokeResultFromCleanup(
    context,
    "KRN Maintenance Boundary Smoke",
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
      `Maintenance boundary jobType: ${report.maintenanceJobType}`,
      `Maintenance boundary memoryBoundary: ${report.maintenanceMemoryBoundary}`,
      `Maintenance boundary status: ${report.maintenanceWriteBoundaryStatus}`,
      `Maintenance boundary mutation: ${report.maintenanceWriteBoundaryMutation}`,
      `Cleanup remaining marker count: ${report.cleanupRemainingMarkerCount}`,
      ...cleanupStatusLines(report.cleanedUp, "Maintenance boundary smoke")
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

const runMaintenanceQueueSmokeTarget: DbSmokeTargetHandler = async (
  context,
  runtime
) => {
  const report = await runMaintenanceQueueSmokeCheck({
    databaseUrl: context.databaseUrl,
    migrationsFolder: context.migrationsFolder,
    smokeId: runtime.createId("maintenance-queue-smoke")
  });

  return smokeResultFromCleanup(
    context,
    "KRN Maintenance Queue Smoke",
    report.cleanedUp,
    formatMaintenanceQueueSmokeReportLines(report)
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
    repoRoot: context.repoRoot,
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
  evalFeedbackPersistence: runEvalFeedbackPersistenceSmokeTarget,
  retrievalSubstrate: runRetrievalSubstrateSmokeTarget,
  activation: runActivationSmokeTarget,
  brainLoop: runBrainLoopSmokeTarget,
  brainSearch: runBrainSearchSmokeTarget,
  runShow: runShowSmokeTarget,
  maintenanceBoundary: runMaintenanceBoundarySmokeTarget,
  codexAdapter: runCodexAdapterSmokeTarget,
  maintenanceQueue: runMaintenanceQueueSmokeTarget,
  initConnect: runInitConnectSmokeTarget,
  targetRepoHarness: runTargetRepoHarnessSmokeTarget,
  decisionCorpusImport: runDecisionCorpusImportSmokeTarget,
  realRecallAdvantage: runRealRecallAdvantageSmokeTarget,
  decisionPacketReturnLoop: runDecisionPacketReturnLoopSmokeTarget
} satisfies Record<DbSmokeTarget, DbSmokeTargetHandler>;

export const runDbSmokeCommand = async (
  runtime: DbSmokeRuntime
): Promise<DbSmokeResult> => {
  const repoRoot = await findRepoRoot(runtime.cwd);
  const migrationsFolder = path.join(repoRoot, "packages", "db", "src", "migrations");
  const relativeMigrationsFolder = path.relative(repoRoot, migrationsFolder);
  const databaseUrl = runtime.env.KRN_DATABASE_URL?.trim();
  const targetMetadata = dbSmokeTargetMetadata[runtime.target];
  const environmentFingerprint = await collectEnvironmentFingerprint({
    repoRoot,
    databaseUrl,
    evaluatorVersion: `db-smoke:${runtime.target}`
  });

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    return attachEnvironmentFingerprint({
      exitCode: 1,
      stdout: output([
        targetMetadata.title,
        `Repo root: ${repoRoot}`,
        `Migrations folder: ${relativeMigrationsFolder}`,
        "Postgres config: missing KRN_DATABASE_URL",
        `Next action: export KRN_DATABASE_URL=${localDatabaseUrl} and start docker compose up -d krn-postgres`,
        targetMetadata.skippedLine
      ])
    }, environmentFingerprint);
  }

  const context = {
    repoRoot,
    migrationsFolder,
    relativeMigrationsFolder,
    databaseUrl
  };

  try {
    return attachEnvironmentFingerprint(
      await dbSmokeTargetHandlers[runtime.target](context, runtime),
      environmentFingerprint
    );
  } catch (error) {
    return attachEnvironmentFingerprint({
      exitCode: 1,
      stdout: output([
        targetMetadata.title,
        `Repo root: ${repoRoot}`,
        `Migrations folder: ${relativeMigrationsFolder}`,
        "Postgres config: configured",
        `${targetMetadata.failureLabel}: failed (${errorMessage(error)})`
      ])
    }, environmentFingerprint);
  }
};
