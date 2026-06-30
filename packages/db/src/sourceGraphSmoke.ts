import { eq, sql } from "drizzle-orm";

import {
  assertSmokeReadbackChecks,
  cleanupSourceGraphSmokeRows,
  countSourceGraphSmokeMarkerRows,
  createCompiledSmokeExecution,
  createSmokeRuntime,
  requireSmokeReadbackValue
} from "./dbSmokeSupport.js";
import {
  outboxEvents,
  sourceRejections
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

export const runSourceGraphSmokeCheck = async (
  input: SourceGraphSmokeInput
): Promise<SourceGraphSmokeReport> => {
  const runtime = await createSmokeRuntime({
    databaseUrl: input.databaseUrl,
    migrationsFolder: input.migrationsFolder,
    projectSlug: "source-graph-persistence",
    smokeId: input.smokeId,
    smokeName: "source graph smoke",
    workspacePrefix: "krn-source-graph-smoke"
  });
  const { client, db, marker, projectSlug, workspaceSlug } = runtime;
  const task = `source graph persistence smoke ${marker}`;
  let retrievalRunId: string | undefined;

  const cleanup = async (): Promise<number> => {
    await cleanupSourceGraphSmokeRows({
      db,
      marker,
      retrievalRunId,
      workspaceSlug
    });

    return countSourceGraphSmokeMarkerRows({
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
      project,
      retrievalRunId: compiledRetrievalRunId,
      sourceRepository
    } = await createCompiledSmokeExecution({
      acceptance: "read back source graph records and clean smoke rows",
      command: "db:smoke:source-graph",
      constraints: ["persist source claims and source decision edges"],
      db,
      eventMessage: "Source graph smoke plan created",
      eventType: "smoke.source_graph.plan_persisted",
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

    const readbackError = "Source graph smoke readback did not match persisted records";

    assertSmokeReadbackChecks([
      { label: "source claim readback", passed: readBackClaim?.id === sourceClaim.id },
      {
        label: "run source claim listed",
        passed: runClaims.some((claim) => claim.id === sourceClaim.id)
      },
      {
        label: "run decision edge listed",
        passed: runDecisionEdges.some(
          (edge) =>
            edge.id === sourceDecisionEdge.id &&
            edge.sourceClaimId === sourceClaim.id &&
            edge.targetId === executionRun.id
        )
      },
      {
        label: "source claim invalidation edge listed",
        passed: sourceClaimEdgesForClaim.some(
          (edge) =>
            edge.id === sourceClaimEdge.id &&
            edge.kind === "invalidates" &&
            edge.fromSourceClaimId === sourceClaim.id &&
            edge.toSourceClaimId === staleSourceClaim.id
        )
      },
      { label: "source rejection row count", passed: rejectionRows.length === 1 },
      {
        label: "source rejection readback",
        passed: rejectionRows[0]?.id === sourceRejection.id
      },
      { label: "outbox events created", passed: (outboxRows[0]?.count ?? 0) >= 2 }
    ], readbackError);

    const persistedSourceClaim = requireSmokeReadbackValue(
      readBackClaim,
      "source claim readback",
      readbackError
    );

    const remainingMarkerCount = await cleanup();

    return {
      workspaceSlug,
      projectSlug,
      executionRunId: executionRun.id,
      sourceArtifactId: sourceArtifact.id,
      sourceClaimId: sourceClaim.id,
      temporalSourceClaimId: staleSourceClaim.id,
      readBackSourceClaimId: persistedSourceClaim.id,
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
