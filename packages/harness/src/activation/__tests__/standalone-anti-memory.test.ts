import type {
  AntiMemoryRecord,
  MemoryRecord,
  TaskContract
} from "@krn/core";
import { describe, expect, it } from "vitest";

import {
  applyActivationFilters,
  applyContextROI,
  assembleContext,
  retrieveActivationCandidates
} from "../index.js";

const now = "2026-07-15T12:00:00.000Z";
const task: TaskContract = {
  id: "task-anti-memory",
  operatorIntentId: "intent-anti-memory",
  projectId: "project-anti-memory",
  title: "Keep rejected brain-store paths visible",
  objective: "Use current anti-memory as non-governing context.",
  constraints: [],
  nonGoals: [],
  acceptance: ["Rejected paths appear only as exclusions."],
  status: "active",
  metadata: {},
  createdAt: now,
  updatedAt: now
};

const rejectedPath = (id: string): AntiMemoryRecord => ({
  id,
  projectId: task.projectId!,
  key: "brain-store",
  rejectedClaim: "Dashboard markdown is KRN runtime memory.",
  reason: "Runtime memory must be store-backed.",
  invalidatedBySourceClaimIds: [],
  appliesTo: "brain-store",
  summary: "Reject markdown runtime memory",
  body: "Do not activate dashboard markdown as Memory Core authority.",
  owner: "operator",
  confidence: 90,
  sourceLineage: [{ sourceId: "source-anti-memory" }],
  metadata: {},
  validFrom: now,
  createdAt: now,
  updatedAt: now
});

const positiveMemory = (): MemoryRecord => ({
  id: "memory-matching-anti",
  projectId: task.projectId!,
  key: "brain-store",
  kind: "constraint",
  status: "active",
  summary: "Brain store guidance",
  body: "Dashboard markdown is KRN runtime memory.",
  owner: "kernel",
  confidence: 90,
  applicationGuidance: "Use as brain-store guidance.",
  sourceLineage: [{ sourceId: "source-memory" }],
  isUserPreference: false,
  positiveFeedbackCount: 0,
  negativeFeedbackCount: 0,
  metadata: {},
  validFrom: now,
  createdAt: now,
  updatedAt: now
});

const retrieve = (
  memoryRecords: readonly MemoryRecord[],
  antiMemoryRecords: readonly AntiMemoryRecord[]
) => retrieveActivationCandidates({
  taskContract: task,
  limits: {
    memory: 25,
    source: 0,
    search: 0,
    antiMemory: 25
  },
  repositories: {
    memoryRepository: {
      async listActiveMemory() {
        return [...memoryRecords];
      },
      async listAntiMemoryForProject() {
        return [...antiMemoryRecords];
      }
    },
    sourceRepository: {
      async listClaimsForProject() {
        return [];
      },
      async listSourceClaimEdgesForClaim() {
        return [];
      }
    },
    retrievalRepository: {
      async searchLexical() {
        return [];
      }
    }
  }
});

describe("standalone anti-memory activation", () => {
  it("preserves standalone anti-memory only as bounded exclusion context", async () => {
    const antiMemory = rejectedPath("anti-memory-standalone");
    const result = await retrieve([], [antiMemory]);
    const bounded = applyContextROI(result.candidates, {
      tokenBudget: 1,
      maxInclusions: 0
    });
    const context = assembleContext({
      id: "context-standalone-anti-memory",
      harnessPlanId: "plan-anti-memory",
      candidates: bounded,
      tokenBudget: 1,
      createdAt: now
    });

    expect(result.antiMemoryRecords).toEqual([antiMemory]);
    expect(result.diagnostics).toMatchObject({
      antiMemoryRecordCount: 1,
      mergedCandidateCount: 1
    });
    expect(result.candidates).toEqual([
      expect.objectContaining({
        kind: "anti_memory",
        subjectType: "anti_memory_record",
        subjectId: antiMemory.id,
        antiMemoryRecordId: antiMemory.id,
        exclusion: expect.objectContaining({ reason: "unsafe" })
      })
    ]);
    expect(context.inclusions).toEqual([]);
    expect(context.exclusions).toEqual([
      expect.objectContaining({
        subjectType: "anti_memory_record",
        subjectId: antiMemory.id,
        reason: "unsafe"
      })
    ]);
    expect(context.activationAbstention).toMatchObject({
      reason: "unsafe_context",
      metadata: {
        candidateCount: 1,
        exclusionCount: 1
      }
    });
  });

  it("keeps matching positive memory and its warning non-governing", async () => {
    const antiMemory = rejectedPath("anti-memory-matching-positive");
    const result = await retrieve([positiveMemory()], [antiMemory]);
    const filtered = applyActivationFilters({
      candidates: result.candidates,
      antiMemoryRecords: result.antiMemoryRecords,
      minimumSourceAuthority: "medium",
      now
    });
    const context = assembleContext({
      id: "context-matching-anti-memory",
      harnessPlanId: "plan-anti-memory",
      candidates: filtered.candidates,
      createdAt: now
    });

    expect(filtered.conflictSets).toEqual([
      expect.objectContaining({
        candidateIds: ["memory-matching-anti", antiMemory.id],
        reason: "anti_memory_block"
      })
    ]);
    expect(context.inclusions).toEqual([]);
    expect(context.exclusions.map((exclusion) => exclusion.subjectId)).toEqual(
      expect.arrayContaining(["memory-matching-anti", antiMemory.id])
    );
  });
});
