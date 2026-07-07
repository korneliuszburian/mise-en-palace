import { describe, expect, it } from "vitest";
import type {
  HarnessRunAggregate
} from "@krn/harness/repositories";

import {
  runCli
} from "../run-cli.js";

const now = "2026-07-07T16:35:00.000Z";

const aggregate: HarnessRunAggregate = {
  operatorIntent: {
    id: "intent-agent-1",
    workspaceId: "workspace-1",
    projectId: "project-1",
    source: "cli",
    rawIntent: "agent packet",
    metadata: {},
    createdAt: now
  },
  taskContract: {
    id: "task-agent-1",
    operatorIntentId: "intent-agent-1",
    projectId: "project-1",
    title: "Headless agent packet",
    objective: "Return a DecisionPacket to a headless agent.",
    constraints: ["read-only"],
    nonGoals: ["do not execute Codex"],
    acceptance: ["agent receives evidence return channels"],
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
    summary: "Headless agent packet plan",
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
      trustTier: "project-decision"
    }, {
      subjectType: "memory_record",
      subjectId: "memory-agent-1",
      reason: "Agent needs retained implementation guidance.",
      expectedUse: "Use while editing.",
      trustTier: "medium"
    }],
    exclusions: [{
      subjectType: "memory_record",
      subjectId: "memory-rejected-1",
      reason: "anti_memory",
      explanation: "Rejected path should be visible to the agent packet.",
      trustTier: "medium"
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
      trustTier: "project-decision",
      lexicalScore: 12,
      vectorScore: 0,
      graphScore: 9,
      temporalScore: 0,
      contextRoiScore: 80,
      totalScore: 101,
      score: 101,
      reason: "Source claim was boosted by graph edge influence.",
      metadata: {
        sourceClaimEdgeInfluence: {
          edgeIds: ["source-claim-edge-agent-1"],
          edgeKinds: ["narrows"],
          seedSourceClaimIds: ["claim-seed-agent-1"],
          doesNotProve:
            "SourceClaimEdge influence does not prove SourceDecisionEdge support."
        },
        sourceDecisionSupportBoost: {
          sourceDecisionEdgeIds: ["source-decision-edge-agent-1"],
          confidence: ["high"],
          supportTypes: ["decision"],
          doesNotProve:
            "SourceDecisionEdge boost does not prove source truth or target correctness."
        }
      },
      createdAt: now
    }],
    decisions: []
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
  evidenceBundles: [],
  reviewAssessments: [],
  feedbackDeltas: [{
    id: "feedback-agent-1",
    reviewAssessmentId: "review-agent-1",
    status: "accepted",
    memoryCandidates: [],
    sourceDecisions: [],
    evalCandidates: [],
    metadata: {
      sourceUsefulnessOutcomes: [{
        sourceDecisionId: "source-decision-stale-agent-1",
        outcome: "stale",
        reason: "Prior source decision is stale for this packet.",
        evidenceRefs: ["test:agent-packet-stale-decision"],
        doesNotProve:
          "Stale decision feedback does not prove the replacement decision is correct."
      }, {
        sourceDecisionId: "source-decision-helped-agent-1",
        outcome: "helped",
        reason: "Useful decision should not be reported as stale.",
        evidenceRefs: ["test:agent-packet-helped-decision"],
        doesNotProve:
          "Helpful feedback does not prove source truth."
      }, {
        sourceDecisionId: "source-decision-noise-agent-1",
        outcome: "noise",
        reason: "Noisy decision should be visible without governing the packet.",
        evidenceRefs: ["test:agent-packet-noise-decision"],
        doesNotProve:
          "Noise feedback does not prove future source usefulness."
      }]
    },
    createdAt: now,
    updatedAt: now
  }],
  runEvents: []
};

describe("agent packet CLI", () => {
  it("returns a read-only DecisionPacket and evidence return channels for headless agents", async () => {
    let closed = false;
    const result = await runCli(["agent", "packet", "--run-id", "run-agent-1", "--json"], {
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      createDatabaseRuntime: async () => ({
        harnessRunRepository: {
          async getHarnessRunByExecutionRunId(runId: string) {
            return runId === "run-agent-1" ? aggregate : undefined;
          }
        },
        async close() {
          closed = true;
        }
      })
    });
    const json: unknown = JSON.parse(result.stdout);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(json).toMatchObject({
      kind: "krn.agentPacket.v1",
      access: "read_only",
      mutation: "none",
      surface: "headless_cli",
      request: {
        runId: "run-agent-1"
      },
      packet: {
        formatVersion: "krn.decisionPacket.v1",
        governingDecisionIds: ["source-decision-helped-agent-1"],
        sourceClaimIds: ["claim-agent-1"],
        sourceDecisionEdgeIds: ["source-decision-edge-agent-1"],
        memoryRefs: ["memory-agent-1"],
        staleDecisionIds: ["source-decision-stale-agent-1"],
        rejectedPathIds: ["memory-rejected-1"],
        noiseDecisionIds: ["source-decision-noise-agent-1"],
        brief: {
          includedContextCount: 2,
          explicitExclusionCount: 1,
          sourceClaimUseCount: 1,
          memoryRecordUseCount: 1
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
                sourceDecisionEdgeIds: ["source-decision-edge-agent-1"]
              }
            }]
          }
        }
      },
      returnChannels: {
        evidence: {
          persistedCommand: "krn evidence capture --run-id run-agent-1 --verification \"<command>=passed\" --persist"
        },
        feedback: {
          memoryRecordApplyExample:
            "krn memory record apply --run-id run-agent-1 --memory-id <memory-id> --outcome helped --notes \"<why>\" --persist",
          sourceUsefulnessExample:
            "krn evidence capture --run-id run-agent-1 --source-usefulness \"claim:<id>=helped|<reason>|<evidence-ref>|<does-not-prove>\" --persist",
          sourceDecisionUsefulnessExample:
            "krn evidence capture --run-id run-agent-1 --source-usefulness \"decision:<id>=helped|<reason>|<evidence-ref>|<does-not-prove>\" --persist"
        }
      },
      proof: {
        proves: expect.arrayContaining([
          "a headless agent can request a read-only DecisionPacket contract through CLI JSON"
        ]),
        doesNotProve: expect.arrayContaining(["MCP integration"])
      }
    });
    expect(closed).toBe(true);
  });

  it("explains how to unblock agent packet without database config", async () => {
    const result = await runCli(["agent", "packet", "--run-id", "run-agent-1"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("KRN_DATABASE_URL is required for krn agent packet");
    expect(result.stderr).toContain("run pnpm db:ready before readback");
  });
});
