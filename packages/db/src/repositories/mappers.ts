import type { InferSelectModel } from "drizzle-orm";
import type {
  ContextAssembly,
  ContextExclusion,
  ContextInclusion,
  DiffRisk,
  EvidenceBundle,
  EvidenceCommandProvenance,
  EvidenceCommandStatus,
  EvalCandidate,
  ExecutionRun,
  FeedbackDelta,
  NormalizedEvidenceCommand,
  OperatorIntent,
  OperatorIntentSource,
  ReviewAssessment,
  ReviewFinding,
  SourceClaim,
  SourceDecision,
  SourceDecisionEdge,
  SourceRejection,
  SourceTrustTier,
  TaskContract
} from "@krn/core";
import {
  normalizeEvidenceCommand
} from "@krn/core";
import type {
  ActivationDecisionRecord,
  EmbeddingModelRecord,
  EmbeddingRecord,
  OutboxEventRecord,
  ProjectKernelRecord,
  ProjectRecord,
  RepoInstallationRecord,
  RetrievalCandidateRecord,
  RetrievalRunRecord,
  RunEventRecord,
  SearchDocumentRecord,
  SourceArtifactRecord,
  SourceChunkRecord,
  WorkspaceRecord
} from "@krn/harness/repositories/internal";
import type {
  activationDecisions,
  contextAssemblies,
  embeddingModels,
  embeddings,
  executionRuns,
  harnessPlans,
  operatorIntents,
  outboxEvents,
  projectKernels,
  projects,
  repoInstallations,
  retrievalCandidates,
  retrievalRuns,
  runEvents,
  searchDocuments,
  sourceArtifacts,
  sourceChunks,
  sourceClaims,
  sourceDecisionEdges,
  sourceDecisions,
  sourceRejections,
  taskContracts,
  workspaces
} from "../schema/index.js";
import {
  metadataOrEmpty,
  stringListOrEmpty,
  toIsoTimestamp
} from "./common.js";
import { memoryCandidatesOrEmpty } from "./memoryMappers.js";

export {
  mapAntiMemoryCandidate,
  mapAntiMemoryRecord,
  mapMemoryApplication,
  mapMemoryCandidate,
  mapMemoryFeedbackEvent,
  mapMemoryRecord
} from "./memoryMappers.js";

type WorkspaceRow = InferSelectModel<typeof workspaces>;
type ProjectRow = InferSelectModel<typeof projects>;
type RepoInstallationRow = InferSelectModel<typeof repoInstallations>;
type ProjectKernelRow = InferSelectModel<typeof projectKernels>;
type OperatorIntentRow = InferSelectModel<typeof operatorIntents>;
type TaskContractRow = InferSelectModel<typeof taskContracts>;
type HarnessPlanRow = InferSelectModel<typeof harnessPlans>;
type ContextAssemblyRow = InferSelectModel<typeof contextAssemblies>;
type ExecutionRunRow = InferSelectModel<typeof executionRuns>;
type SourceArtifactRow = InferSelectModel<typeof sourceArtifacts>;
type SourceChunkRow = InferSelectModel<typeof sourceChunks>;
type SourceClaimRow = InferSelectModel<typeof sourceClaims>;
type SourceDecisionRow = InferSelectModel<typeof sourceDecisions>;
type SourceDecisionEdgeRow = InferSelectModel<typeof sourceDecisionEdges>;
type SourceRejectionRow = InferSelectModel<typeof sourceRejections>;
type RunEventRow = InferSelectModel<typeof runEvents>;
type OutboxEventRow = InferSelectModel<typeof outboxEvents>;
type SearchDocumentRow = InferSelectModel<typeof searchDocuments>;
type EmbeddingModelRow = InferSelectModel<typeof embeddingModels>;
type EmbeddingRow = InferSelectModel<typeof embeddings>;
type RetrievalRunRow = InferSelectModel<typeof retrievalRuns>;
type RetrievalCandidateRow = InferSelectModel<typeof retrievalCandidates>;
type ActivationDecisionRow = InferSelectModel<typeof activationDecisions>;

const operatorIntentSources = new Set<OperatorIntentSource>([
  "goal",
  "cli",
  "api",
  "codex",
  "operator"
]);

