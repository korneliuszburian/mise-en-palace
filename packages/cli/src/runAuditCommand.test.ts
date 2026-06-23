import {
  mkdtemp,
  mkdir,
  rm,
  writeFile
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  runCli
} from "./runCli.js";

const now = "2026-06-22T18:30:00.000Z";

const withTempRepo = async (
  writeFixture: (repoPath: string) => Promise<void>,
  testBody: (repoPath: string) => Promise<void>
): Promise<void> => {
  const repoPath = await mkdtemp(path.join(os.tmpdir(), "krn-audit-"));

  try {
    await writeFixture(repoPath);
    await testBody(repoPath);
  } finally {
    await rm(repoPath, {
      force: true,
      recursive: true
    });
  }
};

const writeRepoFile = async (
  repoPath: string,
  relativePath: string,
  content: string
): Promise<void> => {
  const filePath = path.join(repoPath, relativePath);
  await mkdir(path.dirname(filePath), {
    recursive: true
  });
  await writeFile(filePath, content, "utf8");
};

describe("audit command", () => {
  it("prints JSON for a clean repo audit", async () => {
    await withTempRepo(
      async (repoPath) => {
        await writeRepoFile(repoPath, "packages/core/src/index.ts", "export const ok = true;\n");
      },
      async (repoPath) => {
        const result = await runCli(["audit", "repo", "--repo", repoPath, "--json"], {
          env: {},
          cwd: repoPath,
          now: () => now,
          createId: (prefix) => `${prefix}-1`
        });
        const report = JSON.parse(result.stdout) as {
          scope: string;
          verdict: string;
          findingCount: number;
        };

        expect(result.exitCode).toBe(0);
        expect(result.stderr).toBe("");
        expect(report.scope).toBe("repo");
        expect(report.verdict).toBe("pass");
        expect(report.findingCount).toBe(0);
      }
    );
  });

  it("fails JSON repo audit for a seeded forbidden surface", async () => {
    await withTempRepo(
      async (repoPath) => {
        await writeRepoFile(
          repoPath,
          "packages/research-foundry/src/index.ts",
          "export const seededViolation = true;\n"
        );
      },
      async (repoPath) => {
        const result = await runCli(["audit", "repo", "--repo", repoPath, "--json"], {
          env: {},
          cwd: repoPath,
          now: () => now,
          createId: (prefix) => `${prefix}-1`
        });
        const report = JSON.parse(result.stdout) as {
          verdict: string;
          findings: Array<{ title: string; severity: string }>;
        };

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toBe("");
        expect(report.verdict).toBe("fail");
        expect(report.findings).toEqual(expect.arrayContaining([
          expect.objectContaining({
            title: "Forbidden Research Foundry surface",
            severity: "blocking"
          })
        ]));
      }
    );
  });

  it("runs slice audit against changed files since a ref", async () => {
    await withTempRepo(
      async (repoPath) => {
        await writeRepoFile(
          repoPath,
          "packages/core/src/badSchema.ts",
          "import { z } from 'zod';\nexport const schema = z.object({});\n"
        );
      },
      async (repoPath) => {
        const result = await runCli(["audit", "slice", "--since", "HEAD~1", "--repo", repoPath], {
          env: {},
          cwd: repoPath,
          now: () => now,
          createId: (prefix) => `${prefix}-1`,
          readGitChangedFiles: async () => "packages/core/src/badSchema.ts\n"
        });

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toBe("");
        expect(result.stdout).toContain("KRN Audit Slice");
        expect(result.stdout).toContain("Since: HEAD~1");
        expect(result.stdout).toContain("Verdict: fail");
        expect(result.stdout).toContain("Core imports schema validation dependency");
      }
    );
  });

  it("accepts explicit slice intended files and verification command results", async () => {
    await withTempRepo(
      async (repoPath) => {
        await writeRepoFile(repoPath, "packages/core/src/index.ts", "export const ok = true;\n");
      },
      async (repoPath) => {
        const result = await runCli(
          [
            "audit",
            "slice",
            "--since",
            "HEAD~1",
            "--repo",
            repoPath,
            "--json",
            "--intended-file",
            "packages/core/src/index.ts",
            "--verification",
            "pnpm typecheck=passed"
          ],
          {
            env: {},
            cwd: repoPath,
            now: () => now,
            createId: (prefix) => `${prefix}-1`,
            readGitChangedFiles: async () => "packages/core/src/index.ts\n"
          }
        );
        const report = JSON.parse(result.stdout) as {
          findings: Array<{ title: string }>;
        };

        expect(result.stderr).toBe("");
        expect(report.findings).not.toEqual(expect.arrayContaining([
          expect.objectContaining({ title: "Audit snapshot lacks intended files" }),
          expect.objectContaining({ title: "Audit snapshot lacks verification commands" }),
          expect.objectContaining({ title: "Changed file outside intended slice scope" })
        ]));
      }
    );
  });
});
