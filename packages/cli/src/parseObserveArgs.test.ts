import {
  describe,
  expect,
  it
} from "vitest";

import {
  parseObserveArgs
} from "./parseObserveArgs.js";

const observeUsage = "Usage: krn observe --run <id> [--project <id>] [--persist]";

describe("parseObserveArgs", () => {
  it("parses observe run preview", () => {
    expect(parseObserveArgs(["--run", " run-1 "])).toEqual({
      command: {
        kind: "observeRun",
        runId: "run-1",
        persist: false
      }
    });
  });

  it("parses persisted observe run with project scope", () => {
    expect(parseObserveArgs(["--run=run-1", "--project", " project-1 ", "--persist"])).toEqual({
      command: {
        kind: "observeRun",
        runId: "run-1",
        projectId: "project-1",
        persist: true
      }
    });
  });

  it("rejects unsupported observe command shapes", () => {
    expect(parseObserveArgs([])).toEqual({
      error: observeUsage
    });
    expect(parseObserveArgs(["--run", ""])).toEqual({
      error: observeUsage
    });
    expect(parseObserveArgs(["--project", "project-1"])).toEqual({
      error: observeUsage
    });
    expect(parseObserveArgs(["--run", "run-1", "--unknown"])).toEqual({
      error: observeUsage
    });
  });
});
