import { describe, expect, it } from "vitest";

import { targetSourceSeedSubjectId } from "@krn/harness";
import type { FeedbackDelta, SourceClaim } from "@krn/core";
import {
  feedbackTaskContractIdMetadataKey,
  feedbackTaskObjectiveMetadataKey,
  stampCurrentDecisionPacketAuthorityMetadata
} from "@krn/core";

import { createNoStoreCompilerDependencies } from "../no-store-repositories.js";
import {
  applyPlanContextUsefulnessFeedback,
  applyTargetSeedUsefulnessFeedback
} from "../run-plan-command.js";

describe("target seed usefulness selection", () => {
  it("keeps context when the packet-bound feedback proposal is not authorized", async () => {
    const readModel = {
      projectId: "project-1",
      projectKernelId: "kernel-1",
      repoInstallationIds: ["repo-1"],
      localPathHints: ["/target"],
      sourceSeeds: [{ path: "docs", kind: "docs", reason: "broad documentation" }],
      trustExclusions: []
    };
    const noisySubjectId = targetSourceSeedSubjectId(
      readModel.sourceSeeds[0]!,
      readModel,
      "project-1"
    );
    const feedback = (status: "candidate" | "rejected") => ({
      id: `feedback-${status}`,
      reviewAssessmentId: `review-${status}`,
      status,
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
    } satisfies FeedbackDelta);

    const selected = await applyTargetSeedUsefulnessFeedback(readModel, "project-1", {
      async listFeedbackDeltasForProject() {
        return [feedback("candidate"), feedback("rejected")];
      }
    });

    expect(selected?.sourceSeeds).toEqual(readModel.sourceSeeds);
  });

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

  it("removes noisy governed context only for the byte-identical task", async () => {
    const task = "Prepare the local authentication note.";
    const now = "2026-07-20T00:00:00.000Z";
    const claim = (id: string): SourceClaim => ({
      id,
      sourceArtifactId: `artifact-${id}`,
      claim: `claim ${id}`,
      mechanism: "bounded test mechanism",
      krnImplication: "bounded test implication",
      doesNotProve: "future task relevance",
      sourceAuthority: "project-decision",
      supportType: "decision",
      consumer: "plan context selector",
      status: "accepted",
      metadata: {},
      createdAt: now,
      updatedAt: now
    });
    const relevantClaim = claim("claim-relevant");
    const noisyClaim = claim("claim-noisy");
    const noisyMemoryId = "memory-noisy";
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    const compilerDependencies = {
      ...dependencies,
      memoryRepository: {
        ...dependencies.memoryRepository,
        async listActiveMemory() {
          return [{
            id: noisyMemoryId,
            projectId: "project-1",
            key: "noisy-memory",
            kind: "constraint" as const,
            status: "active" as const,
            summary: "Unrelated memory",
            body: "Unrelated memory body",
            owner: "test",
            confidence: 90,
            applicationGuidance: "Do not use for this task.",
            sourceLineage: [],
            isUserPreference: false,
            positiveFeedbackCount: 0,
            negativeFeedbackCount: 0,
            metadata: {},
            validFrom: now,
            createdAt: now,
            updatedAt: now
          }];
        }
      },
      sourceRepository: {
        ...dependencies.sourceRepository,
        async listClaimsForProject() {
          return [relevantClaim, noisyClaim];
        }
      }
    };
    const feedback = {
      id: "feedback-source-noise",
      reviewAssessmentId: "review-source-noise",
      status: "accepted",
      memoryCandidates: [],
      sourceDecisions: [],
      evalCandidates: [],
      metadata: stampCurrentDecisionPacketAuthorityMetadata({
        [feedbackTaskContractIdMetadataKey]: "task-contract-1",
        [feedbackTaskObjectiveMetadataKey]: task,
        contextInclusionUsefulnessOutcomes: [{
          subjectType: "source_claim",
          subjectId: noisyClaim.id,
          outcome: "noise",
          reason: "The claim was unrelated to this exact task.",
          evidenceRefs: ["packet:prior"],
          doesNotProve: "The claim is noise for another task."
        }, {
          subjectType: "memory_record",
          subjectId: noisyMemoryId,
          outcome: "noise",
          reason: "The memory was unrelated to this exact task.",
          evidenceRefs: ["packet:prior"],
          doesNotProve: "The memory is noise for another task."
        }]
      }, {
        checksum: "prior-packet",
        generatedAt: now,
        sourceRunLifecycleRevision: 1
      }),
      createdAt: now,
      updatedAt: now
    } satisfies FeedbackDelta;

    const selected = await applyPlanContextUsefulnessFeedback({
      readModel: undefined,
      projectId: "project-1",
      task,
      repository: {
        async listFeedbackDeltasForProject() { return [feedback]; }
      },
      compilerDependencies
    });
    const retainedForSameTask = await selected.compilerDependencies.sourceRepository
      .listClaimsForProject("project-1", 10);
    const retainedMemoryForSameTask = await selected.compilerDependencies.memoryRepository
      .listActiveMemory("project-1", 10);
    const selectedForOtherTask = await applyPlanContextUsefulnessFeedback({
      readModel: undefined,
      projectId: "project-1",
      task: "A different task.",
      repository: {
        async listFeedbackDeltasForProject() { return [feedback]; }
      },
      compilerDependencies
    });
    const retainedForOtherTask = await selectedForOtherTask.compilerDependencies.sourceRepository
      .listClaimsForProject("project-1", 10);
    const retainedMemoryForOtherTask = await selectedForOtherTask.compilerDependencies
      .memoryRepository.listActiveMemory("project-1", 10);

    expect(retainedForSameTask.map(({ id }) => id)).toEqual([relevantClaim.id]);
    expect(retainedMemoryForSameTask).toEqual([]);
    expect(retainedForOtherTask.map(({ id }) => id)).toEqual([
      relevantClaim.id,
      noisyClaim.id
    ]);
    expect(retainedMemoryForOtherTask.map(({ id }) => id)).toEqual([noisyMemoryId]);
  });
});
