import {
  parseAntiMemoryInput
} from "@krn/schema";
import type {
  SourceLineageRef
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
import {
  parseMemoryConfidence
} from "./parseMemoryConfidence.js";

type MemoryAntiAddCommand = Extract<CliCommand, { kind: "memoryAntiAdd" }>;

export interface MemoryAntiAddCommandRuntime {
  env: Record<string, string | undefined>;
  now(): string;
  createId(prefix: string): string;
  command: MemoryAntiAddCommand;
  createDatabaseRuntime?: CreateMemoryAntiAddDatabaseRuntime;
}

export interface MemoryAntiAddCommandResult {
  stdout: string;
}

type CreateMemoryAntiAddDatabaseRuntime = (
  input: DatabaseRuntimeInput
) => Promise<DatabaseRuntime>;

const defaultWorkspaceSlug = "local";
const defaultProjectSlug = "mise-en-palace";
const defaultOwner = "operator";
const defaultConfidence = 90;

const sourceLineage = (command: MemoryAntiAddCommand): { sourceId: string }[] => [
  ...(command.invalidatedBySourceClaimId === undefined
    ? []
    : [{ sourceId: command.invalidatedBySourceClaimId }]),
  ...command.sourceLineageIds.map((sourceId) => ({ sourceId }))
];

const toSourceLineageRefs = (
  sourceLineageItems: ReturnType<typeof parseAntiMemoryInput>["sourceLineage"]
): SourceLineageRef[] =>
  sourceLineageItems.map((item) => ({
    sourceId: item.sourceId,
    ...(item.note === undefined ? {} : { note: item.note })
  }));

const formatPreview = (
  antiMemory: ReturnType<typeof parseAntiMemoryInput>
): string =>
  [
    "KRN Memory Anti Add",
    "Persistence: disabled (no-store preview; use --persist to write)",
    "DB writes: none",
    "",
    "Anti-memory preview:",
    `rejectedClaim: ${antiMemory.rejectedClaim}`,
    `reason: ${antiMemory.reason}`,
    `runId: ${antiMemory.executionRunId}`,
    ...(antiMemory.invalidatedBySourceClaimId === undefined
      ? []
      : [`invalidatedBySourceClaimId: ${antiMemory.invalidatedBySourceClaimId}`]),
    `confidence: ${antiMemory.confidence}`,
    "No MemoryRecord created",
    "Anti-memory is not positive memory"
  ].join("\n");

const formatPersisted = (
  antiMemoryId: string,
  antiMemory: ReturnType<typeof parseAntiMemoryInput>
): string =>
  [
    "KRN Memory Anti Add",
    "Persistence: enabled (Postgres, explicit --persist)",
    "",
    "Persisted IDs:",
    `antiMemory: ${antiMemoryId}`,
    `runId: ${antiMemory.executionRunId}`,
    ...(antiMemory.invalidatedBySourceClaimId === undefined
      ? []
      : [`invalidatedBySourceClaimId: ${antiMemory.invalidatedBySourceClaimId}`]),
    `rejectedClaim: ${antiMemory.rejectedClaim}`,
    "No MemoryRecord created",
    "Anti-memory is not positive memory"
  ].join("\n");

const createRuntime = async (
  runtime: MemoryAntiAddCommandRuntime
): Promise<DatabaseRuntime> => {
  const databaseUrl = runtime.env.KRN_DATABASE_URL?.trim();

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error("KRN_DATABASE_URL is required for krn memory anti add --persist");
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

export const runMemoryAntiAddCommand = async (
  runtime: MemoryAntiAddCommandRuntime
): Promise<MemoryAntiAddCommandResult> => {
  const command = runtime.command;
  const antiMemoryInput = parseAntiMemoryInput({
    executionRunId: command.runId,
    key: command.key ?? runtime.createId("anti-memory"),
    rejectedClaim: command.rejectedClaim,
    reason: command.reason,
    invalidatedBySourceClaimId: command.invalidatedBySourceClaimId,
    invalidatedBySourceClaimIds:
      command.invalidatedBySourceClaimId === undefined
        ? []
        : [command.invalidatedBySourceClaimId],
    appliesTo: command.appliesTo,
    mayRevisitWhen: command.mayRevisitWhen,
    owner: command.owner ?? defaultOwner,
    confidence: parseMemoryConfidence(command.confidence, { defaultValue: defaultConfidence }),
    sourceLineage: sourceLineage(command),
    metadata: command.metadata
  });

  if (!command.persist) {
    return {
      stdout: formatPreview(antiMemoryInput)
    };
  }

  const databaseRuntime = await createRuntime(runtime);

  try {
    if (antiMemoryInput.invalidatedBySourceClaimId !== undefined) {
      const sourceClaim = await databaseRuntime.sourceRepository.getSourceClaimById(
        antiMemoryInput.invalidatedBySourceClaimId
      );

      if (sourceClaim === undefined) {
        throw new Error(`SourceClaim not found: ${antiMemoryInput.invalidatedBySourceClaimId}`);
      }
    }

    const antiMemoryRecord = await databaseRuntime.memoryRepository.createAntiMemoryRecord({
      projectId: databaseRuntime.projectId,
      executionRunId: antiMemoryInput.executionRunId,
      key: antiMemoryInput.key ?? runtime.createId("anti-memory"),
      rejectedClaim: antiMemoryInput.rejectedClaim,
      reason: antiMemoryInput.reason,
      invalidatedBySourceClaimIds: antiMemoryInput.invalidatedBySourceClaimIds,
      ...(antiMemoryInput.invalidatedBySourceClaimId === undefined
        ? {}
        : { invalidatedBySourceClaimId: antiMemoryInput.invalidatedBySourceClaimId }),
      ...(antiMemoryInput.appliesTo === undefined
        ? {}
        : { appliesTo: antiMemoryInput.appliesTo }),
      ...(antiMemoryInput.mayRevisitWhen === undefined
        ? {}
        : { mayRevisitWhen: antiMemoryInput.mayRevisitWhen }),
      summary: antiMemoryInput.rejectedClaim,
      body: antiMemoryInput.reason,
      owner: antiMemoryInput.owner,
      confidence: antiMemoryInput.confidence,
      sourceLineage: toSourceLineageRefs(antiMemoryInput.sourceLineage),
      metadata: antiMemoryInput.metadata
    });

    return {
      stdout: formatPersisted(antiMemoryRecord.id, antiMemoryInput)
    };
  } finally {
    await databaseRuntime.close();
  }
};
