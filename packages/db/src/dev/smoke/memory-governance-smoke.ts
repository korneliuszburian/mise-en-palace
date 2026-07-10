import { eq, sql } from "drizzle-orm";
import postgres from "postgres";

import {
  assertSmokeReadbackChecks,
  cleanupMemoryGovernanceSmokeRows,
  countMemoryGovernanceSmokeMarkerRows,
  createCompiledSmokeExecution,
  createSmokeRuntime,
  requireSmokeReadbackValue
} from "./db-smoke-support.js";
import { createKrnDatabase } from "../../database.js";
import {
  DrizzleMemoryRepository,
  DrizzleProjectRepository
} from "../../repositories/index.js";
import {
  antiMemoryRecords,
  memoryApplications,
  memoryRecords,
  memoryRecordVersions,
  outboxEvents,
  workspaces
} from "../../schema/index.js";

const assertRejected = async (
  operation: Promise<unknown>,
  expectedError: string,
  message: string
): Promise<void> => {
  try {
    await operation;
  } catch (error) {
    if (error instanceof Error && error.message.includes(expectedError)) {
      return;
    }

    throw new Error(
      `${message}: unexpected rejection ${error instanceof Error ? error.message : "unknown error"}`
    );
  }

  throw new Error(message);
};

const fulfilledCount = <Value>(
  results: readonly PromiseSettledResult<Value>[]
): number => results.filter((result) => result.status === "fulfilled").length;

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
      sourceAuthority: "project-decision",
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
      sourceAuthority: "project-decision",
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
    const concurrentMemoryCandidate = await memoryRepository.createMemoryCandidate({
      projectId: project.id,
      executionRunId: executionRun.id,
      proposedBy: "memory-governance-concurrency-smoke",
      kind: "constraint",
      status: "proposed",
      summary: "Concurrent memory promotion must have one winner",
      body: "A candidate may create at most one accepted memory record.",
      owner: "kernel",
      confidence: 95,
      applicationGuidance: "Use only after explicit concurrent review arbitration.",
      invalidationRule: "Revisit when candidate promotion concurrency changes.",
      sourceClaimIds: [sourceClaim.id],
      sourceLineage: [{ sourceId: sourceClaim.id }],
      isUserPreference: false,
      metadata: {
        smokeId: marker,
        lifecycleProbe: "concurrent-memory-promotion"
      }
    });
    const concurrentMemoryClients = [
      postgres(input.databaseUrl, { max: 1, onnotice: () => undefined }),
      postgres(input.databaseUrl, { max: 1, onnotice: () => undefined })
    ];

    try {
      const concurrentMemoryRepositories = concurrentMemoryClients.map(
        (concurrentClient) => new DrizzleMemoryRepository(createKrnDatabase(concurrentClient))
      );
      const [firstConcurrentMemoryRepository, secondConcurrentMemoryRepository] =
        concurrentMemoryRepositories;

      if (firstConcurrentMemoryRepository === undefined || secondConcurrentMemoryRepository === undefined) {
        throw new Error("Memory governance concurrency smoke did not create two memory repositories");
      }

      const concurrentMemoryPromotionResults = await Promise.allSettled([
        firstConcurrentMemoryRepository.promoteReviewedMemoryCandidate({
          candidateId: concurrentMemoryCandidate.id,
          reviewer: "memory-governance-concurrency-smoke-a",
          decision: "accepted",
          recordKey: `memory-governance-concurrent-a:${marker}`,
          metadata: {
            smokeId: marker,
            lifecycleProbe: "concurrent-memory-promotion"
          }
        }),
        secondConcurrentMemoryRepository.promoteReviewedMemoryCandidate({
          candidateId: concurrentMemoryCandidate.id,
          reviewer: "memory-governance-concurrency-smoke-b",
          decision: "accepted",
          recordKey: `memory-governance-concurrent-b:${marker}`,
          metadata: {
            smokeId: marker,
            lifecycleProbe: "concurrent-memory-promotion"
          }
        })
      ]);
      const concurrentMemoryRows = await db
        .select()
        .from(memoryRecords)
        .where(sql`${memoryRecords.metadata}->>'lifecycleProbe' = 'concurrent-memory-promotion'
          AND ${memoryRecords.metadata}->>'smokeId' = ${marker}`);
      const concurrentMemoryCandidateReadback = await memoryRepository.getMemoryCandidateById(
        concurrentMemoryCandidate.id
      );

      assertSmokeReadbackChecks([
        {
          label: "concurrent memory promotion has one winner",
          passed: fulfilledCount(concurrentMemoryPromotionResults) === 1
        },
        {
          label: "concurrent memory promotion creates one record",
          passed: concurrentMemoryRows.length === 1
        },
        {
          label: "concurrent memory candidate is accepted once",
          passed: concurrentMemoryCandidateReadback?.status === "accepted"
        }
      ], "Memory governance concurrency falsifier failed");
    } finally {
      await Promise.all(concurrentMemoryClients.map((concurrentClient) => concurrentClient.end()));
    }

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
    await assertRejected(
      memoryRepository.rejectMemoryCandidate({
        candidateId: memoryCandidate.id,
        reviewer: "memory-governance-smoke-after-accept",
        reason: "An accepted candidate must not be rejected afterward.",
        metadata: {
          smokeId: marker,
          lifecycleProbe: "reject-after-accept"
        }
      }),
      "expected proposed or candidate status",
      "Memory governance allowed rejection after acceptance"
    );
    const packetBoundApplication = {
      memoryRecordId: memoryRecord.id,
      executionRunId: executionRun.id,
      packetChecksum: `memory-governance-packet-${marker}`,
      expectedUse: "Guide memory governance smoke.",
      outcome: "helped",
      notes: "Verified explicit promotion and application feedback.",
      metadata: {
        smokeId: marker
      }
    } as const;

    if (memoryRepository.recordMemoryApplicationOnce === undefined) {
      throw new Error("Memory governance smoke requires atomic packet-bound application persistence");
    }

    const applicationResults = await Promise.all([
      memoryRepository.recordMemoryApplicationOnce(packetBoundApplication),
      memoryRepository.recordMemoryApplicationOnce(packetBoundApplication)
    ]);

    const [firstApplicationResult, replayApplicationResult] = applicationResults;

    if (firstApplicationResult === undefined || replayApplicationResult === undefined) {
      throw new Error("Memory governance smoke did not return packet-bound application results");
    }

    const memoryApplication = firstApplicationResult.application;
    const createdApplicationCount = applicationResults.filter((result) => result?.created).length;
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
    const smokeWorkspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.slug, workspaceSlug)
    });

    if (smokeWorkspace === undefined) {
      throw new Error("Memory governance smoke workspace was not found for lifecycle probes");
    }

    const crossProject = await new DrizzleProjectRepository(db).createProject({
      workspaceId: smokeWorkspace.id,
      slug: `memory-governance-cross-project-${marker}`,
      displayName: `memory-governance-cross-project-${marker}`,
      metadata: {
        smokeId: marker,
        lifecycleProbe: "cross-project-supersession"
      }
    });
    const supersessionCurrent = await memoryRepository.createMemoryRecord({
      projectId: project.id,
      key: `memory-governance-supersession-current:${marker}`,
      kind: "constraint",
      summary: "Current memory for guarded supersession",
      body: "This active record may be replaced by a reviewed same-project record.",
      owner: "kernel",
      confidence: 90,
      applicationGuidance: "Use only while the replacement is not yet accepted.",
      sourceLineage: [{ sourceId: sourceClaim.id }],
      isUserPreference: false,
      metadata: {
        smokeId: marker,
        lifecycleProbe: "supersession"
      }
    });
    const supersessionReplacement = await memoryRepository.createMemoryRecord({
      projectId: project.id,
      key: `memory-governance-supersession-replacement:${marker}`,
      kind: "constraint",
      summary: "Replacement memory for guarded supersession",
      body: "This active record is the valid same-project replacement.",
      owner: "kernel",
      confidence: 95,
      applicationGuidance: "Use as the reviewed replacement.",
      sourceLineage: [{ sourceId: sourceClaim.id }],
      isUserPreference: false,
      metadata: {
        smokeId: marker,
        lifecycleProbe: "supersession"
      }
    });
    const crossProjectReplacement = await memoryRepository.createMemoryRecord({
      projectId: crossProject.id,
      key: `memory-governance-cross-project-replacement:${marker}`,
      kind: "constraint",
      summary: "Cross-project replacement must be rejected",
      body: "A record from another project cannot supersede this record.",
      owner: "kernel",
      confidence: 95,
      applicationGuidance: "Never use across project authority boundaries.",
      sourceLineage: [{ sourceId: sourceClaim.id }],
      isUserPreference: false,
      metadata: {
        smokeId: marker,
        lifecycleProbe: "cross-project-supersession"
      }
    });

    await assertRejected(
      memoryRepository.supersedeMemoryRecord({
        memoryRecordId: supersessionCurrent.id,
        reviewer: "memory-governance-smoke",
        reason: "Self-supersession must be rejected.",
        supersededByMemoryRecordId: supersessionCurrent.id,
        metadata: {
          smokeId: marker,
          lifecycleProbe: "supersession"
        }
      }),
      "cannot supersede a record with itself",
      "Memory governance allowed self-supersession"
    );
    await assertRejected(
      memoryRepository.supersedeMemoryRecord({
        memoryRecordId: supersessionCurrent.id,
        reviewer: "memory-governance-smoke",
        reason: "Cross-project supersession must be rejected.",
        supersededByMemoryRecordId: crossProjectReplacement.id,
        metadata: {
          smokeId: marker,
          lifecycleProbe: "cross-project-supersession"
        }
      }),
      "same project",
      "Memory governance allowed cross-project supersession"
    );
    await assertRejected(
      memoryRepository.supersedeMemoryRecord({
        memoryRecordId: supersessionReplacement.id,
        reviewer: "memory-governance-smoke",
        reason: "An invalidated record cannot be a replacement.",
        supersededByMemoryRecordId: memoryRecord.id,
        metadata: {
          smokeId: marker,
          lifecycleProbe: "non-active-replacement"
        }
      }),
      "active replacement",
      "Memory governance allowed a non-active replacement"
    );
    await assertRejected(
      memoryRepository.supersedeMemoryRecord({
        memoryRecordId: memoryRecord.id,
        reviewer: "memory-governance-smoke",
        reason: "An invalidated record cannot be superseded again.",
        supersededByMemoryRecordId: supersessionReplacement.id,
        metadata: {
          smokeId: marker,
          lifecycleProbe: "non-active-current"
        }
      }),
      "active current record",
      "Memory governance allowed a non-active current record"
    );
    const supersededRecord = await memoryRepository.supersedeMemoryRecord({
      memoryRecordId: supersessionCurrent.id,
      reviewer: "memory-governance-smoke",
      reason: "A reviewed same-project replacement is active.",
      supersededByMemoryRecordId: supersessionReplacement.id,
      metadata: {
        smokeId: marker,
        lifecycleProbe: "supersession"
      }
    });
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
    const concurrentAntiMemoryCandidate = await memoryRepository.createAntiMemoryCandidate({
      projectId: project.id,
      executionRunId: executionRun.id,
      key: `anti-memory-governance-concurrent:${marker}`,
      proposedBy: "memory-governance-concurrency-smoke",
      status: "candidate",
      rejectedClaim: "Concurrent anti-memory promotion must have one winner.",
      reason: "One candidate must create at most one anti-memory record.",
      invalidatedBySourceClaimIds: [sourceClaim.id],
      appliesTo: "memory governance concurrency",
      mayRevisitWhen: "Anti-memory promotion concurrency changes.",
      summary: "Concurrent anti-memory promotion must have one winner",
      body: "An anti-memory candidate may create at most one accepted record.",
      owner: "kernel",
      confidence: 95,
      sourceLineage: [{ sourceId: sourceClaim.id }],
      metadata: {
        smokeId: marker,
        lifecycleProbe: "concurrent-anti-memory-promotion"
      }
    });
    const concurrentAntiMemoryClients = [
      postgres(input.databaseUrl, { max: 1, onnotice: () => undefined }),
      postgres(input.databaseUrl, { max: 1, onnotice: () => undefined })
    ];

    try {
      const concurrentAntiMemoryRepositories = concurrentAntiMemoryClients.map(
        (concurrentClient) => new DrizzleMemoryRepository(createKrnDatabase(concurrentClient))
      );
      const [firstConcurrentAntiMemoryRepository, secondConcurrentAntiMemoryRepository] =
        concurrentAntiMemoryRepositories;

      if (firstConcurrentAntiMemoryRepository === undefined || secondConcurrentAntiMemoryRepository === undefined) {
        throw new Error("Memory governance concurrency smoke did not create two anti-memory repositories");
      }

      const concurrentAntiMemoryPromotionResults = await Promise.allSettled([
        firstConcurrentAntiMemoryRepository.promoteReviewedAntiMemoryCandidate({
          candidateId: concurrentAntiMemoryCandidate.id,
          reviewer: "memory-governance-concurrency-smoke-a",
          decision: "accepted",
          recordKey: `anti-memory-governance-concurrent-a:${marker}`,
          metadata: {
            smokeId: marker,
            lifecycleProbe: "concurrent-anti-memory-promotion"
          }
        }),
        secondConcurrentAntiMemoryRepository.promoteReviewedAntiMemoryCandidate({
          candidateId: concurrentAntiMemoryCandidate.id,
          reviewer: "memory-governance-concurrency-smoke-b",
          decision: "accepted",
          recordKey: `anti-memory-governance-concurrent-b:${marker}`,
          metadata: {
            smokeId: marker,
            lifecycleProbe: "concurrent-anti-memory-promotion"
          }
        })
      ]);
      const concurrentAntiMemoryRows = await db
        .select()
        .from(antiMemoryRecords)
        .where(sql`${antiMemoryRecords.metadata}->>'lifecycleProbe' = 'concurrent-anti-memory-promotion'
          AND ${antiMemoryRecords.metadata}->>'smokeId' = ${marker}`);
      const concurrentAntiMemoryCandidateReadback = await memoryRepository.getAntiMemoryCandidateById(
        concurrentAntiMemoryCandidate.id
      );

      assertSmokeReadbackChecks([
        {
          label: "concurrent anti-memory promotion has one winner",
          passed: fulfilledCount(concurrentAntiMemoryPromotionResults) === 1
        },
        {
          label: "concurrent anti-memory promotion creates one record",
          passed: concurrentAntiMemoryRows.length === 1
        },
        {
          label: "concurrent anti-memory candidate is accepted once",
          passed: concurrentAntiMemoryCandidateReadback?.status === "accepted"
        }
      ], "Anti-memory governance concurrency falsifier failed");
    } finally {
      await Promise.all(concurrentAntiMemoryClients.map((concurrentClient) => concurrentClient.end()));
    }

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
    await assertRejected(
      memoryRepository.rejectAntiMemoryCandidate({
        candidateId: antiMemoryCandidate.id,
        reviewer: "memory-governance-smoke-after-accept",
        reason: "An accepted anti-memory candidate must not be rejected afterward.",
        metadata: {
          smokeId: marker,
          lifecycleProbe: "reject-after-accept"
        }
      }),
      "expected proposed or candidate status",
      "Memory governance allowed anti-memory rejection after acceptance"
    );
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
      {
        label: "same-project memory superseded",
        passed: supersededRecord.status === "superseded"
      },
      { label: "memory version row count", passed: versionRows.length === 1 },
      {
        label: "memory version candidate lineage",
        passed: versionRows[0]?.createdFromCandidateId === memoryCandidate.id
      },
      { label: "memory application row count", passed: applicationRows.length === 1 },
      {
        label: "packet-bound memory application created once",
        passed:
          createdApplicationCount === 1 &&
          replayApplicationResult.application.id === memoryApplication.id
      },
      {
        label: "packet-bound memory feedback counted once",
        passed: readBackMemoryRecord?.positiveFeedbackCount === 1
      },
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
