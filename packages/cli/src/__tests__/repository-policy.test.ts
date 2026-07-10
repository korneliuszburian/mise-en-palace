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

    expect(usesLines).toHaveLength(9);
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

  it("keeps the Node and pnpm declarations shared with CI and self-checkable", () => {
    const packageJson = JSON.parse(readRootFile("package.json")) as {
      packageManager?: string;
      engines?: Record<string, string>;
    };
    const nodeVersion = readRootFile(".node-version").trim();
    const workflow = readRootFile(".github/workflows/ci.yml");
    const checker = join(repoRoot, "scripts/check-toolchain.mjs");

    expect(packageJson.packageManager).toBe("pnpm@10.32.1");
    expect(packageJson.engines?.node).toBe(`${nodeVersion}.x`);
    expect(packageJson.engines?.pnpm).toBe("10.32.1");
    expect(workflow.match(/node-version-file: \.node-version/gu)).toHaveLength(3);
    expect(workflow.match(/pnpm toolchain:check -- --allow-missing-rtk/gu)).toHaveLength(2);

    const fixtureRoot = mkdtempSync(join(tmpdir(), "krn-toolchain-contract-"));
    const currentNodeMajor = process.versions.node.split(".")[0];

    try {
      writeFileSync(join(fixtureRoot, ".node-version"), `${currentNodeMajor}\n`);
      writeFileSync(
        join(fixtureRoot, "package.json"),
        JSON.stringify({ packageManager: "pnpm@10.32.1" }),
      );

      expect(execFileSync(process.execPath, [checker, "--root", fixtureRoot, "--allow-missing-rtk"], {
        cwd: repoRoot,
        encoding: "utf8",
      })).toContain("Toolchain contract passed");

      writeFileSync(
        join(fixtureRoot, "package.json"),
        JSON.stringify({ packageManager: "pnpm@0.0.0" }),
      );

      let failure: { status?: number; stderr?: string } | undefined;
      try {
        execFileSync(process.execPath, [checker, "--root", fixtureRoot, "--allow-missing-rtk"], {
          cwd: repoRoot,
          encoding: "utf8",
          stdio: "pipe",
        });
      } catch (error) {
        failure = error as { status?: number; stderr?: string };
      }

      expect(failure?.status).toBe(1);
      expect(failure?.stderr).toContain("pnpm 10.32.1 is unsupported; use pnpm 0.0.0");
    } finally {
      rmSync(fixtureRoot, { recursive: true, force: true });
    }
  });

  it("tests every declared platform target and rejects native Windows shells", () => {
    const checker = join(repoRoot, "scripts/check-platform.mjs");
    expect(readRootFile("README.md")).toContain("Native Windows shells are not supported");
    expect(readRootFile("CONTRIBUTING.md")).toContain("Linux/macOS/WSL");
    const supportedTargets = [
      ["--platform", "linux", "--shell", "bash", "--wsl"],
      ["--platform", "darwin", "--shell", "zsh"],
      ["--platform", "linux", "--shell", "sh"]
    ];

    for (const args of supportedTargets) {
      expect(execFileSync(process.execPath, [checker, ...args], {
        cwd: repoRoot,
        encoding: "utf8"
      })).toContain("Platform contract passed");
    }

    let failure: { status?: number; stderr?: string } | undefined;
    try {
      execFileSync(process.execPath, [
        checker,
        "--platform",
        "win32",
        "--shell",
        "powershell.exe"
      ], {
        cwd: repoRoot,
        encoding: "utf8",
        stdio: "pipe"
      });
    } catch (error) {
      failure = error as { status?: number; stderr?: string };
    }

    expect(failure?.status).toBe(1);
    expect(failure?.stderr).toContain("use Linux, macOS, or WSL");
  });

  it("declares internal-alpha policy, private security reporting, and sensitive-path ownership", () => {
    const security = readRootFile("SECURITY.md");
    const contributing = readRootFile("CONTRIBUTING.md");
    const codeowners = readRootFile(".github/CODEOWNERS");
    const license = readRootFile("LICENSE.md");

    expect(license).toContain("no license grant");
    expect(license).toContain("not an external release");
    expect(security).toContain("Report suspected vulnerabilities privately");
    expect(security).toMatch(/no public\s+response or remediation SLA/u);
    expect(security).toContain("external release readiness");
    expect(contributing).toContain("AGENTS.md");
    expect(contributing).toContain("CONTEXT.md");
    expect(contributing).toContain("CONVENTIONS.md");
    expect(contributing).toContain("Beads");
    expect(contributing).toContain("pnpm quality:fallow:ci");
    expect(codeowners).toContain("/packages/db/src/migrations/ @korneliuszburian");
    expect(codeowners).toContain("/.github/ @korneliuszburian");
    expect(codeowners).toContain("/SECURITY.md @korneliuszburian");
    expect(codeowners).toContain("/security-baseline.json @korneliuszburian");
  });

  it("keeps one canonical executable required-eval profile with explicit test files", () => {
    const packageJson = JSON.parse(readRootFile("package.json")) as {
      scripts?: Record<string, string>;
    };
    const scripts = packageJson.scripts ?? {};
    const workflow = readRootFile(".github/workflows/ci.yml");

    expect(scripts["eval:required"]).toBeTruthy();
    expect(scripts["eval:ci"]).toBeUndefined();
    expect(scripts["eval:behavior:smoke"]).toBeUndefined();
    expect(scripts["eval:krn:smoke"]).toBeUndefined();
    expect(scripts["eval:required:behavior-gates"]).toContain("exec vitest run");
    expect(scripts["eval:required:behavior-gates"]).toContain(
      "src/__tests__/krn-behavior-gate.test.ts",
    );
    expect(scripts["eval:required:readback-falsifiers"]).toContain(
      "src/__tests__/decision-packet-eval.test.ts",
    );
    expect(scripts["eval:required:readback-falsifiers"]).not.toContain("test --");
    expect(scripts["eval:required:codex-brief-render"]).toContain(
      "src/__tests__/codex-brief-behavior.test.ts",
    );
    expect(workflow).toContain("run: pnpm eval:required");
    expect(workflow).not.toContain("eval:krn:smoke");
  });

  it("keeps Fallow baselines versioned, category-specific, and visible", () => {
    const packageJson = JSON.parse(readRootFile("package.json")) as {
      devDependencies?: Record<string, string>;
      scripts?: Record<string, string>;
    };
    const fallowPolicy = readRootFile("fallow-baselines/README.md");
    const fallowConfig = readRootFile(".fallowrc.json");

    expect(packageJson.devDependencies?.fallow).toBe("2.103.0");
    expect(packageJson.scripts?.["quality:fallow:ci"]).toContain(
      "--dead-code-baseline fallow-baselines/dead-code.json",
    );
    expect(packageJson.scripts?.["quality:fallow:ci"]).toContain(
      "--health-baseline fallow-baselines/health.json",
    );
    expect(packageJson.scripts?.["quality:fallow:ci"]).toContain(
      "--dupes-baseline fallow-baselines/dupes.json",
    );
    expect(fallowPolicy).toContain("Fallow `2.103.0` (schema version `7`)");
    expect(fallowPolicy).toMatch(/No aggregate\s+Fallow score/u);
    expect(fallowPolicy).toContain("@korneliuszburian");
    expect(fallowConfig).toContain("tests/fixtures/**");
    expect(fallowConfig).toContain("**/*.typecheck.ts");
  });

  it("keeps security exceptions and allowlists reviewed in a tracked baseline", () => {
    const baseline = JSON.parse(readRootFile("security-baseline.json")) as {
      allowedLicenses?: string[];
      secretExceptions?: Array<{ path?: string; pattern?: string; reason?: string }>;
      dependencyVulnerabilityExceptions?: string[];
    };
    const exception = baseline.secretExceptions?.[0];

    expect(baseline.allowedLicenses).toEqual([
      "Apache-2.0",
      "BSD-3-Clause",
      "ISC",
      "MIT",
      "MPL-2.0",
      "Unlicense",
    ]);
    expect(exception).toMatchObject({
      path: "packages/harness/src/observations/__tests__/observer-input.test.ts",
      pattern: "GitHub token",
    });
    expect(exception?.reason).toContain("fake token");
    expect(baseline.dependencyVulnerabilityExceptions).toEqual([]);
  });

  it("keeps staged security scans blocking and scheduled without mutable actions", () => {
    const workflow = readRootFile(".github/workflows/ci.yml");

    expect(workflow).toContain('cron: "17 3 * * 1"');
    expect(workflow).toContain("name: Dependency, secret, and license policy");
    expect(workflow).toContain("run: pnpm security:dependency-audit");
    expect(workflow).toContain("run: pnpm security:secrets");
    expect(workflow).toContain("run: pnpm security:licenses");
    expect(workflow).not.toContain("continue-on-error: true");
    expect(workflow.split("uses:").length - 1).toBe(9);
  });

  it("keeps Beads history validation and retention policy explicit", () => {
    const operations = readRootFile("docs/BEADS_OPERATIONS.md");
    const contributing = readRootFile("CONTRIBUTING.md");

    expect(operations).toContain("180 days");
    expect(operations).toContain("No automated destructive compaction is enabled");
    expect(operations).toContain("validate-beads-history.mjs validate");
    expect(contributing).toContain("Beads");
  });
});
