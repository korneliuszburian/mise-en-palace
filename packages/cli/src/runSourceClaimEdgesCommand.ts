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

const optionalMetadataLine = (
  metadata: Record<string, unknown>,
  key: string
): string[] => {
  const value = stringMetadata(metadata, key);

  return value === undefined ? [] : [`  ${key}: ${value}`];
};

const optionalEdgeMetadataLines = (edge: SourceClaimEdge): string[] => [
  ...optionalMetadataLine(edge.metadata, "evidenceRef"),
  ...optionalMetadataLine(edge.metadata, "sourceDecisionRef"),
  ...optionalMetadataLine(edge.metadata, "scope"),
  ...optionalMetadataLine(edge.metadata, "validFrom"),
  ...optionalMetadataLine(edge.metadata, "validUntil"),
  ...optionalMetadataLine(edge.metadata, "invalidatedAt"),
  ...optionalMetadataLine(edge.metadata, "file"),
  ...optionalMetadataLine(edge.metadata, "contentHash")
];

const sourceRangeLines = (edge: SourceClaimEdge): string[] => {
  const sourceRanges = stringArrayMetadata(edge.metadata, "sourceRanges");

  return sourceRanges === undefined
    ? []
    : [
        "  sourceRanges:",
        ...sourceRanges.map((range) => `  - ${range}`)
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
    `  consumer: ${edge.metadata.consumer}`,
    `  doesNotProve: ${edge.metadata.doesNotProve}`,
    ...optionalEdgeMetadataLines(edge),
    ...sourceRangeLines(edge),
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
