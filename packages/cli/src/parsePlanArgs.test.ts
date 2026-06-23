import {
  describe,
  expect,
  it
} from "vitest";

import {
  parsePlanArgs
} from "./parsePlanArgs.js";

describe("parsePlanArgs", () => {
  it("parses plan task with optional project and persist", () => {
    expect(parsePlanArgs(["--project", " project-1 ", "--task", " improve memory ", "--persist"]))
      .toEqual({
        command: {
          kind: "plan",
          task: "improve memory",
          projectId: "project-1",
          persist: true
        }
      });
    expect(parsePlanArgs(["--task=review source grounding"])).toEqual({
      command: {
        kind: "plan",
        task: "review source grounding",
        persist: false
      }
    });
  });

  it("rejects plan commands without a task or with unsupported options", () => {
    expect(parsePlanArgs([]).error).toContain("Usage: krn plan");
    expect(parsePlanArgs(["--task", ""]).error).toContain("Usage: krn plan");
    expect(parsePlanArgs(["--task", "work", "--unknown"]).error).toContain("Usage: krn plan");
  });
});
