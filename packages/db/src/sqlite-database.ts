import { lstat, mkdir } from "node:fs/promises";
import path from "node:path";
import BetterSqlite3 from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

import * as schema from "./schema/sqlite/index.js";
import {
  inspectTargetKrnArtifacts,
  targetKrnArtifactsAreForbidden
} from "./target-krn-artifacts.js";

export type KrnSqliteDatabase = BetterSQLite3Database<typeof schema>;

export interface KrnSqliteConnection {
  readonly client: BetterSqlite3.Database;
  readonly db: KrnSqliteDatabase;
  readonly dbPath: string;
  close(): void;
}

const isMissing = (error: unknown): boolean =>
  error instanceof Error && "code" in error && error.code === "ENOENT";

const assertOrdinarySqlitePath = async (
  resolvedPath: string,
  allowMissing: boolean
): Promise<void> => {
  const parent = await lstat(path.dirname(resolvedPath));
  if (parent.isSymbolicLink() || !parent.isDirectory()) {
    throw new Error(`SQLite parent must be a regular directory: ${path.dirname(resolvedPath)}`);
  }

  try {
    const artifact = await lstat(resolvedPath, { bigint: true });
    if (artifact.isSymbolicLink() || !artifact.isFile() || artifact.nlink !== 1n) {
      throw new Error(`SQLite database must be a regular, non-linked file: ${resolvedPath}`);
    }
  } catch (error) {
    if (!(allowMissing && isMissing(error))) {
      throw error;
    }
  }
};

const assertSafeSqlitePath = async (
  resolvedPath: string,
  allowMissing: boolean
): Promise<void> => {
  const parent = path.dirname(resolvedPath);
  if (path.basename(parent) === ".krn" && path.basename(resolvedPath) === "memory.db") {
    const result = await inspectTargetKrnArtifacts(path.dirname(parent));
    if (targetKrnArtifactsAreForbidden(result)) {
      const entry = result.entry === undefined ? "" : ` (${result.entry})`;
      throw new Error(`Forbidden governed SQLite artifact: ${result.reason}${entry}`);
    }
    if (!allowMissing && !result.artifacts.includes("memory.db")) {
      throw new Error(`SQLite database does not exist: ${resolvedPath}`);
    }
    return;
  }

  await assertOrdinarySqlitePath(resolvedPath, allowMissing);
};

export const openKrnSqliteDatabase = async (
  dbPath: string,
  options: {
    readonly createParent?: boolean;
    readonly fileMustExist?: boolean;
    readonly readonly?: boolean;
  } = {}
): Promise<KrnSqliteConnection> => {
  const resolvedPath = path.resolve(dbPath);

  if (options.createParent === true) {
    await mkdir(path.dirname(resolvedPath), { recursive: true });
  }

  await assertSafeSqlitePath(resolvedPath, options.fileMustExist !== true);

  const client = new BetterSqlite3(resolvedPath, {
    readonly: options.readonly ?? false,
    fileMustExist: options.fileMustExist ?? false
  });

  try {
    await assertSafeSqlitePath(resolvedPath, false);
    if (options.readonly !== true) {
      client.pragma("journal_mode = WAL");
    }
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
