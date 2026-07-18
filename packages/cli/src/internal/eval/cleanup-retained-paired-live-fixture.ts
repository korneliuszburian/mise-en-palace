import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  createSmokeRuntime
} from "@krn/db/dev";

type RetainedFixtureReport = {
  readonly smokeId: string;
  readonly workspaceSlug: string;
  readonly projectId: string;
  readonly runId: string;
  readonly retainedFixture: true;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim().length > 0 ? value : undefined;

const isUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value);

export const parseRetainedFixtureReport = (value: unknown): RetainedFixtureReport => {
  if (!isRecord(value)) throw new Error("Retained fixture report must be an object");
  const report = isRecord(value["report"]) ? value["report"] : undefined;
  const smokeId = readString(value["smokeId"]);
  const workspaceSlug = readString(report?.["workspaceSlug"]);
  const projectId = readString(report?.["projectId"]);
  const runId = readString(report?.["executionRunId"]);
  if (
    smokeId === undefined ||
    !/^retained-memory-treatment-[a-z0-9-]+$/u.test(smokeId) ||
    workspaceSlug === undefined ||
    workspaceSlug !== `krn-decision-packet-smoke-${smokeId}` ||
    projectId === undefined ||
    !isUuid(projectId) ||
    runId === undefined ||
    !isUuid(runId) ||
    report?.["retainedFixture"] !== true
  ) {
    throw new Error("Retained fixture report identity is missing or ambiguous");
  }
  return { smokeId, workspaceSlug, projectId, runId, retainedFixture: true };
};

const countRows = async (query: Promise<unknown>): Promise<number> => {
  const rows = await query;
  if (!Array.isArray(rows)) return 0;
  const first = rows[0];
  return isRecord(first) && typeof first["count"] === "number"
    ? first["count"]
    : 0;
};

export const cleanupRetainedFixture = async (input: {
  readonly databaseUrl: string;
  readonly migrationsFolder: string;
  readonly report: RetainedFixtureReport;
}): Promise<{
  readonly smokeId: string;
  readonly projectId: string;
  readonly runId: string;
  readonly remainingRows: number;
}> => {
  const runtime = await createSmokeRuntime({
    databaseUrl: input.databaseUrl,
    migrationsFolder: input.migrationsFolder,
    smokeId: input.report.smokeId,
    smokeName: "retained paired fixture cleanup",
    workspacePrefix: "krn-decision-packet-smoke",
    projectSlug: "decision-packet-return-loop"
  });
  const { client } = runtime;
  try {
    await client`
      delete from retrieval_runs
      where metadata->>'smokeId' = ${input.report.smokeId}
    `;
    await client`
      delete from context_assemblies
      where metadata->>'smokeId' = ${input.report.smokeId}
    `;
    await client`
      delete from maintenance_queue_records
      where payload->>'smokeId' = ${input.report.smokeId}
    `;
    await client`
      delete from outbox_events
      where payload->>'smokeId' = ${input.report.smokeId}
    `;
    await client`
      delete from workspaces
      where id = (
        select id from workspaces where slug = ${input.report.workspaceSlug}
      )
    `;

    const remainingRows =
      await countRows(client`
        select count(*)::int as count from workspaces where slug = ${input.report.workspaceSlug}
      `) +
      await countRows(client`
        select count(*)::int as count from projects where id = ${input.report.projectId}::uuid
      `) +
      await countRows(client`
        select count(*)::int as count from execution_runs where id = ${input.report.runId}::uuid
      `) +
      await countRows(client`
        select count(*)::int as count from retrieval_runs where metadata->>'smokeId' = ${input.report.smokeId}
      `) +
      await countRows(client`
        select count(*)::int as count from context_assemblies where metadata->>'smokeId' = ${input.report.smokeId}
      `) +
      await countRows(client`
        select count(*)::int as count from maintenance_queue_records where payload->>'smokeId' = ${input.report.smokeId}
      `) +
      await countRows(client`
        select count(*)::int as count from outbox_events where payload->>'smokeId' = ${input.report.smokeId}
      `);

    return {
      smokeId: input.report.smokeId,
      projectId: input.report.projectId,
      runId: input.report.runId,
      remainingRows
    };
  } finally {
    await client.end();
  }
};

export const main = async (): Promise<void> => {
  const reportArguments = process.argv.slice(2);
  const reportPath = reportArguments[0] === "--"
    ? reportArguments[1]
    : reportArguments[0];
  if (reportPath === undefined) {
    throw new Error("Usage: cleanup-retained-paired-live-fixture <fixture-report.json>");
  }

  const repoRoot = path.basename(process.cwd()) === "cli" &&
      path.basename(path.dirname(process.cwd())) === "packages"
    ? path.resolve(process.cwd(), "../..")
    : path.resolve(process.cwd());
  const report = parseRetainedFixtureReport(
    JSON.parse(await readFile(path.resolve(repoRoot, reportPath), "utf8"))
  );
  const result = await cleanupRetainedFixture({
    databaseUrl: process.env.KRN_DATABASE_URL ?? "postgres://krn:krn@localhost:54329/krn",
    migrationsFolder: path.join(repoRoot, "packages/db/src/migrations"),
    report
  });
  if (result.remainingRows !== 0) {
    throw new Error(`Retained fixture cleanup left ${result.remainingRows} owned rows`);
  }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
};

if (process.argv[1] !== undefined && pathToFileURL(process.argv[1]).href === import.meta.url) {
  await main();
}
