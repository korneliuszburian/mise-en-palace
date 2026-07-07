import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  loadCodexDecisionPacketObedienceFixture,
  runCodexDecisionPacketObedienceEval
} from "../run-codex-decision-packet-obedience-eval.js";

const fixturePath = fileURLToPath(
  new URL(
    "../../../../tests/fixtures/codex-decision-packet-obedience/recorded-obedience.json",
    import.meta.url
  )
);
const livePilotFixturePath = fileURLToPath(
  new URL(
    "../../../../tests/fixtures/codex-decision-packet-obedience/live-pilot-2026-07-06.json",
    import.meta.url
  )
);
const fixture = () => loadCodexDecisionPacketObedienceFixture(fixturePath);
const livePilotFixture = () => loadCodexDecisionPacketObedienceFixture(livePilotFixturePath);

describe("runCodexDecisionPacketObedienceEval", () => {
  it("checks recorded Codex output against decision-packet obedience signals", async () => {
    const result = await runCodexDecisionPacketObedienceEval(
      fixture()
    );

    expect(result).toMatchObject({
      kind: "krn.codexDecisionPacketObedience.eval.v1",
      fixtureVersion: "1",
      status: "pass",
      sourceEvalKind: "krn.decisionPacket.eval.v1",
      metrics: {
        caseCount: 2,
        passedCaseCount: 2,
        failedCaseCount: 0,
        validEvidenceShapeCount: 2,
        governedDecisionObedienceCount: 2,
        staleBoundaryObedienceCount: 2,
        rejectedPathObedienceCount: 2,
        nonProofObedienceCount: 2
      }
    });
    expect(result.cases).toEqual([
      expect.objectContaining({
        id: "memory-runtime-obedience",
        decisionPacketCaseId: "memory-runtime-task",
        status: "pass",
        briefIncludesPacket: true,
        outputEvidenceShape: "valid",
        outputObeysGoverningDecision: true,
        outputPreservesStaleBoundary: true,
        outputPreservesRejectedPath: true,
        outputPreservesNonProof: true,
        validationFindings: [],
        missingObedienceSignals: []
      }),
      expect.objectContaining({
        id: "second-repo-ordering-obedience",
        decisionPacketCaseId: "second-repo-task",
        status: "pass",
        briefIncludesPacket: true,
        outputEvidenceShape: "valid",
        outputObeysGoverningDecision: true,
        outputPreservesStaleBoundary: true,
        outputPreservesRejectedPath: true,
        outputPreservesNonProof: true,
        validationFindings: [],
        missingObedienceSignals: []
      })
    ]);
    expect(result.proof.proves).toContain(
      "the checker requires governing decision, stale-boundary, rejected-path, and non-proof signals to survive into the recorded output"
    );
    expect(result.proof.doesNotProve).toContain("live Codex execution");
  });

  it("checks the live Codex pilot output against decision-packet obedience signals", async () => {
    const result = await runCodexDecisionPacketObedienceEval(livePilotFixture());

    expect(result).toMatchObject({
      kind: "krn.codexDecisionPacketObedience.eval.v1",
      status: "pass",
      metrics: {
        caseCount: 1,
        passedCaseCount: 1,
        failedCaseCount: 0,
        validEvidenceShapeCount: 1,
        governedDecisionObedienceCount: 1,
        staleBoundaryObedienceCount: 1,
        rejectedPathObedienceCount: 1,
        nonProofObedienceCount: 1
      }
    });
    expect(result.cases[0]).toMatchObject({
      id: "live-memory-runtime-obedience-2026-07-06",
      decisionPacketCaseId: "memory-runtime-task",
      status: "pass",
      briefIncludesPacket: true,
      outputEvidenceShape: "valid",
      outputObeysGoverningDecision: true,
      outputPreservesStaleBoundary: true,
      outputPreservesRejectedPath: true,
      outputPreservesNonProof: true,
      validationFindings: [],
      missingObedienceSignals: []
    });
  });

  it("fails when recorded output drops a packet boundary", async () => {
    const sourceFixture = fixture();
    const result = await runCodexDecisionPacketObedienceEval({
      ...sourceFixture,
      cases: sourceFixture.cases.map((testCase) =>
        testCase.id === "memory-runtime-obedience"
          ? {
              ...testCase,
              output: {
                ...testCase.output,
                evidenceRefs: testCase.output.evidenceRefs.filter((ref) =>
                  ref !== "stale:markdown-runtime-memory"
                ),
                verification: testCase.output.verification.filter((ref) =>
                  ref !== "recorded-obedience:stale-boundary=markdown-runtime-memory"
                )
              }
            }
          : testCase
      )
    });

    expect(result.status).toBe("fail");
    expect(result.metrics.failedCaseCount).toBe(1);
    expect(result.cases[0]).toMatchObject({
      status: "fail",
      outputPreservesStaleBoundary: false,
      missingObedienceSignals: ["missing stale-boundary evidence"]
    });
  });

  it("fails when recorded output drops the governing decision evidence", async () => {
    const sourceFixture = fixture();
    const result = await runCodexDecisionPacketObedienceEval({
      ...sourceFixture,
      cases: sourceFixture.cases.map((testCase) =>
        testCase.id === "memory-runtime-obedience"
          ? {
              ...testCase,
              output: {
                ...testCase.output,
                evidenceRefs: testCase.output.evidenceRefs.filter((ref) =>
                  ref !== "memory:decision:store-backed-memory-no-markdown"
                )
              }
            }
          : testCase
      )
    });

    expect(result.status).toBe("fail");
    expect(result.cases[0]).toMatchObject({
      status: "fail",
      outputObeysGoverningDecision: false,
      missingObedienceSignals: ["missing governing decision evidence"]
    });
  });

  it("fails when recorded output drops the rejected-path evidence", async () => {
    const sourceFixture = fixture();
    const result = await runCodexDecisionPacketObedienceEval({
      ...sourceFixture,
      cases: sourceFixture.cases.map((testCase) =>
        testCase.id === "memory-runtime-obedience"
          ? {
              ...testCase,
              output: {
                ...testCase.output,
                evidenceRefs: testCase.output.evidenceRefs.filter((ref) =>
                  ref !== "rejected:create-markdown-memory-files"
                ),
                verification: testCase.output.verification.filter((ref) =>
                  ref !== "recorded-obedience:rejected-path=create-markdown-memory-files"
                )
              }
            }
          : testCase
      )
    });

    expect(result.status).toBe("fail");
    expect(result.cases[0]).toMatchObject({
      status: "fail",
      outputPreservesRejectedPath: false,
      missingObedienceSignals: ["missing rejected-path evidence"]
    });
  });

  it("fails when recorded output drops packet non-proof boundaries", async () => {
    const sourceFixture = fixture();
    const result = await runCodexDecisionPacketObedienceEval({
      ...sourceFixture,
      cases: sourceFixture.cases.map((testCase) =>
        testCase.id === "memory-runtime-obedience"
          ? {
              ...testCase,
              output: {
                ...testCase.output,
                doesNotProve: "This recorded output has evidence refs but omits packet boundaries."
              }
            }
          : testCase
      )
    });

    expect(result.status).toBe("fail");
    expect(result.cases[0]).toMatchObject({
      status: "fail",
      outputPreservesNonProof: false,
      missingObedienceSignals: ["missing non-proof boundary"]
    });
  });

  it("fails when recorded output does not acknowledge the decision-packet brief", async () => {
    const sourceFixture = fixture();
    const result = await runCodexDecisionPacketObedienceEval({
      ...sourceFixture,
      cases: sourceFixture.cases.map((testCase) =>
        testCase.id === "memory-runtime-obedience"
          ? {
              ...testCase,
              output: {
                ...testCase.output,
                verification: testCase.output.verification.filter((ref) =>
                  ref !== "recorded-obedience:decision-packet-brief-read"
                )
              }
            }
          : testCase
      )
    });

    expect(result.status).toBe("fail");
    expect(result.cases[0]).toMatchObject({
      status: "fail",
      briefIncludesPacket: false,
      missingObedienceSignals: ["missing decision-packet brief receipt"]
    });
  });

  it("fails when recorded output has an invalid evidence shape", async () => {
    const sourceFixture = fixture();
    const result = await runCodexDecisionPacketObedienceEval({
      ...sourceFixture,
      cases: sourceFixture.cases.map((testCase) =>
        testCase.id === "memory-runtime-obedience"
          ? {
              ...testCase,
              output: {
                ...testCase.output,
                changedFiles: []
              }
            }
          : testCase
      )
    });

    expect(result.status).toBe("fail");
    expect(result.cases[0]?.outputEvidenceShape).toBe("missing_evidence");
    expect(result.cases[0]?.validationFindings.some((finding) => finding.includes("changedFiles"))).toBe(true);
  });
});
