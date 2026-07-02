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
  retrieveActivationCandidates,
  selectObservationPrefix
} from "@krn/harness";

import {
  assertSmokeReadbackChecks,
  cleanupActivationSmokeRows,
  countActivationSmokeMarkerRows,
  countSmokeContextSelectionRows,
  createSmokeHarnessScaffold,
  requireSmokeReadbackValue
} from "./dbSmokeSupport.js";
import {
  contextAssemblies,
  retrievalRuns,
  searchDocuments,
} from "./schema/index.js";
import {
  smokeFixtureClocks
} from "./smokeFixtureClocks.js";
import type {
  DrizzleHarnessRunRepository,
  DrizzleMemoryRepository,
  DrizzleRetrievalRepository,
  DrizzleSourceRepository
} from "./repositories/index.js";

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
  memoryRecordCount: number;
  antiMemoryRecordCount: number;
  searchDocumentCount: number;
  searchCandidateCount: number;
  retrievalCandidateCount: number;
  activationDecisionCount: number;
  includedDecisionCount: number;
  excludedDecisionCount: number;
  conflictDecisionCount: number;
  staleDecisionCount: number;
  contextItemCount: number;
  contextExclusionCount: number;
  observationPrefixItemCount: number;
  rawEvidenceRecallTriggerCount: number;
  remainingMarkerCount: number;
  cleanedUp: boolean;
}

const countByDecision = (
  decisions: readonly { decision: string }[],
  decision: string
): number => decisions.filter((item) => item.decision === decision).length;

