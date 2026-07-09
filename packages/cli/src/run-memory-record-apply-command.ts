import {
  buildFeedbackRecommendationReadback,
  parseMemoryApplicationInput,
  parseMemoryFeedbackEventInput
} from "@krn/core";
import type {
  AntiMemoryCandidate,
  FeedbackRecommendationOutcome,
  FeedbackRecommendationReadback,
  MemoryApplication,
  MemoryApplicationOutcome,
  MemoryFeedbackEvent,
  MemoryFeedbackEventType
} from "@krn/core";
import {
  defaultWorkspaceSlug,
  defaultProjectSlug,
  createDatabaseRuntime
} from "./database-runtime.js";
import type {
  DatabaseRuntime,
  DatabaseRuntimeInput
} from "./database-runtime.js";
import type {
  CliCommand
} from "./parse-args.js";
import type {
  BaseCommandRuntime
} from "./command-runtime-support.js";
import {
  authorizePacketUsefulness
} from "./packet-usefulness-authorization.js";

type MemoryRecordApplyCommand = Extract<CliCommand, { kind: "memoryRecordApply" }>;

export interface MemoryRecordApplyCommandRuntime extends BaseCommandRuntime {
  command: MemoryRecordApplyCommand;
  createDatabaseRuntime?: CreateMemoryRecordApplyDatabaseRuntime;
}

export interface MemoryRecordApplyCommandResult {
  stdout: string;
}

type CreateMemoryRecordApplyDatabaseRuntime = (
  input: DatabaseRuntimeInput
) => Promise<DatabaseRuntime>;


const defaultExpectedUse = (command: MemoryRecordApplyCommand): string =>
  `Operator explicitly applied memory record ${command.memoryId ?? ""} to run ${command.runId ?? ""}`;

const feedbackEventTypeForOutcome = (
  outcome: MemoryApplicationOutcome
): MemoryFeedbackEventType | undefined => {
  if (outcome === "hurt") {
    return "demoted";
  }

  if (outcome === "stale") {
    return "stale_detected";
  }

  return undefined;
};

const feedbackRecommendationOutcome = (
  outcome: MemoryApplicationOutcome
): FeedbackRecommendationOutcome => outcome === "hurt" ? "hurt" : outcome;

const memoryFeedbackDoesNotProve =
  "This feedback recommendation does not mutate Memory Core, prove memory truth, or prove future activation quality.";

const memoryFeedbackRecommendationReadback = (input: {
  memoryRecordId: string;
  outcome: MemoryApplicationOutcome;
  reason: string;
  evidenceRefs?: readonly string[];
}): FeedbackRecommendationReadback =>
  buildFeedbackRecommendationReadback({
    subjectKind: "memory_record",
    subjectId: input.memoryRecordId,
    outcome: feedbackRecommendationOutcome(input.outcome),
    reason: input.reason,
    ...(input.evidenceRefs === undefined ? {} : { evidenceRefs: input.evidenceRefs }),
    doesNotProve: memoryFeedbackDoesNotProve
  });

const formatFeedbackRecommendation = (
  readback: FeedbackRecommendationReadback
): string[] => [
  "Feedback recommendation:",
  `recommendationOutcome: ${readback.outcome}`,
  ...readback.recommendations.map((recommendation) =>
    `recommendation: ${recommendation.action} | requiresReview=${recommendation.requiresReview} | ${recommendation.reason}`
  ),
  `recommendationMutation: ${readback.mutation}`,
  `recommendationDoesNotProve: ${readback.doesNotProve}`
];

