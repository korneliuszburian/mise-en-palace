import { describe, expect, it } from "vitest";

import {
  DrizzleReflectionRepository,
  mapReflectionRecordForRead
} from "../drizzle-reflection-repository.js";

const methodNames = [
  "createReflectionRecord",
  "getReflectionRecordById",
  "listReflectionRecordsByScope"
] as const;

describe("DrizzleReflectionRepository", () => {
  it("exposes MM-20 reflection persistence methods without runtime reflection behavior", () => {
    for (const methodName of methodNames) {
      expect(typeof DrizzleReflectionRepository.prototype[methodName]).toBe("function");
    }
  });

  it("preserves candidate proposals from persisted reflection output JSON", () => {
    const now = new Date("2026-06-23T12:00:00.000Z");
    const row: Parameters<typeof mapReflectionRecordForRead>[0] = {
      id: "reflection-record-1",
      projectId: "project-1",
      executionRunId: "execution-run-1",
      taskContractId: "task-contract-1",
      status: "candidate",
      summary: "Reflection produced candidates.",
      scope: {
        projectId: "project-1",
        executionRunId: "execution-run-1",
        taskContractId: "task-contract-1"
      },
      input: {
        scope: {
          projectId: "project-1",
          executionRunId: "execution-run-1",
          taskContractId: "task-contract-1"
        },
        observationItemIds: ["observation-1"],
        sourceClaimIds: ["source-claim-1"],
        antiMemoryKeys: [],
        generatedAt: "2026-06-23T12:00:00.000Z",
        metadata: {}
      },
      output: {
        id: "reflection-output-1",
        summary: "Reflection output proposes candidates only.",
        candidateLinks: [],
        memoryCandidates: [{
          kind: "procedure",
          summary: "Carry evidence provenance into memory candidates.",
          body: "Reflection candidates must carry evidence limits.",
          owner: "kernel",
          confidence: 70,
          applicationGuidance: "Review before promotion.",
          sourceClaimIds: ["source-claim-1"],
          sourceLineage: [{ sourceId: "source-claim-1" }],
          isUserPreference: false,
          validFrom: "2026-06-23T12:00:00.000Z",
          evidence: {
            provenance: "operator_reported",
            evidenceRefs: ["evidence-bundle-1:commands"],
            doesNotProve: "This does not prove Memory Core truth."
          },
          metadata: {}
        }],
        sourceClaimCandidates: [
          {
            claim: "Decision-grade reflection source candidate stays reviewable.",
            mechanism: "Reflection preserved source-to-decision fields with evidence.",
            krnImplication: "The source candidate can be reviewed without becoming authority.",
            doesNotProve: "This does not prove the source claim is accepted truth.",
            sourceAuthority: "project-decision",
            supportType: "implementation-boundary",
            consumer: "reflection readback mapper",
            falsifier: "Decision-grade source candidates disappear from reflection readback.",
            evidence: {
              provenance: "operator_reported",
              evidenceRefs: ["evidence-bundle-1:commands"],
              doesNotProve: "This does not prove source truth."
            },
            metadata: {}
          },
          {
            claim: "Decorative reflection source candidate is only background.",
            mechanism: "Decorative background does not imply KRN behavior.",
            krnImplication: "The candidate should not enter source claim review.",
            doesNotProve: "This does not prove source truth.",
            sourceAuthority: "project-decision",
            supportType: "background",
            consumer: "reflection readback mapper",
            falsifier: "Background source candidates enter source claim review.",
            evidence: {
              provenance: "operator_reported",
              evidenceRefs: ["evidence-bundle-1:background"],
              doesNotProve: "This does not prove source truth."
            },
            metadata: {}
          }
        ],
        antiMemoryCandidates: [],
        policyCandidates: [],
        evalCandidates: [],
        metadata: {}
      },
      metadata: {},
      createdAt: now,
      updatedAt: now
    };

    const record = mapReflectionRecordForRead(row);

    expect(record.output.memoryCandidates).toEqual([
      expect.objectContaining({
        summary: "Carry evidence provenance into memory candidates.",
        evidence: {
          provenance: "operator_reported",
          evidenceRefs: ["evidence-bundle-1:commands"],
          doesNotProve: "This does not prove Memory Core truth."
        }
      })
    ]);
    expect(record.output.sourceClaimCandidates).toEqual([
      expect.objectContaining({
        claim: "Decision-grade reflection source candidate stays reviewable.",
        supportType: "implementation-boundary"
      })
    ]);
  });
});
