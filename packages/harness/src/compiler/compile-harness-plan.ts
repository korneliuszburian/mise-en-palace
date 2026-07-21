import type {
  CapabilityPlan,
  CodexAdapterPlanRef,
  ContextAssembly,
  DecisionPacket,
  HarnessPlan,
  OperatorIntent,
  ProjectId,
  TaskContract,
  WorkspaceId
} from "@krn/core";
import {
  capabilityPlanToolBoundaries,
  capabilityPlanToolBoundariesMetadataKey,
  decisionPacketFormatVersion,
  decisionPacketNegativePathsForContext,
  parseMemorySupersessionTimelineReadback,
  parseSourceConsensusTimelineReadback
} from "@krn/core";
import {
  applyActivationFilters,
  applyContextROI,
  assembleContext,
  persistActivationTrace,
  retrieveActivationCandidates
} from "../activation/index.js";
import {
  assessTargetOwnerFileRecall
} from "../activation/owner-file-recall.js";
import type {
  TargetActivationReadModel
} from "../activation/index.js";
import type {
  HarnessRunRepository,
  MemoryRepository,
  RetrievalRepository,
  SourceRepository
} from "@krn/core/repositories/internal";
import {
  createCapabilityPlan
} from "./create-capability-plan.js";
import type {
  EvidenceContract
} from "./create-evidence-contract.js";
import {
  createEvidenceContract
} from "./create-evidence-contract.js";
import {
  createTaskContractInput
} from "./create-task-contract.js";
import type {
  TaskContractDraft
} from "./create-task-contract.js";

export interface HarnessCompileOperatorIntentInput {
  rawIntent: string;
  source: OperatorIntent["source"];
  normalizedIntent?: string;
  metadata?: Record<string, unknown>;
}

export interface ResolvedHarnessCompileInput {
  workspaceId: WorkspaceId;
  projectId?: ProjectId;
  operatorIntent: HarnessCompileOperatorIntentInput;
  taskContract?: TaskContractDraft;
  verificationCommands?: readonly string[];
  targetReadModel?: TargetActivationReadModel;
  tokenBudget?: number;
  metadata?: Record<string, unknown>;
}

export interface HarnessCompilerRepositories {
  harnessRunRepository: Pick<
    HarnessRunRepository,
    "createOperatorIntent" | "createTaskContract" | "createHarnessPlan" | "createContextAssembly"
  >;
  memoryRepository: Pick<MemoryRepository, "listActiveMemory" | "listAntiMemoryForProject"> &
    Partial<Pick<MemoryRepository, "getMemoryRecordById">>;
  sourceRepository: Required<Pick<
    SourceRepository,
    "listClaimsForProject" | "listSourceClaimEdgesForProject" | "listSourceDecisionEdgesForClaim"
  >> & Partial<Pick<
    SourceRepository,
    | "getSourceClaimForProject"
    | "getSourceDecisionForProject"
    | "listSourceDecisionsForClaim"
    | "listSourceRejectionsForClaim"
    | "listHistoricalClaimWarningsForProject"
  >>;
  retrievalRepository: Pick<
    RetrievalRepository,
    | "startRetrievalRun"
    | "completeRetrievalRun"
    | "addCandidate"
    | "recordActivationDecision"
    | "storeContextSelection"
    | "searchLexical"
  >;
}

export interface HarnessCompilerRuntime {
  now(): string;
  createId(prefix: string): string;
}

export interface HarnessCompilerDependencies
  extends HarnessCompilerRepositories,
    HarnessCompilerRuntime {}

export interface HarnessCompileResult {
  operatorIntent: OperatorIntent;
  taskContract: TaskContract;
  harnessPlan: HarnessPlan;
  contextAssembly: ContextAssembly;
  capabilityPlan: CapabilityPlan;
  codexAdapterPlanRef: CodexAdapterPlanRef;
  evidenceContract: EvidenceContract;
  nextAction: string;
}

