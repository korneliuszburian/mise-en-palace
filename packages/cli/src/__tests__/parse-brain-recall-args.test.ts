import { describe, expect, it } from "vitest";

import {
  parseBrainRecallArgs
} from "../parse-brain-recall-args.js";

describe("parseBrainRecallArgs", () => {
  it("parses brain recall readback preview", () => {
    expect(parseBrainRecallArgs([
      "--fixture-read-model-file",
      "tests/fixtures/brain-knowledge/readModels/ts-boundary-unknown-first-result-state.json",
      "--kind",
      "procedure",
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
          kind: "procedure",
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
      "--fixture-read-model-file",
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
      "--fixture-catalog-file",
      "tests/fixtures/brain-knowledge/corpus/catalog.json",
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
        catalogFiles: ["tests/fixtures/brain-knowledge/corpus/catalog.json"],
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
      "--fixture-catalog-file",
      "tests/fixtures/brain-knowledge/corpus/catalog.json",
      "--usefulness-outcome",
      "none",
      "--json"
    ])).toEqual({
      command: {
        kind: "brainRecall",
        readModelFiles: [],
        decisionFiles: [],
        catalogFiles: ["tests/fixtures/brain-knowledge/corpus/catalog.json"],
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
      "--fixture-catalog-file",
      "tests/fixtures/brain-knowledge/corpus/catalog.json",
      "--html"
    ])).toEqual({
      command: {
        kind: "brainRecall",
        readModelFiles: [],
        decisionFiles: [],
        catalogFiles: ["tests/fixtures/brain-knowledge/corpus/catalog.json"],
        storeOnly: false,
        filter: {},
        format: "html"
      }
    });
  });

  it("parses knowledge decision files", () => {
    expect(parseBrainRecallArgs([
      "--fixture-decision-file",
      "tests/fixtures/brain-knowledge/corpus/knowledge/ts-boundary-unknown-first-result-state.json",
      "--text",
      "unknown-first"
    ])).toEqual({
      command: {
        kind: "brainRecall",
        readModelFiles: [],
        decisionFiles: [
          "tests/fixtures/brain-knowledge/corpus/knowledge/ts-boundary-unknown-first-result-state.json"
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
      "--fixture-catalog-file",
      "tests/fixtures/brain-knowledge/corpus/catalog.json",
      "--text",
      "unknown-first"
    ])).toEqual({
      command: {
        kind: "brainRecall",
        readModelFiles: [],
        decisionFiles: [],
        catalogFiles: ["tests/fixtures/brain-knowledge/corpus/catalog.json"],
        storeOnly: false,
        filter: {
          text: "unknown-first"
        },
        format: "text"
      }
    });
  });

  it("parses project-scoped store-backed readback without file sources", () => {
    expect(parseBrainRecallArgs([
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

  it("rejects legacy file and redundant store-only flags", () => {
    for (const flag of ["--catalog-file", "--store-only"]) {
      expect(parseBrainRecallArgs([
        flag,
        ...(flag === "--catalog-file" ? ["tests/fixtures/brain-knowledge/corpus/catalog.json"] : [])
      ])).toEqual({
        error: expect.stringContaining(`Unsupported brain recall argument: ${flag}`)
      });
    }
  });

  it("rejects unknown filters", () => {
    expect(parseBrainRecallArgs([
      "--fixture-read-model-file",
      "readModel.json",
      "--kind",
      "everything"
    ])).toEqual({
      error: expect.stringContaining("Unsupported brain recall kind: everything")
    });
  });

  it("rejects unknown usefulness outcome filters", () => {
    expect(parseBrainRecallArgs([
      "--fixture-read-model-file",
      "readModel.json",
      "--usefulness-outcome",
      "maybe"
    ])).toEqual({
      error: expect.stringContaining("Unsupported brain recall usefulness outcome: maybe")
    });
  });

  it("rejects unknown status filters", () => {
    expect(parseBrainRecallArgs([
      "--fixture-read-model-file",
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
        "--fixture-read-model-file",
        "readModel.json",
        "--limit",
        limit
      ])).toEqual({
        error: expect.stringContaining(`Unsupported brain recall limit: ${limit}`)
      });
    }
  });
});
