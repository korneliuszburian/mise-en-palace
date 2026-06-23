import {
  describe,
  expect,
  it
} from "vitest";

import {
  parseCodexArgs
} from "./parseCodexArgs.js";

const codexUsage = "Usage: krn codex brief --run-id <id>";

describe("parseCodexArgs", () => {
  it("parses codex brief with run id", () => {
    expect(parseCodexArgs(["brief", "--run-id", " run-1 "])).toEqual({
      command: {
        kind: "codexBrief",
        runId: "run-1"
      }
    });
    expect(parseCodexArgs(["brief", "--run-id=run-2"])).toEqual({
      command: {
        kind: "codexBrief",
        runId: "run-2"
      }
    });
  });

  it("rejects unsupported codex command shapes", () => {
    expect(parseCodexArgs([])).toEqual({
      error: codexUsage
    });
    expect(parseCodexArgs(["brief"])).toEqual({
      error: codexUsage
    });
    expect(parseCodexArgs(["brief", "--run-id", ""])).toEqual({
      error: codexUsage
    });
    expect(parseCodexArgs(["brief", "--run-id", "run-1", "--unknown"])).toEqual({
      error: codexUsage
    });
  });
});
