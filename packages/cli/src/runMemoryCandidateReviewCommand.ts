import {
  parseMemoryPromotionInput
} from "@krn/schema";
import type {
  MemoryCandidate,
  SourceClaim
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

const sourceLimitLinesFromClaims = (sourceClaims: SourceClaim[]): string[] =>
  sourceClaims.length === 0
    ? []
    : [
        "Source limits:",
        ...sourceClaims.flatMap((sourceClaim) => [
          `sourceClaimId: ${sourceClaim.id}`,
          `doesNotProve: ${sourceClaim.doesNotProve}`
        ])
      ];

const sourceLimitLinesFromLineage = (candidate: MemoryCandidate): string[] =>
  candidate.sourceClaimIds.length > 0 || candidate.sourceLineage.length === 0
    ? []
    : [
        "Source limits:",
        ...candidate.sourceLineage.map((source) => `sourceLineage: ${source.sourceId}`),
        "doesNotProve: source lineage does not prove automatic application"
      ];

const sourceLimitLines = async (
  databaseRuntime: DatabaseRuntime,
  candidate: MemoryCandidate
): Promise<string[]> => {
  if (candidate.sourceClaimIds.length === 0) {
    return sourceLimitLinesFromLineage(candidate);
  }

  const sourceClaims: SourceClaim[] = [];

  for (const sourceClaimId of candidate.sourceClaimIds) {
    const sourceClaim = await databaseRuntime.sourceRepository.getSourceClaimById(sourceClaimId);

    if (sourceClaim === undefined) {
      throw new Error(`SourceClaim not found: ${sourceClaimId}`);
    }

    sourceClaims.push(sourceClaim);
  }

  return sourceLimitLinesFromClaims(sourceClaims);
};

const formatPromoted = (
  candidateId: string,
  memoryRecordId: string,
  review: ReturnType<typeof parseMemoryPromotionInput>,
  sourceLimits: string[]
): string =>
  [
    "KRN Memory Candidate Promote",
    "Persistence: enabled (Postgres, explicit --persist)",
    "",
    "Persisted IDs:",
    `memoryCandidate: ${candidateId}`,
    `memoryRecord: ${memoryRecordId}`,
    `decision: ${review.decision}`,
    `reviewer: ${review.reviewer}`,
    ...sourceLimits,
    "No memory application recorded"
  ].join("\n");

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

  const databaseRuntime = await createRuntime(runtime, "krn memory candidate promote");

  try {
    const candidate = await databaseRuntime.memoryRepository.getMemoryCandidateById(
      reviewInput.candidateId
    );

    if (candidate === undefined) {
      throw new Error(`MemoryCandidate not found: ${reviewInput.candidateId}`);
    }

    const limits = await sourceLimitLines(databaseRuntime, candidate);
    const memoryRecord = await databaseRuntime.memoryRepository.promoteMemoryCandidate({
      candidateId: reviewInput.candidateId,
      reviewer: reviewInput.reviewer,
      decision: "accepted",
      metadata: reviewInput.metadata
    });

    return {
      stdout: formatPromoted(reviewInput.candidateId, memoryRecord.id, reviewInput, limits)
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
