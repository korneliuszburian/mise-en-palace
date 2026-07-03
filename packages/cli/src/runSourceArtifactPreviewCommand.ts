import {
  readFile,
  stat
} from "node:fs/promises";
import path from "node:path";

import {
  buildSourceArtifactPreviewChunks,
  sourceArtifactLines
} from "@krn/core";
import type {
  CliCommand
} from "./parseArgs.js";
import {
  resolveRepoInputFile
} from "./cliFileBoundary.js";
import type {
  DatabaseRuntime,
  DatabaseRuntimeInput
} from "./databaseRuntime.js";
import {
  persistSourceArtifactPreview,
  persistenceFlags,
  sha256,
  sourceArtifactPreviewJson
} from "./sourceArtifactPreviewPersistence.js";
import {
  formatCandidateBridge,
  formatChunks
} from "./sourceArtifactPreviewView.js";
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

const defaultChunkLines = 40;
const defaultLimitChunks = 3;
const maxPreviewCharacters = 240;

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
  const lines = sourceArtifactLines(raw);
  const chunkSize = runtime.command.chunkLines ?? defaultChunkLines;
  const chunkLimit = runtime.command.limitChunks ?? defaultLimitChunks;
  const chunks = buildSourceArtifactPreviewChunks({
    lines,
    chunkSize,
    limit: chunkLimit,
    contentHash: sha256,
    maxPreviewCharacters
  });
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
      ...formatCandidateBridge(runtime.command, file, artifactHash, chunks, persistenceFlags(persistence)),
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
