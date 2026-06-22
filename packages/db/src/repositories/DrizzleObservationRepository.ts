import { and, asc, eq } from "drizzle-orm";
import { requiresObservationSourceRange } from "@krn/core";
import type {
  ExecutionRunId,
  ObservationClaimLink,
  ObservationConfidence,
  ObservationEntityLink,
  ObservationGroup,
  ObservationGroupId,
  ObservationItem,
  ObservationItemId,
  ObservationKind,
  ObservationPriority,
  ObservationProvenanceKind,
  ObservationScope,
  ObservationSourceRange,
  ObservationSourceRangeType,
  ObservationStatus,
  ProjectId,
  SourceClaimId
} from "@krn/core";

import type { KrnDatabase } from "../database.js";
import {
  evidenceBundles,
  observationClaimEdges,
  observationEntityEdges,
  observationFeedbackEvents,
  observationGroups,
  observationItems,
  observationSourceRanges,
  reviewAssessments,
  feedbackDeltas,
  runEvents,
  sourceChunks
} from "../schema/index.js";
import {
  fromIsoTimestamp,
  metadataOrEmpty,
  optionalIsoTimestamp,
  requireReturnedRow,
  toIsoTimestamp
} from "./common.js";

export type ObservationFeedbackEventType =
  | "used"
  | "ignored"
  | "helped"
  | "hurt"
  | "stale"
  | "corrected";

export type ObservationUsefulness = "positive" | "negative" | "neutral" | "unknown";

