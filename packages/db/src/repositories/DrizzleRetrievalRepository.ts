import {
  and,
  desc,
  eq,
  sql
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
  SearchLexicalInput,
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
  fromIsoTimestamp,
  requireReturnedRow
} from "./common.js";
import {
  mapActivationDecision,
  mapEmbedding,
  mapEmbeddingModel,
  mapRetrievalCandidate,
  mapRetrievalRun,
  mapSearchDocument
} from "./mappers.js";

const contextExclusionReasons = new Set([
  "stale",
  "invalidated",
  "low_trust",
  "low_context_roi",
  "over_budget",
  "duplicate",
  "irrelevant",
  "unsafe",
  "superseded"
] as const);

type ContextExclusionReason = typeof contextExclusionReasons extends Set<infer T> ? T : never;

const toContextExclusionReason = (reason: string): ContextExclusionReason => {
  if (contextExclusionReasons.has(reason as ContextExclusionReason)) {
    return reason as ContextExclusionReason;
  }

  return "irrelevant";
};

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

export class DrizzleRetrievalRepository implements RetrievalRepository {
  constructor(private readonly db: KrnDatabase) {}

  async createSearchDocument(input: CreateSearchDocumentInput): Promise<SearchDocumentRecord> {
    const language = input.language ?? "english";
    const searchText = input.searchText ?? `${input.title}\n${input.body}`;
    const row = requireReturnedRow(
      await this.db
        .insert(searchDocuments)
        .values({
          ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
          subjectType: input.subjectType,
          subjectId: input.subjectId,
          ...(input.sourceArtifactId === undefined
            ? {}
            : { sourceArtifactId: input.sourceArtifactId }),
          ...(input.sourceChunkId === undefined ? {} : { sourceChunkId: input.sourceChunkId }),
          ...(input.sourceClaimId === undefined ? {} : { sourceClaimId: input.sourceClaimId }),
          ...(input.memoryRecordId === undefined ? {} : { memoryRecordId: input.memoryRecordId }),
          ...(input.antiMemoryRecordId === undefined
            ? {}
            : { antiMemoryRecordId: input.antiMemoryRecordId }),
          ...(input.evidenceBundleId === undefined
            ? {}
            : { evidenceBundleId: input.evidenceBundleId }),
          ...(input.reviewAssessmentId === undefined
            ? {}
            : { reviewAssessmentId: input.reviewAssessmentId }),
          ...(input.sourceDecisionId === undefined
            ? {}
            : { sourceDecisionId: input.sourceDecisionId }),
          ...(input.runEventId === undefined ? {} : { runEventId: input.runEventId }),
          trustTier: input.trustTier ?? "medium",
          validityStatus: input.validityStatus ?? "active",
          language,
          title: input.title,
          body: input.body,
          searchText,
          searchVector: sql`to_tsvector(${language}::regconfig, ${searchText})`,
          metadataFilters: input.metadataFilters ?? {},
          ...(input.validFrom === undefined ? {} : { validFrom: fromIsoTimestamp(input.validFrom) }),
          ...(input.validUntil === undefined
            ? {}
            : { validUntil: fromIsoTimestamp(input.validUntil) }),
          metadata: input.metadata ?? {}
        })
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
        .values({
          ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
          embeddingModelId: input.embeddingModelId,
          subjectType: input.subjectType,
          subjectId: input.subjectId,
          ...(input.sourceArtifactId === undefined
            ? {}
            : { sourceArtifactId: input.sourceArtifactId }),
          ...(input.sourceChunkId === undefined ? {} : { sourceChunkId: input.sourceChunkId }),
          ...(input.sourceClaimId === undefined ? {} : { sourceClaimId: input.sourceClaimId }),
          ...(input.memoryRecordId === undefined ? {} : { memoryRecordId: input.memoryRecordId }),
          ...(input.antiMemoryRecordId === undefined
            ? {}
            : { antiMemoryRecordId: input.antiMemoryRecordId }),
          ...(input.searchDocumentId === undefined
            ? {}
            : { searchDocumentId: input.searchDocumentId }),
          embedding: input.embedding,
          contentHash: input.contentHash,
          trustTier: input.trustTier ?? "medium",
          validityStatus: input.validityStatus ?? "active",
          metadataFilters: input.metadataFilters ?? {},
          ...(input.validFrom === undefined ? {} : { validFrom: fromIsoTimestamp(input.validFrom) }),
          ...(input.validUntil === undefined
            ? {}
            : { validUntil: fromIsoTimestamp(input.validUntil) }),
          metadata: input.metadata ?? {}
        })
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
        .values({
          retrievalRunId: input.retrievalRunId,
          kind: input.kind,
          status: input.status ?? "candidate",
          subjectType: input.subjectType,
          subjectId: input.subjectId,
          ...(input.searchDocumentId === undefined
            ? {}
            : { searchDocumentId: input.searchDocumentId }),
          trustTier: input.trustTier,
          ...(input.lexicalScore === undefined ? {} : { lexicalScore: input.lexicalScore }),
          ...(input.vectorScore === undefined ? {} : { vectorScore: input.vectorScore }),
          ...(input.graphScore === undefined ? {} : { graphScore: input.graphScore }),
          ...(input.temporalScore === undefined ? {} : { temporalScore: input.temporalScore }),
          ...(input.contextRoiScore === undefined
            ? {}
            : { contextRoiScore: input.contextRoiScore }),
          ...(input.totalScore === undefined ? {} : { totalScore: input.totalScore }),
          ...(input.score === undefined ? {} : { score: input.score }),
          reason: input.reason,
          metadata: input.metadata ?? {}
        })
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
        .values({
          retrievalRunId: input.retrievalRunId,
          ...(input.retrievalCandidateId === undefined
            ? {}
            : { retrievalCandidateId: input.retrievalCandidateId }),
          ...(input.contextAssemblyId === undefined
            ? {}
            : { contextAssemblyId: input.contextAssemblyId }),
          subjectType: input.subjectType,
          subjectId: input.subjectId,
          decision: input.decision,
          reason: input.reason,
          ...(input.score === undefined ? {} : { score: input.score }),
          ...(input.contextBudgetCost === undefined
            ? {}
            : { contextBudgetCost: input.contextBudgetCost }),
          ...(input.expectedDecisionImpact === undefined
            ? {}
            : { expectedDecisionImpact: input.expectedDecisionImpact }),
          metadata: activationDecisionMetadata(input)
        })
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