const diffRisks = new Set<DiffRisk>(["low", "medium", "high"]);
const evidenceCommandStatuses = new Set<EvidenceCommandStatus>([
  "passed",
  "failed",
  "skipped",
  "missing",
  "not_run"
]);
const evidenceCommandProvenances = new Set<EvidenceCommandProvenance>([
  "default_template",
  "operator_reported",
  "captured_output_file",
  "command_runner",
  "external_log"
]);
const sourceDecisionStatuses = new Set<SourceDecision["status"]>([
  "adopt",
  "reject",
  "defer",
  "lab_test"
]);
const sourceTrustTiers = new Set<SourceTrustTier>([
  "high",
  "medium",
  "low",
  "primary",
  "official",
  "project-decision",
  "source-code",
  "paper",
  "practitioner",
  "secondary",
  "hypothesis"
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asOperatorIntentSource = (value: string): OperatorIntentSource => {
  if (operatorIntentSources.has(value as OperatorIntentSource)) {
    return value as OperatorIntentSource;
  }

  throw new Error(`Unknown operator intent source: ${value}`);
};

const asDiffRisk = (value: string): DiffRisk => {
  if (diffRisks.has(value as DiffRisk)) {
    return value as DiffRisk;
  }

  throw new Error(`Unknown evidence diff risk: ${value}`);
};

const isSourceTrustTier = (value: unknown): value is SourceTrustTier =>
  typeof value === "string" && sourceTrustTiers.has(value as SourceTrustTier);

const evidenceCommandsOrEmpty = (value: unknown): NormalizedEvidenceCommand[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item): NormalizedEvidenceCommand[] => {
    if (!isRecord(item) || typeof item.command !== "string") {
      return [];
    }

    if (!evidenceCommandStatuses.has(item.status as EvidenceCommandStatus)) {
      return [];
    }

    const provenance =
      typeof item.provenance === "string" &&
      evidenceCommandProvenances.has(item.provenance as EvidenceCommandProvenance)
        ? item.provenance as EvidenceCommandProvenance
        : undefined;

    return [normalizeEvidenceCommand({
      command: item.command,
      status: item.status as EvidenceCommandStatus,
      ...(provenance === undefined ? {} : { provenance }),
      ...(typeof item.exitCode === "number" ? { exitCode: item.exitCode } : {}),
      ...(typeof item.outputPath === "string" ? { outputPath: item.outputPath } : {}),
      ...(typeof item.outputRef === "string" ? { outputRef: item.outputRef } : {}),
      ...(typeof item.capturedAt === "string" ? { capturedAt: item.capturedAt } : {}),
      ...(typeof item.assertedBy === "string" ? { assertedBy: item.assertedBy } : {}),
      ...(typeof item.doesNotProve === "string" ? { doesNotProve: item.doesNotProve } : {})
    })];
  });
};

const reviewFindingsOrEmpty = (value: unknown): ReviewFinding[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is ReviewFinding => {
    if (!isRecord(item) || typeof item.message !== "string") {
      return false;
    }

    return item.severity === "low" || item.severity === "medium" || item.severity === "high";
  });
};

const sourceDecisionsOrEmpty = (value: unknown): SourceDecision[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item): SourceDecision[] => {
    if (!isRecord(item)) {
      return [];
    }

    if (
      typeof item.id !== "string" ||
      !sourceDecisionStatuses.has(item.status as SourceDecision["status"]) ||
      typeof item.decision !== "string" ||
      typeof item.rationale !== "string" ||
      typeof item.falsifier !== "string" ||
      typeof item.consumer !== "string" ||
      typeof item.createdAt !== "string" ||
      typeof item.updatedAt !== "string"
    ) {
      return [];
    }

    return [{
      id: item.id,
      ...(typeof item.projectId === "string" ? { projectId: item.projectId } : {}),
      ...(typeof item.sourceClaimId === "string" ? { sourceClaimId: item.sourceClaimId } : {}),
      status: item.status as SourceDecision["status"],
      decision: item.decision,
      rationale: item.rationale,
      falsifier: item.falsifier,
      consumer: item.consumer,
      metadata: metadataOrEmpty(item.metadata),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }];
  });
};

