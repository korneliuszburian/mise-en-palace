import { describe, expect, it } from "vitest";

import {
  runCli
} from "./runCli.js";

const now = "2026-06-21T12:00:00.000Z";

describe("runCli", () => {
  it("prints a bounded no-store plan for plan --task", async () => {
    const result = await runCli(["plan", "--task", "improve KRN doctor brain store readiness"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN Plan");
    expect(result.stdout).toContain("Task: improve KRN doctor brain store readiness");
    expect(result.stdout).toContain("Persistence: disabled");
    expect(result.stdout).toContain("Context included: 0");
    expect(result.stdout).toContain("Context excluded: 0");
    expect(result.stdout).toContain("Evidence expected: pnpm typecheck, pnpm test, git diff --check");
    expect(result.stdout).toContain("KRN Codex Execution Brief");
    expect(result.stdout).toContain("Context activation abstained");
  });

  it("returns exit 2 for invalid plan args", async () => {
    const result = await runCli(["plan"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(2);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("Usage: krn plan --task");
  });

  it("prints a read-only doctor report", async () => {
    const result = await runCli(["doctor"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN Doctor");
    expect(result.stdout).toContain("Postgres config: not configured");
    expect(result.stdout).toContain("pgvector: skipped");
    expect(result.stdout).toContain("AGENTS.md: present");
    expect(result.stdout).toContain(".krn runtime truth: absent");
    expect(result.stdout).toContain("TypeScript strictness: enabled");
    expect(result.stdout).toContain("Forbidden surfaces: absent");
  });
});
