import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  aggregatePairedEvalArtifactDirectories,
  aggregatePairedEvalArtifacts,
  aggregatePairedEvalResultFiles
} from "../internal/eval/paired-live-aggregation.js";
import type { TrackedTrialArtifact } from "../internal/eval/tracked-paired-live-codex-repair.js";

const artifact = (
  runId: string,
  status: TrackedTrialArtifact["status"],
  outcome?: "win" | "tie" | "loss" | "invalid"
): TrackedTrialArtifact => ({
  kind: "krn.pairedLiveCodexRepairArtifact.v2",
  status,
  artifactHash: `artifact-${runId}`,
  manifestHash: `manifest-${runId}`,
  sourceTreeHash: `source-${runId}`,
  runId,
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
      { family: "async-job", artifact: artifact("async-loss", "passed", "loss") }
    ]);

    expect(report.families.find((family) => family.family === "env-config")).toMatchObject({
      wins: 1,
      ties: 1,
      losses: 0,
      qualityTrials: 2,
      invalidTrials: 0,
      winRateAmongQuality: 0.5
    });
    expect(report.overall).toMatchObject({
      wins: 1,
      ties: 1,
      losses: 1,
      qualityTrials: 3,
      invalidTrials: 0,
      winRateAmongQuality: 1 / 3
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

  it("returns explicit empty rates instead of inventing evidence", () => {
    const report = aggregatePairedEvalArtifacts([]);

    expect(report.overall).toMatchObject({
      totalInputs: 0,
      qualityTrials: 0,
      invalidTrials: 0,
      winRateAmongQuality: null
    });
    expect(report.families).toHaveLength(3);
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

  it("reads the generic live result format without treating malformed JSON as quality", async () => {
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

    expect(report.overall).toMatchObject({ wins: 1, qualityTrials: 1, invalidTrials: 1 });
    expect(report.unreadableFiles).toHaveLength(1);
  });
});
