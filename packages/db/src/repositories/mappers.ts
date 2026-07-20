import type { InferSelectModel } from "drizzle-orm";
import type {
  ContextAssembly,
  ContextExclusion,
  ContextInclusion,
  CommandOutputArtifact,
  DiffRisk,
  EvidenceBundle,
  EvidenceCommand,
  EvidenceCommandProvenance,
  EvidenceCommandStatus,
  EvalCandidateProposal,
  ExecutionRun,
  FeedbackDelta,
  HarnessPlan,
  EvidenceCommandReadback,
  OperatorIntent,
  OperatorIntentSource,
  ReviewAssessment,
  ReviewFinding,
  SourceClaim,
  SourceClaimEdge,
  SourceDecision,
  SourceDecisionEdge,
  SourceRejection,
  SourceAuthorityLabel,
  TaskContract
} from "@krn/core";
import {
  evidenceCommandStatuses,
  toEvidenceCommandReadback,
  sourceAuthorityLabels
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
} from "@krn/core/repositories/internal";
import type {
  activationDecisions,
  contextAssemblies,
  evidenceCommandArtifacts,
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
  sourceClaimEdges,
  sourceClaims,
  sourceDecisionEdges,
  sourceDecisions,
  sourceRejections,
  taskContracts,
  workspaces
} from "../schema/index.js";
import {
  isRecord,
  metadataOrEmpty,
  numberOrUndefined,
  stringOrUndefined,
  stringListOrEmpty,
  toIsoTimestamp
} from "./repository-value-readers.js";
import { mapLockedRowMetadataFields } from "./locked-row-metadata.js";
import { memoryCandidatesOrEmpty } from "./memory-mappers.js";

export {
  mapAntiMemoryCandidate,
  mapAntiMemoryRecord,
  mapMemoryApplication,
  mapMemoryCandidate,
  mapMemoryFeedbackEvent,
  mapMemoryRecord
} from "./memory-mappers.js";

type WorkspaceRow = InferSelectModel<typeof workspaces>;
type ProjectRow = InferSelectModel<typeof projects>;
type RepoInstallationRow = InferSelectModel<typeof repoInstallations>;
type ProjectKernelRow = InferSelectModel<typeof projectKernels>;
type OperatorIntentRow = InferSelectModel<typeof operatorIntents>;
type TaskContractRow = InferSelectModel<typeof taskContracts>;
type HarnessPlanRow = InferSelectModel<typeof harnessPlans>;
type ContextAssemblyRow = InferSelectModel<typeof contextAssemblies>;
type ExecutionRunRow = InferSelectModel<typeof executionRuns>;
type EvidenceCommandArtifactRow = InferSelectModel<typeof evidenceCommandArtifacts>;
type SourceArtifactRow = InferSelectModel<typeof sourceArtifacts>;
type SourceChunkRow = InferSelectModel<typeof sourceChunks>;
type SourceClaimRow = InferSelectModel<typeof sourceClaims>;
type SourceClaimEdgeRow = InferSelectModel<typeof sourceClaimEdges>;
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

type RetrievalSubjectMappingFields = Pick<
  SearchDocumentRecord,
  | "projectId"
  | "subjectType"
  | "subjectId"
  | "sourceArtifactId"
  | "sourceChunkId"
  | "sourceClaimId"
  | "memoryRecordId"
  | "antiMemoryRecordId"
  | "sourceAuthority"
  | "validityStatus"
  | "metadataFilters"
  | "validFrom"
  | "validUntil"
  | "invalidatedAt"
  | "metadata"
  | "createdAt"
  | "updatedAt"
>;

interface RetrievalSubjectMappingRow {
  projectId: string | null;
  subjectType: SearchDocumentRecord["subjectType"];
  subjectId: string;
  sourceArtifactId: string | null;
  sourceChunkId: string | null;
  sourceClaimId: string | null;
  memoryRecordId: string | null;
  antiMemoryRecordId: string | null;
  sourceAuthority: SourceAuthorityLabel;
  validityStatus: SearchDocumentRecord["validityStatus"];
  metadataFilters: unknown;
  validFrom: Date;
  validUntil: Date | null;
  invalidatedAt: Date | null;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}

