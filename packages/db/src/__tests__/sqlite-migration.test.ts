import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  symlink,
  writeFile
} from "node:fs/promises";
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
  it("rejects a symlinked governed database before SQLite can mutate its target", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "krn-sqlite-symlink-"));
    const krnDirectory = path.join(directory, ".krn");
    const outside = path.join(directory, "outside.db");
    const dbPath = path.join(krnDirectory, "memory.db");
    await mkdir(krnDirectory);
    await writeFile(outside, "outside must remain unchanged", "utf8");
    await symlink(outside, dbPath);

    await expect(migrateSqliteDatabase(dbPath)).rejects.toThrow("symbolic_link");
    await expect(readFile(outside, "utf8")).resolves.toBe("outside must remain unchanged");
  });

  it("does not create a missing store during readiness inspection", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "krn-sqlite-readiness-missing-"));
    const parent = path.join(directory, ".krn");
    const dbPath = path.join(parent, "memory.db");

    await expect(inspectSqliteMigrationReadiness(dbPath)).rejects.toThrow();
    await expect(access(parent)).rejects.toThrow();
  });

  it("reports an existing unmigrated store without probing missing repositories", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "krn-sqlite-readiness-empty-"));
    const dbPath = path.join(directory, ".krn", "memory.db");
    const connection = await openKrnSqliteDatabase(dbPath, { createParent: true });
    connection.close();

    const report = await inspectSqliteMigrationReadiness(dbPath);

    expect(report).toMatchObject({
      connectivityReady: true,
      migrationTablePresent: false,
      migrationIdentityStatus: "unavailable",
      migrationsVerified: false,
      schemaPresent: false,
      repositoryReachabilityReady: false
    });
  });

  it("rejects a same-count migration history with a tampered identity", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "krn-sqlite-readiness-tampered-"));
    const dbPath = path.join(directory, ".krn", "memory.db");
    await migrateSqliteDatabase(dbPath);

    const connection = await openKrnSqliteDatabase(dbPath);
    try {
      connection.client.prepare(
        "update __drizzle_migrations set hash = ? where created_at = (select min(created_at) from __drizzle_migrations)"
      ).run("tampered-migration-hash");
    } finally {
      connection.close();
    }

    const report = await inspectSqliteMigrationReadiness(dbPath);
    expect(report.appliedMigrationCount).toBe(report.expectedMigrationCount);
    expect(report.migrationIdentityStatus).toBe("mismatched");
    expect(report.migrationsVerified).toBe(false);
  });

  it("treats any completed repository-contract lookup as reachable", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "krn-sqlite-readiness-probe-slug-"));
    const dbPath = path.join(directory, ".krn", "memory.db");
    await migrateSqliteDatabase(dbPath);
    const connection = await openKrnSqliteDatabase(dbPath);
    try {
      connection.client.prepare(
        "insert into workspaces (slug, display_name, metadata) values (?, ?, ?)"
      ).run("__krn_doctor_repository_probe__", "Legitimate workspace", "{}");
    } finally {
      connection.close();
    }

    await expect(inspectSqliteMigrationReadiness(dbPath)).resolves.toMatchObject({
      repositoryReachabilityReady: true
    });
  });

  it("rejects out-of-band schema drift even when all table names remain", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "krn-sqlite-schema-drift-"));
    const dbPath = path.join(directory, ".krn", "memory.db");
    await migrateSqliteDatabase(dbPath);
    const connection = await openKrnSqliteDatabase(dbPath);
    try {
      connection.client.exec("alter table embedding_models drop column distance_metric");
    } finally {
      connection.close();
    }

    await expect(inspectSqliteMigrationReadiness(dbPath)).resolves.toMatchObject({
      connectivityReady: true,
      migrationsVerified: true,
      schemaPresent: false
    });
  });

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
