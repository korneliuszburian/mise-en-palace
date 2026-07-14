import { describe, expect, it } from "vitest";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { sql } from "drizzle-orm";
import postgres from "postgres";
import type { EvalCandidateProposal } from "@krn/core";

import { createKrnDatabase, type KrnDatabase } from "../../database.js";
import {
  cleanupActivationSmokeRows,
  countActivationSmokeMarkerRows,
  createSmokeHarnessScaffold
} from "../../dev/smoke/db-smoke-support.js";
import { contextAssemblies, outboxEvents, runEvents } from "../../schema/index.js";
import {
  DrizzleHarnessRunRepository,
  evidenceCommandsForPersistence,
  validateEvidenceBundleInputForPersistence
} from "../drizzle-harness-run-repository.js";

const databaseUrl = process.env.KRN_DATABASE_URL?.trim();
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
      status: "succeeded",
      initialEvent: {
        sequence: 1,
        type: "run.created",
        message: "Run created"
      }
    })).rejects.toThrow("execution run lifecycle");
  });

  it("rejects a terminal execution run without start and completion timestamps", async () => {
    const fake = fakeExecutionRunDatabase(executionRunRow("failed"));

    await expect(new DrizzleHarnessRunRepository(fake.db).createExecutionRun({
      harnessPlanId: "harness-plan-1",
      adapter: "codex",
      status: "failed",
      initialEvent: {
        sequence: 1,
        type: "run.created",
        message: "Run created"
      }
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
      status: "running",
      event: {
        sequence: 2,
        type: "run.restarted",
        message: "Run restarted"
      }
    })).rejects.toThrow("execution run lifecycle");

    await expect(repository.updateExecutionRunStatus({
      executionRunId: "execution-run-1",
      expectedStatus: "succeeded",
      status: "succeeded",
      completedAt: "2026-07-13T09:59:00.000Z",
      event: {
        sequence: 3,
        type: "run.completed",
        message: "Run completed"
      }
    })).rejects.toThrow("execution run lifecycle");
  });

  it("rejects running without a start and completion before the start", async () => {
    const missingStart = fakeExecutionRunDatabase(executionRunRow("running"));

    await expect(new DrizzleHarnessRunRepository(missingStart.db).createExecutionRun({
      harnessPlanId: "harness-plan-1",
      adapter: "codex",
      status: "running",
      initialEvent: {
        sequence: 1,
        type: "run.started",
        message: "Run started"
      }
    })).rejects.toThrow("execution run lifecycle");

    const completionBeforeStart = fakeExecutionRunDatabase(executionRunRow("running", {
      startedAt: new Date("2026-07-13T10:00:00.000Z")
    }));

    await expect(new DrizzleHarnessRunRepository(completionBeforeStart.db).updateExecutionRunStatus({
      executionRunId: "execution-run-1",
      expectedStatus: "running",
      status: "succeeded",
      completedAt: "2026-07-13T09:59:00.000Z",
      event: {
        sequence: 2,
        type: "run.completed",
        message: "Run completed"
      }
    })).rejects.toThrow("execution run lifecycle");
  });

  it("does not append a second event for a same-state retry", async () => {
    const fake = fakeExecutionRunDatabase(executionRunRow("running"));
    const repository = new DrizzleHarnessRunRepository(fake.db);

    await repository.updateExecutionRunStatus({
      executionRunId: "execution-run-1",
      expectedStatus: "running",
      status: "running",
      event: {
        sequence: 2,
        type: "run.started",
        message: "Run started"
      }
    });
    await repository.updateExecutionRunStatus({
      executionRunId: "execution-run-1",
      expectedStatus: "running",
      status: "running",
      event: {
        sequence: 2,
        type: "run.started",
        message: "Run started"
      }
    });

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
    const db = {
      transaction: async (callback: (transaction: unknown) => Promise<unknown>) => callback({
        select: () => ({
          from: () => ({
            where: () => ({
              for: async () => [{
                updatedAt: new Date("2026-06-01T00:00:01.000Z"),
                status: "invalidated",
                currentVersionId: null
              }]
            })
          })
        }),
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

  it.skipIf(databaseUrl === undefined || databaseUrl.length === 0)(
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
          initialEvent: {
            sequence: 1,
            type: "smoke.execution_lifecycle.created",
            message: "created planned",
            payload: { smokeId: marker, status: "planned" }
          },
          metadata: { smokeId: marker, falsifier: "execution-lifecycle" }
        });

        await expect(scaffold.harnessRunRepository.createExecutionRun({
          harnessPlanId: scaffold.harnessPlan.id,
          adapter: "lifecycle-falsifier",
          status: "succeeded",
          initialEvent: {
            sequence: 1,
            type: "smoke.execution_lifecycle.illegal_create",
            message: "terminal create must be rejected",
            payload: { smokeId: marker }
          },
          metadata: { smokeId: marker, falsifier: "execution-lifecycle" }
        })).rejects.toThrow("execution run lifecycle");

        const plannedRun = await createRun();
        const runningRun = await scaffold.harnessRunRepository.updateExecutionRunStatus({
          executionRunId: plannedRun.id,
          expectedStatus: "planned",
          status: "running",
          startedAt: "2026-07-13T10:01:00.000Z",
          event: {
            sequence: 2,
            type: "smoke.execution_lifecycle.started",
            message: "started with startedAt",
            payload: { smokeId: marker }
          }
        });
        const succeededRun = await scaffold.harnessRunRepository.updateExecutionRunStatus({
          executionRunId: runningRun.id,
          expectedStatus: "running",
          status: "succeeded",
          completedAt: "2026-07-13T10:02:00.000Z",
          event: {
            sequence: 3,
            type: "smoke.execution_lifecycle.succeeded",
            message: "completed coherently",
            payload: { smokeId: marker }
          }
        });

        await expect(scaffold.harnessRunRepository.updateExecutionRunStatus({
          executionRunId: succeededRun.id,
          expectedStatus: "succeeded",
          status: "running",
          event: {
            sequence: 4,
            type: "smoke.execution_lifecycle.terminal_reversal",
            message: "terminal reversal must be rejected",
            payload: { smokeId: marker }
          }
        })).rejects.toThrow("execution run lifecycle");

        const sameStateRetry = await scaffold.harnessRunRepository.updateExecutionRunStatus({
          executionRunId: succeededRun.id,
          expectedStatus: "succeeded",
          status: "succeeded",
          event: {
            sequence: 4,
            type: "smoke.execution_lifecycle.same_state_retry",
            message: "terminal retry is idempotent",
            payload: { smokeId: marker }
          }
        });

        expect(runningRun.startedAt).toBe("2026-07-13T10:01:00.000Z");
        expect(succeededRun.completedAt).toBe("2026-07-13T10:02:00.000Z");
        expect(sameStateRetry.status).toBe("succeeded");
        expect(plannedRun.lifecycleRevision).toBe(1);
        expect(runningRun.lifecycleRevision).toBe(2);
        expect(succeededRun.lifecycleRevision).toBe(3);
        expect(sameStateRetry.lifecycleRevision).toBe(3);

        const [{ executionRunCount }] = await scaffold.client<{ executionRunCount: number }[]>`
          select count(*)::int as "executionRunCount"
          from execution_runs
          where metadata->>'smokeId' = ${marker}
        `;
        const [{ eventCount }] = await scaffold.client<{ eventCount: number }[]>`
          select count(*)::int as "eventCount"
          from run_events
          where payload->>'smokeId' = ${marker}
        `;
        expect(executionRunCount).toBe(1);
        expect(eventCount).toBe(3);
      } finally {
        await scaffold.cleanup();
        await scaffold.client.end();
      }
    }
  );

  it.skipIf(databaseUrl === undefined || databaseUrl.length === 0)(
    "keeps a two-connection aggregate read on one PostgreSQL snapshot",
    async () => {
      const marker = `krn_harness_snapshot_${crypto.randomUUID().replaceAll("-", "")}`;
      const reader = postgres(databaseUrl!, { max: 1, onnotice: () => undefined });
      const writer = postgres(databaseUrl!, { max: 1, onnotice: () => undefined });

      try {
        await reader.unsafe(`create table ${marker} (id integer primary key, value text not null)`);
        await reader.unsafe(`insert into ${marker} (id, value) values (1, 'before')`);

        let firstValue: string | undefined;
        let secondValue: string | undefined;

        await reader.unsafe("begin transaction isolation level repeatable read read only");
        try {
          const firstRows = await reader.unsafe<{ value: string }[]>(
            `select value from ${marker} where id = 1`
          );
          firstValue = firstRows[0]?.value;

          await writer.unsafe(`update ${marker} set value = 'after' where id = 1`);

          const secondRows = await reader.unsafe<{ value: string }[]>(
            `select value from ${marker} where id = 1`
          );
          secondValue = secondRows[0]?.value;
          await reader.unsafe("commit");
        } catch (error) {
          await reader.unsafe("rollback");
          throw error;
        }

        expect(firstValue).toBe("before");
        expect(secondValue).toBe("before");
        const writerRows = await writer.unsafe<{ value: string }[]>(
          `select value from ${marker} where id = 1`
        );
        expect(writerRows[0]?.value).toBe("after");
      } finally {
        await reader.unsafe(`drop table if exists ${marker}`);
        await Promise.all([reader.end(), writer.end()]);
      }
    }
  );

  it.skipIf(databaseUrl === undefined || databaseUrl.length === 0)(
    "allows exactly one concurrent execution lifecycle transition",
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

      try {
        const contenderRepository = new DrizzleHarnessRunRepository(
          createKrnDatabase(contenderClient)
        );
        const planned = await scaffold.harnessRunRepository.createExecutionRun({
          harnessPlanId: scaffold.harnessPlan.id,
          adapter: "lifecycle-race",
          status: "planned",
          initialEvent: {
            sequence: 1,
            type: "smoke.execution_lifecycle_race.created",
            message: "race run created",
            payload: { smokeId: marker }
          },
          metadata: { smokeId: marker }
        });
        await scaffold.harnessRunRepository.updateExecutionRunStatus({
          executionRunId: planned.id,
          expectedStatus: "planned",
          status: "running",
          startedAt: "2026-07-13T10:01:00.000Z",
          event: {
            sequence: 2,
            type: "smoke.execution_lifecycle_race.started",
            message: "race run started",
            payload: { smokeId: marker }
          }
        });

        const results = await Promise.allSettled([
          scaffold.harnessRunRepository.updateExecutionRunStatus({
            executionRunId: planned.id,
            expectedStatus: "running",
            status: "succeeded",
            completedAt: "2026-07-13T10:02:00.000Z",
            event: {
              sequence: 3,
              type: "smoke.execution_lifecycle_race.succeeded",
              message: "success contender",
              payload: { smokeId: marker, contender: "success" }
            }
          }),
          contenderRepository.updateExecutionRunStatus({
            executionRunId: planned.id,
            expectedStatus: "running",
            status: "failed",
            completedAt: "2026-07-13T10:02:00.000Z",
            event: {
              sequence: 3,
              type: "smoke.execution_lifecycle_race.failed",
              message: "failure contender",
              payload: { smokeId: marker, contender: "failure" }
            }
          })
        ]);

        expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
        expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);

        const [{ status }] = await scaffold.client<{ status: string }[]>`
          select status from execution_runs where id = ${planned.id}
        `;
        const [{ eventCount }] = await scaffold.client<{ eventCount: number }[]>`
          select count(*)::int as "eventCount"
          from run_events
          where payload->>'smokeId' = ${marker}
        `;
        expect(["succeeded", "failed"]).toContain(status);
        expect(eventCount).toBe(3);
      } finally {
        await scaffold.cleanup();
        await Promise.all([scaffold.client.end(), contenderClient.end()]);
      }
    }
  );

  it.skipIf(databaseUrl === undefined || databaseUrl.length === 0)(
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
          sequence: 1,
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
        sequence: 1,
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
