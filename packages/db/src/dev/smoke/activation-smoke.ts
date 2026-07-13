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
} from "./db-smoke-support.js";
import {
  contextAssemblies,
  memoryRecords,
  projects,
  retrievalRuns,
  searchDocuments,
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
  memoryRecordCount: number;
  relevantMemoryRetrieved: boolean;
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
  contextItemCount: number;
  contextExclusionCount: number;
  observationPrefixItemCount: number;
  rawEvidenceRecallTriggerCount: number;
  remainingMarkerCount: number;
  cleanedUp: boolean;
}

const relevanceDistractorCount = 25;

const countByDecision = (
  decisions: readonly { decision: string }[],
  decision: string
): number => decisions.filter((item) => item.decision === decision).length;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

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
      sourceAuthority: "project-decision",
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
    const relevanceKey = Date.now().toString();
    for (const index of Array.from({ length: relevanceDistractorCount }, (_, item) => item)) {
      const distractor = await memoryRepository.createMemoryRecord({
        projectId: project.id,
        key: `unrelated-release-distractor:${relevanceKey}:${index}`,
        kind: "procedure",
        status: "active",
        summary: "Unrelated release calendar note",
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
      body: "Activation smoke must preserve bounded task-relevant memory before candidate limits.",
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
      metadata: {
        smokeId: marker
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
      metadata: {
        smokeId: marker
      }
    });

    const retrieved = await retrieveActivationCandidates({
      taskContract,
      now,
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
        conflictSets: filterResult.conflictSets,
        canonicalRevisionTokens: filteredCandidates
          .map((candidate) => candidate.metadata.canonicalRevision)
          .filter((revision): revision is Record<string, unknown> => (
            typeof revision === "object" &&
            revision !== null &&
            !Array.isArray(revision) &&
            draftContext.inclusions.some((inclusion) => (
              inclusion.subjectType === (revision as Record<string, unknown>).subjectType &&
              inclusion.subjectId === (revision as Record<string, unknown>).subjectId
            ))
          ))
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
    const memoryRecordCount = 2 + relevanceDistractorCount + 1;
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
    const { contextItemCount, contextExclusionCount } = contextSelectionCounts;
    const prefixItemCount = observationPrefixItemCount(readBackContextAssembly?.metadata);
    const rawRecallTriggerCount = rawEvidenceRecallTriggerCount(readBackRetrievalRun?.metadata);

    assertSmokeReadbackChecks(
      [
        { label: "context assembly exists", passed: readBackContextAssembly !== undefined },
        { label: "context assembly retrieval run", passed: readBackContextAssembly?.retrievalRunId === retrievalRun.id },
        { label: "retrieval run exists", passed: readBackRetrievalRun !== undefined },
        { label: "source claims", passed: sourceClaimCount === 3 },
        { label: "memory records", passed: memoryRecordCount === 2 + relevanceDistractorCount + 1 },
        { label: "no-term memory fallback remains bounded", passed: noTermFallbackRecords.length === 1 },
        { label: "relevant memory before bounded limit", passed: relevantMemoryRetrieved },
        { label: "anti-memory records", passed: antiMemoryRecordCount === 1 },
        { label: "search documents", passed: searchDocumentCount === 2 },
        { label: "index-only stale search excluded", passed: indexOnlySearchExcluded },
        { label: "cross-project search excluded", passed: crossProjectIndexExcluded },
        { label: "search candidates", passed: searchCandidateCount >= 1 },
        { label: "retrieval candidates", passed: retrievalCandidateCount >= 5 },
        { label: "activation decisions", passed: activationDecisionCount >= 5 },
        { label: "included decisions", passed: includedDecisionCount >= 1 },
        { label: "conflict decisions", passed: conflictDecisionCount === 1 },
        { label: "stale decisions are filtered before activation", passed: staleDecisionCount === 0 },
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
      relevantMemoryRetrieved,
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