export interface ObservationFeedbackEventRecord {
  id: string;
  observationItemId: ObservationItemId;
  projectId?: ProjectId;
  executionRunId?: ExecutionRunId;
  eventType: ObservationFeedbackEventType;
  usefulness: ObservationUsefulness;
  note?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface CreateObservationGroupInput {
  scope: ObservationScope;
  title: string;
  summary: string;
  source: string;
  metadata?: Record<string, unknown>;
}

export interface CreateObservationSourceRangeInput {
  sourceType: ObservationSourceRangeType;
  sourceId: string;
  executionRunId?: ExecutionRunId;
  runEventId?: string;
  sourceChunkId?: string;
  evidenceBundleId?: string;
  reviewAssessmentId?: string;
  feedbackDeltaId?: string;
  locator: string;
  excerpt?: string;
  capturedAt: string;
  metadata?: Record<string, unknown>;
}

export interface CreateObservationItemInput {
  scope?: ObservationScope;
  kind: ObservationKind;
  status?: ObservationStatus;
  priority?: ObservationPriority;
  confidence?: ObservationConfidence;
  provenanceKind: ObservationProvenanceKind;
  subject: string;
  summary: string;
  body: string;
  temporalScope: ObservationItem["temporalScope"];
  sourceRanges?: CreateObservationSourceRangeInput[];
  entityLinks?: ObservationEntityLink[];
  claimLinks?: ObservationClaimLink[];
  metadata?: Record<string, unknown>;
}

export interface ObservationFindByRunOptions {
  projectId?: ProjectId;
  limit?: number;
}

export interface ObservationFindByScopeInput extends ObservationScope {
  limit?: number;
}

export interface RecordObservationFeedbackInput {
  observationItemId: ObservationItemId;
  projectId?: ProjectId;
  executionRunId?: ExecutionRunId;
  eventType: ObservationFeedbackEventType;
  usefulness?: ObservationUsefulness;
  note?: string;
  metadata?: Record<string, unknown>;
}

export type ObservationRawEvidenceKind =
  | "run_event"
  | "source_chunk"
  | "evidence_bundle"
  | "review_assessment"
  | "feedback_delta"
  | "unavailable";

export interface ObservationRawEvidenceRecord {
  sourceRange: ObservationSourceRange;
  kind: ObservationRawEvidenceKind;
  sourceId: string;
  locator: string;
  excerpt?: string;
  text?: string;
  payload: Record<string, unknown>;
  capturedAt: string;
}

interface ObservationEvidenceLinkageInput {
  kind: ObservationKind;
  provenanceKind: ObservationProvenanceKind;
  sourceRanges: CreateObservationSourceRangeInput[];
}

type ObservationGroupRow = typeof observationGroups.$inferSelect;
type ObservationItemRow = typeof observationItems.$inferSelect;
type ObservationSourceRangeRow = typeof observationSourceRanges.$inferSelect;
type ObservationEntityEdgeRow = typeof observationEntityEdges.$inferSelect;
type ObservationClaimEdgeRow = typeof observationClaimEdges.$inferSelect;
type ObservationFeedbackEventRow = typeof observationFeedbackEvents.$inferSelect;

const unknownListOrEmpty = (value: unknown): unknown[] => (
  Array.isArray(value) ? value : []
);

export const isEvidenceLinkedObservationSourceRangeInput = (
  input: CreateObservationSourceRangeInput
): boolean => (
  input.runEventId !== undefined ||
  input.sourceChunkId !== undefined ||
  input.evidenceBundleId !== undefined ||
  input.reviewAssessmentId !== undefined ||
  input.feedbackDeltaId !== undefined
);

export const assertObservationItemEvidenceLinkage = (
  input: ObservationEvidenceLinkageInput
): void => {
  if (!requiresObservationSourceRange(input.kind, input.provenanceKind)) {
    return;
  }

  if (input.sourceRanges.length === 0) {
    throw new Error("Observation item requires source ranges");
  }

  if (
    input.kind === "fact" &&
    !input.sourceRanges.some(isEvidenceLinkedObservationSourceRangeInput)
  ) {
    throw new Error("Factual observation requires an evidence-linked source range");
  }
};

const scopeFromGroupRow = (row: ObservationGroupRow): ObservationScope => ({
  ...metadataOrEmpty(row.scope),
  ...(row.workspaceId === null ? {} : { workspaceId: row.workspaceId }),
  ...(row.projectId === null ? {} : { projectId: row.projectId }),
  ...(row.executionRunId === null ? {} : { executionRunId: row.executionRunId }),
  ...(row.taskContractId === null ? {} : { taskContractId: row.taskContractId }),
  ...(row.targetRepoPath === null ? {} : { targetRepoPath: row.targetRepoPath })
});

const scopeFromItemRow = (row: ObservationItemRow): ObservationScope => ({
  ...(row.workspaceId === null ? {} : { workspaceId: row.workspaceId }),
  ...(row.projectId === null ? {} : { projectId: row.projectId }),
  ...(row.executionRunId === null ? {} : { executionRunId: row.executionRunId }),
  ...(row.taskContractId === null ? {} : { taskContractId: row.taskContractId }),
  ...(row.targetRepoPath === null ? {} : { targetRepoPath: row.targetRepoPath })
});

const mapObservationGroup = (row: ObservationGroupRow): ObservationGroup => ({
  id: row.id,
  ...(row.projectId === null ? {} : { projectId: row.projectId }),
  ...(row.executionRunId === null ? {} : { executionRunId: row.executionRunId }),
  scope: scopeFromGroupRow(row),
  title: row.title,
  summary: row.summary,
  source: row.source,
  metadata: metadataOrEmpty(row.metadata),
  createdAt: toIsoTimestamp(row.createdAt),
  updatedAt: toIsoTimestamp(row.updatedAt)
});

const mapObservationSourceRange = (
  row: ObservationSourceRangeRow
): ObservationSourceRange => ({
  id: row.id,
  sourceType: row.sourceType,
  sourceId: row.sourceId,
  locator: row.locator,
  ...(row.excerpt === null ? {} : { excerpt: row.excerpt }),
  capturedAt: toIsoTimestamp(row.capturedAt)
});

const mapObservationEntityLink = (row: ObservationEntityEdgeRow): ObservationEntityLink => ({
  entityKind: row.entityKind,
  entityId: row.entityId,
  relation: row.relation
});

const mapObservationClaimLink = (row: ObservationClaimEdgeRow): ObservationClaimLink => ({
  sourceClaimId: row.sourceClaimId as SourceClaimId,
  relation: row.relation
});

const mapTemporalScope = (row: ObservationItemRow): ObservationItem["temporalScope"] => {
  const temporalScope: ObservationItem["temporalScope"] = {
    observedAt: toIsoTimestamp(row.observedAt),
    ingestedAt: toIsoTimestamp(row.ingestedAt)
  };
  const eventTime = optionalIsoTimestamp(row.eventTime);
  const referencedAt = optionalIsoTimestamp(row.referencedAt);
  const referenceTime = optionalIsoTimestamp(row.referenceTime);
  const relativeTimeBase = optionalIsoTimestamp(row.relativeTimeBase);
  const validFrom = optionalIsoTimestamp(row.validFrom);
  const validUntil = optionalIsoTimestamp(row.validUntil);
  const invalidatedAt = optionalIsoTimestamp(row.invalidatedAt);
  const supersededAt = optionalIsoTimestamp(row.supersededAt);

  if (eventTime !== undefined) {
    temporalScope.eventTime = eventTime;
  }
  if (referencedAt !== undefined) {
    temporalScope.referencedAt = referencedAt;
  }
  if (referenceTime !== undefined) {
    temporalScope.referenceTime = referenceTime;
  }
  if (relativeTimeBase !== undefined) {
    temporalScope.relativeTimeBase = relativeTimeBase;
  }
  if (validFrom !== undefined) {
    temporalScope.validFrom = validFrom;
  }
  if (validUntil !== undefined) {
    temporalScope.validUntil = validUntil;
  }
  if (invalidatedAt !== undefined) {
    temporalScope.invalidatedAt = invalidatedAt;
  }
  if (supersededAt !== undefined) {
    temporalScope.supersededAt = supersededAt;
  }

  return temporalScope;
};

const mapObservationItem = (
  row: ObservationItemRow,
  sourceRanges: ObservationSourceRange[],
  entityLinks: ObservationEntityLink[],
  claimLinks: ObservationClaimLink[]
): ObservationItem => ({
  id: row.id,
  groupId: row.groupId,
  scope: scopeFromItemRow(row),
  kind: row.kind,
  status: row.status,
  priority: row.priority,
  confidence: row.confidence,
  provenanceKind: row.provenanceKind,
  subject: row.subject,
  summary: row.summary,
  body: row.body,
  temporalScope: mapTemporalScope(row),
  sourceRanges,
  entityLinks,
  claimLinks,
  metadata: metadataOrEmpty(row.metadata),
  createdAt: toIsoTimestamp(row.createdAt),
  updatedAt: toIsoTimestamp(row.updatedAt)
});

const mapObservationFeedbackEvent = (
  row: ObservationFeedbackEventRow
): ObservationFeedbackEventRecord => ({
  id: row.id,
  observationItemId: row.observationItemId,
  ...(row.projectId === null ? {} : { projectId: row.projectId }),
  ...(row.executionRunId === null ? {} : { executionRunId: row.executionRunId }),
  eventType: row.eventType,
  usefulness: row.usefulness,
  ...(row.note === null ? {} : { note: row.note }),
  metadata: metadataOrEmpty(row.metadata),
  createdAt: toIsoTimestamp(row.createdAt)
});

const itemScope = (
  group: ObservationGroup,
  inputScope: ObservationScope | undefined
): ObservationScope => ({
  ...group.scope,
  ...inputScope
});

export class DrizzleObservationRepository {
  constructor(private readonly db: KrnDatabase) {}

