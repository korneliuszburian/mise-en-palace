import path from "node:path";

import {
  describe,
  expect,
  it
} from "vitest";

import {
  runCli
} from "../run-cli.js";
import {
  detectSourceSeeds
} from "../run-init-command.js";
import {
  now
} from "./helpers/test-runtime.js";

describe("runInitCommand source seed detection", () => {
  it("detects compact active authority seeds in the KRN repo", async () => {
    const repoRoot = path.resolve(process.cwd(), "../..");
    const sourceSeeds = await detectSourceSeeds(repoRoot);

    expect(sourceSeeds).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "KRN_ROADMAP.md",
          kind: "product_roadmap"
        }),
        expect.objectContaining({
          path: ".agents/skills",
          kind: "skill_root"
        }),
        expect.objectContaining({
          path: ".agents/skills/krn-memory-core/references/evidence-feedback.md",
          kind: "skill_doc"
        }),
      ])
    );
    expect(sourceSeeds.map((seed) => seed.kind)).not.toEqual(
      expect.arrayContaining(["source_map", "runbook", "standard_doc"])
    );
  });
});

describe("runCli init", () => {
  it("prints a target repo init dry-run without writing files", async () => {
    const repoRoot = path.resolve(process.cwd(), "../..");
    const fixtureRepo = path.join(
      repoRoot,
      "tests",
      "fixtures",
      "target-repos",
      "typescript-basic"
    );
    const result = await runCli(
      ["init", "--dry-run", "--repo", fixtureRepo],
      {
        env: {},
        cwd: repoRoot,
        now: () => now,
        createId: (prefix) => `${prefix}-1`
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN Init Dry Run");
    expect(result.stdout).toContain(`Repo path: ${fixtureRepo}`);
    expect(result.stdout).toContain("Package manager: package-json");
    expect(result.stdout).toContain("TypeScript: present");
    expect(result.stdout).toContain("Scripts: build, test");
    expect(result.stdout).toContain("Command detection:");
    expect(result.stdout).toContain("- scripts: build, test");
    expect(result.stdout).toContain("Existing AGENTS.md: present");
    expect(result.stdout).toContain("Existing .codex: absent");
    expect(result.stdout).toContain("Existing .agents/skills: absent");
    expect(result.stdout).toContain("Forbidden surfaces: absent");
    expect(result.stdout).toContain("Source seed proposal:");
    expect(result.stdout).toContain(
      "- package.json | kind=package_manifest | reason=detect package identity and scripts"
    );
    expect(result.stdout).toContain(
      "- tsconfig.json | kind=typescript_config | reason=detect TypeScript boundary settings"
    );
    expect(result.stdout).toContain(
      "- README.md | kind=project_readme | reason=capture project-facing current truth"
    );
    expect(result.stdout).toContain(
      "- AGENTS.md | kind=agent_instructions | reason=capture target repo Codex instructions when present"
    );
    expect(result.stdout).toContain("- docs | kind=docs_root | reason=seed target documentation and runbook context");
    expect(result.stdout).toContain("- src | kind=source_root | reason=seed source owner-file recall");
    expect(result.stdout).toContain("- tests | kind=test_root | reason=seed target repo verification surface");
    expect(result.stdout).toContain("Owner-file proposal:");
    expect(result.stdout).toContain("- none");
    expect(result.stdout).toContain("ProjectKernel proposal:");
    expect(result.stdout).toContain("Codex overlay proposal:");
    expect(result.stdout).toContain("No files written");
    expect(result.stdout).toContain(
      `Next command: krn init --connect --repo ${fixtureRepo} --persist`
    );
  });

  it("resolves init --repo relative to the workspace root when run through a package cwd", async () => {
    const repoRoot = path.resolve(process.cwd(), "../..");
    const fixtureRepo = path.join(
      repoRoot,
      "tests",
      "fixtures",
      "target-repos",
      "typescript-basic"
    );
    const result = await runCli(
      ["init", "--dry-run", "--repo", "tests/fixtures/target-repos/typescript-basic"],
      {
        env: { INIT_CWD: repoRoot },
        cwd: path.join(repoRoot, "packages", "cli"),
        now: () => now,
        createId: (prefix) => `${prefix}-1`
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain(`Repo path: ${fixtureRepo}`);
    expect(result.stdout).toContain(
      `Next command: krn init --connect --repo ${fixtureRepo} --persist`
    );
  });

  it("resolves init --repo from pnpm's existing absolute caller cwd", async () => {
    const repoRoot = path.resolve(process.cwd(), "../..");
    const packageCwd = path.join(repoRoot, "packages", "cli");
    const result = await runCli(
      ["init", "--dry-run", "--repo", "."],
      {
        env: { INIT_CWD: repoRoot },
        cwd: packageCwd,
        now: () => now,
        createId: (prefix) => `${prefix}-1`
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain(`Repo path: ${repoRoot}`);
  });

  it("falls back to runtime cwd when init caller cwd is absent or invalid", async () => {
    const repoRoot = path.resolve(process.cwd(), "../..");
    const packageCwd = path.join(repoRoot, "packages", "cli");
    const absentCallerResult = await runCli(
      ["init", "--dry-run", "--repo", "."],
      {
        env: {},
        cwd: packageCwd,
        now: () => now,
        createId: (prefix) => `${prefix}-1`
      }
    );
    const invalidCallerResult = await runCli(
      ["init", "--dry-run", "--repo", "."],
      {
        env: { INIT_CWD: path.join(repoRoot, "package.json") },
        cwd: packageCwd,
        now: () => now,
        createId: (prefix) => `${prefix}-1`
      }
    );

    expect(absentCallerResult.exitCode).toBe(0);
    expect(absentCallerResult.stderr).toBe("");
    expect(absentCallerResult.stdout).toContain(`Repo path: ${packageCwd}`);
    expect(invalidCallerResult.exitCode).toBe(0);
    expect(invalidCallerResult.stderr).toBe("");
    expect(invalidCallerResult.stdout).toContain(`Repo path: ${packageCwd}`);
  });

  it("keeps owner-file inputs in the dry-run connect next command", async () => {
    const repoRoot = path.resolve(process.cwd(), "../..");
    const fixtureRepo = path.join(
      repoRoot,
      "tests",
      "fixtures",
      "target-repos",
      "typescript-basic"
    );
    const result = await runCli(
      [
        "init",
        "--dry-run",
        "--repo",
        fixtureRepo,
        "--owner-file",
        "src/index.ts|src|implementation_entry|implementation entry point",
        "--owner-file",
        "tests/readiness.test.ts|tests|behavior_test|readiness behavior proof"
      ],
      {
        env: {},
        cwd: repoRoot,
        now: () => now,
        createId: (prefix) => `${prefix}-1`
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Owner-file proposal:");
    expect(result.stdout).toContain(
      "- src/index.ts | root=src | kind=implementation_entry | reason=implementation entry point"
    );
    expect(result.stdout).toContain(
      `Next command: krn init --connect --repo ${fixtureRepo} --owner-file "src/index.ts|src|implementation_entry|implementation entry point" --owner-file "tests/readiness.test.ts|tests|behavior_test|readiness behavior proof" --persist`
    );
  });

  it("requires database config for init --connect --persist", async () => {
    const repoRoot = path.resolve(process.cwd(), "../..");
    const result = await runCli(
      [
        "init",
        "--connect",
        "--repo",
        "tests/fixtures/target-repos/typescript-basic",
        "--persist"
      ],
      {
        env: { KRN_DB_BACKEND: "postgres" },
        cwd: repoRoot,
        now: () => now,
        createId: (prefix) => `${prefix}-1`
      }
    );

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain(
      "KRN_DATABASE_URL is required for krn init --connect --persist"
    );
    expect(result.stderr).toContain(
      "Next action: export KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn; docker compose up -d krn-postgres; pnpm db:migrate; pnpm db:ready"
    );
    expect(result.stderr).toContain(
      "Does not prove: setting KRN_DATABASE_URL does not prove the requested persisted command is valid, commands executed, or Memory Core mutated"
    );
  });

  it("connects a target repo to the memory store with persisted IDs", async () => {
    const repoRoot = path.resolve(process.cwd(), "../..");
    const fixtureRepo = path.join(
      repoRoot,
      "tests",
      "fixtures",
      "target-repos",
      "typescript-basic"
    );
    const result = await runCli(
      [
        "init",
        "--connect",
        "--repo",
        fixtureRepo,
        "--owner-file",
        "src/index.ts|src|implementation_entry|implementation entry point",
        "--owner-file",
        "tests/readiness.test.ts|tests|behavior_test|readiness behavior proof",
        "--persist"
      ],
      {
        env: {
          KRN_DB_BACKEND: "postgres",
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        cwd: repoRoot,
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        createInitConnectRuntime: async () => ({
          async connectTargetRepo(input) {
            expect(input.repoPath).toBe(fixtureRepo);
            expect(input.repoFingerprint).toMatch(/^sha256:/);
            expect(input.sourceSeeds).toEqual(
              expect.arrayContaining([
                expect.objectContaining({
                  path: "package.json",
                  kind: "package_manifest"
                }),
                expect.objectContaining({
                  path: "tsconfig.json",
                  kind: "typescript_config"
                }),
                expect.objectContaining({
                  path: "src",
                  kind: "source_root"
                })
              ])
            );
            expect(input.ownerFiles).toEqual([
              {
                path: "src/index.ts",
                root: "src",
                kind: "implementation_entry",
                reason: "implementation entry point"
              },
              {
                path: "tests/readiness.test.ts",
                root: "tests",
                kind: "behavior_test",
                reason: "readiness behavior proof"
              }
            ]);

            return {
              project: {
                id: "project-target-1",
                workspaceId: "workspace-1",
                slug: "krn-fixture-typescript-basic",
                displayName: "krn-fixture-typescript-basic",
                metadata: {},
                createdAt: now,
                updatedAt: now
              },
              projectCreated: true,
              repoInstallation: {
                id: "repo-installation-1",
                projectId: "project-target-1",
                provider: "local",
                repoUrl: `file://${fixtureRepo}`,
                defaultBranch: "main",
                repoFingerprint: input.repoFingerprint,
                localPathHint: fixtureRepo,
                metadata: {},
                createdAt: now,
                updatedAt: now
              },
              repoInstallationCreated: true,
              projectKernel: {
                id: "project-kernel-1",
                projectId: "project-target-1",
                version: 1,
                summary: "kernel",
                activeContextRule: "project scoped",
                metadata: {},
                createdAt: now,
                updatedAt: now
              },
              projectKernelCreated: true
            };
          },
          async close() {
            return undefined;
          }
        })
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN Init Connect");
    expect(result.stdout).toContain("Persistence: enabled (Postgres, explicit --persist)");
    expect(result.stdout).toContain("Project ID: project-target-1 (created)");
    expect(result.stdout).toContain("Repo installation ID: repo-installation-1 (created)");
    expect(result.stdout).toContain("ProjectKernel ID: project-kernel-1 (created)");
    expect(result.stdout).toContain(
      "Project scope: project-scoped source, memory, retrieval, and anti-memory only"
    );
    expect(result.stdout).toContain("Command detection:");
    expect(result.stdout).toContain("- scripts: build, test");
    expect(result.stdout).toContain("Source seed:");
    expect(result.stdout).toContain(
      "- package.json | kind=package_manifest | reason=detect package identity and scripts"
    );
    expect(result.stdout).toContain("- src | kind=source_root | reason=seed source owner-file recall");
    expect(result.stdout).toContain("Owner files:");
    expect(result.stdout).toContain(
      "- src/index.ts | root=src | kind=implementation_entry | reason=implementation entry point"
    );
    expect(result.stdout).toContain(
      "- tests/readiness.test.ts | root=tests | kind=behavior_test | reason=readiness behavior proof"
    );
    expect(result.stdout).toContain("Files written: none");
    expect(result.stdout).toContain(
      "Next command: krn plan --project project-target-1 --task \"improve test script readiness\" --persist"
    );
  });
});