const contextInclusionsOrEmpty = (value: unknown): ContextInclusion[] => {
  const candidate = isRecord(value) ? value.inclusions : undefined;

  if (!Array.isArray(candidate)) {
    return [];
  }

  return candidate.filter((item): item is ContextInclusion => {
    if (!isRecord(item)) {
      return false;
    }

    return (
      typeof item.subjectType === "string" &&
      typeof item.subjectId === "string" &&
      typeof item.reason === "string" &&
      typeof item.expectedUse === "string" &&
      isSourceTrustTier(item.trustTier)
    );
  });
};

const contextExclusionsOrEmpty = (value: unknown): ContextExclusion[] => {
  const candidate = isRecord(value) ? value.exclusions : undefined;

  if (!Array.isArray(candidate)) {
    return [];
  }

  return candidate.filter((item): item is ContextExclusion => {
    if (!isRecord(item)) {
      return false;
    }

    return (
      typeof item.subjectType === "string" &&
      typeof item.subjectId === "string" &&
      typeof item.reason === "string" &&
      typeof item.explanation === "string" &&
      isSourceTrustTier(item.trustTier)
    );
  });
};

const vectorOrEmpty = (value: unknown): number[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is number => typeof item === "number");
};

const evalCandidatesOrEmpty = (value: unknown): EvalCandidate[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is EvalCandidate => {
    if (!isRecord(item)) {
      return false;
    }

    return (
      typeof item.id === "string" &&
      typeof item.title === "string" &&
      typeof item.scenario === "string" &&
      typeof item.expectedSignal === "string"
    );
  });
};

export const mapWorkspace = (row: WorkspaceRow): WorkspaceRecord => ({
  id: row.id,
  slug: row.slug,
  displayName: row.displayName,
  metadata: metadataOrEmpty(row.metadata),
  createdAt: toIsoTimestamp(row.createdAt),
  updatedAt: toIsoTimestamp(row.updatedAt)
});

export const mapProject = (row: ProjectRow): ProjectRecord => ({
  id: row.id,
  workspaceId: row.workspaceId,
  slug: row.slug,
  displayName: row.displayName,
  ...(row.description === null ? {} : { description: row.description }),
  metadata: metadataOrEmpty(row.metadata),
  createdAt: toIsoTimestamp(row.createdAt),
  updatedAt: toIsoTimestamp(row.updatedAt)
});

export const mapRepoInstallation = (row: RepoInstallationRow): RepoInstallationRecord => ({
  id: row.id,
  projectId: row.projectId,
  provider: row.provider,
  repoUrl: row.repoUrl,
  defaultBranch: row.defaultBranch,
  ...(row.repoFingerprint === null ? {} : { repoFingerprint: row.repoFingerprint }),
  ...(row.localPathHint === null ? {} : { localPathHint: row.localPathHint }),
  metadata: metadataOrEmpty(row.metadata),
  createdAt: toIsoTimestamp(row.createdAt),
  updatedAt: toIsoTimestamp(row.updatedAt)
});

export const mapProjectKernel = (row: ProjectKernelRow): ProjectKernelRecord => ({
  id: row.id,
  projectId: row.projectId,
  version: row.version,
  summary: row.summary,
  activeContextRule: row.activeContextRule,
  metadata: metadataOrEmpty(row.metadata),
  createdAt: toIsoTimestamp(row.createdAt),
  updatedAt: toIsoTimestamp(row.updatedAt)
});

export const mapOperatorIntent = (row: OperatorIntentRow): OperatorIntent => ({
  id: row.id,
  workspaceId: row.workspaceId,
  ...(row.projectId === null ? {} : { projectId: row.projectId }),
  source: asOperatorIntentSource(row.source),
  rawIntent: row.rawIntent,
  ...(row.normalizedIntent === null ? {} : { normalizedIntent: row.normalizedIntent }),
  metadata: metadataOrEmpty(row.metadata),
  createdAt: toIsoTimestamp(row.createdAt)
});

