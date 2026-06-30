import {
  describe,
  expect,
  it
} from "vitest";

import {
  parseHeartbeatArgs
} from "./parseHeartbeatArgs.js";

describe("parseHeartbeatArgs", () => {
  it("parses heartbeat preview options", () => {
    expect(parseHeartbeatArgs([
      "preview",
      "--project",
      "project-1",
      "--memory-limit",
      "5",
      "--source-claim-limit",
      "7",
      "--near-expiry-days",
      "3",
      "--max-candidates",
      "4",
      "--evidence-ref",
      "docs/report.md",
      "--json"
    ])).toEqual({
      command: {
        kind: "heartbeatPreview",
        projectId: "project-1",
        memoryLimit: 5,
        sourceClaimLimit: 7,
        nearExpiryDays: 3,
        maxCandidates: 4,
        evidenceRef: "docs/report.md",
        format: "json"
      }
    });
  });

  it("defaults to text preview", () => {
    expect(parseHeartbeatArgs(["preview"])).toEqual({
      command: {
        kind: "heartbeatPreview",
        format: "text"
      }
    });
  });

  it("rejects invalid numeric options", () => {
    expect(parseHeartbeatArgs(["preview", "--max-candidates", "0"])).toEqual({
      error: expect.stringContaining("--max-candidates must be a positive integer")
    });
  });

  it("rejects empty project", () => {
    expect(parseHeartbeatArgs(["preview", "--project", " "])).toEqual({
      error: expect.stringContaining("--project cannot be empty")
    });
  });
});
