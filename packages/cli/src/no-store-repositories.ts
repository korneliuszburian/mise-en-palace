import type {
  AntiMemoryRecord,
  ContextAssembly,
  EvidenceBundle,
  ExecutionRun,
  FeedbackDelta,
  HarnessPlan,
  MemoryRecord,
  OperatorIntent,
  ReviewAssessment,
  SourceClaim,
  TaskContract,
  UpdateExecutionRunStatusResult
} from "@krn/core";
import type {
  HarnessCompilerDependencies
} from "@krn/harness";
import type {
  AddRetrievalCandidateInput,
  CompleteRetrievalRunInput,
  CreateContextAssemblyInput,
  CreateEvidenceBundleInput,
  CreateExecutionRunInput,
  CreateFeedbackDeltaInput,
  CreateHarnessPlanInput,
  CreateOperatorIntentInput,
  CreateReviewAssessmentInput,
  CreateTaskContractInput,
  MemoryRepository,
  RecordActivationDecisionInput,
  RetrievalRunRecord,
  SourceRepository,
  StartRetrievalRunInput,
  UpdateExecutionRunStatusInput
} from "@krn/core/repositories/internal";

export interface NoStoreRuntime {
  now(): string;
  createId(prefix: string): string;
}

const notUsed = (method: string): never => {
  throw new Error(`${method} is not available in CLI no-store preview mode`);
};

const optionalField = <Key extends string, Value>(
  key: Key,
  value: Value | undefined
): Partial<Record<Key, Value>> =>
  value === undefined
    ? {}
    : { [key]: value } as Record<Key, Value>;