const mapRetrievalSubjectFields = (
  row: RetrievalSubjectMappingRow
): RetrievalSubjectMappingFields => ({
  ...(row.projectId === null ? {} : { projectId: row.projectId }),
  subjectType: row.subjectType,
  subjectId: row.subjectId,
  ...(row.sourceArtifactId === null ? {} : { sourceArtifactId: row.sourceArtifactId }),
  ...(row.sourceChunkId === null ? {} : { sourceChunkId: row.sourceChunkId }),
  ...(row.sourceClaimId === null ? {} : { sourceClaimId: row.sourceClaimId }),
  ...(row.memoryRecordId === null ? {} : { memoryRecordId: row.memoryRecordId }),
  ...(row.antiMemoryRecordId === null ? {} : { antiMemoryRecordId: row.antiMemoryRecordId }),
  sourceAuthority: row.sourceAuthority,
  validityStatus: row.validityStatus,
  metadataFilters: metadataOrEmpty(row.metadataFilters),
  validFrom: toIsoTimestamp(row.validFrom),
  ...(row.validUntil === null ? {} : { validUntil: toIsoTimestamp(row.validUntil) }),
  ...(row.invalidatedAt === null ? {} : { invalidatedAt: toIsoTimestamp(row.invalidatedAt) }),
  metadata: metadataOrEmpty(row.metadata),
  createdAt: toIsoTimestamp(row.createdAt),
  updatedAt: toIsoTimestamp(row.updatedAt)
});

const operatorIntentSources: ReadonlySet<string> = new Set([
  "goal",
  "cli",
  "api",
  "codex",
  "operator"
]);

const diffRisks: ReadonlySet<string> = new Set(["low", "medium", "high"]);
const evidenceCommandStatusSet: ReadonlySet<string> = new Set(evidenceCommandStatuses);
const evidenceCommandProvenances: ReadonlySet<string> = new Set([
  "default_template",
  "operator_reported",
  "captured_output_file",
  "command_runner",
  "external_log"
]);
const sourceDecisionStatuses: ReadonlySet<string> = new Set([
  "adopt",
  "reject",
  "defer",
  "lab_test"
]);
const sourceAuthorityLabelSet: ReadonlySet<string> = new Set(sourceAuthorityLabels);

const isOperatorIntentSource = (value: unknown): value is OperatorIntentSource =>
  typeof value === "string" && operatorIntentSources.has(value);

const isDiffRisk = (value: unknown): value is DiffRisk =>
  typeof value === "string" && diffRisks.has(value);

const isEvidenceCommandStatus = (value: unknown): value is EvidenceCommandStatus =>
  typeof value === "string" && evidenceCommandStatusSet.has(value);

const isEvidenceCommandProvenance = (
  value: unknown
): value is EvidenceCommandProvenance =>
  typeof value === "string" && evidenceCommandProvenances.has(value);

const isSourceDecisionStatus = (value: unknown): value is SourceDecision["status"] =>
  typeof value === "string" && sourceDecisionStatuses.has(value);

const asOperatorIntentSource = (value: string): OperatorIntentSource => {
  if (isOperatorIntentSource(value)) {
    return value;
  }

  throw new Error(`Unknown operator intent source: ${value}`);
};

const asDiffRisk = (value: string): DiffRisk => {
  if (isDiffRisk(value)) {
    return value;
  }

  throw new Error(`Unknown evidence diff risk: ${value}`);
};

const isSourceAuthorityLabel = (value: unknown): value is SourceAuthorityLabel =>
  typeof value === "string" && sourceAuthorityLabelSet.has(value);

const evidenceCommandStatusOrUndefined = (
  value: unknown
): EvidenceCommandStatus | undefined =>
  isEvidenceCommandStatus(value) ? value : undefined;

const evidenceCommandProvenanceOrUndefined = (
  value: unknown
): EvidenceCommandProvenance | undefined =>
  isEvidenceCommandProvenance(value) ? value : undefined;

const optionalEvidenceCommandFields = (
  item: Record<string, unknown>
): Partial<Omit<EvidenceCommand, "command" | "status">> => {
  const provenance = evidenceCommandProvenanceOrUndefined(item.provenance);
  const exitCode = numberOrUndefined(item.exitCode);
  const outputPath = stringOrUndefined(item.outputPath);
  const outputRef = stringOrUndefined(item.outputRef);
  const capturedAt = stringOrUndefined(item.capturedAt);
  const assertedBy = stringOrUndefined(item.assertedBy);
  const doesNotProve = stringOrUndefined(item.doesNotProve);

  return {
    ...(provenance === undefined ? {} : { provenance }),
    ...(exitCode === undefined ? {} : { exitCode }),
    ...(outputPath === undefined ? {} : { outputPath }),
    ...(outputRef === undefined ? {} : { outputRef }),
    ...(capturedAt === undefined ? {} : { capturedAt }),
    ...(assertedBy === undefined ? {} : { assertedBy }),
    ...(doesNotProve === undefined ? {} : { doesNotProve })
  };
};

