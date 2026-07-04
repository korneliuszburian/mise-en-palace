import {
  and,
  desc,
  eq,
  inArray,
  or,
  sql
} from "drizzle-orm";
import type {
  SQL
} from "drizzle-orm";
import type {
  ActivationDecisionRecord,
  AddRetrievalCandidateInput,
  CleanupTestRetrievalRecordsInput,
  CleanupTestRetrievalRecordsResult,
  CompleteRetrievalRunInput,
  CreateEmbeddingInput,
  CreateEmbeddingModelInput,
  CreateSearchDocumentInput,
  EmbeddingModelRecord,
  EmbeddingRecord,
  RecordActivationDecisionInput,
  RetrievalCandidateRecord,
  RetrievalRepository,
  RetrievalRunRecord,
  SearchDocumentRecord,
  SearchDocumentSearchResult,
  SearchHybridInput,
  SearchLexicalInput,
  SearchVectorInput,
  StartRetrievalRunInput,
  StoreContextSelectionInput
} from "@krn/harness/repositories/internal";

import type { KrnDatabase } from "../database.js";
import {
  activationDecisions,
  contextExclusions,
  contextItems,
  embeddingModels,
  embeddings,
  retrievalCandidates,
  retrievalRuns,
  searchDocuments
} from "../schema/index.js";
import {
  DEFAULT_EMBEDDING_DIMENSIONS
} from "../sql/pgvector.js";
import {
  fromIsoTimestamp,
  requireReturnedRow
} from "./repositoryValueReaders.js";
import {
  mapActivationDecision,
  mapEmbedding,
  mapEmbeddingModel,
  mapRetrievalCandidate,
  mapRetrievalRun,
  mapSearchDocument
} from "./mappers.js";

const contextExclusionReasonValues = [
  "stale",
  "invalidated",
  "low_trust",
  "low_context_roi",
  "over_budget",
  "duplicate",
  "irrelevant",
  "unsafe",
  "superseded"
] as const;

type ContextExclusionReason = typeof contextExclusionReasonValues[number];

const contextExclusionReasons = new Set<string>(contextExclusionReasonValues);

const isContextExclusionReason = (
  reason: string
): reason is ContextExclusionReason =>
  contextExclusionReasons.has(reason);

const toContextExclusionReason = (reason: string): ContextExclusionReason => {
  if (isContextExclusionReason(reason)) {
    return reason;
  }

  return "irrelevant";
};

const uniqueNonEmptyStrings = (values: readonly string[] | undefined): string[] => [
  ...new Set((values ?? []).filter((value) => value.trim().length > 0))
];

const assertEmbeddingVector = (embedding: readonly number[], label: string): void => {
  if (embedding.length !== DEFAULT_EMBEDDING_DIMENSIONS) {
    throw new Error(
      `${label} must contain ${DEFAULT_EMBEDDING_DIMENSIONS} finite numbers`
    );
  }

  if (!embedding.every(Number.isFinite)) {
    throw new Error(`${label} must contain only finite numbers`);
  }
};

const vectorLiteral = (embedding: readonly number[], label: string): string => {
  assertEmbeddingVector(embedding, label);

  return `[${embedding.join(",")}]`;
};

const vectorScoreExpression = (embedding: readonly number[]): SQL<number> => {
  const queryVector = vectorLiteral(embedding, "searchVector embedding");

  return sql<number>`floor(greatest(0, (1 - (${embeddings.embedding} <=> ${queryVector}::vector)) * 1000))::int`;
};

const requireEmbeddingModelId = (
  embeddingModelId: string | undefined,
  operation: "searchVector" | "searchHybrid"
): string => {
  if (embeddingModelId === undefined || embeddingModelId.trim().length === 0) {
    throw new Error(
      `${operation} embeddingModelId is required to avoid mixed-model vector comparison`
    );
  }

  return embeddingModelId;
};

const weightedScore = (
  input: {
    lexicalScore?: number;
    vectorScore?: number;
    lexicalWeight: number;
    vectorWeight: number;
  }
): number =>
  Math.round(
    (input.lexicalScore ?? 0) * input.lexicalWeight +
      (input.vectorScore ?? 0) * input.vectorWeight
  );

