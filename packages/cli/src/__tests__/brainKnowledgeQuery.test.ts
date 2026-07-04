import { describe, expect, it } from "vitest";

import {
  compactBrainKnowledgeBridgeQueries
} from "../brainKnowledgeQuery.js";

describe("brainKnowledgeQuery", () => {
  it("keeps a bounded dogfood mechanism retry list", () => {
    expect(
      compactBrainKnowledgeBridgeQueries(
        "unknown first retained pattern dogfood evidence feedback"
      )
    ).toEqual([
      "unknown first feedback",
      "unknown first",
      "first feedback"
    ]);
  });

  it("keeps feedback available when it is part of the mechanism", () => {
    expect(compactBrainKnowledgeBridgeQueries("user feedback collection")).toEqual([
      "user feedback",
      "feedback collection"
    ]);
  });

  it("keeps later parser exemplar windows for long planning tasks", () => {
    expect(
      compactBrainKnowledgeBridgeQueries(
        "Improve retained-pattern plan query shaping so long TypeScript parser exemplar metadata-boundary tasks select pattern:ts-boundary-brain-knowledge-parser-exemplar without ranking, schema, or Memory Core changes"
      )
    ).toContain("typescript parser exemplar");
  });
});
