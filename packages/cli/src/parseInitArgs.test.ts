import {
  describe,
  expect,
  it
} from "vitest";

import {
  parseInitArgs
} from "./parseInitArgs.js";

const initUsage =
  "Usage: krn init --dry-run --repo <path> [--owner-file \"path|root|kind|reason\"]|krn init --connect --repo <path> --persist [--owner-file \"path|root|kind|reason\"]";

describe("parseInitArgs", () => {
  it("parses dry-run init with repo path", () => {
    expect(parseInitArgs(["--dry-run", "--repo", " repo-root "])).toEqual({
      command: {
        kind: "init",
        mode: "dryRun",
        repo: "repo-root"
      }
    });
  });

  it("parses connect init only when persist is explicit", () => {
    expect(parseInitArgs([
      "--connect",
      "--repo=repo-root",
      "--owner-file",
      "src/index.ts|src|implementation_entry|main implementation owner",
      "--owner-file=tests/readiness.test.ts|tests|behavior_test|readiness behavior proof",
      "--persist"
    ])).toEqual({
      command: {
        kind: "init",
        mode: "connect",
        repo: "repo-root",
        persist: true,
        ownerFiles: [
          {
            path: "src/index.ts",
            root: "src",
            kind: "implementation_entry",
            reason: "main implementation owner"
          },
          {
            path: "tests/readiness.test.ts",
            root: "tests",
            kind: "behavior_test",
            reason: "readiness behavior proof"
          }
        ]
      }
    });
  });

  it("rejects unsupported init command shapes", () => {
    expect(parseInitArgs(["--dry-run", "--connect", "--repo", "repo-root"])).toEqual({
      error: initUsage
    });
    expect(parseInitArgs(["--connect", "--repo", "repo-root"])).toEqual({
      error: initUsage
    });
    expect(parseInitArgs(["--dry-run", "--repo", ""])).toEqual({
      error: initUsage
    });
    expect(parseInitArgs(["--dry-run", "--repo", "repo-root", "--unknown"])).toEqual({
      error: initUsage
    });
    expect(parseInitArgs(["--dry-run", "--repo", "repo-root", "--owner-file", "src/index.ts"])).toEqual({
      error: initUsage
    });
    expect(parseInitArgs(["--dry-run", "--repo", "repo-root", "--owner-file", "src/index.ts|src||reason"])).toEqual({
      error: initUsage
    });
  });
});
