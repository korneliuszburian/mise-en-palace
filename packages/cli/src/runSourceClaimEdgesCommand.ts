import type {
  SourceClaim,
  SourceClaimEdge
} from "@krn/core";
import {
  readSourceRelationMetadataReadback
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

const directionFor = (
  sourceClaimId: SourceClaim["id"],
  edge: SourceClaimEdge
): "outgoing" | "incoming" =>
  edge.fromSourceClaimId === sourceClaimId ? "outgoing" : "incoming";

interface SourceClaimEdgeReadback {
  edge: SourceClaimEdge;
  relatedSourceClaim?: SourceClaim;
}

const relatedSourceClaimIdFor = (
  sourceClaimId: SourceClaim["id"],
  edge: SourceClaimEdge
): SourceClaim["id"] =>
  (edge.fromSourceClaimId === sourceClaimId
    ? edge.toSourceClaimId
    : edge.fromSourceClaimId) as SourceClaim["id"];

const optionalValueLine = (
  key: string,
  value: string | undefined
): string[] =>
  value === undefined ? [] : [`  ${key}: ${value}`];

const sourceRelationMetadataLines = (
  edge: SourceClaimEdge
): string[] => {
  const metadata = readSourceRelationMetadataReadback(edge.metadata);

  return [
    ...optionalValueLine("consumer", metadata.consumer),
    ...optionalValueLine("doesNotProve", metadata.doesNotProve),
    ...optionalValueLine("evidenceRef", metadata.evidenceRef),
    ...optionalValueLine("sourceDecisionRef", metadata.sourceDecisionRef),
    ...optionalValueLine("scope", metadata.scope),
    ...optionalValueLine("validFrom", metadata.validFrom),
    ...optionalValueLine("validUntil", metadata.validUntil),
    ...optionalValueLine("invalidatedAt", metadata.invalidatedAt),
    ...optionalValueLine("file", metadata.file),
    ...optionalValueLine("contentHash", metadata.contentHash),
    ...(metadata.sourceRanges.length === 0
      ? []
      : [
          "  sourceRanges:",
          ...metadata.sourceRanges.map((range) => `  - ${range}`)
        ])
  ];
};

const relatedSourceClaimReadbackLines = (
  readback: SourceClaimEdgeReadback
): string[] => {
  if (readback.relatedSourceClaim === undefined) {
    return ["    relatedSourceClaimReadback: missing"];
  }

  return [
    "    relatedSourceClaimReadback: hit",
    `    status: ${readback.relatedSourceClaim.status}`,
    `    claim: ${readback.relatedSourceClaim.claim}`,
    `    mechanism: ${readback.relatedSourceClaim.mechanism}`,
    `    krnImplication: ${readback.relatedSourceClaim.krnImplication}`,
    `    consumer: ${readback.relatedSourceClaim.consumer}`,
    `    doesNotProve: ${readback.relatedSourceClaim.doesNotProve}`
  ];
};

const formatEdge = (
  sourceClaimId: SourceClaim["id"],
  readback: SourceClaimEdgeReadback
): string[] => {
  const edge = readback.edge;
  const relatedSourceClaimId = relatedSourceClaimIdFor(sourceClaimId, edge);

  return [
    `- sourceClaimEdge: ${edge.id}`,
    `  direction: ${directionFor(sourceClaimId, edge)}`,
    `  fromSourceClaimId: ${edge.fromSourceClaimId}`,
    `  toSourceClaimId: ${edge.toSourceClaimId}`,
    `  kind: ${edge.kind}`,
    ...sourceRelationMetadataLines(edge),
    "  edgeInfluencedSourceContext:",
    `    relatedSourceClaimId: ${relatedSourceClaimId}`,
    ...relatedSourceClaimReadbackLines(readback)
  ];
};

const formatSourceClaimEdges = (
  sourceClaim: SourceClaim,
  edgeReadbacks: readonly SourceClaimEdgeReadback[]
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
    `count: ${edgeReadbacks.length}`,
    ...(edgeReadbacks.length === 0
      ? ["- none"]
      : edgeReadbacks.flatMap((edgeReadback) => formatEdge(sourceClaim.id, edgeReadback))),
    "",
    "Proof:",
    "- proves: KRN read the SourceClaim row and connected SourceClaimEdge rows from the current Postgres store",
    "- proves: edge metadata is visible to the operator for review",
    "- proves: connected SourceClaim context can be surfaced through persisted SourceClaimEdge readback",
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
    const edgeReadbacks = await Promise.all(edges.map(async (edge): Promise<SourceClaimEdgeReadback> => {
      const relatedSourceClaim = await databaseRuntime.sourceRepository.getSourceClaimById(
        relatedSourceClaimIdFor(typedSourceClaimId, edge)
      );

      return relatedSourceClaim === undefined
        ? { edge }
        : { edge, relatedSourceClaim };
    }));

    return {
      stdout: formatSourceClaimEdges(sourceClaim, edgeReadbacks)
    };
  } finally {
    await databaseRuntime.close();
  }
};
