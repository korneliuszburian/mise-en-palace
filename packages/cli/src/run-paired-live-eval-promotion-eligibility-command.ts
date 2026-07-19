import {
  getReviewedHelpedMemoryProposalEligibility
} from "@krn/db/adapters";
import type {
  ListPairedLiveEvalEvidenceInput,
  PairedLiveEvalEvidenceRecord
} from "@krn/core";
import type {
  GetReviewedHelpedMemoryProposalEligibilityInput,
  ReviewedHelpedLearningBlockedReason,
  ReviewedHelpedMemoryProposalEligibility
} from "@krn/core/repositories";
import {
  createPairedLiveEvalReadbackRuntime
} from "./paired-live-eval-readback-runtime.js";

export interface PairedLiveEvalPromotionEligibilityCommand {
  readonly projectId: string;
  readonly runId?: string;
  readonly candidateId?: string;
  readonly sourceDecisionId?: string;
  readonly reviewAssessmentId?: string;
  readonly limit?: number;
  readonly format: "text" | "json";
}

interface PairedLiveEvalPromotionEligibilityDatabaseRuntime {
  listPairedLiveEvalEvidence(
    input: ListPairedLiveEvalEvidenceInput
  ): Promise<PairedLiveEvalEvidenceRecord[]>;
  getReviewedHelpedMemoryProposalEligibility(
    input: GetReviewedHelpedMemoryProposalEligibilityInput
  ): Promise<ReviewedHelpedMemoryProposalEligibility>;
  close(): Promise<void>;
}

export type CreatePairedLiveEvalPromotionEligibilityDatabaseRuntime = (input: {
  readonly databaseUrl: string;
}) => Promise<PairedLiveEvalPromotionEligibilityDatabaseRuntime>;

export interface PairedLiveEvalPromotionEligibilityCommandRuntime {
  readonly env: Record<string, string | undefined>;
  now(): string;
  createId(prefix: string): string;
  readonly command: PairedLiveEvalPromotionEligibilityCommand;
  readonly createEligibilityRuntime?: CreatePairedLiveEvalPromotionEligibilityDatabaseRuntime;
}

export interface PairedLiveEvalPromotionEligibilityCommandResult {
  readonly stdout: string;
}

type PromotionEligibilityCandidate =
  | {
      readonly candidateId: string;
      readonly runId: string;
      readonly feedbackDeltaId?: string;
      readonly artifactStatus: PairedLiveEvalEvidenceRecord["artifactStatus"];
      readonly outcome: PairedLiveEvalEvidenceRecord["outcome"];
      readonly usefulnessOutcome: PairedLiveEvalEvidenceRecord["usefulnessOutcome"];
      readonly status: "not_helped";
      readonly reason: string;
    }
  | {
      readonly candidateId: string;
      readonly runId: string;
      readonly feedbackDeltaId?: string;
      readonly artifactStatus: PairedLiveEvalEvidenceRecord["artifactStatus"];
      readonly outcome: PairedLiveEvalEvidenceRecord["outcome"];
      readonly usefulnessOutcome: PairedLiveEvalEvidenceRecord["usefulnessOutcome"];
      readonly status: "blocked_authority";
      readonly reason: ReviewedHelpedLearningBlockedReason;
      readonly sourceDecisionId?: string;
    }
  | {
      readonly candidateId: string;
      readonly runId: string;
      readonly feedbackDeltaId: string;
      readonly artifactStatus: PairedLiveEvalEvidenceRecord["artifactStatus"];
      readonly outcome: PairedLiveEvalEvidenceRecord["outcome"];
      readonly usefulnessOutcome: PairedLiveEvalEvidenceRecord["usefulnessOutcome"];
      readonly status: "missing_review";
      readonly reason: ReviewedHelpedLearningBlockedReason;
      readonly sourceDecisionId?: string;
      readonly evidenceBundleId?: string;
      readonly usefulnessApplicationId?: string;
    }
  | {
      readonly candidateId: string;
      readonly runId: string;
      readonly feedbackDeltaId: string;
      readonly artifactStatus: PairedLiveEvalEvidenceRecord["artifactStatus"];
      readonly outcome: PairedLiveEvalEvidenceRecord["outcome"];
      readonly usefulnessOutcome: PairedLiveEvalEvidenceRecord["usefulnessOutcome"];
      readonly status: "ready_to_propose";
      readonly reviewAssessmentId: string;
      readonly sourceDecisionId: string;
      readonly sourceClaimId: string;
      readonly evidenceBundleId: string;
      readonly usefulnessApplicationId: string;
      readonly packetChecksum: string;
      readonly existingCandidateId?: string;
      readonly proposeCommand: string;
      readonly proposeCommandArgs: readonly string[];
    };

