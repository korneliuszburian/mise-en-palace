import { describe, expect, it } from "vitest";
import type {
  HarnessRunAggregate
} from "@krn/core/repositories";

import type {
  DatabaseRuntime
} from "../database-runtime.js";
import {
  createNoStoreCompilerDependencies
} from "../no-store-repositories.js";
import {
  runCli
} from "../run-cli.js";

const now = "2026-07-07T16:35:00.000Z";

interface DecisionPacketJson {
  readonly packetIdentity: {
    readonly checksum: string;
    readonly evidenceRef: string;
  };
  readonly packet: {
    readonly taskStandardDecisions: readonly {
      readonly decision: string;
      readonly rejectedPath?: string;
    }[];
    readonly sourceClaimIds: readonly string[];
    readonly caveatedSourceClaimIds: readonly string[];
    readonly verificationCommands: readonly string[];
    readonly abstentionScore: {
      readonly status: string;
      readonly score: number;
      readonly reasons: readonly string[];
    };
  };
  readonly returnChannels: {
    readonly evidence: {
      readonly persistedCommand: string;
    };
    readonly feedback: {
      readonly sourceUsefulnessExample: string;
      readonly sourceDecisionUsefulnessExample: string;
      readonly knowledgeUsefulnessExample: string;
    };
  };
}

const isDecisionPacketJson = (value: unknown): value is DecisionPacketJson =>
  typeof value === "object" &&
  value !== null &&
  "packetIdentity" in value &&
  "returnChannels" in value;

const notUsed = (method: string): never => {
  throw new Error(`${method} should not be called`);
};

