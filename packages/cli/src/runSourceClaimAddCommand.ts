import { createHash } from "node:crypto";
import {
  SourceArtifactKindSchema,
  parseSourceArtifactInput,
  parseSourceClaimInput
} from "@krn/schema";
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

export type SourceClaimAddCommand = Extract<CliCommand, { kind: "sourceClaimAdd" }>;

export interface SourceClaimAddCommandRuntime {
  env: Record<string, string | undefined>;
  now(): string;
  createId(prefix: string): string;
  command: SourceClaimAddCommand;
  createDatabaseRuntime?: CreateSourceClaimAddDatabaseRuntime;
}

export interface SourceClaimAddCommandResult {
  stdout: string;
}

export type CreateSourceClaimAddDatabaseRuntime = (
  input: DatabaseRuntimeInput
) => Promise<DatabaseRuntime>;

const defaultWorkspaceSlug = "local";
const defaultProjectSlug = "mise-en-palace";

const digest = (parts: readonly string[]): string =>
  createHash("sha256")
    .update(JSON.stringify(parts))
    .digest("hex");

const toArtifactKind = (type: string | undefined): string => {
  const candidate = type?.trim();

  if (candidate === undefined || candidate.length === 0) {
    return "operator_input";
  }

  return SourceArtifactKindSchema.safeParse(candidate).success ? candidate : "operator_input";
};

const metadataWithSourceType = (
  metadata: Record<string, string>,
  type: string | undefined
): Record<string, unknown> => {
  const candidate = type?.trim();

  if (candidate === undefined || candidate.length === 0) {
    return metadata;
  }

  if (SourceArtifactKindSchema.safeParse(candidate).success) {
    return metadata;
  }

  return {
    ...metadata,
    sourceType: candidate
  };
};

const defaultKrnImplication = (command: SourceClaimAddCommand): string =>
  `KRN implication for ${command.consumer ?? "source consumer"}: ${command.claim ?? "source claim"}`;

const formatPreview = (
  command: SourceClaimAddCommand,
  artifact: ReturnType<typeof parseSourceArtifactInput>,
  claim: ReturnType<typeof parseSourceClaimInput>
): string =>
  [
    "KRN Source Claim Add",
    "Persistence: disabled (no-store preview; use --persist to write)",
    "DB writes: none",
    "",
    "Source artifact preview:",
    `title: ${artifact.title}`,
    `uri: ${artifact.uri}`,
    `kind: ${artifact.kind}`,
    `trustTier: ${artifact.trustTier}`,
    "",
    "Source claim preview:",
    `claim: ${claim.claim}`,
    `mechanism: ${claim.mechanism}`,
    `supportType: ${claim.supportType}`,
    `consumer: ${claim.consumer}`,
    ...(command.runId === undefined ? [] : [`runId: ${command.runId}`]),
    `doesNotProve: ${claim.doesNotProve}`
  ].join("\n");

const formatPersisted = (
  sourceArtifactId: string,
  sourceClaimId: string,
  claim: ReturnType<typeof parseSourceClaimInput>
): string =>
  [
    "KRN Source Claim Add",
    "Persistence: enabled (Postgres, explicit --persist)",
    "",
    "Persisted IDs:",
    `sourceArtifact: ${sourceArtifactId}`,
    `sourceClaim: ${sourceClaimId}`,
    ...(claim.executionRunId === undefined ? [] : [`runId: ${claim.executionRunId}`]),
    `doesNotProve: ${claim.doesNotProve}`
  ].join("\n");

export const runSourceClaimAddCommand = async (
  runtime: SourceClaimAddCommandRuntime
): Promise<SourceClaimAddCommandResult> => {
  const command = runtime.command;
  const metadata = metadataWithSourceType(command.metadata, command.type);
  const uri = command.uri ?? "operator://source";
  const contentHash = digest([
    command.title ?? "",
    uri,
    command.claim ?? "",
    command.mechanism ?? "",
    command.doesNotProve ?? ""
  ]);
  const artifactInput = parseSourceArtifactInput({
    kind: toArtifactKind(command.type),
    title: command.title,
    uri,
    contentHash,
    trustTier: command.trustTier,
    metadata
  });
  const claimInput = parseSourceClaimInput({
    executionRunId: command.runId,
    claim: command.claim,
    mechanism: command.mechanism,
    krnImplication: command.krnImplication ?? defaultKrnImplication(command),
    doesNotProve: command.doesNotProve,
    trustTier: command.trustTier,
    supportType: command.supportType,
    consumer: command.consumer,
    falsifier: command.falsifier,
    revisitWhen: command.revisitWhen,
    metadata
  });

  if (!command.persist) {
    return {
      stdout: formatPreview(command, artifactInput, claimInput)
    };
  }

  const databaseUrl = runtime.env.KRN_DATABASE_URL?.trim();

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error("KRN_DATABASE_URL is required for krn source claim add --persist");
  }

  const createRuntime = runtime.createDatabaseRuntime ?? createDatabaseRuntime;
  const databaseRuntime = await createRuntime({
    databaseUrl,
    workspaceSlug: defaultWorkspaceSlug,
    projectSlug: defaultProjectSlug,
    now: runtime.now,
    createId: runtime.createId
  });

  try {
    const sourceArtifact = await databaseRuntime.sourceRepository.createSourceArtifact({
      projectId: databaseRuntime.projectId,
      kind: artifactInput.kind,
      trustTier: artifactInput.trustTier,
      uri: artifactInput.uri,
      title: artifactInput.title,
      contentHash: artifactInput.contentHash ?? contentHash,
      metadata: artifactInput.metadata
    });
    const sourceClaim = await databaseRuntime.sourceRepository.createSourceClaim({
      sourceArtifactId: sourceArtifact.id,
      ...(claimInput.executionRunId === undefined
        ? {}
        : { executionRunId: claimInput.executionRunId }),
      claim: claimInput.claim,
      mechanism: claimInput.mechanism,
      krnImplication: claimInput.krnImplication,
      doesNotProve: claimInput.doesNotProve,
      trustTier: claimInput.trustTier,
      supportType: claimInput.supportType,
      consumer: claimInput.consumer,
      ...(claimInput.falsifier === undefined ? {} : { falsifier: claimInput.falsifier }),
      ...(claimInput.revisitWhen === undefined ? {} : { revisitWhen: claimInput.revisitWhen }),
      status: claimInput.status,
      metadata: claimInput.metadata
    });

    return {
      stdout: formatPersisted(sourceArtifact.id, sourceClaim.id, claimInput)
    };
  } finally {
    await databaseRuntime.close();
  }
};
