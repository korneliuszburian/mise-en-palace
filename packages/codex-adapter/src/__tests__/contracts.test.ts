import { describe, expect, test } from "vitest";

import {
  executionBriefSectionIds,
  executionBriefFormatVersion
} from "../contracts.js";
import type {
  CodexAdapterPlan,
  ExecutionBrief,
  ExecutionBriefProfileReadback
} from "../contracts.js";

const createdAt = "2026-06-22T06:00:00.000Z";

describe("Codex adapter contracts", () => {
  test("model bounded Codex-facing outputs without execution authority", () => {
    const brief: ExecutionBrief = {
      formatVersion: executionBriefFormatVersion,
      title: "KRN Codex Execution Brief",
      objective: "Render a bounded Codex brief.",
      nonGoals: ["do not invoke Codex"],
      currentTaskContract: {
        id: "task-1",
        title: "Render a bounded Codex brief.",
        objective: "Render a bounded Codex brief.",
        constraints: ["keep the renderer non-mutating"],
        acceptance: ["brief is inspectable"]
      },
      observationPrefix: [],
      observationPrefixWarnings: [],
      includedContext: [
        {
          subjectType: "memory_record",
          subjectId: "memory-1",
          reason: "high-signal memory",
          expectedUse: "Keep brief bounded.",
          sourceAuthority: "high"
        }
      ],
      untrustedContextWarnings: [],
      explicitExclusions: [
        {
          subjectType: "source_claim",
          subjectId: "claim-weak",
          reason: "low_trust",
          explanation: "Candidate source authority is too weak.",
          sourceAuthority: "low"
        }
      ],
      sourceClaimsUsed: ["claim-strong"],
      memoryRecordsUsed: ["memory-1"],
      antiMemoryWarnings: ["do not promote memory automatically"],
      toolBoundaries: ["Do not invoke Codex from the renderer."],
      evidenceContract: {
        commands: ["pnpm typecheck"],
        diffRisk: "medium",
        reviewBurden: "focused adapter contract review",
        rollbackPath: "Focused revert of the adapter contract commit."
      },
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
      stopCondition: "Stop before invoking Codex.",
      rollbackExpectation: "Focused revert of adapter contract changes.",
      nextAction: "Implement contract exports.",
      doesNotProve: ["Codex execution", "memory mutation"]
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

    expect(plan.executionBrief.formatVersion).toBe(executionBriefFormatVersion);
    expect(plan.executionBrief.goalRefs[0]?.objective).toBe("M26 Codex adapter contracts");
    expect(plan.executionBrief.doesNotProve).toContain("memory mutation");
  });

  test("models execution brief profile readback without runtime authority", () => {
    const readback: ExecutionBriefProfileReadback = {
      formatVersion: executionBriefFormatVersion,
      profile: "default",
      sections: [{
        id: "goal_refs",
        kind: "diagnostic",
        rendered: false,
        itemCount: 0,
        emptyBehavior: "omit_when_empty"
      }],
      budget: {
        maxRenderedSections: 21,
        maxRenderedItems: 80,
        renderedSections: 12,
        renderedItems: 20,
        status: "within_budget"
      },
      doesNotProve: [
        "Brief profile classification proves only adapter rendering intent.",
        "Rendered section presence does not prove Codex followed the brief or prompt quality improved."
      ]
    };

    expect(executionBriefSectionIds).not.toContain("mcp_resource_refs");
    expect(executionBriefSectionIds).not.toContain("subagent_probe_hints");
    expect(executionBriefSectionIds).not.toContain("hook_expectations");
    expect(readback.sections[0]?.kind).toBe("diagnostic");
    expect(readback.sections[0]?.rendered).toBe(false);
    expect(readback.doesNotProve).toContain(
      "Rendered section presence does not prove Codex followed the brief or prompt quality improved."
    );
  });
});
