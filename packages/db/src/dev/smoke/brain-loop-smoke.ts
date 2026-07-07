import {
  eq,
  inArray,
  sql
} from "drizzle-orm";
import {
  applyActivationFilters,
  applyContextROI,
  assembleContext,
  compileHarnessPlan,
  persistActivationTrace,
  promoteAntiMemoryCandidateThroughGate,
  promoteMemoryCandidateThroughGate,
  proposeMemoryConsolidation,
  retrieveActivationCandidates
} from "@krn/harness";
import type {
  EvidenceContract
} from "@krn/harness";
import {
  buildMemoryStalenessMaintenancePreview,
  sourceUsefulnessOutcomesFromMetadata
} from "@krn/core";
import type {
  CapabilityPlan,
  ContextAssembly,
  HarnessPlan,
  TaskContract
} from "@krn/core";

import type { KrnDatabase } from "../../database.js";
import {
  assertSmokeReadbackChecks,
  cleanupBrainLoopSmokeRows,
  countBrainLoopSmokeMarkerRows,
  createSmokeHarnessScaffold,
  requireSmokeReadbackValue
} from "./db-smoke-support.js";
import {
  contextAssemblies,
  memoryApplications,
  memoryRecordVersions,
  retrievalRuns
} from "../../schema/index.js";
import {
  smokeFixtureClocks
} from "./smoke-fixture-clocks.js";

export interface BrainLoopSmokeInput {
  databaseUrl: string;
  migrationsFolder: string;
  smokeId: string;
  renderExecutionBrief(input: BrainLoopExecutionBriefInput): string;
}

export interface BrainLoopExecutionBriefInput {
  taskContract: TaskContract;
  harnessPlan: HarnessPlan;
  contextAssembly: ContextAssembly;
  capabilityPlan: CapabilityPlan;
  evidenceContract: EvidenceContract;
  nextAction: string;
}

export interface BrainLoopSmokeReport {
  workspaceSlug: string;
  projectSlug: string;
  executionRunId: string;
  evidenceBundleId: string;
  reviewAssessmentId: string;
  feedbackDeltaId: string;
  sourceClaimId: string;
  sourceDecisionId: string;
  sourceDecisionTraceEdgeCount: number;
  sourceDecisionTraceEdgeIds: string[];
  sourceDecisionTraceTargetTypes: string[];
  decisionPacketGoverningDecisionIds: string[];
  decisionPacketRejectedPathIds: string[];
  decisionPacketFalsifierCommands: string[];
  decisionPacketNonProofs: string[];
  sourceClaimStatus: string;
  memoryCandidateId: string;
  reviewedMemoryCandidateStatus: string;
  memoryRecordId: string;
  readBackMemoryRecordId: string;
  memoryRecordVersionId: string;
  retrievalRunId: string;
  contextAssemblyId: string;
  readBackContextAssemblyId: string;
  activationDecisionCount: number;
  includedMemoryDecisionCount: number;
  contextItemCount: number;
  memoryApplicationId: string;
  memoryOriginRepoInstallationId: string;
  nextRunTaskContractId: string;
  nextRunRetrievalRunId: string;
  nextRunRepoInstallationIds: string[];
  nextRunCrossRepoMemoryInclusion: boolean;
  nextRunContextAssemblyId: string;
  nextRunCodexBriefRendered: boolean;
  nextRunCodexBriefIncludesMemory: boolean;
  nextRunCodexBriefIncludesNonProofBoundary: boolean;
  nextRunMemoryInclusionCount: number;
  nextRunIncludedMemoryDecisionCount: number;
  downgradedMemoryNegativeFeedbackCount: number;
  downgradedMemoryApplicationCount: number;
  downgradedRunTaskContractId: string;
  downgradedRunRetrievalRunId: string;
  downgradedRunRepoInstallationIds: string[];
  downgradedRunCrossRepoMemoryExclusion: boolean;
  downgradedRunContextAssemblyId: string;
  downgradedRunMemoryExclusionCount: number;
  downgradedRunExcludedMemoryDecisionCount: number;
  consolidationCandidateId: string;
  consolidationAntiMemoryCandidateId: string;
  consolidationMemoryFeedbackEventId: string;
  consolidationAntiMemoryRecordId: string;
  consolidationRunTaskContractId: string;
  consolidationRunRetrievalRunId: string;
  consolidationRunContextAssemblyId: string;
  consolidationRunMemoryExclusionCount: number;
  consolidationRunExcludedMemoryDecisionCount: number;
  consolidationRunAntiMemoryConflictCount: number;
  runEventCount: number;
  remainingMarkerCount: number;
  cleanedUp: boolean;
}

const now = smokeFixtureClocks.brainLoop.now;
const memoryOriginRepoInstallationId = "repo-installation-brain-loop-source";
const nextRunRepoInstallationId = "repo-installation-brain-loop-consumer";
const downgradedRunRepoInstallationId = "repo-installation-brain-loop-rejector";
const consolidationRunRepoInstallationId = "repo-installation-brain-loop-consolidation";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const stringMetadataValue = (
  metadata: Record<string, unknown>,
  key: string
): string | undefined => {
  const value = metadata[key];

  return typeof value === "string" ? value : undefined;
};

const unique = (values: readonly string[]): string[] =>
  [...new Set(values)];

const targetReadModelForRepo = (repoInstallationId: string) => ({
  projectKernelId: "brain-loop-shared-kernel",
  repoInstallationIds: [repoInstallationId],
  localPathHints: [`/tmp/krn/${repoInstallationId}`],
  sourceSeeds: [],
  trustExclusions: []
});

const repoInstallationIdsFromMetadata = (
  metadata: Record<string, unknown>
): string[] => {
  const targetReadModel = metadata["targetReadModel"];

  if (!isRecord(targetReadModel)) {
    return [];
  }

  const repoInstallationIds = targetReadModel["repoInstallationIds"];

  if (!Array.isArray(repoInstallationIds)) {
    return [];
  }

  return repoInstallationIds.filter((item): item is string => typeof item === "string");
};