const mergeSearchResults = (
  lexicalResults: readonly SearchDocumentSearchResult[],
  vectorResults: readonly SearchDocumentSearchResult[]
): SearchDocumentSearchResult[] => {
  const merged = new Map<string, SearchDocumentSearchResult>();

  for (const result of lexicalResults) {
    merged.set(result.id, result);
  }

  for (const result of vectorResults) {
    const existing = merged.get(result.id);

    merged.set(result.id, {
      ...(existing ?? result),
      lexicalScore: existing?.lexicalScore ?? 0,
      vectorScore: result.vectorScore ?? 0
    });
  }

  return [...merged.values()];
};

const compareSearchResultsByWeight = (
  lexicalWeight: number,
  vectorWeight: number
) =>
  (
    left: SearchDocumentSearchResult,
    right: SearchDocumentSearchResult
  ): number =>
    weightedScore({
      lexicalScore: right.lexicalScore,
      vectorScore: right.vectorScore ?? 0,
      lexicalWeight,
      vectorWeight
    }) -
    weightedScore({
      lexicalScore: left.lexicalScore,
      vectorScore: left.vectorScore ?? 0,
      lexicalWeight,
      vectorWeight
    });

const retrievalRunCompletionMetadata = (
  input: CompleteRetrievalRunInput
): Record<string, unknown> => ({
  ...(input.metadata ?? {}),
  ...(input.activationAbstentionReason === undefined
    ? {}
    : { activationAbstentionReason: input.activationAbstentionReason }),
  ...(input.rawEvidenceRecallTriggerCount === undefined
    ? {}
    : { rawEvidenceRecallTriggerCount: input.rawEvidenceRecallTriggerCount }),
  ...(input.rawEvidenceRecallTriggers === undefined
    ? {}
    : { rawEvidenceRecallTriggers: input.rawEvidenceRecallTriggers })
});

const activationDecisionMetadata = (
  input: RecordActivationDecisionInput
): Record<string, unknown> => ({
  ...(input.metadata ?? {}),
  ...(input.expectedUse === undefined ? {} : { expectedUse: input.expectedUse }),
  ...(input.rawRecall === undefined ? {} : { rawRecall: input.rawRecall }),
  ...(input.antiMemoryRecordId === undefined
    ? {}
    : { antiMemoryRecordId: input.antiMemoryRecordId }),
  ...(input.exclusionCategory === undefined
    ? {}
    : { exclusionCategory: input.exclusionCategory }),
  ...(input.sourceSupportState === undefined
    ? {}
    : { sourceSupportState: input.sourceSupportState }),
  ...(input.activationAbstentionReason === undefined
    ? {}
    : { activationAbstentionReason: input.activationAbstentionReason })
});

type SearchDocumentInsertRow = typeof searchDocuments.$inferInsert;
type EmbeddingInsertRow = typeof embeddings.$inferInsert;
type RetrievalCandidateInsertRow = typeof retrievalCandidates.$inferInsert;
type ActivationDecisionInsertRow = typeof activationDecisions.$inferInsert;
type SearchDocumentInsertValues = Omit<SearchDocumentInsertRow, "searchVector"> & {
  searchVector: SQL;
};

interface ListSearchDocumentsForSourceLinksInput {
  projectId?: string;
  sourceArtifactIds?: readonly string[];
  sourceChunkIds?: readonly string[];
  sourceClaimIds?: readonly string[];
  limit?: number;
}

type RetrievalInsertColumnName =
  | keyof SearchDocumentInsertValues
  | keyof EmbeddingInsertRow
  | keyof RetrievalCandidateInsertRow
  | keyof ActivationDecisionInsertRow;
type RetrievalSubjectType = SearchDocumentInsertRow["subjectType"];

interface RetrievalSubjectLinkInput {
  subjectType: RetrievalSubjectType;
  subjectId: string;
  sourceArtifactId?: string;
  sourceChunkId?: string;
  sourceClaimId?: string;
  memoryRecordId?: string;
  antiMemoryRecordId?: string;
}

type RetrievalSubjectLinkColumns =
  Pick<SearchDocumentInsertRow, "subjectType" | "subjectId"> &
  Partial<
    Pick<
      SearchDocumentInsertRow,
      | "sourceArtifactId"
      | "sourceChunkId"
      | "sourceClaimId"
      | "memoryRecordId"
      | "antiMemoryRecordId"
    >
  >;

