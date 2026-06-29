import {
  describe,
  expect,
  it
} from "vitest";

import {
  formatSourceArtifactPreviewUsage,
  formatSourceClaimEdgesUsage,
  formatSourceClaimRejectUsage,
  parseSourceArgs
} from "./parseSourceArgs.js";

describe("parseSourceArgs", () => {
  it("parses source artifact preview options", () => {
    expect(parseSourceArgs([
      "artifact",
      "preview",
      "--file",
      " docs/KRN_KERNEL.md ",
      "--chunk-lines",
      "12",
      "--limit-chunks=2",
      "--extract-candidates",
      "--claim",
      "KRN should keep proof boundaries.",
      "--mechanism",
      "Preview output separates evidence from source truth.",
      "--krn-implication",
      "Use preview as candidate evidence only.",
      "--does-not-prove",
      "This does not prove source truth.",
      "--support-type",
      "implementation-boundary",
      "--trust-tier",
      "source-code",
      "--consumer",
      "ingest v0",
      "--falsifier",
      "Preview creates persisted source truth.",
      "--graph-edge-to-source-claim-id",
      "target-claim-1",
      "--graph-edge-kind",
      "narrows",
      "--graph-edge-consumer",
      "graph brain v0",
      "--graph-edge-does-not-prove",
      "This edge candidate does not prove temporal truth.",
      "--graph-edge-evidence-ref",
      "source.md:1-2",
      "--graph-edge-source-decision-ref",
      "decision-1",
      "--graph-edge-scope",
      "local preview",
      "--persist"
    ])).toEqual({
      command: {
        kind: "sourceArtifactPreview",
        persist: true,
        extractCandidates: true,
        file: "docs/KRN_KERNEL.md",
        chunkLines: 12,
        limitChunks: 2,
        claim: "KRN should keep proof boundaries.",
        mechanism: "Preview output separates evidence from source truth.",
        krnImplication: "Use preview as candidate evidence only.",
        doesNotProve: "This does not prove source truth.",
        supportType: "implementation-boundary",
        trustTier: "source-code",
        consumer: "ingest v0",
        falsifier: "Preview creates persisted source truth.",
        graphEdgeToSourceClaimId: "target-claim-1",
        graphEdgeKind: "narrows",
        graphEdgeConsumer: "graph brain v0",
        graphEdgeDoesNotProve: "This edge candidate does not prove temporal truth.",
        graphEdgeEvidenceRef: "source.md:1-2",
        graphEdgeSourceDecisionRef: "decision-1",
        graphEdgeScope: "local preview"
      }
    });
  });

  it("parses reviewed extraction claim candidate bridge options", () => {
    expect(parseSourceArgs([
      "artifact",
      "preview",
      "--file",
      "docs/KRN_KERNEL.md",
      "--extract-candidates",
      "--persist",
      "--reviewed-extraction-claim-candidate-id",
      "claim-candidate:2:krn-should-keep-proof-boundaries",
      "--mechanism",
      "Reviewed extraction candidate keeps source range lineage.",
      "--krn-implication",
      "Use selected extraction candidates as reviewed SourceClaim inputs.",
      "--does-not-prove",
      "This does not prove extracted claim truth.",
      "--support-type",
      "implementation-boundary",
      "--trust-tier",
      "source-code",
      "--consumer",
      "graph brain v0",
      "--falsifier",
      "Deferred extraction candidates can be persisted."
    ])).toEqual({
      command: {
        kind: "sourceArtifactPreview",
        persist: true,
        extractCandidates: true,
        file: "docs/KRN_KERNEL.md",
        reviewedExtractionClaimCandidateId: "claim-candidate:2:krn-should-keep-proof-boundaries",
        mechanism: "Reviewed extraction candidate keeps source range lineage.",
        krnImplication: "Use selected extraction candidates as reviewed SourceClaim inputs.",
        doesNotProve: "This does not prove extracted claim truth.",
        supportType: "implementation-boundary",
        trustTier: "source-code",
        consumer: "graph brain v0",
        falsifier: "Deferred extraction candidates can be persisted."
      }
    });
  });

  it("rejects reviewed extraction claim candidate bridge without required review boundary", () => {
    expect(parseSourceArgs([
      "artifact",
      "preview",
      "--file",
      "source.md",
      "--reviewed-extraction-claim-candidate-id",
      "claim-candidate:1:source"
    ])).toEqual({
      error: "--reviewed-extraction-claim-candidate-id requires --extract-candidates"
    });

    expect(parseSourceArgs([
      "artifact",
      "preview",
      "--file",
      "source.md",
      "--extract-candidates",
      "--reviewed-extraction-claim-candidate-id",
      "claim-candidate:1:source"
    ])).toEqual({
      error: "--reviewed-extraction-claim-candidate-id requires --persist"
    });

    expect(parseSourceArgs([
      "artifact",
      "preview",
      "--file",
      "source.md",
      "--extract-candidates",
      "--persist",
      "--reviewed-extraction-claim-candidate-id",
      "claim-candidate:1:source",
      "--claim",
      "Manual claim"
    ])).toEqual({
      error: "--reviewed-extraction-claim-candidate-id cannot be combined with --claim"
    });
  });

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

  it("parses source claim edge readback options", () => {
    expect(parseSourceArgs([
      "claim",
      "edges",
      "--source-claim-id",
      " source-claim-1 "
    ])).toEqual({
      command: {
        kind: "sourceClaimEdges",
        sourceClaimId: "source-claim-1"
      }
    });

    expect(parseSourceArgs([
      "claim",
      "edges",
      "--source-claim-id=source-claim-2"
    ])).toEqual({
      command: {
        kind: "sourceClaimEdges",
        sourceClaimId: "source-claim-2"
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
    expect(parseSourceArgs(["claim", "edges", "--help"])).toEqual({
      command: {
        kind: "sourceClaimEdgesHelp"
      }
    });
    expect(parseSourceArgs(["decision", "link", "--help"])).toEqual({
      command: {
        kind: "sourceDecisionLinkHelp"
      }
    });
    expect(parseSourceArgs(["artifact", "preview", "--help"])).toEqual({
      command: {
        kind: "sourceArtifactPreviewHelp"
      }
    });
    expect(parseSourceArgs(["artifact", "preview", "--file", ""])).toEqual({
      error: "--file requires a non-empty path"
    });
    expect(parseSourceArgs(["artifact", "preview", "--file", "README.md", "--chunk-lines", "0"])).toEqual({
      error: "--chunk-lines must be a positive integer"
    });
    expect(parseSourceArgs(["artifact", "preview", "--file", "README.md", "--graph-edge-kind", "same_as"])).toEqual({
      error: "Unsupported --graph-edge-kind: same_as"
    });
    expect(parseSourceArgs(["claim", "add", "--metadata", "not-a-pair"])).toEqual({
      error: "--metadata requires key=value"
    });
    expect(parseSourceArgs(["claim", "edges", "--source-claim-id", ""])).toEqual({
      error: "--source-claim-id requires a non-empty id"
    });
    expect(parseSourceArgs(["claim", "edges", "--unknown"])).toEqual({
      error: formatSourceClaimEdgesUsage()
    });
    expect(parseSourceArgs(["claim", "unknown"])).toEqual({
      error: formatSourceArtifactPreviewUsage()
    });
    expect(parseSourceArgs(["claim", "reject", "--unknown"])).toEqual({
      error: formatSourceClaimRejectUsage()
    });
  });
});
