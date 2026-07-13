import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { delimiter, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  buildTrackedTrialArtifact,
  hashTree,
  runTrackedPairedTrial,
  validateTrialPacket,
  type PairedTrialManifest
} from "../internal/eval/tracked-paired-live-codex-repair.js";
import type { PairedRepairScore } from "../internal/eval/paired-live-codex-repair.js";

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

const writeExecutable = async (path: string, source: string): Promise<void> => {
  await writeFile(path, source, "utf8");
  await chmod(path, 0o755);
};

const makeRunnableTargetSource = async (): Promise<string> => {
  const root = await mkdtemp(join(tmpdir(), "krn-tracked-trial-source-"));
  await mkdir(join(root, "src"), { recursive: true });
  await writeFile(join(root, "src", "target.ts"), "export const target = 'fixture';\n", "utf8");

  return root;
};

const withProcessEnvironment = async <Value>(
  overrides: Readonly<Record<string, string | undefined>>,
  run: () => Promise<Value>
): Promise<Value> => {
  const previous = new Map(Object.keys(overrides).map((key) => [key, process.env[key]]));

  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }

  try {
    return await run();
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
};

const makeFakeTool = async (path: string, armSource: string): Promise<void> => {
  await writeExecutable(path, [
    "#!/bin/sh",
    "if [ \"$1\" = \"--version\" ]; then",
    "  printf '%s' \"${KRN_TRIAL_HOST_SENTINEL:-missing}\" > \"$KRN_TRIAL_HOST_PROBE\"",
    "  printf 'wrong-cli 0.0.0\\n'",
    "  exit 0",
    "fi",
    armSource
  ].join("\n"));
};

const makeFakeGit = async (path: string): Promise<void> => {
  await writeExecutable(path, [
    "#!/bin/sh",
    "if [ \"$1\" = \"rev-parse\" ]; then",
    "  printf 'fixture-commit\\n'",
    "fi",
    "exit 0"
  ].join("\n"));
};

const runnableManifest = (binRoot: string, timeoutMs: number): PairedTrialManifest => ({
  ...manifest,
  runId: "replayed-run",
  codex: {
    ...manifest.codex,
    command: join(binRoot, "codex"),
    cliVersion: "claimed-cli-version",
    profileHash: "claimed-profile-hash",
    permissions: "claimed-target-only-permissions",
    budget: { maxTokens: 777, timeoutMs }
  },
  containment: {
    ...manifest.containment,
    command: join(binRoot, "bwrap")
  }
});

const passingChecker = async (): Promise<PairedRepairScore> => ({
  outcome: "tie",
  baseline: { status: "pass", score: 3, checks: [], changedFiles: [] },
  krn: { status: "pass", score: 3, checks: [], changedFiles: [] },
  reason: "deterministic held-out checker fixture"
});

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

  it("captures fixed-point tree hashing that treats VCS metadata as source content", async () => {
    const root = await mkdtemp(join(tmpdir(), "krn-trial-tree-vcs-"));

    try {
      await writeFile(join(root, "fixture.txt"), "same source", "utf8");
      const sourceHash = await hashTree(root);
      await mkdir(join(root, ".git"));
      await writeFile(join(root, ".git", "HEAD"), "ref: refs/heads/main\n", "utf8");

      expect(await hashTree(root)).not.toBe(sourceHash);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("captures fixed-point tree hashing that omits executable modes", async () => {
    const root = await mkdtemp(join(tmpdir(), "krn-trial-tree-mode-"));

    try {
      const file = join(root, "fixture.sh");
      await writeFile(file, "#!/bin/sh\nexit 0\n", "utf8");
      const sourceHash = await hashTree(root);
      await chmod(file, 0o755);

      expect(await hashTree(root)).toBe(sourceHash);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
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

  it("captures declared conditions, host environment, invalid exits, timeouts, and replay at the fixed point", async () => {
    const root = await mkdtemp(join(tmpdir(), "krn-tracked-trial-fairness-"));
    const source = await makeRunnableTargetSource();
    const binRoot = join(root, "bin");
    const hostProbe = join(root, "host-probe.txt");
    await mkdir(binRoot, { recursive: true });
    await makeFakeTool(join(binRoot, "codex"), "exit 0");
    await makeFakeTool(join(binRoot, "bwrap"), "exit 1");
    // Keep the tree-hash falsifier isolated from later arm-condition falsifiers.
    await makeFakeGit(join(binRoot, "git"));

    try {
      const nonzeroManifest = runnableManifest(binRoot, 1_000);
      const timeoutManifest = runnableManifest(binRoot, 20);
      const replayPacket = {
        ...packet,
        request: { runId: nonzeroManifest.runId }
      };
      const [first, replay, timeout] = await withProcessEnvironment({
        KRN_TRIAL_HOST_SENTINEL: "host-secret-visible-to-probe",
        KRN_TRIAL_HOST_PROBE: hostProbe,
        KRN_TRIAL_OPENAI_API_KEY: "trial",
        PATH: `${binRoot}${delimiter}${process.env.PATH ?? ""}`
      }, async () => {
        const firstResult = await runTrackedPairedTrial({
          manifest: nonzeroManifest,
          sourceRoot: source,
          checkerRoot: process.cwd(),
          packet: replayPacket
        }, passingChecker);
        const replayResult = await runTrackedPairedTrial({
          manifest: nonzeroManifest,
          sourceRoot: source,
          checkerRoot: process.cwd(),
          packet: replayPacket
        }, passingChecker);
        await makeFakeTool(join(binRoot, "bwrap"), "while :; do :; done");
        const timeoutResult = await runTrackedPairedTrial({
          manifest: timeoutManifest,
          sourceRoot: source,
          checkerRoot: process.cwd(),
          packet: replayPacket
        }, passingChecker);
        return [firstResult, replayResult, timeoutResult] as const;
      });

      expect(await readFile(hostProbe, "utf8")).toBe("host-secret-visible-to-probe");
      expect(first.execution.conditions).toMatchObject({
        codexCli: "claimed-cli-version",
        profileHash: "claimed-profile-hash",
        permissions: "claimed-target-only-permissions",
        budget: { maxTokens: 777, timeoutMs: 1_000 }
      });
      expect(first.execution.conditions).not.toHaveProperty("observedCodexCli");
      expect(first.status).toBe("passed");
      expect(first.execution.baseline?.exitCode).toBe(1);
      expect(first.execution.krn?.exitCode).toBe(1);
      expect(replay.status).toBe("passed");
      expect(replay.runId).toBe(first.runId);
      expect(replay.execution.baseline?.exitCode).toBe(1);
      expect(timeout.status).toBe("passed");
      expect(timeout.execution.baseline?.exitCode).toBeNull();
      expect(timeout.execution.krn?.exitCode).toBeNull();
    } finally {
      await rm(root, { recursive: true, force: true });
      await rm(source, { recursive: true, force: true });
    }
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
