import { describe, expect, it } from "vitest";
import { resolve } from "node:path";

import {
  buildTrackedTrialArtifact,
  hashTree,
  runTrackedPairedTrial,
  validateTrialPacket,
  type PairedTrialManifest
} from "../internal/eval/tracked-paired-live-codex-repair.js";

const manifest: PairedTrialManifest = {
  kind: "krn.pairedLiveCodexRepairManifest.v1",
  scenario: "weak-json-boundary",
  sourcePath: "fixture",
  projectId: "weak-json-boundary-typescript",
  taskId: "weak-json-repair",
  task: "Repair weak-json-boundary-typescript with bounded validation.",
  requiredDecisionIds: ["decision-1", "decision-2"],
  runId: "run-1",
  codex: {
    command: "codex",
    args: ["exec", "--model", "gpt-5.6", "{prompt}"],
    cliVersion: "codex-test",
    profileHash: "profile-1",
    permissions: "workspace-write-target-only",
    networkPolicy: "disabled",
    budget: { maxTokens: 1000, timeoutMs: 1000 }
  },
  containment: {
    command: "missing-containment-for-test",
    network: "disabled",
    workspaceWriteRoot: "{targetRoot}",
    homeRoot: "{sandboxRoot}"
  },
  checker: { heldOut: true, outcome: "win|tie|loss|invalid" }
};

const packet = {
  kind: "krn.decisionPacketReadback.v1",
  request: { runId: "run-1" },
  packetIdentity: { checksum: "a".repeat(64) },
  packet: {
    task: { id: "weak-json-repair", objective: "Repair weak-json-boundary-typescript safely." },
    governingDecisionIds: ["decision-1", "decision-2"],
    abstentionScore: { status: "ready" }
  }
};
const sourceRoot = resolve(process.cwd(), "../../tests/fixtures/target-repos/weak-json-boundary-typescript");

describe("tracked paired live Codex repair", () => {
  it("accepts only a run-, project-, task-, and authority-bound packet", () => {
    expect(validateTrialPacket(packet, manifest)).toEqual({
      valid: true,
      reasons: [],
      checksum: "a".repeat(64)
    });

    expect(validateTrialPacket({
      ...packet,
      request: { runId: "other-run" },
      packet: { ...packet.packet, abstentionScore: { status: "abstain" } }
    }, manifest)).toMatchObject({
      valid: false,
      reasons: expect.arrayContaining([
        "packet runId does not match the trial manifest",
        "packet abstains or is not ready for the trial"
      ])
    });
  });

  it("hashes file content and relative paths, including untracked files", async () => {
    const first = await hashTree(sourceRoot);
    const second = await hashTree(sourceRoot);
    expect(first).toBe(second);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
  });

  it("records blocked instead of running without an explicit containment boundary", async () => {
    const result = await runTrackedPairedTrial({
      manifest,
      sourceRoot,
      checkerRoot: process.cwd(),
      packet
    });

    expect(result.status).toBe("blocked");
    expect(result.packet.validation.valid).toBe(true);
    expect(result.proof.doesNotProve).toEqual(expect.arrayContaining(["a live Codex repair"]));
  });

  it("binds the artifact hash to its immutable content", () => {
    const base = {
      kind: "krn.pairedLiveCodexRepairArtifact.v1",
      status: "blocked",
      manifestHash: "manifest",
      sourceTreeHash: "source",
      runId: "run-1",
      packet: { validation: { valid: false, reasons: ["missing"] } },
      execution: { conditions: {} },
      proof: { proves: ["refused"], doesNotProve: ["live repair"] }
    } as const;
    const artifact = buildTrackedTrialArtifact(base);

    expect(artifact.artifactHash).toMatch(/^[a-f0-9]{64}$/);
    expect(buildTrackedTrialArtifact({ ...base, runId: "other-run" })).not.toEqual(artifact);
  });
});
