import {
  mkdir,
  mkdtemp,
  rm,
  writeFile
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  afterEach,
  describe,
  expect,
  it
} from "vitest";

import {
  runSourceArtifactPreviewCommand
} from "./runSourceArtifactPreviewCommand.js";
import type {
  DatabaseRuntime
} from "./databaseRuntime.js";

const tempRoots: string[] = [];

const createTempRoot = async (): Promise<string> => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "krn-source-preview-"));
  tempRoots.push(tempRoot);

  return tempRoot;
};

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map(async (tempRoot) =>
    rm(tempRoot, {
      force: true,
      recursive: true
    })
  ));
});

describe("runSourceArtifactPreviewCommand", () => {
  it("renders deterministic local artifact chunks with source ranges", async () => {
    const tempRoot = await createTempRoot();
    const sourcePath = path.join(tempRoot, "source.md");

    await writeFile(sourcePath, [
      "# Source",
      "first fact",
      "second fact",
      "third fact",
      "fourth fact"
    ].join("\n"), "utf8");

    const result = await runSourceArtifactPreviewCommand({
      cwd: tempRoot,
      command: {
        kind: "sourceArtifactPreview",
        persist: false,
        file: "source.md",
        chunkLines: 2,
        limitChunks: 2
      }
    });

    expect(result.stdout).toContain("KRN Source Artifact Preview");
    expect(result.stdout).toContain("Persistence: disabled (local preview only)");
    expect(result.stdout).toContain("DB writes: none");
    expect(result.stdout).toContain("Memory mutation: none");
    expect(result.stdout).toContain("file: source.md");
    expect(result.stdout).toContain("contentHash: sha256:");
    expect(result.stdout).toContain("chunking: line-based | chunkLines=2 | renderedChunks=2");
    expect(result.stdout).toContain("sourceRange: lines 1-2");
    expect(result.stdout).toContain("sourceRange: lines 3-4");
    expect(result.stdout).toContain("preview: # Source\\nfirst fact");
    expect(result.stdout).toContain("Candidate bridge:");
    expect(result.stdout).toContain("searchDocumentCandidate:");
    expect(result.stdout).toContain("reviewability: ready");
    expect(result.stdout).toContain("subjectType: source_artifact");
    expect(result.stdout).toContain("No SearchDocument row created");
    expect(result.stdout).toContain("sourceClaimCandidate:");
    expect(result.stdout).toContain("reason: explicit claim/mechanism/consumer/falsifier inputs were not supplied");
    expect(result.stdout).toContain("No SourceClaim created");
    expect(result.stdout).toContain("doesNotProve: source truth, claim correctness, DB persistence, embeddings, graph retrieval, crawler readiness, or Memory Core mutation");
  });

  it("renders incomplete source claim candidates as reviewable missing-evidence output", async () => {
    const tempRoot = await createTempRoot();
    const sourcePath = path.join(tempRoot, "source.md");

    await writeFile(sourcePath, "claim source\n", "utf8");

    const result = await runSourceArtifactPreviewCommand({
      cwd: tempRoot,
      command: {
        kind: "sourceArtifactPreview",
        persist: false,
        file: "source.md",
        claim: "KRN should bridge preview evidence into candidates."
      }
    });

    expect(result.stdout).toContain("sourceClaimCandidate:");
    expect(result.stdout).toContain("status: incomplete");
    expect(result.stdout).toContain("reviewability: needs_more_evidence");
    expect(result.stdout).toContain("missing: --mechanism, --krn-implication, --does-not-prove, --support-type, --trust-tier, --consumer, --falsifier");
    expect(result.stdout).toContain("No SourceClaim created");
  });

  it("renders complete source claim candidates without persistence", async () => {
    const tempRoot = await createTempRoot();
    const sourcePath = path.join(tempRoot, "source.md");

    await writeFile(sourcePath, "candidate source\n", "utf8");

    const result = await runSourceArtifactPreviewCommand({
      cwd: tempRoot,
      command: {
        kind: "sourceArtifactPreview",
        persist: false,
        file: "source.md",
        claim: "Local artifact previews can feed source candidates.",
        mechanism: "Preview output carries content hash and source ranges.",
        krnImplication: "Use preview output as source candidate evidence before persistence.",
        doesNotProve: "This does not prove source truth.",
        supportType: "implementation-boundary",
        trustTier: "source-code",
        consumer: "ingest v0",
        falsifier: "Candidate output mutates SourceGraph."
      }
    });

    expect(result.stdout).toContain("sourceClaimCandidate:");
    expect(result.stdout).toContain("status: proposed");
    expect(result.stdout).toContain("reviewability: ready");
    expect(result.stdout).toContain("claim: Local artifact previews can feed source candidates.");
    expect(result.stdout).toContain("consumer: ingest v0");
    expect(result.stdout).toContain("No SourceClaim created");
  });

  it("persists local artifact chunks and reads back a search document when explicitly requested", async () => {
    const tempRoot = await createTempRoot();
    const sourcePath = path.join(tempRoot, "source.md");
    const timestamp = "2026-06-28T21:00:00.000Z";

    await writeFile(sourcePath, [
      "# Source",
      "searchable persisted artifact"
    ].join("\n"), "utf8");

    const result = await runSourceArtifactPreviewCommand({
      cwd: tempRoot,
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => timestamp,
      // Test fake implements only the persistence members exercised by this command.
      createDatabaseRuntime: async () => ({
        workspaceId: "workspace-1",
        projectId: "project-1",
        compilerDependencies: {} as DatabaseRuntime["compilerDependencies"],
        harnessRunRepository: {} as DatabaseRuntime["harnessRunRepository"],
        memoryRepository: {} as DatabaseRuntime["memoryRepository"],
        sourceRepository: {
          async createSourceArtifact(input) {
            return {
              id: "11111111-1111-4111-8111-111111111111",
              projectId: input.projectId,
              kind: input.kind,
              trustTier: input.trustTier,
              uri: input.uri,
              title: input.title,
              contentHash: input.contentHash,
              capturedAt: timestamp,
              metadata: input.metadata ?? {},
              createdAt: timestamp,
              updatedAt: timestamp
            };
          },
          async createSourceChunk(input) {
            return {
              id: "22222222-2222-4222-8222-222222222222",
              sourceArtifactId: input.sourceArtifactId,
              ordinal: input.ordinal,
              content: input.content,
              contentHash: input.contentHash,
              metadata: input.metadata ?? {},
              createdAt: timestamp
            };
          },
          async createSourceClaim() {
            throw new Error("createSourceClaim should not be called");
          },
          async getSourceClaimById() {
            throw new Error("getSourceClaimById should not be called");
          },
          async createSourceDecisionEdge() {
            throw new Error("createSourceDecisionEdge should not be called");
          },
          async createSourceRejection() {
            throw new Error("createSourceRejection should not be called");
          }
        },
        retrievalRepository: {
          async createSearchDocument(input) {
            return {
              id: "33333333-3333-4333-8333-333333333333",
              projectId: input.projectId,
              subjectType: input.subjectType,
              subjectId: input.subjectId,
              sourceArtifactId: input.sourceArtifactId,
              sourceChunkId: input.sourceChunkId,
              trustTier: input.trustTier ?? "medium",
              validityStatus: input.validityStatus ?? "active",
              language: input.language ?? "english",
              title: input.title,
              body: input.body,
              searchText: input.searchText ?? `${input.title}\n${input.body}`,
              metadataFilters: input.metadataFilters ?? {},
              validFrom: timestamp,
              metadata: input.metadata ?? {},
              createdAt: timestamp,
              updatedAt: timestamp
            };
          },
          async searchLexical() {
            return [{
              id: "33333333-3333-4333-8333-333333333333",
              projectId: "project-1",
              subjectType: "source_artifact",
              subjectId: "11111111-1111-4111-8111-111111111111",
              sourceArtifactId: "11111111-1111-4111-8111-111111111111",
              sourceChunkId: "22222222-2222-4222-8222-222222222222",
              trustTier: "source-code",
              validityStatus: "active",
              language: "english",
              title: "Local source artifact: source.md",
              body: "# Source\nsearchable persisted artifact",
              searchText: "Local source artifact: source.md\n# Source\nsearchable persisted artifact",
              metadataFilters: {},
              validFrom: timestamp,
              metadata: {},
              createdAt: timestamp,
              updatedAt: timestamp,
              lexicalScore: 100
            }];
          }
        },
        async close() {
          return undefined;
        }
      } satisfies DatabaseRuntime),
      command: {
        kind: "sourceArtifactPreview",
        persist: true,
        file: "source.md",
        chunkLines: 2,
        limitChunks: 1
      }
    });

    expect(result.stdout).toContain("Persistence: enabled (Postgres, explicit --persist)");
    expect(result.stdout).toContain("sourceArtifact: 11111111-1111-4111-8111-111111111111");
    expect(result.stdout).toContain("sourceChunks: 22222222-2222-4222-8222-222222222222");
    expect(result.stdout).toContain("searchDocument: 33333333-3333-4333-8333-333333333333");
    expect(result.stdout).toContain("lexicalReadback: hit");
    expect(result.stdout).toContain("Memory mutation: none");
    expect(result.stdout).toContain("Embeddings: none");
    expect(result.stdout).toContain("Graph runtime: none");
  });

  it("falls back to repo-root-relative paths when cwd is a package directory", async () => {
    const tempRoot = await createTempRoot();
    const packageDir = path.join(tempRoot, "packages", "cli");
    const docsDir = path.join(tempRoot, "docs");

    await writeFile(path.join(tempRoot, "pnpm-workspace.yaml"), "packages:\n  - packages/*\n", "utf8");
    await mkdir(docsDir, { recursive: true });
    await mkdir(packageDir, { recursive: true });
    await writeFile(path.join(docsDir, "source.md"), "root relative source\n", "utf8");

    const result = await runSourceArtifactPreviewCommand({
      cwd: packageDir,
      command: {
        kind: "sourceArtifactPreview",
        persist: false,
        file: "docs/source.md"
      }
    });

    expect(result.stdout).toContain("file: docs/source.md");
    expect(result.stdout).toContain("resolvedFile: ../../docs/source.md");
    expect(result.stdout).toContain("preview: root relative source");
  });

  it("rejects missing files before creating preview truth", async () => {
    const tempRoot = await createTempRoot();

    await expect(runSourceArtifactPreviewCommand({
      cwd: tempRoot,
      command: {
        kind: "sourceArtifactPreview",
        persist: false,
        file: "missing.md"
      }
    })).rejects.toThrow("ENOENT");
  });
});
