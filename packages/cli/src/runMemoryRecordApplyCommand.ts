import {
  parseMemoryApplicationInput,
  parseMemoryFeedbackEventInput
} from "@krn/schema";
import type {
  AntiMemoryCandidate,
  MemoryApplication,
  MemoryApplicationOutcome,
  MemoryFeedbackEvent,
  MemoryFeedbackEventType
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

type MemoryRecordApplyCommand = Extract<CliCommand, { kind: "memoryRecordApply" }>;

export interface MemoryRecordApplyCommandRuntime {
  env: Record<string, string | undefined>;
  now(): string;
  createId(prefix: string): string;
  command: MemoryRecordApplyCommand;
  createDatabaseRuntime?: CreateMemoryRecordApplyDatabaseRuntime;
}

export interface MemoryRecordApplyCommandResult {
  stdout: string;
}

type CreateMemoryRecordApplyDatabaseRuntime = (
  input: DatabaseRuntimeInput
) => Promise<DatabaseRuntime>;

const defaultWorkspaceSlug = "local";
const defaultProjectSlug = "mise-en-palace";

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

const formatPreview = (
  application: ReturnType<typeof parseMemoryApplicationInput>
): string =>
  [
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
    feedbackEventTypeForOutcome(application.outcome) === undefined
      ? "Feedback event: none"
      : "Feedback event: would be recorded",
    feedbackEventTypeForOutcome(application.outcome) === undefined
      ? "Follow-up candidate: none"
      : "Follow-up candidate: anti-memory candidate would be proposed"
  ].join("\n");

const formatPersisted = (
  application: MemoryApplication,
  feedbackEventId: string | undefined,
  antiMemoryCandidate: AntiMemoryCandidate | undefined
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
      metadata: applicationInput.metadata
    });

    const feedbackEventType = feedbackEventTypeForOutcome(applicationInput.outcome);

    if (feedbackEventType === undefined) {
      return {
        stdout: formatPersisted(memoryApplication, undefined, undefined)
      };
    }

    if (applicationInput.outcome !== "hurt" && applicationInput.outcome !== "stale") {
      return {
        stdout: formatPersisted(memoryApplication, undefined, undefined)
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

    return {
      stdout: formatPersisted(memoryApplication, feedbackEvent.id, antiMemoryCandidate)
    };
  } finally {
    await databaseRuntime.close();
  }
};
