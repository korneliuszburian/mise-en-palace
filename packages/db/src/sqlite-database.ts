import { mkdir } from "node:fs/promises";
import path from "node:path";
import BetterSqlite3 from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

import * as schema from "./schema/sqlite/index.js";

export type KrnSqliteDatabase = BetterSQLite3Database<typeof schema>;

export interface KrnSqliteConnection {
  readonly client: BetterSqlite3.Database;
  readonly db: KrnSqliteDatabase;
  readonly dbPath: string;
  close(): void;
}

export const openKrnSqliteDatabase = async (
  dbPath: string,
  options: { readonly createParent?: boolean } = {}
): Promise<KrnSqliteConnection> => {
  const resolvedPath = path.resolve(dbPath);

  if (options.createParent === true) {
    await mkdir(path.dirname(resolvedPath), { recursive: true });
  }

  const client = new BetterSqlite3(resolvedPath);

  try {
    client.pragma("journal_mode = WAL");
    client.pragma("foreign_keys = ON");
    client.pragma("busy_timeout = 5000");

    return {
      client,
      db: drizzle(client, { schema }),
      dbPath: resolvedPath,
      close() {
        if (client.open) {
          client.close();
        }
      }
    };
  } catch (error) {
    client.close();
    throw error;
  }
};
