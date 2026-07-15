import { describe, expect, it } from "vitest";

import {
  parseUsefulnessApplicationEvidence,
  parseUsefulnessApplicationEvidenceForIdentity
} from "../usefulness-application-evidence.js";

const evidence = {
  applicationId: "application-1",
  subjectKind: "knowledge",
  subjectId: "knowledge:unknown-first-boundary",
  projectId: "project-1",
  executionRunId: "execution-run-1",
  taskContractId: "task-contract-1",
  packetChecksum: "a".repeat(64),
  packetGeneratedAt: "2026-07-15T08:00:00.000Z",
  sourceRunLifecycleRevision: 3,
  appliedAt: "2026-07-15T08:01:00.000Z"
} as const;

describe("UsefulnessApplicationEvidence", () => {
  it("parses exact packet-bound application evidence from unknown input", () => {
    expect(parseUsefulnessApplicationEvidence(evidence)).toEqual(evidence);
  });

  it("rejects selected-only, malformed, stale-order, and storage-vocabulary input", () => {
    const { applicationId: _applicationId, appliedAt: _appliedAt, ...selectedOnly } = evidence;

    expect(parseUsefulnessApplicationEvidence(selectedOnly)).toBeUndefined();
    expect(parseUsefulnessApplicationEvidence({
      ...evidence,
      packetChecksum: "not-a-checksum"
    })).toBeUndefined();
    expect(parseUsefulnessApplicationEvidence({
      ...evidence,
      appliedAt: "2026-07-15T07:59:59.999Z"
    })).toBeUndefined();
    expect(parseUsefulnessApplicationEvidence({
      ...evidence,
      sourceRunLifecycleRevision: 0
    })).toBeUndefined();
    expect(parseUsefulnessApplicationEvidence({
      ...evidence,
      subjectKind: "memory_record"
    })).toBeUndefined();
  });

  it("rejects every mismatched immutable identity field", () => {
    const { appliedAt: _appliedAt, ...identity } = evidence;
    const mismatches = [{ applicationId: "application-2" },
      { subjectKind: "source_claim" },
      { subjectId: "knowledge:other" },
      { projectId: "project-2" },
      { executionRunId: "execution-run-2" },
      { taskContractId: "task-contract-2" },
      { packetChecksum: "b".repeat(64) },
      { packetGeneratedAt: "2026-07-15T08:00:01.000Z" },
      { sourceRunLifecycleRevision: 4 }] as const;

    for (const mismatch of mismatches) {
      expect(parseUsefulnessApplicationEvidenceForIdentity(
        evidence,
        { ...identity, ...mismatch }
      )).toBeUndefined();
    }

    expect(parseUsefulnessApplicationEvidenceForIdentity(evidence, identity)).toEqual(evidence);
  });
});