const evidenceCommandReadbackOrUndefined = (
  item: unknown
): EvidenceCommandReadback | undefined => {
  if (!isRecord(item) || typeof item.command !== "string") {
    return undefined;
  }

  const status = evidenceCommandStatusOrUndefined(item.status);

  if (status === undefined) {
    return undefined;
  }

  return toEvidenceCommandReadback({
    command: item.command,
    status,
    ...optionalEvidenceCommandFields(item)
  });
};

const evidenceCommandsOrEmpty = (value: unknown): EvidenceCommandReadback[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item): EvidenceCommandReadback[] => {
    const command = evidenceCommandReadbackOrUndefined(item);

    return command === undefined ? [] : [command];
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

const hasStringFields = <K extends string>(
  item: Record<string, unknown>,
  fields: readonly K[]
): item is Record<string, unknown> & Record<K, string> =>
  fields.every((field) => typeof item[field] === "string");

const sourceDecisionStatusOrUndefined = (
  value: unknown
): SourceDecision["status"] | undefined =>
  isSourceDecisionStatus(value) ? value : undefined;

const sourceDecisionStringFields = [
  "id",
  "decision",
  "rationale",
  "falsifier",
  "consumer",
  "createdAt",
  "updatedAt"
] as const;

const sourceDecisionOrUndefined = (item: unknown): SourceDecision | undefined => {
  if (!isRecord(item)) {
    return undefined;
  }

  const status = sourceDecisionStatusOrUndefined(item.status);

  if (status === undefined || !hasStringFields(item, sourceDecisionStringFields)) {
    return undefined;
  }

  return {
    id: item.id,
    ...(typeof item.projectId === "string" ? { projectId: item.projectId } : {}),
    ...(typeof item.sourceClaimId === "string" ? { sourceClaimId: item.sourceClaimId } : {}),
    status,
    decision: item.decision,
    rationale: item.rationale,
    falsifier: item.falsifier,
    consumer: item.consumer,
    metadata: metadataOrEmpty(item.metadata),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
};

const sourceDecisionsOrEmpty = (value: unknown): SourceDecision[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item): SourceDecision[] => {
    const decision = sourceDecisionOrUndefined(item);

    return decision === undefined ? [] : [decision];
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

    const supportingEvidence = item.supportingEvidence;
    const supportingEvidenceValid = supportingEvidence === undefined || (
      isRecord(supportingEvidence) &&
      typeof supportingEvidence.searchDocumentId === "string" &&
      typeof supportingEvidence.sourceArtifactId === "string" &&
      typeof supportingEvidence.sourceChunkId === "string" &&
      typeof supportingEvidence.contentHash === "string" &&
      typeof supportingEvidence.renderedContentHash === "string" &&
      (supportingEvidence.sourceRange === undefined || typeof supportingEvidence.sourceRange === "string") &&
      typeof supportingEvidence.content === "string" &&
      typeof supportingEvidence.truncated === "boolean"
    );

    return supportingEvidenceValid && (
      typeof item.subjectType === "string" &&
      typeof item.subjectId === "string" &&
      typeof item.reason === "string" &&
      typeof item.expectedUse === "string" &&
      isSourceAuthorityLabel(item.sourceAuthority)
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
      isSourceAuthorityLabel(item.sourceAuthority)
    );
  });
};

const vectorOrEmpty = (value: unknown): number[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is number => typeof item === "number");
};

const evalCandidateStringFields = [
  "id",
  "title",
  "scenario",
  "expectedSignal",
  "createdAt"
] as const;

const evalCandidateProposalOrUndefined = (
  item: unknown
): EvalCandidateProposal | undefined => {
  if (!isRecord(item)) {
    return undefined;
  }

  const status = typeof item.status === "string" ? item.status : undefined;

  if (status !== undefined && status !== "candidate") {
    return undefined;
  }

  if (!hasStringFields(item, evalCandidateStringFields)) {
    return undefined;
  }

  return {
    id: item.id,
    ...(typeof item.projectId === "string" ? { projectId: item.projectId } : {}),
    status: "candidate",
    title: item.title,
    scenario: item.scenario,
    expectedSignal: item.expectedSignal,
    sourceEvidence: stringListOrEmpty(item.sourceEvidence),
    metadata: metadataOrEmpty(item.metadata),
    createdAt: item.createdAt
  };
};

