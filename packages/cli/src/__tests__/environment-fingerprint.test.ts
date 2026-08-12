import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import {
  describe,
  expect,
  it,
  vi
} from "vitest";

import {
  buildEnvironmentFingerprint,
  collectEnvironmentFingerprint
} from "../environment-fingerprint.js";
import {
  writeJsonEvalResult
} from "../internal/eval/eval-main.js";
import {
  runCli
} from "../run-cli.js";

const fingerprintInputs = {
  gitCommit: "commit-a",
  gitDirty: false,
  lockfileSha256: "lock-a",
  nodeVersion: "v22.0.0",
  pnpmVersion: "10.32.1",
  os: "linux",
  arch: "x64",
  postgresServerVersion: "16.14",
  pgvectorVersion: "0.8.3",
  evaluatorVersion: "evaluator-a",
  checkerVersion: "checker-a",
  mcpProtocolVersion: "2025-06-18",
  schemaVersion: "krn-schema.v1"
} as const;

describe("environment fingerprint", () => {
  it("is deterministic and changes when a load-bearing version changes", () => {
    const first = buildEnvironmentFingerprint(fingerprintInputs);
    const replay = buildEnvironmentFingerprint({ ...fingerprintInputs });
    const changedProtocol = buildEnvironmentFingerprint({
      ...fingerprintInputs,
      mcpProtocolVersion: "2025-11-25"
    });

    expect(replay).toEqual(first);
    expect(changedProtocol.id).not.toBe(first.id);
    expect(buildEnvironmentFingerprint({
      ...fingerprintInputs,
      worktreeIdentity: "dirty-a"
    }).id).not.toBe(buildEnvironmentFingerprint({
      ...fingerprintInputs,
      worktreeIdentity: "dirty-b"
    }).id);
  });

  it("discovers a renamed git root and distinguishes clean from failed inspection", async () => {
    const execFileAsync = promisify(execFile);
    const renamedRoot = await mkdtemp(path.join(os.tmpdir(), "krn-renamed-clone-"));
    const noGitRoot = await mkdtemp(path.join(os.tmpdir(), "krn-no-git-"));

    try {
      await execFileAsync("git", ["init", "-q"], { cwd: renamedRoot });
      await execFileAsync("git", ["config", "user.email", "krn-test@example.invalid"], { cwd: renamedRoot });
      await execFileAsync("git", ["config", "user.name", "KRN Test"], { cwd: renamedRoot });
      await writeFile(path.join(renamedRoot, "README.md"), "clean clone\n", "utf8");
      await execFileAsync("git", ["add", "README.md"], { cwd: renamedRoot });
      await execFileAsync("git", ["commit", "-qm", "test: clean clone"], { cwd: renamedRoot });

      const clean = await collectEnvironmentFingerprint({ repoRoot: renamedRoot });
      const failed = await collectEnvironmentFingerprint({ repoRoot: noGitRoot });

      expect(clean.inputs.gitDirty).toBe(false);
      expect(clean.inputs.worktreeIdentity).toMatch(/^[a-f0-9]{64}$/u);
      expect(failed.inputs.gitDirty).toBe("unknown");
      expect(failed.inputs.worktreeIdentity).toBe("unknown");
    } finally {
      await Promise.all([
        rm(renamedRoot, { recursive: true, force: true }),
        rm(noGitRoot, { recursive: true, force: true })
      ]);
    }
  });

  it("keeps collected inputs secret-free and independent of absolute paths", async () => {
    const fingerprint = await collectEnvironmentFingerprint({
      repoRoot: process.cwd()
    });
    const serialized = JSON.stringify(fingerprint);

    expect(fingerprint.id).toMatch(/^[a-f0-9]{64}$/u);
    expect(serialized).not.toContain(process.cwd());
    expect(serialized).not.toContain("postgres://");
    expect(serialized).not.toContain("secret");
  });

  it("attaches fingerprints to doctor, DB, and eval outputs", async () => {
    const doctor = await runCli(["doctor"], {
      env: { KRN_DB_BACKEND: "postgres" },
      cwd: process.cwd()
    });
    const dbReadiness = await runCli(["db", "readiness"], {
      env: { KRN_DB_BACKEND: "postgres" },
      cwd: process.cwd()
    });

    expect(doctor.stdout).toMatch(/^Environment fingerprint: [a-f0-9]{64}$/mu);
    expect(dbReadiness.stdout).toMatch(/^Environment fingerprint: [a-f0-9]{64}$/mu);

    const output = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    try {
      await writeJsonEvalResult(async () => ({ status: "pass" }));
      const serialized = String(output.mock.calls[0]?.[0]);
      const result: unknown = JSON.parse(serialized);

      expect(result).toMatchObject({
        status: "pass",
        environmentFingerprint: {
          kind: "krn.environmentFingerprint.v1"
        }
      });
    } finally {
      output.mockRestore();
    }
  }, 15_000);
});
