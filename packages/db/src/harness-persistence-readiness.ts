import postgres from "postgres";

import { inspectDatabaseRequiredTables } from "./readiness-support.js";

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
    const tableInspection = await inspectDatabaseRequiredTables(client, requiredHarnessPersistenceTables);

    return {
      requiredTables: requiredHarnessPersistenceTables,
      presentTables: tableInspection.presentTables,
      missingTables: tableInspection.missingTables,
      requiredTableCount: tableInspection.requiredTableCount,
      presentTableCount: tableInspection.presentTableCount,
      schemaReady: tableInspection.schemaReady
    };
  } finally {
    await client.end();
  }
};