  async createGroup(input: CreateObservationGroupInput): Promise<ObservationGroup> {
    const scopeJson: Record<string, unknown> = { ...input.scope };
    const row = requireReturnedRow(
      await this.db
        .insert(observationGroups)
        .values({
          ...(input.scope.workspaceId === undefined ? {} : { workspaceId: input.scope.workspaceId }),
          ...(input.scope.projectId === undefined ? {} : { projectId: input.scope.projectId }),
          ...(input.scope.executionRunId === undefined
            ? {}
            : { executionRunId: input.scope.executionRunId }),
          ...(input.scope.taskContractId === undefined
            ? {}
            : { taskContractId: input.scope.taskContractId }),
          ...(input.scope.targetRepoPath === undefined
            ? {}
            : { targetRepoPath: input.scope.targetRepoPath }),
          scope: scopeJson,
          title: input.title,
          summary: input.summary,
          source: input.source,
          metadata: input.metadata ?? {}
        })
        .returning(),
      "createObservationGroup"
    );

    return mapObservationGroup(row);
  }

  async addItems(
    groupId: ObservationGroupId,
    inputs: CreateObservationItemInput[]
  ): Promise<ObservationItem[]> {
    const groupRow = await this.db.query.observationGroups.findFirst({
      where: eq(observationGroups.id, groupId)
    });

    if (groupRow === undefined) {
      throw new Error(`Observation group ${groupId} was not found`);
    }

    const group = mapObservationGroup(groupRow);

    return this.db.transaction(async (tx) => {
      const items: ObservationItem[] = [];

      for (const input of inputs) {
        assertObservationItemEvidenceLinkage({
          kind: input.kind,
          provenanceKind: input.provenanceKind,
          sourceRanges: input.sourceRanges ?? []
        });

        const scope = itemScope(group, input.scope);
        const itemRow = requireReturnedRow(
          await tx
            .insert(observationItems)
            .values({
              groupId,
              ...(scope.workspaceId === undefined ? {} : { workspaceId: scope.workspaceId }),
              ...(scope.projectId === undefined ? {} : { projectId: scope.projectId }),
              ...(scope.executionRunId === undefined
                ? {}
                : { executionRunId: scope.executionRunId }),
              ...(scope.taskContractId === undefined
                ? {}
                : { taskContractId: scope.taskContractId }),
              ...(scope.targetRepoPath === undefined
                ? {}
                : { targetRepoPath: scope.targetRepoPath }),
              kind: input.kind,
              status: input.status ?? "observed",
              priority: input.priority ?? "medium",
              confidence: input.confidence ?? "medium",
              provenanceKind: input.provenanceKind,
              subject: input.subject,
              summary: input.summary,
              body: input.body,
              observedAt: fromIsoTimestamp(input.temporalScope.observedAt),
              ...(input.temporalScope.eventTime === undefined
                ? {}
                : { eventTime: fromIsoTimestamp(input.temporalScope.eventTime) }),
              ingestedAt: fromIsoTimestamp(input.temporalScope.ingestedAt),
              ...(input.temporalScope.referencedAt === undefined
                ? {}
                : { referencedAt: fromIsoTimestamp(input.temporalScope.referencedAt) }),
              ...(input.temporalScope.referenceTime === undefined
                ? {}
                : { referenceTime: fromIsoTimestamp(input.temporalScope.referenceTime) }),
              ...(input.temporalScope.relativeTimeBase === undefined
                ? {}
                : { relativeTimeBase: fromIsoTimestamp(input.temporalScope.relativeTimeBase) }),
              ...(input.temporalScope.validFrom === undefined
                ? {}
                : { validFrom: fromIsoTimestamp(input.temporalScope.validFrom) }),
              ...(input.temporalScope.validUntil === undefined
                ? {}
                : { validUntil: fromIsoTimestamp(input.temporalScope.validUntil) }),
              ...(input.temporalScope.invalidatedAt === undefined
                ? {}
                : { invalidatedAt: fromIsoTimestamp(input.temporalScope.invalidatedAt) }),
              ...(input.temporalScope.supersededAt === undefined
                ? {}
                : { supersededAt: fromIsoTimestamp(input.temporalScope.supersededAt) }),
              metadata: input.metadata ?? {}
            })
            .returning(),
          "addObservationItem"
        );

        const sourceRanges = await this.insertSourceRanges(
          itemRow.id,
          input.sourceRanges ?? [],
          tx
        );
        const entityLinks = await this.insertEntityLinks(
          itemRow.id,
          input.entityLinks ?? [],
          tx
        );
        const claimLinks = await this.insertClaimLinks(itemRow.id, input.claimLinks ?? [], tx);

        items.push(mapObservationItem(itemRow, sourceRanges, entityLinks, claimLinks));
      }

      return items;
    });
  }

