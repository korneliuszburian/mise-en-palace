import {
  parseMemoryPromotionInput
} from "@krn/core";
import {
  applyReviewedHelpedAuthorityUpgradeThroughGate,
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
  untrustedSourceReviewRef: string | undefined,
  revision: { sourceMemoryRecordId: string; reason: string } | undefined,
  authorityBinding?: {
    memoryCandidateId: string;
    fingerprint: string;
  }
): string =>
  [
    "KRN Memory Candidate Promote",
    revision === undefined
      ? "Persistence: disabled (no-store preview; use --persist to write)"
      : "Persistence: disabled (read-only predecessor preview; use --persist to write)",
    "DB writes: none",
    "",
    "Memory candidate review preview:",
    `candidateId: ${review.candidateId}`,
    `reviewer: ${review.reviewer}`,
    `decision: ${review.decision}`,
    ...(untrustedSourceReviewRef === undefined
      ? []
      : [`untrustedSourceReviewRef: ${untrustedSourceReviewRef}`]),
    ...(revision === undefined
      ? []
      : [
          `sourceMemoryRecordId: ${revision.sourceMemoryRecordId}`,
          `reason: ${revision.reason}`,
          "Revision mode: candidate promotion and predecessor supersession are one transaction",
          ...(authorityBinding === undefined
            ? []
            : [
                `authorityUpgradeMemoryRecordId: ${revision.sourceMemoryRecordId}`,
                `authorityUpgradeMemoryCandidateId: ${authorityBinding.memoryCandidateId}`,
                `authorityUpgradePredecessorFingerprint: ${authorityBinding.fingerprint}`
              ])
        ]),
    "No MemoryRecord created",
    "No memory application recorded",
    revision === undefined
      ? "Does not prove: preview does not read the store or assert revision eligibility"
      : "Does not prove: readback fingerprint is not an accepted predecessor review"
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
  supersededMemoryRecordId?: string;
}): string =>
  [
    "KRN Memory Candidate Promote",
    "Persistence: enabled (Postgres, explicit --persist)",
    "Review gate: passed",
    "",
    "Persisted IDs:",
    `memoryCandidate: ${input.candidateId}`,
    `memoryRecord: ${input.memoryRecordId}`,
    ...(input.supersededMemoryRecordId === undefined
      ? []
      : [`supersededMemoryRecord: ${input.supersededMemoryRecordId}`]),
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

// fallow-ignore-next-line complexity -- one review command exhaustively routes normal promotion and atomic predecessor revision through the same gate
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
    const sourceMemoryRecordId = trimmedOptional(command.sourceMemoryRecordId);
    const reason = trimmedOptional(command.reason);
    const revision = sourceMemoryRecordId === undefined || reason === undefined
      ? undefined
      : { sourceMemoryRecordId, reason };

    if (revision === undefined) {
      return {
        stdout: formatPromotePreview(
          reviewInput,
          trimmedOptional(command.untrustedSourceReviewRef),
          undefined
        )
      };
    }

    const databaseRuntime = await createMemoryCommandDatabaseRuntime(
      runtime,
      "KRN_DATABASE_URL is required for reviewed predecessor preview"
    );

    try {
      if (databaseRuntime.memoryRepository.getAuthorityUpgradePredecessorPreview === undefined) {
        throw new Error("Database runtime does not support authority upgrade predecessor preview");
      }
      const predecessor = await databaseRuntime.memoryRepository.getAuthorityUpgradePredecessorPreview({
        memoryRecordId: revision.sourceMemoryRecordId
      });
      if (predecessor === undefined) {
        throw new Error(`Memory record not found: ${revision.sourceMemoryRecordId}`);
      }

      return {
        stdout: formatPromotePreview(
          reviewInput,
          trimmedOptional(command.untrustedSourceReviewRef),
          revision,
          {
            memoryCandidateId: predecessor.memoryCandidate.id,
            fingerprint: predecessor.fingerprint
          }
        )
      };
    } finally {
      await databaseRuntime.close();
    }
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
  const sourceMemoryRecordId = trimmedOptional(command.sourceMemoryRecordId);
  const reason = trimmedOptional(command.reason);

  try {
    const sourceRepository = databaseRuntime.sourceRepository;
    const getSourceClaimForProject = sourceRepository.getSourceClaimForProject;

    if (getSourceClaimForProject === undefined) {
      throw new Error(
        "Project-scoped SourceClaim lookup is required before promoting memory candidates. No MemoryRecord created."
      );
    }

    const gateInput = {
      memoryRepository: databaseRuntime.memoryRepository,
      sourceRepository: {
        getSourceClaimForProject(projectId: string, sourceClaimId: string) {
          return getSourceClaimForProject.call(sourceRepository, projectId, sourceClaimId);
        }
      },
      review: {
        candidateId: reviewInput.candidateId,
        reviewer: reviewInput.reviewer,
        evidenceReviewedRef,
        ...(untrustedSourceReviewRef === undefined ? {} : { untrustedSourceReviewRef }),
        metadata: reviewInput.metadata
      }
    };
    const applyReviewedMemoryRevision =
      databaseRuntime.memoryRepository.applyReviewedMemoryRevision;

    const result = sourceMemoryRecordId === undefined || reason === undefined
      ? await promoteMemoryCandidateThroughGate(gateInput)
      : await (async () => {
          if (applyReviewedMemoryRevision === undefined) {
            throw new Error(
              "Atomic reviewed memory revision is unavailable. No MemoryRecord created."
            );
          }

          return applyReviewedHelpedAuthorityUpgradeThroughGate({
            ...gateInput,
            memoryRepository: {
              getMemoryCandidateById:
                databaseRuntime.memoryRepository.getMemoryCandidateById.bind(
                  databaseRuntime.memoryRepository
                ),
              applyReviewedMemoryRevision: applyReviewedMemoryRevision.bind(
                databaseRuntime.memoryRepository
              )
            },
            sourceMemoryRecordId,
            reason
          });
        })();

    return {
      stdout: formatPromoted({
        candidateId: reviewInput.candidateId,
        memoryRecordId: result.memoryRecord.id,
        reviewer: reviewInput.reviewer,
        evidenceReviewedRef,
        untrustedSourceReviewRef,
        sourceClaimIds: toReviewedSourceClaimIds(result.reviewedSourceClaims),
        ...(!("supersededMemoryRecord" in result)
          ? {}
          : { supersededMemoryRecordId: result.supersededMemoryRecord.id })
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
