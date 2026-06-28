import { createHash } from "node:crypto";
import {
  readFile,
  stat
} from "node:fs/promises";
import path from "node:path";

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

const defaultChunkLines = 40;
const defaultLimitChunks = 3;
const maxPreviewCharacters = 240;

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
      `contentHash: ${sha256(raw)}`,
      `bytes: ${Buffer.byteLength(raw, "utf8")}`,
      `lines: ${lines.length}`,
      `chunking: line-based | chunkLines=${chunkSize} | renderedChunks=${chunks.length}`,
      "",
      "Chunks:",
      ...formatChunks(chunks),
      "",
      "Proof:",
      "- proves: one local file was readable in this shell",
      "- proves: artifact and rendered chunk hashes were computed deterministically from current file bytes",
      "- proves: rendered chunks include source line ranges for review",
      "- doesNotProve: source truth, claim correctness, DB persistence, embeddings, graph retrieval, crawler readiness, or Memory Core mutation"
    ].join("\n")
  };
};