  async findByRun(
    executionRunId: ExecutionRunId,
    options: ObservationFindByRunOptions = {}
  ): Promise<ObservationItem[]> {
    const where =
      options.projectId === undefined
        ? eq(observationItems.executionRunId, executionRunId)
        : and(
            eq(observationItems.executionRunId, executionRunId),
            eq(observationItems.projectId, options.projectId)
          );

    const rows = await this.db.query.observationItems.findMany({
      where,
      orderBy: asc(observationItems.observedAt),
      ...(options.limit === undefined ? {} : { limit: options.limit })
    });

    return this.hydrateItems(rows);
  }

  async findByScope(input: ObservationFindByScopeInput): Promise<ObservationItem[]> {
    if (input.projectId === undefined) {
      throw new Error("findByScope requires projectId");
    }

    const predicates = [eq(observationItems.projectId, input.projectId)];

    if (input.executionRunId !== undefined) {
      predicates.push(eq(observationItems.executionRunId, input.executionRunId));
    }

    if (input.taskContractId !== undefined) {
      predicates.push(eq(observationItems.taskContractId, input.taskContractId));
    }

    if (input.targetRepoPath !== undefined) {
      predicates.push(eq(observationItems.targetRepoPath, input.targetRepoPath));
    }

    const rows = await this.db.query.observationItems.findMany({
      where: and(...predicates),
      orderBy: asc(observationItems.observedAt),
      ...(input.limit === undefined ? {} : { limit: input.limit })
    });

    return this.hydrateItems(rows);
  }

