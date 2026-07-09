import { describe, expect, it } from "vitest";

import {
  parseBrainArgs
} from "../parse-brain-args.js";

describe("parseBrainArgs", () => {
  it("parses store-backed memory search args", () => {
    expect(parseBrainArgs([
      "search",
      "--query",
      "source-to-decision",
      "--limit",
      "5",
      "--max-inclusions",
      "3",
      "--json"
    ])).toEqual({
      command: {
        kind: "brainSearch",
        query: "source-to-decision",
        catalogFiles: [],
        storeOnly: true,
        limit: 5,
        maxInclusions: 3,
        format: "json"
      }
    });
  });

  it("parses project-scoped memory search", () => {
    expect(parseBrainArgs([
      "search",
      "--query",
      "source-to-decision",
      "--project",
      "project-explicit",
      "--json"
    ])).toEqual({
      command: {
        kind: "brainSearch",
        query: "source-to-decision",
        catalogFiles: [],
        storeOnly: true,
        projectId: "project-explicit",
        format: "json"
      }
    });
  });

  it("defaults memory search to store-backed memory readback", () => {
    expect(parseBrainArgs([
      "search",
      "--query",
      "source-to-decision"
    ])).toEqual({
      command: {
        kind: "brainSearch",
        query: "source-to-decision",
        catalogFiles: [],
        storeOnly: true,
        format: "text"
      }
    });
  });

  it("rejects an empty memory search project id", () => {
    const result = parseBrainArgs([
      "search",
      "--query",
      "source-to-decision",
      "--project",
      ""
    ]);

    expect(result.error).toContain("--project requires a non-empty project id");
  });

  it("rejects legacy catalog files in memory search", () => {
    const result = parseBrainArgs([
      "search",
      "--query",
      "source-to-decision",
      "--catalog-file",
      "tests/fixtures/brain-knowledge/corpus/catalog.json"
    ]);

    expect(result.error).toContain("Unsupported memory search argument: --catalog-file");
  });

  it("rejects redundant store-only in memory search", () => {
    const result = parseBrainArgs([
      "search",
      "--query",
      "source-to-decision",
      "--store-only"
    ]);

    expect(result.error).toContain("Unsupported memory search argument: --store-only");
  });

  it("requires a query", () => {
    const result = parseBrainArgs(["search", "--limit", "5"]);

    expect(result.error).toContain("Missing required --query");
  });

  it("rejects unsupported limits", () => {
    const result = parseBrainArgs(["search", "--query", "x", "--limit", "0"]);

    expect(result.error).toContain("Unsupported memory search limit: 0");
  });
});
