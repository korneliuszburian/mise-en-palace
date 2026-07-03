import {
  parseSourceDecisionInput
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

export type SourceDecisionAdoptCommand = Extract<CliCommand, { kind: "sourceDecisionAdopt" }>;

export interface SourceDecisionAdoptCommandRuntime {
  env: Record<string, string | undefined>;
  now(): string;
  createId(prefix: string): string;
  command: SourceDecisionAdoptCommand;
  createDatabaseRuntime?: CreateSourceDecisionAdoptDatabaseRuntime;
}

export interface SourceDecisionAdoptCommandResult {
  stdout: string;
}

export type CreateSourceDecisionAdoptDatabaseRuntime = (
  input: DatabaseRuntimeInput
) => Promise<DatabaseRuntime>;

const defaultWorkspaceSlug = "local";
const defaultProjectSlug = "mise-en-palace";

const formatPreview = (
  decision: ReturnType<typeof parseSourceDecisionInput>
): string =>
  [
    "KRN Source Decision Adopt",
    "Persistence: disabled (no-store preview; use --persist to write)",
    "DB writes: none",
    "",
    "Source decision preview:",
    `sourceClaimId: ${decision.sourceClaimId}`,
    `status: ${decision.status}`,
    `decision: ${decision.decision}`,
    `rationale: ${decision.rationale}`,
    `consumer: ${decision.consumer}`,
    `falsifier: ${decision.falsifier}`
  ].join("\n");

const formatPersisted = (input: {
  sourceDecisionId: string;
  decision: ReturnType<typeof parseSourceDecisionInput>;
}): string =>
  [
    "KRN Source Decision Adopt",
    "Persistence: enabled (Postgres, explicit --persist)",
    "",
    "Persisted IDs:",
    `sourceDecision: ${input.sourceDecisionId}`,
    `sourceClaimId: ${input.decision.sourceClaimId}`,
    "sourceClaimReadback: accepted",
    `status: ${input.decision.status}`,
    `decision: ${input.decision.decision}`,
    `rationale: ${input.decision.rationale}`,
    `consumer: ${input.decision.consumer}`,
    `falsifier: ${input.decision.falsifier}`,
    "Memory mutation: none",
    "Graph runtime: none",
    "doesNotProve: SourceDecision adoption does not prove source truth, target correctness, graph retrieval, crawler readiness, or product readiness"
  ].join("\n");

export const runSourceDecisionAdoptCommand = async (
  runtime: SourceDecisionAdoptCommandRuntime
): Promise<SourceDecisionAdoptCommandResult> => {
  const command = runtime.command;
  const decisionInput = parseSourceDecisionInput({
    sourceClaimId: command.sourceClaimId,
    status: "adopt",
    decision: command.decision,
    rationale: command.rationale,
    falsifier: command.falsifier,
    consumer: command.consumer,
    metadata: command.metadata
  });

  if (!command.persist) {
    return {
      stdout: formatPreview(decisionInput)
    };
  }

  const databaseUrl = runtime.env.KRN_DATABASE_URL?.trim();

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error("KRN_DATABASE_URL is required for krn source decision adopt --persist");
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
    const createSourceDecision = databaseRuntime.sourceRepository.createSourceDecision;

    if (createSourceDecision === undefined) {
      throw new Error("SourceDecision persistence is unavailable in this database runtime");
    }

    const sourceDecision = await createSourceDecision({
      projectId: databaseRuntime.projectId,
      ...(decisionInput.sourceClaimId === undefined
        ? {}
        : { sourceClaimId: decisionInput.sourceClaimId }),
      status: decisionInput.status,
      decision: decisionInput.decision,
      rationale: decisionInput.rationale,
      falsifier: decisionInput.falsifier,
      consumer: decisionInput.consumer,
      metadata: decisionInput.metadata
    });
    const sourceClaimReadback = decisionInput.sourceClaimId === undefined
      ? undefined
      : await databaseRuntime.sourceRepository.getSourceClaimById(decisionInput.sourceClaimId);

    if (sourceClaimReadback === undefined) {
      throw new Error(`SourceClaim readback missing after adoption: ${decisionInput.sourceClaimId}`);
    }

    if (sourceClaimReadback.status !== "accepted") {
      throw new Error(
        `SourceDecision adoption requires accepted SourceClaim readback; current status ${sourceClaimReadback.status}`
      );
    }

    return {
      stdout: formatPersisted({
        sourceDecisionId: sourceDecision.id,
        decision: decisionInput
      })
    };
  } finally {
    await databaseRuntime.close();
  }
};