const optionalColumn = <Key extends RetrievalInsertColumnName, Value>(
  key: Key,
  value: Value | undefined
): Partial<Record<Key, Value>> => (
  value === undefined ? {} : { [key]: value } as Record<Key, Value>
);

const optionalTimestampColumn = <Key extends RetrievalInsertColumnName>(
  key: Key,
  value: string | undefined
): Partial<Record<Key, Date>> => optionalColumn(
  key,
  value === undefined ? undefined : fromIsoTimestamp(value)
);

const retrievalSubjectLinkColumns = (
  input: RetrievalSubjectLinkInput
): RetrievalSubjectLinkColumns => ({
  subjectType: input.subjectType,
  subjectId: input.subjectId,
  ...optionalColumn("sourceArtifactId", input.sourceArtifactId),
  ...optionalColumn("sourceChunkId", input.sourceChunkId),
  ...optionalColumn("sourceClaimId", input.sourceClaimId),
  ...optionalColumn("memoryRecordId", input.memoryRecordId),
  ...optionalColumn("antiMemoryRecordId", input.antiMemoryRecordId)
});

const searchDocumentInsertValues = (
  input: CreateSearchDocumentInput
): SearchDocumentInsertValues => {
  const language = input.language ?? "english";
  const searchText = input.searchText ?? `${input.title}\n${input.body}`;

  return {
    ...optionalColumn("projectId", input.projectId),
    ...retrievalSubjectLinkColumns(input),
    ...optionalColumn("evidenceBundleId", input.evidenceBundleId),
    ...optionalColumn("reviewAssessmentId", input.reviewAssessmentId),
    ...optionalColumn("sourceDecisionId", input.sourceDecisionId),
    ...optionalColumn("runEventId", input.runEventId),
    trustTier: input.trustTier ?? "medium",
    validityStatus: input.validityStatus ?? "active",
    language,
    title: input.title,
    body: input.body,
    searchText,
    searchVector: sql`to_tsvector(${language}::regconfig, ${searchText})`,
    metadataFilters: input.metadataFilters ?? {},
    ...optionalTimestampColumn("validFrom", input.validFrom),
    ...optionalTimestampColumn("validUntil", input.validUntil),
    metadata: input.metadata ?? {}
  };
};

const embeddingInsertValues = (
  input: CreateEmbeddingInput
): EmbeddingInsertRow => {
  assertEmbeddingVector(input.embedding, "createEmbedding embedding");

  return {
    ...optionalColumn("projectId", input.projectId),
    embeddingModelId: input.embeddingModelId,
    ...retrievalSubjectLinkColumns(input),
    ...optionalColumn("searchDocumentId", input.searchDocumentId),
    embedding: input.embedding,
    contentHash: input.contentHash,
    trustTier: input.trustTier ?? "medium",
    validityStatus: input.validityStatus ?? "active",
    metadataFilters: input.metadataFilters ?? {},
    ...optionalTimestampColumn("validFrom", input.validFrom),
    ...optionalTimestampColumn("validUntil", input.validUntil),
    metadata: input.metadata ?? {}
  };
};

const retrievalCandidateInsertValues = (
  input: AddRetrievalCandidateInput
): RetrievalCandidateInsertRow => ({
  retrievalRunId: input.retrievalRunId,
  kind: input.kind,
  status: input.status ?? "candidate",
  subjectType: input.subjectType,
  subjectId: input.subjectId,
  ...optionalColumn("searchDocumentId", input.searchDocumentId),
  trustTier: input.trustTier,
  ...optionalColumn("lexicalScore", input.lexicalScore),
  ...optionalColumn("vectorScore", input.vectorScore),
  ...optionalColumn("graphScore", input.graphScore),
  ...optionalColumn("temporalScore", input.temporalScore),
  ...optionalColumn("contextRoiScore", input.contextRoiScore),
  ...optionalColumn("totalScore", input.totalScore),
  ...optionalColumn("score", input.score),
  reason: input.reason,
  metadata: input.metadata ?? {}
});

