import { createHash } from "node:crypto";
import {
  readFile,
  stat
} from "node:fs/promises";
import path from "node:path";

import {
  assessCandidateReviewability
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
const defaultWorkspaceSlug = "local";
const defaultProjectSlug = "mise-en-palace";

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

    return {
      searchDocumentPersisted: true,
      sourceClaimPersisted: sourceClaim !== undefined,
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
      "Embeddings: none",
      "Graph runtime: none",
      "doesNotProve: DB readback does not prove source truth, embeddings, graph retrieval, crawler readiness, or product readiness"
      ]
    };
  } finally {
    await databaseRuntime.close();
  }
};

const hasText = (value: string | undefined): boolean =>
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
  )
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
      "- doesNotProve: source truth, claim correctness, DB persistence, embeddings, graph retrieval, crawler readiness, or Memory Core mutation"
    ].join("\n")
  };
};
