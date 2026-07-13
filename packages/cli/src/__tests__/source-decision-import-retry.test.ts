import { execFile } from "node:child_process";
import crypto from "node:crypto";
import {
  mkdtemp,
  readFile,
  rm,
  writeFile
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import {
  migrateDatabase
} from "@krn/db/dev";
import postgres from "postgres";
import { describe, expect, it } from "vitest";

import {
  createDatabaseRuntime,
  defaultProjectSlug,
  defaultWorkspaceSlug
} from "../database-runtime.js";

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

const runSourceImportCli = async (input: {
  readonly databaseUrl?: string;
  readonly filePath?: string;
  readonly persist: boolean;
}) =>
  execFileAsync("pnpm", [
    "--silent",
    "--filter",
    "@krn/cli",
    "krn",
    "source",
    "decision",
    "import",
    "--file",
    input.filePath ?? fixturePath,
    ...(input.persist ? ["--persist"] : []),
    "--json"
  ], {
    cwd: repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      ...(input.databaseUrl === undefined ? {} : { KRN_DATABASE_URL: input.databaseUrl })
    }
  });

interface SourceDecisionImportOutput {
  readonly persistence: "enabled" | "disabled";
  readonly importId: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const sourceDecisionImportOutput = (stdout: string): SourceDecisionImportOutput => {
  const parsed: unknown = JSON.parse(stdout);

  if (
    !isRecord(parsed) ||
    typeof parsed["persistence"] !== "string" ||
    (parsed["persistence"] !== "enabled" && parsed["persistence"] !== "disabled") ||
    typeof parsed["importId"] !== "string"
  ) {
    throw new Error("source decision import CLI did not emit a typed import identity");
  }

  return {
    persistence: parsed["persistence"],
    importId: parsed["importId"]
  };
};

const writeReorderedTaskScopesFixture = async (filePath: string): Promise<void> => {
  const fixture = await readFile(fixturePath, "utf8");
  const reordered = fixture.replace(
    '"taskScopes": ["source-import-retry", "source-authority"]',
    '"taskScopes": ["source-authority", "source-import-retry"]'
  );

  if (reordered === fixture) {
    throw new Error("source import retry fixture is missing reorderable task scopes");
  }

  await writeFile(filePath, reordered, "utf8");
};

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
    "keeps byte-identical and canonical-equivalent retries in one graph across independent CLI processes",
    async () => {
      const disposableDatabase = await createDisposableDatabase(databaseUrl!);
      const client = postgres(disposableDatabase.databaseUrl, { max: 1, onnotice: () => undefined });
      const temporaryDirectory = await mkdtemp(path.join(tmpdir(), "krn-source-import-retry-"));
      const reorderedFixturePath = path.join(temporaryDirectory, "reordered-task-scopes.json");

      try {
        await writeReorderedTaskScopesFixture(reorderedFixturePath);
        await migrateDatabase({
          databaseUrl: disposableDatabase.databaseUrl,
          migrationsFolder
        });
        const setupRuntime = await createDatabaseRuntime({
          databaseUrl: disposableDatabase.databaseUrl,
          workspaceSlug: defaultWorkspaceSlug,
          projectSlug: defaultProjectSlug,
          requireProjectKernelForExplicitProject: false,
          now: () => "2026-07-13T00:00:00.000Z",
          createId: (prefix) => `${prefix}-${crypto.randomUUID()}`
        });
        await setupRuntime.close();
        const preview = await runSourceImportCli({ persist: false });
        const [first, second] = await Promise.all([
          runSourceImportCli({
            databaseUrl: disposableDatabase.databaseUrl,
            persist: true
          }),
          runSourceImportCli({
            databaseUrl: disposableDatabase.databaseUrl,
            persist: true
          })
        ]);
        const previewResult = sourceDecisionImportOutput(preview.stdout);
        const firstResult = sourceDecisionImportOutput(first.stdout);
        const secondResult = sourceDecisionImportOutput(second.stdout);
        const reordered = await runSourceImportCli({
          databaseUrl: disposableDatabase.databaseUrl,
          filePath: reorderedFixturePath,
          persist: true
        });
        const reorderedResult = sourceDecisionImportOutput(reordered.stdout);
        const importRows = await client<{ importId: string }[]>`
          select import_id as "importId"
          from source_artifacts
          where import_row_id = 'source-import-retry-fixture'
          order by import_id
        `;

        expect(previewResult.persistence).toBe("disabled");
        expect(firstResult.persistence).toBe("enabled");
        expect(secondResult.persistence).toBe("enabled");
        expect(reorderedResult.persistence).toBe("enabled");
        expect(firstResult.importId).toBe(previewResult.importId);
        expect(secondResult.importId).toBe(firstResult.importId);
        expect(reorderedResult.importId).toBe(firstResult.importId);
        expect(importRows.map((row) => row.importId)).toEqual([firstResult.importId]);
        expect(await duplicateImportGraphCounts(client)).toEqual({
          artifactCount: 1,
          projectCount: 1,
          chunkCount: 1,
          claimCount: 1,
          decisionCount: 1,
          decisionEdgeCount: 0,
          searchDocumentCount: 1,
          rejectionCount: 0
        });
      } finally {
        await client.end();
        await disposableDatabase.cleanup();
        await rm(temporaryDirectory, { recursive: true, force: true });
      }
    },
    60_000
  );
});
