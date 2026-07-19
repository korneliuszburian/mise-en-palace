import { describe, expect, it } from "vitest";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sql } from "drizzle-orm";
import postgres from "postgres";
import {
  currentDecisionPacketBindingForHarnessRun,
  decisionPacketBindingReadbackFromMetadata,
  ExecutionRunLifecycleConflictError,
} from "@krn/core";
import type { EvalCandidateProposal } from "@krn/core";
import type {
  CreateExecutionRunInput,
  CreateEvidenceFeedbackOnceInput,
  CreateReviewFeedbackOnceInput,
  RecordPairedLiveEvalEvidenceInput
} from "@krn/core/repositories";
import {
  ReviewFeedbackIdentityConflictError
} from "@krn/core/repositories/internal";

import { createKrnDatabase, type KrnDatabase } from "../../database.js";
import {
  cleanupActivationSmokeRows,
  countActivationSmokeMarkerRows,
  createSmokeHarnessScaffold
} from "../../dev/smoke/db-smoke-support.js";
import {
  contextAssemblies,
  outboxEvents,
  runEvents
} from "../../schema/index.js";
import {
  DrizzleHarnessRunRepository,
  evidenceCommandsForPersistence,
  validateEvidenceBundleInputForPersistence
} from "../drizzle-harness-run-repository.js";
import {
  expectRejectedReason,
  postgresBackendPid,
  waitForPostgresBackendBlock
} from "./drizzle-harness-run-postgres-test-support.js";

