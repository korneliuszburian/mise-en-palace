import type { InferSelectModel } from "drizzle-orm";
import type {
  AntiMemoryRecord,
  ContextAssembly,
  ContextExclusion,
  ContextInclusion,
  DiffRisk,
  EvidenceBundle,
  EvidenceCommand,
  EvalCandidate,
  ExecutionRun,
  FeedbackDelta,
  MemoryApplication,
  MemoryCandidate,
  MemoryRecord,
  OperatorIntent,
  OperatorIntentSource,
  ReviewAssessment,
  ReviewFinding,
  SourceClaim,
  SourceDecision,
  SourceDecisionEdge,
  SourceLineageRef,
  SourceRejection,
  SourceTrustTier,
  TaskContract
} from "@krn/core";
import type {
  ActivationDecisionRecord,
  OutboxEventRecord,
  ProjectKernelRecord,
  ProjectRecord,
  RepoInstallationRecord,
  RetrievalCandidateRecord,
  RetrievalRunRecord,
  RunEventRecord,
  SourceArtifactRecord,
  SourceChunkRecord,
  WorkspaceRecord
} from "@krn/harness";
import type {
  activationDecisions,
  antiMemoryRecords,
  contextAssemblies,
  executionRuns,
  harnessPlans,
  memoryApplications,
  memoryCandidates,
  memoryRecords,
  operatorIntents,
  outboxEvents,
  projectKernels,
  projects,
  repoInstallations,
  retrievalCandidates,
  retrievalRuns,
  runEvents,
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
  optionalIsoTimestamp,
  stringListOrEmpty,
  toIsoTimestamp
} from "./common.js";

