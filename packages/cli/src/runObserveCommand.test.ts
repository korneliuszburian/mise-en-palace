import { describe, expect, it } from "vitest";

import type {
  HarnessRunAggregate
} from "@krn/harness/repositories";
import type {
  CreateObservationItemInput
} from "@krn/db/adapters";
import type {
  ObserveDatabaseRuntime
} from "./databaseRuntime.js";
import {
  runObserveCommand
} from "./runObserveCommand.js";

const now = "2026-06-23T12:00:00.000Z";

const aggregate = (): HarnessRunAggregate => ({
  operatorIntent: {
    id: "operator-intent-1",
    workspaceId: "workspace-1",
    projectId: "project-1",
    source: "cli",
    rawIntent: "observe run",
    metadata: {},
    createdAt: now
  },
  taskContract: {
    id: "task-contract-1",
    operatorIntentId: "operator-intent-1",
    projectId: "project-1",
    title: "observe run",
    objective: "observe run",
    constraints: [],
    nonGoals: [],
    acceptance: [],
    status: "active",
    metadata: {},
    createdAt: now,
    updatedAt: now
  },
  harnessPlan: {
    id: "harness-plan-1",
    taskContractId: "task-contract-1",
    version: 1,
    status: "ready",
    summary: "observe run",
    metadata: {},
    createdAt: now,
    updatedAt: now
  },
  executionRun: {
    id: "execution-run-1",
    harnessPlanId: "harness-plan-1",
    adapter: "codex",
    status: "succeeded",
    metadata: {},
    createdAt: now,
    updatedAt: now
  },
  evidenceBundles: [],
  reviewAssessments: [],
  feedbackDeltas: [],
  runEvents: [{
    id: "run-event-1",
    executionRunId: "execution-run-1",
    sequence: 1,
    type: "tool.result",
    severity: "info",
    message: "pnpm test passed",
    payload: { command: "pnpm test", accessToken: "redacted" },
    occurredAt: now
  }]
});

const createRuntime = (input: {
  onAddItems?: (items: CreateObservationItemInput[]) => void;
} = {}): ObserveDatabaseRuntime => ({
  harnessRunRepository: {
    async getHarnessRunByExecutionRunId() {
      return aggregate();
    }
  },
  async resolveProjectRuntime(projectInput) {
    expect(projectInput.projectId).toBe("project-1");

    return {
      workspaceId: "workspace-1",
      projectId: "project-1",
      observationRepository: {
        async createGroup(groupInput) {
          expect(groupInput.metadata).toMatchObject({
            memoryMutation: "none",
            modelCall: false
          });

          return {
            id: "observation-group-1",
            scope: groupInput.scope,
            title: groupInput.title,
            summary: groupInput.summary,
            source: groupInput.source,
            metadata: groupInput.metadata ?? {},
            createdAt: now,
            updatedAt: now
          };
        },
        async addItems(_groupId, items) {
          input.onAddItems?.(items);

          return items.map((item, index) => ({
            id: `observation-item-${index + 1}`,
            groupId: "observation-group-1",
            scope: {
              projectId: "project-1",
              executionRunId: "execution-run-1",
              taskContractId: "task-contract-1"
            },
            status: item.status ?? "candidate",
            priority: item.priority ?? "medium",
            confidence: item.confidence ?? "medium",
            entityLinks: item.entityLinks ?? [],
            claimLinks: item.claimLinks ?? [],
            metadata: item.metadata ?? {},
            createdAt: now,
            updatedAt: now,
            ...item
          }));
        }
      }
    };
  },
  async close() {}
});

describe("runObserveCommand", () => {
  it("previews run observation without creating observation or memory rows", async () => {
    let addItemsCalled = false;
    const result = await runObserveCommand({
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      command: {
        kind: "observeRun",
        runId: "execution-run-1",
        persist: false
      },
      createObserveDatabaseRuntime: async () => createRuntime({
        onAddItems: () => {
          addItemsCalled = true;
        }
      })
    });

    expect(addItemsCalled).toBe(false);
    expect(result.stdout).toContain("Persistence: disabled");
    expect(result.stdout).toContain("Observation group: preview only");
    expect(result.stdout).toContain("Memory mutation: none");
    expect(result.stdout).toContain("MemoryRecord created: no");
  });

  it("persists source-ranged observation staging without a Memory Core writer", async () => {
    let capturedItems: CreateObservationItemInput[] = [];
    const result = await runObserveCommand({
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      command: {
        kind: "observeRun",
        runId: "execution-run-1",
        persist: true
      },
      createObserveDatabaseRuntime: async () => createRuntime({
        onAddItems: (items) => {
          capturedItems = items;
        }
      })
    });

    expect(capturedItems).toHaveLength(1);
    expect(capturedItems[0]).toMatchObject({
      kind: "fact",
      provenanceKind: "run_event",
      metadata: {
        generatedBy: "krn observe --run",
        observationIsMemory: false
      }
    });
    expect(capturedItems[0]?.sourceRanges).toEqual([
      expect.objectContaining({
        sourceType: "run_event",
        sourceId: "run-event-1",
        runEventId: "run-event-1",
        executionRunId: "execution-run-1"
      })
    ]);
    expect(result.stdout).toContain("Observation group: observation-group-1");
    expect(result.stdout).toContain("Memory mutation: none");
    expect(result.stdout).toContain("MemoryRecord created: no");
  });
});
