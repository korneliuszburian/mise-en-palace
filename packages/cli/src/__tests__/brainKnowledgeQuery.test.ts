import { describe, expect, it } from "vitest";

import {
  compactBrainKnowledgeBridgeQueries
} from "../brainKnowledgeQuery.js";

describe("brainKnowledgeQuery", () => {
  it("drops dogfood feedback task language from retained-pattern mechanism queries", () => {
    expect(
      compactBrainKnowledgeBridgeQueries(
        "unknown first retained pattern dogfood evidence feedback"
      )
    ).toContain("unknown first");
  });
});
