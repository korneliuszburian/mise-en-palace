import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  buildPairedRepairPrompts,
  pairedRepairEvalCandidate,
  pairedRepairUsefulnessOutcome,
  scorePairedRepairs,
  scoreTargetRepair,
  runHeldOutRuntimeWorker,
  type CommandResult,
  type HeldOutObservation
} from "../internal/eval/paired-live-codex-repair.js";

const command = (exitCode = 0): CommandResult => ({
  command: "fixture",
  args: [],
  exitCode,
  stdout: "",
  stderr: ""
});

const observation = (overrides: Partial<HeldOutObservation> = {}): HeldOutObservation => ({
  threw: false,
  accepted: false,
  savedUserDelta: 0,
  resultState: "ok:false",
  ...overrides
});

const sourceFiles = {
  "src/config.ts": [
    "export function parseJsonConfig(raw: string): unknown {",
    "  return JSON.parse(raw);",
    "}"
  ].join("\n"),
  "src/userService.ts": [
    "export type CreateUserResult = { ok: true } | { ok: false; error: string };",
    "export function createUserFromJson(): CreateUserResult { return { ok: false, error: \"x\" }; }"
  ].join("\n"),
  "tests/userService.test.ts": "invalid_json missing_email invalid_role"
};

describe("paired live Codex repair eval", () => {
  it("generates a packet-only prompt delta and stable hashes", () => {
    const first = buildPairedRepairPrompts({
      task: "repair the boundary",
      decisionPacket: { packetIdentity: { checksum: "abc" } }
    });
    const second = buildPairedRepairPrompts({
      task: "repair the boundary",
      decisionPacket: { packetIdentity: { checksum: "abc" } }
    });

    expect(first).toEqual(second);
    expect(first.baseline).not.toContain("packetIdentity");
    expect(first.krn).toContain("packetIdentity");
    expect(first.delta).toMatchObject({
      generated: true,
      packetOnlyByConstruction: true,
      deltaBytes: expect.any(Number)
    });
  });

  it("scores held-out behavior independently of target prose", () => {
    const result = scoreTargetRepair({
      sourceFiles,
      changedFiles: ["src/config.ts", "src/userService.ts", "tests/userService.test.ts"],
      commands: {
        test: command(),
        typecheck: command(),
        diffCheck: command()
      },
      runtimeAvailable: true,
      observations: {
        invalidJson: observation(),
        missingEmail: observation(),
        invalidRole: observation()
      }
    });

    expect(result.status).toBe("pass");
    expect(result.score).toBe(3);
    expect(result.checks.every((check) => check.passed)).toBe(true);
  });

  it("does not award advantage for static tokens without held-out behavior", () => {
    const result = scoreTargetRepair({
      sourceFiles: {
        "src/config.ts": "const prose = 'unknown';",
        "src/userService.ts": "const prose = 'CreateUserResult';",
        "tests/userService.test.ts": "invalid_json missing_email invalid_role"
      },
      changedFiles: ["src/config.ts", "src/userService.ts", "tests/userService.test.ts"],
      commands: {
        test: command(),
        typecheck: command(),
        diffCheck: command()
      },
      runtimeAvailable: true,
      observations: {
        invalidJson: observation({ accepted: true, savedUserDelta: 1 }),
        missingEmail: observation({ accepted: true, savedUserDelta: 1 }),
        invalidRole: observation({ accepted: true, savedUserDelta: 1 })
      }
    });

    expect(result.status).toBe("fail");
    expect(result.score).toBe(0);
  });

  it("does not count validity gates as paired advantage", () => {
    const result = scoreTargetRepair({
      sourceFiles,
      changedFiles: ["src/config.ts", "src/userService.ts", "tests/userService.test.ts"],
      commands: {
        test: command(1),
        typecheck: command(),
        diffCheck: command()
      },
      runtimeAvailable: true,
      observations: {
        invalidJson: observation(),
        missingEmail: observation(),
        invalidRole: observation()
      }
    });

    expect(result.status).toBe("invalid");
    expect(result.score).toBe(3);
  });

  it("invalidates an untracked forbidden file from the preflight manifest", () => {
    const result = scoreTargetRepair({
      sourceFiles,
      changedFiles: ["src/config.ts", "package.json"],
      changeManifest: {
        status: "known",
        trackedFiles: ["src/config.ts"],
        untrackedFiles: ["package.json"],
        changedFiles: ["src/config.ts", "package.json"],
        forbiddenFiles: ["package.json"],
        statusOutput: "?? package.json"
      },
      commands: { test: command(), typecheck: command(), diffCheck: command() },
      runtimeAvailable: true,
      observations: {
        invalidJson: observation(),
        missingEmail: observation(),
        invalidRole: observation()
      }
    });

    expect(result.status).toBe("invalid");
    expect(result.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "preflight", passed: false }),
      expect.objectContaining({ name: "forbidden_files", passed: false })
    ]));
  });

  it("fails closed when target code attempts to read a host sentinel", async () => {
    const root = await mkdtemp(join(tmpdir(), "krn-live-containment-test-"));
    const compileRoot = await mkdtemp(join(root, "compiled-"));
    const sandboxRoot = await mkdtemp(join(root, "sandbox-"));
    const sentinel = join(root, "host-secret.txt");
    const moduleRoot = join(compileRoot, "src");
    await writeFile(sentinel, "must-not-be-read", "utf8");
    await mkdir(moduleRoot, { recursive: true });
    await writeFile(join(moduleRoot, "userService.js"), [
      "import { readFileSync } from 'node:fs';",
      `readFileSync(${JSON.stringify(sentinel)}, 'utf8');`,
      "export const createUserFromJson = () => ({ kind: 'invalid_input' });",
      "export const listSavedUsers = () => [];"
    ].join("\n"), "utf8");

    try {
      const result = await runHeldOutRuntimeWorker(
        compileRoot,
        compileRoot,
        process.cwd(),
        sandboxRoot
      );

      expect(result.runtimeAvailable).toBe(false);
      expect(await readFile(sentinel, "utf8")).toBe("must-not-be-read");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("invalidates an arm when the target test or forbidden-file boundary fails", () => {
    const result = scoreTargetRepair({
      sourceFiles,
      changedFiles: ["src/config.ts", "package.json"],
      commands: {
        test: command(1),
        typecheck: command(),
        diffCheck: command()
      },
      runtimeAvailable: true,
      observations: {
        invalidJson: observation(),
        missingEmail: observation(),
        invalidRole: observation()
      }
    });

    expect(result.status).toBe("invalid");
    expect(result.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "target_test", passed: false }),
      expect.objectContaining({ name: "forbidden_files", passed: false })
    ]));
  });

  it("classifies equal valid arms as tie and rejects invalid comparison", () => {
    const pass = scoreTargetRepair({
      sourceFiles,
      changedFiles: ["src/config.ts", "src/userService.ts", "tests/userService.test.ts"],
      commands: { test: command(), typecheck: command(), diffCheck: command() },
      runtimeAvailable: true,
      observations: {
        invalidJson: observation(),
        missingEmail: observation(),
        invalidRole: observation()
      }
    });

    expect(scorePairedRepairs({ baseline: pass, krn: pass })).toMatchObject({
      outcome: "tie",
      reason: "Both arms passed the same number of held-out checks."
    });
    expect(scorePairedRepairs({
      baseline: pass,
      krn: { ...pass, status: "invalid" }
    }).outcome).toBe("invalid");
  });

  it("maps only a measured win to helped and preserves neutral, hurt, and unknown", () => {
    expect(pairedRepairUsefulnessOutcome("win")).toBe("helped");
    expect(pairedRepairUsefulnessOutcome("tie")).toBe("neutral");
    expect(pairedRepairUsefulnessOutcome("loss")).toBe("hurt");
    expect(pairedRepairUsefulnessOutcome("invalid")).toBe("unknown");
  });

  it("creates a reviewable eval candidate without mutating durable truth", () => {
    const score = scoreTargetRepair({
      sourceFiles,
      changedFiles: ["src/config.ts", "src/userService.ts", "tests/userService.test.ts"],
      commands: { test: command(), typecheck: command(), diffCheck: command() },
      runtimeAvailable: true,
      observations: {
        invalidJson: observation(),
        missingEmail: observation(),
        invalidRole: observation()
      }
    });
    const candidate = pairedRepairEvalCandidate({
      score: scorePairedRepairs({ baseline: score, krn: score }),
      runId: "run-1",
      packetChecksum: "a".repeat(64),
      evidenceRefs: ["packet:" + "a".repeat(64), "checker:live-score"],
      createdAt: "2026-07-10T00:00:00.000Z"
    });

    expect(candidate).toMatchObject({
      id: "paired-target-repair:run-1",
      status: "candidate",
      metadata: {
        outcome: "tie",
        usefulnessOutcome: "neutral",
        packetChecksum: "a".repeat(64)
      }
    });
    expect(candidate.metadata.doesNotProve).toEqual(expect.arrayContaining([
      expect.stringContaining("does not mutate MemoryRecord")
    ]));
  });
});
