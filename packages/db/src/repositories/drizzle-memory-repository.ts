import { createHash } from "node:crypto";

import {
  and,
  asc,
  desc,
  eq,
  gt,
  inArray,
  isNotNull,
  isNull,
  lte,
  or,
  sql
} from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import type {
  AntiMemoryCandidate,
  AntiMemoryRecord,
  ExecutionRunId,
  MemoryApplicationOutcome,
  MemoryCandidate,
  MemoryFeedbackEvent,
  MemoryRecord,
  IsoTimestamp,
  ProjectId
} from "@krn/core";
import {
  authorizeIssuedDecisionPacketUsefulness,
  decideEvidenceContractActivation,
  evidenceBundleProvesHelped,
  parseEvidenceContract
} from "@krn/core";
import { MemoryApplicationIdentityConflictError } from "@krn/core/repositories/internal";
import type {
  CreateAntiMemoryRecordInput,
  CreateAntiMemoryCandidateInput,
  ActiveMemorySelectionOptions,
  AntiMemorySelectionOptions,
  CreateMemoryFeedbackEventInput,
  CreateMemoryCandidateInput,
  ApplyReviewedMemoryRevisionInput,
  ApplyReviewedMemoryRevisionResult,
  CreateMemoryRecordInput,
  HistoricalMemoryWarningSelectionOptions,
  InvalidateMemoryRecordInput,
  MemoryRepository,
  PromoteAntiMemoryCandidateInput,
  PromoteMemoryCandidateInput,
  RejectAntiMemoryCandidateInput,
  RejectMemoryCandidateInput,
  RecordMemoryApplicationInput,
  RecordMemoryApplicationOnceInput,
  RecordMemoryApplicationWithEffectsOnceInput,
  RecordMemoryApplicationWithEffectsOnceResult,
  RebuildMemoryApplicationCountersResult,
  SupersedeMemoryRecordInput,
  HarnessRunAggregate
} from "@krn/core/repositories/internal";

import type { KrnDatabase, KrnDatabaseTransaction } from "../database.js";
import {
  antiMemoryRecords,
  antiMemoryCandidates,
  memoryApplications,
  memoryCandidates,
  memoryFeedbackEvents,
  memoryRecordVersions,
  memoryRecords,
  evidenceCommandArtifacts,
  evidenceBundles,
  executionRuns,
  harnessPlans,
  taskContracts,
  outboxEvents,
  decisionPacketIssuances,
  usefulnessApplications
} from "../schema/index.js";
import {
  fromIsoTimestamp,
  requireReturnedRow
} from "./repository-value-readers.js";
import {
  mapAntiMemoryRecord,
  mapAntiMemoryCandidate,
  mapMemoryApplication,
  mapMemoryCandidate,
  mapMemoryFeedbackEvent,
  mapMemoryRecord,
  mapCommandOutputArtifact,
  mapEvidenceBundle
} from "./mappers.js";
import {
  DrizzleHarnessRunRepository,
  mapDecisionPacketIssuance
} from "./drizzle-harness-run-repository.js";

const sha256Hex = (value: string | Uint8Array): string =>
  createHash("sha256").update(value).digest("hex");

