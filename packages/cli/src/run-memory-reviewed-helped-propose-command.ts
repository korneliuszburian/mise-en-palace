import {
  noStorePreviewLabel,
  persistenceLine,
  postgresPersistedLabel
} from "./command-runtime-support.js";
import type {
  BaseCommandRuntime
} from "./command-runtime-support.js";
import {
  createMemoryCommandDatabaseRuntime
} from "./memory-command-support.js";
import type {
  CreateMemoryCommandDatabaseRuntime
} from "./memory-command-support.js";
import type {
  CliCommand
} from "./parse-args.js";

type ReviewedHelpedProposeCommand = Extract<
  CliCommand,
  { kind: "memoryReviewedHelpedPropose" }
>;

export interface MemoryReviewedHelpedProposeCommandRuntime extends BaseCommandRuntime {
  command: ReviewedHelpedProposeCommand;
  createDatabaseRuntime?: CreateMemoryCommandDatabaseRuntime;
}

export interface MemoryReviewedHelpedProposeCommandResult {
  stdout: string;
}

// fallow-ignore-next-line code-duplication -- this command owns distinct identity labels and reviewed-learning error language
const required = (value: string | undefined, label: string): string => {
  const trimmed = value?.trim();

  if (trimmed === undefined || trimmed.length === 0) {
    throw new Error(`${label} is required for krn memory learn propose`);
  }

  return trimmed;
};

const formatPreview = (input: {
  projectId?: string;
  feedbackDeltaId: string;
  reviewAssessmentId: string;
  sourceDecisionId: string;
}): string => [
  "KRN Memory Learn Propose",
  persistenceLine(noStorePreviewLabel),
  "DB reads: none",
  "DB writes: none",
  "Eligibility: not asserted in no-store preview",
  "",
  ...(input.projectId === undefined ? [] : [`projectId: ${input.projectId}`]),
  `feedbackDeltaId: ${input.feedbackDeltaId}`,
  `reviewAssessmentId: ${input.reviewAssessmentId}`,
  `sourceDecisionId: ${input.sourceDecisionId}`,
  "MemoryCandidate created: no",
  "MemoryRecord created: no"
].join("\n");

export const runMemoryReviewedHelpedProposeCommand = async (
  runtime: MemoryReviewedHelpedProposeCommandRuntime
): Promise<MemoryReviewedHelpedProposeCommandResult> => {
  const feedbackDeltaId = required(runtime.command.feedbackDeltaId, "--feedback-delta-id");
  const reviewAssessmentId = required(
    runtime.command.reviewAssessmentId,
    "--review-assessment-id"
  );
  const sourceDecisionId = required(runtime.command.sourceDecisionId, "--source-decision-id");
  const projectId = runtime.command.projectId?.trim();

  if (!runtime.command.persist) {
    return {
      stdout: formatPreview({
        ...(projectId === undefined || projectId.length === 0 ? {} : { projectId }),
        feedbackDeltaId,
        reviewAssessmentId,
        sourceDecisionId
      })
    };
  }

  const databaseRuntime = await createMemoryCommandDatabaseRuntime(
    runtime,
    "KRN_DATABASE_URL is required for krn memory learn propose --persist",
    projectId
  );

  try {
    const propose = databaseRuntime.memoryRepository.proposeReviewedHelpedMemoryCandidateOnce;
    if (propose === undefined) {
      throw new Error("Reviewed helped MemoryCandidate proposal is unavailable");
    }
    const result = await propose.call(databaseRuntime.memoryRepository, {
      projectId: databaseRuntime.projectId,
      feedbackDeltaId,
      reviewAssessmentId,
      sourceDecisionId
    });

    return {
      stdout: [
        "KRN Memory Learn Propose",
        persistenceLine(postgresPersistedLabel),
        "Eligibility: reviewed exact helped",
        "MemoryRecord created: no",
        "",
        "Persisted IDs:",
        `memoryCandidate: ${result.candidate.id}`,
        `created: ${result.created ? "yes" : "no (idempotent readback)"}`,
        `projectId: ${result.candidate.projectId}`,
        `runId: ${result.candidate.executionRunId ?? ""}`,
        `feedbackDeltaId: ${result.candidate.feedbackDeltaId ?? ""}`,
        `reviewAssessmentId: ${result.candidate.reviewAssessmentId ?? ""}`,
        `sourceDecisionId: ${sourceDecisionId}`,
        `sourceClaimId: ${result.sourceClaimId}`,
        `usefulnessApplicationId: ${result.usefulnessApplicationId}`,
        `evidenceBundleId: ${result.evidenceBundleId}`,
        `packetChecksum: ${result.packetChecksum}`
      ].join("\n")
    };
  } finally {
    await databaseRuntime.close();
  }
};
