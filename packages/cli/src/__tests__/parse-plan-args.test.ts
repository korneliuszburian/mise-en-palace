import {
  describe,
  expect,
  it
} from "vitest";

import {
  parsePlanArgs
} from "../parse-plan-args.js";

describe("parsePlanArgs", () => {
  it("parses plan task with optional project and persist", () => {
    expect(parsePlanArgs(["--project", " project-1 ", "--task", " improve memory ", "--persist"]))
      .toEqual({
        command: {
          kind: "plan",
          task: "improve memory",
          projectId: "project-1",
          persist: true,
          format: "text"
        }
      });
    expect(parsePlanArgs(["--task=review source grounding"])).toEqual({
      command: {
        kind: "plan",
        task: "review source grounding",
        persist: false,
        format: "text"
      }
    });
  });

  it("selects machine-readable plan output explicitly", () => {
    expect(parsePlanArgs(["--task", "handoff to Codex", "--persist", "--json"]))
      .toEqual({
        command: {
          kind: "plan",
          task: "handoff to Codex",
          persist: true,
          format: "json"
        }
      });
  });

  it("parses an explicit target repo and rejects competing project identity", () => {
    expect(parsePlanArgs(["--repo", " ../krn-seo ", "--task", "review target", "--persist"]))
      .toEqual({
        command: {
          kind: "plan",
          repo: "../krn-seo",
          task: "review target",
          persist: true,
          format: "text"
        }
      });
    expect(parsePlanArgs([
      "--repo", "../krn-seo", "--project", "project-1", "--task", "review target", "--persist"
    ]).error).toContain("Usage: krn plan");
  });
  it("rejects plan commands without a task or with unsupported options", () => {
    expect(parsePlanArgs([]).error).toContain("Usage: krn plan");
    expect(parsePlanArgs(["--task", ""]).error).toContain("Usage: krn plan");
    expect(parsePlanArgs(["--task", "--persist"]).error).toContain("Usage: krn plan");
    expect(parsePlanArgs(["--task="]).error).toContain("Usage: krn plan");
    expect(parsePlanArgs(["--task", "work", "--unknown"]).error).toContain("Usage: krn plan");
  });

  it("rejects blank or flag-shaped project ids", () => {
    expect(parsePlanArgs(["--project", "", "--task", "work"]).error)
      .toContain("Usage: krn plan");
    expect(parsePlanArgs(["--project", "--persist", "--task", "work"]).error)
      .toContain("Usage: krn plan");
    expect(parsePlanArgs(["--project=", "--task", "work"]).error)
      .toContain("Usage: krn plan");
  });
});
