import { createHash } from "node:crypto";
import {
  readFile,
  stat
} from "node:fs/promises";
import path from "node:path";

import {
  assessCandidateReviewability
} from "@krn/core";
import type {
  SourceClaim,
  SourceClaimEdge,
  SourceClaimEdgeKind
} from "@krn/core";
import {
  parseSearchDocumentInput,
  parseSourceArtifactInput,
  parseSourceClaimInput
} from "@krn/schema";
import type {
  CliCommand
} from "./parseArgs.js";
import {
  findRepoRoot,
  resolveRepoInputFile
} from "./cliFileBoundary.js";
import {
  createDatabaseRuntime
} from "./databaseRuntime.js";
import type {
  DatabaseRuntime,
  DatabaseRuntimeInput
} from "./databaseRuntime.js";
import {
  extractLocalSourceCandidates
} from "./sourceArtifactPreviewExtraction.js";
import type {
  ExtractionCandidatePreview,
  ExtractionClaimCandidate,
  SourceArtifactPreviewChunk
} from "./sourceArtifactPreviewExtraction.js";

export type SourceArtifactPreviewCommand = Extract<CliCommand, { kind: "sourceArtifactPreview" }>;

export interface SourceArtifactPreviewCommandRuntime {
  cwd: string;
  env?: Record<string, string | undefined>;
  now?(): string;
  command: SourceArtifactPreviewCommand;
  createDatabaseRuntime?: CreateSourceArtifactPreviewDatabaseRuntime;
}

export interface SourceArtifactPreviewCommandResult {
  stdout: string;
}

export type CreateSourceArtifactPreviewDatabaseRuntime = (
  input: DatabaseRuntimeInput
) => Promise<DatabaseRuntime>;

interface SourceArtifactPreviewPersistenceResult {
  lines: string[];
  readback: SourceArtifactPreviewPersistenceReadback;
  searchDocumentPersisted: boolean;
  sourceClaimPersisted: boolean;
  sourceClaimEdgePersisted: boolean;
}

interface SourceArtifactPreviewPersistenceReadback {
  projectId: string;
  sourceArtifact: {
    id: string;
  };
  sourceChunks: readonly string[];
  searchDocument: {
    id: string;
    lexicalReadbackQuery: string;
    lexicalReadback: "hit" | "missing";
    lexicalScore?: number;
  };
  sourceClaim: {
    created: boolean;
    readback: "hit" | "missing" | "not_created";
    id?: string;
    reviewedExtractionClaimCandidateId?: string;
    reviewedExtractionClaimSourceRange?: string;
  };
  sourceClaimEdge: {
    created: boolean;
    readback: "hit" | "missing" | "not_created";
    id?: string;
    kind?: SourceClaimEdgeKind;
  };
  ingestLoop: {
    artifactToChunks: "ready";
    chunkRows: number;
    chunkToSearchDocument: "ready" | "missing_readback";
    searchDocumentToActivationReadback: "ready" | "missing_readback";
    sourceClaimReadback: "ready" | "missing_readback" | "not_created";
    sourceClaimEdgeReadback: "ready" | "missing_readback" | "not_created";
    activationReadbackQuery: string;
    sourceSearchReadbackCommand: string;
    brainSearchReadbackCommand: string;
    nextAction: string;
    doesNotProve: string;
  };
}

interface CandidateField {
  name: keyof Pick<
    SourceArtifactPreviewCommand,
    | "claim"
    | "mechanism"
    | "krnImplication"
    | "doesNotProve"
    | "supportType"
    | "trustTier"
    | "consumer"
    | "falsifier"
  >;
  label: string;
}

const defaultChunkLines = 40;
const defaultLimitChunks = 3;
const maxPreviewCharacters = 240;
const sourceClaimCandidateFields: readonly CandidateField[] = [
  { name: "claim", label: "--claim" },
  { name: "mechanism", label: "--mechanism" },
  { name: "krnImplication", label: "--krn-implication" },
  { name: "doesNotProve", label: "--does-not-prove" },
  { name: "supportType", label: "--support-type" },
  { name: "trustTier", label: "--trust-tier" },
  { name: "consumer", label: "--consumer" },
  { name: "falsifier", label: "--falsifier" }
] as const;
const reviewedExtractionClaimCandidateFields: readonly CandidateField[] =
  sourceClaimCandidateFields.filter((field) => field.name !== "claim");

const searchDocumentCandidateDoesNotProve =
  "This SearchDocument candidate does not prove source truth, claim correctness, DB persistence, embeddings, graph retrieval, or crawler readiness.";

const sourceClaimCandidateDoesNotProve =
  "This SourceClaim candidate does not prove the claim is true or should be accepted without review.";
const extractionCandidateDoesNotProve =
  "These deterministic extraction candidates do not prove entity identity, claim truth, relation correctness, graph retrieval quality, extraction quality, crawler readiness, or Memory Core mutation.";
const defaultWorkspaceSlug = "local";
const defaultProjectSlug = "mise-en-palace";

interface GraphEdgeCandidateField {
  name: keyof Pick<
    SourceArtifactPreviewCommand,
    | "graphEdgeToSourceClaimId"
    | "graphEdgeKind"
    | "graphEdgeConsumer"
    | "graphEdgeDoesNotProve"
  >;
  label: string;
}

const graphEdgeCandidateFields: readonly GraphEdgeCandidateField[] = [
  { name: "graphEdgeToSourceClaimId", label: "--graph-edge-to-source-claim-id" },
  { name: "graphEdgeKind", label: "--graph-edge-kind" },
  { name: "graphEdgeConsumer", label: "--graph-edge-consumer" },
  { name: "graphEdgeDoesNotProve", label: "--graph-edge-does-not-prove" }
] as const;

interface CompleteGraphEdgeCommandInput {
  toSourceClaimId: string;
  kind: SourceClaimEdgeKind;
  consumer: string;
  doesNotProve: string;
  evidenceRef?: string;
  sourceDecisionRef?: string;
  scope?: string;
  validFrom?: string;
  validUntil?: string;
  invalidatedAt?: string;
}

interface ReviewedExtractionClaimSelection {
  candidate: ExtractionClaimCandidate;
}

type SourceArtifactRecord = Awaited<
  ReturnType<DatabaseRuntime["sourceRepository"]["createSourceArtifact"]>
>;
type SourceChunkCreator = NonNullable<DatabaseRuntime["sourceRepository"]["createSourceChunk"]>;
type SourceChunkRecord = Awaited<ReturnType<SourceChunkCreator>>;
type RetrievalRepositoryRuntime = NonNullable<DatabaseRuntime["retrievalRepository"]>;
type SearchDocumentRecord = Awaited<
  ReturnType<RetrievalRepositoryRuntime["createSearchDocument"]>
>;
type SearchDocumentSearchResult = Awaited<
  ReturnType<RetrievalRepositoryRuntime["searchLexical"]>
>[number];
type ParsedSourceClaimInput = ReturnType<typeof parseSourceClaimInput>;
type SourceClaimEdgeMetadataInput = Parameters<
  DatabaseRuntime["sourceRepository"]["createSourceClaimEdge"]
>[0]["metadata"];

interface SourceArtifactPersistenceRows {
  sourceArtifact: SourceArtifactRecord;
  sourceChunks: SourceChunkRecord[];
  firstChunk: SourceChunkRecord | undefined;
}

interface SearchDocumentReadbackRows {
  searchDocument: SearchDocumentRecord;
  readbackQuery: string;
  readbackHit: SearchDocumentSearchResult | undefined;
}

interface SourceClaimPersistenceRows {
  sourceClaim: SourceClaim | undefined;
  sourceClaimReadback: SourceClaim | undefined;
}

interface SourceClaimEdgePersistenceRows {
  sourceClaimEdge: SourceClaimEdge | undefined;
  sourceClaimEdgeReadback: SourceClaimEdge | undefined;
}

const sha256 = (content: string): string =>
  `sha256:${createHash("sha256").update(content).digest("hex")}`;

const normalizeLines = (content: string): string[] => {
  const normalized = content.replace(/\r\n/gu, "\n").replace(/\r/gu, "\n");
  const lines = normalized.split("\n");

  if (lines.at(-1) === "") {
    return lines.slice(0, -1);
  }

  return lines;
};

const previewText = (lines: readonly string[]): string => {
  const joined = lines.join("\n").trim();

  if (joined.length <= maxPreviewCharacters) {
    return joined.length === 0 ? "<empty chunk>" : joined;
  }

  return `${joined.slice(0, maxPreviewCharacters)}...`;
};

const chunkLines = (
  lines: readonly string[],
  chunkSize: number,
  limit: number
): SourceArtifactPreviewChunk[] => {
  if (lines.length === 0) {
    return [{
      ordinal: 1,
      startLine: 1,
      endLine: 1,
      content: "",
      contentHash: sha256(""),
      preview: "<empty file>"
    }];
  }

  const chunks: SourceArtifactPreviewChunk[] = [];

  for (
    let startIndex = 0, ordinal = 1;
    startIndex < lines.length && chunks.length < limit;
    startIndex += chunkSize, ordinal += 1
  ) {
    const chunk = lines.slice(startIndex, startIndex + chunkSize);

    chunks.push({
      ordinal,
      startLine: startIndex + 1,
      endLine: startIndex + chunk.length,
      content: chunk.join("\n"),
      contentHash: sha256(chunk.join("\n")),
      preview: previewText(chunk)
    });
  }

  return chunks;
};

const formatChunks = (chunks: readonly SourceArtifactPreviewChunk[]): string[] =>
  chunks.flatMap((chunk) => [
    `- chunk ${chunk.ordinal}`,
    `  sourceRange: lines ${chunk.startLine}-${chunk.endLine}`,
    `  contentHash: ${chunk.contentHash}`,
    `  preview: ${chunk.preview.replace(/\n/gu, "\\n")}`
  ]);

const formatReviewabilityReasons = (reasons: readonly string[]): string[] => [
  "  reviewability reasons:",
  ...reasons.map((reason) => `  - ${reason}`)
];

