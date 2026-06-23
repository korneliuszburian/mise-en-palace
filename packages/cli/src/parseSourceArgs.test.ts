import {
  describe,
  expect,
  it
} from "vitest";

import {
  formatSourceClaimAddUsage,
  formatSourceClaimRejectUsage,
  parseSourceArgs
} from "./parseSourceArgs.js";

describe("parseSourceArgs", () => {
  it("parses source claim add options and metadata", () => {
    expect(parseSourceArgs([
      "claim",
      "add",
      "--title",
      " Source title ",
      "--claim=Important claim",
      "--mechanism",
      "Mechanism",
      "--does-not-prove",
      "Not proof",
      "--support-type",
      "implementation-boundary",
      "--trust-tier",
      "project-decision",
      "--consumer",
      "krn",
      "--uri",
      "https://example.test/source",
      "--type",
      "blog",
      "--run-id",
      "run-1",
      "--falsifier",
      "fails if stale",
      "--revisit-when",
      "2026-07-01",
      "--krn-implication",
      "Use it carefully",
      "--metadata",
      "slice=QG-04B",
      "--persist"
    ])).toEqual({
      command: {
        kind: "sourceClaimAdd",
        persist: true,
        title: "Source title",
        claim: "Important claim",
        mechanism: "Mechanism",
        doesNotProve: "Not proof",
        supportType: "implementation-boundary",
        trustTier: "project-decision",
        consumer: "krn",
        uri: "https://example.test/source",
        type: "blog",
        runId: "run-1",
        falsifier: "fails if stale",
        revisitWhen: "2026-07-01",
        krnImplication: "Use it carefully",
        metadata: {
          slice: "QG-04B"
        }
      }
    });
  });

  it("parses source claim reject and source decision link", () => {
    expect(parseSourceArgs([
      "claim",
      "reject",
      "--title",
      "Decorative source",
      "--attempted-claim",
      "This proves everything",
      "--rejected-because",
      "decorative",
      "--reason",
      "No mechanism",
      "--does-not-prove",
      "It does not prove product behavior",
      "--consumer",
      "review",
      "--run-id",
      "run-1",
      "--source-artifact-id",
      "artifact-1",
      "--source-claim-id",
      "claim-1",
      "--metadata=kind=rejection",
      "--persist"
    ])).toEqual({
      command: {
        kind: "sourceClaimReject",
        persist: true,
        title: "Decorative source",
        attemptedClaim: "This proves everything",
        rejectedBecause: "decorative",
        reason: "No mechanism",
        doesNotProve: "It does not prove product behavior",
        consumer: "review",
        runId: "run-1",
        sourceArtifactId: "artifact-1",
        sourceClaimId: "claim-1",
        metadata: {
          kind: "rejection"
        }
      }
    });

    expect(parseSourceArgs([
      "decision",
      "link",
      "--source-claim-id",
      "claim-1",
      "--target-type",
      "harness_run",
      "--target-id",
      "run-1",
      "--support-type",
      "implementation-boundary",
      "--confidence",
      "medium",
      "--notes",
      "Decision note",
      "--metadata",
      "reviewed=true",
      "--persist"
    ])).toEqual({
      command: {
        kind: "sourceDecisionLink",
        persist: true,
        sourceClaimId: "claim-1",
        targetType: "harness_run",
        targetId: "run-1",
        supportType: "implementation-boundary",
        confidence: "medium",
        notes: "Decision note",
        metadata: {
          reviewed: "true"
        }
      }
    });
  });

  it("parses source command help and rejects unsupported shapes", () => {
    expect(parseSourceArgs(["claim", "add", "--help"])).toEqual({
      command: {
        kind: "sourceClaimAddHelp"
      }
    });
    expect(parseSourceArgs(["claim", "reject", "-h"])).toEqual({
      command: {
        kind: "sourceClaimRejectHelp"
      }
    });
    expect(parseSourceArgs(["decision", "link", "--help"])).toEqual({
      command: {
        kind: "sourceDecisionLinkHelp"
      }
    });
    expect(parseSourceArgs(["claim", "add", "--metadata", "not-a-pair"])).toEqual({
      error: "--metadata requires key=value"
    });
    expect(parseSourceArgs(["claim", "unknown"])).toEqual({
      error: formatSourceClaimAddUsage()
    });
    expect(parseSourceArgs(["claim", "reject", "--unknown"])).toEqual({
      error: formatSourceClaimRejectUsage()
    });
  });
});
