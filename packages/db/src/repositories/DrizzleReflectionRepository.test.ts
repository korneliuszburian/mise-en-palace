import { describe, expect, it } from "vitest";

import {
  DrizzleReflectionRepository,
  mapReflectionRecordForRead
} from "./DrizzleReflectionRepository.js";

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
        sourceClaimCandidates: [],
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
  });
});