const repoInstallationIdsForRetrievalRuns = async (input: {
  db: KrnDatabase;
  nextRunRetrievalRunId: string;
  downgradedRunRetrievalRunId: string;
}): Promise<{
  nextRunRepoInstallationIds: string[];
  downgradedRunRepoInstallationIds: string[];
}> => {
  const retrievalRunMetadataRows = await input.db
    .select({
      id: retrievalRuns.id,
      metadata: retrievalRuns.metadata
    })
    .from(retrievalRuns)
    .where(inArray(retrievalRuns.id, [
      input.nextRunRetrievalRunId,
      input.downgradedRunRetrievalRunId
    ]));

  const repoInstallationIdsFor = (retrievalRunId: string): string[] =>
    repoInstallationIdsFromMetadata(
      retrievalRunMetadataRows.find((row) => row.id === retrievalRunId)?.metadata ?? {}
    );

  return {
    nextRunRepoInstallationIds: repoInstallationIdsFor(input.nextRunRetrievalRunId),
    downgradedRunRepoInstallationIds: repoInstallationIdsFor(input.downgradedRunRetrievalRunId)
  };
};

const crossRepoMemoryProof = (input: {
  memoryRecordMetadata: Record<string, unknown>;
  nextRunRepoInstallationIds: readonly string[];
  nextRunMemoryInclusionCount: number;
  downgradedRunRepoInstallationIds: readonly string[];
  downgradedRunMemoryExclusionCount: number;
}): {
  nextRunCrossRepoMemoryInclusion: boolean;
  downgradedRunCrossRepoMemoryExclusion: boolean;
} => {
  const memoryOriginRepoMatches =
    stringMetadataValue(input.memoryRecordMetadata, "originRepoInstallationId") === memoryOriginRepoInstallationId;

  return {
    nextRunCrossRepoMemoryInclusion:
      memoryOriginRepoMatches &&
      input.nextRunRepoInstallationIds.includes(nextRunRepoInstallationId) &&
      input.nextRunMemoryInclusionCount === 1,
    downgradedRunCrossRepoMemoryExclusion:
      memoryOriginRepoMatches &&
      input.downgradedRunRepoInstallationIds.includes(downgradedRunRepoInstallationId) &&
      input.downgradedRunMemoryExclusionCount === 1
  };
};

const sourceDecisionTraceTargetTypes = [
  "evidence_bundle",
  "feedback_delta",
  "harness_plan",
  "review_assessment",
  "task_contract"
] as const;

const sourceDecisionTraceRefs = (
  targets: ReturnType<typeof sourceDecisionTraceTargets>
): string[] => targets
  .map((target) => `${target.targetType}:${target.targetId}`)
  .sort();

const sourceDecisionTraceTargets = (input: {
  taskContractId: string;
  harnessPlanId: string;
  evidenceBundleId: string;
  reviewAssessmentId: string;
  feedbackDeltaId: string;
}) => [
  {
    targetType: "task_contract" as const,
    targetId: input.taskContractId,
    notes: "Source decision is traceable to the originating TaskContract."
  },
  {
    targetType: "harness_plan" as const,
    targetId: input.harnessPlanId,
    notes: "Source decision is traceable to the HarnessPlan compiled for the run."
  },
  {
    targetType: "evidence_bundle" as const,
    targetId: input.evidenceBundleId,
    notes: "Source decision is traceable to reviewed execution evidence."
  },
  {
    targetType: "review_assessment" as const,
    targetId: input.reviewAssessmentId,
    notes: "Source decision is traceable to the review assessment that accepted the evidence."
  },
  {
    targetType: "feedback_delta" as const,
    targetId: input.feedbackDeltaId,
    notes: "Source decision is traceable to the feedback delta produced from review."
  }
] as const;

const governingDecisionIdsFromMetadata = (
  metadata: Record<string, unknown>
): string[] => unique(sourceUsefulnessOutcomesFromMetadata(metadata).flatMap((outcome) =>
  outcome.sourceDecisionId !== undefined && (
    outcome.outcome === "selected" ||
    outcome.outcome === "used" ||
    outcome.outcome === "helped"
  )
    ? [outcome.sourceDecisionId]
    : []
));

const antiMemoryRejectedPathIdsFromActivationDecisions = (
  decisions: readonly { reason: string; metadata: Record<string, unknown> }[]
): string[] => unique(decisions.flatMap((decision) => {
  const antiMemoryRecordId = stringMetadataValue(decision.metadata, "antiMemoryRecordId");

  return decision.reason === "anti_memory_block" && antiMemoryRecordId !== undefined
    ? [antiMemoryRecordId]
    : [];
}));