const activationDecisionInsertValues = (
  input: RecordActivationDecisionInput
): ActivationDecisionInsertRow => ({
  retrievalRunId: input.retrievalRunId,
  ...optionalColumn("retrievalCandidateId", input.retrievalCandidateId),
  ...optionalColumn("contextAssemblyId", input.contextAssemblyId),
  subjectType: input.subjectType,
  subjectId: input.subjectId,
  decision: input.decision,
  reason: input.reason,
  ...optionalColumn("score", input.score),
  ...optionalColumn("contextBudgetCost", input.contextBudgetCost),
  ...optionalColumn("expectedDecisionImpact", input.expectedDecisionImpact),
  metadata: activationDecisionMetadata(input)
});

export class DrizzleRetrievalRepository implements RetrievalRepository {
  constructor(private readonly db: KrnDatabase) {}

  async createSearchDocument(input: CreateSearchDocumentInput): Promise<SearchDocumentRecord> {
    const row = requireReturnedRow(
      await this.db
        .insert(searchDocuments)
        .values(searchDocumentInsertValues(input))
        .returning(),
      "createSearchDocument"
    );

    return mapSearchDocument(row);
  }

  async searchLexical(input: SearchLexicalInput): Promise<SearchDocumentSearchResult[]> {
    const query = sql`websearch_to_tsquery('english', ${input.query})`;
    const lexicalScore = sql<number>`floor(ts_rank_cd(${searchDocuments.searchVector}, ${query}) * 1000)::int`;
    const rows = await this.db
      .select({
        document: searchDocuments,
        lexicalScore
      })
      .from(searchDocuments)
      .where(
        and(
          sql`${searchDocuments.searchVector} @@ ${query}`,
          eq(searchDocuments.validityStatus, "active"),
          input.projectId === undefined ? undefined : eq(searchDocuments.projectId, input.projectId)
        )
      )
      .orderBy(desc(lexicalScore))
      .limit(input.limit ?? 10);

    return rows.map((row) => ({
      ...mapSearchDocument(row.document),
      lexicalScore: row.lexicalScore ?? 0
    }));
  }

  async searchVector(input: SearchVectorInput): Promise<SearchDocumentSearchResult[]> {
    const embeddingModelId = requireEmbeddingModelId(input.embeddingModelId, "searchVector");
    const vectorScore = vectorScoreExpression(input.embedding);
    const rows = await this.db
      .select({
        document: searchDocuments,
        vectorScore
      })
      .from(embeddings)
      .innerJoin(searchDocuments, eq(embeddings.searchDocumentId, searchDocuments.id))
      .where(
        and(
          eq(embeddings.validityStatus, "active"),
          eq(searchDocuments.validityStatus, "active"),
          input.projectId === undefined ? undefined : eq(searchDocuments.projectId, input.projectId),
          eq(embeddings.embeddingModelId, embeddingModelId)
        )
      )
      .orderBy(desc(vectorScore))
      .limit(input.limit ?? 10);

    return rows.map((row) => ({
      ...mapSearchDocument(row.document),
      lexicalScore: 0,
      vectorScore: row.vectorScore ?? 0
    }));
  }

  async searchHybrid(input: SearchHybridInput): Promise<SearchDocumentSearchResult[]> {
    const embeddingModelId = requireEmbeddingModelId(input.embeddingModelId, "searchHybrid");
    const lexicalWeight = input.lexicalWeight ?? 1;
    const vectorWeight = input.vectorWeight ?? 1;
    const limit = input.limit ?? 10;
    const [lexicalResults, vectorResults] = await Promise.all([
      this.searchLexical({
        query: input.query,
        limit: limit * 2,
        ...optionalColumn("projectId", input.projectId)
      }),
      this.searchVector({
        embedding: input.embedding,
        embeddingModelId,
        limit: limit * 2,
        ...optionalColumn("projectId", input.projectId)
      })
    ]);
    return mergeSearchResults(lexicalResults, vectorResults)
      .sort(compareSearchResultsByWeight(lexicalWeight, vectorWeight))
      .slice(0, limit);
  }

