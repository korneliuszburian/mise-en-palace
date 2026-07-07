import { describe, expect, it } from "vitest";

import {
  parseKnowledgeArgs
} from "../parse-knowledge-args.js";

describe("parseKnowledgeArgs", () => {
  it("parses brain knowledge readback preview", () => {
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
      "--usefulness-outcome",
      "helped",
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
        storeOnly: false,
        filter: {
          kind: "pattern",
          status: "active",
          reviewability: "ready",
          usefulnessOutcome: "helped",
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
        storeOnly: false,
        filter: {},
        format: "json"
      }
    });
  });

  it("parses a positive result limit", () => {
    expect(parseKnowledgeArgs([
      "cards",
      "--catalog-file",
      "corpus/brain-knowledge/catalog.json",
      "--usefulness-outcome",
      "helped",
      "--limit",
      "3",
      "--json"
    ])).toEqual({
      command: {
        kind: "knowledgeCards",
        cardFiles: [],
        patternFiles: [],
        catalogFiles: ["corpus/brain-knowledge/catalog.json"],
        storeOnly: false,
        filter: {
          usefulnessOutcome: "helped"
        },
        format: "json",
        limit: 3
      }
    });
  });

  it("parses missing usefulness feedback filter", () => {
    expect(parseKnowledgeArgs([
      "cards",
      "--catalog-file",
      "corpus/brain-knowledge/catalog.json",
      "--usefulness-outcome",
      "none",
      "--json"
    ])).toEqual({
      command: {
        kind: "knowledgeCards",
        cardFiles: [],
        patternFiles: [],
        catalogFiles: ["corpus/brain-knowledge/catalog.json"],
        storeOnly: false,
        filter: {
          usefulnessOutcome: "none"
        },
        format: "json"
      }
    });
  });

  it("parses html format", () => {
    expect(parseKnowledgeArgs([
      "cards",
      "--catalog-file",
      "corpus/brain-knowledge/catalog.json",
      "--html"
    ])).toEqual({
      command: {
        kind: "knowledgeCards",
        cardFiles: [],
        patternFiles: [],
        catalogFiles: ["corpus/brain-knowledge/catalog.json"],
        storeOnly: false,
        filter: {},
        format: "html"
      }
    });
  });

  it("parses retained pattern files", () => {
    expect(parseKnowledgeArgs([
      "cards",
      "--pattern-file",
      "corpus/brain-knowledge/patterns/ts-boundary-unknown-first-result-state.json",
      "--text",
      "unknown-first"
    ])).toEqual({
      command: {
        kind: "knowledgeCards",
        cardFiles: [],
        patternFiles: [
          "corpus/brain-knowledge/patterns/ts-boundary-unknown-first-result-state.json"
        ],
        catalogFiles: [],
        storeOnly: false,
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
      "corpus/brain-knowledge/catalog.json",
      "--text",
      "unknown-first"
    ])).toEqual({
      command: {
        kind: "knowledgeCards",
        cardFiles: [],
        patternFiles: [],
        catalogFiles: ["corpus/brain-knowledge/catalog.json"],
        storeOnly: false,
        filter: {
          text: "unknown-first"
        },
        format: "text"
      }
    });
  });

  it("parses store-only readback without file sources", () => {
    expect(parseKnowledgeArgs([
      "cards",
      "--store-only",
      "--project",
      "project-1",
      "--usefulness-outcome",
      "helped",
      "--json"
    ])).toEqual({
      command: {
        kind: "knowledgeCards",
        cardFiles: [],
        patternFiles: [],
        catalogFiles: [],
        storeOnly: true,
        projectId: "project-1",
        filter: {
          usefulnessOutcome: "helped"
        },
        format: "json"
      }
    });
  });

  it("requires a file source unless store-only is explicit", () => {
    expect(parseKnowledgeArgs(["cards"])).toEqual({
      error: expect.stringContaining("Missing required --card-file, --pattern-file, or --catalog-file")
    });
  });

  it("rejects store-only combined with file sources", () => {
    expect(parseKnowledgeArgs([
      "cards",
      "--store-only",
      "--catalog-file",
      "corpus/brain-knowledge/catalog.json"
    ])).toEqual({
      error: expect.stringContaining("--store-only cannot be combined")
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

  it("rejects unknown usefulness outcome filters", () => {
    expect(parseKnowledgeArgs([
      "cards",
      "--card-file",
      "card.json",
      "--usefulness-outcome",
      "maybe"
    ])).toEqual({
      error: expect.stringContaining("Unsupported knowledge usefulness outcome: maybe")
    });
  });

  it("rejects unknown status filters", () => {
    expect(parseKnowledgeArgs([
      "cards",
      "--card-file",
      "card.json",
      "--status",
      "draft"
    ])).toEqual({
      error: expect.stringContaining("Unsupported knowledge status: draft")
    });
  });

  it("rejects invalid result limits", () => {
    for (const limit of ["0", "-1", "1.5", "many"]) {
      expect(parseKnowledgeArgs([
        "cards",
        "--card-file",
        "card.json",
        "--limit",
        limit
      ])).toEqual({
        error: expect.stringContaining(`Unsupported brain knowledge limit: ${limit}`)
      });
    }
  });
});