const chunkBody = (chunks: readonly SourceArtifactPreviewChunk[]): string =>
  chunks.map((chunk) =>
    [
      `chunk ${chunk.ordinal}`,
      `sourceRange: lines ${chunk.startLine}-${chunk.endLine}`,
      `contentHash: ${chunk.contentHash}`,
      `preview: ${chunk.preview}`
    ].join("\n")
  ).join("\n\n");

const searchDocumentCandidateView = (
  file: string,
  artifactHash: string,
  chunks: readonly SourceArtifactPreviewChunk[]
) => {
  const candidate = parseSearchDocumentInput({
    subjectType: "source_artifact",
    subjectId: artifactHash,
    trustTier: "source-code",
    language: "english",
    title: `Local source artifact: ${file}`,
    body: chunkBody(chunks),
    metadataFilters: {
      source: "local_source_artifact_preview"
    },
    metadata: {
      file,
      contentHash: artifactHash,
      chunkCount: chunks.length,
      source: "krn source artifact preview"
    }
  });
  const reviewability = assessCandidateReviewability({
    summary: candidate.title,
    body: candidate.body,
    evidenceRefs: [
      file,
      artifactHash,
      ...chunks.map((chunk) => chunk.contentHash)
    ],
    applicationGuidance: "Use as a reviewable lexical/search document candidate for local source artifact ingestion.",
    doesNotProve: searchDocumentCandidateDoesNotProve
  });

  return {
    id: `search-document-candidate:${artifactHash.slice("sha256:".length, "sha256:".length + 12)}`,
    candidate,
    reviewability,
    evidenceRefs: [
      file,
      artifactHash
    ],
    doesNotProve: searchDocumentCandidateDoesNotProve
  };
};

const formatSearchDocumentCandidate = (
  file: string,
  artifactHash: string,
  chunks: readonly SourceArtifactPreviewChunk[],
  persisted: boolean
): string[] => {
  const view = searchDocumentCandidateView(file, artifactHash, chunks);

  return [
    "searchDocumentCandidate:",
    `- id: ${view.id}`,
    "  status: candidate",
    `  reviewability: ${view.reviewability.reviewability}`,
    ...formatReviewabilityReasons(view.reviewability.reasons),
    `  subjectType: ${view.candidate.subjectType}`,
    `  subjectId: ${view.candidate.subjectId}`,
    `  trustTier: ${view.candidate.trustTier}`,
    `  title: ${view.candidate.title}`,
    `  evidenceRefs: ${view.evidenceRefs.join(", ")}`,
    `  doesNotProve: ${view.doesNotProve}`,
    persisted
      ? "  SearchDocument row created: see Persistence readback"
      : "  No SearchDocument row created"
  ];
};

const localArtifactUri = (resolvedPath: string, artifactHash: string, now: string): string =>
  `file://${resolvedPath}?krnPreviewHash=${encodeURIComponent(artifactHash)}&capturedAt=${encodeURIComponent(now)}`;

const requireDatabaseUrl = (runtime: SourceArtifactPreviewCommandRuntime): string => {
  const databaseUrl = runtime.env?.KRN_DATABASE_URL?.trim();

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error("KRN_DATABASE_URL is required for krn source artifact preview --persist");
  }

  return databaseUrl;
};

const createPreviewDatabaseRuntime = async (
  runtime: SourceArtifactPreviewCommandRuntime,
  databaseUrl: string,
  now: () => string
): Promise<DatabaseRuntime> => {
  const createRuntime = runtime.createDatabaseRuntime ?? createDatabaseRuntime;

  return createRuntime({
    databaseUrl,
    workspaceSlug: defaultWorkspaceSlug,
    projectSlug: defaultProjectSlug,
    repoPathHint: await findRepoRoot(runtime.cwd),
    now,
    createId: (prefix) => `${prefix}-${Date.now()}`
  });
};

const requirePreviewPersistenceRepositories = (
  databaseRuntime: DatabaseRuntime
): {
  retrievalRepository: RetrievalRepositoryRuntime;
  createSourceChunk: SourceChunkCreator;
} => {
  const { retrievalRepository } = databaseRuntime;
  const createSourceChunk = databaseRuntime.sourceRepository.createSourceChunk?.bind(
    databaseRuntime.sourceRepository
  );

  if (retrievalRepository === undefined) {
    throw new Error("SearchDocument persistence is unavailable in this database runtime");
  }

  if (createSourceChunk === undefined) {
    throw new Error("SourceChunk persistence is unavailable in this database runtime");
  }

  return {
    retrievalRepository,
    createSourceChunk
  };
};

const persistPreviewArtifactAndChunks = async (input: {
  databaseRuntime: DatabaseRuntime;
  createSourceChunk: SourceChunkCreator;
  file: string;
  resolvedPath: string;
  artifactHash: string;
  capturedAt: string;
  chunks: readonly SourceArtifactPreviewChunk[];
}): Promise<SourceArtifactPersistenceRows> => {
  const artifactInput = parseSourceArtifactInput({
    kind: "file",
    title: `Local source artifact: ${input.file}`,
    uri: localArtifactUri(input.resolvedPath, input.artifactHash, input.capturedAt),
    contentHash: input.artifactHash,
    trustTier: "source-code",
    metadata: {
      file: input.file,
      resolvedPath: input.resolvedPath,
      source: "krn source artifact preview --persist",
      doesNotProve: "Persisted local source artifact does not prove source truth, source freshness, embeddings, graph retrieval, crawler readiness, or Memory Core mutation."
    }
  });
  const sourceArtifact = await input.databaseRuntime.sourceRepository.createSourceArtifact({
    projectId: input.databaseRuntime.projectId,
    kind: artifactInput.kind,
    trustTier: artifactInput.trustTier,
    uri: artifactInput.uri,
    title: artifactInput.title,
    contentHash: artifactInput.contentHash ?? input.artifactHash,
    metadata: artifactInput.metadata
  });
  const sourceChunks: SourceChunkRecord[] = [];

  for (const chunk of input.chunks) {
    sourceChunks.push(await input.createSourceChunk({
      sourceArtifactId: sourceArtifact.id,
      ordinal: chunk.ordinal,
      content: chunk.content,
      contentHash: chunk.contentHash,
      metadata: {
        file: input.file,
        sourceRange: `lines ${chunk.startLine}-${chunk.endLine}`,
        startLine: chunk.startLine,
        endLine: chunk.endLine
      }
    }));
  }

  return {
    sourceArtifact,
    sourceChunks,
    firstChunk: sourceChunks[0]
  };
};

const persistPreviewSearchDocument = async (input: {
  databaseRuntime: DatabaseRuntime;
  retrievalRepository: RetrievalRepositoryRuntime;
  file: string;
  artifactHash: string;
  chunks: readonly SourceArtifactPreviewChunk[];
  sourceArtifact: SourceArtifactRecord;
  firstChunk: SourceChunkRecord | undefined;
  sourceChunks: readonly SourceChunkRecord[];
}): Promise<SearchDocumentReadbackRows> => {
  const artifactHashPrefix = input.artifactHash.slice("sha256:".length, "sha256:".length + 16);
  const readbackQuery = `krn-source-artifact-preview ${artifactHashPrefix}`;
  const body = chunkBody(input.chunks);
  const documentInput = parseSearchDocumentInput({
    projectId: input.databaseRuntime.projectId,
    subjectType: "source_artifact",
    subjectId: input.sourceArtifact.id,
    sourceArtifactId: input.sourceArtifact.id,
    ...(input.firstChunk === undefined ? {} : { sourceChunkId: input.firstChunk.id }),
    trustTier: "source-code",
    language: "english",
    title: `Local source artifact: ${input.file}`,
    body,
    searchText: [
      "krn-source-artifact-preview",
      artifactHashPrefix,
      input.file,
      body
    ].join("\n"),
    metadataFilters: {
      source: "local_source_artifact_preview",
      file: input.file
    },
    metadata: {
      file: input.file,
      contentHash: input.artifactHash,
      chunkIds: input.sourceChunks.map((chunk) => chunk.id),
      source: "krn source artifact preview --persist",
      doesNotProve: "Persisted SearchDocument readback does not prove embeddings, graph retrieval, source truth, source freshness, or Memory Core mutation."
    }
  });
  const searchDocument = await input.retrievalRepository.createSearchDocument({
    projectId: input.databaseRuntime.projectId,
    subjectType: documentInput.subjectType,
    subjectId: documentInput.subjectId,
    sourceArtifactId: input.sourceArtifact.id,
    ...(input.firstChunk === undefined ? {} : { sourceChunkId: input.firstChunk.id }),
    trustTier: documentInput.trustTier,
    validityStatus: documentInput.validityStatus,
    language: documentInput.language,
    title: documentInput.title,
    body: documentInput.body,
    searchText: documentInput.searchText,
    metadataFilters: documentInput.metadataFilters,
    metadata: documentInput.metadata
  });
  const lexicalReadback = await input.retrievalRepository.searchLexical({
    projectId: input.databaseRuntime.projectId,
    query: readbackQuery,
    limit: 5
  });

  return {
    searchDocument,
    readbackQuery,
    readbackHit: lexicalReadback.find((result) => result.id === searchDocument.id)
  };
};

const hasCompleteSourceClaimCandidate = (
  command: SourceArtifactPreviewCommand,
  reviewedExtractionClaimSelection: ReviewedExtractionClaimSelection | undefined
): boolean =>
  (
    hasAnyManualSourceClaimCandidateField(command) &&
    missingSourceClaimCandidateFields(command).length === 0
  ) ||
  (
    reviewedExtractionClaimSelection !== undefined &&
    missingReviewedExtractionClaimCandidateFields(command).length === 0
  );

const sourceChunkForReviewedClaim = (
  chunks: readonly SourceArtifactPreviewChunk[],
  sourceChunks: readonly SourceChunkRecord[],
  firstChunk: SourceChunkRecord | undefined,
  reviewedExtractionClaimSelection: ReviewedExtractionClaimSelection | undefined
): SourceChunkRecord | undefined => {
  if (reviewedExtractionClaimSelection === undefined) {
    return firstChunk;
  }

  const extractionChunkIndex = chunks.findIndex((chunk) =>
    reviewedExtractionClaimSelection.candidate.lineNumber >= chunk.startLine &&
    reviewedExtractionClaimSelection.candidate.lineNumber <= chunk.endLine
  );

  return sourceChunks[extractionChunkIndex] ?? firstChunk;
};

