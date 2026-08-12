import postgres from "postgres";
import {
  createKrnDatabase
} from "./database.js";
import {
  DrizzleHarnessRunRepository
} from "./repositories/drizzle-harness-run-repository.js";
import {
  DrizzleMemoryRepository
} from "./repositories/drizzle-memory-repository.js";
import {
  DrizzleProjectRepository
} from "./repositories/drizzle-project-repository.js";
import {
  DrizzleSourceRepository
} from "./repositories/drizzle-source-repository.js";

export const openPostgresRuntime = async (
  databaseUrl: string
) => {
  const client = postgres(databaseUrl, { max: 1, onnotice: () => undefined });
  const db = createKrnDatabase(client);
  return {
    projectRepository: new DrizzleProjectRepository(db),
    memoryRepository: new DrizzleMemoryRepository(db),
    sourceRepository: new DrizzleSourceRepository(db),
    harnessRunRepository: new DrizzleHarnessRunRepository(db),
    async close(): Promise<void> {
      await client.end();
    }
  };
};
