import { describe, expect, it } from "vitest";

import { parseHarnessCompileInput } from "../parsing/harness-compile.js";

describe("parseHarnessCompileInput", () => {
  it("normalizes omitted verification commands to an empty list", () => {
    expect(parseHarnessCompileInput({
      operatorIntent: {
        rawIntent: "style the page",
        source: "cli",
        metadata: {}
      },
      metadata: {}
    }).verificationCommands).toEqual([]);
  });
});
