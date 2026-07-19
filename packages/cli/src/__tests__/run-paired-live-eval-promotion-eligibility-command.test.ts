import {
  describe,
  expect,
  it
} from "vitest";
import type {
  ListPairedLiveEvalEvidenceInput,
  PairedLiveEvalEvidenceRecord
} from "@krn/core";
import type {
  GetReviewedHelpedMemoryProposalEligibilityInput
} from "@krn/core/repositories";

import {
  runPairedLiveEvalPromotionEligibilityCommand
} from "../run-paired-live-eval-promotion-eligibility-command.js";

const now = "2026-07-19T07:50:00.000Z";
const projectId = "00000000-0000-4000-8000-000000000001";
const runId = "00000000-0000-4000-8000-000000000101";
const feedbackDeltaId = "00000000-0000-4000-8000-000000000201";
const reviewAssessmentId = "00000000-0000-4000-8000-000000000301";
const sourceDecisionId = "00000000-0000-4000-8000-000000000401";

const pairedEvidence = (
  overrides: Partial<PairedLiveEvalEvidenceRecord> = {}
): PairedLiveEvalEvidenceRecord => ({
  id: "paired-evidence-1",
  projectId,
  runId,
  feedbackDeltaId,
  candidateId: `paired-target-repair:${runId}`,
  candidateStatus: "candidate",
  title: "Paired target repair outcome: win",
  scenario: "temporal-policy-drift",
  family: "temporal-policy-drift",
  expectedSignal: "Only a predeclared KRN win may be classified as helped.",
  artifactStatus: "passed",
  outcome: "win",
  usefulnessOutcome: "helped",
  packetChecksum: "a".repeat(64),
  packetEvidenceRef: `packet:${"a".repeat(64)}`,
  artifactHash: "b".repeat(64),
  artifactRef: `artifact:sha256:${"b".repeat(64)}`,
  manifestHash: "c".repeat(64),
  manifestRef: `manifest:sha256:${"c".repeat(64)}`,
  checkerRevision: "paired-live-codex-repair-checker.v3",
  checkerEvidenceRef: "checker:paired-live-codex-repair-checker.v3",
  environmentProfileHash: "d".repeat(64),
  environmentEvidenceRef: `environment:sha256:${"d".repeat(64)}`,
  sourceEvidence: ["checker:paired-live-codex-repair-checker.v3"],
  evidenceRefs: [
    `packet:${"a".repeat(64)}`,
    `artifact:sha256:${"b".repeat(64)}`,
    `manifest:sha256:${"c".repeat(64)}`,
    "checker:paired-live-codex-repair-checker.v3",
    `environment:sha256:${"d".repeat(64)}`
  ],
  metadata: {},
  createdAt: now,
  updatedAt: now,
  ...overrides
});

