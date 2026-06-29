import type {
  SourceClaim,
  SourceClaimEdge
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

export type SourceClaimEdgesCommand = Extract<CliCommand, { kind: "sourceClaimEdges" }>;

export interface SourceClaimEdgesCommandRuntime {
  env: Record<string, string | undefined>;
  now(): string;
  createId(prefix: string): string;
  command: SourceClaimEdgesCommand;
  createDatabaseRuntime?: CreateSourceClaimEdgesDatabaseRuntime;
}

export interface SourceClaimEdgesCommandResult {
  stdout: string;
}

export type CreateSourceClaimEdgesDatabaseRuntime = (
  input: DatabaseRuntimeInput
) => Promise<DatabaseRuntime>;

const defaultWorkspaceSlug = "local";
const defaultProjectSlug = "mise-en-palace";

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item): item is string => typeof item === "string");

const stringMetadata = (
  metadata: Record<string, unknown>,
  key: string
): string | undefined => {
  const value = metadata[key];

  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
};

const stringArrayMetadata = (
  metadata: Record<string, unknown>,
  key: string
): string[] | undefined => {
  const value = metadata[key];

  return isStringArray(value) && value.length > 0 ? value : undefined;
};

const directionFor = (
  sourceClaimId: SourceClaim["id"],
  edge: SourceClaimEdge
): "outgoing" | "incoming" =>
  edge.fromSourceClaimId === sourceClaimId ? "outgoing" : "incoming";

const formatEdge = (
  sourceClaimId: SourceClaim["id"],
  edge: SourceClaimEdge
): string[] => {
  const sourceRanges = stringArrayMetadata(edge.metadata, "sourceRanges");

  return [
    `- sourceClaimEdge: ${edge.id}`,
    `  direction: ${directionFor(sourceClaimId, edge)}`,
    `  fromSourceClaimId: ${edge.fromSourceClaimId}`,
    `  toSourceClaimId: ${edge.toSourceClaimId}`,
    `  kind: ${edge.kind}`,
    `  consumer: ${edge.metadata.consumer}`,
    `  doesNotProve: ${edge.metadata.doesNotProve}`,
    ...(stringMetadata(edge.metadata, "evidenceRef") === undefined
      ? []
      : [`  evidenceRef: ${stringMetadata(edge.metadata, "evidenceRef")}`]),
    ...(stringMetadata(edge.metadata, "sourceDecisionRef") === undefined
      ? []
      : [`  sourceDecisionRef: ${stringMetadata(edge.metadata, "sourceDecisionRef")}`]),
    ...(stringMetadata(edge.metadata, "scope") === undefined
      ? []
      : [`  scope: ${stringMetadata(edge.metadata, "scope")}`]),
    ...(stringMetadata(edge.metadata, "validFrom") === undefined
      ? []
      : [`  validFrom: ${stringMetadata(edge.metadata, "validFrom")}`]),
    ...(stringMetadata(edge.metadata, "validUntil") === undefined
      ? []
      : [`  validUntil: ${stringMetadata(edge.metadata, "validUntil")}`]),
    ...(stringMetadata(edge.metadata, "invalidatedAt") === undefined
      ? []
      : [`  invalidatedAt: ${stringMetadata(edge.metadata, "invalidatedAt")}`]),
    ...(stringMetadata(edge.metadata, "file") === undefined
      ? []
      : [`  file: ${stringMetadata(edge.metadata, "file")}`]),
    ...(stringMetadata(edge.metadata, "contentHash") === undefined
      ? []
      : [`  contentHash: ${stringMetadata(edge.metadata, "contentHash")}`]),
    ...(sourceRanges === undefined
      ? []
      : [
          "  sourceRanges:",
          ...sourceRanges.map((range) => `  - ${range}`)
        ])
  ];
};

const formatSourceClaimEdges = (
  sourceClaim: SourceClaim,
  edges: readonly SourceClaimEdge[]
): string =>
  [
    "KRN Source Claim Edges",
    "Persistence: read-only (Postgres)",
    "DB writes: none",
    "",
    "SourceClaim:",
    `sourceClaimId: ${sourceClaim.id}`,
    `status: ${sourceClaim.status}`,
    `claim: ${sourceClaim.claim}`,
    `consumer: ${sourceClaim.consumer}`,
    "",
    "SourceClaimEdges:",
    `count: ${edges.length}`,
    ...(edges.length === 0
      ? ["- none"]
      : edges.flatMap((edge) => formatEdge(sourceClaim.id, edge))),
    "",
    "Proof:",
    "- proves: KRN read the SourceClaim row and connected SourceClaimEdge rows from the current Postgres store",
    "- proves: edge metadata is visible to the operator for review",
    "- doesNotProve: source truth, claim correctness, edge correctness, graph retrieval quality, ranking quality, extraction quality, crawler readiness, product readiness, or Memory Core mutation",
    "Memory mutation: none",
    "Graph runtime: none"
  ].join("\n");

export const runSourceClaimEdgesCommand = async (
  runtime: SourceClaimEdgesCommandRuntime
): Promise<SourceClaimEdgesCommandResult> => {
  const sourceClaimId = runtime.command.sourceClaimId?.trim();

  if (sourceClaimId === undefined || sourceClaimId.length === 0) {
    throw new Error("--source-claim-id is required for krn source claim edges");
  }

  const databaseUrl = runtime.env.KRN_DATABASE_URL?.trim();

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error("KRN_DATABASE_URL is required for krn source claim edges");
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
    const typedSourceClaimId = sourceClaimId as SourceClaim["id"];
    const sourceClaim = await databaseRuntime.sourceRepository.getSourceClaimById(
      typedSourceClaimId
    );

    if (sourceClaim === undefined) {
      throw new Error(`SourceClaim not found: ${sourceClaimId}`);
    }

    const edges = await databaseRuntime.sourceRepository.listSourceClaimEdgesForClaim(
      typedSourceClaimId
    );

    return {
      stdout: formatSourceClaimEdges(sourceClaim, edges)
    };
  } finally {
    await databaseRuntime.close();
  }
};
