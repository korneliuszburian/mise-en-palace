import type { InferSelectModel } from "drizzle-orm";
import type {
  AntiMemoryCandidate,
  AntiMemoryRecord,
  MemoryApplication,
  MemoryCandidate,
  MemoryFeedbackEvent,
  MemoryRecord,
  SourceLineageRef
} from "@krn/core";
import {
  memoryCandidateStatuses,
  memoryRecordKinds
} from "@krn/core";
import type {
  antiMemoryCandidates,
  antiMemoryRecords,
  memoryApplications,
  memoryCandidates,
  memoryFeedbackEvents,
  memoryRecords
} from "../schema/index.js";
import {
  isRecord,
  metadataOrEmpty,
  optionalIsoTimestamp,
  stringOrUndefined,
  stringListOrEmpty,
  toIsoTimestamp
} from "./repository-value-readers.js";

type MemoryRecordRow = InferSelectModel<typeof memoryRecords>;
type MemoryApplicationRow = InferSelectModel<typeof memoryApplications>;
type MemoryFeedbackEventRow = InferSelectModel<typeof memoryFeedbackEvents>;
type MemoryCandidateRow = InferSelectModel<typeof memoryCandidates>;
type AntiMemoryCandidateRow = InferSelectModel<typeof antiMemoryCandidates>;
type AntiMemoryRecordRow = InferSelectModel<typeof antiMemoryRecords>;

const memoryRecordKindValues = new Set<string>(memoryRecordKinds);

const memoryCandidateStatusValues = new Set<string>(memoryCandidateStatuses);

const requiredMemoryCandidateStringFields = [
  "id",
  "projectId",
  "proposedBy",
  "summary",
  "body",
  "owner",
  "applicationGuidance",
  "createdAt",
  "updatedAt"
] as const;

const hasStringFields = (
  item: Record<string, unknown>,
  fields: readonly string[]
): boolean => fields.every((field) => typeof item[field] === "string");

const isMemoryRecordKind = (value: unknown): value is MemoryCandidate["kind"] =>
  typeof value === "string" && memoryRecordKindValues.has(value);

const isMemoryCandidateStatus = (
  value: unknown
): value is MemoryCandidate["status"] =>
  typeof value === "string" &&
  memoryCandidateStatusValues.has(value);

type MemoryCandidateJson = Record<string, unknown> &
  Record<typeof requiredMemoryCandidateStringFields[number], string> & {
    kind: MemoryCandidate["kind"];
    status: MemoryCandidate["status"];
    confidence: number;
    isUserPreference: boolean;
  };

const isMemoryCandidateJson = (
  item: Record<string, unknown>
): item is MemoryCandidateJson => (
  hasStringFields(item, requiredMemoryCandidateStringFields) &&
  isMemoryRecordKind(item.kind) &&
  isMemoryCandidateStatus(item.status) &&
  typeof item.confidence === "number" &&
  typeof item.isUserPreference === "boolean"
);

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

const memoryCandidateFromJson = (
  item: MemoryCandidateJson
): MemoryCandidate => ({
  id: item.id,
  projectId: item.projectId,
  ...(typeof item.executionRunId === "string" ? { executionRunId: item.executionRunId } : {}),
  ...(typeof item.feedbackDeltaId === "string"
    ? { feedbackDeltaId: item.feedbackDeltaId }
    : {}),
  proposedBy: item.proposedBy,
  kind: item.kind,
  status: item.status,
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
});

const maybeMemoryCandidateFromJson = (
  item: unknown
): MemoryCandidate[] => {
  if (!isRecord(item) || !isMemoryCandidateJson(item)) {
    return [];
  }

  return [memoryCandidateFromJson(item)];
};

export const memoryCandidatesOrEmpty = (value: unknown): MemoryCandidate[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap(maybeMemoryCandidateFromJson);
};

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

interface CandidateRunRefs {
  executionRunId: string | null;
  feedbackDeltaId: string | null;
}

interface CandidateReviewRefs {
  reviewer: string | null;
  rejectionReason: string | null;
}

interface AntiMemoryFields {
  rejectedClaim?: string;
  reason?: string;
  invalidatedBySourceClaimIds: string[];
  appliesTo?: string;
  mayRevisitWhen?: string;
  summary: string;
  body: string;
  owner: string;
  confidence: number;
  sourceLineage: SourceLineageRef[];
}

const candidateRunRefs = (row: CandidateRunRefs): {
  executionRunId?: string;
  feedbackDeltaId?: string;
} => ({
  ...(row.executionRunId === null ? {} : { executionRunId: row.executionRunId }),
  ...(row.feedbackDeltaId === null ? {} : { feedbackDeltaId: row.feedbackDeltaId })
});

const candidateReviewRefs = (
  row: CandidateReviewRefs,
  reviewedAt: string | undefined
): {
  reviewer?: string;
  reviewedAt?: string;
  rejectionReason?: string;
} => ({
  ...(row.reviewer === null ? {} : { reviewer: row.reviewer }),
  ...(reviewedAt === undefined ? {} : { reviewedAt }),
  ...(row.rejectionReason === null ? {} : { rejectionReason: row.rejectionReason })
});

const validUntilField = (
  validUntil: string | undefined
): { validUntil?: string } => (
  validUntil === undefined ? {} : { validUntil }
);

