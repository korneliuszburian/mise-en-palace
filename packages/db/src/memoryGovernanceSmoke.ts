import { eq, sql } from "drizzle-orm";

import {
  assertSmokeReadbackChecks,
  cleanupMemoryGovernanceSmokeRows,
  countMemoryGovernanceSmokeMarkerRows,
  createCompiledSmokeExecution,
  createSmokeRuntime,
  requireSmokeReadbackValue
} from "./dbSmokeSupport.js";
import {
  memoryApplications,
  memoryRecordVersions,
  outboxEvents
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
  invalidatedMemoryRecordStatus: string;
  activeMemoryAfterInvalidationCount: number;
  memoryApplicationId: string;
  antiMemoryCandidateId: string;
  reviewedAntiMemoryCandidateStatus: string;
  antiMemoryRecordId: string;
  runAntiMemoryCount: number;
  projectMemoryRecordCount: number;
  outboxEventCount: number;
  remainingMarkerCount: number;
  cleanedUp: boolean;
}

export const runMemoryGovernanceSmokeCheck = async (
  input: MemoryGovernanceSmokeInput
): Promise<MemoryGovernanceSmokeReport> => {
  const runtime = await createSmokeRuntime({
    databaseUrl: input.databaseUrl,
    migrationsFolder: input.migrationsFolder,
    projectSlug: "memory-governance",
    smokeId: input.smokeId,
    smokeName: "memory governance smoke",
    workspacePrefix: "krn-memory-governance-smoke"
  });
  const { client, db, marker, projectSlug, workspaceSlug } = runtime;
  const task = `memory governance smoke ${marker}`;
  let retrievalRunId: string | undefined;

  const cleanup = async (): Promise<number> => {
    await cleanupMemoryGovernanceSmokeRows({
      db,
      marker,
      retrievalRunId,
      workspaceSlug
    });

    return countMemoryGovernanceSmokeMarkerRows({
      db,
      marker,
      retrievalRunId,
      workspaceSlug
    });
  };

  try {
    await cleanup();

    const {
      executionRun,
      memoryRepository,
      project,
      retrievalRunId: compiledRetrievalRunId,
      sourceRepository
    } = await createCompiledSmokeExecution({
      acceptance: "read back memory records and clean smoke rows",
      command: "db:smoke:memory-governance",
      constraints: ["persist reviewed memory candidates and anti-memory"],
      db,
      eventMessage: "Memory governance smoke plan created",
      eventType: "smoke.memory_governance.plan_persisted",
      includeEvidenceContract: false,
      marker,
      nonGoals: ["do not mutate runtime markdown memory"],
      projectSlug,
      task,
      workspaceSlug
    });
    retrievalRunId = compiledRetrievalRunId;
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
    const invalidatedMemoryRecord = await memoryRepository.invalidateMemoryRecord({
      memoryRecordId: memoryRecord.id,
      reviewer: "memory-governance-smoke",
      reason: "MM-28 smoke proves invalidated memory is excluded from active memory.",
      invalidatedAt: new Date().toISOString(),
      metadata: {
        smokeId: marker
      }
    });
    const activeMemoryAfterInvalidation = await memoryRepository.listActiveMemory(project.id, 10);
    const antiMemoryCandidate = await memoryRepository.createAntiMemoryCandidate({
      projectId: project.id,
      executionRunId: executionRun.id,
      key: `anti-memory-governance-smoke:${marker}`,
      proposedBy: "memory-governance-smoke",
      status: "candidate",
      rejectedClaim: "Markdown files are KRN runtime memory.",
      reason: "Runtime Memory Core is store-backed; markdown is audit/source/export material.",
      invalidatedBySourceClaimIds: [sourceClaim.id],
      appliesTo: "memory governance",
      mayRevisitWhen: "Project memory no longer uses the brain store.",
      summary: "Markdown is not runtime memory",
      body: "Do not treat markdown files as Memory Core.",
      owner: "kernel",
      confidence: 99,
      sourceLineage: [{ sourceId: sourceClaim.id }],
      metadata: {
        smokeId: marker,
        reflectionCandidateEvidence: {
          provenance: "source_claim",
          evidenceRefs: [sourceClaim.id],
          doesNotProve: "This does not prove the anti-memory candidate is reviewed."
        }
      }
    });
    const antiMemoryRecord = await memoryRepository.promoteReviewedAntiMemoryCandidate({
      candidateId: antiMemoryCandidate.id,
      reviewer: "memory-governance-smoke",
      decision: "accepted",
      metadata: {
        smokeId: marker,
        reviewGate: {
          evidenceReviewedRef: sourceClaim.id
        }
      }
    });
    const reviewedAntiMemoryCandidate = await memoryRepository.getAntiMemoryCandidateById(
      antiMemoryCandidate.id
    );
    const reviewedAntiMemoryCandidateStatus =
      reviewedAntiMemoryCandidate?.status ?? "missing";
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

    const readbackError = "Memory governance smoke readback did not match persisted records";

    assertSmokeReadbackChecks([
      { label: "source claim readback", passed: readBackSourceClaim?.id === sourceClaim.id },
      { label: "memory candidate readback", passed: readBackCandidate?.id === memoryCandidate.id },
      { label: "candidate accepted", passed: reviewedCandidate?.status === "accepted" },
      { label: "memory record readback", passed: readBackMemoryRecord?.id === memoryRecord.id },
      {
        label: "current version id",
        passed: readBackMemoryRecord?.currentVersionId !== undefined
      },
      {
        label: "project memory record listed",
        passed: projectMemoryRecords.some((record) => record.id === memoryRecord.id)
      },
      {
        label: "memory invalidated",
        passed: invalidatedMemoryRecord.status === "invalidated"
      },
      {
        label: "invalidated memory excluded from active list",
        passed: !activeMemoryAfterInvalidation.some((record) => record.id === memoryRecord.id)
      },
      { label: "memory version row count", passed: versionRows.length === 1 },
      {
        label: "memory version candidate lineage",
        passed: versionRows[0]?.createdFromCandidateId === memoryCandidate.id
      },
      { label: "memory application row count", passed: applicationRows.length === 1 },
      {
        label: "memory application record lineage",
        passed: applicationRows[0]?.memoryRecordId === memoryRecord.id
      },
      {
        label: "anti-memory candidate accepted",
        passed: reviewedAntiMemoryCandidateStatus === "accepted"
      },
      {
        label: "anti-memory candidate lineage",
        passed: antiMemoryRecord.createdFromCandidateId === antiMemoryCandidate.id
      },
      {
        label: "run anti-memory listed",
        passed: runAntiMemory.some((record) => record.id === antiMemoryRecord.id)
      },
      { label: "outbox events created", passed: (outboxRows[0]?.count ?? 0) >= 4 }
    ], readbackError);

    const persistedCandidate = requireSmokeReadbackValue(
      readBackCandidate,
      "memory candidate readback",
      readbackError
    );
    const persistedReviewedCandidate = requireSmokeReadbackValue(
      reviewedCandidate,
      "reviewed candidate readback",
      readbackError
    );
    const persistedMemoryRecord = requireSmokeReadbackValue(
      readBackMemoryRecord,
      "memory record readback",
      readbackError
    );
    const memoryRecordVersion = requireSmokeReadbackValue(
      versionRows[0],
      "memory version row",
      readbackError
    );

    const remainingMarkerCount = await cleanup();

    return {
      workspaceSlug,
      projectSlug,
      executionRunId: executionRun.id,
      sourceClaimId: sourceClaim.id,
      memoryCandidateId: memoryCandidate.id,
      readBackMemoryCandidateId: persistedCandidate.id,
      reviewedMemoryCandidateStatus: persistedReviewedCandidate.status,
      memoryRecordId: memoryRecord.id,
      readBackMemoryRecordId: persistedMemoryRecord.id,
      memoryRecordVersionId: memoryRecordVersion.id,
      invalidatedMemoryRecordStatus: invalidatedMemoryRecord.status,
      activeMemoryAfterInvalidationCount: activeMemoryAfterInvalidation.length,
      memoryApplicationId: memoryApplication.id,
      antiMemoryCandidateId: antiMemoryCandidate.id,
      reviewedAntiMemoryCandidateStatus,
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
