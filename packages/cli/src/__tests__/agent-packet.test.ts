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
    }],
    exclusions: [],
    metadata: {},
    createdAt: now
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
  feedbackDeltas: [],
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
      decisionPacket: {
        kind: "krn.decisionPacket.readModel.v1",
        run: {
          id: "run-agent-1"
        },
        task: {
          objective: "Return a DecisionPacket to a headless agent."
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
