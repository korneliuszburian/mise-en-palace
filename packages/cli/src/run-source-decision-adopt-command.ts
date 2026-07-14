import {
  parseSourceDecisionEdgeInput,
  parseSourceDecisionInput
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

export type SourceDecisionAdoptCommand = Extract<CliCommand, { kind: "sourceDecisionAdopt" }>;

export interface SourceDecisionAdoptCommandRuntime extends BaseCommandRuntime {
  command: SourceDecisionAdoptCommand;
  createDatabaseRuntime?: CreateSourceDecisionAdoptDatabaseRuntime;
}

export interface SourceDecisionAdoptCommandResult {
  stdout: string;
}

export type CreateSourceDecisionAdoptDatabaseRuntime = (
  input: DatabaseRuntimeInput
) => Promise<DatabaseRuntime>;


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
  link?: {
    sourceDecisionEdgeId: string;
    edge: ReturnType<typeof parseSourceDecisionEdgeInput>;
  };
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
    ...(input.link === undefined
      ? []
      : [
          `sourceDecisionEdge: ${input.link.sourceDecisionEdgeId}`,
          `edgeTarget: ${input.link.edge.targetType}/${input.link.edge.targetId}`,
          `edgeSupportType: ${input.link.edge.supportType}`,
          `edgeConfidence: ${input.link.edge.confidence}`
        ]),
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
    const sourceClaimId = decisionInput.sourceClaimId;

    if (sourceClaimId === undefined) {
      throw new Error("SourceDecision adoption requires sourceClaimId");
    }

    if (databaseRuntime.withTransaction === undefined) {
      throw new Error("SourceDecision adoption transaction is unavailable in this database runtime");
    }

    return await databaseRuntime.withTransaction(
      `source-authority:${databaseRuntime.projectId}:${sourceClaimId}`,
      async (transactionRuntime) => {
        const sourceRepository = transactionRuntime.sourceRepository;

        if (sourceRepository.createSourceDecision === undefined) {
          throw new Error("SourceDecision persistence is unavailable in this database runtime");
        }

        if (sourceRepository.getSourceClaimForProject === undefined) {
          throw new Error("Project-scoped SourceClaim lookup is unavailable");
        }

        const sourceDecision = await sourceRepository.createSourceDecision({
          projectId: databaseRuntime.projectId,
          sourceClaimId,
          status: decisionInput.status,
          decision: decisionInput.decision,
          rationale: decisionInput.rationale,
          falsifier: decisionInput.falsifier,
          consumer: decisionInput.consumer,
          metadata: decisionInput.metadata
        });
        const sourceClaimReadback = await sourceRepository.getSourceClaimForProject(
          databaseRuntime.projectId,
          sourceClaimId
        );

        if (sourceClaimReadback === undefined) {
          throw new Error(`SourceClaim readback missing after adoption: ${sourceClaimId}`);
        }

        if (sourceClaimReadback.status !== "accepted") {
          throw new Error(
            `SourceDecision adoption requires accepted SourceClaim readback; current status ${sourceClaimReadback.status}`
          );
        }

        let link: {
          sourceDecisionEdgeId: string;
          edge: ReturnType<typeof parseSourceDecisionEdgeInput>;
        } | undefined;

        if (command.link === true) {
          const edgeInput = parseSourceDecisionEdgeInput({
            sourceClaimId,
            sourceDecisionId: sourceDecision.id,
            targetType: command.linkTargetType,
            targetId: command.linkTargetId,
            supportType: command.linkSupportType,
            confidence: command.linkConfidence,
            notes: command.linkNotes,
            metadata: command.metadata
          });
          const sourceDecisionEdge = await sourceRepository.createSourceDecisionEdge({
            sourceClaimId: edgeInput.sourceClaimId,
            sourceDecisionId: edgeInput.sourceDecisionId,
            targetType: edgeInput.targetType,
            targetId: edgeInput.targetId,
            supportType: edgeInput.supportType,
            confidence: edgeInput.confidence,
            notes: edgeInput.notes,
            metadata: edgeInput.metadata
          });
          link = { sourceDecisionEdgeId: sourceDecisionEdge.id, edge: edgeInput };
        }

        return {
          stdout: formatPersisted({
            sourceDecisionId: sourceDecision.id,
            decision: decisionInput,
            ...(link === undefined ? {} : { link })
          })
        };
      }
    );
  } finally {
    await databaseRuntime.close();
  }
};
