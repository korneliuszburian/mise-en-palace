import { readMigrationFiles } from "drizzle-orm/migrator";
import { migrate as applyMigrations } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import type { Sql } from "postgres";

import { createKrnDatabase } from "./database.js";
import {
  inspectSourceAuthorityIntegrity,
  type SourceAuthorityIntegrityReadinessReport
} from "./source-authority-integrity-readiness.js";

export interface MigrationReadinessInput {
  databaseUrl: string;
  migrationsFolder: string;
}

export interface MigrationIdentity {
  hash: string;
  createdAt: string;
}

export type MigrationIdentityStatus =
  | "verified"
  | "missing"
  | "extra"
  | "reordered"
  | "mismatched"
  | "unavailable";

export interface MigrationIdentityComparison {
  status: MigrationIdentityStatus;
  details: readonly string[];
}

interface ApprovedMigrationLineage {
  id: string;
  minimumMigrationCount: number;
  identityOverrides: ReadonlyMap<number, {
    canonical: MigrationIdentity;
    applied: MigrationIdentity;
  }>;
}

const approvedMigrationLineages: readonly ApprovedMigrationLineage[] = [
  {
    id: "legacy-precommit-0029-0030-v1",
    minimumMigrationCount: 45,
    identityOverrides: new Map([
      [29, {
        canonical: {
          hash: "057e6c47e46905aa711853a7d39ff086f826272360470349a13b7cec8c1b9e86",
          createdAt: "1783737041990"
        },
        applied: {
          hash: "a560a99e7aba80b3e7acc82fb2b06c3d1c93ed0226b4a0eb25ccbe3d02870f80",
          createdAt: "1783737041990"
        }
      }],
      [30, {
        canonical: {
          hash: "86d45017c2faf6d4a829833c58674a25fc3c09b9a763ebe477cd601a76cce78a",
          createdAt: "1783996876609"
        },
        applied: {
          hash: "e9ed37609e9db2d1076ec4b583929f3d44e863ed2488e944cd3735c1a28638d0",
          createdAt: "1783996876609"
        }
      }]
    ])
  },
  {
    id: "legacy-precommit-0029-0030-local-0047-v1",
    minimumMigrationCount: 49,
    identityOverrides: new Map([
      [29, {
        canonical: {
          hash: "057e6c47e46905aa711853a7d39ff086f826272360470349a13b7cec8c1b9e86",
          createdAt: "1783737041990"
        },
        applied: {
          hash: "a560a99e7aba80b3e7acc82fb2b06c3d1c93ed0226b4a0eb25ccbe3d02870f80",
          createdAt: "1783737041990"
        }
      }],
      [30, {
        canonical: {
          hash: "86d45017c2faf6d4a829833c58674a25fc3c09b9a763ebe477cd601a76cce78a",
          createdAt: "1783996876609"
        },
        applied: {
          hash: "e9ed37609e9db2d1076ec4b583929f3d44e863ed2488e944cd3735c1a28638d0",
          createdAt: "1783996876609"
        }
      }],
      [47, {
        canonical: {
          hash: "2f408bd77309fafa46d1a6e00debdf90ecf9ee5c9802b134a6d714386d349d9e",
          createdAt: "1784207979037"
        },
        applied: {
          hash: "1a35e12cfb91f47c56a99a25da69719f96924096ca1e6c1aac593f7d5b220a45",
          createdAt: "1784207979037"
        }
      }]
    ])
  }
];

export interface MigrationReadinessReport {
  migrationsFolder: string;
  expectedMigrationCount: number;
  appliedMigrationCount: number;
  migrationTablePresent: boolean;
  migrationIdentityStatus: MigrationIdentityStatus;
  migrationIdentityDetails: readonly string[];
  migrationsVerified: boolean;
  pgvectorAvailable: boolean;
  postgresServerVersion: string;
  pgvectorVersion?: string;
  sourceAuthorityIntegrity?: SourceAuthorityIntegrityReadinessReport;
}

const migrationIdentityKey = (identity: MigrationIdentity): string =>
  `${identity.hash}@${identity.createdAt}`;

const sameSequence = (
  left: readonly string[],
  right: readonly string[]
): boolean => left.length === right.length && left.every((value, index) => value === right[index]);

const containsAll = (
  values: readonly string[],
  expected: readonly string[]
): boolean => expected.every((value) => values.includes(value));

const matchesApprovedLineage = (
  expected: readonly MigrationIdentity[],
  applied: readonly MigrationIdentity[],
  lineage: ApprovedMigrationLineage
): boolean =>
  expected.length === applied.length &&
  expected.length >= lineage.minimumMigrationCount &&
  expected.every((identity, index) => {
    const override = lineage.identityOverrides.get(index);
    if (override === undefined) {
      return migrationIdentityKey(identity) === migrationIdentityKey(applied[index]!);
    }
    return migrationIdentityKey(identity) === migrationIdentityKey(override.canonical) &&
      migrationIdentityKey(applied[index]!) === migrationIdentityKey(override.applied);
  });

