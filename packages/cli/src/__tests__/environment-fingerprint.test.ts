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
      env: {},
      cwd: process.cwd()
    });
    const dbReadiness = await runCli(["db", "readiness"], {
      env: {},
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
