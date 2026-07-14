import { eq, sql } from "drizzle-orm";
import {
  buildSourceConsensusTimelineReadback
} from "@krn/core";
import {
  retrieveActivationCandidates
} from "@krn/harness";
import type {
  SourceClaim,
  SourceClaimEdge,
  SourceDecision,
  SourceDecisionEdge,
  SourceConsensusTimelineReadback
} from "@krn/core";
import type {
  SourceRepository
} from "@krn/core/repositories";
import type { KrnDatabase } from "../../database.js";
import type { SourceClaimTransitionSmokeReport } from "./source-claim-transition-smoke.js";

import {
  assertSmokeReadbackChecks,
  cleanupSourceGraphSmokeRows,
  countSourceGraphSmokeMarkerRows,
  createCompiledSmokeExecution,
  createSmokeRuntime,
  requireSmokeReadbackValue
} from "./db-smoke-support.js";
import { runSourceClaimTransitionSmokeCheck } from "./source-claim-transition-smoke.js";
import {
  outboxEvents,
  sourceDecisionEdges,
  sourceRejections
} from "../../schema/index.js";
import { DrizzleProjectRepository } from "../../repositories/drizzle-project-repository.js";

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
  rejectedSourceClaimId: string;
  readBackSourceClaimId: string;
  sourceClaimEdgeId: string;
  duplicateSourceClaimEdgeId: string;
  missingSupportSourceClaimEdgeId: string;
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
  sourceConsensusCurrentAuthorityCount: number;
  sourceConsensusHistoricalCount: number;
  sourceConsensusSupersededCount: number;
  sourceConsensusRejectedCount: number;
  sourceConsensusRelationEvidenceGapCount: number;
  projectIsolationRejectedWrites: number;
  unscopedForeignSourceClaimReadLeaks: boolean;
  scopedForeignSourceDecisionReadRejected: boolean;
  scopedForeignSourceClaimEdgeReadRejected: boolean;
  sourceDecisionIdentityReadbackPassed: boolean;
  legacyDecisionEdgeExcluded: boolean;
  outboxEventCount: number;
  sourceClaimTransition: SourceClaimTransitionSmokeReport;
  remainingMarkerCount: number;
  cleanedUp: boolean;
}

interface SourceGraphRankDownMetadata {
  edgeKinds: string[];
}

interface SourceGraphInfluenceMetadata {
  edgeKinds: string[];
}

