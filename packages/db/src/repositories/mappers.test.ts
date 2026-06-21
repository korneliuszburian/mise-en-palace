import { describe, expect, it } from "vitest";
import type {
  EvalCandidate,
  MemoryCandidate,
  SourceDecision
} from "@krn/core";

import { mapFeedbackDelta } from "./mappers.js";

const createdAt = new Date("2026-06-21T12:00:00.000Z");
const updatedAt = new Date("2026-06-21T12:30:00.000Z");

const memoryCandidate: MemoryCandidate = {
  id: "memory-candidate-1",
  projectId: "project-1",
  proposedBy: "review",
  kind: "constraint",
  status: "candidate",
  summary: "Persist run identities",
  body: "Persisted evidence must link back to an execution run.",
  owner: "kernel",
  confidence: 90,
  applicationGuidance: "Use when implementing persisted evidence capture.",
  sourceLineage: [{ sourceId: "source-1" }],
  isUserPreference: false,
  metadata: {},
  createdAt: createdAt.toISOString(),
  updatedAt: updatedAt.toISOString()
};

const sourceDecision: SourceDecision = {
  id: "source-decision-1",
  projectId: "project-1",
  sourceClaimId: "source-claim-1",
  status: "adopt",
  decision: "Use the existing harness tables.",
  rationale: "The schema already has the primary run spine tables.",
  falsifier: "Readback cannot link evidence to a run.",
  consumer: "M21",
  metadata: {},
  createdAt: createdAt.toISOString(),
  updatedAt: updatedAt.toISOString()
};

const evalCandidate: EvalCandidate = {
  id: "eval-candidate-1",
  projectId: "project-1",
  status: "candidate",
  title: "Persisted evidence readback",
  scenario: "Capture evidence for a persisted run.",
  expectedSignal: "Run aggregate includes evidence and feedback.",
  sourceEvidence: ["source-1"],
  metadata: {},
  createdAt: createdAt.toISOString()
};

describe("mapFeedbackDelta", () => {
  it("preserves persisted memory, source, and eval candidates", () => {
    const result = mapFeedbackDelta({
      id: "feedback-delta-1",
      reviewAssessmentId: "review-1",
      status: "candidate",
      memoryCandidates: [memoryCandidate],
      sourceDecisions: [sourceDecision],
      evalCandidates: [evalCandidate],
      metadata: { persisted: true },
      createdAt,
      updatedAt
    });

    expect(result.memoryCandidates).toEqual([memoryCandidate]);
    expect(result.sourceDecisions).toEqual([sourceDecision]);
    expect(result.evalCandidates).toEqual([evalCandidate]);
  });
});
