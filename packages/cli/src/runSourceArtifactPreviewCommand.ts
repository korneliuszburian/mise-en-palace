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
  pathExists
} from "./cliFileBoundary.js";
import {
  createDatabaseRuntime
} from "./databaseRuntime.js";
import type {
  DatabaseRuntime,
  DatabaseRuntimeInput
} from "./databaseRuntime.js";

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

interface SourceArtifactPreviewChunk {
  ordinal: number;
  startLine: number;
  endLine: number;
  content: string;
  contentHash: string;
  preview: string;
}

interface SourceArtifactPreviewPersistenceResult {
  lines: string[];
  searchDocumentPersisted: boolean;
  sourceClaimPersisted: boolean;
  sourceClaimEdgePersisted: boolean;
}

type ExtractionEntityKind = "markdown_heading" | "inline_code";
type ExtractionRelationKind = "scoped_by_heading";

interface ExtractionEntityCandidate {
  id: string;
  label: string;
  kind: ExtractionEntityKind;
  sourceRange: string;
  lineNumber: number;
}

interface ExtractionClaimCandidate {
  id: string;
  text: string;
  sourceRange: string;
  lineNumber: number;
  reviewability: "ready" | "needs_more_evidence";
  reviewabilityReason: string;
}

interface ExtractionRelationCandidate {
  id: string;
  kind: ExtractionRelationKind;
  fromCandidateId: string;
  toCandidateId: string;
  sourceRange: string;
}

interface ExtractionCandidatePreview {
  entities: readonly ExtractionEntityCandidate[];
  claims: readonly ExtractionClaimCandidate[];
  deferredClaims: readonly ExtractionClaimCandidate[];
  relations: readonly ExtractionRelationCandidate[];
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

const candidateSlug = (value: string): string => {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-|-$/gu, "")
    .slice(0, 40);

  return slug.length === 0 ? "candidate" : slug;
};