export const runBrainLoopSmokeCheck = async (
  input: BrainLoopSmokeInput
): Promise<BrainLoopSmokeReport> => {
  let consolidationContextAssemblyId: string | undefined;
  let consolidationRetrievalRunId: string | undefined;
  let downgradedContextAssemblyId: string | undefined;
  let downgradedRetrievalRunId: string | undefined;
  let feedbackDeltaId: string | undefined;
  let retrievalRunId: string | undefined;
  let nextRetrievalRunId: string | undefined;
  let nextContextAssemblyId: string | undefined;
  const scaffold = await createSmokeHarnessScaffold({
    databaseUrl: input.databaseUrl,
    migrationsFolder: input.migrationsFolder,
    smokeId: input.smokeId,
    smokeName: "brain loop smoke",
    workspacePrefix: "krn-brain-loop-smoke",
    projectSlug: "brain-loop",
    cleanupRows: (cleanupInput) => cleanupBrainLoopSmokeRows({
      ...cleanupInput,
      consolidationRetrievalRunId,
      downgradedRetrievalRunId,
      feedbackDeltaId,
      nextRetrievalRunId,
      retrievalRunId
    }),
    countMarkerRows: (markerInput) => countBrainLoopSmokeMarkerRows({
      ...markerInput,
      consolidationContextAssemblyId,
      consolidationRetrievalRunId,
      downgradedContextAssemblyId,
      downgradedRetrievalRunId,
      feedbackDeltaId,
      nextContextAssemblyId,
      nextRetrievalRunId,
      retrievalRunId
    }),
    rawIntent: `brain loop smoke ${input.smokeId}`,
    taskContract: {
      title: "Use reviewed DB-backed brain loop memory",
      objective: "Prove persisted evidence and review can become reviewed Memory Core context for a next activation.",
      constraints: ["promote through MemoryReviewGate", "reuse promoted memory through activation"],
      nonGoals: ["no activation scoring rewrite", "no maintenance runtime", "no schema migration"],
      acceptance: ["evidence readback", "reviewed memory promotion", "next activation includes memory"]
    },
    harnessPlan: {
      summary: "DB-backed governed brain loop smoke",
      nextAction: "Persist evidence, review it, promote memory through MemoryReviewGate, and activate it."
    }
  });
  const {
    client,
    db,
    marker,
    workspace,
    workspaceSlug,
    projectSlug,
    project,
    taskContract,
    harnessPlan,
    harnessRunRepository,
    memoryRepository,
    retrievalRepository,
    sourceRepository,
    cleanup,
    setContextAssemblyId
  } = scaffold;

  try {
    const executionRun = await harnessRunRepository.createExecutionRun({
      harnessPlanId: harnessPlan.id,
      adapter: "smoke",
      status: "running",
      startedAt: now,
      initialEvent: {
        sequence: 1,
        type: "smoke.brain_loop.started",
        message: "Brain loop smoke started",
        payload: {
          smokeId: marker
        }
      },
      metadata: {
        smokeId: marker
      }
    });
    const evidenceBundle = await harnessRunRepository.createEvidenceBundle({
      executionRunId: executionRun.id,
      status: "captured",
      changedFiles: ["packages/db/src/dev/smoke/brain-loop-smoke.ts"],
      commands: [{
        command: "pnpm db:smoke:brain-loop",
        status: "passed",
        provenance: "operator_reported",
        assertedBy: "brain-loop-smoke",
        doesNotProve: "This command does not prove product readiness, ranking quality, maintenance execution, or autonomous memory quality."
      }],
      diffRisk: "low",
      reviewBurden: "DB smoke proof only.",
      rollbackPath: "Delete smoke marker rows.",
      event: {
        sequence: 2,
        type: "smoke.brain_loop.evidence_captured",
        message: "Brain loop smoke evidence captured",
        payload: {
          smokeId: marker
        }
      },
      metadata: {
        smokeId: marker,
        doesNotProve: "Evidence capture does not mutate Memory Core without review."
      }
    });
    const reviewAssessment = await harnessRunRepository.createReviewAssessment({
      evidenceBundleId: evidenceBundle.id,
      status: "accepted",
      reviewer: "brain-loop-smoke",
      summary: "Evidence is sufficient for one reviewed MemoryCandidate.",
      findings: [],
      metadata: {
        smokeId: marker,
        diffRisk: "low",
        reviewBurden: "low"
      }
    });
    const sourceArtifact = await sourceRepository.createSourceArtifact({
      projectId: project.id,
      kind: "operator_input",
      sourceAuthority: "project-decision",
      uri: `operator://brain-loop-smoke/${marker}`,
      title: "Brain loop smoke source",
      contentHash: `brain-loop-smoke-${marker}`,
      metadata: {
        smokeId: marker
      }
    });
    const proposedSourceClaim = await sourceRepository.createSourceClaim({
      sourceArtifactId: sourceArtifact.id,
      executionRunId: executionRun.id,
      claim: "A reviewed evidence bundle can become Memory Core context for a later activation.",
      mechanism: "Postgres persists evidence, review, feedback, a reviewable MemoryCandidate, MemoryReviewGate promotion, and activation trace readback.",
      krnImplication: "KRN can test the governed evidence-to-memory-to-activation loop against live DB repositories.",
      doesNotProve: "This does not prove activation ranking quality, product readiness, maintenance runtime, or autonomous reflection quality.",
      sourceAuthority: "project-decision",
      supportType: "implementation-boundary",
      consumer: "E2E-02 brain loop smoke",
      falsifier: "Brain loop smoke readback or cleanup fails.",
      revisitWhen: "The evidence, memory, or activation persistence contracts change.",
      status: "proposed",
      metadata: {
        smokeId: marker
      }
    });
    const sourceDecision = await sourceRepository.createSourceDecision({
      projectId: project.id,
      sourceClaimId: proposedSourceClaim.id,
      status: "adopt",
      decision: "Adopt the DB-backed brain loop source claim as implementation-boundary evidence.",
      rationale: "The source claim maps the live DB smoke mechanism to the governed memory promotion path.",
      falsifier: "MemoryReviewGate accepts a candidate whose source claim remains proposed.",
      consumer: "E2E-02 brain loop smoke",
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
        smokeId: marker,
        memoryRecordMutation: "none",
        sourceUsefulnessOutcomes: [{
          sourceDecisionId: sourceDecision.id,
          outcome: "helped",
          reason: "The accepted SourceDecision anchored the memory promotion and next activation proof.",
          evidenceRefs: [evidenceBundle.id, reviewAssessment.id],
          doesNotProve:
            "A helpful smoke SourceDecision does not prove broad source truth, activation quality, or product readiness."
        }]
      }
    });
    feedbackDeltaId = feedbackDelta.id;

    const sourceClaim = requireSmokeReadbackValue(
      await sourceRepository.getSourceClaimById(proposedSourceClaim.id),
      "accepted source claim readback",
      "Brain loop smoke source decision did not accept the source claim"
    );
    const sourceDecisionTraceTargetsForRun = sourceDecisionTraceTargets({
      taskContractId: taskContract.id,
      harnessPlanId: harnessPlan.id,
      evidenceBundleId: evidenceBundle.id,
      reviewAssessmentId: reviewAssessment.id,
      feedbackDeltaId: feedbackDelta.id
    });
    const sourceDecisionTraceEdges = await Promise.all(
      sourceDecisionTraceTargetsForRun.map((target) =>
        sourceRepository.createSourceDecisionEdge({
          sourceClaimId: sourceClaim.id,
          targetType: target.targetType,
          targetId: target.targetId,
          supportType: "implementation-boundary",
          confidence: "high",
          notes: target.notes,
          metadata: {
            smokeId: marker,
            sourceDecisionId: sourceDecision.id,
            provenanceTrace: "brain_loop_source_to_decision"
          }
        })
      )
    );
    const memoryCandidate = await memoryRepository.createMemoryCandidate({
      projectId: project.id,
      executionRunId: executionRun.id,
      feedbackDeltaId: feedbackDelta.id,
      proposedBy: "brain-loop-smoke",
      kind: "procedure",
      status: "candidate",
      summary: "Use reviewed DB-backed brain loop memory",
      body: "A KRN brain loop proof must preserve evidence lineage through evidence, review, feedback, MemoryReviewGate promotion, and next activation.",
      owner: "kernel",
      confidence: 90,
      applicationGuidance: "Use when checking whether KRN can reuse reviewed evidence as active context.",
      invalidationRule: "Revisit when the DB-backed brain loop smoke is replaced by a broader product workflow.",
      sourceClaimIds: [sourceClaim.id],
      sourceLineage: [{ sourceId: sourceClaim.id, note: "E2E-02 source-to-decision" }],
      isUserPreference: false,
      validFrom: now,
      metadata: {
        smokeId: marker,
        originRepoInstallationId: memoryOriginRepoInstallationId,
        reflectionCandidateEvidence: {
          provenance: "evidence_bundle",
          evidenceRefs: [evidenceBundle.id, reviewAssessment.id, feedbackDelta.id],
          doesNotProve: "This candidate is not Memory Core truth until MemoryReviewGate accepts it."
        }
      }
    });
    const promotion = await promoteMemoryCandidateThroughGate({
      memoryRepository,
      sourceRepository,
      review: {
        candidateId: memoryCandidate.id,
        reviewer: "brain-loop-smoke",
        evidenceReviewedRef: evidenceBundle.id,
        recordKey: `brain-loop-smoke:${marker}`,
        metadata: {
          smokeId: marker
        }
      }
    });
    const memoryRecord = promotion.memoryRecord;

    const retrieved = await retrieveActivationCandidates({
      taskContract,
      limits: {
        memory: 10,
        source: 10,
        search: 10,
        antiMemory: 10
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
      tokenBudget: 360,
      metadata: {
        smokeId: marker,
        sourceQuery: retrieved.sourceQuery.text
      }
    });
    retrievalRunId = retrievalRun.id;
    const filtered = applyActivationFilters({
      candidates: retrieved.candidates,
      antiMemoryRecords: retrieved.antiMemoryRecords,
      minimumSourceAuthority: "medium",
      now
    });
    const bounded = applyContextROI(filtered.candidates, {
      tokenBudget: 360,
      maxInclusions: 2,
      minimumDiverseKinds: ["memory"]
    });
    const draftContext = assembleContext({
      id: `brain-loop-context-${marker}`,
      harnessPlanId: harnessPlan.id,
      candidates: bounded,
      tokenBudget: 360,
      createdAt: now,
      metadata: {
        smokeId: marker,
        retrievalRunId: retrievalRun.id,
        conflictSets: filtered.conflictSets
      }
    });
    const contextAssembly = await harnessRunRepository.createContextAssembly({
      harnessPlanId: harnessPlan.id,
      status: draftContext.status,
      ...(draftContext.tokenBudget === undefined ? {} : { tokenBudget: draftContext.tokenBudget }),
      inclusions: draftContext.inclusions,
      exclusions: draftContext.exclusions,
      metadata: draftContext.metadata
    });
    setContextAssemblyId(contextAssembly.id);

    await persistActivationTrace({
      retrievalRunId: retrievalRun.id,
      candidates: bounded,
      contextAssembly,
      completedAt: now,
      retrievalRepository,
      metadata: {
        smokeId: marker,
        evidenceBundleId: evidenceBundle.id,
        memoryRecordId: memoryRecord.id
      }
    });

    const memoryApplication = await memoryRepository.recordMemoryApplication({
      memoryRecordId: memoryRecord.id,
      executionRunId: executionRun.id,
      taskContractId: taskContract.id,
      contextAssemblyId: contextAssembly.id,
      expectedUse: "Verify next activation reused reviewed memory.",
      outcome: "helped",
      notes: "DB-backed brain loop smoke included reviewed memory in context.",
      metadata: {
        smokeId: marker
      }
    });
    const nextCompile = await compileHarnessPlan({
      workspaceId: workspace.id,
      projectId: project.id,
      operatorIntent: {
        source: "cli",
        rawIntent: `next brain loop recall ${marker}`,
        metadata: {
          smokeId: marker
        }
      },
      taskContract: {
        title: "Reuse reviewed DB-backed brain loop memory",
        objective: "Automatically recall reviewed DB-backed brain loop memory in the next planning activation.",
        constraints: ["use store-backed Memory Core", "do not create a maintenance runtime"],
        nonGoals: ["no dashboard", "no activation scoring rewrite"],
        acceptance: ["next planning activation includes or explicitly excludes the reviewed MemoryRecord"],
        metadata: {
          smokeId: marker
        }
      },
      tokenBudget: 360,
      targetReadModel: targetReadModelForRepo(nextRunRepoInstallationId),
      metadata: {
        smokeId: marker,
        proof: "automatic_memory_recall_next_compile"
      }
    }, {
      harnessRunRepository,
      memoryRepository,
      sourceRepository,
      retrievalRepository,
      now: () => now,
      createId: (prefix) => `${prefix}-${marker}-next`
    });
    nextContextAssemblyId = nextCompile.contextAssembly.id;
    nextRetrievalRunId = stringMetadataValue(
      nextCompile.contextAssembly.metadata,
      "retrievalRunId"
    );
    const nextRunRetrievalRunId = requireSmokeReadbackValue(
      nextRetrievalRunId,
      "next run retrievalRunId",
      "Brain loop next-run recall did not persist retrieval metadata"
    );
    const nextRunMemoryInclusions = nextCompile.contextAssembly.inclusions.filter((item) =>
      item.subjectType === "memory_record" && item.subjectId === memoryRecord.id
    );
    const nextRunMemoryExclusions = nextCompile.contextAssembly.exclusions.filter((item) =>
      item.subjectType === "memory_record" && item.subjectId === memoryRecord.id
    );
    const nextRunActivationDecisions = await retrievalRepository.listActivationDecisionsForRun(
      nextRunRetrievalRunId
    );
    const nextRunIncludedMemoryDecisionCount = nextRunActivationDecisions.filter((decision) =>
      decision.decision === "included" &&
      decision.subjectType === "memory_record" &&
      decision.subjectId === memoryRecord.id
    ).length;
    const nextRunCodexBrief = input.renderExecutionBrief({
      taskContract: nextCompile.taskContract,
      harnessPlan: nextCompile.harnessPlan,
      contextAssembly: nextCompile.contextAssembly,
      capabilityPlan: nextCompile.capabilityPlan,
      evidenceContract: nextCompile.evidenceContract,
      nextAction: nextCompile.nextAction
    });
    const nextRunCodexBriefRendered = nextRunCodexBrief.trim().length > 0;
    const nextRunCodexBriefIncludesMemory = nextRunCodexBrief.includes(memoryRecord.id);
    const nextRunCodexBriefIncludesNonProofBoundary =
      nextRunCodexBrief.includes("Codex executed the work.") &&
      nextRunCodexBrief.includes("Memory was mutated.");
    const downgradedMemoryApplications: (typeof memoryApplication)[] = [];

    for (const attempt of [1, 2, 3]) {
      downgradedMemoryApplications.push(await memoryRepository.recordMemoryApplication({
        memoryRecordId: memoryRecord.id,
        executionRunId: executionRun.id,
        taskContractId: taskContract.id,
        contextAssemblyId: nextCompile.contextAssembly.id,
        expectedUse: "Verify negative application feedback downgrades future activation.",
        outcome: "hurt",
        notes: `DB-backed brain loop smoke downgrade feedback ${attempt}.`,
        metadata: {
          smokeId: marker,
          feedbackLoop: "downgrade",
          attempt
        }
      }));
    }
    const downgradedMemoryRecord = requireSmokeReadbackValue(
      await memoryRepository.getMemoryRecordById(memoryRecord.id),
      "downgraded memory record readback",
      "Brain loop smoke did not persist negative memory feedback"
    );
    const downgradedCompile = await compileHarnessPlan({
      workspaceId: workspace.id,
      projectId: project.id,
      operatorIntent: {
        source: "cli",
        rawIntent: `downgrade brain loop recall ${marker}`,
        metadata: {
          smokeId: marker
        }
      },
      taskContract: {
        title: "Reject downgraded DB-backed brain loop memory",
        objective: "Show negative application feedback prevents hurt memory from re-entering activation context.",
        constraints: ["use store-backed Memory Core", "do not create a maintenance runtime"],
        nonGoals: ["no dashboard", "no activation scoring rewrite"],
        acceptance: ["downgraded planning activation excludes the reviewed MemoryRecord"],
        metadata: {
          smokeId: marker,
          proof: "memory_feedback_downgrade"
        }
      },
      tokenBudget: 360,
      targetReadModel: targetReadModelForRepo(downgradedRunRepoInstallationId),
      metadata: {
        smokeId: marker,
        proof: "automatic_memory_downgrade_next_compile"
      }
    }, {
      harnessRunRepository,
      memoryRepository,
      sourceRepository,
      retrievalRepository,
      now: () => now,
      createId: (prefix) => `${prefix}-${marker}-downgraded`
    });
    downgradedContextAssemblyId = downgradedCompile.contextAssembly.id;
    downgradedRetrievalRunId = stringMetadataValue(
      downgradedCompile.contextAssembly.metadata,
      "retrievalRunId"
    );
    const downgradedRunRetrievalRunId = requireSmokeReadbackValue(
      downgradedRetrievalRunId,
      "downgraded run retrievalRunId",
      "Brain loop downgraded run did not persist retrieval metadata"
    );
    const {
      nextRunRepoInstallationIds,
      downgradedRunRepoInstallationIds
    } = await repoInstallationIdsForRetrievalRuns({
      db,
      nextRunRetrievalRunId,
      downgradedRunRetrievalRunId
    });
    const downgradedRunMemoryInclusions = downgradedCompile.contextAssembly.inclusions.filter((item) =>
      item.subjectType === "memory_record" && item.subjectId === memoryRecord.id
    );
    const downgradedRunMemoryExclusions = downgradedCompile.contextAssembly.exclusions.filter((item) =>
      item.subjectType === "memory_record" &&
      item.subjectId === memoryRecord.id &&
      item.reason === "unsafe"
    );
    const downgradedRunActivationDecisions = await retrievalRepository.listActivationDecisionsForRun(
      downgradedRunRetrievalRunId
    );
    const downgradedRunExcludedMemoryDecisionCount = downgradedRunActivationDecisions.filter((decision) =>
      decision.decision === "excluded" &&
      decision.subjectType === "memory_record" &&
      decision.subjectId === memoryRecord.id &&
      decision.reason === "unsafe"
    ).length;
    const maintenancePreview = buildMemoryStalenessMaintenancePreview({
      now,
      memoryRecords: [downgradedMemoryRecord],
      evidenceRef: feedbackDelta.id
    });
    const consolidationCandidate = requireSmokeReadbackValue(
      maintenancePreview.candidates[0],
      "maintenance consolidation candidate",
      "Brain loop smoke did not create a maintenance consolidation candidate"
    );
    const consolidationProposal = await proposeMemoryConsolidation({
      memoryRepository,
      candidate: consolidationCandidate,
      projectId: project.id,
      proposedBy: "brain-loop-smoke",
      owner: "kernel",
      observedAt: now,
      executionRunId: executionRun.id,
      feedbackDeltaId: feedbackDelta.id,
      metadata: {
        smokeId: marker
      }
    });
    const consolidationGateResult = await promoteAntiMemoryCandidateThroughGate({
      memoryRepository,
      sourceRepository,
      review: {
        candidateId: consolidationProposal.antiMemoryCandidate.id,
        reviewer: "brain-loop-smoke",
        evidenceReviewedRef: feedbackDelta.id,
        metadata: {
          smokeId: marker,
          consolidationCandidateId: consolidationCandidate.id
        }
      }
    });
    const consolidationCompile = await compileHarnessPlan({
      workspaceId: workspace.id,
      projectId: project.id,
      operatorIntent: {
        source: "cli",
        rawIntent: `consolidated brain loop recall ${marker}`,
        metadata: {
          smokeId: marker
        }
      },
      taskContract: {
        title: "Reject reviewed consolidation anti-memory",
        objective: "Show reviewed maintenance consolidation anti-memory blocks stale Memory Core context.",
        constraints: ["use store-backed anti-memory", "do not create a maintenance runtime"],
        nonGoals: ["no daemon", "no autonomous memory promotion"],
        acceptance: ["consolidation activation excludes the reviewed MemoryRecord through anti-memory"],
        metadata: {
          smokeId: marker,
          proof: "memory_consolidation_anti_memory"
        }
      },
      tokenBudget: 360,
      targetReadModel: targetReadModelForRepo(consolidationRunRepoInstallationId),
      metadata: {
        smokeId: marker,
        proof: "reviewed_memory_consolidation_next_compile"
      }
    }, {
      harnessRunRepository,
      memoryRepository,
      sourceRepository,
      retrievalRepository,
      now: () => now,
      createId: (prefix) => `${prefix}-${marker}-consolidation`
    });
    consolidationContextAssemblyId = consolidationCompile.contextAssembly.id;
    consolidationRetrievalRunId = stringMetadataValue(
      consolidationCompile.contextAssembly.metadata,
      "retrievalRunId"
    );
    const consolidationRunRetrievalRunId = requireSmokeReadbackValue(
      consolidationRetrievalRunId,
      "consolidation run retrievalRunId",
      "Brain loop consolidation run did not persist retrieval metadata"
    );
    const consolidationRunMemoryExclusions = consolidationCompile.contextAssembly.exclusions.filter((item) =>
      item.subjectType === "memory_record" &&
      item.subjectId === memoryRecord.id &&
      item.reason === "unsafe"
    );
    const consolidationRunActivationDecisions = await retrievalRepository.listActivationDecisionsForRun(
      consolidationRunRetrievalRunId
    );
    const consolidationRunAntiMemoryConflictCount = consolidationRunActivationDecisions.filter((decision) =>
      decision.decision === "conflict" &&
      decision.subjectType === "memory_record" &&
      decision.subjectId === memoryRecord.id &&
      decision.reason === "anti_memory_block" &&
      stringMetadataValue(decision.metadata, "antiMemoryRecordId") ===
        consolidationGateResult.antiMemoryRecord.id
    ).length;
    const consolidationRunExcludedMemoryDecisionCount = consolidationRunActivationDecisions.filter((decision) =>
      (decision.decision === "excluded" || decision.decision === "conflict") &&
      decision.subjectType === "memory_record" &&
      decision.subjectId === memoryRecord.id
    ).length;
    const decisionPacketGoverningDecisionIds = governingDecisionIdsFromMetadata(
      feedbackDelta.metadata
    );
    const decisionPacketRejectedPathIds = antiMemoryRejectedPathIdsFromActivationDecisions(
      consolidationRunActivationDecisions
    );
    const decisionPacketFalsifierCommands = evidenceBundle.commands.map((command) =>
      command.command
    );
    const decisionPacketNonProofs = unique([
      ...evidenceBundle.commands.flatMap((command) =>
        command.doesNotProve === undefined ? [] : [command.doesNotProve]
      ),
      ...(sourceClaim.doesNotProve === undefined ? [] : [sourceClaim.doesNotProve])
    ]);
    const aggregate = await harnessRunRepository.getHarnessRunByExecutionRunId(executionRun.id);
    const runSourceDecisionEdges = await sourceRepository.listSourceDecisionEdgesForRun(
      executionRun.id
    );
    const sourceDecisionTraceReadbackEdges = runSourceDecisionEdges
      .filter((edge) => edge.metadata.sourceDecisionId === sourceDecision.id)
      .sort((left, right) => left.targetType.localeCompare(right.targetType));
    const readBackSourceDecisionTraceTargetTypes = sourceDecisionTraceReadbackEdges
      .map((edge) => edge.targetType)
      .sort();
    const readBackSourceDecisionTraceRefs = sourceDecisionTraceReadbackEdges
      .map((edge) => `${edge.targetType}:${edge.targetId}`)
      .sort();
    const reviewedCandidate = await memoryRepository.getMemoryCandidateById(memoryCandidate.id);
    const readBackMemoryRecord = await memoryRepository.getMemoryRecordById(memoryRecord.id);
    const activationDecisions = await retrievalRepository.listActivationDecisionsForRun(
      retrievalRun.id
    );
    const includedMemoryDecisionCount = activationDecisions.filter((decision) =>
      decision.decision === "included" &&
      decision.subjectType === "memory_record" &&
      decision.subjectId === memoryRecord.id
    ).length;
    const {
      nextRunCrossRepoMemoryInclusion,
      downgradedRunCrossRepoMemoryExclusion
    } = crossRepoMemoryProof({
      memoryRecordMetadata: memoryRecord.metadata,
      nextRunRepoInstallationIds,
      nextRunMemoryInclusionCount: nextRunMemoryInclusions.length,
      downgradedRunRepoInstallationIds,
      downgradedRunMemoryExclusionCount: downgradedRunMemoryExclusions.length
    });
    const contextAssemblyRows = await db
      .select({
        id: contextAssemblies.id
      })
      .from(contextAssemblies)
      .where(eq(contextAssemblies.id, contextAssembly.id));
    const [versionRows, applicationRows] = await Promise.all([
      db
        .select()
        .from(memoryRecordVersions)
        .where(eq(memoryRecordVersions.memoryRecordId, memoryRecord.id)),
      db
        .select()
        .from(memoryApplications)
        .where(eq(memoryApplications.id, memoryApplication.id))
    ]);
    const includedContextItems = contextAssembly.inclusions.filter((item) =>
      item.subjectType === "memory_record" && item.subjectId === memoryRecord.id
    );
    const memoryApplicationCountRows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(memoryApplications)
      .where(eq(memoryApplications.id, memoryApplication.id));
    const readbackError = "Brain loop smoke readback did not match persisted records";

    assertSmokeReadbackChecks([
      { label: "harness aggregate", passed: aggregate !== undefined },
      { label: "evidence bundle", passed: aggregate?.evidenceBundles.length === 1 },
      { label: "review assessment", passed: aggregate?.reviewAssessments.length === 1 },
      { label: "feedback delta", passed: aggregate?.feedbackDeltas.length === 1 },
      { label: "source decision adopted", passed: sourceDecision.status === "adopt" },
      {
        label: "source decision smoke metadata",
        passed: stringMetadataValue(sourceDecision.metadata, "smokeId") === marker
      },
      { label: "source claim accepted", passed: sourceClaim.status === "accepted" },
      {
        label: "source decision provenance trace edge count",
        passed: sourceDecisionTraceEdges.length === 5
      },
      {
        label: "run source decision provenance trace readback",
        passed: readBackSourceDecisionTraceTargetTypes.join(",") === sourceDecisionTraceTargetTypes.join(",")
      },
      {
        label: "run source decision provenance trace target ids",
        passed: readBackSourceDecisionTraceRefs.join(",") ===
          sourceDecisionTraceRefs(sourceDecisionTraceTargetsForRun).join(",")
      },
      {
        label: "decision packet governing source decision",
        passed: decisionPacketGoverningDecisionIds.join(",") === sourceDecision.id
      },
      {
        label: "decision packet anti-memory rejected path",
        passed: decisionPacketRejectedPathIds.join(",") === consolidationGateResult.antiMemoryRecord.id
      },
      {
        label: "decision packet falsifier command",
        passed: decisionPacketFalsifierCommands.includes("pnpm db:smoke:brain-loop")
      },
      {
        label: "decision packet non-proof boundary",
        passed: decisionPacketNonProofs.some((boundary) => boundary.includes("product readiness"))
      },
      { label: "memory candidate accepted", passed: reviewedCandidate?.status === "accepted" },
      { label: "memory record readback", passed: readBackMemoryRecord?.id === memoryRecord.id },
      { label: "memory review gate metadata", passed: "reviewGate" in memoryRecord.metadata },
      { label: "memory record version", passed: versionRows.length === 1 },
      {
        label: "memory version candidate lineage",
        passed: versionRows[0]?.createdFromCandidateId === memoryCandidate.id
      },
      { label: "activation included memory", passed: includedMemoryDecisionCount === 1 },
      { label: "context included memory", passed: includedContextItems.length === 1 },
      { label: "context assembly readback", passed: contextAssemblyRows[0]?.id === contextAssembly.id },
      { label: "activation trace readback", passed: aggregate?.activationTrace?.retrievalRunId === retrievalRun.id },
      { label: "memory application", passed: applicationRows.length === 1 },
      {
        label: "memory application count sanity",
        passed: (memoryApplicationCountRows[0]?.count ?? 0) === 1
      },
      { label: "next run context assembly", passed: nextCompile.contextAssembly.id === nextContextAssemblyId },
      {
        label: "next run repo boundary readback",
        passed: nextRunRepoInstallationIds.join(",") === nextRunRepoInstallationId
      },
      { label: "next run retrieved active memory", passed: nextRunMemoryInclusions.length + nextRunMemoryExclusions.length === 1 },
      { label: "next run included memory", passed: nextRunMemoryInclusions.length === 1 },
      {
        label: "next run activation decision",
        passed: nextRunIncludedMemoryDecisionCount === 1
      },
      {
        label: "next run Codex brief rendered",
        passed: nextRunCodexBriefRendered
      },
      {
        label: "next run Codex brief includes memory",
        passed: nextRunCodexBriefIncludesMemory
      },
      {
        label: "next run Codex brief includes non-proof boundary",
        passed: nextRunCodexBriefIncludesNonProofBoundary
      },
      {
        label: "cross-repo promoted memory inclusion",
        passed: nextRunCrossRepoMemoryInclusion
      },
      {
        label: "downgraded memory negative feedback",
        passed: downgradedMemoryRecord.negativeFeedbackCount === 3
      },
      {
        label: "downgraded memory applications",
        passed: downgradedMemoryApplications.length === 3
      },
      {
        label: "downgraded run excludes memory",
        passed: downgradedRunMemoryInclusions.length === 0 && downgradedRunMemoryExclusions.length === 1
      },
      {
        label: "downgraded run repo boundary readback",
        passed: downgradedRunRepoInstallationIds.join(",") === downgradedRunRepoInstallationId
      },
      {
        label: "downgraded run activation decision",
        passed: downgradedRunExcludedMemoryDecisionCount === 1
      },
      {
        label: "cross-repo downgraded memory exclusion",
        passed: downgradedRunCrossRepoMemoryExclusion
      },
      {
        label: "maintenance consolidation candidate ready",
        passed: consolidationCandidate.reviewability === "ready"
      },
      {
        label: "consolidation anti-memory candidate persisted",
        passed: consolidationProposal.antiMemoryCandidate.id.length > 0
      },
      {
        label: "consolidation feedback event persisted",
        passed: consolidationProposal.feedbackEvent.memoryRecordId === memoryRecord.id
      },
      {
        label: "consolidation anti-memory candidate accepted",
        passed: consolidationGateResult.antiMemoryRecord.createdFromCandidateId ===
          consolidationProposal.antiMemoryCandidate.id
      },
      {
        label: "consolidation run excludes memory",
        passed: consolidationRunMemoryExclusions.length === 1
      },
      {
        label: "consolidation run activation anti-memory conflict",
        passed: consolidationRunAntiMemoryConflictCount === 1
      },
      {
        label: "consolidation run excluded memory decision",
        passed: consolidationRunExcludedMemoryDecisionCount === 1
      }
    ], readbackError);

    const persistedMemoryRecord = requireSmokeReadbackValue(
      readBackMemoryRecord,
      "memory record readback",
      readbackError
    );
    const memoryRecordVersion = requireSmokeReadbackValue(
      versionRows[0],
      "memory record version",
      readbackError
    );
    const readBackContextAssemblyId = requireSmokeReadbackValue(
      contextAssemblyRows[0]?.id,
      "context assembly readback",
      readbackError
    );

    const remainingMarkerCount = await cleanup();

    return {
      workspaceSlug,
      projectSlug,
      executionRunId: executionRun.id,
      evidenceBundleId: evidenceBundle.id,
      reviewAssessmentId: reviewAssessment.id,
      feedbackDeltaId: feedbackDelta.id,
      sourceClaimId: sourceClaim.id,
      sourceDecisionId: sourceDecision.id,
      sourceDecisionTraceEdgeCount: sourceDecisionTraceReadbackEdges.length,
      sourceDecisionTraceEdgeIds: sourceDecisionTraceReadbackEdges.map((edge) => edge.id),
      sourceDecisionTraceTargetTypes: readBackSourceDecisionTraceTargetTypes,
      decisionPacketGoverningDecisionIds,
      decisionPacketRejectedPathIds,
      decisionPacketFalsifierCommands,
      decisionPacketNonProofs,
      sourceClaimStatus: sourceClaim.status,
      memoryCandidateId: memoryCandidate.id,
      reviewedMemoryCandidateStatus: reviewedCandidate?.status ?? "missing",
      memoryRecordId: memoryRecord.id,
      readBackMemoryRecordId: persistedMemoryRecord.id,
      memoryRecordVersionId: memoryRecordVersion.id,
      retrievalRunId: retrievalRun.id,
      contextAssemblyId: contextAssembly.id,
      readBackContextAssemblyId,
      activationDecisionCount: activationDecisions.length,
      includedMemoryDecisionCount,
      contextItemCount: contextAssembly.inclusions.length,
      memoryApplicationId: memoryApplication.id,
      memoryOriginRepoInstallationId,
      nextRunTaskContractId: nextCompile.taskContract.id,
      nextRunRetrievalRunId,
      nextRunRepoInstallationIds,
      nextRunCrossRepoMemoryInclusion,
      nextRunContextAssemblyId: nextCompile.contextAssembly.id,
      nextRunCodexBriefRendered,
      nextRunCodexBriefIncludesMemory,
      nextRunCodexBriefIncludesNonProofBoundary,
      nextRunMemoryInclusionCount: nextRunMemoryInclusions.length,
      nextRunIncludedMemoryDecisionCount,
      downgradedMemoryNegativeFeedbackCount: downgradedMemoryRecord.negativeFeedbackCount,
      downgradedMemoryApplicationCount: downgradedMemoryApplications.length,
      downgradedRunTaskContractId: downgradedCompile.taskContract.id,
      downgradedRunRetrievalRunId,
      downgradedRunRepoInstallationIds,
      downgradedRunCrossRepoMemoryExclusion,
      downgradedRunContextAssemblyId: downgradedCompile.contextAssembly.id,
      downgradedRunMemoryExclusionCount: downgradedRunMemoryExclusions.length,
      downgradedRunExcludedMemoryDecisionCount,
      consolidationCandidateId: consolidationCandidate.id,
      consolidationAntiMemoryCandidateId: consolidationProposal.antiMemoryCandidate.id,
      consolidationMemoryFeedbackEventId: consolidationProposal.feedbackEvent.id,
      consolidationAntiMemoryRecordId: consolidationGateResult.antiMemoryRecord.id,
      consolidationRunTaskContractId: consolidationCompile.taskContract.id,
      consolidationRunRetrievalRunId,
      consolidationRunContextAssemblyId: consolidationCompile.contextAssembly.id,
      consolidationRunMemoryExclusionCount: consolidationRunMemoryExclusions.length,
      consolidationRunExcludedMemoryDecisionCount,
      consolidationRunAntiMemoryConflictCount,
      runEventCount: aggregate?.runEvents.length ?? 0,
      remainingMarkerCount,
      cleanedUp: remainingMarkerCount === 0
    };
  } finally {
    await client.end();
  }
};
