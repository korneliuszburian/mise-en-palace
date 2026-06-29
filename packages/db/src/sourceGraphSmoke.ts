import { eq, sql } from "drizzle-orm";
import {
  compileHarnessPlan
} from "@krn/harness";

import type { KrnDatabase } from "./database.js";
import {
  countSmokeRows,
  createSmokeDatabase,
  createSmokeProjectRecords,
  ensureSmokeBrainStoreReady,
  normalizeSmokeSlugPart,
  optionalSmokeCount,
  sumSmokeCountTasks
} from "./dbSmokeSupport.js";
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
  sourceArtifacts,
  sourceClaimEdges,
  sourceClaims,
  sourceDecisions,
  sourceDecisionEdges,
  sourceRejections,
  workspaces
} from "./schema/index.js";

export interface SourceGraphSmokeInput {
  databaseUrl: string;
  migrationsFolder: string;
  smokeId: string;
}

export interface SourceGraphSmokeReport {
  workspaceSlug: string;
  projectSlug: string;
  executionRunId: string;
  sourceArtifactId: string;
  sourceClaimId: string;
  temporalSourceClaimId: string;
  readBackSourceClaimId: string;
  sourceClaimEdgeId: string;
  sourceDecisionId: string;
  sourceDecisionEdgeId: string;
  sourceRejectionId: string;
  runClaimCount: number;
  sourceClaimEdgeCount: number;
  runDecisionEdgeCount: number;
  rejectionCount: number;
  outboxEventCount: number;
  remainingMarkerCount: number;
  cleanedUp: boolean;
}

const countRows = async (
  db: KrnDatabase,
  workspaceSlug: string,
  marker: string,
  retrievalRunId: string | undefined
): Promise<number> => {
  return sumSmokeCountTasks([
    () => countSmokeRows(db, workspaces, eq(workspaces.slug, workspaceSlug)),
    () => countSmokeRows(db, sourceArtifacts, sql`${sourceArtifacts.metadata}->>'smokeId' = ${marker}`),
    () => countSmokeRows(db, sourceClaims, sql`${sourceClaims.metadata}->>'smokeId' = ${marker}`),
    () => countSmokeRows(db, sourceClaimEdges, sql`${sourceClaimEdges.metadata}->>'smokeId' = ${marker}`),
    () => countSmokeRows(db, sourceDecisions, sql`${sourceDecisions.metadata}->>'smokeId' = ${marker}`),
    () => countSmokeRows(db, sourceDecisionEdges, sql`${sourceDecisionEdges.metadata}->>'smokeId' = ${marker}`),
    () => countSmokeRows(db, sourceRejections, sql`${sourceRejections.metadata}->>'smokeId' = ${marker}`),
    () => countSmokeRows(db, runEvents, sql`${runEvents.payload}->>'smokeId' = ${marker}`),
    () => countSmokeRows(db, outboxEvents, sql`${outboxEvents.payload}->>'smokeId' = ${marker}`),
    optionalSmokeCount(
      retrievalRunId,
      (id) => countSmokeRows(db, retrievalRuns, eq(retrievalRuns.id, id))
    )
  ]);
};