const antiMemoryFields = (
  row: AntiMemoryCandidateRow | AntiMemoryRecordRow
): AntiMemoryFields => ({
  ...(row.rejectedClaim === null ? {} : { rejectedClaim: row.rejectedClaim }),
  ...(row.reason === null ? {} : { reason: row.reason }),
  invalidatedBySourceClaimIds: [
    ...new Set([
      ...stringListOrEmpty(row.invalidatedBySourceClaimIds),
      ...(row.invalidatedBySourceClaimId === null
        ? []
        : [row.invalidatedBySourceClaimId])
    ])
  ],
  ...(row.appliesTo === null ? {} : { appliesTo: row.appliesTo }),
  ...(row.mayRevisitWhen === null ? {} : { mayRevisitWhen: row.mayRevisitWhen }),
  summary: row.summary,
  body: row.body,
  owner: row.owner,
  confidence: row.confidence,
  sourceLineage: sourceLineageOrEmpty(row.sourceLineage)
});

export const mapMemoryCandidate = (row: MemoryCandidateRow): MemoryCandidate => {
  const reviewedAt = optionalIsoTimestamp(row.reviewedAt);
  const validUntil = optionalIsoTimestamp(row.validUntil);

  return {
    id: row.id,
    projectId: row.projectId,
    ...candidateRunRefs(row),
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
    ...candidateReviewRefs(row, reviewedAt),
    validFrom: toIsoTimestamp(row.validFrom),
    ...validUntilField(validUntil),
    metadata: metadataOrEmpty(row.metadata),
    createdAt: toIsoTimestamp(row.createdAt),
    updatedAt: toIsoTimestamp(row.updatedAt)
  };
};

export const mapAntiMemoryCandidate = (row: AntiMemoryCandidateRow): AntiMemoryCandidate => {
  const reviewedAt = optionalIsoTimestamp(row.reviewedAt);
  const validUntil = optionalIsoTimestamp(row.validUntil);

  return {
    id: row.id,
    projectId: row.projectId,
    ...candidateRunRefs(row),
    proposedBy: row.proposedBy,
    ...(row.maintenanceIdentity === null
      ? {}
      : { maintenanceIdentity: row.maintenanceIdentity }),
    key: row.key,
    status: row.status,
    ...antiMemoryFields(row),
    ...candidateReviewRefs(row, reviewedAt),
    validFrom: toIsoTimestamp(row.validFrom),
    ...validUntilField(validUntil),
    metadata: metadataOrEmpty(row.metadata),
    createdAt: toIsoTimestamp(row.createdAt),
    updatedAt: toIsoTimestamp(row.updatedAt)
  };
};

export const mapMemoryApplication = (row: MemoryApplicationRow): MemoryApplication => {
  const metadata = metadataOrEmpty(row.metadata);
  const packetGeneratedAt = stringOrUndefined(metadata.decisionPacketGeneratedAt);
  const sourceRunLifecycleRevision = metadata.decisionPacketSourceRunLifecycleRevision;
  const hasPacketGeneratedAt =
    packetGeneratedAt !== undefined && Number.isFinite(Date.parse(packetGeneratedAt));
  const hasSourceRunLifecycleRevision =
    typeof sourceRunLifecycleRevision === "number" &&
    Number.isSafeInteger(sourceRunLifecycleRevision) &&
    sourceRunLifecycleRevision > 0;

  return {
    id: row.id,
    memoryRecordId: row.memoryRecordId,
    ...(row.executionRunId === null ? {} : { executionRunId: row.executionRunId }),
    ...(row.decisionPacketChecksum === null
      ? {}
      : { packetChecksum: row.decisionPacketChecksum }),
    ...(packetGeneratedAt === undefined || !hasPacketGeneratedAt ? {} : { packetGeneratedAt }),
    ...(hasSourceRunLifecycleRevision ? { sourceRunLifecycleRevision } : {}),
    proofClass:
      row.executionRunId !== null &&
      row.decisionPacketChecksum !== null &&
      row.decisionPacketChecksum.trim().length > 0 &&
      hasPacketGeneratedAt &&
      hasSourceRunLifecycleRevision
        ? "packet_bound"
        : "legacy_history",
    ...(row.taskContractId === null ? {} : { taskContractId: row.taskContractId }),
    ...(row.contextAssemblyId === null ? {} : { contextAssemblyId: row.contextAssemblyId }),
    expectedUse: row.expectedUse,
    ...(row.outcome === null ? {} : { outcome: row.outcome }),
    ...(row.notes === null ? {} : { notes: row.notes }),
    metadata,
    createdAt: toIsoTimestamp(row.createdAt)
  };
};

export const mapMemoryFeedbackEvent = (
  row: MemoryFeedbackEventRow
): MemoryFeedbackEvent => ({
  id: row.id,
  memoryRecordId: row.memoryRecordId,
  ...(row.executionRunId === null ? {} : { executionRunId: row.executionRunId }),
  ...(row.feedbackDeltaId === null ? {} : { feedbackDeltaId: row.feedbackDeltaId }),
  ...(row.eventType === null ? {} : { eventType: row.eventType }),
  direction: row.direction,
  note: row.note,
  ...(row.reason === null ? {} : { reason: row.reason }),
  ...(row.evidenceRef === null ? {} : { evidenceRef: row.evidenceRef }),
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
    ...(row.createdFromCandidateId === null
      ? {}
      : { createdFromCandidateId: row.createdFromCandidateId }),
    key: row.key,
    ...antiMemoryFields(row),
    validFrom: toIsoTimestamp(row.validFrom),
    ...validUntilField(validUntil),
    ...(invalidatedAt === undefined ? {} : { invalidatedAt }),
    ...(row.invalidationReason === null ? {} : { invalidationReason: row.invalidationReason }),
    metadata: metadataOrEmpty(row.metadata),
    createdAt: toIsoTimestamp(row.createdAt),
    updatedAt: toIsoTimestamp(row.updatedAt)
  };
};