  async listSearchDocumentsForSourceLinks(
    input: ListSearchDocumentsForSourceLinksInput
  ): Promise<SearchDocumentRecord[]> {
    const sourceArtifactIds = uniqueNonEmptyStrings(input.sourceArtifactIds);
    const sourceChunkIds = uniqueNonEmptyStrings(input.sourceChunkIds);
    const sourceClaimIds = uniqueNonEmptyStrings(input.sourceClaimIds);
    const linkPredicates = [
      ...(sourceArtifactIds.length === 0
        ? []
        : [inArray(searchDocuments.sourceArtifactId, sourceArtifactIds)]),
      ...(sourceChunkIds.length === 0
        ? []
        : [inArray(searchDocuments.sourceChunkId, sourceChunkIds)]),
      ...(sourceClaimIds.length === 0
        ? []
        : [inArray(searchDocuments.sourceClaimId, sourceClaimIds)])
    ];

    if (linkPredicates.length === 0) {
      return [];
    }

    const rows = await this.db
      .select()
      .from(searchDocuments)
      .where(
        and(
          or(...linkPredicates),
          eq(searchDocuments.validityStatus, "active"),
          input.projectId === undefined ? undefined : eq(searchDocuments.projectId, input.projectId)
        )
      )
      .orderBy(desc(searchDocuments.updatedAt))
      .limit(input.limit ?? 20);

    return rows.map(mapSearchDocument);
  }

  async createEmbeddingModel(input: CreateEmbeddingModelInput): Promise<EmbeddingModelRecord> {
    const row = requireReturnedRow(
      await this.db
        .insert(embeddingModels)
        .values({
          provider: input.provider,
          model: input.model,
          dimensions: input.dimensions,
          distanceMetric: input.distanceMetric,
          ...(input.status === undefined ? {} : { status: input.status }),
          metadata: input.metadata ?? {}
        })
        .returning(),
      "createEmbeddingModel"
    );

    return mapEmbeddingModel(row);
  }

  async createEmbedding(input: CreateEmbeddingInput): Promise<EmbeddingRecord> {
    const row = requireReturnedRow(
      await this.db
        .insert(embeddings)
        .values(embeddingInsertValues(input))
        .returning(),
      "createEmbedding"
    );

    return mapEmbedding(row);
  }

  async createRetrievalRun(input: StartRetrievalRunInput): Promise<RetrievalRunRecord> {
    return this.startRetrievalRun(input);
  }

  async startRetrievalRun(input: StartRetrievalRunInput): Promise<RetrievalRunRecord> {
    const row = requireReturnedRow(
      await this.db
        .insert(retrievalRuns)
        .values({
          ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
          ...(input.executionRunId === undefined
            ? {}
            : { executionRunId: input.executionRunId }),
          ...(input.taskContractId === undefined ? {} : { taskContractId: input.taskContractId }),
          query: input.query,
          ...(input.mode === undefined ? {} : { mode: input.mode }),
          ...(input.budget === undefined ? {} : { budget: input.budget }),
          ...(input.tokenBudget === undefined ? {} : { tokenBudget: input.tokenBudget }),
          metadataFilters: input.metadataFilters ?? {},
          metadata: input.metadata ?? {}
        })
        .returning(),
      "startRetrievalRun"
    );

    return mapRetrievalRun(row);
  }

  async completeRetrievalRun(input: CompleteRetrievalRunInput): Promise<RetrievalRunRecord> {
    const row = requireReturnedRow(
      await this.db
        .update(retrievalRuns)
        .set({
          status: input.status,
          completedAt: fromIsoTimestamp(input.completedAt),
          metadata: retrievalRunCompletionMetadata(input)
        })
        .where(eq(retrievalRuns.id, input.retrievalRunId))
        .returning(),
      "completeRetrievalRun"
    );

    return mapRetrievalRun(row);
  }

  async createRetrievalCandidate(
    input: AddRetrievalCandidateInput
  ): Promise<RetrievalCandidateRecord> {
    return this.addCandidate(input);
  }

  async addCandidate(input: AddRetrievalCandidateInput): Promise<RetrievalCandidateRecord> {
    const row = requireReturnedRow(
      await this.db
        .insert(retrievalCandidates)
        .values(retrievalCandidateInsertValues(input))
        .returning(),
      "addRetrievalCandidate"
    );

    return mapRetrievalCandidate(row);
  }

  async createActivationDecision(
    input: RecordActivationDecisionInput
  ): Promise<ActivationDecisionRecord> {
    return this.recordActivationDecision(input);
  }

  async recordActivationDecision(
    input: RecordActivationDecisionInput
  ): Promise<ActivationDecisionRecord> {
    const row = requireReturnedRow(
      await this.db
        .insert(activationDecisions)
        .values(activationDecisionInsertValues(input))
        .returning(),
      "recordActivationDecision"
    );

    return mapActivationDecision(row);
  }

