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
      "--candidate-kind",
      "knowledge_acquisition",
      "--candidate-kind",
      "consensus_evaluation",
      "--acquisition-readback-file",
      "docs/readbacks/brain-search.json",
      "--consensus-candidate-file",
      "docs/readbacks/consensus-candidates.json",
      "--review-candidate-id",
      "candidate-1",
      "--review-decision",
      "defer_pending_evidence",
      "--review-reason",
      "Relation evidence refs are empty.",
      "--review-evidence-ref",
      "docs/review.md",
      "--reviewer",
      "operator",
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
        candidateKinds: ["knowledge_acquisition", "consensus_evaluation"],
        acquisitionReadbackFile: "docs/readbacks/brain-search.json",
        consensusCandidateFile: "docs/readbacks/consensus-candidates.json",
        candidateReview: {
          candidateId: "candidate-1",
          decision: "defer_pending_evidence",
          reason: "Relation evidence refs are empty.",
          evidenceRef: "docs/review.md",
          reviewer: "operator"
        },
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

  it("rejects empty acquisition readback file", () => {
    expect(parseHeartbeatArgs([
      "preview",
      "--acquisition-readback-file",
      " "
    ])).toEqual({
      error: expect.stringContaining("--acquisition-readback-file cannot be empty")
    });
  });

  it("rejects empty consensus candidate file", () => {
    expect(parseHeartbeatArgs([
      "preview",
      "--consensus-candidate-file",
      " "
    ])).toEqual({
      error: expect.stringContaining("--consensus-candidate-file cannot be empty")
    });
  });

  it("rejects unknown candidate kind", () => {
    expect(parseHeartbeatArgs([
      "preview",
      "--candidate-kind",
      "all"
    ])).toEqual({
      error: expect.stringContaining("--candidate-kind must be")
    });
  });

  it("requires complete candidate review input", () => {
    expect(parseHeartbeatArgs([
      "preview",
      "--review-candidate-id",
      "candidate-1",
      "--review-decision",
      "defer_pending_evidence"
    ])).toEqual({
      error: expect.stringContaining("--review-reason")
    });
  });

  it("rejects unknown candidate review decisions", () => {
    expect(parseHeartbeatArgs([
      "preview",
      "--review-candidate-id",
      "candidate-1",
      "--review-decision",
      "promote_now",
      "--review-reason",
      "invalid",
      "--review-evidence-ref",
      "docs/review.md"
    ])).toEqual({
      error: expect.stringContaining("--review-decision must be")
    });
  });
});
