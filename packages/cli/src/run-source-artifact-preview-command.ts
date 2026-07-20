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
} from "./parse-args.js";
import {
  pathExists,
  resolveRepoInputFile
} from "./cli-file-boundary.js";
import type {
  DatabaseRuntime,
  DatabaseRuntimeInput
} from "./database-runtime.js";
import {
  persistSourceArtifactPreview,
  persistenceFlags,
  sha256,
  sourceArtifactPreviewJson
} from "./source-artifact-preview-persistence.js";
import {
  formatCandidateBridge,
  formatChunks
} from "./source-artifact-preview-view.js";
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
  const persistedChunkLimit = runtime.command.allChunks === true
    ? Math.max(1, Math.ceil(lines.length / chunkSize))
    : runtime.command.limitChunks ?? defaultLimitChunks;
  const chunks = buildSourceArtifactPreviewChunks({
    lines,
    chunkSize,
    limit: persistedChunkLimit,
    contentHash: sha256,
    maxPreviewCharacters
  });
  const renderedChunks = chunks.slice(0, runtime.command.limitChunks ?? defaultLimitChunks);
  const artifactHash = sha256(raw);
  const repoPath = runtime.command.repo === undefined
    ? undefined
    : path.resolve(runtime.cwd, runtime.command.repo);

  if (repoPath !== undefined && !(await pathExists(repoPath))) {
    throw new Error(`Target repo does not exist: ${repoPath}`);
  }
  const persistence = runtime.command.persist
    ? await persistSourceArtifactPreview(runtime, file, resolvedPath, artifactHash, chunks, repoPath)
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
        chunks: renderedChunks,
        persistedChunkCount: chunks.length,
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
      `chunking: line-based | chunkLines=${chunkSize} | renderedChunks=${renderedChunks.length} | persistedChunks=${runtime.command.persist ? chunks.length : 0}`,
      "",
      "Chunks:",
      ...formatChunks(renderedChunks),
      "",
      ...formatCandidateBridge(runtime.command, file, artifactHash, renderedChunks, persistenceFlags(persistence)),
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