interface SourceConsensusTimelineSmokeReadback {
  rejectedSourceClaimId: string;
  missingSupportSourceClaimEdgeId: string;
  sourceRejectionId: string;
  currentAuthorityReadbackPassed: boolean;
  historicalReadbackPassed: boolean;
  rejectedReadbackPassed: boolean;
  relationEvidenceGapReadbackPassed: boolean;
  currentAuthorityCount: number;
  historicalCount: number;
  supersededCount: number;
  rejectedCount: number;
  relationEvidenceGapCount: number;
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

const capturedCurrentEvidenceMetadata = (
  marker: string,
  scope: string
): Record<string, string> => ({
  smokeId: marker,
  evidenceStatus: "captured",
  evidenceContentHash: `sha256:source-graph-evidence:${marker}:${scope}`,
  evidenceFreshness: "current"
});

const sourceWriteRejectedFor = async (
  operation: () => Promise<unknown>,
  expectedMessage: string
): Promise<boolean> => {
  try {
    await operation();
    return false;
  } catch (error) {
    return error instanceof Error && error.message.includes(expectedMessage);
  }
};

interface SourceProjectIsolationSmokeProof {
  projectIsolationRejectedWrites: number;
  unscopedForeignSourceClaimReadLeaks: boolean;
  scopedForeignSourceDecisionReadRejected: boolean;
  scopedForeignSourceClaimEdgeReadRejected: boolean;
  sourceDecisionIdentityReadbackPassed: boolean;
  legacyDecisionEdgeExcluded: boolean;
}

const createSourceProjectIsolationSmokeProof = async (input: {
  db: KrnDatabase;
  executionRunId: string;
  marker: string;
  project: Readonly<{ id: string; workspaceId: string }>;
  sourceClaim: SourceClaim;
  sourceDecision: SourceDecision;
  sourceDecisionEdge: SourceDecisionEdge;
  sourceRepository: SourceRepository;
}): Promise<SourceProjectIsolationSmokeProof> => {
  const foreignProject = await new DrizzleProjectRepository(input.db).createProject({
    workspaceId: input.project.workspaceId,
    slug: `source-graph-foreign-${input.marker}`,
    displayName: `source graph foreign ${input.marker}`,
    metadata: {
      smokeId: input.marker,
      projectIsolationProbe: true
    }
  });
  const foreignEvidenceMetadata = {
    ...capturedCurrentEvidenceMetadata(input.marker, "foreign-project"),
    projectIsolationProbe: true
  };
  const foreignSourceArtifact = await input.sourceRepository.createSourceArtifact({
    projectId: foreignProject.id,
    kind: "operator_input",
    sourceAuthority: "project-decision",
    uri: `operator://source-graph-smoke/${input.marker}/foreign`,
    title: "Foreign source graph smoke source",
    contentHash: `source-graph-smoke-${input.marker}-foreign`,
    metadata: foreignEvidenceMetadata
  });
  const foreignSourceChunk = await input.sourceRepository.createSourceChunk({
    sourceArtifactId: foreignSourceArtifact.id,
    ordinal: 0,
    content: "Captured evidence for the foreign-project source graph isolation probe.",
    contentHash: `source-graph-smoke-${input.marker}-foreign-chunk-bytes`,
    metadata: foreignEvidenceMetadata
  });
  const foreignSourceClaim = await input.sourceRepository.createSourceClaim({
    sourceArtifactId: foreignSourceArtifact.id,
    sourceChunkId: foreignSourceChunk.id,
    claim: "Foreign project source graph claim must not govern the primary project.",
    mechanism: "Project-scoped source artifacts bind the claim to a separate project.",
    krnImplication: "Cross-project source authority must fail closed.",
    doesNotProve: "This probe does not prove source truth.",
    sourceAuthority: "project-decision",
    supportType: "implementation-boundary",
    consumer: "src002 project isolation smoke",
    falsifier: "The foreign source claim governs the primary project.",
    metadata: foreignEvidenceMetadata
  });
  const unscopedForeignSourceClaim = await input.sourceRepository.getSourceClaimById(
    foreignSourceClaim.id
  );
  const getSourceClaimForProject = input.sourceRepository.getSourceClaimForProject;
  const hasProjectScopedSourceClaimLookup = getSourceClaimForProject !== undefined;
  const scopedForeignSourceClaim = getSourceClaimForProject === undefined
    ? undefined
    : await getSourceClaimForProject.call(
      input.sourceRepository,
      input.project.id,
      foreignSourceClaim.id
    );
  const unscopedForeignSourceClaimReadLeaks =
    hasProjectScopedSourceClaimLookup &&
    unscopedForeignSourceClaim?.id === foreignSourceClaim.id &&
    scopedForeignSourceClaim === undefined;
  const foreignRelatedSourceClaim = await input.sourceRepository.createSourceClaim({
    sourceArtifactId: foreignSourceArtifact.id,
    sourceChunkId: foreignSourceChunk.id,
    claim: "Foreign source graph relation context must stay within the foreign project.",
    mechanism: "A SourceClaimEdge binds two source claims under the same source artifact project.",
    krnImplication: "Project-scoped graph reads must not return foreign relation edges.",
    doesNotProve: "This probe does not prove source truth.",
    sourceAuthority: "project-decision",
    supportType: "implementation-boundary",
    consumer: "src002 project isolation smoke",
    falsifier: "The primary project reads the foreign SourceClaimEdge.",
    metadata: foreignEvidenceMetadata
  });
  const mismatchedAdoptionRejected = await sourceWriteRejectedFor(
    () => input.sourceRepository.createSourceDecision({
      projectId: input.project.id,
      sourceClaimId: foreignSourceClaim.id,
      status: "adopt",
      decision: "Attempt a cross-project adoption.",
      rationale: "This must be rejected by the source artifact project boundary.",
      falsifier: "The foreign claim is adopted into the primary project.",
      consumer: "src002 project isolation smoke",
      metadata: { smokeId: input.marker }
    }),
    "SourceDecision projectId must match"
  );
  const foreignSourceDecision = await input.sourceRepository.createSourceDecision({
    projectId: foreignProject.id,
    sourceClaimId: foreignSourceClaim.id,
    status: "adopt",
    decision: "Adopt the foreign source graph probe only in its own project.",
    rationale: "The foreign claim and artifact share the foreign project boundary.",
    falsifier: "The source graph readback crosses project boundaries.",
    consumer: "src002 project isolation smoke",
    metadata: {
      smokeId: input.marker,
      projectIsolationProbe: true
    }
  });
  await input.sourceRepository.createSourceDecision({
    projectId: foreignProject.id,
    sourceClaimId: foreignRelatedSourceClaim.id,
    status: "adopt",
    decision: "Adopt the related foreign source graph probe only in its own project.",
    rationale: "The related foreign claim must be accepted before a SourceClaimEdge can connect it.",
    falsifier: "A foreign source graph edge is created without accepted endpoint claims.",
    consumer: "src002 project isolation smoke",
    metadata: {
      smokeId: input.marker,
      projectIsolationProbe: true
    }
  });
  const foreignSourceClaimEdge = await input.sourceRepository.createSourceClaimEdge({
    fromSourceClaimId: foreignSourceClaim.id,
    toSourceClaimId: foreignRelatedSourceClaim.id,
    kind: "supports",
    metadata: {
      smokeId: input.marker,
      projectIsolationProbe: true,
      consumer: "src002 project isolation smoke",
      doesNotProve: "This edge does not prove source truth."
    }
  });
  const unscopedForeignSourceClaimEdges = await input.sourceRepository.listSourceClaimEdgesForClaim(
    foreignSourceClaim.id
  );
  const listSourceClaimEdgesForProject = input.sourceRepository.listSourceClaimEdgesForProject;
  const hasProjectScopedSourceClaimEdgeLookup = listSourceClaimEdgesForProject !== undefined;
  const scopedForeignSourceClaimEdges = listSourceClaimEdgesForProject === undefined
    ? []
    : await listSourceClaimEdgesForProject.call(
      input.sourceRepository,
      input.project.id,
      foreignSourceClaim.id
    );
  const scopedForeignSourceClaimEdgeReadRejected =
    hasProjectScopedSourceClaimEdgeLookup &&
    unscopedForeignSourceClaimEdges.some((edge) => edge.id === foreignSourceClaimEdge.id) &&
    scopedForeignSourceClaimEdges.length === 0;
  const getSourceDecisionForProject = input.sourceRepository.getSourceDecisionForProject;
  const hasProjectScopedSourceDecisionLookup = getSourceDecisionForProject !== undefined;
  const scopedForeignSourceDecision = getSourceDecisionForProject === undefined
    ? undefined
    : await getSourceDecisionForProject.call(
      input.sourceRepository,
      input.project.id,
      foreignSourceDecision.id
    );
  const scopedForeignSourceDecisionReadRejected =
    hasProjectScopedSourceDecisionLookup && scopedForeignSourceDecision === undefined;
  const foreignSourceDecisionEdge = await input.sourceRepository.createSourceDecisionEdge({
    sourceClaimId: foreignSourceClaim.id,
    sourceDecisionId: foreignSourceDecision.id,
    targetType: "harness_run",
    targetId: input.executionRunId,
    supportType: "implementation-boundary",
    confidence: "high",
    notes: "Foreign project source decision edge must remain project scoped.",
    metadata: {
      smokeId: input.marker,
      projectIsolationProbe: true
    }
  });
  const crossProjectDecisionEdgeRejected = await sourceWriteRejectedFor(
    () => input.sourceRepository.createSourceDecisionEdge({
      sourceClaimId: input.sourceClaim.id,
      sourceDecisionId: foreignSourceDecision.id,
      targetType: "harness_run",
      targetId: input.executionRunId,
      supportType: "implementation-boundary",
      confidence: "high",
      notes: "A foreign decision must not support the primary claim.",
      metadata: { smokeId: input.marker }
    }),
    "getSourceDecisionEdgeContext did not return a row"
  );
  const crossProjectClaimEdgeRejected = await sourceWriteRejectedFor(
    () => input.sourceRepository.createSourceClaimEdge({
      fromSourceClaimId: input.sourceClaim.id,
      toSourceClaimId: foreignSourceClaim.id,
      kind: "supports",
      metadata: {
        smokeId: input.marker,
        consumer: "src002 project isolation smoke",
        doesNotProve: "Cross-project claim edges must not persist."
      }
    }),
    "SourceClaimEdge requires source records from the same project"
  );
  const crossProjectRejectionRejected = await sourceWriteRejectedFor(
    () => input.sourceRepository.createSourceRejection({
      projectId: input.project.id,
      sourceArtifactId: foreignSourceArtifact.id,
      sourceClaimId: foreignSourceClaim.id,
      title: "Foreign project rejection probe",
      attemptedClaim: "A foreign project rejection should be accepted.",
      rejectedBecause: "unsupported",
      reason: "Project mismatch must fail before the write.",
      doesNotProve: "This probe does not prove source truth.",
      consumer: "src002 project isolation smoke",
      metadata: { smokeId: input.marker }
    }),
    "SourceRejection source artifact project does not match projectId"
  );
  const primaryKnowledgeSources = await input.sourceRepository.listSourceDecisionKnowledgeSources(
    input.project.id,
    20
  );
  const sourceDecisionIdentityReadbackPassed = primaryKnowledgeSources.some((source) =>
    source.sourceDecision.id === input.sourceDecision.id &&
    source.sourceDecisionEdge.id === input.sourceDecisionEdge.id &&
    source.sourceDecisionEdge.sourceDecisionId === input.sourceDecision.id
  ) && !primaryKnowledgeSources.some((source) =>
    source.sourceDecision.id === foreignSourceDecision.id ||
    source.sourceDecisionEdge.id === foreignSourceDecisionEdge.id
  );
  const legacyDecisionEdgeRejected = await sourceWriteRejectedFor(
    () => input.db.insert(sourceDecisionEdges).values({
      sourceClaimId: input.sourceClaim.id,
      targetType: "harness_run",
      targetId: `legacy-source-decision-edge:${input.marker}`,
      supportType: "implementation-boundary",
      confidence: "low",
      notes: "Legacy edge intentionally lacks exact SourceDecision identity.",
      metadata: {
        smokeId: input.marker,
        legacyProjectIsolationProbe: true
      }
    }),
    "source_decision_id"
  );
  const legacyDecisionEdgeExcluded = legacyDecisionEdgeRejected;
  const projectIsolationRejectedWrites = [
    mismatchedAdoptionRejected,
    crossProjectDecisionEdgeRejected,
    crossProjectClaimEdgeRejected,
    crossProjectRejectionRejected
  ].filter(Boolean).length;

  return {
    projectIsolationRejectedWrites,
    unscopedForeignSourceClaimReadLeaks,
    scopedForeignSourceDecisionReadRejected,
    scopedForeignSourceClaimEdgeReadRejected,
    sourceDecisionIdentityReadbackPassed,
    legacyDecisionEdgeExcluded
  };
};

const sourceConsensusRelationEvidenceGapCount = (
  timeline: SourceConsensusTimelineReadback
): number => timeline.entries.reduce(
  (entrySum, entry) =>
    entrySum + entry.relationEvidence.reduce(
      (relationSum, relation) => relationSum + relation.evidenceGaps.length,
      0
    ),
  0
);

const sourceClaimsById = async (
  sourceRepository: Pick<SourceRepository, "getSourceClaimById">,
  sourceClaimIds: readonly SourceClaim["id"][]
): Promise<SourceClaim[]> =>
  (await Promise.all(sourceClaimIds.map((sourceClaimId) =>
    sourceRepository.getSourceClaimById(sourceClaimId)
  ))).filter((claim): claim is SourceClaim => claim !== undefined);

const buildPersistedSourceConsensusTimeline = async (input: {
  readonly sourceRepository: Pick<
    SourceRepository,
    | "getSourceClaimById"
    | "listSourceDecisionEdgesForClaim"
    | "listSourceRejectionsForClaim"
  >;
  readonly sourceClaimIds: readonly SourceClaim["id"][];
  readonly sourceClaimEdges: readonly SourceClaimEdge[];
  readonly now: string;
}): Promise<SourceConsensusTimelineReadback> => {
  const sourceClaims = await sourceClaimsById(
    input.sourceRepository,
    input.sourceClaimIds
  );
  const sourceDecisionEdges = (await Promise.all(sourceClaims.map((claim) =>
    input.sourceRepository.listSourceDecisionEdgesForClaim(claim.id)
  ))).flat();
  const sourceRejections = (await Promise.all(sourceClaims.map((claim) =>
    input.sourceRepository.listSourceRejectionsForClaim?.(claim.id) ?? Promise.resolve([])
  ))).flat();

  return buildSourceConsensusTimelineReadback({
    sourceClaims,
    sourceClaimEdges: input.sourceClaimEdges,
    sourceDecisionEdges,
    sourceRejections,
    now: input.now
  });
};

const createSourceConsensusTimelineSmokeReadback = async (input: {
  readonly sourceRepository: SourceRepository;
  readonly projectId: string;
  readonly executionRunId: string;
  readonly sourceArtifactId: string;
  readonly marker: string;
  readonly currentSourceClaimId: SourceClaim["id"];
  readonly staleSourceClaimId: SourceClaim["id"];
  readonly duplicateSourceClaimId: SourceClaim["id"];
  readonly sourceClaimEdges: readonly SourceClaimEdge[];
  readonly now: string;
}): Promise<SourceConsensusTimelineSmokeReadback> => {
  const rejectedSourceClaim = await input.sourceRepository.createSourceClaim({
    sourceArtifactId: input.sourceArtifactId,
    executionRunId: input.executionRunId,
    claim: "Source graph smoke rejected timeline paths should remain non-governing.",
    mechanism: "A linked SourceRejection preserves why this source path must not govern.",
    krnImplication:
      "KRN can keep rejected source reasoning visible without selecting it as current authority.",
    doesNotProve: "This rejected path does not prove automated source-review quality.",
    sourceAuthority: "hypothesis",
    supportType: "rejection",
    consumer: "B-03 source consensus timeline smoke",
    falsifier: "Source consensus timeline readback omits the rejected claim.",
    revisitWhen: "2026-12-31T00:00:00.000Z",
    status: "proposed",
    metadata: {
      smokeId: input.marker
    }
  });
  await input.sourceRepository.createSourceDecision({
    projectId: input.projectId,
    sourceClaimId: rejectedSourceClaim.id,
    status: "reject",
    decision: "Reject this source graph timeline path.",
    rationale:
      "The path is retained only as rejected evidence for source consensus timeline readback.",
    falsifier: "Source consensus timeline treats this rejected claim as governing authority.",
    consumer: "B-03 source consensus timeline smoke",
    metadata: {
      smokeId: input.marker
    }
  });
  const sourceRejection = await input.sourceRepository.createSourceRejection({
    projectId: input.projectId,
    executionRunId: input.executionRunId,
    sourceClaimId: rejectedSourceClaim.id,
    title: "Decorative source smoke example",
    attemptedClaim: "An interesting AI link should influence KRN behavior.",
    rejectedBecause: "decorative",
    reason: "No mechanism, consumer, or decision support.",
    doesNotProve: "The link should become trusted KRN context.",
    consumer: "M22 source graph smoke",
    metadata: {
      smokeId: input.marker
    }
  });
  const missingSupportSourceClaimEdge = await input.sourceRepository.createSourceClaimEdge({
    fromSourceClaimId: input.duplicateSourceClaimId,
    toSourceClaimId: input.currentSourceClaimId,
    kind: "narrows",
    metadata: {
      smokeId: input.marker,
      consumer: "B-03 source consensus timeline smoke",
      scope: "source consensus timeline evidence-gap readback",
      doesNotProve:
        "This relation intentionally omits support refs to prove timeline evidence-gap readback."
    }
  });
  const consensusTimeline = await buildPersistedSourceConsensusTimeline({
    sourceRepository: input.sourceRepository,
    sourceClaimIds: [
      input.currentSourceClaimId,
      input.staleSourceClaimId,
      input.duplicateSourceClaimId,
      rejectedSourceClaim.id
    ],
    sourceClaimEdges: [
      ...input.sourceClaimEdges,
      missingSupportSourceClaimEdge
    ],
    now: input.now
  });
  const relationEvidenceGapCount =
    sourceConsensusRelationEvidenceGapCount(consensusTimeline);

  return {
    rejectedSourceClaimId: rejectedSourceClaim.id,
    missingSupportSourceClaimEdgeId: missingSupportSourceClaimEdge.id,
    sourceRejectionId: sourceRejection.id,
    currentAuthorityReadbackPassed:
      consensusTimeline.currentSourceClaimIds.includes(input.currentSourceClaimId),
    historicalReadbackPassed:
      consensusTimeline.historicalSourceClaimIds.includes(input.staleSourceClaimId) &&
      consensusTimeline.supersededSourceClaimIds.includes(input.staleSourceClaimId),
    rejectedReadbackPassed:
      consensusTimeline.rejectedSourceClaimIds.includes(rejectedSourceClaim.id),
    relationEvidenceGapReadbackPassed: relationEvidenceGapCount > 0,
    currentAuthorityCount: consensusTimeline.currentSourceClaimIds.length,
    historicalCount: consensusTimeline.historicalSourceClaimIds.length,
    supersededCount: consensusTimeline.supersededSourceClaimIds.length,
    rejectedCount: consensusTimeline.rejectedSourceClaimIds.length,
    relationEvidenceGapCount
  };
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
    const sourceEvidenceMetadata = capturedCurrentEvidenceMetadata(marker, "primary");
    const sourceArtifact = await sourceRepository.createSourceArtifact({
      projectId: project.id,
      kind: "operator_input",
      sourceAuthority: "project-decision",
      uri: `operator://source-graph-smoke/${marker}`,
      title: "Source graph smoke source",
      contentHash: `source-graph-smoke-${marker}`,
      metadata: sourceEvidenceMetadata
    });
    const sourceChunk = await sourceRepository.createSourceChunk({
      sourceArtifactId: sourceArtifact.id,
      ordinal: 0,
      content: "Captured evidence for the primary source graph smoke claims.",
      contentHash: `source-graph-smoke-${marker}-primary-chunk-bytes`,
      metadata: sourceEvidenceMetadata
    });
    const sourceClaim = await sourceRepository.createSourceClaim({
      sourceArtifactId: sourceArtifact.id,
      sourceChunkId: sourceChunk.id,
      executionRunId: executionRun.id,
      claim: "KRN should persist source claims and typed source decision edges.",
      mechanism: "Postgres stores harness runs and source graph records transactionally.",
      krnImplication: "KRN can link source reasoning to a concrete execution run.",
      doesNotProve: "This does not prove source ranking or retrieval quality.",
      sourceAuthority: "project-decision",
      supportType: "implementation-boundary",
      consumer: "M22 source graph smoke",
      falsifier: "Source graph smoke readback or cleanup fails.",
      revisitWhen: "2026-12-31T00:00:00.000Z",
      status: "proposed",
      metadata: sourceEvidenceMetadata
    });
    const staleSourceClaim = await sourceRepository.createSourceClaim({
      sourceArtifactId: sourceArtifact.id,
      sourceChunkId: sourceChunk.id,
      executionRunId: executionRun.id,
      claim: "Source graph smoke only needs source decision edges.",
      mechanism: "Before B-01, source claim edge relations existed but were not repository-visible.",
      krnImplication: "KRN could miss temporal invalidation between source claims.",
      doesNotProve: "This older claim is safe after temporal claim edges exist.",
      sourceAuthority: "project-decision",
      supportType: "implementation-boundary",
      consumer: "B-01 temporal source graph smoke",
      falsifier: "Temporal claim edge readback or cleanup fails.",
      revisitWhen: "2026-12-31T00:00:00.000Z",
      status: "proposed",
      metadata: sourceEvidenceMetadata
    });
    const duplicateSourceClaim = await sourceRepository.createSourceClaim({
      sourceArtifactId: sourceArtifact.id,
      sourceChunkId: sourceChunk.id,
      executionRunId: executionRun.id,
      claim: "Source graph smoke has adjacent duplicate relation evidence.",
      mechanism: "A duplicate SourceClaimEdge keeps relation evidence reviewable without merging source truth.",
      krnImplication: "KRN can surface adjacent graph context while preserving proof boundaries.",
      doesNotProve: "This duplicate relation does not prove the claims are true duplicates.",
      sourceAuthority: "project-decision",
      supportType: "implementation-boundary",
      consumer: "B-02 duplicate source graph smoke",
      falsifier: "Duplicate source claim edge influence is absent from activation readback.",
      revisitWhen: "2026-12-31T00:00:00.000Z",
      status: "proposed",
      metadata: sourceEvidenceMetadata
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
      sourceDecisionId: sourceDecision.id,
      targetType: "harness_run",
      targetId: executionRun.id,
      supportType: "implementation-boundary",
      confidence: "medium",
      notes: "Used to prove M22 source graph linkage to a persisted run.",
      metadata: {
        smokeId: marker
      }
    });
    const {
      projectIsolationRejectedWrites,
      unscopedForeignSourceClaimReadLeaks,
      scopedForeignSourceDecisionReadRejected,
      scopedForeignSourceClaimEdgeReadRejected,
      sourceDecisionIdentityReadbackPassed,
      legacyDecisionEdgeExcluded
    } = await createSourceProjectIsolationSmokeProof({
      db,
      executionRunId: executionRun.id,
      marker,
      project,
      sourceClaim,
      sourceDecision,
      sourceDecisionEdge,
      sourceRepository
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
      isSourceGraphRankDownMetadata(candidate.sourceClaimEdgeRankDown)
    );
    const sourceGraphRankDown = isSourceGraphRankDownMetadata(
      rankedDownCandidate?.sourceClaimEdgeRankDown
    )
      ? rankedDownCandidate.sourceClaimEdgeRankDown
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
    const consensusReadback = await createSourceConsensusTimelineSmokeReadback({
      sourceRepository,
      projectId: project.id,
      executionRunId: executionRun.id,
      sourceArtifactId: sourceArtifact.id,
      marker,
      currentSourceClaimId: sourceClaim.id,
      staleSourceClaimId: staleSourceClaim.id,
      duplicateSourceClaimId: duplicateSourceClaim.id,
      sourceClaimEdges: sourceClaimEdgesForClaim,
      now: "2026-07-07T12:00:00.000Z"
    });
    const rejectionRows = await db
      .select()
      .from(sourceRejections)
      .where(eq(sourceRejections.id, consensusReadback.sourceRejectionId));
    const outboxRows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(outboxEvents)
      .where(sql`${outboxEvents.payload}->>'smokeId' = ${marker}`);
    const sourceClaimTransition = await runSourceClaimTransitionSmokeCheck({
      databaseUrl: input.databaseUrl,
      db,
      marker,
      projectId: project.id,
      sourceRepository,
      workspaceId: project.workspaceId
    });

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
            edge.sourceDecisionId === sourceDecision.id &&
            edge.targetId === executionRun.id
        )
      },
      {
        label: "source decision project isolation writes rejected",
        passed: projectIsolationRejectedWrites === 4
      },
      {
        label: "unscoped foreign SourceClaim read is observable for consumer isolation falsifiers",
        passed: unscopedForeignSourceClaimReadLeaks
      },
      {
        label: "project-scoped foreign SourceDecision read rejects",
        passed: scopedForeignSourceDecisionReadRejected
      },
      {
        label: "project-scoped foreign SourceClaimEdge read rejects",
        passed: scopedForeignSourceClaimEdgeReadRejected
      },
      {
        label: "source decision identity project readback",
        passed: sourceDecisionIdentityReadbackPassed
      },
      {
        label: "legacy source decision edge excluded from activation readback",
        passed: legacyDecisionEdgeExcluded
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
        passed: rejectionRows[0]?.id === consensusReadback.sourceRejectionId
      },
      {
        label: "source consensus current authority readback",
        passed: consensusReadback.currentAuthorityReadbackPassed
      },
      {
        label: "source consensus historical readback",
        passed: consensusReadback.historicalReadbackPassed
      },
      {
        label: "source consensus rejected readback",
        passed: consensusReadback.rejectedReadbackPassed
      },
      {
        label: "source consensus relation evidence gap readback",
        passed: consensusReadback.relationEvidenceGapReadbackPassed
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
      rejectedSourceClaimId: consensusReadback.rejectedSourceClaimId,
      readBackSourceClaimId: persistedSourceClaim.id,
      sourceClaimEdgeId: sourceClaimEdge.id,
      duplicateSourceClaimEdgeId: duplicateSourceClaimEdge.id,
      missingSupportSourceClaimEdgeId: consensusReadback.missingSupportSourceClaimEdgeId,
      sourceDecisionId: sourceDecision.id,
      sourceDecisionEdgeId: sourceDecisionEdge.id,
      sourceRejectionId: consensusReadback.sourceRejectionId,
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
      sourceConsensusCurrentAuthorityCount: consensusReadback.currentAuthorityCount,
      sourceConsensusHistoricalCount: consensusReadback.historicalCount,
      sourceConsensusSupersededCount: consensusReadback.supersededCount,
      sourceConsensusRejectedCount: consensusReadback.rejectedCount,
      sourceConsensusRelationEvidenceGapCount: consensusReadback.relationEvidenceGapCount,
      projectIsolationRejectedWrites,
      unscopedForeignSourceClaimReadLeaks,
      scopedForeignSourceDecisionReadRejected,
      scopedForeignSourceClaimEdgeReadRejected,
      sourceDecisionIdentityReadbackPassed,
      legacyDecisionEdgeExcluded,
      outboxEventCount: outboxRows[0]?.count ?? 0,
      sourceClaimTransition,
      remainingMarkerCount,
      cleanedUp: remainingMarkerCount === 0
    };
  } finally {
    try {
      await cleanup();
    } finally {
      await client.end();
    }
  }
};
