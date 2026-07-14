import {
  eq,
  sql
} from "drizzle-orm";
import postgres from "postgres";

import {
  cleanupHarnessCompilerSmokeRows,
  createCompiledSmokeExecution,
  createHarnessCompilerSmokeRuntime
} from "./db-smoke-support.js";
import {
  DrizzleProjectRepository
} from "../../repositories/index.js";
import {
  DrizzleHarnessRunRepository
} from "../../repositories/index.js";
import type {
  CreateEvidenceFeedbackOnceInput
} from "@krn/core/repositories";
import {
  createKrnDatabase
} from "../../database.js";
import type {
  KrnDatabase
} from "../../database.js";
import {
  feedbackDeltas,
  maintenanceQueues,
  outboxEvents,
  evidenceBundles,
  reviewAssessments
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
  feedbackOutboxEventCount: number;
  feedbackMaintenanceQueueCount: number;
  runEventCount: number;
  evidenceBundleCount: number;
  reviewAssessmentCount: number;
  feedbackDeltaCount: number;
  projectFeedbackDeltaCount: number;
  subjectFeedbackDeltaCount: number;
  subjectFeedbackRelevant: boolean;
  sourceSubjectFeedbackRetrieved: boolean;
  exactFeedbackLookupFound: boolean;
  wrongProjectFeedbackLookupClosed: boolean;
  missingFeedbackLookupDistinct: boolean;
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
  db: KrnDatabase;
  databaseUrl: string;
  projectId: string;
  executionRunId: string;
  sourceRunLifecycleRevision: number;
  marker: string;
  changedFile: string;
  evidenceEventType: string;
  evidenceEventMessage: string;
  reviewSummary: string;
  metadata?: Record<string, unknown>;
  maintenance?: { reason: string };
}

interface SmokeFeedbackDeltaOutput {
  evidenceBundleId: string;
  reviewAssessmentId: string;
  feedbackDeltaId: string;
}

const createSmokeFeedbackDelta = async (
  input: SmokeFeedbackDeltaInput
): Promise<SmokeFeedbackDeltaOutput> => {
  const createEvidenceFeedbackOnce = input.harnessRunRepository.createEvidenceFeedbackOnce;

  if (createEvidenceFeedbackOnce === undefined) {
    throw new Error("Harness evidence smoke requires atomic evidence feedback persistence");
  }

  const atomicInput = {
    executionRunId: input.executionRunId,
    sourceRunLifecycleRevision: input.sourceRunLifecycleRevision,
    projectId: input.projectId,
    captureIdentity: `harness-evidence:${input.marker}`,
    evidence: {
      status: "captured" as const,
      changedFiles: [input.changedFile],
      commands: [{
        command: "pnpm typecheck",
        status: "passed" as const
      }],
      diffRisk: "low" as const,
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
    },
    review: {
      status: "pending" as const,
      reviewer: "krn-smoke",
      summary: input.reviewSummary,
      findings: [],
      metadata: {
        smokeId: input.marker
      }
    },
    feedback: {
      status: "candidate" as const,
      memoryCandidates: [],
      sourceDecisions: [],
      evalCandidates: [],
      metadata: {
        smokeId: input.marker,
        ...(input.metadata ?? {})
      }
    },
    ...(input.maintenance === undefined ? {} : { maintenance: input.maintenance })
  } satisfies CreateEvidenceFeedbackOnceInput;
  const retryClient = postgres(input.databaseUrl, { max: 1, onnotice: () => undefined });

  try {
    const retryRepository = new DrizzleHarnessRunRepository(createKrnDatabase(retryClient));
    const [first, retry] = await Promise.all([
      createEvidenceFeedbackOnce.call(input.harnessRunRepository, atomicInput),
      retryRepository.createEvidenceFeedbackOnce(atomicInput)
    ]);

    if (
      first.created === retry.created ||
      first.evidenceBundle.id !== retry.evidenceBundle.id ||
      first.reviewAssessment.id !== retry.reviewAssessment.id ||
      first.feedbackDelta.id !== retry.feedbackDelta.id
    ) {
      throw new Error("Harness evidence smoke atomic retry produced duplicate chain rows");
    }

    await verifyEvidenceFeedbackFaultInjection(input, atomicInput);

    return {
      evidenceBundleId: first.evidenceBundle.id,
      reviewAssessmentId: first.reviewAssessment.id,
      feedbackDeltaId: first.feedbackDelta.id
    };
  } finally {
    await retryClient.end();
  }
};