const parsePreviewSourceClaimInput = (input: {
  command: SourceArtifactPreviewCommand;
  file: string;
  artifactHash: string;
  sourceArtifact: SourceArtifactRecord;
  sourceChunks: readonly SourceChunkRecord[];
  claimSourceChunk: SourceChunkRecord | undefined;
  reviewedExtractionClaimSelection: ReviewedExtractionClaimSelection | undefined;
}): ParsedSourceClaimInput | undefined => {
  if (!hasCompleteSourceClaimCandidate(input.command, input.reviewedExtractionClaimSelection)) {
    return undefined;
  }

  return parseSourceClaimInput({
    sourceArtifactId: input.sourceArtifact.id,
    ...(input.claimSourceChunk === undefined ? {} : { sourceChunkId: input.claimSourceChunk.id }),
    claim: input.reviewedExtractionClaimSelection?.candidate.text ?? input.command.claim,
    mechanism: input.command.mechanism,
    krnImplication: input.command.krnImplication,
    doesNotProve: input.command.doesNotProve,
    trustTier: input.command.trustTier,
    supportType: input.command.supportType,
    consumer: input.command.consumer,
    falsifier: input.command.falsifier,
    metadata: {
      file: input.file,
      contentHash: input.artifactHash,
      chunkIds: input.sourceChunks.map((chunk) => chunk.id),
      ...(input.reviewedExtractionClaimSelection === undefined
        ? {}
        : {
            extractionCandidateId: input.reviewedExtractionClaimSelection.candidate.id,
            extractionCandidateReviewability: input.reviewedExtractionClaimSelection.candidate.reviewability,
            extractionCandidateReviewabilityReason: input.reviewedExtractionClaimSelection.candidate.reviewabilityReason,
            extractionCandidateSourceRange: input.reviewedExtractionClaimSelection.candidate.sourceRange,
            extractionCandidateLineNumber: input.reviewedExtractionClaimSelection.candidate.lineNumber,
            reviewedExtractionBridge: true
          }),
      source: "krn source artifact preview --persist",
      doesNotProve: "Persisted SourceClaim readback does not prove source truth, claim acceptance, automatic extraction, embeddings, graph retrieval, crawler readiness, or Memory Core mutation."
    }
  });
};

const persistOptionalSourceClaim = async (input: {
  databaseRuntime: DatabaseRuntime;
  command: SourceArtifactPreviewCommand;
  file: string;
  artifactHash: string;
  chunks: readonly SourceArtifactPreviewChunk[];
  sourceArtifact: SourceArtifactRecord;
  sourceChunks: readonly SourceChunkRecord[];
  firstChunk: SourceChunkRecord | undefined;
  reviewedExtractionClaimSelection: ReviewedExtractionClaimSelection | undefined;
}): Promise<SourceClaimPersistenceRows> => {
  const claimSourceChunk = sourceChunkForReviewedClaim(
    input.chunks,
    input.sourceChunks,
    input.firstChunk,
    input.reviewedExtractionClaimSelection
  );
  const parsedSourceClaim = parsePreviewSourceClaimInput({
    command: input.command,
    file: input.file,
    artifactHash: input.artifactHash,
    sourceArtifact: input.sourceArtifact,
    sourceChunks: input.sourceChunks,
    claimSourceChunk,
    reviewedExtractionClaimSelection: input.reviewedExtractionClaimSelection
  });

  if (parsedSourceClaim === undefined) {
    return {
      sourceClaim: undefined,
      sourceClaimReadback: undefined
    };
  }

  const sourceClaim = await input.databaseRuntime.sourceRepository.createSourceClaim({
    sourceArtifactId: input.sourceArtifact.id,
    ...(parsedSourceClaim.sourceChunkId === undefined
      ? {}
      : { sourceChunkId: parsedSourceClaim.sourceChunkId }),
    ...(parsedSourceClaim.executionRunId === undefined
      ? {}
      : { executionRunId: parsedSourceClaim.executionRunId }),
    claim: parsedSourceClaim.claim,
    mechanism: parsedSourceClaim.mechanism,
    krnImplication: parsedSourceClaim.krnImplication,
    doesNotProve: parsedSourceClaim.doesNotProve,
    trustTier: parsedSourceClaim.trustTier,
    supportType: parsedSourceClaim.supportType,
    consumer: parsedSourceClaim.consumer,
    falsifier: parsedSourceClaim.falsifier,
    ...(parsedSourceClaim.revisitWhen === undefined
      ? {}
      : { revisitWhen: parsedSourceClaim.revisitWhen }),
    status: parsedSourceClaim.status,
    metadata: parsedSourceClaim.metadata
  });

  return {
    sourceClaim,
    sourceClaimReadback: await input.databaseRuntime.sourceRepository.getSourceClaimById(sourceClaim.id)
  };
};

const graphEdgeMetadata = (input: {
  graphEdgeInput: CompleteGraphEdgeCommandInput;
  file: string;
  artifactHash: string;
  chunks: readonly SourceArtifactPreviewChunk[];
  sourceChunks: readonly SourceChunkRecord[];
}): SourceClaimEdgeMetadataInput => ({
  consumer: input.graphEdgeInput.consumer,
  doesNotProve: input.graphEdgeInput.doesNotProve,
  ...(input.graphEdgeInput.evidenceRef === undefined
    ? {}
    : { evidenceRef: input.graphEdgeInput.evidenceRef }),
  ...(input.graphEdgeInput.sourceDecisionRef === undefined
    ? {}
    : { sourceDecisionRef: input.graphEdgeInput.sourceDecisionRef }),
  ...(input.graphEdgeInput.scope === undefined ? {} : { scope: input.graphEdgeInput.scope }),
  ...(input.graphEdgeInput.validFrom === undefined
    ? {}
    : { validFrom: input.graphEdgeInput.validFrom }),
  ...(input.graphEdgeInput.validUntil === undefined
    ? {}
    : { validUntil: input.graphEdgeInput.validUntil }),
  ...(input.graphEdgeInput.invalidatedAt === undefined
    ? {}
    : { invalidatedAt: input.graphEdgeInput.invalidatedAt }),
  file: input.file,
  contentHash: input.artifactHash,
  chunkIds: input.sourceChunks.map((chunk) => chunk.id),
  sourceRanges: input.chunks.map((chunk) => `lines ${chunk.startLine}-${chunk.endLine}`),
  source: "krn source artifact preview --persist"
});

const persistOptionalSourceClaimEdge = async (input: {
  databaseRuntime: DatabaseRuntime;
  command: SourceArtifactPreviewCommand;
  file: string;
  artifactHash: string;
  chunks: readonly SourceArtifactPreviewChunk[];
  sourceChunks: readonly SourceChunkRecord[];
  sourceClaim: SourceClaim | undefined;
}): Promise<SourceClaimEdgePersistenceRows> => {
  const graphEdgeInput = completeGraphEdgeInput(input.command);

  if (input.sourceClaim === undefined || graphEdgeInput === undefined) {
    return {
      sourceClaimEdge: undefined,
      sourceClaimEdgeReadback: undefined
    };
  }

  const sourceClaimEdge = await input.databaseRuntime.sourceRepository.createSourceClaimEdge({
    fromSourceClaimId: input.sourceClaim.id,
    toSourceClaimId: graphEdgeInput.toSourceClaimId as SourceClaim["id"],
    kind: graphEdgeInput.kind,
    metadata: graphEdgeMetadata({
      graphEdgeInput,
      file: input.file,
      artifactHash: input.artifactHash,
      chunks: input.chunks,
      sourceChunks: input.sourceChunks
    })
  });
  const sourceClaimEdgeReadback = (
    await input.databaseRuntime.sourceRepository.listSourceClaimEdgesForClaim(
      sourceClaimEdge.fromSourceClaimId
    )
  ).find((edge) => edge.id === sourceClaimEdge.id);

  return {
    sourceClaimEdge,
    sourceClaimEdgeReadback
  };
};

const formatSearchDocumentReadbackLines = (
  search: SearchDocumentReadbackRows
): string[] => [
  `searchDocument: ${search.searchDocument.id}`,
  `lexicalReadbackQuery: ${search.readbackQuery}`,
  `lexicalReadback: ${search.readbackHit === undefined ? "missing" : "hit"}`,
  ...(search.readbackHit === undefined
    ? []
    : [`lexicalScore: ${search.readbackHit.lexicalScore}`])
];

const formatSourceClaimReadbackLines = (input: {
  claim: SourceClaimPersistenceRows;
  reviewedExtractionClaimSelection: ReviewedExtractionClaimSelection | undefined;
}): string[] => {
  if (input.claim.sourceClaim === undefined) {
    return ["sourceClaim: not created"];
  }

  return [
    `sourceClaim: ${input.claim.sourceClaim.id}`,
    `sourceClaimReadback: ${input.claim.sourceClaimReadback === undefined ? "missing" : "hit"}`,
    ...(input.reviewedExtractionClaimSelection === undefined
      ? []
      : [
          `reviewedExtractionClaimCandidate: ${input.reviewedExtractionClaimSelection.candidate.id}`,
          `reviewedExtractionClaimSourceRange: ${input.reviewedExtractionClaimSelection.candidate.sourceRange}`
        ])
  ];
};

const formatSourceClaimEdgeReadbackLines = (
  edge: SourceClaimEdgePersistenceRows
): string[] => {
  if (edge.sourceClaimEdge === undefined) {
    return ["sourceClaimEdge: not created"];
  }

  return [
    `sourceClaimEdge: ${edge.sourceClaimEdge.id}`,
    `sourceClaimEdgeKind: ${edge.sourceClaimEdge.kind}`,
    `sourceClaimEdgeReadback: ${edge.sourceClaimEdgeReadback === undefined ? "missing" : "hit"}`
  ];
};

