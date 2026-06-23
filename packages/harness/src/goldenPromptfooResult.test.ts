import { describe, expect, it } from "vitest";

import {
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
});
