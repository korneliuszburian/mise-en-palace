import { describe, expect, it } from "vitest";
import type {
  AntiMemoryRecord,
  ContextAssembly,
  EvidenceBundle,
  ExecutionRun,
  FeedbackDelta,
  HarnessPlan,
  MemoryCandidate,
  MemoryRecord,
  OperatorIntent,
  ReviewAssessment,
  SourceClaim,
  TaskContract
} from "@krn/core";
import type {
  AddRetrievalCandidateInput,
  CreateContextAssemblyInput,
  CreateEvidenceBundleInput,
  CreateExecutionRunInput,
  CreateFeedbackDeltaInput,
  CreateHarnessPlanInput,
  CreateMemoryCandidateInput,
  CreateMemoryRecordInput,
  CreateOperatorIntentInput,
  CreateReviewAssessmentInput,
  CreateTaskContractInput,
  HarnessRunRepository,
  MemoryRepository,
  RecordActivationDecisionInput,
  RetrievalRepository,
  RetrievalRunRecord,
  SearchDocumentSearchResult,
  SourceRepository,
  StartRetrievalRunInput,
  UpdateExecutionRunStatusInput
} from "../repositories/index.js";
import {
  compileHarnessPlan
} from "./index.js";

const now = "2026-06-21T12:00:00.000Z";

const memoryRecord = (overrides: Partial<MemoryRecord>): MemoryRecord => ({
  id: "memory-1",
  projectId: "project-1",
  key: "brain-store",
  kind: "constraint",
  status: "active",
  summary: "Doctor checks the Postgres brain store",
  body: "The doctor command must report missing Postgres memory and source graph readiness.",
  owner: "kernel",
  confidence: 95,
  applicationGuidance: "Use when planning doctor readiness work.",
  sourceLineage: [{ sourceId: "adr-0010" }],
  isUserPreference: false,
  positiveFeedbackCount: 0,
  negativeFeedbackCount: 0,
  metadata: {},
  validFrom: "2026-06-01T00:00:00.000Z",
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
  ...overrides
});

const sourceClaim = (overrides: Partial<SourceClaim>): SourceClaim => ({
  id: "claim-1",
  sourceArtifactId: "artifact-1",
  claim: "Doctor readiness must be honest about configured brain store state.",
  mechanism: "Doctor compares expected Postgres-backed KRN state with configured runtime state.",
  krnImplication: "Compiler plans for doctor work need source grounding and evidence commands.",
  doesNotProve: "The production deployment is already ready.",
  trustTier: "high",
  supportType: "supports",
  consumer: "compiler-test",
  status: "proposed",
  metadata: {},
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
  ...overrides
});

const antiMemoryRecord = (overrides: Partial<AntiMemoryRecord>): AntiMemoryRecord => ({
  id: "anti-memory-1",
  projectId: "project-1",
  key: "anti-source-crawler",
  executionRunId: "run-1",
  rejectedClaim: "KRN should add a source crawler for activation.",
  reason: "Source crawler is out of scope for M25 activation.",
  invalidatedBySourceClaimIds: [],
  summary: "Do not add crawler for activation",
  body: "Activation should use the existing source, memory, and search substrate.",
  owner: "kernel",
  confidence: 95,
  sourceLineage: [{ sourceId: "source-1" }],
  metadata: {},
  validFrom: "2026-06-01T00:00:00.000Z",
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
  ...overrides
});

const searchDocument = (
  overrides: Partial<SearchDocumentSearchResult>
): SearchDocumentSearchResult => ({
  id: "search-doc-1",
  projectId: "project-1",
  subjectType: "search_document",
  subjectId: "search-doc-1",
  trustTier: "project-decision",
  validityStatus: "active",
  language: "english",
  title: "Activation readiness smoke",
  body: "Activation smoke should prove search candidates and explicit exclusions.",
  searchText: "Activation readiness smoke search candidates explicit exclusions.",
  metadataFilters: {},
  validFrom: "2026-06-01T00:00:00.000Z",
  metadata: {},
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
  lexicalScore: 100,
  ...overrides
});

