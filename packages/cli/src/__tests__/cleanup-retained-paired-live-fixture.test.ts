import {
  describe,
  expect,
  it
} from "vitest";
import type {
  PairedLiveEvalEvidenceRecord
} from "@krn/core";

import {
  parseCleanupRetainedFixtureCommandArguments,
  parseRetainedFixtureReport,
  retainedFixturePersistenceIdentityFor,
  verifyRetainedFixturePersistenceGuard
} from "../internal/eval/cleanup-retained-paired-live-fixture.js";
import type {
  RetainedFixturePersistenceIdentity
} from "../internal/eval/cleanup-retained-paired-live-fixture.js";

const now = "2026-07-19T07:05:00.000Z";
const smokeId = "retained-memory-treatment-abc123";
const projectId = "00000000-0000-4000-8000-000000000001";
const runId = "00000000-0000-4000-8000-000000000101";

const report = parseRetainedFixtureReport({
  smokeId,
  report: {
    workspaceSlug: `krn-decision-packet-smoke-${smokeId}`,
    projectId,
    executionRunId: runId,
    retainedFixture: true
  }
});

const identity: RetainedFixturePersistenceIdentity = {
  projectId,
  runId,
  candidateId: `paired-target-repair:${runId}`,
  scenario: "temporal-policy-drift",
  artifactStatus: "passed",
  outcome: "win",
  usefulnessOutcome: "helped",
  packetEvidenceRef: `packet:${"a".repeat(64)}`,
  artifactRef: `artifact:sha256:${"b".repeat(64)}`,
  manifestRef: `manifest:sha256:${"c".repeat(64)}`,
  checkerEvidenceRef: "checker:paired-live-codex-repair-checker.v3",
  environmentEvidenceRef: `environment:sha256:${"d".repeat(64)}`
};

const evidenceRecord = (
  overrides: Partial<PairedLiveEvalEvidenceRecord> = {}
): PairedLiveEvalEvidenceRecord => ({
  id: "paired-evidence-1",
  projectId: identity.projectId,
  runId: identity.runId,
  feedbackDeltaId: "00000000-0000-4000-8000-000000000201",
  candidateId: identity.candidateId,
  candidateStatus: "candidate",
  title: "Paired target repair outcome: win",
  scenario: identity.scenario,
  family: identity.scenario,
  expectedSignal: "Only a completed, predeclared KRN win may be classified as helped.",
  artifactStatus: identity.artifactStatus,
  outcome: identity.outcome,
  usefulnessOutcome: identity.usefulnessOutcome,
  packetChecksum: "a".repeat(64),
  packetEvidenceRef: identity.packetEvidenceRef,
  artifactHash: "b".repeat(64),
  artifactRef: identity.artifactRef,
  manifestHash: "c".repeat(64),
  manifestRef: identity.manifestRef,
  checkerRevision: "paired-live-codex-repair-checker.v3",
  checkerEvidenceRef: identity.checkerEvidenceRef,
  environmentProfileHash: "d".repeat(64),
  environmentEvidenceRef: identity.environmentEvidenceRef,
  sourceEvidence: [
    identity.packetEvidenceRef,
    identity.artifactRef,
    identity.manifestRef,
    identity.checkerEvidenceRef,
    identity.environmentEvidenceRef
  ],
  evidenceRefs: [],
  metadata: {},
  createdAt: now,
  updatedAt: now,
  ...overrides
});

describe("retained paired-live fixture cleanup guard", () => {
  it("requires explicit cleanup mode arguments", () => {
    expect(parseCleanupRetainedFixtureCommandArguments([
      "--disposable",
      "fixture-report.json"
    ])).toEqual({
      mode: "disposable",
      reportPath: "fixture-report.json"
    });
    expect(parseCleanupRetainedFixtureCommandArguments([
      "--require-persisted",
      "manifest.json",
      "attempt-1",
      "fixture-report.json"
    ])).toEqual({
      mode: "require_persisted",
      manifestPath: "manifest.json",
      attemptDirectory: "attempt-1",
      reportPath: "fixture-report.json"
    });
    expect(() => parseCleanupRetainedFixtureCommandArguments([
      "fixture-report.json"
    ])).toThrow("Usage: cleanup-retained-paired-live-fixture");
  });

  it("allows cleanup only after exact persisted eval evidence readback", async () => {
    const listed: unknown[] = [];

    await expect(verifyRetainedFixturePersistenceGuard({
      guard: {
        mode: "require_persisted",
        expected: identity
      },
      report,
      repository: {
        async listPairedLiveEvalEvidence(input) {
          listed.push(input);
          return [evidenceRecord()];
        }
      }
    })).resolves.toEqual({
      mode: "require_persisted",
      persisted: true,
      verifiedBeforeCleanup: true,
      evidenceId: "paired-evidence-1",
      candidateId: identity.candidateId,
      artifactRef: identity.artifactRef,
      manifestRef: identity.manifestRef,
      checkerEvidenceRef: identity.checkerEvidenceRef,
      environmentEvidenceRef: identity.environmentEvidenceRef
    });

    expect(listed).toEqual([{ projectId, runId, limit: 5 }]);
  });

  it("uses the persisted evidence unknown environment fallback", () => {
    const derived = retainedFixturePersistenceIdentityFor({
      manifest: {
        projectId,
        runId,
        scenario: "temporal-policy-drift"
      },
      artifact: {
        kind: "krn.pairedLiveCodexRepairArtifact.v2",
        status: "passed",
        artifactHash: "b".repeat(64),
        manifestHash: "c".repeat(64),
        runId,
        packet: { checksum: "a".repeat(64) },
        execution: {},
        score: { outcome: "win" }
      },
      manifestHash: "c".repeat(64)
    });

    expect(derived.environmentEvidenceRef).toBe("environment:sha256:unknown");
  });

  it("refuses evidence-bearing cleanup when persisted readback is missing", async () => {
    await expect(verifyRetainedFixturePersistenceGuard({
      guard: {
        mode: "require_persisted",
        expected: identity
      },
      report,
      repository: {
        async listPairedLiveEvalEvidence() {
          return [];
        }
      }
    })).rejects.toThrow("requires persisted paired-live eval evidence");
  });

  it("keeps disposable cleanup explicit and does not query durable evidence", async () => {
    await expect(verifyRetainedFixturePersistenceGuard({
      guard: { mode: "disposable" },
      report,
      repository: {
        async listPairedLiveEvalEvidence() {
          throw new Error("disposable cleanup must not require persisted readback");
        }
      }
    })).resolves.toEqual({
      mode: "disposable",
      persisted: false,
      verifiedBeforeCleanup: false,
      verifiedAfterCleanup: false
    });
  });
});
