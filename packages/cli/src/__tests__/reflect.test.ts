import { describe, expect, it } from "vitest";
import path from "node:path";

import type { ObservationItem } from "@krn/core";

import { runCli } from "../run-cli.js";

const now = "2026-06-21T12:00:00.000Z";

describe("runCli", () => {
  it("routes reflect scope commands through the CLI parser", async () => {
    const result = await runCli(["reflect", "--scope", "run:run-1"], {
      env: {},
      cwd: path.resolve(process.cwd(), "../.."),
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("KRN_DATABASE_URL is required for krn reflect");
  });

  it("guards self-hosting evidence provenance through reflect", async () => {
    const observationItem: ObservationItem = {
      id: "observation-item-1",
      groupId: "observation-group-1",
      scope: {
        projectId: "project-1",
        executionRunId: "execution-run-1",
        taskContractId: "task-contract-1"
      },
      kind: "fact",
      status: "candidate",
      priority: "medium",
      confidence: "medium",
      provenanceKind: "evidence_bundle",
      subject: "evidence_bundle",
      summary: "Evidence bundle contains explicit command provenance.",
      body:
        "{\"commands\":[{\"command\":\"pnpm typecheck\",\"provenance\":\"operator_reported\"},{\"command\":\"pnpm test\",\"provenance\":\"captured_output_file\"}]}",
      temporalScope: {
        observedAt: now,
        eventTime: now,
        ingestedAt: now
      },
      sourceRanges: [{
        id: "observation-source-range-1",
        sourceType: "evidence_bundle",
        sourceId: "evidence-bundle-1",
        locator: "evidence_bundles.id:evidence-bundle-1",
        capturedAt: now
      }],
      entityLinks: [],
      claimLinks: [],
      metadata: {},
      createdAt: now,
      updatedAt: now
    };

    let reflectedOutputMemoryCandidateCount: number | undefined;
    const reflectResult = await runCli(
      ["reflect", "--scope", "run:execution-run-1", "--persist"],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        createReflectDatabaseRuntime: async () => ({
          async getRunSnapshot(runId: string) {
            expect(runId).toBe("execution-run-1");

            return {
              executionRunId: runId,
              projectId: "project-1",
              taskContractId: "task-contract-1"
            };
          },
          async projectExists() {
            return true;
          },
          observationRepository: {
            async findByRun() {
              return [observationItem];
            },
            async findByScope() {
              return [observationItem];
            }
          },
          sourceRepository: {
            async listClaimsForProject() {
              return [];
            },
            async listSourceClaimsForRun() {
              return [];
            }
          },
          memoryRepository: {
            async listAntiMemoryForProject() {
              return [];
            },
            async listAntiMemoryForRun() {
              return [];
            }
          },
          reflectionRepository: {
            async createReflectionRecord(input) {
              reflectedOutputMemoryCandidateCount = input.output.memoryCandidates.length;

              return {
                id: "reflection-record-1",
                scope: input.scope,
                status: input.status ?? "candidate",
                summary: input.summary,
                input: input.input,
                output: input.output,
                metadata: input.metadata ?? {},
                createdAt: now,
                updatedAt: now
              };
            }
          },
          async close() {
            return undefined;
          }
        })
      }
    );

    expect(reflectResult.exitCode).toBe(0);
    expect(reflectResult.stderr).toBe("");
    expect(reflectResult.stdout).toContain("Candidate rows written: no");
    expect(reflectResult.stdout).toContain("MemoryRecord created: no");
    expect(reflectedOutputMemoryCandidateCount).toBe(0);
  });
});
