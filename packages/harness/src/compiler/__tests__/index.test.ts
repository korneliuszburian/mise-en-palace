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
  SourceClaimEdge,
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
  CreateMemoryCandidateInput,
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
} from "@krn/core/repositories";
import {
  createRetrievalCandidateRecord,
  createRetrievalRunRecord
} from "../../test-support/retrieval-rows.js";
import type {
  TargetActivationReadModel
} from "../../activation/index.js";
import {
  compileHarnessPlan,
  decisionPacketForCompiledPlan
} from "../index.js";

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
  sourceAuthority: "high",
  supportType: "implementation-boundary",
  consumer: "compiler-test",
  falsifier: "A compiler plan includes this claim without decision support.",
  status: "accepted",
  metadata: {},
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
  ...overrides
});

const sourceDecisionEdge = (
  overrides: Partial<SourceDecisionEdge>
): SourceDecisionEdge => ({
  id: "source-decision-edge-1",
  sourceClaimId: "claim-1",
  targetType: "task_contract",
  targetId: "task-1",
  supportType: "implementation-boundary",
  confidence: "high",
  notes: "Decision edge supports compiler activation authority for this test claim.",
  metadata: {},
  createdAt: now,
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
  sourceAuthority: "project-decision",
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
      status: "received",
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

  async updateExecutionRunStatus(_input: UpdateExecutionRunStatusInput): Promise<never> {
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

  async getMemoryRecord(_id: string): Promise<MemoryRecord | undefined> {
    throw new Error("not used by compiler");
  }

  async listActiveMemory(): Promise<MemoryRecord[]> {
    return [...this.records];
  }

  async listHistoricalMemoryWarnings(): Promise<MemoryRecord[]> {
    return [];
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

class FakeSourceRepository implements Required<Pick<
  SourceRepository,
  "listClaimsForProject" | "listSourceClaimEdgesForProject" | "listSourceDecisionEdgesForClaim"
>> {
  private readonly decisionEdges: readonly SourceDecisionEdge[];

  constructor(
    private readonly claims: readonly SourceClaim[],
    private readonly edges: readonly SourceClaimEdge[] = [],
    decisionEdges?: readonly SourceDecisionEdge[]
  ) {
    this.decisionEdges = decisionEdges ?? claims.map((claim) =>
      sourceDecisionEdge({
        id: `source-decision-edge-${claim.id}`,
        sourceClaimId: claim.id
      }));
  }

  async listClaimsForProject(): Promise<SourceClaim[]> {
    return [...this.claims];
  }

  async listSourceClaimEdgesForProject(
    _projectId: string,
    sourceClaimId: SourceClaim["id"]
  ): Promise<SourceClaimEdge[]> {
    return this.edges.filter((edge) =>
      edge.fromSourceClaimId === sourceClaimId || edge.toSourceClaimId === sourceClaimId
    );
  }

  async listSourceDecisionEdgesForClaim(
    sourceClaimId: SourceDecisionEdge["sourceClaimId"]
  ): Promise<SourceDecisionEdge[]> {
    return this.decisionEdges.filter((edge) => edge.sourceClaimId === sourceClaimId);
  }
}

class FakeRetrievalRepository implements RetrievalRepository {
  readonly candidates: AddRetrievalCandidateInput[] = [];
  readonly completedRuns: CompleteRetrievalRunInput[] = [];
  readonly decisions: RecordActivationDecisionInput[] = [];
  startedRunMetadata: Record<string, unknown> | undefined;
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
    this.startedRunMetadata = input.metadata ?? {};

    return createRetrievalRunRecord(input, { now });
  }

  async completeRetrievalRun(input: CompleteRetrievalRunInput): Promise<RetrievalRunRecord> {
    this.completedRuns.push(input);

    return {
      id: input.retrievalRunId,
      projectId: "project-1",
      taskContractId: "task-1",
      status: input.status,
      query: "doctor readiness",
      mode: "mixed",
      startedAt: now,
      completedAt: input.completedAt,
      metadataFilters: {},
      metadata: input.metadata ?? {},
      createdAt: now
    };
  }

  async createRetrievalCandidate(input: AddRetrievalCandidateInput) {
    return this.addCandidate(input);
  }

  async addCandidate(input: AddRetrievalCandidateInput) {
    this.candidates.push(input);

    return createRetrievalCandidateRecord(input, {
      id: `candidate-${this.candidates.length}`,
      now
    });
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
  verificationCommands: ["pnpm typecheck", "pnpm test", "git diff --check"],
  tokenBudget: 180,
  metadata: {}
};

interface CrossRepoCompileScenario {
  projectId: string;
  repoInstallationId: string;
  localPathHint: string;
}

const crossRepoScenarios: readonly CrossRepoCompileScenario[] = [
  {
    projectId: "project-react-tooling",
    repoInstallationId: "repo-installation-react-tooling",
    localPathHint: "/work/react-tooling"
  },
  {
    projectId: "project-node-service",
    repoInstallationId: "repo-installation-node-service",
    localPathHint: "/work/node-service"
  },
  {
    projectId: "project-python-worker",
    repoInstallationId: "repo-installation-python-worker",
    localPathHint: "/work/python-worker"
  }
];

const crossRepoTargetReadModel = (
  scenario: CrossRepoCompileScenario
): TargetActivationReadModel => ({
  projectKernelId: `kernel-${scenario.projectId}`,
  repoInstallationIds: [scenario.repoInstallationId],
  localPathHints: [scenario.localPathHint],
  sourceSeeds: [
    {
      path: "src",
      kind: "source_root",
      reason: "implementation owner-file root"
    },
    {
      path: "tests",
      kind: "test_root",
      reason: "behavior proof owner-file root"
    }
  ],
  ownerFiles: [
    {
      path: "src/index.ts",
      root: "src",
      kind: "implementation_entry",
      reason: "implementation readiness owner file"
    },
    {
      path: "tests/readiness.test.ts",
      root: "tests",
      kind: "behavior_test",
      reason: "readiness behavior proof owner file"
    }
  ],
  trustExclusions: [
    {
      pathPattern: ".env*",
      reason: "secret-shaped files must stay out of context"
    }
  ]
});

const contextDecisionFingerprint = (context: ContextAssembly): {
  status: ContextAssembly["status"];
  inclusionReasons: readonly string[];
  exclusionReasons: readonly string[];
} => ({
  status: context.status,
  inclusionReasons: context.inclusions.map((inclusion) => inclusion.reason).sort(),
  exclusionReasons: context.exclusions.map((exclusion) => exclusion.reason).sort()
});

const repoInstallationIdsFromContext = (context: ContextAssembly): readonly string[] =>
  Array.from(new Set(context.inclusions.flatMap((inclusion) => {
    const match = /target repo installation ([^ ]+)/.exec(inclusion.expectedUse);
    const repoInstallationId = match?.[1];

    return repoInstallationId === undefined ? [] : [repoInstallationId.replace(/,$/, "")];
  }))).sort();

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
    expect(result.contextAssembly.metadata.canonicalRevisionTokens).toEqual([
      {
        subjectType: "memory_record",
        subjectId: "memory-high",
        updatedAt: "2026-06-01T00:00:00.000Z",
        status: "active"
      },
      {
        subjectType: "source_claim",
        subjectId: "claim-high",
        updatedAt: "2026-06-01T00:00:00.000Z",
        status: "accepted"
      }
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

  it("persists activation trace against the created retrieval run and context assembly", async () => {
    const harnessRunRepository = new FakeHarnessRunRepository();
    const retrievalRepository = new FakeRetrievalRepository();

    const result = await compileHarnessPlan(compileInput, {
      harnessRunRepository,
      memoryRepository: new FakeMemoryRepository([memoryRecord({ id: "memory-trace" })]),
      sourceRepository: new FakeSourceRepository([sourceClaim({ id: "claim-trace" })]),
      retrievalRepository,
      now: () => now,
      createId: (prefix) => `${prefix}-trace`
    });

    expect(result.contextAssembly.metadata).toMatchObject({
      retrievalRunId: "retrieval-1",
      sourceConsensusTimeline: expect.objectContaining({
        currentSourceClaimIds: ["claim-trace"]
      })
    });
    const compiledPacket = decisionPacketForCompiledPlan(result);
    expect(compiledPacket.sourceConsensus.timeline).toEqual(
      result.contextAssembly.metadata.sourceConsensusTimeline
    );
    expect(harnessRunRepository.contexts[0]?.id).toBe(result.contextAssembly.id);
    expect(retrievalRepository.storedSelection).toMatchObject({
      id: result.contextAssembly.id,
      inclusions: result.contextAssembly.inclusions,
      exclusions: result.contextAssembly.exclusions
    });
    expect(retrievalRepository.candidates.map((candidate) => candidate.retrievalRunId)).toEqual(
      ["retrieval-1", "retrieval-1"]
    );
    expect(retrievalRepository.decisions.map((decision) => ({
      contextAssemblyId: decision.contextAssemblyId,
      decision: decision.decision,
      retrievalRunId: decision.retrievalRunId,
      subjectId: decision.subjectId
    }))).toEqual([
      {
        contextAssemblyId: result.contextAssembly.id,
        decision: "included",
        retrievalRunId: "retrieval-1",
        subjectId: "memory-trace"
      },
      {
        contextAssemblyId: result.contextAssembly.id,
        decision: "included",
        retrievalRunId: "retrieval-1",
        subjectId: "claim-trace"
      }
    ]);
    expect(retrievalRepository.completedRuns).toEqual([
      expect.objectContaining({
        retrievalRunId: "retrieval-1",
        status: "completed",
        completedAt: now,
        rawEvidenceRecallTriggerCount: 0,
        metadata: expect.objectContaining({
          conflictCount: 0,
          exclusionCount: 0,
          inclusionCount: 2,
          sourceConsensusTimeline: expect.objectContaining({
            currentSourceClaimIds: ["claim-trace"]
          })
        })
      })
    ]);
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
          sourceAuthority: "low"
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

  it("excludes memory with blocking review signals from compiled activation context", async () => {
    const retrievalRepository = new FakeRetrievalRepository();

    const result = await compileHarnessPlan(
      {
        ...compileInput,
        tokenBudget: 500
      },
      {
        harnessRunRepository: new FakeHarnessRunRepository(),
        memoryRepository: new FakeMemoryRepository([
          memoryRecord({
            id: "memory-negative-review",
            positiveFeedbackCount: 1,
            negativeFeedbackCount: 3
          })
        ]),
        sourceRepository: new FakeSourceRepository([
          sourceClaim({ id: "claim-supported" })
        ]),
        retrievalRepository,
        now: () => now,
        createId: (prefix) => `${prefix}-memory-review`
      }
    );

    expect(result.contextAssembly.inclusions.map((item) => item.subjectId))
      .not.toContain("memory-negative-review");
    expect(result.contextAssembly.exclusions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        subjectId: "memory-negative-review",
        reason: "unsafe",
        explanation: expect.stringContaining("unresolved_negative_feedback")
      })
    ]));
    expect(retrievalRepository.candidates).toEqual(expect.arrayContaining([
      expect.objectContaining({
        subjectId: "memory-negative-review",
        status: "excluded",
        metadata: expect.objectContaining({
          memoryReviewSignals: expect.arrayContaining([
            expect.objectContaining({
              kind: "unresolved_negative_feedback",
              severity: "blocking"
            })
          ])
        })
      })
    ]));
    expect(retrievalRepository.decisions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        decision: "excluded",
        subjectId: "memory-negative-review",
        reason: "unsafe",
        exclusionCategory: "unsafe"
      })
    ]));
  });

  it("excludes accepted source claims without decision support from compiled activation context", async () => {
    const retrievalRepository = new FakeRetrievalRepository();

    const result = await compileHarnessPlan(
      {
        ...compileInput,
        tokenBudget: 500
      },
      {
        harnessRunRepository: new FakeHarnessRunRepository(),
        memoryRepository: new FakeMemoryRepository([]),
        sourceRepository: new FakeSourceRepository([
          sourceClaim({ id: "claim-without-decision" })
        ], [], []),
        retrievalRepository,
        now: () => now,
        createId: (prefix) => `${prefix}-source-review`
      }
    );

    expect(result.contextAssembly.inclusions.map((item) => item.subjectId))
      .not.toContain("claim-without-decision");
    expect(result.contextAssembly.exclusions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        subjectId: "claim-without-decision",
        reason: "unsafe",
        explanation: expect.stringContaining("accepted_claim_without_decision")
      })
    ]));
    expect(retrievalRepository.decisions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        decision: "excluded",
        subjectId: "claim-without-decision",
        reason: "unsafe",
        exclusionCategory: "unsafe"
      })
    ]));
  });

  it("uses canonical supported graph precedence in compiled context", async () => {
    const retrievalRepository = new FakeRetrievalRepository();
    const currentClaim = sourceClaim({ id: "claim-current-authority" });
    const rejectedClaim = sourceClaim({
      id: "claim-rejected-and-superseded",
      status: "rejected"
    });
    const supersedesEdge: SourceClaimEdge = {
      id: "edge-current-supersedes-rejected",
      fromSourceClaimId: currentClaim.id,
      toSourceClaimId: rejectedClaim.id,
      kind: "supersedes",
      metadata: {
        evidenceRefs: ["source:reviewed-relation"]
      },
      createdAt: now
    };

    const result = await compileHarnessPlan(
      { ...compileInput, tokenBudget: 500 },
      {
        harnessRunRepository: new FakeHarnessRunRepository(),
        memoryRepository: new FakeMemoryRepository([]),
        sourceRepository: new FakeSourceRepository(
          [currentClaim, rejectedClaim],
          [supersedesEdge],
          [sourceDecisionEdge({ sourceClaimId: currentClaim.id })]
        ),
        retrievalRepository,
        now: () => now,
        createId: (prefix) => `${prefix}-canonical-source-precedence`
      }
    );

    expect(result.contextAssembly.exclusions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        subjectId: rejectedClaim.id,
        reason: "superseded",
        explanation: expect.stringContaining(supersedesEdge.id)
      })
    ]));
  });

  it("keeps an unsafe source exclusion out of formal rejected paths in a compiled packet", async () => {
    const result = await compileHarnessPlan(
      {
        ...compileInput,
        tokenBudget: 500
      },
      {
        harnessRunRepository: new FakeHarnessRunRepository(),
        memoryRepository: new FakeMemoryRepository([]),
        sourceRepository: new FakeSourceRepository([
          sourceClaim({ id: "claim-compiled-unsafe" })
        ], [], []),
        retrievalRepository: new FakeRetrievalRepository(),
        now: () => now,
        createId: (prefix) => `${prefix}-compiled-unsafe`
      }
    );
    const packet = decisionPacketForCompiledPlan(result);

    expect(packet.contextExclusions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        subjectType: "source_claim",
        subjectId: "claim-compiled-unsafe",
        reason: "unsafe"
      })
    ]));
    expect(packet.rejectedPathIds).toEqual([]);
    expect(packet.sourceConsensus.rejectedPathIds).toEqual([]);
    expect(packet.sourceRejectionIds).toEqual([]);
    expect(packet.abstentionScore.status).toBe("abstain");
  });

  it("hardens capability requirements with priority and evidence outside TaskContract", async () => {
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
      requirement.requiredEvidence.length > 0
    )).toBe(true);
    expect(result.capabilityPlan.requirements.map((requirement) => requirement.kind)).toEqual(
      expect.arrayContaining(["source_grounding", "type_safety", "test_boundary"])
    );
    expect(result.harnessPlan.metadata.capabilityPlanToolBoundaries).toEqual(
      result.capabilityPlan.toolBoundaries
    );
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
      requiredEvidence: expect.arrayContaining([
        "pnpm typecheck",
        "unknown-first boundary check",
        "no type weakening"
      ])
    });
    expect(typeSafety?.reason).toContain("TypeScript boundary");
    expect(reviewCapture).toMatchObject({
      requiredEvidence: expect.arrayContaining([
        "review-risk notes",
        "diff risk summary"
      ])
    });
    expect(evidenceCapture).toMatchObject({
      requiredEvidence: expect.arrayContaining(["changed files summary", "git diff --check"])
    });
    expect("requiredSkills" in result.taskContract).toBe(false);
  });

  it("excludes unlinked search candidates and records anti-memory conflicts as explicit exclusions", async () => {
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
      sourceAuthority: "project-decision"
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
              invalidatedBySourceClaimIds: ["claim-crawler"]
            })
          ]
        ),
        sourceRepository: new FakeSourceRepository([blockedClaim]),
        retrievalRepository,
        now: () => now,
        createId: (prefix) => `${prefix}-activation`
      }
    );

    expect(result.contextAssembly.inclusions.map((item) => item.subjectId)).not.toContain(
      "search-activation"
    );
    expect(result.contextAssembly.exclusions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          subjectId: "search-activation",
          reason: "unsafe",
          explanation: "SearchDocument has no canonical subject link; it remains non-governing search evidence."
        }),
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
          status: "excluded",
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

  it("surfaces owner-file recall candidates for command-specific source repairs", async () => {
    const retrievalRepository = new FakeRetrievalRepository();

    const result = await compileHarnessPlan(
      {
        ...compileInput,
        taskContract: {
          ...compileInput.taskContract,
          title: "Improve DB readiness reporting",
          objective: "Improve DB readiness reporting for checked Postgres endpoint output without exposing secrets.",
          constraints: ["preserve existing readiness behavior"],
          acceptance: ["owner-file recall candidates are visible"]
        }
      },
      {
        harnessRunRepository: new FakeHarnessRunRepository(),
        memoryRepository: new FakeMemoryRepository([]),
        sourceRepository: new FakeSourceRepository([]),
        retrievalRepository,
        now: () => now,
        createId: (prefix) => `${prefix}-owner-recall`
      }
    );

    expect(result.contextAssembly.inclusions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          subjectType: "owner_file",
          reason: "Owner-file recall: packages/cli/src/run-db-readiness-command.ts"
        })
      ])
    );
    expect(retrievalRepository.candidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "search",
          status: "included",
          subjectType: "owner_file",
          subjectId: expect.any(String),
          metadata: expect.objectContaining({
            source: "owner_file_recall",
            projectId: "project-1",
            ownerFileSubjectId: "11111111-1111-4111-8111-111111111001",
            ownerFilePath: "packages/cli/src/run-db-readiness-command.ts"
          })
        })
      ])
    );
    expect(
      retrievalRepository.candidates.find((candidate) =>
        candidate.metadata.ownerFileSubjectId === "11111111-1111-4111-8111-111111111001"
      )
    ).not.toHaveProperty("searchDocumentId");
    expect(retrievalRepository.decisions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          decision: "included",
          subjectType: "owner_file",
          subjectId: expect.any(String)
        })
      ])
    );
  });

  it("uses target read-model candidates instead of static KRN owner files for project-scoped target plans", async () => {
    const retrievalRepository = new FakeRetrievalRepository();

    const result = await compileHarnessPlan(
      {
        ...compileInput,
        taskContract: {
          ...compileInput.taskContract,
          title: "Repair muke-v2 eval tests with target trust exclusions",
          objective: "Repair muke-v2 eval acceptance report tests and keep .env .muke runtime trust exclusions explicit.",
          constraints: ["do not build a source crawler"],
          acceptance: ["target owner-file recall candidates are visible"]
        },
        targetReadModel: {
          projectKernelId: "kernel-target",
          repoInstallationIds: ["repo-installation-target"],
          localPathHints: ["/tmp/muke-v2"],
          sourceSeeds: [
            {
              path: "evals",
              kind: "eval_workspace",
              reason: "seed eval, acceptance report, and test owner-file recall"
            },
            {
              path: "scripts",
              kind: "script_root",
              reason: "seed operator script and automation owner-file recall"
            }
          ],
          trustExclusions: [
            {
              pathPattern: ".env*",
              reason: "secret-shaped environment files must not enter planning context"
            },
            {
              pathPattern: ".muke/",
              reason: "generated target state is not source truth by default"
            }
          ]
        }
      },
      {
        harnessRunRepository: new FakeHarnessRunRepository(),
        memoryRepository: new FakeMemoryRepository([]),
        sourceRepository: new FakeSourceRepository([]),
        retrievalRepository,
        now: () => now,
        createId: (prefix) => `${prefix}-target-read-model`
      }
    );

    expect(result.contextAssembly.inclusions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          subjectType: "search_document",
          reason: "Target source seed: evals"
        }),
        expect.objectContaining({
          subjectType: "search_document",
          reason: "Target trust exclusions for project-scoped planning"
        })
      ])
    );
    expect(result.contextAssembly.inclusions).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          subjectId: "11111111-1111-4111-8111-111111111001"
        })
      ])
    );
    expect(retrievalRepository.candidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "search",
          status: "included",
          metadata: expect.objectContaining({
            source: "target_project_read_model",
            targetReadModelKind: "source_seed",
            targetPath: "evals"
          })
        }),
        expect.objectContaining({
          kind: "search",
          status: "included",
          metadata: expect.objectContaining({
            source: "target_project_read_model",
            targetReadModelKind: "trust_exclusions"
          })
        })
      ])
    );
    expect(retrievalRepository.startedRunMetadata).toMatchObject({
      targetReadModel: {
        sourceSeedCount: 2,
        ownerFileCount: 0,
        trustExclusionCount: 2,
        ownerFileRecall: {
          status: "missing_owner_file_read_model",
          reason: "target_read_model_has_no_owner_files",
          sourceSeedPaths: ["evals", "scripts"],
          ownerFilePaths: []
        }
      }
    });
  });

  it("uses target owner-file candidates below named roots when the read model provides them", async () => {
    const retrievalRepository = new FakeRetrievalRepository();

    const result = await compileHarnessPlan(
      {
        ...compileInput,
        taskContract: {
          ...compileInput.taskContract,
          title: "Repair target fixture readiness test owner file",
          objective: "Repair TypeScript fixture readiness test owner file without a crawler.",
          constraints: ["do not build a source crawler"],
          acceptance: ["target owner-file below tests root is visible"]
        },
        targetReadModel: {
          projectKernelId: "kernel-target",
          repoInstallationIds: ["repo-installation-target"],
          localPathHints: ["tests/fixtures/target-repos/typescript-basic"],
          sourceSeeds: [
            {
              path: "src",
              kind: "source_root",
              reason: "implementation owner-file root"
            },
            {
              path: "tests",
              kind: "test_root",
              reason: "behavior proof and test owner-file root"
            }
          ],
          ownerFiles: [
            {
              path: "src/index.ts",
              root: "src",
              kind: "implementation_entry",
              reason: "implementation readiness owner file"
            },
            {
              path: "tests/readiness.test.ts",
              root: "tests",
              kind: "behavior_test",
              reason: "test readiness owner file"
            }
          ],
          trustExclusions: []
        }
      },
      {
        harnessRunRepository: new FakeHarnessRunRepository(),
        memoryRepository: new FakeMemoryRepository([]),
        sourceRepository: new FakeSourceRepository([]),
        retrievalRepository,
        now: () => now,
        createId: (prefix) => `${prefix}-target-owner-file`
      }
    );

    expect(result.contextAssembly.inclusions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          subjectType: "owner_file",
          reason: "Target owner file: tests/readiness.test.ts"
        })
      ])
    );
    expect(retrievalRepository.candidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "search",
          status: "included",
          metadata: expect.objectContaining({
            source: "target_project_read_model",
            targetReadModelKind: "owner_file",
            targetPath: "tests/readiness.test.ts",
            targetRoot: "tests"
          })
        })
      ])
    );
    expect(retrievalRepository.startedRunMetadata).toMatchObject({
      targetReadModel: {
        sourceSeedCount: 2,
        ownerFileCount: 2,
        trustExclusionCount: 0,
        ownerFileRecall: {
          status: "owner_files_available",
          reason: "target_read_model_provided_owner_files",
          sourceSeedPaths: ["src", "tests"],
          ownerFilePaths: ["src/index.ts", "tests/readiness.test.ts"]
        }
      }
    });
  });

  it("keeps explicit target owner files ahead of covered seeds under the context budget", async () => {
    const retrievalRepository = new FakeRetrievalRepository();

    const result = await compileHarnessPlan(
      {
        ...compileInput,
        tokenBudget: 400,
        taskContract: {
          ...compileInput.taskContract,
          title: "Run observation-only owner-file target trial",
          objective: "Run observation-only owner-file target trial without writing target source.",
          constraints: ["do not write the target repo"],
          acceptance: ["explicit owner files are not crowded out by adjacent guidance"]
        },
        targetReadModel: {
          projectKernelId: "kernel-target",
          repoInstallationIds: ["repo-installation-target"],
          localPathHints: ["/tmp/krn-elektroinstal-ogar"],
          sourceSeeds: [
            {
              path: "AGENTS.md",
              kind: "agent_instructions",
              reason: "target-local agent guidance"
            },
            {
              path: "CLAUDE.md",
              kind: "agent_instructions",
              reason: "adjacent agent guidance"
            },
            {
              path: "bedrock",
              kind: "source_root",
              reason: "Bedrock source root"
            },
            {
              path: "woohub_gateway_v1",
              kind: "source_root",
              reason: "gateway source root"
            },
            {
              path: "README.md",
              kind: "project_readme",
              reason: "target overview"
            }
          ],
          ownerFiles: [
            {
              path: "AGENTS.md",
              root: ".",
              kind: "agent_instructions",
              reason: "target operator guidance"
            },
            {
              path: "bedrock/composer.json",
              root: "bedrock",
              kind: "package_manifest",
              reason: "Bedrock dependency manifest"
            },
            {
              path: "bedrock/README.md",
              root: "bedrock",
              kind: "project_readme",
              reason: "Bedrock runbook"
            },
            {
              path: "woohub_gateway_v1/main.py",
              root: "woohub_gateway_v1",
              kind: "implementation_entry",
              reason: "gateway implementation entry"
            },
            {
              path: "woohub_gateway_v1/README.md",
              root: "woohub_gateway_v1",
              kind: "project_readme",
              reason: "gateway runbook"
            }
          ],
          trustExclusions: [
            {
              pathPattern: ".env*",
              reason: "secret-shaped files must stay out of context"
            }
          ]
        }
      },
      {
        harnessRunRepository: new FakeHarnessRunRepository(),
        memoryRepository: new FakeMemoryRepository([]),
        sourceRepository: new FakeSourceRepository([]),
        retrievalRepository,
        now: () => now,
        createId: (prefix) => `${prefix}-target-owner-priority`
      }
    );

    expect(result.contextAssembly.inclusions.map((item) => item.reason)).toEqual(
      expect.arrayContaining([
        "Target owner file: AGENTS.md",
        "Target owner file: bedrock/composer.json",
        "Target owner file: bedrock/README.md",
        "Target owner file: woohub_gateway_v1/main.py",
        "Target owner file: woohub_gateway_v1/README.md"
      ])
    );
    expect(result.contextAssembly.inclusions).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          reason: "Target source seed: AGENTS.md"
        }),
        expect.objectContaining({
          reason: "Target source seed: CLAUDE.md"
        }),
        expect.objectContaining({
          reason: "Target source seed: bedrock"
        }),
        expect.objectContaining({
          reason: "Target source seed: woohub_gateway_v1"
        })
      ])
    );
    expect(result.contextAssembly.exclusions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          reason: "over_budget",
          subjectType: "search_document"
        })
      ])
    );
    expect(retrievalRepository.candidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "search",
          status: "included",
          metadata: expect.objectContaining({
            targetReadModelKind: "owner_file",
            targetPath: "bedrock/composer.json"
          })
        }),
        expect.objectContaining({
          kind: "search",
          status: "included",
          metadata: expect.objectContaining({
            targetReadModelKind: "owner_file",
            targetPath: "woohub_gateway_v1/main.py"
          })
        })
      ])
    );
  });

  it("keeps equivalent target plans stable across three repo contexts without leaking repo boundaries", async () => {
    const compiled = await Promise.all(crossRepoScenarios.map(async (scenario) => {
      const retrievalRepository = new FakeRetrievalRepository();
      const result = await compileHarnessPlan(
        {
          ...compileInput,
          projectId: scenario.projectId,
          tokenBudget: 500,
          taskContract: {
            ...compileInput.taskContract,
            title: "Repair target readiness owner files",
            objective: "Repair target readiness owner files in src and tests without reading secret-shaped files.",
            constraints: ["do not build a crawler", "preserve repo boundary"],
            acceptance: ["owner-file context is stable across target repos"]
          },
          targetReadModel: crossRepoTargetReadModel(scenario)
        },
        {
          harnessRunRepository: new FakeHarnessRunRepository(),
          memoryRepository: new FakeMemoryRepository([]),
          sourceRepository: new FakeSourceRepository([]),
          retrievalRepository,
          now: () => now,
          createId: (prefix) => `${prefix}-${scenario.projectId}`
        }
      );

      return { result, retrievalRepository, scenario };
    }));
    const fingerprints = compiled.map(({ result }) =>
      contextDecisionFingerprint(result.contextAssembly)
    );
    const ownerFileSubjectIdsByRepo = compiled.map(({ result }) =>
      result.contextAssembly.inclusions
        .filter((inclusion) => inclusion.reason.startsWith("Target owner file:"))
        .map((inclusion) => inclusion.subjectId)
        .sort()
    );

    expect(fingerprints).toEqual([
      fingerprints[0],
      fingerprints[0],
      fingerprints[0]
    ]);
    expect(fingerprints[0]).toEqual({
      status: "assembled",
      inclusionReasons: [
        "Target owner file: src/index.ts",
        "Target owner file: tests/readiness.test.ts",
        "Target trust exclusions for project-scoped planning"
      ],
      exclusionReasons: []
    });
    expect(new Set(ownerFileSubjectIdsByRepo.flat()).size).toBe(
      ownerFileSubjectIdsByRepo.flat().length
    );

    for (const { result, retrievalRepository, scenario } of compiled) {
      expect(result.taskContract.projectId).toBe(scenario.projectId);
      expect(repoInstallationIdsFromContext(result.contextAssembly)).toEqual([
        scenario.repoInstallationId
      ]);
      expect(result.contextAssembly.inclusions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            reason: "Target owner file: src/index.ts",
            expectedUse: expect.stringContaining(scenario.repoInstallationId)
          }),
          expect.objectContaining({
            reason: "Target owner file: tests/readiness.test.ts",
            expectedUse: expect.stringContaining(scenario.repoInstallationId)
          }),
          expect.objectContaining({
            reason: "Target trust exclusions for project-scoped planning",
            expectedUse: expect.stringContaining(scenario.repoInstallationId)
          })
        ])
      );
      expect(retrievalRepository.startedRunMetadata).toMatchObject({
        targetReadModel: {
          repoInstallationIds: [scenario.repoInstallationId],
          sourceSeedCount: 2,
          ownerFileCount: 2,
          trustExclusionCount: 1,
          ownerFileRecall: {
            status: "owner_files_available",
            reason: "target_read_model_provided_owner_files",
            sourceSeedPaths: ["src", "tests"],
            ownerFilePaths: ["src/index.ts", "tests/readiness.test.ts"]
          }
        }
      });
      expect(retrievalRepository.candidates).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            kind: "search",
            status: "included",
            metadata: expect.objectContaining({
              source: "target_project_read_model",
              repoInstallationIds: [scenario.repoInstallationId]
            })
          })
        ])
      );
    }
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

    expect(result.evidenceContract.taskContractId).toBe(result.taskContract.id);
    expect(result.evidenceContract.metadata).not.toHaveProperty("taskContractId");
    expect(result.harnessPlan.metadata.evidenceContract).toEqual(result.evidenceContract);
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
