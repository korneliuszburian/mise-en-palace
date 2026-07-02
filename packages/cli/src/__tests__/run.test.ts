import { describe, expect, it } from "vitest";

import {
  runCli
} from "../runCli.js";
import {
  now
} from "./helpers/testRuntime.js";

describe("runCli", () => {
  it("rejects the removed public audit command", async () => {
    const result = await runCli(["audit", "repo"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(2);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("Unsupported command: audit");
    expect(result.stderr).not.toContain("krn audit");
  });

  it("prints run show DB requirements in help", async () => {
    const result = await runCli(["run", "--help"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Usage: krn run show --run-id <execution-run-id> [--json]");
    expect(result.stdout).toContain("requires: KRN_DATABASE_URL and a persisted execution run");
    expect(result.stdout).toContain("verify DB first: pnpm db:ready");
  });

  it("explains how to unblock run show without database config", async () => {
    const result = await runCli(["run", "show", "--run-id", "execution-run-1"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("KRN_DATABASE_URL is required for krn run show");
    expect(result.stderr).toContain(
      "Next action: export KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn and run pnpm db:ready before readback"
    );
    expect(result.stderr).toContain(
      "Does not prove: setting KRN_DATABASE_URL does not prove the requested run exists, commands executed, or Memory Core mutated"
    );
  });

  it("groups public, governed admin, and internal dev commands in help", async () => {
    const result = await runCli(["--help"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Public operator commands:");
    expect(result.stdout).toContain("Governed admin commands:");
    expect(result.stdout).toContain("Internal/dev commands:");
    expect(result.stdout).toContain("krn db --help");
    expect(result.stdout).toContain(
      "DB readiness/smoke commands prove local runtime plumbing only"
    );
    expect(result.stdout).not.toContain("krn audit");
  });
});
