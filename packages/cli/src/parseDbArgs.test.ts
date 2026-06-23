import {
  describe,
  expect,
  it
} from "vitest";

import {
  parseDbArgs
} from "./parseDbArgs.js";

describe("parseDbArgs", () => {
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
      error: [
        "Usage: krn db readiness|smoke",
        "[harness-plan|harness-evidence|source-graph|memory-governance|retrieval-substrate|activation|codex-adapter|worker-jobs|init-connect|target-repo-harness]"
      ].join(" ")
    });
  });
});
