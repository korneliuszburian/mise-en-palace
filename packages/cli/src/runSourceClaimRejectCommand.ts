import {
  parseSourceRejectionInput
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
import type {
  BaseCommandRuntime
} from "./commandRuntimeSupport.js";
import {
  createSourceCommandDatabaseRuntime
} from "./sourceDatabaseRuntimeSupport.js";

export type SourceClaimRejectCommand = Extract<CliCommand, { kind: "sourceClaimReject" }>;

export interface SourceClaimRejectCommandRuntime extends BaseCommandRuntime {
  cwd: string;
  command: SourceClaimRejectCommand;
  createDatabaseRuntime?: CreateSourceClaimRejectDatabaseRuntime;
}

export interface SourceClaimRejectCommandResult {
  stdout: string;
}

export type CreateSourceClaimRejectDatabaseRuntime = (
  input: DatabaseRuntimeInput
) => Promise<DatabaseRuntime>;

const defaultConsumer = "M22 source rejection CLI";
const defaultDoesNotProve = "This rejected source should not become trusted KRN context.";

const rejectionReason = (command: SourceClaimRejectCommand): string | undefined =>
  command.reason ?? command.attemptedClaim;

const formatPreview = (
  rejection: ReturnType<typeof parseSourceRejectionInput>
): string =>
  [
    "KRN Source Claim Reject",
    "Persistence: disabled (no-store preview; use --persist to write)",
    "DB writes: none",
    "",
    "Source rejection preview:",
    `title: ${rejection.title}`,
    `attemptedClaim: ${rejection.attemptedClaim}`,
    `rejectedBecause: ${rejection.rejectedBecause}`,
    `reason: ${rejection.reason}`,
    "No SourceClaim created"
  ].join("\n");

const formatPersisted = (
  rejectionId: string,
  rejection: ReturnType<typeof parseSourceRejectionInput>
): string =>
  [
    "KRN Source Claim Reject",
    "Persistence: enabled (Postgres, explicit --persist)",
    "",
    "Persisted IDs:",
    `sourceRejection: ${rejectionId}`,
    ...(rejection.executionRunId === undefined ? [] : [`runId: ${rejection.executionRunId}`]),
    `rejectedBecause: ${rejection.rejectedBecause}`,
    `reason: ${rejection.reason}`,
    "No SourceClaim created"
  ].join("\n");

export const runSourceClaimRejectCommand = async (
  runtime: SourceClaimRejectCommandRuntime
): Promise<SourceClaimRejectCommandResult> => {
  const command = runtime.command;
  const attemptedClaim = command.attemptedClaim ?? command.title;
  const reason = rejectionReason(command);
  const rejectionInput = parseSourceRejectionInput({
    executionRunId: command.runId,
    sourceArtifactId: command.sourceArtifactId,
    sourceClaimId: command.sourceClaimId,
    title: command.title,
    attemptedClaim,
    rejectedBecause: command.rejectedBecause,
    reason,
    doesNotProve: command.doesNotProve ?? defaultDoesNotProve,
    consumer: command.consumer ?? defaultConsumer,
    metadata: command.metadata
  });

  if (!command.persist) {
    return {
      stdout: formatPreview(rejectionInput)
    };
  }

  const databaseUrl = runtime.env.KRN_DATABASE_URL?.trim();

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error("KRN_DATABASE_URL is required for krn source claim reject --persist");
  }

  const databaseRuntime = await createSourceCommandDatabaseRuntime({
    createRuntime: runtime.createDatabaseRuntime ?? createDatabaseRuntime,
    databaseUrl,
    commandProjectId: undefined,
    cwd: runtime.cwd,
    now: runtime.now,
    createId: runtime.createId
  });

  try {
    const sourceRejection = await databaseRuntime.sourceRepository.createSourceRejection({
      projectId: databaseRuntime.projectId,
      ...(rejectionInput.executionRunId === undefined
        ? {}
        : { executionRunId: rejectionInput.executionRunId }),
      ...(rejectionInput.sourceArtifactId === undefined
        ? {}
        : { sourceArtifactId: rejectionInput.sourceArtifactId }),
      ...(rejectionInput.sourceClaimId === undefined
        ? {}
        : { sourceClaimId: rejectionInput.sourceClaimId }),
      title: rejectionInput.title,
      attemptedClaim: rejectionInput.attemptedClaim,
      rejectedBecause: rejectionInput.rejectedBecause,
      reason: rejectionInput.reason,
      doesNotProve: rejectionInput.doesNotProve,
      consumer: rejectionInput.consumer,
      metadata: rejectionInput.metadata
    });

    return {
      stdout: formatPersisted(sourceRejection.id, rejectionInput)
    };
  } finally {
    await databaseRuntime.close();
  }
};
