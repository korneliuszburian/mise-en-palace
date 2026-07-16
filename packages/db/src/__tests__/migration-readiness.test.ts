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
const liveDatabaseTestTimeoutMs = 30_000;

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

  it("accepts only the exact converged legacy 0029/0030 lineage", () => {
    const expected = Array.from({ length: 49 }, (_, index) =>
      migration(`canonical-${index}`, String(index))
    );
    expected[29] = migration(
      "057e6c47e46905aa711853a7d39ff086f826272360470349a13b7cec8c1b9e86",
      "1783737041990"
    );
    expected[30] = migration(
      "86d45017c2faf6d4a829833c58674a25fc3c09b9a763ebe477cd601a76cce78a",
      "1783996876609"
    );
    const legacy = expected.map((identity) => ({ ...identity }));
    legacy[29] = migration(
      "a560a99e7aba80b3e7acc82fb2b06c3d1c93ed0226b4a0eb25ccbe3d02870f80",
      "1783737041990"
    );
    legacy[30] = migration(
      "e9ed37609e9db2d1076ec4b583929f3d44e863ed2488e944cd3735c1a28638d0",
      "1783996876609"
    );

    expect(compareMigrationIdentities(expected, legacy)).toEqual({
      status: "verified",
      details: ["Approved migration lineage: legacy-precommit-0029-0030-v1"]
    });
    expect(compareMigrationIdentities(expected.slice(0, 44), legacy.slice(0, 44)))
      .toMatchObject({ status: "mismatched" });

    const unknown = legacy.map((identity) => ({ ...identity }));
    unknown[29] = migration("unknown-lineage", "1783737041990");
    expect(compareMigrationIdentities(expected, unknown)).toMatchObject({
      status: "mismatched"
    });

    const rewrittenCanonical = expected.map((identity) => ({ ...identity }));
    rewrittenCanonical[29] = migration("rewritten-canonical", "1783737041990");
    expect(compareMigrationIdentities(rewrittenCanonical, legacy)).toMatchObject({
      status: "mismatched"
    });

    const local0047 = legacy.map((identity) => ({ ...identity }));
    expected[47] = migration(
      "2f408bd77309fafa46d1a6e00debdf90ecf9ee5c9802b134a6d714386d349d9e",
      "1784207979037"
    );
    local0047[47] = migration(
      "1a35e12cfb91f47c56a99a25da69719f96924096ca1e6c1aac593f7d5b220a45",
      "1784207979037"
    );
    expect(compareMigrationIdentities(expected, local0047)).toEqual({
      status: "verified",
      details: ["Approved migration lineage: legacy-precommit-0029-0030-local-0047-v1"]
    });
    expect(compareMigrationIdentities(expected.slice(0, 48), local0047.slice(0, 48)))
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
    },
    liveDatabaseTestTimeoutMs
  );
});
