import {
  eq,
  sql
} from "drizzle-orm";

import {
  cleanupHarnessCompilerSmokeRows,
  createCompiledSmokeExecution,
  createHarnessCompilerSmokeRuntime
} from "./db-smoke-support.js";
import {
  DrizzleProjectRepository
} from "../../repositories/index.js";
import {
  feedbackDeltas,
  outboxEvents
} from "../../schema/index.js";
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
  projectFeedbackDeltaCount: number;
  subjectFeedbackDeltaCount: number;
  subjectFeedbackRelevant: boolean;
  sourceSubjectFeedbackRetrieved: boolean;
  otherProjectFeedbackDeltaCount: number;
  otherProjectFeedbackDeltaExcluded: boolean;
  remainingMarkerCount: number;
  cleanedUp: boolean;
}

type HarnessEvidenceRepository = Awaited<
  ReturnType<typeof createCompiledSmokeExecution>
>["harnessRunRepository"];

interface SmokeFeedbackDeltaInput {
  harnessRunRepository: HarnessEvidenceRepository;
  executionRunId: string;
  marker: string;
  changedFile: string;
  evidenceEventType: string;
  evidenceEventMessage: string;
  reviewSummary: string;
  metadata?: Record<string, unknown>;
}

interface SmokeFeedbackDeltaOutput {
  evidenceBundleId: string;
  reviewAssessmentId: string;
  feedbackDeltaId: string;
}