const expectRejectedEvidenceFeedback = async (
  repository: HarnessEvidenceRepository,
  input: Parameters<NonNullable<HarnessEvidenceRepository["createEvidenceFeedbackOnce"]>>[0]
): Promise<void> => {
  if (repository.createEvidenceFeedbackOnce === undefined) {
    throw new Error("Harness evidence fault proof requires atomic evidence feedback persistence");
  }

  await expectPromiseToReject(
    repository.createEvidenceFeedbackOnce.call(repository, input)
  );
};

const expectPromiseToReject = async (promise: Promise<unknown>): Promise<void> => {
  try {
    await promise;
  } catch {
    return;
  }

  throw new Error("Harness evidence fault injection unexpectedly committed");
};

type AtomicEvidenceFeedbackInput = Parameters<
  NonNullable<HarnessEvidenceRepository["createEvidenceFeedbackOnce"]>
>[0];

const evidenceFeedbackFaultStages = [
  "after_evidence_bundle",
  "after_review_assessment",
  "after_feedback_delta",
  "after_maintenance_queue"
] as const;

const smokeCountValue = (rows: readonly { count: number }[]): number =>
  rows[0]?.count ?? 0;

const faultRowCountsFor = async (
  db: KrnDatabase,
  faultIdentity: string,
  maintenanceReason: string
): Promise<readonly number[]> => [
  smokeCountValue(await db
    .select({ count: sql<number>`count(*)::int` })
    .from(evidenceBundles)
    .where(eq(evidenceBundles.captureIdentity, faultIdentity))),
  smokeCountValue(await db
    .select({ count: sql<number>`count(*)::int` })
    .from(reviewAssessments)
    .innerJoin(evidenceBundles, eq(reviewAssessments.evidenceBundleId, evidenceBundles.id))
    .where(eq(evidenceBundles.captureIdentity, faultIdentity))),
  smokeCountValue(await db
    .select({ count: sql<number>`count(*)::int` })
    .from(feedbackDeltas)
    .where(sql`${feedbackDeltas.metadata}->>'captureIdentity' = ${faultIdentity}`)),
  smokeCountValue(await db
    .select({ count: sql<number>`count(*)::int` })
    .from(outboxEvents)
    .where(sql`${outboxEvents.payload}->>'captureIdentity' = ${faultIdentity}`)),
  smokeCountValue(await db
    .select({ count: sql<number>`count(*)::int` })
    .from(maintenanceQueues)
    .where(sql`${maintenanceQueues.payload}->>'reason' = ${maintenanceReason}`))
];

const verifyEvidenceFeedbackFaultStage = async (
  input: SmokeFeedbackDeltaInput,
  atomicInput: AtomicEvidenceFeedbackInput,
  faultStage: (typeof evidenceFeedbackFaultStages)[number]
): Promise<void> => {
  const faultIdentity = `${atomicInput.captureIdentity}:fault:${faultStage}`;
  const maintenanceReason = `Fault-injection maintenance proof ${faultIdentity}`;
  const faultClient = postgres(input.databaseUrl, { max: 1, onnotice: () => undefined });

  try {
    const faultRepository = new DrizzleHarnessRunRepository(
      createKrnDatabase(faultClient),
      {
        faultAfterStage: (stage) => {
          if (stage === faultStage) {
            throw new Error(`Injected evidence feedback failure at ${stage}`);
          }
        }
      }
    );
    await expectRejectedEvidenceFeedback(faultRepository, {
      ...atomicInput,
      captureIdentity: faultIdentity,
      evidence: {
        ...atomicInput.evidence,
        metadata: {
          ...atomicInput.evidence.metadata,
          smokeId: faultIdentity
        }
      },
      maintenance: {
        reason: maintenanceReason
      }
    });
  } finally {
    await faultClient.end();
  }

  const counts = await faultRowCountsFor(input.db, faultIdentity, maintenanceReason);

  if (counts.some((count) => count !== 0)) {
    throw new Error(
      `Harness evidence fault injection left partial rows at ${faultStage}: ${counts.join(",")}`
    );
  }
};

