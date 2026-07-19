import { describe, expect, it } from "vitest";
import path from "node:path";
import { createHash } from "node:crypto";

import {
  runCli
} from "../run-cli.js";
import {
  createNoStoreCompilerDependencies
} from "../no-store-repositories.js";
import type {
  AntiMemoryRecord,
  DecisionPacketContractReadback,
  ContextAssembly,
  ExecutionRun,
  FeedbackDelta,
  HarnessPlan,
  MemoryRecord,
  OperatorIntent,
  SourceClaim,
  TaskContract
} from "@krn/core";
import {
  buildDecisionPacketIssuance,
  stampCurrentDecisionPacketAuthorityMetadata
} from "@krn/core";
import type {
  CreateContextAssemblyInput,
  CreateEvidenceBundleInput,
  CreateFeedbackDeltaInput,
  CreateExecutionRunInput,
  CreateHarnessPlanInput,
  CreateOperatorIntentInput,
  CreateReviewAssessmentInput,
  CreateTaskContractInput,
  HarnessRunAggregate,
  SearchDocumentSearchResult
} from "@krn/core/repositories/internal";
import type {
  DatabaseRuntimeInput
} from "../database-runtime.js";
import {
  now,
  runPersistedPlanWithCapturedMetadata,
  brainRecallMemoryRepository,
  unusedMemoryRepository
} from "./helpers/test-runtime.js";
import {
  decisionPacketMcpFixture
} from "./support/decision-packet-mcp-fixture.js";

const fixtureDecisionPacketIssuer = {
  async issueDecisionPacketForExecutionRun(): Promise<DecisionPacketContractReadback> {
    return decisionPacketMcpFixture as DecisionPacketContractReadback;
  }
};
const shouldNotBeCalled = (method: string): never => {
  throw new Error(`Plan test runtime method should not be called: ${method}`);
};

const knowledgeFeedbackDelta = (
  knowledgeId: string,
  outcome: "noise" | "stale" | "hurt" | "rejected"
): FeedbackDelta => ({
  id: `feedback-${knowledgeId}` as FeedbackDelta["id"],
  reviewAssessmentId: `review-${knowledgeId}` as FeedbackDelta["reviewAssessmentId"],
  status: "accepted",
  memoryCandidates: [],
  sourceDecisions: [],
  evalCandidates: [],
  metadata: stampCurrentDecisionPacketAuthorityMetadata({
    knowledgeUsefulnessOutcomes: [{
      knowledgeId,
      outcome,
      reason: "The knowledge was selected for a previous plan and proved stale for this task class.",
      evidenceRefs: [
        "packet:plan-usefulness-packet",
        "test:plan knowledge usefulness feedback"
      ],
      doesNotProve: "One feedback delta does not prove broad knowledge ranking quality."
    }]
  }, {
    checksum: "plan-usefulness-packet",
    generatedAt: now,
    sourceRunLifecycleRevision: 1
  }),
  createdAt: now,
  updatedAt: now
});

const planBackfillMemory = (index: number): MemoryRecord => ({
  id: `memory-backfill-${index}`,
  projectId: "project-1",
  key: `knowledge:backfill-${index}`,
  kind: "procedure",
  status: "active",
  summary: `Bounded backfill knowledge ${index}`,
  body: "Use bounded backfill knowledge for this diagnostic plan.",
  owner: "codex",
  confidence: 90,
  applicationGuidance: "Use for the bounded backfill diagnostic.",
  invalidationRule: "Invalidate if bounded backfill is no longer required.",
  sourceLineage: [{ sourceId: `source-backfill-${index}` }],
  isUserPreference: false,
  positiveFeedbackCount: 0,
  negativeFeedbackCount: 0,
  metadata: {
    knowledgeId: `backfill-${index}`,
    falsifier: "Post-retrieval feedback filtering prevents bounded backfill.",
    doesNotProve: "This fixture does not prove broad ranking quality."
  },
  validFrom: now,
  createdAt: now,
  updatedAt: now
});

const renderedDecisionPacket = (stdout: string): string => {
  const packetStart = stdout.indexOf("KRN Codex Execution Brief");

  if (packetStart < 0) {
    throw new Error("Persisted plan output did not render a DecisionPacket execution brief");
  }

  return stdout.slice(packetStart);
};

