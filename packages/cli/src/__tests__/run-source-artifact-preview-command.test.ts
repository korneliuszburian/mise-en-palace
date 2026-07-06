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
} from "../run-source-artifact-preview-command.js";
import type {
  DatabaseRuntime
} from "../database-runtime.js";
import type {
  SourceClaim,
  SourceClaimEdge
} from "@krn/core";

type SourceArtifactCreateInput = Parameters<
  DatabaseRuntime["sourceRepository"]["createSourceArtifact"]
>[0];
type SourceChunkCreateInput = Parameters<
  NonNullable<DatabaseRuntime["sourceRepository"]["createSourceChunk"]>
>[0];
type SourceArtifactRecord = Awaited<
  ReturnType<DatabaseRuntime["sourceRepository"]["createSourceArtifact"]>
>;
type SourceClaimRecord = Awaited<
  ReturnType<DatabaseRuntime["sourceRepository"]["createSourceClaim"]>
>;
type SearchDocumentRecord = Awaited<
  ReturnType<NonNullable<DatabaseRuntime["retrievalRepository"]>["createSearchDocument"]>
>;
type SearchDocumentCreateInput = Parameters<
  NonNullable<DatabaseRuntime["retrievalRepository"]>["createSearchDocument"]
>[0];

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

const sourceReadbackNoops = {
  async listClaimsForProject() {
    return [];
  },
  async getSourceDecisionEdgeById() {
    return undefined;
  }
} satisfies Pick<
  DatabaseRuntime["sourceRepository"],
  "listClaimsForProject" | "getSourceDecisionEdgeById"
>;

const sourceArtifactRecord = (
  input: SourceArtifactCreateInput,
  timestamp: string
): SourceArtifactRecord => ({
  id: "11111111-1111-4111-8111-111111111111",
  ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
  kind: input.kind,
  trustTier: input.trustTier,
  uri: input.uri,
  title: input.title,
  contentHash: input.contentHash,
  capturedAt: timestamp,
  metadata: input.metadata ?? {},
  createdAt: timestamp,
  updatedAt: timestamp
});

const sourceClaimRecord = (
  id: SourceClaim["id"],
  input: Parameters<DatabaseRuntime["sourceRepository"]["createSourceClaim"]>[0],
  timestamp: string
): SourceClaimRecord => ({
  id,
  sourceArtifactId: input.sourceArtifactId as SourceClaim["sourceArtifactId"],
  ...(input.sourceChunkId === undefined ? {} : { sourceChunkId: input.sourceChunkId }),
  ...(input.executionRunId === undefined ? {} : { executionRunId: input.executionRunId }),
  claim: input.claim,
  mechanism: input.mechanism,
  krnImplication: input.krnImplication,
  doesNotProve: input.doesNotProve,
  trustTier: input.trustTier,
  supportType: input.supportType,
  consumer: input.consumer,
  ...(input.falsifier === undefined ? {} : { falsifier: input.falsifier }),
  ...(input.revisitWhen === undefined ? {} : { revisitWhen: input.revisitWhen }),
  status: input.status ?? "proposed",
  metadata: input.metadata ?? {},
  createdAt: timestamp,
  updatedAt: timestamp
});

const optionalSearchDocumentFields = (
  input: SearchDocumentCreateInput
): Partial<SearchDocumentRecord> =>
  Object.fromEntries(
    Object.entries({
      projectId: input.projectId,
      sourceArtifactId: input.sourceArtifactId,
      sourceChunkId: input.sourceChunkId,
      sourceClaimId: input.sourceClaimId,
      memoryRecordId: input.memoryRecordId,
      antiMemoryRecordId: input.antiMemoryRecordId,
      evidenceBundleId: input.evidenceBundleId,
      reviewAssessmentId: input.reviewAssessmentId,
      sourceDecisionId: input.sourceDecisionId,
      runEventId: input.runEventId,
      validUntil: input.validUntil
    }).filter(([, value]) => value !== undefined)
  ) as Partial<SearchDocumentRecord>;

