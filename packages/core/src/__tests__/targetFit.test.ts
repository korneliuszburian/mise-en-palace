import {
  classifyTargetFit,
  genericOnlyTargetFitSummary,
  parseTargetFitSummary,
  summarizeTargetFit
} from "../targetFit.js";
import {
  describe,
  expect,
  it
} from "vitest";

describe("target fit", () => {
  it("classifies target-specific, generic, adjacent, and noisy text", () => {
    expect(classifyTargetFit({
      query: "EKOLOGUS target fit",
      text: "EKOLOGUS project source decision"
    }).targetFit).toBe("target_specific");
    expect(classifyTargetFit({
      query: "specific adapter behavior",
      text: "consumer falsifier proof boundary"
    }).targetFit).toBe("generic_guardrail");
    expect(classifyTargetFit({
      query: "specific adapter behavior",
      text: "source graph relation readback"
    }).targetFit).toBe("adjacent_pattern");
    expect(classifyTargetFit({
      query: "specific adapter behavior",
      text: "unrelated wording"
    }).targetFit).toBe("noise");
  });

  it("summarizes selected knowledge target fit", () => {
    expect(summarizeTargetFit([]).verdict).toBe("no_selected_knowledge");
    expect(summarizeTargetFit([
      { targetFit: "generic_guardrail" }
    ])).toMatchObject({
      verdict: "generic_only_selected_knowledge",
      genericGuardrail: 1
    });
    expect(summarizeTargetFit([
      { targetFit: "target_specific" },
      { targetFit: "generic_guardrail" }
    ])).toMatchObject({
      verdict: "target_specific_selected_knowledge",
      targetSpecific: 1
    });
  });

  it("parses target fit summaries from unknown readback", () => {
    const summary = {
      verdict: "generic_only_selected_knowledge",
      targetSpecific: 0,
      genericGuardrail: 1,
      adjacentPattern: 0,
      noise: 0,
      unknown: 0,
      recommendedUse: "Use source evidence first.",
      doesNotProve: "Does not prove target-specific context."
    };

    expect(parseTargetFitSummary(summary)).toEqual(summary);
    expect(genericOnlyTargetFitSummary(summary)).toEqual(summary);
    expect(parseTargetFitSummary({
      ...summary,
      targetSpecific: "0"
    })).toBeUndefined();
  });
});
