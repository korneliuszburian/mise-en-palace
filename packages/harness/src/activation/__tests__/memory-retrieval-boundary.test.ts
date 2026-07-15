import type {
  AntiMemoryRecord,
  MemoryRecord,
  TaskContract
} from "@krn/core";
import {
  describe,
  expect,
  it
} from "vitest";

import {
  retrieveActivationCandidates
} from "../index.js";

const now = "2026-07-10T00:00:00.000Z";

const memoryRecord = (input: {
  id: string;
  body: string;
  positiveFeedbackCount: number;
}): MemoryRecord => ({
  id: input.id,
  projectId: "project-memory-relevance",
  currentVersionId: `version:${input.id}`,
  key: input.id,
  kind: "procedure",
  status: "active",
  summary: input.id,
  body: input.body,
  owner: "memory-relevance-test",
  confidence: 90,
  applicationGuidance: "Review before selection.",
  sourceLineage: [{ sourceId: `source:${input.id}` }],
  isUserPreference: false,
  validFrom: now,
  positiveFeedbackCount: input.positiveFeedbackCount,
  negativeFeedbackCount: 0,
  metadata: {},
  createdAt: now,
  updatedAt: now
});

const antiMemoryRecord = (input: {
  id: string;
  body: string;
}): AntiMemoryRecord => ({
  id: input.id,
  projectId: "project-memory-relevance",
  key: input.id,
  rejectedClaim: input.body,
  reason: "Rejected path.",
  summary: input.id,
  body: input.body,
  owner: "memory-relevance-test",
  confidence: 90,
  sourceLineage: [{ sourceId: `source:${input.id}` }],
  invalidatedBySourceClaimIds: [],
  metadata: {},
  validFrom: now,
  createdAt: now,
  updatedAt: now
});

const task: TaskContract = {
  id: "task-memory-relevance",
  operatorIntentId: "intent-memory-relevance",
  projectId: "project-memory-relevance",
  title: "Use packet checksum idempotency",
  objective: "Persist one packet-bound memory application for concurrent retries.",
  constraints: [],
  nonGoals: [],
  acceptance: ["Concurrent packet retries create one application."],
  status: "active",
  metadata: {},
  createdAt: now,
  updatedAt: now
};

describe("memory retrieval boundary", () => {
  it("passes task terms before the bounded active-memory limit", async () => {
    const distractors = Array.from({ length: 25 }, (_, index) => memoryRecord({
      id: `distractor-${index}`,
      body: "Unrelated deployment note with favored positive feedback.",
      positiveFeedbackCount: 100
    }));
    const relevant = memoryRecord({
      id: "relevant-packet-idempotency",
      body: "Packet checksum idempotency prevents duplicate memory applications.",
      positiveFeedbackCount: 0
    });
    const allRecords = [...distractors, relevant];

    const result = await retrieveActivationCandidates({
      taskContract: task,
      limits: {
        memory: 25,
        source: 0,
        search: 0,
        antiMemory: 0
      },
      repositories: {
        memoryRepository: {
          async listActiveMemory(
            _projectId,
            limit,
            options?: { terms?: readonly string[] }
          ) {
            const terms = options?.terms ?? [];
            const candidates = terms.length === 0
              ? allRecords
              : allRecords.filter((record) => terms.some((term) =>
                  `${record.key} ${record.summary} ${record.body} ${record.applicationGuidance}`
                    .toLowerCase()
                    .includes(term.toLowerCase())
                ));

            return candidates.slice(0, limit);
          },
          async listAntiMemoryForProject() {
            return [];
          }
        },
        sourceRepository: {
          async listClaimsForProject() {
            return [];
          },
          async listSourceClaimEdgesForClaim() {
            return [];
          },
          async listSourceDecisionEdgesForClaim() {
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

    expect(result.memoryQuery.terms).toContain("idempotency");
    expect(result.candidates.map((candidate) => candidate.subjectId)).toContain(relevant.id);
  });

  it("passes task terms before the bounded anti-memory limit", async () => {
    const distractors = Array.from({ length: 25 }, (_, index) => antiMemoryRecord({
      id: `anti-distractor-${index}`,
      body: "Unrelated deployment rejection."
    }));
    const relevant = antiMemoryRecord({
      id: "anti-relevant-packet-idempotency",
      body: "Reject duplicate packet checksum applications."
    });
    const allRecords = [...distractors, relevant];

    const result = await retrieveActivationCandidates({
      taskContract: task,
      limits: {
        memory: 0,
        source: 0,
        search: 0,
        antiMemory: 1
      },
      repositories: {
        memoryRepository: {
          async listActiveMemory() {
            return [];
          },
          async listAntiMemoryForProject(
            _projectId,
            limit,
            options?: { terms?: readonly string[] }
          ) {
            const terms = options?.terms ?? [];
            const candidates = terms.length === 0
              ? allRecords
              : allRecords.filter((record) => terms.some((term) =>
                  `${record.key} ${record.rejectedClaim} ${record.reason} ${record.appliesTo} ${record.summary} ${record.body}`
                    .toLowerCase()
                    .includes(term.toLowerCase())
                ));

            return candidates.slice(0, limit);
          }
        },
        sourceRepository: {
          async listClaimsForProject() {
            return [];
          },
          async listSourceClaimEdgesForClaim() {
            return [];
          },
          async listSourceDecisionEdgesForClaim() {
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

    expect(result.memoryQuery.terms).toContain("idempotency");
    expect(result.antiMemoryRecords.map((record) => record.id)).toEqual([relevant.id]);
  });
});
