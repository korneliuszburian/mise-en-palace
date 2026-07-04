import {
  buildBrainHeartbeatPreview
} from "@krn/workers";
import type {
  BrainHeartbeatCandidate,
  MemoryStalenessHeartbeatCandidate
} from "@krn/workers";

import {
  assertSmokeReadbackChecks,
  cleanupActivationSmokeRows,
  countActivationSmokeMarkerRows,
  createSmokeHarnessScaffold,
  requireSmokeReadbackValue
} from "./dbSmokeSupport.js";
import {
  smokeFixtureClocks
} from "./smokeFixtureClocks.js";

export interface HeartbeatWorkerBoundarySmokeInput {
  databaseUrl: string;
  migrationsFolder: string;
  smokeId: string;
}

export interface HeartbeatWorkerBoundarySmokeReport {
  workspaceSlug: string;
  projectSlug: string;
  executionRunId: string;
  sourceClaimId: string;
  memoryRecordId: string;
  readBackMemoryRecordId: string;
  candidateId: string;
  candidateKind: string;
  candidateReviewability: string;
  candidateMutation: string;
  workerJobType: string;
  workerMemoryCoreGate: string;
  workerWriteBoundaryStatus: string;
  workerWriteBoundaryMutation: "none";
  memoryRecordCount: number;
  memoryStalenessCandidateCount: number;
  cleanupRemainingMarkerCount: number;
  cleanedUp: boolean;
}

const { now, expiredAt, validFrom } = smokeFixtureClocks.heartbeatWorkerBoundary;

const isMemoryStalenessCandidate = (
  candidate: BrainHeartbeatCandidate
): candidate is MemoryStalenessHeartbeatCandidate =>
  candidate.kind === "memory_staleness_maintenance_candidate";