export const mapTaskContract = (row: TaskContractRow): TaskContract => ({
  id: row.id,
  operatorIntentId: row.operatorIntentId,
  ...(row.projectId === null ? {} : { projectId: row.projectId }),
  title: row.title,
  objective: row.objective,
  constraints: stringListOrEmpty(row.constraints),
  nonGoals: stringListOrEmpty(row.nonGoals),
  acceptance: stringListOrEmpty(row.acceptance),
  status: row.status,
  metadata: metadataOrEmpty(row.metadata),
  createdAt: toIsoTimestamp(row.createdAt),
  updatedAt: toIsoTimestamp(row.updatedAt)
});

export const mapHarnessPlan = (row: HarnessPlanRow) => ({
  id: row.id,
  taskContractId: row.taskContractId,
  version: row.version,
  status: row.status,
  summary: row.summary,
  ...(row.nextAction === null ? {} : { nextAction: row.nextAction }),
  metadata: metadataOrEmpty(row.metadata),
  createdAt: toIsoTimestamp(row.createdAt),
  updatedAt: toIsoTimestamp(row.updatedAt)
});

export const mapContextAssembly = (row: ContextAssemblyRow): ContextAssembly => ({
  id: row.id,
  harnessPlanId: row.harnessPlanId,
  status: row.status,
  ...(row.tokenBudget === null ? {} : { tokenBudget: row.tokenBudget }),
  inclusions: contextInclusionsOrEmpty(row.selectedContext),
  exclusions: contextExclusionsOrEmpty(row.excludedContext),
  metadata: metadataOrEmpty(row.metadata),
  createdAt: toIsoTimestamp(row.createdAt)
});

export const mapExecutionRun = (row: ExecutionRunRow): ExecutionRun => ({
  id: row.id,
  harnessPlanId: row.harnessPlanId,
  adapter: row.adapter,
  status: row.status,
  ...(row.startedAt === null ? {} : { startedAt: toIsoTimestamp(row.startedAt) }),
  ...(row.completedAt === null ? {} : { completedAt: toIsoTimestamp(row.completedAt) }),
  metadata: metadataOrEmpty(row.metadata),
  createdAt: toIsoTimestamp(row.createdAt),
  updatedAt: toIsoTimestamp(row.updatedAt)
});

export const mapEvidenceBundle = (
  row: {
    id: string;
    executionRunId: string;
    status: EvidenceBundle["status"];
    changedFiles: unknown;
    commands: unknown;
    diffRisk: string;
    reviewBurden: string;
    rollbackPath: string;
    metadata: unknown;
    createdAt: Date;
    updatedAt: Date;
  }
): EvidenceBundle => ({
  id: row.id,
  executionRunId: row.executionRunId,
  status: row.status,
  changedFiles: stringListOrEmpty(row.changedFiles),
  commands: evidenceCommandsOrEmpty(row.commands),
  diffRisk: asDiffRisk(row.diffRisk),
  reviewBurden: row.reviewBurden,
  rollbackPath: row.rollbackPath,
  metadata: metadataOrEmpty(row.metadata),
  createdAt: toIsoTimestamp(row.createdAt),
  updatedAt: toIsoTimestamp(row.updatedAt)
});

export const mapReviewAssessment = (
  row: {
    id: string;
    evidenceBundleId: string;
    status: ReviewAssessment["status"];
    reviewer: string;
    summary: string;
    findings: unknown;
    metadata: unknown;
    createdAt: Date;
    updatedAt: Date;
  }
): ReviewAssessment => ({
  id: row.id,
  evidenceBundleId: row.evidenceBundleId,
  status: row.status,
  reviewer: row.reviewer,
  summary: row.summary,
  findings: reviewFindingsOrEmpty(row.findings),
  metadata: metadataOrEmpty(row.metadata),
  createdAt: toIsoTimestamp(row.createdAt),
  updatedAt: toIsoTimestamp(row.updatedAt)
});

export const mapFeedbackDelta = (
  row: {
    id: string;
    reviewAssessmentId: string;
    status: FeedbackDelta["status"];
    memoryCandidates: unknown;
    sourceDecisions: unknown;
    evalCandidates: unknown;
    metadata: unknown;
    createdAt: Date;
    updatedAt: Date;
  }
): FeedbackDelta => ({
  id: row.id,
  reviewAssessmentId: row.reviewAssessmentId,
  status: row.status,
  memoryCandidates: memoryCandidatesOrEmpty(row.memoryCandidates),
  sourceDecisions: sourceDecisionsOrEmpty(row.sourceDecisions),
  evalCandidates: evalCandidatesOrEmpty(row.evalCandidates),
  metadata: metadataOrEmpty(row.metadata),
  createdAt: toIsoTimestamp(row.createdAt),
  updatedAt: toIsoTimestamp(row.updatedAt)
});

