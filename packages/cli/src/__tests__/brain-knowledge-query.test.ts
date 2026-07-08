import { describe, expect, it } from "vitest";

import {
  compactBrainKnowledgeBridgeQueries
} from "../brain-knowledge-query.js";

describe("brainKnowledgeQuery", () => {
  it("keeps a bounded dogfood mechanism retry list", () => {
    expect(
      compactBrainKnowledgeBridgeQueries(
        "unknown first brain knowledge dogfood evidence feedback"
      )
    ).toEqual([
      "unknown first brain knowledge",
      "unknown first brain",
      "first brain knowledge",
      "brain knowledge feedback",
      "unknown first",
      "first brain",
      "brain knowledge",
      "knowledge feedback"
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
        "Improve knowledge plan query shaping so long TypeScript parser exemplar metadata-boundary tasks select pattern:ts-boundary-knowledge-parser-exemplar without ranking, schema, or Memory Core changes"
      )
    ).toContain("typescript parser exemplar");
  });
});
