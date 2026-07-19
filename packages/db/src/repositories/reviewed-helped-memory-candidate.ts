import {
  and,
  asc,
  desc,
  eq,
  inArray,
  sql
} from "drizzle-orm";
import {
  decisionPacketBindingReadbackFromMetadata,
  decisionGradeSourceSupportTypes,
  sourceUsefulnessOutcomesFromMetadata
} from "@krn/core";
import type {
  IsoTimestamp
} from "@krn/core";
import {
  ReviewedHelpedLearningBlockedError
} from "@krn/core/repositories/internal";
import type {
  GetReviewedHelpedMemoryProposalEligibilityInput,
  ProposeReviewedHelpedMemoryCandidateInput,
  ProposeReviewedHelpedMemoryCandidateResult,
  ReviewedHelpedMemoryProposalEligibility
} from "@krn/core/repositories/internal";

import type {
  KrnDatabase,
  KrnDatabaseTransaction
} from "../database.js";
import {
  evidenceBundles,
  executionRuns,
  feedbackDeltas,
  harnessPlans,
  memoryCandidates,
  outboxEvents,
  reviewAssessments,
  sourceArtifacts,
  sourceClaims,
  sourceDecisionEdges,
  sourceDecisions,
  usefulnessApplications
} from "../schema/index.js";
import {
  mapMemoryCandidate
} from "./mappers.js";

const proposedBy = "krn memory learn propose";

const blocked = (
  reason: ConstructorParameters<typeof ReviewedHelpedLearningBlockedError>[0]
): never => {
  throw new ReviewedHelpedLearningBlockedError(reason);
};

const confidenceValue = (confidence: "low" | "medium" | "high"): number =>
  confidence === "high" ? 90 : confidence === "medium" ? 60 : 30;

const uniqueStrings = (values: readonly string[]): string[] => [...new Set(values)];

const jsonContains = (actual: unknown, expected: unknown): boolean => {
  if (Array.isArray(expected)) {
    return Array.isArray(actual) &&
      actual.length === expected.length &&
      expected.every((item, index) => jsonContains(actual[index], item));
  }
  if (typeof expected === "object" && expected !== null) {
    if (typeof actual !== "object" || actual === null || Array.isArray(actual)) {
      return false;
    }
    const actualRecord = actual as Record<string, unknown>;
    return Object.entries(expected).every(([key, value]) =>
      jsonContains(actualRecord[key], value)
    );
  }

  return actual === expected;
};

const jsonEquals = (left: unknown, right: unknown): boolean =>
  jsonContains(left, right) && jsonContains(right, left);

