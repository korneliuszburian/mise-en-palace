import type postgres from "postgres";

import {
  createDatabaseRuntime
} from "./databaseRuntime.js";

type PostgresClient = ReturnType<typeof postgres>;
type SmokeRuntime = Awaited<ReturnType<typeof createDatabaseRuntime>> | undefined;
type CreatedSmokeRuntime = Awaited<ReturnType<typeof createDatabaseRuntime>>;

// Shared try/finally cleanup for DB smoke targets that hold both an injected
// database runtime and a raw postgres marker-audit client. Extracted so the
// cleanup tail is not cloned across smoke implementations.
export const closeSmokeRuntimeAndClient = async (
  runtime: SmokeRuntime,
  client: PostgresClient
): Promise<void> => {
  if (runtime !== undefined) {
    await runtime.close();
  }

  await client.end();
};

export interface SmokeMarkerCleanupResult {
  readonly remainingMarkerCount: number;
  readonly cleanedUp: boolean;
}

// Binds a runtime factory pinned to a smoke project so recall commands reuse
// the same project the smoke seeded. Shared by DB smokes that drive a real
// search/brain command against an isolated project.
export const bindSmokeProjectRuntimeFactory = (
  runtime: CreatedSmokeRuntime
): ((runtimeInput: Parameters<typeof createDatabaseRuntime>[0]) =>
    Promise<CreatedSmokeRuntime>) => {
  const projectId = runtime.projectId;

  return (runtimeInput) => createDatabaseRuntime({
    ...runtimeInput,
    projectId,
    requireProjectKernelForExplicitProject: false
  });
};

// Shared count -> cleanup -> count tail used by DB smokes that audit marker// rows. Each smoke passes its own count/cleanup helpers because the audited
// table set differs per smoke; the orchestration is identical.
export const finalizeSmokeMarkerCleanup = async (
  client: PostgresClient,
  smokeId: string,
  countMarkerRows: (client: PostgresClient, smokeId: string) => Promise<number>,
  cleanupMarkerRows: (client: PostgresClient, smokeId: string) => Promise<void>
): Promise<SmokeMarkerCleanupResult> => {
  const remainingMarkerCountBeforeCleanup = await countMarkerRows(client, smokeId);
  await cleanupMarkerRows(client, smokeId);
  const remainingMarkerCount = await countMarkerRows(client, smokeId);

  return {
    remainingMarkerCount,
    cleanedUp: remainingMarkerCountBeforeCleanup > 0 && remainingMarkerCount === 0
  };
};
