import {
  describe,
  expect,
  it
} from "vitest";

import {
  formatDbUsage,
  parseDbArgs
} from "../parse-db-args.js";

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
    expect(parseDbArgs(["smoke", "brain-loop"])).toEqual({
      command: {
        kind: "dbSmoke",
        target: "brainLoop"
      }
    });
    expect(parseDbArgs(["smoke", "brain-search"])).toEqual({
      command: {
        kind: "dbSmoke",
        target: "brainSearch"
      }
    });
    expect(parseDbArgs(["smoke", "run-show"])).toEqual({
      command: {
        kind: "dbSmoke",
        target: "runShow"
      }
    });
    expect(parseDbArgs(["smoke", "maintenance-boundary"])).toEqual({
      command: {
        kind: "dbSmoke",
        target: "maintenanceBoundary"
      }
    });
    expect(parseDbArgs(["smoke", "decision-corpus-import"])).toEqual({
      command: {
        kind: "dbSmoke",
        target: "decisionCorpusImport"
      }
    });
    expect(parseDbArgs(["smoke", "real-recall-advantage"])).toEqual({
      command: {
        kind: "dbSmoke",
        target: "realRecallAdvantage"
      }
    });
    expect(parseDbArgs(["smoke", "agent-packet-return-loop"])).toEqual({
      command: {
        kind: "dbSmoke",
        target: "agentPacketReturnLoop"
      }
    });
  });

  it("rejects unsupported db command shapes", () => {
    expect(parseDbArgs(["smoke", "unknown"])).toEqual({
      error: formatDbUsage()
    });
  });
});
