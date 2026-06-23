import {
  describe,
  expect,
  it
} from "vitest";

import {
  parseEvidenceArgs
} from "./parseEvidenceArgs.js";

const evidenceUsage = "Usage: krn evidence capture [--run-id <id>] [--persist]";

describe("parseEvidenceArgs", () => {
  it("parses evidence capture preview", () => {
    expect(parseEvidenceArgs(["capture"])).toEqual({
      command: {
        kind: "evidenceCapture",
        persist: false
      }
    });
  });

  it("parses evidence capture persist with a run id", () => {
    expect(parseEvidenceArgs(["capture", "--run-id= run-1 ", "--persist"])).toEqual({
      command: {
        kind: "evidenceCapture",
        persist: true,
        runId: "run-1"
      }
    });
  });

  it("rejects unsupported evidence command shapes", () => {
    expect(parseEvidenceArgs([])).toEqual({
      error: evidenceUsage
    });
    expect(parseEvidenceArgs(["show"])).toEqual({
      error: evidenceUsage
    });
    expect(parseEvidenceArgs(["capture", "--unknown"])).toEqual({
      error: evidenceUsage
    });
  });
});
