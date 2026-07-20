import { createHash } from "node:crypto";
import {
  SourceArtifactKindSchema,
  parseSourceArtifactInput,
  parseSourceClaimInput
} from "@krn/core";
import {
  defaultWorkspaceSlug,
  defaultProjectSlug,
  createDatabaseRuntime
} from "./database-runtime.js";
import {
  noStorePreviewLabel,
  persistenceLine,
  postgresPersistedLabel
} from "./command-runtime-support.js";
import {
  findRepoRoot
} from "./cli-file-boundary.js";
import type {
  BaseCommandRuntime
} from "./command-runtime-support.js";
import type {
  DatabaseRuntime,
  DatabaseRuntimeInput
} from "./database-runtime.js";
import type {
  CliCommand
} from "./parse-args.js";

export type SourceClaimAddCommand = Extract<CliCommand, { kind: "sourceClaimAdd" }>;

export interface SourceClaimAddCommandRuntime extends BaseCommandRuntime {
  cwd: string;
  command: SourceClaimAddCommand;
  createDatabaseRuntime?: CreateSourceClaimAddDatabaseRuntime;
}

export interface SourceClaimAddCommandResult {
  stdout: string;
}

export type CreateSourceClaimAddDatabaseRuntime = (
  input: DatabaseRuntimeInput
) => Promise<DatabaseRuntime>;


type SourceClaimAddArtifactInput = ReturnType<typeof parseSourceArtifactInput>;
type SourceClaimAddClaimInput = ReturnType<typeof parseSourceClaimInput>;

interface CapturedOperatorInput {
  artifactInput: SourceClaimAddArtifactInput;
  claimInput: SourceClaimAddClaimInput;
  content: string;
  contentHash: string;
  metadata: Record<string, unknown>;
}

const sha256 = (value: string): string =>
  createHash("sha256")
    .update(value)
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

const optionalText = (value: string | undefined, fallback = ""): string =>
  value === undefined ? fallback : value;

const sortedMetadata = (metadata: Record<string, string>): Record<string, string> =>
  Object.fromEntries(Object.entries(metadata).sort(([left], [right]) =>
    left.localeCompare(right)
  ));

const capturedOperatorInputContent = (
  command: SourceClaimAddCommand,
  uri: string,
  krnImplication: string
): string => JSON.stringify({
  title: optionalText(command.title),
  uri,
  claim: optionalText(command.claim),
  mechanism: optionalText(command.mechanism),
  krnImplication,
  doesNotProve: optionalText(command.doesNotProve),
  sourceAuthority: optionalText(command.sourceAuthority),
  supportType: optionalText(command.supportType),
  consumer: optionalText(command.consumer),
  falsifier: optionalText(command.falsifier),
  revisitWhen: optionalText(command.revisitWhen),
  type: optionalText(command.type, "operator_input"),
  metadata: sortedMetadata(command.metadata)
});

const capturedEvidenceMetadata = (
  command: SourceClaimAddCommand,
  uri: string,
  contentHash: string,
  capturedAt: string
): Record<string, unknown> => ({
  ...metadataWithSourceType(command.metadata, command.type),
  evidenceRef: uri,
  evidenceStatus: "captured",
  evidenceContentHash: contentHash,
  evidenceCapturedAt: capturedAt,
  evidenceFreshness: "current",
  evidenceProvenance: "explicit operator input",
  source: "krn source claim add --persist"
});

const capturedOperatorInput = (
  command: SourceClaimAddCommand,
  capturedAt: string
): CapturedOperatorInput => {
  const uri = command.uri ?? "operator://source";
  const krnImplication = command.krnImplication ?? defaultKrnImplication(command);
  const content = capturedOperatorInputContent(command, uri, krnImplication);
  const contentHash = sha256(content);
  const metadata = capturedEvidenceMetadata(command, uri, contentHash, capturedAt);
  const artifactInput = parseSourceArtifactInput({
    kind: toArtifactKind(command.type),
    title: command.title,
    uri,
    contentHash,
    sourceAuthority: command.sourceAuthority,
    metadata
  });
  const claimInput = parseSourceClaimInput({
    executionRunId: command.runId,
    claim: command.claim,
    mechanism: command.mechanism,
    krnImplication,
    doesNotProve: command.doesNotProve,
    sourceAuthority: command.sourceAuthority,
    supportType: command.supportType,
    consumer: command.consumer,
    falsifier: command.falsifier,
    revisitWhen: command.revisitWhen,
    metadata
  });

  return {
    artifactInput,
    claimInput,
    content,
    contentHash,
    metadata
  };
};