export const createNoStoreCompilerDependencies = (
  runtime: NoStoreRuntime
): HarnessCompilerDependencies => {
  const harnessRunRepository = {
    async createOperatorIntent(input: CreateOperatorIntentInput): Promise<OperatorIntent> {
      return {
        id: runtime.createId("operator-intent"),
        workspaceId: input.workspaceId,
        ...optionalField("projectId", input.projectId),
        source: input.source,
        rawIntent: input.rawIntent,
        ...optionalField("normalizedIntent", input.normalizedIntent),
        status: "received",
        metadata: input.metadata ?? {},
        createdAt: runtime.now()
      };
    },

    async createTaskContract(input: CreateTaskContractInput): Promise<TaskContract> {
      const timestamp = runtime.now();

      return {
        id: runtime.createId("task-contract"),
        operatorIntentId: input.operatorIntentId,
        ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
        title: input.title,
        objective: input.objective,
        constraints: input.constraints,
        nonGoals: input.nonGoals,
        acceptance: input.acceptance,
        status: "active",
        metadata: input.metadata ?? {},
        createdAt: timestamp,
        updatedAt: timestamp
      };
    },

    async createHarnessPlan(input: CreateHarnessPlanInput): Promise<HarnessPlan> {
      const timestamp = runtime.now();

      return {
        id: runtime.createId("harness-plan"),
        taskContractId: input.taskContractId,
        version: input.version,
        status: input.status ?? "draft",
        summary: input.summary,
        ...(input.nextAction === undefined ? {} : { nextAction: input.nextAction }),
        metadata: input.metadata ?? {},
        createdAt: timestamp,
        updatedAt: timestamp
      };
    },

    async createContextAssembly(input: CreateContextAssemblyInput): Promise<ContextAssembly> {
      return {
        id: runtime.createId("context-assembly"),
        harnessPlanId: input.harnessPlanId,
        status: input.status ?? "assembled",
        ...(input.tokenBudget === undefined ? {} : { tokenBudget: input.tokenBudget }),
        inclusions: input.inclusions,
        exclusions: input.exclusions,
        metadata: input.metadata ?? {},
        createdAt: runtime.now()
      };
    },

    async createExecutionRun(_input: CreateExecutionRunInput): Promise<ExecutionRun> {
      return notUsed("createExecutionRun");
    },

    async updateExecutionRunStatus(
      _input: UpdateExecutionRunStatusInput
    ): Promise<UpdateExecutionRunStatusResult> {
      return notUsed("updateExecutionRunStatus");
    },

    async createEvidenceBundle(_input: CreateEvidenceBundleInput): Promise<EvidenceBundle> {
      return notUsed("createEvidenceBundle");
    },

    async createReviewAssessment(_input: CreateReviewAssessmentInput): Promise<ReviewAssessment> {
      return notUsed("createReviewAssessment");
    },

    async createFeedbackDelta(_input: CreateFeedbackDeltaInput): Promise<FeedbackDelta> {
      return notUsed("createFeedbackDelta");
    }
  };
  const memoryRepository: Pick<MemoryRepository, "listActiveMemory" | "listAntiMemoryForProject"> = {
    async listActiveMemory(): Promise<MemoryRecord[]> {
      return [];
    },

    async listAntiMemoryForProject(): Promise<AntiMemoryRecord[]> {
      return [];
    }
  };
  const sourceRepository: Pick<
    SourceRepository,
    "listClaimsForProject" | "listSourceClaimEdgesForClaim" | "listSourceDecisionEdgesForClaim"
  > = {
    async listClaimsForProject(): Promise<SourceClaim[]> {
      return [];
    },

    async listSourceClaimEdgesForClaim() {
      return [];
    },

    async listSourceDecisionEdgesForClaim() {
      return [];
    }
  };
  const startRetrievalRun = async (
    input: StartRetrievalRunInput
  ): Promise<RetrievalRunRecord> => ({
    id: runtime.createId("retrieval-run"),
    ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
    ...(input.executionRunId === undefined ? {} : { executionRunId: input.executionRunId }),
    ...(input.taskContractId === undefined ? {} : { taskContractId: input.taskContractId }),
    status: "running",
    query: input.query,
    mode: input.mode ?? "mixed",
    ...(input.budget === undefined ? {} : { budget: input.budget }),
    ...(input.tokenBudget === undefined ? {} : { tokenBudget: input.tokenBudget }),
    metadataFilters: input.metadataFilters ?? {},
    startedAt: runtime.now(),
    metadata: input.metadata ?? {},
    createdAt: runtime.now()
  });
  const addRetrievalCandidate = async (
    input: AddRetrievalCandidateInput
  ) => ({
    id: runtime.createId("retrieval-candidate"),
    retrievalRunId: input.retrievalRunId,
    kind: input.kind,
    status: input.status ?? "candidate",
    subjectType: input.subjectType,
    subjectId: input.subjectId,
    ...optionalField("searchDocumentId", input.searchDocumentId),
    sourceAuthority: input.sourceAuthority,
    ...optionalField("lexicalScore", input.lexicalScore),
    ...optionalField("vectorScore", input.vectorScore),
    ...optionalField("graphScore", input.graphScore),
    ...optionalField("temporalScore", input.temporalScore),
    ...optionalField("contextRoiScore", input.contextRoiScore),
    ...optionalField("totalScore", input.totalScore),
    ...optionalField("score", input.score),
    reason: input.reason,
    metadata: input.metadata ?? {},
    createdAt: runtime.now()
  });
  const recordActivationDecision = async (
    input: RecordActivationDecisionInput
  ) => ({
    id: runtime.createId("activation-decision"),
    retrievalRunId: input.retrievalRunId,
    ...(input.retrievalCandidateId === undefined
      ? {}
      : { retrievalCandidateId: input.retrievalCandidateId }),
    ...(input.contextAssemblyId === undefined
      ? {}
      : { contextAssemblyId: input.contextAssemblyId }),
    subjectType: input.subjectType,
    subjectId: input.subjectId,
    decision: input.decision,
    reason: input.reason,
    ...(input.score === undefined ? {} : { score: input.score }),
    ...(input.contextBudgetCost === undefined
      ? {}
      : { contextBudgetCost: input.contextBudgetCost }),
    ...(input.expectedDecisionImpact === undefined
      ? {}
      : { expectedDecisionImpact: input.expectedDecisionImpact }),
    metadata: input.metadata ?? {},
    createdAt: runtime.now()
  });
  const retrievalRepository = {
    async createSearchDocument() {
      return notUsed("createSearchDocument");
    },

    async searchLexical() {
      return [];
    },

    async createEmbeddingModel() {
      return notUsed("createEmbeddingModel");
    },

    async createEmbedding() {
      return notUsed("createEmbedding");
    },

    async createRetrievalRun(input: StartRetrievalRunInput): Promise<RetrievalRunRecord> {
      return startRetrievalRun(input);
    },

    startRetrievalRun,

    async completeRetrievalRun(input: CompleteRetrievalRunInput): Promise<RetrievalRunRecord> {
      return {
        id: input.retrievalRunId,
        status: input.status,
        query: "no-store preview",
        mode: "mixed",
        startedAt: runtime.now(),
        completedAt: input.completedAt,
        metadataFilters: {},
        metadata: input.metadata ?? {},
        createdAt: runtime.now()
      };
    },

    async createRetrievalCandidate(input: AddRetrievalCandidateInput) {
      return addRetrievalCandidate(input);
    },

    addCandidate: addRetrievalCandidate,

    async createActivationDecision(input: RecordActivationDecisionInput) {
      return recordActivationDecision(input);
    },

    recordActivationDecision,

    async listCandidatesForRetrievalRun() {
      return [];
    },

    async listActivationDecisionsForRun() {
      return [];
    },

    async cleanupTestRetrievalRecords() {
      return { deletedCount: 0 };
    },

    async storeContextSelection(): Promise<void> {
      return undefined;
    }
  };

  return {
    harnessRunRepository,
    memoryRepository,
    sourceRepository,
    retrievalRepository,
    now: runtime.now,
    createId: runtime.createId
  };
};
