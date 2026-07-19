import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  aggregatePairedEvalArtifactDirectories,
  aggregatePairedEvalArtifacts,
  aggregatePairedEvalMixedInputs,
  aggregatePairedEvalResultFiles
} from "../internal/eval/paired-live-aggregation.js";
import type { TrackedTrialArtifact } from "../internal/eval/tracked-paired-live-codex-repair.js";

const artifact = (
  runId: string,
  status: TrackedTrialArtifact["status"],
  outcome?: "win" | "tie" | "loss" | "invalid",
  checkerRevision?: string
): TrackedTrialArtifact => ({
  kind: "krn.pairedLiveCodexRepairArtifact.v2",
  status,
  artifactHash: `artifact-${runId}`,
  manifestHash: `manifest-${runId}`,
  sourceTreeHash: `source-${runId}`,
  runId,
  ...(checkerRevision === undefined ? {} : { checkerRevision }),
  packet: { validation: { valid: true, reasons: [] } },
  execution: { conditions: { requested: {} as never } },
  ...(outcome === undefined ? {} : {
    score: {
      outcome,
      baseline: { status: "pass", score: 1, checks: [], changedFiles: [] },
      krn: { status: "pass", score: 1, checks: [], changedFiles: [] },
      reason: "fixture"
    }
  }),
  proof: { proves: [], doesNotProve: [] }
});

