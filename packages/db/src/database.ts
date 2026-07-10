import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase, PostgresJsTransaction } from "drizzle-orm/postgres-js";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { Sql } from "postgres";

import * as schema from "./schema/index.js";

export type KrnDatabase = PostgresJsDatabase<typeof schema>;
export type KrnDatabaseTransaction = PostgresJsTransaction<
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

export const createKrnDatabase = (client: Sql): KrnDatabase => drizzle(client, { schema });
