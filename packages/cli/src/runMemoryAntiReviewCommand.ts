import {
  parseMemoryPromotionInput
} from "@krn/schema";
import {
  promoteAntiMemoryCandidateThroughGate
} from "@krn/harness";
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

type MemoryAntiPromoteCommand = Extract<
  CliCommand,
  { kind: "memoryAntiPromote" }
>;
type MemoryAntiRejectCommand = Extract<
  CliCommand,
  { kind: "memoryAntiReject" }
>;
type MemoryAntiReviewCommand =
  | MemoryAntiPromoteCommand
  | MemoryAntiRejectCommand;

export interface MemoryAntiReviewCommandRuntime {
  env: Record<string, string | undefined>;
  now(): string;
  createId(prefix: string): string;
  command: MemoryAntiReviewCommand;
  createDatabaseRuntime?: CreateMemoryAntiReviewDatabaseRuntime;
}

export interface MemoryAntiReviewCommandResult {
  stdout: string;
}

type CreateMemoryAntiReviewDatabaseRuntime = (
  input: DatabaseRuntimeInput
) => Promise<DatabaseRuntime>;

const defaultWorkspaceSlug = "local";
const defaultProjectSlug = "mise-en-palace";

const rejectionReason = (review: ReturnType<typeof parseMemoryPromotionInput>): string => {
  if (review.rejectionReason === undefined) {
    throw new Error("rejectionReason is required when decision is rejected");
  }

  return review.rejectionReason;
};

const formatPromotePreview = (
  review: ReturnType<typeof parseMemoryPromotionInput>
): string =>
  [
    "KRN Memory Anti Promote",
    "Persistence: disabled (no-store preview; use --persist to write)",
    "DB writes: none",
    "",
    "Anti-memory candidate review preview:",
    `candidateId: ${review.candidateId}`,
    `reviewer: ${review.reviewer}`,
    `decision: ${review.decision}`,
    "No AntiMemoryRecord created"
  ].join("\n");

const formatRejectPreview = (
  review: ReturnType<typeof parseMemoryPromotionInput>
): string =>
  [
    "KRN Memory Anti Reject",
    "Persistence: disabled (no-store preview; use --persist to write)",
    "DB writes: none",
    "",
    "Anti-memory candidate review preview:",
    `candidateId: ${review.candidateId}`,
    `reviewer: ${review.reviewer}`,
    `decision: ${review.decision}`,
    `reason: ${rejectionReason(review)}`,
    "No AntiMemoryRecord created"
  ].join("\n");

const formatRejected = (
  review: ReturnType<typeof parseMemoryPromotionInput>,
  status: string
): string =>
  [
    "KRN Memory Anti Reject",
    "Persistence: enabled (Postgres, explicit --persist)",
    "",
    "Persisted IDs:",
    `antiMemoryCandidate: ${review.candidateId}`,
    `status: ${status}`,
    `reviewer: ${review.reviewer}`,
    `reason: ${rejectionReason(review)}`,
    "No AntiMemoryRecord created"
  ].join("\n");

const formatPromoted = (input: {
  candidateId: string;
  antiMemoryRecordId: string;
  reviewer: string;
  evidenceReviewedRef: string;
  sourceClaimIds: string[];
}): string =>
  [
    "KRN Memory Anti Promote",
    "Persistence: enabled (Postgres, explicit --persist)",
    "Review gate: passed",
    "",
    "Persisted IDs:",
    `antiMemoryCandidate: ${input.candidateId}`,
    `antiMemoryRecord: ${input.antiMemoryRecordId}`,
    `reviewer: ${input.reviewer}`,
    `evidenceReviewedRef: ${input.evidenceReviewedRef}`,
    ...(input.sourceClaimIds.length === 0
      ? []
      : [
          "Reviewed source claims:",
          ...input.sourceClaimIds.map((sourceClaimId) => `sourceClaimId: ${sourceClaimId}`)
        ])
  ].join("\n");

