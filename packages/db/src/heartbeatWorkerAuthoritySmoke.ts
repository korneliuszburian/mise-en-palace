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

export interface HeartbeatWorkerAuthoritySmokeInput {
  databaseUrl: string;
  migrationsFolder: string;
  smokeId: string;
}

export interface HeartbeatWorkerAuthoritySmokeReport {
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
  workerAuthorityStatus: string;
  workerAuthorityMutation: "none";
  memoryRecordCount: number;
  memoryStalenessCandidateCount: number;
  cleanupRemainingMarkerCount: number;
  cleanedUp: boolean;
}

const now = "2026-07-01T12:00:00.000Z";
const expiredAt = "2026-06-01T12:00:00.000Z";

const isMemoryStalenessCandidate = (
  candidate: BrainHeartbeatCandidate
): candidate is MemoryStalenessHeartbeatCandidate =>
  candidate.kind === "memory_staleness_maintenance_candidate";

export const runHeartbeatWorkerAuthoritySmokeCheck = async (
  input: HeartbeatWorkerAuthoritySmokeInput
): Promise<HeartbeatWorkerAuthoritySmokeReport> => {
  const scaffold = await createSmokeHarnessScaffold({
    databaseUrl: input.databaseUrl,
    migrationsFolder: input.migrationsFolder,
    smokeId: input.smokeId,
    smokeName: "heartbeat worker authority smoke",
    workspacePrefix: "krn-heartbeat-worker-authority-smoke",
    projectSlug: "heartbeat-worker-authority",
    cleanupRows: cleanupActivationSmokeRows,
    countMarkerRows: countActivationSmokeMarkerRows,
    rawIntent: `heartbeat worker authority smoke ${input.smokeId}`,
    taskContract: {
      title: "Prove DB-backed heartbeat worker authority readback",
      objective:
        "Seed one expired MemoryRecord and prove the heartbeat preview emits worker authority in candidate readback.",
      constraints: [
        "candidate-only heartbeat preview",
        "no worker daemon",
        "cleanup seeded DB rows"
      ],
      nonGoals: ["no scheduler", "no Memory Core mutation outside smoke seed", "no schema migration"],
      acceptance: ["one memory-staleness candidate", "workerAuthority passed", "cleanup complete"]
    },
    harnessPlan: {
      summary: "DB-backed heartbeat worker authority smoke",
      nextAction:
        "Seed expired MemoryRecord, build heartbeat preview, assert worker authority, and clean up."
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
        type: "smoke.heartbeat_worker_authority.started",
        message: "Heartbeat worker authority smoke started",
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
      uri: `operator://heartbeat-worker-authority-smoke/${marker}`,
      title: "Heartbeat worker authority smoke source",
      contentHash: `heartbeat-worker-authority-smoke-${marker}`,
      metadata: {
        smokeId: marker
      }
    });
    const sourceClaim = await sourceRepository.createSourceClaim({
      sourceArtifactId: sourceArtifact.id,
      executionRunId: executionRun.id,
      claim:
        "Heartbeat memory-staleness candidates should expose validated worker authority before worker automation.",
      mechanism:
        "An expired MemoryRecord loaded from Postgres produces a candidate-only heartbeat preview with expire_stale_memory workerAuthority.",
      krnImplication:
        "KRN can prove heartbeat worker authority through DB-backed candidate readback without adding a daemon, scheduler, queue runtime, or schema.",
      doesNotProve:
        "This smoke does not prove worker execution, scheduling readiness, memory truth, candidate usefulness, or product readiness.",
      trustTier: "project-decision",
      supportType: "implementation-boundary",
      consumer: "E2E-05 heartbeat worker authority smoke",
      falsifier:
        "The DB-backed heartbeat preview emits no memory-staleness candidate, omits workerAuthority, or reports non-passed authority.",
      revisitWhen: "The heartbeat preview or worker authority contract changes.",
      status: "proposed",
      metadata: {
        smokeId: marker
      }
    });
    const memoryRecord = await memoryRepository.createMemoryRecord({
      projectId: project.id,
      key: `heartbeat-worker-authority-smoke:${marker}`,
      kind: "procedure",
      status: "active",
      summary: "Expired memory for heartbeat worker authority smoke",
      body:
        "This seeded MemoryRecord exists only to prove DB-backed heartbeat candidate readback includes validated worker authority.",
      owner: "kernel",
      confidence: 90,
      applicationGuidance:
        "Use only as isolated smoke input for heartbeat worker authority readback.",
      invalidationRule: "Expired by smoke fixture validUntil timestamp.",
      sourceLineage: [
        {
          sourceId: sourceClaim.id,
          note: "E2E-05 source-to-decision"
        }
      ],
      isUserPreference: false,
      validFrom: "2026-05-01T12:00:00.000Z",
      validUntil: expiredAt,
      metadata: {
        smokeId: marker
      }
    });
    const memoryRecords = await memoryRepository.listMemoryRecordsForProject(project.id, 10);
    const preview = buildBrainHeartbeatPreview({
      now,
      evidenceRef: `db:smoke:heartbeat-worker-authority:${marker}`,
      memoryRecords,
      sourceClaims: [],
      sourceClaimEdges: [],
      maxCandidates: 1
    });
    const candidate = preview.candidates.find((item): item is MemoryStalenessHeartbeatCandidate =>
      isMemoryStalenessCandidate(item) && item.memoryRecordId === memoryRecord.id
    );
    const readBackMemoryRecord = await memoryRepository.getMemoryRecordById(memoryRecord.id);
    const readbackError = "Heartbeat worker authority smoke readback did not match seeded state";

    assertSmokeReadbackChecks([
      { label: "memory record readback", passed: readBackMemoryRecord?.id === memoryRecord.id },
      { label: "memory staleness candidate", passed: candidate !== undefined },
      {
        label: "worker job type",
        passed: candidate?.workerAuthority.jobType === "expire_stale_memory"
      },
      {
        label: "worker memory core gate",
        passed:
          candidate?.workerAuthority.memoryCoreGate ===
          "must_create_reviewed_invalidation_candidate"
      },
      { label: "worker authority passed", passed: candidate?.workerAuthority.status === "passed" },
      { label: "candidate mutation none", passed: candidate?.mutation === "none" },
      { label: "preview mutation none", passed: preview.mutation === "none" },
      {
        label: "runtime loop candidate only",
        passed: preview.runtimeLoop.mode === "manual_candidate_only"
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
      workerJobType: emittedCandidate.workerAuthority.jobType,
      workerMemoryCoreGate: emittedCandidate.workerAuthority.memoryCoreGate,
      workerAuthorityStatus: emittedCandidate.workerAuthority.status,
      workerAuthorityMutation: preview.mutation,
      memoryRecordCount: memoryRecords.length,
      memoryStalenessCandidateCount: preview.candidateCounts.memoryStaleness,
      cleanupRemainingMarkerCount,
      cleanedUp: cleanupRemainingMarkerCount === 0
    };
  } finally {
    await client.end();
  }
};
