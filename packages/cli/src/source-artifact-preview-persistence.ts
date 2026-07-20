import { createHash } from "node:crypto";
import path from "node:path";

import type {
  SourceArtifactPreviewChunk,
  SourceClaim,
  SourceClaimEdge,
  SourceClaimEdgeKind
} from "@krn/core";
import {
  extractLocalSourceCandidates,
  parseSearchDocumentInput,
  parseSourceArtifactInput,
  parseSourceClaimInput
} from "@krn/core";
import {
  defaultWorkspaceSlug,
  defaultProjectSlug,
  createDatabaseRuntime
} from "./database-runtime.js";
import type {
  DatabaseRuntime
} from "./database-runtime.js";
import {
  findRepoRoot
} from "./cli-file-boundary.js";
import {
  candidateBridgeJson,
  completeGraphEdgeInput,
  hasCompleteSourceClaimCandidate,
  missingReviewedExtractionClaimCandidateFields,
  selectReviewedExtractionClaimCandidate,
} from "./source-artifact-preview-view.js";
import type {
  CompleteGraphEdgeCommandInput,
  ReviewedExtractionClaimSelection,
  SourceArtifactPreviewPersistenceFlags
} from "./source-artifact-preview-view.js";
import type {
  SourceArtifactPreviewCommand,
  SourceArtifactPreviewCommandRuntime
} from "./run-source-artifact-preview-command.js";

export interface SourceArtifactPreviewPersistenceResult {
  lines: string[];
  readback: SourceArtifactPreviewPersistenceReadback;
  searchDocumentPersisted: boolean;
  sourceClaimPersisted: boolean;
  sourceClaimEdgePersisted: boolean;
}

export interface SourceArtifactPreviewPersistenceReadback {
  projectId: string;
  sourceArtifact: {
    id: string;
  };
  sourceChunks: readonly string[];
  searchDocument: {
    id: string;
    ids: readonly string[];
    count: number;
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
    memorySearchReadbackCommand: string;
    nextAction: string;
    doesNotProve: string;
  };
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
  searchDocuments: SearchDocumentRecord[];
  readbackQuery: string;
  readbackHits: SearchDocumentSearchResult[];
}

interface SourceClaimPersistenceRows {
  sourceClaim: SourceClaim | undefined;
  sourceClaimReadback: SourceClaim | undefined;
}

interface SourceClaimEdgePersistenceRows {
  sourceClaimEdge: SourceClaimEdge | undefined;
  sourceClaimEdgeReadback: SourceClaimEdge | undefined;
}

export const sha256 = (content: string): string =>
  `sha256:${createHash("sha256").update(content).digest("hex")}`;

const localArtifactUri = (input: {
  projectId: string;
  resolvedPath: string;
  artifactHash: string;
  capturedAt: string;
  contentAddressed: boolean;
}): string => input.contentAddressed
  ? `krn-source://project/${input.projectId}/local-file/${encodeURIComponent(input.resolvedPath)}?sha256=${encodeURIComponent(input.artifactHash)}`
  : `file://${input.resolvedPath}?krnPreviewHash=${encodeURIComponent(input.artifactHash)}&capturedAt=${encodeURIComponent(input.capturedAt)}`;

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
  now: () => string,
  repoPath: string | undefined
): Promise<DatabaseRuntime> => {
  const createRuntime = runtime.createDatabaseRuntime ?? createDatabaseRuntime;

  return createRuntime({
    databaseUrl,
    workspaceSlug: defaultWorkspaceSlug,
    projectSlug: defaultProjectSlug,
    repoPathHint: repoPath ?? await findRepoRoot(runtime.cwd),
    ...(repoPath === undefined ? {} : { requireConnectedRepoPath: true }),
    now,
    createId: (prefix) => `${prefix}-${Date.now()}`
  });
};

