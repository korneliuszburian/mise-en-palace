import {
  eq,
  sql
} from "drizzle-orm";
import {
  type ObservationItem,
} from "@krn/core";
import {
  applyContextROI,
  applyActivationFilters,
  assembleContext,
  buildSourceQuery,
  persistActivationTrace,
  rankCandidates,
  retrieveActivationCandidates,
  selectObservationPrefix,
  toMemoryCandidate
} from "@krn/harness";

import {
  assertSmokeReadbackChecks,
  cleanupActivationSmokeRows,
  countActivationSmokeMarkerRows,
  countSmokeContextSelectionRows,
  createRunningSmokeExecutionRun,
  createSmokeContextAssembly,
  createSmokeHarnessScaffold,
  requireSmokeReadbackValue
} from "./db-smoke-support.js";
import {
  contextAssemblies,
  contextExclusions,
  contextItems,
  memoryRecords,
  projects,
  retrievalRuns,
  searchDocuments,
  sourceArtifacts,
  sourceClaims,
} from "../../schema/index.js";
import {
  smokeFixtureClocks
} from "./smoke-fixture-clocks.js";
import type {
  DrizzleHarnessRunRepository,
  DrizzleMemoryRepository,
  DrizzleRetrievalRepository,
  DrizzleSourceRepository
} from "../../repositories/index.js";

export interface ActivationSmokeInput {
  databaseUrl: string;
  migrationsFolder: string;
  smokeId: string;
}

export interface ActivationSmokeReport {
  workspaceSlug: string;
  projectSlug: string;
  executionRunId: string;
  taskContractId: string;
  harnessPlanId: string;
  contextAssemblyId: string;
  readBackContextAssemblyId: string;
  retrievalRunId: string;
  readBackRetrievalRunId: string;
  sourceClaimCount: number;
  lowerAuthorityArtifactId: string;
  lowerAuthorityClaimId: string;
  lowerAuthorityPeerClaimId: string;
  lowerAuthorityCandidateScore: number;
  lowerAuthorityPeerCandidateScore: number;
  lowerAuthorityPacketExclusionMatched: boolean;
  temporalGoverningSourceClaimId: string;
  temporalRankedDownSourceClaimId: string;
  temporalBoundarySourceClaimId: string;
  currentSourceClaimEdgeId: string;
  expiredSourceClaimEdgeId: string;
  equalSourceClaimEdgeId: string;
  temporalPacketSourceClaimIds: readonly string[];
  temporalPacketBriefSourceClaimIds: readonly string[];
  temporalPacketSourceDecisionEdgeIds: readonly string[];
  temporalPersistedRankDownEdgeIds: readonly string[];
  temporalPersistedRankDownGoverningSourceClaimIds: readonly string[];
  currentSourceClaimEdgePacketRefCount: number;
  expiredSourceClaimEdgePacketRefCount: number;
  equalSourceClaimEdgePacketRefCount: number;
  memoryRecordCount: number;
  relevantMemoryRetrieved: boolean;
  relevantMemoryCandidateCount: number;
  relevantMemoryIncludedDecisionCount: number;
  relevanceDistractorCandidateCount: number;
  relevanceDistractorExcludedDecisionCount: number;
  relevanceDistractorContextInclusionCount: number;
  decisionPacketMemoryRefCount: number;
  decisionPacketRelevantMemorySelected: boolean;
  decisionPacketDistractorRefCount: number;
  decisionPacketReadbackMatched: boolean;
  relevantMemoryCanonicalScore: number;
  relevantMemoryPersistedScore: number;
  staleProjectionCandidateRefCount: number;
  staleProjectionDecisionRefCount: number;
  staleProjectionContextRefCount: number;
  staleProjectionPacketRefCount: number;
  staleProjectionHistoricalScore: number;
  antiMemoryRecordCount: number;
  searchDocumentCount: number;
  indexOnlySearchExcluded: boolean;
  crossProjectIndexExcluded: boolean;
  searchCandidateCount: number;
  retrievalCandidateCount: number;
  activationDecisionCount: number;
  includedDecisionCount: number;
  excludedDecisionCount: number;
  conflictDecisionCount: number;
  staleDecisionCount: number;
  staleMemoryWarningPersisted: boolean;
  staleSourceWarningPersisted: boolean;
  contextItemCount: number;
  contextExclusionCount: number;
  observationPrefixItemCount: number;
  rawEvidenceRecallTriggerCount: number;
  remainingMarkerCount: number;
  cleanedUp: boolean;
}

const relevanceDistractorCount = 25;
const boundedMemoryLimit = 25;

const countByDecision = (
  decisions: readonly { decision: string }[],
  decision: string
): number => decisions.filter((item) => item.decision === decision).length;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const hasSerializedReference = (value: unknown, id: string): boolean =>
  JSON.stringify(value).includes(id);

const stringList = (value: unknown): readonly string[] | undefined =>
  Array.isArray(value) && value.every((item) => typeof item === "string")
    ? value
    : undefined;

const persistedSourceClaimEdgeRankDown = (
  metadata: Record<string, unknown> | undefined
): {
  edgeIds: readonly string[];
  governingSourceClaimIds: readonly string[];
} | undefined => {
  const value = metadata?.sourceClaimEdgeRankDown;

  if (!isRecord(value)) {
    return undefined;
  }

  const edgeIds = stringList(value.edgeIds);
  const governingSourceClaimIds = stringList(value.governingSourceClaimIds);

  return edgeIds === undefined || governingSourceClaimIds === undefined
    ? undefined
    : { edgeIds, governingSourceClaimIds };
};

const containsExactly = (
  actual: readonly string[],
  expected: readonly string[]
): boolean =>
  actual.length === expected.length && expected.every((id) => actual.includes(id));

const rawEvidenceRecallTriggerCount = (
  metadata: unknown
): number => {
  if (!isRecord(metadata)) {
    return 0;
  }

  const count = metadata.rawEvidenceRecallTriggerCount;

  return typeof count === "number" ? count : 0;
};

const hasMergedSearchSignal = (metadata: Record<string, unknown>): boolean => {
  const searchDocumentIds = metadata.mergedSearchDocumentIds;

  return Array.isArray(searchDocumentIds) &&
    searchDocumentIds.some((value) => typeof value === "string" && value.length > 0);
};

const observationPrefixItemCount = (
  metadata: unknown
): number => {
  if (!isRecord(metadata)) {
    return 0;
  }

  const prefix = metadata.observationPrefixSnapshot;

  if (!isRecord(prefix)) {
    return 0;
  }

  const count = prefix.itemCount;

  return typeof count === "number" ? count : 0;
};