describe("paired live eval aggregation", () => {
  it("counts quality outcomes per family and computes a bounded win rate", () => {
    const report = aggregatePairedEvalArtifacts([
      { family: "env-config", artifact: artifact("env-win", "passed", "win") },
      { family: "env-config", artifact: artifact("env-tie", "passed", "tie") },
      { family: "async-job", artifact: artifact("async-loss", "passed", "loss") },
      { family: "temporal-policy-drift", artifact: artifact("temporal-win", "passed", "win") }
    ]);

    expect(report.families.find((family) => family.family === "env-config")).toMatchObject({
      wins: 1,
      ties: 1,
      losses: 0,
      qualityTrials: 2,
      invalidTrials: 0,
      winRateAmongQuality: 0.5
    });
    expect(report.families.find((family) => family.family === "temporal-policy-drift")).toMatchObject({
      wins: 1,
      ties: 0,
      losses: 0,
      qualityTrials: 1,
      invalidTrials: 0,
      winRateAmongQuality: 1
    });
    expect(report.overall).toMatchObject({
      wins: 2,
      ties: 1,
      losses: 1,
      qualityTrials: 4,
      invalidTrials: 0,
      winRateAmongQuality: 0.5
    });
  });

  it("stratifies configured capability and application observations without changing outcomes", () => {
    const observed: TrackedTrialArtifact = {
      ...artifact("observed", "passed", "win"),
      execution: {
        conditions: { requested: {} as never },
        capabilityUseObservation: {
          baseline: { mcpToolCallEvents: 0, skillEvents: 0, genericMcpToolCallEvents: 0, genericSkillEvents: 0 },
          krn: { mcpToolCallEvents: 2, skillEvents: 1, genericMcpToolCallEvents: 0, genericSkillEvents: 0 }
        },
        decisionApplicationObservation: "observed"
      }
    };
    const missing: TrackedTrialArtifact = {
      ...artifact("missing", "passed", "tie"),
      execution: {
        conditions: { requested: {} as never },
        capabilityUseObservation: {
          baseline: { mcpToolCallEvents: 0, skillEvents: 0, genericMcpToolCallEvents: 0, genericSkillEvents: 0 },
          krn: { mcpToolCallEvents: 0, skillEvents: 0, genericMcpToolCallEvents: 0, genericSkillEvents: 0 }
        },
        decisionApplicationObservation: "none_observed"
      }
    };

    const report = aggregatePairedEvalArtifacts([
      { family: "weak-json", artifact: observed },
      { family: "weak-json", artifact: missing }
    ]);

    expect(report.overall).toMatchObject({
      wins: 1,
      ties: 1,
      qualityTrials: 2,
      capabilityConfiguredTrials: 2,
      capabilityUseObservedTrials: 1,
      capabilityUseMissingTrials: 1,
      decisionApplicationAttemptedTrials: 2,
      decisionApplicationObservedTrials: 1,
      decisionApplicationMissingTrials: 1
    });
  });

  it("excludes invalid and duplicate runs from quality counts", () => {
    const report = aggregatePairedEvalArtifacts([
      { family: "weak-json", artifact: artifact("same", "passed", "win") },
      { family: "weak-json", artifact: artifact("same", "passed", "loss") },
      { family: "weak-json", artifact: artifact("blocked", "blocked", "win") },
      { family: "weak-json", artifact: artifact("unverified", "unverified") }
    ]);

    expect(report.families.find((family) => family.family === "weak-json")).toMatchObject({
      wins: 1,
      ties: 0,
      losses: 0,
      qualityTrials: 1,
      invalidTrials: 3,
      duplicateRunIds: ["same"]
    });
    expect(report.overall.qualityTrials).toBe(1);
  });

  it("preserves arm-level invalid reasons without scoring unavailable as quality", () => {
    const base = artifact("invalid-arm", "invalid", "invalid");
    const invalidArm: TrackedTrialArtifact = {
      ...base,
      execution: {
        ...base.execution,
        invalidReasons: ["baseline arm timed out"]
      },
      score: {
        ...base.score!,
        baseline: {
          ...base.score!.baseline,
          status: "invalid",
          checks: [{ name: "held_out_runtime", passed: false, details: "runtime observer unavailable" }]
        },
        krn: base.score!.krn
      }
    };

    const report = aggregatePairedEvalArtifacts([{ family: "env-config", artifact: invalidArm }]);

    expect(report.overall).toMatchObject({ qualityTrials: 0, invalidTrials: 1 });
    expect(report.invalidReasons).toEqual([
      { reason: "baseline arm timed out", count: 1 },
      { reason: "baseline.held_out_runtime: runtime observer unavailable", count: 1 },
      { reason: "fixture", count: 1 }
    ]);
  });

  it("returns explicit empty rates instead of inventing evidence", () => {
    const report = aggregatePairedEvalArtifacts([]);

    expect(report.overall).toMatchObject({
      totalInputs: 0,
      qualityTrials: 0,
      invalidTrials: 0,
      winRateAmongQuality: null
    });
    expect(report.families).toHaveLength(5);
    expect(report.comparison).toEqual({
      outcomeLevel: "cross-family",
      scoreLevel: "family-local-only",
      reason: expect.stringContaining("must not be compared across families")
    });
    expect(report.checkerBoundary).toMatchObject({
      status: "unknown",
      reason: expect.stringContaining("do not currently carry a checker revision")
    });
    expect(report.families.find((family) => family.family === "user-create")).toMatchObject({
      qualityTrials: 0,
      invalidTrials: 0,
      totalInputs: 0,
      winRateAmongQuality: null
    });
    expect(report.families.find((family) => family.family === "temporal-policy-drift")).toMatchObject({
      qualityTrials: 0,
      invalidTrials: 0,
      totalInputs: 0,
      winRateAmongQuality: null
    });
  });

  it("deduplicates a run globally even when mislabeled across families", () => {
    const report = aggregatePairedEvalArtifacts([
      { family: "env-config", artifact: artifact("cross-family", "passed", "win") },
      { family: "async-job", artifact: artifact("cross-family", "passed", "win") }
    ]);

    expect(report.overall).toMatchObject({ wins: 1, qualityTrials: 1, invalidTrials: 1 });
    expect(report.families.find((family) => family.family === "async-job")?.duplicateRunIds)
      .toEqual(["cross-family"]);
  });

  it("partitions checker revisions instead of pooling unlike-for-like artifacts", () => {
    const single = aggregatePairedEvalArtifacts([
      { family: "weak-json", artifact: artifact("current", "passed", "tie", "checker.v2") }
    ]);
    expect(single.checkerBoundary).toEqual({
      status: "single-revision",
      revision: "checker.v2",
      partitions: { "checker.v2": ["current"] },
      reason: "All readable artifacts carry checker revision checker.v2."
    });

    const mixed = aggregatePairedEvalArtifacts([
      { family: "weak-json", artifact: artifact("current", "passed", "tie", "checker.v2") },
      { family: "weak-json", artifact: artifact("legacy", "passed", "win") }
    ]);
    expect(mixed.checkerBoundary).toMatchObject({
      status: "mixed-revisions",
      partitions: { "checker.v2": ["current"], unknown: ["legacy"] }
    });
  });

  it("reports an unreadable artifact as invalid without creating a quality outcome", async () => {
    const report = await aggregatePairedEvalArtifactDirectories([{
      family: "env-config",
      directory: "/definitely/missing/paired-trial"
    }]);

    expect(report.overall).toMatchObject({
      wins: 0,
      qualityTrials: 0,
      invalidTrials: 1,
      totalInputs: 1,
      winRateAmongQuality: null
    });
    expect(report.unreadableInputs).toEqual([{
      family: "env-config",
      directory: "/definitely/missing/paired-trial",
      reason: "artifact_or_phase_journal_failed_validation"
    }]);
  });

  it("quarantines generic live result files instead of treating them as quality", async () => {
    const directory = await mkdtemp("/tmp/krn-aggregate-generic-");
    const valid = join(directory, "valid.json");
    const malformed = join(directory, "malformed.json");
    await writeFile(valid, JSON.stringify({
      kind: "krn.genericPairedCodexEval.v1",
      runId: "generic-win",
      score: { outcome: "win" },
      promptDelta: { packetOnlyByConstruction: true }
    }));
    await writeFile(malformed, "not-json");

    const report = await aggregatePairedEvalResultFiles([
      { family: "env-config", file: valid },
      { family: "env-config", file: malformed }
    ]);

    expect(report.overall).toMatchObject({ wins: 0, qualityTrials: 0, invalidTrials: 2 });
    expect(report.unreadableFiles).toEqual([
      { family: "env-config", file: valid, reason: "generic_result_not_quality_proof" },
      { family: "env-config", file: malformed, reason: "generic_result_failed_validation" }
    ]);
  });

  it("combines tracked-directory reads and generic result files with global duplicate exclusion", async () => {
    const directory = await mkdtemp("/tmp/krn-aggregate-mixed-");
    const valid = join(directory, "valid.json");
    const duplicate = join(directory, "duplicate.json");
    await writeFile(valid, JSON.stringify({
      kind: "krn.genericPairedCodexEval.v1",
      runId: "mixed-run",
      score: { outcome: "win" },
      promptDelta: { packetOnlyByConstruction: true }
    }));
    await writeFile(duplicate, JSON.stringify({
      kind: "krn.genericPairedCodexEval.v1",
      runId: "mixed-run",
      score: { outcome: "loss" },
      promptDelta: { packetOnlyByConstruction: true }
    }));

    const report = await aggregatePairedEvalMixedInputs({
      artifactDirectories: [{ family: "env-config", directory: "/definitely/missing/paired-trial" }],
      resultFiles: [
        { family: "async-job", file: valid },
        { family: "weak-json", file: duplicate }
      ]
    });

    expect(report.overall).toMatchObject({
      wins: 0,
      qualityTrials: 0,
      invalidTrials: 3,
      totalInputs: 3
    });
    expect(report.families.find((family) => family.family === "weak-json")?.duplicateRunIds)
      .toEqual([]);
    expect(report.unreadableInputs).toHaveLength(1);
    expect(report.unreadableFiles).toHaveLength(2);
    expect(report.doesNotProve).toContain("causal KRN advantage or arbitrary-repository portability");
  });
});