const createRuntime = async (
  runtime: MemoryAntiReviewCommandRuntime,
  persistCommandName: string
): Promise<DatabaseRuntime> => {
  const databaseUrl = runtime.env.KRN_DATABASE_URL?.trim();

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error(`KRN_DATABASE_URL is required for ${persistCommandName} --persist`);
  }

  const createDatabase = runtime.createDatabaseRuntime ?? createDatabaseRuntime;

  return createDatabase({
    databaseUrl,
    workspaceSlug: defaultWorkspaceSlug,
    projectSlug: defaultProjectSlug,
    now: runtime.now,
    createId: runtime.createId
  });
};

const runPromote = async (
  runtime: MemoryAntiReviewCommandRuntime,
  command: MemoryAntiPromoteCommand
): Promise<MemoryAntiReviewCommandResult> => {
  const reviewInput = parseMemoryPromotionInput({
    candidateId: command.candidateId,
    reviewer: command.reviewer,
    decision: command.decision,
    metadata: command.metadata
  });

  if (reviewInput.decision !== "accepted") {
    throw new Error("krn memory anti promote requires --decision accepted");
  }

  if (!command.persist) {
    return {
      stdout: formatPromotePreview(reviewInput)
    };
  }

  const evidenceReviewedRef = command.evidenceReviewedRef?.trim();

  if (evidenceReviewedRef === undefined || evidenceReviewedRef.length === 0) {
    throw new Error(
      "evidenceReviewedRef is required before promoting anti-memory candidates. No AntiMemoryRecord created."
    );
  }

  const databaseRuntime = await createRuntime(runtime, "krn memory anti promote");

  try {
    const result = await promoteAntiMemoryCandidateThroughGate({
      memoryRepository: databaseRuntime.memoryRepository,
      sourceRepository: databaseRuntime.sourceRepository,
      review: {
        candidateId: reviewInput.candidateId,
        reviewer: reviewInput.reviewer,
        evidenceReviewedRef,
        metadata: reviewInput.metadata
      }
    });

    return {
      stdout: formatPromoted({
        candidateId: reviewInput.candidateId,
        antiMemoryRecordId: result.antiMemoryRecord.id,
        reviewer: reviewInput.reviewer,
        evidenceReviewedRef,
        sourceClaimIds: result.reviewedSourceClaims.map((sourceClaim) => sourceClaim.id)
      })
    };
  } finally {
    await databaseRuntime.close();
  }
};

const runReject = async (
  runtime: MemoryAntiReviewCommandRuntime,
  command: MemoryAntiRejectCommand
): Promise<MemoryAntiReviewCommandResult> => {
  const reviewInput = parseMemoryPromotionInput({
    candidateId: command.candidateId,
    reviewer: command.reviewer,
    decision: "rejected",
    rejectionReason: command.reason,
    metadata: command.metadata
  });

  if (!command.persist) {
    return {
      stdout: formatRejectPreview(reviewInput)
    };
  }

  const databaseRuntime = await createRuntime(runtime, "krn memory anti reject");
  const reason = rejectionReason(reviewInput);

  try {
    const antiMemoryCandidate = await databaseRuntime.memoryRepository.rejectAntiMemoryCandidate({
      candidateId: reviewInput.candidateId,
      reviewer: reviewInput.reviewer,
      reason,
      metadata: reviewInput.metadata
    });

    return {
      stdout: formatRejected(reviewInput, antiMemoryCandidate.status)
    };
  } finally {
    await databaseRuntime.close();
  }
};

export const runMemoryAntiReviewCommand = async (
  runtime: MemoryAntiReviewCommandRuntime
): Promise<MemoryAntiReviewCommandResult> =>
  runtime.command.kind === "memoryAntiPromote"
    ? runPromote(runtime, runtime.command)
    : runReject(runtime, runtime.command);
