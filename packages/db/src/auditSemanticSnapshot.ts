import {
  eq
} from "drizzle-orm";
import type {
  AuditActivationDecisionSnapshot,
  AuditEvalCandidateSnapshot,
  AuditMemoryCandidateSnapshot,
  AuditMemoryRecordSnapshot,
  AuditObservationGroupSnapshot,
  AuditRepoSnapshot,
  AuditSourceClaimSnapshot,
  AuditSourceDecisionSnapshot
} from "@krn/harness";

import type { KrnDatabase } from "./database.js";
import {
  activationDecisions,
  feedbackDeltas,
  memoryCandidates,
  memoryRecords,
  observationGroups,
  sourceArtifacts,
  sourceClaims,
  sourceDecisions
} from "./schema/index.js";

export interface AuditSemanticSnapshotInput {
  projectId?: string;
  retrievalRunId?: string;
  limit?: number;
}

export type AuditSemanticSnapshot = Pick<
  AuditRepoSnapshot,
  | "memoryCandidates"
  | "memoryRecords"
  | "sourceClaims"
  | "sourceDecisions"
  | "evalCandidates"
  | "observationGroups"
  | "activationDecisions"
>;

const unknownListLength = (value: unknown): number => (
  Array.isArray(value) ? value.length : 0
);

const hasText = (value: string | null): boolean =>
  value !== null && value.trim().length > 0;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const evalCandidateSnapshots = (value: unknown): AuditEvalCandidateSnapshot[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item): AuditEvalCandidateSnapshot[] => {
    if (!isRecord(item) || typeof item.id !== "string" || typeof item.title !== "string") {
      return [];
    }

    const sourceEvidence = item.sourceEvidence;

    return [{
      id: item.id,
      title: item.title,
      expectedSignal: typeof item.expectedSignal === "string" ? item.expectedSignal : "",
      sourceEvidenceCount: Array.isArray(sourceEvidence) ? sourceEvidence.length : 0,
      protectsRealBehavior: item.protectsRealBehavior === true
    }];
  });
};

const memoryCandidateSnapshot = (
  row: typeof memoryCandidates.$inferSelect
): AuditMemoryCandidateSnapshot => ({
  id: row.id,
  summary: row.summary,
  sourceLineageCount: unknownListLength(row.sourceLineage),
  sourceClaimCount: unknownListLength(row.sourceClaimIds),
  hasApplicationGuidance: row.applicationGuidance.trim().length > 0,
  hasInvalidationStrategy: hasText(row.invalidationRule) || row.validUntil !== null,
  isTemporal: row.validUntil !== null,
  autoPromotesToMemory: false
});

const memoryRecordSnapshot = (
  row: typeof memoryRecords.$inferSelect
): AuditMemoryRecordSnapshot => ({
  id: row.id,
  summary: row.summary,
  status: row.status,
  confidence: row.confidence,
  positiveFeedbackCount: row.positiveFeedbackCount,
  negativeFeedbackCount: row.negativeFeedbackCount,
  sourceLineageCount: unknownListLength(row.sourceLineage),
  sourceClaimCount: 0,
  hasApplicationGuidance: row.applicationGuidance.trim().length > 0,
  hasInvalidationStrategy: hasText(row.invalidationRule) || row.validUntil !== null,
  isTemporal: row.validUntil !== null
});

const sourceClaimSnapshot = (
  row: typeof sourceClaims.$inferSelect
): AuditSourceClaimSnapshot => ({
  id: row.id,
  claim: row.claim,
  mechanism: row.mechanism,
  krnImplication: row.krnImplication,
  doesNotProve: row.doesNotProve,
  consumer: row.consumer,
  trustTier: row.trustTier,
  supportType: row.supportType,
  ...(row.revisitWhen === null ? {} : { revisitWhen: row.revisitWhen }),
  status: row.status
});

const sourceDecisionSnapshot = (
  row: typeof sourceDecisions.$inferSelect
): AuditSourceDecisionSnapshot => ({
  id: row.id,
  decision: row.decision,
  ...(row.sourceClaimId === null ? {} : { sourceClaimId: row.sourceClaimId }),
  falsifier: row.falsifier,
  consumer: row.consumer
});

