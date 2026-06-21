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
  outboxEvents,
  retrievalRuns,
  runEvents,
  workspaces
} from "./schema/index.js";

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
  retrievalRunId: string | undefined,
  feedbackDeltaId: string | undefined
): Promise<number> => {
  const workspaceRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(workspaces)
    .where(eq(workspaces.slug, workspaceSlug));
  const eventRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(runEvents)
    .where(sql`${runEvents.payload}->>'smokeId' = ${marker}`);
  const retrievalRows =
    retrievalRunId === undefined
      ? [{ count: 0 }]
      : await db
          .select({ count: sql<number>`count(*)::int` })
          .from(retrievalRuns)
          .where(eq(retrievalRuns.id, retrievalRunId));
  const outboxRows =
    feedbackDeltaId === undefined
      ? [{ count: 0 }]
      : await db
          .select({ count: sql<number>`count(*)::int` })
          .from(outboxEvents)
          .where(sql`${outboxEvents.payload}->>'feedbackDeltaId' = ${feedbackDeltaId}`);

  return (
    (workspaceRows[0]?.count ?? 0) +
    (eventRows[0]?.count ?? 0) +
    (retrievalRows[0]?.count ?? 0) +
    (outboxRows[0]?.count ?? 0)
  );
};

export const runHarnessEvidenceSmokeCheck = async (
  input: HarnessEvidenceSmokeInput
): Promise<HarnessEvidenceSmokeReport> => {
  const readiness = await runMigrationReadinessCheck({
    databaseUrl: input.databaseUrl,
    migrationsFolder: input.migrationsFolder
  });

  if (!readiness.migrationsVerified || !readiness.pgvectorAvailable) {
    throw new Error("Brain store is not ready for harness evidence smoke");
  }

  const marker = normalizeSlugPart(input.smokeId);
  const workspaceSlug = `krn-evidence-smoke-${marker}`;
  const projectSlug = "persisted-harness-evidence";
  const task = `persisted harness evidence smoke ${marker}`;
  const client = postgres(input.databaseUrl, {
    max: 1,
    onnotice: () => undefined
  });
  const db = createKrnDatabase(client);
  let retrievalRunId: string | undefined;
  let feedbackDeltaId: string | undefined;

  const cleanup = async (): Promise<number> => {
    await db.delete(runEvents).where(sql`${runEvents.payload}->>'smokeId' = ${marker}`);

    if (feedbackDeltaId !== undefined) {
      await db
        .delete(outboxEvents)
        .where(sql`${outboxEvents.payload}->>'feedbackDeltaId' = ${feedbackDeltaId}`);
    }

    if (retrievalRunId !== undefined) {
      await db.delete(retrievalRuns).where(eq(retrievalRuns.id, retrievalRunId));
    }

    await db.delete(workspaces).where(eq(workspaces.slug, workspaceSlug));

    return countRows(db, workspaceSlug, marker, retrievalRunId, feedbackDeltaId);
  };

  try {
    await cleanup();

    const projectRepository = new DrizzleProjectRepository(db);
    const harnessRunRepository = new DrizzleHarnessRunRepository(db);
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
          constraints: ["preserve strict TypeScript boundaries"],
          nonGoals: ["do not mutate memory"],
          acceptance: ["read back persisted evidence records"],
          metadata: {
            smokeId: marker
          }
        },
        tokenBudget: 1200,
        metadata: {
          command: "db:smoke:harness-evidence",
          smokeId: marker
        }
      },
      {
        harnessRunRepository,
        memoryRepository: new DrizzleMemoryRepository(db),
        sourceRepository: new DrizzleSourceRepository(db),
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
        type: "smoke.harness_evidence.plan_persisted",
        message: "Persisted harness evidence smoke plan created",
        payload: {
          smokeId: marker
        }
      },
      metadata: {
        smokeId: marker,
        evidenceContract: result.evidenceContract
      }
    });
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
