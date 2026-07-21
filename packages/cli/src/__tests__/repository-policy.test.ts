import { execFileSync } from "node:child_process";
import { chmodSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = fileURLToPath(new URL("../../../../", import.meta.url));
const readRootFile = (path: string): string => readFileSync(`${repoRoot}/${path}`, "utf8");
const pgvectorImage =
  "pgvector/pgvector:pg16@sha256:131dcf7ff6a900545df8e7e092c270aa8c6db2f2c818e408cb45ec21316b74e6";

type FallowRun = { status: number; output: string };

const runFallow = (fixtureRoot: string, env: Record<string, string>): FallowRun => {
  try {
    return {
      status: 0,
      output: execFileSync(
        process.execPath,
        [join(repoRoot, "scripts/run-fallow-ci.mjs"), "--root", fixtureRoot],
        {
          cwd: repoRoot,
          encoding: "utf8",
          env: { ...process.env, KRN_FALLOW_COMMIT_BASE: "", ...env },
          stdio: "pipe",
        },
      ),
    };
  } catch (error) {
    const failure = error as { status?: number; stdout?: string; stderr?: string };
    return {
      status: failure.status ?? 1,
      output: `${failure.stdout ?? ""}${failure.stderr ?? ""}`,
    };
  }
};

const committedRangeProfiles = (baseSha: string) => [
  [
    "initial push",
    {
      KRN_COMMIT_EVENT: "push",
      KRN_COMMIT_BEFORE: "0000000000000000000000000000000000000000",
      KRN_COMMIT_PR_BASE: "",
    },
  ],
  ["local", { KRN_COMMIT_EVENT: "", KRN_COMMIT_BEFORE: "", KRN_COMMIT_PR_BASE: "" }],
  ["schedule", { KRN_COMMIT_EVENT: "schedule", KRN_COMMIT_BEFORE: "", KRN_COMMIT_PR_BASE: "" }],
  [
    "workflow_dispatch",
    { KRN_COMMIT_EVENT: "workflow_dispatch", KRN_COMMIT_BEFORE: "", KRN_COMMIT_PR_BASE: "" },
  ],
  [
    "push",
    {
      KRN_COMMIT_EVENT: "push",
      KRN_COMMIT_BEFORE: baseSha,
      KRN_COMMIT_PR_BASE: "",
    },
  ],
  [
    "pull_request",
    {
      KRN_COMMIT_EVENT: "pull_request",
      KRN_COMMIT_BEFORE: "",
      KRN_COMMIT_PR_BASE: baseSha,
    },
  ],
] as const;

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
    const checker = join(repoRoot, "scripts/check-toolchain.mjs");

    expect(packageJson.packageManager).toBe("pnpm@10.32.1");
    expect(packageJson.engines?.node).toBe(`${nodeVersion}.x`);
    expect(packageJson.engines?.pnpm).toBe("10.32.1");
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

  it("does not require GNU timeout after a passing platform check", () => {
    const fixtureRoot = mkdtempSync(join(tmpdir(), "krn-missing-timeout-"));
    const timeoutStub = join(fixtureRoot, "timeout");

    try {
      writeFileSync(timeoutStub, "#!/bin/sh\necho 'timeout: command not found in stock macOS profile' >&2\nexit 127\n");
      chmodSync(timeoutStub, 0o755);
      const env = {
        ...process.env,
        KRN_DATABASE_URL: "postgres://krn:krn@127.0.0.1:59999/krn",
        KRN_VERIFY_DB_TIMEOUT_MS: "1000",
        PATH: `${fixtureRoot}:${process.env.PATH ?? ""}`,
      };
      const pnpm = process.env.npm_execpath ?? "pnpm";

      expect(execFileSync(pnpm, ["platform:check"], {
        cwd: repoRoot,
        encoding: "utf8",
        env,
      })).toContain("Platform contract passed");

      let failure: { status?: number; stdout?: string; stderr?: string } | undefined;
      try {
        execFileSync(pnpm, ["verify:db"], {
          cwd: repoRoot,
          encoding: "utf8",
          env,
          stdio: "pipe",
        });
      } catch (error) {
        failure = error as { status?: number; stdout?: string; stderr?: string };
      }

      expect(failure?.status).toBe(124);
      expect(`${failure?.stdout ?? ""}${failure?.stderr ?? ""}`).not.toContain(
        "timeout: command not found in stock macOS profile",
      );
    } finally {
      rmSync(fixtureRoot, { recursive: true, force: true });
    }
  }, 15_000);

  it("blocks the current private source packages from release", () => {
    const checker = join(repoRoot, "scripts/check-release-boundary.mjs");
    const packageJson = JSON.parse(readRootFile("package.json")) as {
      private?: boolean;
      version?: string;
      scripts?: Record<string, string>;
    };

    expect(packageJson.private).toBe(true);
    expect(packageJson.version).toBe("0.0.0");
    expect(packageJson.scripts?.prepublishOnly).toBe("node scripts/check-release-boundary.mjs");
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

  it("makes every source package publish hook execute the internal-alpha guard", () => {
    const packageManifests = [
      join(repoRoot, "package.json"),
      ...readdirSync(join(repoRoot, "packages"), { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => join(repoRoot, "packages", entry.name, "package.json"))
        .filter((path) => existsSync(path))
    ];

    for (const manifestPath of packageManifests) {
      const packageRoot = dirname(manifestPath);
      let failure: { status?: number; stderr?: string; stdout?: string } | undefined;
      try {
        execFileSync("pnpm", ["run", "prepublishOnly"], {
          cwd: packageRoot,
          encoding: "utf8",
          stdio: "pipe"
        });
      } catch (error) {
        failure = error as { status?: number; stderr?: string; stdout?: string };
      }

      expect(failure?.status, manifestPath).toBe(1);
      expect(`${failure?.stdout ?? ""}\n${failure?.stderr ?? ""}`, manifestPath).toContain(
        "Release boundary blocked: this repository is an internal alpha."
      );
    }
  }, 20_000);

  it("requires every fixture to have an owner and rejects unreferenced files", () => {
    const checker = join(repoRoot, "scripts/check-fixture-ownership.mjs");
    const current = execFileSync(process.execPath, [checker], {
      cwd: repoRoot,
      encoding: "utf8"
    });
    expect(current).toContain("Fixture ownership check passed");

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

  it("uses the current commit range for Fallow outside explicit push and PR bases", () => {
    const fixtureRoot = mkdtempSync(join(tmpdir(), "krn-fallow-root-fallback-"));
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
      writeFileSync(join(fixtureRoot, "historical.js"), "export const historical = 1;\n");
      writeFileSync(join(fixtureRoot, "current.js"), "export const current = 1;\n");
      execFileSync("git", ["add", "historical.js", "current.js", "fallow-baselines"], {
        cwd: fixtureRoot,
      });
      execFileSync("git", ["commit", "--quiet", "-m", "clean root"], { cwd: fixtureRoot });
      const rootSha = execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: fixtureRoot,
        encoding: "utf8",
      }).trim();

      writeFileSync(
        join(fixtureRoot, "historical.js"),
        "export function historical(value) { if (value === 1) return 1; if (value === 2) return 2; if (value === 3) return 3; if (value === 4) return 4; if (value === 5) return 5; if (value === 6) return 6; if (value === 7) return 7; return 0; }\n",
      );
      execFileSync("git", ["add", "historical.js"], { cwd: fixtureRoot });
      execFileSync("git", ["commit", "--quiet", "-m", "historical defect"], {
        cwd: fixtureRoot,
      });
      const reviewedBaseSha = execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: fixtureRoot,
        encoding: "utf8",
      }).trim();

      writeFileSync(join(fixtureRoot, "current.js"), "export const current = 2;\n");
      execFileSync("git", ["add", "current.js"], { cwd: fixtureRoot });
      execFileSync("git", ["commit", "--quiet", "-m", "current clean change"], {
        cwd: fixtureRoot,
      });

      for (const [name, env] of committedRangeProfiles(reviewedBaseSha)) {
        const result = runFallow(fixtureRoot, env);

        expect(result.status, name).toBe(0);
        expect(result.output, name).toContain(`base=${reviewedBaseSha}`);
        expect(result.output, name).toContain("changedFiles=1");
        expect(result.output, name).not.toContain("high-complexity:historical.js");
      }

      const explicitRoot = runFallow(fixtureRoot, {
        KRN_COMMIT_EVENT: "",
        KRN_COMMIT_BEFORE: "",
        KRN_COMMIT_PR_BASE: "",
        KRN_FALLOW_COMMIT_BASE: rootSha,
      });

      expect(explicitRoot.status).toBe(1);
      expect(explicitRoot.output).toContain(`base=${rootSha}`);
      expect(explicitRoot.output).toContain("changedFiles=2");
      expect(explicitRoot.output).toContain("high-complexity:historical.js");

      const invalidExplicitBase = runFallow(fixtureRoot, {
        KRN_COMMIT_EVENT: "",
        KRN_COMMIT_BEFORE: "",
        KRN_COMMIT_PR_BASE: "",
        KRN_FALLOW_COMMIT_BASE: "not-a-commit",
      });
      const missingPullRequestBase = runFallow(fixtureRoot, {
        KRN_COMMIT_EVENT: "pull_request",
        KRN_COMMIT_BEFORE: "",
        KRN_COMMIT_PR_BASE: "",
      });
      const missingPushBase = runFallow(fixtureRoot, {
        KRN_COMMIT_EVENT: "push",
        KRN_COMMIT_BEFORE: "",
        KRN_COMMIT_PR_BASE: "",
      });

      expect(invalidExplicitBase.status).toBe(1);
      expect(invalidExplicitBase.output).toContain("Committed range base is invalid: not-a-commit");
      expect(missingPullRequestBase.status).toBe(1);
      expect(missingPullRequestBase.output).toContain(
        "pull_request requires KRN_COMMIT_PR_BASE or KRN_FALLOW_COMMIT_BASE",
      );
      expect(missingPushBase.status).toBe(1);
      expect(missingPushBase.output).toContain("push requires KRN_COMMIT_BEFORE or KRN_FALLOW_COMMIT_BASE");
    } finally {
      rmSync(fixtureRoot, { recursive: true, force: true });
    }
  }, 20_000);

  it("detects a current Fallow defect across every supported range source", () => {
    const fixtureRoot = mkdtempSync(join(tmpdir(), "krn-fallow-current-defect-"));
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
      writeFileSync(join(fixtureRoot, "historical.js"), "export const historical = 1;\n");
      writeFileSync(join(fixtureRoot, "current.js"), "export const current = 1;\n");
      execFileSync("git", ["add", "historical.js", "current.js", "fallow-baselines"], {
        cwd: fixtureRoot,
      });
      execFileSync("git", ["commit", "--quiet", "-m", "clean root"], { cwd: fixtureRoot });

      writeFileSync(
        join(fixtureRoot, "historical.js"),
        "export function historical(value) { if (value === 1) return 1; if (value === 2) return 2; if (value === 3) return 3; if (value === 4) return 4; if (value === 5) return 5; if (value === 6) return 6; if (value === 7) return 7; return 0; }\n",
      );
      execFileSync("git", ["add", "historical.js"], { cwd: fixtureRoot });
      execFileSync("git", ["commit", "--quiet", "-m", "historical defect"], {
        cwd: fixtureRoot,
      });
      const historicalBaseSha = execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: fixtureRoot,
        encoding: "utf8",
      }).trim();

      writeFileSync(
        join(fixtureRoot, "current.js"),
        "export function current(value) { if (value === 1) return 1; if (value === 2) return 2; if (value === 3) return 3; if (value === 4) return 4; if (value === 5) return 5; if (value === 6) return 6; if (value === 7) return 7; return 0; }\n",
      );
      execFileSync("git", ["add", "current.js"], { cwd: fixtureRoot });
      execFileSync("git", ["commit", "--quiet", "-m", "current defect"], {
        cwd: fixtureRoot,
      });
      const currentDefectSha = execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: fixtureRoot,
        encoding: "utf8",
      }).trim();

      for (const [name, env] of committedRangeProfiles(historicalBaseSha)) {
        const result = runFallow(fixtureRoot, env);

        expect(result.status, name).toBe(1);
        expect(result.output, name).toContain(`base=${historicalBaseSha}`);
        expect(result.output, name).toContain("changedFiles=1");
        expect(result.output, name).toContain("high-complexity:current.js");
        expect(result.output, name).not.toContain("high-complexity:historical.js");
      }

      writeFileSync(join(fixtureRoot, "current.js"), "export const current = 2;\n");
      execFileSync("git", ["add", "current.js"], { cwd: fixtureRoot });
      execFileSync("git", ["commit", "--quiet", "-m", "remove current defect"], {
        cwd: fixtureRoot,
      });

      for (const [name, env] of committedRangeProfiles(currentDefectSha)) {
        const result = runFallow(fixtureRoot, env);

        expect(result.status, name).toBe(0);
        expect(result.output, name).toContain(`base=${currentDefectSha}`);
        expect(result.output, name).toContain("changedFiles=1");
        expect(result.output, name).not.toContain("high-complexity:current.js");
        expect(result.output, name).not.toContain("high-complexity:historical.js");
      }
    } finally {
      rmSync(fixtureRoot, { recursive: true, force: true });
    }
  }, 30_000);

  it("keeps security exceptions and allowlists reviewed in a tracked baseline", () => {
    const baseline = JSON.parse(readRootFile("security-baseline.json")) as {
      allowedLicenses?: string[];
      secretExceptions?: Array<{ path?: string; pattern?: string; reason?: string }>;
      dependencyVulnerabilityExceptions?: string[];
    };
    const exception = baseline.secretExceptions?.[0];

    expect(baseline.allowedLicenses).toEqual([
      "Apache-2.0",
      "BSD-2-Clause",
      "BSD-3-Clause",
      "ISC",
      "MIT",
      "MPL-2.0",
      "Unlicense",
    ]);
    expect(exception).toMatchObject({
      path: "packages/harness/src/observations/__tests__/observer-input.test.ts",
      pattern: "GitHub token",
      matchSha256: "199163e14049bac77807991e8490a34c2e2ca6781c96cbbdd4baf086f7baab10",
    });
    expect(exception?.reason).toContain("fake token");
    expect(baseline.secretExceptions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        path: "packages/cli/src/__tests__/beads-history.test.ts",
        pattern: "secret-shaped assignment",
        matchSha256: "d98792bcad0656a0a026172f1556f5a00bc635c117916b374c6f826360e661c5",
      }),
      expect.objectContaining({
        path: "packages/cli/src/__tests__/security-policy.test.ts",
        pattern: "AWS access key",
        matchSha256: "743554670c6065b3f7f13ac4f07e392f977b3556ceb7457411633c454bcbece8",
      })
    ]));
    expect(baseline.dependencyVulnerabilityExceptions).toEqual([]);
  });

});