interface PairedLiveEvalPromotionEligibilityReadback {
  readonly kind: "krn.pairedLiveEvalPromotionEligibility.v1";
  readonly access: "read_only";
  readonly mutation: "none";
  readonly projectId: string;
  readonly returnedCandidateCount: number;
  readonly candidates: readonly PromotionEligibilityCandidate[];
  readonly proof: {
    readonly proves: readonly string[];
    readonly doesNotProve: readonly string[];
  };
}

const localDatabaseUrl = "postgres://krn:krn@localhost:54329/krn";

const missingDatabaseUrlMessage = [
  "KRN_DATABASE_URL is required for krn run eval-promotion-eligibility",
  `Next action: export KRN_DATABASE_URL=${localDatabaseUrl} and run pnpm db:migrate && pnpm db:ready before readback`,
  "Does not prove: setting KRN_DATABASE_URL does not prove reviewed memory proposal eligibility exists"
].join("\n");

const createDefaultEligibilityRuntime = async (input: {
  readonly databaseUrl: string;
}): Promise<PairedLiveEvalPromotionEligibilityDatabaseRuntime> =>
  createPairedLiveEvalReadbackRuntime({
    databaseUrl: input.databaseUrl,
    extra: (db) => ({
      getReviewedHelpedMemoryProposalEligibility: (eligibilityInput) =>
        getReviewedHelpedMemoryProposalEligibility(db, eligibilityInput)
    })
  });

const resolveRuntime = (
  runtime: PairedLiveEvalPromotionEligibilityCommandRuntime,
  databaseUrl: string
): Promise<PairedLiveEvalPromotionEligibilityDatabaseRuntime> => (
  runtime.createEligibilityRuntime ?? createDefaultEligibilityRuntime
)({
  databaseUrl
});

const repositoryFilters = (
  command: PairedLiveEvalPromotionEligibilityCommand
): ListPairedLiveEvalEvidenceInput => ({
  projectId: command.projectId,
  ...(command.runId === undefined ? {} : { runId: command.runId }),
  ...(command.candidateId === undefined ? {} : { candidateId: command.candidateId }),
  ...(command.limit === undefined ? {} : { limit: command.limit })
});

const notHelpedReason = (record: PairedLiveEvalEvidenceRecord): string =>
  `paired-live evidence is ${record.artifactStatus}/${record.outcome}/${record.usefulnessOutcome}, not passed/win/helped`;

const proposalCommandArgs = (
  eligibility: Extract<ReviewedHelpedMemoryProposalEligibility, { status: "ready_to_propose" }>
): readonly string[] => [
  "krn",
  "memory",
  "learn",
  "propose",
  "--project",
  eligibility.projectId,
  "--feedback-delta-id",
  eligibility.feedbackDeltaId,
  "--review-assessment-id",
  eligibility.reviewAssessmentId,
  "--source-decision-id",
  eligibility.sourceDecisionId,
  "--persist"
];

const baseCandidateFields = (record: PairedLiveEvalEvidenceRecord) => ({
  candidateId: record.candidateId,
  runId: record.runId,
  ...(record.feedbackDeltaId === undefined ? {} : { feedbackDeltaId: record.feedbackDeltaId }),
  artifactStatus: record.artifactStatus,
  outcome: record.outcome,
  usefulnessOutcome: record.usefulnessOutcome
});

const blockedMissingFeedbackCandidate = (
  record: PairedLiveEvalEvidenceRecord
): PromotionEligibilityCandidate => ({
  ...baseCandidateFields(record),
  status: "blocked_authority",
  reason: "feedback_delta_not_found"
});

