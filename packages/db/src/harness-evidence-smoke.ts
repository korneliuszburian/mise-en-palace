import {
  cleanupHarnessCompilerSmokeRows,
  createCompiledSmokeExecution,
  createHarnessCompilerSmokeRuntime
} from "./db-smoke-support.js";
export interface HarnessEvidenceSmokeInput {
  databaseUrl: string;
  migrationsFolder: string;
  smokeId: string;
}

export interface HarnessEvidenceSmokeReport {
  workspaceSlug: string;
  projectSlug: string;
  executionRunId: string;
  evidenceBundleId: string;
  reviewAssessmentId: string;
  feedbackDeltaId: string;
  runEventCount: number;
  evidenceBundleCount: number;
  reviewAssessmentCount: number;
  feedbackDeltaCount: number;
  remainingMarkerCount: number;
  cleanedUp: boolean;
}

export const runHarnessEvidenceSmokeCheck = async (
  input: HarnessEvidenceSmokeInput
): Promise<HarnessEvidenceSmokeReport> => {
  const { client, db, marker, projectSlug, task, workspaceSlug } =
    await createHarnessCompilerSmokeRuntime({
      databaseUrl: input.databaseUrl,
      migrationsFolder: input.migrationsFolder,
      smokeId: input.smokeId,
      smokeName: "harness evidence smoke",
      workspacePrefix: "krn-evidence-smoke",
      projectSlug: "persisted-harness-evidence",
      taskPrefix: "persisted harness evidence smoke"
    });
  let retrievalRunId: string | undefined;
  let feedbackDeltaId: string | undefined;

  const cleanup = (): Promise<number> => cleanupHarnessCompilerSmokeRows({
    db,
    feedbackDeltaId,
    marker,
    retrievalRunId,
    workspaceSlug
  });

  try {
    await cleanup();

    const {
      executionRun,
      harnessRunRepository,
      retrievalRunId: compiledRetrievalRunId
    } = await createCompiledSmokeExecution({
      acceptance: "read back persisted evidence records",
      command: "db:smoke:harness-evidence",
      db,
      eventMessage: "Persisted harness evidence smoke plan created",
      eventType: "smoke.harness_evidence.plan_persisted",
      marker,
      projectSlug,
      task,
      workspaceSlug
    });
    retrievalRunId = compiledRetrievalRunId;
    const evidenceBundle = await harnessRunRepository.createEvidenceBundle({
      executionRunId: executionRun.id,
      status: "captured",
      changedFiles: ["smoke/harness-evidence.ts"],
      commands: [{
        command: "pnpm typecheck",
        status: "passed"
      }],
      diffRisk: "low",
      reviewBurden: "Smoke proof only.",
      rollbackPath: "Delete smoke marker rows.",
      event: {
        sequence: 2,
        type: "smoke.harness_evidence.evidence_captured",
        message: "Persisted harness evidence smoke captured",
        payload: {
          smokeId: marker
        }
      },
      metadata: {
        smokeId: marker
      }
    });
    const reviewAssessment = await harnessRunRepository.createReviewAssessment({
      evidenceBundleId: evidenceBundle.id,
      status: "pending",
      reviewer: "krn-smoke",
      summary: "Smoke evidence captured.",
      findings: [],
      metadata: {
        smokeId: marker
      }
    });
    const feedbackDelta = await harnessRunRepository.createFeedbackDelta({
      reviewAssessmentId: reviewAssessment.id,
      status: "candidate",
      memoryCandidates: [],
      sourceDecisions: [],
      evalCandidates: [],
      metadata: {
        smokeId: marker
      }
    });
    feedbackDeltaId = feedbackDelta.id;

    const readBack = await harnessRunRepository.getHarnessRunByExecutionRunId(executionRun.id);

    if (readBack === undefined) {
      throw new Error("Harness evidence smoke failed to read back execution run");
    }

    const evidenceBundleCount = readBack.evidenceBundles.length;
    const reviewAssessmentCount = readBack.reviewAssessments.length;
    const feedbackDeltaCount = readBack.feedbackDeltas.length;
    const runEventCount = readBack.runEvents.length;

    if (
      evidenceBundleCount !== 1 ||
      reviewAssessmentCount !== 1 ||
      feedbackDeltaCount !== 1 ||
      runEventCount !== 2
    ) {
      throw new Error("Harness evidence smoke readback did not match linked records");
    }

    const remainingMarkerCount = await cleanup();

    return {
      workspaceSlug,
      projectSlug,
      executionRunId: executionRun.id,
      evidenceBundleId: evidenceBundle.id,
      reviewAssessmentId: reviewAssessment.id,
      feedbackDeltaId: feedbackDelta.id,
      runEventCount,
      evidenceBundleCount,
      reviewAssessmentCount,
      feedbackDeltaCount,
      remainingMarkerCount,
      cleanedUp: remainingMarkerCount === 0
    };
  } finally {
    await client.end();
  }
};
