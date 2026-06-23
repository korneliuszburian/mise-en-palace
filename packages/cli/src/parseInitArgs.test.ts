import {
  describe,
  expect,
  it
} from "vitest";

import {
  parseInitArgs
} from "./parseInitArgs.js";

const initUsage = "Usage: krn init --dry-run --repo <path>|krn init --connect --repo <path> --persist";

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
    expect(parseInitArgs(["--connect", "--repo=repo-root", "--persist"])).toEqual({
      command: {
        kind: "init",
        mode: "connect",
        repo: "repo-root",
        persist: true
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
  });
});
