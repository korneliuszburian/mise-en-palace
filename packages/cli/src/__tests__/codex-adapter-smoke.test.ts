import { describe, expect, it } from "vitest";

import {
  formatCodexAdapterSmokeReport
} from "../codex-adapter-smoke.js";

describe("codexAdapterSmoke", () => {
  it("formats bounded Codex adapter smoke proof", () => {
    const output = formatCodexAdapterSmokeReport({
      workspaceSlug: "krn-codex-adapter-smoke-1",
      executionRunId: "execution-run-1",
      contextAssemblyId: "context-assembly-1",
      boundaryChecks: [
        "persisted-readback",
        "rendered-contract",
        "bounded-selected-context",
        "stale-memory-exclusion",
        "hook-phases",
        "no-codex-invocation"
      ],
      codexInvocationCount: 0,
      remainingMarkerCount: 0,
      cleanedUp: true
    });

    expect(output).toContain("KRN Codex Adapter Smoke");
    expect(output).toContain("Execution run: execution-run-1");
    expect(output).toContain("Context assembly: context-assembly-1");
    expect(output).toContain(
      "Boundary checks: persisted-readback, rendered-contract, bounded-selected-context, stale-memory-exclusion, hook-phases, no-codex-invocation"
    );
    expect(output).toContain("Codex invocations: 0");
    expect(output).toContain("Cleanup remaining marker count: 0");
    expect(output).toContain("Codex adapter smoke: passed");
  });
});
