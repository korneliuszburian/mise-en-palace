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
import type {
  SourceClaim,
  SourceClaimEdge
} from "@krn/core";

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
    expect(result.stdout).toContain("sourceClaimEdgeCandidate:");
    expect(result.stdout).toContain("reason: explicit graph edge inputs were not supplied");
    expect(result.stdout).toContain("No SourceClaimEdge created");
    expect(result.stdout).toContain("extractionCandidatePreview:");
    expect(result.stdout).toContain("reason: --extract-candidates was not supplied");
    expect(result.stdout).toContain("No extracted entity, claim, or relation candidates created");
    expect(result.stdout).toContain("doesNotProve: source truth, claim correctness, DB persistence, embeddings, graph retrieval, crawler readiness, or Memory Core mutation");
  });

  it("renders candidate-only local extraction preview with source ranges", async () => {
    const tempRoot = await createTempRoot();
    const sourcePath = path.join(tempRoot, "source.md");

    await writeFile(sourcePath, [
      "# Temporal Claim Graph",
      "KRN should represent `SourceClaimEdge` candidates with source ranges.",
      "Source ranges must remain reviewable."
    ].join("\n"), "utf8");

    const result = await runSourceArtifactPreviewCommand({
      cwd: tempRoot,
      command: {
        kind: "sourceArtifactPreview",
        persist: false,
        file: "source.md",
        chunkLines: 3,
        limitChunks: 1,
        extractCandidates: true
      }
    });

    expect(result.stdout).toContain("extractionCandidatePreview:");
    expect(result.stdout).toContain("mode: deterministic_local_heuristic");
    expect(result.stdout).toContain("reviewability: ready");
    expect(result.stdout).toContain("entityCandidates:");
    expect(result.stdout).toContain("kind: markdown_heading | label: Temporal Claim Graph | sourceRange: lines 1-1");
    expect(result.stdout).toContain("kind: inline_code | label: SourceClaimEdge | sourceRange: lines 2-2");
    expect(result.stdout).toContain("claimCandidates:");
    expect(result.stdout).toContain("reviewability: ready | text: KRN should represent `SourceClaimEdge` candidates with source ranges. Source ranges must remain reviewable. | sourceRange: lines 2-3");
    expect(result.stdout).toContain("deferredClaimCandidates:");
    expect(result.stdout).toContain("  - none");
    expect(result.stdout).toContain("relationCandidates:");
    expect(result.stdout).toContain("kind: scoped_by_heading");
    expect(result.stdout).toContain("No SourceClaim row created from extraction candidates");
    expect(result.stdout).toContain("No SourceClaimEdge row created from extraction candidates");
    expect(result.stdout).toContain("Graph runtime: none");
    expect(result.stdout).toContain("Memory mutation: none");
    expect(result.stdout).toContain("doesNotProve: These deterministic extraction candidates do not prove entity identity, claim truth, relation correctness, graph retrieval quality, extraction quality, crawler readiness, or Memory Core mutation.");
  });

  it("defers fenced source-decision blocks and lead-in fragments instead of rendering them as ready claims", async () => {
    const tempRoot = await createTempRoot();
    const sourcePath = path.join(tempRoot, "source.md");

    await writeFile(sourcePath, [
      "# Source To Decision",
      "The current edge model already supports:",
      "",
      "```yaml",
      "mechanism: KRN should keep source ranges before graph persistence.",
      "decision: adopt candidate-only extraction preview.",
      "```",
      "",
      "KRN should render direct prose claims as reviewable candidates."
    ].join("\n"), "utf8");

    const result = await runSourceArtifactPreviewCommand({
      cwd: tempRoot,
      command: {
        kind: "sourceArtifactPreview",
        persist: false,
        file: "source.md",
        chunkLines: 12,
        limitChunks: 1,
        extractCandidates: true
      }
    });

    expect(result.stdout).toContain("claimCandidates:");
    expect(result.stdout).toContain("reviewability: ready | text: KRN should render direct prose claims as reviewable candidates. | sourceRange: lines 9-9");
    expect(result.stdout).toContain("deferredClaimCandidates:");
    expect(result.stdout).toContain("reviewability: needs_more_evidence | text: The current edge model already supports: | sourceRange: lines 2-2");
    expect(result.stdout).toContain("Lead-in fragment ends with ':' and needs following evidence before it can become a claim candidate.");
    expect(result.stdout).toContain("reviewability: needs_more_evidence | text: ```yaml mechanism: KRN should keep source ranges before graph persistence. decision: adopt candidate-only extraction preview. ``` | sourceRange: lines 4-7");
    expect(result.stdout).toContain("Fenced/code or source-decision metadata block requires human extraction before it can become a claim candidate.");
    expect(result.stdout).toContain("No SourceClaim row created from extraction candidates");
    expect(result.stdout).toContain("No SourceClaimEdge row created from extraction candidates");
    expect(result.stdout).toContain("Memory mutation: none");
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

  it("renders graph edge candidates with source ranges without persistence", async () => {
    const tempRoot = await createTempRoot();
    const sourcePath = path.join(tempRoot, "source.md");

    await writeFile(sourcePath, [
      "KRN Graph Brain narrows previous source claims.",
      "Source ranges must stay reviewable."
    ].join("\n"), "utf8");

    const result = await runSourceArtifactPreviewCommand({
      cwd: tempRoot,
      command: {
        kind: "sourceArtifactPreview",
        persist: false,
        file: "source.md",
        claim: "Graph preview can create reviewable source claim edge candidates.",
        mechanism: "Preview output has source ranges, a new claim candidate, and explicit edge metadata.",
        krnImplication: "Use source claim edge candidates before graph runtime work.",
        doesNotProve: "This does not prove graph retrieval quality.",
        supportType: "implementation-boundary",
        trustTier: "source-code",
        consumer: "graph brain v0",
        falsifier: "Graph preview mutates accepted graph truth.",
        graphEdgeToSourceClaimId: "target-source-claim-1",
        graphEdgeKind: "narrows",
        graphEdgeConsumer: "graph brain v0",
        graphEdgeDoesNotProve: "This edge candidate does not prove temporal truth."
      }
    });

    expect(result.stdout).toContain("sourceClaimEdgeCandidate:");
    expect(result.stdout).toContain("status: candidate");
    expect(result.stdout).toContain("reviewability: ready");
    expect(result.stdout).toContain("toSourceClaimId: target-source-claim-1");
    expect(result.stdout).toContain("kind: narrows");
    expect(result.stdout).toContain("evidenceRefs: source.md, sha256:");
    expect(result.stdout).toContain("source.md:lines 1-2");
    expect(result.stdout).toContain("No SourceClaimEdge created");
  });

  it("persists local artifact chunks, search document, and complete source claim when explicitly requested", async () => {
    const tempRoot = await createTempRoot();
    const sourcePath = path.join(tempRoot, "source.md");
    const timestamp = "2026-06-28T21:00:00.000Z";
    const sourceClaimId = "44444444-4444-4444-8444-444444444444" as SourceClaim["id"];
    const sourceClaimEdgeId = "55555555-5555-4555-8555-555555555555" as SourceClaimEdge["id"];
    const targetSourceClaimId = "66666666-6666-4666-8666-666666666666" as SourceClaim["id"];

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
          async createSourceClaim(input) {
            return {
              id: sourceClaimId,
              sourceArtifactId: input.sourceArtifactId as SourceClaim["sourceArtifactId"],
              sourceChunkId: input.sourceChunkId,
              executionRunId: input.executionRunId,
              claim: input.claim,
              mechanism: input.mechanism,
              krnImplication: input.krnImplication,
              doesNotProve: input.doesNotProve,
              trustTier: input.trustTier,
              supportType: input.supportType,
              consumer: input.consumer,
              falsifier: input.falsifier,
              revisitWhen: input.revisitWhen,
              status: input.status ?? "proposed",
              metadata: input.metadata ?? {},
              createdAt: timestamp,
              updatedAt: timestamp
            };
          },
          async getSourceClaimById(id) {
            if (id !== sourceClaimId) {
              return undefined;
            }

            return {
              id: sourceClaimId,
              sourceArtifactId: "11111111-1111-4111-8111-111111111111" as SourceClaim["sourceArtifactId"],
              sourceChunkId: "22222222-2222-4222-8222-222222222222",
              claim: "Local artifact previews can persist governed source claims.",
              mechanism: "Preview persistence creates Artifact and Chunk rows before creating SourceClaim.",
              krnImplication: "Use explicit local artifact evidence as the first Ingest v0 source-claim review path.",
              doesNotProve: "This does not prove source truth.",
              trustTier: "source-code",
              supportType: "implementation-boundary",
              consumer: "ingest v0",
              falsifier: "SourceClaim is not linked to the persisted SourceArtifact.",
              status: "proposed",
              metadata: {},
              createdAt: timestamp,
              updatedAt: timestamp
            };
          },
          async createSourceClaimEdge(input) {
            return {
              id: sourceClaimEdgeId,
              fromSourceClaimId: input.fromSourceClaimId,
              toSourceClaimId: input.toSourceClaimId,
              kind: input.kind,
              metadata: input.metadata,
              createdAt: timestamp
            };
          },
          async listSourceClaimEdgesForClaim(sourceClaimIdForReadback) {
            return sourceClaimIdForReadback === sourceClaimId
              ? [{
                  id: sourceClaimEdgeId,
                  fromSourceClaimId: sourceClaimId,
                  toSourceClaimId: targetSourceClaimId,
                  kind: "narrows",
                  metadata: {
                    consumer: "graph brain v0",
                    doesNotProve: "This edge candidate does not prove temporal truth."
                  },
                  createdAt: timestamp
                }]
              : [];
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
        limitChunks: 1,
        claim: "Local artifact previews can persist governed source claims.",
        mechanism: "Preview persistence creates Artifact and Chunk rows before creating SourceClaim.",
        krnImplication: "Use explicit local artifact evidence as the first Ingest v0 source-claim review path.",
        doesNotProve: "This does not prove source truth.",
        supportType: "implementation-boundary",
        trustTier: "source-code",
        consumer: "ingest v0",
        falsifier: "SourceClaim is not linked to the persisted SourceArtifact.",
        graphEdgeToSourceClaimId: targetSourceClaimId,
        graphEdgeKind: "narrows",
        graphEdgeConsumer: "graph brain v0",
        graphEdgeDoesNotProve: "This edge candidate does not prove temporal truth.",
        graphEdgeEvidenceRef: "source.md:lines 1-2"
      }
    });

    expect(result.stdout).toContain("Persistence: enabled (Postgres, explicit --persist)");
    expect(result.stdout).toContain("sourceArtifact: 11111111-1111-4111-8111-111111111111");
    expect(result.stdout).toContain("sourceChunks: 22222222-2222-4222-8222-222222222222");
    expect(result.stdout).toContain("searchDocument: 33333333-3333-4333-8333-333333333333");
    expect(result.stdout).toContain("lexicalReadback: hit");
    expect(result.stdout).toContain("sourceClaim: 44444444-4444-4444-8444-444444444444");
    expect(result.stdout).toContain("sourceClaimReadback: hit");
    expect(result.stdout).toContain("sourceClaimEdge: 55555555-5555-4555-8555-555555555555");
    expect(result.stdout).toContain("sourceClaimEdgeKind: narrows");
    expect(result.stdout).toContain("sourceClaimEdgeReadback: hit");
    expect(result.stdout).toContain("SourceClaim row created: see Persistence readback");
    expect(result.stdout).toContain("SourceClaimEdge row created: see Persistence readback");
    expect(result.stdout).toContain("Memory mutation: none");
    expect(result.stdout).toContain("Embeddings: none");
    expect(result.stdout).toContain("Graph runtime: none");
    expect(result.stdout).toContain("proves: complete explicit SourceClaim fields wrote and read back a SourceClaim row linked to the persisted SourceArtifact/SourceChunk");
    expect(result.stdout).toContain("proves: complete explicit SourceClaimEdge fields wrote and read back a governed SourceClaimEdge row linked to reviewed SourceClaim rows");
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
