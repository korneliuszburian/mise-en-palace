import {
  describe,
  expect,
  it
} from "vitest";

import {
  formatMemoryAntiAddUsage,
  formatMemoryCandidateAddUsage,
  formatMemoryCandidatePromoteUsage,
  formatMemoryCandidateRejectUsage,
  formatMemoryRecordApplyUsage,
  formatMemoryAntiPromoteUsage,
  formatMemoryAntiRejectUsage,
  parseMemoryArgs
} from "./parseMemoryArgs.js";

describe("parseMemoryArgs", () => {
  it("parses memory candidate add options and metadata", () => {
    expect(parseMemoryArgs([
      "candidate",
      "add",
      "--run-id",
      "run-1",
      "--kind",
      "lesson",
      "--content",
      " Memory content ",
      "--confidence",
      "high",
      "--application-guidance",
      "Use when planning",
      "--source-claim-id",
      "claim-1",
      "--source-lineage",
      "lineage-1",
      "--candidate-evidence-provenance",
      "operator_reported",
      "--candidate-evidence-ref",
      "raw-evidence:run-event-1",
      "--candidate-evidence-ref=PLAN.md#P2-00",
      "--candidate-evidence-does-not-prove",
      "This does not prove the candidate is approved Memory Core truth.",
      "--invalidation-rule",
      "revisit after schema changes",
      "--owner",
      "operator",
      "--proposed-by",
      "codex",
      "--metadata",
      "slice=QG-04B",
      "--persist"
    ])).toEqual({
      command: {
        kind: "memoryCandidateAdd",
        persist: true,
        runId: "run-1",
        memoryKind: "lesson",
        content: "Memory content",
        confidence: "high",
        applicationGuidance: "Use when planning",
        sourceClaimId: "claim-1",
        sourceLineageIds: ["lineage-1"],
        candidateEvidenceProvenance: "operator_reported",
        candidateEvidenceRefs: ["raw-evidence:run-event-1", "PLAN.md#P2-00"],
        candidateEvidenceDoesNotProve:
          "This does not prove the candidate is approved Memory Core truth.",
        invalidationRule: "revisit after schema changes",
        owner: "operator",
        proposedBy: "codex",
        metadata: {
          slice: "QG-04B"
        }
      }
    });
  });

  it("parses memory candidate promote and reject commands", () => {
    expect(parseMemoryArgs([
      "candidate",
      "promote",
      "--candidate-id",
      "candidate-1",
      "--reviewer",
      "operator",
      "--decision",
      "accepted",
      "--evidence-reviewed-ref",
      "review-1",
      "--metadata",
      "gate=memory-review",
      "--persist"
    ])).toEqual({
      command: {
        kind: "memoryCandidatePromote",
        persist: true,
        candidateId: "candidate-1",
        reviewer: "operator",
        decision: "accepted",
        evidenceReviewedRef: "review-1",
        metadata: {
          gate: "memory-review"
        }
      }
    });

    expect(parseMemoryArgs([
      "candidate",
      "reject",
      "--candidate-id",
      "candidate-1",
      "--reviewer",
      "operator",
      "--reason",
      "unsupported",
      "--metadata",
      "reason=unsupported",
      "--persist"
    ])).toEqual({
      command: {
        kind: "memoryCandidateReject",
        persist: true,
        candidateId: "candidate-1",
        reviewer: "operator",
        reason: "unsupported",
        metadata: {
          reason: "unsupported"
        }
      }
    });
  });

  it("parses memory record apply and anti-memory add commands", () => {
    expect(parseMemoryArgs([
      "record",
      "apply",
      "--run-id",
      "run-1",
      "--memory-id",
      "memory-1",
      "--outcome",
      "helped",
      "--notes",
      "Useful",
      "--expected-use",
      "planning",
      "--task-contract-id",
      "task-1",
      "--context-assembly-id",
      "context-1",
      "--metadata",
      "result=helped",
      "--persist"
    ])).toEqual({
      command: {
        kind: "memoryRecordApply",
        persist: true,
        runId: "run-1",
        memoryId: "memory-1",
        outcome: "helped",
        notes: "Useful",
        expectedUse: "planning",
        taskContractId: "task-1",
        contextAssemblyId: "context-1",
        metadata: {
          result: "helped"
        }
      }
    });

    expect(parseMemoryArgs([
      "anti",
      "add",
      "--run-id",
      "run-1",
      "--rejected-claim",
      "Bad pattern",
      "--reason",
      "stale",
      "--invalidated-by-source-claim-id",
      "claim-1",
      "--source-lineage",
      "lineage-1",
      "--applies-to",
      "memory-key",
      "--may-revisit-when",
      "2026-07-01",
      "--owner",
      "operator",
      "--proposed-by",
      "codex",
      "--confidence",
      "medium",
      "--key",
      "anti-key",
      "--candidate-evidence-provenance",
      "source_claim",
      "--candidate-evidence-ref",
      "source-claim-1",
      "--candidate-evidence-does-not-prove",
      "This does not prove the anti-memory candidate is reviewed.",
      "--metadata",
      "kind=anti",
      "--persist"
    ])).toEqual({
      command: {
        kind: "memoryAntiAdd",
        persist: true,
        runId: "run-1",
        rejectedClaim: "Bad pattern",
        reason: "stale",
        invalidatedBySourceClaimId: "claim-1",
        sourceLineageIds: ["lineage-1"],
        appliesTo: "memory-key",
        mayRevisitWhen: "2026-07-01",
        owner: "operator",
        proposedBy: "codex",
        confidence: "medium",
        key: "anti-key",
        candidateEvidenceProvenance: "source_claim",
        candidateEvidenceRefs: ["source-claim-1"],
        candidateEvidenceDoesNotProve:
          "This does not prove the anti-memory candidate is reviewed.",
        metadata: {
          kind: "anti"
        }
      }
    });
  });

  it("parses anti-memory candidate promote and reject commands", () => {
    expect(parseMemoryArgs([
      "anti",
      "promote",
      "--candidate-id",
      "anti-candidate-1",
      "--reviewer",
      "operator",
      "--decision",
      "accepted",
      "--evidence-reviewed-ref",
      "source-claim-1",
      "--metadata",
      "gate=anti-memory-review",
      "--persist"
    ])).toEqual({
      command: {
        kind: "memoryAntiPromote",
        persist: true,
        candidateId: "anti-candidate-1",
        reviewer: "operator",
        decision: "accepted",
        evidenceReviewedRef: "source-claim-1",
        metadata: {
          gate: "anti-memory-review"
        }
      }
    });

    expect(parseMemoryArgs([
      "anti",
      "reject",
      "--candidate-id",
      "anti-candidate-1",
      "--reviewer",
      "operator",
      "--reason",
      "unsupported",
      "--persist"
    ])).toEqual({
      command: {
        kind: "memoryAntiReject",
        persist: true,
        candidateId: "anti-candidate-1",
        reviewer: "operator",
        reason: "unsupported",
        metadata: {}
      }
    });
  });

  it("parses memory command help and rejects unsupported shapes", () => {
    expect(parseMemoryArgs(["candidate", "add", "--help"])).toEqual({
      command: {
        kind: "memoryCandidateAddHelp"
      }
    });
    expect(parseMemoryArgs(["candidate", "promote", "-h"])).toEqual({
      command: {
        kind: "memoryCandidatePromoteHelp"
      }
    });
    expect(parseMemoryArgs(["candidate", "reject", "--help"])).toEqual({
      command: {
        kind: "memoryCandidateRejectHelp"
      }
    });
    expect(parseMemoryArgs(["record", "apply", "-h"])).toEqual({
      command: {
        kind: "memoryRecordApplyHelp"
      }
    });
    expect(parseMemoryArgs(["anti", "add", "--help"])).toEqual({
      command: {
        kind: "memoryAntiAddHelp"
      }
    });
    expect(parseMemoryArgs(["anti", "promote", "-h"])).toEqual({
      command: {
        kind: "memoryAntiPromoteHelp"
      }
    });
    expect(parseMemoryArgs(["anti", "reject", "--help"])).toEqual({
      command: {
        kind: "memoryAntiRejectHelp"
      }
    });
    expect(parseMemoryArgs(["candidate", "add", "--metadata", "not-a-pair"])).toEqual({
      error: "--metadata requires key=value"
    });
    expect(parseMemoryArgs(["candidate", "unknown"])).toEqual({
      error: [
        formatMemoryCandidateAddUsage().trim(),
        formatMemoryCandidatePromoteUsage().trim(),
        formatMemoryCandidateRejectUsage().trim(),
        formatMemoryRecordApplyUsage().trim(),
        formatMemoryAntiAddUsage().trim(),
        formatMemoryAntiPromoteUsage().trim(),
        formatMemoryAntiRejectUsage().trim()
      ].join("\n\n")
    });
  });
});
