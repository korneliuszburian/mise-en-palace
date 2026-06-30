import type { Sql } from "postgres";

export interface RequiredTableInspection {
  requiredTables: readonly string[];
  presentTables: readonly string[];
  missingTables: readonly string[];
  requiredTableCount: number;
  presentTableCount: number;
  schemaReady: boolean;
}

export const inspectRequiredTablePresence = async (
  requiredTables: readonly string[],
  isTablePresent: (tableName: string) => Promise<boolean>
): Promise<RequiredTableInspection> => {
  const presentTables: string[] = [];
  const missingTables: string[] = [];

  for (const tableName of requiredTables) {
    if (await isTablePresent(tableName)) {
      presentTables.push(tableName);
    } else {
      missingTables.push(tableName);
    }
  }

  return {
    requiredTables,
    presentTables,
    missingTables,
    requiredTableCount: requiredTables.length,
    presentTableCount: presentTables.length,
    schemaReady: missingTables.length === 0
  };
};

export const inspectDatabaseRequiredTables = async (
  client: Sql,
  requiredTables: readonly string[]
): Promise<RequiredTableInspection> =>
  inspectRequiredTablePresence(requiredTables, async (tableName) => {
    const rows = await client<{ present: boolean }[]>`
      select to_regclass(${tableName}) is not null as present
    `;

    return rows[0]?.present === true;
  });
