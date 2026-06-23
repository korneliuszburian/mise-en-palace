import {
  mkdtemp,
  mkdir,
  rm,
  writeFile
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type {
  AuditBundle
} from "@krn/core";

import {
  runCli
} from "./runCli.js";

const now = "2026-06-22T18:30:00.000Z";

const auditBundle = (overrides: Partial<AuditBundle>): AuditBundle => ({
  id: "audit-bundle-1",
  projectId: "project-1",
  sliceId: "MM-32B",
  changedFiles: ["packages/core/src/index.ts"],
  intendedFiles: ["packages/core/src/index.ts"],
  unexpectedFiles: [],
  verificationCommands: [{ command: "pnpm typecheck", status: "passed" }],
  verificationResults: "passed",
  architecturalDelta: "audit slice evidence",
  boundaryFindings: [],
  typeSafetyFindings: [],
  memorySemanticsFindings: [],
  sourceGroundingFindings: [],
  policyFindings: [],
  evalFindings: [],
  reviewBurdenEstimate: "low",
  diffRiskEstimate: "low",
  rollbackPath: "git revert HEAD",
  candidateUpdates: [],
  selfCritiqueSummary: "No private reasoning.",
  finalVerdict: "pass",
  metadata: {},
  createdAt: now,
  updatedAt: now,
  ...overrides
});

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

  it("loads AuditBundle evidence and semantic snapshots from the audit DB runtime", async () => {
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
            "--audit-bundle-id",
            "audit-bundle-1",
            "--project",
            "project-1",
            "--retrieval-run",
            "retrieval-run-1"
          ],
          {
            env: {
              KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
            },
            cwd: repoPath,
            now: () => now,
            createId: (prefix) => `${prefix}-1`,
            readGitChangedFiles: async () => "packages/core/src/index.ts\n",
            createAuditDatabaseRuntime: async () => ({
              async getAuditBundleById() {
                return auditBundle({});
              },
              async readSemanticSnapshots(input) {
                expect(input).toMatchObject({
                  projectId: "project-1",
                  retrievalRunId: "retrieval-run-1"
                });

                return {
                  memoryCandidates: [{
                    id: "memory-candidate-1",
                    summary: "Auto promotes",
                    sourceLineageCount: 0,
                    sourceClaimCount: 0,
                    hasApplicationGuidance: false,
                    hasInvalidationStrategy: false,
                    isTemporal: true,
                    autoPromotesToMemory: true
                  }],
                  memoryRecords: [],
                  sourceClaims: [],
                  sourceDecisions: [{
                    id: "source-decision-1",
                    decision: "Adopt unsupported decision",
                    falsifier: "",
                    consumer: "MM-32B"
                  }],
                  evalCandidates: [{
                    id: "eval-1",
                    title: "Benchmark theater",
                    expectedSignal: "",
                    sourceEvidenceCount: 0,
                    protectsRealBehavior: false
                  }],
                  observationGroups: [{
                    id: "observation-group-1",
                    projectId: "project-1",
                    source: "observe-cli",
                    summary: "Observation group snapshot"
                  }],
                  activationDecisions: [{
                    id: "activation-decision-1",
                    subjectType: "memory_record",
                    subjectId: "memory-1",
                    decision: "included",
                    reason: "included"
                  }]
                };
              },
              async close() {}
            })
          }
        );
        const report = JSON.parse(result.stdout) as {
          verdict: string;
          semanticSnapshotCounts: {
            memoryCandidateCount: number;
            sourceDecisionCount: number;
            evalCandidateCount: number;
            observationGroupCount: number;
            activationDecisionCount: number;
          };
          findings: Array<{ title: string; category: string }>;
        };

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toBe("");
        expect(report.verdict).toBe("fail");
        expect(report.semanticSnapshotCounts).toMatchObject({
          memoryCandidateCount: 1,
          sourceDecisionCount: 1,
          evalCandidateCount: 1,
          observationGroupCount: 1,
          activationDecisionCount: 1
        });
        expect(report.findings).toEqual(expect.arrayContaining([
          expect.objectContaining({ title: "Memory candidate can auto-promote" }),
          expect.objectContaining({ title: "Source decision lacks source claim" }),
          expect.objectContaining({ title: "Eval candidate lacks protected behavior" })
        ]));
      }
    );
  });

  it("can fail a slice audit on warnings for CI-style gates", async () => {
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
            "--fail-on",
            "warning"
          ],
          {
            env: {},
            cwd: repoPath,
            now: () => now,
            createId: (prefix) => `${prefix}-1`,
            readGitChangedFiles: async () => "packages/core/src/index.ts\n"
          }
        );

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toBe("");
        expect(result.stdout).toContain("Verdict: advisory");
        expect(result.stdout).toContain("Audit snapshot lacks intended files");
      }
    );
  });

  it("uses repo handoff docs as slice handoff evidence", async () => {
    await withTempRepo(
      async (repoPath) => {
        await writeRepoFile(repoPath, "packages/core/src/index.ts", "export const ok = true;\n");
        await writeRepoFile(
          repoPath,
          "docs/handoff/handoff.md",
          [
            "# Handoff",
            "Last verified state: current slice.",
            "Changed files: packages/core/src/index.ts.",
            "Verification: pnpm typecheck passed.",
            "Rollback path: git revert HEAD.",
            "Next safest action: continue."
          ].join("\n")
        );
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
          verdict: string;
          findings: Array<{ title: string }>;
        };

        expect(result.exitCode).toBe(0);
        expect(result.stderr).toBe("");
        expect(report.verdict).toBe("pass");
        expect(report.findings).not.toEqual(expect.arrayContaining([
          expect.objectContaining({ title: "Handoff compact missing" })
        ]));
      }
    );
  });
});
