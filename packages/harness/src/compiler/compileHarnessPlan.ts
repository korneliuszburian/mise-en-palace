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
  buildMemoryQuery,
  buildSourceQuery,
  rankCandidates,
  toMemoryCandidate,
  toSourceClaimCandidate
} from "../activation/index.js";
import type {
  HarnessRunRepository,
  MemoryRepository,
  RetrievalRepository,
  SourceRepository
} from "../repositories/index.js";
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
  memoryRepository: Pick<MemoryRepository, "listActiveMemory">;
  sourceRepository: Pick<SourceRepository, "listClaimsForProject">;
  retrievalRepository: Pick<
    RetrievalRepository,
    | "startRetrievalRun"
    | "completeRetrievalRun"
    | "addCandidate"
    | "recordActivationDecision"
    | "storeContextSelection"
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
  const harnessPlan = await dependencies.harnessRunRepository.createHarnessPlan({
    taskContractId: taskContract.id,
    version: 1,
    status: "ready",
    summary: `${taskContract.title}: ${taskContract.objective}`,
    nextAction: "Render Codex adapter brief.",
    metadata: input.metadata ?? {}
  });
  const memoryQuery = buildMemoryQuery(taskContract);
  const sourceQuery = buildSourceQuery(taskContract);
  const retrievalRun = await dependencies.retrievalRepository.startRetrievalRun({
    ...(taskContract.projectId === undefined ? {} : { projectId: taskContract.projectId }),
    taskContractId: taskContract.id,
    query: memoryQuery.text,
    ...(input.tokenBudget === undefined ? {} : { tokenBudget: input.tokenBudget }),
    metadata: {
      sourceQuery: sourceQuery.text
    }
  });
  const memoryRecords =
    taskContract.projectId === undefined
      ? []
      : await dependencies.memoryRepository.listActiveMemory(taskContract.projectId, defaultMemoryLimit);
  const sourceClaims =
    taskContract.projectId === undefined
      ? []
      : await dependencies.sourceRepository.listClaimsForProject(
          taskContract.projectId,
          defaultSourceLimit
        );
  const memoryCandidates = rankCandidates(memoryRecords.map(toMemoryCandidate), memoryQuery);
  const sourceCandidates = rankCandidates(sourceClaims.map(toSourceClaimCandidate), sourceQuery);
  const rankedCandidates = [...memoryCandidates, ...sourceCandidates].sort(
    (left, right) => right.totalScore - left.totalScore
  );
  const filteredCandidates = applyContextROI(
    applyTemporalFilter(
      applyTrustFilter(rankedCandidates, { minimumTrustTier }),
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
      retrievalRunId: retrievalRun.id
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
  const includedIds = new Set(contextAssembly.inclusions.map((inclusion) => inclusion.subjectId));

  for (const candidate of filteredCandidates) {
    const included = includedIds.has(candidate.subjectId);
    await dependencies.retrievalRepository.addCandidate({
      retrievalRunId: retrievalRun.id,
      kind: candidate.kind,
      status: included ? "included" : "excluded",
      subjectType: candidate.subjectType,
      subjectId: candidate.subjectId,
      trustTier: candidate.trustTier,
      lexicalScore: candidate.lexicalScore,
      vectorScore: candidate.vectorScore,
      graphScore: candidate.graphScore,
      temporalScore: candidate.temporalScore,
      contextRoiScore: candidate.contextRoiScore,
      totalScore: candidate.totalScore,
      reason: candidate.exclusion?.explanation ?? candidate.reason,
      metadata: candidate.metadata
    });
  }

  for (const inclusion of contextAssembly.inclusions) {
    await dependencies.retrievalRepository.recordActivationDecision({
      retrievalRunId: retrievalRun.id,
      contextAssemblyId: contextAssembly.id,
      subjectType: inclusion.subjectType,
      subjectId: inclusion.subjectId,
      decision: "included",
      reason: inclusion.reason,
      metadata: {
        expectedUse: inclusion.expectedUse
      }
    });
  }

  for (const exclusion of contextAssembly.exclusions) {
    await dependencies.retrievalRepository.recordActivationDecision({
      retrievalRunId: retrievalRun.id,
      contextAssemblyId: contextAssembly.id,
      subjectType: exclusion.subjectType,
      subjectId: exclusion.subjectId,
      decision: "excluded",
      reason: exclusion.reason,
      ...(exclusion.score === undefined ? {} : { score: exclusion.score }),
      metadata: {
        explanation: exclusion.explanation
      }
    });
  }

  await dependencies.retrievalRepository.storeContextSelection({
    contextAssemblyId: contextAssembly.id,
    inclusions: contextAssembly.inclusions,
    exclusions: contextAssembly.exclusions
  });
  await dependencies.retrievalRepository.completeRetrievalRun({
    retrievalRunId: retrievalRun.id,
    status: contextAssembly.status === "abstained" ? "abstained" : "completed",
    completedAt: dependencies.now(),
    metadata: {
      inclusionCount: contextAssembly.inclusions.length,
      exclusionCount: contextAssembly.exclusions.length
    }
  });

  const capabilityPlan = createCapabilityPlan({
    harnessPlan,
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
  const evidenceContract = createEvidenceContract(taskContract);
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
