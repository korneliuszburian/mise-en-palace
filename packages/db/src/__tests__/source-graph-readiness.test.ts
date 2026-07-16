import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

import postgres from "postgres";
import { describe, expect, it } from "vitest";

import { migrateDatabase } from "../migration-readiness.js";
import { inspectSourceGraphReadiness } from "../source-graph-readiness.js";

const databaseUrl = process.env.KRN_DATABASE_URL?.trim();
const migrationsFolder = fileURLToPath(new URL("../migrations", import.meta.url));

const databaseUrlFor = (input: string, databaseName: string): string => {
  const parsed = new URL(input);
  parsed.pathname = `/${databaseName}`;
  return parsed.toString();
};

const createDisposableDatabase = async (input: string): Promise<{
  readonly databaseUrl: string;
  readonly cleanup: () => Promise<void>;
}> => {
  const databaseName = `krn_source_graph_readiness_${crypto.randomUUID().replaceAll("-", "")}`;
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

const sourceGraphRowCounts = async (input: string): Promise<Record<string, number>> => {
  const client = postgres(input, { max: 1, onnotice: () => undefined });

  try {
    const [counts] = await client<Record<string, number>[]>`
      select
        (select count(*)::int from workspaces) as workspaces,
        (select count(*)::int from projects) as projects,
        (select count(*)::int from source_artifacts) as artifacts,
        (select count(*)::int from source_chunks) as chunks,
        (select count(*)::int from source_claims) as claims,
        (select count(*)::int from source_claim_edges) as "claimEdges",
        (select count(*)::int from source_decisions) as decisions,
        (select count(*)::int from source_decision_edges) as "decisionEdges",
        (select count(*)::int from source_rejections) as rejections,
        (select count(*)::int from source_snapshots) as snapshots
    `;

    if (counts === undefined) {
      throw new Error("source graph row count query returned no row");
    }

    return counts;
  } finally {
    await client.end();
  }
};

describe.skipIf(databaseUrl === undefined)("source graph readiness", () => {
  it("proves the captured-current graph contract without persisting probe rows", async () => {
    const disposable = await createDisposableDatabase(databaseUrl!);

    try {
      await migrateDatabase({
        databaseUrl: disposable.databaseUrl,
        migrationsFolder
      });
      const before = await sourceGraphRowCounts(disposable.databaseUrl);

      const report = await inspectSourceGraphReadiness({
        databaseUrl: disposable.databaseUrl
      });

      expect(report.sourceRepositoryError).toBeUndefined();
      expect(report.sourceGraphProbeReady).toBe(true);
      expect(report.runtimeProofReady).toBe(true);
      expect(await sourceGraphRowCounts(disposable.databaseUrl)).toEqual(before);
    } finally {
      await disposable.cleanup();
    }
  }, 30_000);
});
