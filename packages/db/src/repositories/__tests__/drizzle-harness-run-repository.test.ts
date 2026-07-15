import { describe, expect, it } from "vitest";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { sql } from "drizzle-orm";
import postgres from "postgres";
import {
  buildDecisionPacketAuthorityProjection,
  createCommandOutputArtifact,
  currentDecisionPacketBindingForHarnessRun,
  decisionPacketBindingReadbackFromMetadata,
  evidenceBundleProvesHelped,
  ExecutionRunLifecycleConflictError,
  knowledgeUsefulnessOutcomesFromMetadata,
  sourceUsefulnessOutcomesFromMetadata
} from "@krn/core";
import type { EvalCandidateProposal } from "@krn/core";
import type {
  CreateEvidenceBundleInput,
  CreateEvidenceFeedbackOnceInput,
  CreateEvalFeedbackDeltaOnceInput
} from "@krn/core/repositories";

import { createKrnDatabase, type KrnDatabase } from "../../database.js";
import {
  cleanupActivationSmokeRows,
  countActivationSmokeMarkerRows,
  createSmokeHarnessScaffold
} from "../../dev/smoke/db-smoke-support.js";
import {
  contextAssemblies,
  maintenanceQueues,
  outboxEvents,
  runEvents
} from "../../schema/index.js";
import {
  DrizzleHarnessRunRepository,
  evidenceCommandsForPersistence,
  validateEvidenceBundleInputForPersistence
} from "../drizzle-harness-run-repository.js";
import { DrizzleRetrievalRepository } from "../drizzle-retrieval-repository.js";

const databaseUrl = process.env.KRN_DATABASE_URL?.trim();
const postgresIt = it.skipIf(databaseUrl === undefined || databaseUrl.length === 0);
const migrationsFolder = fileURLToPath(new URL("../../migrations", import.meta.url));

const evalCandidate: EvalCandidateProposal = {
  id: "eval-candidate-1",
  projectId: "project-1",
  status: "candidate",
  title: "Feedback candidate",
  scenario: "Repository readback should come from the persisted row.",
  expectedSignal: "Mapped row wins over raw input.",
  sourceEvidence: ["source-1"],
  metadata: {},
  createdAt: "2026-07-07T00:00:00.000Z"
};

const postgresBackendPid = async (
  client: ReturnType<typeof postgres>
): Promise<number> => {
  const rows = await client<{ pid: number }[]>`select pg_backend_pid()::int as pid`;
  const pid = rows[0]?.pid;

  if (pid === undefined) {
    throw new Error("PostgreSQL race barrier could not read its backend PID");
  }

  return pid;
};

const waitForPostgresBackendBlock = async (
  observer: ReturnType<typeof postgres>,
  targetPid: number,
  expectedBlockerPids: readonly number[]
): Promise<void> => {
  for (let attempt = 0; attempt < 500; attempt += 1) {
    const rows = await observer<{ blockingPids: number[] }[]>`
      select pg_blocking_pids(${targetPid})::int[] as "blockingPids"
    `;
    if (rows[0]?.blockingPids.some((pid) => expectedBlockerPids.includes(pid)) === true) {
      return;
    }

    await new Promise<void>((resolve) => setImmediate(resolve));
  }

  throw new Error(`PostgreSQL backend ${targetPid} did not reach the expected lock barrier`);
};

const expectRejectedReason = <T>(
  result: PromiseSettledResult<T>,
  unexpectedSuccessMessage: string
): unknown => {
  expect(result.status).toBe("rejected");

  if (result.status !== "rejected") {
    throw new Error(unexpectedSuccessMessage);
  }

  return result.reason;
};

const requireTestValue = <T>(value: T | undefined, message: string): T => {
  if (value === undefined) {
    throw new Error(message);
  }

  return value;
};

const rejectionMessage = (result: PromiseSettledResult<unknown>): string =>
  result.status === "rejected" && result.reason instanceof Error
    ? result.reason.message
    : "";

