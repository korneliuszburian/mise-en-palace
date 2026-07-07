import { describe, expect, it } from "vitest";
import type {
  CapabilityPlan,
  ContextAssembly,
  HarnessPlan,
  TaskContract
} from "@krn/core";
import type {
  EvidenceContract
} from "@krn/core";

import {
  createExecutionBrief,
  describeExecutionBriefProfile,
  renderExecutionBriefText,
  renderExecutionBrief
} from "../render-execution-brief.js";
import {
  executionBriefFormatVersion
} from "../contracts.js";
import {
  createCodexSkillBindingHints
} from "../render-skill-hints.js";

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
  observationPrefix: {
    projectId: "project-1",
    taskContractId: "task-1",
    text: "Prior observation: doctor readiness failed when DB checks trusted markdown-only state.",
    itemCount: 1,
    warningCount: 1,
    exclusionCount: 0,
    items: [
      {
        observationId: "observation-1",
        kind: "operator_feedback",
        confidence: "high",
        priority: "critical",
        summary: "DB readiness should be proven from store-backed checks, not markdown notes.",
        sourceRangeCount: 1,
        reason: "Observation matches doctor readiness and has source range evidence.",
        score: 98
      }
    ],
    warnings: [
      {
        observationId: "observation-1",
        warning: "gap",
        summary: "Observation records the failure pattern but does not prove current DB readiness."
      }
    ],
    exclusions: []
  },
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
      reason: "Preserve strict TypeScript boundaries.",
      requiredEvidence: ["pnpm typecheck"]
    },
    {
      kind: "evidence_capture",
      priority: "required",
      reason: "Keep execution reviewable.",
      requiredEvidence: ["git diff --check"]
    },
    {
      kind: "context_abstention",
      priority: "required",
      reason: "Weak context must abstain instead of expanding context.",
      requiredEvidence: ["context abstention"]
    }
  ],
  toolBoundaries: ["Do not invoke Codex from the renderer."],
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
      goalReference: "Goal: canonical harness spine",
      execPlanReference: "PLAN.md Milestone 14"
    });

    expect(brief.currentTaskContract).toEqual({
      id: "task-1",
      title: "Improve KRN doctor brain store readiness",
      objective: "Make doctor report Postgres memory and source graph readiness",
      constraints: ["no runtime markdown memory"],
      acceptance: ["typecheck and tests pass"]
    });
    expect(brief.formatVersion).toBe(executionBriefFormatVersion);
    expect(brief.sourceClaimsUsed).toEqual(["claim-1"]);
    expect(brief.memoryRecordsUsed).toEqual(["memory-1"]);
    expect(brief.goalRefs).toEqual([
      {
        source: "Goal: canonical harness spine",
        objective: "Make doctor report Postgres memory and source graph readiness",
        status: "active"
      }
    ]);
    expect(brief.execPlanRefs).toEqual([
      {
        source: "PLAN.md Milestone 14",
        section: "Doctor brain-store readiness plan",
        status: "active"
      }
    ]);
    expect(brief.observationPrefix).toEqual([
      {
        observationId: "observation-1",
        kind: "operator_feedback",
        confidence: "high",
        priority: "critical",
        summary: "DB readiness should be proven from store-backed checks, not markdown notes.",
        sourceRangeCount: 1,
        reason: "Observation matches doctor readiness and has source range evidence.",
        score: 98
      }
    ]);
    expect(brief.observationPrefixWarnings).toEqual([
      {
        observationId: "observation-1",
        warning: "gap",
        summary: "Observation records the failure pattern but does not prove current DB readiness."
      }
    ]);
    expect(brief.untrustedContextWarnings).toEqual([]);
    expect(brief.antiMemoryWarnings).toEqual([
      "anti_memory_record:anti-1 | unsafe | Do not treat old markdown memory as runtime truth."
    ]);
    expect(brief.stopCondition).toBe("Stop before Codex execution or hidden state mutation.");
    expect(brief.rollbackExpectation).toBe(evidenceContract.rollbackPath);
    expect(brief.doesNotProve).toContain("Codex executed the work.");
    expect(brief.skillBindingHints.every((hint) =>
      hint.patternRefs.includes("pattern:codex-skill-progressive-disclosure-routing")
    )).toBe(true);

    const profile = describeExecutionBriefProfile(brief);
    expect(profile.formatVersion).toBe(executionBriefFormatVersion);
    expect(profile.profile).toBe("default");
    expect(profile.budget).toMatchObject({
      maxRenderedSections: 21,
      maxRenderedItems: 80,
      status: "within_budget"
    });
    expect(profile.sections.find((section) => section.id === "mcp_resource_refs")).toMatchObject({
      kind: "reserved",
      rendered: false,
      itemCount: 0,
      emptyBehavior: "omit_when_empty"
    });
    expect(profile.sections.find((section) => section.id === "subagent_probe_hints")).toMatchObject({
      kind: "reserved",
      rendered: false,
      itemCount: 0,
      emptyBehavior: "omit_when_empty"
    });
    expect(profile.sections.find((section) => section.id === "observation_prefix")).toMatchObject({
      kind: "diagnostic",
      rendered: true,
      itemCount: 2,
      emptyBehavior: "omit_when_empty"
    });
  });

  it("renders a bounded Codex execution brief with exclusions and evidence", () => {
    const brief = createExecutionBrief({
      taskContract,
      harnessPlan,
      contextAssembly,
      capabilityPlan,
      evidenceContract,
      nextAction: "Implement the smallest missing doctor check.",
      goalReference: "Goal: canonical harness spine",
      execPlanReference: "PLAN.md Milestone 14"
    });
    const rendered = renderExecutionBriefText(brief);

    expect(rendered).toContain(
      "Objective: Make doctor report Postgres memory and source graph readiness"
    );
    expect(rendered).toContain(`Format Version: ${executionBriefFormatVersion}`);
    expect(rendered).toContain("Brief Profile:");
    expect(rendered).toContain("- budget=within_budget");
    expect(rendered).toContain("- required=title, format_version, objective");
    expect(rendered).toContain("Non-goals:");
    expect(rendered).toContain("- do not add dashboard");
    expect(rendered).toContain("Current Task Contract:");
    expect(rendered).toContain("Context Inclusions:");
    expect(rendered).toContain("Observation Prefix:");
    expect(rendered).toContain("observation:observation-1");
    expect(rendered).toContain("source_ranges=1");
    expect(rendered).toContain("warning:observation-1");
    expect(rendered).not.toContain("Untrusted Context Warnings:");
    expect(rendered).toContain("Constraints:");
    expect(rendered).toContain("- no runtime markdown memory");
    expect(rendered).toContain("Acceptance:");
    expect(rendered).toContain("- typecheck and tests pass");
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
    expect(rendered).toContain(`Review burden: ${evidenceContract.reviewBurden}`);
    expect(rendered).toContain("Skill Binding Hints:");
    expect(rendered).toContain("- activation-engine");
    expect(rendered).toContain("patterns=pattern:codex-skill-progressive-disclosure-routing");
    expect(rendered).not.toContain("select-kernel-patterns");
    expect(rendered).not.toContain("MCP Resource Refs:");
    expect(rendered).not.toContain("Subagent Probe Hints:");
    expect(rendered).toContain("Hook Expectations:");
    expect(rendered).toContain(
      "PreToolUse | action=warn_or_deny | required=true | applies_to=destructive paths, generated files, untrusted selected context, destructive/write approval, tool boundary notes"
    );
    expect(rendered).toContain("Stop Condition: Stop before Codex execution or hidden state mutation.");
    expect(rendered).toContain(`Rollback Expectation: ${evidenceContract.rollbackPath}`);
    expect(rendered).toContain("Next Action: Implement the smallest missing doctor check.");
    expect(rendered).toContain("What This Does Not Prove:");
    expect(rendered).toContain("- Codex executed the work.");
    expect(rendered).toContain("- MCP resources exist.");
    expect(rendered).toContain("Goal: canonical harness spine");
    expect(rendered).toContain(
      "- Goal: canonical harness spine | objective=Make doctor report Postgres memory and source graph readiness | status=active"
    );
    expect(rendered).toContain(
      "- PLAN.md Milestone 14 | section=Doctor brain-store readiness plan | status=active"
    );
  });

  it("reports over budget when rendered brief items exceed the profile budget", () => {
    const overloadedContextAssembly: ContextAssembly = {
      ...contextAssembly,
      exclusions: Array.from({ length: 81 }, (_, index) => ({
        subjectType: "source_claim",
        subjectId: `claim-noise-${index}`,
        reason: "low_trust",
        explanation: "Candidate trust tier low is below medium.",
        score: 10,
        trustTier: "low"
      }))
    };
    const brief = createExecutionBrief({
      taskContract,
      harnessPlan,
      contextAssembly: overloadedContextAssembly,
      capabilityPlan,
      evidenceContract,
      nextAction: "Implement the smallest missing doctor check."
    });

    const profile = describeExecutionBriefProfile(brief);

    expect(profile.budget.renderedItems).toBeGreaterThan(profile.budget.maxRenderedItems);
    expect(profile.budget.status).toBe("over_budget");
  });

  it("renders reserved future-hook sections only when populated", () => {
    const brief = {
      ...createExecutionBrief({
        taskContract,
        harnessPlan,
        contextAssembly,
        capabilityPlan,
        evidenceContract,
        nextAction: "Implement the smallest missing doctor check."
      }),
      mcpResourceRefs: [{
        name: "run-ledger",
        purpose: "Future typed read-only access to persisted run evidence.",
        access: "future_reference" as const,
        doesNotGrant: ["memory mutation", "Codex execution"]
      }],
      subagentProbeHints: [{
        name: "ts-type-critic",
        mode: "read_only" as const,
        purpose: "Review TypeScript public boundaries.",
        trigger: "broad TypeScript contract change",
        allowedActions: ["inspect", "propose"]
      }]
    };
    const profile = describeExecutionBriefProfile(brief);
    const rendered = renderExecutionBriefText(brief);

    expect(profile.sections.find((section) => section.id === "mcp_resource_refs")).toMatchObject({
      kind: "reserved",
      rendered: true,
      itemCount: 1,
      emptyBehavior: "omit_when_empty"
    });
    expect(profile.sections.find((section) => section.id === "subagent_probe_hints")).toMatchObject({
      kind: "reserved",
      rendered: true,
      itemCount: 1,
      emptyBehavior: "omit_when_empty"
    });
    expect(rendered).toContain("- required=title, format_version, objective");
    expect(rendered).toContain("MCP Resource Refs:");
    expect(rendered).toContain("- run-ledger | access=future_reference");
    expect(rendered).toContain("Subagent Probe Hints:");
    expect(rendered).toContain("- ts-type-critic | mode=read_only");
  });

  it("warns when selected context is not a trusted tier", () => {
    const brief = createExecutionBrief({
      taskContract,
      harnessPlan,
      contextAssembly: {
        ...contextAssembly,
        inclusions: [
          ...contextAssembly.inclusions,
          {
            subjectType: "source_claim",
            subjectId: "claim-hypothesis",
            reason: "Hypothesis source may help identify risk.",
            expectedUse: "Use only as a risk hypothesis.",
            tokenEstimate: 20,
            trustTier: "hypothesis"
          }
        ]
      },
      capabilityPlan,
      evidenceContract,
      nextAction: "Implement the smallest missing doctor check."
    });

    expect(brief.untrustedContextWarnings).toEqual([
      "source_claim:claim-hypothesis | trust=hypothesis | treat as untrusted selected context; verify before using as implementation authority"
    ]);

    const rendered = renderExecutionBriefText(brief);

    expect(rendered).toContain("Untrusted Context Warnings:");
    expect(rendered).toContain("source_claim:claim-hypothesis");
    expect(rendered).toContain("treat as untrusted selected context");
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
    expect(rendered).toContain(`Format Version: ${executionBriefFormatVersion}`);
    expect(rendered).toContain("What This Does Not Prove:");
  });

  it("renders focused skill hints for memory source audit capabilities", () => {
    const hints = createCodexSkillBindingHints({
      ...capabilityPlan,
      requirements: [
        {
          kind: "schema_design",
          priority: "required",
          reason: "Memory schema changes require brain-store schema discipline.",
          requiredEvidence: ["schema/domain tests"]
        },
        {
          kind: "db_migration",
          priority: "required",
          reason: "Memory persistence changes require DB readiness proof.",
          requiredEvidence: ["pnpm db:ready"]
        },
        {
          kind: "source_grounding",
          priority: "required",
          reason: "Architecture decisions require source-to-decision evidence.",
          requiredEvidence: ["source claim"]
        },
        {
          kind: "evidence_capture",
          priority: "required",
          reason: "Audit work requires reviewable evidence.",
          requiredEvidence: ["audit slice"]
        },
        {
          kind: "review_capture",
          priority: "required",
          reason: "Review output must become candidates, not direct authority.",
          requiredEvidence: ["feedback delta"]
        },
        {
          kind: "context_abstention",
          priority: "recommended",
          reason: "Context abstention is useful when weak context appears.",
          requiredEvidence: ["abstention readback"]
        }
      ]
    });

    expect(hints.map((hint) => hint.skillName)).toEqual(expect.arrayContaining([
      "brain-store-schema",
      "source-to-decision",
      "evidence-review-loop"
    ]));
    expect(hints.every((hint) =>
      hint.patternRefs.includes("pattern:codex-skill-progressive-disclosure-routing")
    )).toBe(true);
    expect(hints.find((hint) => hint.capabilityKind === "context_abstention")).toMatchObject({
      priority: "recommended",
      skillName: "activation-engine"
    });
    expect(hints.find((hint) => hint.capabilityKind === "schema_design")).toMatchObject({
      priority: "required"
    });
  });
});