const createSmokeFeedbackDelta = async (
  input: SmokeFeedbackDeltaInput
): Promise<SmokeFeedbackDeltaOutput> => {
  const evidenceBundle = await input.harnessRunRepository.createEvidenceBundle({
    executionRunId: input.executionRunId,
    status: "captured",
    changedFiles: [input.changedFile],
    commands: [{
      command: "pnpm typecheck",
      status: "passed"
    }],
    diffRisk: "low",
    reviewBurden: "Smoke proof only.",
    rollbackPath: "Delete smoke marker rows.",
    event: {
      sequence: 2,
      type: input.evidenceEventType,
      message: input.evidenceEventMessage,
      payload: {
        smokeId: input.marker
      }
    },
    metadata: {
      smokeId: input.marker,
      ...(input.metadata ?? {})
    }
  });
  const reviewAssessment = await input.harnessRunRepository.createReviewAssessment({
    evidenceBundleId: evidenceBundle.id,
    status: "pending",
    reviewer: "krn-smoke",
    summary: input.reviewSummary,
    findings: [],
    metadata: {
      smokeId: input.marker
    }
  });
  const feedbackDelta = await input.harnessRunRepository.createFeedbackDelta({
    reviewAssessmentId: reviewAssessment.id,
    status: "candidate",
    memoryCandidates: [],
    sourceDecisions: [],
    evalCandidates: [],
    metadata: {
      smokeId: input.marker,
      ...(input.metadata ?? {})
    }
  });

  return {
    evidenceBundleId: evidenceBundle.id,
    reviewAssessmentId: reviewAssessment.id,
    feedbackDeltaId: feedbackDelta.id
  };
};

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
  let otherFeedbackDeltaId: string | undefined;

  const cleanup = async (): Promise<number> => {
    if (otherFeedbackDeltaId !== undefined) {
      await db
        .delete(outboxEvents)
        .where(sql`${outboxEvents.payload}->>'feedbackDeltaId' = ${otherFeedbackDeltaId}`);
    }

    return cleanupHarnessCompilerSmokeRows({
      db,
      feedbackDeltaId,
      marker,
      retrievalRunId,
      workspaceSlug
    });
  };

  try {
    await cleanup();

    const {
      executionRun,
      harnessRunRepository,
      project,
      retrievalRunId: compiledRetrievalRunId,
      workspace
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
    const feedbackDelta = await createSmokeFeedbackDelta({
      harnessRunRepository,
      executionRunId: executionRun.id,
      marker,
      changedFile: "smoke/harness-evidence.ts",
      evidenceEventType: "smoke.harness_evidence.evidence_captured",
      evidenceEventMessage: "Persisted harness evidence smoke captured",
      reviewSummary: "Smoke evidence captured.",
      metadata: {
        knowledgeUsefulnessOutcomes: [{
          knowledgeId: "knowledge:older-relevant",
          outcome: "stale",
          reason: "Older relevant feedback must remain visible after unrelated newer deltas.",
          evidenceRefs: ["smoke:harness-evidence:older-relevant"],
          doesNotProve: "This smoke does not prove broad usefulness ranking quality."
        }],
        sourceUsefulnessOutcomes: [{
          sourceClaimId: "source-claim-older-relevant",
          sourceDecisionId: "source-decision-older-relevant",
          outcome: "stale",
          reason: "Source subject feedback must remain project-scoped and bounded.",
          evidenceRefs: ["smoke:harness-evidence:source-relevant"],
          doesNotProve: "This smoke does not prove broad source truth."
        }]
      }
    });
    feedbackDeltaId = feedbackDelta.feedbackDeltaId;

    const olderRelevantTimestamp = new Date(Date.UTC(2026, 6, 7));
    await db
      .update(feedbackDeltas)
      .set({
        createdAt: olderRelevantTimestamp,
        updatedAt: olderRelevantTimestamp
      })
      .where(eq(feedbackDeltas.id, feedbackDelta.feedbackDeltaId));

    const distractorFeedbackDeltas = Array.from({ length: 101 }, (_, index) => ({
      reviewAssessmentId: feedbackDelta.reviewAssessmentId,
      status: "candidate" as const,
      memoryCandidates: [],
      sourceDecisions: [],
      evalCandidates: [],
      metadata: {
        smokeId: marker,
        knowledgeUsefulnessOutcomes: [{
          knowledgeId: `knowledge:unrelated-${index}`,
          outcome: "helped",
          reason: "Unrelated newer feedback is a retrieval-horizon distractor.",
          evidenceRefs: [`smoke:harness-evidence:unrelated-${index}`],
          doesNotProve: "This smoke does not prove broad usefulness ranking quality."
        }]
      },
      createdAt: new Date(Date.UTC(2026, 6, 8, 0, 0, index)),
      updatedAt: new Date(Date.UTC(2026, 6, 8, 0, 0, index))
    }));
    await db.insert(feedbackDeltas).values(distractorFeedbackDeltas);
    const latestRelevantRows = await db
      .insert(feedbackDeltas)
      .values({
        reviewAssessmentId: feedbackDelta.reviewAssessmentId,
        status: "candidate",
        memoryCandidates: [],
        sourceDecisions: [],
        evalCandidates: [],
        metadata: {
          smokeId: marker,
          knowledgeUsefulnessOutcomes: [{
            knowledgeId: "knowledge:older-relevant",
            outcome: "helped",
            reason: "The newer same-subject outcome must win deterministically.",
            evidenceRefs: ["smoke:harness-evidence:newer-relevant"],
            doesNotProve: "This smoke does not prove broad usefulness ranking quality."
          }]
        },
        createdAt: new Date(Date.UTC(2026, 6, 9)),
        updatedAt: new Date(Date.UTC(2026, 6, 9))
      })
      .returning({ id: feedbackDeltas.id });
    const latestRelevantId = latestRelevantRows[0]?.id;

    if (latestRelevantId === undefined) {
      throw new Error("Harness evidence smoke failed to create newer subject feedback");
    }

    const projectRepository = new DrizzleProjectRepository(db);
    const otherProject = await projectRepository.createProject({
      workspaceId: workspace.id,
      slug: `${projectSlug}-other`,
      displayName: `${projectSlug}-other`,
      metadata: {
        smokeId: marker
      }
    });
    const otherOperatorIntent = await harnessRunRepository.createOperatorIntent({
      workspaceId: workspace.id,
      projectId: otherProject.id,
      source: "cli",
      rawIntent: `${task} other project`,
      metadata: {
        smokeId: marker
      }
    });
    const otherTaskContract = await harnessRunRepository.createTaskContract({
      operatorIntentId: otherOperatorIntent.id,
      projectId: otherProject.id,
      title: `${task} other project`,
      objective: `${task} other project`,
      constraints: ["preserve strict TypeScript boundaries"],
      nonGoals: ["do not mutate memory"],
      acceptance: ["read back persisted evidence records"],
      metadata: {
        smokeId: marker
      }
    });
    const otherHarnessPlan = await harnessRunRepository.createHarnessPlan({
      taskContractId: otherTaskContract.id,
      version: 1,
      status: "ready",
      summary: "Other project harness evidence smoke plan",
      nextAction: "Create project-scoping regression evidence.",
      metadata: {
        smokeId: marker
      }
    });
    const otherExecutionRun = await harnessRunRepository.createExecutionRun({
      harnessPlanId: otherHarnessPlan.id,
      adapter: "codex",
      status: "planned",
      initialEvent: {
        sequence: 1,
        type: "smoke.harness_evidence.other_project_plan_persisted",
        message: "Other project harness evidence smoke plan created",
        payload: {
          smokeId: marker
        }
      },
      metadata: {
        smokeId: marker
      }
    });
    const otherFeedbackDelta = await createSmokeFeedbackDelta({
      harnessRunRepository,
      executionRunId: otherExecutionRun.id,
      marker,
      changedFile: "smoke/harness-evidence-other.ts",
      evidenceEventType: "smoke.harness_evidence.other_project_evidence_captured",
      evidenceEventMessage: "Other project harness evidence smoke captured",
      reviewSummary: "Other project smoke evidence captured."
    });
    otherFeedbackDeltaId = otherFeedbackDelta.feedbackDeltaId;

    const projectFeedbackDeltas =
      await harnessRunRepository.listFeedbackDeltasForProject(project.id, 200);
    const subjectFeedbackDeltas = await harnessRunRepository.listFeedbackDeltasForSubjects({
      projectId: project.id,
      subjects: [{
        kind: "knowledge",
        id: "knowledge:older-relevant"
      }],
      limitPerSubject: 1
    });
    const subjectFeedbackRelevant = subjectFeedbackDeltas[0]?.id === latestRelevantId;
    const sourceSubjectFeedbackDeltas = await harnessRunRepository.listFeedbackDeltasForSubjects({
      projectId: project.id,
      subjects: [
        { kind: "source_claim", id: "source-claim-older-relevant" },
        { kind: "source_decision", id: "source-decision-older-relevant" }
      ],
      limitPerSubject: 1
    });
    const sourceSubjectFeedbackRetrieved = sourceSubjectFeedbackDeltas.some((delta) =>
      delta.id === feedbackDelta.feedbackDeltaId
    );
    const otherProjectFeedbackDeltas =
      await harnessRunRepository.listFeedbackDeltasForProject(otherProject.id);
    const otherProjectFeedbackDeltaExcluded =
      projectFeedbackDeltas.every((delta) => delta.id !== otherFeedbackDelta.feedbackDeltaId);

    if (
      projectFeedbackDeltas.length !== 103 ||
      !subjectFeedbackRelevant ||
      subjectFeedbackDeltas.length !== 1 ||
      !sourceSubjectFeedbackRetrieved ||
      otherProjectFeedbackDeltas.length !== 1 ||
      otherProjectFeedbackDeltas[0]?.id !== otherFeedbackDelta.feedbackDeltaId ||
      !otherProjectFeedbackDeltaExcluded
    ) {
      throw new Error("Harness evidence smoke project-scoped feedback readback leaked rows");
    }

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
      feedbackDeltaCount !== 103 ||
      runEventCount !== 2
    ) {
      throw new Error("Harness evidence smoke readback did not match linked records");
    }

    const remainingMarkerCount = await cleanup();

    return {
      workspaceSlug,
      projectSlug,
      executionRunId: executionRun.id,
      evidenceBundleId: feedbackDelta.evidenceBundleId,
      reviewAssessmentId: feedbackDelta.reviewAssessmentId,
      feedbackDeltaId: feedbackDelta.feedbackDeltaId,
      runEventCount,
      evidenceBundleCount,
      reviewAssessmentCount,
      feedbackDeltaCount,
      projectFeedbackDeltaCount: projectFeedbackDeltas.length,
      subjectFeedbackDeltaCount: subjectFeedbackDeltas.length,
      subjectFeedbackRelevant,
      sourceSubjectFeedbackRetrieved,
      otherProjectFeedbackDeltaCount: otherProjectFeedbackDeltas.length,
      otherProjectFeedbackDeltaExcluded,
      remainingMarkerCount,
      cleanedUp: remainingMarkerCount === 0
    };
  } finally {
    await client.end();
  }
};
