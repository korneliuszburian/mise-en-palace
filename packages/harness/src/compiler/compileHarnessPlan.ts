import type {
  CapabilityPlan,
  CodexAdapterPlanRef,
  ContextAssembly,
  HarnessPlan,
  OperatorIntent,
  ProjectId,
  TaskContract,
  WorkspaceId
} from "@krn/core";
import {
  applyContextROI,
  applyTemporalFilter,
  applyTrustFilter,
  assembleContext,
  detectConflicts,
  persistActivationTrace,
  retrieveActivationCandidates
} from "../activation/index.js";
import type {
  HarnessRunRepository,
  MemoryRepository,
  RetrievalRepository,
  SourceRepository
} from "../repositories/internal/index.js";
import {
  createCapabilityPlan
} from "./createCapabilityPlan.js";
import type {
  EvidenceContract
} from "./createEvidenceContract.js";
import {
  createEvidenceContract
} from "./createEvidenceContract.js";
import {
  createTaskContractInput
} from "./createTaskContract.js";
import type {
  TaskContractDraft
} from "./createTaskContract.js";

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
  tokenBudget?: number;
  metadata?: Record<string, unknown>;
}

export interface HarnessCompilerRepositories {
  harnessRunRepository: Pick<
    HarnessRunRepository,
    "createOperatorIntent" | "createTaskContract" | "createHarnessPlan" | "createContextAssembly"
  >;
  memoryRepository: Pick<MemoryRepository, "listActiveMemory" | "listAntiMemoryForProject">;
  sourceRepository: Pick<SourceRepository, "listClaimsForProject">;
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

const defaultMemoryLimit = 25;
const defaultSourceLimit = 25;
const defaultSearchLimit = 25;
const defaultAntiMemoryLimit = 25;
const maxContextInclusions = 6;
const minimumTrustTier = "medium";

export const compileHarnessPlan = async (
  input: ResolvedHarnessCompileInput,
  dependencies: HarnessCompilerDependencies
): Promise<HarnessCompileResult> => {
  const createdAt = dependencies.now();
  const operatorIntent = await dependencies.harnessRunRepository.createOperatorIntent({
    workspaceId: input.workspaceId,
    ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
    source: input.operatorIntent.source,
    rawIntent: input.operatorIntent.rawIntent,
    ...(input.operatorIntent.normalizedIntent === undefined
      ? {}
      : { normalizedIntent: input.operatorIntent.normalizedIntent }),
    metadata: input.operatorIntent.metadata ?? {}
  });
  const taskContract = await dependencies.harnessRunRepository.createTaskContract(
    createTaskContractInput(operatorIntent, input.taskContract)
  );
  const evidenceContract = createEvidenceContract(taskContract);
  const harnessPlan = await dependencies.harnessRunRepository.createHarnessPlan({
    taskContractId: taskContract.id,
    version: 1,
    status: "ready",
    summary: `${taskContract.title}: ${taskContract.objective}`,
    nextAction: "Render Codex adapter brief.",
    metadata: {
      ...(input.metadata ?? {}),
      evidenceContract
    }
  });
  const retrieved = await retrieveActivationCandidates({
    taskContract,
    limits: {
      memory: defaultMemoryLimit,
      source: defaultSourceLimit,
      search: defaultSearchLimit,
      antiMemory: defaultAntiMemoryLimit
    },
    repositories: {
      memoryRepository: dependencies.memoryRepository,
      sourceRepository: dependencies.sourceRepository,
      retrievalRepository: dependencies.retrievalRepository
    }
  });
  const retrievalRun = await dependencies.retrievalRepository.startRetrievalRun({
    ...(taskContract.projectId === undefined ? {} : { projectId: taskContract.projectId }),
    taskContractId: taskContract.id,
    query: retrieved.memoryQuery.text,
    ...(input.tokenBudget === undefined ? {} : { tokenBudget: input.tokenBudget }),
    metadata: {
      sourceQuery: retrieved.sourceQuery.text
    }
  });
  const conflictResult = detectConflicts(retrieved.candidates, retrieved.antiMemoryRecords);
  const filteredCandidates = applyContextROI(
    applyTemporalFilter(
      applyTrustFilter(conflictResult.candidates, { minimumTrustTier }),
      createdAt
    ),
    {
      ...(input.tokenBudget === undefined ? {} : { tokenBudget: input.tokenBudget }),
      maxInclusions: maxContextInclusions
    }
  );
  const draftContext = assembleContext({
    id: dependencies.createId("context-assembly"),
    harnessPlanId: harnessPlan.id,
    candidates: filteredCandidates,
    ...(input.tokenBudget === undefined ? {} : { tokenBudget: input.tokenBudget }),
    createdAt,
    metadata: {
      retrievalRunId: retrievalRun.id,
      conflictSets: conflictResult.conflictSets
    }
  });
  const contextAssembly = await dependencies.harnessRunRepository.createContextAssembly({
    harnessPlanId: harnessPlan.id,
    status: draftContext.status,
    ...(draftContext.tokenBudget === undefined ? {} : { tokenBudget: draftContext.tokenBudget }),
    inclusions: draftContext.inclusions,
    exclusions: draftContext.exclusions,
    metadata: draftContext.metadata
  });
  await persistActivationTrace({
    retrievalRunId: retrievalRun.id,
    candidates: filteredCandidates,
    contextAssembly,
    completedAt: dependencies.now(),
    retrievalRepository: dependencies.retrievalRepository,
    metadata: {
      conflictCount: conflictResult.conflictSets.length
    }
  });

  const capabilityPlan = createCapabilityPlan({
    harnessPlan,
    taskContract,
    hasContext: contextAssembly.inclusions.length > 0,
    createdAt,
    createId: dependencies.createId
  });
  const codexAdapterPlanRef: CodexAdapterPlanRef = {
    id: dependencies.createId("codex-adapter-plan-ref"),
    harnessPlanId: harnessPlan.id,
    adapterPlanId: dependencies.createId("codex-plan"),
    metadata: {
      renderer: "codex-adapter",
      contextAssemblyId: contextAssembly.id
    },
    createdAt
  };
  const nextAction =
    contextAssembly.status === "abstained"
      ? "Context activation abstained; review exclusions before execution."
      : "Render Codex adapter brief.";

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
