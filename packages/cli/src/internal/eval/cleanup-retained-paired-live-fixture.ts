import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  createSmokeRuntime
} from "@krn/db/dev";
import {
  DrizzleHarnessRunRepository
} from "@krn/db/adapters";
import type {
  ListPairedLiveEvalEvidenceInput,
  PairedLiveEvalEvidenceOutcome,
  PairedLiveEvalEvidenceRecord,
  PairedLiveEvalEvidenceUsefulnessOutcome
} from "@krn/core";
import {
  resolvePairedLiveRepoRoot
} from "./paired-live-repo-root.js";
import {
  parseTrackedTrialManifest,
  readTrackedTrialArtifact
} from "./tracked-paired-live-codex-repair.js";
import type {
  PairedTrialManifest,
  TrackedTrialArtifact
} from "./tracked-paired-live-codex-repair.js";

type RetainedFixtureReport = {
  readonly smokeId: string;
  readonly workspaceSlug: string;
  readonly projectId: string;
  readonly runId: string;
  readonly retainedFixture: true;
};

type CleanupCommandArguments =
  | {
      readonly mode: "disposable";
      readonly reportPath: string;
    }
  | {
      readonly mode: "require_persisted";
      readonly manifestPath: string;
      readonly attemptDirectory: string;
      readonly reportPath: string;
    };

export type RetainedFixturePersistenceIdentity = {
  readonly projectId: string;
  readonly runId: string;
  readonly candidateId: string;
  readonly scenario: string;
  readonly artifactStatus: TrackedTrialArtifact["status"];
  readonly outcome: PairedLiveEvalEvidenceOutcome;
  readonly usefulnessOutcome: PairedLiveEvalEvidenceUsefulnessOutcome;
  readonly packetEvidenceRef: string;
  readonly artifactRef: string;
  readonly manifestRef: string;
  readonly checkerEvidenceRef: string;
  readonly environmentEvidenceRef: string;
};

export type RetainedFixtureCleanupGuard =
  | {
      readonly mode: "disposable";
    }
  | {
      readonly mode: "require_persisted";
      readonly expected: RetainedFixturePersistenceIdentity;
    };

type RetainedFixturePersistenceManifestIdentityInput =
  Pick<PairedTrialManifest, "projectId" | "runId" | "scenario">;

type RetainedFixturePersistenceArtifactIdentityInput =
  Pick<TrackedTrialArtifact, "kind" | "artifactHash" | "manifestHash" | "runId" | "status" | "checkerRevision"> & {
    readonly packet: Pick<TrackedTrialArtifact["packet"], "checksum">;
    readonly execution: Pick<TrackedTrialArtifact["execution"], "environmentProfileHash">;
    readonly score?: {
      readonly outcome: PairedLiveEvalEvidenceOutcome;
    };
  };

export type RetainedFixtureCleanupGuardResult =
  | {
      readonly mode: "disposable";
      readonly persisted: false;
      readonly verifiedBeforeCleanup: false;
      readonly verifiedAfterCleanup: false;
    }
  | {
      readonly mode: "require_persisted";
      readonly persisted: true;
      readonly verifiedBeforeCleanup: true;
      readonly verifiedAfterCleanup?: true;
      readonly evidenceId: string;
      readonly candidateId: string;
      readonly artifactRef: string;
      readonly manifestRef: string;
      readonly checkerEvidenceRef: string;
      readonly environmentEvidenceRef: string;
    };

export interface PairedLiveEvalEvidenceReadRepository {
  listPairedLiveEvalEvidence(
    input: ListPairedLiveEvalEvidenceInput
  ): Promise<PairedLiveEvalEvidenceRecord[]>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim().length > 0 ? value : undefined;

const isUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value);

const sha256 = (value: string): string =>
  createHash("sha256").update(value).digest("hex");

const cleanupUsage = "Usage: cleanup-retained-paired-live-fixture (--disposable <fixture-report.json> | --require-persisted <manifest.json> <attempt-directory> <fixture-report.json>)";

export const parseCleanupRetainedFixtureCommandArguments = (
  args: readonly string[]
): CleanupCommandArguments => {
  const normalized = args[0] === "--" ? args.slice(1) : args;
  const [mode, first, second, third] = normalized;

  if (mode === "--disposable" && first !== undefined && second === undefined) {
    return { mode: "disposable", reportPath: first };
  }
  if (
    mode === "--require-persisted" &&
    first !== undefined &&
    second !== undefined &&
    third !== undefined &&
    normalized.length === 4
  ) {
    return {
      mode: "require_persisted",
      manifestPath: first,
      attemptDirectory: second,
      reportPath: third
    };
  }

  throw new Error(cleanupUsage);
};

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

const checkerEvidenceRef = (
  artifact: Pick<RetainedFixturePersistenceArtifactIdentityInput, "kind" | "checkerRevision">
): string =>
  artifact.checkerRevision === undefined
    ? artifact.kind === "krn.pairedLiveCodexRepairArtifact.v2"
      ? "checker:paired-live-codex-repair.v2"
      : "checker:paired-live-codex-repair.v1"
    : `checker:${artifact.checkerRevision}`;