class FakeHarnessRunRepository implements HarnessRunRepository {
  readonly contexts: ContextAssembly[] = [];

  async createOperatorIntent(input: CreateOperatorIntentInput): Promise<OperatorIntent> {
    return {
      id: "intent-1",
      workspaceId: input.workspaceId,
      ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
      source: input.source,
      rawIntent: input.rawIntent,
      ...(input.normalizedIntent === undefined ? {} : { normalizedIntent: input.normalizedIntent }),
      metadata: input.metadata ?? {},
      createdAt: now
    };
  }

  async createTaskContract(input: CreateTaskContractInput): Promise<TaskContract> {
    return {
      id: "task-1",
      operatorIntentId: input.operatorIntentId,
      ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
      title: input.title,
      objective: input.objective,
      constraints: input.constraints,
      nonGoals: input.nonGoals,
      acceptance: input.acceptance,
      status: "active",
      metadata: input.metadata ?? {},
      createdAt: now,
      updatedAt: now
    };
  }

  async createHarnessPlan(input: CreateHarnessPlanInput): Promise<HarnessPlan> {
    return {
      id: "plan-1",
      taskContractId: input.taskContractId,
      version: input.version,
      status: input.status ?? "draft",
      summary: input.summary,
      ...(input.nextAction === undefined ? {} : { nextAction: input.nextAction }),
      metadata: input.metadata ?? {},
      createdAt: now,
      updatedAt: now
    };
  }

  async createContextAssembly(input: CreateContextAssemblyInput): Promise<ContextAssembly> {
    const context: ContextAssembly = {
      id: "context-1",
      harnessPlanId: input.harnessPlanId,
      status: input.status ?? "assembled",
      ...(input.tokenBudget === undefined ? {} : { tokenBudget: input.tokenBudget }),
      inclusions: input.inclusions,
      exclusions: input.exclusions,
      metadata: input.metadata ?? {},
      createdAt: now
    };

    this.contexts.push(context);
    return context;
  }

  async createExecutionRun(_input: CreateExecutionRunInput): Promise<ExecutionRun> {
    throw new Error("not used by compiler");
  }

  async updateExecutionRunStatus(_input: UpdateExecutionRunStatusInput): Promise<ExecutionRun> {
    throw new Error("not used by compiler");
  }

  async createEvidenceBundle(_input: CreateEvidenceBundleInput): Promise<EvidenceBundle> {
    throw new Error("not used by compiler");
  }

  async createReviewAssessment(_input: CreateReviewAssessmentInput): Promise<ReviewAssessment> {
    throw new Error("not used by compiler");
  }

  async createFeedbackDelta(_input: CreateFeedbackDeltaInput): Promise<FeedbackDelta> {
    throw new Error("not used by compiler");
  }

  async getHarnessRunByExecutionRunId(): Promise<never> {
    throw new Error("not used by compiler");
  }
}

class FakeMemoryRepository implements MemoryRepository {
  constructor(
    private readonly records: readonly MemoryRecord[],
    private readonly antiMemoryRecords: readonly AntiMemoryRecord[] = []
  ) {}

  async createMemoryRecord(_input: CreateMemoryRecordInput): Promise<MemoryRecord> {
    throw new Error("not used by compiler");
  }

  async getMemoryRecord(_id: string): Promise<MemoryRecord | undefined> {
    throw new Error("not used by compiler");
  }

  async listActiveMemory(): Promise<MemoryRecord[]> {
    return [...this.records];
  }

  async createMemoryCandidate(_input: CreateMemoryCandidateInput): Promise<MemoryCandidate> {
    throw new Error("not used by compiler");
  }

  async listMemoryCandidates(): Promise<MemoryCandidate[]> {
    throw new Error("not used by compiler");
  }

