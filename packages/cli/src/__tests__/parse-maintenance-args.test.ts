import {
  describe,
  expect,
  it
} from "vitest";

import {
  parseMaintenanceArgs
} from "../parse-maintenance-args.js";

describe("parseMaintenanceArgs", () => {
  it("parses maintenance preview options", () => {
    expect(parseMaintenanceArgs([
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
      "docs/readbacks/memory-search.json",
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
        kind: "maintenancePreview",
        projectId: "project-1",
        memoryLimit: 5,
        sourceClaimLimit: 7,
        nearExpiryDays: 3,
        maxCandidates: 4,
        evidenceRef: "docs/report.md",
        candidateKinds: ["knowledge_acquisition", "consensus_evaluation"],
        acquisitionReadbackFile: "docs/readbacks/memory-search.json",
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
    expect(parseMaintenanceArgs(["preview"])).toEqual({
      command: {
        kind: "maintenancePreview",
        format: "text"
      }
    });
  });

  it("rejects invalid numeric options", () => {
    expect(parseMaintenanceArgs(["preview", "--max-candidates", "0"])).toEqual({
      error: expect.stringContaining("--max-candidates must be a positive integer")
    });
  });

  it("rejects empty project", () => {
    expect(parseMaintenanceArgs(["preview", "--project", " "])).toEqual({
      error: expect.stringContaining("--project cannot be empty")
    });
  });

  it("rejects empty acquisition readback file", () => {
    expect(parseMaintenanceArgs([
      "preview",
      "--acquisition-readback-file",
      " "
    ])).toEqual({
      error: expect.stringContaining("--acquisition-readback-file cannot be empty")
    });
  });

  it("rejects empty consensus candidate file", () => {
    expect(parseMaintenanceArgs([
      "preview",
      "--consensus-candidate-file",
      " "
    ])).toEqual({
      error: expect.stringContaining("--consensus-candidate-file cannot be empty")
    });
  });

  it("rejects unknown candidate kind", () => {
    expect(parseMaintenanceArgs([
      "preview",
      "--candidate-kind",
      "all"
    ])).toEqual({
      error: expect.stringContaining("--candidate-kind must be")
    });
  });

  it("requires complete candidate review input", () => {
    expect(parseMaintenanceArgs([
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
    expect(parseMaintenanceArgs([
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

  it("parses explicit maintenance queue record execution", () => {
    expect(parseMaintenanceArgs(["run", "--id", "maintenance-queue-1"])).toEqual({
      command: {
        kind: "maintenanceRun",
        id: "maintenance-queue-1"
      }
    });
  });

  it("parses explicit stale maintenance record recovery", () => {
    expect(parseMaintenanceArgs([
      "recover",
      "--id",
      "maintenance-queue-1",
      "--locked-before",
      "2026-07-09T12:00:00.000Z"
    ])).toEqual({
      command: {
        kind: "maintenanceRecover",
        id: "maintenance-queue-1",
        lockedBefore: "2026-07-09T12:00:00.000Z"
      }
    });
  });

  it("rejects empty maintenance queue record ids", () => {
    expect(parseMaintenanceArgs(["run", "--id", " "])).toEqual({
      error: expect.stringContaining("--id cannot be empty")
    });
  });

  it("requires stale recovery cutoff", () => {
    expect(parseMaintenanceArgs(["recover", "--id", "maintenance-queue-1"])).toEqual({
      error: expect.stringContaining("--locked-before")
    });
  });

  it("rejects invalid stale recovery cutoff", () => {
    expect(parseMaintenanceArgs([
      "recover",
      "--id",
      "maintenance-queue-1",
      "--locked-before",
      "not-a-date"
    ])).toEqual({
      error: expect.stringContaining("--locked-before must be an ISO timestamp")
    });
  });
});