const usefulnessOutcomeFor = (
  artifact: RetainedFixturePersistenceArtifactIdentityInput
): PairedLiveEvalEvidenceUsefulnessOutcome => {
  const value = artifact.score?.outcome;

  if (artifact.status !== "passed" || value === "invalid" || value === undefined) {
    return "unknown";
  }

  return value === "win" ? "helped" : value === "loss" ? "hurt" : "neutral";
};

export const retainedFixturePersistenceIdentityFor = (input: {
  readonly manifest: RetainedFixturePersistenceManifestIdentityInput;
  readonly artifact: RetainedFixturePersistenceArtifactIdentityInput;
  readonly manifestHash: string;
}): RetainedFixturePersistenceIdentity => {
  if (input.artifact.runId !== input.manifest.runId) {
    throw new Error("Persistence guard artifact runId does not match manifest");
  }
  if (input.artifact.manifestHash !== input.manifestHash) {
    throw new Error("Persistence guard artifact manifest hash does not match manifest");
  }
  if (input.artifact.packet.checksum === undefined) {
    throw new Error("Persistence guard requires a DecisionPacket checksum");
  }
  const environmentProfileHash = input.artifact.execution.environmentProfileHash ?? "unknown";

  return {
    projectId: input.manifest.projectId,
    runId: input.artifact.runId,
    candidateId: `paired-target-repair:${input.artifact.runId}`,
    scenario: input.manifest.scenario,
    artifactStatus: input.artifact.status,
    outcome: input.artifact.score?.outcome ?? "unknown",
    usefulnessOutcome: usefulnessOutcomeFor(input.artifact),
    packetEvidenceRef: `packet:${input.artifact.packet.checksum}`,
    artifactRef: `artifact:sha256:${input.artifact.artifactHash}`,
    manifestRef: `manifest:sha256:${input.artifact.manifestHash}`,
    checkerEvidenceRef: checkerEvidenceRef(input.artifact),
    environmentEvidenceRef: `environment:sha256:${environmentProfileHash}`
  };
};

const readPersistenceIdentityGuard = async (input: {
  readonly attemptDirectory: string;
  readonly manifestPath: string;
}): Promise<RetainedFixtureCleanupGuard> => {
  const manifestValue: unknown = JSON.parse(await readFile(input.manifestPath, "utf8"));
  const manifest = parseTrackedTrialManifest(manifestValue);
  const artifact = await readTrackedTrialArtifact(input.attemptDirectory);
  if (artifact === undefined) {
    throw new Error("Persistence guard requires a valid tracked paired-live artifact");
  }

  return {
    mode: "require_persisted",
    expected: retainedFixturePersistenceIdentityFor({
      manifest,
      artifact,
      manifestHash: sha256(JSON.stringify(manifest))
    })
  };
};

const guardMismatch = (
  matches: boolean,
  message: string
): string | undefined => matches ? undefined : message;

const persistedEvidenceMismatch = (
  expected: RetainedFixturePersistenceIdentity,
  observed: PairedLiveEvalEvidenceRecord
): string | undefined => [
  guardMismatch(observed.projectId === expected.projectId, "projectId"),
  guardMismatch(observed.runId === expected.runId, "runId"),
  guardMismatch(observed.candidateId === expected.candidateId, "candidateId"),
  guardMismatch(observed.scenario === expected.scenario, "scenario"),
  guardMismatch(observed.artifactStatus === expected.artifactStatus, "artifactStatus"),
  guardMismatch(observed.outcome === expected.outcome, "outcome"),
  guardMismatch(
    observed.usefulnessOutcome === expected.usefulnessOutcome,
    "usefulnessOutcome"
  ),
  guardMismatch(observed.packetEvidenceRef === expected.packetEvidenceRef, "packetEvidenceRef"),
  guardMismatch(observed.artifactRef === expected.artifactRef, "artifactRef"),
  guardMismatch(observed.manifestRef === expected.manifestRef, "manifestRef"),
  guardMismatch(observed.checkerEvidenceRef === expected.checkerEvidenceRef, "checkerEvidenceRef"),
  guardMismatch(
    observed.environmentEvidenceRef === expected.environmentEvidenceRef,
    "environmentEvidenceRef"
  )
].find((mismatch) => mismatch !== undefined);

const assertGuardMatchesReport = (
  expected: RetainedFixturePersistenceIdentity,
  report: RetainedFixtureReport
): void => {
  const mismatch = [
    guardMismatch(expected.projectId === report.projectId, "projectId"),
    guardMismatch(expected.runId === report.runId, "runId")
  ].find((item) => item !== undefined);

  if (mismatch !== undefined) {
    throw new Error(`Retained fixture cleanup guard does not match fixture report: ${mismatch}`);
  }
};