export const runSourceGraphSmokeCheck = async (
  input: SourceGraphSmokeInput
): Promise<SourceGraphSmokeReport> => {
  await ensureSmokeBrainStoreReady(
    input.databaseUrl,
    input.migrationsFolder,
    "source graph smoke"
  );

  const marker = normalizeSmokeSlugPart(input.smokeId);
  const workspaceSlug = `krn-source-graph-smoke-${marker}`;
  const projectSlug = "source-graph-persistence";
  const task = `source graph persistence smoke ${marker}`;
  const { client, db } = createSmokeDatabase(input.databaseUrl);
  let retrievalRunId: string | undefined;

  const cleanup = async (): Promise<number> => {
    await db.delete(outboxEvents).where(sql`${outboxEvents.payload}->>'smokeId' = ${marker}`);
    await db.delete(sourceRejections).where(sql`${sourceRejections.metadata}->>'smokeId' = ${marker}`);
    await db.delete(sourceDecisionEdges).where(sql`${sourceDecisionEdges.metadata}->>'smokeId' = ${marker}`);
    await db.delete(sourceDecisions).where(sql`${sourceDecisions.metadata}->>'smokeId' = ${marker}`);
    await db.delete(sourceClaimEdges).where(sql`${sourceClaimEdges.metadata}->>'smokeId' = ${marker}`);
    await db.delete(sourceClaims).where(sql`${sourceClaims.metadata}->>'smokeId' = ${marker}`);
    await db.delete(sourceArtifacts).where(sql`${sourceArtifacts.metadata}->>'smokeId' = ${marker}`);
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
    const sourceRepository = new DrizzleSourceRepository(db);
    const { workspace, project } = await createSmokeProjectRecords(
      projectRepository,
      workspaceSlug,
      projectSlug,
      marker
    );
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
          constraints: ["persist source claims and source decision edges"],
          nonGoals: ["do not mutate runtime markdown memory"],
          acceptance: ["read back source graph records and clean smoke rows"],
          metadata: {
            smokeId: marker
          }
        },
        tokenBudget: 1200,
        metadata: {
          command: "db:smoke:source-graph",
          smokeId: marker
        }
      },
      {
        harnessRunRepository,
        memoryRepository: new DrizzleMemoryRepository(db),
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
        type: "smoke.source_graph.plan_persisted",
        message: "Source graph smoke plan created",
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
      uri: `operator://source-graph-smoke/${marker}`,
      title: "Source graph smoke source",
      contentHash: `source-graph-smoke-${marker}`,
      metadata: {
        smokeId: marker
      }
    });
    const sourceClaim = await sourceRepository.createSourceClaim({
      sourceArtifactId: sourceArtifact.id,
      executionRunId: executionRun.id,
      claim: "KRN should persist source claims and typed source decision edges.",
      mechanism: "Postgres stores harness runs and source graph records transactionally.",
      krnImplication: "KRN can link source reasoning to a concrete execution run.",
      doesNotProve: "This does not prove source ranking or retrieval quality.",
      trustTier: "project-decision",
      supportType: "implementation-boundary",
      consumer: "M22 source graph smoke",
      falsifier: "Source graph smoke readback or cleanup fails.",
      revisitWhen: "Source graph repository contract changes.",
      status: "proposed",
      metadata: {
        smokeId: marker
      }
    });
    const staleSourceClaim = await sourceRepository.createSourceClaim({
      sourceArtifactId: sourceArtifact.id,
      executionRunId: executionRun.id,
      claim: "Source graph smoke only needs source decision edges.",
      mechanism: "Before B-01, source claim edge relations existed but were not repository-visible.",
      krnImplication: "KRN could miss temporal invalidation between source claims.",
      doesNotProve: "This older claim is safe after temporal claim edges exist.",
      trustTier: "project-decision",
      supportType: "implementation-boundary",
      consumer: "B-01 temporal source graph smoke",
      falsifier: "Temporal claim edge readback or cleanup fails.",
      revisitWhen: "Temporal source graph semantics change.",
      status: "proposed",
      metadata: {
        smokeId: marker
      }
    });
    const readBackClaim = await sourceRepository.getSourceClaimById(sourceClaim.id);
    const sourceClaimEdge = await sourceRepository.createSourceClaimEdge({
      fromSourceClaimId: sourceClaim.id,
      toSourceClaimId: staleSourceClaim.id,
      kind: "invalidates",
      metadata: {
        smokeId: marker,
        consumer: "B-01 temporal source graph smoke",
        scope: "source graph repository readback",
        evidenceRef: executionRun.id,
        doesNotProve: "This temporal edge does not prove activation uses invalidation yet."
      }
    });
    const sourceDecision = await sourceRepository.createSourceDecision({
      projectId: project.id,
      sourceClaimId: sourceClaim.id,
      status: "adopt",
      decision: "Adopt source_claim_edges as the first temporal claim graph substrate.",
      rationale: `Temporal edge ${sourceClaimEdge.id} invalidates an older source graph claim without adding a graph database.`,
      falsifier: "Temporal source claim edges cannot be created, read back, or cleaned up.",
      consumer: "B-01 temporal source graph smoke",
      metadata: {
        smokeId: marker,
        sourceClaimEdgeId: sourceClaimEdge.id
      }
    });
    const sourceDecisionEdge = await sourceRepository.createSourceDecisionEdge({
      sourceClaimId: sourceClaim.id,
      targetType: "harness_run",
      targetId: executionRun.id,
      supportType: "implementation-boundary",
      confidence: "medium",
      notes: "Used to prove M22 source graph linkage to a persisted run.",
      metadata: {
        smokeId: marker
      }
    });
    const sourceRejection = await sourceRepository.createSourceRejection({
      projectId: project.id,
      executionRunId: executionRun.id,
      title: "Decorative source smoke example",
      attemptedClaim: "An interesting AI link should influence KRN behavior.",
      rejectedBecause: "decorative",
      reason: "No mechanism, consumer, or decision support.",
      doesNotProve: "The link should become trusted KRN context.",
      consumer: "M22 source graph smoke",
      metadata: {
        smokeId: marker
      }
    });
    const runClaims = await sourceRepository.listSourceClaimsForRun(executionRun.id);
    const runDecisionEdges = await sourceRepository.listSourceDecisionEdgesForRun(
      executionRun.id
    );
    const sourceClaimEdgesForClaim = await sourceRepository.listSourceClaimEdgesForClaim(
      sourceClaim.id
    );
    const rejectionRows = await db
      .select()
      .from(sourceRejections)
      .where(eq(sourceRejections.id, sourceRejection.id));
    const outboxRows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(outboxEvents)
      .where(sql`${outboxEvents.payload}->>'smokeId' = ${marker}`);

    if (
      readBackClaim?.id !== sourceClaim.id ||
      !runClaims.some((claim) => claim.id === sourceClaim.id) ||
      !runDecisionEdges.some(
        (edge) =>
          edge.id === sourceDecisionEdge.id &&
          edge.sourceClaimId === sourceClaim.id &&
          edge.targetId === executionRun.id
      ) ||
      !sourceClaimEdgesForClaim.some(
        (edge) =>
          edge.id === sourceClaimEdge.id &&
          edge.kind === "invalidates" &&
          edge.fromSourceClaimId === sourceClaim.id &&
          edge.toSourceClaimId === staleSourceClaim.id
      ) ||
      rejectionRows.length !== 1 ||
      rejectionRows[0]?.id !== sourceRejection.id ||
      (outboxRows[0]?.count ?? 0) < 2
    ) {
      throw new Error("Source graph smoke readback did not match persisted records");
    }

    const remainingMarkerCount = await cleanup();

    return {
      workspaceSlug,
      projectSlug,
      executionRunId: executionRun.id,
      sourceArtifactId: sourceArtifact.id,
      sourceClaimId: sourceClaim.id,
      temporalSourceClaimId: staleSourceClaim.id,
      readBackSourceClaimId: readBackClaim.id,
      sourceClaimEdgeId: sourceClaimEdge.id,
      sourceDecisionId: sourceDecision.id,
      sourceDecisionEdgeId: sourceDecisionEdge.id,
      sourceRejectionId: sourceRejection.id,
      runClaimCount: runClaims.length,
      sourceClaimEdgeCount: sourceClaimEdgesForClaim.length,
      runDecisionEdgeCount: runDecisionEdges.length,
      rejectionCount: rejectionRows.length,
      outboxEventCount: outboxRows[0]?.count ?? 0,
      remainingMarkerCount,
      cleanedUp: remainingMarkerCount === 0
    };
  } finally {
    await client.end();
  }
};