const readbackStatus = (
  created: boolean,
  readBack: boolean
): "ready" | "missing_readback" | "not_created" => {
  if (!created) {
    return "not_created";
  }

  return readBack ? "ready" : "missing_readback";
};

const shellQuote = (value: string): string =>
  `"${value.replace(/\\/gu, "\\\\").replace(/"/gu, "\\\"")}"`;

const sourceSearchReadbackCommand = (query: string): string =>
  `krn source search --query ${shellQuote(query)} --json`;

const brainSearchReadbackCommand = (query: string): string =>
  `krn brain search --query ${shellQuote(query)} --json`;

const ingestLoopReadback = (input: {
  artifact: SourceArtifactPersistenceRows;
  search: SearchDocumentReadbackRows;
  claim: SourceClaimPersistenceRows;
  edge: SourceClaimEdgePersistenceRows;
}): SourceArtifactPreviewPersistenceReadback["ingestLoop"] => {
  const searchStatus: "ready" | "missing_readback" =
    input.search.readbackHit === undefined ? "missing_readback" : "ready";
  const claimStatus = readbackStatus(
    input.claim.sourceClaim !== undefined,
    input.claim.sourceClaimReadback !== undefined
  );
  const edgeStatus = readbackStatus(
    input.edge.sourceClaimEdge !== undefined,
    input.edge.sourceClaimEdgeReadback !== undefined
  );

  return {
    artifactToChunks: "ready",
    chunkRows: input.artifact.sourceChunks.length,
    chunkToSearchDocument: searchStatus,
    searchDocumentToActivationReadback: searchStatus,
    sourceClaimReadback: claimStatus,
    sourceClaimEdgeReadback: edgeStatus,
    activationReadbackQuery: input.search.readbackQuery,
    sourceSearchReadbackCommand: sourceSearchReadbackCommand(input.search.readbackQuery),
    brainSearchReadbackCommand: brainSearchReadbackCommand(input.search.readbackQuery),
    nextAction: "run the readback command before changing ranking, crawler, schema, UI, API, or MCP",
    doesNotProve: "ingest loop readback does not prove activation inclusion, ranking quality, source truth, embeddings, graph retrieval quality, crawler readiness, or product readiness"
  };
};

const formatIngestLoopReadbackLines = (input: {
  artifact: SourceArtifactPersistenceRows;
  search: SearchDocumentReadbackRows;
  claim: SourceClaimPersistenceRows;
  edge: SourceClaimEdgePersistenceRows;
}): string[] => {
  const readback = ingestLoopReadback(input);

  return [
    "Ingest loop readback:",
    `artifactToChunks: ${readback.artifactToChunks} (${readback.chunkRows} chunk row(s))`,
    `chunkToSearchDocument: ${readback.chunkToSearchDocument}`,
    `searchDocumentToActivationReadback: ${readback.searchDocumentToActivationReadback}`,
    `sourceClaimReadback: ${readback.sourceClaimReadback}`,
    `sourceClaimEdgeReadback: ${readback.sourceClaimEdgeReadback}`,
    `activationReadbackQuery: ${readback.activationReadbackQuery}`,
    `sourceSearchReadbackCommand: ${readback.sourceSearchReadbackCommand}`,
    `brainSearchReadbackCommand: ${readback.brainSearchReadbackCommand}`,
    `nextAction: ${readback.nextAction}`,
    `doesNotProve: ${readback.doesNotProve}`
  ];
};

const persistenceReadback = (input: {
  databaseRuntime: DatabaseRuntime;
  artifact: SourceArtifactPersistenceRows;
  search: SearchDocumentReadbackRows;
  claim: SourceClaimPersistenceRows;
  edge: SourceClaimEdgePersistenceRows;
  reviewedExtractionClaimSelection: ReviewedExtractionClaimSelection | undefined;
}): SourceArtifactPreviewPersistenceReadback => ({
  projectId: input.databaseRuntime.projectId,
  sourceArtifact: {
    id: input.artifact.sourceArtifact.id
  },
  sourceChunks: input.artifact.sourceChunks.map((chunk) => chunk.id),
  searchDocument: {
    id: input.search.searchDocument.id,
    lexicalReadbackQuery: input.search.readbackQuery,
    lexicalReadback: input.search.readbackHit === undefined ? "missing" : "hit",
    ...(input.search.readbackHit === undefined
      ? {}
      : { lexicalScore: input.search.readbackHit.lexicalScore })
  },
  sourceClaim: input.claim.sourceClaim === undefined
    ? {
        created: false,
        readback: "not_created"
      }
    : {
        created: true,
        readback: input.claim.sourceClaimReadback === undefined ? "missing" : "hit",
        id: input.claim.sourceClaim.id,
        ...(input.reviewedExtractionClaimSelection === undefined
          ? {}
          : {
              reviewedExtractionClaimCandidateId:
                input.reviewedExtractionClaimSelection.candidate.id,
              reviewedExtractionClaimSourceRange:
                input.reviewedExtractionClaimSelection.candidate.sourceRange
            })
      },
  sourceClaimEdge: input.edge.sourceClaimEdge === undefined
    ? {
        created: false,
        readback: "not_created"
      }
    : {
        created: true,
        readback: input.edge.sourceClaimEdgeReadback === undefined ? "missing" : "hit",
        id: input.edge.sourceClaimEdge.id,
        kind: input.edge.sourceClaimEdge.kind
      },
  ingestLoop: ingestLoopReadback(input)
});

const formatPersistenceReadbackLines = (input: {
  databaseRuntime: DatabaseRuntime;
  artifact: SourceArtifactPersistenceRows;
  search: SearchDocumentReadbackRows;
  claim: SourceClaimPersistenceRows;
  edge: SourceClaimEdgePersistenceRows;
  reviewedExtractionClaimSelection: ReviewedExtractionClaimSelection | undefined;
}): string[] => [
  "Persistence readback:",
  "Persistence: enabled (Postgres, explicit --persist)",
  `project: ${input.databaseRuntime.projectId}`,
  `sourceArtifact: ${input.artifact.sourceArtifact.id}`,
  `sourceChunks: ${input.artifact.sourceChunks.map((chunk) => chunk.id).join(", ")}`,
  ...formatSearchDocumentReadbackLines(input.search),
  ...formatSourceClaimReadbackLines({
    claim: input.claim,
    reviewedExtractionClaimSelection: input.reviewedExtractionClaimSelection
  }),
  ...formatSourceClaimEdgeReadbackLines(input.edge),
  ...formatIngestLoopReadbackLines({
    artifact: input.artifact,
    search: input.search,
    claim: input.claim,
    edge: input.edge
  }),
  "Embeddings: none",
  "Graph runtime: none",
  "doesNotProve: DB readback does not prove source truth, embeddings, graph retrieval, crawler readiness, or product readiness"
];

const persistSourceArtifactPreview = async (
  runtime: SourceArtifactPreviewCommandRuntime,
  file: string,
  resolvedPath: string,
  artifactHash: string,
  chunks: readonly SourceArtifactPreviewChunk[]
): Promise<SourceArtifactPreviewPersistenceResult> => {
  const databaseUrl = requireDatabaseUrl(runtime);
  const now = runtime.now ?? (() => new Date().toISOString());
  const capturedAt = now();
  const extraction = extractLocalSourceCandidates(chunks);
  const reviewedExtractionClaimSelection = selectReviewedExtractionClaimCandidate(
    runtime.command,
    extraction
  );
  const missingReviewedExtractionFields = reviewedExtractionClaimSelection === undefined
    ? []
    : missingReviewedExtractionClaimCandidateFields(runtime.command);

  if (missingReviewedExtractionFields.length > 0) {
    throw new Error(
      `Reviewed extraction claim candidate requires review fields: ${missingReviewedExtractionFields.join(", ")}`
    );
  }

  const databaseRuntime = await createPreviewDatabaseRuntime(runtime, databaseUrl, now);

  try {
    const { retrievalRepository, createSourceChunk } =
      requirePreviewPersistenceRepositories(databaseRuntime);
    const artifact = await persistPreviewArtifactAndChunks({
      databaseRuntime,
      createSourceChunk,
      file,
      resolvedPath,
      artifactHash,
      capturedAt,
      chunks
    });
    const search = await persistPreviewSearchDocument({
      databaseRuntime,
      retrievalRepository,
      file,
      artifactHash,
      chunks,
      sourceArtifact: artifact.sourceArtifact,
      firstChunk: artifact.firstChunk,
      sourceChunks: artifact.sourceChunks
    });
    const claim = await persistOptionalSourceClaim({
      databaseRuntime,
      command: runtime.command,
      file,
      artifactHash,
      chunks,
      sourceArtifact: artifact.sourceArtifact,
      sourceChunks: artifact.sourceChunks,
      firstChunk: artifact.firstChunk,
      reviewedExtractionClaimSelection
    });
    const edge = await persistOptionalSourceClaimEdge({
      databaseRuntime,
      command: runtime.command,
      file,
      artifactHash,
      chunks,
      sourceChunks: artifact.sourceChunks,
      sourceClaim: claim.sourceClaim
    });
    const readback = persistenceReadback({
      databaseRuntime,
      artifact,
      search,
      claim,
      edge,
      reviewedExtractionClaimSelection
    });

    return {
      searchDocumentPersisted: true,
      sourceClaimPersisted: claim.sourceClaim !== undefined,
      sourceClaimEdgePersisted: edge.sourceClaimEdge !== undefined,
      readback,
      lines: formatPersistenceReadbackLines({
        databaseRuntime,
        artifact,
        search,
        claim,
        edge,
        reviewedExtractionClaimSelection
      })
    };
  } finally {
    await databaseRuntime.close();
  }
};

const hasText = (value: string | undefined): value is string =>
  value !== undefined && value.trim().length > 0;

const missingSourceClaimCandidateFields = (
  command: SourceArtifactPreviewCommand
): string[] =>
  sourceClaimCandidateFields
    .filter((field) => !hasText(command[field.name]))
    .map((field) => field.label);

