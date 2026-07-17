import {
  parseMemoryPromotionInput
} from "@krn/core";
import {
  promoteAntiMemoryCandidateThroughGate
} from "@krn/harness";
import {
  buildRejectedMemoryPromotionInput,
  createMemoryCommandDatabaseRuntime,
  assertAntiMemoryCandidateProject,
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

export interface MemoryAntiReviewCommandRuntime extends BaseCommandRuntime {
  command: MemoryAntiReviewCommand;
  createDatabaseRuntime?: CreateMemoryCommandDatabaseRuntime;
}

export interface MemoryAntiReviewCommandResult {
  stdout: string;
}

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
    `reason: ${requireMemoryReviewRejectionReason(review)}`,
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
    `reason: ${requireMemoryReviewRejectionReason(review)}`,
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

  const databaseRuntime = await createMemoryCommandDatabaseRuntime(
    runtime,
    "KRN_DATABASE_URL is required for krn memory anti promote --persist",
    command.projectId
  );

  try {
    const sourceRepository = databaseRuntime.sourceRepository;
    const getSourceClaimForProject = sourceRepository.getSourceClaimForProject;

    if (getSourceClaimForProject === undefined) {
      throw new Error(
        "Project-scoped SourceClaim lookup is required before promoting anti-memory candidates. No AntiMemoryRecord created."
      );
    }

    await assertAntiMemoryCandidateProject(
      databaseRuntime,
      reviewInput.candidateId,
      command.projectId
    );

    const result = await promoteAntiMemoryCandidateThroughGate({
      memoryRepository: databaseRuntime.memoryRepository,
      sourceRepository: {
        getSourceClaimForProject(projectId, sourceClaimId) {
          return getSourceClaimForProject.call(sourceRepository, projectId, sourceClaimId);
        }
      },
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
        sourceClaimIds: toReviewedSourceClaimIds(result.reviewedSourceClaims)
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
  const reviewInput = buildRejectedMemoryPromotionInput(command);

  if (!command.persist) {
    return {
      stdout: formatRejectPreview(reviewInput)
    };
  }

  const databaseRuntime = await createMemoryCommandDatabaseRuntime(
    runtime,
    "KRN_DATABASE_URL is required for krn memory anti reject --persist",
    command.projectId
  );
  const reason = requireMemoryReviewRejectionReason(reviewInput);

  try {
    await assertAntiMemoryCandidateProject(
      databaseRuntime,
      reviewInput.candidateId,
      command.projectId
    );

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