const requirePreviewPersistenceRepositories = (
  databaseRuntime: DatabaseRuntime,
  requireContentAddressed: boolean
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

  if (requireContentAddressed && (
    databaseRuntime.sourceRepository.getSourceArtifactByUriAndContentHash === undefined ||
    databaseRuntime.sourceRepository.listSourceChunksForArtifact === undefined ||
    retrievalRepository.listSearchDocumentsForSourceLinks === undefined
  )) {
    throw new Error("Content-addressed source ingest readback is unavailable in this database runtime");
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
  sourceAuthority: string;
  contentAddressed: boolean;
}): Promise<SourceArtifactPersistenceRows> => {
  const evidenceRef = localArtifactUri({
    projectId: input.databaseRuntime.projectId,
    resolvedPath: input.resolvedPath,
    artifactHash: input.artifactHash,
    capturedAt: input.capturedAt,
    contentAddressed: input.contentAddressed
  });
  const artifactInput = parseSourceArtifactInput({
    kind: "file",
    title: `Local source artifact: ${input.file}`,
    uri: evidenceRef,
    contentHash: input.artifactHash,
    sourceAuthority: input.sourceAuthority,
    metadata: {
      file: input.file,
      resolvedPath: input.resolvedPath,
      evidenceRef,
      evidenceStatus: "captured",
      evidenceContentHash: input.artifactHash,
      evidenceCapturedAt: input.capturedAt,
      evidenceFreshness: "current",
      evidenceProvenance: "local source artifact preview",
      source: "krn source artifact preview --persist",
      doesNotProve: "Persisted local source artifact does not prove source truth, source freshness, embeddings, graph retrieval, crawler readiness, or Memory Core mutation."
    }
  });
  const existingArtifact = input.contentAddressed
    ? await input.databaseRuntime.sourceRepository
      .getSourceArtifactByUriAndContentHash?.(artifactInput.uri, input.artifactHash)
    : undefined;
  const sourceArtifact = existingArtifact ??
    await input.databaseRuntime.sourceRepository.createSourceArtifact({
      projectId: input.databaseRuntime.projectId,
      kind: artifactInput.kind,
      sourceAuthority: artifactInput.sourceAuthority,
      uri: artifactInput.uri,
      title: artifactInput.title,
      contentHash: artifactInput.contentHash ?? input.artifactHash,
      metadata: artifactInput.metadata
    });
  if (
    sourceArtifact.projectId !== input.databaseRuntime.projectId ||
    sourceArtifact.sourceAuthority !== input.sourceAuthority
  ) {
    throw new Error("Content-addressed SourceArtifact does not match the target project or source authority");
  }
  const existingChunks = input.contentAddressed
    ? await input.databaseRuntime.sourceRepository
      .listSourceChunksForArtifact?.(sourceArtifact.id) ?? []
    : [];
  const sourceChunks: SourceChunkRecord[] = [];

  for (const chunk of input.chunks) {
    const existingChunk = existingChunks.find((candidate) => candidate.ordinal === chunk.ordinal);
    if (existingChunk !== undefined) {
      if (existingChunk.contentHash !== chunk.contentHash || existingChunk.content !== chunk.content) {
        throw new Error(
          `Content-addressed SourceChunk ${chunk.ordinal} does not match the captured corpus bytes`
        );
      }
      sourceChunks.push(existingChunk);
      continue;
    }

    sourceChunks.push(await input.createSourceChunk({
      sourceArtifactId: sourceArtifact.id,
      ordinal: chunk.ordinal,
      content: chunk.content,
      contentHash: chunk.contentHash,
      metadata: {
        file: input.file,
        sourceRange: `lines ${chunk.startLine}-${chunk.endLine}`,
        startLine: chunk.startLine,
        endLine: chunk.endLine,
        evidenceRef,
        evidenceStatus: "captured",
        evidenceContentHash: input.artifactHash,
        evidenceCapturedAt: input.capturedAt,
        evidenceFreshness: "current",
        evidenceProvenance: "local source artifact preview"
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
  sourceChunks: readonly SourceChunkRecord[];
}): Promise<SearchDocumentReadbackRows> => {
  const artifactHashPrefix = input.artifactHash.slice("sha256:".length, "sha256:".length + 16);
  const readbackQuery = `krn-source-artifact-preview ${artifactHashPrefix}`;
  const searchDocuments: SearchDocumentRecord[] = [];
  const existingDocuments = await input.retrievalRepository.listSearchDocumentsForSourceLinks?.({
    projectId: input.databaseRuntime.projectId,
    sourceChunkIds: input.sourceChunks.map((chunk) => chunk.id),
    limit: Math.max(20, input.sourceChunks.length)
  }) ?? [];

  for (const [index, chunk] of input.chunks.entries()) {
    const sourceChunk = input.sourceChunks[index];
    if (sourceChunk === undefined) {
      throw new Error(`SourceChunk persistence is missing readback for chunk ${chunk.ordinal}`);
    }
    const documentInput = parseSearchDocumentInput({
      projectId: input.databaseRuntime.projectId,
      subjectType: "source_chunk",
      subjectId: sourceChunk.id,
      sourceArtifactId: input.sourceArtifact.id,
      sourceChunkId: sourceChunk.id,
      sourceAuthority: input.sourceArtifact.sourceAuthority,
      language: "english",
      title: `Local source artifact: ${input.file} (chunk ${chunk.ordinal})`,
      body: chunk.content,
      searchText: ["krn-source-artifact-preview", artifactHashPrefix, input.file, chunk.content].join("\n"),
      metadataFilters: { source: "local_source_artifact_preview", file: input.file },
      metadata: {
        file: input.file,
        contentHash: chunk.contentHash,
        artifactContentHash: input.artifactHash,
        sourceRange: `lines ${chunk.startLine}-${chunk.endLine}`,
        source: "krn source artifact preview --persist",
        doesNotProve: "Persisted SearchDocument readback does not prove embeddings, graph retrieval, source truth, source freshness, or Memory Core mutation."
      }
    });
    const existingDocument = existingDocuments.find((document) =>
      document.subjectType === "source_chunk" &&
      document.subjectId === sourceChunk.id &&
      document.sourceChunkId === sourceChunk.id &&
      document.body === chunk.content &&
      document.metadata["contentHash"] === chunk.contentHash);
    if (existingDocument !== undefined) {
      searchDocuments.push(existingDocument);
      continue;
    }

    searchDocuments.push(await input.retrievalRepository.createSearchDocument({
      projectId: input.databaseRuntime.projectId,
      subjectType: documentInput.subjectType,
      subjectId: documentInput.subjectId,
      sourceArtifactId: input.sourceArtifact.id,
      sourceChunkId: sourceChunk.id,
      sourceAuthority: documentInput.sourceAuthority,
      validityStatus: documentInput.validityStatus,
      language: documentInput.language,
      title: documentInput.title,
      body: documentInput.body,
      searchText: documentInput.searchText,
      metadataFilters: documentInput.metadataFilters,
      metadata: documentInput.metadata
    }));
  }
  const lexicalReadback = await input.retrievalRepository.searchLexical({
    projectId: input.databaseRuntime.projectId,
    query: readbackQuery,
    limit: Math.max(5, searchDocuments.length)
  });

  return {
    searchDocuments,
    readbackQuery,
    readbackHits: lexicalReadback.filter((result) =>
      searchDocuments.some((document) => document.id === result.id))
  };
};

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
    sourceAuthority: input.command.sourceAuthority,
    supportType: input.command.supportType,
    consumer: input.command.consumer,
    falsifier: input.command.falsifier,
    metadata: {
      file: input.file,
      contentHash: input.artifactHash,
      chunkIds: input.sourceChunks.map((chunk) => chunk.id),
      evidenceRef: input.sourceArtifact.uri,
      evidenceStatus: "captured",
      evidenceContentHash: input.artifactHash,
      evidenceCapturedAt: input.sourceArtifact.metadata?.evidenceCapturedAt,
      evidenceFreshness: "current",
      evidenceProvenance: "local source artifact preview",
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
    sourceAuthority: parsedSourceClaim.sourceAuthority,
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
  `searchDocument: ${search.searchDocuments[0]?.id ?? "none"}`,
  `searchDocuments: ${search.searchDocuments.map((document) => document.id).join(", ")}`,
  `searchDocumentCount: ${search.searchDocuments.length}`,
  `lexicalReadbackQuery: ${search.readbackQuery}`,
  `lexicalReadback: ${search.readbackHits.length === 0 ? "missing" : "hit"}`,
  ...(search.readbackHits[0] === undefined
    ? []
    : [`lexicalScore: ${search.readbackHits[0].lexicalScore}`])
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

const memorySearchReadbackCommand = (query: string): string =>
  `krn memory search --query ${shellQuote(query)} --json`;

const ingestLoopReadback = (input: {
  artifact: SourceArtifactPersistenceRows;
  search: SearchDocumentReadbackRows;
  claim: SourceClaimPersistenceRows;
  edge: SourceClaimEdgePersistenceRows;
}): SourceArtifactPreviewPersistenceReadback["ingestLoop"] => {
  const searchStatus: "ready" | "missing_readback" =
    input.search.searchDocuments.length > 0 &&
      input.search.readbackHits.length === input.search.searchDocuments.length
      ? "ready"
      : "missing_readback";
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
    memorySearchReadbackCommand: memorySearchReadbackCommand(input.search.readbackQuery),
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
    `memorySearchReadbackCommand: ${readback.memorySearchReadbackCommand}`,
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
    id: input.search.searchDocuments[0]?.id ?? "",
    ids: input.search.searchDocuments.map((document) => document.id),
    count: input.search.searchDocuments.length,
    lexicalReadbackQuery: input.search.readbackQuery,
    lexicalReadback: input.search.readbackHits.length === 0 ? "missing" : "hit",
    ...(input.search.readbackHits[0] === undefined
      ? {}
      : { lexicalScore: input.search.readbackHits[0].lexicalScore })
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

export const persistSourceArtifactPreview = async (
  runtime: SourceArtifactPreviewCommandRuntime,
  file: string,
  resolvedPath: string,
  artifactHash: string,
  chunks: readonly SourceArtifactPreviewChunk[],
  repoPath?: string
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

  const databaseRuntime = await createPreviewDatabaseRuntime(runtime, databaseUrl, now, repoPath);

  const persistInRuntime = async (
    activeRuntime: DatabaseRuntime
  ): Promise<SourceArtifactPreviewPersistenceResult> => {
    const contentAddressed = runtime.command.allChunks === true;
    const { retrievalRepository, createSourceChunk } =
      requirePreviewPersistenceRepositories(activeRuntime, contentAddressed);
    const artifact = await persistPreviewArtifactAndChunks({
      databaseRuntime: activeRuntime,
      createSourceChunk,
      file,
      resolvedPath,
      artifactHash,
      capturedAt,
      chunks,
      sourceAuthority: runtime.command.sourceAuthority ?? "source-code",
      contentAddressed
    });
    const search = await persistPreviewSearchDocument({
      databaseRuntime: activeRuntime,
      retrievalRepository,
      file,
      artifactHash,
      chunks,
      sourceArtifact: artifact.sourceArtifact,
      sourceChunks: artifact.sourceChunks
    });
    const claim = await persistOptionalSourceClaim({
      databaseRuntime: activeRuntime,
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
      databaseRuntime: activeRuntime,
      command: runtime.command,
      file,
      artifactHash,
      chunks,
      sourceChunks: artifact.sourceChunks,
      sourceClaim: claim.sourceClaim
    });
    const readback = persistenceReadback({
      databaseRuntime: activeRuntime,
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
        databaseRuntime: activeRuntime,
        artifact,
        search,
        claim,
        edge,
        reviewedExtractionClaimSelection
      })
    };
  };

  try {
    if (runtime.command.allChunks !== true) {
      return persistInRuntime(databaseRuntime);
    }

    if (databaseRuntime.withTransaction === undefined) {
      throw new Error("Atomic source corpus ingest is unavailable in this database runtime");
    }

    return databaseRuntime.withTransaction(
      `source-artifact-preview:${databaseRuntime.projectId}:${artifactHash}`,
      async (transaction) => persistInRuntime({
        ...databaseRuntime,
        sourceRepository: transaction.sourceRepository,
        retrievalRepository: transaction.retrievalRepository
      })
    );
  } finally {
    await databaseRuntime.close();
  }
};

export const persistenceFlags = (
  persistence: SourceArtifactPreviewPersistenceResult | undefined
): SourceArtifactPreviewPersistenceFlags => ({
  searchDocumentPersisted: persistence?.searchDocumentPersisted ?? false,
  sourceClaimPersisted: persistence?.sourceClaimPersisted ?? false,
  sourceClaimEdgePersisted: persistence?.sourceClaimEdgePersisted ?? false
});

export const sourceArtifactPreviewJson = (input: {
  runtime: SourceArtifactPreviewCommandRuntime;
  file: string;
  resolvedPath: string;
  artifactHash: string;
  raw: string;
  lines: readonly string[];
  chunkSize: number;
  chunks: readonly SourceArtifactPreviewChunk[];
  persistedChunkCount?: number;
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
      renderedChunks: input.chunks.length,
      persistedChunks: input.persistedChunkCount ?? 0
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
    persistenceFlags(input.persistence)
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