const observationGroupSnapshot = (
  row: typeof observationGroups.$inferSelect
): AuditObservationGroupSnapshot => ({
  id: row.id,
  ...(row.projectId === null ? {} : { projectId: row.projectId }),
  ...(row.executionRunId === null ? {} : { executionRunId: row.executionRunId }),
  source: row.source,
  summary: row.summary
});

const activationDecisionSnapshot = (
  row: typeof activationDecisions.$inferSelect
): AuditActivationDecisionSnapshot => ({
  id: row.id,
  subjectType: row.subjectType,
  subjectId: row.subjectId,
  decision: row.decision,
  reason: row.reason
});

export const readAuditSemanticSnapshot = async (
  db: KrnDatabase,
  input: AuditSemanticSnapshotInput
): Promise<AuditSemanticSnapshot> => {
  const limit = input.limit ?? 50;
  const [
    memoryCandidateRows,
    memoryRecordRows,
    sourceClaimRows,
    sourceDecisionRows,
    feedbackDeltaRows,
    observationGroupRows,
    activationDecisionRows
  ] = await Promise.all([
    input.projectId === undefined
      ? Promise.resolve([])
      : db.select().from(memoryCandidates).where(eq(memoryCandidates.projectId, input.projectId)).limit(limit),
    input.projectId === undefined
      ? Promise.resolve([])
      : db.select().from(memoryRecords).where(eq(memoryRecords.projectId, input.projectId)).limit(limit),
    input.projectId === undefined
      ? Promise.resolve([])
      : db
        .select({
          id: sourceClaims.id,
          sourceArtifactId: sourceClaims.sourceArtifactId,
          sourceChunkId: sourceClaims.sourceChunkId,
          executionRunId: sourceClaims.executionRunId,
          claim: sourceClaims.claim,
          mechanism: sourceClaims.mechanism,
          krnImplication: sourceClaims.krnImplication,
          doesNotProve: sourceClaims.doesNotProve,
          trustTier: sourceClaims.trustTier,
          supportType: sourceClaims.supportType,
          consumer: sourceClaims.consumer,
          falsifier: sourceClaims.falsifier,
          revisitWhen: sourceClaims.revisitWhen,
          status: sourceClaims.status,
          metadata: sourceClaims.metadata,
          createdAt: sourceClaims.createdAt,
          updatedAt: sourceClaims.updatedAt
        })
        .from(sourceClaims)
        .innerJoin(sourceArtifacts, eq(sourceClaims.sourceArtifactId, sourceArtifacts.id))
        .where(eq(sourceArtifacts.projectId, input.projectId))
        .limit(limit),
    input.projectId === undefined
      ? Promise.resolve([])
      : db.select().from(sourceDecisions).where(eq(sourceDecisions.projectId, input.projectId)).limit(limit),
    db.select().from(feedbackDeltas).limit(limit),
    input.projectId === undefined
      ? Promise.resolve([])
      : db.select().from(observationGroups).where(eq(observationGroups.projectId, input.projectId)).limit(limit),
    input.retrievalRunId === undefined
      ? Promise.resolve([])
      : db.select().from(activationDecisions).where(eq(activationDecisions.retrievalRunId, input.retrievalRunId)).limit(limit)
  ]);

  return {
    memoryCandidates: memoryCandidateRows.map(memoryCandidateSnapshot),
    memoryRecords: memoryRecordRows.map(memoryRecordSnapshot),
    sourceClaims: sourceClaimRows.map(sourceClaimSnapshot),
    sourceDecisions: sourceDecisionRows.map(sourceDecisionSnapshot),
    evalCandidates: feedbackDeltaRows.flatMap((row) => evalCandidateSnapshots(row.evalCandidates)),
    observationGroups: observationGroupRows.map(observationGroupSnapshot),
    activationDecisions: activationDecisionRows.map(activationDecisionSnapshot)
  };
};
