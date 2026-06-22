import postgres from "postgres";

export interface ActivationReadinessInput {
  databaseUrl: string;
}

export interface ActivationReadinessReport {
  requiredTables: readonly string[];
  presentTables: readonly string[];
  missingTables: readonly string[];
  requiredTableCount: number;
  presentTableCount: number;
  schemaReady: boolean;
  searchDocumentCount: number;
  retrievalCandidateCount: number;
  activationDecisionCount: number;
  includedDecisionCount: number;
  excludedDecisionCount: number;
  conflictDecisionCount: number;
  staleDecisionCount: number;
  contextItemCount: number;
  contextExclusionCount: number;
  runtimeProofReady: boolean;
}

const requiredActivationTables = [
  "search_documents",
  "retrieval_runs",
  "retrieval_candidates",
  "activation_decisions",
  "context_items",
  "context_exclusions",
  "memory_records",
  "anti_memory_records",
  "source_claims"
] as const;

interface ActivationCounts {
  searchDocumentCount: number;
  retrievalCandidateCount: number;
  activationDecisionCount: number;
  includedDecisionCount: number;
  excludedDecisionCount: number;
  conflictDecisionCount: number;
  staleDecisionCount: number;
  contextItemCount: number;
  contextExclusionCount: number;
}

const emptyCounts: ActivationCounts = {
  searchDocumentCount: 0,
  retrievalCandidateCount: 0,
  activationDecisionCount: 0,
  includedDecisionCount: 0,
  excludedDecisionCount: 0,
  conflictDecisionCount: 0,
  staleDecisionCount: 0,
  contextItemCount: 0,
  contextExclusionCount: 0
};

export const inspectActivationReadiness = async (
  input: ActivationReadinessInput
): Promise<ActivationReadinessReport> => {
  const databaseUrl = input.databaseUrl.trim();

  if (databaseUrl.length === 0) {
    throw new Error("KRN_DATABASE_URL is required for activation readiness");
  }

  const client = postgres(databaseUrl, {
    max: 1,
    onnotice: () => undefined
  });

  try {
    const presentTables: string[] = [];
    const missingTables: string[] = [];

    for (const tableName of requiredActivationTables) {
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
    let counts = emptyCounts;

    if (schemaReady) {
      const countRows = await client<ActivationCounts[]>`
        select
          (select count(*)::int from search_documents) as "searchDocumentCount",
          (select count(*)::int from retrieval_candidates) as "retrievalCandidateCount",
          (select count(*)::int from activation_decisions) as "activationDecisionCount",
          (select count(*)::int from activation_decisions where decision = 'included') as "includedDecisionCount",
          (select count(*)::int from activation_decisions where decision = 'excluded') as "excludedDecisionCount",
          (select count(*)::int from activation_decisions where decision = 'conflict') as "conflictDecisionCount",
          (select count(*)::int from activation_decisions where decision = 'stale') as "staleDecisionCount",
          (select count(*)::int from context_items) as "contextItemCount",
          (select count(*)::int from context_exclusions) as "contextExclusionCount"
      `;

      counts = countRows[0] ?? emptyCounts;
    }

    return {
      requiredTables: requiredActivationTables,
      presentTables,
      missingTables,
      requiredTableCount: requiredActivationTables.length,
      presentTableCount: presentTables.length,
      schemaReady,
      searchDocumentCount: counts.searchDocumentCount,
      retrievalCandidateCount: counts.retrievalCandidateCount,
      activationDecisionCount: counts.activationDecisionCount,
      includedDecisionCount: counts.includedDecisionCount,
      excludedDecisionCount: counts.excludedDecisionCount,
      conflictDecisionCount: counts.conflictDecisionCount,
      staleDecisionCount: counts.staleDecisionCount,
      contextItemCount: counts.contextItemCount,
      contextExclusionCount: counts.contextExclusionCount,
      runtimeProofReady:
        counts.searchDocumentCount > 0 &&
        counts.retrievalCandidateCount > 0 &&
        counts.activationDecisionCount > 0 &&
        counts.includedDecisionCount > 0 &&
        counts.contextItemCount > 0 &&
        counts.contextExclusionCount > 0 &&
        counts.excludedDecisionCount + counts.conflictDecisionCount + counts.staleDecisionCount > 0
    };
  } finally {
    await client.end();
  }
};