const aggregate: HarnessRunAggregate = {
  operatorIntent: {
    id: "intent-agent-1",
    workspaceId: "workspace-1",
    projectId: "project-1",
    source: "cli",
    rawIntent: "decision packet",
    status: "received",
    metadata: {},
    createdAt: now
  },
  taskContract: {
    id: "task-agent-1",
    operatorIntentId: "intent-agent-1",
    projectId: "project-1",
    title: "Headless decision packet",
    objective: "Return a DecisionPacket to a headless agent.",
    constraints: ["read-only"],
    nonGoals: ["do not execute Codex"],
    acceptance: ["consumer receives evidence return channels"],
    status: "active",
    metadata: {},
    createdAt: now,
    updatedAt: now
  },
  harnessPlan: {
    id: "plan-agent-1",
    taskContractId: "task-agent-1",
    version: 1,
    status: "ready",
    summary: "Headless decision packet plan",
    metadata: {},
    createdAt: now,
    updatedAt: now
  },
  contextAssembly: {
    id: "context-agent-1",
    harnessPlanId: "plan-agent-1",
    status: "assembled",
    tokenBudget: 256,
    inclusions: [{
      subjectType: "source_claim",
      subjectId: "claim-agent-1",
      reason: "Agent needs governing source.",
      expectedUse: "Use before coding.",
      sourceAuthority: "project-decision"
    }, {
      subjectType: "source_claim",
      subjectId: "claim-agent-caveated",
      reason: "Agent may inspect accepted source evidence that lacks decision support.",
      expectedUse: "Use only as caveated evidence.",
      sourceAuthority: "medium"
    }, {
      subjectType: "memory_record",
      subjectId: "memory-agent-1",
      reason: "Agent needs retained implementation guidance.",
      expectedUse: "Use while editing.",
      sourceAuthority: "medium"
    }],
    exclusions: [{
      subjectType: "memory_record",
      subjectId: "memory-rejected-1",
      reason: "unsafe",
      explanation: "Rejected path should be visible to the decision packet.",
      sourceAuthority: "medium"
    }, {
      subjectType: "source_claim",
      subjectId: "claim-agent-superseded",
      reason: "superseded",
      explanation: "Superseded source claim should be visible as a rejected packet path.",
      sourceAuthority: "project-decision"
    }],
    metadata: {},
    createdAt: now
  },
  activationTrace: {
    retrievalRunId: "retrieval-agent-1",
    candidates: [{
      id: "retrieval-candidate-agent-1",
      retrievalRunId: "retrieval-agent-1",
      kind: "source",
      status: "included",
      subjectType: "source_claim",
      subjectId: "claim-agent-1",
      sourceAuthority: "project-decision",
      lexicalScore: 12,
      vectorScore: 0,
      graphScore: 9,
      temporalScore: 0,
      contextRoiScore: 80,
      totalScore: 101,
      score: 101,
      reason: "Source claim was boosted by graph edge influence.",
      metadata: {
        projectStandardDecision: {
          kind: "krn.projectStandardDecision.v1",
          memoryRecordId: "memory-agent-1",
          key: "frontend-bootstrap-standard",
          sourceRefs: ["claim-agent-1"],
          mechanism: "Headless decision packet fixture carries the retained frontend standard as governed context.",
          krnImplication: "DecisionPacket should expose the standard statement before coding.",
          decision: "Use the refreshed frontend bootstrap standard for matching new frontend projects.",
          rejectedPath: "Do not use the superseded old frontend bootstrap standard for new projects.",
          consumer: "krn decision packet",
          falsifier: "DecisionPacket omits the governed standard statement.",
          validFrom: "2026-06-01T00:00:00.000Z",
          doesNotProve: "This fixture does not prove arbitrary frontend template quality."
        },
        sourceClaimEdgeInfluence: {
          edgeIds: ["source-claim-edge-agent-1"],
          edgeKinds: ["narrows"],
          seedSourceClaimIds: ["claim-seed-agent-1"],
          doesNotProve:
            "SourceClaimEdge influence does not prove SourceDecisionEdge support."
        },
        sourceDecisionSupportBoost: {
          sourceDecisionEdgeIds: ["source-decision-edge-agent-1"],
          targets: [{
            sourceDecisionEdgeId: "source-decision-edge-agent-1",
            targetType: "architecture_decision",
            targetId: "frontend-bootstrap-standard"
          }],
          confidence: ["high"],
          supportTypes: ["decision"],
          doesNotProve:
            "SourceDecisionEdge boost does not prove source truth or target correctness."
        }
      },
      createdAt: now
    }],
    decisions: [{
      id: "activation-decision-agent-1",
      retrievalRunId: "retrieval-agent-1",
      contextAssemblyId: "context-agent-1",
      subjectType: "memory_record",
      subjectId: "memory-rejected-1",
      decision: "conflict",
      reason: "anti_memory_block",
      metadata: {
        antiMemoryRecordId: "anti-memory-agent-1"
      },
      createdAt: now
    }]
  },
  executionRun: {
    id: "run-agent-1",
    harnessPlanId: "plan-agent-1",
    adapter: "cli",
    status: "succeeded",
    metadata: {},
    createdAt: now,
    updatedAt: now
  },
  evidenceBundles: [{
    id: "evidence-agent-1",
    executionRunId: "run-agent-1",
    status: "captured",
    changedFiles: ["packages/frontend/src/App.tsx"],
    commands: [{
      command: "pnpm --filter frontend test",
      status: "passed",
      provenance: "operator_reported",
      doesNotProve:
        "This command result does not prove memory quality, source truth, review correctness, or production readiness."
    }],
    diffRisk: "medium",
    reviewBurden: "Review frontend bootstrap output against the current project standard.",
    rollbackPath: "Revert the frontend bootstrap slice.",
    metadata: {},
    createdAt: now,
    updatedAt: now
  }],
  reviewAssessments: [],
  feedbackDeltas: [{
    id: "feedback-agent-1",
    reviewAssessmentId: "review-agent-1",
    status: "accepted",
    memoryCandidates: [],
    sourceDecisions: [{
      id: "source-decision-rejected-agent-1",
      status: "reject",
      decision: "Do not use the rejected packet path.",
      rationale: "Rejected source decisions should be visible to headless agents.",
      falsifier: "DecisionPacket omits the rejected source decision.",
      consumer: "krn decision packet",
      metadata: {},
      createdAt: now,
      updatedAt: now
    }],
    evalCandidates: [],
    metadata: {
        sourceUsefulnessOutcomes: [{
          sourceDecisionId: "source-decision-stale-agent-1",
          outcome: "stale",
        reason: "Prior source decision is stale for this packet.",
        evidenceRefs: ["test:decision-packet-stale-decision"],
        doesNotProve:
          "Stale decision feedback does not prove the replacement decision is correct."
      }, {
        sourceDecisionId: "source-decision-helped-agent-1",
        outcome: "helped",
        reason: "Useful decision should not be reported as stale.",
        evidenceRefs: ["test:decision-packet-helped-decision"],
        doesNotProve:
          "Helpful feedback does not prove source truth."
      }, {
        sourceClaimId: "claim-agent-1",
        outcome: "stale",
        reason: "Source claim evidence needs refresh before it can stay confident guidance.",
        evidenceRefs: ["test:decision-packet-stale-source-claim"],
        doesNotProve:
          "Stale source-claim feedback does not mutate SourceClaim truth."
      }, {
        sourceDecisionId: "source-decision-noise-agent-1",
        outcome: "noise",
        reason: "Noisy decision should be visible without governing the packet.",
        evidenceRefs: ["test:decision-packet-noise-decision"],
        doesNotProve:
          "Noise feedback does not prove future source usefulness."
      }, {
        sourceDecisionId: "source-decision-conflicted-agent-1",
        outcome: "helped",
        reason: "Conflicted decision should remain visible as governing.",
        evidenceRefs: ["test:decision-packet-conflicted-helped"],
        doesNotProve:
          "Helpful feedback does not erase stale feedback."
      }, {
        sourceDecisionId: "source-decision-conflicted-agent-1",
        outcome: "stale",
        reason: "Conflicted decision should be flagged as stale authority.",
        evidenceRefs: ["test:decision-packet-conflicted-stale"],
          doesNotProve:
            "Stale feedback does not identify the replacement decision."
        }],
        knowledgeUsefulnessOutcomes: [{
          knowledgeId: "memory-agent-1",
          outcome: "stale",
          reason: "Retained frontend bootstrap memory needs refreshed evidence before reuse.",
          evidenceRefs: ["test:decision-packet-stale-knowledge"],
          doesNotProve:
            "Stale knowledge feedback does not mutate memory without review."
        }]
      },
    createdAt: now,
    updatedAt: now
  }],
  runEvents: []
};

