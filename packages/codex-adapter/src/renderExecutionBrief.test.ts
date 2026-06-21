import { describe, expect, it } from "vitest";
import type {
  CapabilityPlan,
  ContextAssembly,
  HarnessPlan,
  TaskContract
} from "@krn/core";
import type {
  EvidenceContract
} from "@krn/harness";

import {
  renderExecutionBrief
} from "./renderExecutionBrief.js";

const createdAt = "2026-06-21T12:00:00.000Z";

const taskContract: TaskContract = {
  id: "task-1",
  operatorIntentId: "intent-1",
  projectId: "project-1",
  title: "Improve KRN doctor brain store readiness",
  objective: "Make doctor report Postgres memory and source graph readiness",
  constraints: ["no runtime markdown memory"],
  nonGoals: ["do not add dashboard", "do not spawn agents"],
  acceptance: ["typecheck and tests pass"],
  status: "active",
  metadata: {},
  createdAt,
  updatedAt: createdAt
};

const harnessPlan: HarnessPlan = {
  id: "plan-1",
  taskContractId: "task-1",
  version: 1,
  status: "ready",
  summary: "Doctor brain-store readiness plan",
  nextAction: "Render Codex adapter brief.",
  metadata: {},
  createdAt,
  updatedAt: createdAt
};

const contextAssembly: ContextAssembly = {
  id: "context-1",
  harnessPlanId: "plan-1",
  status: "assembled",
  tokenBudget: 200,
  inclusions: [
    {
      subjectType: "memory_record",
      subjectId: "memory-1",
      reason: "Memory: Brain store is Postgres",
      expectedUse: "Use when planning doctor persistence checks.",
      tokenEstimate: 42,
      trustTier: "high"
    }
  ],
  exclusions: [
    {
      subjectType: "source_claim",
      subjectId: "claim-weak",
      reason: "low_trust",
      explanation: "Candidate trust tier low is below medium.",
      score: 10,
      trustTier: "low"
    }
  ],
  metadata: {},
  createdAt
};

const capabilityPlan: CapabilityPlan = {
  id: "capability-1",
  harnessPlanId: "plan-1",
  requirements: [
    {
      kind: "type_safety",
      reason: "Preserve strict TypeScript boundaries.",
      requiredEvidence: ["pnpm typecheck"]
    },
    {
      kind: "evidence_capture",
      reason: "Keep execution reviewable.",
      requiredEvidence: ["git diff --check"]
    }
  ],
  toolBoundaries: ["Do not invoke Codex from the renderer."],
  policyGateIds: [],
  metadata: {},
  createdAt
};

const evidenceContract: EvidenceContract = {
  commands: [
    {
      command: "pnpm typecheck",
      required: true
    },
    {
      command: "pnpm test",
      required: true
    },
    {
      command: "git diff --check",
      required: true
    }
  ],
  diffRisk: "medium",
  reviewBurden: "Summarize changed files and residual risk.",
  rollbackPath: "Use a focused revert of the implementation commit.",
  metadata: {}
};

describe("renderExecutionBrief", () => {
  it("renders a bounded Codex execution brief with exclusions and evidence", () => {
    const brief = renderExecutionBrief({
      taskContract,
      harnessPlan,
      contextAssembly,
      capabilityPlan,
      evidenceContract,
      nextAction: "Implement the smallest missing doctor check.",
      goalReference: "Goal: final harness spine",
      execPlanReference: "PLAN.md Milestone 14"
    });

    expect(brief).toContain("Objective: Make doctor report Postgres memory and source graph readiness");
    expect(brief).toContain("Non-goals:");
    expect(brief).toContain("- do not add dashboard");
    expect(brief).toContain("Context Inclusions:");
    expect(brief).toContain("memory_record:memory-1");
    expect(brief).toContain("Context Exclusions:");
    expect(brief).toContain("source_claim:claim-weak");
    expect(brief).toContain("Capability Plan:");
    expect(brief).toContain("type_safety");
    expect(brief).toContain("Evidence Contract:");
    expect(brief).toContain("pnpm typecheck");
    expect(brief).toContain("Diff risk: medium");
    expect(brief).toContain("Next Action: Implement the smallest missing doctor check.");
    expect(brief).toContain("Goal: final harness spine");
    expect(brief).toContain("PLAN.md Milestone 14");
  });
});
