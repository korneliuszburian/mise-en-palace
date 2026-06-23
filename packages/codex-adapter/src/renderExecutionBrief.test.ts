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
  createExecutionBrief,
  renderExecutionBriefText,
  renderExecutionBrief
} from "./renderExecutionBrief.js";
import {
  createCodexSkillBindingHints
} from "./renderSkillHints.js";

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
    },
    {
      subjectType: "source_claim",
      subjectId: "claim-1",
      reason: "Source: Doctor readiness is store-backed",
      expectedUse: "Ground implementation boundaries.",
      tokenEstimate: 32,
      trustTier: "project-decision"
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
    },
    {
      subjectType: "anti_memory_record",
      subjectId: "anti-1",
      reason: "unsafe",
      explanation: "Do not treat old markdown memory as runtime truth.",
      score: 100,
      trustTier: "high"
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
      priority: "required",
      bindingKinds: ["skill", "rule"],
      reason: "Preserve strict TypeScript boundaries.",
      requiredEvidence: ["pnpm typecheck"]
    },
    {
      kind: "evidence_capture",
      priority: "required",
      bindingKinds: ["skill", "tool_boundary"],
      reason: "Keep execution reviewable.",
      requiredEvidence: ["git diff --check"]
    },
    {
      kind: "policy_gate",
      priority: "required",
      bindingKinds: ["policy_gate", "tool_boundary"],
      reason: "Weak context must abstain instead of expanding context.",
      requiredEvidence: ["context abstention"]
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
  it("creates a typed execution brief artifact before rendering text", () => {
    const brief = createExecutionBrief({
      taskContract,
      harnessPlan,
      contextAssembly,
      capabilityPlan,
      evidenceContract,
      nextAction: "Implement the smallest missing doctor check.",
      goalReference: "Goal: final harness spine",
      execPlanReference: "PLAN.md Milestone 14"
    });

    expect(brief.currentTaskContract).toEqual({
      id: "task-1",
      title: "Improve KRN doctor brain store readiness",
      objective: "Make doctor report Postgres memory and source graph readiness"
    });
    expect(brief.sourceClaimsUsed).toEqual(["claim-1"]);
    expect(brief.memoryRecordsUsed).toEqual(["memory-1"]);
    expect(brief.antiMemoryWarnings).toEqual([
      "anti_memory_record:anti-1 | unsafe | Do not treat old markdown memory as runtime truth."
    ]);
    expect(brief.stopCondition).toBe("Stop before Codex execution or hidden state mutation.");
    expect(brief.rollbackExpectation).toBe(evidenceContract.rollbackPath);
    expect(brief.doesNotProve).toContain("Codex executed the work.");
  });

  it("renders a bounded Codex execution brief with exclusions and evidence", () => {
    const brief = createExecutionBrief({
      taskContract,
      harnessPlan,
      contextAssembly,
      capabilityPlan,
      evidenceContract,
      nextAction: "Implement the smallest missing doctor check.",
      goalReference: "Goal: final harness spine",
      execPlanReference: "PLAN.md Milestone 14"
    });
    const rendered = renderExecutionBriefText(brief);

    expect(rendered).toContain(
      "Objective: Make doctor report Postgres memory and source graph readiness"
    );
    expect(rendered).toContain("Non-goals:");
    expect(rendered).toContain("- do not add dashboard");
    expect(rendered).toContain("Current Task Contract:");
    expect(rendered).toContain("Context Inclusions:");
    expect(rendered).toContain("memory_record:memory-1");
    expect(rendered).toContain("Explicit Exclusions:");
    expect(rendered).toContain("source_claim:claim-weak");
    expect(rendered).toContain("Source Claims Used:");
    expect(rendered).toContain("- claim-1");
    expect(rendered).toContain("Memory Records Used:");
    expect(rendered).toContain("- memory-1");
    expect(rendered).toContain("Anti-memory Warnings:");
    expect(rendered).toContain("anti_memory_record:anti-1");
    expect(rendered).toContain("Tool Boundaries:");
    expect(rendered).toContain("Evidence Contract:");
    expect(rendered).toContain("Skill Binding Hints:");
    expect(rendered).toContain("- activation-engine");
    expect(rendered).not.toContain("select-kernel-patterns");
    expect(rendered).toContain("Hook Expectations:");
    expect(rendered).toContain(
      "PreToolUse | action=warn_or_deny | required=true | applies_to=destructive paths, generated files, destructive/write approval, tool boundary notes"
    );
    expect(rendered).toContain("Stop Condition: Stop before Codex execution or hidden state mutation.");
    expect(rendered).toContain(`Rollback Expectation: ${evidenceContract.rollbackPath}`);
    expect(rendered).toContain("Next Action: Implement the smallest missing doctor check.");
    expect(rendered).toContain("What This Does Not Prove:");
    expect(rendered).toContain("- Codex executed the work.");
    expect(rendered).toContain("Goal: final harness spine");
    expect(rendered).toContain("PLAN.md Milestone 14");
  });

  it("keeps the existing renderExecutionBrief wrapper stable", () => {
    const rendered = renderExecutionBrief({
      taskContract,
      harnessPlan,
      contextAssembly,
      capabilityPlan,
      evidenceContract,
      nextAction: "Implement the smallest missing doctor check."
    });

    expect(rendered).toContain("KRN Codex Execution Brief");
    expect(rendered).toContain("What This Does Not Prove:");
  });

  it("renders focused skill hints for memory source audit capabilities", () => {
    const hints = createCodexSkillBindingHints({
      ...capabilityPlan,
      requirements: [
        {
          kind: "schema_design",
          priority: "required",
          bindingKinds: ["skill", "rule"],
          reason: "Memory schema changes require brain-store schema discipline.",
          requiredEvidence: ["schema/domain tests"]
        },
        {
          kind: "db_migration",
          priority: "required",
          bindingKinds: ["skill", "policy_gate"],
          reason: "Memory persistence changes require DB readiness proof.",
          requiredEvidence: ["pnpm db:ready"]
        },
        {
          kind: "source_grounding",
          priority: "required",
          bindingKinds: ["skill", "policy_gate"],
          reason: "Architecture decisions require source-to-decision evidence.",
          requiredEvidence: ["source claim"]
        },
        {
          kind: "evidence_capture",
          priority: "required",
          bindingKinds: ["skill", "tool_boundary"],
          reason: "Audit work requires reviewable evidence.",
          requiredEvidence: ["audit slice"]
        },
        {
          kind: "review_capture",
          priority: "required",
          bindingKinds: ["skill", "policy_gate"],
          reason: "Review output must become candidates, not final truth.",
          requiredEvidence: ["feedback delta"]
        }
      ]
    });

    expect(hints.map((hint) => hint.skillName)).toEqual(expect.arrayContaining([
      "brain-store-schema",
      "source-to-decision",
      "evidence-review-loop"
    ]));
  });
});
