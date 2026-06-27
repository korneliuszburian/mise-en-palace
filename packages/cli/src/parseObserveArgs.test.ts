import {
  describe,
  expect,
  it
} from "vitest";

import {
  parseObserveArgs
} from "./parseObserveArgs.js";

const observeUsage = "Usage: krn observe --run <id>|--run-id <id> [--project <id>] [--persist]";

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

  it("accepts --run-id as an alias for the observed execution run", () => {
    expect(parseObserveArgs(["--run-id", " run-1 "])).toEqual({
      command: {
        kind: "observeRun",
        runId: "run-1",
        persist: false
      }
    });
    expect(parseObserveArgs(["--run-id=run-2", "--persist"])).toEqual({
      command: {
        kind: "observeRun",
        runId: "run-2",
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
