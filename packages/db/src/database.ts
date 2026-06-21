import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { Sql } from "postgres";

import * as schema from "./schema/index.js";

export type KrnDatabase = PostgresJsDatabase<typeof schema>;

export const createKrnDatabase = (client: Sql): KrnDatabase => drizzle(client, { schema });
