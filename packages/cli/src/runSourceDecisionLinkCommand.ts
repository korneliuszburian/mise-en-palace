import {
  parseSourceDecisionEdgeInput
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

export type SourceDecisionLinkCommand = Extract<CliCommand, { kind: "sourceDecisionLink" }>;

export interface SourceDecisionLinkCommandRuntime {
  env: Record<string, string | undefined>;
  now(): string;
  createId(prefix: string): string;
  command: SourceDecisionLinkCommand;
  createDatabaseRuntime?: CreateSourceDecisionLinkDatabaseRuntime;
}

export interface SourceDecisionLinkCommandResult {
  stdout: string;
}

export type CreateSourceDecisionLinkDatabaseRuntime = (
  input: DatabaseRuntimeInput
) => Promise<DatabaseRuntime>;

const defaultWorkspaceSlug = "local";
const defaultProjectSlug = "mise-en-palace";

const formatPreview = (
  edge: ReturnType<typeof parseSourceDecisionEdgeInput>
): string =>
  [
    "KRN Source Decision Link",
    "Persistence: disabled (no-store preview; use --persist to write)",
    "DB writes: none",
    "",
    "Source decision edge preview:",
    `sourceClaimId: ${edge.sourceClaimId}`,
    `target: ${edge.targetType}/${edge.targetId}`,
    `supportType: ${edge.supportType}`,
    `confidence: ${edge.confidence}`,
    `notes: ${edge.notes}`
  ].join("\n");

const formatPersisted = (
  edgeId: string,
  edge: ReturnType<typeof parseSourceDecisionEdgeInput>
): string =>
  [
    "KRN Source Decision Link",
    "Persistence: enabled (Postgres, explicit --persist)",
    "",
    "Persisted IDs:",
    `sourceDecisionEdge: ${edgeId}`,
    `sourceClaimId: ${edge.sourceClaimId}`,
    `target: ${edge.targetType}/${edge.targetId}`,
    `supportType: ${edge.supportType}`,
    `confidence: ${edge.confidence}`,
    `notes: ${edge.notes}`
  ].join("\n");

export const runSourceDecisionLinkCommand = async (
  runtime: SourceDecisionLinkCommandRuntime
): Promise<SourceDecisionLinkCommandResult> => {
  const command = runtime.command;
  const edgeInput = parseSourceDecisionEdgeInput({
    sourceClaimId: command.sourceClaimId,
    targetType: command.targetType,
    targetId: command.targetId,
    supportType: command.supportType,
    confidence: command.confidence,
    notes: command.notes,
    metadata: command.metadata
  });

  if (!command.persist) {
    return {
      stdout: formatPreview(edgeInput)
    };
  }

  const databaseUrl = runtime.env.KRN_DATABASE_URL?.trim();

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error("KRN_DATABASE_URL is required for krn source decision link --persist");
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
    const sourceClaim = await databaseRuntime.sourceRepository.getSourceClaimById(
      edgeInput.sourceClaimId
    );

    if (sourceClaim === undefined) {
      throw new Error(`SourceClaim not found: ${edgeInput.sourceClaimId}`);
    }

    if (sourceClaim.status === "rejected" || sourceClaim.status === "deprecated") {
      throw new Error(`SourceDecisionEdge cannot use ${sourceClaim.status} SourceClaim`);
    }

    const sourceDecisionEdge = await databaseRuntime.sourceRepository.createSourceDecisionEdge({
      sourceClaimId: edgeInput.sourceClaimId,
      targetType: edgeInput.targetType,
      targetId: edgeInput.targetId,
      supportType: edgeInput.supportType,
      confidence: edgeInput.confidence,
      notes: edgeInput.notes,
      metadata: edgeInput.metadata
    });

    return {
      stdout: formatPersisted(sourceDecisionEdge.id, edgeInput)
    };
  } finally {
    await databaseRuntime.close();
  }
};