const missingReviewedExtractionClaimCandidateFields = (
  command: SourceArtifactPreviewCommand
): string[] =>
  reviewedExtractionClaimCandidateFields
    .filter((field) => !hasText(command[field.name]))
    .map((field) => field.label);

const hasAnyManualSourceClaimCandidateField = (
  command: SourceArtifactPreviewCommand
): boolean =>
  sourceClaimCandidateFields.some((field) => hasText(command[field.name]));

const hasReviewedExtractionClaimCandidate = (
  command: SourceArtifactPreviewCommand
): command is SourceArtifactPreviewCommand & { reviewedExtractionClaimCandidateId: string } =>
  hasText(command.reviewedExtractionClaimCandidateId);

const selectReviewedExtractionClaimCandidate = (
  command: SourceArtifactPreviewCommand,
  extraction: ExtractionCandidatePreview
): ReviewedExtractionClaimSelection | undefined => {
  if (!hasReviewedExtractionClaimCandidate(command)) {
    return undefined;
  }

  const readyCandidate = extraction.claims.find((claim) =>
    claim.id === command.reviewedExtractionClaimCandidateId
  );

  if (readyCandidate !== undefined) {
    return {
      candidate: readyCandidate
    };
  }

  const deferredCandidate = extraction.deferredClaims.find((claim) =>
    claim.id === command.reviewedExtractionClaimCandidateId
  );

  if (deferredCandidate !== undefined) {
    throw new Error(
      `Cannot persist deferred extraction claim candidate: ${command.reviewedExtractionClaimCandidateId}`
    );
  }

  throw new Error(
    `Reviewed extraction claim candidate not found: ${command.reviewedExtractionClaimCandidateId}`
  );
};

const missingGraphEdgeCandidateFields = (
  command: SourceArtifactPreviewCommand
): string[] =>
  graphEdgeCandidateFields
    .filter((field) => !hasText(command[field.name]))
    .map((field) => field.label);

const hasAnyGraphEdgeCandidateField = (
  command: SourceArtifactPreviewCommand
): boolean =>
  graphEdgeCandidateFields.some((field) => hasText(command[field.name]));

const missingSourceClaimFieldsForGraphEdge = (
  command: SourceArtifactPreviewCommand
): string[] =>
  hasReviewedExtractionClaimCandidate(command)
    ? missingReviewedExtractionClaimCandidateFields(command).map((field) =>
        `${field} for reviewed extraction claim`
      )
    : missingSourceClaimCandidateFields(command).map((field) =>
        `${field} for edge source claim`
      );

const addOptionalGraphEdgeInputFields = (
  input: CompleteGraphEdgeCommandInput,
  command: SourceArtifactPreviewCommand
): void => {
  if (command.graphEdgeEvidenceRef !== undefined) {
    input.evidenceRef = command.graphEdgeEvidenceRef;
  }

  if (command.graphEdgeSourceDecisionRef !== undefined) {
    input.sourceDecisionRef = command.graphEdgeSourceDecisionRef;
  }

  if (command.graphEdgeScope !== undefined) {
    input.scope = command.graphEdgeScope;
  }

  if (command.graphEdgeValidFrom !== undefined) {
    input.validFrom = command.graphEdgeValidFrom;
  }

  if (command.graphEdgeValidUntil !== undefined) {
    input.validUntil = command.graphEdgeValidUntil;
  }

  if (command.graphEdgeInvalidatedAt !== undefined) {
    input.invalidatedAt = command.graphEdgeInvalidatedAt;
  }
};

const completeGraphEdgeInput = (
  command: SourceArtifactPreviewCommand
): CompleteGraphEdgeCommandInput | undefined => {
  const toSourceClaimId = command.graphEdgeToSourceClaimId;
  const kind = command.graphEdgeKind;
  const consumer = command.graphEdgeConsumer;
  const doesNotProve = command.graphEdgeDoesNotProve;

  if (
    !hasText(toSourceClaimId) ||
    kind === undefined ||
    !hasText(consumer) ||
    !hasText(doesNotProve)
  ) {
    return undefined;
  }

  const input: CompleteGraphEdgeCommandInput = {
    toSourceClaimId,
    kind,
    consumer,
    doesNotProve
  };

  addOptionalGraphEdgeInputFields(input, command);

  return input;
};

const generatedGraphEvidenceRefs = (
  file: string,
  artifactHash: string,
  chunks: readonly SourceArtifactPreviewChunk[]
): string[] => [
  file,
  artifactHash,
  ...chunks.map((chunk) => `${file}:lines ${chunk.startLine}-${chunk.endLine}`),
  ...chunks.map((chunk) => chunk.contentHash)
];

const sourceClaimCandidateEvidenceRefs = (
  file: string,
  artifactHash: string,
  chunks: readonly SourceArtifactPreviewChunk[]
): string[] => [
  file,
  artifactHash,
  ...chunks.map((chunk) => chunk.contentHash)
];

const formatNoSourceClaimCandidate = (): string[] => [
  "sourceClaimCandidate:",
  "- not generated",
  "  reason: explicit claim/mechanism/consumer/falsifier inputs were not supplied",
  "  No SourceClaim created"
];

const sourceClaimCandidateMissingFields = (
  command: SourceArtifactPreviewCommand,
  reviewedExtractionClaimSelection: ReviewedExtractionClaimSelection | undefined
): string[] =>
  reviewedExtractionClaimSelection === undefined
    ? missingSourceClaimCandidateFields(command)
    : missingReviewedExtractionClaimCandidateFields(command);

const incompleteSourceClaimCandidateView = (input: {
  command: SourceArtifactPreviewCommand;
  file: string;
  artifactHash: string;
  chunks: readonly SourceArtifactPreviewChunk[];
  missingFields: readonly string[];
  reviewedExtractionClaimSelection: ReviewedExtractionClaimSelection | undefined;
}) => {
  const reviewability = assessCandidateReviewability({
    summary: input.reviewedExtractionClaimSelection?.candidate.text ??
      input.command.claim ??
      "SourceClaim candidate from local source artifact preview.",
    ...(hasText(input.command.mechanism)
      ? { body: input.command.mechanism }
      : {}),
    evidenceRefs: sourceClaimCandidateEvidenceRefs(input.file, input.artifactHash, input.chunks),
    ...(hasText(input.command.falsifier)
      ? { applicationGuidance: input.command.falsifier }
      : {}),
    ...(hasText(input.command.doesNotProve)
      ? { doesNotProve: input.command.doesNotProve }
      : {}),
    missingFields: input.missingFields
  });

  return {
    id: "source-claim-candidate:incomplete",
    status: "incomplete" as const,
    reviewability,
    missingFields: input.missingFields,
    persisted: false
  };
};

const formatIncompleteSourceClaimCandidate = (input: {
  command: SourceArtifactPreviewCommand;
  file: string;
  artifactHash: string;
  chunks: readonly SourceArtifactPreviewChunk[];
  missingFields: readonly string[];
  reviewedExtractionClaimSelection: ReviewedExtractionClaimSelection | undefined;
}): string[] => {
  const view = incompleteSourceClaimCandidateView(input);

  return [
    "sourceClaimCandidate:",
    `- id: ${view.id}`,
    `  status: ${view.status}`,
    `  reviewability: ${view.reviewability.reviewability}`,
    ...formatReviewabilityReasons(view.reviewability.reasons),
    `  missing: ${view.missingFields.join(", ")}`,
    "  No SourceClaim created"
  ];
};

const parseOutputSourceClaimCandidate = (input: {
  command: SourceArtifactPreviewCommand;
  file: string;
  artifactHash: string;
  chunks: readonly SourceArtifactPreviewChunk[];
  reviewedExtractionClaimSelection: ReviewedExtractionClaimSelection | undefined;
}): ParsedSourceClaimInput =>
  parseSourceClaimInput({
    claim: input.reviewedExtractionClaimSelection?.candidate.text ?? input.command.claim,
    mechanism: input.command.mechanism,
    krnImplication: input.command.krnImplication,
    doesNotProve: input.command.doesNotProve,
    supportType: input.command.supportType,
    trustTier: input.command.trustTier,
    consumer: input.command.consumer,
    falsifier: input.command.falsifier,
    metadata: {
      file: input.file,
      contentHash: input.artifactHash,
      chunkHashes: input.chunks.map((chunk) => chunk.contentHash),
      ...(input.reviewedExtractionClaimSelection === undefined
        ? {}
        : {
            extractionCandidateId: input.reviewedExtractionClaimSelection.candidate.id,
            extractionCandidateSourceRange: input.reviewedExtractionClaimSelection.candidate.sourceRange,
            reviewedExtractionBridge: true
          }),
      source: "krn source artifact preview"
    }
  });

const outputSourceClaimCandidateId = (
  artifactHash: string,
  reviewedExtractionClaimSelection: ReviewedExtractionClaimSelection | undefined
): string =>
  reviewedExtractionClaimSelection === undefined
    ? `source-claim-candidate:${artifactHash.slice("sha256:".length, "sha256:".length + 12)}`
    : reviewedExtractionClaimSelection.candidate.id;

const completeSourceClaimCandidateView = (input: {
  command: SourceArtifactPreviewCommand;
  file: string;
  artifactHash: string;
  chunks: readonly SourceArtifactPreviewChunk[];
  persisted: boolean;
  reviewedExtractionClaimSelection: ReviewedExtractionClaimSelection | undefined;
}) => {
  const candidate = parseOutputSourceClaimCandidate(input);
  const reviewability = assessCandidateReviewability({
    summary: candidate.claim,
    body: candidate.mechanism,
    evidenceRefs: sourceClaimCandidateEvidenceRefs(input.file, input.artifactHash, input.chunks),
    applicationGuidance: candidate.falsifier,
    doesNotProve: sourceClaimCandidateDoesNotProve
  });

  return {
    id: outputSourceClaimCandidateId(input.artifactHash, input.reviewedExtractionClaimSelection),
    status: candidate.status,
    reviewedExtractionClaimSelection: input.reviewedExtractionClaimSelection,
    reviewability,
    claim: candidate.claim,
    mechanism: candidate.mechanism,
    consumer: candidate.consumer,
    falsifier: candidate.falsifier,
    evidenceRefs: [
      input.file,
      input.artifactHash
    ],
    doesNotProve: sourceClaimCandidateDoesNotProve,
    persisted: input.persisted
  };
};