const evalCandidatesOrEmpty = (value: unknown): EvalCandidateProposal[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item): EvalCandidateProposal[] => {
    const candidate = evalCandidateProposalOrUndefined(item);

    return candidate === undefined ? [] : [candidate];
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
  status: row.status,
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

export const mapHarnessPlan = (row: HarnessPlanRow): HarnessPlan => ({
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
  lifecycleRevision: row.lifecycleRevision,
  ...(row.startedAt === null ? {} : { startedAt: toIsoTimestamp(row.startedAt) }),
  ...(row.completedAt === null ? {} : { completedAt: toIsoTimestamp(row.completedAt) }),
  metadata: metadataOrEmpty(row.metadata),
  createdAt: toIsoTimestamp(row.createdAt),
  updatedAt: toIsoTimestamp(row.updatedAt)
});

export const mapCommandOutputArtifact = (
  row: EvidenceCommandArtifactRow
): CommandOutputArtifact => ({
  outputRef: row.outputRef,
  command: row.command,
  exitCode: row.exitCode,
  startedAt: toIsoTimestamp(row.startedAt),
  completedAt: toIsoTimestamp(row.completedAt),
  stdout: {
    bytes: new Uint8Array(row.stdoutBytes),
    storedByteCount: row.stdoutBytes.byteLength,
    totalByteCount: row.stdoutTotalByteCount,
    truncated: row.stdoutTruncated,
    sha256: row.stdoutSha256
  },
  stderr: {
    bytes: new Uint8Array(row.stderrBytes),
    storedByteCount: row.stderrBytes.byteLength,
    totalByteCount: row.stderrTotalByteCount,
    truncated: row.stderrTruncated,
    sha256: row.stderrSha256
  }
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
  },
  commandOutputArtifacts: readonly CommandOutputArtifact[] = []
): EvidenceBundle => ({
  id: row.id,
  executionRunId: row.executionRunId,
  status: row.status,
  changedFiles: stringListOrEmpty(row.changedFiles),
  commands: evidenceCommandsOrEmpty(row.commands),
  ...(commandOutputArtifacts.length === 0
    ? {}
    : { commandOutputArtifacts: [...commandOutputArtifacts] }),
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
  ...(row.importId === null ? {} : { importId: row.importId }),
  ...(row.importRowId === null ? {} : { importRowId: row.importRowId }),
  kind: row.kind,
  sourceAuthority: row.sourceAuthority,
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
  sourceAuthority: row.sourceAuthority,
  supportType: row.supportType,
  consumer: row.consumer,
  ...(row.falsifier === null ? {} : { falsifier: row.falsifier }),
  ...(row.revisitWhen === null ? {} : { revisitWhen: row.revisitWhen }),
  status: row.status,
  metadata: metadataOrEmpty(row.metadata),
  createdAt: toIsoTimestamp(row.createdAt),
  updatedAt: toIsoTimestamp(row.updatedAt)
});

export const mapSourceClaimEdge = (row: SourceClaimEdgeRow): SourceClaimEdge => ({
  id: row.id,
  fromSourceClaimId: row.fromSourceClaimId,
  toSourceClaimId: row.toSourceClaimId,
  kind: row.kind,
  metadata: metadataOrEmpty(row.metadata),
  createdAt: toIsoTimestamp(row.createdAt)
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
  ...(row.sourceDecisionId === null ? {} : { sourceDecisionId: row.sourceDecisionId }),
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
  ...mapLockedRowMetadataFields(row)
});

export const mapSearchDocument = (row: SearchDocumentRow): SearchDocumentRecord => ({
  id: row.id,
  ...mapRetrievalSubjectFields(row),
  ...(row.evidenceBundleId === null ? {} : { evidenceBundleId: row.evidenceBundleId }),
  ...(row.reviewAssessmentId === null ? {} : { reviewAssessmentId: row.reviewAssessmentId }),
  ...(row.sourceDecisionId === null ? {} : { sourceDecisionId: row.sourceDecisionId }),
  ...(row.runEventId === null ? {} : { runEventId: row.runEventId }),
  language: row.language,
  title: row.title,
  body: row.body,
  searchText: row.searchText
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
  ...mapRetrievalSubjectFields(row),
  embeddingModelId: row.embeddingModelId,
  ...(row.searchDocumentId === null ? {} : { searchDocumentId: row.searchDocumentId }),
  embedding: vectorOrEmpty(row.embedding),
  contentHash: row.contentHash
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
  sourceAuthority: row.sourceAuthority,
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
