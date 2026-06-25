import { describe, expect, it } from "vitest";

import {
  mapPromptfooJsonlRowsToEvalCandidateProposals,
  mapPromptfooJsonlRowsToGoldenBehaviorProofs
} from "./goldenPromptfooResult.js";

describe("golden Promptfoo result mapping", () => {
  it("maps official Promptfoo JSONL rows into KRN proof records", () => {
    const proofs = mapPromptfooJsonlRowsToGoldenBehaviorProofs({
      rows: [{
        success: true,
        score: 1,
        response: {
          output: "KRN Promptfoo integration smoke case=golden-case-memory-smoke-001 integrationSmoke=passed"
        },
        gradingResult: {
          pass: true,
          score: 1,
          reason: "All assertions passed"
        }
      }],
      caseIdsByRow: ["golden-case-memory-smoke-001"],
      evidenceRef: ".local-lab/promptfoo/krn-golden-smoke-results.jsonl"
    });

    expect(proofs).toEqual([{
      caseId: "golden-case-memory-smoke-001",
      status: "passed",
      provenance: "promptfoo_integration_smoke",
      summary: "Promptfoo row 0 passed with score 1: All assertions passed",
      evidenceRefs: [".local-lab/promptfoo/krn-golden-smoke-results.jsonl"],
      doesNotProve:
        "Promptfoo smoke proves runner/config/provider/result mapping only; it does not execute KRN behavior."
    }]);
  });

  it("keeps failed Promptfoo rows as failed KRN proof records", () => {
    const proofs = mapPromptfooJsonlRowsToGoldenBehaviorProofs({
      rows: [{
        success: false,
        score: 0,
        response: {
          output: "missing protected behavior"
        },
        gradingResult: {
          pass: false,
          score: 0,
          reason: "Expected output to contain case id"
        }
      }],
      caseIdsByRow: ["golden-case-memory-smoke-002"],
      evidenceRef: ".local-lab/promptfoo/krn-golden-smoke-results.jsonl"
    });

    expect(proofs).toEqual([{
      caseId: "golden-case-memory-smoke-002",
      status: "failed",
      provenance: "promptfoo_integration_smoke",
      summary: "Promptfoo row 0 failed with score 0: Expected output to contain case id",
      evidenceRefs: [".local-lab/promptfoo/krn-golden-smoke-results.jsonl"],
      doesNotProve:
        "Promptfoo smoke proves runner/config/provider/result mapping only; it does not execute KRN behavior."
    }]);
  });

  it("rejects malformed Promptfoo rows instead of trusting external result data", () => {
    expect(() =>
      mapPromptfooJsonlRowsToGoldenBehaviorProofs({
        rows: [{
          success: "true",
          score: 1
        }],
        caseIdsByRow: ["golden-case-memory-smoke-001"],
        evidenceRef: ".local-lab/promptfoo/krn-golden-smoke-results.jsonl"
      })
    ).toThrow("Promptfoo row 0 success must be boolean");
  });

  it("maps Promptfoo rows to eval candidate proposals without behavior-proof authority", () => {
    const proposals = mapPromptfooJsonlRowsToEvalCandidateProposals({
      rows: [{
        success: true,
        score: 1,
        gradingResult: {
          reason: "All assertions passed"
        }
      }],
      caseIdsByRow: ["golden-case-memory-smoke-001"],
      evidenceRef: ".local-lab/promptfoo/krn-golden-smoke-results.jsonl",
      createdAt: "2026-06-25T14:30:00.000Z",
      idPrefix: "eval-candidate-test",
      projectId: "project-1"
    });

    expect(proposals).toEqual([{
      id: "eval-candidate-test-1",
      projectId: "project-1",
      status: "candidate",
      title: "Review Promptfoo adapter result for golden-case-memory-smoke-001",
      scenario:
        "Promptfoo integration smoke row 0 for golden-case-memory-smoke-001 passed with score 1.",
      expectedSignal:
        "Use as adapter evidence only; map to a KRN GoldenTask behavior proof only after real KRN behavior execution exists.",
      sourceEvidence: [".local-lab/promptfoo/krn-golden-smoke-results.jsonl"],
      metadata: {
        acceptedAsBehaviorProof: false,
        caseId: "golden-case-memory-smoke-001",
        doesNotProve:
          "Promptfoo smoke proves runner/config/provider/result mapping only; it does not execute KRN behavior.",
        promptfooIntegrationSmoke: true,
        reason: "All assertions passed",
        score: 1,
        status: "passed"
      },
      createdAt: "2026-06-25T14:30:00.000Z"
    }]);
  });
});
