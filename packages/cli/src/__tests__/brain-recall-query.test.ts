import { describe, expect, it } from "vitest";

import {
  compactBrainRecallBridgeQueries
} from "../brain-recall-query.js";

describe("brainRecallQuery", () => {
  it("keeps a bounded dogfood mechanism retry list", () => {
    expect(
      compactBrainRecallBridgeQueries(
        "unknown first brain recall dogfood evidence feedback"
      )
    ).toEqual([
      "unknown first brain recall",
      "unknown first brain",
      "first brain recall",
      "brain recall feedback",
      "unknown first",
      "first brain",
      "brain recall",
      "recall feedback"
    ]);
  });

  it("keeps feedback available when it is part of the mechanism", () => {
    expect(compactBrainRecallBridgeQueries("user feedback collection")).toEqual([
      "user feedback",
      "feedback collection"
    ]);
  });

  it("keeps later parser exemplar windows for long planning tasks", () => {
    expect(
      compactBrainRecallBridgeQueries(
        "Improve knowledge plan query shaping so long TypeScript parser exemplar metadata-boundary tasks select knowledge:ts-boundary-knowledge-parser-exemplar without ranking, schema, or Memory Core changes"
      )
    ).toContain("typescript parser exemplar");
  });
});
