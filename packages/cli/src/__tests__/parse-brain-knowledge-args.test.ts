import { describe, expect, it } from "vitest";

import {
  parseBrainKnowledgeArgs
} from "../parse-brain-knowledge-args.js";

describe("parseBrainKnowledgeArgs", () => {
  it("parses brain knowledge readback preview", () => {
    expect(parseBrainKnowledgeArgs([
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
        kind: "brainKnowledge",
        cardFiles: [
          "tests/fixtures/brain-knowledge/cards/ts-boundary-unknown-first-result-state.json"
        ],
        knowledgeFiles: [],
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
    expect(parseBrainKnowledgeArgs([
      "--card-file",
      "card.json",
      "--json"
    ])).toEqual({
      command: {
        kind: "brainKnowledge",
        cardFiles: ["card.json"],
        knowledgeFiles: [],
        catalogFiles: [],
        storeOnly: false,
        filter: {},
        format: "json"
      }
    });
  });

  it("parses a positive result limit", () => {
    expect(parseBrainKnowledgeArgs([
      "--catalog-file",
      "corpus/brain-knowledge/catalog.json",
      "--usefulness-outcome",
      "helped",
      "--limit",
      "3",
      "--json"
    ])).toEqual({
      command: {
        kind: "brainKnowledge",
        cardFiles: [],
        knowledgeFiles: [],
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
    expect(parseBrainKnowledgeArgs([
      "--catalog-file",
      "corpus/brain-knowledge/catalog.json",
      "--usefulness-outcome",
      "none",
      "--json"
    ])).toEqual({
      command: {
        kind: "brainKnowledge",
        cardFiles: [],
        knowledgeFiles: [],
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
    expect(parseBrainKnowledgeArgs([
      "--catalog-file",
      "corpus/brain-knowledge/catalog.json",
      "--html"
    ])).toEqual({
      command: {
        kind: "brainKnowledge",
        cardFiles: [],
        knowledgeFiles: [],
        catalogFiles: ["corpus/brain-knowledge/catalog.json"],
        storeOnly: false,
        filter: {},
        format: "html"
      }
    });
  });

  it("parses brain knowledge decision files", () => {
    expect(parseBrainKnowledgeArgs([
      "--knowledge-file",
      "corpus/brain-knowledge/knowledge/ts-boundary-unknown-first-result-state.json",
      "--text",
      "unknown-first"
    ])).toEqual({
      command: {
        kind: "brainKnowledge",
        cardFiles: [],
        knowledgeFiles: [
          "corpus/brain-knowledge/knowledge/ts-boundary-unknown-first-result-state.json"
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
    expect(parseBrainKnowledgeArgs([
      "--catalog-file",
      "corpus/brain-knowledge/catalog.json",
      "--text",
      "unknown-first"
    ])).toEqual({
      command: {
        kind: "brainKnowledge",
        cardFiles: [],
        knowledgeFiles: [],
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
    expect(parseBrainKnowledgeArgs([
      "--store-only",
      "--project",
      "project-1",
      "--usefulness-outcome",
      "helped",
      "--json"
    ])).toEqual({
      command: {
        kind: "brainKnowledge",
        cardFiles: [],
        knowledgeFiles: [],
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

  it("defaults to store-backed readback without file sources", () => {
    expect(parseBrainKnowledgeArgs([
      "--text",
      "unknown-first",
      "--json"
    ])).toEqual({
      command: {
        kind: "brainKnowledge",
        cardFiles: [],
        knowledgeFiles: [],
        catalogFiles: [],
        storeOnly: true,
        filter: {
          text: "unknown-first"
        },
        format: "json"
      }
    });
  });

  it("rejects store-only combined with file sources", () => {
    expect(parseBrainKnowledgeArgs([
      "--store-only",
      "--catalog-file",
      "corpus/brain-knowledge/catalog.json"
    ])).toEqual({
      error: expect.stringContaining("--store-only cannot be combined")
    });
  });

  it("rejects unknown filters", () => {
    expect(parseBrainKnowledgeArgs([
      "--card-file",
      "card.json",
      "--kind",
      "everything"
    ])).toEqual({
      error: expect.stringContaining("Unsupported brain knowledge kind: everything")
    });
  });

  it("rejects unknown usefulness outcome filters", () => {
    expect(parseBrainKnowledgeArgs([
      "--card-file",
      "card.json",
      "--usefulness-outcome",
      "maybe"
    ])).toEqual({
      error: expect.stringContaining("Unsupported brain knowledge usefulness outcome: maybe")
    });
  });

  it("rejects unknown status filters", () => {
    expect(parseBrainKnowledgeArgs([
      "--card-file",
      "card.json",
      "--status",
      "draft"
    ])).toEqual({
      error: expect.stringContaining("Unsupported brain knowledge status: draft")
    });
  });

  it("rejects invalid result limits", () => {
    for (const limit of ["0", "-1", "1.5", "many"]) {
      expect(parseBrainKnowledgeArgs([
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
