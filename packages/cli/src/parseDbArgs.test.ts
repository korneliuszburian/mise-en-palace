import {
  describe,
  expect,
  it
} from "vitest";

import {
  formatDbUsage,
  parseDbArgs
} from "./parseDbArgs.js";

describe("parseDbArgs", () => {
  it("parses db help", () => {
    expect(parseDbArgs(["--help"])).toEqual({
      command: {
        kind: "dbHelp"
      }
    });
  });

  it("parses db readiness", () => {
    expect(parseDbArgs(["readiness"])).toEqual({
      command: {
        kind: "dbReadiness"
      }
    });
  });

  it("parses default and named db smoke targets", () => {
    expect(parseDbArgs(["smoke"])).toEqual({
      command: {
        kind: "dbSmoke",
        target: "project"
      }
    });
    expect(parseDbArgs(["smoke", "target-repo-harness"])).toEqual({
      command: {
        kind: "dbSmoke",
        target: "targetRepoHarness"
      }
    });
  });

  it("rejects unsupported db command shapes", () => {
    expect(parseDbArgs(["smoke", "unknown"])).toEqual({
      error: formatDbUsage()
    });
  });
});