export const mapSourceArtifact = (row: SourceArtifactRow): SourceArtifactRecord => ({
  id: row.id,
  ...(row.projectId === null ? {} : { projectId: row.projectId }),
  kind: row.kind,
  trustTier: row.trustTier,
  uri: row.uri,
  title: row.title,
  contentHash: row.contentHash,
  capturedAt: toIsoTimestamp(row.capturedAt),
  metadata: metadataOrEmpty(row.metadata),
  createdAt: toIsoTimestamp(row.createdAt),
  updatedAt: toIsoTimestamp(row.updatedAt)
});

export const mapSourceChunk = (row: SourceChunkRow): SourceChunkRecord => ({
  id: row.id,
  sourceArtifactId: row.sourceArtifactId,
  ordinal: row.ordinal,
  ...(row.heading === null ? {} : { heading: row.heading }),
  content: row.content,
  ...(row.tokenCount === null ? {} : { tokenCount: row.tokenCount }),
  contentHash: row.contentHash,
  metadata: metadataOrEmpty(row.metadata),
  createdAt: toIsoTimestamp(row.createdAt)
});

export const mapSourceClaim = (row: SourceClaimRow): SourceClaim => ({
  id: row.id,
  sourceArtifactId: row.sourceArtifactId,
  ...(row.sourceChunkId === null ? {} : { sourceChunkId: row.sourceChunkId }),
  ...(row.executionRunId === null ? {} : { executionRunId: row.executionRunId }),
  claim: row.claim,
  mechanism: row.mechanism,
  krnImplication: row.krnImplication,
  doesNotProve: row.doesNotProve,
  trustTier: row.trustTier,
  supportType: row.supportType,
  consumer: row.consumer,
  ...(row.falsifier === null ? {} : { falsifier: row.falsifier }),
  ...(row.revisitWhen === null ? {} : { revisitWhen: row.revisitWhen }),
  status: row.status,
  metadata: metadataOrEmpty(row.metadata),
  createdAt: toIsoTimestamp(row.createdAt),
  updatedAt: toIsoTimestamp(row.updatedAt)
});

export const mapSourceDecision = (row: SourceDecisionRow): SourceDecision => ({
  id: row.id,
  ...(row.projectId === null ? {} : { projectId: row.projectId }),
  ...(row.sourceClaimId === null ? {} : { sourceClaimId: row.sourceClaimId }),
  status: row.status,
  decision: row.decision,
  rationale: row.rationale,
  falsifier: row.falsifier,
  consumer: row.consumer,
  metadata: metadataOrEmpty(row.metadata),
  createdAt: toIsoTimestamp(row.createdAt),
  updatedAt: toIsoTimestamp(row.updatedAt)
});

export const mapSourceDecisionEdge = (
  row: SourceDecisionEdgeRow
): SourceDecisionEdge => ({
  id: row.id,
  sourceClaimId: row.sourceClaimId,
  targetType: row.targetType,
  targetId: row.targetId,
  supportType: row.supportType,
  confidence: row.confidence,
  notes: row.notes,
  metadata: metadataOrEmpty(row.metadata),
  createdAt: toIsoTimestamp(row.createdAt)
});

export const mapSourceRejection = (row: SourceRejectionRow): SourceRejection => ({
  id: row.id,
  ...(row.projectId === null ? {} : { projectId: row.projectId }),
  ...(row.executionRunId === null ? {} : { executionRunId: row.executionRunId }),
  ...(row.sourceArtifactId === null ? {} : { sourceArtifactId: row.sourceArtifactId }),
  ...(row.sourceClaimId === null ? {} : { sourceClaimId: row.sourceClaimId }),
  title: row.title,
  attemptedClaim: row.attemptedClaim,
  rejectedBecause: row.rejectedBecause,
  reason: row.reason,
  doesNotProve: row.doesNotProve,
  consumer: row.consumer,
  metadata: metadataOrEmpty(row.metadata),
  rejectedAt: toIsoTimestamp(row.rejectedAt)
});