const formatPreview = (
  application: ReturnType<typeof parseMemoryApplicationInput>
): string => {
  const recommendation = memoryFeedbackRecommendationReadback({
    memoryRecordId: application.memoryRecordId,
    outcome: application.outcome,
    reason: application.notes ?? application.expectedUse
  });

  return [
    "KRN Memory Record Apply",
    "Persistence: disabled (no-store preview; use --persist to write)",
    "DB writes: none",
    "",
    "Memory application preview:",
    `memoryRecordId: ${application.memoryRecordId}`,
    `runId: ${application.executionRunId}`,
    `outcome: ${application.outcome}`,
    `notes: ${application.notes}`,
    "Memory Core mutation: none",
    ...formatFeedbackRecommendation(recommendation),
    feedbackEventTypeForOutcome(application.outcome) === undefined
      ? "Feedback event: none"
      : "Feedback event: would be recorded",
    feedbackEventTypeForOutcome(application.outcome) === undefined
      ? "Follow-up candidate: none"
      : "Follow-up candidate: anti-memory candidate would be proposed"
  ].join("\n");
};

const formatPersisted = (
  application: MemoryApplication,
  feedbackEventId: string | undefined,
  antiMemoryCandidate: AntiMemoryCandidate | undefined,
  recommendation: FeedbackRecommendationReadback
): string =>
  [
    "KRN Memory Record Apply",
    "Persistence: enabled (Postgres, explicit --persist)",
    "",
    "Persisted IDs:",
    `memoryApplication: ${application.id}`,
    `memoryRecord: ${application.memoryRecordId}`,
    ...(application.executionRunId === undefined ? [] : [`runId: ${application.executionRunId}`]),
    ...(application.outcome === undefined ? [] : [`outcome: ${application.outcome}`]),
    "Memory Core mutation: none",
    ...formatFeedbackRecommendation(recommendation),
    feedbackEventId === undefined
      ? "Feedback event: none"
      : `memoryFeedbackEvent: ${feedbackEventId}`,
    antiMemoryCandidate === undefined
      ? "Follow-up candidate: none"
      : `antiMemoryCandidate: ${antiMemoryCandidate.id}`,
    antiMemoryCandidate === undefined
      ? "Candidate reviewability: not_applicable"
      : "Candidate reviewability: review"
  ].join("\n");

const proposeAntiMemoryCandidate = async (
  databaseRuntime: DatabaseRuntime,
  input: {
    memoryRecord: Awaited<ReturnType<DatabaseRuntime["memoryRepository"]["getMemoryRecordById"]>>;
    memoryApplication: MemoryApplication;
    feedbackEvent: MemoryFeedbackEvent;
    outcome: Extract<MemoryApplicationOutcome, "hurt" | "stale">;
    notes: string;
  }
): Promise<AntiMemoryCandidate | undefined> => {
  const memoryRecord = input.memoryRecord;

  if (memoryRecord === undefined || memoryRecord.sourceLineage.length === 0) {
    return undefined;
  }

  return databaseRuntime.memoryRepository.createAntiMemoryCandidate({
    projectId: memoryRecord.projectId,
    ...(input.memoryApplication.executionRunId === undefined
      ? {}
      : { executionRunId: input.memoryApplication.executionRunId }),
    proposedBy: "krn-memory-feedback",
    key: `feedback:${memoryRecord.key}:${input.outcome}`,
    rejectedClaim: memoryRecord.summary,
    reason: input.notes,
    invalidatedBySourceClaimIds: memoryRecord.sourceLineage.map((lineage) => lineage.sourceId),
    appliesTo: memoryRecord.key,
    ...(memoryRecord.invalidationRule === undefined
      ? {}
      : { mayRevisitWhen: memoryRecord.invalidationRule }),
    summary: `Review ${input.outcome} memory feedback for ${memoryRecord.key}`,
    body: `Memory application ${input.memoryApplication.id} recorded outcome ${input.outcome}: ${input.notes}`,
    owner: memoryRecord.owner,
    confidence: input.outcome === "stale" ? 70 : 60,
    sourceLineage: memoryRecord.sourceLineage,
    metadata: {
      memoryRecordId: memoryRecord.id,
      memoryApplicationId: input.memoryApplication.id,
      memoryFeedbackEventId: input.feedbackEvent.id,
      applicationOutcome: input.outcome,
      doesNotProve: "This candidate does not prove the memory should be invalidated or demoted without review.",
      reflectionCandidateEvidence: {
        provenance: "local_operator_note",
        evidenceRefs: [
          `memory-application:${input.memoryApplication.id}`,
          `memory-feedback-event:${input.feedbackEvent.id}`
        ],
        doesNotProve:
          "Operator feedback does not prove the anti-memory candidate should be promoted without review."
      }
    }
  });
};

