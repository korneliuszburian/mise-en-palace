import { describe, expect, it } from "vitest";

import {
  parseRunArgs
} from "./parseRunArgs.js";

describe("parseRunArgs", () => {
  it("parses run show with run id", () => {
    expect(parseRunArgs(["show", "--run-id", "run-1"])).toEqual({
      command: {
        kind: "runShow",
        runId: "run-1",
        format: "text"
      }
    });
  });

  it("parses run show json format", () => {
    expect(parseRunArgs(["show", "--run-id", "run-1", "--json"])).toEqual({
      command: {
        kind: "runShow",
        runId: "run-1",
        format: "json"
      }
    });
  });

  it("requires run id", () => {
    expect(parseRunArgs(["show"])).toEqual({
      error: expect.stringContaining("Missing required --run-id")
    });
  });
});
