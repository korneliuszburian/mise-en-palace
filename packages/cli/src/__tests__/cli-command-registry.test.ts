import {
  describe,
  expect,
  it
} from "vitest";

import {
  formatRegisteredCommandHelp,
  isRegisteredHelpCommandKind,
  parseRegisteredTopLevelCommand
} from "../cli-command-registry.js";

describe("cliCommandRegistry", () => {
  it("parses run show through the registered command boundary", () => {
    expect(parseRegisteredTopLevelCommand("run", ["show", "--run-id", "run-1"])).toEqual({
      command: {
        kind: "runShow",
        runId: "run-1",
        format: "text"
      }
    });
    expect(parseRegisteredTopLevelCommand("plan", [])).toBeUndefined();
  });

  it("parses paired-live eval evidence through the registered command boundary", () => {
    expect(parseRegisteredTopLevelCommand("run", [
      "eval-evidence",
      "--project-id",
      "project-1",
      "--run-id",
      "run-1",
      "--outcome",
      "win",
      "--usefulness-outcome",
      "helped",
      "--limit",
      "25",
      "--json"
    ])).toEqual({
      command: {
        kind: "runEvalEvidence",
        projectId: "project-1",
        runId: "run-1",
        outcome: "win",
        usefulnessOutcome: "helped",
        limit: 25,
        format: "json"
      }
    });
  });

  it("formats registered help without the legacy help map", () => {
    expect(isRegisteredHelpCommandKind("runShowHelp")).toBe(true);
    expect(isRegisteredHelpCommandKind("dbHelp")).toBe(false);
    expect(formatRegisteredCommandHelp("runShowHelp")).toContain(
      "krn run eval-evidence --project-id <project-id>"
    );
  });
});