  async linkSourceRange(
    observationItemId: ObservationItemId,
    input: CreateObservationSourceRangeInput
  ): Promise<ObservationSourceRange> {
    const itemRow = await this.db.query.observationItems.findFirst({
      where: eq(observationItems.id, observationItemId)
    });

    if (itemRow === undefined) {
      throw new Error(`Observation item ${observationItemId} was not found`);
    }

    assertObservationItemEvidenceLinkage({
      kind: itemRow.kind,
      provenanceKind: itemRow.provenanceKind,
      sourceRanges: [input]
    });

    const row = requireReturnedRow(
      await this.db
        .insert(observationSourceRanges)
        .values({
          observationItemId,
          sourceType: input.sourceType,
          sourceId: input.sourceId,
          ...(input.executionRunId === undefined ? {} : { executionRunId: input.executionRunId }),
          ...(input.runEventId === undefined ? {} : { runEventId: input.runEventId }),
          ...(input.sourceChunkId === undefined ? {} : { sourceChunkId: input.sourceChunkId }),
          ...(input.evidenceBundleId === undefined
            ? {}
            : { evidenceBundleId: input.evidenceBundleId }),
          ...(input.reviewAssessmentId === undefined
            ? {}
            : { reviewAssessmentId: input.reviewAssessmentId }),
          ...(input.feedbackDeltaId === undefined
            ? {}
            : { feedbackDeltaId: input.feedbackDeltaId }),
          locator: input.locator,
          ...(input.excerpt === undefined ? {} : { excerpt: input.excerpt }),
          capturedAt: fromIsoTimestamp(input.capturedAt),
          metadata: input.metadata ?? {}
        })
        .returning(),
      "linkObservationSourceRange"
    );

    return mapObservationSourceRange(row);
  }

  async recallRawEvidence(
    observationItemId: ObservationItemId
  ): Promise<ObservationRawEvidenceRecord[]> {
    const rows = await this.db.query.observationSourceRanges.findMany({
      where: eq(observationSourceRanges.observationItemId, observationItemId)
    });

    const evidence: ObservationRawEvidenceRecord[] = [];

    for (const row of rows) {
      evidence.push(await this.recallRawEvidenceForRange(row));
    }

    return evidence;
  }

  async recordFeedback(
    input: RecordObservationFeedbackInput
  ): Promise<ObservationFeedbackEventRecord> {
    const row = requireReturnedRow(
      await this.db
        .insert(observationFeedbackEvents)
        .values({
          observationItemId: input.observationItemId,
          ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
          ...(input.executionRunId === undefined ? {} : { executionRunId: input.executionRunId }),
          eventType: input.eventType,
          usefulness: input.usefulness ?? "unknown",
          ...(input.note === undefined ? {} : { note: input.note }),
          metadata: input.metadata ?? {}
        })
        .returning(),
      "recordObservationFeedback"
    );

    return mapObservationFeedbackEvent(row);
  }

