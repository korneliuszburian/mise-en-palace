import type {
  NormalizedReviewOutcome,
  NormalizedReviewRisk,
  ReviewAssessmentStatus,
  ReviewFinding
} from "@krn/core";
import {
  createDatabaseRuntime
} from "./databaseRuntime.js";
import type {
  DatabaseRuntime,
  DatabaseRuntimeInput
} from "./databaseRuntime.js";
import type {
  CliCommand
} from "./parseArgs.js";

export type ReviewAssessCommand = Extract<CliCommand, { kind: "reviewAssess" }>;

export interface ReviewAssessCommandRuntime {
  env: Record<string, string | undefined>;
  now(): string;
  createId(prefix: string): string;
  command: ReviewAssessCommand;
  createDatabaseRuntime?: CreateReviewAssessDatabaseRuntime;
}

export interface ReviewAssessCommandResult {
  stdout: string;
}

export type CreateReviewAssessDatabaseRuntime = (
  input: DatabaseRuntimeInput
) => Promise<DatabaseRuntime>;

const defaultWorkspaceSlug = "local";
const defaultProjectSlug = "mise-en-palace";

const reviewStatuses = new Set<ReviewAssessmentStatus>([
  "pending",
  "accepted",
  "changes_requested",
  "rejected"
]);

const outcomes = new Set<NormalizedReviewOutcome>([
  "accepted",
  "changes_requested",
  "rejected",
  "pending",
  "needs_changes"
]);

const riskValues = new Set<NormalizedReviewRisk>(["low", "medium", "high"]);
const findingSeverities = new Set<ReviewFinding["severity"]>(["low", "medium", "high"]);

const requiredText = (
  value: string | undefined,
  label: string
): string => {
  const trimmed = value?.trim();

  if (trimmed === undefined || trimmed.length === 0) {
    throw new Error(`${label} is required for krn review assess`);
  }

  return trimmed;
};

const parseReviewStatus = (value: string | undefined): ReviewAssessmentStatus => {
  const status = value?.trim() ?? "pending";

  if (!reviewStatuses.has(status as ReviewAssessmentStatus)) {
    throw new Error("--status must be pending, accepted, changes_requested, or rejected");
  }

  return status as ReviewAssessmentStatus;
};

const parseOutcome = (value: string | undefined, status: ReviewAssessmentStatus): NormalizedReviewOutcome => {
  const outcome = value?.trim() ?? status;

  if (!outcomes.has(outcome as NormalizedReviewOutcome)) {
    throw new Error("--outcome must be accepted, changes_requested, rejected, pending, or needs_changes");
  }

  return outcome as NormalizedReviewOutcome;
};

const parseRisk = (
  value: string | undefined,
  label: string
): NormalizedReviewRisk => {
  const risk = value?.trim() ?? "low";

  if (!riskValues.has(risk as NormalizedReviewRisk)) {
    throw new Error(`${label} must be low, medium, or high`);
  }

  return risk as NormalizedReviewRisk;
};

const parseFinding = (input: string): ReviewFinding => {
  const separatorIndex = input.indexOf(":");

  if (separatorIndex <= 0 || separatorIndex === input.length - 1) {
    throw new Error("--finding must use severity:message");
  }

  const severity = input.slice(0, separatorIndex).trim();
  const message = input.slice(separatorIndex + 1).trim();

  if (!findingSeverities.has(severity as ReviewFinding["severity"])) {
    throw new Error("--finding severity must be low, medium, or high");
  }

  if (message.length === 0) {
    throw new Error("--finding message is required");
  }

  return {
    severity: severity as ReviewFinding["severity"],
    message
  };
};

const formatPreview = (
  evidenceBundleId: string,
  reviewer: string,
  status: ReviewAssessmentStatus,
  summary: string,
  findings: readonly ReviewFinding[]
): string =>
  [
    "KRN Review Assess",
    "Persistence: disabled (no-store preview; use --persist to write)",
    "DB writes: none",
    "",
    "Review assessment preview:",
    `evidenceBundleId: ${evidenceBundleId}`,
    `reviewer: ${reviewer}`,
    `status: ${status}`,
    `summary: ${summary}`,
    `findings: ${findings.length}`,
    "FeedbackDelta created: no",
    "Memory mutation: none",
    "MemoryRecord created: no"
  ].join("\n");

const formatPersisted = (
  reviewAssessmentId: string,
  feedbackDeltaId: string,
  status: ReviewAssessmentStatus,
  outcome: NormalizedReviewOutcome,
  reviewBurden: NormalizedReviewRisk,
  diffRisk: NormalizedReviewRisk,
  correctionLabels: readonly string[]
): string =>
  [
    "KRN Review Assess",
    "Persistence: enabled (Postgres, explicit --persist)",
    "",
    "Persisted IDs:",
    `reviewAssessment: ${reviewAssessmentId}`,
    `feedbackDelta: ${feedbackDeltaId}`,
    `status: ${status}`,
    `outcome: ${outcome}`,
    `reviewBurden: ${reviewBurden}`,
    `diffRisk: ${diffRisk}`,
    `correctionLabels: ${correctionLabels.join(",")}`,
    "Memory mutation: none",
    "MemoryRecord created: no"
  ].join("\n");

export const runReviewAssessCommand = async (
  runtime: ReviewAssessCommandRuntime
): Promise<ReviewAssessCommandResult> => {
  const command = runtime.command;
  const evidenceBundleId = requiredText(command.evidenceBundleId, "--evidence-bundle-id");
  const reviewer = requiredText(command.reviewer, "--reviewer");
  const summary = requiredText(command.summary, "--summary");
  const status = parseReviewStatus(command.status);
  const outcome = parseOutcome(command.outcome, status);
  const reviewBurden = parseRisk(command.reviewBurden, "--review-burden");
  const diffRisk = parseRisk(command.diffRisk, "--diff-risk");
  const correctionLabels = command.correctionLabels
    .map((label) => label.trim())
    .filter((label) => label.length > 0);
  const findings = command.findings.map(parseFinding);
  const metadata = {
    ...command.metadata,
    outcome,
    reviewBurden,
    diffRisk,
    correctionLabels
  };

  if (!command.persist) {
    return {
      stdout: formatPreview(evidenceBundleId, reviewer, status, summary, findings)
    };
  }

  const databaseUrl = runtime.env.KRN_DATABASE_URL?.trim();

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error("KRN_DATABASE_URL is required for krn review assess --persist");
  }

  const createRuntime = runtime.createDatabaseRuntime ?? createDatabaseRuntime;
  const databaseRuntime = await createRuntime({
    databaseUrl,
    workspaceSlug: defaultWorkspaceSlug,
    projectSlug: defaultProjectSlug,
    now: runtime.now,
    createId: runtime.createId
  });

  try {
    const reviewAssessment = await databaseRuntime.harnessRunRepository.createReviewAssessment({
      evidenceBundleId,
      status,
      reviewer,
      summary,
      findings,
      metadata
    });
    const feedbackDelta = await databaseRuntime.harnessRunRepository.createFeedbackDelta({
      reviewAssessmentId: reviewAssessment.id,
      status: "candidate",
      memoryCandidates: [],
      sourceDecisions: [],
      evalCandidates: [],
      metadata: {
        ...metadata,
        memoryRecordMutation: "none"
      }
    });

    return {
      stdout: formatPersisted(
        reviewAssessment.id,
        feedbackDelta.id,
        status,
        outcome,
        reviewBurden,
        diffRisk,
        correctionLabels
      )
    };
  } finally {
    await databaseRuntime.close();
  }
};
