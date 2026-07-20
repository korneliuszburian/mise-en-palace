import { describe, expect, it } from "vitest";

import { targetSourceSeedSubjectId } from "@krn/harness";
import type { FeedbackDelta } from "@krn/core";
import { stampCurrentDecisionPacketAuthorityMetadata } from "@krn/core";

import { applyTargetSeedUsefulnessFeedback } from "../run-plan-command.js";

describe("target seed usefulness selection", () => {
  it("removes the latest noisy seed while retaining useful seeds and trust exclusions", async () => {
    const readModel = {
      projectId: "project-1",
      projectKernelId: "kernel-1",
      repoInstallationIds: ["repo-1"],
      localPathHints: ["/target"],
      sourceSeeds: [{ path: "docs", kind: "docs", reason: "broad documentation" }, {
        path: "AGENTS.md", kind: "agent_guidance", reason: "current agent constraints"
      }],
      trustExclusions: [{ pathPattern: ".env*", reason: "secret-shaped files" }]
    };
    const noisySubjectId = targetSourceSeedSubjectId(
      readModel.sourceSeeds[0]!,
      readModel,
      "project-1"
    );
    const feedback = {
      id: "feedback-1",
      reviewAssessmentId: "review-1",
      status: "accepted",
      memoryCandidates: [],
      sourceDecisions: [],
      evalCandidates: [],
      metadata: stampCurrentDecisionPacketAuthorityMetadata({
        contextInclusionUsefulnessOutcomes: [{
          subjectType: "search_document",
          subjectId: noisySubjectId,
          outcome: "noise",
          reason: "The broad docs root caused irrelevant inspection.",
          evidenceRefs: ["packet:prior"],
          doesNotProve: "The docs root is never useful."
        }]
      }, {
        checksum: "prior-packet",
        generatedAt: "2026-07-20T00:00:00.000Z",
        sourceRunLifecycleRevision: 1
      }),
      createdAt: "2026-07-20T00:00:00.000Z",
      updatedAt: "2026-07-20T00:00:00.000Z"
    } satisfies FeedbackDelta;

    const selected = await applyTargetSeedUsefulnessFeedback(readModel, "project-1", {
      async listFeedbackDeltasForProject() { return [feedback]; }
    });

    expect(selected?.sourceSeeds.map((seed) => seed.path)).toEqual(["AGENTS.md"]);
    expect(selected?.trustExclusions).toEqual(readModel.trustExclusions);
  });
});
