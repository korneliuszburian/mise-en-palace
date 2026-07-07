import { describe, expect, it } from "vitest";

import {
  parseDecisionArgs
} from "../parse-decision-args.js";

describe("parseDecisionArgs", () => {
  it("parses decision packet run id from separated and inline options", () => {
    expect(parseDecisionArgs(["packet", "--run-id", " run-1 ", "--json"])).toEqual({
      command: {
        kind: "decisionPacket",
        runId: "run-1"
      }
    });
    expect(parseDecisionArgs(["packet", "--run-id=run-2"])).toEqual({
      command: {
        kind: "decisionPacket",
        runId: "run-2"
      }
    });
  });

  it("rejects missing and blank run ids with usage", () => {
    expect(parseDecisionArgs(["packet"])).toEqual({
      error: expect.stringContaining("Usage: krn decision packet")
    });
    expect(parseDecisionArgs(["packet", "--run-id", ""])).toEqual({
      error: expect.stringContaining("Usage: krn decision packet")
    });
    expect(parseDecisionArgs(["packet", "--run-id="])).toEqual({
      error: expect.stringContaining("Usage: krn decision packet")
    });
  });
});
