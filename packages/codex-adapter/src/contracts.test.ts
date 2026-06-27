import { describe, expect, test } from "vitest";

import {
  codexHookPhases
} from "./contracts.js";
import type {
  CodexAdapterPlan,
  CodexHookExpectation,
  CodexMcpResourceRef,
  CodexSkillBindingHint,
  CodexSubagentProbeHint,
  ExecutionBrief
} from "./contracts.js";

const createdAt = "2026-06-22T06:00:00.000Z";

describe("Codex adapter contracts", () => {
  test("model bounded Codex-facing outputs without execution authority", () => {
    const skillHint: CodexSkillBindingHint = {
      skillName: "typescript-type-safety",
      capabilityKind: "type_safety",
      reason: "Preserve strict TypeScript boundaries.",
      requiredEvidence: ["pnpm typecheck"],
      priority: "required",
      source: "capability_plan"
    };
    const hookExpectations: CodexHookExpectation[] = [
      {
        phase: "SessionStart",
        action: "inject_pointer",
        reason: "Surface the compact project and run pointer.",
        required: false
      },
      {
        phase: "PreToolUse",
        action: "warn_or_deny",
        reason: "Guard destructive commands before execution.",
        required: true
      },
      {
        phase: "PostToolUse",
        action: "record_signal",
        reason: "Capture command success or failure evidence.",
        required: true
      },
      {
        phase: "PreCompact",
        action: "require_handoff",
        reason: "Keep restart state explicit before compaction.",
        required: true
      },
      {
        phase: "Stop",
        action: "suggest_evidence_capture",
        reason: "Make review evidence visible before stopping.",
        required: false
      }
    ];
    const mcpRef: CodexMcpResourceRef = {
      name: "run-ledger",
      purpose: "Future typed read-only access to persisted run evidence.",
      access: "future_reference",
      doesNotGrant: ["memory mutation", "Codex execution"]
    };
    const subagentHint: CodexSubagentProbeHint = {
      name: "ts-type-critic",
      mode: "read_only",
      purpose: "Review TypeScript public boundaries.",
      trigger: "broad TypeScript contract change",
      allowedActions: ["inspect", "propose"]
    };
    const brief: ExecutionBrief = {
      title: "KRN Codex Execution Brief",
      objective: "Render a bounded Codex brief.",
      nonGoals: ["do not invoke Codex"],
      currentTaskContract: {
        id: "task-1",
        title: "Render a bounded Codex brief.",
        objective: "Render a bounded Codex brief."
      },
      includedContext: [
        {
          subjectType: "memory_record",
          subjectId: "memory-1",
          reason: "high-signal memory",
          expectedUse: "Keep brief bounded.",
          trustTier: "high"
        }
      ],
      untrustedContextWarnings: [],
      explicitExclusions: [
        {
          subjectType: "source_claim",
          subjectId: "claim-weak",
          reason: "low_trust",
          explanation: "Candidate trust tier is too weak.",
          trustTier: "low"
        }
      ],
      sourceClaimsUsed: ["claim-strong"],
      memoryRecordsUsed: ["memory-1"],
      antiMemoryWarnings: ["do not promote memory automatically"],
      toolBoundaries: ["Do not invoke Codex from the renderer."],
      evidenceContract: {
        commands: ["pnpm typecheck"],
        diffRisk: "medium",
        rollbackPath: "Focused revert of the adapter contract commit."
      },
      hookExpectations,
      skillBindingHints: [skillHint],
      mcpResourceRefs: [mcpRef],
      goalRefs: [
        {
          source: "GOAL.md",
          objective: "M26 Codex adapter contracts",
          status: "active"
        }
      ],
      execPlanRefs: [
        {
          source: "GOAL.md",
          section: "M26.01",
          status: "active"
        }
      ],
      subagentProbeHints: [subagentHint],
      stopCondition: "Stop before invoking Codex.",
      rollbackExpectation: "Focused revert of adapter contract changes.",
      nextAction: "Implement contract exports.",
      doesNotProve: ["Codex execution", "MCP server availability"]
    };
    const plan: CodexAdapterPlan = {
      id: "codex-plan-1",
      harnessPlanId: "harness-plan-1",
      contextAssemblyId: "context-assembly-1",
      status: "ready",
      executionBrief: brief,
      createdAt,
      metadata: {}
    };

    expect(codexHookPhases).toEqual([
      "SessionStart",
      "PreToolUse",
      "PostToolUse",
      "PreCompact",
      "Stop"
    ]);
    expect(plan.executionBrief.skillBindingHints).toEqual([skillHint]);
    expect(plan.executionBrief.mcpResourceRefs).toEqual([mcpRef]);
    expect(plan.executionBrief.subagentProbeHints).toEqual([subagentHint]);
    expect(plan.executionBrief.hookExpectations.map((item) => item.phase)).toEqual(
      codexHookPhases
    );
  });
});
