import postgres from "postgres";
import { describe, expect, it } from "vitest";

import {
  dbBootstrapDoesNotProve,
  missingDbConfigRecovery,
  unreachablePostgresRecovery
} from "../db-recovery-guidance.js";
import {
  redactedPostgresEndpoint,
  runDbReadinessCommand
} from "../run-db-readiness-command.js";
import {
  runDbMigrateCommand
} from "../run-db-migrate-command.js";

const databaseUrl = process.env.KRN_DATABASE_URL?.trim();

interface MigrationSnapshot {
  readonly migrationTablePresent: boolean;
  readonly migrationIdentities: readonly string[];
}

const readOnlyDatabaseUrl = (databaseUrl: string): string => {
  const parsed = new URL(databaseUrl);
  parsed.searchParams.set("options", "-c default_transaction_read_only=on");
  return parsed.toString();
};

const migrationSnapshot = async (databaseUrl: string): Promise<MigrationSnapshot> => {
  const client = postgres(databaseUrl, { max: 1, onnotice: () => undefined });

  try {
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

    return {
      migrationTablePresent,
      migrationIdentities: migrationRows.map(({ hash, createdAt }) => `${hash}@${createdAt}`)
    };
  } finally {
    await client.end();
  }
};

const transactionReadOnly = async (databaseUrl: string): Promise<string | undefined> => {
  const client = postgres(databaseUrl, { max: 1, onnotice: () => undefined });

  try {
    const rows = await client<{ transactionReadOnly: string }[]>`
      select current_setting('transaction_read_only') as "transactionReadOnly"
    `;
    return rows[0]?.transactionReadOnly;
  } finally {
    await client.end();
  }
};

describe("DB readiness command", () => {
  it("redacts credentials and non-endpoint URL parts from Postgres endpoint output", () => {
    expect(
      redactedPostgresEndpoint(
        "postgres://krn:secret@localhost:54329/krn?sslmode=disable#token"
      )
    ).toBe("postgres://localhost:54329/krn");
  });

  it("does not echo an invalid KRN_DATABASE_URL value", () => {
    expect(redactedPostgresEndpoint("not a database url")).toBe(
      "unparseable KRN_DATABASE_URL"
    );
  });

  it("requires explicit database configuration before migration", async () => {
    const result = await runDbMigrateCommand({
      env: { KRN_DB_BACKEND: "postgres" },
      cwd: process.cwd()
    });

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain("KRN DB Migrate");
    expect(result.stdout).toContain("Postgres config: missing KRN_DATABASE_URL");
    expect(result.stdout).toContain("applying migrations does not prove source authority integrity");
  });

  it("renders actionable recovery commands for local DB bootstrap states", () => {
    expect(missingDbConfigRecovery()).toBe(
      "export KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn; docker compose up -d krn-postgres; pnpm db:migrate; pnpm db:ready"
    );
    expect(unreachablePostgresRecovery()).toBe(
      "docker compose up -d krn-postgres; docker compose ps krn-postgres; pnpm db:migrate; pnpm db:ready"
    );
    expect(dbBootstrapDoesNotProve).toBe(
      "starting Postgres does not prove migrations, pgvector, or persistence until pnpm db:migrate, pnpm db:ready, and pnpm db:smoke pass"
    );
  });

  it.skipIf(databaseUrl === undefined || databaseUrl.length === 0)(
    "reads readiness through a read-only PostgreSQL connection without changing migration state",
    async () => {
      const readOnlyUrl = readOnlyDatabaseUrl(databaseUrl!);
      const before = await migrationSnapshot(readOnlyUrl);

      expect(await transactionReadOnly(readOnlyUrl)).toBe("on");

      const result = await runDbReadinessCommand({
        env: { KRN_DB_BACKEND: "postgres", KRN_DATABASE_URL: readOnlyUrl },
        cwd: process.cwd()
      });
      const after = await migrationSnapshot(readOnlyUrl);

      expect(result.stdout).toContain("Postgres: reachable");
      expect(result.stdout).not.toContain("Postgres/migrations: failed");
      expect(after).toEqual(before);
    }
  );
});