const databaseUrl = process.env.KRN_DATABASE_URL?.trim();
const postgresIt = it.skipIf(databaseUrl === undefined || databaseUrl.length === 0);
const migrationsFolder = fileURLToPath(new URL("../../migrations", import.meta.url));
const sha256Hex = (value: string): string => crypto.createHash("sha256").update(value).digest("hex");

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

  it("rejects every non-planned direct execution run status shortcut", async () => {
    const fake = fakeExecutionRunDatabase(executionRunRow("succeeded"));
    const directStatusInput = {
      harnessPlanId: "harness-plan-1",
      adapter: "codex",
      status: "succeeded"
    } as unknown as CreateExecutionRunInput;

    await expect(
      new DrizzleHarnessRunRepository(fake.db).createExecutionRun(directStatusInput)
    ).rejects.toThrow(
      "execution run lifecycle creation is planned-only; use the guarded status transition"
    );
  });

  it("rejects a direct execution run start timestamp shortcut", async () => {
    const fake = fakeExecutionRunDatabase(executionRunRow("planned"));
    const directStartInput = {
      harnessPlanId: "harness-plan-1",
      adapter: "codex",
      startedAt: "2026-07-13T10:00:00.000Z"
    } as unknown as CreateExecutionRunInput;

    await expect(
      new DrizzleHarnessRunRepository(fake.db).createExecutionRun(directStartInput)
    ).rejects.toThrow(
      "execution run lifecycle creation is planned-only; use the guarded status transition"
    );
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

  it("rejects completion before the persisted start", async () => {
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

  it("rejects JavaScript-parseable non-ISO lifecycle timestamps", async () => {
    const nonIsoTimestamp = "July 13, 2026 10:00:00 GMT";
    const runningRepository = new DrizzleHarnessRunRepository(
      fakeExecutionRunDatabase(executionRunRow("planned")).db
    );
    const terminalRepository = new DrizzleHarnessRunRepository(
      fakeExecutionRunDatabase(executionRunRow("planned")).db
    );

    await expect(runningRepository.updateExecutionRunStatus({
      executionRunId: "execution-run-1",
      expectedStatus: "planned",
      status: "running",
      startedAt: nonIsoTimestamp
    })).rejects.toThrow(
      "execution run lifecycle startedAt must be a valid ISO timestamp"
    );
    await expect(terminalRepository.updateExecutionRunStatus({
      executionRunId: "execution-run-1",
      expectedStatus: "planned",
      status: "blocked",
      startedAt: "2026-07-13T09:59:00.000Z",
      completedAt: nonIsoTimestamp
    })).rejects.toThrow(
      "execution run lifecycle completedAt must be a valid ISO timestamp"
    );
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
    expect(typeof DrizzleHarnessRunRepository.prototype.recordPairedLiveEvalEvidenceOnce).toBe(
      "function"
    );
    expect(typeof DrizzleHarnessRunRepository.prototype.listPairedLiveEvalEvidence).toBe(
      "function"
    );
  });

  postgresIt(
    "records paired-live eval evidence idempotently and lists exact refs by durable identity",
    async () => {
      const marker = `krn_paired_live_evidence_${crypto.randomUUID().replaceAll("-", "")}`;
      const scaffold = await createSmokeHarnessScaffold({
        databaseUrl: databaseUrl!,
        migrationsFolder,
        smokeId: marker,
        smokeName: "paired-live eval evidence falsifier",
        workspacePrefix: "krn-paired-live-evidence",
        projectSlug: "paired-live-evidence",
        cleanupRows: cleanupActivationSmokeRows,
        countMarkerRows: countActivationSmokeMarkerRows,
        rawIntent: `paired live evidence ${marker}`,
        taskContract: {
          title: "Falsify paired-live eval evidence persistence",
          objective: "Record a durable paired-live evidence row and read it back by project/run filters.",
          constraints: ["real PostgreSQL", "proposal-only EvalCandidate evidence"],
          nonGoals: ["do not promote memory or source truth"],
          acceptance: ["exact packet, artifact, manifest, checker, and environment refs survive readback"]
        },
        harnessPlan: {
          summary: "Paired-live evidence falsifier",
          nextAction: "Record and list durable paired-live eval evidence."
        }
      });
      try {
        const runId = crypto.randomUUID();
        const packetChecksum = sha256Hex(`${marker}:packet`);
        const artifactHash = sha256Hex(`${marker}:artifact`);
        const manifestHash = sha256Hex(`${marker}:manifest`);
        const environmentProfileHash = sha256Hex(`${marker}:environment`);
        const checkerRevision = "paired-live-codex-repair-checker.v3";
        const input: RecordPairedLiveEvalEvidenceInput = {
          projectId: scaffold.project.id,
          runId,
          candidateId: `paired-target-repair:${runId}`,
          candidateStatus: "candidate",
          title: "Paired target repair outcome: win",
          scenario: "temporal-policy-drift",
          family: "temporal-policy-drift",
          expectedSignal: "Only a completed, predeclared KRN win may be classified as helped.",
          artifactStatus: "passed",
          outcome: "win",
          usefulnessOutcome: "helped",
          packetChecksum,
          packetEvidenceRef: `packet:${packetChecksum}`,
          artifactHash,
          artifactRef: `artifact:sha256:${artifactHash}`,
          manifestHash,
          manifestRef: `manifest:sha256:${manifestHash}`,
          checkerRevision,
          checkerEvidenceRef: `checker:${checkerRevision}`,
          environmentProfileHash,
          environmentEvidenceRef: `environment:sha256:${environmentProfileHash}`,
          sourceEvidence: [
            `packet:${packetChecksum}`,
            `artifact:sha256:${artifactHash}`,
            `manifest:sha256:${manifestHash}`,
            `checker:${checkerRevision}`,
            `environment:sha256:${environmentProfileHash}`
          ],
          evidenceRefs: [],
          metadata: {
            smokeId: marker,
            evaluationKind: "paired_live_codex_repair"
          }
        };

        const first = await scaffold.harnessRunRepository.recordPairedLiveEvalEvidenceOnce(input);
        const replay = await scaffold.harnessRunRepository.recordPairedLiveEvalEvidenceOnce(input);
        const listed = await scaffold.harnessRunRepository.listPairedLiveEvalEvidence({
          projectId: scaffold.project.id,
          runId,
          scenario: "temporal-policy-drift",
          outcome: "win",
          usefulnessOutcome: "helped",
          limit: 5
        });
        const misses = await scaffold.harnessRunRepository.listPairedLiveEvalEvidence({
          projectId: scaffold.project.id,
          runId: crypto.randomUUID()
        });

        expect(first.created).toBe(true);
        expect(replay.created).toBe(false);
        expect(replay.evidence).toEqual(first.evidence);
        expect(listed).toHaveLength(1);
        expect(listed[0]).toEqual(expect.objectContaining({
          projectId: scaffold.project.id,
          runId,
          candidateId: `paired-target-repair:${runId}`,
          packetEvidenceRef: `packet:${packetChecksum}`,
          artifactRef: `artifact:sha256:${artifactHash}`,
          manifestRef: `manifest:sha256:${manifestHash}`,
          checkerEvidenceRef: `checker:${checkerRevision}`,
          environmentEvidenceRef: `environment:sha256:${environmentProfileHash}`,
          usefulnessOutcome: "helped"
        }));
        expect(misses).toEqual([]);
      } finally {
        await scaffold.client`
          delete from paired_live_eval_evidence
          where metadata->>'smokeId' = ${marker}
        `;
        await scaffold.cleanup();
        await scaffold.client.end();
      }
    }
  );

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
          metadata: { smokeId: marker, falsifier: "execution-lifecycle" }
        });

        const directRunningInput = {
          harnessPlanId: scaffold.harnessPlan.id,
          adapter: "lifecycle-falsifier",
          status: "running",
          startedAt: "2026-07-13T10:01:00.000Z",
          metadata: { smokeId: marker, falsifier: "execution-lifecycle" }
        } as unknown as CreateExecutionRunInput;
        await expect(
          scaffold.harnessRunRepository.createExecutionRun(directRunningInput)
        ).rejects.toThrow(
          "execution run lifecycle creation is planned-only; use the guarded status transition"
        );

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
    "issues one immutable DecisionPacket artifact and rejects corrupt readback",
    async () => {
      const marker = `krn_packet_issuance_${crypto.randomUUID().replaceAll("-", "")}`;
      const scaffold = await createSmokeHarnessScaffold({
        databaseUrl: databaseUrl!,
        migrationsFolder,
        smokeId: marker,
        smokeName: "DecisionPacket issuance authority",
        workspacePrefix: "krn-packet-issuance",
        projectSlug: "packet-issuance",
        cleanupRows: cleanupActivationSmokeRows,
        countMarkerRows: countActivationSmokeMarkerRows,
        rawIntent: `issue immutable packet ${marker}`,
        taskContract: {
          title: "Issue one DecisionPacket",
          objective: "Persist the exact packet consumed by later read-only surfaces.",
          constraints: ["real PostgreSQL"],
          nonGoals: ["do not reconstruct a packet during readback"],
          acceptance: ["retry returns the original issuance after lifecycle change"]
        },
        harnessPlan: {
          summary: "DecisionPacket issuance falsifier",
          nextAction: "Persist and read the issued packet."
        },
        contextAssembly: {
          status: "assembled",
          tokenBudget: 0
        }
      });

      try {
        const run = await scaffold.harnessRunRepository.createExecutionRun({
          harnessPlanId: scaffold.harnessPlan.id,
          adapter: "packet-issuance-falsifier",
          status: "planned",
          metadata: { smokeId: marker }
        });
        const first = await scaffold.harnessRunRepository
          .issueDecisionPacketForExecutionRun(run.id);
        const transition = await scaffold.harnessRunRepository.updateExecutionRunStatus({
          executionRunId: run.id,
          expectedStatus: "planned",
          status: "running",
          startedAt: "2026-07-15T08:00:00.000Z"
        });
        expect(transition.kind).toBe("transitioned");

        const retry = await scaffold.harnessRunRepository
          .issueDecisionPacketForExecutionRun(run.id);
        const readback = await scaffold.harnessRunRepository
          .getIssuedDecisionPacketForExecutionRun(run.id);

        expect(retry).toEqual(first);
        expect(readback).toEqual(first);
        expect(first.packetIdentity).toMatchObject({
          sourceRunStatus: "planned",
          sourceRunLifecycleRevision: 1,
          generatedAt: run.updatedAt
        });

        await expect(scaffold.client`
          insert into usefulness_applications (
            application_id,
            subject_kind,
            subject_id,
            project_id,
            execution_run_id,
            task_contract_id,
            packet_checksum,
            packet_generated_at,
            source_run_lifecycle_revision
          ) values (
            ${`application:${marker}:unissued`},
            'knowledge',
            'unissued-knowledge',
            ${scaffold.project.id},
            ${run.id},
            ${scaffold.taskContract.id},
            ${"f".repeat(64)},
            ${run.updatedAt},
            1
          )
        `).rejects.toThrow("usefulness_applications_decision_packet_issuance_fk");

        await scaffold.client`
          update decision_packet_issuances
          set readback = jsonb_set(
            readback,
            '{packetIdentity,generatedAt}',
            to_jsonb(${"2099-01-01T00:00:00.000Z"}::text)
          )
          where execution_run_id = ${run.id}
        `;
        await expect(
          scaffold.harnessRunRepository.getIssuedDecisionPacketForExecutionRun(run.id)
        ).rejects.toThrow(`DecisionPacket issuance is corrupt for execution run ${run.id}`);
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
    "persists operator review feedback atomically and exactly once",
    async () => {
      const marker = `krn_review_feedback_once_${crypto.randomUUID().replaceAll("-", "")}`;
      const scaffold = await createSmokeHarnessScaffold({
        databaseUrl: databaseUrl!,
        migrationsFolder,
        smokeId: marker,
        smokeName: "operator review feedback atomicity",
        workspacePrefix: "krn-review-feedback-once",
        projectSlug: "review-feedback-once",
        cleanupRows: cleanupActivationSmokeRows,
        countMarkerRows: countActivationSmokeMarkerRows,
        rawIntent: `operator review feedback ${marker}`,
        taskContract: {
          title: "Persist one operator review chain",
          objective: "Falsify partial and duplicate operator review persistence.",
          constraints: ["real PostgreSQL", "two connections"],
          nonGoals: ["judge reviewer correctness"],
          acceptance: ["one assessment, one feedback delta, one outbox event"]
        },
        harnessPlan: {
          summary: "Operator review feedback atomicity",
          nextAction: "Persist the review and feedback in one transaction."
        }
      });
      const retryClient = postgres(databaseUrl!, { max: 1 });
      const retryRepository = new DrizzleHarnessRunRepository(createKrnDatabase(retryClient));

      try {
        const plannedExecutionRun = await scaffold.harnessRunRepository.createExecutionRun({
          harnessPlanId: scaffold.harnessPlan.id,
          adapter: "review-feedback-once",
          metadata: { smokeId: marker }
        });
        const runningTransition = await scaffold.harnessRunRepository.updateExecutionRunStatus({
          executionRunId: plannedExecutionRun.id,
          expectedStatus: "planned",
          status: "running",
          startedAt: "2026-07-15T06:00:00.000Z"
        });
        if (runningTransition.kind !== "transitioned") {
          throw new Error("review feedback run did not transition from planned to running");
        }
        const executionRun = runningTransition.executionRun;
        const evidenceBundle = await scaffold.harnessRunRepository.createEvidenceBundle({
          executionRunId: executionRun.id,
          changedFiles: ["packages/cli/src/run-review-assess-command.ts"],
          commands: [{ command: "pnpm test", status: "passed" }],
          diffRisk: "medium",
          reviewBurden: "medium",
          rollbackPath: "Revert the operator review persistence change.",
          event: {
            type: "review.feedback.once",
            message: "operator review evidence captured",
            payload: { smokeId: marker }
          },
          metadata: { smokeId: marker }
        });
        const requestIdentity = `review:${evidenceBundle.id}`;
        const input = {
          evidenceBundleId: evidenceBundle.id,
          requestIdentity,
          review: {
            status: "changes_requested" as const,
            reviewer: "operator",
            summary: "The rollback path needs one concrete command.",
            findings: [{
              severity: "medium" as const,
              message: "Rollback command is missing."
            }],
            metadata: { smokeId: marker, outcome: "changes_requested" }
          },
          feedback: {
            status: "candidate" as const,
            memoryCandidates: [],
            sourceDecisions: [],
            evalCandidates: [],
            metadata: { smokeId: marker, memoryRecordMutation: "none" }
          },
          metadata: { smokeId: marker }
        } satisfies CreateReviewFeedbackOnceInput;

        for (const faultStage of [
          "after_review_feedback_assessment",
          "after_review_feedback_delta",
          "after_review_feedback_outbox"
        ] as const) {
          const faultRepository = new DrizzleHarnessRunRepository(scaffold.db, {
            faultAfterStage: (stage) => {
              if (stage === faultStage) {
                throw new Error(`fault:${faultStage}`);
              }
            }
          });

          await expect(faultRepository.createReviewFeedbackOnce(input))
            .rejects.toThrow(`fault:${faultStage}`);

          const [rolledBack] = await scaffold.client<{
            feedbackDeltaCount: number;
            outboxEventCount: number;
            reviewAssessmentCount: number;
          }[]>`
            select
              (select count(*)::int from review_assessments
                where evidence_bundle_id = ${evidenceBundle.id}
                  and capture_channel = 'review_assess_v1') as "reviewAssessmentCount",
              (select count(*)::int from feedback_deltas feedback
                inner join review_assessments review on review.id = feedback.review_assessment_id
                where review.evidence_bundle_id = ${evidenceBundle.id}
                  and feedback.capture_channel = 'review_assess_v1') as "feedbackDeltaCount",
              (select count(*)::int from outbox_events
                where payload->>'reviewRequestIdentity' = ${requestIdentity}) as "outboxEventCount"
          `;
          expect(rolledBack).toEqual({
            reviewAssessmentCount: 0,
            feedbackDeltaCount: 0,
            outboxEventCount: 0
          });
        }

        const concurrentResults = await Promise.all([
          scaffold.harnessRunRepository.createReviewFeedbackOnce(input),
          retryRepository.createReviewFeedbackOnce(input)
        ]);
        expect(concurrentResults.map((result) => result.created).sort()).toEqual([false, true]);
        expect(new Set(concurrentResults.map((result) => result.reviewAssessment.id)).size).toBe(1);
        expect(new Set(concurrentResults.map((result) => result.feedbackDelta.id)).size).toBe(1);

        const exactRetry = await scaffold.harnessRunRepository.createReviewFeedbackOnce(input);
        expect(exactRetry).toEqual({ ...concurrentResults[0], created: false });

        await expect(scaffold.harnessRunRepository.createReviewFeedbackOnce({
          ...input,
          review: {
            ...input.review,
            summary: "Changed retry payload must conflict."
          }
        })).rejects.toBeInstanceOf(ReviewFeedbackIdentityConflictError);

        const [counts] = await scaffold.client<{
          feedbackDeltaCount: number;
          outboxEventCount: number;
          reviewAssessmentCount: number;
        }[]>`
          select
            (select count(*)::int from review_assessments
              where evidence_bundle_id = ${evidenceBundle.id}
                and capture_channel = 'review_assess_v1') as "reviewAssessmentCount",
            (select count(*)::int from feedback_deltas feedback
              inner join review_assessments review on review.id = feedback.review_assessment_id
              where review.evidence_bundle_id = ${evidenceBundle.id}
                and feedback.capture_channel = 'review_assess_v1') as "feedbackDeltaCount",
            (select count(*)::int from outbox_events
              where payload->>'reviewRequestIdentity' = ${requestIdentity}) as "outboxEventCount"
        `;
        expect(counts).toEqual({
          reviewAssessmentCount: 1,
          feedbackDeltaCount: 1,
          outboxEventCount: 1
        });

        const legacyEvidenceBundle = await scaffold.harnessRunRepository.createEvidenceBundle({
          executionRunId: executionRun.id,
          changedFiles: [],
          commands: [],
          diffRisk: "low",
          reviewBurden: "low",
          rollbackPath: "Delete the legacy fixture.",
          event: {
            type: "review.feedback.legacy",
            message: "legacy partial review captured",
            payload: { smokeId: marker }
          },
          metadata: { smokeId: marker }
        });
        const legacyReview = await scaffold.harnessRunRepository.createReviewAssessment({
          evidenceBundleId: legacyEvidenceBundle.id,
          reviewer: "legacy-operator",
          summary: "Legacy partial review.",
          findings: [],
          metadata: { smokeId: marker }
        });
        await expect(scaffold.harnessRunRepository.createReviewFeedbackOnce({
          ...input,
          evidenceBundleId: legacyEvidenceBundle.id,
          requestIdentity: `review:${legacyEvidenceBundle.id}`
        })).rejects.toThrow(
          `Review feedback persistence is blocked by legacy assessment ${legacyReview.id}: feedback delta missing`
        );
      } finally {
        await scaffold.cleanup();
        await Promise.all([scaffold.client.end(), retryClient.end()]);
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

  postgresIt(
    "keeps paired-live eval evidence readable after disposable harness rows are cleaned",
    async () => {
      const marker = `krn_paired_live_eval_${crypto.randomUUID().replaceAll("-", "")}`;
      const scaffold = await createSmokeHarnessScaffold({
        databaseUrl: databaseUrl!,
        migrationsFolder,
        smokeId: marker,
        smokeName: "paired-live eval evidence durability",
        workspacePrefix: "krn-paired-live-eval",
        projectSlug: "paired-live-eval",
        cleanupRows: cleanupActivationSmokeRows,
        countMarkerRows: countActivationSmokeMarkerRows,
        rawIntent: `paired-live eval evidence ${marker}`,
        taskContract: {
          title: "Persist paired-live eval evidence",
          objective: "Keep eval evidence after retained fixture cleanup.",
          constraints: ["real PostgreSQL"],
          nonGoals: ["do not promote memory or source truth"],
          acceptance: ["durable paired-live eval readback survives disposable run cleanup"]
        },
        harnessPlan: {
          summary: "Paired-live eval evidence durability falsifier",
          nextAction: "Persist and read one paired-live eval evidence row."
        }
      });
      try {
        const run = await scaffold.harnessRunRepository.createExecutionRun({
          harnessPlanId: scaffold.harnessPlan.id,
          adapter: "paired-live-eval-durability",
          metadata: { smokeId: marker }
        });
        const artifactHash = sha256Hex(`${marker}:artifact`);
        const manifestHash = sha256Hex(`${marker}:manifest`);
        const packetChecksum = sha256Hex(`${marker}:packet`);
        const environmentProfileHash = sha256Hex(`${marker}:environment`);
        const requiredEvidenceRefs = [
          `packet:${packetChecksum}`,
          `artifact:sha256:${artifactHash}`,
          `manifest:sha256:${manifestHash}`,
          "checker:paired-live-codex-repair-checker.v3",
          `environment:sha256:${environmentProfileHash}`
        ];
        const evidenceInput = {
          projectId: scaffold.project.id,
          runId: run.id,
          feedbackDeltaId: "00000000-0000-4000-8000-000000000201",
          candidateId: `paired-target-repair:${run.id}`,
          candidateStatus: "candidate" as const,
          title: "Paired target repair outcome: win",
          scenario: "temporal-policy-drift",
          family: "temporal-policy-drift",
          expectedSignal: "Only a predeclared KRN win may be classified as helped.",
          artifactStatus: "passed" as const,
          outcome: "win" as const,
          usefulnessOutcome: "helped" as const,
          packetChecksum,
          packetEvidenceRef: `packet:${packetChecksum}`,
          artifactHash,
          artifactRef: `artifact:sha256:${artifactHash}`,
          manifestHash,
          manifestRef: `manifest:sha256:${manifestHash}`,
          checkerRevision: "paired-live-codex-repair-checker.v3",
          checkerEvidenceRef: "checker:paired-live-codex-repair-checker.v3",
          environmentProfileHash,
          environmentEvidenceRef: `environment:sha256:${environmentProfileHash}`,
          sourceEvidence: requiredEvidenceRefs,
          evidenceRefs: requiredEvidenceRefs,
          metadata: {
            smokeId: marker,
            evaluationKind: "paired_live_codex_repair"
          }
        };

        const first = await scaffold.harnessRunRepository.recordPairedLiveEvalEvidenceOnce(
          evidenceInput
        );
        const retry = await scaffold.harnessRunRepository.recordPairedLiveEvalEvidenceOnce(
          evidenceInput
        );

        expect(first.created).toBe(true);
        expect(retry.created).toBe(false);
        expect(retry.evidence.id).toBe(first.evidence.id);
        expect(retry.evidence).toMatchObject({
          projectId: scaffold.project.id,
          runId: run.id,
          scenario: "temporal-policy-drift",
          outcome: "win",
          usefulnessOutcome: "helped",
          checkerEvidenceRef: "checker:paired-live-codex-repair-checker.v3",
          artifactRef: `artifact:sha256:${artifactHash}`,
          manifestRef: `manifest:sha256:${manifestHash}`,
          environmentEvidenceRef: `environment:sha256:${environmentProfileHash}`
        });

        const otherArtifactHash = sha256Hex(`${marker}:other-artifact`);
        await expect(scaffold.harnessRunRepository.recordPairedLiveEvalEvidenceOnce({
          ...evidenceInput,
          artifactHash: otherArtifactHash,
          artifactRef: `artifact:sha256:${otherArtifactHash}`,
          sourceEvidence: [
            `packet:${packetChecksum}`,
            `artifact:sha256:${otherArtifactHash}`,
            `manifest:sha256:${manifestHash}`,
            "checker:paired-live-codex-repair-checker.v3",
            `environment:sha256:${environmentProfileHash}`
          ],
          evidenceRefs: [
            `packet:${packetChecksum}`,
            `artifact:sha256:${otherArtifactHash}`,
            `manifest:sha256:${manifestHash}`,
            "checker:paired-live-codex-repair-checker.v3",
            `environment:sha256:${environmentProfileHash}`
          ]
        })).rejects.toThrow("paired-live eval evidence identity conflict");

        const invalidArtifactHash = sha256Hex(`${marker}:invalid-artifact`);
        await expect(scaffold.harnessRunRepository.recordPairedLiveEvalEvidenceOnce({
          ...evidenceInput,
          candidateId: `paired-target-repair:${crypto.randomUUID()}`,
          artifactHash: invalidArtifactHash,
          artifactRef: `artifact:sha256:${invalidArtifactHash}`,
          artifactStatus: "invalid",
          outcome: "invalid",
          usefulnessOutcome: "helped",
          sourceEvidence: [
            `packet:${packetChecksum}`,
            `artifact:sha256:${invalidArtifactHash}`,
            `manifest:sha256:${manifestHash}`,
            "checker:paired-live-codex-repair-checker.v3",
            `environment:sha256:${environmentProfileHash}`
          ],
          evidenceRefs: [
            `packet:${packetChecksum}`,
            `artifact:sha256:${invalidArtifactHash}`,
            `manifest:sha256:${manifestHash}`,
            "checker:paired-live-codex-repair-checker.v3",
            `environment:sha256:${environmentProfileHash}`
          ]
        })).rejects.toThrow("cannot mark non-passed artifacts helped");

        await scaffold.cleanup();

        const afterCleanup = await scaffold.harnessRunRepository.listPairedLiveEvalEvidence({
          projectId: scaffold.project.id,
          runId: run.id,
          scenario: "temporal-policy-drift",
          outcome: "win",
          usefulnessOutcome: "helped",
          limit: 10
        });

        expect(afterCleanup).toHaveLength(1);
        expect(afterCleanup[0]).toEqual(expect.objectContaining({
          id: first.evidence.id,
          projectId: scaffold.project.id,
          runId: run.id,
          candidateId: `paired-target-repair:${run.id}`,
          feedbackDeltaId: "00000000-0000-4000-8000-000000000201",
          checkerEvidenceRef: "checker:paired-live-codex-repair-checker.v3"
        }));
      } finally {
        await scaffold.client`
          delete from paired_live_eval_evidence
          where metadata->>'smokeId' = ${marker}
        `;
        await scaffold.cleanup();
        await scaffold.client.end();
      }
    }
  );

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