export const decisionPacketForCompiledPlan = (
  result: HarnessCompileResult
): DecisionPacket => {
  const contextInclusions = result.contextAssembly.inclusions.map((item) => ({
    subjectType: item.subjectType,
    subjectId: item.subjectId,
    reason: item.reason,
    expectedUse: item.expectedUse,
    sourceAuthority: item.sourceAuthority,
    ...(item.supportingEvidence === undefined
      ? {}
      : { supportingEvidence: item.supportingEvidence })
  }));
  const contextExclusions = result.contextAssembly.exclusions.map((item) => ({
    subjectType: item.subjectType,
    subjectId: item.subjectId,
    reason: item.reason,
    explanation: item.explanation,
    sourceAuthority: item.sourceAuthority
  }));
  const sourceClaimIds = contextInclusions
    .filter((item) => item.subjectType === "source_claim")
    .map((item) => item.subjectId);
  const memoryRefs = contextInclusions
    .filter((item) => item.subjectType === "memory_record")
    .map((item) => item.subjectId);
  const negativePaths = decisionPacketNegativePathsForContext({
    contextInclusions,
    contextExclusions
  });
  const memorySupersessionTimeline = parseMemorySupersessionTimelineReadback(
    result.contextAssembly.metadata["memorySupersessionTimeline"]
  );
  const sourceConsensusTimeline = parseSourceConsensusTimelineReadback(
    result.contextAssembly.metadata["sourceConsensusTimeline"]
  );

  return {
    formatVersion: decisionPacketFormatVersion,
    task: {
      id: result.taskContract.id,
      projectId: result.taskContract.projectId ?? null,
      title: result.taskContract.title,
      objective: result.taskContract.objective,
      constraints: result.taskContract.constraints,
      nonGoals: result.taskContract.nonGoals,
      acceptance: result.taskContract.acceptance
    },
    contextInclusions,
    contextExclusions,
    toolBoundaries: result.capabilityPlan.toolBoundaries,
    evidenceContract: result.evidenceContract,
    nextAction: result.nextAction,
    governingDecisionIds: [],
    sourceDecisionIds: [],
    governingStatements: [],
    taskStandardDecisions: [],
    sourceClaimIds,
    caveatedSourceClaimIds: [],
    sourceDecisionEdgeIds: [],
    sourceDecisionTargets: [],
    sourceRejectionIds: [],
    memoryRefs,
    caveatedMemoryRefs: [],
    staleDecisionIds: [],
    staleKnowledgeIds: [],
    supersededPathIds: negativePaths.supersededPathIds,
    rejectedPathIds: negativePaths.rejectedPathIds,
    falsifiers: [],
    verificationCommands: result.evidenceContract.commands.map((item) => item.command),
    evidenceGaps: [],
    sourceConsensus: {
      decisionLinkedSourceClaimIds: [],
      caveatedSourceClaimIds: [],
      unsupportedSourceClaimIds: [],
      conflictingSourceClaimIds: [],
      unknownSourceClaimIds: [],
      sourceDecisionEdgeIds: [],
      sourceDecisionTargets: [],
      staleDecisionIds: [],
      supersededPathIds: negativePaths.supersededPathIds,
      rejectedPathIds: negativePaths.rejectedPathIds,
      sourceRejectionIds: [],
      conflictedDecisionIds: [],
      evidenceGapIds: [],
      ...(sourceConsensusTimeline === undefined ? {} : { timeline: sourceConsensusTimeline }),
      doesNotProve: "A compile-time packet does not prove source truth or persisted authority."
    },
    ...(memorySupersessionTimeline === undefined ? {} : { memorySupersessionTimeline }),
    abstentionScore: {
      status: "abstain",
      score: 0,
      reasons: [
        ...(result.taskContract.projectId === undefined ? ["missing_project_identity" as const] : []),
        "missing_governing_decision"
      ],
      evidenceGapIds: [],
      doesNotProve: "A compile-time packet does not prove source truth or persisted authority."
    },
    doesNotProve: ["A compile-time packet does not prove source truth or persisted authority."],
    nonProofs: ["A compile-time packet does not prove source truth or persisted authority."],
    severeStaleAuthorityIds: [],
    brief: {
      includedContextCount: contextInclusions.length,
      observationPrefixCount: 0,
      explicitExclusionCount: contextExclusions.length,
      sourceClaimUseCount: sourceClaimIds.length,
      memoryRecordUseCount: memoryRefs.length,
      includedSourceClaimIds: sourceClaimIds,
      includedMemoryRecordIds: memoryRefs,
      excludedSourceClaimIds: [],
      excludedMemoryRecordIds: [],
      excludedAntiMemoryRecordIds: [],
      evidenceGapIds: []
    }
  };
};

const defaultMemoryLimit = 25;
const defaultSourceLimit = 25;
const defaultSearchLimit = 25;
const defaultAntiMemoryLimit = 25;
const maxContextInclusions = 6;
const minimumSourceAuthority = "medium";

type RetrievedActivationCandidates = Awaited<ReturnType<typeof retrieveActivationCandidates>>;
type ConflictDetectionResult = ReturnType<typeof applyActivationFilters>;
type FilteredActivationCandidates = ReturnType<typeof applyContextROI>;

const createCompiledOperatorIntent = (
  input: ResolvedHarnessCompileInput,
  dependencies: HarnessCompilerDependencies
): Promise<OperatorIntent> => dependencies.harnessRunRepository.createOperatorIntent({
  workspaceId: input.workspaceId,
  ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
  source: input.operatorIntent.source,
  rawIntent: input.operatorIntent.rawIntent,
  ...(input.operatorIntent.normalizedIntent === undefined
    ? {}
    : { normalizedIntent: input.operatorIntent.normalizedIntent }),
  metadata: input.operatorIntent.metadata ?? {}
});