const verifyEvidenceFeedbackFaultInjection = async (
  input: SmokeFeedbackDeltaInput,
  atomicInput: AtomicEvidenceFeedbackInput
): Promise<void> => {
  for (const faultStage of evidenceFeedbackFaultStages) {
    await verifyEvidenceFeedbackFaultStage(input, atomicInput, faultStage);
  }
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
      await db
        .delete(maintenanceQueues)
        .where(sql`${maintenanceQueues.payload}->>'feedbackDeltaId' = ${otherFeedbackDeltaId}`);
    }

    if (feedbackDeltaId !== undefined) {
      await db
        .delete(maintenanceQueues)
        .where(sql`${maintenanceQueues.payload}->>'feedbackDeltaId' = ${feedbackDeltaId}`);
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
      db,
      databaseUrl: input.databaseUrl,
      projectId: project.id,
      executionRunId: executionRun.id,
      sourceRunLifecycleRevision: executionRun.lifecycleRevision,
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
      },
      maintenance: {
        reason: "Atomic harness evidence smoke maintenance proof."
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
      db,
      databaseUrl: input.databaseUrl,
      projectId: otherProject.id,
      executionRunId: otherExecutionRun.id,
      sourceRunLifecycleRevision: otherExecutionRun.lifecycleRevision,
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
    const exactFeedbackLookup = await harnessRunRepository.getFeedbackDeltaForProject(
      project.id,
      feedbackDelta.feedbackDeltaId
    );
    const wrongProjectFeedbackLookup = await harnessRunRepository.getFeedbackDeltaForProject(
      otherProject.id,
      feedbackDelta.feedbackDeltaId
    );
    const missingFeedbackLookup = await harnessRunRepository.getFeedbackDeltaForProject(
      project.id,
      "00000000-0000-4000-8000-000000000000"
    );
    const exactFeedbackLookupFound =
      exactFeedbackLookup.status === "found" &&
      exactFeedbackLookup.feedbackDelta.id === feedbackDelta.feedbackDeltaId;
    const wrongProjectFeedbackLookupClosed = wrongProjectFeedbackLookup.status === "wrong_project";
    const missingFeedbackLookupDistinct = missingFeedbackLookup.status === "missing";
    const otherProjectFeedbackDeltaExcluded =
      projectFeedbackDeltas.every((delta) => delta.id !== otherFeedbackDelta.feedbackDeltaId);

    if (
      projectFeedbackDeltas.length !== 103 ||
      !subjectFeedbackRelevant ||
      subjectFeedbackDeltas.length !== 1 ||
      !sourceSubjectFeedbackRetrieved ||
      !exactFeedbackLookupFound ||
      !wrongProjectFeedbackLookupClosed ||
      !missingFeedbackLookupDistinct ||
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
    const feedbackOutboxEventCount = (await db
      .select({ count: sql<number>`count(*)::int` })
      .from(outboxEvents)
      .where(sql`${outboxEvents.payload}->>'feedbackDeltaId' = ${feedbackDelta.feedbackDeltaId}`))[0]?.count ?? 0;
    const feedbackMaintenanceQueueCount = (await db
      .select({ count: sql<number>`count(*)::int` })
      .from(maintenanceQueues)
      .where(sql`${maintenanceQueues.payload}->>'feedbackDeltaId' = ${feedbackDelta.feedbackDeltaId}`))[0]?.count ?? 0;

    if (
      evidenceBundleCount !== 1 ||
      reviewAssessmentCount !== 1 ||
      feedbackDeltaCount !== 103 ||
      runEventCount !== 2 ||
      feedbackOutboxEventCount !== 1 ||
      feedbackMaintenanceQueueCount !== 1
    ) {
      throw new Error(
        `Harness evidence smoke readback did not match linked records: evidence=${evidenceBundleCount}, review=${reviewAssessmentCount}, feedback=${feedbackDeltaCount}, events=${runEventCount}, outbox=${feedbackOutboxEventCount}, maintenance=${feedbackMaintenanceQueueCount}`
      );
    }

    const remainingMarkerCount = await cleanup();

    return {
      workspaceSlug,
      projectSlug,
      executionRunId: executionRun.id,
      evidenceBundleId: feedbackDelta.evidenceBundleId,
      reviewAssessmentId: feedbackDelta.reviewAssessmentId,
      feedbackDeltaId: feedbackDelta.feedbackDeltaId,
      feedbackOutboxEventCount,
      feedbackMaintenanceQueueCount,
      runEventCount,
      evidenceBundleCount,
      reviewAssessmentCount,
      feedbackDeltaCount,
      projectFeedbackDeltaCount: projectFeedbackDeltas.length,
      subjectFeedbackDeltaCount: subjectFeedbackDeltas.length,
      subjectFeedbackRelevant,
      sourceSubjectFeedbackRetrieved,
      exactFeedbackLookupFound,
      wrongProjectFeedbackLookupClosed,
      missingFeedbackLookupDistinct,
      otherProjectFeedbackDeltaCount: otherProjectFeedbackDeltas.length,
      otherProjectFeedbackDeltaExcluded,
      remainingMarkerCount,
      cleanedUp: remainingMarkerCount === 0
    };
  } finally {
    await client.end();
  }
};