describe("decision packet CLI", () => {
  it("returns a read-only DecisionPacket and evidence return channels for headless agents", async () => {
    let closed = false;
    const result = await runCli(["decision", "packet", "--run-id", "run-agent-1", "--json"], {
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      createDatabaseRuntime: async (runtimeInput) => {
        const dependencies = createNoStoreCompilerDependencies(runtimeInput);
        const harnessRunRepository = {
          ...dependencies.harnessRunRepository,
          async createExecutionRun() {
            return notUsed("createExecutionRun");
          },
          async getHarnessRunByExecutionRunId(runId: string) {
            return runId === "run-agent-1" ? aggregate : undefined;
          },
          async createEvidenceBundle() {
            return notUsed("createEvidenceBundle");
          },
          async createReviewAssessment() {
            return notUsed("createReviewAssessment");
          },
          async createFeedbackDelta() {
            return notUsed("createFeedbackDelta");
          }
        } satisfies DatabaseRuntime["harnessRunRepository"];
        const sourceRepository = {
          ...dependencies.sourceRepository,
          async createSourceArtifact() {
            return notUsed("createSourceArtifact");
          },
          async createSourceClaim() {
            return notUsed("createSourceClaim");
          },
          async getSourceClaimById() {
            return notUsed("getSourceClaimById");
          },
          async createSourceClaimEdge() {
            return notUsed("createSourceClaimEdge");
          },
          async createSourceDecisionEdge() {
            return notUsed("createSourceDecisionEdge");
          },
          async getSourceDecisionEdgeById() {
            return notUsed("getSourceDecisionEdgeById");
          },
          async createSourceRejection() {
            return notUsed("createSourceRejection");
          }
        } satisfies DatabaseRuntime["sourceRepository"];
        const memoryRepository = {
          async createMemoryCandidate() {
            return notUsed("createMemoryCandidate");
          },
          async getMemoryCandidateById() {
            return notUsed("getMemoryCandidateById");
          },
          async promoteReviewedMemoryCandidate() {
            return notUsed("promoteReviewedMemoryCandidate");
          },
          async rejectMemoryCandidate() {
            return notUsed("rejectMemoryCandidate");
          },
          async getMemoryRecordById() {
            return notUsed("getMemoryRecordById");
          },
          async listMemoryRecordsForProject() {
            return [];
          },
          async invalidateMemoryRecord() {
            return notUsed("invalidateMemoryRecord");
          },
          async recordMemoryApplication() {
            return notUsed("recordMemoryApplication");
          },
          async createMemoryFeedbackEvent() {
            return notUsed("createMemoryFeedbackEvent");
          },
          async createAntiMemoryCandidate() {
            return notUsed("createAntiMemoryCandidate");
          },
          async getAntiMemoryCandidateById() {
            return notUsed("getAntiMemoryCandidateById");
          },
          async promoteReviewedAntiMemoryCandidate() {
            return notUsed("promoteReviewedAntiMemoryCandidate");
          },
          async rejectAntiMemoryCandidate() {
            return notUsed("rejectAntiMemoryCandidate");
          },
          async listActiveMemory() {
            return [];
          }
        } satisfies DatabaseRuntime["memoryRepository"];

        return {
          workspaceId: "workspace-1",
          projectId: "project-1",
          compilerDependencies: {
            ...dependencies,
            harnessRunRepository
          },
          harnessRunRepository,
          sourceRepository,
          memoryRepository,
          async close() {
            closed = true;
          }
        };
      }
    });
    const json: unknown = JSON.parse(result.stdout);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(json).toMatchObject({
      kind: "krn.decisionPacketReadback.v1",
      access: "read_only",
      mutation: "none",
      surface: "headless_cli",
      request: {
        runId: "run-agent-1"
      },
      packetIdentity: {
        packetId: expect.stringMatching(/^decision-packet:run-agent-1:[a-f0-9]{16}$/u),
        checksumAlgorithm: "sha256",
        checksum: expect.stringMatching(/^[a-f0-9]{64}$/u),
        evidenceRef: expect.stringMatching(/^packet:[a-f0-9]{64}$/u),
        generatedAt: now,
        sourceRunUpdatedAt: now,
        freshness: {
          status: "current_read_model_snapshot"
        }
      },
      packet: {
        formatVersion: "krn.decisionPacket.v1",
        governingDecisionIds: [
          "frontend-bootstrap-standard",
          "source-decision-helped-agent-1",
          "source-decision-conflicted-agent-1"
        ],
        governingStatements: expect.arrayContaining([
          "Use the refreshed frontend bootstrap standard for matching new frontend projects."
        ]),
        taskStandardDecisions: [expect.objectContaining({
          decision: "Use the refreshed frontend bootstrap standard for matching new frontend projects.",
          rejectedPath: "Do not use the superseded old frontend bootstrap standard for new projects."
        })],
        sourceClaimIds: [
          "claim-agent-1",
          "claim-agent-caveated"
        ],
        caveatedSourceClaimIds: [
          "claim-agent-1",
          "claim-agent-caveated"
        ],
        sourceDecisionEdgeIds: ["source-decision-edge-agent-1"],
        sourceDecisionTargets: [{
          targetType: "architecture_decision",
          targetId: "frontend-bootstrap-standard",
          sourceDecisionEdgeIds: ["source-decision-edge-agent-1"]
        }],
        sourceRejectionIds: ["source-decision-rejected-agent-1"],
        sourceConsensus: {
          decisionLinkedSourceClaimIds: [],
          caveatedSourceClaimIds: [
            "claim-agent-1",
            "claim-agent-caveated"
          ],
          sourceDecisionEdgeIds: ["source-decision-edge-agent-1"],
          sourceDecisionTargets: [{
            targetType: "architecture_decision",
            targetId: "frontend-bootstrap-standard",
            sourceDecisionEdgeIds: ["source-decision-edge-agent-1"]
          }],
          staleDecisionIds: [
            "source-decision-stale-agent-1",
            "source-decision-conflicted-agent-1"
          ],
          supersededPathIds: ["claim-agent-superseded"],
          rejectedPathIds: [
            "anti-memory-agent-1",
            "claim-agent-superseded",
            "source-decision-rejected-agent-1"
          ],
          sourceRejectionIds: ["source-decision-rejected-agent-1"],
          conflictedDecisionIds: ["source-decision-conflicted-agent-1"],
          evidenceGapIds: [
            "evidence-gap:run-agent-1:caveated-source-authority:claim-agent-1",
            "evidence-gap:run-agent-1:caveated-source-authority:claim-agent-caveated",
            "evidence-gap:run-agent-1:caveated-memory-authority:memory-agent-1",
            "evidence-gap:run-agent-1:stale-authority:source-decision-conflicted-agent-1"
          ]
        },
        abstentionScore: {
          status: "abstain",
          score: 0,
          reasons: [
            "evidence_gap",
            "missing_decision_linked_source",
            "caveated_source_authority",
            "caveated_memory_authority",
            "stale_authority"
          ],
          evidenceGapIds: [
            "evidence-gap:run-agent-1:caveated-source-authority:claim-agent-1",
            "evidence-gap:run-agent-1:caveated-source-authority:claim-agent-caveated",
            "evidence-gap:run-agent-1:caveated-memory-authority:memory-agent-1",
            "evidence-gap:run-agent-1:stale-authority:source-decision-conflicted-agent-1"
          ]
        },
        memoryRefs: ["memory-agent-1"],
        caveatedMemoryRefs: ["memory-agent-1"],
        staleKnowledgeIds: ["memory-agent-1"],
        noiseKnowledgeIds: [],
        unknownKnowledgeIds: [],
        staleDecisionIds: [
          "source-decision-stale-agent-1",
          "source-decision-conflicted-agent-1"
        ],
        supersededPathIds: ["claim-agent-superseded"],
        rejectedPathIds: [
          "anti-memory-agent-1",
          "claim-agent-superseded",
          "source-decision-rejected-agent-1"
        ],
        noiseDecisionIds: ["source-decision-noise-agent-1"],
        severeStaleAuthorityIds: ["source-decision-conflicted-agent-1"],
        verificationCommands: ["pnpm --filter frontend test"],
        brief: {
          includedContextCount: 3,
          observationPrefixCount: 0,
          explicitExclusionCount: 2,
          sourceClaimUseCount: 2,
          memoryRecordUseCount: 1,
          includedSourceClaimIds: ["claim-agent-1", "claim-agent-caveated"],
          includedMemoryRecordIds: ["memory-agent-1"],
          excludedSourceClaimIds: ["claim-agent-superseded"],
          excludedMemoryRecordIds: ["memory-rejected-1"],
          excludedAntiMemoryRecordIds: [],
          evidenceGapIds: [
            "evidence-gap:run-agent-1:caveated-source-authority:claim-agent-1",
            "evidence-gap:run-agent-1:caveated-source-authority:claim-agent-caveated",
            "evidence-gap:run-agent-1:caveated-memory-authority:memory-agent-1",
            "evidence-gap:run-agent-1:stale-authority:source-decision-conflicted-agent-1"
          ]
        }
      },
      readModel: {
        kind: "krn.decisionPacket.readModel.v1",
        run: {
          id: "run-agent-1"
        },
        task: {
          objective: "Return a DecisionPacket to a headless agent."
        },
        context: {
          activationTrace: {
            candidates: [{
              sourceClaimEdgeInfluence: {
                edgeIds: ["source-claim-edge-agent-1"]
              },
              sourceDecisionSupportBoost: {
                sourceDecisionEdgeIds: ["source-decision-edge-agent-1"],
                targets: [{
                  sourceDecisionEdgeId: "source-decision-edge-agent-1",
                  targetType: "architecture_decision",
                  targetId: "frontend-bootstrap-standard"
                }]
              }
            }]
          }
        }
      },
      returnChannels: {
        evidence: {
          persistedCommand: expect.stringContaining(
            "krn evidence capture --run-id run-agent-1 --decision-packet-checksum "
          )
        },
        feedback: {
          memoryRecordApplyExample:
            expect.stringContaining("packet=packet:"),
          sourceUsefulnessExample: expect.stringContaining("packet:"),
          sourceDecisionUsefulnessExample: expect.stringContaining("packet:")
        }
      },
      proof: {
        proves: expect.arrayContaining([
          "a headless consumer can request a read-only DecisionPacket contract through CLI JSON"
        ]),
        doesNotProve: expect.arrayContaining(["MCP integration"])
      }
    });
    expect(isDecisionPacketJson(json)).toBe(true);
    if (!isDecisionPacketJson(json)) {
      throw new Error("decision packet JSON did not expose packet identity");
    }

    expect(json.packetIdentity.evidenceRef).toBe(`packet:${json.packetIdentity.checksum}`);
    expect(json.packet.sourceClaimIds).toContain("claim-agent-1");
    expect(json.packet.sourceClaimIds).toContain("claim-agent-caveated");
    expect(json.packet.caveatedSourceClaimIds).toEqual([
      "claim-agent-1",
      "claim-agent-caveated"
    ]);
    expect(json.packet.taskStandardDecisions[0]?.decision).toBe(
      "Use the refreshed frontend bootstrap standard for matching new frontend projects."
    );
    expect(json.packet.abstentionScore.status).toBe("abstain");
    expect(json.packet.abstentionScore.reasons).toContain("missing_decision_linked_source");
    expect(json.packet.abstentionScore.reasons).toContain("stale_authority");
    expect(json.packet.verificationCommands).toEqual(["pnpm --filter frontend test"]);
    expect(json.returnChannels.evidence.persistedCommand).toContain(json.packetIdentity.checksum);
    expect(json.returnChannels.feedback.sourceUsefulnessExample).toContain(json.packetIdentity.evidenceRef);
    expect(json.returnChannels.feedback.sourceDecisionUsefulnessExample).toContain(json.packetIdentity.evidenceRef);
    expect(json.returnChannels.feedback.knowledgeUsefulnessExample).toContain(json.packetIdentity.evidenceRef);
    expect(closed).toBe(true);
  });

  it("explains how to unblock decision packet without database config", async () => {
    const result = await runCli(["decision", "packet", "--run-id", "run-agent-1"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("KRN_DATABASE_URL is required for krn decision packet");
    expect(result.stderr).toContain("run pnpm db:ready before readback");
  });
});