describe("runCli", () => {
  it("prints a bounded no-store plan for plan --task", async () => {
    const result = await runCli(["plan", "--task", "improve KRN doctor brain store readiness"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN Plan");
    expect(result.stdout).toContain("Task: improve KRN doctor brain store readiness");
    expect(result.stdout).toContain("Persistence: disabled");
    expect(result.stdout).toContain("Context included: 0");
    expect(result.stdout).toContain("Context excluded: 0");
    expect(result.stdout).toContain("Activation diagnostics:");
    expect(result.stdout).toContain("- inputStatus: empty_activation_store");
    expect(result.stdout).toContain("- searchMode: lexical");
    expect(result.stdout).toContain(
      "- counts: memory=0 sourceClaims=0 search=0 ownerFile=0 antiMemory=0 merged=0"
    );
    expect(result.stdout).toContain("Evidence expected: pnpm typecheck, pnpm test, git diff --check");
    expect(result.stdout).toContain("KRN Codex Execution Brief");
    expect(result.stdout).toContain("Packet Status: abstain");
    expect(result.stdout).toContain("Context activation abstained");
  });

  it("keeps plan as no-store preview unless --persist is explicit", async () => {
    const result = await runCli(["plan", "--task", "preview even with DB configured"], {
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@127.0.0.1:1/krn"
      },
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Persistence: disabled");
    expect(result.stdout).toContain("no-store preview");
  });

  it("returns a machine-readable handoff for preview and persisted plans", async () => {
    const preview = await runCli(
      ["plan", "--task", "preview machine-readable handoff", "--json"],
      {
        env: {},
        now: () => now,
        createId: (prefix) => `${prefix}-1`
      }
    );
    const previewJson = JSON.parse(preview.stdout) as Record<string, unknown>;

    expect(preview.exitCode).toBe(0);
    expect(preview.stderr).toBe("");
    expect(previewJson).toMatchObject({
      kind: "krn.plan.v1",
      task: "preview machine-readable handoff",
      handoff: {
        kind: "preview",
        packet: { abstentionScore: { status: "abstain" } }
      }
    });

    const { result: persisted } = await runPersistedPlanWithCapturedMetadata(
      "persist machine-readable handoff",
      { format: "json" }
    );
    const persistedJson = JSON.parse(persisted.stdout) as Record<string, unknown>;

    expect(persisted.exitCode).toBe(0);
    expect(persisted.stderr).toBe("");
    expect(persistedJson).toMatchObject({
      kind: "krn.plan.v1",
      task: "persist machine-readable handoff",
      project: { id: "project-1" },
      handoff: {
        kind: "persisted",
        identity: {
          operatorIntentId: "operator-intent-1",
          taskContractId: "task-contract-1",
          harnessPlanId: "harness-plan-1",
          contextAssemblyId: "context-assembly-1",
          executionRunId: "execution-run-1"
        },
        packetIdentity: decisionPacketMcpFixture.packetIdentity
      }
    });
    expect(persistedJson.handoff).not.toHaveProperty("packet");

    const { result: persistedText } = await runPersistedPlanWithCapturedMetadata(
      "persist machine-readable handoff"
    );
    expect(Buffer.byteLength(persisted.stdout)).toBeLessThan(
      Buffer.byteLength(persistedText.stdout)
    );
  });

  it("requires database config for plan --persist", async () => {
    const result = await runCli(
      ["plan", "--task", "persist harness run", "--persist"],
      {
        env: {},
        now: () => now,
        createId: (prefix) => `${prefix}-1`
      }
    );

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("KRN_DATABASE_URL is required for krn plan --persist");
    expect(result.stderr).toContain(
      "Next action: export KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn; docker compose up -d krn-postgres; pnpm db:migrate; pnpm db:ready"
    );
  });

  it("fails closed when a persisted runtime cannot issue a DecisionPacket", async () => {
    const { result } = await runPersistedPlanWithCapturedMetadata(
      "persist without packet issuance",
      { omitDecisionPacketIssuance: true }
    );

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain(
      "Persisted plan requires authoritative DecisionPacket issuance"
    );
  });

  it("prints persisted IDs for plan --persist", async () => {
    let issuedReadback: DecisionPacketContractReadback | undefined;
    const result = await runCli(
      ["plan", "--task", "persist harness run", "--persist"],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        createDatabaseRuntime: async (input: DatabaseRuntimeInput) => {
          const dependencies = createNoStoreCompilerDependencies(input);
          let operatorIntent: OperatorIntent | undefined;
          let taskContract: TaskContract | undefined;
          let harnessPlan: HarnessPlan | undefined;
          let contextAssembly: ContextAssembly | undefined;
          let executionRun: ExecutionRun | undefined;
          const harnessRunRepository = {
            ...dependencies.harnessRunRepository,
            ...fixtureDecisionPacketIssuer,
            async createOperatorIntent(intentInput: CreateOperatorIntentInput) {
              operatorIntent = await dependencies.harnessRunRepository.createOperatorIntent(
                intentInput
              );
              return operatorIntent;
            },
            async createTaskContract(contractInput: CreateTaskContractInput) {
              taskContract = await dependencies.harnessRunRepository.createTaskContract(
                contractInput
              );
              return taskContract;
            },
            async createHarnessPlan(planInput: CreateHarnessPlanInput) {
              harnessPlan = await dependencies.harnessRunRepository.createHarnessPlan(planInput);
              return harnessPlan;
            },
            async createContextAssembly(assemblyInput: CreateContextAssemblyInput) {
              contextAssembly = await dependencies.harnessRunRepository.createContextAssembly(
                assemblyInput
              );
              return contextAssembly;
            },
            async createExecutionRun(runInput: CreateExecutionRunInput) {
              executionRun = {
                id: "execution-run-1",
                harnessPlanId: runInput.harnessPlanId,
                adapter: runInput.adapter,
                status: runInput.status ?? "planned",
                lifecycleRevision: 1,
                ...(runInput.startedAt === undefined ? {} : { startedAt: runInput.startedAt }),
                metadata: runInput.metadata ?? {},
                createdAt: now,
                updatedAt: now
              };
              return executionRun;
            },
            async issueDecisionPacketForExecutionRun(
              executionRunId: string
            ): Promise<DecisionPacketContractReadback> {
              if (
                operatorIntent === undefined ||
                taskContract === undefined ||
                harnessPlan === undefined ||
                contextAssembly === undefined ||
                executionRun === undefined ||
                executionRun.id !== executionRunId
              ) {
                throw new Error("DecisionPacket issuance requires the captured persisted run");
              }

              const aggregate: HarnessRunAggregate = {
                operatorIntent,
                taskContract,
                harnessPlan,
                contextAssembly,
                executionRun,
                evidenceBundles: [],
                reviewAssessments: [],
                feedbackDeltas: [],
                runEvents: []
              };

              issuedReadback = buildDecisionPacketIssuance({
                aggregate,
                packetGeneratedAt: now,
                sha256Hex: (value) => createHash("sha256").update(value).digest("hex")
              });
              return issuedReadback;
            },
            async getHarnessRunByExecutionRunId() {
              return undefined;
            },
            async createEvidenceBundle(_input: CreateEvidenceBundleInput): Promise<never> {
              return shouldNotBeCalled("createEvidenceBundle");
            },
            async createReviewAssessment(_input: CreateReviewAssessmentInput): Promise<never> {
              return shouldNotBeCalled("createReviewAssessment");
            },
            async createFeedbackDelta(_input: CreateFeedbackDeltaInput): Promise<never> {
              return shouldNotBeCalled("createFeedbackDelta");
            }
          };
          const sourceRepository = {
            ...dependencies.sourceRepository,
            async createSourceArtifact() {
              return shouldNotBeCalled("createSourceArtifact");
            },
            async createSourceClaim() {
              return shouldNotBeCalled("createSourceClaim");
            },
            async getSourceClaimById() {
              return shouldNotBeCalled("getSourceClaimById");
            },
            async createSourceClaimEdge() {
              return shouldNotBeCalled("createSourceClaimEdge");
            },
            async createSourceDecisionEdge() {
              return shouldNotBeCalled("createSourceDecisionEdge");
            },
            async getSourceDecisionEdgeById() {
              return shouldNotBeCalled("getSourceDecisionEdgeById");
            },
            async createSourceRejection() {
              return shouldNotBeCalled("createSourceRejection");
            }
          };
          return {
            workspaceId: "workspace-1",
            projectId: "project-1",
            compilerDependencies: {
              ...dependencies,
              harnessRunRepository,
              memoryRepository: brainRecallMemoryRepository
            },
            harnessRunRepository,
            sourceRepository,
            memoryRepository: brainRecallMemoryRepository,
            async close() {
              return undefined;
            }
          };
        }
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Persistence: enabled (Postgres, explicit --persist)");
    expect(result.stdout).toContain("Persisted IDs:");
    expect(result.stdout).toContain("operatorIntent: operator-intent-1");
    expect(result.stdout).toContain("taskContract: task-contract-1");
    expect(result.stdout).toContain("harnessPlan: harness-plan-1");
    expect(result.stdout).toContain("contextAssembly: context-assembly-1");
    expect(result.stdout).toContain("executionRun: execution-run-1");
    expect(issuedReadback).toBeDefined();
    if (issuedReadback === undefined) {
      throw new Error("Persisted plan did not issue a DecisionPacket");
    }
    expect(result.stdout).toContain(
      `Packet Status: ${issuedReadback.packet.abstentionScore.status}`
    );
    expect(issuedReadback.packet.abstentionScore.reasons).not.toHaveLength(0);
    for (const reason of issuedReadback.packet.abstentionScore.reasons) {
      expect(result.stdout).toContain(`- ${reason}`);
    }
    for (const boundary of issuedReadback.packet.toolBoundaries) {
      expect(result.stdout).toContain(`- ${boundary}`);
    }
  });

  it("persists selected knowledge IDs for plan --persist", async () => {
    let executionRunMetadata: Record<string, unknown> | undefined;
    const result = await runCli(
      ["plan", "--task", "unknown first", "--persist"],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        createDatabaseRuntime: async (input: DatabaseRuntimeInput) => {
          const dependencies = createNoStoreCompilerDependencies(input);
          const harnessRunRepository = {
            ...dependencies.harnessRunRepository,
            ...fixtureDecisionPacketIssuer,
            async createExecutionRun(runInput: CreateExecutionRunInput) {
              executionRunMetadata = runInput.metadata ?? {};

              return {
                id: "execution-run-1",
                harnessPlanId: runInput.harnessPlanId,
                adapter: runInput.adapter,
                status: runInput.status ?? "planned",
                lifecycleRevision: 1,
                metadata: runInput.metadata ?? {},
                createdAt: now,
                updatedAt: now
              };
            },
            async getHarnessRunByExecutionRunId() {
              return undefined;
            },
            async createEvidenceBundle(_input: CreateEvidenceBundleInput): Promise<never> {
              return shouldNotBeCalled("createEvidenceBundle");
            },
            async createReviewAssessment(_input: CreateReviewAssessmentInput): Promise<never> {
              return shouldNotBeCalled("createReviewAssessment");
            },
            async createFeedbackDelta(_input: CreateFeedbackDeltaInput): Promise<never> {
              return shouldNotBeCalled("createFeedbackDelta");
            }
          };
          const sourceRepository = {
            ...dependencies.sourceRepository,
            async createSourceArtifact() {
              return shouldNotBeCalled("createSourceArtifact");
            },
            async createSourceClaim() {
              return shouldNotBeCalled("createSourceClaim");
            },
            async getSourceClaimById() {
              return shouldNotBeCalled("getSourceClaimById");
            },
            async createSourceClaimEdge() {
              return shouldNotBeCalled("createSourceClaimEdge");
            },
            async createSourceDecisionEdge() {
              return shouldNotBeCalled("createSourceDecisionEdge");
            },
            async getSourceDecisionEdgeById() {
              return shouldNotBeCalled("getSourceDecisionEdgeById");
            },
            async createSourceRejection() {
              return shouldNotBeCalled("createSourceRejection");
            }
          };
          return {
            workspaceId: "workspace-1",
            projectId: "project-1",
            compilerDependencies: {
              ...dependencies,
              harnessRunRepository,
              memoryRepository: brainRecallMemoryRepository
            },
            harnessRunRepository,
            sourceRepository,
            memoryRepository: brainRecallMemoryRepository,
            async close() {
              return undefined;
            }
          };
        }
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Selected KRN context: selected");
    expect(result.stdout).toContain("Selected KRN context IDs: ts-boundary-unknown-first-result-state");
    expect(result.stdout).toContain(
      "Selected KRN context reason: Store-backed knowledge read model matched the pre-coding plan query."
    );
    expect(result.stdout).toContain("Selected KRN context targetFit: target_specific_selected_knowledge");
    expect(result.stdout).toContain("Selected KRN context recommended use: Use target-specific selectedKnowledge");
    expect(result.stdout).toContain(
      "- knowledge=ts-boundary-unknown-first-result-state | readModel=knowledge:ts-boundary-unknown-first-result-state"
    );
    expect(executionRunMetadata).toMatchObject({
      knowledgeSelection: {
        status: "selected",
        source: "memory_store",
        reason:
          "Store-backed knowledge read model matched the pre-coding plan query.",
        selectedKnowledgeIds: ["ts-boundary-unknown-first-result-state"]
      }
    });
  });

  it("attaches store-backed feedback for review without suppressing plan knowledge", async () => {
    const { result, executionRunMetadata } = await runPersistedPlanWithCapturedMetadata(
      "TypeScript",
      {
        feedbackDeltas: [
          knowledgeFeedbackDelta("knowledge:ts-boundary-knowledge-parser-exemplar", "stale")
        ]
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Selected KRN context: selected");
    expect(result.stdout).toContain(
      "Selected KRN context IDs: ts-boundary-knowledge-parser-exemplar, ts-boundary-unknown-first-result-state"
    );
    expect(result.stdout).toContain(
      "knowledge=ts-boundary-knowledge-parser-exemplar | readModel=knowledge:ts-boundary-knowledge-parser-exemplar | reviewability=ready | targetFit=target_specific | title=TypeScript parser exemplar metadata-boundary | nextAction=review"
    );
    expect(executionRunMetadata).toMatchObject({
      knowledgeSelection: {
        status: "selected",
        selectedKnowledgeIds: [
          "ts-boundary-knowledge-parser-exemplar",
          "ts-boundary-unknown-first-result-state"
        ],
        proof: {
          proves: [
            "plan knowledge selection read active MemoryRecord rows from the resolved DB project",
            "plan knowledge selection scan limit=100 returned=4 truncated=false",
            "plan knowledge selection attached review-only store-backed usefulness feedback"
          ],
          doesNotProve: [
            "DB-backed knowledge selection proves source truth",
            "Codex used the selected memory",
            "bounded plan knowledge selection proves no eligible knowledge exists beyond the first 100 ranked active rows",
            "store-backed usefulness feedback proves broad ranking quality"
          ]
        }
      }
    });
  });

  it("does not backfill when review-only feedback leaves ranked records eligible", async () => {
    const memoryRecords = Array.from(
      { length: 21 },
      (_, index) => planBackfillMemory(index + 1)
    );
    const observedLimits: number[] = [];
    const { result, executionRunMetadata } = await runPersistedPlanWithCapturedMetadata(
      "bounded backfill",
      {
        memoryRecords,
        feedbackDeltas: memoryRecords.slice(0, 20).map((_record, index) =>
          knowledgeFeedbackDelta(`knowledge:backfill-${index + 1}`, "stale")
        ),
        onListActiveMemory: (limit) => observedLimits.push(limit)
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(observedLimits[0]).toBe(101);
    expect(executionRunMetadata).toMatchObject({
      knowledgeSelection: {
        status: "selected",
        selectedKnowledgeIds: [
          "backfill-1",
          "backfill-2",
          "backfill-3",
          "backfill-4",
          "backfill-5"
        ],
        proof: {
          proves: expect.arrayContaining([
            "plan knowledge selection scan limit=100 returned=21 truncated=false"
          ]),
          doesNotProve: expect.arrayContaining([
            "bounded plan knowledge selection proves no eligible knowledge exists beyond the first 100 ranked active rows"
          ])
        }
      }
    });
  });

  it("carries review-only feedback for activation candidates without changing selection", async () => {
    const memoryRecords = Array.from(
      { length: 21 },
      (_, index) => planBackfillMemory(index + 1)
    );
    const baseline = await runPersistedPlanWithCapturedMetadata("bounded backfill", {
      memoryRecords
    });
    const feedbackFiltered = await runPersistedPlanWithCapturedMetadata("bounded backfill", {
      memoryRecords,
      feedbackDeltas: memoryRecords.slice(0, 20).map((_record, index) =>
        knowledgeFeedbackDelta(`knowledge:backfill-${index + 1}`, "stale")
      )
    });

    expect(baseline.executionRunMetadata).toMatchObject({
      knowledgeSelection: {
        status: "selected",
        selectedKnowledgeIds: [
          "backfill-1",
          "backfill-2",
          "backfill-3",
          "backfill-4",
          "backfill-5"
        ]
      }
    });
    expect(feedbackFiltered.executionRunMetadata).toMatchObject({
      knowledgeSelection: {
        status: "selected",
        selectedKnowledgeIds: [
          "backfill-1",
          "backfill-2",
          "backfill-3",
          "backfill-4",
          "backfill-5"
        ],
        reviewOnlyUsefulnessCaveats: expect.arrayContaining([
          expect.objectContaining({
            subjectId: "knowledge:backfill-20",
            outcome: "stale"
          })
        ])
      }
    });
    expect(feedbackFiltered.result.stdout).toContain(
      "Selected KRN context IDs: backfill-1, backfill-2, backfill-3, backfill-4, backfill-5"
    );
    expect(renderedDecisionPacket(feedbackFiltered.result.stdout)).toBe(
      renderedDecisionPacket(baseline.result.stdout)
    );
  });

  it("does not report exhaustion from review-only feedback", async () => {
    const memoryRecords = Array.from(
      { length: 101 },
      (_, index) => planBackfillMemory(index + 1)
    );
    const { executionRunMetadata } = await runPersistedPlanWithCapturedMetadata(
      "bounded backfill",
      {
        memoryRecords,
        feedbackDeltas: memoryRecords.slice(0, 100).map((_record, index) =>
          knowledgeFeedbackDelta(`knowledge:backfill-${index + 1}`, "stale")
        )
      }
    );

    expect(executionRunMetadata).toMatchObject({
      knowledgeSelection: {
        status: "selected",
        selectedKnowledgeIds: [
          "backfill-1",
          "backfill-2",
          "backfill-3",
          "backfill-4",
          "backfill-5"
        ],
        proof: {
          proves: expect.arrayContaining([
            "plan knowledge selection scan limit=100 returned=100 truncated=true"
          ]),
          doesNotProve: expect.arrayContaining([
            "bounded plan knowledge selection proves no eligible knowledge exists beyond the first 100 ranked active rows"
          ])
        }
      }
    });
  });

  it("retries memory recall planning with compact mechanism terms", async () => {
    const { result, executionRunMetadata } = await runPersistedPlanWithCapturedMetadata(
      "Use the retained consensus relation maintenance review boundary in a bounded mini Brain-QA or consensus-lane readback; verify whether knowledge:consensus-relation-maintenance-review-boundary is selected or classify the miss; record whether it changes the next source-to-decision decision; no runtime schema dashboard API MCP worker daemon crawler graph ranking rewrite or Memory Core mutation work"
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Selected KRN context: selected");
    expect(result.stdout).toContain("Selected KRN context IDs: consensus-relation-maintenance-review-boundary");
    expect(executionRunMetadata).toMatchObject({
      knowledgeSelection: {
        status: "selected",
        selectedKnowledgeIds: ["consensus-relation-maintenance-review-boundary"]
      }
    });
  });

  it("retries memory recall planning with parser exemplar mechanism terms", async () => {
    const { result, executionRunMetadata } = await runPersistedPlanWithCapturedMetadata(
      "Improve knowledge plan query shaping so long TypeScript parser exemplar metadata-boundary tasks select knowledge:ts-boundary-knowledge-parser-exemplar without ranking, schema, or Memory Core changes"
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Selected KRN context: selected");
    expect(result.stdout).toContain("Selected KRN context query: typescript parser exemplar");
    expect(result.stdout).toContain("Selected KRN context IDs: ts-boundary-knowledge-parser-exemplar");
    expect(executionRunMetadata).toMatchObject({
      knowledgeSelection: {
        status: "selected",
        query: "typescript parser exemplar",
        selectedKnowledgeIds: ["ts-boundary-knowledge-parser-exemplar"]
      }
    });
  });

  it("selects reference implementation recipe knowledge for exemplar tasks", async () => {
    const { result, executionRunMetadata } = await runPersistedPlanWithCapturedMetadata(
      "Prove the retained reference-implementation recipe through one executable/readback brain surface so future KRN work can retrieve and apply a local code exemplar without building a clone runtime or more markdown instructions"
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Selected KRN context: selected");
    expect(result.stdout).toContain("Selected KRN context query: prove reference implementation recipe");
    expect(result.stdout).toContain("Selected KRN context IDs: reference-implementation-recipe-clone-boundary");
    expect(executionRunMetadata).toMatchObject({
      knowledgeSelection: {
        status: "selected",
        query: "prove reference implementation recipe",
        selectedKnowledgeIds: ["reference-implementation-recipe-clone-boundary"]
      }
    });
  });

  it("passes the current repo root hint for default persisted planning", async () => {
    const repoRoot = path.resolve(process.cwd(), "../..");
    let observedRepoPathHint: string | undefined;
    let executionRunMetadata: Record<string, unknown> | undefined;

    const result = await runCli(
      ["plan", "--task", "use connected current repo project", "--persist"],
      {
        cwd: path.join(repoRoot, "packages", "cli"),
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        createDatabaseRuntime: async (input: DatabaseRuntimeInput) => {
          observedRepoPathHint = input.repoPathHint;
          const dependencies = createNoStoreCompilerDependencies(input);
          const harnessRunRepository = {
            ...dependencies.harnessRunRepository,
            ...fixtureDecisionPacketIssuer,
            async createExecutionRun(runInput: CreateExecutionRunInput) {
              executionRunMetadata = runInput.metadata ?? {};

              return {
                id: "execution-run-1",
                harnessPlanId: runInput.harnessPlanId,
                adapter: runInput.adapter,
                status: runInput.status ?? "planned",
                lifecycleRevision: 1,
                metadata: runInput.metadata ?? {},
                createdAt: now,
                updatedAt: now
              };
            },
            async getHarnessRunByExecutionRunId() {
              return undefined;
            },
            async createEvidenceBundle(_input: CreateEvidenceBundleInput): Promise<never> {
              return shouldNotBeCalled("createEvidenceBundle");
            },
            async createReviewAssessment(_input: CreateReviewAssessmentInput): Promise<never> {
              return shouldNotBeCalled("createReviewAssessment");
            },
            async createFeedbackDelta(_input: CreateFeedbackDeltaInput): Promise<never> {
              return shouldNotBeCalled("createFeedbackDelta");
            }
          };
          const sourceRepository = {
            ...dependencies.sourceRepository,
            async createSourceArtifact() {
              return shouldNotBeCalled("createSourceArtifact");
            },
            async createSourceClaim() {
              return shouldNotBeCalled("createSourceClaim");
            },
            async getSourceClaimById() {
              return shouldNotBeCalled("getSourceClaimById");
            },
            async createSourceClaimEdge() {
              return shouldNotBeCalled("createSourceClaimEdge");
            },
            async createSourceDecisionEdge() {
              return shouldNotBeCalled("createSourceDecisionEdge");
            },
            async getSourceDecisionEdgeById() {
              return shouldNotBeCalled("getSourceDecisionEdgeById");
            },
            async createSourceRejection() {
              return shouldNotBeCalled("createSourceRejection");
            }
          };
          return {
            workspaceId: "workspace-connected",
            projectId: "project-connected",
            projectResolution: {
              kind: "connected_repo_path",
              reason: "Resolved from repo_installations.local_path_hint matching the current repo root.",
              doesNotProve:
                "Connected repo path resolution does not prove owner files are complete, current, or sufficient.",
              repoPathHint: repoRoot
            },
            projectKernel: {
              id: "project-kernel-connected",
              projectId: "project-connected",
              version: 1,
              summary: "Connected current repo kernel",
              activeContextRule: "Use connected current repo read model.",
              metadata: {},
              createdAt: now,
              updatedAt: now
            },
            repoInstallations: [
              {
                id: "repo-installation-connected",
                projectId: "project-connected",
                provider: "local",
                repoUrl: `file://${repoRoot}`,
                defaultBranch: "main",
                repoFingerprint: "sha256:connected",
                localPathHint: repoRoot,
                metadata: {
                  ownerFiles: [
                    {
                      path: "packages/cli/src/run-plan-command.ts",
                      root: "packages/cli/src",
                      kind: "cli_plan_rendering",
                      reason: "plan output owner"
                    },
                    {
                      path: "packages/cli/src/runPlanCommand.ts",
                      root: "packages/cli/src",
                      kind: "cli_plan_rendering",
                      reason: "stale plan output owner"
                    }
                  ]
                },
                createdAt: now,
                updatedAt: now
              }
            ],
            compilerDependencies: {
              ...dependencies,
              harnessRunRepository
            },
            harnessRunRepository,
            sourceRepository,
            memoryRepository: unusedMemoryRepository,
            async close() {
              return undefined;
            }
          };
        }
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(observedRepoPathHint).toBe(repoRoot);
    expect(result.stdout).toContain("Project ID: project-connected");
    expect(result.stdout).toContain("Project resolution: connected_repo_path (connected repo path)");
    expect(result.stdout).toContain(
      "Project resolution reason: Resolved from repo_installations.local_path_hint matching the current repo root."
    );
    expect(result.stdout).toContain(`Project resolution repoPathHint: ${repoRoot}`);
    expect(result.stdout).toContain(
      "Project resolution does not prove: Connected repo path resolution does not prove owner files are complete, current, or sufficient."
    );
    expect(result.stdout).toContain("ProjectKernel: project-kernel-connected");
    expect(result.stdout).toContain("Repo installations: repo-installation-connected");
    expect(result.stdout).toContain("Target owner files: packages/cli/src/run-plan-command.ts");
    expect(result.stdout).toContain("Target owner-file recall: owner_files_partially_available");
    expect(result.stdout).toContain(
      "Target owner files unavailable: packages/cli/src/runPlanCommand.ts"
    );
    expect(executionRunMetadata).toMatchObject({
      projectResolution: {
        kind: "connected_repo_path",
        repoPathHint: repoRoot
      },
      targetReadModel: {
        ownerFileCount: 1,
        ownerFilePaths: ["packages/cli/src/run-plan-command.ts"],
        unavailableOwnerFilePaths: ["packages/cli/src/runPlanCommand.ts"],
        ownerFileRecall: {
          status: "owner_files_partially_available",
          unavailableOwnerFilePaths: ["packages/cli/src/runPlanCommand.ts"]
        }
      }
    });
  });

  it("uses explicit project identity for persisted planning", async () => {
    let observedProjectId: string | undefined;
    let executionRunMetadata: Record<string, unknown> | undefined;

    const result = await runCli(
      [
        "plan",
        "--project",
        "project-target-1",
        "--task",
        "improve test script readiness",
        "--persist"
      ],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        createDatabaseRuntime: async (input: DatabaseRuntimeInput) => {
          observedProjectId = input.projectId;
          const dependencies = createNoStoreCompilerDependencies(input);
          const harnessRunRepository = {
            ...dependencies.harnessRunRepository,
            ...fixtureDecisionPacketIssuer,
            async createExecutionRun(runInput: CreateExecutionRunInput) {
              executionRunMetadata = runInput.metadata ?? {};

              return {
                id: "execution-run-1",
                harnessPlanId: runInput.harnessPlanId,
                adapter: runInput.adapter,
                status: runInput.status ?? "planned",
                lifecycleRevision: 1,
                metadata: runInput.metadata ?? {},
                createdAt: now,
                updatedAt: now
              };
            },
            async getHarnessRunByExecutionRunId() {
              return undefined;
            },
            async createEvidenceBundle(_input: CreateEvidenceBundleInput): Promise<never> {
              return shouldNotBeCalled("createEvidenceBundle");
            },
            async createReviewAssessment(_input: CreateReviewAssessmentInput): Promise<never> {
              return shouldNotBeCalled("createReviewAssessment");
            },
            async createFeedbackDelta(_input: CreateFeedbackDeltaInput): Promise<never> {
              return shouldNotBeCalled("createFeedbackDelta");
            }
          };
          const sourceRepository = {
            ...dependencies.sourceRepository,
            async createSourceArtifact() {
              return shouldNotBeCalled("createSourceArtifact");
            },
            async createSourceClaim() {
              return shouldNotBeCalled("createSourceClaim");
            },
            async getSourceClaimById() {
              return shouldNotBeCalled("getSourceClaimById");
            },
            async createSourceClaimEdge() {
              return shouldNotBeCalled("createSourceClaimEdge");
            },
            async createSourceDecisionEdge() {
              return shouldNotBeCalled("createSourceDecisionEdge");
            },
            async getSourceDecisionEdgeById() {
              return shouldNotBeCalled("getSourceDecisionEdgeById");
            },
            async createSourceRejection() {
              return shouldNotBeCalled("createSourceRejection");
            }
          };
          return {
            workspaceId: "workspace-target-1",
            projectId: "project-target-1",
            projectKernel: {
              id: "project-kernel-1",
              projectId: "project-target-1",
              version: 1,
              summary: "Target repo kernel",
              activeContextRule: "Use target repo context only.",
              metadata: {
                sourceSeeds: [
                  {
                    path: "evals",
                    kind: "eval_workspace",
                    reason: "seed eval, acceptance report, and test owner-file recall"
                  }
                ]
              },
              createdAt: now,
              updatedAt: now
            },
            repoInstallations: [
              {
                id: "repo-installation-1",
                projectId: "project-target-1",
                provider: "local",
                repoUrl: "file:///tmp/target-repo",
                defaultBranch: "main",
                repoFingerprint: "sha256:fixture",
                localPathHint: "/tmp/target-repo",
                metadata: {
                  sourceSeeds: [
                    {
                      path: "scripts",
                      kind: "script_root",
                      reason: "seed operator script and automation owner-file recall"
                    }
                  ]
                },
                createdAt: now,
                updatedAt: now
              }
            ],
            compilerDependencies: {
              ...dependencies,
              harnessRunRepository
            },
            harnessRunRepository,
            sourceRepository,
            memoryRepository: unusedMemoryRepository,
            async close() {
              return undefined;
            }
          };
        }
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(observedProjectId).toBe("project-target-1");
    expect(result.stdout).toContain("Project ID: project-target-1");
    expect(result.stdout).toContain("ProjectKernel: project-kernel-1");
    expect(result.stdout).toContain("Repo installations: repo-installation-1");
    expect(result.stdout).toContain("Target read model: sourceSeeds=2, ownerFiles=0, trustExclusions=7");
    expect(result.stdout).toContain("Target owner-file recall: missing_owner_file_read_model");
    expect(result.stdout).toContain("Target owner-file reason: target_read_model_has_no_owner_files");
    expect(result.stdout).toContain(
      "Target owner-file explanation: Target read model has source seeds but no exact owner-file entries, so KRN can only surface root-level target context."
    );
    expect(result.stdout).toContain(
      "Target owner-file does not prove: Missing owner-file entries do not prove owner files do not exist; it proves only that the current read model cannot name them."
    );
    expect(result.stdout).toContain("Target owner files: unavailable; using root-level source seeds only");
    expect(result.stdout).toContain("executionRun: execution-run-1");
    expect(executionRunMetadata).toMatchObject({
      targetReadModel: {
        sourceSeedCount: 2,
        ownerFileCount: 0,
        trustExclusionCount: 7,
        ownerFileRecall: {
          status: "missing_owner_file_read_model",
          reason: "target_read_model_has_no_owner_files",
          sourceSeedPaths: ["evals", "scripts"],
          ownerFilePaths: []
        }
      }
    });
  });

  it("loads explicit target owner files from project metadata for persisted planning", async () => {
    let executionRunMetadata: Record<string, unknown> | undefined;

    const result = await runCli(
      [
        "plan",
        "--project",
        "project-target-1",
        "--task",
        "improve readiness test owner path",
        "--persist"
      ],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        createDatabaseRuntime: async (input: DatabaseRuntimeInput) => {
          const dependencies = createNoStoreCompilerDependencies(input);
          const harnessRunRepository = {
            ...dependencies.harnessRunRepository,
            ...fixtureDecisionPacketIssuer,
            async createExecutionRun(runInput: CreateExecutionRunInput) {
              executionRunMetadata = runInput.metadata ?? {};

              return {
                id: "execution-run-1",
                harnessPlanId: runInput.harnessPlanId,
                adapter: runInput.adapter,
                status: runInput.status ?? "planned",
                lifecycleRevision: 1,
                metadata: runInput.metadata ?? {},
                createdAt: now,
                updatedAt: now
              };
            },
            async getHarnessRunByExecutionRunId() {
              return undefined;
            },
            async createEvidenceBundle(_input: CreateEvidenceBundleInput): Promise<never> {
              return shouldNotBeCalled("createEvidenceBundle");
            },
            async createReviewAssessment(_input: CreateReviewAssessmentInput): Promise<never> {
              return shouldNotBeCalled("createReviewAssessment");
            },
            async createFeedbackDelta(_input: CreateFeedbackDeltaInput): Promise<never> {
              return shouldNotBeCalled("createFeedbackDelta");
            }
          };
          const sourceRepository = {
            ...dependencies.sourceRepository,
            async createSourceArtifact() {
              return shouldNotBeCalled("createSourceArtifact");
            },
            async createSourceClaim() {
              return shouldNotBeCalled("createSourceClaim");
            },
            async getSourceClaimById() {
              return shouldNotBeCalled("getSourceClaimById");
            },
            async createSourceClaimEdge() {
              return shouldNotBeCalled("createSourceClaimEdge");
            },
            async createSourceDecisionEdge() {
              return shouldNotBeCalled("createSourceDecisionEdge");
            },
            async getSourceDecisionEdgeById() {
              return shouldNotBeCalled("getSourceDecisionEdgeById");
            },
            async createSourceRejection() {
              return shouldNotBeCalled("createSourceRejection");
            }
          };
          return {
            workspaceId: "workspace-target-1",
            projectId: "project-target-1",
            projectKernel: {
              id: "project-kernel-1",
              projectId: "project-target-1",
              version: 1,
              summary: "Target repo kernel",
              activeContextRule: "Use target repo context only.",
              metadata: {
                sourceSeeds: [
                  {
                    path: "tests",
                    kind: "test_root",
                    reason: "seed target repo verification surface"
                  }
                ],
                ownerFiles: [
                  {
                    path: "tests/readiness.test.ts",
                    root: "tests",
                    kind: "behavior_test",
                    reason: "readiness behavior proof"
                  }
                ]
              },
              createdAt: now,
              updatedAt: now
            },
            repoInstallations: [],
            compilerDependencies: {
              ...dependencies,
              harnessRunRepository
            },
            harnessRunRepository,
            sourceRepository,
            memoryRepository: unusedMemoryRepository,
            async close() {
              return undefined;
            }
          };
        }
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Target read model: sourceSeeds=1, ownerFiles=1, trustExclusions=7");
    expect(result.stdout).toContain("Target owner-file recall: owner_files_available");
    expect(result.stdout).toContain("Target owner files: tests/readiness.test.ts");
    expect(executionRunMetadata).toMatchObject({
      targetReadModel: {
        sourceSeedCount: 1,
        ownerFileCount: 1,
        ownerFilePaths: ["tests/readiness.test.ts"],
        ownerFileRecall: {
          status: "owner_files_available",
          ownerFilePaths: ["tests/readiness.test.ts"]
        }
      }
    });
  });

  it("does not fallback to the default project when an explicit project is missing", async () => {
    const result = await runCli(
      [
        "plan",
        "--project",
        "missing-project",
        "--task",
        "improve test script readiness",
        "--persist"
      ],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        createDatabaseRuntime: async (input: DatabaseRuntimeInput) => {
          if (input.projectId === "missing-project") {
            throw new Error("Project not found for --project missing-project");
          }

          throw new Error("unexpected fallback to default project");
        }
      }
    );

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("Project not found for --project missing-project");
    expect(result.stderr).not.toContain("unexpected fallback");
  });

  it("prints bounded activation inclusions and explicit exclusions for plan --persist", async () => {
    const activeMemory: MemoryRecord = {
      id: "11111111-1111-4111-8111-111111111111",
      projectId: "project-1",
      key: "activation-output",
      kind: "constraint",
      status: "active",
      summary: "Activation output should be explicit",
      body: "Persisted plan output should show selected context and rejected context.",
      owner: "kernel",
      confidence: 95,
      applicationGuidance: "Use when formatting persisted activation summaries.",
      sourceLineage: [{ sourceId: "22222222-2222-4222-8222-222222222222" }],
      isUserPreference: false,
      positiveFeedbackCount: 0,
      negativeFeedbackCount: 0,
      metadata: {},
      validFrom: now,
      createdAt: now,
      updatedAt: now
    };
    const rejectedClaim: SourceClaim = {
      id: "33333333-3333-4333-8333-333333333333",
      sourceArtifactId: "44444444-4444-4444-8444-444444444444",
      claim: "Persisted plan output should hide activation exclusions.",
      mechanism: "",
      krnImplication: "Operators would miss rejected context.",
      doesNotProve: "The claim has a mechanism.",
      sourceAuthority: "high",
      supportType: "background",
      consumer: "M25.05 CLI output",
      status: "proposed",
      metadata: {},
      createdAt: now,
      updatedAt: now
    };
    const antiMemory: AntiMemoryRecord = {
      id: "55555555-5555-4555-8555-555555555555",
      projectId: "project-1",
      key: "activation-output-anti",
      rejectedClaim: "Persisted plan output should hide activation exclusions.",
      reason: "Exclusions must be visible in M25.05 output.",
      invalidatedBySourceClaimIds: [rejectedClaim.id],
      summary: "Do not hide activation exclusions",
      body: "Persisted plan output must show explicit exclusions.",
      owner: "kernel",
      confidence: 95,
      sourceLineage: [{ sourceId: rejectedClaim.id }],
      metadata: {},
      validFrom: now,
      createdAt: now,
      updatedAt: now
    };
    const searchResult: SearchDocumentSearchResult = {
      id: "66666666-6666-4666-8666-666666666666",
      projectId: "project-1",
      subjectType: "search_document",
      subjectId: "66666666-6666-4666-8666-666666666666",
      sourceAuthority: "project-decision",
      validityStatus: "active",
      language: "english",
      title: "Activation output search result",
      body: "Persisted plan output includes activation inclusions exclusions and abstentions.",
      searchText: "persisted plan output activation inclusions exclusions abstentions",
      metadataFilters: {},
      metadata: {},
      validFrom: now,
      createdAt: now,
      updatedAt: now,
      lexicalScore: 200
    };
    const result = await runCli(
      ["plan", "--task", "persist activation output", "--persist"],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        createDatabaseRuntime: async (input: DatabaseRuntimeInput) => {
          const dependencies = createNoStoreCompilerDependencies(input);
          const harnessRunRepository = {
            ...dependencies.harnessRunRepository,
            ...fixtureDecisionPacketIssuer,
            async createExecutionRun(runInput: CreateExecutionRunInput) {
              return {
                id: "execution-run-1",
                harnessPlanId: runInput.harnessPlanId,
                adapter: runInput.adapter,
                status: runInput.status ?? "planned",
                lifecycleRevision: 1,
                metadata: runInput.metadata ?? {},
                createdAt: now,
                updatedAt: now
              };
            },
            async getHarnessRunByExecutionRunId() {
              return undefined;
            },
            async createEvidenceBundle(_input: CreateEvidenceBundleInput): Promise<never> {
              return shouldNotBeCalled("createEvidenceBundle");
            },
            async createReviewAssessment(_input: CreateReviewAssessmentInput): Promise<never> {
              return shouldNotBeCalled("createReviewAssessment");
            },
            async createFeedbackDelta(_input: CreateFeedbackDeltaInput): Promise<never> {
              return shouldNotBeCalled("createFeedbackDelta");
            }
          };
          const sourceRepository = {
            ...dependencies.sourceRepository,
            async createSourceArtifact() {
              return shouldNotBeCalled("createSourceArtifact");
            },
            async createSourceClaim() {
              return shouldNotBeCalled("createSourceClaim");
            },
            async getSourceClaimById() {
              return shouldNotBeCalled("getSourceClaimById");
            },
            async createSourceClaimEdge() {
              return shouldNotBeCalled("createSourceClaimEdge");
            },
            async createSourceDecisionEdge() {
              return shouldNotBeCalled("createSourceDecisionEdge");
            },
            async getSourceDecisionEdgeById() {
              return shouldNotBeCalled("getSourceDecisionEdgeById");
            },
            async createSourceRejection() {
              return shouldNotBeCalled("createSourceRejection");
            }
          };

          return {
            workspaceId: "workspace-1",
            projectId: "project-1",
            compilerDependencies: {
              ...dependencies,
              harnessRunRepository,
              memoryRepository: {
                async listActiveMemory(_projectId, _limit, options) {
                  expect(options?.terms).toContain("activation");
                  return [activeMemory];
                },
                async listAntiMemoryForProject() {
                  return [antiMemory];
                }
              },
              sourceRepository: {
                async listClaimsForProject() {
                  return [rejectedClaim];
                },
                async listSourceClaimEdgesForProject() {
                  return [];
                },
                async listSourceDecisionEdgesForClaim() {
                  return [];
                }
              },
              retrievalRepository: {
                ...dependencies.retrievalRepository,
                async searchLexical() {
                  return [searchResult];
                }
              }
            },
            harnessRunRepository,
            sourceRepository,
            memoryRepository: unusedMemoryRepository,
            async close() {
              return undefined;
            }
          };
        }
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Context status: assembled");
    expect(result.stdout).toContain("Context inclusions:");
    expect(result.stdout).toContain("search_document:66666666-6666-4666-8666-666666666666");
    expect(result.stdout).toContain("memory_record:11111111-1111-4111-8111-111111111111");
    expect(result.stdout).toContain("Context exclusions:");
    expect(result.stdout).toContain("source_claim:33333333-3333-4333-8333-333333333333");
    expect(result.stdout).toContain("anti-memory");
  });

  it("selects reviewed Memory Core write-authority memory for the self-hosting plan", async () => {
    const writeAuthorityMemory: MemoryRecord = {
      id: "11111111-1111-4111-8111-111111111111",
      projectId: "project-1",
      key: "memory-core-write-authority",
      kind: "constraint",
      status: "active",
      summary: "MemoryReviewGate seals Memory Core write authority",
      body:
        "Public Memory Core promotion must go through MemoryReviewGate and promoteReviewedMemoryCandidate; raw MemoryRecord writes remain adapter internals.",
      owner: "kernel",
      confidence: 95,
      applicationGuidance:
        "Use when sealing Memory Core write authority or reviewing public MemoryRecord promotion paths.",
      sourceLineage: [{ sourceId: "KRN_ROADMAP.md#P2-00" }],
      isUserPreference: false,
      positiveFeedbackCount: 0,
      negativeFeedbackCount: 0,
      metadata: {},
      validFrom: now,
      createdAt: now,
      updatedAt: now
    };
    const adjacentSourceGraphMemory: MemoryRecord = {
      id: "22222222-2222-4222-8222-222222222222",
      projectId: "project-1",
      key: "source-graph-postgres",
      kind: "constraint",
      status: "active",
      summary: "Source graph decisions should remain Postgres-backed",
      body: "Use relational source graph edges before adding a separate graph database.",
      owner: "kernel",
      confidence: 95,
      applicationGuidance: "Use when deciding whether source graph work needs a graph database.",
      sourceLineage: [{ sourceId: "KRN_ROADMAP.md#P2-01" }],
      isUserPreference: false,
      positiveFeedbackCount: 0,
      negativeFeedbackCount: 0,
      metadata: {},
      validFrom: now,
      createdAt: now,
      updatedAt: now
    };
    const result = await runCli(
      ["plan", "--task", "seal Memory Core write authority", "--persist"],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        createDatabaseRuntime: async (input: DatabaseRuntimeInput) => {
          const dependencies = createNoStoreCompilerDependencies(input);
          const harnessRunRepository = {
            ...dependencies.harnessRunRepository,
            ...fixtureDecisionPacketIssuer,
            async createExecutionRun(runInput: CreateExecutionRunInput) {
              return {
                id: "execution-run-1",
                harnessPlanId: runInput.harnessPlanId,
                adapter: runInput.adapter,
                status: runInput.status ?? "planned",
                lifecycleRevision: 1,
                metadata: runInput.metadata ?? {},
                createdAt: now,
                updatedAt: now
              };
            },
            async getHarnessRunByExecutionRunId() {
              return undefined;
            },
            async createEvidenceBundle(_input: CreateEvidenceBundleInput): Promise<never> {
              return shouldNotBeCalled("createEvidenceBundle");
            },
            async createReviewAssessment(_input: CreateReviewAssessmentInput): Promise<never> {
              return shouldNotBeCalled("createReviewAssessment");
            },
            async createFeedbackDelta(_input: CreateFeedbackDeltaInput): Promise<never> {
              return shouldNotBeCalled("createFeedbackDelta");
            }
          };
          const sourceRepository = {
            ...dependencies.sourceRepository,
            async createSourceArtifact() {
              return shouldNotBeCalled("createSourceArtifact");
            },
            async createSourceClaim() {
              return shouldNotBeCalled("createSourceClaim");
            },
            async getSourceClaimById() {
              return shouldNotBeCalled("getSourceClaimById");
            },
            async createSourceClaimEdge() {
              return shouldNotBeCalled("createSourceClaimEdge");
            },
            async createSourceDecisionEdge() {
              return shouldNotBeCalled("createSourceDecisionEdge");
            },
            async getSourceDecisionEdgeById() {
              return shouldNotBeCalled("getSourceDecisionEdgeById");
            },
            async createSourceRejection() {
              return shouldNotBeCalled("createSourceRejection");
            }
          };

          return {
            workspaceId: "workspace-1",
            projectId: "project-1",
            compilerDependencies: {
              ...dependencies,
              harnessRunRepository,
              memoryRepository: {
                async listActiveMemory() {
                  return [adjacentSourceGraphMemory, writeAuthorityMemory];
                },
                async listAntiMemoryForProject() {
                  return [];
                }
              },
              sourceRepository: {
                async listClaimsForProject() {
                  return [];
                },
                async listSourceClaimEdgesForProject() {
                  return [];
                },
                async listSourceDecisionEdgesForClaim() {
                  return [];
                }
              },
              retrievalRepository: {
                ...dependencies.retrievalRepository,
                async searchLexical() {
                  return [];
                }
              }
            },
            harnessRunRepository,
            sourceRepository,
            memoryRepository: unusedMemoryRepository,
            async close() {
              return undefined;
            }
          };
        }
      }
    );

    const writeAuthorityIndex = result.stdout.indexOf(
      "memory_record:11111111-1111-4111-8111-111111111111"
    );
    const adjacentIndex = result.stdout.indexOf(
      "memory_record:22222222-2222-4222-8222-222222222222"
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(writeAuthorityIndex).toBeGreaterThanOrEqual(0);
    expect(adjacentIndex).toBeGreaterThan(writeAuthorityIndex);
    expect(result.stdout).toContain(
      "expected_use=Use when sealing Memory Core write authority or reviewing public MemoryRecord promotion paths."
    );
  });

  it("returns exit 2 for invalid plan args", async () => {
    const result = await runCli(["plan"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(2);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("Usage: krn plan [--project <project-id>] --task");
  });
});
