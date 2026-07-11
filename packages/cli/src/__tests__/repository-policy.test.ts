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
    const packageJson = JSON.parse(readRootFile("package.json")) as {
      scripts?: Record<string, string>;
    };

    expect(workflow).toContain("timeout-minutes: 15");
    expect(workflow).toContain("timeout-minutes: 30");
    expect(packageJson.scripts?.["check:whitespace:committed"]).toBe(
      "node scripts/check-committed-whitespace.mjs",
    );
    expect(workflow.match(/pnpm check:whitespace:committed/gu)).toHaveLength(2);
    expect(workflow).toContain("KRN_WHITESPACE_EVENT");
    expect(workflow).toContain("KRN_WHITESPACE_BEFORE");
    expect(workflow).toContain("KRN_WHITESPACE_PR_BASE");
    expect(workflow.match(/fetch-depth: 0/gu)).toHaveLength(3);
    expect(workflow.match(/run: git diff --check\n/gu)).toHaveLength(2);
    expect(workflow).toContain("timeout --signal=TERM --kill-after=10s 120s pnpm db:ready");
    expect(workflow).toContain("if: ${{ failure() || cancelled() }}");
  });

  it("selects deterministic whitespace bases and rejects committed whitespace", () => {
    const checker = join(repoRoot, "scripts/check-committed-whitespace.mjs");
    const fixtureRoot = mkdtempSync(join(tmpdir(), "krn-whitespace-contract-"));

    try {
      execFileSync("git", ["init", "--quiet", "--initial-branch=main"], {
        cwd: fixtureRoot,
      });
      execFileSync("git", ["config", "user.email", "fixture@example.test"], {
        cwd: fixtureRoot,
      });
      execFileSync("git", ["config", "user.name", "Fixture"], { cwd: fixtureRoot });
      writeFileSync(join(fixtureRoot, "clean.txt"), "clean\n");
      execFileSync("git", ["add", "clean.txt"], { cwd: fixtureRoot });
      execFileSync("git", ["commit", "--quiet", "-m", "clean"], { cwd: fixtureRoot });
      const rootSha = execFileSync("git", ["rev-list", "--max-parents=0", "HEAD"], {
        cwd: fixtureRoot,
        encoding: "utf8",
      }).trim();

      const runBase = (env: Record<string, string>): string =>
        execFileSync(process.execPath, [checker, "--print-base"], {
          cwd: fixtureRoot,
          encoding: "utf8",
          env: { ...process.env, ...env },
        }).trim();

      expect(runBase({
        KRN_WHITESPACE_EVENT: "pull_request",
        KRN_WHITESPACE_PR_BASE: rootSha,
        KRN_WHITESPACE_BEFORE: "",
      })).toBe(rootSha);
      expect(runBase({
        KRN_WHITESPACE_EVENT: "push",
        KRN_WHITESPACE_PR_BASE: "",
        KRN_WHITESPACE_BEFORE: rootSha,
      })).toBe(rootSha);
      expect(runBase({
        KRN_WHITESPACE_EVENT: "schedule",
        KRN_WHITESPACE_PR_BASE: "",
        KRN_WHITESPACE_BEFORE: "",
      })).toBe(rootSha);
      expect(runBase({
        KRN_WHITESPACE_EVENT: "workflow_dispatch",
        KRN_WHITESPACE_PR_BASE: "",
        KRN_WHITESPACE_BEFORE: "0000000000000000000000000000000000000000",
      })).toBe(rootSha);

      writeFileSync(join(fixtureRoot, "bad.txt"), "bad trailing-space \n");
      execFileSync("git", ["add", "bad.txt"], { cwd: fixtureRoot });
      execFileSync("git", ["commit", "--quiet", "-m", "bad whitespace"], {
        cwd: fixtureRoot,
      });

      let failure: { status?: number; stderr?: string; stdout?: string } | undefined;
      try {
        execFileSync(process.execPath, [checker], {
          cwd: fixtureRoot,
          encoding: "utf8",
          env: {
            ...process.env,
            KRN_WHITESPACE_EVENT: "push",
            KRN_WHITESPACE_BEFORE: rootSha,
            KRN_WHITESPACE_PR_BASE: "",
          },
          stdio: "pipe",
        });
      } catch (error) {
        failure = error as { status?: number; stderr?: string };
      }

      expect(failure?.status).toBeGreaterThan(0);
      expect(`${failure?.stdout ?? ""}${failure?.stderr ?? ""}`).toContain("bad.txt");

      writeFileSync(join(fixtureRoot, "clean.txt"), "working-tree trailing-space \n");
      let workingTreeFailure: { status?: number } | undefined;
      try {
        execFileSync("git", ["diff", "--check"], { cwd: fixtureRoot, stdio: "pipe" });
      } catch (error) {
        workingTreeFailure = error as { status?: number };
      }
      expect(workingTreeFailure?.status).toBeGreaterThan(0);
    } finally {
      rmSync(fixtureRoot, { recursive: true, force: true });
    }
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

  it("runs the supported runtime contract before every alpha verification gate", () => {
    const packageJson = JSON.parse(readRootFile("package.json")) as {
      scripts?: Record<string, string>;
    };

    expect(packageJson.scripts?.["alpha:verify:fast"]?.startsWith(
      "pnpm toolchain:check && pnpm node22:type-boundary &&"
    )).toBe(true);
    expect(packageJson.scripts?.["alpha:verify:full"]?.startsWith(
      "pnpm toolchain:check && pnpm node22:type-boundary &&"
    )).toBe(true);
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

  it("blocks the current private source packages from release", () => {
    const checker = join(repoRoot, "scripts/check-release-boundary.mjs");
    const releaseDocs = readRootFile("docs/RELEASE_BOUNDARY.md");
    const packageJson = JSON.parse(readRootFile("package.json")) as {
      private?: boolean;
      version?: string;
      prepublishOnly?: string;
      scripts?: Record<string, string>;
    };

    expect(packageJson.private).toBe(true);
    expect(packageJson.version).toBe("0.0.0");
    expect(packageJson.scripts?.["release:check"]).toContain("check-release-boundary.mjs");
    expect(packageJson.prepublishOnly).toBe("node scripts/check-release-boundary.mjs");
    expect(releaseDocs).toContain("compiled artifacts");
    expect(releaseDocs).toContain("SBOM");
    expect(releaseDocs).toContain("migration and upgrade");

    let failure: { status?: number; stderr?: string } | undefined;
    try {
      execFileSync(process.execPath, [checker], {
        cwd: repoRoot,
        encoding: "utf8",
        stdio: "pipe"
      });
    } catch (error) {
      failure = error as { status?: number; stderr?: string };
    }

    expect(failure?.status).toBe(1);
    expect(failure?.stderr).toContain("internal alpha");
    expect(failure?.stderr).toContain("@krn/core");
  });

  it("distinguishes the non-gating report lane from canonical gates", () => {
    const rootPackage = JSON.parse(readRootFile("package.json")) as {
      scripts?: Record<string, string>;
    };
    const contributing = readRootFile("CONTRIBUTING.md");
    const agents = readRootFile("AGENTS.md");
    const gates = readRootFile("docs/VERIFICATION_GATES.md");

    expect(rootPackage.scripts?.["quality:fallow:report"]).toContain("run-fallow-report.mjs");
    expect(rootPackage.scripts?.["quality:fallow:ci"]).not.toContain("|| true");
    expect(gates).toContain("FALLOW REPORT (NON-GATING)");
    expect(gates).toContain("pnpm eval:required");
    expect(gates).toContain("pnpm eval:db");
    expect(contributing).toContain("docs/VERIFICATION_GATES.md");
    expect(agents).toContain("docs/VERIFICATION_GATES.md");
  });

  it("keeps focused architecture decision links valid and complete", () => {
    const index = readRootFile("docs/adr/README.md");
    const adrPaths = [
      "docs/adr/0002-index-subordinate-to-canonical-authority.md",
      "docs/adr/0003-usefulness-evidence-states.md",
      "docs/adr/0004-decision-packet-application-identity.md",
      "docs/adr/0005-active-versus-historical-evidence.md",
      "docs/adr/0006-bounded-mcp-transport.md"
    ];
    const requiredSections = [
      "## Decision",
      "## Rejected alternative",
      "## Consumer",
      "## Falsifier",
      "## Contraction / rollback"
    ];

    for (const adrPath of adrPaths) {
      const adr = readRootFile(adrPath);
      expect(index).toContain(`./${adrPath.slice("docs/adr/".length)}`);
      for (const section of requiredSections) {
        expect(adr, `${adrPath} missing ${section}`).toContain(section);
      }
    }
  });

  it("requires every fixture to have an owner and rejects unreferenced files", () => {
    const checker = join(repoRoot, "scripts/check-fixture-ownership.mjs");
    const current = execFileSync(process.execPath, [checker], {
      cwd: repoRoot,
      encoding: "utf8"
    });
    const manifest = JSON.parse(readRootFile("tests/fixtures/fixture-ownership.json")) as {
      fixtures?: Array<Record<string, unknown>>;
    };
    const recorded = manifest.fixtures?.find((entry) => entry.path ===
      "tests/fixtures/codex-decision-packet-obedience/recorded-replay-2026-07-06.json");

    expect(current).toContain("Fixture ownership check passed");
    expect(recorded).toMatchObject({
      provenance: expect.any(String),
      capturedAt: "2026-07-06",
      checkerVersion: expect.any(String),
      replayOwner: expect.any(String),
      mode: "recorded_replay"
    });

    const fixtureRoot = mkdtempSync(join(tmpdir(), "krn-fixture-ownership-"));
    const fixtureDirectory = join(fixtureRoot, "tests/fixtures");
    mkdirSync(fixtureDirectory, { recursive: true });
    writeFileSync(join(fixtureDirectory, "owned.json"), "{}\n");
    writeFileSync(join(fixtureDirectory, "fixture-ownership.json"), JSON.stringify({
      schemaVersion: "fixture-ownership.v1",
      fixtures: [{
        path: "tests/fixtures/owned.json",
        consumer: "fixture contract test",
        provenance: "test fixture",
        capturedAt: "2026-07-10",
        checkerVersion: "fixture-ownership.v1",
        replayOwner: "@korneliuszburian",
        archival: null
      }]
    }));

    try {
      writeFileSync(join(fixtureDirectory, "unowned.json"), "{}\n");
      let failure: { status?: number; stderr?: string } | undefined;
      try {
        execFileSync(process.execPath, [checker, "--root", fixtureRoot], {
          cwd: repoRoot,
          encoding: "utf8",
          stdio: "pipe"
        });
      } catch (error) {
        failure = error as { status?: number; stderr?: string };
      }

      expect(failure?.status).toBe(1);
      expect(failure?.stderr).toContain("unreferenced fixture");
    } finally {
      rmSync(fixtureRoot, { recursive: true, force: true });
    }
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
    expect(packageJson.scripts?.["quality:fallow:ci"]).toBe(
      "node scripts/run-fallow-ci.mjs",
    );
    const fallowCi = readRootFile("scripts/run-fallow-ci.mjs");
    expect(fallowCi).toContain("--changed-since");
    expect(fallowCi).toContain("--dead-code-baseline");
    expect(fallowCi).toContain("--health-baseline");
    expect(fallowCi).toContain("--dupes-baseline");
    const workflow = readRootFile(".github/workflows/ci.yml");
    expect(workflow).toContain("KRN_COMMIT_EVENT");
    expect(workflow).toContain("KRN_COMMIT_BEFORE");
    expect(workflow).toContain("KRN_COMMIT_PR_BASE");
    expect(fallowPolicy).toContain("Fallow `2.103.0` (schema version `7`)");
    expect(fallowPolicy).toMatch(/No aggregate\s+Fallow score/u);
    expect(fallowPolicy).toContain("@korneliuszburian");
    expect(fallowConfig).toContain("tests/fixtures/**");
    expect(fallowConfig).toContain("**/*.typecheck.ts");
  });

  it("passes the committed fixed point to Fallow and fails a changed defect", () => {
    const fixtureRoot = mkdtempSync(join(tmpdir(), "krn-fallow-contract-"));
    const baselineRoot = join(fixtureRoot, "fallow-baselines");
    mkdirSync(baselineRoot, { recursive: true });

    try {
      for (const baseline of ["dead-code.json", "health.json", "dupes.json"]) {
        writeFileSync(join(baselineRoot, baseline), readRootFile(`fallow-baselines/${baseline}`));
      }
      execFileSync("git", ["init", "--quiet", "--initial-branch=main"], {
        cwd: fixtureRoot,
      });
      execFileSync("git", ["config", "user.email", "fixture@example.test"], {
        cwd: fixtureRoot,
      });
      execFileSync("git", ["config", "user.name", "Fixture"], { cwd: fixtureRoot });
      writeFileSync(join(fixtureRoot, "bad.js"), "export const clean = 1;\n");
      execFileSync("git", ["add", "bad.js", "fallow-baselines"], { cwd: fixtureRoot });
      execFileSync("git", ["commit", "--quiet", "-m", "clean"], { cwd: fixtureRoot });
      const baseSha = execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: fixtureRoot,
        encoding: "utf8",
      }).trim();
      writeFileSync(
        join(fixtureRoot, "bad.js"),
        "export function bad(value) { if (value === 1) return 1; if (value === 2) return 2; if (value === 3) return 3; if (value === 4) return 4; if (value === 5) return 5; if (value === 6) return 6; if (value === 7) return 7; return 0; }\n",
      );
      execFileSync("git", ["add", "bad.js"], { cwd: fixtureRoot });
      execFileSync("git", ["commit", "--quiet", "-m", "defect"], { cwd: fixtureRoot });

      const runFallow = (env: Record<string, string>) => {
        let failure: { status?: number; stdout?: string; stderr?: string } | undefined;
        try {
          execFileSync(process.execPath, [join(repoRoot, "scripts/run-fallow-ci.mjs"), "--root", fixtureRoot], {
            cwd: repoRoot,
            encoding: "utf8",
            env: { ...process.env, ...env },
            stdio: "pipe",
          });
        } catch (error) {
          failure = error as { status?: number; stdout?: string; stderr?: string };
        }
        return `${failure?.stdout ?? ""}${failure?.stderr ?? ""}`;
      };

      const pushOutput = runFallow({
        KRN_COMMIT_EVENT: "push",
        KRN_COMMIT_BEFORE: baseSha,
        KRN_COMMIT_PR_BASE: "",
      });
      const pullRequestOutput = runFallow({
        KRN_COMMIT_EVENT: "pull_request",
        KRN_COMMIT_BEFORE: "",
        KRN_COMMIT_PR_BASE: baseSha,
      });

      expect(pushOutput).toContain(`base=${baseSha}`);
      expect(pushOutput).toContain("changedFiles=1");
      expect(pushOutput).toContain("high-complexity:bad.js");
      expect(pullRequestOutput).toContain(`base=${baseSha}`);
      expect(pullRequestOutput).toContain("changedFiles=1");
      expect(pullRequestOutput).toContain("high-complexity:bad.js");
    } finally {
      rmSync(fixtureRoot, { recursive: true, force: true });
    }
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
    expect(baseline.secretExceptions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        path: "packages/cli/src/__tests__/beads-history.test.ts",
        pattern: "secret-shaped assignment"
      }),
      expect.objectContaining({
        path: "packages/cli/src/__tests__/security-policy.test.ts",
        pattern: "AWS access key"
      })
    ]));
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
