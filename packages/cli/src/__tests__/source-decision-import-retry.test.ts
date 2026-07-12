import { execFile } from "node:child_process";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import {
  migrateDatabase
} from "@krn/db/dev";
import postgres from "postgres";
import { describe, expect, it } from "vitest";

const databaseUrl = process.env.KRN_DATABASE_URL?.trim();
const execFileAsync = promisify(execFile);
const repoRoot = fileURLToPath(new URL("../../../../", import.meta.url));
const migrationsFolder = path.join(repoRoot, "packages", "db", "src", "migrations");
const fixturePath = path.join(
  repoRoot,
  "tests",
  "fixtures",
  "decision-corpus-ingest",
  "source-import-retry.json"
);

interface ImportGraphCounts {
  readonly artifactCount: number;
  readonly projectCount: number;
  readonly chunkCount: number;
  readonly claimCount: number;
  readonly decisionCount: number;
  readonly decisionEdgeCount: number;
  readonly searchDocumentCount: number;
  readonly rejectionCount: number;
}

const databaseUrlFor = (input: string, databaseName: string): string => {
  const parsed = new URL(input);
  parsed.pathname = `/${databaseName}`;
  return parsed.toString();
};

const createDisposableDatabase = async (input: string): Promise<{
  readonly databaseUrl: string;
  readonly cleanup: () => Promise<void>;
}> => {
  const databaseName = `krn_source_import_retry_${crypto.randomUUID().replaceAll("-", "")}`;
  const adminClient = postgres(databaseUrlFor(input, "postgres"), {
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
    databaseUrl: databaseUrlFor(input, databaseName),
    cleanup: async () => {
      try {
        await adminClient.unsafe(`drop database if exists ${databaseName} with (force)`);
      } finally {
        await adminClient.end();
      }
    }
  };
};

const runSourceImportCli = async (input: string) =>
  execFileAsync("pnpm", [
    "--filter",
    "@krn/cli",
    "krn",
    "source",
    "decision",
    "import",
    "--file",
    fixturePath,
    "--persist",
    "--json"
  ], {
    cwd: repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      KRN_DATABASE_URL: input
    }
  });

const duplicateImportGraphCounts = async (
  client: ReturnType<typeof postgres>
): Promise<ImportGraphCounts> => {
  const rows = await client<ImportGraphCounts[]>`
    with imported_artifacts as (
      select id, project_id
      from source_artifacts
      where import_row_id = 'source-import-retry-fixture'
    )
    select
      (select count(*)::int from imported_artifacts) as "artifactCount",
      (select count(distinct project_id)::int from imported_artifacts) as "projectCount",
      (
        select count(*)::int
        from source_chunks
        join imported_artifacts
          on imported_artifacts.id = source_chunks.source_artifact_id
      ) as "chunkCount",
      (
        select count(*)::int
        from source_claims
        join imported_artifacts
          on imported_artifacts.id = source_claims.source_artifact_id
      ) as "claimCount",
      (
        select count(*)::int
        from source_decisions
        join source_claims
          on source_claims.id = source_decisions.source_claim_id
        join imported_artifacts
          on imported_artifacts.id = source_claims.source_artifact_id
      ) as "decisionCount",
      (
        select count(*)::int
        from source_decision_edges
        join source_claims
          on source_claims.id = source_decision_edges.source_claim_id
        join imported_artifacts
          on imported_artifacts.id = source_claims.source_artifact_id
      ) as "decisionEdgeCount",
      (
        select count(*)::int
        from search_documents
        join source_claims
          on source_claims.id = search_documents.source_claim_id
        join imported_artifacts
          on imported_artifacts.id = source_claims.source_artifact_id
      ) as "searchDocumentCount",
      (
        select count(*)::int
        from source_rejections
        join source_claims
          on source_claims.id = source_rejections.source_claim_id
        join imported_artifacts
          on imported_artifacts.id = source_claims.source_artifact_id
      ) as "rejectionCount"
  `;
  const counts = rows[0];

  if (counts === undefined) {
    throw new Error("missing duplicate import graph counts");
  }

  return counts;
};

describe("source decision import retry boundary", () => {
  it.skipIf(databaseUrl === undefined || databaseUrl.length === 0)(
    "shows a lost-response retry creates two semantic graphs through independent CLI processes",
    async () => {
      const disposableDatabase = await createDisposableDatabase(databaseUrl!);
      const client = postgres(disposableDatabase.databaseUrl, { max: 1, onnotice: () => undefined });

      try {
        await migrateDatabase({
          databaseUrl: disposableDatabase.databaseUrl,
          migrationsFolder
        });
        const first = await runSourceImportCli(disposableDatabase.databaseUrl);
        const second = await runSourceImportCli(disposableDatabase.databaseUrl);
        const importRows = await client<{ importId: string }[]>`
          select import_id as "importId"
          from source_artifacts
          where import_row_id = 'source-import-retry-fixture'
          order by import_id
        `;

        expect(first.stdout).toContain('"persistence": "enabled"');
        expect(second.stdout).toContain('"persistence": "enabled"');
        expect(importRows.map((row) => row.importId)).toHaveLength(2);
        expect(new Set(importRows.map((row) => row.importId)).size).toBe(2);
        expect(await duplicateImportGraphCounts(client)).toEqual({
          artifactCount: 2,
          projectCount: 1,
          chunkCount: 2,
          claimCount: 2,
          decisionCount: 2,
          decisionEdgeCount: 0,
          searchDocumentCount: 2,
          rejectionCount: 0
        });
      } finally {
        await client.end();
        await disposableDatabase.cleanup();
      }
    },
    60_000
  );
});
