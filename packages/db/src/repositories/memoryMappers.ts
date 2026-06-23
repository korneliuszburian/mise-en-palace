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
import type {
  antiMemoryCandidates,
  antiMemoryRecords,
  memoryApplications,
  memoryCandidates,
  memoryFeedbackEvents,
  memoryRecords
} from "../schema/index.js";
import {
  metadataOrEmpty,
  optionalIsoTimestamp,
  stringListOrEmpty,
  toIsoTimestamp
} from "./common.js";

type MemoryRecordRow = InferSelectModel<typeof memoryRecords>;
type MemoryApplicationRow = InferSelectModel<typeof memoryApplications>;
type MemoryFeedbackEventRow = InferSelectModel<typeof memoryFeedbackEvents>;
type MemoryCandidateRow = InferSelectModel<typeof memoryCandidates>;
type AntiMemoryCandidateRow = InferSelectModel<typeof antiMemoryCandidates>;
type AntiMemoryRecordRow = InferSelectModel<typeof antiMemoryRecords>;

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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const sourceLineageOrEmpty = (value: unknown): SourceLineageRef[] => {
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

export const memoryCandidatesOrEmpty = (value: unknown): MemoryCandidate[] => {
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

export const mapAntiMemoryCandidate = (row: AntiMemoryCandidateRow): AntiMemoryCandidate => {
  const reviewedAt = optionalIsoTimestamp(row.reviewedAt);
  const validUntil = optionalIsoTimestamp(row.validUntil);

  return {
    id: row.id,
    projectId: row.projectId,
    ...(row.executionRunId === null ? {} : { executionRunId: row.executionRunId }),
    ...(row.feedbackDeltaId === null ? {} : { feedbackDeltaId: row.feedbackDeltaId }),
    proposedBy: row.proposedBy,
    key: row.key,
    status: row.status,
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