const canonicalJson = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }
  if (value !== null && typeof value === "object") {
    return `{${Object.entries(value)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value) ?? "null";
};

const memoryApplicationCallerMetadata = (
  metadata: Record<string, unknown> | undefined
): Record<string, unknown> => {
  const callerMetadata = { ...metadata };

  delete callerMetadata.decisionPacketChecksum;
  delete callerMetadata.decisionPacketGeneratedAt;
  delete callerMetadata.decisionPacketSourceRunLifecycleRevision;
  delete callerMetadata.verificationEvidenceBundleId;
  delete callerMetadata.memoryApplicationRequestFingerprint;

  return callerMetadata;
};

const memoryApplicationRequestFingerprint = (
  input: RecordMemoryApplicationWithEffectsOnceInput
): string => sha256Hex(canonicalJson({
  memoryRecordId: input.memoryRecordId,
  executionRunId: input.executionRunId,
  taskContractId: input.taskContractId ?? null,
  contextAssemblyId: input.contextAssemblyId ?? null,
  expectedUse: input.expectedUse,
  outcome: input.outcome,
  notes: input.notes,
  evidenceBundleId: input.evidenceBundleId ?? null,
  packetChecksum: input.packetChecksum,
  packetGeneratedAt: input.packetGeneratedAt,
  sourceRunLifecycleRevision: input.sourceRunLifecycleRevision,
  metadata: memoryApplicationCallerMetadata(input.metadata),
  negativeEffects: input.negativeEffects ?? null
}));

const memoryApplicationFingerprintFromRow = (
  row: MemoryApplicationRow
): string | undefined => {
  const fingerprint = row.metadata.memoryApplicationRequestFingerprint;

  return typeof fingerprint === "string" && fingerprint.length > 0
    ? fingerprint
    : undefined;
};

const smokePayload = (
  metadata: Record<string, unknown> | undefined
): Record<string, string> => {
  const smokeId = metadata?.smokeId;

  return typeof smokeId === "string" ? { smokeId } : {};
};

const memoryRecordKeyForCandidate = (
  input: Pick<PromoteMemoryCandidateInput, "candidateId" | "recordKey">
): string =>
  input.recordKey ?? `memory:${input.candidateId}`;

const antiMemoryRecordKeyForCandidate = (
  candidate: AntiMemoryCandidate,
  input: PromoteAntiMemoryCandidateInput
): string => input.recordKey ?? candidate.key;

const packetGeneratedAtFromMetadata = (
  metadata: Record<string, unknown>
): IsoTimestamp | undefined => {
  const value = metadata.decisionPacketGeneratedAt;

  return typeof value === "string" && Number.isFinite(Date.parse(value))
    ? value
    : undefined;
};

const sourceRunLifecycleRevisionFromMetadata = (
  metadata: Record<string, unknown>
): number | undefined => {
  const value = metadata.decisionPacketSourceRunLifecycleRevision;

  return typeof value === "number" && Number.isSafeInteger(value) && value > 0
    ? value
    : undefined;
};

export const memoryPromotionMetadata = (
  candidate: MemoryCandidate,
  input: { metadata?: Record<string, unknown> }
): Record<string, unknown> => ({
  ...candidate.metadata,
  ...(input.metadata ?? {}),
  createdFromCandidateId: candidate.id,
  sourceClaimIds: candidate.sourceClaimIds
});

const reviewedMemoryRevisionMetadata = (
  candidate: MemoryCandidate,
  input: ApplyReviewedMemoryRevisionInput
): Record<string, unknown> => {
  const revision = candidate.metadata.memoryRevision;

  if (typeof revision !== "object" || revision === null || Array.isArray(revision)) {
    throw new Error(
      `Memory candidate ${candidate.id} has no persisted revision source identity`
    );
  }

  const revisionMetadata = Object.fromEntries(Object.entries(revision));
  const proposedSourceMemoryRecordId = revisionMetadata.sourceMemoryRecordId;

  if (
    typeof proposedSourceMemoryRecordId !== "string" ||
    proposedSourceMemoryRecordId.trim().length === 0
  ) {
    throw new Error(
      `Memory candidate ${candidate.id} has no persisted revision source identity`
    );
  }
  if (proposedSourceMemoryRecordId !== input.sourceMemoryRecordId) {
    throw new Error(
      `Memory candidate ${candidate.id} was proposed for source ${proposedSourceMemoryRecordId}, not ${input.sourceMemoryRecordId}`
    );
  }

  return {
    ...memoryPromotionMetadata(candidate, input),
    memoryRevision: revisionMetadata
  };
};

export const antiMemoryPromotionMetadata = (
  candidate: AntiMemoryCandidate,
  input: PromoteAntiMemoryCandidateInput
): Record<string, unknown> => ({
  ...candidate.metadata,
  ...(input.metadata ?? {}),
  createdFromCandidateId: candidate.id,
  invalidatedBySourceClaimIds: candidate.invalidatedBySourceClaimIds
});

export const activeMemorySelectionOrder = () => [
  asc(memoryRecords.negativeFeedbackCount),
  desc(memoryRecords.positiveFeedbackCount),
  desc(memoryRecords.updatedAt),
  asc(memoryRecords.id)
];

const selectionDate = (value: string | undefined): Date | undefined => {
  const timestamp = value === undefined ? Date.now() : Date.parse(value);

  return Number.isFinite(timestamp) ? new Date(timestamp) : undefined;
};

const normalizedMemorySelectionTerms = (terms: readonly string[] | undefined): string[] => [
  ...new Set((terms ?? [])
    .map((term) => term.trim().toLowerCase())
    .filter((term) => term.length > 0))
];

const memorySearchableText = () => sql`lower(concat_ws(' ',
  ${memoryRecords.key},
  ${memoryRecords.summary},
  ${memoryRecords.body},
  ${memoryRecords.owner},
  ${memoryRecords.applicationGuidance},
  ${memoryRecords.invalidationRule}
))`;

const memoryRelevanceFilter = (
  terms: readonly string[],
  searchableText: ReturnType<typeof memorySearchableText>
) => terms.length === 0
  ? undefined
  : or(...terms.map((term) => sql`strpos(${searchableText}, ${term}) > 0`));

const memoryRelevanceScore = (
  terms: readonly string[],
  searchableText: ReturnType<typeof memorySearchableText>
) => terms.length === 0
  ? undefined
  : sql<number>`(${sql.join(
      terms.map((term) => sql`CASE WHEN strpos(${searchableText}, ${term}) > 0 THEN 1 ELSE 0 END`),
      sql` + `
    )})`;

interface MemoryCoreInvariantInput {
  summary: string;
  body: string;
  owner: string;
  confidence: number;
  applicationGuidance: string;
  invalidationRule?: string;
  sourceLineage: readonly { sourceId: string }[];
  validFrom?: string;
  validUntil?: string;
}

interface AntiMemoryCandidateInvariantInput {
  key: string;
  summary: string;
  body: string;
  owner: string;
  confidence: number;
  invalidatedBySourceClaimIds?: readonly string[];
  sourceLineage: readonly { sourceId: string }[];
  validFrom?: string;
  validUntil?: string;
}

type MemoryRecordInsertRow = typeof memoryRecords.$inferInsert;
type MemoryRecordVersionInsertRow = typeof memoryRecordVersions.$inferInsert;
type AntiMemoryCandidateInsertRow = typeof antiMemoryCandidates.$inferInsert;
type MemoryApplicationRow = InferSelectModel<typeof memoryApplications>;
type UsefulnessApplicationRow = InferSelectModel<typeof usefulnessApplications>;

interface PacketBoundMemoryApplicationIdentity {
  executionRunId: string;
  packetChecksum: string;
  packetGeneratedAt: IsoTimestamp;
  sourceRunLifecycleRevision: number;
}

const memoryUsefulnessAdmissionMatches = (
  admission: UsefulnessApplicationRow | undefined,
  row: MemoryApplicationRow,
  identity: PacketBoundMemoryApplicationIdentity
): boolean =>
  admission !== undefined &&
  admission.subjectKind === "memory_record" &&
  admission.subjectId === row.memoryRecordId &&
  admission.executionRunId === identity.executionRunId &&
  admission.packetChecksum === identity.packetChecksum &&
  admission.packetGeneratedAt.toISOString() === identity.packetGeneratedAt &&
  admission.sourceRunLifecycleRevision === identity.sourceRunLifecycleRevision;

const packetBoundMemoryApplicationIdentity = (
  row: MemoryApplicationRow
): PacketBoundMemoryApplicationIdentity | undefined => {
  const packetChecksum = row.decisionPacketChecksum?.trim();
  const packetGeneratedAt = packetGeneratedAtFromMetadata(row.metadata);
  const sourceRunLifecycleRevision = sourceRunLifecycleRevisionFromMetadata(row.metadata);

  if (
    row.executionRunId === null ||
    packetChecksum === undefined ||
    packetChecksum.length === 0 ||
    packetGeneratedAt === undefined ||
    sourceRunLifecycleRevision === undefined
  ) {
    return undefined;
  }

  return {
    executionRunId: row.executionRunId,
    packetChecksum,
    packetGeneratedAt,
    sourceRunLifecycleRevision
  };
};

type MemoryApplicationCounterState = {
  canonicalOutcomeCounts: Record<MemoryApplicationOutcome, number>;
  countsByMemoryRecord: Map<
    string,
    { positiveFeedbackCount: number; negativeFeedbackCount: number }
  >;
};

const hasText = (value: string | undefined): boolean =>
  value !== undefined && value.trim().length > 0;

const assertHasText = (
  value: string | undefined,
  message: string
): void => {
  if (!hasText(value)) {
    throw new Error(message);
  }
};

const assertConfidence = (
  confidence: number,
  subject: string
): void => {
  if (!Number.isInteger(confidence) || confidence < 0 || confidence > 100) {
    throw new Error(`${subject} confidence must be an integer from 0 to 100`);
  }
};

const sourceLineageIsPresent = (
  sourceLineage: readonly { sourceId: string }[]
): boolean => (
  sourceLineage.length > 0 &&
  sourceLineage.every((lineage) => hasText(lineage.sourceId))
);

const assertSourceLineage = (
  sourceLineage: readonly { sourceId: string }[],
  subject: string
): void => {
  if (!sourceLineageIsPresent(sourceLineage)) {
    throw new Error(`${subject} requires source lineage`);
  }
};

const timestampValue = (value: string | undefined): number | undefined => {
  if (value === undefined) {
    return undefined;
  }

  const parsed = Date.parse(value);

  return Number.isNaN(parsed) ? undefined : parsed;
};

const assertTemporalWindow = (
  validFrom: string | undefined,
  validUntil: string | undefined,
  subject: string
): void => {
  if (validUntil === undefined) {
    return;
  }

  if (!hasText(validFrom)) {
    throw new Error(`${subject} with validUntil requires validFrom`);
  }

  const validFromTime = timestampValue(validFrom);
  const validUntilTime = timestampValue(validUntil);

  if (validFromTime !== undefined && validUntilTime !== undefined && validUntilTime <= validFromTime) {
    throw new Error(`${subject} validUntil must be after validFrom`);
  }
};

const assertMemoryTemporalStrategy = (
  input: MemoryCoreInvariantInput,
  subject: string
): void => {
  if (input.validUntil === undefined) {
    return;
  }

  if (!hasText(input.validFrom)) {
    throw new Error(`${subject} with validUntil requires validFrom`);
  }

  if (!hasText(input.invalidationRule)) {
    throw new Error(`${subject} with validUntil requires invalidation rule`);
  }

  assertTemporalWindow(input.validFrom, input.validUntil, subject);
};

const invalidatingSourceClaimCount = (
  input: AntiMemoryCandidateInvariantInput
): number => input.invalidatedBySourceClaimIds?.filter(hasText).length ?? 0;

const hasAntiMemoryInvalidationEvidence = (
  input: AntiMemoryCandidateInvariantInput
): boolean => (
  invalidatingSourceClaimCount(input) > 0 ||
  sourceLineageIsPresent(input.sourceLineage)
);

export const assertMemoryCoreInvariants = (
  input: MemoryCoreInvariantInput,
  subject: string
): void => {
  assertHasText(input.summary, `${subject} requires summary`);
  assertHasText(input.body, `${subject} requires body`);
  assertHasText(input.owner, `${subject} requires owner`);
  assertConfidence(input.confidence, subject);
  assertHasText(input.applicationGuidance, `${subject} requires application guidance`);
  assertSourceLineage(input.sourceLineage, subject);
  assertMemoryTemporalStrategy(input, subject);
};

export const assertAntiMemoryCandidateInvariants = (
  input: AntiMemoryCandidateInvariantInput,
  subject: string
): void => {
  assertHasText(input.key, `${subject} requires key`);
  assertHasText(input.summary, `${subject} requires summary`);
  assertHasText(input.body, `${subject} requires body`);
  assertHasText(input.owner, `${subject} requires owner`);
  assertConfidence(input.confidence, subject);

  if (!hasAntiMemoryInvalidationEvidence(input)) {
    throw new Error(`${subject} requires invalidating source claim or source lineage`);
  }

  assertTemporalWindow(input.validFrom, input.validUntil, subject);
};

const ensurePromotableCandidate = (candidate: MemoryCandidate): void => {
  if (candidate.status !== "proposed" && candidate.status !== "candidate") {
    throw new Error(
      `Memory candidate ${candidate.id} cannot be promoted from ${candidate.status}`
    );
  }

  assertMemoryCoreInvariants(candidate, `Memory candidate ${candidate.id}`);
};

const requireCandidateTransitionRow = <Row>(
  rows: readonly Row[],
  operation: string,
  candidateId: string
): Row => {
  const row = rows[0];

  if (row === undefined) {
    throw new Error(
      `${operation} could not transition candidate ${candidateId}; expected proposed or candidate status`
    );
  }

  return row;
};

const requireMemoryRecordTransitionRow = <Row>(
  rows: readonly Row[],
  operation: string,
  memoryRecordId: string,
  expectedStatus: string
): Row => {
  const row = rows[0];

  if (row === undefined) {
    throw new Error(
      `${operation} could not transition memory record ${memoryRecordId}; expected ${expectedStatus} status`
    );
  }

  return row;
};

const ensurePromotableAntiMemoryCandidate = (candidate: AntiMemoryCandidate): void => {
  if (candidate.status !== "proposed" && candidate.status !== "candidate") {
    throw new Error(
      `Anti-memory candidate ${candidate.id} cannot be promoted from ${candidate.status}`
    );
  }

  assertAntiMemoryCandidateInvariants(candidate, `Anti-memory candidate ${candidate.id}`);
};

const memoryRecordInsertValues = (
  input: CreateMemoryRecordInput
): MemoryRecordInsertRow => {
  const row: MemoryRecordInsertRow = {
    projectId: input.projectId,
    key: input.key,
    kind: input.kind,
    status: input.status ?? "active",
    summary: input.summary,
    body: input.body,
    owner: input.owner,
    confidence: input.confidence,
    applicationGuidance: input.applicationGuidance,
    sourceLineage: input.sourceLineage,
    metadata: input.metadata ?? {}
  };

  if (input.currentVersionId !== undefined) {
    row.currentVersionId = input.currentVersionId;
  }

  if (input.invalidationRule !== undefined) {
    row.invalidationRule = input.invalidationRule;
  }

  if (input.isUserPreference !== undefined) {
    row.isUserPreference = input.isUserPreference;
  }

  if (input.validFrom !== undefined) {
    row.validFrom = fromIsoTimestamp(input.validFrom);
  }

  if (input.validUntil !== undefined) {
    row.validUntil = fromIsoTimestamp(input.validUntil);
  }

  return row;
};

const initialMemoryRecordVersionInsertValues = (
  memoryRecordId: string,
  input: CreateMemoryRecordInput
): MemoryRecordVersionInsertRow => {
  const row: MemoryRecordVersionInsertRow = {
    memoryRecordId,
    version: 1,
    summary: input.summary,
    body: input.body,
    owner: input.owner,
    confidence: input.confidence,
    applicationGuidance: input.applicationGuidance,
    sourceLineage: input.sourceLineage,
    metadata: {
      reason: "initial memory record version"
    }
  };

  if (input.invalidationRule !== undefined) {
    row.invalidationRule = input.invalidationRule;
  }

  if (input.validFrom !== undefined) {
    row.validFrom = fromIsoTimestamp(input.validFrom);
  }

  if (input.validUntil !== undefined) {
    row.validUntil = fromIsoTimestamp(input.validUntil);
  }

  return row;
};

const applyAntiMemoryCandidateRunLinks = (
  row: AntiMemoryCandidateInsertRow,
  input: CreateAntiMemoryCandidateInput
): void => {
  if (input.executionRunId !== undefined) {
    row.executionRunId = input.executionRunId;
  }

  if (input.feedbackDeltaId !== undefined) {
    row.feedbackDeltaId = input.feedbackDeltaId;
  }
};

const applyAntiMemoryCandidateSourceContext = (
  row: AntiMemoryCandidateInsertRow,
  input: CreateAntiMemoryCandidateInput
): void => {
  if (input.rejectedClaim !== undefined) {
    row.rejectedClaim = input.rejectedClaim;
  }

  if (input.reason !== undefined) {
    row.reason = input.reason;
  }

};

const applyAntiMemoryCandidateScope = (
  row: AntiMemoryCandidateInsertRow,
  input: CreateAntiMemoryCandidateInput
): void => {
  if (input.appliesTo !== undefined) {
    row.appliesTo = input.appliesTo;
  }

  if (input.mayRevisitWhen !== undefined) {
    row.mayRevisitWhen = input.mayRevisitWhen;
  }
};

const applyAntiMemoryCandidateTemporalWindow = (
  row: AntiMemoryCandidateInsertRow,
  input: CreateAntiMemoryCandidateInput
): void => {
  if (input.validFrom !== undefined) {
    row.validFrom = fromIsoTimestamp(input.validFrom);
  }

  if (input.validUntil !== undefined) {
    row.validUntil = fromIsoTimestamp(input.validUntil);
  }
};

const antiMemoryCandidateInsertValues = (
  input: CreateAntiMemoryCandidateInput
): AntiMemoryCandidateInsertRow => {
  const row: AntiMemoryCandidateInsertRow = {
    projectId: input.projectId,
    proposedBy: input.proposedBy,
    ...(input.maintenanceIdentity === undefined
      ? {}
      : { maintenanceIdentity: input.maintenanceIdentity }),
    key: input.key,
    status: input.status ?? "candidate",
    invalidatedBySourceClaimIds: input.invalidatedBySourceClaimIds ?? [],
    summary: input.summary,
    body: input.body,
    owner: input.owner,
    confidence: input.confidence,
    sourceLineage: input.sourceLineage,
    metadata: input.metadata ?? {}
  };

  applyAntiMemoryCandidateRunLinks(row, input);
  applyAntiMemoryCandidateSourceContext(row, input);
  applyAntiMemoryCandidateScope(row, input);
  applyAntiMemoryCandidateTemporalWindow(row, input);

  return row;
};

export type MemoryApplicationPersistenceStage =
  | "after_application"
  | "after_counter"
  | "after_feedback"
  | "after_candidate"
  | "after_outbox";

export type MemoryRevisionPersistenceStage = "after_promotion";

export class DrizzleMemoryRepository implements MemoryRepository {
  constructor(
    private readonly db: KrnDatabase,
    private readonly options: {
      faultAfterStage?: (stage: MemoryApplicationPersistenceStage) => void | Promise<void>;
      faultAfterRevisionStage?: (stage: MemoryRevisionPersistenceStage) => void;
      beforeCounterRebuildPersist?: () => Promise<void>;
      faultAfterCounterRebuildReset?: () => void;
    } = {}
  ) {}

  async createMemoryRecord(input: CreateMemoryRecordInput): Promise<MemoryRecord> {
    assertMemoryCoreInvariants(input, "Memory record");

    return this.db.transaction(async (tx) => {
      const row = requireReturnedRow(
        await tx
          .insert(memoryRecords)
          .values(memoryRecordInsertValues(input))
          .returning(),
        "createMemoryRecord"
      );

      const versionRow = requireReturnedRow(
        await tx
          .insert(memoryRecordVersions)
          .values(initialMemoryRecordVersionInsertValues(row.id, input))
          .returning(),
        "createMemoryRecordVersion"
      );
      const updatedRow = requireReturnedRow(
        await tx
          .update(memoryRecords)
          .set({
            currentVersionId: input.currentVersionId ?? versionRow.id,
            updatedAt: new Date()
          })
          .where(eq(memoryRecords.id, row.id))
          .returning(),
        "createMemoryRecord.updateCurrentVersion"
      );

      return mapMemoryRecord(updatedRow);
    });
  }

  async getMemoryRecord(id: string): Promise<MemoryRecord | undefined> {
    return this.getMemoryRecordById(id);
  }

  async getMemoryRecordById(id: string): Promise<MemoryRecord | undefined> {
    const row = await this.db.query.memoryRecords.findFirst({
      where: eq(memoryRecords.id, id)
    });

    return row === undefined ? undefined : mapMemoryRecord(row);
  }

  async listMemoryRecordsForProject(
    projectId: ProjectId,
    limit?: number
  ): Promise<MemoryRecord[]> {
    const rows = await this.db.query.memoryRecords.findMany({
      where: eq(memoryRecords.projectId, projectId),
      orderBy: asc(memoryRecords.updatedAt),
      ...(limit === undefined ? {} : { limit })
    });

    return rows.map(mapMemoryRecord);
  }

  async listActiveMemory(
    projectId: ProjectId,
    limit: number,
    options?: ActiveMemorySelectionOptions
  ): Promise<MemoryRecord[]> {
    const now = selectionDate(options?.now);
    if (now === undefined) {
      return [];
    }

    const terms = normalizedMemorySelectionTerms(options?.terms);
    const searchableText = memorySearchableText();
    const relevanceFilter = memoryRelevanceFilter(terms, searchableText);
    const relevanceScore = memoryRelevanceScore(terms, searchableText);
    const rows = await this.db.query.memoryRecords.findMany({
      where: and(
        eq(memoryRecords.projectId, projectId),
        eq(memoryRecords.status, "active"),
        lte(memoryRecords.validFrom, now),
        or(isNull(memoryRecords.validUntil), gt(memoryRecords.validUntil, now)),
        or(isNull(memoryRecords.invalidatedAt), gt(memoryRecords.invalidatedAt, now)),
        relevanceFilter
      ),
      orderBy: [
        ...(relevanceScore === undefined ? [] : [desc(relevanceScore)]),
        ...activeMemorySelectionOrder()
      ],
      limit
    });

    return rows.map(mapMemoryRecord);
  }

  async listHistoricalMemoryWarnings(
    projectId: ProjectId,
    limit: number,
    options?: HistoricalMemoryWarningSelectionOptions
  ): Promise<MemoryRecord[]> {
    const now = selectionDate(options?.now);
    if (now === undefined) {
      return [];
    }

    const terms = normalizedMemorySelectionTerms(options?.terms);
    const searchableText = memorySearchableText();
    const relevanceFilter = memoryRelevanceFilter(terms, searchableText);
    const relevanceScore = memoryRelevanceScore(terms, searchableText);
    const rows = await this.db.query.memoryRecords.findMany({
      where: and(
        eq(memoryRecords.projectId, projectId),
        lte(memoryRecords.validFrom, now),
        or(
          inArray(memoryRecords.status, ["deprecated", "stale", "invalidated", "superseded"]),
          and(
            eq(memoryRecords.status, "active"),
            or(
              and(isNotNull(memoryRecords.validUntil), lte(memoryRecords.validUntil, now)),
              and(isNotNull(memoryRecords.invalidatedAt), lte(memoryRecords.invalidatedAt, now))
            )
          )
        ),
        relevanceFilter
      ),
      orderBy: [
        ...(relevanceScore === undefined ? [] : [desc(relevanceScore)]),
        desc(memoryRecords.updatedAt),
        asc(memoryRecords.id)
      ],
      limit
    });

    return rows.map(mapMemoryRecord);
  }

  async createMemoryCandidate(input: CreateMemoryCandidateInput): Promise<MemoryCandidate> {
    assertMemoryCoreInvariants(input, "Memory candidate");

    return this.db.transaction(async (tx) => {
      const row = requireReturnedRow(
        await tx
          .insert(memoryCandidates)
          .values({
            projectId: input.projectId,
            ...(input.executionRunId === undefined
              ? {}
              : { executionRunId: input.executionRunId }),
            ...(input.feedbackDeltaId === undefined
              ? {}
              : { feedbackDeltaId: input.feedbackDeltaId }),
            proposedBy: input.proposedBy,
            kind: input.kind,
            status: input.status ?? "proposed",
            summary: input.summary,
            body: input.body,
            owner: input.owner,
            confidence: input.confidence,
            applicationGuidance: input.applicationGuidance,
            ...(input.invalidationRule === undefined
              ? {}
              : { invalidationRule: input.invalidationRule }),
            sourceClaimIds: input.sourceClaimIds ?? [],
            sourceLineage: input.sourceLineage,
            isUserPreference: input.isUserPreference,
            ...(input.validFrom === undefined
              ? {}
              : { validFrom: fromIsoTimestamp(input.validFrom) }),
            ...(input.validUntil === undefined
              ? {}
              : { validUntil: fromIsoTimestamp(input.validUntil) }),
            metadata: input.metadata ?? {}
          })
          .returning(),
        "createMemoryCandidate"
      );

      await tx.insert(outboxEvents).values({
        topic: "memory.candidate.created",
        payload: {
          ...smokePayload(input.metadata),
          memoryCandidateId: row.id,
          projectId: row.projectId
        }
      });

      return mapMemoryCandidate(row);
    });
  }

  async getMemoryCandidateById(id: string): Promise<MemoryCandidate | undefined> {
    const row = await this.db.query.memoryCandidates.findFirst({
      where: eq(memoryCandidates.id, id)
    });

    return row === undefined ? undefined : mapMemoryCandidate(row);
  }

  async promoteMemoryCandidate(input: PromoteMemoryCandidateInput): Promise<MemoryRecord> {
    return this.db.transaction(async (tx) => {
      const candidateRow = await tx.query.memoryCandidates.findFirst({
        where: eq(memoryCandidates.id, input.candidateId)
      });

      if (candidateRow === undefined) {
        throw new Error(`Memory candidate ${input.candidateId} was not found`);
      }

      const candidate = mapMemoryCandidate(candidateRow);
      ensurePromotableCandidate(candidate);

      const now = new Date();
      requireCandidateTransitionRow(
        await tx
          .update(memoryCandidates)
          .set({
            status: input.decision,
            reviewer: input.reviewer,
            reviewedAt: now,
            metadata: memoryPromotionMetadata(candidate, input),
            updatedAt: now
          })
          .where(and(
            eq(memoryCandidates.id, candidateRow.id),
            inArray(memoryCandidates.status, ["proposed", "candidate"])
          ))
          .returning(),
        "promoteMemoryCandidate",
        candidateRow.id
      );
      const memoryRecordRow = requireReturnedRow(
        await tx
          .insert(memoryRecords)
          .values({
            projectId: candidateRow.projectId,
            key: memoryRecordKeyForCandidate(input),
            kind: candidateRow.kind,
            status: "active",
            summary: candidateRow.summary,
            body: candidateRow.body,
            owner: candidateRow.owner,
            confidence: candidateRow.confidence,
            applicationGuidance: candidateRow.applicationGuidance,
            ...(candidateRow.invalidationRule === null
              ? {}
              : { invalidationRule: candidateRow.invalidationRule }),
            sourceLineage: candidateRow.sourceLineage,
            isUserPreference: candidateRow.isUserPreference,
            validFrom: candidateRow.validFrom,
            ...(candidateRow.validUntil === null
              ? {}
              : { validUntil: candidateRow.validUntil }),
            metadata: {
              ...memoryPromotionMetadata(candidate, input)
            }
          })
          .returning(),
        "promoteMemoryCandidate.insertMemoryRecord"
      );
      const versionRow = requireReturnedRow(
        await tx
          .insert(memoryRecordVersions)
          .values({
            memoryRecordId: memoryRecordRow.id,
            createdFromCandidateId: candidateRow.id,
            version: 1,
            summary: candidateRow.summary,
            body: candidateRow.body,
            owner: candidateRow.owner,
            confidence: candidateRow.confidence,
            applicationGuidance: candidateRow.applicationGuidance,
            ...(candidateRow.invalidationRule === null
              ? {}
              : { invalidationRule: candidateRow.invalidationRule }),
            validFrom: candidateRow.validFrom,
            ...(candidateRow.validUntil === null
              ? {}
              : { validUntil: candidateRow.validUntil }),
            sourceLineage: candidateRow.sourceLineage,
            metadata: memoryPromotionMetadata(candidate, input)
          })
          .returning(),
        "promoteMemoryCandidate.insertMemoryRecordVersion"
      );
      const updatedRecordRow = requireReturnedRow(
        await tx
          .update(memoryRecords)
          .set({
            currentVersionId: versionRow.id,
            updatedAt: now
          })
          .where(eq(memoryRecords.id, memoryRecordRow.id))
          .returning(),
        "promoteMemoryCandidate.updateMemoryRecord"
      );
      await tx.insert(outboxEvents).values({
        topic: "memory.candidate.promoted",
        payload: {
          ...smokePayload(input.metadata),
          memoryCandidateId: candidateRow.id,
          memoryRecordId: updatedRecordRow.id,
          memoryRecordVersionId: versionRow.id,
          projectId: candidateRow.projectId
        }
      });

      return mapMemoryRecord(updatedRecordRow);
    });
  }

  async promoteReviewedMemoryCandidate(input: PromoteMemoryCandidateInput): Promise<MemoryRecord> {
    return this.promoteMemoryCandidate(input);
  }

  async applyReviewedMemoryRevision(
    input: ApplyReviewedMemoryRevisionInput
  ): Promise<ApplyReviewedMemoryRevisionResult> {
    const reviewer = input.reviewer.trim();
    const reason = input.reason.trim();

    if (reviewer.length === 0) throw new Error("applyReviewedMemoryRevision requires reviewer");
    if (reason.length === 0) throw new Error("applyReviewedMemoryRevision requires reason");
    return this.db.transaction(async (tx) => {
      const candidateRow = await tx.query.memoryCandidates.findFirst({
        where: eq(memoryCandidates.id, input.candidateId)
      });
      if (candidateRow === undefined) throw new Error(`Memory candidate ${input.candidateId} was not found`);

      const candidate = mapMemoryCandidate(candidateRow);
      ensurePromotableCandidate(candidate);
      const promotionMetadata = reviewedMemoryRevisionMetadata(candidate, input);
      const now = new Date();
      requireCandidateTransitionRow(
        await tx.update(memoryCandidates).set({
          status: "accepted",
          reviewer,
          reviewedAt: now,
          metadata: promotionMetadata,
          updatedAt: now
        }).where(and(
          eq(memoryCandidates.id, candidateRow.id),
          inArray(memoryCandidates.status, ["proposed", "candidate"])
        )).returning(),
        "applyReviewedMemoryRevision.acceptCandidate",
        candidateRow.id
      );

      const memoryRecordRow = requireReturnedRow(
        await tx.insert(memoryRecords).values({
          projectId: candidateRow.projectId,
          key: memoryRecordKeyForCandidate(input),
          kind: candidateRow.kind,
          status: "active",
          summary: candidateRow.summary,
          body: candidateRow.body,
          owner: candidateRow.owner,
          confidence: candidateRow.confidence,
          applicationGuidance: candidateRow.applicationGuidance,
          ...(candidateRow.invalidationRule === null ? {} : { invalidationRule: candidateRow.invalidationRule }),
          sourceLineage: candidateRow.sourceLineage,
          isUserPreference: candidateRow.isUserPreference,
          validFrom: candidateRow.validFrom,
          ...(candidateRow.validUntil === null ? {} : { validUntil: candidateRow.validUntil }),
          metadata: promotionMetadata
        }).returning(),
        "applyReviewedMemoryRevision.insertReplacement"
      );
      const versionRow = requireReturnedRow(
        await tx.insert(memoryRecordVersions).values({
          memoryRecordId: memoryRecordRow.id,
          createdFromCandidateId: candidateRow.id,
          version: 1,
          summary: candidateRow.summary,
          body: candidateRow.body,
          owner: candidateRow.owner,
          confidence: candidateRow.confidence,
          applicationGuidance: candidateRow.applicationGuidance,
          ...(candidateRow.invalidationRule === null ? {} : { invalidationRule: candidateRow.invalidationRule }),
          sourceLineage: candidateRow.sourceLineage,
          validFrom: candidateRow.validFrom,
          ...(candidateRow.validUntil === null ? {} : { validUntil: candidateRow.validUntil }),
          metadata: promotionMetadata
        }).returning(),
        "applyReviewedMemoryRevision.insertReplacementVersion"
      );
      const replacementRow = requireReturnedRow(
        await tx.update(memoryRecords).set({ currentVersionId: versionRow.id, updatedAt: now })
          .where(eq(memoryRecords.id, memoryRecordRow.id)).returning(),
        "applyReviewedMemoryRevision.updateReplacement"
      );
      await tx.insert(outboxEvents).values({
        topic: "memory.candidate.promoted",
        payload: {
          ...smokePayload(input.metadata),
          memoryCandidateId: candidateRow.id,
          memoryRecordId: replacementRow.id,
          memoryRecordVersionId: versionRow.id,
          projectId: candidateRow.projectId
        }
      });
      await this.options.faultAfterRevisionStage?.("after_promotion");

      const lockIds = [input.sourceMemoryRecordId, replacementRow.id].sort();
      await tx.execute(sql`
        SELECT id FROM ${memoryRecords}
        WHERE id IN (${lockIds[0]}, ${lockIds[1]})
        ORDER BY id FOR UPDATE
      `);
      const currentRow = await tx.query.memoryRecords.findFirst({
        where: eq(memoryRecords.id, input.sourceMemoryRecordId)
      });
      if (currentRow === undefined) throw new Error(`Memory record not found: ${input.sourceMemoryRecordId}`);
      if (currentRow.projectId !== replacementRow.projectId) {
        throw new Error("applyReviewedMemoryRevision requires records from the same project");
      }
      if (currentRow.status !== "active") {
        throw new Error(`applyReviewedMemoryRevision requires an active source record; found ${currentRow.status}`);
      }
      const supersededAt = input.supersededAt === undefined ? now : fromIsoTimestamp(input.supersededAt);
      const supersededRow = requireMemoryRecordTransitionRow(
        await tx.update(memoryRecords).set({
          status: "superseded",
          invalidatedAt: supersededAt,
          invalidationReason: reason,
          metadata: {
            ...currentRow.metadata,
            replacementMemoryRecordId: replacementRow.id,
            supersessionReview: {
              reviewer,
              reason,
              supersededAt: supersededAt.toISOString(),
              supersededByMemoryRecordId: replacementRow.id
            }
          },
          updatedAt: now
        }).where(and(
          eq(memoryRecords.id, input.sourceMemoryRecordId),
          eq(memoryRecords.projectId, replacementRow.projectId),
          eq(memoryRecords.status, "active")
        )).returning(),
        "applyReviewedMemoryRevision.supersedeSource",
        input.sourceMemoryRecordId,
        "active"
      );
      await tx.insert(outboxEvents).values({
        topic: "memory.record.superseded",
        payload: {
          ...smokePayload(input.metadata),
          memoryRecordId: currentRow.id,
          supersededByMemoryRecordId: replacementRow.id,
          projectId: currentRow.projectId
        }
      });

      return {
        memoryRecord: mapMemoryRecord(replacementRow),
        supersededMemoryRecord: mapMemoryRecord(supersededRow)
      };
    });
  }

  async rejectMemoryCandidate(input: RejectMemoryCandidateInput): Promise<MemoryCandidate> {
    const now = new Date();
    const row = requireCandidateTransitionRow(
      await this.db
        .update(memoryCandidates)
        .set({
          status: "rejected",
          reviewer: input.reviewer,
          reviewedAt: now,
          rejectionReason: input.reason,
          updatedAt: now
        })
        .where(and(
          eq(memoryCandidates.id, input.candidateId),
          inArray(memoryCandidates.status, ["proposed", "candidate"])
        ))
        .returning(),
      "rejectMemoryCandidate",
      input.candidateId
    );

    return mapMemoryCandidate(row);
  }

  async listMemoryCandidates(projectId: ProjectId, limit: number): Promise<MemoryCandidate[]> {
    const rows = await this.db.query.memoryCandidates.findMany({
      where: eq(memoryCandidates.projectId, projectId),
      orderBy: asc(memoryCandidates.createdAt),
      limit
    });

    return rows.map(mapMemoryCandidate);
  }

  async invalidateMemoryRecord(input: InvalidateMemoryRecordInput): Promise<MemoryRecord> {
    const reviewer = input.reviewer.trim();
    const reason = input.reason.trim();

    if (reviewer.length === 0) {
      throw new Error("invalidateMemoryRecord requires reviewer");
    }

    if (reason.length === 0) {
      throw new Error("invalidateMemoryRecord requires reason");
    }

    return this.db.transaction(async (tx) => {
      await tx.execute(sql`
        SELECT id
        FROM ${memoryRecords}
        WHERE id = ${input.memoryRecordId}
        FOR UPDATE
      `);
      const currentRow = await tx.query.memoryRecords.findFirst({
        where: eq(memoryRecords.id, input.memoryRecordId)
      });

      if (currentRow === undefined) {
        throw new Error(`MemoryRecord not found: ${input.memoryRecordId}`);
      }

      const invalidatedAt =
        input.invalidatedAt === undefined
          ? new Date()
          : fromIsoTimestamp(input.invalidatedAt);
      const row = requireMemoryRecordTransitionRow(
        await tx
          .update(memoryRecords)
          .set({
            status: "invalidated",
            invalidatedAt,
            invalidationReason: reason,
            metadata: {
              ...currentRow.metadata,
              ...(input.metadata ?? {}),
              invalidationReview: {
                reviewer,
                reason,
                invalidatedAt: invalidatedAt.toISOString()
              }
            },
            updatedAt: new Date()
          })
          .where(and(
            eq(memoryRecords.id, input.memoryRecordId),
            eq(memoryRecords.status, "active")
          ))
          .returning(),
        "invalidateMemoryRecord",
        input.memoryRecordId,
        "active"
      );

      return mapMemoryRecord(row);
    });
  }

  async supersedeMemoryRecord(input: SupersedeMemoryRecordInput): Promise<MemoryRecord> {
    const reviewer = input.reviewer.trim();
    const reason = input.reason.trim();

    if (reviewer.length === 0) {
      throw new Error("supersedeMemoryRecord requires reviewer");
    }

    if (reason.length === 0) {
      throw new Error("supersedeMemoryRecord requires reason");
    }

    return this.db.transaction(async (tx) => {
      if (input.memoryRecordId === input.supersededByMemoryRecordId) {
        throw new Error("supersedeMemoryRecord cannot supersede a record with itself");
      }

      await tx.execute(sql`
        SELECT id
        FROM ${memoryRecords}
        WHERE id IN (${input.memoryRecordId}, ${input.supersededByMemoryRecordId})
        ORDER BY id
        FOR UPDATE
      `);
      const currentRow = await tx.query.memoryRecords.findFirst({
        where: eq(memoryRecords.id, input.memoryRecordId)
      });
      const replacementRow = await tx.query.memoryRecords.findFirst({
        where: eq(memoryRecords.id, input.supersededByMemoryRecordId)
      });

      if (currentRow === undefined) {
        throw new Error(`MemoryRecord not found: ${input.memoryRecordId}`);
      }

      if (replacementRow === undefined) {
        throw new Error(`Superseding MemoryRecord not found: ${input.supersededByMemoryRecordId}`);
      }

      if (currentRow.status !== "active") {
        throw new Error(
          `supersedeMemoryRecord requires an active current record; found ${currentRow.status}`
        );
      }

      if (replacementRow.status !== "active") {
        throw new Error(
          `supersedeMemoryRecord requires an active replacement; found ${replacementRow.status}`
        );
      }

      if (currentRow.projectId !== replacementRow.projectId) {
        throw new Error("supersedeMemoryRecord requires records from the same project");
      }

      const supersededAt =
        input.supersededAt === undefined
          ? new Date()
          : fromIsoTimestamp(input.supersededAt);
      const row = requireMemoryRecordTransitionRow(
        await tx
          .update(memoryRecords)
          .set({
            status: "superseded",
            invalidatedAt: supersededAt,
            invalidationReason: reason,
            metadata: {
              ...currentRow.metadata,
              ...(input.metadata ?? {}),
              supersessionReview: {
                reviewer,
                reason,
                supersededAt: supersededAt.toISOString(),
                supersededByMemoryRecordId: input.supersededByMemoryRecordId
              }
            },
            updatedAt: new Date()
          })
          .where(and(
            eq(memoryRecords.id, input.memoryRecordId),
            eq(memoryRecords.projectId, replacementRow.projectId),
            eq(memoryRecords.status, "active")
          ))
          .returning(),
        "supersedeMemoryRecord",
        input.memoryRecordId,
        "active"
      );

      await tx.insert(outboxEvents).values({
        topic: "memory.record.superseded",
        payload: {
          ...smokePayload(input.metadata),
          memoryRecordId: input.memoryRecordId,
          supersededByMemoryRecordId: input.supersededByMemoryRecordId,
          projectId: currentRow.projectId
        }
      });

      return mapMemoryRecord(row);
    });
  }

  private memoryApplicationInsertValues = (
    input: RecordMemoryApplicationInput,
    decisionPacketChecksum: string
  ) => ({
    memoryRecordId: input.memoryRecordId,
    executionRunId: input.executionRunId,
    decisionPacketChecksum,
    ...(input.taskContractId === undefined
      ? {}
      : { taskContractId: input.taskContractId }),
    ...(input.contextAssemblyId === undefined
      ? {}
      : { contextAssemblyId: input.contextAssemblyId }),
    expectedUse: input.expectedUse,
    outcome: input.outcome,
    notes: input.notes,
    metadata: {
      ...input.metadata,
      decisionPacketChecksum,
      decisionPacketGeneratedAt: input.packetGeneratedAt,
      decisionPacketSourceRunLifecycleRevision: input.sourceRunLifecycleRevision,
      memoryApplicationRequestFingerprint: memoryApplicationRequestFingerprint(input),
      ...(input.evidenceBundleId === undefined
        ? {}
        : { verificationEvidenceBundleId: input.evidenceBundleId })
    }
  });

  private assertPacketBoundApplication = (
    input: Pick<
      RecordMemoryApplicationInput,
      "executionRunId" | "packetChecksum" | "packetGeneratedAt" | "sourceRunLifecycleRevision"
    >
  ): void => {
    if (
      input.executionRunId.trim().length === 0 ||
      input.packetChecksum.trim().length === 0 ||
      !Number.isFinite(Date.parse(input.packetGeneratedAt)) ||
      !Number.isSafeInteger(input.sourceRunLifecycleRevision) ||
      input.sourceRunLifecycleRevision < 1
    ) {
      throw new Error(
        "memory application requires a non-empty execution run, DecisionPacket checksum, packet generatedAt, and lifecycle revision"
      );
    }
  };

  private async requireCurrentMemoryApplicationAuthority<
    TInput extends RecordMemoryApplicationInput
  >(
    input: TInput,
    tx: KrnDatabaseTransaction,
    aggregate?: HarnessRunAggregate
  ): Promise<{
    input: TInput;
    projectId: ProjectId;
    taskContractId: HarnessRunAggregate["taskContract"]["id"];
  }> {
    const authorityAggregate = aggregate ?? await new DrizzleHarnessRunRepository(this.db)
      .readHarnessRunAuthority(tx, input.executionRunId);
    const authority = await this.requireMemoryApplicationProject(
      input,
      tx,
      authorityAggregate
    );
    const issuanceRow = await tx.query.decisionPacketIssuances.findFirst({
      where: eq(decisionPacketIssuances.executionRunId, input.executionRunId)
    });
    if (issuanceRow === undefined) {
      throw new Error("memory application authority rejected: issued DecisionPacket is required");
    }
    const authorization = authorizeIssuedDecisionPacketUsefulness({
      aggregate: authority.aggregate,
      issuance: mapDecisionPacketIssuance(issuanceRow),
      runId: input.executionRunId,
      runtimeProjectId: authority.projectId,
      callerPacketChecksum: input.packetChecksum,
      callerPacketGeneratedAt: input.packetGeneratedAt,
      callerSourceRunLifecycleRevision: input.sourceRunLifecycleRevision,
      subjects: [{
        kind: "memory_record",
        id: input.memoryRecordId,
        evidenceRefs: [`packet:${input.packetChecksum}`]
      }]
    });

    if (!authorization.authorized) {
      throw new Error(
        `memory application authority rejected: ${authorization.reason}`
      );
    }
    if (authorization.sourceRunLifecycleRevision !== input.sourceRunLifecycleRevision) {
      throw new Error("memory application authority rejected: lifecycle revision mismatch");
    }
    if (
      authority.aggregate.executionRun.lifecycleRevision !==
      input.sourceRunLifecycleRevision
    ) {
      throw new Error("memory application authority rejected: lifecycle revision mismatch");
    }

    return {
      input: this.deriveMemoryApplicationLineage(input, authority.aggregate),
      projectId: authority.projectId,
      taskContractId: authority.aggregate.taskContract.id
    };
  }

  private async requireMemoryApplicationProject(
    input: RecordMemoryApplicationInput,
    tx: KrnDatabaseTransaction,
    aggregate: HarnessRunAggregate | undefined
  ): Promise<{ aggregate: HarnessRunAggregate; projectId: ProjectId }> {
    const memoryRecord = await tx.query.memoryRecords.findFirst({
      where: eq(memoryRecords.id, input.memoryRecordId)
    });
    const projectId = aggregate?.taskContract.projectId;

    if (
      aggregate === undefined ||
      memoryRecord === undefined ||
      projectId === undefined ||
      memoryRecord.projectId !== projectId
    ) {
      throw new Error(
        "memory application authority rejected: run, task project, and memory record do not match"
      );
    }

    return { aggregate, projectId };
  }

  private deriveMemoryApplicationLineage<TInput extends RecordMemoryApplicationInput>(
    input: TInput,
    aggregate: HarnessRunAggregate
  ): TInput {
    if (
      input.taskContractId !== undefined &&
      input.taskContractId !== aggregate.taskContract.id
    ) {
      throw new Error(
        "memory application authority rejected: task contract does not match the execution run"
      );
    }

    const contextAssemblyId = aggregate.contextAssembly?.id;
    if (
      input.contextAssemblyId !== undefined &&
      input.contextAssemblyId !== contextAssemblyId
    ) {
      throw new Error(
        "memory application authority rejected: context assembly does not match the execution run"
      );
    }

    return {
      ...input,
      taskContractId: aggregate.taskContract.id,
      ...(contextAssemblyId === undefined ? {} : { contextAssemblyId })
    };
  }

  private async applyMemoryApplicationOutcome(
    input: RecordMemoryApplicationInput,
    tx: KrnDatabase
  ): Promise<void> {
    if (input.outcome === "helped") {
      await tx
        .update(memoryRecords)
        .set({
          positiveFeedbackCount: sql`${memoryRecords.positiveFeedbackCount} + 1`,
          updatedAt: new Date()
        })
        .where(eq(memoryRecords.id, input.memoryRecordId));
    }

    if (input.outcome === "hurt" || input.outcome === "stale") {
      await tx
        .update(memoryRecords)
        .set({
          negativeFeedbackCount: sql`${memoryRecords.negativeFeedbackCount} + 1`,
          updatedAt: new Date()
        })
        .where(eq(memoryRecords.id, input.memoryRecordId));
    }
  }

  private async assertHelpedApplicationEvidence(
    input: RecordMemoryApplicationInput & { packetChecksum?: string },
    tx: KrnDatabase
  ): Promise<void> {
    if (input.outcome !== "helped") {
      return;
    }

    if (input.evidenceBundleId === undefined || input.packetChecksum === undefined) {
      throw new Error(
        "helped memory application requires a fresh successful verification EvidenceBundle from the active EvidenceContract"
      );
    }

    const [lockedExecutionRun] = await tx
      .select()
      .from(executionRuns)
      .where(eq(executionRuns.id, input.executionRunId))
      .limit(1)
      .for("update");

    if (
      lockedExecutionRun === undefined ||
      lockedExecutionRun.lifecycleRevision !== input.sourceRunLifecycleRevision
    ) {
      throw new Error(
        "helped memory application requires a fresh successful verification EvidenceBundle from the active EvidenceContract"
      );
    }

    const linked = await this.findApplicationEvidenceBundle(
      input.evidenceBundleId,
      input.executionRunId,
      tx
    );

    if (linked === undefined) {
      throw new Error(
        "helped memory application requires a fresh successful verification EvidenceBundle from the active EvidenceContract"
      );
    }

    const bundle = mapEvidenceBundle(
      linked.bundle,
      linked.commandOutputArtifactRows.map(mapCommandOutputArtifact)
    );
    const activation = decideEvidenceContractActivation({
      evidenceContract: linked.harnessPlan.metadata.evidenceContract,
      taskContract: linked.taskContract,
      harnessPlan: linked.harnessPlan,
      executionRun: linked.executionRun
    });
    if (activation.status !== "active") {
      throw new Error(
        "helped memory application requires a fresh successful verification EvidenceBundle from the active EvidenceContract"
      );
    }
    const valid = evidenceBundleProvesHelped({
      bundle,
      evidenceContract: activation.evidenceContract,
      packetChecksum: input.packetChecksum,
      packetGeneratedAt: input.packetGeneratedAt,
      sourceRunLifecycleRevision: input.sourceRunLifecycleRevision,
      sha256Hex
    });

    if (!valid) {
      throw new Error(
        "helped memory application requires a fresh successful verification EvidenceBundle from the active EvidenceContract"
      );
    }
  }

  private async findApplicationEvidenceBundle(
    evidenceBundleId: string,
    executionRunId: string,
    tx: KrnDatabase
  ) {
    const [linked] = await tx
      .select({
        bundle: evidenceBundles,
        executionRun: executionRuns,
        harnessPlan: harnessPlans,
        taskContract: taskContracts
      })
      .from(evidenceBundles)
      .innerJoin(executionRuns, eq(executionRuns.id, evidenceBundles.executionRunId))
      .innerJoin(harnessPlans, eq(harnessPlans.id, executionRuns.harnessPlanId))
      .innerJoin(taskContracts, eq(taskContracts.id, harnessPlans.taskContractId))
      .where(and(
        eq(evidenceBundles.id, evidenceBundleId),
        eq(evidenceBundles.executionRunId, executionRunId),
        inArray(evidenceBundles.status, ["captured", "verified"])
      ))
      .limit(1);

    if (linked === undefined) {
      return undefined;
    }

    const commandOutputArtifactRows = await tx.query.evidenceCommandArtifacts.findMany({
      where: eq(evidenceCommandArtifacts.evidenceBundleId, linked.bundle.id),
      orderBy: asc(evidenceCommandArtifacts.commandOrdinal)
    });

    return { ...linked, commandOutputArtifactRows };
  }

  private async findMemoryApplicationByPacketIdentity(
    input: RecordMemoryApplicationOnceInput,
    tx: KrnDatabase
  ): Promise<MemoryApplicationRow | undefined> {
    const [existing] = await tx
      .select()
      .from(memoryApplications)
      .where(and(
        eq(memoryApplications.memoryRecordId, input.memoryRecordId),
        eq(memoryApplications.executionRunId, input.executionRunId),
        eq(memoryApplications.decisionPacketChecksum, input.packetChecksum)
      ))
      .limit(1);

    return existing;
  }

  private assertExactMemoryApplicationRetry(
    input: RecordMemoryApplicationWithEffectsOnceInput,
    existing: MemoryApplicationRow
  ): void {
    const retryInput = {
      ...input,
      ...(input.taskContractId !== undefined
        ? { taskContractId: input.taskContractId }
        : existing.taskContractId === null
          ? {}
          : { taskContractId: existing.taskContractId }),
      ...(input.contextAssemblyId !== undefined
        ? { contextAssemblyId: input.contextAssemblyId }
        : existing.contextAssemblyId === null
          ? {}
          : { contextAssemblyId: existing.contextAssemblyId })
    };
    const existingFingerprint = memoryApplicationFingerprintFromRow(existing);

    if (
      existingFingerprint === undefined ||
      existingFingerprint !== memoryApplicationRequestFingerprint(retryInput)
    ) {
      throw new MemoryApplicationIdentityConflictError(
        input.memoryRecordId,
        input.executionRunId,
        input.packetChecksum
      );
    }
  }

  private async readExactMemoryApplicationRetry(
    input: RecordMemoryApplicationWithEffectsOnceInput,
    tx: KrnDatabase
  ): Promise<MemoryApplicationRow | undefined> {
    const existing = await this.findMemoryApplicationByPacketIdentity(input, tx);

    if (existing !== undefined) {
      this.assertExactMemoryApplicationRetry(input, existing);
    }

    return existing;
  }

  private async admitMemoryApplicationOnce<
    TInput extends RecordMemoryApplicationWithEffectsOnceInput
  >(
    input: TInput,
    tx: KrnDatabaseTransaction
  ): Promise<
    | { kind: "existing"; row: MemoryApplicationRow }
    | {
        kind: "admitted";
        input: TInput;
        projectId: ProjectId;
        taskContractId: HarnessRunAggregate["taskContract"]["id"];
      }
  > {
    const aggregate = await new DrizzleHarnessRunRepository(this.db)
      .readHarnessRunAuthority(tx, input.executionRunId);
    const existing = await this.readExactMemoryApplicationRetry(input, tx);

    if (existing !== undefined) {
      return { kind: "existing", row: existing };
    }

    const authority = await this.requireCurrentMemoryApplicationAuthority(input, tx, aggregate);

    return { kind: "admitted", ...authority };
  }

  private async insertMemoryApplicationOnceRow(
    input: RecordMemoryApplicationOnceInput,
    tx: KrnDatabase
  ): Promise<{ row: MemoryApplicationRow; created: boolean }> {
    this.assertPacketBoundApplication(input);
    const metadata = {
      ...input.metadata,
      decisionPacketChecksum: input.packetChecksum
    };
    const [createdRow] = await tx
      .insert(memoryApplications)
      .values(this.memoryApplicationInsertValues({ ...input, metadata }, input.packetChecksum))
      .onConflictDoNothing({
        target: [
          memoryApplications.memoryRecordId,
          memoryApplications.executionRunId,
          memoryApplications.decisionPacketChecksum
        ]
      })
      .returning();

    if (createdRow !== undefined) {
      return { row: createdRow, created: true };
    }

    const existing = await this.readExactMemoryApplicationRetry(input, tx);

    return {
      row: requireReturnedRow(
        existing === undefined ? [] : [existing],
        "recordMemoryApplicationWithEffectsOnce"
      ),
      created: false
    };
  }

  private async readMemoryApplicationEffects(
    application: MemoryApplicationRow,
    tx: KrnDatabase
  ): Promise<Pick<RecordMemoryApplicationWithEffectsOnceResult, "feedbackEvent" | "antiMemoryCandidate">> {
    const feedbackRow = await tx.query.memoryFeedbackEvents.findFirst({
      where: sql`${memoryFeedbackEvents.metadata}->>'memoryApplicationId' = ${application.id}`
    });
    const candidateRow = await tx.query.antiMemoryCandidates.findFirst({
      where: sql`${antiMemoryCandidates.metadata}->>'memoryApplicationId' = ${application.id}`
    });

    return {
      ...(feedbackRow === undefined ? {} : { feedbackEvent: mapMemoryFeedbackEvent(feedbackRow) }),
      ...(candidateRow === undefined
        ? {}
        : { antiMemoryCandidate: mapAntiMemoryCandidate(candidateRow) })
    };
  }

  private async createNegativeMemoryCandidateEffect(
    input: RecordMemoryApplicationWithEffectsOnceInput,
    feedbackInput: NonNullable<RecordMemoryApplicationWithEffectsOnceInput["negativeEffects"]>,
    applicationRow: MemoryApplicationRow,
    feedbackRow: InferSelectModel<typeof memoryFeedbackEvents>,
    tx: KrnDatabase
  ): Promise<AntiMemoryCandidate> {
    const memoryRecordRow = await tx.query.memoryRecords.findFirst({
      where: eq(memoryRecords.id, input.memoryRecordId)
    });
    if (memoryRecordRow === undefined) {
      throw new Error(`MemoryRecord not found: ${input.memoryRecordId}`);
    }

    const maintenanceIdentity = `memory-application:${applicationRow.id}:${input.outcome}`;
    const candidateInput: CreateAntiMemoryCandidateInput = {
      projectId: memoryRecordRow.projectId,
      executionRunId: input.executionRunId,
      proposedBy: "krn-memory-feedback",
      maintenanceIdentity,
      key: feedbackInput.candidate.key,
      rejectedClaim: feedbackInput.candidate.rejectedClaim,
      reason: feedbackInput.candidate.reason,
      invalidatedBySourceClaimIds: feedbackInput.candidate.invalidatedBySourceClaimIds,
      appliesTo: feedbackInput.candidate.appliesTo,
      ...(feedbackInput.candidate.mayRevisitWhen === undefined
        ? {}
        : { mayRevisitWhen: feedbackInput.candidate.mayRevisitWhen }),
      summary: feedbackInput.candidate.summary,
      body: feedbackInput.candidate.body,
      owner: feedbackInput.candidate.owner,
      confidence: feedbackInput.candidate.confidence,
      sourceLineage: feedbackInput.candidate.sourceLineage,
      metadata: {
        ...feedbackInput.metadata,
        memoryApplicationId: applicationRow.id,
        memoryFeedbackEventId: feedbackRow.id,
        applicationOutcome: input.outcome,
        doesNotProve:
          "This candidate does not prove the memory should be invalidated or demoted without review."
      }
    };
    assertAntiMemoryCandidateInvariants(candidateInput, "Anti-memory candidate");
    const [candidateInserted] = await tx
      .insert(antiMemoryCandidates)
      .values(antiMemoryCandidateInsertValues(candidateInput))
      .onConflictDoNothing({
        target: [antiMemoryCandidates.projectId, antiMemoryCandidates.maintenanceIdentity]
      })
      .returning();
    const candidateRow = candidateInserted ?? await tx.query.antiMemoryCandidates.findFirst({
      where: and(
        eq(antiMemoryCandidates.projectId, candidateInput.projectId),
        eq(antiMemoryCandidates.maintenanceIdentity, maintenanceIdentity)
      )
    });
    const resolvedCandidateRow = requireReturnedRow(
      candidateRow === undefined ? [] : [candidateRow],
      "recordMemoryApplicationWithEffectsOnce.createAntiMemoryCandidate"
    );
    await this.options.faultAfterStage?.("after_candidate");

    return mapAntiMemoryCandidate(resolvedCandidateRow);
  }

  async recordMemoryApplicationWithEffectsOnce(
    input: RecordMemoryApplicationWithEffectsOnceInput
  ): Promise<RecordMemoryApplicationWithEffectsOnceResult> {
    const authorityInput = structuredClone(input);
    this.assertPacketBoundApplication(authorityInput);
    if (
      (authorityInput.outcome === "hurt" || authorityInput.outcome === "stale") &&
      (authorityInput.negativeEffects === undefined ||
        authorityInput.negativeEffects.outcome !== authorityInput.outcome)
    ) {
      throw new Error("negative memory application requires its review effects");
    }

    return this.db.transaction(async (tx) => {
      const admission = await this.admitMemoryApplicationOnce(authorityInput, tx);
      if (admission.kind === "existing") {
        return {
          application: mapMemoryApplication(admission.row),
          ...(await this.readMemoryApplicationEffects(admission.row, tx)),
          created: false
        };
      }
      const admittedInput = admission.input;
      await this.assertHelpedApplicationEvidence(admittedInput, tx);
      const applicationResult = await this.insertMemoryApplicationOnceRow(admittedInput, tx);

      if (!applicationResult.created) {
        return {
          application: mapMemoryApplication(applicationResult.row),
          ...(await this.readMemoryApplicationEffects(applicationResult.row, tx)),
          created: false
        };
      }

      requireReturnedRow(
        await tx
          .insert(usefulnessApplications)
          .values({
            applicationId: applicationResult.row.id,
            subjectKind: "memory_record",
            subjectId: admittedInput.memoryRecordId,
            projectId: admission.projectId,
            executionRunId: admittedInput.executionRunId,
            taskContractId: admission.taskContractId,
            packetChecksum: admittedInput.packetChecksum,
            packetGeneratedAt: fromIsoTimestamp(admittedInput.packetGeneratedAt),
            sourceRunLifecycleRevision: admittedInput.sourceRunLifecycleRevision
          })
          .returning(),
        "recordMemoryApplicationWithEffectsOnce.recordCanonicalUsefulness"
      );

      await this.options.faultAfterStage?.("after_application");
      await this.applyMemoryApplicationOutcome(admittedInput, tx);
      await this.options.faultAfterStage?.("after_counter");

      if (admittedInput.negativeEffects === undefined) {
        await tx.insert(outboxEvents).values({
          topic: "memory.application.created",
          payload: {
            ...smokePayload(admittedInput.metadata),
            memoryApplicationId: applicationResult.row.id,
            memoryRecordId: applicationResult.row.memoryRecordId,
            executionRunId: applicationResult.row.executionRunId
          }
        });
        await this.options.faultAfterStage?.("after_outbox");

        return {
          application: mapMemoryApplication(applicationResult.row),
          created: true
        };
      }

      const feedbackInput = admittedInput.negativeEffects;
      const feedbackRow = requireReturnedRow(
        await tx
          .insert(memoryFeedbackEvents)
          .values({
            memoryRecordId: admittedInput.memoryRecordId,
            executionRunId: admittedInput.executionRunId,
            eventType: feedbackInput.eventType,
            direction: "negative",
            note: feedbackInput.note,
            reason: feedbackInput.reason,
            ...(feedbackInput.evidenceRef === undefined
              ? {}
              : { evidenceRef: feedbackInput.evidenceRef }),
            metadata: {
              ...feedbackInput.metadata,
              memoryApplicationId: applicationResult.row.id,
              applicationOutcome: admittedInput.outcome
            }
          })
          .returning(),
        "recordMemoryApplicationWithEffectsOnce.createMemoryFeedbackEvent"
      );
      await this.options.faultAfterStage?.("after_feedback");

      const antiMemoryCandidate = await this.createNegativeMemoryCandidateEffect(
        admittedInput,
        feedbackInput,
        applicationResult.row,
        feedbackRow,
        tx
      );

      await tx.insert(outboxEvents).values([
        {
          topic: "memory.application.created",
          payload: {
            ...smokePayload(admittedInput.metadata),
            memoryApplicationId: applicationResult.row.id,
            memoryRecordId: applicationResult.row.memoryRecordId,
            executionRunId: applicationResult.row.executionRunId
          }
        },
        {
          topic: "memory.feedback.created",
          payload: {
            ...smokePayload(input.metadata),
            memoryApplicationId: applicationResult.row.id,
            memoryFeedbackEventId: feedbackRow.id,
            memoryRecordId: feedbackRow.memoryRecordId
          }
        },
        {
          topic: "anti_memory.candidate.created",
          payload: {
            ...smokePayload(input.metadata),
            memoryApplicationId: applicationResult.row.id,
            antiMemoryCandidateId: antiMemoryCandidate.id,
            projectId: antiMemoryCandidate.projectId
          }
        }
      ]);
      await this.options.faultAfterStage?.("after_outbox");

      return {
        application: mapMemoryApplication(applicationResult.row),
        feedbackEvent: mapMemoryFeedbackEvent(feedbackRow),
        antiMemoryCandidate,
        created: true
      };
    });
  }

  private async isCanonicalMemoryApplication(
    row: MemoryApplicationRow,
    tx: KrnDatabase
  ): Promise<boolean> {
    const packetIdentity = packetBoundMemoryApplicationIdentity(row);

    if (
      row.outcome === null ||
      packetIdentity === undefined ||
      memoryApplicationFingerprintFromRow(row) === undefined
    ) {
      return false;
    }
    const admission = await tx.query.usefulnessApplications.findFirst({
      where: eq(usefulnessApplications.applicationId, row.id)
    });
    if (!memoryUsefulnessAdmissionMatches(admission, row, packetIdentity)) {
      return false;
    }

    if (row.outcome !== "helped") {
      return true;
    }

    const verificationEvidenceBundleId = row.metadata.verificationEvidenceBundleId;
    if (typeof verificationEvidenceBundleId !== "string") {
      return false;
    }

    const linked = await this.findApplicationEvidenceBundle(
      verificationEvidenceBundleId,
      packetIdentity.executionRunId,
      tx
    );

    if (linked === undefined) {
      return false;
    }

    // Canonical replay preserves proof admitted while the run was active. Reclassifying
    // against a later terminal lifecycle would erase valid historical feedback; the
    // transactional write guard above owns current activation admission.
    return evidenceBundleProvesHelped({
      bundle: mapEvidenceBundle(
        linked.bundle,
        linked.commandOutputArtifactRows.map(mapCommandOutputArtifact)
      ),
      evidenceContract: parseEvidenceContract(linked.harnessPlan.metadata.evidenceContract),
      packetChecksum: packetIdentity.packetChecksum,
      packetGeneratedAt: packetIdentity.packetGeneratedAt,
      sourceRunLifecycleRevision: packetIdentity.sourceRunLifecycleRevision,
      sha256Hex
    });
  }

  private async classifyMemoryApplications(tx: KrnDatabase): Promise<{
    applicationRows: MemoryApplicationRow[];
    canonicalApplications: MemoryApplicationRow[];
  }> {
    const applicationRows = await tx.select().from(memoryApplications);
    const canonicalApplications: MemoryApplicationRow[] = [];

    for (const row of applicationRows) {
      if (await this.isCanonicalMemoryApplication(row, tx)) {
        canonicalApplications.push(row);
      }
    }

    return { applicationRows, canonicalApplications };
  }

  private memoryApplicationCounterState(
    canonicalApplications: readonly MemoryApplicationRow[]
  ): MemoryApplicationCounterState {
    const canonicalOutcomeCounts: Record<MemoryApplicationOutcome, number> = {
      helped: 0,
      hurt: 0,
      neutral: 0,
      stale: 0
    };
    const countsByMemoryRecord = new Map<
      string,
      { positiveFeedbackCount: number; negativeFeedbackCount: number }
    >();

    for (const row of canonicalApplications) {
      if (row.outcome === null) {
        continue;
      }

      canonicalOutcomeCounts[row.outcome] += 1;
      const counts = countsByMemoryRecord.get(row.memoryRecordId) ?? {
        positiveFeedbackCount: 0,
        negativeFeedbackCount: 0
      };
      if (row.outcome === "helped") {
        counts.positiveFeedbackCount += 1;
      }
      if (row.outcome === "hurt" || row.outcome === "stale") {
        counts.negativeFeedbackCount += 1;
      }
      countsByMemoryRecord.set(row.memoryRecordId, counts);
    }

    return { canonicalOutcomeCounts, countsByMemoryRecord };
  }

  private async persistMemoryApplicationCounters(
    state: MemoryApplicationCounterState,
    tx: KrnDatabase
  ): Promise<number> {
    const memoryRecordRows = await tx.select({ id: memoryRecords.id }).from(memoryRecords);
    await tx
      .update(memoryRecords)
      .set({
        positiveFeedbackCount: 0,
        negativeFeedbackCount: 0
      })
      .where(isNotNull(memoryRecords.id));
    this.options.faultAfterCounterRebuildReset?.();

    for (const [memoryRecordId, counts] of state.countsByMemoryRecord) {
      await tx
        .update(memoryRecords)
        .set({
          positiveFeedbackCount: counts.positiveFeedbackCount,
          negativeFeedbackCount: counts.negativeFeedbackCount
        })
        .where(eq(memoryRecords.id, memoryRecordId));
    }

    return memoryRecordRows.length;
  }

  async rebuildMemoryApplicationCounters(): Promise<RebuildMemoryApplicationCountersResult> {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`lock table "memory_applications" in share mode`);
      const { applicationRows, canonicalApplications } = await this.classifyMemoryApplications(tx);
      const counterState = this.memoryApplicationCounterState(canonicalApplications);
      await this.options.beforeCounterRebuildPersist?.();
      const rebuiltMemoryRecordCount = await this.persistMemoryApplicationCounters(
        counterState,
        tx
      );

      return {
        canonicalApplicationCount: canonicalApplications.length,
        legacyApplicationCount: applicationRows.length - canonicalApplications.length,
        rebuiltMemoryRecordCount,
        canonicalOutcomeCounts: counterState.canonicalOutcomeCounts
      };
    });
  }

  async createMemoryFeedbackEvent(
    input: CreateMemoryFeedbackEventInput
  ): Promise<MemoryFeedbackEvent> {
    const row = requireReturnedRow(
      await this.db
        .insert(memoryFeedbackEvents)
        .values({
          memoryRecordId: input.memoryRecordId,
          ...(input.executionRunId === undefined
            ? {}
            : { executionRunId: input.executionRunId }),
          ...(input.feedbackDeltaId === undefined
            ? {}
            : { feedbackDeltaId: input.feedbackDeltaId }),
          ...(input.eventType === undefined ? {} : { eventType: input.eventType }),
          direction: input.direction,
          note: input.note,
          ...(input.reason === undefined ? {} : { reason: input.reason }),
          ...(input.evidenceRef === undefined ? {} : { evidenceRef: input.evidenceRef }),
          metadata: input.metadata ?? {}
        })
        .returning(),
      "createMemoryFeedbackEvent"
    );

    return mapMemoryFeedbackEvent(row);
  }

  async createAntiMemoryCandidate(
    input: CreateAntiMemoryCandidateInput
  ): Promise<AntiMemoryCandidate> {
    assertAntiMemoryCandidateInvariants(input, "Anti-memory candidate");

    return this.db.transaction(async (tx) => {
      const insert = tx
        .insert(antiMemoryCandidates)
        .values(antiMemoryCandidateInsertValues(input));
      const insertedRows = input.maintenanceIdentity === undefined
        ? await insert.returning()
        : await insert
          .onConflictDoNothing({
            target: [antiMemoryCandidates.projectId, antiMemoryCandidates.maintenanceIdentity]
          })
          .returning();
      let row = insertedRows[0];
      const created = row !== undefined;

      if (row === undefined && input.maintenanceIdentity !== undefined) {
        row = (await tx
          .select()
          .from(antiMemoryCandidates)
          .where(and(
            eq(antiMemoryCandidates.projectId, input.projectId),
            eq(antiMemoryCandidates.maintenanceIdentity, input.maintenanceIdentity)
          ))
          .limit(1))[0];
      }

      const resolvedRow = requireReturnedRow(
        row === undefined ? [] : [row],
        "createAntiMemoryCandidate"
      );

      if (created) {
        await tx.insert(outboxEvents).values({
          topic: "anti_memory.candidate.created",
          payload: {
            ...smokePayload(input.metadata),
            ...(input.maintenanceIdentity === undefined
              ? {}
              : { maintenanceIdentity: input.maintenanceIdentity }),
            antiMemoryCandidateId: resolvedRow.id,
            projectId: resolvedRow.projectId
          }
        });
      }

      return mapAntiMemoryCandidate(resolvedRow);
    });
  }

  async getAntiMemoryCandidateById(id: string): Promise<AntiMemoryCandidate | undefined> {
    const row = await this.db.query.antiMemoryCandidates.findFirst({
      where: eq(antiMemoryCandidates.id, id)
    });

    return row === undefined ? undefined : mapAntiMemoryCandidate(row);
  }

  async promoteReviewedAntiMemoryCandidate(
    input: PromoteAntiMemoryCandidateInput
  ): Promise<AntiMemoryRecord> {
    return this.db.transaction(async (tx) => {
      const candidateRow = await tx.query.antiMemoryCandidates.findFirst({
        where: eq(antiMemoryCandidates.id, input.candidateId)
      });

      if (candidateRow === undefined) {
        throw new Error(`Anti-memory candidate ${input.candidateId} was not found`);
      }

      const candidate = mapAntiMemoryCandidate(candidateRow);
      ensurePromotableAntiMemoryCandidate(candidate);

      const now = new Date();
      const metadata = antiMemoryPromotionMetadata(candidate, input);
      requireCandidateTransitionRow(
        await tx
          .update(antiMemoryCandidates)
          .set({
            status: input.decision,
            reviewer: input.reviewer,
            reviewedAt: now,
            metadata,
            updatedAt: now
          })
          .where(and(
            eq(antiMemoryCandidates.id, candidateRow.id),
            inArray(antiMemoryCandidates.status, ["proposed", "candidate"])
          ))
          .returning(),
        "promoteReviewedAntiMemoryCandidate",
        candidateRow.id
      );
      const antiMemoryRow = requireReturnedRow(
        await tx
          .insert(antiMemoryRecords)
          .values({
            projectId: candidateRow.projectId,
            ...(candidateRow.executionRunId === null
              ? {}
              : { executionRunId: candidateRow.executionRunId }),
            createdFromCandidateId: candidateRow.id,
            key: antiMemoryRecordKeyForCandidate(candidate, input),
            ...(candidateRow.rejectedClaim === null
              ? {}
              : { rejectedClaim: candidateRow.rejectedClaim }),
            ...(candidateRow.reason === null ? {} : { reason: candidateRow.reason }),
            invalidatedBySourceClaimIds: candidateRow.invalidatedBySourceClaimIds,
            ...(candidateRow.appliesTo === null ? {} : { appliesTo: candidateRow.appliesTo }),
            ...(candidateRow.mayRevisitWhen === null
              ? {}
              : { mayRevisitWhen: candidateRow.mayRevisitWhen }),
            summary: candidateRow.summary,
            body: candidateRow.body,
            owner: candidateRow.owner,
            confidence: candidateRow.confidence,
            sourceLineage: candidateRow.sourceLineage,
            validFrom: candidateRow.validFrom,
            ...(candidateRow.validUntil === null
              ? {}
              : { validUntil: candidateRow.validUntil }),
            metadata
          })
          .returning(),
        "promoteReviewedAntiMemoryCandidate.insertAntiMemoryRecord"
      );

      await tx.insert(outboxEvents).values({
        topic: "anti_memory.candidate.promoted",
        payload: {
          ...smokePayload(input.metadata),
          antiMemoryCandidateId: candidateRow.id,
          antiMemoryRecordId: antiMemoryRow.id,
          projectId: candidateRow.projectId
        }
      });

      return mapAntiMemoryRecord(antiMemoryRow);
    });
  }

  async rejectAntiMemoryCandidate(
    input: RejectAntiMemoryCandidateInput
  ): Promise<AntiMemoryCandidate> {
    const now = new Date();
    const row = requireCandidateTransitionRow(
      await this.db
        .update(antiMemoryCandidates)
        .set({
          status: "rejected",
          reviewer: input.reviewer,
          reviewedAt: now,
          rejectionReason: input.reason,
          metadata: input.metadata ?? {},
          updatedAt: now
        })
        .where(and(
          eq(antiMemoryCandidates.id, input.candidateId),
          inArray(antiMemoryCandidates.status, ["proposed", "candidate"])
        ))
        .returning(),
      "rejectAntiMemoryCandidate",
      input.candidateId
    );

    return mapAntiMemoryCandidate(row);
  }

  async listAntiMemoryCandidates(
    projectId: ProjectId,
    limit: number
  ): Promise<AntiMemoryCandidate[]> {
    const rows = await this.db.query.antiMemoryCandidates.findMany({
      where: eq(antiMemoryCandidates.projectId, projectId),
      orderBy: asc(antiMemoryCandidates.createdAt),
      limit
    });

    return rows.map(mapAntiMemoryCandidate);
  }

  async createAntiMemoryRecord(input: CreateAntiMemoryRecordInput): Promise<AntiMemoryRecord> {
    assertAntiMemoryCandidateInvariants(input, "Anti-memory record");

    const row = requireReturnedRow(
      await this.db
        .insert(antiMemoryRecords)
        .values({
          projectId: input.projectId,
          ...(input.executionRunId === undefined
            ? {}
            : { executionRunId: input.executionRunId }),
          key: input.key,
          ...(input.rejectedClaim === undefined
            ? {}
            : { rejectedClaim: input.rejectedClaim }),
          ...(input.reason === undefined ? {} : { reason: input.reason }),
          invalidatedBySourceClaimIds: input.invalidatedBySourceClaimIds ?? [],
          ...(input.appliesTo === undefined ? {} : { appliesTo: input.appliesTo }),
          ...(input.mayRevisitWhen === undefined
            ? {}
            : { mayRevisitWhen: input.mayRevisitWhen }),
          ...(input.validFrom === undefined
            ? {}
            : { validFrom: fromIsoTimestamp(input.validFrom) }),
          ...(input.validUntil === undefined
            ? {}
            : { validUntil: fromIsoTimestamp(input.validUntil) }),
          summary: input.summary,
          body: input.body,
          owner: input.owner,
          confidence: input.confidence,
          sourceLineage: input.sourceLineage,
          metadata: input.metadata ?? {}
        })
        .returning(),
      "createAntiMemoryRecord"
    );

    return mapAntiMemoryRecord(row);
  }

  async listAntiMemoryForProject(
    projectId: ProjectId,
    limit: number,
    options?: AntiMemorySelectionOptions
  ): Promise<AntiMemoryRecord[]> {
    const now = selectionDate(options?.now);
    if (now === undefined) {
      return [];
    }

    const terms = [...new Set(
      (options?.terms ?? [])
        .map((term) => term.trim().toLowerCase())
        .filter((term) => term.length > 0)
    )];
    const searchableText = sql`lower(concat_ws(' ',
      ${antiMemoryRecords.key},
      ${antiMemoryRecords.rejectedClaim},
      ${antiMemoryRecords.reason},
      ${antiMemoryRecords.appliesTo},
      ${antiMemoryRecords.mayRevisitWhen},
      ${antiMemoryRecords.summary},
      ${antiMemoryRecords.body},
      ${antiMemoryRecords.owner}
    ))`;
    const relevanceFilter = terms.length === 0
      ? undefined
      : or(...terms.map((term) => sql`strpos(${searchableText}, ${term}) > 0`));
    const rows = await this.db.query.antiMemoryRecords.findMany({
      where: and(
        eq(antiMemoryRecords.projectId, projectId),
        lte(antiMemoryRecords.validFrom, now),
        or(isNull(antiMemoryRecords.validUntil), gt(antiMemoryRecords.validUntil, now)),
        or(isNull(antiMemoryRecords.invalidatedAt), gt(antiMemoryRecords.invalidatedAt, now)),
        relevanceFilter
      ),
      orderBy: [asc(antiMemoryRecords.createdAt), asc(antiMemoryRecords.id)],
      limit
    });

    return rows.map(mapAntiMemoryRecord);
  }

  async listAntiMemoryForRun(executionRunId: ExecutionRunId): Promise<AntiMemoryRecord[]> {
    const rows = await this.db.query.antiMemoryRecords.findMany({
      where: eq(antiMemoryRecords.executionRunId, executionRunId),
      orderBy: asc(antiMemoryRecords.createdAt)
    });

    return rows.map(mapAntiMemoryRecord);
  }
}
