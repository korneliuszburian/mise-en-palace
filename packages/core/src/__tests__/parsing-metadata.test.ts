import { describe, expect, test } from "vitest";
import { ZodError } from "zod";

import {
  parseEvidenceCaptureInput,
  parseMemoryCandidateInput,
  parseRetrievalCandidateInput,
  parseSourceClaimInput,
  parseTaskContractInput
} from "../parsing/index.js";

const expectPrivateReasoningMetadataRejection = (parse: () => unknown): void => {
  expect(parse).toThrow(ZodError);

  try {
    parse();
  } catch (error: unknown) {
    expect(error).toBeInstanceOf(ZodError);
    const zodError = error as ZodError;

    expect(zodError.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        message: "public metadata cannot store private reasoning",
        path: ["metadata", "privateReasoning"]
      })
    ]));
  }
};

describe("public parser metadata boundaries", () => {
  test("reject decorative source support at public source claim boundaries", () => {
    expect(() => parseSourceClaimInput({
      claim: "Background links are not decision authority.",
      mechanism: "Background material has no direct KRN behavior implication.",
      krnImplication: "SourceClaim input must keep decorative context out of decision authority.",
      doesNotProve: "This does not prove source truth.",
      sourceAuthority: "project-decision",
      supportType: "background",
      consumer: "source claim parser",
      falsifier: "A public source claim accepts background as decision support.",
      metadata: {}
    })).toThrow(ZodError);
  });

  test("reject private reasoning metadata by default", () => {
    const metadata = {
      privateReasoning: "do not persist model-private reasoning"
    };

    expectPrivateReasoningMetadataRejection(() => parseMemoryCandidateInput({
      executionRunId: "execution-run-1",
      proposedBy: "codex",
      kind: "procedure",
      summary: "Use unknown-first parsing at public boundaries.",
      body: "External JSON enters as unknown and is parsed before domain use.",
      owner: "kernel",
      confidence: 90,
      applicationGuidance: "Use for parser boundary repairs.",
      invalidationRule: "A parser trusts metadata without validation.",
      sourceClaimIds: ["source-claim-1"],
      metadata
    }));

    expectPrivateReasoningMetadataRejection(() => parseSourceClaimInput({
      claim: "Public metadata must not persist private reasoning.",
      mechanism: "Private reasoning keys can otherwise cross source boundaries.",
      krnImplication: "Source claim input must reject private reasoning metadata.",
      doesNotProve: "This does not prove all runtime metadata is public.",
      sourceAuthority: "project-decision",
      supportType: "implementation-boundary",
      consumer: "metadata boundary parser",
      falsifier: "A source claim parser accepts privateReasoning metadata.",
      metadata
    }));

    expectPrivateReasoningMetadataRejection(() => parseTaskContractInput({
      title: "Seal public metadata",
      objective: "Reject private reasoning keys at public task boundaries.",
      constraints: [],
      nonGoals: [],
      acceptance: ["privateReasoning metadata is rejected"],
      metadata
    }));

    expectPrivateReasoningMetadataRejection(() => parseRetrievalCandidateInput({
      retrievalRunId: "retrieval-run-1",
      candidateType: "source",
      subjectType: "source_claim",
      subjectId: "source-claim-1",
      reason: "Candidate came from source search.",
      metadata
    }));

    expectPrivateReasoningMetadataRejection(() => parseEvidenceCaptureInput({
      changedFiles: ["packages/core/src/parsing/schema-primitives.ts"],
      commands: [],
      diffRisk: "low",
      reviewBurden: "small parser-boundary change",
      rollbackPath: "revert parser metadata schema",
      metadata
    }));
  });
});