export const runHeartbeatWorkerBoundarySmokeCheck = async (
  input: HeartbeatWorkerBoundarySmokeInput
): Promise<HeartbeatWorkerBoundarySmokeReport> => {
  const scaffold = await createSmokeHarnessScaffold({
    databaseUrl: input.databaseUrl,
    migrationsFolder: input.migrationsFolder,
    smokeId: input.smokeId,
    smokeName: "heartbeat worker boundary smoke",
    workspacePrefix: "krn-heartbeat-worker-boundary-smoke",
    projectSlug: "heartbeat-worker-boundary",
    cleanupRows: cleanupActivationSmokeRows,
    countMarkerRows: countActivationSmokeMarkerRows,
    rawIntent: `heartbeat worker boundary smoke ${input.smokeId}`,
    taskContract: {
      title: "Prove DB-backed heartbeat worker boundary readback",
      objective:
        "Seed one expired MemoryRecord and prove the heartbeat preview emits worker boundary in candidate readback.",
      constraints: [
        "candidate-only heartbeat preview",
        "no worker daemon",
        "cleanup seeded DB rows"
      ],
      nonGoals: ["no scheduler", "no Memory Core mutation outside smoke seed", "no schema migration"],
      acceptance: ["one memory-staleness candidate", "workerWriteBoundary passed", "cleanup complete"]
    },
    harnessPlan: {
      summary: "DB-backed heartbeat worker boundary smoke",
      nextAction:
        "Seed expired MemoryRecord, build heartbeat preview, assert worker boundary, and clean up."
    }
  });
  const {
    client,
    marker,
    workspaceSlug,
    projectSlug,
    project,
    harnessPlan,
    harnessRunRepository,
    memoryRepository,
    sourceRepository,
    cleanup
  } = scaffold;

  try {
    const executionRun = await harnessRunRepository.createExecutionRun({
      harnessPlanId: harnessPlan.id,
      adapter: "smoke",
      status: "running",
      startedAt: now,
      initialEvent: {
        sequence: 1,
        type: "smoke.heartbeat_worker_boundary.started",
        message: "Heartbeat worker boundary smoke started",
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
      uri: `operator://heartbeat-worker-boundary-smoke/${marker}`,
      title: "Heartbeat worker boundary smoke source",
      contentHash: `heartbeat-worker-boundary-smoke-${marker}`,
      metadata: {
        smokeId: marker
      }
    });
    const sourceClaim = await sourceRepository.createSourceClaim({
      sourceArtifactId: sourceArtifact.id,
      executionRunId: executionRun.id,
      claim:
        "Heartbeat memory-staleness candidates should expose validated worker boundary before worker automation.",
      mechanism:
        "An expired MemoryRecord loaded from Postgres produces a candidate-only heartbeat preview with expire_stale_memory workerWriteBoundary.",
      krnImplication:
        "KRN can prove heartbeat worker boundary through DB-backed candidate readback without adding a daemon, scheduler, queue runtime, or schema.",
      doesNotProve:
        "This smoke does not prove worker execution, scheduling readiness, memory truth, candidate usefulness, or product readiness.",
      trustTier: "project-decision",
      supportType: "implementation-boundary",
      consumer: "E2E-05 heartbeat worker boundary smoke",
      falsifier:
        "The DB-backed heartbeat preview emits no memory-staleness candidate, omits workerWriteBoundary, or reports non-passed boundary.",
      revisitWhen: "The heartbeat preview or worker boundary contract changes.",
      status: "proposed",
      metadata: {
        smokeId: marker
      }
    });
    const memoryRecord = await memoryRepository.createMemoryRecord({
      projectId: project.id,
      key: `heartbeat-worker-boundary-smoke:${marker}`,
      kind: "procedure",
      status: "active",
      summary: "Expired memory for heartbeat worker boundary smoke",
      body:
        "This seeded MemoryRecord exists only to prove DB-backed heartbeat candidate readback includes validated worker boundary.",
      owner: "kernel",
      confidence: 90,
      applicationGuidance:
        "Use only as isolated smoke input for heartbeat worker boundary readback.",
      invalidationRule: "Expired by smoke fixture validUntil timestamp.",
      sourceLineage: [
        {
          sourceId: sourceClaim.id,
          note: "E2E-05 source-to-decision"
        }
      ],
      isUserPreference: false,
      validFrom,
      validUntil: expiredAt,
      metadata: {
        smokeId: marker
      }
    });
    const memoryRecords = await memoryRepository.listMemoryRecordsForProject(project.id, 10);
    const preview = buildBrainHeartbeatPreview({
      now,
      evidenceRef: `db:smoke:heartbeat-worker-boundary:${marker}`,
      memoryRecords,
      sourceClaims: [],
      sourceClaimEdges: [],
      maxCandidates: 1
    });
    const candidate = preview.candidates.find((item): item is MemoryStalenessHeartbeatCandidate =>
      isMemoryStalenessCandidate(item) && item.memoryRecordId === memoryRecord.id
    );
    const readBackMemoryRecord = await memoryRepository.getMemoryRecordById(memoryRecord.id);
    const readbackError = "Heartbeat worker boundary smoke readback did not match seeded state";

    assertSmokeReadbackChecks([
      { label: "memory record readback", passed: readBackMemoryRecord?.id === memoryRecord.id },
      { label: "memory staleness candidate", passed: candidate !== undefined },
      {
        label: "worker job type",
        passed: candidate?.workerWriteBoundary.jobType === "expire_stale_memory"
      },
      {
        label: "worker memory core gate",
        passed:
          candidate?.workerWriteBoundary.memoryCoreGate ===
          "must_create_reviewed_invalidation_candidate"
      },
      { label: "worker boundary passed", passed: candidate?.workerWriteBoundary.status === "passed" },
      { label: "candidate mutation none", passed: candidate?.mutation === "none" },
      { label: "preview mutation none", passed: preview.mutation === "none" },
      {
        label: "runtime loop candidate only",
        passed: preview.manualCandidateLoop.mode === "manual_candidate_only"
      }
    ], readbackError);

    const persistedMemoryRecord = requireSmokeReadbackValue(
      readBackMemoryRecord,
      "memory record readback",
      readbackError
    );
    const emittedCandidate = requireSmokeReadbackValue(
      candidate,
      "memory staleness candidate",
      readbackError
    );
    const cleanupRemainingMarkerCount = await cleanup();

    return {
      workspaceSlug,
      projectSlug,
      executionRunId: executionRun.id,
      sourceClaimId: sourceClaim.id,
      memoryRecordId: memoryRecord.id,
      readBackMemoryRecordId: persistedMemoryRecord.id,
      candidateId: emittedCandidate.id,
      candidateKind: emittedCandidate.kind,
      candidateReviewability: emittedCandidate.reviewability,
      candidateMutation: emittedCandidate.mutation,
      workerJobType: emittedCandidate.workerWriteBoundary.jobType,
      workerMemoryCoreGate: emittedCandidate.workerWriteBoundary.memoryCoreGate,
      workerWriteBoundaryStatus: emittedCandidate.workerWriteBoundary.status,
      workerWriteBoundaryMutation: preview.mutation,
      memoryRecordCount: memoryRecords.length,
      memoryStalenessCandidateCount: preview.candidateCounts.memoryStaleness,
      cleanupRemainingMarkerCount,
      cleanedUp: cleanupRemainingMarkerCount === 0
    };
  } finally {
    await client.end();
  }
};