  async listCandidatesForRetrievalRun(
    retrievalRunId: string
  ): Promise<RetrievalCandidateRecord[]> {
    const rows = await this.db
      .select()
      .from(retrievalCandidates)
      .where(eq(retrievalCandidates.retrievalRunId, retrievalRunId));

    return rows.map(mapRetrievalCandidate);
  }

  async listActivationDecisionsForRun(
    retrievalRunId: string
  ): Promise<ActivationDecisionRecord[]> {
    const rows = await this.db
      .select()
      .from(activationDecisions)
      .where(eq(activationDecisions.retrievalRunId, retrievalRunId));

    return rows.map(mapActivationDecision);
  }

  async cleanupTestRetrievalRecords(
    input: CleanupTestRetrievalRecordsInput
  ): Promise<CleanupTestRetrievalRecordsResult> {
    const deletedContextExclusions = await this.db
      .delete(contextExclusions)
      .where(sql`${contextExclusions.metadata}->>'smokeId' = ${input.smokeId}`)
      .returning({ id: contextExclusions.id });
    const deletedContextItems = await this.db
      .delete(contextItems)
      .where(sql`${contextItems.metadata}->>'smokeId' = ${input.smokeId}`)
      .returning({ id: contextItems.id });
    const deletedDecisions = await this.db
      .delete(activationDecisions)
      .where(sql`${activationDecisions.metadata}->>'smokeId' = ${input.smokeId}`)
      .returning({ id: activationDecisions.id });
    const deletedCandidates = await this.db
      .delete(retrievalCandidates)
      .where(sql`${retrievalCandidates.metadata}->>'smokeId' = ${input.smokeId}`)
      .returning({ id: retrievalCandidates.id });
    const deletedEmbeddings = await this.db
      .delete(embeddings)
      .where(sql`${embeddings.metadata}->>'smokeId' = ${input.smokeId}`)
      .returning({ id: embeddings.id });
    const deletedSearchDocuments = await this.db
      .delete(searchDocuments)
      .where(sql`${searchDocuments.metadata}->>'smokeId' = ${input.smokeId}`)
      .returning({ id: searchDocuments.id });
    const deletedRetrievalRuns = await this.db
      .delete(retrievalRuns)
      .where(sql`${retrievalRuns.metadata}->>'smokeId' = ${input.smokeId}`)
      .returning({ id: retrievalRuns.id });
    const deletedEmbeddingModels = await this.db
      .delete(embeddingModels)
      .where(sql`${embeddingModels.metadata}->>'smokeId' = ${input.smokeId}`)
      .returning({ id: embeddingModels.id });

    return {
      deletedCount:
        deletedContextExclusions.length +
        deletedContextItems.length +
        deletedDecisions.length +
        deletedCandidates.length +
        deletedEmbeddings.length +
        deletedSearchDocuments.length +
        deletedRetrievalRuns.length +
        deletedEmbeddingModels.length
    };
  }

  async storeContextSelection(input: StoreContextSelectionInput): Promise<void> {
    await this.db.transaction(async (tx) => {
      if (input.inclusions.length > 0) {
        await tx.insert(contextItems).values(
          input.inclusions.map((inclusion, index) => ({
            contextAssemblyId: input.contextAssemblyId,
            subjectType: inclusion.subjectType,
            subjectId: inclusion.subjectId,
            position: index + 1,
            reason: inclusion.reason,
            expectedUse: inclusion.expectedUse,
            ...(inclusion.tokenEstimate === undefined
              ? {}
              : { tokenEstimate: inclusion.tokenEstimate }),
            trustTier: inclusion.trustTier,
            metadata: {}
          }))
        );
      }

      if (input.exclusions.length > 0) {
        await tx.insert(contextExclusions).values(
          input.exclusions.map((exclusion) => ({
            contextAssemblyId: input.contextAssemblyId,
            subjectType: exclusion.subjectType,
            subjectId: exclusion.subjectId,
            reason: toContextExclusionReason(exclusion.reason),
            explanation: exclusion.explanation,
            ...(exclusion.score === undefined ? {} : { score: exclusion.score }),
            trustTier: exclusion.trustTier,
            metadata: {
              originalReason: exclusion.reason
            }
          }))
        );
      }
    });
  }
}
