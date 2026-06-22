import { describe, expect, it } from "vitest";
import type {
  EvidenceContract
} from "@krn/harness";

import {
  codexHookPhases
} from "./contracts.js";
import {
  createCodexHookExpectationProjection,
  createCodexHookExpectations,
  renderHookExpectationProjection,
  renderHookExpectations
} from "./renderHookExpectations.js";

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
      command: "pnpm lint",
      required: false
    }
  ],
  diffRisk: "medium",
  reviewBurden: "Review the hook projection text.",
  rollbackPath: "Revert the hook projection commit.",
  metadata: {}
};

describe("renderHookExpectations", () => {
  it("projects all M26.04 hook phases without script authority", () => {
    const projection = createCodexHookExpectationProjection(evidenceContract);

    expect(projection.title).toBe("KRN Codex Hook Expectation Projection");
    expect(projection.expectations.map((expectation) => expectation.phase)).toEqual(
      codexHookPhases
    );
    expect(projection.rules).toEqual([
      "only expectations/projections",
      "no hidden semantic decisions",
      "no actual hook scripts unless already conventional and decision-recorded"
    ]);
    expect(projection.doesNotDo).toEqual([
      "create hook scripts",
      "execute hooks",
      "make hidden semantic decisions",
      "invoke Codex",
      "mutate memory"
    ]);

    expect(projection.expectations.find((item) => item.phase === "SessionStart")).toMatchObject({
      action: "inject_pointer",
      required: false,
      appliesTo: ["compact project pointer", "execution run pointer"]
    });
    expect(projection.expectations.find((item) => item.phase === "PreToolUse")).toMatchObject({
      action: "warn_or_deny",
      required: true,
      appliesTo: [
        "destructive paths",
        "generated files",
        "destructive/write approval",
        "tool boundary notes"
      ]
    });
    expect(projection.expectations.find((item) => item.phase === "PostToolUse")).toMatchObject({
      action: "record_signal",
      required: true,
      appliesTo: [
        "command evidence: pnpm typecheck",
        "command evidence: pnpm test",
        "failure signal",
        "success signal"
      ]
    });
    expect(projection.expectations.find((item) => item.phase === "PreCompact")).toMatchObject({
      action: "require_handoff",
      required: true,
      appliesTo: ["compact handoff pointer"]
    });
    expect(projection.expectations.find((item) => item.phase === "Stop")).toMatchObject({
      action: "suggest_evidence_capture",
      required: true,
      appliesTo: ["evidence capture suggestion"]
    });
  });

  it("renders the projection and keeps the legacy helper projection-backed", () => {
    const projection = createCodexHookExpectationProjection(evidenceContract);
    const rendered = renderHookExpectationProjection(projection).join("\n");

    expect(rendered).toContain("KRN Codex Hook Expectation Projection");
    expect(rendered).toContain(
      "SessionStart | action=inject_pointer | required=false | applies_to=compact project pointer, execution run pointer"
    );
    expect(rendered).toContain("Rules:");
    expect(rendered).toContain(
      "- no actual hook scripts unless already conventional and decision-recorded"
    );
    expect(rendered).toContain("Does Not Do:");
    expect(rendered).toContain("- make hidden semantic decisions");
    expect(createCodexHookExpectations(evidenceContract)).toEqual(projection.expectations);
    expect(renderHookExpectations(evidenceContract)).toEqual(
      renderHookExpectationProjection(projection)
    );
  });
});
