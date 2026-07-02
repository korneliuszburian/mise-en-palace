import { describe, expect, it } from "vitest";

import {
  formatCodexAdapterSmokeReport
} from "./codexAdapterSmoke.js";

describe("codexAdapterSmoke", () => {
  it("formats bounded Codex adapter smoke proof", () => {
    const output = formatCodexAdapterSmokeReport({
      workspaceSlug: "krn-codex-adapter-smoke-1",
      projectSlug: "codex-adapter",
      executionRunId: "execution-run-1",
      readBackExecutionRunId: "execution-run-1",
      contextAssemblyId: "context-assembly-1",
      renderedObjective: true,
      renderedFormatVersion: true,
      renderedNonGoals: true,
      renderedExplicitExclusions: true,
      renderedEvidenceContract: true,
      renderedSkillPatternRefs: true,
      expiredMemoryExcluded: true,
      expiredMemoryExclusionReason: "stale",
      expiredMemoryValidUntil: "2026-06-10T00:00:00.000Z",
      sourceClaimsUsed: 1,
      memoryRecordsUsed: 1,
      antiMemoryWarnings: 0,
      hookExpectationCount: 5,
      codexInvocationCount: 0,
      remainingMarkerCount: 0,
      cleanedUp: true
    });

    expect(output).toContain("KRN Codex Adapter Smoke");
    expect(output).toContain("Execution run: execution-run-1");
    expect(output).toContain("Readback: matched");
    expect(output).toContain("Context assembly: context-assembly-1");
    expect(output).toContain("Objective present: yes");
    expect(output).toContain("Format version present: yes");
    expect(output).toContain("Non-goals present: yes");
    expect(output).toContain("Explicit exclusions present: yes");
    expect(output).toContain("Expired memory excluded: yes");
    expect(output).toContain("Expired memory exclusion reason: stale");
    expect(output).toContain("Expired memory valid until: 2026-06-10T00:00:00.000Z");
    expect(output).toContain("Evidence contract present: yes");
    expect(output).toContain("Skill pattern refs present: yes");
    expect(output).toContain("Source claims used: 1");
    expect(output).toContain("Memory records used: 1");
    expect(output).toContain("Anti-memory warnings: 0");
    expect(output).toContain("Hook expectations: 5");
    expect(output).toContain("Codex invocations: 0");
    expect(output).toContain("Cleanup remaining marker count: 0");
    expect(output).toContain("Codex adapter smoke: passed");
  });
});