const readyToProposeCandidate = (
  record: PairedLiveEvalEvidenceRecord,
  eligibility: Extract<ReviewedHelpedMemoryProposalEligibility, { status: "ready_to_propose" }>
): PromotionEligibilityCandidate => {
  const args = proposalCommandArgs(eligibility);

  return {
    ...baseCandidateFields(record),
    feedbackDeltaId: eligibility.feedbackDeltaId,
    status: "ready_to_propose",
    reviewAssessmentId: eligibility.reviewAssessmentId,
    sourceDecisionId: eligibility.sourceDecisionId,
    sourceClaimId: eligibility.sourceClaimId,
    evidenceBundleId: eligibility.evidenceBundleId,
    usefulnessApplicationId: eligibility.usefulnessApplicationId,
    packetChecksum: eligibility.packetChecksum,
    ...(eligibility.existingCandidateId === undefined
      ? {}
      : { existingCandidateId: eligibility.existingCandidateId }),
    proposeCommand: args.join(" "),
    proposeCommandArgs: args
  };
};

const missingReviewCandidate = (
  record: PairedLiveEvalEvidenceRecord,
  eligibility: Extract<ReviewedHelpedMemoryProposalEligibility, { status: "missing_review" }>
): PromotionEligibilityCandidate => ({
  ...baseCandidateFields(record),
  feedbackDeltaId: eligibility.feedbackDeltaId,
  status: "missing_review",
  reason: eligibility.reason,
  ...(eligibility.sourceDecisionId === undefined
    ? {}
    : { sourceDecisionId: eligibility.sourceDecisionId }),
  ...(eligibility.evidenceBundleId === undefined
    ? {}
    : { evidenceBundleId: eligibility.evidenceBundleId }),
  ...(eligibility.usefulnessApplicationId === undefined
    ? {}
    : { usefulnessApplicationId: eligibility.usefulnessApplicationId })
});

const retainedCleanupMissingReviewCandidate = (
  record: PairedLiveEvalEvidenceRecord,
  eligibility: Extract<ReviewedHelpedMemoryProposalEligibility, { status: "blocked_authority" }>
): PromotionEligibilityCandidate | undefined => {
  if (
    eligibility.reason !== "feedback_delta_not_found" ||
    record.feedbackDeltaId === undefined
  ) {
    return undefined;
  }

  return {
    ...baseCandidateFields(record),
    feedbackDeltaId: record.feedbackDeltaId,
    status: "missing_review",
    reason: "review_assessment_not_found",
    ...(eligibility.sourceDecisionId === undefined
      ? {}
      : { sourceDecisionId: eligibility.sourceDecisionId })
  };
};

const blockedAuthorityCandidate = (
  record: PairedLiveEvalEvidenceRecord,
  eligibility: Extract<ReviewedHelpedMemoryProposalEligibility, { status: "blocked_authority" }>
): PromotionEligibilityCandidate => ({
  ...baseCandidateFields(record),
  status: "blocked_authority",
  reason: eligibility.reason,
  ...(eligibility.sourceDecisionId === undefined
    ? {}
    : { sourceDecisionId: eligibility.sourceDecisionId })
});

const candidateFromEligibility = (
  record: PairedLiveEvalEvidenceRecord,
  eligibility: ReviewedHelpedMemoryProposalEligibility
): PromotionEligibilityCandidate => {
  switch (eligibility.status) {
    case "ready_to_propose":
      return readyToProposeCandidate(record, eligibility);
    case "missing_review":
      return missingReviewCandidate(record, eligibility);
    case "blocked_authority":
      return retainedCleanupMissingReviewCandidate(record, eligibility) ??
        blockedAuthorityCandidate(record, eligibility);
  }
};

const eligibilityForRecord = async (
  runtime: PairedLiveEvalPromotionEligibilityDatabaseRuntime,
  command: PairedLiveEvalPromotionEligibilityCommand,
  record: PairedLiveEvalEvidenceRecord
): Promise<PromotionEligibilityCandidate> => {
  if (
    record.artifactStatus !== "passed" ||
    record.outcome !== "win" ||
    record.usefulnessOutcome !== "helped"
  ) {
    return {
      ...baseCandidateFields(record),
      status: "not_helped",
      reason: notHelpedReason(record)
    };
  }
  if (record.feedbackDeltaId === undefined) {
    return blockedMissingFeedbackCandidate(record);
  }

  const eligibility = await runtime.getReviewedHelpedMemoryProposalEligibility({
    projectId: command.projectId,
    feedbackDeltaId: record.feedbackDeltaId,
    ...(command.sourceDecisionId === undefined
      ? {}
      : { sourceDecisionId: command.sourceDecisionId }),
    ...(command.reviewAssessmentId === undefined
      ? {}
      : { reviewAssessmentId: command.reviewAssessmentId })
  });

  return candidateFromEligibility(record, eligibility);
};