const formatCompleteSourceClaimCandidate = (input: {
  command: SourceArtifactPreviewCommand;
  file: string;
  artifactHash: string;
  chunks: readonly SourceArtifactPreviewChunk[];
  persisted: boolean;
  reviewedExtractionClaimSelection: ReviewedExtractionClaimSelection | undefined;
}): string[] => {
  const view = completeSourceClaimCandidateView(input);

  return [
    "sourceClaimCandidate:",
    `- id: ${view.id}`,
    `  status: ${view.status}`,
    ...(view.reviewedExtractionClaimSelection === undefined
      ? []
      : [
          "  source: reviewed_extraction_claim_candidate",
          `  extractionSourceRange: ${view.reviewedExtractionClaimSelection.candidate.sourceRange}`
        ]),
    `  reviewability: ${view.reviewability.reviewability}`,
    ...formatReviewabilityReasons(view.reviewability.reasons),
    `  claim: ${view.claim}`,
    `  mechanism: ${view.mechanism}`,
    `  consumer: ${view.consumer}`,
    `  falsifier: ${view.falsifier}`,
    `  evidenceRefs: ${view.evidenceRefs.join(", ")}`,
    `  doesNotProve: ${view.doesNotProve}`,
    view.persisted
      ? "  SourceClaim row created: see Persistence readback"
      : "  No SourceClaim created"
  ];
};

const formatSourceClaimCandidate = (
  command: SourceArtifactPreviewCommand,
  file: string,
  artifactHash: string,
  chunks: readonly SourceArtifactPreviewChunk[],
  persisted: boolean
): string[] => {
  const reviewedExtractionClaimSelection = selectReviewedExtractionClaimCandidate(
    command,
    extractLocalSourceCandidates(chunks)
  );

  if (!hasAnyManualSourceClaimCandidateField(command) && reviewedExtractionClaimSelection === undefined) {
    return formatNoSourceClaimCandidate();
  }

  const missingFields = sourceClaimCandidateMissingFields(command, reviewedExtractionClaimSelection);

  if (missingFields.length > 0) {
    return formatIncompleteSourceClaimCandidate({
      command,
      file,
      artifactHash,
      chunks,
      missingFields,
      reviewedExtractionClaimSelection
    });
  }

  return formatCompleteSourceClaimCandidate({
    command,
    file,
    artifactHash,
    chunks,
    persisted,
    reviewedExtractionClaimSelection
  });
};

const formatNoSourceClaimEdgeCandidate = (): string[] => [
  "sourceClaimEdgeCandidate:",
  "- not generated",
  "  reason: explicit graph edge inputs were not supplied",
  "  No SourceClaimEdge created"
];

const sourceClaimEdgeMissingFields = (
  command: SourceArtifactPreviewCommand
): string[] => [
  ...missingGraphEdgeCandidateFields(command),
  ...missingSourceClaimFieldsForGraphEdge(command)
];

const formatIncompleteSourceClaimEdgeCandidate = (input: {
  command: SourceArtifactPreviewCommand;
  file: string;
  artifactHash: string;
  chunks: readonly SourceArtifactPreviewChunk[];
  missingFields: readonly string[];
}): string[] => {
  const reviewability = assessCandidateReviewability({
    summary: input.command.graphEdgeKind === undefined
      ? "SourceClaimEdge candidate from local source artifact preview."
      : `SourceClaimEdge ${input.command.graphEdgeKind} candidate from local source artifact preview.`,
    evidenceRefs: generatedGraphEvidenceRefs(input.file, input.artifactHash, input.chunks),
    ...(hasText(input.command.graphEdgeConsumer)
      ? { applicationGuidance: input.command.graphEdgeConsumer }
      : {}),
    ...(hasText(input.command.graphEdgeDoesNotProve)
      ? { doesNotProve: input.command.graphEdgeDoesNotProve }
      : {}),
    missingFields: input.missingFields
  });

  return [
    "sourceClaimEdgeCandidate:",
    "- id: source-claim-edge-candidate:incomplete",
    "  status: incomplete",
    `  reviewability: ${reviewability.reviewability}`,
    ...formatReviewabilityReasons(reviewability.reasons),
    `  missing: ${input.missingFields.join(", ")}`,
    "  No SourceClaimEdge created"
  ];
};

const formatUnknownSourceClaimEdgeCandidate = (): string[] => [
  "sourceClaimEdgeCandidate:",
  "- id: source-claim-edge-candidate:incomplete",
  "  status: incomplete",
  "  reviewability: unknown",
  "  reviewability reasons:",
  "  - Graph edge input could not be narrowed after missing-field checks.",
  "  No SourceClaimEdge created"
];

const sourceClaimEdgeSourceLabel = (
  command: SourceArtifactPreviewCommand,
  artifactHash: string
): string =>
  hasReviewedExtractionClaimCandidate(command)
    ? command.reviewedExtractionClaimCandidateId
    : `source-claim-candidate:${artifactHash.slice("sha256:".length, "sha256:".length + 12)}`;

const formatCompleteSourceClaimEdgeCandidate = (input: {
  command: SourceArtifactPreviewCommand;
  file: string;
  artifactHash: string;
  chunks: readonly SourceArtifactPreviewChunk[];
  sourceClaimPersisted: boolean;
  sourceClaimEdgePersisted: boolean;
  graphEdgeInput: CompleteGraphEdgeCommandInput;
}): string[] => {
  const reviewability = assessCandidateReviewability({
    summary: `SourceClaimEdge ${input.graphEdgeInput.kind} -> ${input.graphEdgeInput.toSourceClaimId}`,
    body: [
      `from: source-claim-candidate:${input.artifactHash.slice("sha256:".length, "sha256:".length + 12)}`,
      `to: ${input.graphEdgeInput.toSourceClaimId}`,
      `kind: ${input.graphEdgeInput.kind}`,
      ...(input.graphEdgeInput.scope === undefined ? [] : [`scope: ${input.graphEdgeInput.scope}`])
    ].join("\n"),
    evidenceRefs: [
      ...generatedGraphEvidenceRefs(input.file, input.artifactHash, input.chunks),
      ...(input.graphEdgeInput.evidenceRef === undefined ? [] : [input.graphEdgeInput.evidenceRef])
    ],
    applicationGuidance: input.graphEdgeInput.consumer,
    doesNotProve: input.graphEdgeInput.doesNotProve
  });

  return [
    "sourceClaimEdgeCandidate:",
    `- id: source-claim-edge-candidate:${input.artifactHash.slice("sha256:".length, "sha256:".length + 12)}`,
    "  status: candidate",
    `  reviewability: ${reviewability.reviewability}`,
    ...formatReviewabilityReasons(reviewability.reasons),
    `  fromSourceClaim: ${sourceClaimEdgeSourceLabel(input.command, input.artifactHash)}`,
    `  toSourceClaimId: ${input.graphEdgeInput.toSourceClaimId}`,
    `  kind: ${input.graphEdgeInput.kind}`,
    `  consumer: ${input.graphEdgeInput.consumer}`,
    `  evidenceRefs: ${generatedGraphEvidenceRefs(input.file, input.artifactHash, input.chunks).join(", ")}`,
    `  doesNotProve: ${input.graphEdgeInput.doesNotProve}`,
    input.sourceClaimPersisted
      ? "  SourceClaim row available for edge source: see Persistence readback"
      : "  No SourceClaim row available for edge source",
    input.sourceClaimEdgePersisted
      ? "  SourceClaimEdge row created: see Persistence readback"
      : "  No SourceClaimEdge created"
  ];
};

const formatSourceClaimEdgeCandidate = (
  command: SourceArtifactPreviewCommand,
  file: string,
  artifactHash: string,
  chunks: readonly SourceArtifactPreviewChunk[],
  sourceClaimPersisted: boolean,
  sourceClaimEdgePersisted: boolean
): string[] => {
  if (!hasAnyGraphEdgeCandidateField(command)) {
    return formatNoSourceClaimEdgeCandidate();
  }

  const missingFields = sourceClaimEdgeMissingFields(command);

  if (missingFields.length > 0) {
    return formatIncompleteSourceClaimEdgeCandidate({
      command,
      file,
      artifactHash,
      chunks,
      missingFields
    });
  }

  const graphEdgeInput = completeGraphEdgeInput(command);

  if (graphEdgeInput === undefined) {
    return formatUnknownSourceClaimEdgeCandidate();
  }

  return formatCompleteSourceClaimEdgeCandidate({
    command,
    file,
    artifactHash,
    chunks,
    sourceClaimPersisted,
    sourceClaimEdgePersisted,
    graphEdgeInput
  });
};

const extractionCandidatePreviewView = (
  command: SourceArtifactPreviewCommand,
  file: string,
  artifactHash: string,
  chunks: readonly SourceArtifactPreviewChunk[]
) => {
  if (command.extractCandidates !== true) {
    return {
      status: "not_generated" as const,
      reason: "--extract-candidates was not supplied"
    };
  }

  const extraction = extractLocalSourceCandidates(chunks);
  const reviewedExtractionClaimSelection = selectReviewedExtractionClaimCandidate(command, extraction);
  const reviewability = assessCandidateReviewability({
    summary: "Deterministic local source extraction candidate preview.",
    body: [
      `entityCandidates: ${extraction.entities.length}`,
      `claimCandidates: ${extraction.claims.length}`,
      `deferredClaimCandidates: ${extraction.deferredClaims.length}`,
      `relationCandidates: ${extraction.relations.length}`
    ].join("\n"),
    evidenceRefs: [
      file,
      artifactHash,
      ...chunks.map((chunk) => `${file}:lines ${chunk.startLine}-${chunk.endLine}`),
      ...chunks.map((chunk) => chunk.contentHash)
    ],
    applicationGuidance: "Use only as reviewable extraction candidates before graph persistence, ranking, crawler, or Memory Core work.",
    doesNotProve: extractionCandidateDoesNotProve
  });

  return {
    status: "candidate" as const,
    mode: "deterministic_local_heuristic" as const,
    reviewability,
    evidenceRefs: [
      file,
      artifactHash
    ],
    doesNotProve: extractionCandidateDoesNotProve,
    extraction,
    reviewedExtractionClaimSelection
  };
};

