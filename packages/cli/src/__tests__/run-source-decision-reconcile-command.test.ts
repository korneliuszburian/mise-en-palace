import {
  describe,
  expect,
  it
} from "vitest";

import type {
  DatabaseRuntime,
  DatabaseRuntimeInput
} from "../database-runtime.js";
import {
  runSourceDecisionReconcileCommand
} from "../run-source-decision-reconcile-command.js";
import type {
  CreateSourceDecisionReconcileDatabaseRuntime
} from "../run-source-decision-reconcile-command.js";

const now = "2026-07-13T21:00:00.000Z";
const projectId = "project-1";

describe("runSourceDecisionReconcileCommand", () => {
  it("reports bounded partial and equivalent imports without writes", async () => {
    let runtimeInput: DatabaseRuntimeInput | undefined;
    let closed = false;
    let readCount = 0;
    let snapshotCount = 0;
    const createRuntime: CreateSourceDecisionReconcileDatabaseRuntime = async (input) => {
      runtimeInput = input;
      const emptyIds = {
        totalCount: 0,
        returnedCount: 0,
        truncated: false,
        items: []
      };
      const repository: NonNullable<DatabaseRuntime["sourceDecisionImportRepository"]> = {
        async getCapturedSourceEvidence() {
          throw new Error("getCapturedSourceEvidence should not be called");
        },
        async getSourceDecisionImportRow() {
          throw new Error("getSourceDecisionImportRow should not be called");
        },
        async findEquivalentSourceDecisionImportIds() {
          throw new Error("findEquivalentSourceDecisionImportIds should not be called");
        },
        async listSourceDecisionImportReconciliation(readInput) {
          readCount += 1;
          expect(readInput).toEqual({
            projectId,
            limit: 2,
            afterImportId: "import-before"
          });

          return {
            limit: 2,
            afterImportId: "import-before",
            nextAfterImportId: "import-current",
            imports: {
              totalCount: 2,
              returnedCount: 1,
              truncated: true,
              items: [
                {
                  importId: "import-current",
                  lifecycle: "partial" as const,
                  corpusDigest: "sha256:corpus-a",
                  rowCount: 2,
                  completeRowCount: 1,
                  partialRowCount: 1,
                  equivalentImportIds: {
                    totalCount: 1,
                    returnedCount: 1,
                    truncated: false,
                    items: ["import-legacy"]
                  },
                  rows: {
                    totalCount: 2,
                    returnedCount: 1,
                    truncated: true,
                    items: [
                      {
                        sourceArtifactId: "artifact-partial",
                        decisionId: null,
                        contentHash: "sha256:decision-partial",
                        lifecycle: "partial" as const,
                        violations: ["missing_import_row_id" as const],
                        components: {
                          sourceChunks: {
                            totalCount: 2,
                            returnedCount: 2,
                            truncated: false,
                            items: ["chunk-1", "chunk-2"]
                          },
                          sourceClaims: emptyIds,
                          sourceDecisions: emptyIds,
                          sourceDecisionEdges: emptyIds,
                          searchDocuments: emptyIds,
                          sourceRejections: emptyIds
                        }
                      }
                    ]
                  }
                }
              ]
            }
          };
        }
      };

      return {
        workspaceId: "workspace-1",
        projectId,
        compilerDependencies: {} as DatabaseRuntime["compilerDependencies"],
        harnessRunRepository: {} as DatabaseRuntime["harnessRunRepository"],
        memoryRepository: {} as DatabaseRuntime["memoryRepository"],
        retrievalRepository: {} as NonNullable<DatabaseRuntime["retrievalRepository"]>,
        sourceRepository: {} as DatabaseRuntime["sourceRepository"],
        sourceDecisionImportRepository: repository,
        async withSourceDecisionImportReadSnapshot(work) {
          snapshotCount += 1;
          return work(repository);
        },
        async close() {
          closed = true;
        }
      };
    };
    const result = await runSourceDecisionReconcileCommand({
      env: {
        KRN_DATABASE_URL: "postgres://localhost/krn"
      },
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      cwd: "/repo",
      command: {
        kind: "sourceDecisionReconcile",
        projectId: "project-explicit",
        limit: 2,
        afterImportId: "import-before",
        json: true
      },
      createDatabaseRuntime: createRuntime
    });
    const output: unknown = JSON.parse(result.stdout);

    expect(output).toMatchObject({
      kind: "source_decision_import_reconciliation",
      projectId,
      limit: 2,
      afterImportId: "import-before",
      nextAfterImportId: "import-current",
      persistence: "read_only_postgres",
      snapshotConsistency: "repeatable_read",
      dbWrites: "none",
      mutation: "none",
      imports: {
        totalCount: 2,
        returnedCount: 1,
        truncated: true,
        items: [
          {
            importId: "import-current",
            lifecycle: "partial",
            rowCount: 2,
            completeRowCount: 1,
            partialRowCount: 1,
            equivalentImportIds: {
              items: ["import-legacy"]
            }
          }
        ]
      }
    });
    expect(readCount).toBe(1);
    expect(snapshotCount).toBe(1);
    expect(runtimeInput?.projectId).toBe("project-explicit");
    expect(runtimeInput?.requireProjectKernelForExplicitProject).toBe(false);
    expect(closed).toBe(true);
  });

  it("requires database configuration", async () => {
    await expect(runSourceDecisionReconcileCommand({
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      cwd: "/repo",
      command: {
        kind: "sourceDecisionReconcile"
      }
    })).rejects.toThrow(
      "KRN_DATABASE_URL is required for krn source decision reconcile"
    );
  });

  it("requires an explicit project before creating a database runtime", async () => {
    let runtimeCreated = false;

    await expect(runSourceDecisionReconcileCommand({
      env: {
        KRN_DATABASE_URL: "postgres://localhost/krn"
      },
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      cwd: "/repo",
      command: {
        kind: "sourceDecisionReconcile"
      },
      createDatabaseRuntime: async () => {
        runtimeCreated = true;
        throw new Error("database runtime should not be created");
      }
    })).rejects.toThrow(
      "--project is required for read-only source decision reconciliation"
    );
    expect(runtimeCreated).toBe(false);
  });
});
