import {
  buildMemoryStalenessMaintenancePreview
} from "@krn/core";
import type {
  MemoryStalenessMaintenanceCandidate
} from "@krn/core";

import {
  assertSmokeReadbackChecks,
  cleanupActivationSmokeRows,
  countActivationSmokeMarkerRows,
  createSmokeHarnessScaffold,
  requireSmokeReadbackValue
} from "./db-smoke-support.js";
import {
  smokeFixtureClocks
} from "./smoke-fixture-clocks.js";

export interface MaintenanceBoundarySmokeInput {
  databaseUrl: string;
  migrationsFolder: string;
  smokeId: string;
}

export interface MaintenanceBoundarySmokeReport {
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
  maintenanceJobType: string;
  maintenanceMemoryCoreGate: string;
  maintenanceWriteBoundaryStatus: string;
  maintenanceWriteBoundaryMutation: "none";
  memoryRecordCount: number;
  memoryStalenessCandidateCount: number;
  cleanupRemainingMarkerCount: number;
  cleanedUp: boolean;
}

const { now, expiredAt, validFrom } = smokeFixtureClocks.maintenanceBoundary;

export const runMaintenanceBoundarySmokeCheck = async (
  input: MaintenanceBoundarySmokeInput
): Promise<MaintenanceBoundarySmokeReport> => {
  const scaffold = await createSmokeHarnessScaffold({
    databaseUrl: input.databaseUrl,
    migrationsFolder: input.migrationsFolder,
    smokeId: input.smokeId,
    smokeName: "maintenance boundary smoke",
    workspacePrefix: "krn-maintenance-boundary-smoke",
    projectSlug: "maintenance-boundary",
    cleanupRows: cleanupActivationSmokeRows,
    countMarkerRows: countActivationSmokeMarkerRows,
    rawIntent: `maintenance boundary smoke ${input.smokeId}`,
    taskContract: {
      title: "Prove DB-backed maintenance boundary readback",
      objective:
        "Seed one expired MemoryRecord and prove the maintenance preview emits maintenance boundary in candidate readback.",
      constraints: [
        "candidate-only maintenance preview",
        "no autonomous maintenance daemon",
        "cleanup seeded DB rows"
      ],
      nonGoals: ["no scheduler", "no Memory Core mutation outside smoke seed", "no schema migration"],
      acceptance: ["one memory-staleness candidate", "maintenanceWriteBoundary passed", "cleanup complete"]
    },
    harnessPlan: {
      summary: "DB-backed maintenance boundary smoke",
      nextAction:
        "Seed expired MemoryRecord, build maintenance preview, assert maintenance boundary, and clean up."
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
        type: "smoke.maintenance_boundary.started",
        message: "Maintenance boundary smoke started",
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
      sourceAuthority: "project-decision",
      uri: `operator://maintenance-boundary-smoke/${marker}`,
      title: "Maintenance boundary smoke source",
      contentHash: `maintenance-boundary-smoke-${marker}`,
      metadata: {
        smokeId: marker
      }
    });
    const sourceClaim = await sourceRepository.createSourceClaim({
      sourceArtifactId: sourceArtifact.id,
      executionRunId: executionRun.id,
      claim:
        "Maintenance memory-staleness candidates should expose validated maintenance boundary before autonomous maintenance runtime work.",
      mechanism:
        "An expired MemoryRecord loaded from Postgres produces a candidate-only maintenance preview with expire_stale_memory maintenanceWriteBoundary.",
      krnImplication:
        "KRN can prove maintenance boundary through DB-backed candidate readback without adding a daemon, scheduler, queue runtime, or schema.",
      doesNotProve:
        "This smoke does not prove maintenance execution, scheduling readiness, memory truth, candidate usefulness, or product readiness.",
      sourceAuthority: "project-decision",
      supportType: "implementation-boundary",
      consumer: "E2E-05 maintenance boundary smoke",
      falsifier:
        "The DB-backed maintenance preview emits no memory-staleness candidate, omits maintenanceWriteBoundary, or reports non-passed boundary.",
      revisitWhen: "The maintenance preview or maintenance boundary contract changes.",
      status: "proposed",
      metadata: {
        smokeId: marker
      }
    });
    const memoryRecord = await memoryRepository.createMemoryRecord({
      projectId: project.id,
      key: `maintenance-boundary-smoke:${marker}`,
      kind: "procedure",
      status: "active",
      summary: "Expired memory for maintenance boundary smoke",
      body:
        "This seeded MemoryRecord exists only to prove DB-backed maintenance candidate readback includes validated maintenance boundary.",
      owner: "kernel",
      confidence: 90,
      applicationGuidance:
        "Use only as isolated smoke input for maintenance boundary readback.",
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
    const preview = buildMemoryStalenessMaintenancePreview({
      now,
      evidenceRef: `db:smoke:maintenance-boundary:${marker}`,
      memoryRecords,
      maxCandidates: 1
    });
    const candidate = preview.candidates.find((item): item is MemoryStalenessMaintenanceCandidate =>
      item.memoryRecordId === memoryRecord.id
    );
    const readBackMemoryRecord = await memoryRepository.getMemoryRecordById(memoryRecord.id);
    const readbackError = "Maintenance boundary smoke readback did not match seeded state";

    assertSmokeReadbackChecks([
      { label: "memory record readback", passed: readBackMemoryRecord?.id === memoryRecord.id },
      { label: "memory staleness candidate", passed: candidate !== undefined },
      {
        label: "maintenance job type",
        passed: candidate?.maintenanceWriteBoundary.jobType === "expire_stale_memory"
      },
      {
        label: "maintenance memory core gate",
        passed:
          candidate?.maintenanceWriteBoundary.memoryCoreGate ===
          "must_create_reviewed_invalidation_candidate"
      },
      { label: "maintenance boundary passed", passed: candidate?.maintenanceWriteBoundary.status === "passed" },
      { label: "candidate mutation none", passed: candidate?.mutation === "none" },
      {
        label: "maintenance preview mutation none",
        passed: preview.mutation === "none"
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
      maintenanceJobType: emittedCandidate.maintenanceWriteBoundary.jobType,
      maintenanceMemoryCoreGate: emittedCandidate.maintenanceWriteBoundary.memoryCoreGate,
      maintenanceWriteBoundaryStatus: emittedCandidate.maintenanceWriteBoundary.status,
      maintenanceWriteBoundaryMutation: preview.mutation,
      memoryRecordCount: memoryRecords.length,
      memoryStalenessCandidateCount: preview.candidates.length,
      cleanupRemainingMarkerCount,
      cleanedUp: cleanupRemainingMarkerCount === 0
    };
  } finally {
    await client.end();
  }
};
