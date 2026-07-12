import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

import { readMigrationFiles } from "drizzle-orm/migrator";
import postgres from "postgres";
import { describe, expect, it } from "vitest";

import {
  compareMigrationIdentities,
  inspectMigrationReadiness,
  migrateDatabase,
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

const quoteIdentifier = (value: string): string =>
  `"${value.replaceAll("\"", "\"\"")}"`;

const quoteLiteral = (value: string): string =>
  `'${value.replaceAll("'", "''")}'`;

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

const createReadOnlyDatabaseRole = async (databaseUrl: string): Promise<{
  readonly databaseUrl: string;
  readonly cleanup: () => Promise<void>;
}> => {
  const parsed = new URL(databaseUrl);
  const databaseName = decodeURIComponent(parsed.pathname.slice(1));
  const roleName = `krn_readiness_readonly_${crypto.randomUUID().replaceAll("-", "")}`;
  const password = crypto.randomUUID();
  const adminClient = postgres(databaseUrlFor(databaseUrl, "postgres"), {
    max: 1,
    onnotice: () => undefined
  });
  const databaseClient = postgres(databaseUrl, { max: 1, onnotice: () => undefined });

  try {
    await adminClient.unsafe(
      `create role ${quoteIdentifier(roleName)} login nosuperuser nocreatedb nocreaterole noinherit password ${quoteLiteral(password)}`
    );
    await adminClient.unsafe(
      `grant connect on database ${quoteIdentifier(databaseName)} to ${quoteIdentifier(roleName)}`
    );
    await databaseClient.unsafe("revoke create on schema public from public");
    await databaseClient.unsafe(`grant usage on schema public, drizzle to ${quoteIdentifier(roleName)}`);
    await databaseClient.unsafe(`grant select on all tables in schema public, drizzle to ${quoteIdentifier(roleName)}`);
  } catch (error) {
    await databaseClient.end();
    await adminClient.unsafe(`drop role if exists ${quoteIdentifier(roleName)}`);
    await adminClient.end();
    throw error;
  }

  await databaseClient.end();
  const readOnlyUrl = new URL(databaseUrl);
  readOnlyUrl.username = roleName;
  readOnlyUrl.password = password;

  return {
    databaseUrl: readOnlyUrl.toString(),
    cleanup: async () => {
      const cleanupClient = postgres(databaseUrl, { max: 1, onnotice: () => undefined });

      try {
        await cleanupClient.unsafe(`drop owned by ${quoteIdentifier(roleName)}`);
      } finally {
        await cleanupClient.end();
      }

      try {
        await adminClient.unsafe(`drop role if exists ${quoteIdentifier(roleName)}`);
      } finally {
        await adminClient.end();
      }
    }
  };
};

const readOnlyRolePrivileges = async (databaseUrl: string): Promise<{
  readonly canInsertSourceClaim: boolean;
  readonly canCreatePublicTable: boolean;
}> => {
  const client = postgres(databaseUrl, { max: 1, onnotice: () => undefined });

  try {
    const rows = await client<{ canInsertSourceClaim: boolean; canCreatePublicTable: boolean }[]>`
      select
        has_table_privilege(current_user, 'public.source_claims', 'insert') as "canInsertSourceClaim",
        has_schema_privilege(current_user, 'public', 'create') as "canCreatePublicTable"
    `;
    const privileges = rows[0];

    return {
      canInsertSourceClaim: privileges?.canInsertSourceClaim === true,
      canCreatePublicTable: privileges?.canCreatePublicTable === true
    };
  } finally {
    await client.end();
  }
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
    "requires explicit migration before a missing schema can become ready",
    async () => {
      const expectedMigrationIdentities = readMigrationFiles({ migrationsFolder }).map(
        (migration) => `${migration.hash}@${migration.folderMillis}`
      );
      const disposableDatabase = await createDisposableDatabase(databaseUrl!);
      let readOnlyRole: Awaited<ReturnType<typeof createReadOnlyDatabaseRole>> | undefined;

      try {
        const beforeMigration = await snapshotMigrationSchema(disposableDatabase.databaseUrl);
        const missingMigrationInspection = await inspectMigrationReadiness({
          databaseUrl: disposableDatabase.databaseUrl,
          migrationsFolder
        });
        const afterMissingMigrationInspection = await snapshotMigrationSchema(disposableDatabase.databaseUrl);
        const migration = await migrateDatabase({
          databaseUrl: disposableDatabase.databaseUrl,
          migrationsFolder
        });
        const afterMigration = await snapshotMigrationSchema(disposableDatabase.databaseUrl);
        const beforeInspection = await snapshotMigrationSchema(disposableDatabase.databaseUrl);
        const inspection = await inspectMigrationReadiness({
          databaseUrl: disposableDatabase.databaseUrl,
          migrationsFolder
        });
        const afterInspection = await snapshotMigrationSchema(disposableDatabase.databaseUrl);

        expect(beforeMigration).toEqual({
          migrationTablePresent: false,
          appliedMigrationCount: 0,
          appliedMigrationIdentities: [],
          sourceClaimsPresent: false,
          sourceClaimColumnCount: 0
        });
        expect(missingMigrationInspection).toMatchObject({
          migrationTablePresent: false,
          appliedMigrationCount: 0,
          migrationIdentityStatus: "unavailable",
          migrationsVerified: false
        });
        expect(afterMissingMigrationInspection).toEqual(beforeMigration);
        expect(migration).toMatchObject({
          migrationTablePresent: true,
          appliedMigrationCount: migration.expectedMigrationCount,
          migrationsVerified: true
        });
        expect(afterMigration).toMatchObject({
          migrationTablePresent: true,
          appliedMigrationCount: migration.expectedMigrationCount,
          appliedMigrationIdentities: expectedMigrationIdentities,
          sourceClaimsPresent: true
        });
        expect(afterMigration.sourceClaimColumnCount).toBeGreaterThan(0);
        expect(afterMigration).not.toEqual(beforeMigration);
        readOnlyRole = await createReadOnlyDatabaseRole(disposableDatabase.databaseUrl);
        expect(await readOnlyRolePrivileges(readOnlyRole.databaseUrl)).toEqual({
          canInsertSourceClaim: false,
          canCreatePublicTable: false
        });
        const readOnlyBeforeInspection = await snapshotMigrationSchema(disposableDatabase.databaseUrl);
        const readOnlyInspection = await inspectMigrationReadiness({
          databaseUrl: readOnlyRole.databaseUrl,
          migrationsFolder
        });
        const readOnlyAfterInspection = await snapshotMigrationSchema(disposableDatabase.databaseUrl);

        expect(readOnlyInspection.migrationsVerified).toBe(true);
        expect(readOnlyAfterInspection).toEqual(readOnlyBeforeInspection);
        expect(inspection.migrationsVerified).toBe(true);
        expect(afterInspection).toEqual(beforeInspection);
      } finally {
        await readOnlyRole?.cleanup();
        await disposableDatabase.cleanup();
      }
    }
  );
});
