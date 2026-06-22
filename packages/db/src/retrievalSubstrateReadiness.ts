import postgres from "postgres";

import { createKrnDatabase } from "./database.js";
import {
  DrizzleRetrievalRepository
} from "./repositories/index.js";

export interface RetrievalSubstrateReadinessInput {
  databaseUrl: string;
}

export interface RetrievalSubstrateReadinessReport {
  requiredTables: readonly string[];
  presentTables: readonly string[];
  missingTables: readonly string[];
  requiredTableCount: number;
  presentTableCount: number;
  schemaReady: boolean;
  retrievalRepositoryReachable: boolean;
  searchDocumentCount: number;
  embeddingCount: number;
  retrievalRunCount: number;
  retrievalCandidateCount: number;
  activationDecisionCount: number;
  contextExclusionCount: number;
  runtimeProofReady: boolean;
  retrievalRepositoryError?: string;
}

const requiredRetrievalSubstrateTables = [
  "search_documents",
  "embedding_models",
  "embeddings",
  "retrieval_runs",
  "retrieval_candidates",
  "activation_decisions",
  "context_items",
  "context_exclusions"
] as const;

interface RetrievalSubstrateCounts {
  searchDocumentCount: number;
  embeddingCount: number;
  retrievalRunCount: number;
  retrievalCandidateCount: number;
  activationDecisionCount: number;
  contextExclusionCount: number;
}

const emptyCounts: RetrievalSubstrateCounts = {
  searchDocumentCount: 0,
  embeddingCount: 0,
  retrievalRunCount: 0,
  retrievalCandidateCount: 0,
  activationDecisionCount: 0,
  contextExclusionCount: 0
};

export const inspectRetrievalSubstrateReadiness = async (
  input: RetrievalSubstrateReadinessInput
): Promise<RetrievalSubstrateReadinessReport> => {
  const databaseUrl = input.databaseUrl.trim();

  if (databaseUrl.length === 0) {
    throw new Error("KRN_DATABASE_URL is required for retrieval substrate readiness");
  }

  const client = postgres(databaseUrl, {
    max: 1,
    onnotice: () => undefined
  });

  try {
    const presentTables: string[] = [];
    const missingTables: string[] = [];

    for (const tableName of requiredRetrievalSubstrateTables) {
      const rows = await client<{ present: boolean }[]>`
        select to_regclass(${tableName}) is not null as present
      `;

      if (rows[0]?.present === true) {
        presentTables.push(tableName);
      } else {
        missingTables.push(tableName);
      }
    }

    const schemaReady = missingTables.length === 0;
    let retrievalRepositoryReachable = false;
    let retrievalRepositoryError: string | undefined;
    let counts = emptyCounts;

    if (schemaReady) {
      try {
        const retrievalRepository = new DrizzleRetrievalRepository(createKrnDatabase(client));

        await retrievalRepository.listCandidatesForRetrievalRun(
          "00000000-0000-0000-0000-000000000000"
        );
        await retrievalRepository.listActivationDecisionsForRun(
          "00000000-0000-0000-0000-000000000000"
        );
        retrievalRepositoryReachable = true;
      } catch (error) {
        retrievalRepositoryError =
          error instanceof Error ? error.message : "unknown retrieval repository error";
      }

      const countRows = await client<RetrievalSubstrateCounts[]>`
        select
          (select count(*)::int from search_documents) as "searchDocumentCount",
          (select count(*)::int from embeddings) as "embeddingCount",
          (select count(*)::int from retrieval_runs) as "retrievalRunCount",
          (select count(*)::int from retrieval_candidates) as "retrievalCandidateCount",
          (select count(*)::int from activation_decisions) as "activationDecisionCount",
          (select count(*)::int from context_exclusions) as "contextExclusionCount"
      `;

      counts = countRows[0] ?? emptyCounts;
    }

    return {
      requiredTables: requiredRetrievalSubstrateTables,
      presentTables,
      missingTables,
      requiredTableCount: requiredRetrievalSubstrateTables.length,
      presentTableCount: presentTables.length,
      schemaReady,
      retrievalRepositoryReachable,
      searchDocumentCount: counts.searchDocumentCount,
      embeddingCount: counts.embeddingCount,
      retrievalRunCount: counts.retrievalRunCount,
      retrievalCandidateCount: counts.retrievalCandidateCount,
      activationDecisionCount: counts.activationDecisionCount,
      contextExclusionCount: counts.contextExclusionCount,
      runtimeProofReady:
        counts.searchDocumentCount > 0 &&
        counts.embeddingCount > 0 &&
        counts.retrievalRunCount > 0 &&
        counts.retrievalCandidateCount > 0 &&
        counts.activationDecisionCount > 0 &&
        counts.contextExclusionCount > 0,
      ...(retrievalRepositoryError === undefined ? {} : { retrievalRepositoryError })
    };
  } finally {
    await client.end();
  }
};