  private async recallRawEvidenceForRange(
    row: ObservationSourceRangeRow
  ): Promise<ObservationRawEvidenceRecord> {
    const sourceRange = mapObservationSourceRange(row);
    const base = (): ObservationRawEvidenceRecord => {
      const record: ObservationRawEvidenceRecord = {
        sourceRange,
        kind: "unavailable",
        sourceId: row.sourceId,
        locator: row.locator,
        payload: metadataOrEmpty(row.metadata),
        capturedAt: toIsoTimestamp(row.capturedAt)
      };

      if (row.excerpt !== null) {
        record.excerpt = row.excerpt;
      }

      return record;
    };

    if (row.runEventId !== null) {
      const runEvent = await this.db.query.runEvents.findFirst({
        where: eq(runEvents.id, row.runEventId)
      });

      if (runEvent !== undefined) {
        return {
          ...base(),
          kind: "run_event",
          sourceId: runEvent.id,
          text: runEvent.message,
          payload: {
            executionRunId: runEvent.executionRunId,
            sequence: runEvent.sequence,
            type: runEvent.type,
            severity: runEvent.severity,
            payload: metadataOrEmpty(runEvent.payload),
            occurredAt: toIsoTimestamp(runEvent.occurredAt)
          }
        };
      }
    }

    if (row.sourceChunkId !== null) {
      const sourceChunk = await this.db.query.sourceChunks.findFirst({
        where: eq(sourceChunks.id, row.sourceChunkId)
      });

      if (sourceChunk !== undefined) {
        return {
          ...base(),
          kind: "source_chunk",
          sourceId: sourceChunk.id,
          text: sourceChunk.content,
          payload: {
            sourceArtifactId: sourceChunk.sourceArtifactId,
            ordinal: sourceChunk.ordinal,
            heading: sourceChunk.heading,
            tokenCount: sourceChunk.tokenCount,
            contentHash: sourceChunk.contentHash,
            metadata: metadataOrEmpty(sourceChunk.metadata),
            createdAt: toIsoTimestamp(sourceChunk.createdAt)
          }
        };
      }
    }

    if (row.evidenceBundleId !== null) {
      const evidenceBundle = await this.db.query.evidenceBundles.findFirst({
        where: eq(evidenceBundles.id, row.evidenceBundleId)
      });

      if (evidenceBundle !== undefined) {
        return {
          ...base(),
          kind: "evidence_bundle",
          sourceId: evidenceBundle.id,
          text: evidenceBundle.rollbackPath,
          payload: {
            executionRunId: evidenceBundle.executionRunId,
            status: evidenceBundle.status,
            changedFiles: unknownListOrEmpty(evidenceBundle.changedFiles),
            commands: unknownListOrEmpty(evidenceBundle.commands),
            diffRisk: evidenceBundle.diffRisk,
            reviewBurden: evidenceBundle.reviewBurden,
            rollbackPath: evidenceBundle.rollbackPath,
            metadata: metadataOrEmpty(evidenceBundle.metadata),
            createdAt: toIsoTimestamp(evidenceBundle.createdAt),
            updatedAt: toIsoTimestamp(evidenceBundle.updatedAt)
          }
        };
      }
    }

    if (row.reviewAssessmentId !== null) {
      const reviewAssessment = await this.db.query.reviewAssessments.findFirst({
        where: eq(reviewAssessments.id, row.reviewAssessmentId)
      });

      if (reviewAssessment !== undefined) {
        return {
          ...base(),
          kind: "review_assessment",
          sourceId: reviewAssessment.id,
          text: reviewAssessment.summary,
          payload: {
            evidenceBundleId: reviewAssessment.evidenceBundleId,
            status: reviewAssessment.status,
            reviewer: reviewAssessment.reviewer,
            findings: unknownListOrEmpty(reviewAssessment.findings),
            metadata: metadataOrEmpty(reviewAssessment.metadata),
            createdAt: toIsoTimestamp(reviewAssessment.createdAt),
            updatedAt: toIsoTimestamp(reviewAssessment.updatedAt)
          }
        };
      }
    }

    if (row.feedbackDeltaId !== null) {
      const feedbackDelta = await this.db.query.feedbackDeltas.findFirst({
        where: eq(feedbackDeltas.id, row.feedbackDeltaId)
      });

      if (feedbackDelta !== undefined) {
        return {
          ...base(),
          kind: "feedback_delta",
          sourceId: feedbackDelta.id,
          payload: {
            reviewAssessmentId: feedbackDelta.reviewAssessmentId,
            status: feedbackDelta.status,
            memoryCandidates: unknownListOrEmpty(feedbackDelta.memoryCandidates),
            sourceDecisions: unknownListOrEmpty(feedbackDelta.sourceDecisions),
            evalCandidates: unknownListOrEmpty(feedbackDelta.evalCandidates),
            metadata: metadataOrEmpty(feedbackDelta.metadata),
            createdAt: toIsoTimestamp(feedbackDelta.createdAt),
            updatedAt: toIsoTimestamp(feedbackDelta.updatedAt)
          }
        };
      }
    }

    return base();
  }

