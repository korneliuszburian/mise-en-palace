import {
  createHash
} from "node:crypto";
import {
  authorizeDecisionPacketUsefulness,
  buildFeedbackRecommendationReadback,
  parseMemoryApplicationInput
} from "@krn/core";
import type {
  AntiMemoryCandidate,
  FeedbackRecommendationOutcome,
  FeedbackRecommendationReadback,
  MemoryApplication,
  MemoryApplicationOutcome,
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

const sha256Hex = (value: string | Uint8Array): string =>
  createHash("sha256").update(value).digest("hex");

const defaultExpectedUse = (command: MemoryRecordApplyCommand): string =>
  `Operator explicitly applied memory record ${command.memoryId ?? ""} to run ${command.runId ?? ""}`;

const feedbackEventTypeForOutcome = (
  outcome: MemoryApplicationOutcome
): Extract<MemoryFeedbackEventType, "demoted" | "stale_detected"> | undefined => {
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
    ...(application.outcome === "helped"
      ? ["Persistence boundary: helped requires the two-phase evidence capture return channel."]
      : []),
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

const assertMemoryApplicationPrecedesHelpedVerification = (
  outcome: MemoryApplicationOutcome
): void => {
  if (outcome !== "helped") {
    return;
  }

  throw new Error(
    "helped memory application requires an earlier persisted application and later target-bound verification; use the two-phase evidence capture return channel"
  );
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

    const authorization = authorizeDecisionPacketUsefulness({
      aggregate,
      runId: applicationInput.executionRunId,
      runtimeProjectId: databaseRuntime.projectId,
      sha256Hex,
      ...(command.decisionPacketChecksum === undefined
        ? {}
        : { callerPacketChecksum: command.decisionPacketChecksum }),
      ...(command.decisionPacketGeneratedAt === undefined
        ? {}
        : { callerPacketGeneratedAt: command.decisionPacketGeneratedAt }),
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

    assertMemoryApplicationPrecedesHelpedVerification(applicationInput.outcome);

    const recordApplicationWithEffectsOnce =
      databaseRuntime.memoryRepository.recordMemoryApplicationWithEffectsOnce;

    if (recordApplicationWithEffectsOnce === undefined) {
      throw new Error("Atomic packet-bound memory application effects persistence is required");
    }

    const feedbackEventType = feedbackEventTypeForOutcome(applicationInput.outcome);
    const negativeEffects = feedbackEventType === undefined
      ? undefined
      : {
          outcome: applicationInput.outcome as Extract<MemoryApplicationOutcome, "hurt" | "stale">,
          eventType: feedbackEventType,
          note: applicationInput.notes,
          reason: applicationInput.notes,
          evidenceRef: authorization.packetEvidenceRef,
          metadata: {
            ...applicationInput.metadata,
            applicationOutcome: applicationInput.outcome
          },
          candidate: {
            key: `feedback:${memoryRecord.key}:${applicationInput.outcome}`,
            rejectedClaim: memoryRecord.summary,
            reason: applicationInput.notes,
            invalidatedBySourceClaimIds: memoryRecord.sourceLineage.map((lineage) => lineage.sourceId),
            appliesTo: memoryRecord.key,
            ...(memoryRecord.invalidationRule === undefined
              ? {}
              : { mayRevisitWhen: memoryRecord.invalidationRule }),
            summary: `Review ${applicationInput.outcome} memory feedback for ${memoryRecord.key}`,
            body: `Memory application outcome ${applicationInput.outcome}: ${applicationInput.notes}`,
            owner: memoryRecord.owner,
            confidence: applicationInput.outcome === "stale" ? 70 : 60,
            sourceLineage: memoryRecord.sourceLineage
          }
        };

    const applicationResult = await recordApplicationWithEffectsOnce({
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
      ...(command.evidenceBundleId === undefined ? {} : { evidenceBundleId: command.evidenceBundleId }),
      packetChecksum: authorization.packetChecksum,
      packetGeneratedAt: authorization.packetGeneratedAt,
      sourceRunLifecycleRevision: authorization.sourceRunLifecycleRevision,
      metadata: {
        ...applicationInput.metadata,
        decisionPacketChecksum: authorization.packetChecksum,
        decisionPacketEvidenceRef: authorization.packetEvidenceRef,
        decisionPacketGeneratedAt: authorization.packetGeneratedAt,
        decisionPacketSourceRunLifecycleRevision: authorization.sourceRunLifecycleRevision,
        usefulnessSubject: `memory_record:${applicationInput.memoryRecordId}`,
        ...(command.evidenceBundleId === undefined
          ? {}
          : { verificationEvidenceBundleId: command.evidenceBundleId })
      },
      ...(negativeEffects === undefined ? {} : { negativeEffects })
    });

    const memoryApplication = applicationResult.application;
    const baseRecommendationInput = {
      memoryRecordId: applicationInput.memoryRecordId,
      outcome: applicationInput.outcome,
      reason: applicationInput.notes ?? applicationInput.expectedUse
    } as const;

    const recommendation = memoryFeedbackRecommendationReadback({
      ...baseRecommendationInput,
      evidenceRefs: [
        `memory-application:${memoryApplication.id}`,
        ...(applicationResult.feedbackEvent === undefined
          ? []
          : [`memory-feedback-event:${applicationResult.feedbackEvent.id}`]),
        ...(applicationResult.antiMemoryCandidate === undefined
          ? []
          : [`anti-memory-candidate:${applicationResult.antiMemoryCandidate.id}`])
      ]
    });

    return {
      stdout: formatPersisted(
        memoryApplication,
        applicationResult.feedbackEvent?.id,
        applicationResult.antiMemoryCandidate,
        recommendation
      )
    };
  } finally {
    await databaseRuntime.close();
  }
};
