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
  observationClaimEdges,
  observationEntityEdges,
  observationGroups,
  observationItems,
  observationSourceRanges
} from "../schema/index.js";
import {
  fromIsoTimestamp,
  metadataOrEmpty,
  optionalIsoTimestamp,
  requireReturnedRow,
  toIsoTimestamp
} from "./repository-value-readers.js";

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
type ObservationItemInsertRow = typeof observationItems.$inferInsert;
type ObservationSourceRangeInsertRow = typeof observationSourceRanges.$inferInsert;

const truthBearingObservationKinds = new Set<ObservationKind>([
  "fact",
  "decision",
  "correction",
  "risk",
  "procedure",
  "conflict"
]);

const typedEvidenceKeys = [
  "runEventId",
  "sourceChunkId",
  "evidenceBundleId",
  "reviewAssessmentId",
  "feedbackDeltaId"
] as const;

type TypedEvidenceKey = (typeof typedEvidenceKeys)[number];

const requiredEvidenceKeyBySourceType: Partial<Record<ObservationSourceRangeType, TypedEvidenceKey>> = {
  run_event: "runEventId",
  source_chunk: "sourceChunkId",
  evidence_bundle: "evidenceBundleId",
  review_assessment: "reviewAssessmentId",
  feedback_delta: "feedbackDeltaId"
};

const presentTypedEvidenceKeys = (
  input: CreateObservationSourceRangeInput
): TypedEvidenceKey[] => typedEvidenceKeys.filter((key) => input[key] !== undefined);

const assertObservationSourceRangeTypedLinkage = (
  input: CreateObservationSourceRangeInput
): void => {
  const presentKeys = presentTypedEvidenceKeys(input);

  if (presentKeys.length === 0) {
    return;
  }

  if (presentKeys.length !== 1) {
    throw new Error("Observation source range must contain exactly one typed evidence link");
  }

  const requiredKey = requiredEvidenceKeyBySourceType[input.sourceType];

  if (requiredKey !== undefined && presentKeys[0] !== requiredKey) {
    throw new Error(`Observation source range ${input.sourceType} requires ${requiredKey}`);
  }
};

export const isEvidenceLinkedObservationSourceRangeInput = (
  input: CreateObservationSourceRangeInput
): boolean => {
  try {
    assertObservationSourceRangeTypedLinkage(input);
  } catch {
    return false;
  }

  return presentTypedEvidenceKeys(input).length === 1;
};

