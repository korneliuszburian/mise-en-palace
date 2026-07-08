import { describe, expect, it } from "vitest";

import {
  parseBrainRecallArgs
} from "../parse-brain-recall-args.js";

describe("parseBrainRecallArgs", () => {
  it("parses brain recall readback preview", () => {
    expect(parseBrainRecallArgs([
      "--read-model-file",
      "tests/fixtures/brain-knowledge/readModels/ts-boundary-unknown-first-result-state.json",
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
        kind: "brainRecall",
        readModelFiles: [
          "tests/fixtures/brain-knowledge/readModels/ts-boundary-unknown-first-result-state.json"
        ],
        decisionFiles: [],
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
    expect(parseBrainRecallArgs([
      "--read-model-file",
      "readModel.json",
      "--json"
    ])).toEqual({
      command: {
        kind: "brainRecall",
        readModelFiles: ["readModel.json"],
        decisionFiles: [],
        catalogFiles: [],
        storeOnly: false,
        filter: {},
        format: "json"
      }
    });
  });

  it("parses a positive result limit", () => {
    expect(parseBrainRecallArgs([
      "--catalog-file",
      "corpus/brain-knowledge/catalog.json",
      "--usefulness-outcome",
      "helped",
      "--limit",
      "3",
      "--json"
    ])).toEqual({
      command: {
        kind: "brainRecall",
        readModelFiles: [],
        decisionFiles: [],
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
    expect(parseBrainRecallArgs([
      "--catalog-file",
      "corpus/brain-knowledge/catalog.json",
      "--usefulness-outcome",
      "none",
      "--json"
    ])).toEqual({
      command: {
        kind: "brainRecall",
        readModelFiles: [],
        decisionFiles: [],
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
    expect(parseBrainRecallArgs([
      "--catalog-file",
      "corpus/brain-knowledge/catalog.json",
      "--html"
    ])).toEqual({
      command: {
        kind: "brainRecall",
        readModelFiles: [],
        decisionFiles: [],
        catalogFiles: ["corpus/brain-knowledge/catalog.json"],
        storeOnly: false,
        filter: {},
        format: "html"
      }
    });
  });

  it("parses knowledge decision files", () => {
    expect(parseBrainRecallArgs([
      "--decision-file",
      "corpus/brain-knowledge/knowledge/ts-boundary-unknown-first-result-state.json",
      "--text",
      "unknown-first"
    ])).toEqual({
      command: {
        kind: "brainRecall",
        readModelFiles: [],
        decisionFiles: [
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
    expect(parseBrainRecallArgs([
      "--catalog-file",
      "corpus/brain-knowledge/catalog.json",
      "--text",
      "unknown-first"
    ])).toEqual({
      command: {
        kind: "brainRecall",
        readModelFiles: [],
        decisionFiles: [],
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
    expect(parseBrainRecallArgs([
      "--store-only",
      "--project",
      "project-1",
      "--usefulness-outcome",
      "helped",
      "--json"
    ])).toEqual({
      command: {
        kind: "brainRecall",
        readModelFiles: [],
        decisionFiles: [],
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
    expect(parseBrainRecallArgs([
      "--text",
      "unknown-first",
      "--json"
    ])).toEqual({
      command: {
        kind: "brainRecall",
        readModelFiles: [],
        decisionFiles: [],
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
    expect(parseBrainRecallArgs([
      "--store-only",
      "--catalog-file",
      "corpus/brain-knowledge/catalog.json"
    ])).toEqual({
      error: expect.stringContaining("--store-only cannot be combined")
    });
  });

  it("rejects unknown filters", () => {
    expect(parseBrainRecallArgs([
      "--read-model-file",
      "readModel.json",
      "--kind",
      "everything"
    ])).toEqual({
      error: expect.stringContaining("Unsupported brain recall kind: everything")
    });
  });

  it("rejects unknown usefulness outcome filters", () => {
    expect(parseBrainRecallArgs([
      "--read-model-file",
      "readModel.json",
      "--usefulness-outcome",
      "maybe"
    ])).toEqual({
      error: expect.stringContaining("Unsupported brain recall usefulness outcome: maybe")
    });
  });

  it("rejects unknown status filters", () => {
    expect(parseBrainRecallArgs([
      "--read-model-file",
      "readModel.json",
      "--status",
      "draft"
    ])).toEqual({
      error: expect.stringContaining("Unsupported brain recall status: draft")
    });
  });

  it("rejects invalid result limits", () => {
    for (const limit of ["0", "-1", "1.5", "many"]) {
      expect(parseBrainRecallArgs([
        "--read-model-file",
        "readModel.json",
        "--limit",
        limit
      ])).toEqual({
        error: expect.stringContaining(`Unsupported brain recall limit: ${limit}`)
      });
    }
  });
});
