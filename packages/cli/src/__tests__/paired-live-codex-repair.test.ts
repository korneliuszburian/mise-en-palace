import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  buildPairedRepairPrompts,
  pairedRepairEvalCandidate,
  pairedRepairUsefulnessOutcome,
  scorePairedRepairs,
  scoreTargetRepair,
  runCommand,
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
  it("forces a timed-out command to settle when it ignores SIGTERM", async () => {
    const result = await runCommand(process.execPath, [
      "-e",
      "process.on('SIGTERM',()=>{});setTimeout(()=>process.exit(0),500);"
    ], process.cwd(), { timeoutMs: 150 });

    expect(result.exitCode).toBeNull();
    expect(result.stderr).toContain("command timed out");
    expect(result.durationMs).toBeLessThan(400);
  });

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

  it("keeps private repair mechanisms out of baseline participant inputs", async () => {
    const targetRoot = await mkdtemp(join(tmpdir(), "krn-blind-paired-target-"));
    const fixtureRoot = resolve(
      process.cwd(),
      "../../tests/fixtures/target-repos/weak-json-boundary-typescript"
    );
    const scenarioRoot = join(fixtureRoot, "scenarios/weak-json-boundary/files");
    const trackedManifest = JSON.parse(await readFile(resolve(
      process.cwd(),
      "../../tests/fixtures/paired-live-codex-repair/manifest.json"
    ), "utf8")) as { readonly task: string };
    const prompts = buildPairedRepairPrompts({
      task: trackedManifest.task,
      decisionPacket: { packetIdentity: { checksum: "private-packet-marker" } }
    });

    try {
      const materialized = await runCommand(process.execPath, [
        join(fixtureRoot, "scripts/materialize-scenario.mjs"),
        "weak-json-boundary",
        targetRoot
      ], fixtureRoot);
      expect(materialized.exitCode).toBe(0);

      expect(prompts.baseline).toContain(`Task: ${trackedManifest.task}`);
      expect(prompts.baseline).not.toContain("private-packet-marker");
      expect(prompts.krn).toContain("private-packet-marker");

      for (const participantPath of [
        "AGENTS.md",
        "README.md",
        "docs/repair-contract.md"
      ]) {
        const materializedInput = await readFile(join(targetRoot, participantPath), "utf8");
        const blindInput = await readFile(join(scenarioRoot, participantPath), "utf8");
        const operatorInput = await readFile(join(fixtureRoot, participantPath), "utf8");

        expect(materializedInput).toBe(blindInput);
        expect(materializedInput).not.toBe(operatorInput);
      }
    } finally {
      await rm(targetRoot, { recursive: true, force: true });
    }
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

  it("does not report a contract pass from runtime behavior alone", () => {
    const result = scoreTargetRepair({
      sourceFiles: {
        "src/config.ts": "export const parseJsonConfig = JSON.parse;",
        "src/userService.ts": "export const createUserFromJson = () => false;",
        "tests/userService.test.ts": "happy path only"
      },
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

    expect(result.score).toBe(3);
    expect(result.status).toBe("fail");
    expect(result.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "unknown_first", passed: false }),
      expect.objectContaining({ name: "finite_result_state", passed: false }),
      expect.objectContaining({ name: "focused_tests", passed: false })
    ]));
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
    expect(scorePairedRepairs({
      baseline: { ...pass, status: "fail" },
      krn: pass
    })).toMatchObject({
      outcome: "win",
      reason: "KRN satisfied the repair contract while the equal-contract baseline did not."
    });
    expect(scorePairedRepairs({
      baseline: { ...pass, status: "fail", score: 0 },
      krn: { ...pass, status: "fail", score: 1 }
    })).toMatchObject({
      outcome: "invalid",
      reason: "Neither arm satisfied the repair contract."
    });
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
