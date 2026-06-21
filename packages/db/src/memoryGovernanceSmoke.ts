import postgres from "postgres";
import { eq, sql } from "drizzle-orm";
import {
  compileHarnessPlan
} from "@krn/harness";

import { createKrnDatabase } from "./database.js";
import { runMigrationReadinessCheck } from "./migrationReadiness.js";
import {
  DrizzleHarnessRunRepository,
  DrizzleMemoryRepository,
  DrizzleProjectRepository,
  DrizzleRetrievalRepository,
  DrizzleSourceRepository
} from "./repositories/index.js";
import {
  antiMemoryRecords,
  memoryApplications,
  memoryCandidates,
  memoryRecords,
  memoryRecordVersions,
  outboxEvents,
  retrievalRuns,
  runEvents,
  sourceArtifacts,
  sourceClaims,
  workspaces
} from "./schema/index.js";

export interface MemoryGovernanceSmokeInput {
  databaseUrl: string;
  migrationsFolder: string;
  smokeId: string;
}

export interface MemoryGovernanceSmokeReport {
  workspaceSlug: string;
  projectSlug: string;
  executionRunId: string;
  sourceClaimId: string;
  memoryCandidateId: string;
  readBackMemoryCandidateId: string;
  reviewedMemoryCandidateStatus: string;
  memoryRecordId: string;
  readBackMemoryRecordId: string;
  memoryRecordVersionId: string;
  memoryApplicationId: string;
  antiMemoryRecordId: string;
  runAntiMemoryCount: number;
  projectMemoryRecordCount: number;
  outboxEventCount: number;
  remainingMarkerCount: number;
  cleanedUp: boolean;
}

const normalizeSlugPart = (value: string): string => {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return normalized.length === 0 ? "local" : normalized;
};

const countRows = async (
  db: ReturnType<typeof createKrnDatabase>,
  workspaceSlug: string,
  marker: string,
  retrievalRunId: string | undefined
): Promise<number> => {
  const workspaceRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(workspaces)
    .where(eq(workspaces.slug, workspaceSlug));
  const sourceArtifactRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(sourceArtifacts)
    .where(sql`${sourceArtifacts.metadata}->>'smokeId' = ${marker}`);
  const sourceClaimRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(sourceClaims)
    .where(sql`${sourceClaims.metadata}->>'smokeId' = ${marker}`);
  const memoryCandidateRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(memoryCandidates)
    .where(sql`${memoryCandidates.metadata}->>'smokeId' = ${marker}`);
  const memoryRecordRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(memoryRecords)
    .where(sql`${memoryRecords.metadata}->>'smokeId' = ${marker}`);
  const memoryRecordVersionRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(memoryRecordVersions)
    .where(sql`${memoryRecordVersions.metadata}->>'smokeId' = ${marker}`);
  const memoryApplicationRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(memoryApplications)
    .where(sql`${memoryApplications.metadata}->>'smokeId' = ${marker}`);
  const antiMemoryRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(antiMemoryRecords)
    .where(sql`${antiMemoryRecords.metadata}->>'smokeId' = ${marker}`);
  const eventRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(runEvents)
    .where(sql`${runEvents.payload}->>'smokeId' = ${marker}`);
  const outboxRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(outboxEvents)
    .where(sql`${outboxEvents.payload}->>'smokeId' = ${marker}`);
  const retrievalRows =
    retrievalRunId === undefined
      ? [{ count: 0 }]
      : await db
          .select({ count: sql<number>`count(*)::int` })
          .from(retrievalRuns)
          .where(eq(retrievalRuns.id, retrievalRunId));

  return (
    (workspaceRows[0]?.count ?? 0) +
    (sourceArtifactRows[0]?.count ?? 0) +
    (sourceClaimRows[0]?.count ?? 0) +
    (memoryCandidateRows[0]?.count ?? 0) +
    (memoryRecordRows[0]?.count ?? 0) +
    (memoryRecordVersionRows[0]?.count ?? 0) +
    (memoryApplicationRows[0]?.count ?? 0) +
    (antiMemoryRows[0]?.count ?? 0) +
    (eventRows[0]?.count ?? 0) +
    (outboxRows[0]?.count ?? 0) +
    (retrievalRows[0]?.count ?? 0)
  );
};