  private async hydrateItems(rows: ObservationItemRow[]): Promise<ObservationItem[]> {
    const items: ObservationItem[] = [];

    for (const row of rows) {
      const [sourceRangeRows, entityEdgeRows, claimEdgeRows] = await Promise.all([
        this.db.query.observationSourceRanges.findMany({
          where: eq(observationSourceRanges.observationItemId, row.id)
        }),
        this.db.query.observationEntityEdges.findMany({
          where: eq(observationEntityEdges.observationItemId, row.id)
        }),
        this.db.query.observationClaimEdges.findMany({
          where: eq(observationClaimEdges.observationItemId, row.id)
        })
      ]);

      items.push(
        mapObservationItem(
          row,
          sourceRangeRows.map(mapObservationSourceRange),
          entityEdgeRows.map(mapObservationEntityLink),
          claimEdgeRows.map(mapObservationClaimLink)
        )
      );
    }

    return items;
  }

  private async insertSourceRanges(
    observationItemId: ObservationItemId,
    inputs: CreateObservationSourceRangeInput[],
    tx: KrnDatabase
  ): Promise<ObservationSourceRange[]> {
    if (inputs.length === 0) {
      return [];
    }

    const rows = await tx
      .insert(observationSourceRanges)
      .values(
        inputs.map((input) => ({
          observationItemId,
          sourceType: input.sourceType,
          sourceId: input.sourceId,
          ...(input.executionRunId === undefined ? {} : { executionRunId: input.executionRunId }),
          ...(input.runEventId === undefined ? {} : { runEventId: input.runEventId }),
          ...(input.sourceChunkId === undefined ? {} : { sourceChunkId: input.sourceChunkId }),
          ...(input.evidenceBundleId === undefined
            ? {}
            : { evidenceBundleId: input.evidenceBundleId }),
          ...(input.reviewAssessmentId === undefined
            ? {}
            : { reviewAssessmentId: input.reviewAssessmentId }),
          ...(input.feedbackDeltaId === undefined
            ? {}
            : { feedbackDeltaId: input.feedbackDeltaId }),
          locator: input.locator,
          ...(input.excerpt === undefined ? {} : { excerpt: input.excerpt }),
          capturedAt: fromIsoTimestamp(input.capturedAt),
          metadata: input.metadata ?? {}
        }))
      )
      .returning();

    return rows.map(mapObservationSourceRange);
  }

  private async insertEntityLinks(
    observationItemId: ObservationItemId,
    inputs: ObservationEntityLink[],
    tx: KrnDatabase
  ): Promise<ObservationEntityLink[]> {
    if (inputs.length === 0) {
      return [];
    }

    const rows = await tx
      .insert(observationEntityEdges)
      .values(
        inputs.map((input) => ({
          observationItemId,
          entityKind: input.entityKind,
          entityId: input.entityId,
          relation: input.relation
        }))
      )
      .returning();

    return rows.map(mapObservationEntityLink);
  }

  private async insertClaimLinks(
    observationItemId: ObservationItemId,
    inputs: ObservationClaimLink[],
    tx: KrnDatabase
  ): Promise<ObservationClaimLink[]> {
    if (inputs.length === 0) {
      return [];
    }

    const rows = await tx
      .insert(observationClaimEdges)
      .values(
        inputs.map((input) => ({
          observationItemId,
          sourceClaimId: input.sourceClaimId,
          relation: input.relation
        }))
      )
      .returning();

    return rows.map(mapObservationClaimLink);
  }
}
