import { describe, expect, it } from "vitest";

import type {
  ObservationItem,
  ReflectionRecord
} from "@krn/core";
import type {
  ReflectDatabaseRuntime
} from "./databaseRuntime.js";
import {
  runReflectCommand
} from "./runReflectCommand.js";

const now = "2026-06-22T12:00:00.000Z";

const observation = (overrides: Partial<ObservationItem>): ObservationItem => ({
  id: "observation-1",
  groupId: "group-1",
  scope: {
    projectId: "project-1",
    executionRunId: "run-1",
    taskContractId: "task-1"
  },
  kind: "fact",
  status: "candidate",
  priority: "medium",
  confidence: "medium",
  provenanceKind: "run_event",
  subject: "reflection",
  summary: "Reflection candidate generation needs review.",
  body: "Reflection output must stay candidate-only.",
  temporalScope: {
    observedAt: "2026-06-22T11:00:00.000Z",
    ingestedAt: "2026-06-22T11:00:00.000Z"
  },
  sourceRanges: [{
    id: "range-1",
    sourceType: "run_event",
    sourceId: "run-1",
    locator: "run_events:1",
    capturedAt: "2026-06-22T11:00:00.000Z"
  }],
  entityLinks: [],
  claimLinks: [],
  metadata: {},
  createdAt: "2026-06-22T11:00:00.000Z",
  updatedAt: "2026-06-22T11:00:00.000Z",
  ...overrides
});

const createRuntime = (input: {
  observations: ObservationItem[];
  onCreateReflectionRecord?: (record: ReflectionRecord) => void;
}): ReflectDatabaseRuntime => ({
  async getRunSnapshot(executionRunId) {
    return {
      executionRunId,
      projectId: "project-1",
      taskContractId: "task-1"
    };
  },
  async projectExists(projectId) {
    return projectId === "project-1";
  },
  observationRepository: {
    async findByRun() {
      return input.observations;
    },
    async findByScope() {
      return input.observations;
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
    async createReflectionRecord(recordInput) {
      const record: ReflectionRecord = {
        id: "reflection-record-1",
        scope: recordInput.scope,
        status: recordInput.status ?? "candidate",
        summary: recordInput.summary,
        input: recordInput.input,
        output: recordInput.output,
        metadata: recordInput.metadata ?? {},
        createdAt: now,
        updatedAt: now
      };
      input.onCreateReflectionRecord?.(record);
      return record;
    }
  },
  async close() {}
});

describe("runReflectCommand", () => {
  it("requires database config", async () => {
    await expect(runReflectCommand({
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      command: {
        kind: "reflect",
        scope: {
          kind: "run",
          id: "run-1"
        },
        persist: false
      }
    })).rejects.toThrow("KRN_DATABASE_URL is required for krn reflect");
  });

  it("previews run-scoped reflection without writing a record or memory", async () => {
    let createCalled = false;
    const result = await runReflectCommand({
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      command: {
        kind: "reflect",
        scope: {
          kind: "run",
          id: "run-1"
        },
        persist: false
      },
      createReflectDatabaseRuntime: async () => createRuntime({
        observations: [
          observation({
            id: "observation-conflict",
            kind: "conflict",
            summary: "Observation conflict should be reported."
          })
        ],
        onCreateReflectionRecord: () => {
          createCalled = true;
        }
      })
    });

    expect(createCalled).toBe(false);
    expect(result.stdout).toContain("KRN Reflect");
    expect(result.stdout).toContain("Persistence: disabled");
    expect(result.stdout).toContain("Scope: run:run-1");
    expect(result.stdout).toContain("Contradictions: 1");
    expect(result.stdout).toContain("Candidate rows written: no");
    expect(result.stdout).toContain("MemoryRecord created: no");
    expect(result.stdout).toContain("Reflection record: preview only");
  });

  it("persists a project-scoped reflection record without candidate or memory writes", async () => {
    let createdRecord: ReflectionRecord | undefined;
    const result = await runReflectCommand({
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      command: {
        kind: "reflect",
        scope: {
          kind: "project",
          id: "project-1"
        },
        persist: true
      },
      createReflectDatabaseRuntime: async () => createRuntime({
        observations: [
          observation({
            id: "observation-stale",
            temporalScope: {
              observedAt: "2026-06-22T10:00:00.000Z",
              ingestedAt: "2026-06-22T10:00:00.000Z",
              validUntil: "2026-06-22T10:30:00.000Z"
            }
          })
        ],
        onCreateReflectionRecord: (record) => {
          createdRecord = record;
        }
      })
    });

    expect(createdRecord?.output.gaps).toHaveLength(1);
    expect(createdRecord?.output.memoryCandidates).toEqual([]);
    expect(createdRecord?.metadata).toMatchObject({
      candidateRowsWritten: false,
      memoryMutation: "none"
    });
    expect(result.stdout).toContain("Persistence: enabled");
    expect(result.stdout).toContain("Gaps: 1");
    expect(result.stdout).toContain("Candidate rows written: no");
    expect(result.stdout).toContain("Memory mutation: none");
    expect(result.stdout).toContain("Reflection record: reflection-record-1");
  });
});
