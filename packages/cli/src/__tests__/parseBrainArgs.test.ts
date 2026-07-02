import { describe, expect, it } from "vitest";

import {
  parseBrainArgs
} from "../parseBrainArgs.js";

describe("parseBrainArgs", () => {
  it("parses brain search preview args", () => {
    expect(parseBrainArgs([
      "search",
      "--query",
      "source-to-decision",
      "--catalog-file",
      "docs/brain-knowledge/catalog.json",
      "--limit",
      "5",
      "--max-inclusions",
      "3",
      "--json"
    ])).toEqual({
      command: {
        kind: "brainSearch",
        query: "source-to-decision",
        catalogFiles: ["docs/brain-knowledge/catalog.json"],
        storeOnly: false,
        limit: 5,
        maxInclusions: 3,
        format: "json"
      }
    });
  });

  it("parses store-only brain search", () => {
    expect(parseBrainArgs([
      "search",
      "--query",
      "source-to-decision",
      "--store-only",
      "--json"
    ])).toEqual({
      command: {
        kind: "brainSearch",
        query: "source-to-decision",
        catalogFiles: [],
        storeOnly: true,
        format: "json"
      }
    });
  });

  it("rejects store-only with catalog files", () => {
    const result = parseBrainArgs([
      "search",
      "--query",
      "source-to-decision",
      "--store-only",
      "--catalog-file",
      "docs/brain-knowledge/catalog.json"
    ]);

    expect(result.error).toContain("--store-only cannot be combined with --catalog-file");
  });

  it("requires a query", () => {
    const result = parseBrainArgs(["search", "--limit", "5"]);

    expect(result.error).toContain("Missing required --query");
  });

  it("rejects unsupported limits", () => {
    const result = parseBrainArgs(["search", "--query", "x", "--limit", "0"]);

    expect(result.error).toContain("Unsupported brain search limit: 0");
  });
});