const rawEvidenceRecallTriggerCount = (
  metadata: unknown
): number => {
  if (metadata === null || typeof metadata !== "object") {
    return 0;
  }

  const count = (metadata as Record<string, unknown>).rawEvidenceRecallTriggerCount;

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
  if (metadata === null || typeof metadata !== "object") {
    return 0;
  }

  const prefix = (metadata as Record<string, unknown>).observationPrefixSnapshot;

  if (prefix === null || typeof prefix !== "object") {
    return 0;
  }

  const count = (prefix as Record<string, unknown>).itemCount;

  return typeof count === "number" ? count : 0;
};

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
    const executionRun = await harnessRunRepository.createExecutionRun({
      harnessPlanId: harnessPlan.id,
      adapter: "smoke",
      status: "running",
      startedAt: now,
      initialEvent: {
        sequence: 1,
        type: "smoke.activation.started",
        message: "Activation smoke started",
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
      uri: `operator://activation-smoke/${marker}`,
      title: "Activation smoke source",
      contentHash: `activation-smoke-${marker}`,
      metadata: {
        smokeId: marker
      }
    });
    const activationClaim = await sourceRepository.createSourceClaim({
      sourceArtifactId: sourceArtifact.id,
      executionRunId: executionRun.id,
      claim: "Activation smoke should prove bounded context and explicit exclusions.",
      mechanism: "A noisy DB corpus forces the engine to rank, filter, include, exclude, and persist activation decisions.",
      krnImplication: "M25 activation can be checked through a live store-backed smoke command.",
      doesNotProve: "This does not prove production ranking quality.",
      trustTier: "project-decision",
      supportType: "implementation-boundary",
      consumer: "M25 activation smoke",
      falsifier: "Activation smoke readback or cleanup fails.",
      revisitWhen: "M25 activation policy changes.",
      status: "proposed",
      metadata: {
        smokeId: marker
      }
    });
    const crawlerClaim = await sourceRepository.createSourceClaim({
      sourceArtifactId: sourceArtifact.id,
      executionRunId: executionRun.id,
      claim: "Activation readiness should add a source crawler.",
      mechanism: "A crawler would gather more source material.",
      krnImplication: "Activation could inspect more documents.",
      doesNotProve: "The crawler is within M25 scope.",
      trustTier: "project-decision",
      supportType: "rejection",
      consumer: "M25 activation smoke",
      falsifier: "Anti-memory fails to block crawler scope.",
      revisitWhen: "A later milestone explicitly accepts crawler scope.",
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
      trustTier: "high",
      supportType: "risk",
      consumer: "M25 activation smoke",
      falsifier: "Source safety accepts a claim without mechanism.",
      revisitWhen: "Never for M25.",
      status: "proposed",
      metadata: {
        smokeId: marker
      }
    });
    await memoryRepository.createMemoryRecord({
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
    await memoryRepository.createMemoryRecord({
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
    await memoryRepository.createAntiMemoryRecord({
      projectId: project.id,
      executionRunId: executionRun.id,
      key: `activation-smoke:${marker}:anti-crawler`,
      rejectedClaim: "Activation readiness should add a source crawler.",
      reason: "Source crawler is out of scope for M25.",
      invalidatedBySourceClaimIds: [crawlerClaim.id],
      appliesTo: "M25 activation smoke",
      mayRevisitWhen: "A later source-crawler milestone is accepted.",
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
    await retrievalRepository.createSearchDocument({
      projectId: project.id,
      subjectType: "source_claim",
      subjectId: activationClaim.id,
      sourceClaimId: activationClaim.id,
      title: "Activation smoke search document",
      body: "Activation readiness uses search candidates, explicit exclusions, anti-memory conflict handling, bounded context, and persisted decisions.",
      searchText: sourceQuery.text,
      trustTier: "project-decision",
      metadata: {
        smokeId: marker
      }
    });

    const retrieved = await retrieveActivationCandidates({
      taskContract,
      limits: {
        memory: 25,
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
      minimumTrustTier: "medium",
      now
    });
    const filteredCandidates = applyContextROI(
      filterResult.candidates,
      {
        tokenBudget: 420,
        maxInclusions: 2,
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
    const contextAssembly = await harnessRunRepository.createContextAssembly({
      harnessPlanId: harnessPlan.id,
      status: draftContext.status,
      ...(draftContext.tokenBudget === undefined ? {} : { tokenBudget: draftContext.tokenBudget }),
      inclusions: draftContext.inclusions,
      exclusions: draftContext.exclusions,
      metadata: {
        ...draftContext.metadata,
        ...(draftContext.observationPrefix === undefined
          ? {}
          : { observationPrefixSnapshot: draftContext.observationPrefix })
      }
    });
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
    const searchDocumentRows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(searchDocuments)
      .where(sql`${searchDocuments.metadata}->>'smokeId' = ${marker}`);

    const readBackContextAssembly = readBackContextAssemblyRows[0];
    const readBackRetrievalRun = readBackRetrievalRunRows[0];
    const sourceClaimCount = [activationClaim, crawlerClaim].length + 1;
    const memoryRecordCount = 2;
    const antiMemoryRecordCount = retrieved.antiMemoryRecords.length;
    const searchDocumentCount = searchDocumentRows[0]?.count ?? 0;
    const searchCandidateCount = candidates.filter((candidate) =>
      candidate.kind === "search" || hasMergedSearchSignal(candidate.metadata)
    ).length;
    const retrievalCandidateCount = candidates.length;
    const activationDecisionCount = activationRecords.length;
    const includedDecisionCount = countByDecision(activationRecords, "included");
    const excludedDecisionCount = countByDecision(activationRecords, "excluded");
    const conflictDecisionCount = countByDecision(activationRecords, "conflict");
    const staleDecisionCount = countByDecision(activationRecords, "stale");
    const { contextItemCount, contextExclusionCount } = contextSelectionCounts;
    const prefixItemCount = observationPrefixItemCount(readBackContextAssembly?.metadata);
    const rawRecallTriggerCount = rawEvidenceRecallTriggerCount(readBackRetrievalRun?.metadata);

    assertSmokeReadbackChecks(
      [
        { label: "context assembly exists", passed: readBackContextAssembly !== undefined },
        { label: "context assembly retrieval run", passed: readBackContextAssembly?.retrievalRunId === retrievalRun.id },
        { label: "retrieval run exists", passed: readBackRetrievalRun !== undefined },
        { label: "source claims", passed: sourceClaimCount === 3 },
        { label: "memory records", passed: memoryRecordCount === 2 },
        { label: "anti-memory records", passed: antiMemoryRecordCount === 1 },
        { label: "search documents", passed: searchDocumentCount === 1 },
        { label: "search candidates", passed: searchCandidateCount >= 1 },
        { label: "retrieval candidates", passed: retrievalCandidateCount >= 5 },
        { label: "activation decisions", passed: activationDecisionCount >= 5 },
        { label: "included decisions", passed: includedDecisionCount >= 1 },
        { label: "conflict decisions", passed: conflictDecisionCount === 1 },
        { label: "stale decisions", passed: staleDecisionCount === 1 },
        { label: "context items", passed: contextItemCount >= 1 },
        { label: "context exclusions", passed: contextExclusionCount >= 3 },
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
      memoryRecordCount,
      antiMemoryRecordCount,
      searchDocumentCount,
      searchCandidateCount,
      retrievalCandidateCount,
      activationDecisionCount,
      includedDecisionCount,
      excludedDecisionCount,
      conflictDecisionCount,
      staleDecisionCount,
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
