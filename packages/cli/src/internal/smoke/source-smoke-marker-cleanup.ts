import type postgres from "postgres";

import {
  finalizeSmokeMarkerCleanup
} from "./smoke-runtime-cleanup.js";

type PostgresClient = ReturnType<typeof postgres>;

const markerTableCount = async (
  client: PostgresClient,
  table: string,
  smokeId: string
): Promise<number> => {
  const rows = await client.unsafe<{ count: number }[]>(
    `select count(*)::int as count from ${table} where metadata->>'smokeId' = $1`,
    [smokeId]
  );

  return rows[0]?.count ?? 0;
};

export const cleanupSourceSmokeMarkers = async (
  client: PostgresClient,
  markerTables: readonly string[],
  smokeId: string,
  smokeSource: string
): Promise<void> => {
  for (const table of markerTables) {
    await client.unsafe(
      `delete from ${table} where metadata->>'smokeId' = $1 or metadata->>'source' = $2`,
      [smokeId, smokeSource]
    );
  }

  await client`
    delete from outbox_events
    where payload->>'smokeId' = ${smokeId}
      or payload->>'source' = ${smokeSource}
  `;
  await client`
    delete from run_events
    where payload->>'smokeId' = ${smokeId}
  `;
};

const countSourceSmokeMarkers = async (
  client: PostgresClient,
  markerTables: readonly string[],
  smokeId: string
): Promise<number> => {
  const outboxRows = await client<{ count: number }[]>`
    select count(*)::int as count
    from outbox_events
    where payload->>'smokeId' = ${smokeId}
  `;
  const runEventRows = await client<{ count: number }[]>`
    select count(*)::int as count
    from run_events
    where payload->>'smokeId' = ${smokeId}
  `;
  let count = (outboxRows[0]?.count ?? 0) + (runEventRows[0]?.count ?? 0);

  for (const table of markerTables) {
    count += await markerTableCount(client, table, smokeId);
  }

  return count;
};

export const finalizeSourceSmokeMarkerCleanup = (
  client: PostgresClient,
  markerTables: readonly string[],
  smokeId: string,
  smokeSource: string
) => finalizeSmokeMarkerCleanup(
  client,
  smokeId,
  (cleanupClient, cleanupSmokeId) =>
    countSourceSmokeMarkers(cleanupClient, markerTables, cleanupSmokeId),
  (cleanupClient, cleanupSmokeId) =>
    cleanupSourceSmokeMarkers(cleanupClient, markerTables, cleanupSmokeId, smokeSource)
);