export const runMemoryGovernanceSmokeCheck = async (
  input: MemoryGovernanceSmokeInput
): Promise<MemoryGovernanceSmokeReport> => {
  const readiness = await runMigrationReadinessCheck({
    databaseUrl: input.databaseUrl,
    migrationsFolder: input.migrationsFolder
  });

  if (!readiness.migrationsVerified || !readiness.pgvectorAvailable) {
    throw new Error("Brain store is not ready for memory governance smoke");
  }

  const marker = normalizeSlugPart(input.smokeId);
  const workspaceSlug = `krn-memory-governance-smoke-${marker}`;
  const projectSlug = "memory-governance";
  const task = `memory governance smoke ${marker}`;
  const client = postgres(input.databaseUrl, {
    max: 1,
    onnotice: () => undefined
  });
  const db = createKrnDatabase(client);
  let retrievalRunId: string | undefined;

  const cleanup = async (): Promise<number> => {
    await db.delete(outboxEvents).where(sql`${outboxEvents.payload}->>'smokeId' = ${marker}`);
    await db
      .delete(memoryApplications)
      .where(sql`${memoryApplications.metadata}->>'smokeId' = ${marker}`);
    await db
      .delete(memoryRecordVersions)
      .where(sql`${memoryRecordVersions.metadata}->>'smokeId' = ${marker}`);
    await db
      .delete(antiMemoryRecords)
      .where(sql`${antiMemoryRecords.metadata}->>'smokeId' = ${marker}`);
    await db.delete(memoryRecords).where(sql`${memoryRecords.metadata}->>'smokeId' = ${marker}`);
    await db
      .delete(memoryCandidates)
      .where(sql`${memoryCandidates.metadata}->>'smokeId' = ${marker}`);
    await db.delete(sourceClaims).where(sql`${sourceClaims.metadata}->>'smokeId' = ${marker}`);
    await db
      .delete(sourceArtifacts)
      .where(sql`${sourceArtifacts.metadata}->>'smokeId' = ${marker}`);
    await db.delete(runEvents).where(sql`${runEvents.payload}->>'smokeId' = ${marker}`);

    if (retrievalRunId !== undefined) {
      await db.delete(retrievalRuns).where(eq(retrievalRuns.id, retrievalRunId));
    }

    await db.delete(workspaces).where(eq(workspaces.slug, workspaceSlug));

    return countRows(db, workspaceSlug, marker, retrievalRunId);
  };

  try {
    await cleanup();

    const projectRepository = new DrizzleProjectRepository(db);
    const harnessRunRepository = new DrizzleHarnessRunRepository(db);
    const memoryRepository = new DrizzleMemoryRepository(db);
    const sourceRepository = new DrizzleSourceRepository(db);
    const workspace = await projectRepository.createWorkspace({
      slug: workspaceSlug,
      displayName: workspaceSlug,
      metadata: {
        smoke: true,
        smokeId: marker
      }
    });
    const project = await projectRepository.createProject({
      workspaceId: workspace.id,
      slug: projectSlug,
      displayName: projectSlug,
      metadata: {
        smoke: true,
        smokeId: marker
      }
    });
    let idCounter = 0;
    const result = await compileHarnessPlan(
      {
        workspaceId: workspace.id,
        projectId: project.id,
        operatorIntent: {
          rawIntent: task,
          source: "cli",
          metadata: {
            smokeId: marker
          }
        },
        taskContract: {
          title: task,
          objective: task,
          constraints: ["persist reviewed memory candidates and anti-memory"],
          nonGoals: ["do not mutate runtime markdown memory"],
          acceptance: ["read back memory records and clean smoke rows"],
          metadata: {
            smokeId: marker
          }
        },
        tokenBudget: 1200,
        metadata: {
          command: "db:smoke:memory-governance",
          smokeId: marker
        }
      },
      {
        harnessRunRepository,
        memoryRepository,
        sourceRepository,
        retrievalRepository: new DrizzleRetrievalRepository(db),
        now: () => new Date().toISOString(),
        createId: (prefix) => {
          idCounter += 1;
          return `${prefix}-${marker}-${idCounter}`;
        }
      }
    );
    const maybeRetrievalRunId = result.contextAssembly.metadata.retrievalRunId;
    retrievalRunId = typeof maybeRetrievalRunId === "string" ? maybeRetrievalRunId : undefined;
    const executionRun = await harnessRunRepository.createExecutionRun({
      harnessPlanId: result.harnessPlan.id,
      adapter: "codex",
      status: "planned",
      initialEvent: {
        sequence: 1,
        type: "smoke.memory_governance.plan_persisted",
        message: "Memory governance smoke plan created",
        payload: {
          smokeId: marker
        }
      },
      metadata: {
        smokeId: marker
      }
    });
    const sourceArtifact = await sourceRepository.createSourceArtifact({
      projectId: project.id,
      kind: "operator_input",
      trustTier: "project-decision",
      uri: `operator://memory-governance-smoke/${marker}`,
      title: "Memory governance smoke source",
      contentHash: `memory-governance-smoke-${marker}`,
      metadata: {
        smokeId: marker
      }
    });
    const sourceClaim = await sourceRepository.createSourceClaim({
      sourceArtifactId: sourceArtifact.id,
      executionRunId: executionRun.id,
      claim: "KRN Memory Core must promote candidates through reviewed records.",
      mechanism: "Postgres stores candidates, records, versions, applications, and anti-memory.",
      krnImplication: "KRN can audit how memory becomes active context.",
      doesNotProve: "This does not prove activation ranking quality.",
      trustTier: "project-decision",
      supportType: "implementation-boundary",
      consumer: "M23 memory governance smoke",
      falsifier: "Memory governance smoke readback or cleanup fails.",
      revisitWhen: "Memory governance repository contract changes.",
      status: "proposed",
      metadata: {
        smokeId: marker
      }
    });
    const readBackSourceClaim = await sourceRepository.getSourceClaimById(sourceClaim.id);
    const memoryCandidate = await memoryRepository.createMemoryCandidate({
      projectId: project.id,
      executionRunId: executionRun.id,
      proposedBy: "memory-governance-smoke",
      kind: "constraint",
      status: "proposed",
      summary: "Promote memory through reviewed candidates",
      body: "Memory records must originate from explicit candidate review.",
      owner: "kernel",
      confidence: 95,
      applicationGuidance: "Use before accepting new runtime memory.",
      invalidationRule: "Revisit if memory promotion becomes automatic.",
      sourceClaimIds: [sourceClaim.id],
      sourceLineage: [{ sourceId: sourceClaim.id }],
      isUserPreference: false,
      metadata: {
        smokeId: marker
      }
    });
    const readBackCandidate = await memoryRepository.getMemoryCandidateById(memoryCandidate.id);
    const memoryRecord = await memoryRepository.promoteMemoryCandidate({
      candidateId: memoryCandidate.id,
      reviewer: "memory-governance-smoke",
      decision: "accepted",
      recordKey: `memory-governance-smoke:${marker}`,
      metadata: {
        smokeId: marker
      }
    });
    const reviewedCandidate = await memoryRepository.getMemoryCandidateById(memoryCandidate.id);
    const memoryApplication = await memoryRepository.recordMemoryApplication({
      memoryRecordId: memoryRecord.id,
      executionRunId: executionRun.id,
      expectedUse: "Guide memory governance smoke.",
      outcome: "helped",
      notes: "Verified explicit promotion and application feedback.",
      metadata: {
        smokeId: marker
      }
    });
    const readBackMemoryRecord = await memoryRepository.getMemoryRecordById(memoryRecord.id);
    const projectMemoryRecords = await memoryRepository.listMemoryRecordsForProject(project.id);
    const antiMemoryRecord = await memoryRepository.createAntiMemoryRecord({
      projectId: project.id,
      executionRunId: executionRun.id,
      key: `anti-memory-governance-smoke:${marker}`,
      rejectedClaim: "Markdown files are KRN runtime memory.",
      reason: "Runtime Memory Core is store-backed; markdown is audit/source/export material.",
      invalidatedBySourceClaimIds: [sourceClaim.id],
      invalidatedBySourceClaimId: sourceClaim.id,
      appliesTo: "memory governance",
      mayRevisitWhen: "Project memory no longer uses the brain store.",
      summary: "Markdown is not runtime memory",
      body: "Do not treat markdown files as Memory Core.",
      owner: "kernel",
      confidence: 99,
      sourceLineage: [{ sourceId: sourceClaim.id }],
      metadata: {
        smokeId: marker
      }
    });
    const runAntiMemory = await memoryRepository.listAntiMemoryForRun(executionRun.id);
    const versionRows = await db
      .select()
      .from(memoryRecordVersions)
      .where(eq(memoryRecordVersions.memoryRecordId, memoryRecord.id));
    const applicationRows = await db
      .select()
      .from(memoryApplications)
      .where(eq(memoryApplications.id, memoryApplication.id));
    const outboxRows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(outboxEvents)
      .where(sql`${outboxEvents.payload}->>'smokeId' = ${marker}`);

    if (
      readBackSourceClaim?.id !== sourceClaim.id ||
      readBackCandidate?.id !== memoryCandidate.id ||
      reviewedCandidate?.status !== "accepted" ||
      readBackMemoryRecord?.id !== memoryRecord.id ||
      readBackMemoryRecord.currentVersionId === undefined ||
      !projectMemoryRecords.some((record) => record.id === memoryRecord.id) ||
      versionRows.length !== 1 ||
      versionRows[0]?.createdFromCandidateId !== memoryCandidate.id ||
      applicationRows.length !== 1 ||
      applicationRows[0]?.memoryRecordId !== memoryRecord.id ||
      !runAntiMemory.some((record) => record.id === antiMemoryRecord.id) ||
      (outboxRows[0]?.count ?? 0) < 2
    ) {
      throw new Error("Memory governance smoke readback did not match persisted records");
    }

    const remainingMarkerCount = await cleanup();

    return {
      workspaceSlug,
      projectSlug,
      executionRunId: executionRun.id,
      sourceClaimId: sourceClaim.id,
      memoryCandidateId: memoryCandidate.id,
      readBackMemoryCandidateId: readBackCandidate.id,
      reviewedMemoryCandidateStatus: reviewedCandidate.status,
      memoryRecordId: memoryRecord.id,
      readBackMemoryRecordId: readBackMemoryRecord.id,
      memoryRecordVersionId: versionRows[0].id,
      memoryApplicationId: memoryApplication.id,
      antiMemoryRecordId: antiMemoryRecord.id,
      runAntiMemoryCount: runAntiMemory.length,
      projectMemoryRecordCount: projectMemoryRecords.length,
      outboxEventCount: outboxRows[0]?.count ?? 0,
      remainingMarkerCount,
      cleanedUp: remainingMarkerCount === 0
    };
  } finally {
    await client.end();
  }
};
