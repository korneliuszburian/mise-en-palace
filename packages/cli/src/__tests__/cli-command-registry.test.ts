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

  it("formats registered help without the legacy help map", () => {
    expect(isRegisteredHelpCommandKind("runShowHelp")).toBe(true);
    expect(isRegisteredHelpCommandKind("dbHelp")).toBe(false);
    expect(formatRegisteredCommandHelp("runShowHelp")).toContain(
      "Usage: krn run show --run-id <execution-run-id> [--json]"
    );
  });
});