const postPromotionMetadataKeys = new Set([
  "createdFromCandidateId",
  "sourceClaimIds",
  "reviewGate",
  "promotionBasis",
  "memoryRevision",
  "revisionReview"
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

// fallow-ignore-next-line complexity -- post-promotion identity must bind every gate-owned review, evidence, and source-claim coordinate
const reviewGateMetadataMatches = (
  reviewGate: unknown,
  candidate: typeof memoryCandidates.$inferSelect,
  expected: typeof memoryCandidates.$inferInsert
): boolean => {
  if (!isRecord(reviewGate) || !isRecord(expected.metadata)) {
    return false;
  }
  const candidateEvidence = expected.metadata["reflectionCandidateEvidence"];
  const untrustedSourceClaimIds = reviewGate["untrustedSourceClaimIds"];
  const evidenceReviewedRef = reviewGate["evidenceReviewedRef"];
  const hasAuthorityRevision = candidate.metadata["memoryRevision"] !== undefined ||
    candidate.metadata["revisionReview"] !== undefined;
  const expectedEvidenceReviewedRef = hasAuthorityRevision
    ? candidate.revisionReviewAssessmentId === null
      ? undefined
      : `review-assessment:${candidate.revisionReviewAssessmentId}`
    : `review-assessment:${expected.reviewAssessmentId}`;

  return evidenceReviewedRef === expectedEvidenceReviewedRef &&
    jsonEquals(reviewGate["candidateEvidence"], candidateEvidence) &&
    jsonEquals(reviewGate["sourceClaimIds"], expected.sourceClaimIds) &&
    jsonEquals(reviewGate["reviewedSourceClaimIds"], expected.sourceClaimIds) &&
    Array.isArray(untrustedSourceClaimIds) &&
    untrustedSourceClaimIds.every((id) =>
      typeof id === "string" && candidate.sourceClaimIds.includes(id)
    ) &&
    (untrustedSourceClaimIds.length === 0 ||
      (typeof reviewGate["untrustedSourceReviewRef"] === "string" &&
        reviewGate["untrustedSourceReviewRef"].trim().length > 0));
};

// fallow-ignore-next-line complexity -- accepted authority upgrades must bind every revision and review coordinate before idempotent readback
const authorityRevisionMetadataMatches = (
  candidate: typeof memoryCandidates.$inferSelect,
  expected: typeof memoryCandidates.$inferInsert
): boolean => {
  const revision = candidate.metadata["memoryRevision"];
  const revisionReview = candidate.metadata["revisionReview"];
  const reviewGate = candidate.metadata["reviewGate"];

  if (revision === undefined && revisionReview === undefined) {
    return true;
  }
  if (!isRecord(revision) || !isRecord(revisionReview) || !isRecord(reviewGate)) {
    return false;
  }

  const sourceMemoryRecordId = revision["sourceMemoryRecordId"];
  const reason = revision["reason"];
  const evidenceRefs = revision["evidenceRefs"];
  const evidenceReviewedRef = reviewGate["evidenceReviewedRef"];

  return revision["action"] === "merge_duplicate" &&
    typeof sourceMemoryRecordId === "string" &&
    sourceMemoryRecordId.trim().length > 0 &&
    typeof reason === "string" &&
    reason.trim().length > 0 &&
    Array.isArray(evidenceRefs) &&
    typeof evidenceReviewedRef === "string" &&
    candidate.revisionReviewAssessmentId !== null &&
    evidenceReviewedRef === `review-assessment:${candidate.revisionReviewAssessmentId}` &&
    evidenceReviewedRef !== `review-assessment:${expected.reviewAssessmentId}` &&
    evidenceRefs.includes(evidenceReviewedRef) &&
    candidate.sourceClaimIds.every((id) => evidenceRefs.includes(id)) &&
    revision["doesNotProve"] ===
      "Reviewed authority upgrade preserves legacy history; it does not prove the replacement is broadly useful." &&
    revisionReview["reviewer"] === candidate.reviewer &&
    revisionReview["reason"] === reason &&
    revisionReview["sourceMemoryRecordId"] === sourceMemoryRecordId;
};

// fallow-ignore-next-line complexity -- accepted candidates permit only named gate/revision metadata additions with explicit shape checks
const canonicalCandidateMetadataMatches = (
  candidate: typeof memoryCandidates.$inferSelect,
  expected: typeof memoryCandidates.$inferInsert
): boolean => {
  if (candidate.status !== "accepted") {
    return jsonEquals(candidate.metadata, expected.metadata);
  }

  const baseMetadata = Object.fromEntries(
    Object.entries(candidate.metadata).filter(([key]) => !postPromotionMetadataKeys.has(key))
  );
  return jsonEquals(baseMetadata, expected.metadata) &&
    candidate.metadata["createdFromCandidateId"] === candidate.id &&
    jsonEquals(candidate.metadata["sourceClaimIds"], candidate.sourceClaimIds) &&
    reviewGateMetadataMatches(candidate.metadata["reviewGate"], candidate, expected) &&
    authorityRevisionMetadataMatches(candidate, expected) &&
    (candidate.metadata["promotionBasis"] === undefined ||
      typeof candidate.metadata["promotionBasis"] === "string");
};

interface HelpedSourceDecisionOutcome {
  sourceDecisionId: string;
  outcome: "helped";
  applicationId: string;
  appliedAt: IsoTimestamp;
  reason: string;
  evidenceRefs: string[];
  doesNotProve: string;
}

// fallow-ignore-next-line complexity -- fail-closed guards preserve each independent feedback and bundle authority rejection reason
const requireFeedbackAuthorityChain = async (
  tx: KrnDatabaseTransaction,
  input: Pick<ProposeReviewedHelpedMemoryCandidateInput, "feedbackDeltaId">
) => {
  const feedbackDelta = await tx.query.feedbackDeltas.findFirst({
    where: eq(feedbackDeltas.id, input.feedbackDeltaId)
  });

  if (feedbackDelta === undefined) {
    return blocked("feedback_delta_not_found");
  }
  if (
    feedbackDelta.captureChannel !== "evidence_feedback_v1" ||
    feedbackDelta.decisionPacketAuthorityAdmission !== "current_v1"
  ) {
    return blocked("feedback_delta_not_authoritative");
  }

  const feedbackReview = await tx.query.reviewAssessments.findFirst({
    where: eq(reviewAssessments.id, feedbackDelta.reviewAssessmentId)
  });
  if (feedbackReview === undefined) {
    return blocked("feedback_delta_not_authoritative");
  }
  const evidenceBundle = await tx.query.evidenceBundles.findFirst({
    where: eq(evidenceBundles.id, feedbackReview.evidenceBundleId)
  });
  if (
    evidenceBundle === undefined ||
    (evidenceBundle.status !== "captured" && evidenceBundle.status !== "verified")
  ) {
    return blocked("evidence_bundle_not_passed");
  }
  if (
    feedbackReview.captureChannel !== "evidence_feedback_v1" ||
    evidenceBundle.captureChannel !== "evidence_feedback_v1"
  ) {
    return blocked("feedback_delta_not_authoritative");
  }
  const feedbackBinding = decisionPacketBindingReadbackFromMetadata(feedbackDelta.metadata);
  const bundleBinding = decisionPacketBindingReadbackFromMetadata(evidenceBundle.metadata);
  if (
    feedbackBinding.status !== "bound_current" ||
    bundleBinding.status !== "bound_current" ||
    feedbackBinding.checksum !== bundleBinding.checksum ||
    feedbackBinding.evidenceRef !== bundleBinding.evidenceRef ||
    feedbackBinding.generatedAt !== bundleBinding.generatedAt ||
    feedbackBinding.sourceRunLifecycleRevision !== bundleBinding.sourceRunLifecycleRevision
  ) {
    return blocked("packet_binding_mismatch");
  }

  return {
    feedbackDelta,
    evidenceBundle
  };
};

const requireAcceptedReview = async (
  tx: KrnDatabaseTransaction,
  input: Pick<ProposeReviewedHelpedMemoryCandidateInput, "reviewAssessmentId">,
  evidenceBundleId: string
) => {
  const acceptedReview = await tx.query.reviewAssessments.findFirst({
    where: eq(reviewAssessments.id, input.reviewAssessmentId)
  });
  if (acceptedReview === undefined) {
    return blocked("review_assessment_not_found");
  }
  if (
    acceptedReview.status !== "accepted" ||
    acceptedReview.captureChannel !== "review_assess_v1"
  ) {
    return blocked("review_assessment_not_accepted");
  }
  if (acceptedReview.evidenceBundleId !== evidenceBundleId) {
    return blocked("review_evidence_bundle_mismatch");
  }

  return acceptedReview;
};

const requireFeedbackChain = async (
  tx: KrnDatabaseTransaction,
  input: ProposeReviewedHelpedMemoryCandidateInput
) => {
  const authority = await requireFeedbackAuthorityChain(tx, input);
  const acceptedReview = await requireAcceptedReview(
    tx,
    input,
    authority.evidenceBundle.id
  );

  return {
    feedbackDelta: authority.feedbackDelta,
    evidenceBundle: authority.evidenceBundle,
    acceptedReview
  };
};

const requireHelpedOutcome = (
  metadata: Record<string, unknown>,
  sourceDecisionId: string
): HelpedSourceDecisionOutcome => {
  const outcomes = sourceUsefulnessOutcomesFromMetadata(metadata)
    .filter((outcome) => outcome.sourceDecisionId === sourceDecisionId);

  if (outcomes.length === 0) {
    return blocked("source_outcome_missing");
  }
  if (outcomes.length !== 1) {
    return blocked("source_outcome_ambiguous");
  }

  const outcome = outcomes[0];
  if (outcome === undefined) {
    return blocked("source_outcome_missing");
  }
  if (outcome.outcome !== "helped") {
    return blocked("source_outcome_not_helped");
  }
  if (outcome.applicationId === undefined || outcome.appliedAt === undefined) {
    return blocked("application_reference_missing");
  }

  return {
    sourceDecisionId,
    outcome: "helped",
    applicationId: outcome.applicationId,
    appliedAt: outcome.appliedAt,
    reason: outcome.reason,
    evidenceRefs: outcome.evidenceRefs,
    doesNotProve: outcome.doesNotProve
  };
};

// fallow-ignore-next-line complexity -- one application identity guard compares every persisted packet, run, project, task, and timestamp coordinate
const requireCanonicalApplication = async (
  tx: KrnDatabaseTransaction,
  input: Pick<ProposeReviewedHelpedMemoryCandidateInput, "projectId" | "sourceDecisionId">,
  feedbackDelta: typeof feedbackDeltas.$inferSelect,
  evidenceBundle: typeof evidenceBundles.$inferSelect,
  outcome: ReturnType<typeof requireHelpedOutcome>
) => {
  const [linked] = await tx
    .select({ application: usefulnessApplications, harnessPlan: harnessPlans })
    .from(usefulnessApplications)
    .innerJoin(executionRuns, eq(executionRuns.id, usefulnessApplications.executionRunId))
    .innerJoin(harnessPlans, eq(harnessPlans.id, executionRuns.harnessPlanId))
    .where(eq(usefulnessApplications.applicationId, outcome.applicationId))
    .limit(1);
  const application = linked?.application;

  if (application === undefined || linked === undefined) {
    return blocked("application_not_found");
  }
  if (
    application.subjectKind !== "source_decision" ||
    application.subjectId !== input.sourceDecisionId ||
    application.projectId !== input.projectId ||
    application.executionRunId !== evidenceBundle.executionRunId ||
    application.taskContractId !== linked.harnessPlan.taskContractId ||
    application.appliedAt.toISOString() !== outcome.appliedAt
  ) {
    return blocked("application_identity_mismatch");
  }

  const feedbackBinding = decisionPacketBindingReadbackFromMetadata(feedbackDelta.metadata);

  if (feedbackBinding.status !== "bound_current") {
    return blocked("packet_binding_mismatch");
  }

  const bundleBinding = decisionPacketBindingReadbackFromMetadata(evidenceBundle.metadata);
  const bindings = [feedbackBinding, bundleBinding];
  if (bindings.some((binding) => (
    binding.status !== "bound_current" ||
    binding.checksum !== application.packetChecksum ||
    binding.evidenceRef !== `packet:${application.packetChecksum}` ||
    binding.generatedAt !== application.packetGeneratedAt.toISOString() ||
    binding.sourceRunLifecycleRevision !== application.sourceRunLifecycleRevision
  ))) {
    return blocked("packet_binding_mismatch");
  }
  if (!outcome.evidenceRefs.includes(`packet:${application.packetChecksum}`)) {
    return blocked("packet_binding_mismatch");
  }

  return application;
};

const requireSourceDecision = async (
  tx: KrnDatabaseTransaction,
  input: Pick<ProposeReviewedHelpedMemoryCandidateInput, "projectId" | "sourceDecisionId">
) => {
  const rows = await tx
    .select({
      sourceDecision: sourceDecisions,
      sourceClaim: sourceClaims,
      sourceDecisionEdge: sourceDecisionEdges
    })
    .from(sourceDecisions)
    .innerJoin(sourceClaims, eq(sourceDecisions.sourceClaimId, sourceClaims.id))
    .innerJoin(sourceArtifacts, eq(sourceClaims.sourceArtifactId, sourceArtifacts.id))
    .innerJoin(sourceDecisionEdges, and(
      eq(sourceDecisionEdges.sourceClaimId, sourceClaims.id),
      eq(sourceDecisionEdges.sourceDecisionId, sourceDecisions.id)
    ))
    .where(and(
      eq(sourceDecisions.id, input.sourceDecisionId),
      eq(sourceDecisions.projectId, input.projectId),
      eq(sourceArtifacts.projectId, input.projectId),
      eq(sourceDecisions.status, "adopt"),
      eq(sourceClaims.status, "accepted"),
      inArray(sourceDecisionEdges.supportType, decisionGradeSourceSupportTypes)
    ))
    .orderBy(
      desc(sourceDecisionEdges.createdAt),
      asc(sourceDecisionEdges.id)
    )
    .limit(1);
  const source = rows[0];

  if (source === undefined) {
    return blocked("source_decision_not_eligible");
  }

  return source;
};

// fallow-ignore-next-line complexity -- exact idempotent readback intentionally compares the complete canonical candidate shape field by field
const existingCandidateMatches = (
  candidate: typeof memoryCandidates.$inferSelect,
  input: ProposeReviewedHelpedMemoryCandidateInput,
  expected: typeof memoryCandidates.$inferInsert
): boolean =>
  candidate.projectId === input.projectId &&
  candidate.executionRunId === expected.executionRunId &&
  candidate.feedbackDeltaId === input.feedbackDeltaId &&
  candidate.reviewAssessmentId === input.reviewAssessmentId &&
  candidate.usefulnessApplicationId === expected.usefulnessApplicationId &&
  candidate.proposedBy === expected.proposedBy &&
  candidate.kind === expected.kind &&
  (candidate.status === expected.status || candidate.status === "accepted") &&
  candidate.summary === expected.summary &&
  candidate.body === expected.body &&
  candidate.owner === expected.owner &&
  candidate.confidence === expected.confidence &&
  candidate.applicationGuidance === expected.applicationGuidance &&
  candidate.invalidationRule === (expected.invalidationRule ?? null) &&
  candidate.isUserPreference === expected.isUserPreference &&
  candidate.validFrom.getTime() === expected.validFrom?.getTime() &&
  candidate.validUntil === (expected.validUntil ?? null) &&
  jsonEquals(candidate.sourceClaimIds, expected.sourceClaimIds) &&
  jsonEquals(candidate.sourceLineage, expected.sourceLineage) &&
  canonicalCandidateMetadataMatches(candidate, expected);

const requireMatchingExistingCandidate = (
  candidate: typeof memoryCandidates.$inferSelect,
  input: ProposeReviewedHelpedMemoryCandidateInput,
  expected: typeof memoryCandidates.$inferInsert
): ProposeReviewedHelpedMemoryCandidateResult["candidate"] => {
  if (!existingCandidateMatches(candidate, input, expected)) {
    return blocked("existing_candidate_identity_conflict");
  }

  return mapMemoryCandidate(candidate);
};

interface ReviewedHelpedProposalPlan {
  candidateValues: typeof memoryCandidates.$inferInsert;
  sourceClaimId: string;
  evidenceBundleId: string;
  usefulnessApplicationId: string;
  packetChecksum: string;
}

const buildReviewedHelpedProposalPlan = async (
  tx: KrnDatabaseTransaction,
  input: ProposeReviewedHelpedMemoryCandidateInput
): Promise<ReviewedHelpedProposalPlan> => {
  const feedback = await requireFeedbackChain(tx, input);
  const outcome = requireHelpedOutcome(feedback.feedbackDelta.metadata, input.sourceDecisionId);
  const application = await requireCanonicalApplication(
    tx,
    input,
    feedback.feedbackDelta,
    feedback.evidenceBundle,
    outcome
  );
  const source = await requireSourceDecision(tx, input);
  if (
    feedback.acceptedReview.metadata["sourceDecisionId"] !== source.sourceDecision.id ||
    feedback.acceptedReview.metadata["sourceClaimId"] !== source.sourceClaim.id ||
    feedback.acceptedReview.metadata["applicationId"] !== application.applicationId
  ) {
    return blocked("review_subject_mismatch");
  }

  const candidateEvidenceRefs = uniqueStrings([
    `feedback-delta:${feedback.feedbackDelta.id}`,
    `review-assessment:${feedback.acceptedReview.id}`,
    `evidence-bundle:${feedback.evidenceBundle.id}`,
    `application:${application.applicationId}`,
    `packet:${application.packetChecksum}`,
    ...outcome.evidenceRefs
  ]);
  const metadata = {
    candidateType: "reviewed_helped_source_decision",
    // fallow-ignore-next-line code-duplication -- reviewed learning deliberately retains the generic source-decision projection plus application authority
    sourceDecisionId: source.sourceDecision.id,
    sourceDecisionEdgeId: source.sourceDecisionEdge.id,
    sourceClaimId: source.sourceClaim.id,
    sourceAuthority: source.sourceClaim.sourceAuthority,
    supportType: source.sourceDecisionEdge.supportType,
    mechanism: source.sourceClaim.mechanism,
    krnImplication: source.sourceClaim.krnImplication,
    consumer: source.sourceDecision.consumer,
    falsifier: source.sourceDecision.falsifier,
    usefulnessOutcome: "helped",
    usefulnessReason: outcome.reason,
    usefulnessApplicationId: application.applicationId,
    reviewAssessmentId: feedback.acceptedReview.id,
    evidenceBundleId: feedback.evidenceBundle.id,
    packetChecksum: application.packetChecksum,
    doesNotProve: outcome.doesNotProve,
    reflectionCandidateEvidence: {
      provenance: "feedback_delta",
      evidenceRefs: candidateEvidenceRefs,
      doesNotProve: outcome.doesNotProve
    }
  };
  const candidateValues: typeof memoryCandidates.$inferInsert = {
    projectId: input.projectId,
    executionRunId: application.executionRunId,
    feedbackDeltaId: feedback.feedbackDelta.id,
    reviewAssessmentId: feedback.acceptedReview.id,
    usefulnessApplicationId: application.applicationId,
    proposedBy,
    kind: "procedure",
    status: "proposed",
    // fallow-ignore-next-line code-duplication -- candidate content stays aligned across generic and reviewed source-decision proposal paths
    summary: source.sourceDecision.decision,
    body: [
      source.sourceDecision.decision,
      "",
      `Mechanism: ${source.sourceClaim.mechanism}`,
      `KRN implication: ${source.sourceClaim.krnImplication}`,
      `Decision rationale: ${source.sourceDecision.rationale}`
    ].join("\n"),
    owner: source.sourceDecision.consumer,
    confidence: confidenceValue(source.sourceDecisionEdge.confidence),
    applicationGuidance: source.sourceDecision.decision,
    invalidationRule: source.sourceDecision.falsifier,
    sourceClaimIds: [source.sourceClaim.id],
    sourceLineage: [
      { sourceId: source.sourceClaim.id, note: source.sourceClaim.claim },
      { sourceId: source.sourceDecision.id, note: source.sourceDecision.rationale },
      { sourceId: source.sourceDecisionEdge.id, note: source.sourceDecisionEdge.notes },
      { sourceId: feedback.feedbackDelta.id, note: outcome.reason },
      { sourceId: feedback.acceptedReview.id, note: feedback.acceptedReview.summary },
      { sourceId: application.applicationId, note: "Canonical packet-bound helped application." }
    ],
    isUserPreference: false,
    validFrom: application.appliedAt,
    metadata
  };

  return {
    candidateValues,
    sourceClaimId: source.sourceClaim.id,
    evidenceBundleId: feedback.evidenceBundle.id,
    usefulnessApplicationId: application.applicationId,
    packetChecksum: application.packetChecksum
  };
};

const isReviewedHelpedLearningBlockedError = (
  error: unknown
): error is ReviewedHelpedLearningBlockedError =>
  error instanceof ReviewedHelpedLearningBlockedError;

const reviewMissingReasons: ReadonlySet<ReviewedHelpedLearningBlockedError["reason"]> = new Set([
  "review_assessment_not_found",
  "review_assessment_not_accepted"
]);

const sourceDecisionIdFromFeedback = (
  input: GetReviewedHelpedMemoryProposalEligibilityInput,
  metadata: Record<string, unknown>
): string => {
  if (input.sourceDecisionId !== undefined) {
    return input.sourceDecisionId;
  }

  const helpedOutcomes = sourceUsefulnessOutcomesFromMetadata(metadata)
    .filter((outcome) => outcome.outcome === "helped");
  if (helpedOutcomes.length === 0) {
    return blocked("source_outcome_missing");
  }
  if (helpedOutcomes.length !== 1) {
    return blocked("source_outcome_ambiguous");
  }

  const sourceDecisionId = helpedOutcomes[0]?.sourceDecisionId;
  if (sourceDecisionId === undefined || sourceDecisionId.trim().length === 0) {
    return blocked("source_outcome_missing");
  }

  return sourceDecisionId;
};

const acceptedReviewSubjectMatches = (
  review: typeof reviewAssessments.$inferSelect,
  input: {
    readonly sourceDecisionId: string;
    readonly sourceClaimId: string;
    readonly applicationId: string;
  }
): boolean =>
  review.metadata["sourceDecisionId"] === input.sourceDecisionId &&
  review.metadata["sourceClaimId"] === input.sourceClaimId &&
  review.metadata["applicationId"] === input.applicationId;

const findAcceptedReviewForProposal = async (
  tx: KrnDatabaseTransaction,
  input: {
    readonly evidenceBundleId: string;
    readonly sourceDecisionId: string;
    readonly sourceClaimId: string;
    readonly applicationId: string;
  }
) => {
  const reviews = await tx
    .select()
    .from(reviewAssessments)
    .where(and(
      eq(reviewAssessments.evidenceBundleId, input.evidenceBundleId),
      eq(reviewAssessments.captureChannel, "review_assess_v1"),
      eq(reviewAssessments.status, "accepted")
    ))
    .orderBy(desc(reviewAssessments.createdAt), asc(reviewAssessments.id));

  return reviews.find((review) => acceptedReviewSubjectMatches(review, input));
};

const reviewAssessmentIdForEligibility = async (
  tx: KrnDatabaseTransaction,
  input: GetReviewedHelpedMemoryProposalEligibilityInput,
  resolved: {
    readonly evidenceBundleId: string;
    readonly sourceDecisionId: string;
    readonly sourceClaimId: string;
    readonly applicationId: string;
  }
): Promise<string> => {
  if (input.reviewAssessmentId !== undefined) {
    const review = await requireAcceptedReview(
      tx,
      { reviewAssessmentId: input.reviewAssessmentId },
      resolved.evidenceBundleId
    );
    if (!acceptedReviewSubjectMatches(review, resolved)) {
      return blocked("review_subject_mismatch");
    }

    return input.reviewAssessmentId;
  }

  const discovered = await findAcceptedReviewForProposal(tx, resolved);
  if (discovered === undefined) {
    return blocked("review_assessment_not_found");
  }

  return discovered.id;
};

export const getReviewedHelpedMemoryProposalEligibility = async (
  db: KrnDatabase,
  input: GetReviewedHelpedMemoryProposalEligibilityInput
): Promise<ReviewedHelpedMemoryProposalEligibility> => db.transaction(async (tx) => {
  let resolvedSourceDecisionId = input.sourceDecisionId;

  try {
    const authority = await requireFeedbackAuthorityChain(tx, input);
    resolvedSourceDecisionId = sourceDecisionIdFromFeedback(input, authority.feedbackDelta.metadata);
    const outcome = requireHelpedOutcome(
      authority.feedbackDelta.metadata,
      resolvedSourceDecisionId
    );
    const application = await requireCanonicalApplication(
      tx,
      {
        projectId: input.projectId,
        sourceDecisionId: resolvedSourceDecisionId
      },
      authority.feedbackDelta,
      authority.evidenceBundle,
      outcome
    );
    const source = await requireSourceDecision(tx, {
      projectId: input.projectId,
      sourceDecisionId: resolvedSourceDecisionId
    });
    const reviewAssessmentId = await reviewAssessmentIdForEligibility(tx, input, {
      evidenceBundleId: authority.evidenceBundle.id,
      sourceDecisionId: resolvedSourceDecisionId,
      sourceClaimId: source.sourceClaim.id,
      applicationId: application.applicationId
    });
    const proposalInput = {
      projectId: input.projectId,
      feedbackDeltaId: input.feedbackDeltaId,
      reviewAssessmentId,
      sourceDecisionId: resolvedSourceDecisionId
    };
    const plan = await buildReviewedHelpedProposalPlan(tx, proposalInput);
    const existing = await tx.query.memoryCandidates.findFirst({
      where: eq(memoryCandidates.usefulnessApplicationId, plan.usefulnessApplicationId)
    });
    if (
      existing !== undefined &&
      !existingCandidateMatches(existing, proposalInput, plan.candidateValues)
    ) {
      return blocked("existing_candidate_identity_conflict");
    }

    return {
      status: "ready_to_propose",
      projectId: input.projectId,
      feedbackDeltaId: input.feedbackDeltaId,
      reviewAssessmentId,
      sourceDecisionId: resolvedSourceDecisionId,
      sourceClaimId: plan.sourceClaimId,
      evidenceBundleId: plan.evidenceBundleId,
      usefulnessApplicationId: plan.usefulnessApplicationId,
      packetChecksum: plan.packetChecksum,
      ...(existing === undefined ? {} : { existingCandidateId: existing.id })
    };
  } catch (error) {
    if (!isReviewedHelpedLearningBlockedError(error)) {
      throw error;
    }

    const base = {
      projectId: input.projectId,
      feedbackDeltaId: input.feedbackDeltaId,
      ...(resolvedSourceDecisionId === undefined
        ? {}
        : { sourceDecisionId: resolvedSourceDecisionId })
    };

    return reviewMissingReasons.has(error.reason)
      ? { status: "missing_review", ...base, reason: error.reason }
      : { status: "blocked_authority", ...base, reason: error.reason };
  }
}, {
  accessMode: "read only",
  isolationLevel: "repeatable read"
});

export const proposeReviewedHelpedMemoryCandidateOnce = async (
  db: KrnDatabase,
  input: ProposeReviewedHelpedMemoryCandidateInput
): Promise<ProposeReviewedHelpedMemoryCandidateResult> => db.transaction(async (tx) => {
  const plan = await buildReviewedHelpedProposalPlan(tx, input);

  await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`reviewed-helped:${plan.usefulnessApplicationId}`}, 0))`);

  const existing = await tx.query.memoryCandidates.findFirst({
    where: eq(memoryCandidates.usefulnessApplicationId, plan.usefulnessApplicationId)
  });
  if (existing !== undefined) {
    return {
      candidate: requireMatchingExistingCandidate(existing, input, plan.candidateValues),
      created: false,
      sourceClaimId: plan.sourceClaimId,
      evidenceBundleId: plan.evidenceBundleId,
      usefulnessApplicationId: plan.usefulnessApplicationId,
      packetChecksum: plan.packetChecksum
    };
  }

  const [inserted] = await tx
    .insert(memoryCandidates)
    .values(plan.candidateValues)
    .onConflictDoNothing({ target: memoryCandidates.usefulnessApplicationId })
    .returning();

  const resolved = inserted ?? await tx.query.memoryCandidates.findFirst({
    where: eq(memoryCandidates.usefulnessApplicationId, plan.usefulnessApplicationId)
  });
  if (resolved === undefined) {
    return blocked("existing_candidate_identity_conflict");
  }
  const candidate = requireMatchingExistingCandidate(
    resolved,
    input,
    plan.candidateValues
  );

  if (inserted !== undefined) {
    await tx.insert(outboxEvents).values({
      topic: "memory.candidate.created",
      payload: {
        memoryCandidateId: inserted.id,
        projectId: inserted.projectId,
        reviewedHelpedApplicationId: plan.usefulnessApplicationId
      }
    });
  }

  return {
    candidate,
    created: inserted !== undefined,
    sourceClaimId: plan.sourceClaimId,
    evidenceBundleId: plan.evidenceBundleId,
    usefulnessApplicationId: plan.usefulnessApplicationId,
    packetChecksum: plan.packetChecksum
  };
});