  async createAntiMemoryRecord(): Promise<AntiMemoryRecord> {
    throw new Error("not used by compiler");
  }

  async listAntiMemoryForProject(): Promise<AntiMemoryRecord[]> {
    return [...this.antiMemoryRecords];
  }

  async listAntiMemoryForRun(): Promise<AntiMemoryRecord[]> {
    return [...this.antiMemoryRecords];
  }
}

class FakeSourceRepository implements Pick<SourceRepository, "listClaimsForProject"> {
  constructor(private readonly claims: readonly SourceClaim[]) {}

  async listClaimsForProject(): Promise<SourceClaim[]> {
    return [...this.claims];
  }
}

class FakeRetrievalRepository implements RetrievalRepository {
  readonly candidates: AddRetrievalCandidateInput[] = [];
  readonly decisions: RecordActivationDecisionInput[] = [];
  storedSelection: ContextAssembly | undefined;

  constructor(private readonly searchResults: readonly SearchDocumentSearchResult[] = []) {}

  async createSearchDocument() {
    throw new Error("not used by compiler");
  }

  async searchLexical() {
    return [...this.searchResults];
  }

  async createEmbeddingModel() {
    throw new Error("not used by compiler");
  }

  async createEmbedding() {
    throw new Error("not used by compiler");
  }

  async createRetrievalRun(input: StartRetrievalRunInput): Promise<RetrievalRunRecord> {
    return this.startRetrievalRun(input);
  }

  async startRetrievalRun(input: StartRetrievalRunInput): Promise<RetrievalRunRecord> {
    return {
      id: "retrieval-1",
      ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
      ...(input.executionRunId === undefined ? {} : { executionRunId: input.executionRunId }),
      ...(input.taskContractId === undefined ? {} : { taskContractId: input.taskContractId }),
      status: "running",
      query: input.query,
      mode: input.mode ?? "mixed",
      ...(input.budget === undefined ? {} : { budget: input.budget }),
      ...(input.tokenBudget === undefined ? {} : { tokenBudget: input.tokenBudget }),
      metadataFilters: input.metadataFilters ?? {},
      startedAt: now,
      metadata: input.metadata ?? {},
      createdAt: now
    };
  }

  async completeRetrievalRun(): Promise<RetrievalRunRecord> {
    return {
      id: "retrieval-1",
      projectId: "project-1",
      taskContractId: "task-1",
      status: "completed",
      query: "doctor readiness",
      mode: "mixed",
      startedAt: now,
      completedAt: now,
      metadataFilters: {},
      metadata: {},
      createdAt: now
    };
  }

  async createRetrievalCandidate(input: AddRetrievalCandidateInput) {
    return this.addCandidate(input);
  }

  async addCandidate(input: AddRetrievalCandidateInput) {
    this.candidates.push(input);

    return {
      id: `candidate-${this.candidates.length}`,
      retrievalRunId: input.retrievalRunId,
      kind: input.kind,
      status: input.status ?? "candidate",
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      ...(input.searchDocumentId === undefined ? {} : { searchDocumentId: input.searchDocumentId }),
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
      createdAt: now
    };
  }

  async createActivationDecision(input: RecordActivationDecisionInput) {
    return this.recordActivationDecision(input);
  }

  async recordActivationDecision(input: RecordActivationDecisionInput) {
    this.decisions.push(input);

    return {
      id: `decision-${this.decisions.length}`,
      retrievalRunId: input.retrievalRunId,
      ...(input.retrievalCandidateId === undefined
        ? {}
        : { retrievalCandidateId: input.retrievalCandidateId }),
      ...(input.contextAssemblyId === undefined ? {} : { contextAssemblyId: input.contextAssemblyId }),
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
      createdAt: now
    };
  }

  async listCandidatesForRetrievalRun() {
    return [];
  }

  async listActivationDecisionsForRun() {
    return [];
  }

  async cleanupTestRetrievalRecords() {
    return { deletedCount: 0 };
  }