const formatPreview = (
  command: SourceClaimAddCommand,
  artifact: ReturnType<typeof parseSourceArtifactInput>,
  claim: ReturnType<typeof parseSourceClaimInput>
): string =>
  [
    "KRN Source Claim Add",
    persistenceLine(noStorePreviewLabel),
    "DB writes: none",
    "",
    "Source artifact preview:",
    `title: ${artifact.title}`,
    `uri: ${artifact.uri}`,
    `kind: ${artifact.kind}`,
    `sourceAuthority: ${artifact.sourceAuthority}`,
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
  sourceChunkId: string,
  sourceClaimId: string,
  claim: ReturnType<typeof parseSourceClaimInput>
): string =>
  [
    "KRN Source Claim Add",
    persistenceLine(postgresPersistedLabel),
    "",
    "Persisted IDs:",
    `sourceArtifact: ${sourceArtifactId}`,
    `sourceChunk: ${sourceChunkId}`,
    `sourceClaim: ${sourceClaimId}`,
    ...(claim.executionRunId === undefined ? [] : [`runId: ${claim.executionRunId}`]),
    `doesNotProve: ${claim.doesNotProve}`
  ].join("\n");

const persistedDatabaseUrl = (
  runtime: SourceClaimAddCommandRuntime
): string => {
  const databaseUrl = runtime.env.KRN_DATABASE_URL?.trim();

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error("KRN_DATABASE_URL is required for krn source claim add --persist");
  }

  return databaseUrl;
};

const createPersistedDatabaseRuntime = async (
  runtime: SourceClaimAddCommandRuntime,
  databaseUrl: string
): Promise<DatabaseRuntime> => {
  const createRuntime = runtime.createDatabaseRuntime ?? createDatabaseRuntime;

  return createRuntime({
    databaseUrl,
    workspaceSlug: defaultWorkspaceSlug,
    projectSlug: defaultProjectSlug,
    repoPathHint: await findRepoRoot(runtime.cwd),
    now: runtime.now,
    createId: runtime.createId
  });
};

const persistCapturedOperatorInput = async (
  databaseRuntime: DatabaseRuntime,
  captured: CapturedOperatorInput
): Promise<SourceClaimAddCommandResult> => {
  try {
    if (databaseRuntime.withTransaction === undefined) {
      throw new Error("Source claim add transaction is unavailable in this database runtime");
    }

    return await databaseRuntime.withTransaction(
      `source-authority:${databaseRuntime.projectId}:${captured.contentHash}`,
      async (transactionRuntime) => {
        const sourceRepository = transactionRuntime.sourceRepository;

        if (sourceRepository.createSourceChunk === undefined) {
          throw new Error("SourceChunk creation is unavailable for krn source claim add --persist");
        }

        const sourceArtifact = await sourceRepository.createSourceArtifact({
          projectId: databaseRuntime.projectId,
          kind: captured.artifactInput.kind,
          sourceAuthority: captured.artifactInput.sourceAuthority,
          uri: captured.artifactInput.uri,
          title: captured.artifactInput.title,
          contentHash: captured.artifactInput.contentHash ?? captured.contentHash,
          metadata: captured.artifactInput.metadata
        });
        const sourceChunk = await sourceRepository.createSourceChunk({
          sourceArtifactId: sourceArtifact.id,
          ordinal: 0,
          heading: captured.artifactInput.title,
          content: captured.content,
          tokenCount: captured.content.split(/\s+/u).length,
          contentHash: captured.contentHash,
          metadata: captured.metadata
        });
        const sourceClaim = await sourceRepository.createSourceClaim({
          sourceArtifactId: sourceArtifact.id,
          sourceChunkId: sourceChunk.id,
          ...(captured.claimInput.executionRunId === undefined
            ? {}
            : { executionRunId: captured.claimInput.executionRunId }),
          claim: captured.claimInput.claim,
          mechanism: captured.claimInput.mechanism,
          krnImplication: captured.claimInput.krnImplication,
          doesNotProve: captured.claimInput.doesNotProve,
          sourceAuthority: captured.claimInput.sourceAuthority,
          supportType: captured.claimInput.supportType,
          consumer: captured.claimInput.consumer,
          ...(captured.claimInput.falsifier === undefined
            ? {}
            : { falsifier: captured.claimInput.falsifier }),
          ...(captured.claimInput.revisitWhen === undefined
            ? {}
            : { revisitWhen: captured.claimInput.revisitWhen }),
          status: captured.claimInput.status,
          metadata: captured.claimInput.metadata
        });

        return {
          stdout: formatPersisted(
            sourceArtifact.id,
            sourceChunk.id,
            sourceClaim.id,
            captured.claimInput
          )
        };
      }
    );
  } finally {
    await databaseRuntime.close();
  }
};

export const runSourceClaimAddCommand = async (
  runtime: SourceClaimAddCommandRuntime
): Promise<SourceClaimAddCommandResult> => {
  const command = runtime.command;
  const captured = capturedOperatorInput(command, runtime.now());

  if (!command.persist) {
    return {
      stdout: formatPreview(command, captured.artifactInput, captured.claimInput)
    };
  }

  return persistCapturedOperatorInput(
    await createPersistedDatabaseRuntime(runtime, persistedDatabaseUrl(runtime)),
    captured
  );
};