const searchDocumentRecord = (
  input: SearchDocumentCreateInput,
  timestamp: string
): SearchDocumentRecord => ({
  id: "33333333-3333-4333-8333-333333333333",
  ...optionalSearchDocumentFields(input),
  subjectType: input.subjectType,
  subjectId: input.subjectId,
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

  it("renders local preview as structured json for brain reuse", async () => {
    const tempRoot = await createTempRoot();
    const sourcePath = path.join(tempRoot, "source.md");

    await writeFile(sourcePath, [
      "# Source",
      "first fact",
      "second fact"
    ].join("\n"), "utf8");

    const result = await runSourceArtifactPreviewCommand({
      cwd: tempRoot,
      command: {
        kind: "sourceArtifactPreview",
        persist: false,
        json: true,
        file: "source.md",
        chunkLines: 2,
        limitChunks: 2
      }
    });
    const parsed: unknown = JSON.parse(result.stdout);

    expect(parsed).toMatchObject({
      kind: "krn.sourceArtifactPreview.v1",
      access: "local_preview",
      mutation: {
        memory: "none",
        crawler: "none",
        embeddings: "none",
        graphRuntime: "none"
      },
      persistence: {
        enabled: false,
        dbWrites: "none"
      },
      artifact: {
        file: "source.md",
        resolvedFile: "source.md",
        lines: 3,
        chunking: {
          strategy: "line-based",
          chunkLines: 2,
          renderedChunks: 2
        }
      },
      candidateBridge: {
        mutation: "none",
        searchDocumentCandidate: {
          status: "candidate",
          reviewability: "ready",
          subjectType: "source_artifact",
          persisted: false
        },
        sourceClaimCandidate: {
          status: "not_generated",
          persisted: false
        },
        sourceClaimEdgeCandidate: {
          status: "not_generated",
          persisted: false
        },
        extractionCandidatePreview: {
          status: "not_generated"
        }
      }
    });
    expect(parsed).toMatchObject({
      proof: {
        doesNotProve: expect.arrayContaining([
          "source truth",
          "Memory Core mutation",
          "product readiness"
        ])
      }
    });
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

  it("carries fenced block state across chunk boundaries before classifying claims", async () => {
    const tempRoot = await createTempRoot();
    const sourcePath = path.join(tempRoot, "source.md");

    await writeFile(sourcePath, [
      "# Source To Decision",
      "```yaml",
      "source_id: chunked-source-decision",
      "mechanism: KRN should not render fenced continuation as a ready claim.",
      "decision: adopt carried fence-state extraction.",
      "```",
      "KRN should render direct prose outside the fence as ready."
    ].join("\n"), "utf8");

    const result = await runSourceArtifactPreviewCommand({
      cwd: tempRoot,
      command: {
        kind: "sourceArtifactPreview",
        persist: false,
        file: "source.md",
        chunkLines: 3,
        limitChunks: 3,
        extractCandidates: true
      }
    });

    expect(result.stdout).toContain("claimCandidates:");
    expect(result.stdout).not.toContain("reviewability: ready | text: mechanism: KRN should not render fenced continuation as a ready claim.");
    expect(result.stdout).toContain("reviewability: ready | text: KRN should render direct prose outside the fence as ready. | sourceRange: lines 7-7");
    expect(result.stdout).toContain("deferredClaimCandidates:");
    expect(result.stdout).toContain("reviewability: needs_more_evidence | text: mechanism: KRN should not render fenced continuation as a ready claim. decision: adopt carried fence-state extraction. ``` | sourceRange: lines 4-6");
    expect(result.stdout).toContain("Fenced/code or source-decision metadata block requires human extraction before it can become a claim candidate.");
    expect(result.stdout).toContain("Graph runtime: none");
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
          ...sourceReadbackNoops,
          async createSourceArtifact(input) {
            return sourceArtifactRecord(input, timestamp);
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
            return sourceClaimRecord(sourceClaimId, input, timestamp);
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
            return searchDocumentRecord(input, timestamp);
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
    expect(result.stdout).toContain("Ingest loop readback:");
    expect(result.stdout).toContain("artifactToChunks: ready (1 chunk row(s))");
    expect(result.stdout).toContain("chunkToSearchDocument: ready");
    expect(result.stdout).toContain("searchDocumentToActivationReadback: ready");
    expect(result.stdout).toContain("sourceClaimReadback: ready");
    expect(result.stdout).toContain("sourceClaimEdgeReadback: ready");
    expect(result.stdout).toContain("activationReadbackQuery: krn-source-artifact-preview ");
    expect(result.stdout).toContain("sourceSearchReadbackCommand: krn source search --query \"krn-source-artifact-preview ");
    expect(result.stdout).toContain("brainSearchReadbackCommand: krn brain search --query \"krn-source-artifact-preview ");
    expect(result.stdout).toContain("nextAction: run the readback command before changing ranking, crawler, schema, UI, API, or MCP");
    expect(result.stdout).toContain("SourceClaim row created: see Persistence readback");
    expect(result.stdout).toContain("SourceClaimEdge row created: see Persistence readback");
    expect(result.stdout).toContain("Memory mutation: none");
    expect(result.stdout).toContain("Embeddings: none");
    expect(result.stdout).toContain("Graph runtime: none");
    expect(result.stdout).toContain("proves: complete explicit SourceClaim fields wrote and read back a SourceClaim row linked to the persisted SourceArtifact/SourceChunk");
    expect(result.stdout).toContain("proves: complete explicit SourceClaimEdge fields wrote and read back a governed SourceClaimEdge row linked to reviewed SourceClaim rows");
  });

  it("invokes source chunk persistence with the repository receiver intact", async () => {
    const tempRoot = await createTempRoot();
    const sourcePath = path.join(tempRoot, "source.md");
    const timestamp = "2026-06-30T09:00:00.000Z";
    let sourceChunkReceiverWasBound = false;

    await writeFile(sourcePath, "KRN should preserve repository method receivers.\n", "utf8");

    const sourceRepository = {
      receiverMarker: "source-repository",
      ...sourceReadbackNoops,
      async createSourceArtifact(input: SourceArtifactCreateInput) {
        return sourceArtifactRecord(input, timestamp);
      },
      async createSourceChunk(
        this: { receiverMarker: string },
        input: SourceChunkCreateInput
      ) {
        sourceChunkReceiverWasBound = this.receiverMarker === "source-repository";

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
      async createSourceClaimEdge() {
        throw new Error("createSourceClaimEdge should not be called");
      },
      async listSourceClaimEdgesForClaim() {
        throw new Error("listSourceClaimEdgesForClaim should not be called");
      },
      async createSourceDecisionEdge() {
        throw new Error("createSourceDecisionEdge should not be called");
      },
      async createSourceRejection() {
        throw new Error("createSourceRejection should not be called");
      }
    } satisfies DatabaseRuntime["sourceRepository"] & { receiverMarker: string };

    const result = await runSourceArtifactPreviewCommand({
      cwd: tempRoot,
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => timestamp,
      createDatabaseRuntime: async () => ({
        workspaceId: "workspace-1",
        projectId: "project-1",
        compilerDependencies: {} as DatabaseRuntime["compilerDependencies"],
        harnessRunRepository: {} as DatabaseRuntime["harnessRunRepository"],
        memoryRepository: {} as DatabaseRuntime["memoryRepository"],
        sourceRepository,
        retrievalRepository: {
          async createSearchDocument(input) {
            return searchDocumentRecord(input, timestamp);
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
              body: "KRN should preserve repository method receivers.",
              searchText: "KRN should preserve repository method receivers.",
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

    expect(sourceChunkReceiverWasBound).toBe(true);
    expect(result.stdout).toContain("sourceChunks: 22222222-2222-4222-8222-222222222222");
    expect(result.stdout).toContain("lexicalReadback: hit");
    expect(result.stdout).toContain("Ingest loop readback:");
    expect(result.stdout).toContain("chunkToSearchDocument: ready");
    expect(result.stdout).toContain("sourceClaimReadback: not_created");
    expect(result.stdout).toContain("sourceClaimEdgeReadback: not_created");
  });

  it("renders persisted readback as structured json", async () => {
    const tempRoot = await createTempRoot();
    const sourcePath = path.join(tempRoot, "source.md");
    const timestamp = "2026-07-01T09:00:00.000Z";

    await writeFile(sourcePath, "KRN source artifact JSON readback should stay reusable.\n", "utf8");

    const result = await runSourceArtifactPreviewCommand({
      cwd: tempRoot,
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => timestamp,
      createDatabaseRuntime: async () => ({
        workspaceId: "workspace-1",
        projectId: "project-1",
        compilerDependencies: {} as DatabaseRuntime["compilerDependencies"],
        harnessRunRepository: {} as DatabaseRuntime["harnessRunRepository"],
        memoryRepository: {} as DatabaseRuntime["memoryRepository"],
        sourceRepository: {
          ...sourceReadbackNoops,
          async createSourceArtifact(input) {
            return sourceArtifactRecord(input, timestamp);
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
          async createSourceClaimEdge() {
            throw new Error("createSourceClaimEdge should not be called");
          },
          async listSourceClaimEdgesForClaim() {
            throw new Error("listSourceClaimEdgesForClaim should not be called");
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
            return searchDocumentRecord(input, timestamp);
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
              body: "KRN source artifact JSON readback should stay reusable.",
              searchText: "KRN source artifact JSON readback should stay reusable.",
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
        json: true,
        file: "source.md",
        chunkLines: 2,
        limitChunks: 1
      }
    });
    const parsed: unknown = JSON.parse(result.stdout);

    expect(parsed).toMatchObject({
      kind: "krn.sourceArtifactPreview.v1",
      access: "persisted_readback",
      persistence: {
        enabled: true,
        readback: {
          projectId: "project-1",
          sourceArtifact: {
            id: "11111111-1111-4111-8111-111111111111"
          },
          sourceChunks: ["22222222-2222-4222-8222-222222222222"],
          searchDocument: {
            id: "33333333-3333-4333-8333-333333333333",
            lexicalReadback: "hit",
            lexicalScore: 100
          },
          sourceClaim: {
            created: false,
            readback: "not_created"
          },
          sourceClaimEdge: {
            created: false,
            readback: "not_created"
          },
          ingestLoop: {
            artifactToChunks: "ready",
            chunkRows: 1,
            chunkToSearchDocument: "ready",
            sourceClaimReadback: "not_created",
            sourceClaimEdgeReadback: "not_created"
          }
        }
      },
      candidateBridge: {
        searchDocumentCandidate: {
          persisted: true
        }
      }
    });
    expect(parsed).toMatchObject({
      persistence: {
        readback: {
          ingestLoop: {
            sourceSearchReadbackCommand: expect.stringContaining("krn source search --query"),
            brainSearchReadbackCommand: expect.stringContaining("krn brain search --query")
          }
        }
      }
    });
  });

  it("persists a selected ready extraction claim only through the reviewed bridge", async () => {
    const tempRoot = await createTempRoot();
    const sourcePath = path.join(tempRoot, "source.md");
    const timestamp = "2026-06-29T09:00:00.000Z";
    const sourceClaimId = "77777777-7777-4777-8777-777777777777" as SourceClaim["id"];
    let capturedClaim: string | undefined;
    let capturedMetadata: Record<string, unknown> | undefined;

    await writeFile(sourcePath, "KRN should persist reviewed claims.\n", "utf8");

    const result = await runSourceArtifactPreviewCommand({
      cwd: tempRoot,
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => timestamp,
      createDatabaseRuntime: async () => ({
        workspaceId: "workspace-1",
        projectId: "project-1",
        compilerDependencies: {} as DatabaseRuntime["compilerDependencies"],
        harnessRunRepository: {} as DatabaseRuntime["harnessRunRepository"],
        memoryRepository: {} as DatabaseRuntime["memoryRepository"],
        sourceRepository: {
          ...sourceReadbackNoops,
          async createSourceArtifact(input) {
            return sourceArtifactRecord(input, timestamp);
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
            capturedClaim = input.claim;
            capturedMetadata = input.metadata;

            return sourceClaimRecord(sourceClaimId, input, timestamp);
          },
          async getSourceClaimById(id) {
            return id === sourceClaimId
              ? {
                  id: sourceClaimId,
                  sourceArtifactId: "11111111-1111-4111-8111-111111111111" as SourceClaim["sourceArtifactId"],
                  sourceChunkId: "22222222-2222-4222-8222-222222222222",
                  claim: "KRN should persist reviewed claims.",
                  mechanism: "Operator selected a ready extraction candidate and supplied governance fields.",
                  krnImplication: "Use reviewed extraction bridge before graph ranking work.",
                  doesNotProve: "This does not prove extracted claim truth.",
                  trustTier: "source-code",
                  supportType: "implementation-boundary",
                  consumer: "graph brain v0",
                  falsifier: "Deferred extraction candidates can be persisted.",
                  status: "proposed",
                  metadata: {},
                  createdAt: timestamp,
                  updatedAt: timestamp
                }
              : undefined;
          },
          async createSourceClaimEdge() {
            throw new Error("createSourceClaimEdge should not be called");
          },
          async listSourceClaimEdgesForClaim() {
            return [];
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
            return searchDocumentRecord(input, timestamp);
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
              body: "KRN should persist reviewed claims.",
              searchText: "KRN should persist reviewed claims.",
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
        extractCandidates: true,
        reviewedExtractionClaimCandidateId: "claim-candidate:1:krn-should-persist-reviewed-claims",
        mechanism: "Operator selected a ready extraction candidate and supplied governance fields.",
        krnImplication: "Use reviewed extraction bridge before graph ranking work.",
        doesNotProve: "This does not prove extracted claim truth.",
        supportType: "implementation-boundary",
        trustTier: "source-code",
        consumer: "graph brain v0",
        falsifier: "Deferred extraction candidates can be persisted."
      }
    });

    expect(capturedClaim).toBe("KRN should persist reviewed claims.");
    expect(capturedMetadata).toMatchObject({
      extractionCandidateId: "claim-candidate:1:krn-should-persist-reviewed-claims",
      extractionCandidateSourceRange: "lines 1-1",
      reviewedExtractionBridge: true
    });
    expect(result.stdout).toContain("reviewedExtractionClaimCandidate: claim-candidate:1:krn-should-persist-reviewed-claims");
    expect(result.stdout).toContain("reviewedExtractionClaimSourceRange: lines 1-1");
    expect(result.stdout).toContain("source: reviewed_extraction_claim_candidate");
    expect(result.stdout).toContain("SourceClaim row created from reviewed extraction candidate: see Persistence readback");
    expect(result.stdout).toContain("Memory mutation: none");
    expect(result.stdout).toContain("Graph runtime: none");
  });

  it("rejects deferred extraction candidates before creating database runtime", async () => {
    const tempRoot = await createTempRoot();
    const sourcePath = path.join(tempRoot, "source.md");
    let databaseRuntimeCreated = false;

    await writeFile(sourcePath, "The current model supports:\n", "utf8");

    await expect(runSourceArtifactPreviewCommand({
      cwd: tempRoot,
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      createDatabaseRuntime: async () => {
        databaseRuntimeCreated = true;
        throw new Error("createDatabaseRuntime should not be called");
      },
      command: {
        kind: "sourceArtifactPreview",
        persist: true,
        file: "source.md",
        chunkLines: 2,
        limitChunks: 1,
        extractCandidates: true,
        reviewedExtractionClaimCandidateId: "claim-candidate:1:the-current-model-supports",
        mechanism: "Operator selected a ready extraction candidate and supplied governance fields.",
        krnImplication: "Use reviewed extraction bridge before graph ranking work.",
        doesNotProve: "This does not prove extracted claim truth.",
        supportType: "implementation-boundary",
        trustTier: "source-code",
        consumer: "graph brain v0",
        falsifier: "Deferred extraction candidates can be persisted."
      }
    })).rejects.toThrow(
      "Cannot persist deferred extraction claim candidate: claim-candidate:1:the-current-model-supports"
    );

    expect(databaseRuntimeCreated).toBe(false);
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