describe("runPairedLiveEvalPromotionEligibilityCommand", () => {
  it("prints exact memory learn propose arguments for reviewed helped eligible evidence", async () => {
    const listed: ListPairedLiveEvalEvidenceInput[] = [];
    const checked: GetReviewedHelpedMemoryProposalEligibilityInput[] = [];
    const closed: string[] = [];

    const result = await runPairedLiveEvalPromotionEligibilityCommand({
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      command: {
        projectId,
        runId,
        candidateId: `paired-target-repair:${runId}`,
        limit: 5,
        format: "json"
      },
      createEligibilityRuntime: async () => ({
        async listPairedLiveEvalEvidence(input) {
          listed.push(input);
          return [pairedEvidence()];
        },
        async getReviewedHelpedMemoryProposalEligibility(input) {
          checked.push(input);
          return {
            status: "ready_to_propose",
            projectId,
            feedbackDeltaId,
            reviewAssessmentId,
            sourceDecisionId,
            sourceClaimId: "source-claim-1",
            evidenceBundleId: "evidence-bundle-1",
            usefulnessApplicationId: "application-1",
            packetChecksum: "a".repeat(64)
          };
        },
        async close() {
          closed.push("closed");
        }
      })
    });

    const parsed = JSON.parse(result.stdout) as {
      candidates: readonly [{
        status: string;
        feedbackDeltaId: string;
        reviewAssessmentId: string;
        sourceDecisionId: string;
        proposeCommand: string;
      }];
      proof: { doesNotProve: readonly string[] };
    };

    expect(listed).toEqual([{
      projectId,
      runId,
      candidateId: `paired-target-repair:${runId}`,
      limit: 5
    }]);
    expect(checked).toEqual([{ projectId, feedbackDeltaId }]);
    expect(closed).toEqual(["closed"]);
    expect(parsed.candidates[0]).toEqual(expect.objectContaining({
      status: "ready_to_propose",
      feedbackDeltaId,
      reviewAssessmentId,
      sourceDecisionId,
      proposeCommand: [
        "krn memory learn propose",
        "--project",
        projectId,
        "--feedback-delta-id",
        feedbackDeltaId,
        "--review-assessment-id",
        reviewAssessmentId,
        "--source-decision-id",
        sourceDecisionId,
        "--persist"
      ].join(" ")
    }));
    expect(parsed.proof.doesNotProve).toContain(
      "promotion of a MemoryCandidate into MemoryRecord, SourceClaim, or SourceDecision authority"
    );
  });

  it("blocks neutral or tied paired-live evidence before checking reviewed memory authority", async () => {
    const checked: GetReviewedHelpedMemoryProposalEligibilityInput[] = [];

    const result = await runPairedLiveEvalPromotionEligibilityCommand({
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      command: {
        projectId,
        format: "json"
      },
      createEligibilityRuntime: async () => ({
        async listPairedLiveEvalEvidence() {
          return [
            pairedEvidence({
              outcome: "tie",
              usefulnessOutcome: "neutral"
            }),
            pairedEvidence({
              candidateId: `paired-target-repair:${runId}:tie-helped`,
              outcome: "tie",
              usefulnessOutcome: "helped"
            })
          ];
        },
        async getReviewedHelpedMemoryProposalEligibility(input) {
          checked.push(input);
          throw new Error("neutral evidence must not ask the memory gate");
        },
        async close() {}
      })
    });

    const parsed = JSON.parse(result.stdout) as {
      candidates: readonly [
        { status: string; reason: string },
        { status: string; reason: string }
      ];
    };

    expect(checked).toEqual([]);
    expect(parsed.candidates).toHaveLength(2);
    expect(parsed.candidates[0]).toMatchObject({
      status: "not_helped",
      reason: expect.stringContaining("not passed/win/helped")
    });
    expect(parsed.candidates[1]).toMatchObject({
      status: "not_helped",
      reason: expect.stringContaining("not passed/win/helped")
    });
  });

  it("renders missing_review from the reviewed memory authority gate", async () => {
    const result = await runPairedLiveEvalPromotionEligibilityCommand({
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      command: {
        projectId,
        format: "json"
      },
      createEligibilityRuntime: async () => ({
        async listPairedLiveEvalEvidence() {
          return [pairedEvidence()];
        },
        async getReviewedHelpedMemoryProposalEligibility(input) {
          return {
            status: "missing_review",
            projectId,
            feedbackDeltaId: input.feedbackDeltaId,
            sourceDecisionId,
            reason: "review_assessment_not_found"
          };
        },
        async close() {}
      })
    });

    const parsed = JSON.parse(result.stdout) as {
      candidates: readonly [{ status: string; reason: string; sourceDecisionId: string }];
    };

    expect(parsed.candidates[0]).toEqual(expect.objectContaining({
      status: "missing_review",
      reason: "review_assessment_not_found",
      sourceDecisionId
    }));
  });

  it("requires a new review when durable helped eval evidence outlives retained feedback cleanup", async () => {
    const checked: GetReviewedHelpedMemoryProposalEligibilityInput[] = [];

    const result = await runPairedLiveEvalPromotionEligibilityCommand({
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      command: {
        projectId,
        runId,
        candidateId: `paired-target-repair:${runId}`,
        format: "json"
      },
      createEligibilityRuntime: async () => ({
        async listPairedLiveEvalEvidence() {
          return [pairedEvidence({
            scenario: "temporal-policy-hidden-source-typescript",
            family: "temporal-policy-hidden-source",
            evidenceRefs: [
              `packet:${"a".repeat(64)}`,
              `artifact:sha256:${"b".repeat(64)}`,
              `manifest:sha256:${"c".repeat(64)}`,
              "checker:paired-live-codex-repair-checker.v3",
              `environment:sha256:${"d".repeat(64)}`,
              "target:baseline-patch:sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
              "target:krn-patch:sha256:691cca5a0fe6aed603d33d433d43cf2ec1a648bf9a6974dcaa48166c2cb48855"
            ],
            metadata: {
              evaluationKind: "paired_live_codex_repair",
              decisionApplications: [{
                sourceDecisionId,
                applicationId: "paired-source-decision:run:source",
                outcome: "used",
                appliedAt: now
              }]
            }
          })];
        },
        async getReviewedHelpedMemoryProposalEligibility(input) {
          checked.push(input);
          return {
            status: "blocked_authority",
            projectId,
            feedbackDeltaId: input.feedbackDeltaId,
            reason: "feedback_delta_not_found"
          };
        },
        async close() {}
      })
    });

    const parsed = JSON.parse(result.stdout) as {
      candidates: readonly [{
        status: string;
        feedbackDeltaId: string;
        reason: string;
        proposeCommand?: string;
      }];
    };

    expect(checked).toEqual([{ projectId, feedbackDeltaId }]);
    expect(parsed.candidates[0]).toEqual(expect.objectContaining({
      status: "missing_review",
      feedbackDeltaId,
      reason: "review_assessment_not_found"
    }));
    expect(parsed.candidates[0]?.proposeCommand).toBeUndefined();
  });

  it("fails closed when the database URL is missing", async () => {
    await expect(runPairedLiveEvalPromotionEligibilityCommand({
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      command: {
        projectId,
        format: "text"
      }
    })).rejects.toThrow(
      "KRN_DATABASE_URL is required for krn run eval-promotion-eligibility"
    );
  });
});