  async storeContextSelection(input: {
    contextAssemblyId: string;
    inclusions: ContextAssembly["inclusions"];
    exclusions: ContextAssembly["exclusions"];
  }): Promise<void> {
    this.storedSelection = {
      id: input.contextAssemblyId,
      harnessPlanId: "plan-1",
      status: input.inclusions.length === 0 ? "abstained" : "assembled",
      inclusions: input.inclusions,
      exclusions: input.exclusions,
      metadata: {},
      createdAt: now
    };
  }
}

const compileInput = {
  workspaceId: "workspace-1",
  projectId: "project-1",
  operatorIntent: {
    rawIntent: "improve KRN doctor brain store readiness",
    source: "cli" as const,
    metadata: {}
  },
  taskContract: {
    title: "Improve KRN doctor brain store readiness",
    objective: "Make doctor report Postgres memory and source graph readiness",
    constraints: ["no runtime markdown memory"],
    nonGoals: ["do not add dashboard"],
    acceptance: ["typecheck and tests pass"],
    metadata: {}
  },
  tokenBudget: 180,
  metadata: {}
};

describe("compileHarnessPlan", () => {
  it("flows a golden fixture through the compiler", async () => {
    const harnessRunRepository = new FakeHarnessRunRepository();
    const retrievalRepository = new FakeRetrievalRepository();

    const result = await compileHarnessPlan(compileInput, {
      harnessRunRepository,
      memoryRepository: new FakeMemoryRepository([memoryRecord({ id: "memory-high" })]),
      sourceRepository: new FakeSourceRepository([sourceClaim({ id: "claim-high" })]),
      retrievalRepository,
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.operatorIntent.rawIntent).toBe(compileInput.operatorIntent.rawIntent);
    expect(result.taskContract.status).toBe("active");
    expect(result.harnessPlan.status).toBe("ready");
    expect(result.contextAssembly.inclusions.map((item) => item.subjectId)).toEqual([
      "memory-high",
      "claim-high"
    ]);
    expect(result.capabilityPlan.requirements.map((item) => item.kind)).toContain("type_safety");
    expect(result.codexAdapterPlanRef.adapterPlanId).toBe("codex-plan-1");
    expect(result.evidenceContract.commands.map((item) => item.command)).toEqual([
      "pnpm typecheck",
      "pnpm test",
      "git diff --check"
    ]);
    expect(retrievalRepository.decisions.some((item) => item.decision === "included")).toBe(true);
    expect(harnessRunRepository.contexts[0]?.status).toBe("assembled");
  });

  it("records weak context as abstain and exclusions instead of broad rereads", async () => {
    const retrievalRepository = new FakeRetrievalRepository();

    const result = await compileHarnessPlan(compileInput, {
      harnessRunRepository: new FakeHarnessRunRepository(),
      memoryRepository: new FakeMemoryRepository([
        memoryRecord({
          id: "memory-weak",
          confidence: 70,
          summary: "Unrelated visual preference",
          body: "Spacing note for an unrelated marketing page.",
          applicationGuidance: "Use only for unrelated presentation polish."
        })
      ]),
      sourceRepository: new FakeSourceRepository([
        sourceClaim({
          id: "claim-unsafe",
          trustTier: "low",
          doesNotProve: ""
        })
      ]),
      retrievalRepository,
      now: () => now,
      createId: (prefix) => `${prefix}-weak`
    });

    expect(result.contextAssembly.status).toBe("abstained");
    expect(result.contextAssembly.inclusions).toHaveLength(0);
    expect(result.contextAssembly.exclusions.map((item) => item.reason)).toEqual(
      expect.arrayContaining(["low_context_roi", "low_trust"])
    );
    expect(result.nextAction).toContain("abstained");
    expect(retrievalRepository.decisions.every((item) => item.decision !== "included")).toBe(true);
  });

  it("hardens capability requirements with priority and binding kinds outside TaskContract", async () => {
    const result = await compileHarnessPlan(compileInput, {
      harnessRunRepository: new FakeHarnessRunRepository(),
      memoryRepository: new FakeMemoryRepository([memoryRecord({ id: "memory-high" })]),
      sourceRepository: new FakeSourceRepository([sourceClaim({ id: "claim-high" })]),
      retrievalRepository: new FakeRetrievalRepository(),
      now: () => now,
      createId: (prefix) => `${prefix}-capability`
    });

    expect(result.capabilityPlan.requirements).not.toHaveLength(0);
    expect(result.capabilityPlan.requirements.every((requirement) =>
      requirement.priority === "required" &&
      requirement.bindingKinds.length > 0 &&
      requirement.requiredEvidence.length > 0
    )).toBe(true);
    expect(result.capabilityPlan.requirements.find((requirement) =>
      requirement.kind === "source_grounding"
    )?.bindingKinds).toEqual(expect.arrayContaining(["skill", "policy_gate"]));
    expect(result.capabilityPlan.requirements.find((requirement) =>
      requirement.kind === "type_safety"
    )?.bindingKinds).toEqual(expect.arrayContaining(["skill", "rule"]));
    expect("requiredSkills" in result.taskContract).toBe(false);
  });

  it("routes memory source audit tasks to focused capability requirements", async () => {
    const result = await compileHarnessPlan(
      {
        ...compileInput,
        taskContract: {
          ...compileInput.taskContract,
          title: "Harden memory schema source audit path",
          objective: "Update Memory Core repository schema and source-to-decision audit evidence for a memory implementation slice.",
          constraints: ["preserve MemoryReviewGate", "source-ground every decision"],
          acceptance: ["audit slice passes", "db readiness passes"]
        }
      },
      {
        harnessRunRepository: new FakeHarnessRunRepository(),
        memoryRepository: new FakeMemoryRepository([memoryRecord({ id: "memory-high" })]),
        sourceRepository: new FakeSourceRepository([sourceClaim({ id: "claim-high" })]),
        retrievalRepository: new FakeRetrievalRepository(),
        now: () => now,
        createId: (prefix) => `${prefix}-capability-routing`
      }
    );

    expect(result.capabilityPlan.requirements.map((requirement) => requirement.kind)).toEqual(
      expect.arrayContaining([
        "schema_design",
        "db_migration",
        "source_grounding",
        "evidence_capture",
        "review_capture"
      ])
    );
    expect("requiredSkills" in result.taskContract).toBe(false);
  });

  it("routes TypeScript boundary and review-risk tasks to focused capability requirements", async () => {
    const result = await compileHarnessPlan(
      {
        ...compileInput,
        taskContract: {
          ...compileInput.taskContract,
          title: "Harden TypeScript boundary review risk",
          objective: "Review JSON.parse and unknown input handling in CLI TypeScript code without weakening strict types.",
          constraints: ["preserve unknown-first boundaries", "report diff risk for reviewer"],
          nonGoals: ["do not add broad runtime surface"],
          acceptance: ["type boundary fixture triggers type-review binding", "diff risk review evidence is required"]
        }
      },
      {
        harnessRunRepository: new FakeHarnessRunRepository(),
        memoryRepository: new FakeMemoryRepository([memoryRecord({ id: "memory-high" })]),
        sourceRepository: new FakeSourceRepository([sourceClaim({ id: "claim-high" })]),
        retrievalRepository: new FakeRetrievalRepository(),
        now: () => now,
        createId: (prefix) => `${prefix}-type-risk`
      }
    );

    const typeSafety = result.capabilityPlan.requirements.find((requirement) =>
      requirement.kind === "type_safety"
    );
    const reviewCapture = result.capabilityPlan.requirements.find((requirement) =>
      requirement.kind === "review_capture"
    );
    const evidenceCapture = result.capabilityPlan.requirements.find((requirement) =>
      requirement.kind === "evidence_capture"
    );

    expect(typeSafety).toMatchObject({
      bindingKinds: expect.arrayContaining(["skill", "rule"]),
      requiredEvidence: expect.arrayContaining([
        "pnpm typecheck",
        "unknown-first boundary check",
        "no type weakening"
      ])
    });
    expect(typeSafety?.reason).toContain("TypeScript boundary");
    expect(reviewCapture).toMatchObject({
      bindingKinds: expect.arrayContaining(["skill", "policy_gate"]),
      requiredEvidence: expect.arrayContaining([
        "review-risk notes",
        "diff risk summary"
      ])
    });
    expect(evidenceCapture).toMatchObject({
      bindingKinds: expect.arrayContaining(["skill", "tool_boundary"]),
      requiredEvidence: expect.arrayContaining(["changed files summary", "git diff --check"])
    });
    expect("requiredSkills" in result.taskContract).toBe(false);
  });

  it("activates search candidates and records anti-memory conflicts as explicit exclusions", async () => {
    const retrievalRepository = new FakeRetrievalRepository([
      searchDocument({
        id: "search-activation",
        subjectId: "search-activation",
        title: "KRN doctor activation readiness",
        body: "Doctor activation readiness should use search candidates and context exclusions."
      })
    ]);
    const blockedClaim = sourceClaim({
      id: "claim-crawler",
      claim: "KRN should add a source crawler for activation readiness.",
      mechanism: "A crawler would gather more source material.",
      krnImplication: "Activation would have more context.",
      doesNotProve: "That crawler scope is allowed.",
      trustTier: "project-decision"
    });

    const result = await compileHarnessPlan(
      {
        ...compileInput,
        taskContract: {
          ...compileInput.taskContract,
          title: "Improve KRN doctor activation readiness",
          objective: "Use search candidates and reject crawler scope through anti-memory"
        },
        tokenBudget: 500
      },
      {
        harnessRunRepository: new FakeHarnessRunRepository(),
        memoryRepository: new FakeMemoryRepository(
          [memoryRecord({ id: "memory-activation" })],
          [
            antiMemoryRecord({
              id: "anti-crawler",
              invalidatedBySourceClaimIds: ["claim-crawler"],
              invalidatedBySourceClaimId: "claim-crawler"
            })
          ]
        ),
        sourceRepository: new FakeSourceRepository([blockedClaim]),
        retrievalRepository,
        now: () => now,
        createId: (prefix) => `${prefix}-activation`
      }
    );

    expect(result.contextAssembly.inclusions.map((item) => item.subjectId)).toContain(
      "search-activation"
    );
    expect(result.contextAssembly.exclusions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          subjectId: "claim-crawler",
          reason: "unsafe",
          explanation: expect.stringContaining("anti-memory")
        })
      ])
    );
    expect(retrievalRepository.candidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "search",
          status: "included",
          searchDocumentId: "search-activation"
        })
      ])
    );
    expect(retrievalRepository.decisions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          decision: "conflict",
          subjectId: "claim-crawler"
        })
      ])
    );
  });

  it("creates evidence expectations for reviewable engineering work", async () => {
    const result = await compileHarnessPlan(compileInput, {
      harnessRunRepository: new FakeHarnessRunRepository(),
      memoryRepository: new FakeMemoryRepository([]),
      sourceRepository: new FakeSourceRepository([]),
      retrievalRepository: new FakeRetrievalRepository(),
      now: () => now,
      createId: (prefix) => `${prefix}-evidence`
    });

    expect(result.evidenceContract.diffRisk).toBe("medium");
    expect(result.evidenceContract.reviewBurden).toContain("changed files");
    expect(result.evidenceContract.rollbackPath).toContain("revert");
    expect(result.evidenceContract.commands).toEqual([
      { command: "pnpm typecheck", required: true },
      { command: "pnpm test", required: true },
      { command: "git diff --check", required: true }
    ]);
  });
});
