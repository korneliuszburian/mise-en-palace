import postgres from "postgres";

export interface HarnessPersistenceReadinessInput {
  databaseUrl: string;
}

export interface HarnessPersistenceReadinessReport {
  requiredTables: readonly string[];
  presentTables: readonly string[];
  missingTables: readonly string[];
  requiredTableCount: number;
  presentTableCount: number;
  schemaReady: boolean;
}

const requiredHarnessPersistenceTables = [
  "operator_intents",
  "task_contracts",
  "harness_plans",
  "context_assemblies",
  "execution_runs",
  "evidence_bundles",
  "review_assessments",
  "feedback_deltas",
  "run_events",
  "outbox_events"
] as const;

export const inspectHarnessPersistenceReadiness = async (
  input: HarnessPersistenceReadinessInput
): Promise<HarnessPersistenceReadinessReport> => {
  const databaseUrl = input.databaseUrl.trim();

  if (databaseUrl.length === 0) {
    throw new Error("KRN_DATABASE_URL is required for harness persistence readiness");
  }

  const client = postgres(databaseUrl, {
    max: 1,
    onnotice: () => undefined
  });

  try {
    const presentTables: string[] = [];
    const missingTables: string[] = [];

    for (const tableName of requiredHarnessPersistenceTables) {
      const rows = await client<{ present: boolean }[]>`
        select to_regclass(${tableName}) is not null as present
      `;

      if (rows[0]?.present === true) {
        presentTables.push(tableName);
      } else {
        missingTables.push(tableName);
      }
    }

    return {
      requiredTables: requiredHarnessPersistenceTables,
      presentTables,
      missingTables,
      requiredTableCount: requiredHarnessPersistenceTables.length,
      presentTableCount: presentTables.length,
      schemaReady: missingTables.length === 0
    };
  } finally {
    await client.end();
  }
};
