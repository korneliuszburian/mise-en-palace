import postgres from "postgres";

import { createKrnDatabase } from "./database.js";
import {
  DrizzleMemoryRepository
} from "./repositories/index.js";

export interface MemoryGovernanceReadinessInput {
  databaseUrl: string;
}

export interface MemoryGovernanceReadinessReport {
  requiredTables: readonly string[];
  presentTables: readonly string[];
  missingTables: readonly string[];
  requiredTableCount: number;
  presentTableCount: number;
  schemaReady: boolean;
  memoryRepositoryReachable: boolean;
  memoryCandidateCount: number;
  memoryRecordCount: number;
  memoryApplicationCount: number;
  antiMemoryRecordCount: number;
  runtimeProofReady: boolean;
  memoryRepositoryError?: string;
}

const requiredMemoryGovernanceTables = [
  "memory_records",
  "memory_record_versions",
  "memory_candidates",
  "memory_applications",
  "memory_feedback_events",
  "anti_memory_records",
  "memory_activation_traces"
] as const;

interface MemoryGovernanceCounts {
  memoryCandidateCount: number;
  memoryRecordCount: number;
  memoryApplicationCount: number;
  antiMemoryRecordCount: number;
}

const emptyCounts: MemoryGovernanceCounts = {
  memoryCandidateCount: 0,
  memoryRecordCount: 0,
  memoryApplicationCount: 0,
  antiMemoryRecordCount: 0
};

export const inspectMemoryGovernanceReadiness = async (
  input: MemoryGovernanceReadinessInput
): Promise<MemoryGovernanceReadinessReport> => {
  const databaseUrl = input.databaseUrl.trim();

  if (databaseUrl.length === 0) {
    throw new Error("KRN_DATABASE_URL is required for memory governance readiness");
  }

  const client = postgres(databaseUrl, {
    max: 1,
    onnotice: () => undefined
  });

  try {
    const presentTables: string[] = [];
    const missingTables: string[] = [];

    for (const tableName of requiredMemoryGovernanceTables) {
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
    let memoryRepositoryReachable = false;
    let memoryRepositoryError: string | undefined;
    let counts = emptyCounts;

    if (schemaReady) {
      try {
        const memoryRepository = new DrizzleMemoryRepository(createKrnDatabase(client));

        await memoryRepository.getMemoryRecordById("00000000-0000-0000-0000-000000000000");
        await memoryRepository.getMemoryCandidateById("00000000-0000-0000-0000-000000000000");
        memoryRepositoryReachable = true;
      } catch (error) {
        memoryRepositoryError =
          error instanceof Error ? error.message : "unknown memory repository error";
      }

      const countRows = await client<MemoryGovernanceCounts[]>`
        select
          (select count(*)::int from memory_candidates) as "memoryCandidateCount",
          (select count(*)::int from memory_records) as "memoryRecordCount",
          (select count(*)::int from memory_applications) as "memoryApplicationCount",
          (select count(*)::int from anti_memory_records) as "antiMemoryRecordCount"
      `;

      counts = countRows[0] ?? emptyCounts;
    }

    return {
      requiredTables: requiredMemoryGovernanceTables,
      presentTables,
      missingTables,
      requiredTableCount: requiredMemoryGovernanceTables.length,
      presentTableCount: presentTables.length,
      schemaReady,
      memoryRepositoryReachable,
      memoryCandidateCount: counts.memoryCandidateCount,
      memoryRecordCount: counts.memoryRecordCount,
      memoryApplicationCount: counts.memoryApplicationCount,
      antiMemoryRecordCount: counts.antiMemoryRecordCount,
      runtimeProofReady:
        counts.memoryCandidateCount > 0 &&
        counts.memoryRecordCount > 0 &&
        counts.memoryApplicationCount > 0 &&
        counts.antiMemoryRecordCount > 0,
      ...(memoryRepositoryError === undefined ? {} : { memoryRepositoryError })
    };
  } finally {
    await client.end();
  }
};
