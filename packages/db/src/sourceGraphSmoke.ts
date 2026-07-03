import { eq, sql } from "drizzle-orm";
import {
  retrieveActivationCandidates
} from "@krn/harness";

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
  duplicateSourceClaimId: string;
  readBackSourceClaimId: string;
  sourceClaimEdgeId: string;
  duplicateSourceClaimEdgeId: string;
  sourceDecisionId: string;
  sourceDecisionEdgeId: string;
  sourceRejectionId: string;
  runClaimCount: number;
  sourceClaimEdgeCount: number;
  activationCandidateCount: number;
  rankedDownSourceClaimId: string;
  sourceGraphRankDownCount: number;
  sourceGraphRankDownEdgeKinds: string[];
  influencedSourceClaimId: string;
  sourceGraphInfluenceCount: number;
  sourceGraphInfluenceEdgeKinds: string[];
  runDecisionEdgeCount: number;
  rejectionCount: number;
  outboxEventCount: number;
  remainingMarkerCount: number;
  cleanedUp: boolean;
}

interface SourceGraphRankDownMetadata {
  edgeKinds: string[];
}

interface SourceGraphInfluenceMetadata {
  edgeKinds: string[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isSourceGraphRankDownMetadata = (
  value: unknown
): value is SourceGraphRankDownMetadata => {
  if (!isRecord(value) || !Array.isArray(value.edgeKinds)) {
    return false;
  }

  return value.edgeKinds.every((edgeKind) => typeof edgeKind === "string");
};

const isSourceGraphInfluenceMetadata = (
  value: unknown
): value is SourceGraphInfluenceMetadata => {
  if (!isRecord(value) || !Array.isArray(value.edgeKinds)) {
    return false;
  }

  return value.edgeKinds.every((edgeKind) => typeof edgeKind === "string");
};

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
      memoryRepository,
      project,
      retrievalRunId: compiledRetrievalRunId,
      result,
      retrievalRepository,
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
    const duplicateSourceClaim = await sourceRepository.createSourceClaim({
      sourceArtifactId: sourceArtifact.id,
      executionRunId: executionRun.id,
      claim: "Source graph smoke has adjacent duplicate relation evidence.",
      mechanism: "A duplicate SourceClaimEdge keeps relation evidence reviewable without merging source truth.",
      krnImplication: "KRN can surface adjacent graph context while preserving proof boundaries.",
      doesNotProve: "This duplicate relation does not prove the claims are true duplicates.",
      trustTier: "project-decision",
      supportType: "implementation-boundary",
      consumer: "B-02 duplicate source graph smoke",
      falsifier: "Duplicate source claim edge influence is absent from activation readback.",
      revisitWhen: "Source graph influence semantics change.",
      status: "proposed",
      metadata: {
        smokeId: marker
      }
    });
    const readBackClaim = await sourceRepository.getSourceClaimById(sourceClaim.id);
    const sourceDecision = await sourceRepository.createSourceDecision({
      projectId: project.id,
      sourceClaimId: sourceClaim.id,
      status: "adopt",
      decision: "Adopt source graph smoke claim as source graph support.",
      rationale:
        "The claim has an explicit mechanism, consumer, falsifier, and bounded non-proof.",
      falsifier: "Source graph smoke cannot read back accepted claim support.",
      consumer: "M22 source graph smoke",
      metadata: {
        smokeId: marker
      }
    });
    await sourceRepository.createSourceDecision({
      projectId: project.id,
      sourceClaimId: staleSourceClaim.id,
      status: "adopt",
      decision: "Adopt legacy source graph claim before relation invalidation.",
      rationale:
        "SourceClaimEdge support is decision-grade and requires accepted endpoint claims before it can express invalidation.",
      falsifier: "Temporal source claim edge cannot link accepted endpoint claims.",
      consumer: "B-01 temporal source graph smoke",
      metadata: {
        smokeId: marker
      }
    });
    await sourceRepository.createSourceDecision({
      projectId: project.id,
      sourceClaimId: duplicateSourceClaim.id,
      status: "adopt",
      decision: "Adopt duplicate source graph claim before relation influence.",
      rationale:
        "Duplicate SourceClaimEdge influence requires accepted endpoint claims before activation can surface graph context.",
      falsifier: "Duplicate source claim edge cannot link accepted endpoint claims.",
      consumer: "B-02 duplicate source graph smoke",
      metadata: {
        smokeId: marker
      }
    });
    const sourceClaimEdge = await sourceRepository.createSourceClaimEdge({
      fromSourceClaimId: sourceClaim.id,
      toSourceClaimId: staleSourceClaim.id,
      kind: "invalidates",
      metadata: {
        smokeId: marker,
        consumer: "B-01 temporal source graph smoke",
        scope: "source graph repository readback",
        evidenceRef: executionRun.id,
        doesNotProve: "This temporal edge does not prove source truth or broad source graph ranking quality."
      }
    });
    const duplicateSourceClaimEdge = await sourceRepository.createSourceClaimEdge({
      fromSourceClaimId: sourceClaim.id,
      toSourceClaimId: duplicateSourceClaim.id,
      kind: "duplicates",
      metadata: {
        smokeId: marker,
        consumer: "B-02 duplicate source graph smoke",
        scope: "source graph activation readback",
        evidenceRef: executionRun.id,
        doesNotProve: "This duplicate edge does not prove source truth or broad source graph ranking quality."
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
    const activationReadback = await retrieveActivationCandidates({
      taskContract: result.taskContract,
      limits: {
        memory: 0,
        source: 10,
        search: 0,
        antiMemory: 0
      },
      repositories: {
        memoryRepository,
        sourceRepository,
        retrievalRepository
      }
    });
    const rankedDownCandidate = activationReadback.candidates.find((candidate) =>
      candidate.subjectType === "source_claim" &&
      candidate.subjectId === staleSourceClaim.id &&
      isSourceGraphRankDownMetadata(candidate.metadata.sourceClaimEdgeRankDown)
    );
    const sourceGraphRankDown = isSourceGraphRankDownMetadata(
      rankedDownCandidate?.metadata.sourceClaimEdgeRankDown
    )
      ? rankedDownCandidate.metadata.sourceClaimEdgeRankDown
      : undefined;
    const sourceGraphRankDownEdgeKinds = sourceGraphRankDown?.edgeKinds ?? [];
    const influencedCandidate = activationReadback.candidates.find((candidate) =>
      candidate.subjectType === "source_claim" &&
      candidate.subjectId === duplicateSourceClaim.id &&
      isSourceGraphInfluenceMetadata(candidate.metadata.sourceClaimEdgeInfluence)
    );
    const sourceGraphInfluence = isSourceGraphInfluenceMetadata(
      influencedCandidate?.metadata.sourceClaimEdgeInfluence
    )
      ? influencedCandidate.metadata.sourceClaimEdgeInfluence
      : undefined;
    const sourceGraphInfluenceEdgeKinds = sourceGraphInfluence?.edgeKinds ?? [];
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
      {
        label: "source claim duplicate edge listed",
        passed: sourceClaimEdgesForClaim.some(
          (edge) =>
            edge.id === duplicateSourceClaimEdge.id &&
            edge.kind === "duplicates" &&
            edge.fromSourceClaimId === sourceClaim.id &&
            edge.toSourceClaimId === duplicateSourceClaim.id
        )
      },
      {
        label: "activation source graph rank-down readback",
        passed: sourceGraphRankDownEdgeKinds.includes("invalidates")
      },
      {
        label: "activation source graph influence readback",
        passed: sourceGraphInfluenceEdgeKinds.includes("duplicates")
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
      duplicateSourceClaimId: duplicateSourceClaim.id,
      readBackSourceClaimId: persistedSourceClaim.id,
      sourceClaimEdgeId: sourceClaimEdge.id,
      duplicateSourceClaimEdgeId: duplicateSourceClaimEdge.id,
      sourceDecisionId: sourceDecision.id,
      sourceDecisionEdgeId: sourceDecisionEdge.id,
      sourceRejectionId: sourceRejection.id,
      runClaimCount: runClaims.length,
      sourceClaimEdgeCount: sourceClaimEdgesForClaim.length,
      activationCandidateCount: activationReadback.candidates.length,
      rankedDownSourceClaimId: rankedDownCandidate?.subjectId ?? "missing",
      sourceGraphRankDownCount: rankedDownCandidate === undefined ? 0 : 1,
      sourceGraphRankDownEdgeKinds,
      influencedSourceClaimId: influencedCandidate?.subjectId ?? "missing",
      sourceGraphInfluenceCount: influencedCandidate === undefined ? 0 : 1,
      sourceGraphInfluenceEdgeKinds,
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
