import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

import { readMigrationFiles } from "drizzle-orm/migrator";
import postgres from "postgres";
import { describe, expect, it } from "vitest";

import {
  compareMigrationIdentities,
  inspectMigrationReadiness,
  runMigrationReadinessCheck,
  type MigrationIdentity
} from "../migration-readiness.js";

const migration = (hash: string, createdAt: string): MigrationIdentity => ({
  hash,
  createdAt
});

const databaseUrl = process.env.KRN_DATABASE_URL?.trim();
const migrationsFolder = fileURLToPath(new URL("../migrations", import.meta.url));

interface MigrationSchemaSnapshot {
  readonly migrationTablePresent: boolean;
  readonly appliedMigrationCount: number;
  readonly appliedMigrationIdentities: readonly string[];
  readonly sourceClaimsPresent: boolean;
  readonly sourceClaimColumnCount: number;
}

const databaseUrlFor = (input: string, databaseName: string): string => {
  const parsed = new URL(input);
  parsed.pathname = `/${databaseName}`;
  return parsed.toString();
};

const snapshotMigrationSchema = async (databaseUrl: string): Promise<MigrationSchemaSnapshot> => {
  const client = postgres(databaseUrl, { max: 1, onnotice: () => undefined });

  try {
    const migrationTableRows = await client<{ present: boolean }[]>`
      select to_regclass('drizzle.__drizzle_migrations') is not null as present
    `;
    const migrationTablePresent = migrationTableRows[0]?.present === true;
    const appliedMigrationRows = migrationTablePresent
      ? await client<{ hash: string; createdAt: string }[]>`
          select hash, created_at::text as "createdAt"
          from drizzle.__drizzle_migrations
          order by id
        `
      : [];
    const sourceClaimRows = await client<{ present: boolean; columnCount: number }[]>`
      select
        to_regclass('public.source_claims') is not null as present,
        count(*)::int as "columnCount"
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'source_claims'
    `;
    const sourceClaims = sourceClaimRows[0];

    return {
      migrationTablePresent,
      appliedMigrationCount: appliedMigrationRows.length,
      appliedMigrationIdentities: appliedMigrationRows.map(({ hash, createdAt }) => `${hash}@${createdAt}`),
      sourceClaimsPresent: sourceClaims?.present === true,
      sourceClaimColumnCount: sourceClaims?.columnCount ?? 0
    };
  } finally {
    await client.end();
  }
};

const createDisposableDatabase = async (databaseUrl: string): Promise<{
  readonly databaseUrl: string;
  readonly cleanup: () => Promise<void>;
}> => {
  const databaseName = `krn_migration_readiness_${crypto.randomUUID().replaceAll("-", "")}`;
  const adminClient = postgres(databaseUrlFor(databaseUrl, "postgres"), {
    max: 1,
    onnotice: () => undefined
  });

  try {
    await adminClient.unsafe(`create database ${databaseName}`);
  } catch (error) {
    await adminClient.end();
    throw error;
  }

  return {
    databaseUrl: databaseUrlFor(databaseUrl, databaseName),
    cleanup: async () => {
      try {
        await adminClient.unsafe(`drop database if exists ${databaseName} with (force)`);
      } finally {
        await adminClient.end();
      }
    }
  };
};

describe("compareMigrationIdentities", () => {
  it("accepts an exact ordered identity match", () => {
    expect(compareMigrationIdentities(
      [migration("hash-1", "100"), migration("hash-2", "200")],
      [migration("hash-1", "100"), migration("hash-2", "200")]
    )).toEqual({
      status: "verified",
      details: []
    });
  });

  it("reports missing, extra, reordered, and same-count mismatched migrations", () => {
    const expected = [migration("hash-1", "100"), migration("hash-2", "200")];

    expect(compareMigrationIdentities(expected, [expected[0]!])).toMatchObject({
      status: "missing"
    });
    expect(compareMigrationIdentities(expected, [expected[0]!, expected[1]!, migration("hash-3", "300")]))
      .toMatchObject({ status: "extra" });
    expect(compareMigrationIdentities(expected, [expected[1]!, expected[0]!])).toMatchObject({
      status: "reordered"
    });
    expect(compareMigrationIdentities(expected, [migration("different", "100"), expected[1]!]))
      .toMatchObject({ status: "mismatched" });
  });
});

describe("migration readiness boundary", () => {
  it.skipIf(databaseUrl === undefined || databaseUrl.length === 0)(
    "demonstrates that the current readiness command applies migrations to an empty disposable database",
    async () => {
      const expectedMigrationIdentities = readMigrationFiles({ migrationsFolder }).map(
        (migration) => `${migration.hash}@${migration.folderMillis}`
      );
      const disposableDatabase = await createDisposableDatabase(databaseUrl!);

      try {
        const beforeReadiness = await snapshotMigrationSchema(disposableDatabase.databaseUrl);
        const readiness = await runMigrationReadinessCheck({
          databaseUrl: disposableDatabase.databaseUrl,
          migrationsFolder
        });
        const afterReadiness = await snapshotMigrationSchema(disposableDatabase.databaseUrl);
        const beforeInspection = await snapshotMigrationSchema(disposableDatabase.databaseUrl);
        const inspection = await inspectMigrationReadiness({
          databaseUrl: disposableDatabase.databaseUrl,
          migrationsFolder
        });
        const afterInspection = await snapshotMigrationSchema(disposableDatabase.databaseUrl);

        expect(beforeReadiness).toEqual({
          migrationTablePresent: false,
          appliedMigrationCount: 0,
          appliedMigrationIdentities: [],
          sourceClaimsPresent: false,
          sourceClaimColumnCount: 0
        });
        expect(readiness).toMatchObject({
          migrationTablePresent: true,
          appliedMigrationCount: readiness.expectedMigrationCount,
          migrationsVerified: true
        });
        expect(afterReadiness).toMatchObject({
          migrationTablePresent: true,
          appliedMigrationCount: readiness.expectedMigrationCount,
          appliedMigrationIdentities: expectedMigrationIdentities,
          sourceClaimsPresent: true
        });
        expect(afterReadiness.sourceClaimColumnCount).toBeGreaterThan(0);
        expect(afterReadiness).not.toEqual(beforeReadiness);
        expect(inspection.migrationsVerified).toBe(true);
        expect(afterInspection).toEqual(beforeInspection);
      } finally {
        await disposableDatabase.cleanup();
      }
    }
  );
});
