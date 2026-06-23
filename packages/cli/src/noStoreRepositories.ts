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
  TaskContract
} from "@krn/core";
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
  HarnessCompilerDependencies,
  MemoryRepository,
  RecordActivationDecisionInput,
  RetrievalRunRecord,
  SourceRepository,
  StartRetrievalRunInput,
  UpdateExecutionRunStatusInput
} from "@krn/harness";

export interface NoStoreRuntime {
  now(): string;
  createId(prefix: string): string;
}

const notUsed = (method: string): never => {
  throw new Error(`${method} is not available in CLI no-store preview mode`);
};

export const createNoStoreCompilerDependencies = (
  runtime: NoStoreRuntime
): HarnessCompilerDependencies => {
  const harnessRunRepository = {
    async createOperatorIntent(input: CreateOperatorIntentInput): Promise<OperatorIntent> {
      return {
        id: runtime.createId("operator-intent"),
        workspaceId: input.workspaceId,
        ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
        source: input.source,
        rawIntent: input.rawIntent,
        ...(input.normalizedIntent === undefined ? {} : { normalizedIntent: input.normalizedIntent }),
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

    async updateExecutionRunStatus(_input: UpdateExecutionRunStatusInput): Promise<ExecutionRun> {
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
  const sourceRepository: Pick<SourceRepository, "listClaimsForProject"> = {
    async listClaimsForProject(): Promise<SourceClaim[]> {
      return [];
    }
  };
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
      return this.startRetrievalRun(input);
    },

    async startRetrievalRun(input: StartRetrievalRunInput): Promise<RetrievalRunRecord> {
      return {
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
      };
    },

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
      return this.addCandidate(input);
    },

    async addCandidate(input: AddRetrievalCandidateInput) {
      return {
        id: runtime.createId("retrieval-candidate"),
        retrievalRunId: input.retrievalRunId,
        kind: input.kind,
        status: input.status ?? "candidate",
        subjectType: input.subjectType,
        subjectId: input.subjectId,
        ...(input.searchDocumentId === undefined
          ? {}
          : { searchDocumentId: input.searchDocumentId }),
        trustTier: input.trustTier,
        ...(input.lexicalScore === undefined ? {} : { lexicalScore: input.lexicalScore }),
        ...(input.vectorScore === undefined ? {} : { vectorScore: input.vectorScore }),
        ...(input.graphScore === undefined ? {} : { graphScore: input.graphScore }),
        ...(input.temporalScore === undefined ? {} : { temporalScore: input.temporalScore }),
        ...(input.contextRoiScore === undefined ? {} : { contextRoiScore: input.contextRoiScore }),
        ...(input.totalScore === undefined ? {} : { totalScore: input.totalScore }),
        ...(input.score === undefined ? {} : { score: input.score }),
        reason: input.reason,
        metadata: input.metadata ?? {},
        createdAt: runtime.now()
      };
    },

    async createActivationDecision(input: RecordActivationDecisionInput) {
      return this.recordActivationDecision(input);
    },

    async recordActivationDecision(input: RecordActivationDecisionInput) {
      return {
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
      };
    },

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
