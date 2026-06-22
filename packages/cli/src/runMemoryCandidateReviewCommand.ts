import {
  parseMemoryPromotionInput
} from "@krn/schema";
import {
  promoteMemoryCandidateThroughGate
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

export type MemoryCandidatePromoteCommand = Extract<
  CliCommand,
  { kind: "memoryCandidatePromote" }
>;
export type MemoryCandidateRejectCommand = Extract<
  CliCommand,
  { kind: "memoryCandidateReject" }
>;
export type MemoryCandidateReviewCommand =
  | MemoryCandidatePromoteCommand
  | MemoryCandidateRejectCommand;

export interface MemoryCandidateReviewCommandRuntime {
  env: Record<string, string | undefined>;
  now(): string;
  createId(prefix: string): string;
  command: MemoryCandidateReviewCommand;
  createDatabaseRuntime?: CreateMemoryCandidateReviewDatabaseRuntime;
}

export interface MemoryCandidateReviewCommandResult {
  stdout: string;
}

export type CreateMemoryCandidateReviewDatabaseRuntime = (
  input: DatabaseRuntimeInput
) => Promise<DatabaseRuntime>;

const defaultWorkspaceSlug = "local";
const defaultProjectSlug = "mise-en-palace";

const formatPromotePreview = (
  review: ReturnType<typeof parseMemoryPromotionInput>
): string =>
  [
    "KRN Memory Candidate Promote",
    "Persistence: disabled (no-store preview; use --persist to write)",
    "DB writes: none",
    "",
    "Memory candidate review preview:",
    `candidateId: ${review.candidateId}`,
    `reviewer: ${review.reviewer}`,
    `decision: ${review.decision}`,
    "No MemoryRecord created",
    "No memory application recorded"
  ].join("\n");

const formatRejectPreview = (
  review: ReturnType<typeof parseMemoryPromotionInput>
): string =>
  [
    "KRN Memory Candidate Reject",
    "Persistence: disabled (no-store preview; use --persist to write)",
    "DB writes: none",
    "",
    "Memory candidate review preview:",
    `candidateId: ${review.candidateId}`,
    `reviewer: ${review.reviewer}`,
    `decision: ${review.decision}`,
    `reason: ${rejectionReason(review)}`,
    "No MemoryRecord created",
    "No memory application recorded"
  ].join("\n");

const rejectionReason = (review: ReturnType<typeof parseMemoryPromotionInput>): string => {
  if (review.rejectionReason === undefined) {
    throw new Error("rejectionReason is required when decision is rejected");
  }

  return review.rejectionReason;
};

const formatRejected = (
  review: ReturnType<typeof parseMemoryPromotionInput>,
  status: string
): string =>
  [
    "KRN Memory Candidate Reject",
    "Persistence: enabled (Postgres, explicit --persist)",
    "",
    "Persisted IDs:",
    `memoryCandidate: ${review.candidateId}`,
    `status: ${status}`,
    `reviewer: ${review.reviewer}`,
    `reason: ${rejectionReason(review)}`,
    "No MemoryRecord created",
    "No memory application recorded"
  ].join("\n");

const formatPromoted = (input: {
  candidateId: string;
  memoryRecordId: string;
  reviewer: string;
  evidenceReviewedRef: string;
  sourceClaimIds: string[];
}): string =>
  [
    "KRN Memory Candidate Promote",
    "Persistence: enabled (Postgres, explicit --persist)",
    "Review gate: passed",
    "",
    "Persisted IDs:",
    `memoryCandidate: ${input.candidateId}`,
    `memoryRecord: ${input.memoryRecordId}`,
    `reviewer: ${input.reviewer}`,
    `evidenceReviewedRef: ${input.evidenceReviewedRef}`,
    ...(input.sourceClaimIds.length === 0
      ? []
      : [
          "Reviewed source claims:",
          ...input.sourceClaimIds.map((sourceClaimId) => `sourceClaimId: ${sourceClaimId}`)
        ]),
    "No memory application recorded"
  ].join("\n");

const createRuntime = async (
  runtime: MemoryCandidateReviewCommandRuntime,
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
  runtime: MemoryCandidateReviewCommandRuntime,
  command: MemoryCandidatePromoteCommand
): Promise<MemoryCandidateReviewCommandResult> => {
  const reviewInput = parseMemoryPromotionInput({
    candidateId: command.candidateId,
    reviewer: command.reviewer,
    decision: command.decision,
    metadata: command.metadata
  });

  if (reviewInput.decision !== "accepted") {
    throw new Error("krn memory candidate promote requires --decision accepted");
  }

  if (!command.persist) {
    return {
      stdout: formatPromotePreview(reviewInput)
    };
  }

  const evidenceReviewedRef = command.evidenceReviewedRef?.trim();

  if (evidenceReviewedRef === undefined || evidenceReviewedRef.length === 0) {
    throw new Error(
      "evidenceReviewedRef is required before promoting memory candidates. No MemoryRecord created."
    );
  }

  const databaseRuntime = await createRuntime(runtime, "krn memory candidate promote");

  try {
    const result = await promoteMemoryCandidateThroughGate({
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
        memoryRecordId: result.memoryRecord.id,
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
  runtime: MemoryCandidateReviewCommandRuntime,
  command: MemoryCandidateRejectCommand
): Promise<MemoryCandidateReviewCommandResult> => {
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

  const databaseRuntime = await createRuntime(runtime, "krn memory candidate reject");
  const reason = rejectionReason(reviewInput);

  try {
    const memoryCandidate = await databaseRuntime.memoryRepository.rejectMemoryCandidate({
      candidateId: reviewInput.candidateId,
      reviewer: reviewInput.reviewer,
      reason,
      metadata: reviewInput.metadata
    });

    return {
      stdout: formatRejected(reviewInput, memoryCandidate.status)
    };
  } finally {
    await databaseRuntime.close();
  }
};

export const runMemoryCandidateReviewCommand = async (
  runtime: MemoryCandidateReviewCommandRuntime
): Promise<MemoryCandidateReviewCommandResult> =>
  runtime.command.kind === "memoryCandidatePromote"
    ? runPromote(runtime, runtime.command)
    : runReject(runtime, runtime.command);