const formatExtractionCandidatePreview = (
  command: SourceArtifactPreviewCommand,
  file: string,
  artifactHash: string,
  chunks: readonly SourceArtifactPreviewChunk[],
  sourceClaimPersisted: boolean
): string[] => {
  const view = extractionCandidatePreviewView(command, file, artifactHash, chunks);

  if (view.status === "not_generated") {
    return [
      "extractionCandidatePreview:",
      "- not generated",
      `  reason: ${view.reason}`,
      "  No extracted entity, claim, or relation candidates created"
    ];
  }

  return [
    "extractionCandidatePreview:",
    "- status: candidate",
    "  mode: deterministic_local_heuristic",
    `  reviewability: ${view.reviewability.reviewability}`,
    ...formatReviewabilityReasons(view.reviewability.reasons),
    `  evidenceRefs: ${view.evidenceRefs.join(", ")}`,
    `  doesNotProve: ${view.doesNotProve}`,
    "  entityCandidates:",
    ...(view.extraction.entities.length === 0
      ? ["  - none"]
      : view.extraction.entities.map((entity) =>
          `  - id: ${entity.id} | kind: ${entity.kind} | label: ${entity.label} | sourceRange: ${entity.sourceRange}`
        )),
    "  claimCandidates:",
    ...(view.extraction.claims.length === 0
      ? ["  - none"]
      : view.extraction.claims.map((claim) =>
          `  - id: ${claim.id} | reviewability: ${claim.reviewability} | text: ${claim.text} | sourceRange: ${claim.sourceRange} | reason: ${claim.reviewabilityReason}`
        )),
    "  deferredClaimCandidates:",
    ...(view.extraction.deferredClaims.length === 0
      ? ["  - none"]
      : view.extraction.deferredClaims.map((claim) =>
          `  - id: ${claim.id} | reviewability: ${claim.reviewability} | text: ${claim.text} | sourceRange: ${claim.sourceRange} | reason: ${claim.reviewabilityReason}`
        )),
    "  relationCandidates:",
    ...(view.extraction.relations.length === 0
      ? ["  - none"]
      : view.extraction.relations.map((relation) =>
          `  - id: ${relation.id} | kind: ${relation.kind} | from: ${relation.fromCandidateId} | to: ${relation.toCandidateId} | sourceRange: ${relation.sourceRange}`
        )),
    ...(view.reviewedExtractionClaimSelection === undefined
      ? ["  No SourceClaim row created from extraction candidates"]
      : [
          `  reviewedExtractionClaimCandidate: ${view.reviewedExtractionClaimSelection.candidate.id}`,
          sourceClaimPersisted
            ? "  SourceClaim row created from reviewed extraction candidate: see Persistence readback"
            : "  No SourceClaim row created from reviewed extraction candidate"
        ]),
    "  No SourceClaimEdge row created from extraction candidates",
    "  Graph runtime: none",
    "  Memory mutation: none"
  ];
};

const persistenceFlags = (
  persistence: SourceArtifactPreviewPersistenceResult | undefined
): {
  searchDocumentPersisted: boolean;
  sourceClaimPersisted: boolean;
  sourceClaimEdgePersisted: boolean;
} => ({
  searchDocumentPersisted: persistence?.searchDocumentPersisted ?? false,
  sourceClaimPersisted: persistence?.sourceClaimPersisted ?? false,
  sourceClaimEdgePersisted: persistence?.sourceClaimEdgePersisted ?? false
});

const formatCandidateBridge = (
  command: SourceArtifactPreviewCommand,
  file: string,
  artifactHash: string,
  chunks: readonly SourceArtifactPreviewChunk[],
  persistence?: SourceArtifactPreviewPersistenceResult
): string[] => {
  const flags = persistenceFlags(persistence);
  const lines = [
    "Candidate bridge:",
    "Mutation: none"
  ];

  lines.push(...formatSearchDocumentCandidate(
    file,
    artifactHash,
    chunks,
    flags.searchDocumentPersisted
  ));
  lines.push(...formatSourceClaimCandidate(
    command,
    file,
    artifactHash,
    chunks,
    flags.sourceClaimPersisted
  ));
  lines.push(...formatSourceClaimEdgeCandidate(
    command,
    file,
    artifactHash,
    chunks,
    flags.sourceClaimPersisted,
    flags.sourceClaimEdgePersisted
  ));
  lines.push(...formatExtractionCandidatePreview(
    command,
    file,
    artifactHash,
    chunks,
    flags.sourceClaimPersisted
  ));

  return lines;
};

const searchDocumentCandidateJson = (
  file: string,
  artifactHash: string,
  chunks: readonly SourceArtifactPreviewChunk[],
  persisted: boolean
): Record<string, unknown> => {
  const view = searchDocumentCandidateView(file, artifactHash, chunks);

  return {
    id: view.id,
    status: "candidate",
    reviewability: view.reviewability.reviewability,
    reviewabilityReasons: view.reviewability.reasons,
    subjectType: view.candidate.subjectType,
    subjectId: view.candidate.subjectId,
    trustTier: view.candidate.trustTier,
    title: view.candidate.title,
    evidenceRefs: view.evidenceRefs,
    doesNotProve: view.doesNotProve,
    persisted
  };
};

const noSourceClaimCandidateJson = (): Record<string, unknown> => ({
  status: "not_generated",
  reason: "explicit claim/mechanism/consumer/falsifier inputs were not supplied",
  persisted: false
});

const incompleteSourceClaimCandidateJson = (input: {
  command: SourceArtifactPreviewCommand;
  file: string;
  artifactHash: string;
  chunks: readonly SourceArtifactPreviewChunk[];
  missingFields: readonly string[];
  reviewedExtractionClaimSelection: ReviewedExtractionClaimSelection | undefined;
}): Record<string, unknown> => {
  const view = incompleteSourceClaimCandidateView(input);

  return {
    id: view.id,
    status: view.status,
    reviewability: view.reviewability.reviewability,
    reviewabilityReasons: view.reviewability.reasons,
    missing: view.missingFields,
    persisted: view.persisted
  };
};

const completeSourceClaimCandidateJson = (input: {
  command: SourceArtifactPreviewCommand;
  file: string;
  artifactHash: string;
  chunks: readonly SourceArtifactPreviewChunk[];
  reviewedExtractionClaimSelection: ReviewedExtractionClaimSelection | undefined;
  persisted: boolean;
}): Record<string, unknown> => {
  const view = completeSourceClaimCandidateView(input);

  return {
    id: view.id,
    status: view.status,
    ...(view.reviewedExtractionClaimSelection === undefined
      ? {}
      : {
          source: "reviewed_extraction_claim_candidate",
          extractionSourceRange: view.reviewedExtractionClaimSelection.candidate.sourceRange
        }),
    reviewability: view.reviewability.reviewability,
    reviewabilityReasons: view.reviewability.reasons,
    claim: view.claim,
    mechanism: view.mechanism,
    consumer: view.consumer,
    falsifier: view.falsifier,
    evidenceRefs: view.evidenceRefs,
    doesNotProve: view.doesNotProve,
    persisted: view.persisted
  };
};

const sourceClaimCandidateJson = (
  command: SourceArtifactPreviewCommand,
  file: string,
  artifactHash: string,
  chunks: readonly SourceArtifactPreviewChunk[],
  persisted: boolean
): Record<string, unknown> => {
  const reviewedExtractionClaimSelection = selectReviewedExtractionClaimCandidate(
    command,
    extractLocalSourceCandidates(chunks)
  );

  if (!hasAnyManualSourceClaimCandidateField(command) && reviewedExtractionClaimSelection === undefined) {
    return noSourceClaimCandidateJson();
  }

  const missingFields = sourceClaimCandidateMissingFields(command, reviewedExtractionClaimSelection);

  if (missingFields.length > 0) {
    return incompleteSourceClaimCandidateJson({
      command,
      file,
      artifactHash,
      chunks,
      missingFields,
      reviewedExtractionClaimSelection
    });
  }

  return completeSourceClaimCandidateJson({
    command,
    file,
    artifactHash,
    chunks,
    reviewedExtractionClaimSelection,
    persisted
  });
};