export const mapRunEvent = (row: RunEventRow): RunEventRecord => ({
  id: row.id,
  ...(row.executionRunId === null ? {} : { executionRunId: row.executionRunId }),
  sequence: row.sequence,
  type: row.type,
  severity: row.severity,
  message: row.message,
  payload: metadataOrEmpty(row.payload),
  occurredAt: toIsoTimestamp(row.occurredAt)
});

export const mapOutboxEvent = (row: OutboxEventRow): OutboxEventRecord => ({
  id: row.id,
  topic: row.topic,
  status: row.status,
  payload: metadataOrEmpty(row.payload),
  attempts: row.attempts,
  availableAt: toIsoTimestamp(row.availableAt),
  ...(row.lockedAt === null ? {} : { lockedAt: toIsoTimestamp(row.lockedAt) }),
  ...(row.lockedBy === null ? {} : { lockedBy: row.lockedBy }),
  ...(row.lastError === null ? {} : { lastError: row.lastError }),
  createdAt: toIsoTimestamp(row.createdAt),
  updatedAt: toIsoTimestamp(row.updatedAt)
});

export const mapSearchDocument = (row: SearchDocumentRow): SearchDocumentRecord => ({
  id: row.id,
  ...(row.projectId === null ? {} : { projectId: row.projectId }),
  subjectType: row.subjectType,
  subjectId: row.subjectId,
  ...(row.sourceArtifactId === null ? {} : { sourceArtifactId: row.sourceArtifactId }),
  ...(row.sourceChunkId === null ? {} : { sourceChunkId: row.sourceChunkId }),
  ...(row.sourceClaimId === null ? {} : { sourceClaimId: row.sourceClaimId }),
  ...(row.memoryRecordId === null ? {} : { memoryRecordId: row.memoryRecordId }),
  ...(row.antiMemoryRecordId === null ? {} : { antiMemoryRecordId: row.antiMemoryRecordId }),
  ...(row.evidenceBundleId === null ? {} : { evidenceBundleId: row.evidenceBundleId }),
  ...(row.reviewAssessmentId === null ? {} : { reviewAssessmentId: row.reviewAssessmentId }),
  ...(row.sourceDecisionId === null ? {} : { sourceDecisionId: row.sourceDecisionId }),
  ...(row.runEventId === null ? {} : { runEventId: row.runEventId }),
  trustTier: row.trustTier,
  validityStatus: row.validityStatus,
  language: row.language,
  title: row.title,
  body: row.body,
  searchText: row.searchText,
  metadataFilters: metadataOrEmpty(row.metadataFilters),
  validFrom: toIsoTimestamp(row.validFrom),
  ...(row.validUntil === null ? {} : { validUntil: toIsoTimestamp(row.validUntil) }),
  ...(row.invalidatedAt === null ? {} : { invalidatedAt: toIsoTimestamp(row.invalidatedAt) }),
  metadata: metadataOrEmpty(row.metadata),
  createdAt: toIsoTimestamp(row.createdAt),
  updatedAt: toIsoTimestamp(row.updatedAt)
});

export const mapEmbeddingModel = (row: EmbeddingModelRow): EmbeddingModelRecord => ({
  id: row.id,
  provider: row.provider,
  model: row.model,
  dimensions: row.dimensions,
  distanceMetric: row.distanceMetric,
  status: row.status,
  metadata: metadataOrEmpty(row.metadata),
  createdAt: toIsoTimestamp(row.createdAt),
  updatedAt: toIsoTimestamp(row.updatedAt)
});

