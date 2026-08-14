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
          verificationCommands: [],
          format: "text"
        }
      });
    expect(parsePlanArgs(["--task=review source grounding"])).toEqual({
      command: {
        kind: "plan",
        task: "review source grounding",
        persist: false,
        verificationCommands: [],
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
          verificationCommands: [],
          format: "json"
        }
      });
  });

  it("accepts the explicit SQLite persistence backend", () => {
    expect(parsePlanArgs(["--task", "dogfood", "--persist", "--backend", "sqlite"]))
      .toEqual({
        command: {
          kind: "plan",
          task: "dogfood",
          persist: true,
          backend: "sqlite",
          verificationCommands: [],
          format: "text"
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
          verificationCommands: [],
          format: "text"
        }
      });
    expect(parsePlanArgs([
      "--repo", "../krn-seo", "--project", "project-1", "--task", "review target", "--persist"
    ]).error).toContain("Usage: krn plan");
  });

  it("preserves repeated explicit verification commands", () => {
    expect(parsePlanArgs([
      "--task", "style the page",
      "--verification", "npm run check",
      "--verification=npm run build"
    ])).toEqual({
      command: {
        kind: "plan",
        task: "style the page",
        persist: false,
        verificationCommands: ["npm run check", "npm run build"],
        format: "text"
      }
    });
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