// fallow-ignore-next-line complexity -- this DB smoke intentionally sequences retrieval, packet issuance, exact stale-authority readback, and cleanup falsifiers
export const runActivationSmokeCheck = async (
  input: ActivationSmokeInput
): Promise<ActivationSmokeReport> => {
  const { now, past, expiredValidUntil } = smokeFixtureClocks.activation;
  const scaffold = await createSmokeHarnessScaffold({
    databaseUrl: input.databaseUrl,
    migrationsFolder: input.migrationsFolder,
    smokeId: input.smokeId,
    smokeName: "activation smoke",
    workspacePrefix: "krn-activation-smoke",
    projectSlug: "activation-engine",
    cleanupRows: cleanupActivationSmokeRows,
    countMarkerRows: countActivationSmokeMarkerRows,
    rawIntent: `activation smoke ${input.smokeId}`,
    taskContract: {
      title: "Improve KRN doctor activation readiness",
      objective: "Prove activation smoke compresses source, memory, search, and anti-memory into bounded context with explicit exclusions.",
      constraints: ["no source crawler", "persist activation decisions", "self-clean marker rows"],
      nonGoals: ["no dashboard", "no external embeddings", "no memory auto-mutation"],
      acceptance: ["bounded context", "explicit exclusions", "conflict flagged", "cleanup count zero"]
    },
    harnessPlan: {
      summary: "Activation smoke plan",
      nextAction: "Run activation engine over seeded noisy corpus."
    }
  });
  const {
    client,
    db,
    marker,
    projectSlug,
    workspaceSlug,
    project,
    taskContract,
    harnessPlan,
    cleanup,
    setContextAssemblyId
  } = scaffold;
  const harnessRunRepository: DrizzleHarnessRunRepository = scaffold.harnessRunRepository;
  const memoryRepository: DrizzleMemoryRepository = scaffold.memoryRepository;
  const retrievalRepository: DrizzleRetrievalRepository = scaffold.retrievalRepository;
  const sourceRepository: DrizzleSourceRepository = scaffold.sourceRepository;

  try {
    const executionRun = await createRunningSmokeExecutionRun(
      harnessRunRepository,
      harnessPlan.id,
      marker,
      now
    );
    const sourceEvidenceMetadata = {
      smokeId: marker,
      evidenceRef: `operator://activation-smoke/${marker}/captured`,
      evidenceStatus: "captured",
      evidenceContentHash: `activation-smoke-${marker}-captured-evidence`,
      evidenceFreshness: "current"
    };
    const sourceArtifact = await sourceRepository.createSourceArtifact({
      projectId: project.id,
      kind: "operator_input",
      sourceAuthority: "project-decision",
      uri: `operator://activation-smoke/${marker}`,
      title: "Activation smoke source",
      contentHash: `activation-smoke-${marker}`,
      metadata: sourceEvidenceMetadata
    });
    const sourceChunk = await sourceRepository.createSourceChunk({
      sourceArtifactId: sourceArtifact.id,
      ordinal: 0,
      content: "Captured evidence for the activation smoke historical warning boundary.",
      contentHash: `activation-smoke-${marker}-chunk-bytes`,
      metadata: sourceEvidenceMetadata
    });
    const activationClaim = await sourceRepository.createSourceClaim({
      sourceArtifactId: sourceArtifact.id,
      executionRunId: executionRun.id,
      claim: "Activation smoke should prove bounded context and explicit exclusions.",
      mechanism: "A noisy DB corpus forces the engine to rank, filter, include, exclude, and persist activation decisions.",
      krnImplication: "M25 activation can be checked through a live store-backed smoke command.",
      doesNotProve: "This does not prove production ranking quality.",
      sourceAuthority: "project-decision",
      supportType: "implementation-boundary",
      consumer: "M25 activation smoke",
      falsifier: "Activation smoke readback or cleanup fails.",
      revisitWhen: "2027-01-01T00:00:00.000Z",
      status: "proposed",
      metadata: {
        smokeId: marker
      }
    });
    const authorityTwinInput = {
      sourceArtifactId: sourceArtifact.id,
      sourceChunkId: sourceChunk.id,
      executionRunId: executionRun.id,
      claim: "Activation authority ranking must preserve the stored SourceClaim tier.",
      mechanism: "Two otherwise identical claims isolate the activation trust contribution.",
      krnImplication: "A lower allowed tier must remain lower through retrieval, scoring, context, and packet readback.",
      doesNotProve: "This does not prove the SourceArtifact tier is correct.",
      supportType: "implementation-boundary" as const,
      consumer: "SourceClaim authority ceiling activation proof",
      falsifier: "The lower claim receives the peer authority or peer trust score.",
      revisitWhen: "2027-01-01T00:00:00.000Z",
      status: "proposed" as const,
      metadata: {
        smokeId: marker,
        authorityCeilingProof: true
      }
    };
    const lowerAuthorityPeerClaim = await sourceRepository.createSourceClaim({
      ...authorityTwinInput,
      sourceAuthority: "project-decision"
    });
    const lowerAuthorityClaim = await sourceRepository.createSourceClaim({
      ...authorityTwinInput,
      sourceAuthority: "hypothesis"
    });
    const crawlerClaim = await sourceRepository.createSourceClaim({
      sourceArtifactId: sourceArtifact.id,
      executionRunId: executionRun.id,
      claim: "Activation readiness should add a source crawler.",
      mechanism: "A crawler would gather more source material.",
      krnImplication: "Activation could inspect more documents.",
      doesNotProve: "The crawler is within M25 scope.",
      sourceAuthority: "project-decision",
      supportType: "rejection",
      consumer: "M25 activation smoke",
      falsifier: "Anti-memory fails to block crawler scope.",
      revisitWhen: "2027-01-01T00:00:00.000Z",
      status: "proposed",
      metadata: {
        smokeId: marker
      }
    });
    await sourceRepository.createSourceClaim({
      sourceArtifactId: sourceArtifact.id,
      executionRunId: executionRun.id,
      claim: "Activation can rely on broad context because more is safer.",
      mechanism: "Broad context dumping is a tempting but unsafe shortcut.",
      krnImplication: "This would encourage broad context dumping.",
      doesNotProve: "The claim has a working mechanism.",
      sourceAuthority: "high",
      supportType: "risk",
      consumer: "M25 activation smoke",
      falsifier: "Source safety accepts a claim without mechanism.",
      revisitWhen: "2027-01-01T00:00:00.000Z",
      status: "proposed",
      metadata: {
        smokeId: marker
      }
    });
    const expiredSourceClaim = await sourceRepository.createSourceClaim({
      sourceArtifactId: sourceArtifact.id,
      sourceChunkId: sourceChunk.id,
      executionRunId: executionRun.id,
      claim: "Expired activation guidance should remain visible as a bounded warning.",
      mechanism: "Historical source evidence explains why current activation must not reuse stale guidance.",
      krnImplication: "Task-relevant stale source claims belong in warning provenance, never governing context.",
      doesNotProve: "Historical visibility does not make the source claim current or true.",
      sourceAuthority: "project-decision",
      supportType: "risk",
      consumer: "M25 activation smoke",
      falsifier: "The persisted stale source claim disappears before activation trace.",
      revisitWhen: expiredValidUntil,
      status: "proposed",
      metadata: {
        ...sourceEvidenceMetadata,
        temporalCase: "expired-source-warning"
      }
    });
    const expiredSourceDecision = await sourceRepository.createSourceDecision({
      projectId: project.id,
      sourceClaimId: expiredSourceClaim.id,
      status: "adopt",
      decision: "Retain expired activation guidance only as bounded warning history.",
      rationale: "The historical path explains a stale alternative without restoring authority.",
      falsifier: "The expired guidance becomes current authority or disappears from the warning trace.",
      consumer: "M25 activation smoke",
      metadata: { smokeId: marker }
    });
    const expiredSourceDecisionEdge = await sourceRepository.createSourceDecisionEdge({
      sourceClaimId: expiredSourceClaim.id,
      sourceDecisionId: expiredSourceDecision.id,
      targetType: "harness_run",
      targetId: executionRun.id,
      supportType: "risk",
      confidence: "high",
      notes: "Expired guidance remains warning-only.",
      metadata: { smokeId: marker }
    });
    const temporalGraphClaimInput = {
      sourceArtifactId: sourceArtifact.id,
      sourceChunkId: sourceChunk.id,
      executionRunId: executionRun.id,
      mechanism: "Persisted SourceClaimEdges must affect activation only inside their current temporal window.",
      krnImplication: "DecisionPacket authority must contain only current relation effects and exact governing IDs.",
      doesNotProve: "A temporally current relation does not prove either endpoint claim is true.",
      sourceAuthority: "project-decision" as const,
      supportType: "implementation-boundary" as const,
      consumer: "temporal source relation DecisionPacket proof",
      falsifier: "An expired or equal-boundary SourceClaimEdge governs the persisted DecisionPacket.",
      revisitWhen: "2027-01-01T00:00:00.000Z",
      status: "proposed" as const,
      metadata: {
        ...sourceEvidenceMetadata,
        temporalRelationProof: true
      }
    };
    const temporalGoverningSourceClaim = await sourceRepository.createSourceClaim({
      ...temporalGraphClaimInput,
      claim: "Current source relation guidance governs KRN doctor activation readiness."
    });
    const temporalRankedDownSourceClaim = await sourceRepository.createSourceClaim({
      ...temporalGraphClaimInput,
      claim: "Older source relation guidance governs KRN doctor activation readiness."
    });
    const temporalBoundarySourceClaim = await sourceRepository.createSourceClaim({
      ...temporalGraphClaimInput,
      claim: "Equal-boundary source guidance must remain historical in KRN doctor activation.",
      metadata: {
        ...temporalGraphClaimInput.metadata,
        validUntil: now
      }
    });
    const temporalGoverningSourceDecision = await sourceRepository.createSourceDecision({
      projectId: project.id,
      sourceClaimId: temporalGoverningSourceClaim.id,
      status: "adopt",
      decision: "Adopt the current temporal source relation guidance.",
      rationale: "The current endpoint provides the governing side of the persisted temporal relation falsifier.",
      falsifier: "The current endpoint cannot govern a supported current relation.",
      consumer: "temporal source relation DecisionPacket proof",
      metadata: { smokeId: marker }
    });
    const temporalRankedDownSourceDecision = await sourceRepository.createSourceDecision({
      projectId: project.id,
      sourceClaimId: temporalRankedDownSourceClaim.id,
      status: "adopt",
      decision: "Adopt the older temporal source relation guidance before supersession.",
      rationale: "Both endpoints must be decision-linked so only relation time selects the governing effect.",
      falsifier: "The older endpoint is unavailable to the current supersession relation.",
      consumer: "temporal source relation DecisionPacket proof",
      metadata: { smokeId: marker }
    });
    const temporalGoverningSourceDecisionEdge = await sourceRepository.createSourceDecisionEdge({
      sourceClaimId: temporalGoverningSourceClaim.id,
      sourceDecisionId: temporalGoverningSourceDecision.id,
      targetType: "harness_run",
      targetId: executionRun.id,
      supportType: "implementation-boundary",
      confidence: "high",
      notes: "Current temporal relation endpoint support.",
      metadata: { smokeId: marker }
    });
    const temporalRankedDownSourceDecisionEdge = await sourceRepository.createSourceDecisionEdge({
      sourceClaimId: temporalRankedDownSourceClaim.id,
      sourceDecisionId: temporalRankedDownSourceDecision.id,
      targetType: "harness_run",
      targetId: executionRun.id,
      supportType: "implementation-boundary",
      confidence: "high",
      notes: "Historical temporal relation endpoint support.",
      metadata: { smokeId: marker }
    });
    const currentSourceClaimEdge = await sourceRepository.createSourceClaimEdge({
      fromSourceClaimId: temporalGoverningSourceClaim.id,
      toSourceClaimId: temporalRankedDownSourceClaim.id,
      kind: "supersedes",
      metadata: {
        smokeId: marker,
        consumer: "temporal source relation DecisionPacket proof",
        evidenceRef: executionRun.id,
        doesNotProve: "Current supersession does not prove endpoint truth."
      }
    });
    const expiredSourceClaimEdge = await sourceRepository.createSourceClaimEdge({
      fromSourceClaimId: temporalRankedDownSourceClaim.id,
      toSourceClaimId: temporalGoverningSourceClaim.id,
      kind: "invalidates",
      metadata: {
        smokeId: marker,
        consumer: "temporal source relation DecisionPacket proof",
        evidenceRef: executionRun.id,
        doesNotProve: "Expired invalidation does not prove current endpoint authority.",
        validUntil: expiredValidUntil
      }
    });
    const equalSourceClaimEdge = await sourceRepository.createSourceClaimEdge({
      fromSourceClaimId: temporalRankedDownSourceClaim.id,
      toSourceClaimId: temporalGoverningSourceClaim.id,
      kind: "supersedes",
      metadata: {
        smokeId: marker,
        consumer: "temporal source relation DecisionPacket proof",
        evidenceRef: executionRun.id,
        doesNotProve: "Equal-boundary supersession does not prove current endpoint authority.",
        validUntil: now
      }
    });
    const baselineMemory = await memoryRepository.createMemoryRecord({
      projectId: project.id,
      key: `activation-smoke:${marker}:high-signal`,
      kind: "constraint",
      status: "active",
      summary: "Activation smoke must prove explicit exclusions",
      body: "M25 activation readiness depends on bounded context, anti-memory blocking, and persisted decisions.",
      owner: "kernel",
      confidence: 95,
      applicationGuidance: "Use when implementing activation smoke and doctor readiness.",
      invalidationRule: "Revisit when activation no longer persists decisions.",
      sourceLineage: [{ sourceId: activationClaim.id }],
      isUserPreference: false,
      validFrom: past,
      metadata: {
        smokeId: marker
      }
    });
    const expiredMemory = await memoryRepository.createMemoryRecord({
      projectId: project.id,
      key: `activation-smoke:${marker}:expired`,
      kind: "preference",
      status: "active",
      summary: "Old dashboard-first activation view",
      body: "Expired dashboard planning note that should not enter activation context.",
      owner: "kernel",
      confidence: 90,
      applicationGuidance: "Do not use for activation engine implementation.",
      invalidationRule: "Expired before activation smoke.",
      sourceLineage: [{ sourceId: activationClaim.id }],
      isUserPreference: false,
      validFrom: past,
      validUntil: expiredValidUntil,
      metadata: {
        smokeId: marker
      }
    });
    const relevanceKey = Date.now().toString();
    const relevanceDistractorIds: string[] = [];
    for (const index of Array.from({ length: relevanceDistractorCount }, (_, item) => item)) {
      const distractor = await memoryRepository.createMemoryRecord({
        projectId: project.id,
        key: `unrelated-release-distractor:${relevanceKey}:${index}`,
        kind: "procedure",
        status: "active",
        summary: "Activation-only unrelated release calendar note",
        body: "Unrelated deployment note with favored positive feedback.",
        owner: "kernel",
        confidence: 95,
        applicationGuidance: "Review only for unrelated release work.",
        invalidationRule: "Revisit unrelated release work.",
        sourceLineage: [{ sourceId: activationClaim.id }],
        isUserPreference: false,
        validFrom: past,
        metadata: {
          smokeId: marker
        }
      });
      relevanceDistractorIds.push(distractor.id);
      await db
        .update(memoryRecords)
        .set({ positiveFeedbackCount: 100 })
        .where(eq(memoryRecords.id, distractor.id));
    }
    const relevantMemory = await memoryRepository.createMemoryRecord({
      projectId: project.id,
      key: `relevant-memory:${relevanceKey}`,
      kind: "procedure",
      status: "active",
      summary: "Activation memory relevance",
      body: [
        taskContract.title,
        taskContract.objective,
        ...taskContract.constraints,
        ...taskContract.nonGoals,
        ...taskContract.acceptance
      ].join(" "),
      owner: "kernel",
      confidence: 80,
      applicationGuidance: "Use for activation retrieval relevance.",
      invalidationRule: "Revisit when activation retrieval policy changes.",
      sourceLineage: [{ sourceId: activationClaim.id }],
      isUserPreference: false,
      validFrom: past,
      metadata: {
        smokeId: marker
      }
    });
    const noTermFallbackRecords = await memoryRepository.listActiveMemory(project.id, 1);
    await memoryRepository.createAntiMemoryRecord({
      projectId: project.id,
      executionRunId: executionRun.id,
      key: `activation-smoke:${marker}:anti-crawler`,
      rejectedClaim: "Activation readiness should add a source crawler.",
      reason: "Source crawler is out of scope for M25.",
      invalidatedBySourceClaimIds: [crawlerClaim.id],
      appliesTo: "M25 activation smoke",
      mayRevisitWhen: "A later source-crawler milestone is accepted.",
      validFrom: past,
      summary: "Do not add crawler for M25 activation",
      body: "Use existing source, memory, and search substrate before adding crawler scope.",
      owner: "kernel",
      confidence: 95,
      sourceLineage: [{ sourceId: activationClaim.id }],
      metadata: {
        smokeId: marker
      }
    });

    const sourceQuery = buildSourceQuery(taskContract);
    const [foreignProject] = await db
      .insert(projects)
      .values({
        workspaceId: project.workspaceId,
        slug: `activation-engine-foreign-${marker}`,
        displayName: `activation-engine-foreign-${marker}`,
        metadata: {
          smokeId: marker
        }
      })
      .returning({ id: projects.id });

    if (foreignProject === undefined) {
      throw new Error("Activation smoke could not create its foreign-project fixture");
    }

    const foreignSourceArtifact = await sourceRepository.createSourceArtifact({
      projectId: foreignProject.id,
      kind: "operator_input",
      sourceAuthority: "project-decision",
      uri: `operator://activation-smoke/${marker}/foreign`,
      title: "Activation smoke foreign source",
      contentHash: `activation-smoke-foreign-${marker}`,
      metadata: {
        smokeId: marker
      }
    });
    const foreignClaim = await sourceRepository.createSourceClaim({
      sourceArtifactId: foreignSourceArtifact.id,
      executionRunId: executionRun.id,
      claim: "A foreign-project index subject must not enter this activation.",
      mechanism: "The canonical SourceClaim belongs to another project.",
      krnImplication: "Activation must fail closed on cross-project index links.",
      doesNotProve: "This does not prove project-level authorization outside activation.",
      sourceAuthority: "project-decision",
      supportType: "implementation-boundary",
      consumer: "activation smoke",
      falsifier: "A foreign-project index link enters activation.",
      status: "proposed",
      metadata: {
        smokeId: marker
      }
    });
    const searchDocument = await retrievalRepository.createSearchDocument({
      projectId: project.id,
      subjectType: "source_claim",
      subjectId: activationClaim.id,
      sourceClaimId: activationClaim.id,
      title: "Activation smoke search document",
      body: "Activation readiness uses search candidates, explicit exclusions, anti-memory conflict handling, bounded context, and persisted decisions.",
      searchText: sourceQuery.text,
      sourceAuthority: "project-decision",
      validFrom: past,
      metadata: {
        smokeId: marker
      }
    });
    const expiredMemorySearchDocument = await retrievalRepository.createSearchDocument({
      projectId: project.id,
      subjectType: "memory_record",
      subjectId: relevantMemory.id,
      memoryRecordId: relevantMemory.id,
      title: "Expired activation memory projection",
      body: "An expired projection must not boost a current canonical memory record.",
      searchText: Array.from({ length: 20 }, () => sourceQuery.text).join(" "),
      sourceAuthority: "project-decision",
      validFrom: past,
      validUntil: expiredValidUntil,
      metadata: {
        smokeId: marker,
        temporalCase: "expired-memory-projection"
      }
    });
    const crossProjectSearchDocument = await retrievalRepository.createSearchDocument({
      projectId: project.id,
      subjectType: "source_claim",
      subjectId: foreignClaim.id,
      sourceClaimId: foreignClaim.id,
      title: "Activation smoke cross-project search document",
      body: "This active index row points at a SourceClaim in another project.",
      searchText: sourceQuery.text,
      sourceAuthority: "project-decision",
      validFrom: past,
      metadata: {
        smokeId: marker
      }
    });
    const historicallyEligibleSearchResults = await retrievalRepository.searchLexical({
      projectId: project.id,
      query: sourceQuery.text,
      now: past,
      limit: 25
    });
    const staleProjectionHistoricalScore = historicallyEligibleSearchResults.find(
      (document) => document.id === expiredMemorySearchDocument.id
    )?.lexicalScore ?? Number.NaN;

    const retrieved = await retrieveActivationCandidates({
      taskContract,
      now,
      limits: {
        memory: boundedMemoryLimit,
        source: 25,
        search: 25,
        antiMemory: 25
      },
      repositories: {
        memoryRepository,
        sourceRepository,
        retrievalRepository
      }
    });
    const lowerAuthorityRetrievedCandidate = retrieved.candidates.find(
      (candidate) => candidate.subjectId === lowerAuthorityClaim.id
    );
    const lowerAuthorityPeerRetrievedCandidate = retrieved.candidates.find(
      (candidate) => candidate.subjectId === lowerAuthorityPeerClaim.id
    );
    const canonicalRelevantMemory = requireSmokeReadbackValue(
      rankCandidates([toMemoryCandidate(relevantMemory)], retrieved.memoryQuery)[0],
      "canonical relevant memory",
      "Activation smoke could not rank its canonical relevant memory"
    );
    const retrievedRelevantMemory = requireSmokeReadbackValue(
      retrieved.candidates.find((candidate) => candidate.subjectId === relevantMemory.id),
      "retrieved relevant memory",
      "Activation smoke did not retrieve its canonical relevant memory"
    );
    const relevantMemoryRetrieved = retrieved.candidates.some(
      (candidate) => candidate.subjectId === relevantMemory.id
    );
    const retrievalRun = await retrievalRepository.startRetrievalRun({
      projectId: project.id,
      executionRunId: executionRun.id,
      taskContractId: taskContract.id,
      query: retrieved.memoryQuery.text,
      mode: "mixed",
      tokenBudget: 420,
      metadata: {
        smokeId: marker,
        sourceQuery: retrieved.sourceQuery.text
      }
    });
    const filterResult = applyActivationFilters({
      candidates: retrieved.candidates,
      antiMemoryRecords: retrieved.antiMemoryRecords,
      minimumSourceAuthority: "medium",
      now
    });
    const staleMemoryWarningRetrieved = filterResult.candidates.some(
      (candidate) =>
        candidate.subjectId === expiredMemory.id && candidate.exclusion?.reason === "stale"
    );
    const staleSourceWarningRetrieved = filterResult.candidates.some(
      (candidate) =>
        candidate.subjectId === expiredSourceClaim.id && candidate.exclusion?.reason === "stale"
    );
    const temporalBoundaryWarningRetrieved = filterResult.candidates.some(
      (candidate) =>
        candidate.subjectId === temporalBoundarySourceClaim.id &&
        candidate.exclusion?.reason === "stale"
    );
    const temporalRankedDownCandidate = filterResult.candidates.find(
      (candidate) => candidate.subjectId === temporalRankedDownSourceClaim.id
    );
    const temporalGoverningCandidate = filterResult.candidates.find(
      (candidate) => candidate.subjectId === temporalGoverningSourceClaim.id
    );
    const currentSourceClaimEdgeGoverned =
      temporalRankedDownCandidate?.exclusion?.reason === "superseded" &&
      hasSerializedReference(
        temporalRankedDownCandidate.sourceClaimEdgeRankDown,
        currentSourceClaimEdge.id
      );
    const expiredOrEqualSourceClaimEdgeGoverned =
      hasSerializedReference(temporalGoverningCandidate, expiredSourceClaimEdge.id) ||
      hasSerializedReference(temporalGoverningCandidate, equalSourceClaimEdge.id);
    const filteredCandidates = applyContextROI(
      filterResult.candidates,
      {
        tokenBudget: 420,
        maxInclusions: 3,
        minimumDiverseKinds: ["memory", "source"]
      }
    );
    const observationPrefix = selectObservationPrefix({
      task: taskContract,
      projectId: project.id,
      observations: [
        {
          id: `activation-smoke-observation-${marker}-selected`,
          groupId: `activation-smoke-observation-group-${marker}`,
          scope: {
            projectId: project.id,
            taskContractId: taskContract.id
          },
          kind: "fact",
          status: "candidate",
          priority: "high",
          confidence: "high",
          provenanceKind: "run_event",
          subject: "activation smoke bounded context",
          summary: "Activation smoke observations remain source-ranged.",
          body: "Observation prefix integration should add a small source-ranged activation artifact, not a MemoryRecord.",
          temporalScope: {
            observedAt: now,
            ingestedAt: now,
            validFrom: now
          },
          sourceRanges: [{
            id: `activation-smoke-source-range-${marker}`,
            sourceType: "run_event",
            sourceId: executionRun.id,
            locator: "execution_run.initial_event",
            capturedAt: now
          }],
          entityLinks: [],
          claimLinks: [],
          metadata: {
            smokeId: marker
          },
          createdAt: now,
          updatedAt: now
        },
        {
          id: `activation-smoke-observation-${marker}-unrelated`,
          groupId: `activation-smoke-observation-group-${marker}`,
          scope: {
            projectId: project.id
          },
          kind: "fact",
          status: "candidate",
          priority: "critical",
          confidence: "high",
          provenanceKind: "run_event",
          subject: "release calendar",
          summary: "Release calendar moved.",
          body: "This unrelated observation must not enter activation prefix by priority alone.",
          temporalScope: {
            observedAt: now,
            ingestedAt: now,
            validFrom: now
          },
          sourceRanges: [{
            id: `activation-smoke-source-range-${marker}-unrelated`,
            sourceType: "run_event",
            sourceId: executionRun.id,
            locator: "execution_run.initial_event",
            capturedAt: now
          }],
          entityLinks: [],
          claimLinks: [],
          metadata: {
            smokeId: marker
          },
          createdAt: now,
          updatedAt: now
        }
      ] satisfies ObservationItem[],
      antiMemoryRecords: retrieved.antiMemoryRecords,
      maxItems: 1,
      now
    });
    const draftContext = assembleContext({
      id: `activation-smoke-context-${marker}`,
      harnessPlanId: harnessPlan.id,
      candidates: filteredCandidates,
      observationPrefix,
      tokenBudget: 420,
      createdAt: now,
      metadata: {
        smokeId: marker,
        retrievalRunId: retrievalRun.id,
        conflictSets: filterResult.conflictSets
      }
    });
    const contextAssembly = await createSmokeContextAssembly(
      harnessRunRepository,
      draftContext,
      filteredCandidates,
      draftContext.observationPrefix === undefined
        ? {}
        : { observationPrefixSnapshot: draftContext.observationPrefix }
    );
    setContextAssemblyId(contextAssembly.id);

    await persistActivationTrace({
      retrievalRunId: retrievalRun.id,
      candidates: filteredCandidates,
      contextAssembly,
      completedAt: now,
      retrievalRepository,
      rawRecall: {
        requireExactProof: true,
        exactProofKinds: ["source", "search"]
      },
      metadata: {
        smokeId: marker,
        conflictCount: filterResult.conflictSets.length
      }
    });

    const issuedPacket = await harnessRunRepository.issueDecisionPacketForExecutionRun(
      executionRun.id
    );
    const issuedPacketReadback = requireSmokeReadbackValue(
      await harnessRunRepository.getIssuedDecisionPacketForExecutionRun(executionRun.id),
      "issued DecisionPacket readback",
      "Activation smoke could not read back its issued DecisionPacket"
    );

    const candidates = await retrievalRepository.listCandidatesForRetrievalRun(retrievalRun.id);
    const activationRecords = await retrievalRepository.listActivationDecisionsForRun(
      retrievalRun.id
    );
    const readBackContextAssemblyRows = await db
      .select({
        id: contextAssemblies.id,
        retrievalRunId: sql<string>`${contextAssemblies.metadata}->>'retrievalRunId'`,
        metadata: contextAssemblies.metadata
      })
      .from(contextAssemblies)
      .where(eq(contextAssemblies.id, contextAssembly.id));
    const readBackRetrievalRunRows = await db
      .select({
        id: retrievalRuns.id,
        metadata: retrievalRuns.metadata
      })
      .from(retrievalRuns)
      .where(eq(retrievalRuns.id, retrievalRun.id));
    const contextSelectionCounts = await countSmokeContextSelectionRows(db, contextAssembly.id);
    const [persistedContextItems, persistedContextExclusions] = await Promise.all([
      db
        .select({ subjectId: contextItems.subjectId, metadata: contextItems.metadata })
        .from(contextItems)
        .where(eq(contextItems.contextAssemblyId, contextAssembly.id)),
      db
        .select({
          subjectId: contextExclusions.subjectId,
          sourceAuthority: contextExclusions.sourceAuthority,
          metadata: contextExclusions.metadata
        })
        .from(contextExclusions)
        .where(eq(contextExclusions.contextAssemblyId, contextAssembly.id))
    ]);
    const searchDocumentRows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(searchDocuments)
      .where(sql`${searchDocuments.metadata}->>'smokeId' = ${marker}`);
    const authorityCeilingRows = await db
      .select({
        artifactId: sourceArtifacts.id,
        artifactAuthority: sourceArtifacts.sourceAuthority,
        claimId: sourceClaims.id,
        claimAuthority: sourceClaims.sourceAuthority
      })
      .from(sourceClaims)
      .innerJoin(sourceArtifacts, eq(sourceClaims.sourceArtifactId, sourceArtifacts.id))
      .where(eq(sourceClaims.id, lowerAuthorityClaim.id));

    const readBackContextAssembly = readBackContextAssemblyRows[0];
    const readBackRetrievalRun = readBackRetrievalRunRows[0];
    const sourceClaimCount = [
      activationClaim,
      lowerAuthorityPeerClaim,
      lowerAuthorityClaim,
      crawlerClaim,
      expiredSourceClaim,
      temporalGoverningSourceClaim,
      temporalRankedDownSourceClaim,
      temporalBoundarySourceClaim
    ].length + 1;
    const memoryRecordCount = 2 + relevanceDistractorCount + 1;
    const relevantMemoryCandidateCount = candidates.filter(
      (candidate) => candidate.subjectId === relevantMemory.id
    ).length;
    const relevantMemoryIncludedDecisionCount = activationRecords.filter(
      (decision) => decision.subjectId === relevantMemory.id && decision.decision === "included"
    ).length;
    const relevanceDistractorCandidateCount = candidates.filter(
      (candidate) => relevanceDistractorIds.includes(candidate.subjectId)
    ).length;
    const relevanceDistractorExcludedDecisionCount = activationRecords.filter(
      (decision) =>
        relevanceDistractorIds.includes(decision.subjectId) && decision.decision === "excluded"
    ).length;
    const relevanceDistractorContextInclusionCount = contextAssembly.inclusions.filter(
      (inclusion) => relevanceDistractorIds.includes(inclusion.subjectId)
    ).length;
    const decisionPacketMemoryRefCount = issuedPacketReadback.packet.memoryRefs.length;
    const decisionPacketRelevantMemorySelected =
      issuedPacketReadback.packet.memoryRefs.includes(relevantMemory.id);
    const decisionPacketDistractorRefCount = issuedPacketReadback.packet.memoryRefs.filter(
      (memoryRecordId) => relevanceDistractorIds.includes(memoryRecordId)
    ).length;
    const decisionPacketReadbackMatched =
      issuedPacketReadback.packetIdentity.checksum === issuedPacket.packetIdentity.checksum;
    const persistedRelevantMemory = candidates.find(
      (candidate) => candidate.subjectId === relevantMemory.id
    );
    const temporalPersistedRankedDownCandidate = candidates.find(
      (candidate) => candidate.subjectId === temporalRankedDownSourceClaim.id
    );
    const temporalPersistedRankDown = persistedSourceClaimEdgeRankDown(
      temporalPersistedRankedDownCandidate?.metadata
    );
    const temporalPersistedRankDownEdgeIds =
      temporalPersistedRankDown?.edgeIds ?? [];
    const temporalPersistedRankDownGoverningSourceClaimIds =
      temporalPersistedRankDown?.governingSourceClaimIds ?? [];
    const relevantMemoryCanonicalScore = canonicalRelevantMemory.totalScore;
    const relevantMemoryPersistedScore = persistedRelevantMemory?.totalScore ?? Number.NaN;
    const lowerAuthorityPersistedCandidate = candidates.find(
      (candidate) => candidate.subjectId === lowerAuthorityClaim.id
    );
    const lowerAuthorityPeerPersistedCandidate = candidates.find(
      (candidate) => candidate.subjectId === lowerAuthorityPeerClaim.id
    );
    const lowerAuthorityCandidateScore =
      lowerAuthorityPersistedCandidate?.totalScore ?? Number.NaN;
    const lowerAuthorityPeerCandidateScore =
      lowerAuthorityPeerPersistedCandidate?.totalScore ?? Number.NaN;
    const lowerAuthorityPacketExclusion = issuedPacketReadback.packet.contextExclusions.find(
      (exclusion) => exclusion.subjectId === lowerAuthorityClaim.id
    );
    const lowerAuthorityContextExclusion = persistedContextExclusions.find(
      (exclusion) => exclusion.subjectId === lowerAuthorityClaim.id
    );
    const lowerAuthorityPacketExclusionMatched =
      lowerAuthorityPacketExclusion?.subjectType === "source_claim" &&
      lowerAuthorityPacketExclusion.sourceAuthority === "hypothesis";
    const lowerAuthoritySelectedAsPacketAuthority =
      issuedPacketReadback.packet.sourceClaimIds.includes(lowerAuthorityClaim.id) ||
      issuedPacketReadback.packet.caveatedSourceClaimIds.includes(lowerAuthorityClaim.id) ||
      issuedPacketReadback.packet.brief.includedSourceClaimIds.includes(lowerAuthorityClaim.id);
    const lowerAuthorityReadback = authorityCeilingRows[0];
    const retrievedNonAuthorityScoresMatch =
      lowerAuthorityRetrievedCandidate?.lexicalScore ===
        lowerAuthorityPeerRetrievedCandidate?.lexicalScore &&
      lowerAuthorityRetrievedCandidate?.vectorScore ===
        lowerAuthorityPeerRetrievedCandidate?.vectorScore &&
      lowerAuthorityRetrievedCandidate?.graphScore ===
        lowerAuthorityPeerRetrievedCandidate?.graphScore &&
      lowerAuthorityRetrievedCandidate?.temporalScore ===
        lowerAuthorityPeerRetrievedCandidate?.temporalScore &&
      lowerAuthorityRetrievedCandidate?.contextRoiScore ===
        lowerAuthorityPeerRetrievedCandidate?.contextRoiScore &&
      lowerAuthorityRetrievedCandidate?.feedbackScore ===
        lowerAuthorityPeerRetrievedCandidate?.feedbackScore;
    const persistedNonAuthorityScoresMatch =
      lowerAuthorityPersistedCandidate?.lexicalScore ===
        lowerAuthorityPeerPersistedCandidate?.lexicalScore &&
      lowerAuthorityPersistedCandidate?.vectorScore ===
        lowerAuthorityPeerPersistedCandidate?.vectorScore &&
      lowerAuthorityPersistedCandidate?.graphScore ===
        lowerAuthorityPeerPersistedCandidate?.graphScore &&
      lowerAuthorityPersistedCandidate?.temporalScore ===
        lowerAuthorityPeerPersistedCandidate?.temporalScore &&
      lowerAuthorityPersistedCandidate?.contextRoiScore ===
        lowerAuthorityPeerPersistedCandidate?.contextRoiScore;
    const staleProjectionCandidateRefCount = candidates.filter((candidate) =>
      candidate.searchDocumentId === expiredMemorySearchDocument.id ||
      hasSerializedReference(candidate.metadata, expiredMemorySearchDocument.id)
    ).length;
    const staleProjectionDecisionRefCount = activationRecords.filter((decision) =>
      hasSerializedReference(decision, expiredMemorySearchDocument.id)
    ).length;
    const staleProjectionContextRefCount = [
      ...persistedContextItems,
      ...persistedContextExclusions
    ].filter((row) => hasSerializedReference(row, expiredMemorySearchDocument.id)).length;
    const staleProjectionPacketRefCount = hasSerializedReference(
      issuedPacketReadback,
      expiredMemorySearchDocument.id
    ) ? 1 : 0;
    const antiMemoryRecordCount = retrieved.antiMemoryRecords.length;
    const searchDocumentCount = searchDocumentRows[0]?.count ?? 0;
    const indexOnlySearchExcluded = !contextAssembly.inclusions.some(
      (inclusion) => inclusion.subjectId === searchDocument.id
    );
    const crossProjectIndexExcluded = !contextAssembly.inclusions.some(
      (inclusion) => inclusion.subjectId === crossProjectSearchDocument.id
    );
    const searchCandidateCount = candidates.filter((candidate) =>
      candidate.kind === "search" || hasMergedSearchSignal(candidate.metadata)
    ).length;
    const retrievalCandidateCount = candidates.length;
    const activationDecisionCount = activationRecords.length;
    const includedDecisionCount = countByDecision(activationRecords, "included");
    const excludedDecisionCount = countByDecision(activationRecords, "excluded");
    const conflictDecisionCount = countByDecision(activationRecords, "conflict");
    const staleDecisionCount = countByDecision(activationRecords, "stale");
    const staleMemoryDecisionCountForSubject = activationRecords.filter(
      (decision) => decision.subjectId === expiredMemory.id && decision.decision === "stale"
    ).length;
    const staleSourceDecisionCountForSubject = activationRecords.filter(
      (decision) => decision.subjectId === expiredSourceClaim.id && decision.decision === "stale"
    ).length;
    const staleMemoryWarningPersisted = staleMemoryDecisionCountForSubject === 1;
    const staleSourceWarningPersisted = staleSourceDecisionCountForSubject === 1;
    const packetStaleMemoryExclusionCount = issuedPacketReadback.packet.contextExclusions.filter(
      (exclusion) =>
        exclusion.subjectType === "memory_record" &&
        exclusion.subjectId === expiredMemory.id &&
        exclusion.reason === "stale"
    ).length;
    const packetStaleSourceExclusionCount = issuedPacketReadback.packet.contextExclusions.filter(
      (exclusion) =>
        exclusion.subjectType === "source_claim" &&
        exclusion.subjectId === expiredSourceClaim.id &&
        exclusion.reason === "stale"
    ).length;
    const staleMemorySelectedAsAuthority =
      issuedPacketReadback.packet.memoryRefs.includes(expiredMemory.id) ||
      issuedPacketReadback.packet.caveatedMemoryRefs.includes(expiredMemory.id) ||
      issuedPacketReadback.packet.taskStandardDecisions.some(
        (decision) => decision.memoryRecordId === expiredMemory.id
      ) ||
      issuedPacketReadback.packet.brief.includedMemoryRecordIds.includes(expiredMemory.id);
    const staleSourceSelectedAsAuthority =
      issuedPacketReadback.packet.sourceClaimIds.includes(expiredSourceClaim.id) ||
      issuedPacketReadback.packet.caveatedSourceClaimIds.includes(expiredSourceClaim.id) ||
      issuedPacketReadback.packet.brief.includedSourceClaimIds.includes(expiredSourceClaim.id) ||
      issuedPacketReadback.packet.governingDecisionIds.includes(expiredSourceDecision.id) ||
      issuedPacketReadback.packet.sourceDecisionEdgeIds.includes(expiredSourceDecisionEdge.id);
    const temporalBoundaryPacketExclusionCount =
      issuedPacketReadback.packet.contextExclusions.filter(
        (exclusion) =>
          exclusion.subjectType === "source_claim" &&
          exclusion.subjectId === temporalBoundarySourceClaim.id &&
          exclusion.reason === "stale"
      ).length;
    const temporalBoundarySelectedAsAuthority =
      issuedPacketReadback.packet.sourceClaimIds.includes(temporalBoundarySourceClaim.id) ||
      issuedPacketReadback.packet.caveatedSourceClaimIds.includes(temporalBoundarySourceClaim.id) ||
      issuedPacketReadback.packet.brief.includedSourceClaimIds.includes(
        temporalBoundarySourceClaim.id
      );
    const temporalSourceClaimIds = [
      temporalGoverningSourceClaim.id,
      temporalRankedDownSourceClaim.id,
      temporalBoundarySourceClaim.id
    ];
    const temporalPacketSourceClaimIds = issuedPacketReadback.packet.sourceClaimIds.filter(
      (id) => temporalSourceClaimIds.includes(id)
    );
    const temporalPacketBriefSourceClaimIds =
      issuedPacketReadback.packet.brief.includedSourceClaimIds.filter(
        (id) => temporalSourceClaimIds.includes(id)
      );
    const temporalSourceDecisionEdgeIds = [
      temporalGoverningSourceDecisionEdge.id,
      temporalRankedDownSourceDecisionEdge.id
    ];
    const temporalPacketSourceDecisionEdgeIds =
      issuedPacketReadback.packet.sourceDecisionEdgeIds.filter(
        (id) => temporalSourceDecisionEdgeIds.includes(id)
      );
    const currentSourceClaimEdgePacketRefCount = hasSerializedReference(
      issuedPacketReadback.packet,
      currentSourceClaimEdge.id
    ) ? 1 : 0;
    const expiredSourceClaimEdgePacketRefCount = hasSerializedReference(
      issuedPacketReadback.packet,
      expiredSourceClaimEdge.id
    ) ? 1 : 0;
    const equalSourceClaimEdgePacketRefCount = hasSerializedReference(
      issuedPacketReadback.packet,
      equalSourceClaimEdge.id
    ) ? 1 : 0;
    const { contextItemCount, contextExclusionCount } = contextSelectionCounts;
    const prefixItemCount = observationPrefixItemCount(readBackContextAssembly?.metadata);
    const rawRecallTriggerCount = rawEvidenceRecallTriggerCount(readBackRetrievalRun?.metadata);

    assertSmokeReadbackChecks(
      [
        { label: "context assembly exists", passed: readBackContextAssembly !== undefined },
        { label: "context assembly retrieval run", passed: readBackContextAssembly?.retrievalRunId === retrievalRun.id },
        { label: "retrieval run exists", passed: readBackRetrievalRun !== undefined },
        { label: "source claims", passed: sourceClaimCount === 9 },
        {
          label: "only current SourceClaimEdge governs activation",
          passed: currentSourceClaimEdgeGoverned && !expiredOrEqualSourceClaimEdgeGoverned
        },
        {
          label: "persisted temporal rank-down names the exact current edge and governing claim",
          passed:
            containsExactly(temporalPersistedRankDownEdgeIds, [currentSourceClaimEdge.id]) &&
            containsExactly(temporalPersistedRankDownGoverningSourceClaimIds, [
              temporalGoverningSourceClaim.id
            ])
        },
        {
          label: "lower authority stored below artifact",
          passed:
            authorityCeilingRows.length === 1 &&
            lowerAuthorityReadback?.artifactId === sourceArtifact.id &&
            lowerAuthorityReadback.artifactAuthority === "project-decision" &&
            lowerAuthorityReadback.claimId === lowerAuthorityClaim.id &&
            lowerAuthorityReadback.claimAuthority === "hypothesis"
        },
        {
          label: "lower authority survives activation retrieval",
          passed:
            lowerAuthorityRetrievedCandidate?.subjectId === lowerAuthorityClaim.id &&
            lowerAuthorityRetrievedCandidate.sourceAuthority === "hypothesis" &&
            lowerAuthorityRetrievedCandidate.sourceAuthorityRank === "low" &&
            lowerAuthorityRetrievedCandidate.metadata.sourceArtifactId === sourceArtifact.id
        },
        {
          label: "authority-only activation score delta",
          passed:
            lowerAuthorityRetrievedCandidate?.subjectId === lowerAuthorityClaim.id &&
            lowerAuthorityPeerRetrievedCandidate?.subjectId === lowerAuthorityPeerClaim.id &&
            lowerAuthorityPeerRetrievedCandidate.sourceAuthority === "project-decision" &&
            lowerAuthorityPeerRetrievedCandidate.sourceAuthorityRank === "high" &&
            retrievedNonAuthorityScoresMatch &&
            persistedNonAuthorityScoresMatch &&
            lowerAuthorityCandidateScore === lowerAuthorityRetrievedCandidate.totalScore &&
            lowerAuthorityPeerCandidateScore === lowerAuthorityPeerRetrievedCandidate.totalScore &&
            lowerAuthorityPeerCandidateScore - lowerAuthorityCandidateScore === 20
        },
        {
          label: "lower authority persists in context exclusion",
          passed:
            lowerAuthorityPersistedCandidate?.sourceAuthority === "hypothesis" &&
            lowerAuthorityPersistedCandidate.metadata.authorityRank === "low" &&
            lowerAuthorityContextExclusion?.sourceAuthority === "hypothesis"
        },
        {
          label: "lower authority persists in DecisionPacket exclusion",
          passed:
            lowerAuthorityPacketExclusionMatched &&
            !lowerAuthoritySelectedAsPacketAuthority
        },
        { label: "memory records", passed: memoryRecordCount === 2 + relevanceDistractorCount + 1 },
        { label: "no-term memory fallback remains bounded", passed: noTermFallbackRecords.length === 1 },
        { label: "relevant memory before bounded limit", passed: relevantMemoryRetrieved },
        { label: "relevant memory candidate count", passed: relevantMemoryCandidateCount === 1 },
        { label: "relevant memory included decision count", passed: relevantMemoryIncludedDecisionCount === 1 },
        {
          label: "one-term distractor candidate count",
          passed: relevanceDistractorCandidateCount === boundedMemoryLimit - 2
        },
        {
          label: "one-term distractors have excluded decisions",
          passed: relevanceDistractorExcludedDecisionCount === relevanceDistractorCandidateCount
        },
        { label: "one-term distractors excluded from context", passed: relevanceDistractorContextInclusionCount === 0 },
        {
          label: `DecisionPacket memory ref count (observed ${decisionPacketMemoryRefCount})`,
          passed: decisionPacketMemoryRefCount === 2
        },
        { label: "DecisionPacket selected relevant memory", passed: decisionPacketRelevantMemorySelected },
        {
          label: "DecisionPacket retained baseline memory",
          passed: issuedPacketReadback.packet.memoryRefs.includes(baselineMemory.id)
        },
        { label: "DecisionPacket excluded distractors", passed: decisionPacketDistractorRefCount === 0 },
        { label: "DecisionPacket persisted readback", passed: decisionPacketReadbackMatched },
        {
          label: `canonical memory score remains projection-free (expected ${relevantMemoryCanonicalScore}, persisted ${relevantMemoryPersistedScore})`,
          passed:
            retrievedRelevantMemory.totalScore === relevantMemoryCanonicalScore &&
            relevantMemoryPersistedScore === relevantMemoryCanonicalScore &&
            retrievedRelevantMemory.searchDocumentId === undefined &&
            retrievedRelevantMemory.searchDocumentIds === undefined
        },
        {
          label: `expired projection was boost-capable while current (historical score ${staleProjectionHistoricalScore})`,
          passed: staleProjectionHistoricalScore > relevantMemoryCanonicalScore
        },
        { label: "expired projection absent from persisted candidates", passed: staleProjectionCandidateRefCount === 0 },
        { label: "expired projection absent from persisted decisions", passed: staleProjectionDecisionRefCount === 0 },
        { label: "expired projection absent from context provenance", passed: staleProjectionContextRefCount === 0 },
        { label: "expired projection absent from DecisionPacket provenance", passed: staleProjectionPacketRefCount === 0 },
        { label: "anti-memory records", passed: antiMemoryRecordCount === 1 },
        { label: "search documents", passed: searchDocumentCount === 3 },
        { label: "index-only stale search excluded", passed: indexOnlySearchExcluded },
        { label: "cross-project search excluded", passed: crossProjectIndexExcluded },
        { label: "persisted stale source retrieved as warning", passed: staleSourceWarningRetrieved },
        {
          label: "equal-boundary source retrieved as warning",
          passed: temporalBoundaryWarningRetrieved
        },
        { label: "persisted stale memory retrieved as warning", passed: staleMemoryWarningRetrieved },
        { label: "search candidates", passed: searchCandidateCount >= 1 },
        { label: "retrieval candidates", passed: retrievalCandidateCount === 39 },
        { label: "activation decisions", passed: activationDecisionCount === 39 },
        { label: "included decisions", passed: includedDecisionCount === 3 },
        { label: "excluded decisions", passed: excludedDecisionCount === 32 },
        { label: "conflict decisions", passed: conflictDecisionCount === 1 },
        { label: "stale warning decisions", passed: staleDecisionCount === 3 },
        { label: "stale memory warning persisted", passed: staleMemoryWarningPersisted },
        { label: "stale source warning persisted", passed: staleSourceWarningPersisted },
        { label: "stale memory appears exactly once in packet exclusions", passed: packetStaleMemoryExclusionCount === 1 },
        { label: "stale source appears exactly once in packet exclusions", passed: packetStaleSourceExclusionCount === 1 },
        { label: "stale memory absent from selected packet authority", passed: !staleMemorySelectedAsAuthority },
        { label: "stale source absent from selected packet authority", passed: !staleSourceSelectedAsAuthority },
        {
          label: "equal-boundary source appears once in packet exclusions",
          passed: temporalBoundaryPacketExclusionCount === 1
        },
        {
          label: "equal-boundary source absent from selected packet authority",
          passed: !temporalBoundarySelectedAsAuthority
        },
        {
          label: "DecisionPacket selects exactly the current temporal source claim",
          passed: containsExactly(temporalPacketSourceClaimIds, [
            temporalGoverningSourceClaim.id
          ])
        },
        {
          label: "DecisionPacket brief includes exactly the current temporal source claim",
          passed: containsExactly(temporalPacketBriefSourceClaimIds, [
            temporalGoverningSourceClaim.id
          ])
        },
        {
          label: "DecisionPacket carries exactly the current temporal SourceDecisionEdge",
          passed: containsExactly(temporalPacketSourceDecisionEdgeIds, [
            temporalGoverningSourceDecisionEdge.id
          ])
        },
        {
          label: "current SourceClaimEdge persists in DecisionPacket",
          passed: currentSourceClaimEdgePacketRefCount === 1
        },
        {
          label: "expired SourceClaimEdge absent from DecisionPacket",
          passed: expiredSourceClaimEdgePacketRefCount === 0
        },
        {
          label: "equal-boundary SourceClaimEdge absent from DecisionPacket",
          passed: equalSourceClaimEdgePacketRefCount === 0
        },
        { label: "context items", passed: contextItemCount === 3 },
        { label: "context exclusions", passed: contextExclusionCount === 36 },
        { label: "observation prefix", passed: prefixItemCount === 1 },
        { label: "raw recall trigger readback", passed: rawRecallTriggerCount >= 0 }
      ],
      "Activation smoke readback did not match expected activation records"
    );
    const readBackContextAssemblyId = requireSmokeReadbackValue(
      readBackContextAssembly?.id,
      "context assembly id",
      "Activation smoke readback did not match expected activation records"
    );
    const readBackRetrievalRunId = requireSmokeReadbackValue(
      readBackRetrievalRun?.id,
      "retrieval run id",
      "Activation smoke readback did not match expected activation records"
    );

    const remainingMarkerCount = await cleanup();

    return {
      workspaceSlug,
      projectSlug,
      executionRunId: executionRun.id,
      taskContractId: taskContract.id,
      harnessPlanId: harnessPlan.id,
      contextAssemblyId: contextAssembly.id,
      readBackContextAssemblyId,
      retrievalRunId: retrievalRun.id,
      readBackRetrievalRunId,
      sourceClaimCount,
      lowerAuthorityArtifactId: sourceArtifact.id,
      lowerAuthorityClaimId: lowerAuthorityClaim.id,
      lowerAuthorityPeerClaimId: lowerAuthorityPeerClaim.id,
      lowerAuthorityCandidateScore,
      lowerAuthorityPeerCandidateScore,
      lowerAuthorityPacketExclusionMatched,
      temporalGoverningSourceClaimId: temporalGoverningSourceClaim.id,
      temporalRankedDownSourceClaimId: temporalRankedDownSourceClaim.id,
      temporalBoundarySourceClaimId: temporalBoundarySourceClaim.id,
      currentSourceClaimEdgeId: currentSourceClaimEdge.id,
      expiredSourceClaimEdgeId: expiredSourceClaimEdge.id,
      equalSourceClaimEdgeId: equalSourceClaimEdge.id,
      temporalPacketSourceClaimIds,
      temporalPacketBriefSourceClaimIds,
      temporalPacketSourceDecisionEdgeIds,
      temporalPersistedRankDownEdgeIds,
      temporalPersistedRankDownGoverningSourceClaimIds,
      currentSourceClaimEdgePacketRefCount,
      expiredSourceClaimEdgePacketRefCount,
      equalSourceClaimEdgePacketRefCount,
      memoryRecordCount,
      relevantMemoryRetrieved,
      relevantMemoryCandidateCount,
      relevantMemoryIncludedDecisionCount,
      relevanceDistractorCandidateCount,
      relevanceDistractorExcludedDecisionCount,
      relevanceDistractorContextInclusionCount,
      decisionPacketMemoryRefCount,
      decisionPacketRelevantMemorySelected,
      decisionPacketDistractorRefCount,
      decisionPacketReadbackMatched,
      relevantMemoryCanonicalScore,
      relevantMemoryPersistedScore,
      staleProjectionCandidateRefCount,
      staleProjectionDecisionRefCount,
      staleProjectionContextRefCount,
      staleProjectionPacketRefCount,
      staleProjectionHistoricalScore,
      antiMemoryRecordCount,
      searchDocumentCount,
      indexOnlySearchExcluded,
      crossProjectIndexExcluded,
      searchCandidateCount,
      retrievalCandidateCount,
      activationDecisionCount,
      includedDecisionCount,
      excludedDecisionCount,
      conflictDecisionCount,
      staleDecisionCount,
      staleMemoryWarningPersisted,
      staleSourceWarningPersisted,
      contextItemCount,
      contextExclusionCount,
      observationPrefixItemCount: prefixItemCount,
      rawEvidenceRecallTriggerCount: rawRecallTriggerCount,
      remainingMarkerCount,
      cleanedUp: remainingMarkerCount === 0
    };
  } finally {
    await client.end();
  }
};