describe("DrizzleHarnessRunRepository", () => {
  const executionRunRow = (
    status: "planned" | "running" | "succeeded" | "failed" | "blocked" | "cancelled",
    timestamps: { startedAt?: Date; completedAt?: Date } = {}
  ) => {
    const createdAt = new Date("2026-07-13T10:00:00.000Z");

    return {
      id: "execution-run-1",
      harnessPlanId: "harness-plan-1",
      adapter: "codex",
      status,
      lifecycleRevision: 1,
      startedAt: timestamps.startedAt ?? null,
      completedAt: timestamps.completedAt ?? null,
      metadata: {},
      createdAt,
      updatedAt: createdAt
    };
  };

  const fakeExecutionRunDatabase = (row: ReturnType<typeof executionRunRow>) => {
    const insertedValues: unknown[] = [];
    const transactionClient = {
      query: {
        executionRuns: {
          findFirst: async () => row
        }
      },
      select: () => ({
        from: () => ({
          where: () => ({
            for: async () => [row]
          })
        })
      }),
      insert: () => ({
        values: (values: unknown) => {
          insertedValues.push(values);
          return {
            returning: async () => insertedValues.length === 1 ? [row] : []
          };
        }
      }),
      update: () => ({
        set: () => ({
          where: () => ({
            returning: async () => [row]
          })
        })
      })
    };

    return {
      db: {
        transaction: async <T>(callback: (tx: typeof transactionClient) => Promise<T>) =>
          callback(transactionClient)
      } as unknown as KrnDatabase,
      insertedValues
    };
  };

  it("rejects an execution run created directly in a terminal state", async () => {
    const fake = fakeExecutionRunDatabase(executionRunRow("succeeded"));

    await expect(new DrizzleHarnessRunRepository(fake.db).createExecutionRun({
      harnessPlanId: "harness-plan-1",
      adapter: "codex",
      status: "succeeded"
    })).rejects.toThrow("execution run lifecycle");
  });

  it("rejects a terminal execution run without start and completion timestamps", async () => {
    const fake = fakeExecutionRunDatabase(executionRunRow("failed"));

    await expect(new DrizzleHarnessRunRepository(fake.db).createExecutionRun({
      harnessPlanId: "harness-plan-1",
      adapter: "codex",
      status: "failed"
    })).rejects.toThrow("execution run lifecycle");
  });

  it("rejects a terminal run reversal and an incoherent completion update", async () => {
    const fake = fakeExecutionRunDatabase(executionRunRow("succeeded", {
      startedAt: new Date("2026-07-13T10:00:00.000Z")
    }));
    const repository = new DrizzleHarnessRunRepository(fake.db);

    await expect(repository.updateExecutionRunStatus({
      executionRunId: "execution-run-1",
      expectedStatus: "succeeded",
      status: "running"
    })).rejects.toThrow("execution run lifecycle");

    await expect(repository.updateExecutionRunStatus({
      executionRunId: "execution-run-1",
      expectedStatus: "succeeded",
      status: "succeeded",
      completedAt: "2026-07-13T09:59:00.000Z"
    })).rejects.toThrow("execution run lifecycle");
  });

  it("rejects running without a start and completion before the start", async () => {
    const missingStart = fakeExecutionRunDatabase(executionRunRow("running"));

    await expect(new DrizzleHarnessRunRepository(missingStart.db).createExecutionRun({
      harnessPlanId: "harness-plan-1",
      adapter: "codex",
      status: "running"
    })).rejects.toThrow("execution run lifecycle");

    const completionBeforeStart = fakeExecutionRunDatabase(executionRunRow("running", {
      startedAt: new Date("2026-07-13T10:00:00.000Z")
    }));

    await expect(new DrizzleHarnessRunRepository(completionBeforeStart.db).updateExecutionRunStatus({
      executionRunId: "execution-run-1",
      expectedStatus: "running",
      status: "succeeded",
      completedAt: "2026-07-13T09:59:00.000Z"
    })).rejects.toThrow("execution run lifecycle");
  });

  it("does not append a second event for a same-state retry", async () => {
    const fake = fakeExecutionRunDatabase(executionRunRow("running"));
    const repository = new DrizzleHarnessRunRepository(fake.db);

    const first = await repository.updateExecutionRunStatus({
      executionRunId: "execution-run-1",
      expectedStatus: "running",
      status: "running"
    });
    const second = await repository.updateExecutionRunStatus({
      executionRunId: "execution-run-1",
      expectedStatus: "running",
      status: "running"
    });

    expect(first.kind).toBe("already_at_status");
    expect(second.kind).toBe("already_at_status");
    expect(fake.insertedValues).toHaveLength(0);
  });

  it("exposes persisted run aggregate readback by execution run id", () => {
    expect(typeof DrizzleHarnessRunRepository.prototype.getHarnessRunByExecutionRunId).toBe(
      "function"
    );
    expect(typeof DrizzleHarnessRunRepository.prototype.createEvalFeedbackDeltaOnce).toBe(
      "function"
    );
    expect(typeof DrizzleHarnessRunRepository.prototype.listFeedbackDeltasForSubjects).toBe(
      "function"
    );
    expect(typeof DrizzleHarnessRunRepository.prototype.getFeedbackDeltaForProject).toBe(
      "function"
    );
  });

  it("reads the persisted aggregate in a repeatable-read read-only transaction", async () => {
    const transactionCalls: Array<{
      readonly accessMode: string | undefined;
      readonly isolationLevel: string | undefined;
    }> = [];
    const db = {
      transaction: async (
        callback: (transaction: {
          readonly query: {
            readonly executionRuns: { readonly findFirst: () => Promise<undefined> };
          };
        }) => Promise<unknown>,
        options: { readonly accessMode?: string; readonly isolationLevel?: string }
      ) => {
        transactionCalls.push(options);
        return callback({
          query: {
            executionRuns: { findFirst: async () => undefined }
          }
        });
      }
    } as unknown as KrnDatabase;

    await expect(
      new DrizzleHarnessRunRepository(db).getHarnessRunByExecutionRunId("missing-execution-run")
    ).resolves.toBeUndefined();
    expect(transactionCalls).toEqual([{
      accessMode: "read only",
      isolationLevel: "repeatable read"
    }]);
  });

  it("fails closed for malformed canonical revision metadata", async () => {
    const db = {
      transaction: async (callback: (transaction: unknown) => Promise<unknown>) =>
        callback({})
    } as unknown as KrnDatabase;

    await expect(new DrizzleHarnessRunRepository(db).createContextAssembly({
      harnessPlanId: "plan-1",
      inclusions: [{
        subjectType: "memory_record",
        subjectId: "memory-1",
        reason: "task-relevant",
        expectedUse: "apply",
        sourceAuthority: "high"
      }],
      exclusions: [],
      metadata: {
        canonicalRevisionTokens: ["not-a-revision-token"]
      }
    })).rejects.toThrow("canonicalRevisionTokens contain an invalid token");
  });

  it("rejects a context assembly when a canonical revision changed before persistence", async () => {
    let insertCalled = false;
    let selectCall = 0;
    const db = {
      transaction: async (callback: (transaction: unknown) => Promise<unknown>) => callback({
        select: () => {
          selectCall += 1;
          const rows = selectCall === 1
            ? [{ id: "plan-1" }]
            : selectCall === 2
              ? []
              : [{
                updatedAt: new Date("2026-06-01T00:00:01.000Z"),
                status: "invalidated",
                currentVersionId: null
              }];

          return {
            from: () => ({
              where: () => ({
                for: async () => rows,
                orderBy: () => ({ for: async () => rows })
              })
            })
          };
        },
        insert: () => {
          insertCalled = true;
          throw new Error("stale context must not insert");
        }
      })
    } as unknown as KrnDatabase;

    await expect(new DrizzleHarnessRunRepository(db).createContextAssembly({
      harnessPlanId: "plan-1",
      inclusions: [{
        subjectType: "memory_record",
        subjectId: "memory-1",
        reason: "task-relevant",
        expectedUse: "apply",
        sourceAuthority: "high"
      }],
      exclusions: [],
      metadata: {
        canonicalRevisionTokens: [{
          subjectType: "memory_record",
          subjectId: "memory-1",
          updatedAt: "2026-06-01T00:00:00.000Z",
          status: "active"
        }]
      }
    })).rejects.toThrow("canonical revision mismatch");
    expect(insertCalled).toBe(false);
  });

  it("rejects a canonical inclusion without matching revision coverage", async () => {
    let insertCalled = false;
    const db = {
      transaction: async (callback: (transaction: unknown) => Promise<unknown>) => callback({
        insert: () => ({
          values: () => ({
            returning: async () => {
              insertCalled = true;
              return [];
            }
          })
        })
      })
    } as unknown as KrnDatabase;

    await expect(new DrizzleHarnessRunRepository(db).createContextAssembly({
      harnessPlanId: "plan-1",
      inclusions: [{
        subjectType: "memory_record",
        subjectId: "memory-1",
        reason: "task-relevant",
        expectedUse: "apply",
        sourceAuthority: "high"
      }],
      exclusions: [],
      metadata: {}
    })).rejects.toThrow("canonical revision coverage");
    expect(insertCalled).toBe(false);
  });

  it("rejects duplicate, wrong-subject, and extra canonical revision coverage", async () => {
    const db = {
      transaction: async (callback: (transaction: unknown) => Promise<unknown>) => callback({
        insert: () => {
          throw new Error("coverage validation must run before insert");
        }
      })
    } as unknown as KrnDatabase;
    const repository = new DrizzleHarnessRunRepository(db);
    const inclusion = {
      subjectType: "source_claim" as const,
      subjectId: "claim-1",
      reason: "task-relevant",
      expectedUse: "apply",
      sourceAuthority: "high" as const
    };
    const token = {
      subjectType: "source_claim" as const,
      subjectId: "claim-1",
      updatedAt: "2026-06-01T00:00:00.000Z",
      status: "active"
    };

    await expect(repository.createContextAssembly({
      harnessPlanId: "plan-1",
      inclusions: [inclusion],
      exclusions: [],
      metadata: { canonicalRevisionTokens: [token, token] }
    })).rejects.toThrow("canonical revision coverage mismatch");

    await expect(repository.createContextAssembly({
      harnessPlanId: "plan-1",
      inclusions: [inclusion],
      exclusions: [],
      metadata: {
        canonicalRevisionTokens: [{ ...token, subjectId: "claim-2" }]
      }
    })).rejects.toThrow("canonical revision coverage mismatch");

    await expect(repository.createContextAssembly({
      harnessPlanId: "plan-1",
      inclusions: [inclusion],
      exclusions: [],
      metadata: {
        canonicalRevisionTokens: [
          token,
          { ...token, subjectId: "claim-2" }
        ]
      }
    })).rejects.toThrow("canonical revision coverage has no inclusion");
  });

  postgresIt(
    "guards legal execution lifecycle transitions and rejects illegal states",
    async () => {
      const marker = `krn_execution_lifecycle_${crypto.randomUUID().replaceAll("-", "")}`;
      const scaffold = await createSmokeHarnessScaffold({
        databaseUrl: databaseUrl!,
        migrationsFolder,
        smokeId: marker,
        smokeName: "execution lifecycle falsifier",
        workspacePrefix: "krn-execution-lifecycle",
        projectSlug: "execution-lifecycle",
        cleanupRows: cleanupActivationSmokeRows,
        countMarkerRows: countActivationSmokeMarkerRows,
        rawIntent: `execution lifecycle ${marker}`,
        taskContract: {
          title: "Falsify execution lifecycle states",
          objective: "Record illegal execution run transitions before the guarded implementation.",
          constraints: ["real PostgreSQL"],
          nonGoals: ["do not normalize legacy rows"],
          acceptance: ["illegal states are observable"]
        },
        harnessPlan: {
          summary: "Execution lifecycle falsifier",
          nextAction: "Record lifecycle state matrix."
        }
      });

      try {
        const createRun = () => scaffold.harnessRunRepository.createExecutionRun({
          harnessPlanId: scaffold.harnessPlan.id,
          adapter: "lifecycle-falsifier",
          status: "planned",
          metadata: { smokeId: marker, falsifier: "execution-lifecycle" }
        });

        await expect(scaffold.harnessRunRepository.createExecutionRun({
          harnessPlanId: scaffold.harnessPlan.id,
          adapter: "lifecycle-falsifier",
          status: "succeeded",
          metadata: { smokeId: marker, falsifier: "execution-lifecycle" }
        })).rejects.toThrow("execution run lifecycle");

        const plannedRun = await createRun();
        const runningTransition = await scaffold.harnessRunRepository.updateExecutionRunStatus({
          executionRunId: plannedRun.id,
          expectedStatus: "planned",
          status: "running",
          startedAt: "2026-07-13T10:01:00.000Z"
        });
        if (runningTransition.kind !== "transitioned") {
          throw new Error("planned-to-running transition unexpectedly became a no-op");
        }
        const runningRun = runningTransition.executionRun;
        const succeededTransition = await scaffold.harnessRunRepository.updateExecutionRunStatus({
          executionRunId: runningRun.id,
          expectedStatus: "running",
          status: "succeeded",
          startedAt: "2026-07-13T10:00:00.000Z",
          completedAt: "2026-07-13T10:02:00.000Z"
        });
        if (succeededTransition.kind !== "transitioned") {
          throw new Error("running-to-succeeded transition unexpectedly became a no-op");
        }
        const succeededRun = succeededTransition.executionRun;

        await expect(scaffold.harnessRunRepository.updateExecutionRunStatus({
          executionRunId: succeededRun.id,
          expectedStatus: "succeeded",
          status: "running"
        })).rejects.toThrow("execution run lifecycle");

        const sameStateRetry = await scaffold.harnessRunRepository.updateExecutionRunStatus({
          executionRunId: succeededRun.id,
          expectedStatus: "succeeded",
          status: "succeeded"
        });

        expect(runningRun.startedAt).toBe("2026-07-13T10:01:00.000Z");
        expect(succeededRun.startedAt).toBe("2026-07-13T10:01:00.000Z");
        expect(succeededRun.completedAt).toBe("2026-07-13T10:02:00.000Z");
        expect(plannedRun.lifecycleRevision).toBe(1);
        expect(runningRun.lifecycleRevision).toBe(2);
        expect(succeededRun.lifecycleRevision).toBe(3);

        const [{ executionRunCount }] = await scaffold.client<{ executionRunCount: number }[]>`
          select count(*)::int as "executionRunCount"
          from execution_runs
          where metadata->>'smokeId' = ${marker}
        `;
        const [{ eventCount }] = await scaffold.client<{ eventCount: number }[]>`
          select count(*)::int as "eventCount"
          from run_events
          where execution_run_id = ${plannedRun.id}
        `;
        const lifecycleEventRows = await scaffold.client<{
          id: string;
          message: string;
          occurredAt: string;
          payload: Record<string, unknown>;
          sequence: number;
          severity: string;
          type: string;
        }[]>`
          select
            id,
            sequence,
            type,
            severity,
            message,
            payload,
            to_char(occurred_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "occurredAt"
          from run_events
          where execution_run_id = ${plannedRun.id}
          order by sequence
        `;
        expect(executionRunCount).toBe(1);
        expect(eventCount).toBe(3);
        expect(lifecycleEventRows).toEqual([
          {
            id: expect.any(String),
            sequence: 1,
            type: "execution_run.lifecycle.created",
            severity: "info",
            message: "Execution run created with status planned.",
            payload: { status: "planned", lifecycleRevision: 1 },
            occurredAt: expect.any(String)
          },
          {
            id: expect.any(String),
            sequence: 2,
            type: "execution_run.lifecycle.transitioned",
            severity: "info",
            message: "Execution run transitioned from planned to running.",
            payload: {
              fromStatus: "planned",
              toStatus: "running",
              lifecycleRevision: 2
            },
            occurredAt: expect.any(String)
          },
          {
            id: expect.any(String),
            sequence: 3,
            type: "execution_run.lifecycle.transitioned",
            severity: "info",
            message: "Execution run transitioned from running to succeeded.",
            payload: {
              fromStatus: "running",
              toStatus: "succeeded",
              lifecycleRevision: 3
            },
            occurredAt: expect.any(String)
          }
        ]);
        expect(runningTransition.lifecycleEvent).toEqual({
          ...lifecycleEventRows[1],
          executionRunId: plannedRun.id
        });
        expect(succeededTransition.lifecycleEvent).toEqual({
          ...lifecycleEventRows[2],
          executionRunId: plannedRun.id
        });
        expect(sameStateRetry).toEqual({
          kind: "already_at_status",
          executionRun: succeededRun
        });
      } finally {
        await scaffold.cleanup();
        await scaffold.client.end();
      }
    }
  );

  postgresIt(
    "persists lifecycle timestamps for direct planned-to-terminal runs",
    async () => {
      const marker = `krn_execution_direct_terminal_${crypto.randomUUID().replaceAll("-", "")}`;
      const scaffold = await createSmokeHarnessScaffold({
        databaseUrl: databaseUrl!,
        migrationsFolder,
        smokeId: marker,
        smokeName: "direct execution terminal timestamps",
        workspacePrefix: "krn-execution-direct-terminal",
        projectSlug: "execution-direct-terminal",
        cleanupRows: cleanupActivationSmokeRows,
        countMarkerRows: countActivationSmokeMarkerRows,
        rawIntent: `direct execution terminal timestamps ${marker}`,
        taskContract: {
          title: "Persist direct terminal timestamps",
          objective: "Keep validated lifecycle timestamps coherent after persistence.",
          constraints: ["real PostgreSQL"],
          nonGoals: ["no provider execution"],
          acceptance: ["blocked and cancelled preserve exact timestamps"]
        },
        harnessPlan: {
          summary: "Direct execution terminal timestamp smoke",
          nextAction: "Transition planned runs directly to terminal states."
        }
      });

      try {
        const transitions = [
          {
            status: "blocked",
            startedAt: "2026-07-14T10:00:00.000Z",
            completedAt: "2026-07-14T10:01:00.000Z"
          },
          {
            status: "cancelled",
            startedAt: "2026-07-14T11:00:00.000Z",
            completedAt: "2026-07-14T11:01:00.000Z"
          }
        ] as const;

        for (const transition of transitions) {
          const planned = await scaffold.harnessRunRepository.createExecutionRun({
            harnessPlanId: scaffold.harnessPlan.id,
            adapter: "direct-terminal-timestamps",
            status: "planned",
            metadata: {
              smokeId: marker,
              terminalStatus: transition.status
            }
          });
          const terminal = await scaffold.harnessRunRepository.updateExecutionRunStatus({
            executionRunId: planned.id,
            expectedStatus: "planned",
            status: transition.status,
            startedAt: transition.startedAt,
            completedAt: transition.completedAt
          });

          expect(terminal).toMatchObject({
            kind: "transitioned",
            executionRun: {
              status: transition.status,
              lifecycleRevision: 2,
              startedAt: transition.startedAt,
              completedAt: transition.completedAt
            },
            lifecycleEvent: {
              executionRunId: planned.id,
              sequence: 2,
              type: "execution_run.lifecycle.transitioned",
              severity: "info",
              payload: {
                fromStatus: "planned",
                toStatus: transition.status,
                lifecycleRevision: 2
              }
            }
          });
          if (terminal.kind !== "transitioned") {
            throw new Error("direct terminal transition unexpectedly became a no-op");
          }
          expect(terminal.lifecycleEvent.payload).toEqual({
            fromStatus: "planned",
            toStatus: transition.status,
            lifecycleRevision: 2
          });
          const aggregate = await scaffold.harnessRunRepository.getHarnessRunByExecutionRunId(
            planned.id
          );
          expect(aggregate?.executionRun).toMatchObject({
            status: transition.status,
            lifecycleRevision: 2,
            startedAt: transition.startedAt,
            completedAt: transition.completedAt
          });
        }

        const incoherentPlanned = await scaffold.harnessRunRepository.createExecutionRun({
          harnessPlanId: scaffold.harnessPlan.id,
          adapter: "direct-terminal-timestamps",
          status: "planned",
          metadata: {
            smokeId: marker,
            terminalStatus: "incoherent"
          }
        });
        await expect(scaffold.harnessRunRepository.updateExecutionRunStatus({
          executionRunId: incoherentPlanned.id,
          expectedStatus: "planned",
          status: "blocked",
          startedAt: "2026-07-14T12:01:00.000Z",
          completedAt: "2026-07-14T12:00:00.000Z"
        })).rejects.toThrow("execution run lifecycle completedAt cannot precede startedAt");
        const incoherentAggregate =
          await scaffold.harnessRunRepository.getHarnessRunByExecutionRunId(
            incoherentPlanned.id
          );
        expect(incoherentAggregate?.executionRun).toMatchObject({
          status: "planned",
          lifecycleRevision: 1
        });
        expect(incoherentAggregate?.executionRun.startedAt).toBeUndefined();
        expect(incoherentAggregate?.executionRun.completedAt).toBeUndefined();

        const [{ executionRunCount }] = await scaffold.client<{
          executionRunCount: number;
        }[]>`
          select count(*)::int as "executionRunCount"
          from execution_runs
          where metadata->>'smokeId' = ${marker}
        `;
        const [{ eventCount }] = await scaffold.client<{ eventCount: number }[]>`
          select count(*)::int as "eventCount"
          from run_events
          where execution_run_id in (
            select id
            from execution_runs
            where metadata->>'smokeId' = ${marker}
          )
        `;
        expect(executionRunCount).toBe(3);
        expect(eventCount).toBe(5);
      } finally {
        await scaffold.cleanup();
        await scaffold.client.end();
      }
    }
  );

  postgresIt(
    "allows exactly one concurrent execution lifecycle transition",
    // fallow-ignore-next-line complexity -- the two-client lock race needs explicit settlement and cleanup branches
    async () => {
      const marker = `krn_execution_lifecycle_race_${crypto.randomUUID().replaceAll("-", "")}`;
      const scaffold = await createSmokeHarnessScaffold({
        databaseUrl: databaseUrl!,
        migrationsFolder,
        smokeId: marker,
        smokeName: "execution lifecycle race smoke",
        workspacePrefix: "krn-execution-lifecycle-race",
        projectSlug: "execution-lifecycle-race",
        cleanupRows: cleanupActivationSmokeRows,
        countMarkerRows: countActivationSmokeMarkerRows,
        rawIntent: `execution lifecycle race ${marker}`,
        taskContract: {
          title: "Guard concurrent execution transitions",
          objective: "Only one expected-status transition may append its event.",
          constraints: ["real PostgreSQL", "two independent connections"],
          nonGoals: ["no provider execution"],
          acceptance: ["one winner, one stale loser, exact event count"]
        },
        harnessPlan: {
          summary: "Execution lifecycle race smoke",
          nextAction: "Race two terminal transitions from running."
        }
      });
      const contenderClient = postgres(databaseUrl!, { max: 1, onnotice: () => undefined });
      const controlClient = postgres(databaseUrl!, { max: 1, onnotice: () => undefined });
      let controlTransactionOpen = false;
      let transitionPromises: readonly Promise<unknown>[] = [];

      try {
        const contenderRepository = new DrizzleHarnessRunRepository(
          createKrnDatabase(contenderClient)
        );
        const planned = await scaffold.harnessRunRepository.createExecutionRun({
          harnessPlanId: scaffold.harnessPlan.id,
          adapter: "lifecycle-race",
          status: "planned",
          metadata: { smokeId: marker }
        });
        await scaffold.harnessRunRepository.updateExecutionRunStatus({
          executionRunId: planned.id,
          expectedStatus: "planned",
          status: "running",
          startedAt: "2026-07-13T10:01:00.000Z"
        });
        const successBackendPid = await postgresBackendPid(scaffold.client);
        const failureBackendPid = await postgresBackendPid(contenderClient);
        const controlBackendPid = await postgresBackendPid(controlClient);

        await controlClient.unsafe("begin");
        controlTransactionOpen = true;
        await controlClient`
          select id from execution_runs where id = ${planned.id} for update
        `;
        const successTransition = scaffold.harnessRunRepository.updateExecutionRunStatus({
          executionRunId: planned.id,
          expectedStatus: "running",
          status: "succeeded",
          completedAt: "2026-07-13T10:02:00.000Z"
        });
        transitionPromises = [successTransition];
        await waitForPostgresBackendBlock(
          controlClient,
          successBackendPid,
          [controlBackendPid]
        );
        const failureTransition = contenderRepository.updateExecutionRunStatus({
          executionRunId: planned.id,
          expectedStatus: "running",
          status: "failed",
          completedAt: "2026-07-13T10:03:00.000Z"
        });
        transitionPromises = [successTransition, failureTransition];
        await waitForPostgresBackendBlock(
          controlClient,
          failureBackendPid,
          [controlBackendPid, successBackendPid]
        );
        await controlClient.unsafe("commit");
        controlTransactionOpen = false;
        const results = await Promise.allSettled([successTransition, failureTransition]);

        expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
        expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);

        const winner = results.flatMap((result) =>
          result.status === "fulfilled" ? [result.value] : []
        )[0];
        const loserReason = results.flatMap((result) =>
          result.status === "rejected" ? [result.reason as unknown] : []
        )[0];
        if (winner === undefined) {
          throw new Error("execution lifecycle race did not produce a winner");
        }
        if (winner.kind !== "transitioned") {
          throw new Error("execution lifecycle race winner unexpectedly became a no-op");
        }
        expect(loserReason).toBeInstanceOf(ExecutionRunLifecycleConflictError);
        expect(loserReason).toMatchObject({
          conflict: {
            kind: "status",
            executionRunId: planned.id,
            expectedStatus: "running",
            actualStatus: "succeeded"
          }
        });

        const [runReadback] = await scaffold.client<{
          status: string;
          lifecycleRevision: number;
          startedAt: string | null;
          completedAt: string | null;
        }[]>`
          select
            status,
            lifecycle_revision as "lifecycleRevision",
            to_char(started_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "startedAt",
            to_char(completed_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "completedAt"
          from execution_runs
          where id = ${planned.id}
        `;
        const eventReadback = await scaffold.client<{
          sequence: number;
          type: string;
          payload: Record<string, unknown>;
        }[]>`
          select sequence, type, payload
          from run_events
          where execution_run_id = ${planned.id}
          order by sequence
        `;
        const aggregate = await scaffold.harnessRunRepository.getHarnessRunByExecutionRunId(
          planned.id
        );
        const completedAt = "2026-07-13T10:02:00.000Z";

        expect(winner.executionRun.status).toBe("succeeded");
        expect(runReadback?.status).toBe("succeeded");
        expect(runReadback?.lifecycleRevision).toBe(3);
        expect(runReadback?.startedAt).toBe("2026-07-13T10:01:00.000Z");
        expect(runReadback?.completedAt).toBe(completedAt);
        expect(winner.executionRun.lifecycleRevision).toBe(3);
        expect(winner.executionRun.completedAt).toBe(completedAt);
        expect(winner.lifecycleEvent).toMatchObject({
          executionRunId: planned.id,
          sequence: 3,
          type: "execution_run.lifecycle.transitioned",
          severity: "info",
          payload: {
            fromStatus: "running",
            toStatus: "succeeded",
            lifecycleRevision: 3
          }
        });
        expect(winner.lifecycleEvent.payload).toEqual({
          fromStatus: "running",
          toStatus: "succeeded",
          lifecycleRevision: 3
        });
        expect(eventReadback.map((event) => event.sequence)).toEqual([1, 2, 3]);
        expect(eventReadback[2]?.type).toBe("execution_run.lifecycle.transitioned");
        expect(eventReadback[2]?.payload).toEqual({
          fromStatus: "running",
          toStatus: "succeeded",
          lifecycleRevision: 3
        });
        expect(aggregate?.executionRun).toMatchObject({
          status: "succeeded",
          lifecycleRevision: 3,
          startedAt: "2026-07-13T10:01:00.000Z",
          completedAt
        });
      } finally {
        if (controlTransactionOpen) {
          await controlClient.unsafe("rollback");
        }
        await Promise.allSettled(transitionPromises);
        await scaffold.cleanup();
        await Promise.all([
          scaffold.client.end(),
          contenderClient.end(),
          controlClient.end()
        ]);
      }
    }
  );

  postgresIt(
    "serializes concurrent ordinary evidence event sequences under the execution run lock",
    async () => {
      const marker = `krn_evidence_event_race_${crypto.randomUUID().replaceAll("-", "")}`;
      const scaffold = await createSmokeHarnessScaffold({
        databaseUrl: databaseUrl!,
        migrationsFolder,
        smokeId: marker,
        smokeName: "ordinary evidence event race smoke",
        workspacePrefix: "krn-evidence-event-race",
        projectSlug: "evidence-event-race",
        cleanupRows: cleanupActivationSmokeRows,
        countMarkerRows: countActivationSmokeMarkerRows,
        rawIntent: `ordinary evidence event race ${marker}`,
        taskContract: {
          title: "Serialize ordinary evidence events",
          objective: "Allocate unique event sequences for concurrent evidence writers.",
          constraints: ["real PostgreSQL", "independent connections", "no sleeps"],
          nonGoals: ["no lifecycle transition"],
          acceptance: ["both evidence bundles persist with contiguous event sequences"]
        },
        harnessPlan: {
          summary: "Ordinary evidence event sequence race",
          nextAction: "Race two evidence bundle writers for one execution run."
        }
      });
      const contenderClient = postgres(databaseUrl!, { max: 1, onnotice: () => undefined });
      const controlClient = postgres(databaseUrl!, { max: 1, onnotice: () => undefined });
      const contenderRepository = new DrizzleHarnessRunRepository(
        createKrnDatabase(contenderClient)
      );
      let controlTransactionOpen = false;
      let evidencePromises: readonly Promise<unknown>[] = [];

      try {
        const planned = await scaffold.harnessRunRepository.createExecutionRun({
          harnessPlanId: scaffold.harnessPlan.id,
          adapter: "evidence-event-race",
          status: "planned",
          metadata: { smokeId: marker }
        });
        const firstWriterPid = await postgresBackendPid(scaffold.client);
        const secondWriterPid = await postgresBackendPid(contenderClient);
        const controlPid = await postgresBackendPid(controlClient);
        const evidenceInput = (writer: "first" | "second") => ({
          executionRunId: planned.id,
          status: "captured" as const,
          changedFiles: [`smoke/${writer}.ts`],
          commands: [{ command: `verify ${writer}`, status: "passed" as const }],
          diffRisk: "low" as const,
          reviewBurden: `${writer} concurrent evidence writer.`,
          rollbackPath: "Delete marker-scoped smoke rows.",
          event: {
            type: `smoke.evidence_event_race.${writer}`,
            message: `${writer} ordinary evidence event`,
            payload: { smokeId: marker, writer }
          },
          metadata: { smokeId: marker, writer }
        });

        await controlClient.unsafe("begin");
        controlTransactionOpen = true;
        await controlClient`
          select id from execution_runs where id = ${planned.id} for update
        `;
        const firstEvidence = scaffold.harnessRunRepository.createEvidenceBundle(
          evidenceInput("first")
        );
        evidencePromises = [firstEvidence];
        await waitForPostgresBackendBlock(controlClient, firstWriterPid, [controlPid]);
        const secondEvidence = contenderRepository.createEvidenceBundle(
          evidenceInput("second")
        );
        evidencePromises = [firstEvidence, secondEvidence];
        await waitForPostgresBackendBlock(
          controlClient,
          secondWriterPid,
          [controlPid, firstWriterPid]
        );
        await controlClient.unsafe("commit");
        controlTransactionOpen = false;

        const persistedEvidence = await Promise.all([firstEvidence, secondEvidence]);
        const eventReadback = await scaffold.client<{
          payload: Record<string, unknown>;
          sequence: number;
          type: string;
        }[]>`
          select sequence, type, payload
          from run_events
          where execution_run_id = ${planned.id}
          order by sequence
        `;
        const ordinaryEvents = eventReadback
          .slice(1)
          .toSorted((left, right) => left.type.localeCompare(right.type));

        expect(persistedEvidence.map((bundle) => bundle.executionRunId)).toEqual([
          planned.id,
          planned.id
        ]);
        expect(new Set(persistedEvidence.map((bundle) => bundle.id)).size).toBe(2);
        expect(eventReadback.map((event) => event.sequence)).toEqual([1, 2, 3]);
        expect(eventReadback[0]).toMatchObject({
          sequence: 1,
          type: "execution_run.lifecycle.created"
        });
        expect(ordinaryEvents).toEqual([
          {
            sequence: expect.any(Number),
            type: "smoke.evidence_event_race.first",
            payload: { smokeId: marker, writer: "first" }
          },
          {
            sequence: expect.any(Number),
            type: "smoke.evidence_event_race.second",
            payload: { smokeId: marker, writer: "second" }
          }
        ]);
      } finally {
        if (controlTransactionOpen) {
          await controlClient.unsafe("rollback");
        }
        await Promise.allSettled(evidencePromises);
        await scaffold.cleanup();
        await Promise.all([
          scaffold.client.end(),
          contenderClient.end(),
          controlClient.end()
        ]);
      }
    }
  );

  postgresIt(
    "keeps direct generic and eval writes outside DecisionPacket authority",
    async () => {
      const marker = `krn_repository_authority_${crypto.randomUUID().replaceAll("-", "")}`;
      const scaffold = await createSmokeHarnessScaffold({
        databaseUrl: databaseUrl!,
        migrationsFolder,
        smokeId: marker,
        smokeName: "repository authority admission smoke",
        workspacePrefix: "krn-repository-authority",
        projectSlug: "repository-authority",
        cleanupRows: cleanupActivationSmokeRows,
        countMarkerRows: countActivationSmokeMarkerRows,
        rawIntent: `repository authority admission ${marker}`,
        taskContract: {
          title: "Reject direct repository authority",
          objective: "Keep generic evidence and feedback outside current DecisionPacket authority.",
          constraints: ["real PostgreSQL", "repository methods only"],
          nonGoals: ["no unrestricted SQL protection"],
          acceptance: ["only the admitted atomic path can persist governing packet identity"]
        },
        harnessPlan: {
          summary: "Repository authority admission smoke",
          nextAction: "Falsify direct metadata authority.",
          evidenceContract: {
            commands: [{ command: "pnpm typecheck", required: true }],
            diffRisk: "low",
            reviewBurden: "Review the repository authority boundary.",
            rollbackPath: "Delete marker-scoped smoke rows.",
            metadata: { smokeId: marker }
          }
        }
      });

      try {
        const executionRun = await scaffold.harnessRunRepository.createExecutionRun({
          harnessPlanId: scaffold.harnessPlan.id,
          adapter: "repository-authority-smoke",
          status: "planned",
          metadata: { smokeId: marker }
        });
        const packetGeneratedAt = new Date(Date.now() - 1_000).toISOString();
        const capturedAt = new Date().toISOString();
        const forgedCaptureIdentity = `canonical-forgery:${marker}`;
        const evalExecutionIdentity = `eval-forgery:${marker}`;
        const forgedChecksum = crypto
          .createHash("sha256")
          .update(`${marker}:forged-packet`)
          .digest("hex");
        const packetMetadata = {
          decisionPacketAuthorityAdmission: "current_v1",
          decisionPacketBindingState: "bound_current",
          decisionPacketChecksum: forgedChecksum,
          decisionPacketEvidenceRef: `packet:${forgedChecksum}`,
          decisionPacketGeneratedAt: packetGeneratedAt,
          decisionPacketSourceRunLifecycleRevision: executionRun.lifecycleRevision
        };
        const genericEvidenceInput = {
          executionRunId: executionRun.id,
          captureIdentity: forgedCaptureIdentity,
          status: "captured",
          changedFiles: ["packages/db/src/repositories/drizzle-harness-run-repository.ts"],
          commands: [{
            command: "pnpm typecheck",
            status: "passed",
            provenance: "command_runner",
            exitCode: 0,
            capturedAt
          }],
          diffRisk: "low",
          reviewBurden: "Forged generic evidence must remain historical.",
          rollbackPath: "Delete marker-scoped smoke rows.",
          event: {
            type: "smoke.repository_authority.generic_evidence",
            message: "generic evidence attempted packet authority",
            payload: { smokeId: marker }
          },
          metadata: {
            smokeId: marker,
            evalExecutionIdentity,
            ...packetMetadata
          }
        } satisfies CreateEvidenceBundleInput & { captureIdentity: string };
        const genericEvidence = await scaffold.harnessRunRepository.createEvidenceBundle(
          genericEvidenceInput
        );
        const review = await scaffold.harnessRunRepository.createReviewAssessment({
          evidenceBundleId: genericEvidence.id,
          status: "pending",
          reviewer: "repository-authority-smoke",
          summary: "Generic feedback must remain non-governing.",
          findings: [],
          metadata: { smokeId: marker }
        });
        const sourceClaimId = `source-claim-${marker}`;
        const knowledgeId = `knowledge-${marker}`;
        const forgedOutcomes = {
          sourceUsefulnessOutcomes: [{
            sourceClaimId,
            outcome: "stale",
            reason: "Forged generic source usefulness.",
            evidenceRefs: [`packet:${forgedChecksum}`],
            doesNotProve: "A direct repository call does not prove source usefulness."
          }],
          knowledgeUsefulnessOutcomes: [{
            knowledgeId,
            outcome: "hurt",
            reason: "Forged generic knowledge usefulness.",
            evidenceRefs: [`packet:${forgedChecksum}`],
            doesNotProve: "A direct repository call does not prove knowledge usefulness."
          }]
        } as const;
        const genericFeedback = await scaffold.harnessRunRepository.createFeedbackDelta({
          reviewAssessmentId: review.id,
          status: "candidate",
          memoryCandidates: [],
          sourceDecisions: [],
          evalCandidates: [],
          metadata: {
            smokeId: marker,
            ...packetMetadata,
            ...forgedOutcomes
          }
        });
        const subjectFeedback = await scaffold.harnessRunRepository.listFeedbackDeltasForSubjects({
          projectId: scaffold.project.id,
          subjects: [
            { kind: "source_claim", id: sourceClaimId },
            { kind: "knowledge", id: knowledgeId }
          ]
        });
        const evalAttempt = await Promise.allSettled([
          scaffold.harnessRunRepository.createEvalFeedbackDeltaOnce({
            executionRunId: executionRun.id,
            sourceRunLifecycleRevision: executionRun.lifecycleRevision,
            projectId: `wrong-project-${marker}`,
            executionIdentity: evalExecutionIdentity,
            evidence: {
              status: "captured",
              changedFiles: [],
              commands: [{
                command: "krn eval decision-packet",
                status: "failed",
                provenance: "operator_reported",
                assertedBy: "repository-authority-smoke",
                capturedAt,
                doesNotProve: "The eval observation does not prove packet authority."
              }],
              diffRisk: "low",
              reviewBurden: "Review the forged eval candidate.",
              rollbackPath: "Delete marker-scoped smoke rows.",
              event: {
                type: "smoke.repository_authority.eval",
                message: "eval attempted cross-project authority",
                payload: { smokeId: marker, evalExecutionIdentity }
              },
              metadata: { smokeId: marker, ...packetMetadata }
            },
            review: {
              status: "pending",
              reviewer: "repository-authority-smoke",
              summary: "Cross-project eval persistence must reject.",
              findings: [],
              metadata: { smokeId: marker }
            },
            feedback: {
              status: "candidate",
              memoryCandidates: [],
              sourceDecisions: [],
              evalCandidates: [],
              metadata: {
                smokeId: marker,
                evalExecutionIdentity,
                ...packetMetadata,
                ...forgedOutcomes
              }
            }
          })
        ]);
        const canonicalAttempt = await Promise.allSettled([
          scaffold.harnessRunRepository.createEvidenceFeedbackOnce({
            executionRunId: executionRun.id,
            sourceRunLifecycleRevision: executionRun.lifecycleRevision,
            projectId: scaffold.project.id,
            captureIdentity: forgedCaptureIdentity,
            decisionPacketClaim: {
              checksum: forgedChecksum,
              generatedAt: packetGeneratedAt
            },
            sourceUsefulnessOutcomes: forgedOutcomes.sourceUsefulnessOutcomes,
            knowledgeUsefulnessOutcomes: forgedOutcomes.knowledgeUsefulnessOutcomes,
            evidence: {
              status: "captured",
              changedFiles: [],
              commands: [],
              diffRisk: "low",
              reviewBurden: "Reject a caller-authored canonical checksum.",
              rollbackPath: "Delete marker-scoped smoke rows.",
              event: {
                type: "smoke.repository_authority.canonical_forgery",
                message: "canonical path attempted forged packet identity",
                payload: { smokeId: marker, captureIdentity: forgedCaptureIdentity }
              },
              metadata: { smokeId: marker, ...packetMetadata }
            },
            review: {
              status: "pending",
              reviewer: "repository-authority-smoke",
              summary: "Forged canonical packet identity must reject.",
              findings: [],
              metadata: { smokeId: marker }
            },
            feedback: {
              status: "candidate",
              memoryCandidates: [],
              sourceDecisions: [],
              evalCandidates: [],
              metadata: {
                smokeId: marker,
                ...packetMetadata,
                ...forgedOutcomes
              }
            }
          })
        ]);
        const currentAggregate = await scaffold.harnessRunRepository
          .getHarnessRunByExecutionRunId(executionRun.id);
        if (currentAggregate === undefined) {
          throw new Error("repository authority aggregate was not persisted");
        }
        const currentPacketBinding = currentDecisionPacketBindingForHarnessRun({
          aggregate: currentAggregate,
          packetGeneratedAt: new Date().toISOString(),
          sha256Hex: (value) => crypto.createHash("sha256").update(value).digest("hex")
        });
        const unselectedCaptureIdentity = `canonical-unselected:${marker}`;
        const unselectedSubjectAttempt = await Promise.allSettled([
          scaffold.harnessRunRepository.createEvidenceFeedbackOnce({
            executionRunId: executionRun.id,
            sourceRunLifecycleRevision: executionRun.lifecycleRevision,
            projectId: scaffold.project.id,
            captureIdentity: unselectedCaptureIdentity,
            decisionPacketClaim: {
              checksum: currentPacketBinding.packetChecksum,
              generatedAt: currentPacketBinding.packetGeneratedAt
            },
            knowledgeUsefulnessOutcomes: [{
              knowledgeId,
              outcome: "hurt",
              reason: "An unselected subject must not acquire governing usefulness.",
              evidenceRefs: [currentPacketBinding.packetEvidenceRef],
              doesNotProve: "Selection does not prove knowledge quality."
            }],
            evidence: {
              status: "captured",
              changedFiles: [],
              commands: [],
              diffRisk: "low",
              reviewBurden: "Reject an unselected usefulness subject.",
              rollbackPath: "Delete marker-scoped smoke rows.",
              event: {
                type: "smoke.repository_authority.unselected_subject",
                message: "canonical path attempted an unselected usefulness subject",
                payload: { smokeId: marker, captureIdentity: unselectedCaptureIdentity }
              },
              metadata: { smokeId: marker }
            },
            review: {
              status: "pending",
              reviewer: "repository-authority-smoke",
              summary: "Unselected usefulness subject must reject.",
              findings: [],
              metadata: { smokeId: marker }
            },
            feedback: {
              status: "candidate",
              memoryCandidates: [],
              sourceDecisions: [],
              evalCandidates: [],
              metadata: { smokeId: marker }
            }
          })
        ]);
        const [rejectedSideEffects] = await scaffold.client<{
          evidenceBundleCount: number;
          feedbackDeltaCount: number;
          outboxEventCount: number;
          reviewAssessmentCount: number;
          runEventCount: number;
        }[]>`
          select
            (select count(*)::int from evidence_bundles bundle
              where bundle.capture_identity in (${forgedCaptureIdentity}, ${unselectedCaptureIdentity})
                 or bundle.metadata->>'evalExecutionIdentity' = ${evalExecutionIdentity}) as "evidenceBundleCount",
            (select count(*)::int from review_assessments review
              inner join evidence_bundles bundle on bundle.id = review.evidence_bundle_id
              where bundle.capture_identity in (${forgedCaptureIdentity}, ${unselectedCaptureIdentity})
                 or bundle.metadata->>'evalExecutionIdentity' = ${evalExecutionIdentity}) as "reviewAssessmentCount",
            (select count(*)::int from feedback_deltas feedback
              inner join review_assessments review on review.id = feedback.review_assessment_id
              inner join evidence_bundles bundle on bundle.id = review.evidence_bundle_id
              where bundle.capture_identity in (${forgedCaptureIdentity}, ${unselectedCaptureIdentity})
                 or bundle.metadata->>'evalExecutionIdentity' = ${evalExecutionIdentity}) as "feedbackDeltaCount",
            (select count(*)::int from outbox_events event
              where event.payload->>'captureIdentity' in (${forgedCaptureIdentity}, ${unselectedCaptureIdentity})
                 or event.payload->>'evalExecutionIdentity' = ${evalExecutionIdentity}) as "outboxEventCount",
            (select count(*)::int from run_events event
              where event.payload->>'captureIdentity' in (${forgedCaptureIdentity}, ${unselectedCaptureIdentity})
                 or event.payload->>'evalExecutionIdentity' = ${evalExecutionIdentity}) as "runEventCount"
        `;

        expect({
          genericBinding: decisionPacketBindingReadbackFromMetadata(genericEvidence.metadata).status,
          genericHelped: evidenceBundleProvesHelped({
            bundle: genericEvidence,
            evidenceContract: {
              taskContractId: scaffold.taskContract.id,
              commands: [{ command: "pnpm typecheck", required: true }],
              diffRisk: "low",
              reviewBurden: "Review the repository authority boundary.",
              rollbackPath: "Delete marker-scoped smoke rows.",
              metadata: { smokeId: marker }
            },
            packetChecksum: forgedChecksum,
            packetGeneratedAt,
            sourceRunLifecycleRevision: executionRun.lifecycleRevision,
            sha256Hex: (value) =>
              crypto.createHash("sha256").update(value).digest("hex")
          }),
          genericKnowledgeOutcomes:
            knowledgeUsefulnessOutcomesFromMetadata(genericFeedback.metadata).length,
          genericSourceOutcomes:
            sourceUsefulnessOutcomesFromMetadata(genericFeedback.metadata).length,
          subjectFeedbackIds: subjectFeedback.map((feedback) => feedback.id),
          evalAttempt: evalAttempt[0]?.status,
          canonicalAttempt: canonicalAttempt[0]?.status,
          unselectedSubjectAttempt: unselectedSubjectAttempt[0]?.status,
          genericCaptureIdentity: genericEvidence.metadata.captureIdentity,
          genericEvalExecutionIdentity: genericEvidence.metadata.evalExecutionIdentity,
          rejectedSideEffects
        }).toEqual({
          genericBinding: "unbound",
          genericHelped: false,
          genericKnowledgeOutcomes: 0,
          genericSourceOutcomes: 0,
          subjectFeedbackIds: [],
          evalAttempt: "rejected",
          canonicalAttempt: "rejected",
          unselectedSubjectAttempt: "rejected",
          genericCaptureIdentity: undefined,
          genericEvalExecutionIdentity: undefined,
          rejectedSideEffects: {
            evidenceBundleCount: 0,
            reviewAssessmentCount: 0,
            feedbackDeltaCount: 0,
            outboxEventCount: 0,
            runEventCount: 0
          }
        });
      } finally {
        await scaffold.cleanup();
        await scaffold.client.end();
      }
    }
  );

  postgresIt(
    "rejects an old packet after a concurrent governing capture changes packet authority",
    async () => {
      const marker = `krn_capture_authority_race_${crypto.randomUUID().replaceAll("-", "")}`;
      const scaffold = await createSmokeHarnessScaffold({
        databaseUrl: databaseUrl!,
        migrationsFolder,
        smokeId: marker,
        smokeName: "capture authority race smoke",
        workspacePrefix: "krn-capture-authority-race",
        projectSlug: "capture-authority-race",
        cleanupRows: cleanupActivationSmokeRows,
        countMarkerRows: countActivationSmokeMarkerRows,
        rawIntent: `capture authority race ${marker}`,
        taskContract: {
          title: "Reject an old concurrent capture",
          objective: "Reread packet authority after another governing capture commits.",
          constraints: ["real PostgreSQL", "independent connections", "no sleeps"],
          nonGoals: ["no unrestricted SQL protection"],
          acceptance: ["an old packet claim rejects without side effects"]
        },
        harnessPlan: {
          summary: "Capture authority race smoke",
          nextAction: "Race two canonical captures derived from the same packet.",
          evidenceContract: {
            commands: [{ command: "pnpm typecheck", required: true }],
            diffRisk: "low",
            reviewBurden: "Verify application-before-helped authority.",
            rollbackPath: "Delete marker-scoped smoke rows.",
            metadata: { smokeId: marker }
          }
        }
      });
      const captureBClient = postgres(databaseUrl!, { max: 1, onnotice: () => undefined });
      const blockerClient = postgres(databaseUrl!, { max: 1, onnotice: () => undefined });
      const captureBRepository = new DrizzleHarnessRunRepository(
        createKrnDatabase(captureBClient)
      );
      let blockerTransactionOpen = false;
      let captureB: ReturnType<DrizzleHarnessRunRepository["createEvidenceFeedbackOnce"]> |
        undefined;

      try {
        const selectedKnowledge = await scaffold.memoryRepository.createMemoryRecord({
          projectId: scaffold.project.id,
          key: `capture-authority-race:${marker}`,
          kind: "constraint",
          status: "active",
          summary: "Selected governing knowledge for the capture race.",
          body: "Capture A must make this selected knowledge reviewable.",
          owner: "capture-authority-race-smoke",
          confidence: 95,
          applicationGuidance: "Use while current.",
          invalidationRule: "Invalidate if the capture race falsifies authority.",
          sourceLineage: [{ sourceId: `capture-authority-race:${marker}` }],
          isUserPreference: false,
          metadata: { smokeId: marker }
        });
        const selectedSourceArtifact = await scaffold.sourceRepository.createSourceArtifact({
          projectId: scaffold.project.id,
          kind: "operator_input",
          sourceAuthority: "project-decision",
          uri: `operator://capture-authority-race/${marker}`,
          title: "Capture authority race source",
          contentHash: `capture-authority-race-${marker}`,
          metadata: { smokeId: marker }
        });
        const selectedSourceClaim = await scaffold.sourceRepository.createSourceClaim({
          sourceArtifactId: selectedSourceArtifact.id,
          claim: "Canonical capture input must be snapshotted before persistence awaits.",
          mechanism: "The repository owns packet admission and synchronous input capture.",
          krnImplication: "Post-invocation mutation cannot redirect usefulness authority.",
          doesNotProve: "The race does not prove the source claim is true.",
          sourceAuthority: "project-decision",
          supportType: "implementation-boundary",
          consumer: "capture authority race smoke",
          falsifier: "Persisted usefulness reflects caller mutation after the first await.",
          metadata: { smokeId: marker }
        });
        const selectedKnowledgeId = selectedKnowledge.id;
        const contextAssembly = await scaffold.harnessRunRepository.createContextAssembly({
          harnessPlanId: scaffold.harnessPlan.id,
          inclusions: [{
            subjectType: "memory_record",
            subjectId: selectedKnowledgeId,
            reason: "Selected governing knowledge for the capture race.",
            expectedUse: "Become caveated after governing usefulness feedback.",
            sourceAuthority: "high"
          }, {
            subjectType: "source_claim",
            subjectId: selectedSourceClaim.id,
            reason: "Selected governing source for the input snapshot proof.",
            expectedUse: "Retain the invocation-time usefulness subject.",
            sourceAuthority: "high"
          }],
          exclusions: [],
          metadata: {
            smokeId: marker,
            canonicalRevisionTokens: [{
              subjectType: "memory_record",
              subjectId: selectedKnowledge.id,
              updatedAt: selectedKnowledge.updatedAt,
              status: selectedKnowledge.status,
              currentVersionId: selectedKnowledge.currentVersionId
            }, {
              subjectType: "source_claim",
              subjectId: selectedSourceClaim.id,
              updatedAt: selectedSourceClaim.updatedAt,
              status: selectedSourceClaim.status
            }]
          }
        });
        scaffold.setContextAssemblyId(contextAssembly.id);
        const executionRun = await scaffold.harnessRunRepository.createExecutionRun({
          harnessPlanId: scaffold.harnessPlan.id,
          adapter: "capture-authority-race",
          status: "planned",
          metadata: { smokeId: marker }
        });
        const packetGeneratedAt = "2026-07-14T20:00:00.000Z";
        const packetZeroAggregate = await scaffold.harnessRunRepository
          .getHarnessRunByExecutionRunId(executionRun.id);
        if (packetZeroAggregate === undefined) {
          throw new Error("capture authority race aggregate was not persisted");
        }
        const packetZero = currentDecisionPacketBindingForHarnessRun({
          aggregate: packetZeroAggregate,
          packetGeneratedAt,
          sha256Hex: (value) => crypto.createHash("sha256").update(value).digest("hex")
        });
        const captureAIdentity = `capture-authority-race:${marker}:a`;
        const captureBIdentity = `capture-authority-race:${marker}:b`;
        const captureInput = (
          captureIdentity: string,
          knowledgeUsefulnessOutcomes: CreateEvidenceFeedbackOnceInput[
            "knowledgeUsefulnessOutcomes"
          ]
        ) => ({
          executionRunId: executionRun.id,
          sourceRunLifecycleRevision: executionRun.lifecycleRevision,
          projectId: scaffold.project.id,
          captureIdentity,
          decisionPacketClaim: {
            checksum: packetZero.packetChecksum,
            generatedAt: packetZero.packetGeneratedAt
          },
          ...(knowledgeUsefulnessOutcomes === undefined
            ? {}
            : { knowledgeUsefulnessOutcomes }),
          evidence: {
            status: "captured" as const,
            changedFiles: [],
            commands: [],
            diffRisk: "low" as const,
            reviewBurden: "Verify packet authority serialization.",
            rollbackPath: "Delete marker-scoped smoke rows.",
            event: {
              type: "smoke.capture_authority_race.captured",
              message: "capture attempted against packet zero",
              payload: { smokeId: marker, captureIdentity }
            },
            metadata: { smokeId: marker }
          },
          review: {
            status: "pending" as const,
            reviewer: "capture-authority-race-smoke",
            summary: "The second capture must reread current packet authority.",
            findings: [],
            metadata: { smokeId: marker }
          },
          feedback: {
            status: "candidate" as const,
            memoryCandidates: [],
            sourceDecisions: [],
            evalCandidates: [],
            metadata: { smokeId: marker }
          }
        }) satisfies CreateEvidenceFeedbackOnceInput;
        const captureBInput = captureInput(captureBIdentity, undefined);
        const captureBBackendPid = await postgresBackendPid(captureBClient);
        const blockerBackendPid = await postgresBackendPid(blockerClient);

        await blockerClient.unsafe("begin");
        blockerTransactionOpen = true;
        await blockerClient`
          select pg_advisory_xact_lock(
            hashtextextended(${`${executionRun.id}:${captureBIdentity}`}, 0)
          )
        `;
        captureB = captureBRepository.createEvidenceFeedbackOnce(captureBInput);
        await waitForPostgresBackendBlock(
          blockerClient,
          captureBBackendPid,
          [blockerBackendPid]
        );

        const captureAInput = captureInput(captureAIdentity, [{
            knowledgeId: selectedKnowledgeId,
            outcome: "hurt",
            reason: "Capture A made the selected knowledge reviewable.",
            evidenceRefs: [packetZero.packetEvidenceRef],
            doesNotProve: "This feedback does not prove causal knowledge quality."
          }]);
        const captureA = await scaffold.harnessRunRepository.createEvidenceFeedbackOnce(
          captureAInput
        );
        const packetOneAggregate = await scaffold.harnessRunRepository
          .getHarnessRunByExecutionRunId(executionRun.id);
        if (packetOneAggregate === undefined) {
          throw new Error("capture authority race aggregate disappeared after capture A");
        }
        const packetOne = currentDecisionPacketBindingForHarnessRun({
          aggregate: packetOneAggregate,
          packetGeneratedAt,
          sha256Hex: (value) => crypto.createHash("sha256").update(value).digest("hex")
        });

        expect(captureA.created).toBe(true);
        expect(knowledgeUsefulnessOutcomesFromMetadata(
          captureA.feedbackDelta.metadata
        )).toEqual([expect.objectContaining({
          knowledgeId: selectedKnowledgeId,
          outcome: "hurt"
        })]);
        expect(packetOne.packetChecksum).not.toBe(packetZero.packetChecksum);

        await blockerClient.unsafe("commit");
        blockerTransactionOpen = false;
        const [captureBResult] = await Promise.allSettled([captureB]);
        const captureBRejection = expectRejectedReason(
          captureBResult,
          "capture B unexpectedly persisted an old packet claim"
        );
        expect(captureBRejection).toEqual(expect.objectContaining({
          message: expect.stringContaining(
            "packet checksum is not the current reconstructed packet checksum"
          )
        }));

        const [captureBSideEffects] = await scaffold.client<{
          evidenceBundleCount: number;
          reviewAssessmentCount: number;
          feedbackDeltaCount: number;
          feedbackOutboxCount: number;
          runEventCount: number;
        }[]>`
          select
            (select count(*)::int from evidence_bundles
              where capture_identity = ${captureBIdentity}) as "evidenceBundleCount",
            (select count(*)::int from review_assessments review
              inner join evidence_bundles bundle on bundle.id = review.evidence_bundle_id
              where bundle.capture_identity = ${captureBIdentity}) as "reviewAssessmentCount",
            (select count(*)::int from feedback_deltas feedback
              inner join review_assessments review on review.id = feedback.review_assessment_id
              inner join evidence_bundles bundle on bundle.id = review.evidence_bundle_id
              where bundle.capture_identity = ${captureBIdentity}) as "feedbackDeltaCount",
            (select count(*)::int from outbox_events
              where payload->>'captureIdentity' = ${captureBIdentity}) as "feedbackOutboxCount",
            (select count(*)::int from run_events
              where payload->>'captureIdentity' = ${captureBIdentity}) as "runEventCount"
        `;
        expect(captureBSideEffects).toEqual({
          evidenceBundleCount: 0,
          reviewAssessmentCount: 0,
          feedbackDeltaCount: 0,
          feedbackOutboxCount: 0,
          runEventCount: 0
        });
        const captureARetry = await scaffold.harnessRunRepository
          .createEvidenceFeedbackOnce(captureAInput);
        const [captureAStructuralAdmission] = await scaffold.client<{
          captureChannel: string | null;
          feedbackAdmission: string | null;
        }[]>`
          select
            bundle.capture_channel as "captureChannel",
            feedback.decision_packet_authority_admission as "feedbackAdmission"
          from evidence_bundles bundle
          inner join review_assessments review on review.evidence_bundle_id = bundle.id
          inner join feedback_deltas feedback on feedback.review_assessment_id = review.id
          where bundle.id = ${captureA.evidenceBundle.id}
        `;
        expect(captureARetry).toMatchObject({
          created: false,
          evidenceBundle: { id: captureA.evidenceBundle.id },
          reviewAssessment: { id: captureA.reviewAssessment.id },
          feedbackDelta: { id: captureA.feedbackDelta.id }
        });
        expect(captureAStructuralAdmission).toEqual({
          captureChannel: "evidence_feedback_v1",
          feedbackAdmission: "current_v1"
        });

        const snapshotCaptureIdentity = `capture-authority-race:${marker}:snapshot`;
        const decisionPacketClaim = {
          checksum: packetOne.packetChecksum,
          generatedAt: packetOne.packetGeneratedAt
        };
        const sourceEvidenceRefs = [packetOne.packetEvidenceRef];
        const knowledgeEvidenceRefs = [packetOne.packetEvidenceRef];
        const sourceOutcome = {
          sourceClaimId: selectedSourceClaim.id,
          outcome: "stale" as const,
          reason: "Invocation-time source usefulness must survive caller mutation.",
          evidenceRefs: sourceEvidenceRefs,
          doesNotProve: "The snapshot proof does not prove source quality."
        };
        const knowledgeOutcome = {
          knowledgeId: selectedKnowledge.id,
          outcome: "hurt" as const,
          reason: "Invocation-time knowledge usefulness must survive caller mutation.",
          evidenceRefs: knowledgeEvidenceRefs,
          doesNotProve: "The snapshot proof does not prove knowledge quality."
        };
        const snapshotInput = {
          ...captureInput(snapshotCaptureIdentity, [knowledgeOutcome]),
          decisionPacketClaim,
          sourceUsefulnessOutcomes: [sourceOutcome],
          evidence: {
            ...captureInput(snapshotCaptureIdentity, undefined).evidence,
            event: {
              type: "smoke.capture_authority_race.snapshot",
              message: "capture invocation snapshot persisted",
              payload: { smokeId: marker, captureIdentity: snapshotCaptureIdentity }
            }
          }
        } satisfies CreateEvidenceFeedbackOnceInput;
        let inputMutatedAfterEvidence = false;
        const snapshotRepository = new DrizzleHarnessRunRepository(scaffold.db, {
          faultAfterStage: (stage) => {
            if (stage !== "after_evidence_bundle") {
              return;
            }

            inputMutatedAfterEvidence = true;
            decisionPacketClaim.checksum = "0".repeat(64);
            sourceOutcome.sourceClaimId = crypto.randomUUID();
            knowledgeOutcome.knowledgeId = crypto.randomUUID();
            sourceEvidenceRefs[0] = `packet:${"1".repeat(64)}`;
            knowledgeEvidenceRefs[0] = `packet:${"2".repeat(64)}`;
          }
        });
        const snapshotCapture = await snapshotRepository.createEvidenceFeedbackOnce(
          snapshotInput
        );

        expect(inputMutatedAfterEvidence).toBe(true);
        expect(decisionPacketBindingReadbackFromMetadata(
          snapshotCapture.evidenceBundle.metadata
        )).toMatchObject({
          status: "bound_current",
          checksum: packetOne.packetChecksum,
          evidenceRef: packetOne.packetEvidenceRef,
          generatedAt: packetOne.packetGeneratedAt
        });
        expect(sourceUsefulnessOutcomesFromMetadata(
          snapshotCapture.feedbackDelta.metadata
        )).toEqual([expect.objectContaining({
          sourceClaimId: selectedSourceClaim.id,
          outcome: "stale",
          evidenceRefs: [packetOne.packetEvidenceRef]
        })]);
        expect(knowledgeUsefulnessOutcomesFromMetadata(
          snapshotCapture.feedbackDelta.metadata
        )).toEqual([expect.objectContaining({
          knowledgeId: selectedKnowledge.id,
          outcome: "hurt",
          evidenceRefs: [packetOne.packetEvidenceRef]
        })]);

        const aggregateBeforeUnprovedHelped = await scaffold.harnessRunRepository
          .getHarnessRunByExecutionRunId(executionRun.id);
        if (aggregateBeforeUnprovedHelped === undefined) {
          throw new Error("unproved helped aggregate was not persisted");
        }
        const packetBeforeUnprovedHelped = currentDecisionPacketBindingForHarnessRun({
          aggregate: aggregateBeforeUnprovedHelped,
          packetGeneratedAt: "2026-07-14T20:01:00.000Z",
          sha256Hex: (value) => crypto.createHash("sha256").update(value).digest("hex")
        });
        const unprovedHelped = await scaffold.harnessRunRepository.createEvidenceFeedbackOnce({
          ...captureInput(`capture-authority-race:${marker}:unproved-helped`, [{
            knowledgeId: selectedKnowledge.id,
            applicationId: `missing-application:${marker}`,
            appliedAt: "2026-07-14T20:00:30.000Z",
            outcome: "helped",
            reason: "A caller declaration must not substitute for application and verification.",
            evidenceRefs: [packetBeforeUnprovedHelped.packetEvidenceRef],
            doesNotProve: "Selection and packet membership do not prove use or help."
          }]),
          decisionPacketClaim: {
            checksum: packetBeforeUnprovedHelped.packetChecksum,
            generatedAt: packetBeforeUnprovedHelped.packetGeneratedAt
          },
          sourceUsefulnessOutcomes: [{
            sourceClaimId: selectedSourceClaim.id,
            applicationId: `missing-source-application:${marker}`,
            appliedAt: "2026-07-14T20:00:30.000Z",
            outcome: "helped",
            reason: "Packet membership must not substitute for source application evidence.",
            evidenceRefs: [packetBeforeUnprovedHelped.packetEvidenceRef],
            doesNotProve: "Selection does not prove source use or help."
          }],
          maintenance: {
            reason: "This queue record must not survive an unproved helped outcome."
          }
        });

        expect(knowledgeUsefulnessOutcomesFromMetadata(
          unprovedHelped.feedbackDelta.metadata
        )).toEqual([expect.objectContaining({
          knowledgeId: selectedKnowledge.id,
          outcome: "unknown"
        })]);
        expect(sourceUsefulnessOutcomesFromMetadata(
          unprovedHelped.feedbackDelta.metadata
        )).toEqual([expect.objectContaining({
          sourceClaimId: selectedSourceClaim.id,
          outcome: "unknown"
        })]);
        expect(unprovedHelped.feedbackMaintenanceQueueRecordId).toBeUndefined();

        const aggregateBeforeProvedHelped = await scaffold.harnessRunRepository
          .getHarnessRunByExecutionRunId(executionRun.id);
        if (aggregateBeforeProvedHelped === undefined) {
          throw new Error("proved helped aggregate was not persisted");
        }
        const packetBeforeProvedHelped = currentDecisionPacketBindingForHarnessRun({
          aggregate: aggregateBeforeProvedHelped,
          packetGeneratedAt: "2026-07-14T20:02:00.000Z",
          sha256Hex: (value) => crypto.createHash("sha256").update(value).digest("hex")
        });
        const applicationIdentity = {
          applicationId: `application:${marker}:knowledge`,
          subjectKind: "knowledge" as const,
          subjectId: selectedKnowledge.id,
          projectId: scaffold.project.id,
          executionRunId: executionRun.id,
          taskContractId: scaffold.taskContract.id,
          packetChecksum: packetBeforeProvedHelped.packetChecksum,
          packetGeneratedAt: packetBeforeProvedHelped.packetGeneratedAt,
          sourceRunLifecycleRevision: executionRun.lifecycleRevision
        };
        const application = await scaffold.harnessRunRepository
          .recordUsefulnessApplicationOnce(applicationIdentity);
        const applicationRetry = await scaffold.harnessRunRepository
          .recordUsefulnessApplicationOnce(applicationIdentity);
        expect(application).toMatchObject({
          created: true,
          application: { ...applicationIdentity, appliedAt: expect.any(String) }
        });
        expect(applicationRetry).toMatchObject({
          created: false,
          application: {
            applicationId: applicationIdentity.applicationId,
            appliedAt: application.application.appliedAt
          }
        });

        const preApplicationArtifact = createCommandOutputArtifact({
          command: "pnpm typecheck",
          exitCode: 0,
          startedAt: "2026-07-14T20:02:01.000Z",
          completedAt: "2026-07-14T20:02:05.000Z",
          stdout: new Uint8Array(),
          stderr: new Uint8Array()
        }, (value) => crypto.createHash("sha256").update(value).digest("hex"));
        const preApplicationVerification = await scaffold.harnessRunRepository
          .createEvidenceFeedbackOnce({
            ...captureInput(`capture-authority-race:${marker}:pre-application`, [{
              knowledgeId: selectedKnowledge.id,
              applicationId: applicationIdentity.applicationId,
              appliedAt: application.application.appliedAt,
              outcome: "helped",
              reason: "Strict verification existed, but preceded application.",
              evidenceRefs: [packetBeforeProvedHelped.packetEvidenceRef],
              doesNotProve: "Pre-application verification does not prove help."
            }]),
            decisionPacketClaim: {
              checksum: packetBeforeProvedHelped.packetChecksum,
              generatedAt: packetBeforeProvedHelped.packetGeneratedAt
            },
            evidence: {
              ...captureInput(
                `capture-authority-race:${marker}:pre-application`,
                undefined
              ).evidence,
              commands: [{
                command: "pnpm typecheck",
                status: "passed",
                provenance: "command_runner",
                exitCode: 0,
                capturedAt: "2026-07-14T20:02:05.000Z",
                outputRef: preApplicationArtifact.outputRef,
                doesNotProve: "Typecheck does not prove runtime behavior."
              }],
              commandOutputArtifacts: [preApplicationArtifact]
            },
            maintenance: {
              reason: "This queue record must not survive pre-application verification."
            }
          });
        expect(knowledgeUsefulnessOutcomesFromMetadata(
          preApplicationVerification.feedbackDelta.metadata
        )).toEqual([expect.objectContaining({
          applicationId: applicationIdentity.applicationId,
          knowledgeId: selectedKnowledge.id,
          outcome: "unknown"
        })]);
        expect(preApplicationVerification.feedbackMaintenanceQueueRecordId).toBeUndefined();

        const typecheckArtifact = createCommandOutputArtifact({
          command: "pnpm typecheck",
          exitCode: 0,
          startedAt: new Date(
            Date.parse(application.application.appliedAt) + 1_000
          ).toISOString(),
          completedAt: new Date(
            Date.parse(application.application.appliedAt) + 2_000
          ).toISOString(),
          stdout: new Uint8Array(),
          stderr: new Uint8Array()
        }, (value) => crypto.createHash("sha256").update(value).digest("hex"));

        const provedHelpedInput = {
          ...captureInput(`capture-authority-race:${marker}:proved-helped`, [{
            knowledgeId: selectedKnowledge.id,
            applicationId: applicationIdentity.applicationId,
            appliedAt: application.application.appliedAt,
            outcome: "helped" as const,
            reason: "Persisted application preceded strict verification.",
            evidenceRefs: [packetBeforeProvedHelped.packetEvidenceRef],
            doesNotProve: "The ordered proof does not establish semantic causality."
          }]),
          decisionPacketClaim: {
            checksum: packetBeforeProvedHelped.packetChecksum,
            generatedAt: packetBeforeProvedHelped.packetGeneratedAt
          },
          evidence: {
            ...captureInput(`capture-authority-race:${marker}:proved-helped`, undefined).evidence,
            commands: [{
              command: "pnpm typecheck",
              status: "passed" as const,
              provenance: "command_runner" as const,
              exitCode: 0,
              capturedAt: new Date(
                Date.parse(application.application.appliedAt) + 2_000
              ).toISOString(),
              outputRef: typecheckArtifact.outputRef,
              doesNotProve: "Typecheck does not prove runtime behavior."
            }],
            commandOutputArtifacts: [typecheckArtifact],
            event: {
              type: "smoke.capture_authority_race.proved_helped",
              message: "ordered application and verification persisted",
              payload: { smokeId: marker }
            }
          },
          maintenance: {
            reason: "Review the repository-admitted helped outcome."
          }
        } satisfies CreateEvidenceFeedbackOnceInput;
        const beforeFault = await scaffold.harnessRunRepository
          .getHarnessRunByExecutionRunId(executionRun.id);
        if (beforeFault === undefined) {
          throw new Error("fault proof aggregate was not persisted");
        }
        const faultReason = `application feedback rollback ${marker}`;
        const faultRepository = new DrizzleHarnessRunRepository(scaffold.db, {
          faultAfterStage: (stage) => {
            if (stage === "after_feedback_delta") {
              throw new Error(faultReason);
            }
          }
        });
        await expect(faultRepository.createEvidenceFeedbackOnce({
          ...provedHelpedInput,
          captureIdentity: `capture-authority-race:${marker}:fault`,
          maintenance: { reason: faultReason }
        })).rejects.toThrow(faultReason);
        const afterFault = await scaffold.harnessRunRepository
          .getHarnessRunByExecutionRunId(executionRun.id);
        expect(afterFault).toMatchObject({
          evidenceBundles: { length: beforeFault.evidenceBundles.length },
          reviewAssessments: { length: beforeFault.reviewAssessments.length },
          feedbackDeltas: { length: beforeFault.feedbackDeltas.length }
        });
        const faultMaintenanceRows = await scaffold.db
          .select({ id: maintenanceQueues.id })
          .from(maintenanceQueues)
          .where(sql`${maintenanceQueues.payload}->>'reason' = ${faultReason}`);
        expect(faultMaintenanceRows).toEqual([]);
        expect(await scaffold.harnessRunRepository.recordUsefulnessApplicationOnce(
          applicationIdentity
        )).toMatchObject({
          created: false,
          application: { applicationId: applicationIdentity.applicationId }
        });

        const provedHelped = await scaffold.harnessRunRepository
          .createEvidenceFeedbackOnce(provedHelpedInput);
        expect(knowledgeUsefulnessOutcomesFromMetadata(
          provedHelped.feedbackDelta.metadata
        )).toEqual([expect.objectContaining({
          applicationId: applicationIdentity.applicationId,
          knowledgeId: selectedKnowledge.id,
          outcome: "helped"
        })]);
        expect(provedHelped.feedbackMaintenanceQueueRecordId).toEqual(expect.any(String));
      } finally {
        if (blockerTransactionOpen) {
          await blockerClient.unsafe("rollback");
        }
        await captureB?.catch(() => undefined);
        await scaffold.cleanup();
        await Promise.all([
          scaffold.client.end(),
          captureBClient.end(),
          blockerClient.end()
        ]);
      }
    }
  );

  postgresIt(
    "snapshots eval run and project authority before waiting on its capture lock",
    async () => {
      const marker = `krn_eval_authority_snapshot_${crypto.randomUUID().replaceAll("-", "")}`;
      const scaffold = await createSmokeHarnessScaffold({
        databaseUrl: databaseUrl!,
        migrationsFolder,
        smokeId: marker,
        smokeName: "eval authority snapshot smoke",
        workspacePrefix: "krn-eval-authority-snapshot",
        projectSlug: "eval-authority-snapshot",
        cleanupRows: cleanupActivationSmokeRows,
        countMarkerRows: countActivationSmokeMarkerRows,
        rawIntent: `eval authority snapshot ${marker}`,
        taskContract: {
          title: "Snapshot eval authority",
          objective: "Keep an eval capture bound to the run and project supplied at invocation.",
          constraints: ["real PostgreSQL", "independent connections", "no sleeps"],
          nonGoals: ["no DecisionPacket authority for eval feedback"],
          acceptance: ["post-invocation input mutation cannot redirect persistence"]
        },
        harnessPlan: {
          summary: "Eval authority snapshot smoke",
          nextAction: "Mutate caller input while eval admission waits."
        }
      });
      const evalClient = postgres(databaseUrl!, { max: 1, onnotice: () => undefined });
      const blockerClient = postgres(databaseUrl!, { max: 1, onnotice: () => undefined });
      const evalRepository = new DrizzleHarnessRunRepository(createKrnDatabase(evalClient));
      let blockerTransactionOpen = false;
      let evalCapture: ReturnType<DrizzleHarnessRunRepository[
        "createEvalFeedbackDeltaOnce"
      ]> | undefined;

      try {
        const executionRun = await scaffold.harnessRunRepository.createExecutionRun({
          harnessPlanId: scaffold.harnessPlan.id,
          adapter: "eval-authority-snapshot",
          status: "planned",
          metadata: { smokeId: marker }
        });
        const otherProject = await scaffold.projectRepository.createProject({
          workspaceId: scaffold.workspace.id,
          slug: `${scaffold.projectSlug}-other`,
          displayName: `${scaffold.projectSlug}-other`,
          metadata: { smokeId: marker }
        });
        const otherIntent = await scaffold.harnessRunRepository.createOperatorIntent({
          workspaceId: scaffold.workspace.id,
          projectId: otherProject.id,
          source: "cli",
          rawIntent: `foreign eval target ${marker}`,
          metadata: { smokeId: marker }
        });
        const otherTask = await scaffold.harnessRunRepository.createTaskContract({
          operatorIntentId: otherIntent.id,
          projectId: otherProject.id,
          title: "Foreign eval target",
          objective: "Remain outside the original eval capture.",
          constraints: [],
          nonGoals: [],
          acceptance: ["no redirected eval rows"],
          metadata: { smokeId: marker }
        });
        const otherPlan = await scaffold.harnessRunRepository.createHarnessPlan({
          taskContractId: otherTask.id,
          version: 1,
          status: "running",
          summary: "Foreign eval plan",
          nextAction: "Reject redirected persistence.",
          metadata: { smokeId: marker }
        });
        const otherRun = await scaffold.harnessRunRepository.createExecutionRun({
          harnessPlanId: otherPlan.id,
          adapter: "eval-authority-snapshot-foreign",
          status: "planned",
          metadata: { smokeId: marker }
        });
        const executionIdentity = `eval-authority-snapshot:${marker}`;
        const invocationAggregate = requireTestValue(
          await scaffold.harnessRunRepository.getHarnessRunByExecutionRunId(executionRun.id),
          "eval authority snapshot aggregate was not persisted"
        );
        const invocationPacketBinding = currentDecisionPacketBindingForHarnessRun({
          aggregate: invocationAggregate,
          packetGeneratedAt: new Date(Date.now() - 1_000).toISOString(),
          sha256Hex: (value) => crypto.createHash("sha256").update(value).digest("hex")
        });
        const evalSourceClaimId = `source-claim-${marker}`;
        const evalKnowledgeId = `knowledge-${marker}`;
        const forgedPacketMetadata = {
          decisionPacketAuthorityAdmission: "current_v1",
          decisionPacketBindingState: "bound_current",
          decisionPacketChecksum: invocationPacketBinding.packetChecksum,
          decisionPacketEvidenceRef: invocationPacketBinding.packetEvidenceRef,
          decisionPacketGeneratedAt: invocationPacketBinding.packetGeneratedAt,
          decisionPacketSourceRunLifecycleRevision:
            invocationPacketBinding.sourceRunLifecycleRevision
        };
        const evalInput = {
          executionRunId: executionRun.id,
          sourceRunLifecycleRevision: executionRun.lifecycleRevision,
          projectId: scaffold.project.id,
          executionIdentity,
          evidence: {
            status: "captured" as const,
            changedFiles: [],
            commands: [],
            diffRisk: "low" as const,
            reviewBurden: "Verify synchronous eval authority snapshotting.",
            rollbackPath: "Delete marker-scoped smoke rows.",
            event: {
              type: "smoke.eval_authority_snapshot.captured",
              message: "eval authority snapshot captured",
              payload: { smokeId: marker, evalExecutionIdentity: executionIdentity }
            },
            metadata: { smokeId: marker, ...forgedPacketMetadata }
          },
          review: {
            status: "pending" as const,
            reviewer: "eval-authority-snapshot-smoke",
            summary: "Eval persistence must not move after invocation.",
            findings: [],
            metadata: { smokeId: marker }
          },
          feedback: {
            status: "candidate" as const,
            memoryCandidates: [],
            sourceDecisions: [],
            evalCandidates: [],
            metadata: {
              smokeId: marker,
              ...forgedPacketMetadata,
              sourceUsefulnessOutcomes: [{
                sourceClaimId: evalSourceClaimId,
                outcome: "stale",
                reason: "Same-project eval metadata must not acquire source usefulness authority.",
                evidenceRefs: [invocationPacketBinding.packetEvidenceRef],
                doesNotProve: "Eval persistence does not prove source usefulness."
              }],
              knowledgeUsefulnessOutcomes: [{
                knowledgeId: evalKnowledgeId,
                outcome: "hurt",
                reason: "Same-project eval metadata must not acquire knowledge usefulness authority.",
                evidenceRefs: [invocationPacketBinding.packetEvidenceRef],
                doesNotProve: "Eval persistence does not prove knowledge usefulness."
              }]
            }
          }
        } satisfies CreateEvalFeedbackDeltaOnceInput;
        const evalBackendPid = await postgresBackendPid(evalClient);
        const blockerBackendPid = await postgresBackendPid(blockerClient);

        await blockerClient.unsafe("begin");
        blockerTransactionOpen = true;
        await blockerClient`
          select pg_advisory_xact_lock(
            hashtextextended(${`${executionRun.id}:eval:${executionIdentity}`}, 0)
          )
        `;
        evalCapture = evalRepository.createEvalFeedbackDeltaOnce(evalInput);
        await waitForPostgresBackendBlock(
          blockerClient,
          evalBackendPid,
          [blockerBackendPid]
        );

        evalInput.executionRunId = otherRun.id;
        evalInput.projectId = otherProject.id;
        await blockerClient.unsafe("commit");
        blockerTransactionOpen = false;
        const result = await evalCapture;
        const [captureLocation] = await scaffold.client<{
          captureChannel: string | null;
          evidenceAuthorityAdmission: string | null;
          evidenceBindingState: string | null;
          executionRunId: string;
          feedbackAuthorityAdmission: string | null;
          feedbackBindingState: string | null;
          knowledgeOutcomeCount: number;
          projectId: string | null;
          sourceOutcomeCount: number;
        }[]>`
          select
            bundle.capture_channel as "captureChannel",
            bundle.metadata->>'decisionPacketAuthorityAdmission' as "evidenceAuthorityAdmission",
            bundle.metadata->>'decisionPacketBindingState' as "evidenceBindingState",
            bundle.execution_run_id as "executionRunId",
            feedback.decision_packet_authority_admission as "feedbackAuthorityAdmission",
            feedback.metadata->>'decisionPacketBindingState' as "feedbackBindingState",
            jsonb_array_length(
              coalesce(feedback.metadata->'knowledgeUsefulnessOutcomes', '[]'::jsonb)
            )::int as "knowledgeOutcomeCount",
            feedback.metadata->>'projectId' as "projectId",
            jsonb_array_length(
              coalesce(feedback.metadata->'sourceUsefulnessOutcomes', '[]'::jsonb)
            )::int as "sourceOutcomeCount"
          from evidence_bundles bundle
          inner join review_assessments review on review.evidence_bundle_id = bundle.id
          inner join feedback_deltas feedback on feedback.review_assessment_id = review.id
          where bundle.id = ${result.evidenceBundle.id}
        `;

        expect(result.created).toBe(true);
        expect(captureLocation).toEqual({
          captureChannel: "eval_feedback_v1",
          evidenceAuthorityAdmission: null,
          evidenceBindingState: "unbound",
          executionRunId: executionRun.id,
          feedbackAuthorityAdmission: null,
          feedbackBindingState: "unbound",
          knowledgeOutcomeCount: 0,
          projectId: scaffold.project.id,
          sourceOutcomeCount: 0
        });
        const aggregateReadback = requireTestValue(
          await scaffold.harnessRunRepository.getHarnessRunByExecutionRunId(executionRun.id),
          "eval authority snapshot readback was not persisted"
        );
        const evidenceReadback = requireTestValue(
          aggregateReadback.evidenceBundles.find((bundle) => bundle.id === result.evidenceBundle.id),
          "eval authority evidence readback was not persisted"
        );
        const feedbackReadback = requireTestValue(
          aggregateReadback.feedbackDeltas.find((feedback) => feedback.id === result.feedbackDelta.id),
          "eval authority feedback readback was not persisted"
        );
        const subjectFeedback = await scaffold.harnessRunRepository.listFeedbackDeltasForSubjects({
          projectId: scaffold.project.id,
          subjects: [
            { kind: "source_claim", id: evalSourceClaimId },
            { kind: "knowledge", id: evalKnowledgeId }
          ]
        });

        expect({
          evidenceBinding: decisionPacketBindingReadbackFromMetadata(
            evidenceReadback.metadata
          ).status,
          feedbackBinding: decisionPacketBindingReadbackFromMetadata(
            feedbackReadback.metadata
          ).status,
          knowledgeOutcomes: knowledgeUsefulnessOutcomesFromMetadata(
            feedbackReadback.metadata
          ).length,
          sourceOutcomes: sourceUsefulnessOutcomesFromMetadata(
            feedbackReadback.metadata
          ).length,
          subjectFeedbackIds: subjectFeedback.map((feedback) => feedback.id)
        }).toEqual({
          evidenceBinding: "unbound",
          feedbackBinding: "unbound",
          knowledgeOutcomes: 0,
          sourceOutcomes: 0,
          subjectFeedbackIds: []
        });
        const [redirectedRows] = await scaffold.client<{ count: number }[]>`
          select count(*)::int as count
          from evidence_bundles
          where execution_run_id = ${otherRun.id}
            and capture_identity = ${`eval:${executionIdentity}`}
        `;
        expect(redirectedRows?.count).toBe(0);
      } finally {
        if (blockerTransactionOpen) {
          await blockerClient.unsafe("rollback");
        }
        await evalCapture?.catch(() => undefined);
        await scaffold.cleanup();
        await Promise.all([
          scaffold.client.end(),
          evalClient.end(),
          blockerClient.end()
        ]);
      }
    }
  );

  postgresIt(
    "rejects legacy capture identity collisions without extending their chains",
    async () => {
      const marker = `krn_capture_channel_collision_${crypto.randomUUID().replaceAll("-", "")}`;
      const scaffold = await createSmokeHarnessScaffold({
        databaseUrl: databaseUrl!,
        migrationsFolder,
        smokeId: marker,
        smokeName: "capture channel collision smoke",
        workspacePrefix: "krn-capture-channel-collision",
        projectSlug: "capture-channel-collision",
        cleanupRows: cleanupActivationSmokeRows,
        countMarkerRows: countActivationSmokeMarkerRows,
        rawIntent: `capture channel collision ${marker}`,
        taskContract: {
          title: "Reject legacy capture collisions",
          objective: "Treat pre-channel capture identities as non-authoritative history.",
          constraints: ["real PostgreSQL", "raw legacy fixture"],
          nonGoals: ["no protection from unrestricted SQL"],
          acceptance: ["legacy identity retries reject without extending the chain"]
        },
        harnessPlan: {
          summary: "Capture channel collision smoke",
          nextAction: "Retry raw pre-channel capture identities.",
          evidenceContract: {
            commands: [{ command: "pnpm typecheck", required: true }],
            diffRisk: "low",
            reviewBurden: "Review structural evidence and feedback admission.",
            rollbackPath: "Delete marker-scoped smoke rows."
          }
        }
      });

      try {
        const executionRun = await scaffold.harnessRunRepository.createExecutionRun({
          harnessPlanId: scaffold.harnessPlan.id,
          adapter: "capture-channel-collision",
          status: "planned",
          metadata: { smokeId: marker }
        });
        const aggregate = requireTestValue(
          await scaffold.harnessRunRepository.getHarnessRunByExecutionRunId(executionRun.id),
          "capture channel collision aggregate was not persisted"
        );
        const packetBinding = currentDecisionPacketBindingForHarnessRun({
          aggregate,
          packetGeneratedAt: "2026-07-14T18:00:00.000Z",
          sha256Hex: (value) => crypto.createHash("sha256").update(value).digest("hex")
        });
        const canonicalNullIdentity = `capture-channel-collision:${marker}:canonical-null`;
        const canonicalWrongIdentity = `capture-channel-collision:${marker}:canonical-wrong`;
        const evalNullIdentity = `capture-channel-collision:${marker}:eval-null`;
        const evalWrongIdentity = `capture-channel-collision:${marker}:eval-wrong`;
        const legacyEvalIdentity = `capture-channel-collision:${marker}:eval-metadata-only`;
        const poisonKnowledgeId = crypto.randomUUID();
        const poisonAuthorityMetadata = {
          decisionPacketAuthorityAdmission: "current_v1",
          decisionPacketBindingState: "bound_current",
          decisionPacketChecksum: packetBinding.packetChecksum,
          decisionPacketEvidenceRef: packetBinding.packetEvidenceRef,
          decisionPacketGeneratedAt: packetBinding.packetGeneratedAt,
          decisionPacketSourceRunLifecycleRevision:
            packetBinding.sourceRunLifecycleRevision,
          knowledgeUsefulnessOutcomes: [{
            knowledgeId: poisonKnowledgeId,
            outcome: "hurt",
            reason: "Raw legacy metadata must not acquire usefulness authority.",
            evidenceRefs: [packetBinding.packetEvidenceRef],
            doesNotProve: "Raw SQL does not prove usefulness."
          }]
        };
        const poisonCommands = [{
          kind: "command_runner",
          command: "pnpm typecheck",
          status: "passed",
          provenance: "command_runner",
          exitCode: 0,
          capturedAt: "2026-07-14T18:01:00.000Z",
          doesNotProve: "The fixture command does not prove source or knowledge quality."
        }];
        const rawRows = [
          {
            captureIdentity: canonicalNullIdentity,
            captureChannel: null,
            evalExecutionIdentity: null,
            poisonAuthority: true
          },
          {
            captureIdentity: canonicalWrongIdentity,
            captureChannel: "eval_feedback_v1",
            evalExecutionIdentity: null,
            poisonAuthority: true
          },
          {
            captureIdentity: `eval:${evalNullIdentity}`,
            captureChannel: null,
            evalExecutionIdentity: evalNullIdentity,
            poisonAuthority: false
          },
          {
            captureIdentity: `eval:${evalWrongIdentity}`,
            captureChannel: "evidence_feedback_v1",
            evalExecutionIdentity: evalWrongIdentity,
            poisonAuthority: false
          },
          {
            captureIdentity: null,
            captureChannel: null,
            evalExecutionIdentity: legacyEvalIdentity,
            poisonAuthority: false
          }
        ] as const;
        const rawEvidenceIds = new Map<string, string>();

        await Promise.all(rawRows.map(async (row) => {
          const rowMetadata = row.poisonAuthority
            ? { smokeId: marker, ...poisonAuthorityMetadata }
            : {
                smokeId: marker,
                ...(row.evalExecutionIdentity === null
                  ? {}
                  : { evalExecutionIdentity: row.evalExecutionIdentity })
              };
          const [insertedEvidence] = await scaffold.client<{ id: string }[]>`
            insert into evidence_bundles (
              execution_run_id,
              capture_identity,
              capture_channel,
              status,
              changed_files,
              commands,
              diff_risk,
              review_burden,
              rollback_path,
              metadata
            ) values (
              ${executionRun.id},
              ${row.captureIdentity},
              ${row.captureChannel},
              'captured',
              '[]'::jsonb,
              ${JSON.stringify(row.poisonAuthority ? poisonCommands : [])}::jsonb,
              'low',
              'Raw pre-channel collision fixture.',
              'Delete marker-scoped smoke rows.',
              ${JSON.stringify(rowMetadata)}::jsonb
            )
            returning id
          `;
          const evidence = requireTestValue(
            insertedEvidence,
            "raw legacy evidence fixture was not inserted"
          );
          rawEvidenceIds.set(
            row.captureIdentity ?? `legacy-eval:${row.evalExecutionIdentity}`,
            evidence.id
          );
        }));

        await Promise.all([canonicalNullIdentity, canonicalWrongIdentity].map(
          async (captureIdentity) => {
          const evidenceBundleId = requireTestValue(
            rawEvidenceIds.get(captureIdentity),
            `raw poison evidence fixture missing for ${captureIdentity}`
          );
          const [review] = await scaffold.client<{ id: string }[]>`
            insert into review_assessments (
              evidence_bundle_id,
              status,
              reviewer,
              summary,
              findings,
              metadata
            ) values (
              ${evidenceBundleId},
              'pending',
              'capture-channel-collision-smoke',
              'Raw legacy poison review.',
              '[]'::jsonb,
              ${JSON.stringify({ smokeId: marker })}::jsonb
            )
            returning id
          `;
          const poisonReview = requireTestValue(
            review,
            `raw poison review fixture missing for ${captureIdentity}`
          );
          await scaffold.client`
            insert into feedback_deltas (
              review_assessment_id,
              decision_packet_authority_admission,
              status,
              memory_candidates,
              source_decisions,
              eval_candidates,
              metadata
            ) values (
              ${poisonReview.id},
              'current_v1',
              'candidate',
              '[]'::jsonb,
              '[]'::jsonb,
              '[]'::jsonb,
              ${JSON.stringify({
                smokeId: marker,
                captureIdentity,
                projectId: scaffold.project.id,
                ...poisonAuthorityMetadata
              })}::jsonb
            )
          `;
          }
        ));

        const poisonedAggregate = requireTestValue(
          await scaffold.harnessRunRepository.getHarnessRunByExecutionRunId(executionRun.id),
          "raw poison aggregate was not persisted"
        );
        const poisonedPacketBinding = currentDecisionPacketBindingForHarnessRun({
          aggregate: poisonedAggregate,
          packetGeneratedAt: packetBinding.packetGeneratedAt,
          sha256Hex: (value) => crypto.createHash("sha256").update(value).digest("hex")
        });
        const poisonEvidenceBundles = [canonicalNullIdentity, canonicalWrongIdentity]
          .map((captureIdentity) => rawEvidenceIds.get(captureIdentity))
          .map((evidenceBundleId) => poisonedAggregate.evidenceBundles.find(
            (bundle) => bundle.id === evidenceBundleId
          ));
        const readablePoisonEvidenceBundles = poisonEvidenceBundles.map((bundle) =>
          requireTestValue(bundle, "poison evidence bundle was not readable from the aggregate")
        );
        for (const bundle of readablePoisonEvidenceBundles) {
          expect(evidenceBundleProvesHelped({
            bundle,
            evidenceContract: {
              taskContractId: scaffold.taskContract.id,
              commands: [{ command: "pnpm typecheck", required: true }],
              diffRisk: "low",
              reviewBurden: "Review structural evidence and feedback admission.",
              rollbackPath: "Delete marker-scoped smoke rows."
            },
            packetChecksum: packetBinding.packetChecksum,
            packetGeneratedAt: packetBinding.packetGeneratedAt,
            sourceRunLifecycleRevision: executionRun.lifecycleRevision,
            sha256Hex: (value) =>
              crypto.createHash("sha256").update(value).digest("hex")
          })).toBe(false);
        }
        expect(poisonedPacketBinding.packetChecksum).toBe(packetBinding.packetChecksum);
        expect(poisonedAggregate.feedbackDeltas.flatMap((feedback) =>
          knowledgeUsefulnessOutcomesFromMetadata(feedback.metadata)
        )).toEqual([]);
        await expect(scaffold.harnessRunRepository.listFeedbackDeltasForSubjects({
          projectId: scaffold.project.id,
          subjects: [{ kind: "knowledge", id: poisonKnowledgeId }]
        })).resolves.toEqual([]);

        const canonicalInput = (captureIdentity: string) => ({
          executionRunId: executionRun.id,
          sourceRunLifecycleRevision: executionRun.lifecycleRevision,
          projectId: scaffold.project.id,
          captureIdentity,
          decisionPacketClaim: {
            checksum: packetBinding.packetChecksum,
            generatedAt: packetBinding.packetGeneratedAt
          },
          evidence: {
            status: "captured" as const,
            changedFiles: [],
            commands: [],
            diffRisk: "low" as const,
            reviewBurden: "Reject the legacy canonical identity collision.",
            rollbackPath: "Delete marker-scoped smoke rows.",
            event: {
              type: "smoke.capture_channel_collision.canonical",
              message: "canonical legacy collision retry",
              payload: { smokeId: marker, captureIdentity }
            },
            metadata: { smokeId: marker }
          },
          review: {
            status: "pending" as const,
            reviewer: "capture-channel-collision-smoke",
            summary: "Legacy canonical rows are not repository-owned admission.",
            findings: [],
            metadata: { smokeId: marker }
          },
          feedback: {
            status: "candidate" as const,
            memoryCandidates: [],
            sourceDecisions: [],
            evalCandidates: [],
            metadata: { smokeId: marker }
          }
        }) satisfies CreateEvidenceFeedbackOnceInput;
        const evalInput = (executionIdentity: string) => ({
          executionRunId: executionRun.id,
          sourceRunLifecycleRevision: executionRun.lifecycleRevision,
          projectId: scaffold.project.id,
          executionIdentity,
          evidence: {
            status: "captured" as const,
            changedFiles: [],
            commands: [],
            diffRisk: "low" as const,
            reviewBurden: "Reject the legacy eval identity collision.",
            rollbackPath: "Delete marker-scoped smoke rows.",
            event: {
              type: "smoke.capture_channel_collision.eval",
              message: "eval legacy collision retry",
              payload: { smokeId: marker, evalExecutionIdentity: executionIdentity }
            },
            metadata: { smokeId: marker }
          },
          review: {
            status: "pending" as const,
            reviewer: "capture-channel-collision-smoke",
            summary: "Legacy eval rows are not repository-owned admission.",
            findings: [],
            metadata: { smokeId: marker }
          },
          feedback: {
            status: "candidate" as const,
            memoryCandidates: [],
            sourceDecisions: [],
            evalCandidates: [],
            metadata: { smokeId: marker }
          }
        }) satisfies CreateEvalFeedbackDeltaOnceInput;
        const results = await Promise.allSettled([
          scaffold.harnessRunRepository.createEvidenceFeedbackOnce(
            canonicalInput(canonicalNullIdentity)
          ),
          scaffold.harnessRunRepository.createEvidenceFeedbackOnce(
            canonicalInput(canonicalWrongIdentity)
          ),
          scaffold.harnessRunRepository.createEvalFeedbackDeltaOnce(evalInput(evalNullIdentity)),
          scaffold.harnessRunRepository.createEvalFeedbackDeltaOnce(evalInput(evalWrongIdentity)),
          scaffold.harnessRunRepository.createEvalFeedbackDeltaOnce(evalInput(legacyEvalIdentity))
        ]);

        expect(results.map((result) => result.status)).toEqual([
          "rejected",
          "rejected",
          "rejected",
          "rejected",
          "rejected"
        ]);
        const rejectionMessages = results.map(rejectionMessage);
        expect(rejectionMessages.slice(0, 2)).toEqual([
          expect.stringContaining("not repository-owned evidence feedback"),
          expect.stringContaining("not repository-owned evidence feedback")
        ]);
        expect(rejectionMessages.slice(2, 4)).toEqual([
          expect.stringContaining("reserved capture identity collision"),
          expect.stringContaining("reserved capture identity collision")
        ]);
        expect(rejectionMessages[4]).toContain("legacy eval identity");

        const [sideEffects] = await scaffold.client<{
          evidenceBundleCount: number;
          feedbackDeltaCount: number;
          outboxEventCount: number;
          reviewAssessmentCount: number;
          runEventCount: number;
        }[]>`
          select
            (select count(*)::int from evidence_bundles
              where metadata->>'smokeId' = ${marker}) as "evidenceBundleCount",
            (select count(*)::int from review_assessments review
              inner join evidence_bundles bundle on bundle.id = review.evidence_bundle_id
              where bundle.metadata->>'smokeId' = ${marker}) as "reviewAssessmentCount",
            (select count(*)::int from feedback_deltas feedback
              inner join review_assessments review on review.id = feedback.review_assessment_id
              inner join evidence_bundles bundle on bundle.id = review.evidence_bundle_id
              where bundle.metadata->>'smokeId' = ${marker}) as "feedbackDeltaCount",
            (select count(*)::int from outbox_events event
              where event.payload->>'captureIdentity' in (
                ${canonicalNullIdentity},
                ${canonicalWrongIdentity}
              ) or event.payload->>'evalExecutionIdentity' in (
                ${evalNullIdentity},
                ${evalWrongIdentity},
                ${legacyEvalIdentity}
              )) as "outboxEventCount",
            (select count(*)::int from run_events event
              where event.payload->>'captureIdentity' in (
                ${canonicalNullIdentity},
                ${canonicalWrongIdentity}
              ) or event.payload->>'evalExecutionIdentity' in (
                ${evalNullIdentity},
                ${evalWrongIdentity},
                ${legacyEvalIdentity}
              )) as "runEventCount"
        `;
        expect(sideEffects).toEqual({
          evidenceBundleCount: 5,
          reviewAssessmentCount: 2,
          feedbackDeltaCount: 2,
          outboxEventCount: 0,
          runEventCount: 0
        });
      } finally {
        await scaffold.cleanup();
        await scaffold.client.end();
      }
    }
  );

  postgresIt(
    "keeps canonical and eval retries pinned to repository-owned chain rows",
    async () => {
      const marker = `krn_capture_chain_ownership_${crypto.randomUUID().replaceAll("-", "")}`;
      const scaffold = await createSmokeHarnessScaffold({
        databaseUrl: databaseUrl!,
        migrationsFolder,
        smokeId: marker,
        smokeName: "capture chain ownership smoke",
        workspacePrefix: "krn-capture-chain-ownership",
        projectSlug: "capture-chain-ownership",
        cleanupRows: cleanupActivationSmokeRows,
        countMarkerRows: countActivationSmokeMarkerRows,
        rawIntent: `capture chain ownership ${marker}`,
        taskContract: {
          title: "Pin capture retries to owned rows",
          objective: "Ignore generic review and feedback rows attached to canonical evidence.",
          constraints: ["real PostgreSQL", "public repository methods"],
          nonGoals: ["no unrestricted SQL protection"],
          acceptance: ["current, unbound, and eval retries return their original chain"]
        },
        harnessPlan: {
          summary: "Capture chain ownership smoke",
          nextAction: "Attach generic poison rows before retry."
        }
      });

      try {
        const executionRun = await scaffold.harnessRunRepository.createExecutionRun({
          harnessPlanId: scaffold.harnessPlan.id,
          adapter: "capture-chain-ownership",
          status: "planned",
          metadata: { smokeId: marker }
        });
        const aggregate = await scaffold.harnessRunRepository
          .getHarnessRunByExecutionRunId(executionRun.id);
        if (aggregate === undefined) {
          throw new Error("capture chain ownership aggregate was not persisted");
        }
        const packetBinding = currentDecisionPacketBindingForHarnessRun({
          aggregate,
          packetGeneratedAt: "2026-07-14T18:30:00.000Z",
          sha256Hex: (value) => crypto.createHash("sha256").update(value).digest("hex")
        });
        const canonicalInput = (
          captureIdentity: string,
          admitted: boolean
        ) => ({
          executionRunId: executionRun.id,
          sourceRunLifecycleRevision: executionRun.lifecycleRevision,
          projectId: scaffold.project.id,
          captureIdentity,
          ...(admitted
            ? {
                decisionPacketClaim: {
                  checksum: packetBinding.packetChecksum,
                  generatedAt: packetBinding.packetGeneratedAt
                }
              }
            : {}),
          evidence: {
            status: "captured" as const,
            changedFiles: [],
            commands: [],
            diffRisk: "low" as const,
            reviewBurden: "Return only the repository-owned capture chain.",
            rollbackPath: "Delete marker-scoped smoke rows.",
            event: {
              type: "smoke.capture_chain_ownership.canonical",
              message: "canonical ownership capture",
              payload: { smokeId: marker, captureIdentity }
            },
            metadata: { smokeId: marker, owner: captureIdentity }
          },
          review: {
            status: "pending" as const,
            reviewer: "capture-chain-owner",
            summary: `Owned review ${captureIdentity}`,
            findings: [],
            metadata: { smokeId: marker, owner: captureIdentity }
          },
          feedback: {
            status: "candidate" as const,
            memoryCandidates: [],
            sourceDecisions: [],
            evalCandidates: [],
            metadata: { smokeId: marker, owner: captureIdentity }
          }
        }) satisfies CreateEvidenceFeedbackOnceInput;
        const evalInput = {
          executionRunId: executionRun.id,
          sourceRunLifecycleRevision: executionRun.lifecycleRevision,
          projectId: scaffold.project.id,
          executionIdentity: `capture-chain-ownership:${marker}:eval`,
          evidence: {
            status: "captured" as const,
            changedFiles: [],
            commands: [],
            diffRisk: "low" as const,
            reviewBurden: "Return only the repository-owned eval chain.",
            rollbackPath: "Delete marker-scoped smoke rows.",
            event: {
              type: "smoke.capture_chain_ownership.eval",
              message: "eval ownership capture",
              payload: { smokeId: marker }
            },
            metadata: { smokeId: marker, owner: "eval" }
          },
          review: {
            status: "pending" as const,
            reviewer: "capture-chain-owner",
            summary: "Owned eval review",
            findings: [],
            metadata: { smokeId: marker, owner: "eval" }
          },
          feedback: {
            status: "candidate" as const,
            memoryCandidates: [],
            sourceDecisions: [],
            evalCandidates: [],
            metadata: { smokeId: marker, owner: "eval" }
          }
        } satisfies CreateEvalFeedbackDeltaOnceInput;
        const currentInput = canonicalInput(
          `capture-chain-ownership:${marker}:current`,
          true
        );
        const unboundInput = canonicalInput(
          `capture-chain-ownership:${marker}:unbound`,
          false
        );
        const currentCapture = await scaffold.harnessRunRepository
          .createEvidenceFeedbackOnce(currentInput);
        const unboundCapture = await scaffold.harnessRunRepository
          .createEvidenceFeedbackOnce(unboundInput);
        const evalCapture = await scaffold.harnessRunRepository
          .createEvalFeedbackDeltaOnce(evalInput);
        const ownedCaptures = [currentCapture, unboundCapture, evalCapture];

        for (const [index, capture] of ownedCaptures.entries()) {
          const genericReview = await scaffold.harnessRunRepository.createReviewAssessment({
            evidenceBundleId: capture.evidenceBundle.id,
            status: "rejected",
            reviewer: "generic-poison",
            summary: `Generic poison review ${index}`,
            findings: [],
            metadata: { smokeId: marker, poison: true, index }
          });
          await scaffold.harnessRunRepository.createFeedbackDelta({
            reviewAssessmentId: genericReview.id,
            status: "candidate",
            memoryCandidates: [],
            sourceDecisions: [],
            evalCandidates: [],
            metadata: {
              smokeId: marker,
              poison: true,
              index,
              decisionPacketAuthorityAdmission: "current_v1"
            }
          });
          await scaffold.harnessRunRepository.createFeedbackDelta({
            reviewAssessmentId: capture.reviewAssessment.id,
            status: "candidate",
            memoryCandidates: [],
            sourceDecisions: [],
            evalCandidates: [],
            metadata: {
              smokeId: marker,
              poison: true,
              index,
              captureIdentity: "generic-poison"
            }
          });
        }

        const currentRetry = await scaffold.harnessRunRepository
          .createEvidenceFeedbackOnce(currentInput);
        const unboundRetry = await scaffold.harnessRunRepository
          .createEvidenceFeedbackOnce(unboundInput);
        const evalRetry = await scaffold.harnessRunRepository
          .createEvalFeedbackDeltaOnce(evalInput);
        for (const [retry, original] of [
          [currentRetry, currentCapture],
          [unboundRetry, unboundCapture],
          [evalRetry, evalCapture]
        ] as const) {
          expect(retry).toEqual({ ...original, created: false });
        }
      } finally {
        await scaffold.cleanup();
        await scaffold.client.end();
      }
    }
  );

  postgresIt(
    "snapshots retrieval writer ownership before waiting on the owner row lock",
    async () => {
      const marker = `krn_retrieval_writer_snapshot_${crypto.randomUUID().replaceAll("-", "")}`;
      const scaffold = await createSmokeHarnessScaffold({
        databaseUrl: databaseUrl!,
        migrationsFolder,
        smokeId: marker,
        smokeName: "retrieval writer snapshot smoke",
        workspacePrefix: "krn-retrieval-writer-snapshot",
        projectSlug: "retrieval-writer-snapshot",
        cleanupRows: cleanupActivationSmokeRows,
        countMarkerRows: countActivationSmokeMarkerRows,
        rawIntent: `retrieval writer snapshot ${marker}`,
        taskContract: {
          title: "Snapshot retrieval ownership",
          objective: "Keep candidate and decision writes on the owner row locked at invocation.",
          constraints: ["real PostgreSQL", "independent connections", "no sleeps"],
          nonGoals: ["no retrieval quality claim"],
          acceptance: ["caller mutation cannot redirect a blocked retrieval writer"]
        },
        harnessPlan: {
          summary: "Retrieval writer snapshot smoke",
          nextAction: "Mutate writer input while its owner row is locked."
        }
      });
      const writerClient = postgres(databaseUrl!, { max: 1, onnotice: () => undefined });
      const blockerClient = postgres(databaseUrl!, { max: 1, onnotice: () => undefined });
      const writerRepository = new DrizzleRetrievalRepository(createKrnDatabase(writerClient));
      let blockerTransactionOpen = false;
      let candidateWrite: ReturnType<DrizzleRetrievalRepository["addCandidate"]> | undefined;
      let decisionWrite: ReturnType<
        DrizzleRetrievalRepository["recordActivationDecision"]
      > | undefined;

      try {
        const retrievalRun = await scaffold.retrievalRepository.startRetrievalRun({
          projectId: scaffold.project.id,
          taskContractId: scaffold.taskContract.id,
          query: `owner retrieval ${marker}`,
          mode: "mixed",
          metadata: { smokeId: marker }
        });
        const redirectedRetrievalRun = await scaffold.retrievalRepository.startRetrievalRun({
          projectId: scaffold.project.id,
          taskContractId: scaffold.taskContract.id,
          query: `redirected retrieval ${marker}`,
          mode: "mixed",
          metadata: { smokeId: marker }
        });
        const candidateInput = {
          retrievalRunId: retrievalRun.id,
          kind: "memory" as const,
          status: "included" as const,
          subjectType: "memory_record" as const,
          subjectId: crypto.randomUUID(),
          sourceAuthority: "project-decision" as const,
          score: 90,
          reason: "Candidate belongs to the retrieval run supplied at invocation.",
          metadata: { smokeId: marker }
        };
        const writerBackendPid = await postgresBackendPid(writerClient);
        const blockerBackendPid = await postgresBackendPid(blockerClient);

        await blockerClient.unsafe("begin");
        blockerTransactionOpen = true;
        await blockerClient`
          select id from retrieval_runs where id = ${retrievalRun.id} for update
        `;
        candidateWrite = writerRepository.addCandidate(candidateInput);
        await waitForPostgresBackendBlock(
          blockerClient,
          writerBackendPid,
          [blockerBackendPid]
        );
        candidateInput.retrievalRunId = redirectedRetrievalRun.id;
        await blockerClient.unsafe("commit");
        blockerTransactionOpen = false;
        const candidate = await candidateWrite;

        expect(candidate.retrievalRunId).toBe(retrievalRun.id);
        const decisionInput = {
          retrievalRunId: retrievalRun.id,
          retrievalCandidateId: candidate.id,
          subjectType: "memory_record" as const,
          subjectId: candidate.subjectId,
          decision: "deferred" as const,
          reason: "Decision belongs to the retrieval run supplied at invocation.",
          metadata: { smokeId: marker }
        };

        await blockerClient.unsafe("begin");
        blockerTransactionOpen = true;
        await blockerClient`
          select id from retrieval_runs where id = ${retrievalRun.id} for update
        `;
        decisionWrite = writerRepository.recordActivationDecision(decisionInput);
        await waitForPostgresBackendBlock(
          blockerClient,
          writerBackendPid,
          [blockerBackendPid]
        );
        decisionInput.retrievalRunId = redirectedRetrievalRun.id;
        await blockerClient.unsafe("commit");
        blockerTransactionOpen = false;
        const decision = await decisionWrite;

        expect(decision.retrievalRunId).toBe(retrievalRun.id);
        const [redirectedWrites] = await scaffold.client<{
          candidateCount: number;
          decisionCount: number;
        }[]>`
          select
            (select count(*)::int from retrieval_candidates
              where retrieval_run_id = ${redirectedRetrievalRun.id}
                and id = ${candidate.id}) as "candidateCount",
            (select count(*)::int from activation_decisions
              where retrieval_run_id = ${redirectedRetrievalRun.id}
                and id = ${decision.id}) as "decisionCount"
        `;
        expect(redirectedWrites).toEqual({ candidateCount: 0, decisionCount: 0 });
      } finally {
        if (blockerTransactionOpen) {
          await blockerClient.unsafe("rollback");
        }
        await Promise.allSettled([
          candidateWrite,
          decisionWrite
        ].filter((write): write is Promise<unknown> => write !== undefined));
        await scaffold.cleanup();
        await Promise.all([
          scaffold.client.end(),
          writerClient.end(),
          blockerClient.end()
        ]);
      }
    }
  );

  postgresIt(
    "serializes canonical admission with retrieval writers and omits foreign retrieval traces",
    async () => {
      const marker = `krn_retrieval_authority_race_${crypto.randomUUID().replaceAll("-", "")}`;
      const scaffold = await createSmokeHarnessScaffold({
        databaseUrl: databaseUrl!,
        migrationsFolder,
        smokeId: marker,
        smokeName: "retrieval authority race smoke",
        workspacePrefix: "krn-retrieval-authority-race",
        projectSlug: "retrieval-authority-race",
        cleanupRows: cleanupActivationSmokeRows,
        countMarkerRows: countActivationSmokeMarkerRows,
        rawIntent: `retrieval authority race ${marker}`,
        taskContract: {
          title: "Serialize retrieval packet authority",
          objective: "Reconstruct canonical packets from one owned retrieval state.",
          constraints: ["real PostgreSQL", "independent connections", "no sleeps"],
          nonGoals: ["no retrieval quality claim"],
          acceptance: ["late owned candidates invalidate old packets; foreign traces stay omitted"]
        },
        harnessPlan: {
          summary: "Retrieval authority race smoke",
          nextAction: "Queue a candidate writer before canonical packet admission."
        }
      });
      const writerClient = postgres(databaseUrl!, { max: 1, onnotice: () => undefined });
      const captureClient = postgres(databaseUrl!, { max: 1, onnotice: () => undefined });
      const blockerClient = postgres(databaseUrl!, { max: 1, onnotice: () => undefined });
      const writerRepository = new DrizzleRetrievalRepository(createKrnDatabase(writerClient));
      const captureRepository = new DrizzleHarnessRunRepository(
        createKrnDatabase(captureClient)
      );
      let blockerTransactionOpen = false;
      let candidateWrite: ReturnType<DrizzleRetrievalRepository["addCandidate"]> | undefined;
      let canonicalCapture: ReturnType<DrizzleHarnessRunRepository[
        "createEvidenceFeedbackOnce"
      ]> | undefined;

      try {
        const selectedKnowledge = await scaffold.memoryRepository.createMemoryRecord({
          projectId: scaffold.project.id,
          key: `retrieval-authority-race:${marker}`,
          kind: "constraint",
          status: "active",
          summary: "Owned retrieval state must be packet-consistent.",
          body: "A late pending anti-memory review changes packet caveats.",
          owner: "retrieval-authority-race-smoke",
          confidence: 95,
          applicationGuidance: "Use only under the owned retrieval trace.",
          invalidationRule: "Invalidate if foreign retrieval state enters this packet.",
          sourceLineage: [{ sourceId: `retrieval-authority-race:${marker}` }],
          isUserPreference: false,
          metadata: { smokeId: marker }
        });
        const retrievalRun = await scaffold.retrievalRepository.startRetrievalRun({
          projectId: scaffold.project.id,
          taskContractId: scaffold.taskContract.id,
          query: `owned retrieval ${marker}`,
          mode: "mixed",
          metadata: { smokeId: marker }
        });
        const ownedContext = await scaffold.harnessRunRepository.createContextAssembly({
          harnessPlanId: scaffold.harnessPlan.id,
          inclusions: [{
            subjectType: "memory_record",
            subjectId: selectedKnowledge.id,
            reason: "Selected by the owned retrieval run.",
            expectedUse: "Become caveated after the late candidate.",
            sourceAuthority: "high"
          }],
          exclusions: [],
          metadata: {
            smokeId: marker,
            retrievalRunId: retrievalRun.id,
            canonicalRevisionTokens: [{
              subjectType: "memory_record",
              subjectId: selectedKnowledge.id,
              updatedAt: selectedKnowledge.updatedAt,
              status: selectedKnowledge.status,
              currentVersionId: selectedKnowledge.currentVersionId
            }]
          }
        });
        scaffold.setContextAssemblyId(ownedContext.id);
        const executionRun = await scaffold.harnessRunRepository.createExecutionRun({
          harnessPlanId: scaffold.harnessPlan.id,
          adapter: "retrieval-authority-race",
          status: "planned",
          metadata: { smokeId: marker }
        });
        const packetGeneratedAt = "2026-07-14T21:00:00.000Z";
        const packetZeroAggregate = await scaffold.harnessRunRepository
          .getHarnessRunByExecutionRunId(executionRun.id);
        if (packetZeroAggregate === undefined) {
          throw new Error("retrieval authority race aggregate was not persisted");
        }
        expect(packetZeroAggregate.activationTrace).toMatchObject({
          retrievalRunId: retrievalRun.id,
          candidates: []
        });
        const packetZero = currentDecisionPacketBindingForHarnessRun({
          aggregate: packetZeroAggregate,
          packetGeneratedAt,
          sha256Hex: (value) => crypto.createHash("sha256").update(value).digest("hex")
        });
        const captureIdentity = `retrieval-authority-race:${marker}:capture`;
        const captureInput = {
          executionRunId: executionRun.id,
          sourceRunLifecycleRevision: executionRun.lifecycleRevision,
          projectId: scaffold.project.id,
          captureIdentity,
          decisionPacketClaim: {
            checksum: packetZero.packetChecksum,
            generatedAt: packetZero.packetGeneratedAt
          },
          evidence: {
            status: "captured" as const,
            changedFiles: [],
            commands: [],
            diffRisk: "low" as const,
            reviewBurden: "Verify retrieval writer and packet admission serialization.",
            rollbackPath: "Delete marker-scoped smoke rows.",
            event: {
              type: "smoke.retrieval_authority_race.captured",
              message: "old retrieval packet capture attempted",
              payload: { smokeId: marker, captureIdentity }
            },
            metadata: { smokeId: marker }
          },
          review: {
            status: "pending" as const,
            reviewer: "retrieval-authority-race-smoke",
            summary: "Old retrieval packet admission must reject.",
            findings: [],
            metadata: { smokeId: marker }
          },
          feedback: {
            status: "candidate" as const,
            memoryCandidates: [],
            sourceDecisions: [],
            evalCandidates: [],
            metadata: { smokeId: marker }
          }
        } satisfies CreateEvidenceFeedbackOnceInput;
        const candidateInput = {
          retrievalRunId: retrievalRun.id,
          kind: "memory" as const,
          status: "included" as const,
          subjectType: "memory_record" as const,
          subjectId: selectedKnowledge.id,
          sourceAuthority: "project-decision" as const,
          score: 90,
          reason: "A pending anti-memory review changes the selected knowledge caveat.",
          metadata: {
            smokeId: marker,
            pendingAntiMemoryReview: {
              antiMemoryCandidateIds: [`anti-memory-candidate:${marker}`],
              feedbackDeltaIds: [`feedback-delta:${marker}`],
              subjectRefs: [`memory_record:${selectedKnowledge.id}`],
              doesNotProve: "The pending review does not prove the knowledge is harmful."
            }
          }
        };
        const writerBackendPid = await postgresBackendPid(writerClient);
        const captureBackendPid = await postgresBackendPid(captureClient);
        const blockerBackendPid = await postgresBackendPid(blockerClient);

        await blockerClient.unsafe("begin");
        blockerTransactionOpen = true;
        await blockerClient`
          select id from retrieval_runs where id = ${retrievalRun.id} for update
        `;
        candidateWrite = writerRepository.addCandidate(candidateInput);
        await waitForPostgresBackendBlock(
          blockerClient,
          writerBackendPid,
          [blockerBackendPid]
        );
        canonicalCapture = captureRepository.createEvidenceFeedbackOnce(captureInput);
        await waitForPostgresBackendBlock(
          blockerClient,
          captureBackendPid,
          [blockerBackendPid, writerBackendPid]
        );
        await blockerClient.unsafe("commit");
        blockerTransactionOpen = false;
        const [candidateResult, captureResult] = await Promise.allSettled([
          candidateWrite,
          canonicalCapture
        ]);

        expect(candidateResult.status).toBe("fulfilled");
        const captureRejection = expectRejectedReason(
          captureResult,
          "canonical capture unexpectedly admitted a packet from before the queued candidate"
        );
        expect(captureRejection).toEqual(expect.objectContaining({
          message: expect.stringContaining(
            "packet checksum is not the current reconstructed packet checksum"
          )
        }));
        const packetOneAggregate = await scaffold.harnessRunRepository
          .getHarnessRunByExecutionRunId(executionRun.id);
        if (packetOneAggregate === undefined) {
          throw new Error("retrieval authority aggregate disappeared after the writer committed");
        }
        const packetOne = currentDecisionPacketBindingForHarnessRun({
          aggregate: packetOneAggregate,
          packetGeneratedAt,
          sha256Hex: (value) => crypto.createHash("sha256").update(value).digest("hex")
        });
        expect(packetOne.packetChecksum).not.toBe(packetZero.packetChecksum);
        const [captureSideEffects] = await scaffold.client<{
          evidenceBundleCount: number;
          feedbackDeltaCount: number;
          outboxEventCount: number;
          reviewAssessmentCount: number;
          runEventCount: number;
        }[]>`
          select
            (select count(*)::int from evidence_bundles
              where capture_identity = ${captureIdentity}) as "evidenceBundleCount",
            (select count(*)::int from review_assessments review
              inner join evidence_bundles bundle on bundle.id = review.evidence_bundle_id
              where bundle.capture_identity = ${captureIdentity}) as "reviewAssessmentCount",
            (select count(*)::int from feedback_deltas feedback
              inner join review_assessments review on review.id = feedback.review_assessment_id
              inner join evidence_bundles bundle on bundle.id = review.evidence_bundle_id
              where bundle.capture_identity = ${captureIdentity}) as "feedbackDeltaCount",
            (select count(*)::int from outbox_events
              where payload->>'captureIdentity' = ${captureIdentity}) as "outboxEventCount",
            (select count(*)::int from run_events
              where payload->>'captureIdentity' = ${captureIdentity}) as "runEventCount"
        `;
        expect(captureSideEffects).toEqual({
          evidenceBundleCount: 0,
          reviewAssessmentCount: 0,
          feedbackDeltaCount: 0,
          outboxEventCount: 0,
          runEventCount: 0
        });

        const foreignProject = await scaffold.projectRepository.createProject({
          workspaceId: scaffold.workspace.id,
          slug: `${scaffold.projectSlug}-foreign`,
          displayName: `${scaffold.projectSlug}-foreign`,
          metadata: { smokeId: marker }
        });
        const foreignIntent = await scaffold.harnessRunRepository.createOperatorIntent({
          workspaceId: scaffold.workspace.id,
          projectId: foreignProject.id,
          source: "cli",
          rawIntent: `foreign retrieval authority ${marker}`,
          metadata: { smokeId: marker }
        });
        const foreignTask = await scaffold.harnessRunRepository.createTaskContract({
          operatorIntentId: foreignIntent.id,
          projectId: foreignProject.id,
          title: "Foreign retrieval task",
          objective: "Remain outside the main packet authority.",
          constraints: [],
          nonGoals: [],
          acceptance: ["foreign retrieval trace omitted"],
          metadata: { smokeId: marker }
        });
        const foreignRetrievalRun = await scaffold.retrievalRepository.startRetrievalRun({
          projectId: foreignProject.id,
          taskContractId: foreignTask.id,
          query: `foreign retrieval ${marker}`,
          mode: "mixed",
          metadata: { smokeId: marker }
        });
        await scaffold.retrievalRepository.addCandidate({
          ...candidateInput,
          retrievalRunId: foreignRetrievalRun.id,
          reason: "A foreign candidate must not enter the main packet."
        });
        const foreignContext = await scaffold.harnessRunRepository.createContextAssembly({
          harnessPlanId: scaffold.harnessPlan.id,
          inclusions: [{
            subjectType: "memory_record",
            subjectId: selectedKnowledge.id,
            reason: "Main selection with a foreign retrieval metadata pointer.",
            expectedUse: "Omit the unowned activation trace.",
            sourceAuthority: "high"
          }],
          exclusions: [],
          metadata: {
            smokeId: marker,
            retrievalRunId: foreignRetrievalRun.id,
            canonicalRevisionTokens: [{
              subjectType: "memory_record",
              subjectId: selectedKnowledge.id,
              updatedAt: selectedKnowledge.updatedAt,
              status: selectedKnowledge.status,
              currentVersionId: selectedKnowledge.currentVersionId
            }]
          }
        });
        scaffold.setContextAssemblyId(foreignContext.id);
        const foreignAggregate = await scaffold.harnessRunRepository
          .getHarnessRunByExecutionRunId(executionRun.id);
        if (foreignAggregate === undefined) {
          throw new Error("foreign retrieval authority aggregate was not persisted");
        }
        expect(foreignAggregate.activationTrace).toBeUndefined();
        expect(
          buildDecisionPacketAuthorityProjection(foreignAggregate).context.activationTrace
        ).toBeUndefined();
      } finally {
        if (blockerTransactionOpen) {
          await blockerClient.unsafe("rollback");
        }
        await Promise.allSettled([
          candidateWrite,
          canonicalCapture
        ].filter((operation): operation is Promise<unknown> => operation !== undefined));
        await scaffold.cleanup();
        await Promise.all([
          scaffold.client.end(),
          writerClient.end(),
          captureClient.end(),
          blockerClient.end()
        ]);
      }
    }
  );

  postgresIt(
    "serializes a queued context assembly before canonical packet reconstruction",
    async () => {
      const marker = `krn_context_authority_race_${crypto.randomUUID().replaceAll("-", "")}`;
      const scaffold = await createSmokeHarnessScaffold({
        databaseUrl: databaseUrl!,
        migrationsFolder,
        smokeId: marker,
        smokeName: "context authority race smoke",
        workspacePrefix: "krn-context-authority-race",
        projectSlug: "context-authority-race",
        cleanupRows: cleanupActivationSmokeRows,
        countMarkerRows: countActivationSmokeMarkerRows,
        rawIntent: `context authority race ${marker}`,
        taskContract: {
          title: "Serialize context packet authority",
          objective: "Read a committed context assembly before canonical packet admission.",
          constraints: ["real PostgreSQL", "independent connections", "no sleeps"],
          nonGoals: ["no context quality claim"],
          acceptance: ["a queued context invalidates an older packet without capture side effects"]
        },
        harnessPlan: {
          summary: "Context authority race smoke",
          nextAction: "Queue context persistence before canonical capture."
        }
      });
      const contextClient = postgres(databaseUrl!, { max: 1, onnotice: () => undefined });
      const captureClient = postgres(databaseUrl!, { max: 1, onnotice: () => undefined });
      const blockerClient = postgres(databaseUrl!, { max: 1, onnotice: () => undefined });
      const contextRepository = new DrizzleHarnessRunRepository(
        createKrnDatabase(contextClient)
      );
      const captureRepository = new DrizzleHarnessRunRepository(
        createKrnDatabase(captureClient)
      );
      let blockerTransactionOpen = false;
      let contextWrite: ReturnType<DrizzleHarnessRunRepository[
        "createContextAssembly"
      ]> | undefined;
      let canonicalCapture: ReturnType<DrizzleHarnessRunRepository[
        "createEvidenceFeedbackOnce"
      ]> | undefined;

      try {
        const executionRun = await scaffold.harnessRunRepository.createExecutionRun({
          harnessPlanId: scaffold.harnessPlan.id,
          adapter: "context-authority-race",
          status: "planned",
          metadata: { smokeId: marker }
        });
        const packetGeneratedAt = "2026-07-14T21:30:00.000Z";
        const packetZeroAggregate = await scaffold.harnessRunRepository
          .getHarnessRunByExecutionRunId(executionRun.id);
        if (packetZeroAggregate === undefined) {
          throw new Error("context authority race aggregate was not persisted");
        }
        expect(packetZeroAggregate.contextAssembly).toBeUndefined();
        const packetZero = currentDecisionPacketBindingForHarnessRun({
          aggregate: packetZeroAggregate,
          packetGeneratedAt,
          sha256Hex: (value) => crypto.createHash("sha256").update(value).digest("hex")
        });
        const captureIdentity = `context-authority-race:${marker}:capture`;
        const captureInput = {
          executionRunId: executionRun.id,
          sourceRunLifecycleRevision: executionRun.lifecycleRevision,
          projectId: scaffold.project.id,
          captureIdentity,
          decisionPacketClaim: {
            checksum: packetZero.packetChecksum,
            generatedAt: packetZero.packetGeneratedAt
          },
          evidence: {
            status: "captured" as const,
            changedFiles: [],
            commands: [],
            diffRisk: "low" as const,
            reviewBurden: "Verify context and packet reconstruction serialization.",
            rollbackPath: "Delete marker-scoped smoke rows.",
            event: {
              type: "smoke.context_authority_race.captured",
              message: "old context packet capture attempted",
              payload: { smokeId: marker, captureIdentity }
            },
            metadata: { smokeId: marker }
          },
          review: {
            status: "pending" as const,
            reviewer: "context-authority-race-smoke",
            summary: "Capture must reconstruct after the queued context commits.",
            findings: [],
            metadata: { smokeId: marker }
          },
          feedback: {
            status: "candidate" as const,
            memoryCandidates: [],
            sourceDecisions: [],
            evalCandidates: [],
            metadata: { smokeId: marker }
          }
        } satisfies CreateEvidenceFeedbackOnceInput;
        const contextBackendPid = await postgresBackendPid(contextClient);
        const captureBackendPid = await postgresBackendPid(captureClient);
        const blockerBackendPid = await postgresBackendPid(blockerClient);

        await blockerClient.unsafe("begin");
        blockerTransactionOpen = true;
        await blockerClient`
          select id from execution_runs where id = ${executionRun.id} for update
        `;
        contextWrite = contextRepository.createContextAssembly({
          harnessPlanId: scaffold.harnessPlan.id,
          inclusions: [{
            subjectType: "search_document",
            subjectId: crypto.randomUUID(),
            reason: "Late context selected before canonical reconstruction.",
            expectedUse: "Change the current packet identity.",
            sourceAuthority: "medium"
          }],
          exclusions: [],
          metadata: { smokeId: marker }
        });
        await waitForPostgresBackendBlock(
          blockerClient,
          contextBackendPid,
          [blockerBackendPid]
        );
        canonicalCapture = captureRepository.createEvidenceFeedbackOnce(captureInput);
        await waitForPostgresBackendBlock(
          blockerClient,
          captureBackendPid,
          [blockerBackendPid, contextBackendPid]
        );
        await blockerClient.unsafe("commit");
        blockerTransactionOpen = false;
        const [contextResult, captureResult] = await Promise.allSettled([
          contextWrite,
          canonicalCapture
        ]);

        expect(contextResult.status).toBe("fulfilled");
        if (contextResult.status !== "fulfilled") {
          throw contextResult.reason;
        }
        scaffold.setContextAssemblyId(contextResult.value.id);
        const captureRejection = expectRejectedReason(
          captureResult,
          "canonical capture unexpectedly admitted a packet from before the queued context"
        );
        expect(captureRejection).toEqual(expect.objectContaining({
          message: expect.stringContaining(
            "packet checksum is not the current reconstructed packet checksum"
          )
        }));
        const packetOneAggregate = await scaffold.harnessRunRepository
          .getHarnessRunByExecutionRunId(executionRun.id);
        if (packetOneAggregate === undefined) {
          throw new Error("context authority aggregate disappeared after persistence");
        }
        const packetOne = currentDecisionPacketBindingForHarnessRun({
          aggregate: packetOneAggregate,
          packetGeneratedAt,
          sha256Hex: (value) => crypto.createHash("sha256").update(value).digest("hex")
        });
        expect(packetOneAggregate.contextAssembly?.id).toBe(contextResult.value.id);
        expect(packetOne.packetChecksum).not.toBe(packetZero.packetChecksum);
        const [captureSideEffects] = await scaffold.client<{
          evidenceBundleCount: number;
          feedbackDeltaCount: number;
          outboxEventCount: number;
          reviewAssessmentCount: number;
          runEventCount: number;
        }[]>`
          select
            (select count(*)::int from evidence_bundles
              where capture_identity = ${captureIdentity}) as "evidenceBundleCount",
            (select count(*)::int from review_assessments review
              inner join evidence_bundles bundle on bundle.id = review.evidence_bundle_id
              where bundle.capture_identity = ${captureIdentity}) as "reviewAssessmentCount",
            (select count(*)::int from feedback_deltas feedback
              inner join review_assessments review on review.id = feedback.review_assessment_id
              inner join evidence_bundles bundle on bundle.id = review.evidence_bundle_id
              where bundle.capture_identity = ${captureIdentity}) as "feedbackDeltaCount",
            (select count(*)::int from outbox_events
              where payload->>'captureIdentity' = ${captureIdentity}) as "outboxEventCount",
            (select count(*)::int from run_events
              where payload->>'captureIdentity' = ${captureIdentity}) as "runEventCount"
        `;
        expect(captureSideEffects).toEqual({
          evidenceBundleCount: 0,
          reviewAssessmentCount: 0,
          feedbackDeltaCount: 0,
          outboxEventCount: 0,
          runEventCount: 0
        });
      } finally {
        if (blockerTransactionOpen) {
          await blockerClient.unsafe("rollback");
        }
        await Promise.allSettled([
          contextWrite,
          canonicalCapture
        ].filter((operation): operation is Promise<unknown> => operation !== undefined));
        await scaffold.cleanup();
        await Promise.all([
          scaffold.client.end(),
          contextClient.end(),
          captureClient.end(),
          blockerClient.end()
        ]);
      }
    }
  );

  postgresIt(
    "rejects stale evidence persistence after a concurrent lifecycle transition",
    async () => {
      const marker = `krn_evidence_lifecycle_race_${crypto.randomUUID().replaceAll("-", "")}`;
      const scaffold = await createSmokeHarnessScaffold({
        databaseUrl: databaseUrl!,
        migrationsFolder,
        smokeId: marker,
        smokeName: "evidence lifecycle race smoke",
        workspacePrefix: "krn-evidence-lifecycle-race",
        projectSlug: "evidence-lifecycle-race",
        cleanupRows: cleanupActivationSmokeRows,
        countMarkerRows: countActivationSmokeMarkerRows,
        rawIntent: `evidence lifecycle race ${marker}`,
        taskContract: {
          title: "Reject stale evidence persistence",
          objective: "Bind an authorized evidence write to the exact ExecutionRun revision.",
          constraints: ["real PostgreSQL", "independent connections", "no sleeps"],
          nonGoals: ["no external command execution"],
          acceptance: ["stale revision rejects the entire evidence feedback chain"]
        },
        harnessPlan: {
          summary: "Evidence lifecycle race smoke",
          nextAction: "Race a lifecycle transition against evidence persistence."
        }
      });
      const captureClient = postgres(databaseUrl!, { max: 1, onnotice: () => undefined });
      const blockerClient = postgres(databaseUrl!, { max: 1, onnotice: () => undefined });
      const captureRepository = new DrizzleHarnessRunRepository(
        createKrnDatabase(captureClient)
      );
      let blockerTransactionOpen = false;
      let staleCapture: ReturnType<DrizzleHarnessRunRepository["createEvidenceFeedbackOnce"]> |
        undefined;

      try {
        const planned = await scaffold.harnessRunRepository.createExecutionRun({
          harnessPlanId: scaffold.harnessPlan.id,
          adapter: "evidence-lifecycle-race",
          status: "planned",
          metadata: { smokeId: marker }
        });
        const captureIdentity = `evidence-lifecycle-race:${marker}`;
        const stalePacketGeneratedAt = "2026-07-13T11:00:00.000Z";
        const plannedAggregate = await scaffold.harnessRunRepository
          .getHarnessRunByExecutionRunId(planned.id);
        if (plannedAggregate === undefined) {
          throw new Error("evidence race planned aggregate was not persisted");
        }
        const stalePacketBinding = currentDecisionPacketBindingForHarnessRun({
          aggregate: plannedAggregate,
          packetGeneratedAt: stalePacketGeneratedAt,
          sha256Hex: (value) => crypto.createHash("sha256").update(value).digest("hex")
        });
        const staleInput = {
          executionRunId: planned.id,
          projectId: scaffold.project.id,
          captureIdentity,
          sourceRunLifecycleRevision: planned.lifecycleRevision,
          decisionPacketClaim: {
            checksum: stalePacketBinding.packetChecksum,
            generatedAt: stalePacketBinding.packetGeneratedAt
          },
          evidence: {
            status: "captured" as const,
            changedFiles: ["smoke/evidence-lifecycle-race.ts"],
            commands: [{ command: "pnpm typecheck", status: "passed" as const }],
            diffRisk: "low" as const,
            reviewBurden: "Lifecycle race proof only.",
            rollbackPath: "Delete marker-scoped smoke rows.",
            event: {
              type: "smoke.evidence_lifecycle_race.captured",
              message: "stale evidence must not persist",
              payload: { smokeId: marker, captureIdentity }
            },
            metadata: {
              smokeId: marker
            }
          },
          review: {
            status: "pending" as const,
            reviewer: "krn-race-smoke",
            summary: "Stale evidence persistence must roll back.",
            findings: [],
            metadata: { smokeId: marker }
          },
          feedback: {
            status: "candidate" as const,
            memoryCandidates: [],
            sourceDecisions: [],
            evalCandidates: [],
            metadata: { smokeId: marker }
          }
        } satisfies CreateEvidenceFeedbackOnceInput;
        const captureBackendPid = await postgresBackendPid(captureClient);
        const blockerBackendPid = await postgresBackendPid(blockerClient);

        await blockerClient.unsafe("begin");
        blockerTransactionOpen = true;
        await blockerClient`
          select pg_advisory_xact_lock(
            hashtextextended(${`${planned.id}:${captureIdentity}`}, 0)
          )
        `;
        staleCapture = captureRepository.createEvidenceFeedbackOnce(staleInput);
        await waitForPostgresBackendBlock(
          blockerClient,
          captureBackendPid,
          [blockerBackendPid]
        );

        const runningTransition = await scaffold.harnessRunRepository.updateExecutionRunStatus({
          executionRunId: planned.id,
          expectedStatus: "planned",
          status: "running",
          startedAt: "2026-07-13T11:01:00.000Z"
        });
        if (runningTransition.kind !== "transitioned") {
          throw new Error("evidence race lifecycle transition unexpectedly became a no-op");
        }
        const running = runningTransition.executionRun;

        await blockerClient.unsafe("commit");
        blockerTransactionOpen = false;
        const [captureResult] = await Promise.allSettled([staleCapture]);

        expect(running.lifecycleRevision).toBe(2);
        const captureRejection = expectRejectedReason(
          captureResult,
          "stale evidence capture unexpectedly persisted"
        );
        expect(captureRejection).toBeInstanceOf(ExecutionRunLifecycleConflictError);
        expect(captureRejection).toMatchObject({
          conflict: {
            kind: "revision",
            executionRunId: planned.id,
            expectedLifecycleRevision: 1,
            actualLifecycleRevision: 2
          }
        });

        const [sideEffects] = await scaffold.client<{
          evidenceBundleCount: number;
          reviewAssessmentCount: number;
          feedbackDeltaCount: number;
          feedbackOutboxCount: number;
          runEventCount: number;
        }[]>`
          select
            (select count(*)::int from evidence_bundles where capture_identity = ${captureIdentity}) as "evidenceBundleCount",
            (select count(*)::int from review_assessments review
              inner join evidence_bundles bundle on bundle.id = review.evidence_bundle_id
              where bundle.capture_identity = ${captureIdentity}) as "reviewAssessmentCount",
            (select count(*)::int from feedback_deltas where metadata->>'captureIdentity' = ${captureIdentity}) as "feedbackDeltaCount",
            (select count(*)::int from outbox_events where payload->>'captureIdentity' = ${captureIdentity}) as "feedbackOutboxCount",
            (select count(*)::int from run_events where execution_run_id = ${planned.id}) as "runEventCount"
        `;
        expect(sideEffects).toEqual({
          evidenceBundleCount: 0,
          reviewAssessmentCount: 0,
          feedbackDeltaCount: 0,
          feedbackOutboxCount: 0,
          runEventCount: 2
        });

        const aggregateAfterConflict =
          await scaffold.harnessRunRepository.getHarnessRunByExecutionRunId(planned.id);
        expect(aggregateAfterConflict?.executionRun).toMatchObject({
          status: "running",
          lifecycleRevision: 2,
          startedAt: "2026-07-13T11:01:00.000Z"
        });
        expect(aggregateAfterConflict?.executionRun.completedAt).toBeUndefined();

        const malformedBindingIdentity = `${captureIdentity}:malformed-binding`;
        const malformedBindingInput = {
          ...staleInput,
          sourceRunLifecycleRevision: running.lifecycleRevision,
          captureIdentity: malformedBindingIdentity,
          decisionPacketClaim: {
            checksum: stalePacketBinding.packetChecksum,
            generatedAt: "not-an-iso-timestamp"
          },
          evidence: {
            ...staleInput.evidence,
            event: {
              type: "smoke.evidence_lifecycle_race.malformed_binding",
              message: "incomplete packet binding must not persist",
              payload: { smokeId: marker, captureIdentity: malformedBindingIdentity }
            }
          }
        } satisfies CreateEvidenceFeedbackOnceInput;
        await expect(
          captureRepository.createEvidenceFeedbackOnce(malformedBindingInput)
        ).rejects.toThrow(
          "exact DecisionPacket generatedAt is required"
        );

        const mismatchedBindingIdentity = `${captureIdentity}:mismatched-binding`;
        const mismatchedBindingInput = {
          ...staleInput,
          sourceRunLifecycleRevision: running.lifecycleRevision,
          captureIdentity: mismatchedBindingIdentity,
          evidence: {
            ...staleInput.evidence,
            event: {
              type: "smoke.evidence_lifecycle_race.mismatched_binding",
              message: "stale packet binding must not borrow the current run revision",
              payload: { smokeId: marker, captureIdentity: mismatchedBindingIdentity }
            }
          }
        } satisfies CreateEvidenceFeedbackOnceInput;
        const [mismatchedBindingResult] = await Promise.allSettled([
          captureRepository.createEvidenceFeedbackOnce(mismatchedBindingInput)
        ]);
        if (mismatchedBindingResult === undefined) {
          throw new Error("stale DecisionPacket binding result was not captured");
        }
        const mismatchedBindingRejection = expectRejectedReason(
          mismatchedBindingResult,
          "stale DecisionPacket binding unexpectedly persisted"
        );
        expect(mismatchedBindingRejection).toEqual(expect.objectContaining({
          message: expect.stringContaining("packet checksum is not the current reconstructed packet checksum")
        }));
        const [mismatchedBindingSideEffects] = await scaffold.client<{ count: number }[]>`
          select count(*)::int as count
          from evidence_bundles
          where capture_identity = ${malformedBindingIdentity}
             or capture_identity = ${mismatchedBindingIdentity}
        `;
        expect(mismatchedBindingSideEffects?.count).toBe(0);

        const currentCaptureIdentity = `${captureIdentity}:current`;
        const currentPacketGeneratedAt = "2026-07-13T11:01:00.000Z";
        const runningAggregate = await scaffold.harnessRunRepository
          .getHarnessRunByExecutionRunId(running.id);
        if (runningAggregate === undefined) {
          throw new Error("evidence race running aggregate was not persisted");
        }
        const currentPacketBinding = currentDecisionPacketBindingForHarnessRun({
          aggregate: runningAggregate,
          packetGeneratedAt: currentPacketGeneratedAt,
          sha256Hex: (value) => crypto.createHash("sha256").update(value).digest("hex")
        });
        const currentInput = {
          ...staleInput,
          sourceRunLifecycleRevision: running.lifecycleRevision,
          captureIdentity: currentCaptureIdentity,
          decisionPacketClaim: {
            checksum: currentPacketBinding.packetChecksum,
            generatedAt: currentPacketBinding.packetGeneratedAt
          },
          evidence: {
            ...staleInput.evidence,
            event: {
              type: "smoke.evidence_lifecycle_race.current_captured",
              message: "current evidence may persist",
              payload: { smokeId: marker, captureIdentity: currentCaptureIdentity }
            },
            metadata: {
              ...staleInput.evidence.metadata
            }
          }
        } satisfies CreateEvidenceFeedbackOnceInput;
        const currentCapture = await captureRepository.createEvidenceFeedbackOnce(currentInput);
        expect(currentCapture.created).toBe(true);
        expect(decisionPacketBindingReadbackFromMetadata(
          currentCapture.evidenceBundle.metadata
        )).toMatchObject({
          status: "bound_current",
          checksum: currentPacketBinding.packetChecksum,
          evidenceRef: currentPacketBinding.packetEvidenceRef,
          generatedAt: currentPacketBinding.packetGeneratedAt,
          sourceRunLifecycleRevision: running.lifecycleRevision
        });
        expect(decisionPacketBindingReadbackFromMetadata(
          currentCapture.feedbackDelta.metadata
        )).toMatchObject({
          status: "bound_current",
          checksum: currentPacketBinding.packetChecksum
        });

        const succeededTransition = await scaffold.harnessRunRepository.updateExecutionRunStatus({
          executionRunId: planned.id,
          expectedStatus: "running",
          status: "succeeded",
          completedAt: "2026-07-13T11:02:00.000Z"
        });
        expect(succeededTransition).toMatchObject({
          kind: "transitioned",
          executionRun: { lifecycleRevision: 3 },
          lifecycleEvent: {
            sequence: 4,
            payload: {
              fromStatus: "running",
              toStatus: "succeeded",
              lifecycleRevision: 3
            }
          }
        });

        const historicalRetry = await captureRepository.createEvidenceFeedbackOnce(currentInput);
        expect(historicalRetry).toMatchObject({
          created: false,
          evidenceBundle: { id: currentCapture.evidenceBundle.id },
          reviewAssessment: { id: currentCapture.reviewAssessment.id },
          feedbackDelta: { id: currentCapture.feedbackDelta.id }
        });

        const [historicalRetryCounts] = await scaffold.client<{
          evidenceBundleCount: number;
          reviewAssessmentCount: number;
          feedbackDeltaCount: number;
          feedbackOutboxCount: number;
          runEventCount: number;
        }[]>`
          select
            (select count(*)::int from evidence_bundles where capture_identity = ${currentCaptureIdentity}) as "evidenceBundleCount",
            (select count(*)::int from review_assessments review
              inner join evidence_bundles bundle on bundle.id = review.evidence_bundle_id
              where bundle.capture_identity = ${currentCaptureIdentity}) as "reviewAssessmentCount",
            (select count(*)::int from feedback_deltas where metadata->>'captureIdentity' = ${currentCaptureIdentity}) as "feedbackDeltaCount",
            (select count(*)::int from outbox_events where payload->>'captureIdentity' = ${currentCaptureIdentity}) as "feedbackOutboxCount",
            (select count(*)::int from run_events where execution_run_id = ${planned.id}) as "runEventCount"
        `;
        expect(historicalRetryCounts).toEqual({
          evidenceBundleCount: 1,
          reviewAssessmentCount: 1,
          feedbackDeltaCount: 1,
          feedbackOutboxCount: 1,
          runEventCount: 4
        });
      } finally {
        if (blockerTransactionOpen) {
          await blockerClient.unsafe("rollback");
        }
        await staleCapture?.catch(() => undefined);
        await scaffold.cleanup();
        await Promise.all([
          scaffold.client.end(),
          captureClient.end(),
          blockerClient.end()
        ]);
      }
    }
  );

  postgresIt(
    "rejects a context packet after a concurrent canonical invalidation",
    async () => {
      const marker = `krn_context_race_${crypto.randomUUID().replaceAll("-", "")}`;
      const scaffold = await createSmokeHarnessScaffold({
        databaseUrl: databaseUrl!,
        migrationsFolder,
        smokeId: marker,
        smokeName: "context persistence race smoke",
        workspacePrefix: "krn-context-race",
        projectSlug: "context-persistence-race",
        cleanupRows: cleanupActivationSmokeRows,
        countMarkerRows: countActivationSmokeMarkerRows,
        rawIntent: `context persistence race ${marker}`,
        taskContract: {
          title: "Reject stale context packet",
          objective: "Persist context only when canonical revisions remain current.",
          constraints: ["real PostgreSQL", "two independent connections"],
          nonGoals: ["no retry", "no stale packet persistence"],
          acceptance: ["stale canonical revision is rejected"]
        },
        harnessPlan: {
          summary: "Context persistence race smoke",
          nextAction: "Attempt stale context persistence after invalidation."
        }
      });
      const writer = postgres(databaseUrl!, { max: 1, onnotice: () => undefined });

      try {
        const memoryRecord = await scaffold.memoryRepository.createMemoryRecord({
          projectId: scaffold.project.id,
          key: `context-race:${marker}`,
          kind: "constraint",
          status: "active",
          summary: "Race fixture",
          body: "A canonical record selected before a concurrent invalidation.",
          owner: "context-race-smoke",
          confidence: 95,
          applicationGuidance: "Use only while active.",
          invalidationRule: "Invalidate when the race fixture is consumed.",
          sourceLineage: [{ sourceId: `context-race-source:${marker}` }],
          isUserPreference: false,
          metadata: { smokeId: scaffold.marker }
        });
        await writer.unsafe("begin");
        await writer.unsafe(
          `select id from memory_records where id = '${memoryRecord.id}' for update`
        );
        const stalePersistence = scaffold.harnessRunRepository.createContextAssembly({
          harnessPlanId: scaffold.harnessPlan.id,
          inclusions: [{
            subjectType: "memory_record",
            subjectId: memoryRecord.id,
            reason: "race fixture",
            expectedUse: "reject stale selection",
            sourceAuthority: "high"
          }],
          exclusions: [],
          metadata: {
            smokeId: scaffold.marker,
            canonicalRevisionTokens: [{
              subjectType: "memory_record",
              subjectId: memoryRecord.id,
              updatedAt: memoryRecord.updatedAt,
              status: memoryRecord.status,
              currentVersionId: memoryRecord.currentVersionId
            }]
          }
        });

        await new Promise<void>((resolve) => setImmediate(resolve));
        await writer.unsafe(
          `update memory_records set status = 'invalidated', invalidated_at = now(), invalidation_reason = 'race smoke', updated_at = now() where id = '${memoryRecord.id}'`
        );
        await writer.unsafe("commit");

        await expect(stalePersistence).rejects.toThrow("canonical revision mismatch");
        const afterContext = await scaffold.db
          .select({ id: contextAssemblies.id })
          .from(contextAssemblies)
          .where(sql`${contextAssemblies.metadata}->>'smokeId' = ${scaffold.marker}`);
        const afterEvents = await scaffold.db
          .select({ id: runEvents.id })
          .from(runEvents)
          .where(sql`${runEvents.payload}->>'smokeId' = ${scaffold.marker}`);
        const afterOutbox = await scaffold.db
          .select({ id: outboxEvents.id })
          .from(outboxEvents)
          .where(sql`${outboxEvents.payload}->>'smokeId' = ${scaffold.marker}`);

        expect(afterContext).toHaveLength(0);
        expect(afterEvents).toHaveLength(0);
        expect(afterOutbox).toHaveLength(0);
      } finally {
        await writer.unsafe("rollback").catch(() => undefined);
        await writer.end();
        await scaffold.cleanup();
        await scaffold.client.end();
      }
    }
  );

  it("returns no subject feedback without querying when no candidates are active", async () => {
    const db = {
      select: () => {
        throw new Error("empty subject retrieval must not query the database");
      }
    } as unknown as KrnDatabase;

    await expect(new DrizzleHarnessRunRepository(db).listFeedbackDeltasForSubjects({
      projectId: "project-1",
      subjects: []
    })).resolves.toEqual([]);
  });

  it("normalizes evidence command provenance before persistence", () => {
    expect(evidenceCommandsForPersistence([
      {
        command: "pnpm typecheck",
        status: "passed",
        provenance: "operator_reported",
        exitCode: 0
      },
      {
        command: "pnpm test",
        status: "passed",
        provenance: "operator_reported",
        assertedBy: "operator"
      },
      {
        command: "git diff --check",
        status: "not_run"
      }
    ])).toEqual([
      {
        kind: "operator_reported",
        command: "pnpm typecheck",
        status: "passed",
        provenance: "operator_reported",
        exitCode: 0,
        doesNotProve:
          "This command result does not prove memory quality, source truth, review correctness, or production readiness."
      },
      {
        kind: "operator_reported",
        command: "pnpm test",
        status: "passed",
        provenance: "operator_reported",
        assertedBy: "operator",
        doesNotProve:
          "This command result does not prove memory quality, source truth, review correctness, or production readiness."
      },
      {
        kind: "default_template",
        command: "git diff --check",
        status: "not_run",
        provenance: "default_template",
        doesNotProve:
          "This command row does not prove the command executed; it is default template evidence only."
      }
    ]);
  });

  it("does not persist weak default rows as passed command proof", () => {
    expect(evidenceCommandsForPersistence([
      {
        command: "pnpm test",
        status: "passed",
        provenance: "default_template"
      }
    ])).toEqual([
      {
        kind: "default_template",
        command: "pnpm test",
        status: "not_run",
        provenance: "default_template",
        doesNotProve:
          "This command row does not prove the command executed; it is default template evidence only."
      }
    ]);
  });

  it("rejects reserved lifecycle event types for ordinary evidence", () => {
    for (const type of [
      "execution_run.lifecycle.created",
      "execution_run.lifecycle.transitioned"
    ]) {
      expect(() =>
        validateEvidenceBundleInputForPersistence({
          executionRunId: "execution-run-1",
          status: "captured",
          changedFiles: [],
          commands: [],
          diffRisk: "low",
          reviewBurden: "Reserved lifecycle event type rejection.",
          rollbackPath: "No rows persisted.",
          event: {
            type,
            message: "ordinary evidence must not claim lifecycle authority"
          },
          metadata: {}
        })
      ).toThrow(`ordinary run event cannot use reserved lifecycle type ${type}`);
    }
  });

  it("validates evidence metadata before persistence", () => {
    expect(() =>
      validateEvidenceBundleInputForPersistence({
        executionRunId: "execution-run-1",
        status: "captured",
        changedFiles: ["packages/cli/src/run-evidence-capture-command.ts"],
        commands: [],
        diffRisk: "low",
        reviewBurden: "Review evidence metadata shape.",
        rollbackPath: "git revert <commit>",
        event: {
          type: "evidence.captured",
          message: "Evidence captured"
        },
        metadata: {
          changedFileClassification: {
            intended: "packages/cli/src/run-evidence-capture-command.ts",
            unrelated: [],
            unknown: [],
            unmatchedIntendedFiles: []
          }
        }
      })
    ).toThrow("evidence metadata changedFileClassification must include");

    expect(validateEvidenceBundleInputForPersistence({
      executionRunId: "execution-run-1",
      status: "captured",
      changedFiles: [" packages/cli/src/run-evidence-capture-command.ts "],
      commands: [],
      diffRisk: "low",
      reviewBurden: "Review evidence metadata shape.",
      rollbackPath: "git revert <commit>",
      event: {
        type: "evidence.captured",
        message: "Evidence captured"
      },
      metadata: {
        intendedFiles: [" packages/cli/src/run-evidence-capture-command.ts "],
        changedFileClassification: {
          intended: [" packages/cli/src/run-evidence-capture-command.ts "],
          unrelated: [],
          unknown: [],
          unmatchedIntendedFiles: []
        },
        dirtyContext: {
          hasUnrelatedFiles: false,
          unrelatedFileCount: 0
        }
      }
    })).toMatchObject({
      changedFiles: ["packages/cli/src/run-evidence-capture-command.ts"],
      metadata: {
        intendedFiles: ["packages/cli/src/run-evidence-capture-command.ts"]
      }
    });
  });

  it("returns feedback delta candidates from the mapped persisted row", async () => {
    const rowTimestamp = new Date("2026-07-07T00:00:00.000Z");
    const returnedFeedbackDeltaRow = {
      id: "feedback-delta-1",
      reviewAssessmentId: "review-1",
      status: "candidate" as const,
      memoryCandidates: [],
      sourceDecisions: [],
      evalCandidates: [{
        ...evalCandidate,
        status: "accepted"
      }],
      metadata: {},
      createdAt: rowTimestamp,
      updatedAt: rowTimestamp
    };
    const insertedValues: unknown[] = [];
    const transactionClient = {
      insert: (_table: unknown) => ({
        values: (value: unknown) => {
          insertedValues.push(value);

          if (insertedValues.length === 1) {
            return {
              returning: async () => [returnedFeedbackDeltaRow]
            };
          }

          return Promise.resolve();
        }
      })
    };
    const db = {
      transaction: async <T>(callback: (tx: typeof transactionClient) => Promise<T>) =>
        callback(transactionClient)
    } as unknown as KrnDatabase;

    const repository = new DrizzleHarnessRunRepository(db);
    const result = await repository.createFeedbackDelta({
      reviewAssessmentId: "review-1",
      memoryCandidates: [],
      sourceDecisions: [],
      evalCandidates: [evalCandidate],
      metadata: {}
    });

    expect(result.evalCandidates).toEqual([]);
    expect(insertedValues).toHaveLength(2);
  });
});
