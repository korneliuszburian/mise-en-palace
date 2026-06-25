import { describe, expect, it } from "vitest";
import type {
  CapabilityPlan,
  ContextAssembly,
  GoldenTask,
  HarnessPlan,
  TaskContract
} from "@krn/core";
import {
  runGoldenTaskFixtures
} from "@krn/harness";
import type {
  EvidenceContract
} from "@krn/harness";

import {
  createExecutionBrief,
  renderExecutionBriefText
} from "./renderExecutionBrief.js";

const now = "2026-06-25T14:20:00.000Z";
const evidenceRefs = [
  "packages/codex-adapter/src/codexBriefGoldenBehavior.test.ts",
  "tests/fixtures/golden-tasks/codex-brief-behavior.json"
] as const;

const taskContract: TaskContract = {
  id: "task-codex-brief-golden",
  operatorIntentId: "intent-codex-brief-golden",
  projectId: "project-1",
  title: "Harden Codex execution brief",
  objective: "Render all bounded execution contract fields for Codex.",
  constraints: ["do not mutate core state", "do not invoke Codex from the renderer"],
  nonGoals: ["do not build dashboard", "do not add a Promptfoo proof layer"],
  acceptance: ["brief exposes review contract fields"],
  status: "active",
  metadata: {},
  createdAt: now,
  updatedAt: now
};

const harnessPlan: HarnessPlan = {
  id: "plan-codex-brief-golden",
  taskContractId: taskContract.id,
  version: 1,
  status: "ready",
  summary: "Codex brief golden behavior plan",
  nextAction: "Render the bounded execution brief.",
  metadata: {},
  createdAt: now,
  updatedAt: now
};

const contextAssembly: ContextAssembly = {
  id: "context-codex-brief-golden",
  harnessPlanId: harnessPlan.id,
  status: "assembled",
  tokenBudget: 400,
  inclusions: [{
    subjectType: "source_claim",
    subjectId: "claim-codex-brief-contract",
    reason: "C-03 dogfood proved brief review contract fields matter.",
    expectedUse: "Keep the Codex brief bounded and reviewable.",
    tokenEstimate: 80,
    trustTier: "project-decision"
  }],
  exclusions: [{
    subjectType: "source_claim",
    subjectId: "claim-promptfoo-as-truth",
    reason: "low_trust",
    explanation: "Promptfoo smoke is adapter evidence, not KRN behavior proof.",
    score: 20,
    trustTier: "low"
  }],
  metadata: {},
  createdAt: now
};

const capabilityPlan: CapabilityPlan = {
  id: "capability-codex-brief-golden",
  harnessPlanId: harnessPlan.id,
  requirements: [{
    kind: "evidence_capture",
    priority: "required",
    bindingKinds: ["skill", "tool_boundary"],
    reason: "Brief behavior must remain reviewable.",
    requiredEvidence: ["codex brief golden behavior"]
  }],
  toolBoundaries: ["Renderer must not execute Codex."],
  policyGateIds: [],
  metadata: {},
  createdAt: now
};

const evidenceContract: EvidenceContract = {
  commands: [{
    command: "pnpm --filter @krn/codex-adapter test -- codexBriefGoldenBehavior",
    required: true
  }],
  diffRisk: "medium",
  reviewBurden: "Confirm the rendered brief shows execution constraints and proof limits.",
  rollbackPath: "Revert the Codex adapter behavior proof commit.",
  metadata: {}
};

const task: GoldenTask = {
  id: "golden-task-codex-brief-001",
  projectId: "project-1",
  status: "draft",
  title: "Codex execution brief stays bounded and reviewable",
  description: "Protects the Codex-facing brief contract created by the C-03 dogfood run.",
  owner: "codex-adapter-eval",
  domains: ["capability", "context"],
  cases: [{
    id: "golden-case-codex-brief-001-a",
    title: "brief renders execution contract fields without hidden authority",
    input: {
      dogfoodRun: "bc1dd6e3-1263-4007-a1e4-34defc1932cf"
    },
    expectedBehavior: {
      outcome: "flag",
      subject: "codex_execution_brief:review_contract",
      rationale: "Codex briefs must expose bounded execution and review fields.",
      evidenceRefs: [...evidenceRefs]
    },
    protectedFailureModes: [{
      id: "failure-mode-codex-brief-001-a",
      domain: "capability",
      severity: "blocking",
      title: "Codex brief hides review contract",
      mustNot: "Brief output must not omit the execution/review contract.",
      detection: "Rendered text lacks constraints, acceptance, review burden, rollback, context, exclusions, or does-not-prove sections."
    }],
    sourceRefs: [
      "docs/reviews/controlled-dogfood/2026-06-25-codex-brief-contract-hardening/REPORT.md",
      "docs/architecture/golden-task-promotion.md"
    ],
    metadata: {}
  }],
  metadata: {},
  createdAt: now,
  updatedAt: now
};

describe("codex brief golden behavior", () => {
  it("guards the dogfood-derived execution brief review contract", () => {
    const brief = createExecutionBrief({
      taskContract,
      harnessPlan,
      contextAssembly,
      capabilityPlan,
      evidenceContract,
      nextAction: "Execute the bounded source repair.",
      goalReference: "GOAL.md",
      execPlanReference: "PLAN.md D-00"
    });
    const rendered = renderExecutionBriefText(brief);
    const passed =
      rendered.includes("Constraints:") &&
      rendered.includes("- do not mutate core state") &&
      rendered.includes("Acceptance:") &&
      rendered.includes("- brief exposes review contract fields") &&
      rendered.includes("Context Inclusions:") &&
      rendered.includes("source_claim:claim-codex-brief-contract") &&
      rendered.includes("Explicit Exclusions:") &&
      rendered.includes("source_claim:claim-promptfoo-as-truth") &&
      rendered.includes(`Review burden: ${evidenceContract.reviewBurden}`) &&
      rendered.includes(`Rollback Expectation: ${evidenceContract.rollbackPath}`) &&
      rendered.includes("What This Does Not Prove:") &&
      rendered.includes("- Codex executed the work.");
    const report = runGoldenTaskFixtures({
      tasks: [task],
      proofs: [{
        caseId: "golden-case-codex-brief-001-a",
        status: passed ? "passed" : "failed",
        provenance: "krn_behavior_execution",
        summary: passed
          ? "Real Codex adapter behavior rendered constraints, acceptance, review burden, rollback, selected context, exclusions, and proof limits."
          : rendered,
        evidenceRefs,
        doesNotProve:
          "This behavior proof does not prove Codex executed the brief, Promptfoo behavior proof, or product readiness."
      }]
    });

    expect(report.status).toBe("passed");
    expect(report.caseCount).toBe(1);
    expect(report.passedCaseCount).toBe(1);
    expect(report.failedCaseCount).toBe(0);
    expect(report.missingProofCaseIds).toEqual([]);
    expect(report.failedProofCaseIds).toEqual([]);
  });
});