export const verifyRetainedFixturePersistenceGuard = async (input: {
  readonly guard: RetainedFixtureCleanupGuard;
  readonly report: RetainedFixtureReport;
  readonly repository: PairedLiveEvalEvidenceReadRepository;
}): Promise<RetainedFixtureCleanupGuardResult> => {
  if (input.guard.mode === "disposable") {
    return {
      mode: "disposable",
      persisted: false,
      verifiedBeforeCleanup: false,
      verifiedAfterCleanup: false
    };
  }

  const expected = input.guard.expected;
  assertGuardMatchesReport(expected, input.report);
  const records = await input.repository.listPairedLiveEvalEvidence({
    projectId: input.report.projectId,
    runId: input.report.runId,
    limit: 5
  });
  const evidence = records.find((record) =>
    record.candidateId === expected.candidateId
  );
  if (evidence === undefined) {
    throw new Error(
      `Retained fixture cleanup requires persisted paired-live eval evidence for ${expected.candidateId}`
    );
  }

  const mismatch = persistedEvidenceMismatch(expected, evidence);
  if (mismatch !== undefined) {
    throw new Error(`Persisted paired-live eval evidence mismatch before cleanup: ${mismatch}`);
  }

  return {
    mode: "require_persisted",
    persisted: true,
    verifiedBeforeCleanup: true,
    evidenceId: evidence.id,
    candidateId: evidence.candidateId,
    artifactRef: evidence.artifactRef,
    manifestRef: evidence.manifestRef,
    checkerEvidenceRef: evidence.checkerEvidenceRef,
    environmentEvidenceRef: evidence.environmentEvidenceRef
  };
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
  readonly guard: RetainedFixtureCleanupGuard;
  readonly migrationsFolder: string;
  readonly report: RetainedFixtureReport;
}): Promise<{
  readonly smokeId: string;
  readonly projectId: string;
  readonly runId: string;
  readonly guard: RetainedFixtureCleanupGuardResult;
  readonly remainingRows: number;
  readonly unrelatedProjectCountBefore: number;
  readonly unrelatedProjectCountAfter: number;
}> => {
  const runtime = await createSmokeRuntime({
    databaseUrl: input.databaseUrl,
    migrationsFolder: input.migrationsFolder,
    smokeId: input.report.smokeId,
    smokeName: "retained paired fixture cleanup",
    workspacePrefix: "krn-decision-packet-smoke",
    projectSlug: "decision-packet-return-loop"
  });
  const { client, db } = runtime;
  try {
    await verifyRetainedFixturePersistenceGuard({
      guard: input.guard,
      report: input.report,
      repository: new DrizzleHarnessRunRepository(db)
    });
    const unrelatedProjectCountBefore = await countRows(client`
      select count(*)::int as count from projects where id <> ${input.report.projectId}::uuid
    `);

    await client`
      delete from retrieval_runs
      where metadata->>'smokeId' = ${input.report.smokeId}
         or project_id = ${input.report.projectId}::uuid
         or execution_run_id = ${input.report.runId}::uuid
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
        select count(*)::int as count
        from retrieval_runs
        where metadata->>'smokeId' = ${input.report.smokeId}
           or project_id = ${input.report.projectId}::uuid
           or execution_run_id = ${input.report.runId}::uuid
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
    const unrelatedProjectCountAfter = await countRows(client`
      select count(*)::int as count from projects where id <> ${input.report.projectId}::uuid
    `);
    if (unrelatedProjectCountAfter !== unrelatedProjectCountBefore) {
      throw new Error(
        `Retained fixture cleanup changed unrelated project count ${unrelatedProjectCountBefore} -> ${unrelatedProjectCountAfter}`
      );
    }
    let guard: RetainedFixtureCleanupGuardResult;
    if (input.guard.mode === "disposable") {
      guard = {
        mode: "disposable",
        persisted: false,
        verifiedBeforeCleanup: false,
        verifiedAfterCleanup: false
      };
    } else {
      const guardAfterCleanup = await verifyRetainedFixturePersistenceGuard({
        guard: input.guard,
        report: input.report,
        repository: new DrizzleHarnessRunRepository(db)
      });
      if (guardAfterCleanup.mode !== "require_persisted") {
        throw new Error("Retained fixture cleanup expected persisted evidence guard after cleanup");
      }
      guard = {
        ...guardAfterCleanup,
        verifiedAfterCleanup: true as const
      };
    }

    return {
      smokeId: input.report.smokeId,
      projectId: input.report.projectId,
      runId: input.report.runId,
      guard,
      remainingRows,
      unrelatedProjectCountBefore,
      unrelatedProjectCountAfter
    };
  } finally {
    await client.end();
  }
};

export const main = async (): Promise<void> => {
  const repoRoot = resolvePairedLiveRepoRoot();
  const args = parseCleanupRetainedFixtureCommandArguments(process.argv.slice(2));
  const guard = args.mode === "disposable"
    ? { mode: "disposable" as const }
    : await readPersistenceIdentityGuard({
        manifestPath: path.resolve(repoRoot, args.manifestPath),
        attemptDirectory: path.resolve(repoRoot, args.attemptDirectory)
      });
  const reportValue: unknown = JSON.parse(await readFile(path.resolve(repoRoot, args.reportPath), "utf8"));
  const report = parseRetainedFixtureReport(reportValue);
  const result = await cleanupRetainedFixture({
    databaseUrl: process.env.KRN_DATABASE_URL ?? "postgres://krn:krn@localhost:54329/krn",
    guard,
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
