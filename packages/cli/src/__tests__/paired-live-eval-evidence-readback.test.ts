import {
  describe,
  expect,
  it
} from "vitest";
import type {
  PairedLiveEvalEvidenceRecord
} from "@krn/core";

import {
  buildPairedLiveEvalEvidenceReadback
} from "../paired-live-eval-evidence-readback.js";

const now = "2026-07-19T06:30:00.000Z";

const evidence = (
  overrides: Partial<PairedLiveEvalEvidenceRecord> = {}
): PairedLiveEvalEvidenceRecord => ({
  id: "paired-evidence-1",
  projectId: "00000000-0000-4000-8000-000000000001",
  runId: "00000000-0000-4000-8000-000000000101",
  feedbackDeltaId: "00000000-0000-4000-8000-000000000201",
  candidateId: "paired-target-repair:00000000-0000-4000-8000-000000000101",
  candidateStatus: "candidate",
  title: "Paired target repair outcome: win",
  scenario: "temporal-policy-drift",
  family: "temporal-policy-drift",
  expectedSignal: "Only a predeclared KRN win may be classified as helped.",
  artifactStatus: "passed",
  outcome: "win",
  usefulnessOutcome: "helped",
  packetChecksum: "a".repeat(64),
  packetEvidenceRef: `packet:${"a".repeat(64)}`,
  artifactHash: "b".repeat(64),
  artifactRef: `artifact:sha256:${"b".repeat(64)}`,
  manifestHash: "c".repeat(64),
  manifestRef: `manifest:sha256:${"c".repeat(64)}`,
  checkerRevision: "paired-live-codex-repair-checker.v3",
  checkerEvidenceRef: "checker:paired-live-codex-repair-checker.v3",
  environmentProfileHash: "d".repeat(64),
  environmentEvidenceRef: `environment:sha256:${"d".repeat(64)}`,
  sourceEvidence: [
    `packet:${"a".repeat(64)}`,
    `artifact:sha256:${"b".repeat(64)}`,
    `manifest:sha256:${"c".repeat(64)}`,
    "checker:paired-live-codex-repair-checker.v3",
    `environment:sha256:${"d".repeat(64)}`
  ],
  evidenceRefs: [
    `packet:${"a".repeat(64)}`,
    `artifact:sha256:${"b".repeat(64)}`,
    `manifest:sha256:${"c".repeat(64)}`,
    "checker:paired-live-codex-repair-checker.v3",
    `environment:sha256:${"d".repeat(64)}`
  ],
  metadata: {
    doesNotProve: [
      "A single paired trial does not prove product readiness."
    ]
  },
  createdAt: now,
  updatedAt: now,
  ...overrides
});

describe("paired-live eval evidence readback", () => {
  it("returns exact durable paired-live artifact identity without reading local artifacts", () => {
    const record = evidence();
    const readback = buildPairedLiveEvalEvidenceReadback({
      projectId: record.projectId,
      records: [
        record,
        evidence({
          id: "paired-evidence-other-project",
          projectId: "00000000-0000-4000-8000-000000000002"
        })
      ]
    });

    expect(readback).toMatchObject({
      kind: "krn.pairedLiveEvalEvidenceReadback.v1",
      access: "read_only",
      mutation: "none",
      projectId: record.projectId,
      storeScope: "paired_live_eval_evidence",
      storedCandidateCount: 1,
      returnedCandidateCount: 1
    });
    expect(readback.candidates).toHaveLength(1);
    expect(readback.candidates[0]).toMatchObject({
      candidateId: record.candidateId,
      feedbackDeltaId: record.feedbackDeltaId,
      projectId: record.projectId,
      runId: record.runId,
      scenario: "temporal-policy-drift",
      family: "temporal-policy-drift",
      artifactStatus: "passed",
      outcome: "win",
      usefulnessOutcome: "helped",
      checkerRevision: "paired-live-codex-repair-checker.v3",
      checkerEvidenceRef: "checker:paired-live-codex-repair-checker.v3",
      packetChecksum: "a".repeat(64),
      artifactHash: "b".repeat(64),
      manifestHash: "c".repeat(64),
      environmentProfileHash: "d".repeat(64)
    });
    expect(readback.candidates[0]?.allEvidenceRefs).toEqual(expect.arrayContaining([
      record.packetEvidenceRef,
      record.artifactRef,
      record.manifestRef,
      record.checkerEvidenceRef,
      record.environmentEvidenceRef
    ]));
    expect(readback.proof.proves).toContain(
      "readback does not read .local-lab artifacts and does not require live retained project, run, feedback, MemoryRecord, or SourceClaim rows"
    );
  });

  it("filters paired-live evidence by run, outcome, and usefulness", () => {
    const projectId = "00000000-0000-4000-8000-000000000001";
    const readback = buildPairedLiveEvalEvidenceReadback({
      projectId,
      records: [
        evidence({
          id: "paired-evidence-invalid",
          projectId,
          runId: "00000000-0000-4000-8000-000000000102",
          candidateId: "paired-target-repair:00000000-0000-4000-8000-000000000102",
          artifactStatus: "invalid",
          outcome: "invalid",
          usefulnessOutcome: "unknown"
        }),
        evidence({
          id: "paired-evidence-win",
          projectId,
          runId: "00000000-0000-4000-8000-000000000103",
          candidateId: "paired-target-repair:00000000-0000-4000-8000-000000000103"
        })
      ],
      filters: {
        runId: "00000000-0000-4000-8000-000000000103",
        outcome: "win",
        usefulnessOutcome: "helped"
      }
    });

    expect(readback.storedCandidateCount).toBe(2);
    expect(readback.returnedCandidateCount).toBe(1);
    expect(readback.candidates[0]?.candidateId).toBe(
      "paired-target-repair:00000000-0000-4000-8000-000000000103"
    );
  });
});
