import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import {
  inspectSqliteMigrationReadiness,
  migrateSqliteDatabase,
  openKrnSqliteDatabase
} from "../index.js";

const openedPaths: string[] = [];

afterEach(() => {
  openedPaths.length = 0;
});

describe("SQLite migration assets", () => {
  it("creates the complete schema with WAL, foreign keys, and idempotent migrations", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "krn-sqlite-migration-"));
    const dbPath = path.join(directory, ".krn", "memory.db");
    openedPaths.push(dbPath);

    const first = await migrateSqliteDatabase(dbPath);
    const second = await migrateSqliteDatabase(dbPath);
    const inspected = await inspectSqliteMigrationReadiness(dbPath);

    expect(first).toMatchObject({
      connectivityReady: true,
      migrationsVerified: true,
      schemaPresent: true,
      repositoryReachabilityReady: true,
      foreignKeyViolations: 0,
      integrityReady: true
    });
    expect(second.appliedMigrationCount).toBe(first.expectedMigrationCount);
    expect(inspected).toEqual(second);

    const connection = await openKrnSqliteDatabase(dbPath);
    try {
      expect(connection.client.pragma("journal_mode", { simple: true })).toBe("wal");
      expect(connection.client.pragma("foreign_keys", { simple: true })).toBe(1);
      expect((connection.client.prepare(
        "select count(*) as count from sqlite_master where type = 'table' and name not like 'sqlite_%' and name <> '__drizzle_migrations'"
      ).get() as { count: number }).count).toBe(51);

      expect(() => connection.client.prepare(
        "insert into workspaces (slug, display_name, metadata) values (?, ?, ?)"
      ).run("local", "Local", "{}")).not.toThrow();
      expect(() => connection.client.prepare(
        "insert into memory_records (project_id, key, kind, summary, body, owner, confidence, application_guidance, source_lineage) values (?, ?, ?, ?, ?, ?, ?, ?, ?)"
      ).run("missing", "key", "not-a-kind", "s", "b", "o", 50, "guidance", "[]"))
        .toThrow();
    } finally {
      connection.close();
    }
  });
});
