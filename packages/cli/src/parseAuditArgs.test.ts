import {
  describe,
  expect,
  it
} from "vitest";

import {
  parseAuditArgs
} from "./parseAuditArgs.js";

describe("parseAuditArgs", () => {
  it("parses repo audit options", () => {
    expect(parseAuditArgs(["repo", "--repo", "../..", "--json"])).toEqual({
      command: {
        kind: "audit",
        scope: "repo",
        repo: "../..",
        format: "json"
      }
    });
  });

  it("parses slice audit evidence and gate options", () => {
    expect(
      parseAuditArgs([
        "slice",
        "--since",
        "origin/main",
        "--repo=../..",
        "--project",
        "project-1",
        "--retrieval-run=retrieval-1",
        "--audit-bundle-id",
        "audit-1",
        "--intended-file",
        "packages/cli/src/parseArgs.ts",
        "--verification",
        "pnpm typecheck=passed",
        "--fail-on",
        "warning",
        "--json"
      ])
    ).toEqual({
      command: {
        kind: "audit",
        scope: "slice",
        repo: "../..",
        since: "origin/main",
        format: "json",
        intendedFiles: ["packages/cli/src/parseArgs.ts"],
        verificationCommands: [{
          command: "pnpm typecheck",
          status: "passed"
        }],
        projectId: "project-1",
        retrievalRunId: "retrieval-1",
        auditBundleId: "audit-1",
        failOn: "warning"
      }
    });
  });

  it("rejects unsupported audit verification statuses", () => {
    expect(parseAuditArgs(["slice", "--since", "HEAD", "--verification", "pnpm test=red"]))
      .toEqual({
        error: "--verification status must be passed, failed, skipped, or missing"
      });
  });
});
