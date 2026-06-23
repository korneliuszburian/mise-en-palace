import {
  describe,
  expect,
  it
} from "vitest";

import {
  parseReflectArgs
} from "./parseReflectArgs.js";

const reflectUsage = "Usage: krn reflect --scope run:<id>|project:<id>|topic:<name> [--project <id>] [--persist]";
const topicUsage = "Usage: krn reflect --scope topic:<name> --project <id> [--persist]";

describe("parseReflectArgs", () => {
  it("parses run and project reflection scopes", () => {
    expect(parseReflectArgs(["--scope", " run:run-1 "])).toEqual({
      command: {
        kind: "reflect",
        scope: {
          kind: "run",
          id: "run-1"
        },
        persist: false
      }
    });
    expect(parseReflectArgs(["--scope=project:project-1", "--persist"])).toEqual({
      command: {
        kind: "reflect",
        scope: {
          kind: "project",
          id: "project-1"
        },
        persist: true
      }
    });
  });

  it("parses topic reflection scope only with explicit project", () => {
    expect(parseReflectArgs(["--scope=topic:memory", "--project", " project-1 ", "--persist"]))
      .toEqual({
        command: {
          kind: "reflect",
          scope: {
            kind: "topic",
            name: "memory",
            projectId: "project-1"
          },
          persist: true
        }
      });
  });

  it("rejects unsupported reflection command shapes", () => {
    expect(parseReflectArgs([])).toEqual({
      error: reflectUsage
    });
    expect(parseReflectArgs(["--scope", "run:"])).toEqual({
      error: reflectUsage
    });
    expect(parseReflectArgs(["--scope", "topic:memory"])).toEqual({
      error: topicUsage
    });
    expect(parseReflectArgs(["--scope", "unknown:memory"])).toEqual({
      error: reflectUsage
    });
    expect(parseReflectArgs(["--scope", "run:run-1", "--unknown"])).toEqual({
      error: reflectUsage
    });
  });
});