const buildReadback = async (
  runtime: PairedLiveEvalPromotionEligibilityDatabaseRuntime,
  command: PairedLiveEvalPromotionEligibilityCommand,
  records: readonly PairedLiveEvalEvidenceRecord[]
): Promise<PairedLiveEvalPromotionEligibilityReadback> => {
  const candidates = await Promise.all(
    records.map((record) => eligibilityForRecord(runtime, command, record))
  );

  return {
    kind: "krn.pairedLiveEvalPromotionEligibility.v1",
    access: "read_only",
    mutation: "none",
    projectId: command.projectId,
    returnedCandidateCount: candidates.length,
    candidates,
    proof: {
      proves: [
        "paired-live eval evidence was read from durable paired_live_eval_evidence rows for the selected identity",
        "ready_to_propose was checked against the existing reviewed-helped memory proposal authority path",
        "not_helped, missing_review, and blocked_authority states write no memory/source truth"
      ],
      doesNotProve: [
        "that krn memory learn propose was executed",
        "promotion of a MemoryCandidate into MemoryRecord, SourceClaim, or SourceDecision authority",
        "source truth, future memory usefulness, arbitrary-repository portability, product readiness, or a KRN eval win"
      ]
    }
  };
};

const renderCandidateText = (candidate: PromotionEligibilityCandidate): readonly string[] => [
  `- ${candidate.candidateId}`,
  `  runId: ${candidate.runId}`,
  `  feedbackDeltaId: ${candidate.feedbackDeltaId ?? "unknown"}`,
  `  outcome: ${candidate.outcome}`,
  `  usefulnessOutcome: ${candidate.usefulnessOutcome}`,
  `  status: ${candidate.status}`,
  ...(
    candidate.status === "ready_to_propose"
      ? [
          `  reviewAssessmentId: ${candidate.reviewAssessmentId}`,
          `  sourceDecisionId: ${candidate.sourceDecisionId}`,
          `  sourceClaimId: ${candidate.sourceClaimId}`,
          `  evidenceBundleId: ${candidate.evidenceBundleId}`,
          `  usefulnessApplicationId: ${candidate.usefulnessApplicationId}`,
          `  command: ${candidate.proposeCommand}`
        ]
      : [`  reason: ${candidate.reason}`]
  )
];

const renderReadbackText = (
  readback: PairedLiveEvalPromotionEligibilityReadback
): string => [
  "Paired-live eval promotion eligibility:",
  `- projectId: ${readback.projectId}`,
  `- returnedCandidates: ${readback.returnedCandidateCount}`,
  ...(
    readback.candidates.length === 0
      ? ["- candidates: none"]
      : readback.candidates.flatMap(renderCandidateText)
  ),
  "Proof:",
  ...readback.proof.proves.map((proof) => `- proves: ${proof}`),
  ...readback.proof.doesNotProve.map((nonProof) => `- doesNotProve: ${nonProof}`)
].join("\n");

export const runPairedLiveEvalPromotionEligibilityCommand = async (
  runtime: PairedLiveEvalPromotionEligibilityCommandRuntime
): Promise<PairedLiveEvalPromotionEligibilityCommandResult> => {
  const databaseUrl = runtime.env.KRN_DATABASE_URL?.trim();
  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error(missingDatabaseUrlMessage);
  }

  const eligibilityRuntime = await resolveRuntime(runtime, databaseUrl);
  try {
    const records = await eligibilityRuntime.listPairedLiveEvalEvidence(
      repositoryFilters(runtime.command)
    );
    const readback = await buildReadback(eligibilityRuntime, runtime.command, records);

    return {
      stdout: runtime.command.format === "json"
        ? `${JSON.stringify(readback, null, 2)}\n`
        : `${renderReadbackText(readback)}\n`
    };
  } finally {
    await eligibilityRuntime.close();
  }
};
