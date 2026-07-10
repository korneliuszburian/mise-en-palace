import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = fileURLToPath(new URL("../../../../", import.meta.url));
const readRootFile = (path: string): string => readFileSync(`${repoRoot}/${path}`, "utf8");
const pgvectorImage =
  "pgvector/pgvector:pg16@sha256:131dcf7ff6a900545df8e7e092c270aa8c6db2f2c818e408cb45ec21316b74e6";

describe("repository policy boundaries", () => {
  it("keeps development Postgres loopback-bound and image-pinned", () => {
    const compose = readRootFile("compose.yaml");
    const ci = readRootFile(".github/workflows/ci.yml");

    expect(compose).toContain(`image: ${pgvectorImage}`);
    expect(compose).toContain('"${KRN_POSTGRES_BIND_ADDRESS:-127.0.0.1}:54329:5432"');
    expect(compose).not.toContain('"54329:5432"');
    expect(ci).toContain(`image: ${pgvectorImage}`);
  });

  it("ignores local secret/generated artifacts while tracking the example env", () => {
    const gitignore = readRootFile(".gitignore");
    const trackedExample = execFileSync(
      "git",
      ["ls-files", "--error-unmatch", ".env.example"],
      { cwd: repoRoot, encoding: "utf8" }
    ).trim();

    expect(gitignore).toContain(".env.*");
    expect(gitignore).toContain("!.env.example");
    expect(gitignore).toContain("coverage/");
    expect(gitignore).toContain("*.log");
    expect(trackedExample).toBe(".env.example");
    expect(gitignore).not.toContain("tests/fixtures/");
    expect(gitignore).not.toContain("packages/db/src/migrations/");
  });

  it("requires third-party workflow actions to use reviewed immutable SHAs", () => {
    const workflow = readRootFile(".github/workflows/ci.yml");
    const usesLines = workflow.split("\n").filter((line) => line.includes("uses:"));

    expect(usesLines).toHaveLength(6);
    expect(usesLines.every((line) =>
      /uses:\s+[^@\s]+@[0-9a-f]{40}\s+#\s+v[0-9]+(?:\.[0-9]+)*/u.test(line)
    )).toBe(true);
    expect(usesLines.some((line) => /@[vA-Za-z]/u.test(line))).toBe(false);
  });

  it("requires every source workspace package to expose test and typecheck scripts", () => {
    const rootPackage = JSON.parse(readRootFile("package.json")) as {
      scripts?: Record<string, string>;
    };
    const checker = join(repoRoot, "scripts/check-workspace-scripts.mjs");

    expect(rootPackage.scripts?.test).not.toContain("--if-present");
    expect(rootPackage.scripts?.typecheck).not.toContain("--if-present");
    expect(execFileSync(process.execPath, [checker], { cwd: repoRoot, encoding: "utf8" })).toContain(
      "Workspace script contract passed",
    );

    const fixtureRoot = mkdtempSync(join(tmpdir(), "krn-workspace-contract-"));
    const fixturePackageRoot = join(fixtureRoot, "packages/missing-scripts");
    mkdirSync(join(fixturePackageRoot, "src"), { recursive: true });
    writeFileSync(
      join(fixturePackageRoot, "package.json"),
      JSON.stringify({ name: "@fixture/missing-scripts" }),
    );

    try {
      let failure: { status?: number; stderr?: string } | undefined;
      try {
        execFileSync(process.execPath, [checker, "--root", fixtureRoot], {
          cwd: repoRoot,
          encoding: "utf8",
          stdio: "pipe",
        });
      } catch (error) {
        failure = error as { status?: number; stderr?: string };
      }

      expect(failure?.status).toBe(1);
      expect(failure?.stderr).toContain("missing test, typecheck");
    } finally {
      rmSync(fixtureRoot, { recursive: true, force: true });
    }
  });

  it("makes CI whitespace checks range-aware and bounded", () => {
    const workflow = readRootFile(".github/workflows/ci.yml");

    expect(workflow).toContain("timeout-minutes: 15");
    expect(workflow).toContain("timeout-minutes: 30");
    expect(workflow).toContain('github.event.pull_request.base.sha');
    expect(workflow).toContain('github.event.before');
    expect(workflow).toContain("git rev-list --max-parents=0 HEAD");
    expect(workflow).toContain('git diff --check "$base_sha" "${{ github.sha }}"');
    expect(workflow.match(/run: git diff --check\n/gu)).toHaveLength(2);
    expect(workflow).toContain("timeout --signal=TERM --kill-after=10s 120s pnpm db:ready");
    expect(workflow).toContain("if: ${{ failure() || cancelled() }}");
  });
});
