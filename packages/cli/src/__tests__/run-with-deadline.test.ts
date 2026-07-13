import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = fileURLToPath(new URL("../../../../", import.meta.url));
const runner = join(repoRoot, "scripts/run-with-deadline.mjs");

const quoteForPosixShell = (value: string): string => `'${value.replaceAll("'", "'\"'\"'")}'`;

const run = (script: string, timeoutMs = 500, graceMs = 100): ReturnType<typeof spawnSync> =>
  spawnSync(
    process.execPath,
    [runner, "--timeout-ms", String(timeoutMs), "--grace-ms", String(graceMs), "--", `${quoteForPosixShell(process.execPath)} -e ${quoteForPosixShell(script)}`],
    { cwd: repoRoot, encoding: "utf8", env: { ...process.env, SHELL: "/bin/sh" } },
  );

describe("run-with-deadline", () => {
  it("forwards successful stdout, stderr, and exit status", () => {
    const result = run("process.stdout.write('out'); process.stderr.write('err');");

    expect(result.status).toBe(0);
    expect(result.stdout).toBe("out");
    expect(result.stderr).toBe("err");
  });

  it("preserves a failing child exit status and output", () => {
    const result = run("process.stdout.write('failed'); process.exitCode = 7;");

    expect(result.status).toBe(7);
    expect(result.stdout).toBe("failed");
  });

  it("returns the timeout status after the bounded grace period", () => {
    const result = run("trap 'printf term >&2; exit 143' TERM; while :; do sleep 1; done", 50, 500);

    expect(result.status).toBe(124);
  });

  it("kills child processes in the timed-out process group", async () => {
    const fixtureRoot = mkdtempSync(join(tmpdir(), "krn-deadline-child-"));
    const marker = join(fixtureRoot, "child-finished");

    try {
      const script = [
        "const { spawn } = await import('node:child_process');",
        `spawn(process.execPath, ['-e', ${JSON.stringify(`setTimeout(() => require('node:fs').writeFileSync(${JSON.stringify(marker)}, 'late'), 250);`)}]);`,
        "setInterval(() => {}, 1000);",
      ].join(" ");
      const result = run(script, 50, 50);

      expect(result.status).toBe(124);
      await new Promise((resolve) => setTimeout(resolve, 350));
      expect(existsSync(marker)).toBe(false);
    } finally {
      rmSync(fixtureRoot, { recursive: true, force: true });
    }
  });

  it("keeps the canonical verify:db command inside the bounded shell", () => {
    const packageJson = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")) as {
      scripts?: Record<string, string>;
    };

    expect(packageJson.scripts?.["verify:db"]).toContain("run-with-deadline.mjs");
    expect(packageJson.scripts?.["verify:db"]).toContain("pnpm db:migrate && pnpm db:ready");
  });
});
