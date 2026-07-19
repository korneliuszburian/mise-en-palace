import { describe, expect, it } from "vitest";
import type { FeedbackDelta } from "@krn/core";
import { stampCurrentDecisionPacketAuthorityMetadata } from "@krn/core";
import type { KnowledgeReadModel } from "@krn/harness";

import {
  applyStoreKnowledgeUsefulnessFeedback,
  listStoreKnowledgeUsefulnessFeedback
} from "../store-knowledge-usefulness-selection.js";

const knowledge = (id = "knowledge:status-policy"): KnowledgeReadModel => ({
  id,
  kind: "procedure",
  status: "active",
  title: "Feedback status policy",
  summary: "Gate usefulness effects by feedback lifecycle status.",
  confidence: "high",
  reviewability: "ready",
  sourceRefs: ["source:status-policy"],
  evidenceRefs: ["test:status-policy"],
  consumers: ["next-run-selection"],
  falsifier: "Candidate feedback governs next-run exclusion.",
  doesNotProve: "This fixture does not prove live usefulness.",
  temporal: { kind: "current" },
  dissent: { kind: "none" },
  nextAction: "use"
});

const feedback = (input: {
  id: string;
  status: FeedbackDelta["status"];
  outcome: "helped" | "stale";
  createdAt?: string;
}): FeedbackDelta => ({
  id: input.id,
  reviewAssessmentId: `review-${input.id}`,
  status: input.status,
  memoryCandidates: [],
  sourceDecisions: [],
  evalCandidates: [],
  metadata: stampCurrentDecisionPacketAuthorityMetadata({
    knowledgeUsefulnessOutcomes: [{
      knowledgeId: "knowledge:status-policy",
      outcome: input.outcome,
      reason: `${input.status} ${input.outcome} feedback`,
      evidenceRefs: ["packet:status-policy", `feedback:${input.id}`],
      doesNotProve: "Feedback does not govern knowledge truth."
    }]
  }, {
    checksum: "status-policy",
    generatedAt: input.createdAt ?? "2026-07-15T08:00:00.000Z",
    sourceRunLifecycleRevision: 1
  }),
  createdAt: input.createdAt ?? "2026-07-15T08:00:00.000Z",
  updatedAt: input.createdAt ?? "2026-07-15T08:00:00.000Z"
});

describe("store knowledge usefulness lifecycle selection", () => {
  it.each([
    {
      name: "rejected feedback has no effect",
      feedbackDeltas: [feedback({ id: "feedback-rejected", status: "rejected", outcome: "stale" })],
      expectedIds: ["knowledge:status-policy"],
      expectedFeedback: undefined,
      expectedAttached: false
    },
    {
      name: "candidate blocking feedback is a review caveat without exclusion",
      feedbackDeltas: [feedback({ id: "feedback-candidate", status: "candidate", outcome: "stale" })],
      expectedIds: ["knowledge:status-policy"],
      expectedFeedback: { outcome: "stale", feedbackLifecycleStatus: "candidate" },
      expectedAttached: true
    },
    {
      name: "legacy accepted feedback remains a review caveat",
      feedbackDeltas: [feedback({ id: "feedback-accepted", status: "accepted", outcome: "stale" })],
      expectedIds: ["knowledge:status-policy"],
      expectedFeedback: { outcome: "stale", feedbackLifecycleStatus: "accepted" },
      expectedAttached: true
    },
    {
      name: "legacy applied feedback remains a review caveat",
      feedbackDeltas: [feedback({ id: "feedback-applied", status: "applied", outcome: "stale" })],
      expectedIds: ["knowledge:status-policy"],
      expectedFeedback: { outcome: "stale", feedbackLifecycleStatus: "applied" },
      expectedAttached: true
    }
  ])("$name", ({ feedbackDeltas, expectedIds, expectedFeedback, expectedAttached }) => {
    const result = applyStoreKnowledgeUsefulnessFeedback([knowledge()], feedbackDeltas);

    expect(result.readModels.map((readModel) => readModel.id)).toEqual(expectedIds);
    if (expectedFeedback === undefined) {
      expect(result.readModels[0]?.usefulnessFeedback).toBeUndefined();
    } else {
      expect(result.readModels[0]?.usefulnessFeedback).toMatchObject(expectedFeedback);
    }
    if (result.readModels[0] !== undefined) {
      expect(result.readModels[0].nextAction).toBe(
        expectedFeedback === undefined ? "use" : "review"
      );
    }
    expect(result.attachedReviewOnlyFeedback).toBe(expectedAttached);
  });

  it("uses the newest non-rejected delta and drops older caveats", () => {
    const result = applyStoreKnowledgeUsefulnessFeedback([knowledge()], [
      feedback({
        id: "feedback-new-candidate",
        status: "candidate",
        outcome: "helped",
        createdAt: "2026-07-15T09:00:00.000Z"
      }),
      feedback({
        id: "feedback-old-approved",
        status: "accepted",
        outcome: "stale",
        createdAt: "2026-07-15T08:00:00.000Z"
      })
    ]);

    expect(result.readModels).toHaveLength(1);
    expect(result.readModels[0]).toMatchObject({
      nextAction: "review",
      usefulnessFeedback: {
        outcome: "helped",
        feedbackLifecycleStatus: "candidate"
      }
    });
    expect(result.reviewOnlyUsefulnessCaveats).toEqual([]);
  });

  it("does not weaken a pre-existing next action when candidate feedback adds a caveat", () => {
    const result = applyStoreKnowledgeUsefulnessFeedback([
      { ...knowledge(), nextAction: "invalidate" }
    ], [
      feedback({ id: "feedback-candidate", status: "candidate", outcome: "helped" })
    ]);

    expect(result.readModels[0]).toMatchObject({
      nextAction: "invalidate",
      usefulnessFeedback: { feedbackLifecycleStatus: "candidate" }
    });
  });

  it("uses descending feedback id as the deterministic newest tie break", () => {
    const result = applyStoreKnowledgeUsefulnessFeedback([knowledge()], [
      feedback({ id: "feedback-a", status: "accepted", outcome: "stale" }),
      feedback({ id: "feedback-b", status: "accepted", outcome: "helped" })
    ]);

    expect(result.readModels).toHaveLength(1);
    expect(result.readModels[0]?.usefulnessFeedback).toMatchObject({
      outcome: "helped",
      feedbackLifecycleStatus: "accepted"
    });
    expect(result.readModels[0]?.nextAction).toBe("review");
  });

  it("requests only project-scoped feedback for the selected knowledge subjects", async () => {
    const readModels = [knowledge(), knowledge()];
    const expected = feedback({ id: "feedback-project", status: "accepted", outcome: "helped" });

    const result = await listStoreKnowledgeUsefulnessFeedback({
      projectId: "project-1",
      readModels,
      harnessRunRepository: {
        async listFeedbackDeltasForSubjects(input) {
          expect(input).toEqual({
            projectId: "project-1",
            subjects: [{ kind: "knowledge", id: "knowledge:status-policy" }],
            limitPerSubject: 100
          });
          return [expected];
        }
      }
    });

    expect(result).toEqual([expected]);
  });
});
