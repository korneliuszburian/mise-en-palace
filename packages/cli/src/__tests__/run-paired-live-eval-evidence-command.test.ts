import {
  describe,
  expect,
  it
} from "vitest";
import type {
  ListPairedLiveEvalEvidenceInput,
  PairedLiveEvalEvidenceRecord
} from "@krn/core";

import {
  runPairedLiveEvalEvidenceCommand
} from "../run-paired-live-eval-evidence-command.js";

const now = "2026-07-19T06:35:00.000Z";
const projectId = "00000000-0000-4000-8000-000000000001";
const runId = "00000000-0000-4000-8000-000000000101";

const pairedEvidence: PairedLiveEvalEvidenceRecord = {
  id: "paired-evidence-1",
  projectId,
  runId,
  feedbackDeltaId: "00000000-0000-4000-8000-000000000201",
  candidateId: `paired-target-repair:${runId}`,
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
  sourceEvidence: ["checker:paired-live-codex-repair-checker.v3"],
  evidenceRefs: [
    `packet:${"a".repeat(64)}`,
    `artifact:sha256:${"b".repeat(64)}`,
    `manifest:sha256:${"c".repeat(64)}`,
    "checker:paired-live-codex-repair-checker.v3",
    `environment:sha256:${"d".repeat(64)}`
  ],
  metadata: {},
  createdAt: now,
  updatedAt: now
};

describe("runPairedLiveEvalEvidenceCommand", () => {
  it("reads paired-live candidates through the durable eval evidence repository", async () => {
    const closed: string[] = [];
    const listed: ListPairedLiveEvalEvidenceInput[] = [];
    const result = await runPairedLiveEvalEvidenceCommand({
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      command: {
        projectId,
        runId,
        candidateId: `paired-target-repair:${runId}`,
        limit: 25,
        format: "json"
      },
      createReadbackRuntime: async () => ({
        async listPairedLiveEvalEvidence(input) {
          listed.push(input);
          return [pairedEvidence];
        },
        async close() {
          closed.push("closed");
        }
      })
    });

    const parsed = JSON.parse(result.stdout) as {
      returnedCandidateCount: number;
      candidates: readonly [{
        candidateId: string;
        checkerRevision: string;
        packetChecksum: string;
      }];
      proof: { doesNotProve: readonly string[] };
    };

    expect(listed).toEqual([{
      projectId,
      runId,
      candidateId: `paired-target-repair:${runId}`,
      limit: 25
    }]);
    expect(closed).toEqual(["closed"]);
    expect(parsed.returnedCandidateCount).toBe(1);
    expect(parsed.candidates[0]).toEqual(expect.objectContaining({
      candidateId: `paired-target-repair:${runId}`,
      checkerRevision: "paired-live-codex-repair-checker.v3",
      packetChecksum: "a".repeat(64)
    }));
    expect(parsed.proof.doesNotProve).toContain(
      "promotion of an EvalCandidate into MemoryRecord, SourceClaim, or SourceDecision authority"
    );
  });

  it("fails closed when the database URL is missing", async () => {
    await expect(runPairedLiveEvalEvidenceCommand({
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      command: {
        projectId,
        format: "text"
      }
    })).rejects.toThrow("KRN_DATABASE_URL is required for krn run eval-evidence");
  });
});