export const assertObservationItemEvidenceLinkage = (
  input: ObservationEvidenceLinkageInput
): void => {
  if (!requiresObservationSourceRange(input.kind, input.provenanceKind)) {
    return;
  }

  if (input.sourceRanges.length === 0) {
    throw new Error("Observation item requires source ranges");
  }

  for (const sourceRange of input.sourceRanges) {
    assertObservationSourceRangeTypedLinkage(sourceRange);
  }

  if (
    truthBearingObservationKinds.has(input.kind) &&
    !input.sourceRanges.some(isEvidenceLinkedObservationSourceRangeInput)
  ) {
    throw new Error("Truth-bearing observation requires an evidence-linked source range");
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

const itemScope = (
  group: ObservationGroup,
  inputScope: ObservationScope | undefined
): ObservationScope => ({
  ...group.scope,
  ...inputScope
});

const observationScopeInsertValues = (scope: ObservationScope) => ({
  ...(scope.workspaceId === undefined ? {} : { workspaceId: scope.workspaceId }),
  ...(scope.projectId === undefined ? {} : { projectId: scope.projectId }),
  ...(scope.executionRunId === undefined ? {} : { executionRunId: scope.executionRunId }),
  ...(scope.taskContractId === undefined ? {} : { taskContractId: scope.taskContractId }),
  ...(scope.targetRepoPath === undefined ? {} : { targetRepoPath: scope.targetRepoPath })
});

const temporalScopeInsertValues = (temporalScope: ObservationItem["temporalScope"]) => ({
  observedAt: fromIsoTimestamp(temporalScope.observedAt),
  ...(temporalScope.eventTime === undefined
    ? {}
    : { eventTime: fromIsoTimestamp(temporalScope.eventTime) }),
  ingestedAt: fromIsoTimestamp(temporalScope.ingestedAt),
  ...(temporalScope.referencedAt === undefined
    ? {}
    : { referencedAt: fromIsoTimestamp(temporalScope.referencedAt) }),
  ...(temporalScope.referenceTime === undefined
    ? {}
    : { referenceTime: fromIsoTimestamp(temporalScope.referenceTime) }),
  ...(temporalScope.relativeTimeBase === undefined
    ? {}
    : { relativeTimeBase: fromIsoTimestamp(temporalScope.relativeTimeBase) }),
  ...(temporalScope.validFrom === undefined
    ? {}
    : { validFrom: fromIsoTimestamp(temporalScope.validFrom) }),
  ...(temporalScope.validUntil === undefined
    ? {}
    : { validUntil: fromIsoTimestamp(temporalScope.validUntil) }),
  ...(temporalScope.invalidatedAt === undefined
    ? {}
    : { invalidatedAt: fromIsoTimestamp(temporalScope.invalidatedAt) }),
  ...(temporalScope.supersededAt === undefined
    ? {}
    : { supersededAt: fromIsoTimestamp(temporalScope.supersededAt) })
});

const observationItemInsertValues = (
  groupId: ObservationGroupId,
  scope: ObservationScope,
  input: CreateObservationItemInput
): ObservationItemInsertRow => ({
  groupId,
  ...observationScopeInsertValues(scope),
  kind: input.kind,
  status: input.status ?? "observed",
  priority: input.priority ?? "medium",
  confidence: input.confidence ?? "medium",
  provenanceKind: input.provenanceKind,
  subject: input.subject,
  summary: input.summary,
  body: input.body,
  ...temporalScopeInsertValues(input.temporalScope),
  metadata: input.metadata ?? {}
});

const sourceRangeInsertValues = (
  observationItemId: ObservationItemId,
  input: CreateObservationSourceRangeInput
): ObservationSourceRangeInsertRow => ({
  observationItemId,
  sourceType: input.sourceType,
  sourceId: input.sourceId,
  ...(input.executionRunId === undefined ? {} : { executionRunId: input.executionRunId }),
  ...(input.runEventId === undefined ? {} : { runEventId: input.runEventId }),
  ...(input.sourceChunkId === undefined ? {} : { sourceChunkId: input.sourceChunkId }),
  ...(input.evidenceBundleId === undefined ? {} : { evidenceBundleId: input.evidenceBundleId }),
  ...(input.reviewAssessmentId === undefined ? {} : { reviewAssessmentId: input.reviewAssessmentId }),
  ...(input.feedbackDeltaId === undefined ? {} : { feedbackDeltaId: input.feedbackDeltaId }),
  locator: input.locator,
  ...(input.excerpt === undefined ? {} : { excerpt: input.excerpt }),
  capturedAt: fromIsoTimestamp(input.capturedAt),
  metadata: input.metadata ?? {}
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
        items.push(await this.addItemInTransaction(groupId, group, input, tx));
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

  private async addItemInTransaction(
    groupId: ObservationGroupId,
    group: ObservationGroup,
    input: CreateObservationItemInput,
    tx: KrnDatabase
  ): Promise<ObservationItem> {
    assertObservationItemEvidenceLinkage({
      kind: input.kind,
      provenanceKind: input.provenanceKind,
      sourceRanges: input.sourceRanges ?? []
    });

    const itemRow = requireReturnedRow(
      await tx
        .insert(observationItems)
        .values(observationItemInsertValues(groupId, itemScope(group, input.scope), input))
        .returning(),
      "addObservationItem"
    );

    const sourceRanges = await this.insertSourceRanges(itemRow.id, input.sourceRanges ?? [], tx);
    const entityLinks = await this.insertEntityLinks(itemRow.id, input.entityLinks ?? [], tx);
    const claimLinks = await this.insertClaimLinks(itemRow.id, input.claimLinks ?? [], tx);

    return mapObservationItem(itemRow, sourceRanges, entityLinks, claimLinks);
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
        inputs.map((input) => sourceRangeInsertValues(observationItemId, input))
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