const createReadyHarnessPlan = (
  taskContract: TaskContract,
  evidenceContract: EvidenceContract,
  metadata: Record<string, unknown> | undefined,
  dependencies: HarnessCompilerDependencies
): Promise<HarnessPlan> => dependencies.harnessRunRepository.createHarnessPlan({
  taskContractId: taskContract.id,
  version: 1,
  status: "ready",
  summary: `${taskContract.title}: ${taskContract.objective}`,
  nextAction: "Render Codex adapter brief.",
  metadata: {
    ...(metadata ?? {}),
    [capabilityPlanToolBoundariesMetadataKey]: [...capabilityPlanToolBoundaries],
    evidenceContract
  }
});

const retrieveCompilerActivationCandidates = (
  input: ResolvedHarnessCompileInput,
  taskContract: TaskContract,
  dependencies: HarnessCompilerDependencies
): Promise<RetrievedActivationCandidates> => retrieveActivationCandidates({
  taskContract,
  now: dependencies.now(),
  limits: {
    memory: defaultMemoryLimit,
    source: defaultSourceLimit,
    search: defaultSearchLimit,
    antiMemory: defaultAntiMemoryLimit
  },
  ...(input.targetReadModel === undefined ? {} : { targetReadModel: input.targetReadModel }),
  repositories: {
    memoryRepository: dependencies.memoryRepository,
    sourceRepository: dependencies.sourceRepository,
    retrievalRepository: dependencies.retrievalRepository
  }
});

const targetReadModelMetadata = (
  input: ResolvedHarnessCompileInput,
  targetOwnerFileRecall: ReturnType<typeof assessTargetOwnerFileRecall> | undefined
): Record<string, unknown> => {
  if (input.targetReadModel === undefined) {
    return {};
  }

  return {
    targetReadModel: {
      repoInstallationIds: input.targetReadModel.repoInstallationIds,
      sourceSeedCount: input.targetReadModel.sourceSeeds.length,
      trustExclusionCount: input.targetReadModel.trustExclusions.length,
      ownerFileCount: input.targetReadModel.ownerFiles?.length ?? 0,
      ...(targetOwnerFileRecall === undefined ? {} : { ownerFileRecall: targetOwnerFileRecall })
    }
  };
};

const startCompilerRetrievalRun = (
  input: ResolvedHarnessCompileInput,
  taskContract: TaskContract,
  retrieved: RetrievedActivationCandidates,
  targetOwnerFileRecall: ReturnType<typeof assessTargetOwnerFileRecall> | undefined,
  dependencies: HarnessCompilerDependencies
) => dependencies.retrievalRepository.startRetrievalRun({
  ...(taskContract.projectId === undefined ? {} : { projectId: taskContract.projectId }),
  taskContractId: taskContract.id,
  query: retrieved.memoryQuery.text,
  ...(input.tokenBudget === undefined ? {} : { tokenBudget: input.tokenBudget }),
  metadata: {
    sourceQuery: retrieved.sourceQuery.text,
    activationRetrievalDiagnostics: retrieved.diagnostics,
    sourceConsensusTimeline: retrieved.sourceConsensusTimeline,
    memorySupersessionTimeline: retrieved.memorySupersessionTimeline,
    ...targetReadModelMetadata(input, targetOwnerFileRecall)
  }
});

const filterActivationCandidates = (
  input: ResolvedHarnessCompileInput,
  candidates: ConflictDetectionResult["candidates"]
): FilteredActivationCandidates => applyContextROI(
  candidates,
  {
    ...(input.tokenBudget === undefined ? {} : { tokenBudget: input.tokenBudget }),
    maxInclusions: maxContextInclusions,
    minimumTaskRelevanceScore: 20,
    minimumTaskRelevanceRatio: 0.6,
    preserveApplicableTaskConcernCoverage: true
  }
);

const canonicalRevisionTokensFor = (
  candidates: readonly FilteredActivationCandidates[number][],
  inclusions: readonly ContextAssembly["inclusions"][number][]
): Record<string, unknown>[] => candidates
  .map((candidate) => candidate.metadata.canonicalRevision)
  .filter((revision): revision is Record<string, unknown> => (
    typeof revision === "object" &&
    revision !== null &&
    !Array.isArray(revision) &&
    inclusions.some((inclusion) => (
      inclusion.subjectType === (revision as Record<string, unknown>).subjectType &&
      inclusion.subjectId === (revision as Record<string, unknown>).subjectId
    ))
  ));

