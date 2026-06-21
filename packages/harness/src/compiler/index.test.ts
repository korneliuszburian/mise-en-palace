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
  SourceDecisionEdge,
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
  metadata: {},
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
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
  constructor(private readonly records: readonly MemoryRecord[]) {}

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

  async startRetrievalRun(input: StartRetrievalRunInput): Promise<RetrievalRunRecord> {
    return {
      id: "retrieval-1",
      ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
      ...(input.taskContractId === undefined ? {} : { taskContractId: input.taskContractId }),
      status: "running",
      query: input.query,
      ...(input.tokenBudget === undefined ? {} : { tokenBudget: input.tokenBudget }),
      metadataFilters: input.metadataFilters ?? {},
      startedAt: now,
      metadata: input.metadata ?? {}
    };
  }

  async completeRetrievalRun(): Promise<RetrievalRunRecord> {
    return {
      id: "retrieval-1",
      projectId: "project-1",
      taskContractId: "task-1",
      status: "completed",
      query: "doctor readiness",
      startedAt: now,
      completedAt: now,
      metadataFilters: {},
      metadata: {}
    };
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
      trustTier: input.trustTier,
      ...(input.lexicalScore === undefined ? {} : { lexicalScore: input.lexicalScore }),
      ...(input.vectorScore === undefined ? {} : { vectorScore: input.vectorScore }),
      ...(input.graphScore === undefined ? {} : { graphScore: input.graphScore }),
      ...(input.temporalScore === undefined ? {} : { temporalScore: input.temporalScore }),
      ...(input.contextRoiScore === undefined ? {} : { contextRoiScore: input.contextRoiScore }),
      ...(input.totalScore === undefined ? {} : { totalScore: input.totalScore }),
      reason: input.reason,
      metadata: input.metadata ?? {},
      createdAt: now
    };
  }

  async recordActivationDecision(input: RecordActivationDecisionInput) {
    this.decisions.push(input);

    return {
      id: `decision-${this.decisions.length}`,
      retrievalRunId: input.retrievalRunId,
      ...(input.contextAssemblyId === undefined ? {} : { contextAssemblyId: input.contextAssemblyId }),
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      decision: input.decision,
      reason: input.reason,
      ...(input.score === undefined ? {} : { score: input.score }),
      metadata: input.metadata ?? {},
      createdAt: now
    };
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