const createRuntime = async (
  runtime: MemoryRecordApplyCommandRuntime
): Promise<DatabaseRuntime> => {
  const databaseUrl = runtime.env.KRN_DATABASE_URL?.trim();

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error("KRN_DATABASE_URL is required for krn memory record apply --persist");
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

export const runMemoryRecordApplyCommand = async (
  runtime: MemoryRecordApplyCommandRuntime
): Promise<MemoryRecordApplyCommandResult> => {
  const command = runtime.command;
  const applicationInput = parseMemoryApplicationInput({
    memoryRecordId: command.memoryId,
    executionRunId: command.runId,
    taskContractId: command.taskContractId,
    contextAssemblyId: command.contextAssemblyId,
    expectedUse: command.expectedUse ?? defaultExpectedUse(command),
    outcome: command.outcome,
    notes: command.notes,
    metadata: command.metadata
  });

  if (!command.persist) {
    return {
      stdout: formatPreview(applicationInput)
    };
  }

  const databaseRuntime = await createRuntime(runtime);

  try {
    const memoryRecord = await databaseRuntime.memoryRepository.getMemoryRecordById(
      applicationInput.memoryRecordId
    );

    if (memoryRecord === undefined) {
      throw new Error(`MemoryRecord not found: ${applicationInput.memoryRecordId}`);
    }

    const aggregate = await databaseRuntime.harnessRunRepository.getHarnessRunByExecutionRunId(
      applicationInput.executionRunId
    );

    if (aggregate === undefined) {
      throw new Error(`Execution run not found: ${applicationInput.executionRunId}`);
    }

    const authorization = authorizePacketUsefulness({
      aggregate,
      runId: applicationInput.executionRunId,
      runtimeProjectId: databaseRuntime.projectId,
      ...(command.decisionPacketChecksum === undefined
        ? {}
        : { callerPacketChecksum: command.decisionPacketChecksum }),
      subjects: [{
        kind: "memory_record",
        id: applicationInput.memoryRecordId,
        evidenceRefs: command.decisionPacketChecksum === undefined
          ? []
          : [`packet:${command.decisionPacketChecksum}`]
      }]
    });

    if (!authorization.authorized) {
      throw new Error(authorization.reason);
    }

    if (memoryRecord.projectId !== authorization.projectId) {
      throw new Error("usefulness write rejected: memory record project does not match the run task project");
    }

    const existingApplication = databaseRuntime.memoryRepository.findMemoryApplicationByUsefulnessBinding === undefined
      ? undefined
      : await databaseRuntime.memoryRepository.findMemoryApplicationByUsefulnessBinding({
          memoryRecordId: applicationInput.memoryRecordId,
          executionRunId: applicationInput.executionRunId,
          packetChecksum: authorization.packetChecksum
        });

    if (existingApplication !== undefined) {
      return {
        stdout: formatPersisted(
          existingApplication,
          undefined,
          undefined,
          memoryFeedbackRecommendationReadback({
            memoryRecordId: applicationInput.memoryRecordId,
            outcome: existingApplication.outcome ?? applicationInput.outcome,
            reason: existingApplication.notes ?? applicationInput.expectedUse,
            evidenceRefs: [authorization.packetEvidenceRef]
          })
        )
      };
    }

    const memoryApplication = await databaseRuntime.memoryRepository.recordMemoryApplication({
      memoryRecordId: applicationInput.memoryRecordId,
      executionRunId: applicationInput.executionRunId,
      ...(applicationInput.taskContractId === undefined
        ? {}
        : { taskContractId: applicationInput.taskContractId }),
      ...(applicationInput.contextAssemblyId === undefined
        ? {}
        : { contextAssemblyId: applicationInput.contextAssemblyId }),
      expectedUse: applicationInput.expectedUse,
      outcome: applicationInput.outcome,
      notes: applicationInput.notes,
      metadata: {
        ...applicationInput.metadata,
        decisionPacketChecksum: authorization.packetChecksum,
        decisionPacketEvidenceRef: authorization.packetEvidenceRef,
        usefulnessSubject: `memory_record:${applicationInput.memoryRecordId}`
      }
    });

    const feedbackEventType = feedbackEventTypeForOutcome(applicationInput.outcome);
    const baseRecommendationInput = {
      memoryRecordId: applicationInput.memoryRecordId,
      outcome: applicationInput.outcome,
      reason: applicationInput.notes ?? applicationInput.expectedUse
    } as const;

    if (feedbackEventType === undefined) {
      return {
        stdout: formatPersisted(
          memoryApplication,
          undefined,
          undefined,
          memoryFeedbackRecommendationReadback({
            ...baseRecommendationInput,
            evidenceRefs: [`memory-application:${memoryApplication.id}`]
          })
        )
      };
    }

    if (applicationInput.outcome !== "hurt" && applicationInput.outcome !== "stale") {
      return {
        stdout: formatPersisted(
          memoryApplication,
          undefined,
          undefined,
          memoryFeedbackRecommendationReadback({
            ...baseRecommendationInput,
            evidenceRefs: [`memory-application:${memoryApplication.id}`]
          })
        )
      };
    }

    const feedbackInput = parseMemoryFeedbackEventInput({
      memoryRecordId: applicationInput.memoryRecordId,
      executionRunId: applicationInput.executionRunId,
      eventType: feedbackEventType,
      direction: "negative",
      note: applicationInput.notes,
      reason: applicationInput.notes,
      evidenceRef: `memory-application:${memoryApplication.id}`,
      metadata: {
        ...applicationInput.metadata,
        applicationOutcome: applicationInput.outcome
      }
    });
    const feedbackEvent = await databaseRuntime.memoryRepository.createMemoryFeedbackEvent({
      memoryRecordId: feedbackInput.memoryRecordId,
      ...(feedbackInput.executionRunId === undefined
        ? {}
        : { executionRunId: feedbackInput.executionRunId }),
      ...(feedbackInput.feedbackDeltaId === undefined
        ? {}
        : { feedbackDeltaId: feedbackInput.feedbackDeltaId }),
      eventType: feedbackInput.eventType,
      direction: feedbackInput.direction,
      note: feedbackInput.note,
      reason: feedbackInput.reason,
      ...(feedbackInput.evidenceRef === undefined
        ? {}
        : { evidenceRef: feedbackInput.evidenceRef }),
      metadata: feedbackInput.metadata
    });
    const antiMemoryCandidate = await proposeAntiMemoryCandidate(databaseRuntime, {
      memoryRecord,
      memoryApplication,
      feedbackEvent,
      outcome: applicationInput.outcome,
      notes: applicationInput.notes
    });
    const recommendation = memoryFeedbackRecommendationReadback({
      ...baseRecommendationInput,
      evidenceRefs: [
        `memory-application:${memoryApplication.id}`,
        `memory-feedback-event:${feedbackEvent.id}`,
        ...(antiMemoryCandidate === undefined ? [] : [`anti-memory-candidate:${antiMemoryCandidate.id}`])
      ]
    });

    return {
      stdout: formatPersisted(memoryApplication, feedbackEvent.id, antiMemoryCandidate, recommendation)
    };
  } finally {
    await databaseRuntime.close();
  }
};
