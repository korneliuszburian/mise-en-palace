import { describe, expect, it } from "vitest";

import {
  parseKnowledgeArgs
} from "./parseKnowledgeArgs.js";

describe("parseKnowledgeArgs", () => {
  it("parses knowledge cards readback preview", () => {
    expect(parseKnowledgeArgs([
      "cards",
      "--card-file",
      "tests/fixtures/brain-knowledge/cards/ts-boundary-unknown-first-result-state.json",
      "--kind",
      "pattern",
      "--status",
      "active",
      "--reviewability",
      "ready",
      "--text",
      "unknown-first"
    ])).toEqual({
      command: {
        kind: "knowledgeCards",
        cardFiles: [
          "tests/fixtures/brain-knowledge/cards/ts-boundary-unknown-first-result-state.json"
        ],
        patternFiles: [],
        catalogFiles: [],
        filter: {
          kind: "pattern",
          status: "active",
          reviewability: "ready",
          text: "unknown-first"
        },
        format: "text"
      }
    });
  });

  it("parses json format", () => {
    expect(parseKnowledgeArgs([
      "cards",
      "--card-file",
      "card.json",
      "--json"
    ])).toEqual({
      command: {
        kind: "knowledgeCards",
        cardFiles: ["card.json"],
        patternFiles: [],
        catalogFiles: [],
        filter: {},
        format: "json"
      }
    });
  });

  it("parses retained pattern files", () => {
    expect(parseKnowledgeArgs([
      "cards",
      "--pattern-file",
      "docs/patterns/retained-patterns/ts-boundary-unknown-first-result-state.json",
      "--text",
      "unknown-first"
    ])).toEqual({
      command: {
        kind: "knowledgeCards",
        cardFiles: [],
        patternFiles: [
          "docs/patterns/retained-patterns/ts-boundary-unknown-first-result-state.json"
        ],
        catalogFiles: [],
        filter: {
          text: "unknown-first"
        },
        format: "text"
      }
    });
  });

  it("parses catalog files", () => {
    expect(parseKnowledgeArgs([
      "cards",
      "--catalog-file",
      "docs/brain-knowledge/catalog.json",
      "--text",
      "unknown-first"
    ])).toEqual({
      command: {
        kind: "knowledgeCards",
        cardFiles: [],
        patternFiles: [],
        catalogFiles: ["docs/brain-knowledge/catalog.json"],
        filter: {
          text: "unknown-first"
        },
        format: "text"
      }
    });
  });

  it("requires a card file", () => {
    expect(parseKnowledgeArgs(["cards"])).toEqual({
      error: expect.stringContaining("Missing required --card-file, --pattern-file, or --catalog-file")
    });
  });

  it("rejects unknown filters", () => {
    expect(parseKnowledgeArgs([
      "cards",
      "--card-file",
      "card.json",
      "--kind",
      "everything"
    ])).toEqual({
      error: expect.stringContaining("Unsupported knowledge kind: everything")
    });
  });
});
