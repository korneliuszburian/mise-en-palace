import { describe, expect, it } from "vitest";
import { parseArgs } from "../parse-args.js";

describe("krn packet diff arguments", () => {
  it("parses the JSON-only packet comparison command", () => {
    expect(parseArgs([
      "packet",
      "diff",
      "--before-run",
      "before-run",
      "--after-run",
      "after-run",
      "--json"
    ])).toEqual({
      command: {
        kind: "packetDiff",
        beforeRun: "before-run",
        afterRun: "after-run"
      }
    });
  });

  it("requires both run IDs and JSON output", () => {
    expect(parseArgs(["packet", "diff", "--before-run", "before-run"])).toEqual({
      error: "Usage: krn packet diff --before-run <run-id> --after-run <run-id> --json\n"
    });
  });
});