const createPersistedContextAssembly = async (
  input: ResolvedHarnessCompileInput,
  harnessPlan: HarnessPlan,
  retrieved: RetrievedActivationCandidates,
  retrievalRunId: string,
  conflictResult: ConflictDetectionResult,
  filteredCandidates: FilteredActivationCandidates,
  createdAt: string,
  dependencies: HarnessCompilerDependencies
): Promise<ContextAssembly> => {
  const draftContext = assembleContext({
    id: dependencies.createId("context-assembly"),
    harnessPlanId: harnessPlan.id,
    candidates: filteredCandidates,
    ...(input.tokenBudget === undefined ? {} : { tokenBudget: input.tokenBudget }),
    createdAt,
    metadata: {
      retrievalRunId,
      conflictSets: conflictResult.conflictSets,
      activationRetrievalDiagnostics: retrieved.diagnostics,
      sourceConsensusTimeline: retrieved.sourceConsensusTimeline,
      memorySupersessionTimeline: retrieved.memorySupersessionTimeline
    }
  });

  const metadata = {
    ...draftContext.metadata,
    canonicalRevisionTokens: canonicalRevisionTokensFor(filteredCandidates, draftContext.inclusions)
  };

  return dependencies.harnessRunRepository.createContextAssembly({
    harnessPlanId: harnessPlan.id,
    status: draftContext.status,
    ...(draftContext.tokenBudget === undefined ? {} : { tokenBudget: draftContext.tokenBudget }),
    inclusions: draftContext.inclusions,
    exclusions: draftContext.exclusions,
    metadata
  });
};

const createCodexAdapterPlanRef = (
  harnessPlan: HarnessPlan,
  contextAssembly: ContextAssembly,
  dependencies: HarnessCompilerDependencies,
  createdAt: string
): CodexAdapterPlanRef => ({
  id: dependencies.createId("codex-adapter-plan-ref"),
  harnessPlanId: harnessPlan.id,
  adapterPlanId: dependencies.createId("codex-plan"),
  metadata: {
    renderer: "codex-adapter",
    contextAssemblyId: contextAssembly.id
  },
  createdAt
});

const nextActionForContext = (contextAssembly: ContextAssembly): string =>
  contextAssembly.status === "abstained"
    ? "Context activation abstained; review exclusions before execution."
    : "Render Codex adapter brief.";

export const compileHarnessPlan = async (
  input: ResolvedHarnessCompileInput,
  dependencies: HarnessCompilerDependencies
): Promise<HarnessCompileResult> => {
  const createdAt = dependencies.now();
  const operatorIntent = await createCompiledOperatorIntent(input, dependencies);
  const taskContract = await dependencies.harnessRunRepository.createTaskContract(
    createTaskContractInput(operatorIntent, input.taskContract)
  );
  const evidenceContract = createEvidenceContract(taskContract, input.verificationCommands ?? []);
  const harnessPlan = await createReadyHarnessPlan(
    taskContract,
    evidenceContract,
    input.metadata,
    dependencies
  );
  const retrieved = await retrieveCompilerActivationCandidates(input, taskContract, dependencies);
  const targetOwnerFileRecall =
    input.targetReadModel === undefined ? undefined : assessTargetOwnerFileRecall(input.targetReadModel);
  const retrievalRun = await startCompilerRetrievalRun(
    input,
    taskContract,
    retrieved,
    targetOwnerFileRecall,
    dependencies
  );
  const conflictResult = applyActivationFilters({
    candidates: retrieved.candidates,
    antiMemoryRecords: retrieved.antiMemoryRecords,
    minimumSourceAuthority,
    now: createdAt
  });
  const filteredCandidates = filterActivationCandidates(input, conflictResult.candidates);
  const contextAssembly = await createPersistedContextAssembly(
    input,
    harnessPlan,
    retrieved,
    retrievalRun.id,
    conflictResult,
    filteredCandidates,
    createdAt,
    dependencies
  );
  await persistActivationTrace({
    retrievalRunId: retrievalRun.id,
    candidates: filteredCandidates,
    contextAssembly,
    completedAt: dependencies.now(),
    retrievalRepository: dependencies.retrievalRepository,
    metadata: {
      conflictCount: conflictResult.conflictSets.length,
      sourceConsensusTimeline: retrieved.sourceConsensusTimeline,
      ...targetReadModelMetadata(input, targetOwnerFileRecall)
    }
  });

  const capabilityPlan = createCapabilityPlan({
    harnessPlan,
    taskContract,
    hasContext: contextAssembly.inclusions.length > 0,
    createdAt,
    createId: dependencies.createId
  });
  const codexAdapterPlanRef = createCodexAdapterPlanRef(
    harnessPlan,
    contextAssembly,
    dependencies,
    createdAt
  );
  const nextAction = nextActionForContext(contextAssembly);

  return {
    operatorIntent,
    taskContract,
    harnessPlan,
    contextAssembly,
    capabilityPlan,
    codexAdapterPlanRef,
    evidenceContract,
    nextAction
  };
};