export const compareMigrationIdentities = (
  expected: readonly MigrationIdentity[],
  applied: readonly MigrationIdentity[]
): MigrationIdentityComparison => {
  const expectedKeys = expected.map(migrationIdentityKey);
  const appliedKeys = applied.map(migrationIdentityKey);

  if (sameSequence(expectedKeys, appliedKeys)) {
    return {
      status: "verified",
      details: []
    };
  }

  const approvedLineage = approvedMigrationLineages.find((lineage) =>
    matchesApprovedLineage(expected, applied, lineage)
  );
  if (approvedLineage !== undefined) {
    return {
      status: "verified",
      details: [`Approved migration lineage: ${approvedLineage.id}`]
    };
  }

  if (
    appliedKeys.length < expectedKeys.length &&
    (sameSequence(appliedKeys, expectedKeys.slice(0, appliedKeys.length)) ||
      containsAll(expectedKeys, appliedKeys))
  ) {
    return {
      status: "missing",
      details: [`Missing applied migration identities: ${expectedKeys.filter((key) => !appliedKeys.includes(key)).join(", ")}`]
    };
  }

  if (
    appliedKeys.length > expectedKeys.length &&
    (sameSequence(expectedKeys, appliedKeys.slice(0, expectedKeys.length)) ||
      containsAll(appliedKeys, expectedKeys))
  ) {
    return {
      status: "extra",
      details: [`Extra applied migration identities: ${appliedKeys.filter((key) => !expectedKeys.includes(key)).join(", ")}`]
    };
  }

  if (
    expectedKeys.length === appliedKeys.length &&
    containsAll(expectedKeys, appliedKeys) &&
    containsAll(appliedKeys, expectedKeys)
  ) {
    return {
      status: "reordered",
      details: ["Applied migration identities contain the expected set in a different order."]
    };
  }

  return {
    status: "mismatched",
    details: [
      `Expected migration identities: ${expectedKeys.join(", ")}`,
      `Applied migration identities: ${appliedKeys.join(", ")}`
    ]
  };
};

// fallow-ignore-next-line complexity -- one PostgreSQL snapshot binds canonical assets, applied identity order, migration-table presence, and pgvector capability on the same client
const inspectMigrationState = async (
  client: Sql,
  migrationsFolder: string
): Promise<MigrationReadinessReport> => {
  const expectedMigrations = readMigrationFiles({ migrationsFolder }).map((migration) => ({
    hash: migration.hash,
    createdAt: String(migration.folderMillis)
  }));
  const expectedMigrationCount = expectedMigrations.length;
  const migrationTableRows = await client<{ present: boolean }[]>`
    select to_regclass('drizzle.__drizzle_migrations') is not null as present
  `;
  const migrationTablePresent = migrationTableRows[0]?.present === true;
  const migrationRows = migrationTablePresent
    ? await client<{ hash: string; createdAt: string }[]>`
        select hash, created_at::text as "createdAt"
        from drizzle.__drizzle_migrations
        order by id
      `
    : [];
  const runtimeRows = await client<{
    serverVersion: string;
    pgvectorAvailable: boolean;
    pgvectorVersion: string | null;
  }[]>`
    select
      current_setting('server_version') as "serverVersion",
      exists (
        select 1
        from pg_extension
        where extname = 'vector'
      ) as "pgvectorAvailable",
      (
        select extversion
        from pg_extension
        where extname = 'vector'
      ) as "pgvectorVersion"
  `;
  const appliedMigrationCount = migrationRows.length;
  const runtime = runtimeRows[0];
  const pgvectorAvailable = runtime?.pgvectorAvailable === true;
  const migrationIdentity = migrationTablePresent
    ? compareMigrationIdentities(expectedMigrations, migrationRows)
    : {
        status: "unavailable" as const,
        details: ["drizzle.__drizzle_migrations is missing"]
      };

  return {
    migrationsFolder,
    expectedMigrationCount,
    appliedMigrationCount,
    migrationTablePresent,
    migrationIdentityStatus: migrationIdentity.status,
    migrationIdentityDetails: migrationIdentity.details,
    migrationsVerified: migrationIdentity.status === "verified",
    pgvectorAvailable,
    postgresServerVersion: runtime?.serverVersion ?? "unknown",
    ...(runtime?.pgvectorVersion === null || runtime?.pgvectorVersion === undefined
      ? {}
      : { pgvectorVersion: runtime.pgvectorVersion })
  };
};

const withSourceAuthorityIntegrity = async (
  input: MigrationReadinessInput,
  report: MigrationReadinessReport
): Promise<MigrationReadinessReport> => {
  if (!report.migrationsVerified) {
    return report;
  }

  return {
    ...report,
    sourceAuthorityIntegrity: await inspectSourceAuthorityIntegrity({
      databaseUrl: input.databaseUrl,
      storeName: "postgres",
      schemaIdentity: `${report.migrationIdentityStatus}:${report.appliedMigrationCount}/${report.expectedMigrationCount}`
    })
  };
};

const withMigrationClient = async (
  input: MigrationReadinessInput,
  task: (client: Sql) => Promise<MigrationReadinessReport>
): Promise<MigrationReadinessReport> => {
  const databaseUrl = input.databaseUrl.trim();

  if (databaseUrl.length === 0) {
    throw new Error("KRN_DATABASE_URL is required for migration readiness");
  }

  const client = postgres(databaseUrl, {
    max: 1,
    onnotice: () => undefined
  });

  try {
    await client`select 1`;
    return await task(client);
  } finally {
    await client.end();
  }
};

export const inspectMigrationReadiness = (
  input: MigrationReadinessInput
): Promise<MigrationReadinessReport> => withMigrationClient(
  input,
  async (client) => {
    const report = await inspectMigrationState(client, input.migrationsFolder);
    return withSourceAuthorityIntegrity(input, report);
  }
);

export const migrateDatabase = async (
  input: MigrationReadinessInput
): Promise<MigrationReadinessReport> => withMigrationClient(
  input,
  async (client) => {
    const db = createKrnDatabase(client);
    await applyMigrations(db, {
      migrationsFolder: input.migrationsFolder
    });

    const report = await inspectMigrationState(client, input.migrationsFolder);
    return withSourceAuthorityIntegrity(input, report);
  }
);
