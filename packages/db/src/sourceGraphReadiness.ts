import postgres from "postgres";

import { createKrnDatabase } from "./database.js";
import {
  DrizzleSourceRepository
} from "./repositories/index.js";

export interface SourceGraphReadinessInput {
  databaseUrl: string;
}

export interface SourceGraphReadinessReport {
  requiredTables: readonly string[];
  presentTables: readonly string[];
  missingTables: readonly string[];
  requiredTableCount: number;
  presentTableCount: number;
  schemaReady: boolean;
  sourceRepositoryReachable: boolean;
  sourceArtifactCount: number;
  sourceClaimCount: number;
  sourceDecisionEdgeCount: number;
  sourceRejectionCount: number;
  runtimeProofReady: boolean;
  sourceRepositoryError?: string;
}

const requiredSourceGraphTables = [
  "source_artifacts",
  "source_chunks",
  "source_claims",
  "source_claim_edges",
  "source_decisions",
  "source_decision_edges",
  "source_rejections",
  "source_snapshots"
] as const;

interface SourceGraphCounts {
  sourceArtifactCount: number;
  sourceClaimCount: number;
  sourceDecisionEdgeCount: number;
  sourceRejectionCount: number;
}

const emptyCounts: SourceGraphCounts = {
  sourceArtifactCount: 0,
  sourceClaimCount: 0,
  sourceDecisionEdgeCount: 0,
  sourceRejectionCount: 0
};

export const inspectSourceGraphReadiness = async (
  input: SourceGraphReadinessInput
): Promise<SourceGraphReadinessReport> => {
  const databaseUrl = input.databaseUrl.trim();

  if (databaseUrl.length === 0) {
    throw new Error("KRN_DATABASE_URL is required for source graph readiness");
  }

  const client = postgres(databaseUrl, {
    max: 1,
    onnotice: () => undefined
  });

  try {
    const presentTables: string[] = [];
    const missingTables: string[] = [];

    for (const tableName of requiredSourceGraphTables) {
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
    let sourceRepositoryReachable = false;
    let sourceRepositoryError: string | undefined;
    let counts = emptyCounts;

    if (schemaReady) {
      try {
        const sourceRepository = new DrizzleSourceRepository(createKrnDatabase(client));

        await sourceRepository.getSourceClaimById("00000000-0000-0000-0000-000000000000");
        sourceRepositoryReachable = true;
      } catch (error) {
        sourceRepositoryError = error instanceof Error ? error.message : "unknown source repository error";
      }

      const countRows = await client<SourceGraphCounts[]>`
        select
          (select count(*)::int from source_artifacts) as "sourceArtifactCount",
          (select count(*)::int from source_claims) as "sourceClaimCount",
          (select count(*)::int from source_decision_edges) as "sourceDecisionEdgeCount",
          (select count(*)::int from source_rejections) as "sourceRejectionCount"
      `;

      counts = countRows[0] ?? emptyCounts;
    }

    return {
      requiredTables: requiredSourceGraphTables,
      presentTables,
      missingTables,
      requiredTableCount: requiredSourceGraphTables.length,
      presentTableCount: presentTables.length,
      schemaReady,
      sourceRepositoryReachable,
      sourceArtifactCount: counts.sourceArtifactCount,
      sourceClaimCount: counts.sourceClaimCount,
      sourceDecisionEdgeCount: counts.sourceDecisionEdgeCount,
      sourceRejectionCount: counts.sourceRejectionCount,
      runtimeProofReady:
        counts.sourceClaimCount > 0 &&
        counts.sourceDecisionEdgeCount > 0 &&
        counts.sourceRejectionCount > 0,
      ...(sourceRepositoryError === undefined ? {} : { sourceRepositoryError })
    };
  } finally {
    await client.end();
  }
};