export const mapEmbedding = (row: EmbeddingRow): EmbeddingRecord => ({
  id: row.id,
  ...(row.projectId === null ? {} : { projectId: row.projectId }),
  embeddingModelId: row.embeddingModelId,
  subjectType: row.subjectType,
  subjectId: row.subjectId,
  ...(row.sourceArtifactId === null ? {} : { sourceArtifactId: row.sourceArtifactId }),
  ...(row.sourceChunkId === null ? {} : { sourceChunkId: row.sourceChunkId }),
  ...(row.sourceClaimId === null ? {} : { sourceClaimId: row.sourceClaimId }),
  ...(row.memoryRecordId === null ? {} : { memoryRecordId: row.memoryRecordId }),
  ...(row.antiMemoryRecordId === null ? {} : { antiMemoryRecordId: row.antiMemoryRecordId }),
  ...(row.searchDocumentId === null ? {} : { searchDocumentId: row.searchDocumentId }),
  embedding: vectorOrEmpty(row.embedding),
  contentHash: row.contentHash,
  trustTier: row.trustTier,
  validityStatus: row.validityStatus,
  metadataFilters: metadataOrEmpty(row.metadataFilters),
  validFrom: toIsoTimestamp(row.validFrom),
  ...(row.validUntil === null ? {} : { validUntil: toIsoTimestamp(row.validUntil) }),
  ...(row.invalidatedAt === null ? {} : { invalidatedAt: toIsoTimestamp(row.invalidatedAt) }),
  metadata: metadataOrEmpty(row.metadata),
  createdAt: toIsoTimestamp(row.createdAt),
  updatedAt: toIsoTimestamp(row.updatedAt)
});

export const mapRetrievalRun = (row: RetrievalRunRow): RetrievalRunRecord => ({
  id: row.id,
  ...(row.projectId === null ? {} : { projectId: row.projectId }),
  ...(row.executionRunId === null ? {} : { executionRunId: row.executionRunId }),
  ...(row.taskContractId === null ? {} : { taskContractId: row.taskContractId }),
  status: row.status,
  query: row.query,
  mode: row.mode,
  ...(row.budget === null ? {} : { budget: row.budget }),
  ...(row.tokenBudget === null ? {} : { tokenBudget: row.tokenBudget }),
  metadataFilters: metadataOrEmpty(row.metadataFilters),
  startedAt: toIsoTimestamp(row.startedAt),
  ...(row.completedAt === null ? {} : { completedAt: toIsoTimestamp(row.completedAt) }),
  metadata: metadataOrEmpty(row.metadata),
  createdAt: toIsoTimestamp(row.createdAt)
});

export const mapRetrievalCandidate = (
  row: RetrievalCandidateRow
): RetrievalCandidateRecord => ({
  id: row.id,
  retrievalRunId: row.retrievalRunId,
  kind: row.kind,
  status: row.status,
  subjectType: row.subjectType,
  subjectId: row.subjectId,
  ...(row.searchDocumentId === null ? {} : { searchDocumentId: row.searchDocumentId }),
  trustTier: row.trustTier,
  ...(row.lexicalScore === null ? {} : { lexicalScore: row.lexicalScore }),
  ...(row.vectorScore === null ? {} : { vectorScore: row.vectorScore }),
  ...(row.graphScore === null ? {} : { graphScore: row.graphScore }),
  ...(row.temporalScore === null ? {} : { temporalScore: row.temporalScore }),
  ...(row.contextRoiScore === null ? {} : { contextRoiScore: row.contextRoiScore }),
  ...(row.totalScore === null ? {} : { totalScore: row.totalScore }),
  ...(row.score === null ? {} : { score: row.score }),
  reason: row.reason,
  metadata: metadataOrEmpty(row.metadata),
  createdAt: toIsoTimestamp(row.createdAt)
});

export const mapActivationDecision = (
  row: ActivationDecisionRow
): ActivationDecisionRecord => ({
  id: row.id,
  retrievalRunId: row.retrievalRunId,
  ...(row.retrievalCandidateId === null
    ? {}
    : { retrievalCandidateId: row.retrievalCandidateId }),
  ...(row.contextAssemblyId === null ? {} : { contextAssemblyId: row.contextAssemblyId }),
  subjectType: row.subjectType,
  subjectId: row.subjectId,
  decision: row.decision,
  reason: row.reason,
  ...(row.score === null ? {} : { score: row.score }),
  ...(row.contextBudgetCost === null ? {} : { contextBudgetCost: row.contextBudgetCost }),
  ...(row.expectedDecisionImpact === null
    ? {}
    : { expectedDecisionImpact: row.expectedDecisionImpact }),
  metadata: metadataOrEmpty(row.metadata),
  createdAt: toIsoTimestamp(row.createdAt)
});