type WorkspaceRow = InferSelectModel<typeof workspaces>;
type ProjectRow = InferSelectModel<typeof projects>;
type RepoInstallationRow = InferSelectModel<typeof repoInstallations>;
type ProjectKernelRow = InferSelectModel<typeof projectKernels>;
type OperatorIntentRow = InferSelectModel<typeof operatorIntents>;
type TaskContractRow = InferSelectModel<typeof taskContracts>;
type HarnessPlanRow = InferSelectModel<typeof harnessPlans>;
type ContextAssemblyRow = InferSelectModel<typeof contextAssemblies>;
type ExecutionRunRow = InferSelectModel<typeof executionRuns>;
type MemoryRecordRow = InferSelectModel<typeof memoryRecords>;
type MemoryApplicationRow = InferSelectModel<typeof memoryApplications>;
type MemoryCandidateRow = InferSelectModel<typeof memoryCandidates>;
type AntiMemoryRecordRow = InferSelectModel<typeof antiMemoryRecords>;
type SourceArtifactRow = InferSelectModel<typeof sourceArtifacts>;
type SourceChunkRow = InferSelectModel<typeof sourceChunks>;
type SourceClaimRow = InferSelectModel<typeof sourceClaims>;
type SourceDecisionRow = InferSelectModel<typeof sourceDecisions>;
type SourceDecisionEdgeRow = InferSelectModel<typeof sourceDecisionEdges>;
type SourceRejectionRow = InferSelectModel<typeof sourceRejections>;
type RunEventRow = InferSelectModel<typeof runEvents>;
type OutboxEventRow = InferSelectModel<typeof outboxEvents>;
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
const memoryRecordKinds = new Set<MemoryCandidate["kind"]>([
  "fact",
  "preference",
  "constraint",
  "procedure",
  "pattern",
  "risk"
]);
const memoryCandidateStatuses = new Set<MemoryCandidate["status"]>([
  "proposed",
  "candidate",
  "accepted",
  "rejected",
  "applied",
  "superseded"
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

const sourceLineageOrEmpty = (value: unknown): SourceLineageRef[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is SourceLineageRef => {
    if (!isRecord(item) || typeof item.sourceId !== "string") {
      return false;
    }

    return item.note === undefined || typeof item.note === "string";
  });
};

const evidenceCommandsOrEmpty = (value: unknown): EvidenceCommand[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is EvidenceCommand => {
    if (!isRecord(item) || typeof item.command !== "string") {
      return false;
    }

    return item.status === "passed" || item.status === "failed" || item.status === "skipped";
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

const memoryCandidatesOrEmpty = (value: unknown): MemoryCandidate[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item): MemoryCandidate[] => {
    if (!isRecord(item)) {
      return [];
    }

    if (
      typeof item.id !== "string" ||
      typeof item.projectId !== "string" ||
      typeof item.proposedBy !== "string" ||
      !memoryRecordKinds.has(item.kind as MemoryCandidate["kind"]) ||
      !memoryCandidateStatuses.has(item.status as MemoryCandidate["status"]) ||
      typeof item.summary !== "string" ||
      typeof item.body !== "string" ||
      typeof item.owner !== "string" ||
      typeof item.confidence !== "number" ||
      typeof item.applicationGuidance !== "string" ||
      typeof item.isUserPreference !== "boolean" ||
      typeof item.createdAt !== "string" ||
      typeof item.updatedAt !== "string"
    ) {
      return [];
    }

    return [{
      id: item.id,
      projectId: item.projectId,
      ...(typeof item.executionRunId === "string" ? { executionRunId: item.executionRunId } : {}),
      ...(typeof item.feedbackDeltaId === "string"
        ? { feedbackDeltaId: item.feedbackDeltaId }
        : {}),
      proposedBy: item.proposedBy,
      kind: item.kind as MemoryCandidate["kind"],
      status: item.status as MemoryCandidate["status"],
      summary: item.summary,
      body: item.body,
      owner: item.owner,
      confidence: item.confidence,
      applicationGuidance: item.applicationGuidance,
      ...(typeof item.invalidationRule === "string"
        ? { invalidationRule: item.invalidationRule }
        : {}),
      sourceClaimIds: stringListOrEmpty(item.sourceClaimIds),
      sourceLineage: sourceLineageOrEmpty(item.sourceLineage),
      isUserPreference: item.isUserPreference,
      ...(typeof item.reviewer === "string" ? { reviewer: item.reviewer } : {}),
      ...(typeof item.reviewedAt === "string" ? { reviewedAt: item.reviewedAt } : {}),
      ...(typeof item.rejectionReason === "string"
        ? { rejectionReason: item.rejectionReason }
        : {}),
      validFrom: typeof item.validFrom === "string" ? item.validFrom : item.createdAt,
      ...(typeof item.validUntil === "string" ? { validUntil: item.validUntil } : {}),
      metadata: metadataOrEmpty(item.metadata),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }];
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

export const mapMemoryRecord = (row: MemoryRecordRow): MemoryRecord => {
  const validUntil = optionalIsoTimestamp(row.validUntil);
  const invalidatedAt = optionalIsoTimestamp(row.invalidatedAt);

  return {
    id: row.id,
    projectId: row.projectId,
    ...(row.currentVersionId === null ? {} : { currentVersionId: row.currentVersionId }),
    key: row.key,
    kind: row.kind,
    status: row.status,
    summary: row.summary,
    body: row.body,
    owner: row.owner,
    confidence: row.confidence,
    applicationGuidance: row.applicationGuidance,
    ...(row.invalidationRule === null ? {} : { invalidationRule: row.invalidationRule }),
    sourceLineage: sourceLineageOrEmpty(row.sourceLineage),
    isUserPreference: row.isUserPreference,
    validFrom: toIsoTimestamp(row.validFrom),
    ...(validUntil === undefined ? {} : { validUntil }),
    ...(invalidatedAt === undefined ? {} : { invalidatedAt }),
    ...(row.invalidationReason === null ? {} : { invalidationReason: row.invalidationReason }),
    positiveFeedbackCount: row.positiveFeedbackCount,
    negativeFeedbackCount: row.negativeFeedbackCount,
    metadata: metadataOrEmpty(row.metadata),
    createdAt: toIsoTimestamp(row.createdAt),
    updatedAt: toIsoTimestamp(row.updatedAt)
  };
};

export const mapMemoryCandidate = (row: MemoryCandidateRow): MemoryCandidate => {
  const reviewedAt = optionalIsoTimestamp(row.reviewedAt);
  const validUntil = optionalIsoTimestamp(row.validUntil);

  return {
    id: row.id,
    projectId: row.projectId,
    ...(row.executionRunId === null ? {} : { executionRunId: row.executionRunId }),
    ...(row.feedbackDeltaId === null ? {} : { feedbackDeltaId: row.feedbackDeltaId }),
    proposedBy: row.proposedBy,
    kind: row.kind,
    status: row.status,
    summary: row.summary,
    body: row.body,
    owner: row.owner,
    confidence: row.confidence,
    applicationGuidance: row.applicationGuidance,
    ...(row.invalidationRule === null ? {} : { invalidationRule: row.invalidationRule }),
    sourceClaimIds: stringListOrEmpty(row.sourceClaimIds),
    sourceLineage: sourceLineageOrEmpty(row.sourceLineage),
    isUserPreference: row.isUserPreference,
    ...(row.reviewer === null ? {} : { reviewer: row.reviewer }),
    ...(reviewedAt === undefined ? {} : { reviewedAt }),
    ...(row.rejectionReason === null ? {} : { rejectionReason: row.rejectionReason }),
    validFrom: toIsoTimestamp(row.validFrom),
    ...(validUntil === undefined ? {} : { validUntil }),
    metadata: metadataOrEmpty(row.metadata),
    createdAt: toIsoTimestamp(row.createdAt),
    updatedAt: toIsoTimestamp(row.updatedAt)
  };
};

export const mapMemoryApplication = (row: MemoryApplicationRow): MemoryApplication => ({
  id: row.id,
  memoryRecordId: row.memoryRecordId,
  ...(row.executionRunId === null ? {} : { executionRunId: row.executionRunId }),
  ...(row.taskContractId === null ? {} : { taskContractId: row.taskContractId }),
  ...(row.contextAssemblyId === null ? {} : { contextAssemblyId: row.contextAssemblyId }),
  expectedUse: row.expectedUse,
  ...(row.outcome === null ? {} : { outcome: row.outcome }),
  ...(row.notes === null ? {} : { notes: row.notes }),
  metadata: metadataOrEmpty(row.metadata),
  createdAt: toIsoTimestamp(row.createdAt)
});

export const mapAntiMemoryRecord = (row: AntiMemoryRecordRow): AntiMemoryRecord => {
  const validUntil = optionalIsoTimestamp(row.validUntil);
  const invalidatedAt = optionalIsoTimestamp(row.invalidatedAt);

  return {
    id: row.id,
    projectId: row.projectId,
    ...(row.executionRunId === null ? {} : { executionRunId: row.executionRunId }),
    key: row.key,
    ...(row.rejectedClaim === null ? {} : { rejectedClaim: row.rejectedClaim }),
    ...(row.reason === null ? {} : { reason: row.reason }),
    invalidatedBySourceClaimIds: stringListOrEmpty(row.invalidatedBySourceClaimIds),
    ...(row.invalidatedBySourceClaimId === null
      ? {}
      : { invalidatedBySourceClaimId: row.invalidatedBySourceClaimId }),
    ...(row.appliesTo === null ? {} : { appliesTo: row.appliesTo }),
    ...(row.mayRevisitWhen === null ? {} : { mayRevisitWhen: row.mayRevisitWhen }),
    summary: row.summary,
    body: row.body,
    owner: row.owner,
    confidence: row.confidence,
    sourceLineage: sourceLineageOrEmpty(row.sourceLineage),
    validFrom: toIsoTimestamp(row.validFrom),
    ...(validUntil === undefined ? {} : { validUntil }),
    ...(invalidatedAt === undefined ? {} : { invalidatedAt }),
    ...(row.invalidationReason === null ? {} : { invalidationReason: row.invalidationReason }),
    metadata: metadataOrEmpty(row.metadata),
    createdAt: toIsoTimestamp(row.createdAt),
    updatedAt: toIsoTimestamp(row.updatedAt)
  };
};

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

export const mapRetrievalRun = (row: RetrievalRunRow): RetrievalRunRecord => ({
  id: row.id,
  ...(row.projectId === null ? {} : { projectId: row.projectId }),
  ...(row.taskContractId === null ? {} : { taskContractId: row.taskContractId }),
  status: row.status,
  query: row.query,
  ...(row.tokenBudget === null ? {} : { tokenBudget: row.tokenBudget }),
  metadataFilters: metadataOrEmpty(row.metadataFilters),
  startedAt: toIsoTimestamp(row.startedAt),
  ...(row.completedAt === null ? {} : { completedAt: toIsoTimestamp(row.completedAt) }),
  metadata: metadataOrEmpty(row.metadata)
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
  trustTier: row.trustTier,
  ...(row.lexicalScore === null ? {} : { lexicalScore: row.lexicalScore }),
  ...(row.vectorScore === null ? {} : { vectorScore: row.vectorScore }),
  ...(row.graphScore === null ? {} : { graphScore: row.graphScore }),
  ...(row.temporalScore === null ? {} : { temporalScore: row.temporalScore }),
  ...(row.contextRoiScore === null ? {} : { contextRoiScore: row.contextRoiScore }),
  ...(row.totalScore === null ? {} : { totalScore: row.totalScore }),
  reason: row.reason,
  metadata: metadataOrEmpty(row.metadata),
  createdAt: toIsoTimestamp(row.createdAt)
});

export const mapActivationDecision = (
  row: ActivationDecisionRow
): ActivationDecisionRecord => ({
  id: row.id,
  retrievalRunId: row.retrievalRunId,
  ...(row.contextAssemblyId === null ? {} : { contextAssemblyId: row.contextAssemblyId }),
  subjectType: row.subjectType,
  subjectId: row.subjectId,
  decision: row.decision,
  reason: row.reason,
  ...(row.score === null ? {} : { score: row.score }),
  metadata: metadataOrEmpty(row.metadata),
  createdAt: toIsoTimestamp(row.createdAt)
});
