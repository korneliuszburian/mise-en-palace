import { describe, expect, it } from "vitest";

import {
  parseAgentArgs
} from "../parse-agent-args.js";

describe("parseAgentArgs", () => {
  it("parses agent packet run id from separated and inline options", () => {
    expect(parseAgentArgs(["packet", "--run-id", " run-1 ", "--json"])).toEqual({
      command: {
        kind: "agentPacket",
        runId: "run-1"
      }
    });
    expect(parseAgentArgs(["packet", "--run-id=run-2"])).toEqual({
      command: {
        kind: "agentPacket",
        runId: "run-2"
      }
    });
  });

  it("rejects missing and blank run ids with usage", () => {
    expect(parseAgentArgs(["packet"])).toEqual({
      error: expect.stringContaining("Usage: krn agent packet")
    });
    expect(parseAgentArgs(["packet", "--run-id", ""])).toEqual({
      error: expect.stringContaining("Usage: krn agent packet")
    });
    expect(parseAgentArgs(["packet", "--run-id="])).toEqual({
      error: expect.stringContaining("Usage: krn agent packet")
    });
  });
});
