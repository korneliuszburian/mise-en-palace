import {
  parseMemoryPromotionInput
} from "@krn/core";
import {
  promoteMemoryCandidateThroughGate
} from "@krn/harness";
import {
  buildRejectedMemoryPromotionInput,
  createMemoryCommandDatabaseRuntime,
  requireMemoryReviewRejectionReason,
  toReviewedSourceClaimIds
} from "./memory-command-support.js";
import type {
  CreateMemoryCommandDatabaseRuntime
} from "./memory-command-support.js";
import type {
  CliCommand
} from "./parse-args.js";
import type {
  BaseCommandRuntime
} from "./command-runtime-support.js";

type MemoryCandidatePromoteCommand = Extract<
  CliCommand,
  { kind: "memoryCandidatePromote" }
>;
type MemoryCandidateRejectCommand = Extract<
  CliCommand,
  { kind: "memoryCandidateReject" }
>;
type MemoryCandidateReviewCommand =
  | MemoryCandidatePromoteCommand
  | MemoryCandidateRejectCommand;

export interface MemoryCandidateReviewCommandRuntime extends BaseCommandRuntime {
  command: MemoryCandidateReviewCommand;
  createDatabaseRuntime?: CreateMemoryCommandDatabaseRuntime;
}

export interface MemoryCandidateReviewCommandResult {
  stdout: string;
}

const formatPromotePreview = (
  review: ReturnType<typeof parseMemoryPromotionInput>,
  untrustedSourceReviewRef: string | undefined
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
    ...(untrustedSourceReviewRef === undefined
      ? []
      : [`untrustedSourceReviewRef: ${untrustedSourceReviewRef}`]),
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
    `reason: ${requireMemoryReviewRejectionReason(review)}`,
    "No MemoryRecord created",
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
    `reason: ${requireMemoryReviewRejectionReason(review)}`,
    "No MemoryRecord created",
    "No memory application recorded"
  ].join("\n");

const formatPromoted = (input: {
  candidateId: string;
  memoryRecordId: string;
  reviewer: string;
  evidenceReviewedRef: string;
  untrustedSourceReviewRef: string | undefined;
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
    ...(input.untrustedSourceReviewRef === undefined
      ? []
      : [`untrustedSourceReviewRef: ${input.untrustedSourceReviewRef}`]),
    ...(input.sourceClaimIds.length === 0
      ? []
      : [
          "Reviewed source claims:",
          ...input.sourceClaimIds.map((sourceClaimId) => `sourceClaimId: ${sourceClaimId}`)
        ]),
    "No memory application recorded"
  ].join("\n");

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
      stdout: formatPromotePreview(
        reviewInput,
        trimmedOptional(command.untrustedSourceReviewRef)
      )
    };
  }

  const evidenceReviewedRef = command.evidenceReviewedRef?.trim();

  if (evidenceReviewedRef === undefined || evidenceReviewedRef.length === 0) {
    throw new Error(
      "evidenceReviewedRef is required before promoting memory candidates. No MemoryRecord created."
    );
  }

  const databaseRuntime = await createMemoryCommandDatabaseRuntime(
    runtime,
    "KRN_DATABASE_URL is required for krn memory candidate promote --persist"
  );
  const untrustedSourceReviewRef = trimmedOptional(command.untrustedSourceReviewRef);

  try {
    const result = await promoteMemoryCandidateThroughGate({
      memoryRepository: databaseRuntime.memoryRepository,
      sourceRepository: databaseRuntime.sourceRepository,
      review: {
        candidateId: reviewInput.candidateId,
        reviewer: reviewInput.reviewer,
        evidenceReviewedRef,
        ...(untrustedSourceReviewRef === undefined ? {} : { untrustedSourceReviewRef }),
        metadata: reviewInput.metadata
      }
    });

    return {
      stdout: formatPromoted({
        candidateId: reviewInput.candidateId,
        memoryRecordId: result.memoryRecord.id,
        reviewer: reviewInput.reviewer,
        evidenceReviewedRef,
        untrustedSourceReviewRef,
        sourceClaimIds: toReviewedSourceClaimIds(result.reviewedSourceClaims)
      })
    };
  } finally {
    await databaseRuntime.close();
  }
};

const trimmedOptional = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();

  return trimmed === undefined || trimmed.length === 0 ? undefined : trimmed;
};

const runReject = async (
  runtime: MemoryCandidateReviewCommandRuntime,
  command: MemoryCandidateRejectCommand
): Promise<MemoryCandidateReviewCommandResult> => {
  const reviewInput = buildRejectedMemoryPromotionInput(command);

  if (!command.persist) {
    return {
      stdout: formatRejectPreview(reviewInput)
    };
  }

  const databaseRuntime = await createMemoryCommandDatabaseRuntime(
    runtime,
    "KRN_DATABASE_URL is required for krn memory candidate reject --persist"
  );
  const reason = requireMemoryReviewRejectionReason(reviewInput);

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
