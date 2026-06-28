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
  parseSourceClaimInput
} from "@krn/schema";
import type {
  CliCommand
} from "./parseArgs.js";
import {
  findRepoRoot,
  pathExists
} from "./cliFileBoundary.js";

export type SourceArtifactPreviewCommand = Extract<CliCommand, { kind: "sourceArtifactPreview" }>;

export interface SourceArtifactPreviewCommandRuntime {
  cwd: string;
  command: SourceArtifactPreviewCommand;
}

export interface SourceArtifactPreviewCommandResult {
  stdout: string;
}

interface SourceArtifactPreviewChunk {
  ordinal: number;
  startLine: number;
  endLine: number;
  contentHash: string;
  preview: string;
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
  chunks: readonly SourceArtifactPreviewChunk[]
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
    "  No SearchDocument row created"
  ];
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
  chunks: readonly SourceArtifactPreviewChunk[]
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
    "  No SourceClaim created"
  ];
};

const formatCandidateBridge = (
  command: SourceArtifactPreviewCommand,
  file: string,
  artifactHash: string,
  chunks: readonly SourceArtifactPreviewChunk[]
): string[] => [
  "Candidate bridge:",
  "Mutation: none",
  ...formatSearchDocumentCandidate(file, artifactHash, chunks),
  ...formatSourceClaimCandidate(command, file, artifactHash, chunks)
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

  return {
    stdout: [
      "KRN Source Artifact Preview",
      "Persistence: disabled (local preview only)",
      "DB writes: none",
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
      ...formatCandidateBridge(runtime.command, file, artifactHash, chunks),
      "",
      "Proof:",
      "- proves: one local file was readable in this shell",
      "- proves: artifact and rendered chunk hashes were computed deterministically from current file bytes",
      "- proves: rendered chunks include source line ranges for review",
      "- proves: preview output can produce reviewable source/search candidate proposals without persistence",
      "- doesNotProve: source truth, claim correctness, DB persistence, embeddings, graph retrieval, crawler readiness, or Memory Core mutation"
    ].join("\n")
  };
};