const sourceClaimEdgeCandidateJson = (
  command: SourceArtifactPreviewCommand,
  file: string,
  artifactHash: string,
  chunks: readonly SourceArtifactPreviewChunk[],
  sourceClaimPersisted: boolean,
  sourceClaimEdgePersisted: boolean
): Record<string, unknown> => {
  if (!hasAnyGraphEdgeCandidateField(command)) {
    return {
      status: "not_generated",
      reason: "explicit graph edge inputs were not supplied",
      persisted: false
    };
  }

  const missingFields = sourceClaimEdgeMissingFields(command);

  if (missingFields.length > 0) {
    const reviewability = assessCandidateReviewability({
      summary: command.graphEdgeKind === undefined
        ? "SourceClaimEdge candidate from local source artifact preview."
        : `SourceClaimEdge ${command.graphEdgeKind} candidate from local source artifact preview.`,
      evidenceRefs: generatedGraphEvidenceRefs(file, artifactHash, chunks),
      ...(hasText(command.graphEdgeConsumer)
        ? { applicationGuidance: command.graphEdgeConsumer }
        : {}),
      ...(hasText(command.graphEdgeDoesNotProve)
        ? { doesNotProve: command.graphEdgeDoesNotProve }
        : {}),
      missingFields
    });

    return {
      id: "source-claim-edge-candidate:incomplete",
      status: "incomplete",
      reviewability: reviewability.reviewability,
      reviewabilityReasons: reviewability.reasons,
      missing: missingFields,
      persisted: false
    };
  }

  const graphEdgeInput = completeGraphEdgeInput(command);

  if (graphEdgeInput === undefined) {
    return {
      id: "source-claim-edge-candidate:incomplete",
      status: "incomplete",
      reviewability: "unknown",
      reviewabilityReasons: [
        "Graph edge input could not be narrowed after missing-field checks."
      ],
      persisted: false
    };
  }

  const reviewability = assessCandidateReviewability({
    summary: `SourceClaimEdge ${graphEdgeInput.kind} -> ${graphEdgeInput.toSourceClaimId}`,
    body: [
      `from: source-claim-candidate:${artifactHash.slice("sha256:".length, "sha256:".length + 12)}`,
      `to: ${graphEdgeInput.toSourceClaimId}`,
      `kind: ${graphEdgeInput.kind}`,
      ...(graphEdgeInput.scope === undefined ? [] : [`scope: ${graphEdgeInput.scope}`])
    ].join("\n"),
    evidenceRefs: [
      ...generatedGraphEvidenceRefs(file, artifactHash, chunks),
      ...(graphEdgeInput.evidenceRef === undefined ? [] : [graphEdgeInput.evidenceRef])
    ],
    applicationGuidance: graphEdgeInput.consumer,
    doesNotProve: graphEdgeInput.doesNotProve
  });

  return {
    id: `source-claim-edge-candidate:${artifactHash.slice("sha256:".length, "sha256:".length + 12)}`,
    status: "candidate",
    reviewability: reviewability.reviewability,
    reviewabilityReasons: reviewability.reasons,
    fromSourceClaim: sourceClaimEdgeSourceLabel(command, artifactHash),
    toSourceClaimId: graphEdgeInput.toSourceClaimId,
    kind: graphEdgeInput.kind,
    consumer: graphEdgeInput.consumer,
    evidenceRefs: generatedGraphEvidenceRefs(file, artifactHash, chunks),
    doesNotProve: graphEdgeInput.doesNotProve,
    sourceClaimPersisted,
    persisted: sourceClaimEdgePersisted
  };
};

const extractionCandidatePreviewJson = (
  command: SourceArtifactPreviewCommand,
  file: string,
  artifactHash: string,
  chunks: readonly SourceArtifactPreviewChunk[],
  sourceClaimPersisted: boolean
): Record<string, unknown> => {
  const view = extractionCandidatePreviewView(command, file, artifactHash, chunks);

  if (view.status === "not_generated") {
    return {
      status: "not_generated",
      reason: view.reason,
      entityCandidates: [],
      claimCandidates: [],
      deferredClaimCandidates: [],
      relationCandidates: []
    };
  }

  return {
    status: view.status,
    mode: view.mode,
    reviewability: view.reviewability.reviewability,
    reviewabilityReasons: view.reviewability.reasons,
    evidenceRefs: view.evidenceRefs,
    doesNotProve: view.doesNotProve,
    entityCandidates: view.extraction.entities,
    claimCandidates: view.extraction.claims,
    deferredClaimCandidates: view.extraction.deferredClaims,
    relationCandidates: view.extraction.relations,
    ...(view.reviewedExtractionClaimSelection === undefined
      ? {}
      : {
          reviewedExtractionClaimCandidate: view.reviewedExtractionClaimSelection.candidate.id,
          sourceClaimPersisted
        }),
    graphRuntime: "none",
    memoryMutation: "none"
  };
};

const candidateBridgeJson = (
  command: SourceArtifactPreviewCommand,
  file: string,
  artifactHash: string,
  chunks: readonly SourceArtifactPreviewChunk[],
  persistence?: SourceArtifactPreviewPersistenceResult
): Record<string, unknown> => {
  const flags = persistenceFlags(persistence);

  return {
    mutation: "none",
    searchDocumentCandidate: searchDocumentCandidateJson(
      file,
      artifactHash,
      chunks,
      flags.searchDocumentPersisted
    ),
    sourceClaimCandidate: sourceClaimCandidateJson(
      command,
      file,
      artifactHash,
      chunks,
      flags.sourceClaimPersisted
    ),
    sourceClaimEdgeCandidate: sourceClaimEdgeCandidateJson(
      command,
      file,
      artifactHash,
      chunks,
      flags.sourceClaimPersisted,
      flags.sourceClaimEdgePersisted
    ),
    extractionCandidatePreview: extractionCandidatePreviewJson(
      command,
      file,
      artifactHash,
      chunks,
      flags.sourceClaimPersisted
    )
  };
};

const sourceArtifactPreviewJson = (input: {
  runtime: SourceArtifactPreviewCommandRuntime;
  file: string;
  resolvedPath: string;
  artifactHash: string;
  raw: string;
  lines: readonly string[];
  chunkSize: number;
  chunks: readonly SourceArtifactPreviewChunk[];
  persistence?: SourceArtifactPreviewPersistenceResult;
}): Record<string, unknown> => ({
  kind: "krn.sourceArtifactPreview.v1",
  access: input.persistence === undefined ? "local_preview" : "persisted_readback",
  mutation: {
    memory: "none",
    crawler: "none",
    embeddings: "none",
    graphRuntime: "none"
  },
  persistence: input.persistence === undefined
    ? {
        enabled: false,
        dbWrites: "none"
      }
    : {
        enabled: true,
        readback: input.persistence.readback
      },
  artifact: {
    file: input.file,
    resolvedFile: path.relative(input.runtime.cwd, input.resolvedPath),
    contentHash: input.artifactHash,
    bytes: Buffer.byteLength(input.raw, "utf8"),
    lines: input.lines.length,
    chunking: {
      strategy: "line-based",
      chunkLines: input.chunkSize,
      renderedChunks: input.chunks.length
    }
  },
  chunks: input.chunks.map((chunk) => ({
    ordinal: chunk.ordinal,
    sourceRange: `lines ${chunk.startLine}-${chunk.endLine}`,
    startLine: chunk.startLine,
    endLine: chunk.endLine,
    contentHash: chunk.contentHash,
    preview: chunk.preview
  })),
  candidateBridge: candidateBridgeJson(
    input.runtime.command,
    input.file,
    input.artifactHash,
    input.chunks,
    input.persistence
  ),
  proof: {
    proves: [
      "one local file was readable in this shell",
      "artifact and rendered chunk hashes were computed deterministically from current file bytes",
      "rendered chunks include source line ranges for review",
      input.runtime.command.persist
        ? "explicit --persist wrote and read back SourceArtifact/SourceChunk/SearchDocument rows in this shell"
        : "preview output can produce reviewable source/search candidate proposals without persistence"
    ],
    doesNotProve: [
      "source truth",
      "claim correctness",
      "DB persistence",
      "embeddings",
      "graph retrieval",
      "crawler readiness",
      "Memory Core mutation",
      "product readiness"
    ]
  }
});

export const runSourceArtifactPreviewCommand = async (
  runtime: SourceArtifactPreviewCommandRuntime
): Promise<SourceArtifactPreviewCommandResult> => {
  const file = runtime.command.file;

  if (file === undefined || file.trim().length === 0) {
    throw new Error("--file is required for krn source artifact preview");
  }

  const resolvedPath = await resolveRepoInputFile(runtime.cwd, file);
  const fileStats = await stat(resolvedPath);

  if (!fileStats.isFile()) {
    throw new Error(`Source artifact preview requires a regular file: ${file}`);
  }

  const raw = await readFile(resolvedPath, "utf8");
  const lines = normalizeLines(raw);
  const chunkSize = runtime.command.chunkLines ?? defaultChunkLines;
  const chunkLimit = runtime.command.limitChunks ?? defaultLimitChunks;
  const chunks = chunkLines(lines, chunkSize, chunkLimit);
  const artifactHash = sha256(raw);
  const persistence = runtime.command.persist
    ? await persistSourceArtifactPreview(runtime, file, resolvedPath, artifactHash, chunks)
    : undefined;
  const persistenceLines = persistence?.lines ?? [
    "Persistence: disabled (local preview only)",
    "DB writes: none"
  ];

  if (runtime.command.json === true) {
    return {
      stdout: `${JSON.stringify(sourceArtifactPreviewJson({
        runtime,
        file,
        resolvedPath,
        artifactHash,
        raw,
        lines,
        chunkSize,
        chunks,
        ...(persistence === undefined ? {} : { persistence })
      }), null, 2)}\n`
    };
  }

  return {
    stdout: [
      "KRN Source Artifact Preview",
      ...persistenceLines,
      "Memory mutation: none",
      "Crawler: none",
      "",
      "Artifact:",
      `file: ${file}`,
      `resolvedFile: ${path.relative(runtime.cwd, resolvedPath)}`,
      `contentHash: ${artifactHash}`,
      `bytes: ${Buffer.byteLength(raw, "utf8")}`,
      `lines: ${lines.length}`,
      `chunking: line-based | chunkLines=${chunkSize} | renderedChunks=${chunks.length}`,
      "",
      "Chunks:",
      ...formatChunks(chunks),
      "",
      ...formatCandidateBridge(runtime.command, file, artifactHash, chunks, persistence),
      "",
      "Proof:",
      "- proves: one local file was readable in this shell",
      "- proves: artifact and rendered chunk hashes were computed deterministically from current file bytes",
      "- proves: rendered chunks include source line ranges for review",
      runtime.command.persist
        ? "- proves: preview output can produce reviewable source/search candidate proposals alongside explicit persistence"
        : "- proves: preview output can produce reviewable source/search candidate proposals without persistence",
      ...(runtime.command.persist
        ? ["- proves: explicit --persist wrote and read back SourceArtifact/SourceChunk/SearchDocument rows in this shell"]
        : []),
      ...(persistence?.sourceClaimPersisted === true
        ? ["- proves: complete explicit SourceClaim fields wrote and read back a SourceClaim row linked to the persisted SourceArtifact/SourceChunk"]
        : []),
      ...(persistence?.sourceClaimEdgePersisted === true
        ? ["- proves: complete explicit SourceClaimEdge fields wrote and read back a governed SourceClaimEdge row linked to reviewed SourceClaim rows"]
        : []),
      "- doesNotProve: source truth, claim correctness, DB persistence, embeddings, graph retrieval, crawler readiness, or Memory Core mutation"
    ].join("\n")
  };
};