const stripMarkdownPrefix = (value: string): string =>
  value
    .replace(/^#{1,6}\s+/u, "")
    .replace(/^[-*]\s+/u, "")
    .trim();

const extractLocalSourceCandidates = (
  chunks: readonly SourceArtifactPreviewChunk[]
): ExtractionCandidatePreview => {
  const entities: ExtractionEntityCandidate[] = [];
  const claims: ExtractionClaimCandidate[] = [];
  const deferredClaims: ExtractionClaimCandidate[] = [];
  const seenEntities = new Set<string>();
  const seenClaims = new Set<string>();

  for (const chunk of chunks) {
    const lines = chunk.content.split("\n");

    for (const [index, rawLine] of lines.entries()) {
      const lineNumber = chunk.startLine + index;
      const sourceRange = `lines ${lineNumber}-${lineNumber}`;
      const line = rawLine.trim();

      if (line.length === 0) {
        continue;
      }

      const headingMatch = /^(#{1,6})\s+(.+)$/u.exec(line);

      if (headingMatch?.[2] !== undefined) {
        const label = stripMarkdownPrefix(headingMatch[2]);
        const key = `markdown_heading:${lineNumber}:${label}`;

        if (label.length > 0 && !seenEntities.has(key)) {
          seenEntities.add(key);
          entities.push({
            id: `entity-candidate:${lineNumber}:${candidateSlug(label)}`,
            label,
            kind: "markdown_heading",
            sourceRange,
            lineNumber
          });
        }
      }

      for (const match of line.matchAll(/`([^`\n]{2,80})`/gu)) {
        const label = match[1]?.trim();
        const key = label === undefined ? undefined : `inline_code:${lineNumber}:${label}`;

        if (label !== undefined && label.length > 0 && key !== undefined && !seenEntities.has(key)) {
          seenEntities.add(key);
          entities.push({
            id: `entity-candidate:${lineNumber}:${candidateSlug(label)}`,
            label,
            kind: "inline_code",
            sourceRange,
            lineNumber
          });
        }
      }
    }

    let blockStartLine: number | undefined;
    let blockEndLine: number | undefined;
    let blockLines: string[] = [];
    let blockIsFenced = false;
    let insideFence = false;
    const flushClaimBlock = (): void => {
      if (blockStartLine === undefined || blockEndLine === undefined || blockLines.length === 0) {
        blockStartLine = undefined;
        blockEndLine = undefined;
        blockLines = [];
        blockIsFenced = false;

        return;
      }

      const normalizedClaim = blockLines.join(" ").replace(/\s+/gu, " ").trim();
      const hasClaimSignal =
        normalizedClaim.length >= 24 &&
        /\b(should|must|can|cannot|does|do|is|are|requires|reject|proves?|supports|contradicts|narrows|exposes?)\b/iu.test(normalizedClaim);
      const claimKey = `${blockStartLine}-${blockEndLine}:${normalizedClaim}`;

      if (hasClaimSignal && !seenClaims.has(claimKey)) {
        seenClaims.add(claimKey);
        const isLeadInFragment = /:\s*$/u.test(normalizedClaim);
        const claimCandidate = {
          id: `claim-candidate:${blockStartLine}:${candidateSlug(normalizedClaim)}`,
          text: normalizedClaim,
          sourceRange: `lines ${blockStartLine}-${blockEndLine}`,
          lineNumber: blockStartLine,
          reviewability: blockIsFenced || isLeadInFragment ? "needs_more_evidence" as const : "ready" as const,
          reviewabilityReason: blockIsFenced
            ? "Fenced/code or source-decision metadata block requires human extraction before it can become a claim candidate."
            : isLeadInFragment
              ? "Lead-in fragment ends with ':' and needs following evidence before it can become a claim candidate."
              : "Candidate has claim signal, source range, and no deterministic noise marker."
        };

        if (claimCandidate.reviewability === "ready") {
          claims.push(claimCandidate);
        } else {
          deferredClaims.push(claimCandidate);
        }
      }

      blockStartLine = undefined;
      blockEndLine = undefined;
      blockLines = [];
      blockIsFenced = false;
    };

    for (const [index, rawLine] of lines.entries()) {
      const lineNumber = chunk.startLine + index;
      const line = rawLine.trim();
      const isFenceLine = /^```/u.test(line);

      if (line.length === 0 || /^#{1,6}\s+/u.test(line)) {
        flushClaimBlock();
        continue;
      }

      if (isFenceLine && !insideFence) {
        flushClaimBlock();
        insideFence = true;
        blockIsFenced = true;
      }

      if (/^[-*]\s+/u.test(line) && blockLines.length > 0) {
        flushClaimBlock();
      }

      blockStartLine ??= lineNumber;
      blockEndLine = lineNumber;
      blockLines.push(stripMarkdownPrefix(line));

      if (isFenceLine && insideFence && blockLines.length > 1) {
        insideFence = false;
        flushClaimBlock();
      }
    }

    flushClaimBlock();
  }

  const headingEntities = entities.filter((entity) => entity.kind === "markdown_heading");
  const relations = claims.flatMap((claim): ExtractionRelationCandidate[] => {
    const heading = [...headingEntities]
      .reverse()
      .find((entity) => entity.lineNumber < claim.lineNumber);

    if (heading === undefined) {
      return [];
    }

    return [{
      id: `relation-candidate:${heading.lineNumber}-${claim.lineNumber}:scoped-by-heading`,
      kind: "scoped_by_heading",
      fromCandidateId: claim.id,
      toCandidateId: heading.id,
      sourceRange: `${heading.sourceRange}, ${claim.sourceRange}`
    }];
  });

  return {
    entities: entities.slice(0, 8),
    claims: claims.slice(0, 8),
    deferredClaims: deferredClaims.slice(0, 8),
    relations: relations.slice(0, 8)
  };
};

const chunkBody = (chunks: readonly SourceArtifactPreviewChunk[]): string =>
  chunks.map((chunk) =>
    [
      `chunk ${chunk.ordinal}`,
      `sourceRange: lines ${chunk.startLine}-${chunk.endLine}`,
      `contentHash: ${chunk.contentHash}`,
      `preview: ${chunk.preview}`
    ].join("\n")
  ).join("\n\n");

const formatSearchDocumentCandidate = (
  file: string,
  artifactHash: string,
  chunks: readonly SourceArtifactPreviewChunk[],
  persisted: boolean
): string[] => {
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

  return [
    "searchDocumentCandidate:",
    `- id: search-document-candidate:${artifactHash.slice("sha256:".length, "sha256:".length + 12)}`,
    "  status: candidate",
    `  reviewability: ${reviewability.reviewability}`,
    ...formatReviewabilityReasons(reviewability.reasons),
    `  subjectType: ${candidate.subjectType}`,
    `  subjectId: ${candidate.subjectId}`,
    `  trustTier: ${candidate.trustTier}`,
    `  title: ${candidate.title}`,
    `  evidenceRefs: ${[file, artifactHash].join(", ")}`,
    `  doesNotProve: ${searchDocumentCandidateDoesNotProve}`,
    persisted
      ? "  SearchDocument row created: see Persistence readback"
      : "  No SearchDocument row created"
  ];
};

const localArtifactUri = (resolvedPath: string, artifactHash: string, now: string): string =>
  `file://${resolvedPath}?krnPreviewHash=${encodeURIComponent(artifactHash)}&capturedAt=${encodeURIComponent(now)}`;

const persistSourceArtifactPreview = async (
  runtime: SourceArtifactPreviewCommandRuntime,
  file: string,
  resolvedPath: string,
  artifactHash: string,
  chunks: readonly SourceArtifactPreviewChunk[]
): Promise<SourceArtifactPreviewPersistenceResult> => {
  const databaseUrl = runtime.env?.KRN_DATABASE_URL?.trim();

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error("KRN_DATABASE_URL is required for krn source artifact preview --persist");
  }

  const now = runtime.now ?? (() => new Date().toISOString());
  const capturedAt = now();
  const createRuntime = runtime.createDatabaseRuntime ?? createDatabaseRuntime;
  const databaseRuntime = await createRuntime({
    databaseUrl,
    workspaceSlug: defaultWorkspaceSlug,
    projectSlug: defaultProjectSlug,
    repoPathHint: await findRepoRoot(runtime.cwd),
    now,
    createId: (prefix) => `${prefix}-${Date.now()}`
  });

  try {
    const artifactInput = parseSourceArtifactInput({
      kind: "file",
      title: `Local source artifact: ${file}`,
      uri: localArtifactUri(resolvedPath, artifactHash, capturedAt),
      contentHash: artifactHash,
      trustTier: "source-code",
      metadata: {
        file,
        resolvedPath,
        source: "krn source artifact preview --persist",
        doesNotProve: "Persisted local source artifact does not prove source truth, source freshness, embeddings, graph retrieval, crawler readiness, or Memory Core mutation."
      }
    });
    const retrievalRepository = databaseRuntime.retrievalRepository;

    if (retrievalRepository === undefined) {
      throw new Error("SearchDocument persistence is unavailable in this database runtime");
    }

    if (databaseRuntime.sourceRepository.createSourceChunk === undefined) {
      throw new Error("SourceChunk persistence is unavailable in this database runtime");
    }

    const sourceArtifact = await databaseRuntime.sourceRepository.createSourceArtifact({
      projectId: databaseRuntime.projectId,
      kind: artifactInput.kind,
      trustTier: artifactInput.trustTier,
      uri: artifactInput.uri,
      title: artifactInput.title,
      contentHash: artifactInput.contentHash ?? artifactHash,
      metadata: artifactInput.metadata
    });
    const sourceChunks = [];

    for (const chunk of chunks) {
      sourceChunks.push(await databaseRuntime.sourceRepository.createSourceChunk({
        sourceArtifactId: sourceArtifact.id,
        ordinal: chunk.ordinal,
        content: chunk.content,
        contentHash: chunk.contentHash,
        metadata: {
          file,
          sourceRange: `lines ${chunk.startLine}-${chunk.endLine}`,
          startLine: chunk.startLine,
          endLine: chunk.endLine
        }
      }));
    }

    const firstChunk = sourceChunks[0];
    const artifactHashPrefix = artifactHash.slice("sha256:".length, "sha256:".length + 16);
    const readbackQuery = `krn-source-artifact-preview ${artifactHashPrefix}`;
    const documentInput = parseSearchDocumentInput({
      projectId: databaseRuntime.projectId,
      subjectType: "source_artifact",
      subjectId: sourceArtifact.id,
      sourceArtifactId: sourceArtifact.id,
      ...(firstChunk === undefined ? {} : { sourceChunkId: firstChunk.id }),
      trustTier: "source-code",
      language: "english",
      title: `Local source artifact: ${file}`,
      body: chunkBody(chunks),
      searchText: [
        "krn-source-artifact-preview",
        artifactHashPrefix,
        file,
        chunkBody(chunks)
      ].join("\n"),
      metadataFilters: {
        source: "local_source_artifact_preview",
        file
      },
      metadata: {
        file,
        contentHash: artifactHash,
        chunkIds: sourceChunks.map((chunk) => chunk.id),
        source: "krn source artifact preview --persist",
        doesNotProve: "Persisted SearchDocument readback does not prove embeddings, graph retrieval, source truth, source freshness, or Memory Core mutation."
      }
    });
    const searchDocument = await retrievalRepository.createSearchDocument({
      projectId: databaseRuntime.projectId,
      subjectType: documentInput.subjectType,
      subjectId: documentInput.subjectId,
      sourceArtifactId: sourceArtifact.id,
      ...(firstChunk === undefined ? {} : { sourceChunkId: firstChunk.id }),
      trustTier: documentInput.trustTier,
      validityStatus: documentInput.validityStatus,
      language: documentInput.language,
      title: documentInput.title,
      body: documentInput.body,
      searchText: documentInput.searchText,
      metadataFilters: documentInput.metadataFilters,
      metadata: documentInput.metadata
    });
    const lexicalReadback = await retrievalRepository.searchLexical({
      projectId: databaseRuntime.projectId,
      query: readbackQuery,
      limit: 5
    });
    const readbackHit = lexicalReadback.find((result) => result.id === searchDocument.id);
    const hasCompleteSourceClaimCandidate =
      hasAnySourceClaimCandidateField(runtime.command) &&
      missingSourceClaimCandidateFields(runtime.command).length === 0;
    const parsedSourceClaim = hasCompleteSourceClaimCandidate
      ? parseSourceClaimInput({
          sourceArtifactId: sourceArtifact.id,
          ...(firstChunk === undefined ? {} : { sourceChunkId: firstChunk.id }),
          claim: runtime.command.claim,
          mechanism: runtime.command.mechanism,
          krnImplication: runtime.command.krnImplication,
          doesNotProve: runtime.command.doesNotProve,
          trustTier: runtime.command.trustTier,
          supportType: runtime.command.supportType,
          consumer: runtime.command.consumer,
          falsifier: runtime.command.falsifier,
          metadata: {
            file,
            contentHash: artifactHash,
            chunkIds: sourceChunks.map((chunk) => chunk.id),
            source: "krn source artifact preview --persist",
            doesNotProve: "Persisted SourceClaim readback does not prove source truth, claim acceptance, automatic extraction, embeddings, graph retrieval, crawler readiness, or Memory Core mutation."
          }
        })
      : undefined;
    const sourceClaim = parsedSourceClaim === undefined
      ? undefined
      : await databaseRuntime.sourceRepository.createSourceClaim({
          sourceArtifactId: sourceArtifact.id,
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
    const sourceClaimReadback = sourceClaim === undefined
      ? undefined
      : await databaseRuntime.sourceRepository.getSourceClaimById(sourceClaim.id);
    const graphEdgeInput = completeGraphEdgeInput(runtime.command);
    const sourceClaimEdge = sourceClaim === undefined || graphEdgeInput === undefined
      ? undefined
      : await databaseRuntime.sourceRepository.createSourceClaimEdge({
          fromSourceClaimId: sourceClaim.id,
          toSourceClaimId: graphEdgeInput.toSourceClaimId as SourceClaim["id"],
          kind: graphEdgeInput.kind,
          metadata: {
            consumer: graphEdgeInput.consumer,
            doesNotProve: graphEdgeInput.doesNotProve,
            ...(graphEdgeInput.evidenceRef === undefined
              ? {}
              : { evidenceRef: graphEdgeInput.evidenceRef }),
            ...(graphEdgeInput.sourceDecisionRef === undefined
              ? {}
              : { sourceDecisionRef: graphEdgeInput.sourceDecisionRef }),
            ...(graphEdgeInput.scope === undefined
              ? {}
              : { scope: graphEdgeInput.scope }),
            ...(graphEdgeInput.validFrom === undefined
              ? {}
              : { validFrom: graphEdgeInput.validFrom }),
            ...(graphEdgeInput.validUntil === undefined
              ? {}
              : { validUntil: graphEdgeInput.validUntil }),
            ...(graphEdgeInput.invalidatedAt === undefined
              ? {}
              : { invalidatedAt: graphEdgeInput.invalidatedAt }),
            file,
            contentHash: artifactHash,
            chunkIds: sourceChunks.map((chunk) => chunk.id),
            sourceRanges: chunks.map((chunk) => `lines ${chunk.startLine}-${chunk.endLine}`),
            source: "krn source artifact preview --persist"
          }
        });
    const sourceClaimEdgeReadback = sourceClaimEdge === undefined
      ? undefined
      : (await databaseRuntime.sourceRepository.listSourceClaimEdgesForClaim(sourceClaimEdge.fromSourceClaimId))
          .find((edge) => edge.id === sourceClaimEdge.id);

    return {
      searchDocumentPersisted: true,
      sourceClaimPersisted: sourceClaim !== undefined,
      sourceClaimEdgePersisted: sourceClaimEdge !== undefined,
      lines: [
      "Persistence readback:",
      "Persistence: enabled (Postgres, explicit --persist)",
      `project: ${databaseRuntime.projectId}`,
      `sourceArtifact: ${sourceArtifact.id}`,
      `sourceChunks: ${sourceChunks.map((chunk) => chunk.id).join(", ")}`,
      `searchDocument: ${searchDocument.id}`,
      `lexicalReadbackQuery: ${readbackQuery}`,
      `lexicalReadback: ${readbackHit === undefined ? "missing" : "hit"}`,
      ...(readbackHit === undefined
        ? []
        : [`lexicalScore: ${readbackHit.lexicalScore}`]),
      sourceClaim === undefined
        ? "sourceClaim: not created"
        : `sourceClaim: ${sourceClaim.id}`,
      ...(sourceClaim === undefined
        ? []
        : [`sourceClaimReadback: ${sourceClaimReadback === undefined ? "missing" : "hit"}`]),
      sourceClaimEdge === undefined
        ? "sourceClaimEdge: not created"
        : `sourceClaimEdge: ${sourceClaimEdge.id}`,
      ...(sourceClaimEdge === undefined
        ? []
        : [
            `sourceClaimEdgeKind: ${sourceClaimEdge.kind}`,
            `sourceClaimEdgeReadback: ${sourceClaimEdgeReadback === undefined ? "missing" : "hit"}`
          ]),
      "Embeddings: none",
      "Graph runtime: none",
      "doesNotProve: DB readback does not prove source truth, embeddings, graph retrieval, crawler readiness, or product readiness"
      ]
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

const hasAnySourceClaimCandidateField = (
  command: SourceArtifactPreviewCommand
): boolean =>
  sourceClaimCandidateFields.some((field) => hasText(command[field.name]));

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

  return {
    toSourceClaimId,
    kind,
    consumer,
    doesNotProve,
    ...(command.graphEdgeEvidenceRef === undefined
      ? {}
      : { evidenceRef: command.graphEdgeEvidenceRef }),
    ...(command.graphEdgeSourceDecisionRef === undefined
      ? {}
      : { sourceDecisionRef: command.graphEdgeSourceDecisionRef }),
    ...(command.graphEdgeScope === undefined ? {} : { scope: command.graphEdgeScope }),
    ...(command.graphEdgeValidFrom === undefined ? {} : { validFrom: command.graphEdgeValidFrom }),
    ...(command.graphEdgeValidUntil === undefined
      ? {}
      : { validUntil: command.graphEdgeValidUntil }),
    ...(command.graphEdgeInvalidatedAt === undefined
      ? {}
      : { invalidatedAt: command.graphEdgeInvalidatedAt })
  };
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

const formatSourceClaimCandidate = (
  command: SourceArtifactPreviewCommand,
  file: string,
  artifactHash: string,
  chunks: readonly SourceArtifactPreviewChunk[],
  persisted: boolean
): string[] => {
  if (!hasAnySourceClaimCandidateField(command)) {
    return [
      "sourceClaimCandidate:",
      "- not generated",
      "  reason: explicit claim/mechanism/consumer/falsifier inputs were not supplied",
      "  No SourceClaim created"
    ];
  }

  const missingFields = missingSourceClaimCandidateFields(command);

  if (missingFields.length > 0) {
    const reviewability = assessCandidateReviewability({
      summary: command.claim ?? "SourceClaim candidate from local source artifact preview.",
      ...(hasText(command.mechanism)
        ? { body: command.mechanism }
        : {}),
      evidenceRefs: [
        file,
        artifactHash,
        ...chunks.map((chunk) => chunk.contentHash)
      ],
      ...(hasText(command.falsifier)
        ? { applicationGuidance: command.falsifier }
        : {}),
      ...(hasText(command.doesNotProve)
        ? { doesNotProve: command.doesNotProve }
        : {}),
      missingFields
    });

    return [
      "sourceClaimCandidate:",
      "- id: source-claim-candidate:incomplete",
      "  status: incomplete",
      `  reviewability: ${reviewability.reviewability}`,
      ...formatReviewabilityReasons(reviewability.reasons),
      `  missing: ${missingFields.join(", ")}`,
      "  No SourceClaim created"
    ];
  }

  const candidate = parseSourceClaimInput({
    claim: command.claim,
    mechanism: command.mechanism,
    krnImplication: command.krnImplication,
    doesNotProve: command.doesNotProve,
    supportType: command.supportType,
    trustTier: command.trustTier,
    consumer: command.consumer,
    falsifier: command.falsifier,
    metadata: {
      file,
      contentHash: artifactHash,
      chunkHashes: chunks.map((chunk) => chunk.contentHash),
      source: "krn source artifact preview"
    }
  });
  const reviewability = assessCandidateReviewability({
    summary: candidate.claim,
    body: candidate.mechanism,
    evidenceRefs: [
      file,
      artifactHash,
      ...chunks.map((chunk) => chunk.contentHash)
    ],
    applicationGuidance: candidate.falsifier,
    doesNotProve: sourceClaimCandidateDoesNotProve
  });

  return [
    "sourceClaimCandidate:",
    `- id: source-claim-candidate:${artifactHash.slice("sha256:".length, "sha256:".length + 12)}`,
    `  status: ${candidate.status}`,
    `  reviewability: ${reviewability.reviewability}`,
    ...formatReviewabilityReasons(reviewability.reasons),
    `  claim: ${candidate.claim}`,
    `  mechanism: ${candidate.mechanism}`,
    `  consumer: ${candidate.consumer}`,
    `  falsifier: ${candidate.falsifier}`,
    `  evidenceRefs: ${[file, artifactHash].join(", ")}`,
    `  doesNotProve: ${sourceClaimCandidateDoesNotProve}`,
    persisted
      ? "  SourceClaim row created: see Persistence readback"
      : "  No SourceClaim created"
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
    return [
      "sourceClaimEdgeCandidate:",
      "- not generated",
      "  reason: explicit graph edge inputs were not supplied",
      "  No SourceClaimEdge created"
    ];
  }

  const missingFields = [
    ...missingGraphEdgeCandidateFields(command),
    ...missingSourceClaimCandidateFields(command).map((field) => `${field} for edge source claim`)
  ];

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

    return [
      "sourceClaimEdgeCandidate:",
      "- id: source-claim-edge-candidate:incomplete",
      "  status: incomplete",
      `  reviewability: ${reviewability.reviewability}`,
      ...formatReviewabilityReasons(reviewability.reasons),
      `  missing: ${missingFields.join(", ")}`,
      "  No SourceClaimEdge created"
    ];
  }

  const graphEdgeInput = completeGraphEdgeInput(command);

  if (graphEdgeInput === undefined) {
    return [
      "sourceClaimEdgeCandidate:",
      "- id: source-claim-edge-candidate:incomplete",
      "  status: incomplete",
      "  reviewability: unknown",
      "  reviewability reasons:",
      "  - Graph edge input could not be narrowed after missing-field checks.",
      "  No SourceClaimEdge created"
    ];
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

  return [
    "sourceClaimEdgeCandidate:",
    `- id: source-claim-edge-candidate:${artifactHash.slice("sha256:".length, "sha256:".length + 12)}`,
    "  status: candidate",
    `  reviewability: ${reviewability.reviewability}`,
    ...formatReviewabilityReasons(reviewability.reasons),
    `  fromSourceClaim: source-claim-candidate:${artifactHash.slice("sha256:".length, "sha256:".length + 12)}`,
    `  toSourceClaimId: ${graphEdgeInput.toSourceClaimId}`,
    `  kind: ${graphEdgeInput.kind}`,
    `  consumer: ${graphEdgeInput.consumer}`,
    `  evidenceRefs: ${generatedGraphEvidenceRefs(file, artifactHash, chunks).join(", ")}`,
    `  doesNotProve: ${graphEdgeInput.doesNotProve}`,
    sourceClaimPersisted
      ? "  SourceClaim row available for edge source: see Persistence readback"
      : "  No SourceClaim row available for edge source",
    sourceClaimEdgePersisted
      ? "  SourceClaimEdge row created: see Persistence readback"
      : "  No SourceClaimEdge created"
  ];
};

const formatExtractionCandidatePreview = (
  command: SourceArtifactPreviewCommand,
  file: string,
  artifactHash: string,
  chunks: readonly SourceArtifactPreviewChunk[]
): string[] => {
  if (command.extractCandidates !== true) {
    return [
      "extractionCandidatePreview:",
      "- not generated",
      "  reason: --extract-candidates was not supplied",
      "  No extracted entity, claim, or relation candidates created"
    ];
  }

  const extraction = extractLocalSourceCandidates(chunks);
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

  return [
    "extractionCandidatePreview:",
    "- status: candidate",
    "  mode: deterministic_local_heuristic",
    `  reviewability: ${reviewability.reviewability}`,
    ...formatReviewabilityReasons(reviewability.reasons),
    `  evidenceRefs: ${[file, artifactHash].join(", ")}`,
    `  doesNotProve: ${extractionCandidateDoesNotProve}`,
    "  entityCandidates:",
    ...(extraction.entities.length === 0
      ? ["  - none"]
      : extraction.entities.map((entity) =>
          `  - id: ${entity.id} | kind: ${entity.kind} | label: ${entity.label} | sourceRange: ${entity.sourceRange}`
        )),
    "  claimCandidates:",
    ...(extraction.claims.length === 0
      ? ["  - none"]
      : extraction.claims.map((claim) =>
          `  - id: ${claim.id} | reviewability: ${claim.reviewability} | text: ${claim.text} | sourceRange: ${claim.sourceRange} | reason: ${claim.reviewabilityReason}`
        )),
    "  deferredClaimCandidates:",
    ...(extraction.deferredClaims.length === 0
      ? ["  - none"]
      : extraction.deferredClaims.map((claim) =>
          `  - id: ${claim.id} | reviewability: ${claim.reviewability} | text: ${claim.text} | sourceRange: ${claim.sourceRange} | reason: ${claim.reviewabilityReason}`
        )),
    "  relationCandidates:",
    ...(extraction.relations.length === 0
      ? ["  - none"]
      : extraction.relations.map((relation) =>
          `  - id: ${relation.id} | kind: ${relation.kind} | from: ${relation.fromCandidateId} | to: ${relation.toCandidateId} | sourceRange: ${relation.sourceRange}`
        )),
    "  No SourceClaim row created from extraction candidates",
    "  No SourceClaimEdge row created from extraction candidates",
    "  Graph runtime: none",
    "  Memory mutation: none"
  ];
};

const formatCandidateBridge = (
  command: SourceArtifactPreviewCommand,
  file: string,
  artifactHash: string,
  chunks: readonly SourceArtifactPreviewChunk[],
  persistence?: SourceArtifactPreviewPersistenceResult
): string[] => [
  "Candidate bridge:",
  "Mutation: none",
  ...formatSearchDocumentCandidate(
    file,
    artifactHash,
    chunks,
    persistence?.searchDocumentPersisted ?? false
  ),
  ...formatSourceClaimCandidate(
    command,
    file,
    artifactHash,
    chunks,
    persistence?.sourceClaimPersisted ?? false
  ),
  ...formatSourceClaimEdgeCandidate(
    command,
    file,
    artifactHash,
    chunks,
    persistence?.sourceClaimPersisted ?? false,
    persistence?.sourceClaimEdgePersisted ?? false
  ),
  ...formatExtractionCandidatePreview(command, file, artifactHash, chunks)
];

const resolveInputFile = async (cwd: string, filePath: string): Promise<string> => {
  const cwdPath = path.resolve(cwd, filePath);

  if (await pathExists(cwdPath)) {
    return cwdPath;
  }

  const repoRoot = await findRepoRoot(cwd);

  return path.resolve(repoRoot, filePath);
};

export const runSourceArtifactPreviewCommand = async (
  runtime: SourceArtifactPreviewCommandRuntime
): Promise<SourceArtifactPreviewCommandResult> => {
  const file = runtime.command.file;

  if (file === undefined || file.trim().length === 0) {
    throw new Error("--file is required for krn source artifact preview");
  }

  const resolvedPath = await resolveInputFile(runtime.cwd, file);
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
