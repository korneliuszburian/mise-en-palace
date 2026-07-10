import { describe, expect, it } from "vitest";
import type {
  CapabilityPlan,
  ContextAssembly,
  BehaviorFixture,
  DecisionPacket,
  HarnessPlan,
  TaskContract
} from "@krn/core";
import {
  runBehaviorFixtures
} from "@krn/harness";
import type {
  EvidenceContract
} from "@krn/core";

import {
  executionBriefFormatVersion
} from "../contracts.js";
import {
  createExecutionBrief,
  renderExecutionBriefText
} from "../render-execution-brief.js";

const now = "2026-06-25T14:20:00.000Z";
const evidenceRefs = [
  "packages/codex-adapter/src/__tests__/codex-brief-behavior.test.ts",
  "tests/fixtures/behavior-fixtures/codex-brief-behavior.json"
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
  summary: "Codex brief behavior fixture plan",
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
    sourceAuthority: "project-decision"
  }],
  exclusions: [{
    subjectType: "source_claim",
    subjectId: "claim-promptfoo-as-truth",
    reason: "low_trust",
    explanation: "Promptfoo smoke is adapter evidence, not KRN behavior proof.",
    score: 20,
    sourceAuthority: "low"
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
    reason: "Brief behavior must remain reviewable.",
    requiredEvidence: ["codex brief behavior fixture"]
  }],
  toolBoundaries: ["Renderer must not execute Codex."],
  metadata: {},
  createdAt: now
};

const evidenceContract: EvidenceContract = {
  commands: [{
    command: "pnpm --filter @krn/codex-adapter test -- codexBriefBehavior",
    required: true
  }],
  diffRisk: "medium",
  reviewBurden: "Confirm the rendered brief shows execution constraints and proof limits.",
  rollbackPath: "Revert the Codex adapter behavior proof commit.",
  metadata: {}
};

const expectedRenderedBriefFragments = [
  "Constraints:",
  `Format Version: ${executionBriefFormatVersion}`,
  "- do not mutate core state",
  "Acceptance:",
  "- brief exposes review contract fields",
  "Context Inclusions:",
  "source_claim:claim-codex-brief-contract",
  "reason=C-03 dogfood proved brief review contract fields matter.",
  "expected_use=Keep the Codex brief bounded and reviewable.",
  "Explicit Exclusions:",
  "source_claim:claim-promptfoo-as-truth",
  "reason=low_trust",
  "explanation=Promptfoo smoke is adapter evidence, not KRN behavior proof.",
  `Review burden: ${evidenceContract.reviewBurden}`,
  `Rollback path: ${evidenceContract.rollbackPath}`,
  `Rollback Expectation: ${evidenceContract.rollbackPath}`,
  "Stop Condition: Stop before Codex execution or hidden state mutation.",
  "What This Does Not Prove:",
  "- Codex executed the work."
] as const;

const packet: DecisionPacket = {
  formatVersion: "krn.decisionPacket.v1",
  task: {
    id: taskContract.id,
    title: taskContract.title,
    objective: taskContract.objective,
    constraints: taskContract.constraints,
    nonGoals: taskContract.nonGoals,
    acceptance: taskContract.acceptance
  },
  contextInclusions: contextAssembly.inclusions.map((item) => ({
    subjectType: item.subjectType,
    subjectId: item.subjectId,
    reason: item.reason,
    expectedUse: item.expectedUse,
    sourceAuthority: item.sourceAuthority
  })),
  contextExclusions: contextAssembly.exclusions.map((item) => ({
    subjectType: item.subjectType,
    subjectId: item.subjectId,
    reason: item.reason,
    explanation: item.explanation,
    sourceAuthority: item.sourceAuthority
  })),
  toolBoundaries: capabilityPlan.toolBoundaries,
  evidenceContract,
  nextAction: "Execute the bounded source repair.",
  governingDecisionIds: [],
  governingStatements: [],
  taskStandardDecisions: [],
  sourceClaimIds: ["claim-codex-brief-contract"],
  caveatedSourceClaimIds: [],
  sourceDecisionEdgeIds: [],
  sourceDecisionTargets: [],
  sourceRejectionIds: [],
  memoryRefs: [],
  caveatedMemoryRefs: [],
  staleDecisionIds: [],
  staleKnowledgeIds: [],
  noiseKnowledgeIds: [],
  unknownKnowledgeIds: [],
  supersededPathIds: [],
  rejectedPathIds: ["claim-promptfoo-as-truth"],
  falsifiers: [],
  verificationCommands: evidenceContract.commands.map((item) => item.command),
  evidenceGaps: [],
  sourceConsensus: {
    decisionLinkedSourceClaimIds: [],
    caveatedSourceClaimIds: [],
    unsupportedSourceClaimIds: [],
    conflictingSourceClaimIds: [],
    unknownSourceClaimIds: [],
    sourceDecisionEdgeIds: [],
    sourceDecisionTargets: [],
    staleDecisionIds: [],
    supersededPathIds: [],
    rejectedPathIds: [],
    sourceRejectionIds: [],
    conflictedDecisionIds: [],
    evidenceGapIds: [],
    doesNotProve: "This test packet does not prove source truth."
  },
  abstentionScore: {
    status: "ready",
    score: 100,
    reasons: [],
    evidenceGapIds: [],
    doesNotProve: "This test packet does not prove source truth."
  },
  doesNotProve: ["This test packet does not prove source truth."],
  nonProofs: ["This test packet does not prove source truth."],
  noiseDecisionIds: [],
  severeStaleAuthorityIds: [],
  brief: {
    includedContextCount: 1,
    observationPrefixCount: 0,
    explicitExclusionCount: 1,
    sourceClaimUseCount: 1,
    memoryRecordUseCount: 0,
    includedSourceClaimIds: ["claim-codex-brief-contract"],
    includedMemoryRecordIds: [],
    excludedSourceClaimIds: ["claim-promptfoo-as-truth"],
    excludedMemoryRecordIds: [],
    excludedAntiMemoryRecordIds: [],
    evidenceGapIds: []
  }
};

const includesAllFragments = (
  rendered: string,
  fragments: readonly string[]
): boolean => fragments.every((fragment) => rendered.includes(fragment));

const task: BehaviorFixture = {
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
      "packages/codex-adapter/src/render-execution-brief.ts",
      "packages/codex-adapter/src/__tests__/codex-brief-behavior.test.ts"
    ],
    metadata: {}
  }],
  metadata: {},
  createdAt: now,
  updatedAt: now
};

describe("codex brief behavior fixture", () => {
  it("guards the dogfood-derived execution brief review contract", () => {
    const brief = createExecutionBrief({
      packet
    });
    const rendered = renderExecutionBriefText(brief);
    const passed = includesAllFragments(rendered, expectedRenderedBriefFragments);
    const report = runBehaviorFixtures({
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
