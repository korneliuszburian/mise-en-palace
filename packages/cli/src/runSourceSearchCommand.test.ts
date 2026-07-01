import {
  describe,
  expect,
  it
} from "vitest";

import type {
  SourceClaim,
  SourceClaimEdge,
  SourceDecisionEdge
} from "@krn/core";
import type {
  SearchDocumentSearchResult
} from "@krn/harness/repositories/internal";
import type {
  DatabaseRuntime
} from "./databaseRuntime.js";
import {
  classifySourceSearchAnswerUsefulness,
  buildSourceSearchQueryShapeDiagnostics,
  buildSourceSearchMissingEvidence,
  runSourceSearchCommand
} from "./runSourceSearchCommand.js";

const now = "2026-06-29T12:00:00.000Z";
const projectId = "7d9d103a-1a8e-4492-a4ca-db3a5589bd9b";
const sourceClaimId = "3363383c-02d0-4e5a-9674-132c1bc41b51" as SourceClaim["id"];
const relatedSourceClaimId = "931e7faa-a982-498f-a265-6a938800f707" as SourceClaim["id"];
const searchDocumentId = "6f045cc4-e8c9-4555-8425-167d74e5d319";

const sourceClaim = (overrides: Partial<SourceClaim> = {}): SourceClaim => ({
  id: sourceClaimId,
  sourceArtifactId: "f6db868a-4c82-406a-8371-9ab7d8594fc5" as SourceClaim["sourceArtifactId"],
  claim: "KRN should prove one bounded local ingest loop before building a crawler.",
  mechanism: "A local file can become SourceArtifact, SearchDocument, and SourceClaim.",
  krnImplication: "Product-facing knowledge search should grow from proven readback.",
  doesNotProve: "This does not prove product search quality.",
  trustTier: "project-decision",
  supportType: "implementation-boundary",
  consumer: "V341 Product-Facing Knowledge Search Readback Preview",
  falsifier: "The claim cannot be found by a later readback.",
  status: "proposed",
  metadata: {},
  createdAt: now,
  updatedAt: now,
  ...overrides
});

const searchDocument = (
  overrides: Partial<SearchDocumentSearchResult> = {}
): SearchDocumentSearchResult => ({
  id: searchDocumentId,
  projectId: projectId as SearchDocumentSearchResult["projectId"],
  subjectType: "source_artifact",
  subjectId: "f6db868a-4c82-406a-8371-9ab7d8594fc5",
  sourceArtifactId: "f6db868a-4c82-406a-8371-9ab7d8594fc5",
  sourceChunkId: "aeb76503-9798-47dd-b73a-07fb678b3a93",
  trustTier: "source-code",
  validityStatus: "active",
  language: "english",
  title: "Local source artifact: ARTIFACT.md",
  body: "krn-source-artifact-preview 991034dc0684e887",
  searchText: "krn-source-artifact-preview 991034dc0684e887",
  metadataFilters: {},
  validFrom: now,
  metadata: {},
  createdAt: now,
  updatedAt: now,
  lexicalScore: 100,
  ...overrides
});

const sourceClaimEdge = (
  overrides: Partial<SourceClaimEdge> = {}
): SourceClaimEdge => ({
  id: "415321b3-4a26-4634-bfbe-38b756777d6a" as SourceClaimEdge["id"],
  fromSourceClaimId: sourceClaimId,
  toSourceClaimId: relatedSourceClaimId,
  kind: "narrows",
  metadata: {
    consumer: "graph mini Brain-QA",
    doesNotProve: "This edge does not prove graph retrieval quality.",
    evidenceRef: "docs/decisions/ADR-0021-temporal-claim-graph.md",
    sourceRanges: ["docs/decisions/ADR-0021-temporal-claim-graph.md:112-119"]
  },
  createdAt: now,
  ...overrides
});

const sourceDecisionEdge = (
  overrides: Partial<SourceDecisionEdge> = {}
): SourceDecisionEdge => ({
  id: "73e266bb-e957-4a07-aa62-fe74cb7178a0" as SourceDecisionEdge["id"],
  sourceClaimId,
  targetType: "eval_candidate",
  targetId: "activation-utility-source-eval-follow-up-imr-38",
  supportType: "implementation-boundary",
  confidence: "medium",
  notes: "Accepted review retained as manual source/eval follow-up evidence.",
  metadata: {
    doesNotProve: "This edge does not prove eval promotion or source truth."
  },
  createdAt: now,
  ...overrides
});

interface SourceSearchRuntimeInput {
  claims?: readonly SourceClaim[];
  documents?: readonly SearchDocumentSearchResult[];
  linkedDocuments?: readonly SearchDocumentSearchResult[];
  edges?: readonly SourceClaimEdge[];
  decisionEdges?: readonly SourceDecisionEdge[];
  onSearchQuery?(query: string): void;
  onClose?(): void;
}

interface SourceSearchRuntimeFixtures {
  claims: readonly SourceClaim[];
  documents: readonly SearchDocumentSearchResult[];
  linkedDocuments: readonly SearchDocumentSearchResult[];
  edges: readonly SourceClaimEdge[];
  decisionEdges: readonly SourceDecisionEdge[];
  onSearchQuery?: (query: string) => void;
  onClose?: () => void;
}

const runtimeFixtures = (input: SourceSearchRuntimeInput = {}): SourceSearchRuntimeFixtures => {
  const documents = input.documents ?? [searchDocument()];

  return {
    claims: input.claims ?? [sourceClaim()],
    documents,
    linkedDocuments: input.linkedDocuments ?? documents,
    edges: input.edges ?? [],
    decisionEdges: input.decisionEdges ?? [],
    ...(input.onSearchQuery === undefined ? {} : { onSearchQuery: input.onSearchQuery }),
    ...(input.onClose === undefined ? {} : { onClose: input.onClose })
  };
};

const runtime = (input?: SourceSearchRuntimeInput): SourceSearchCommand["createDatabaseRuntime"] => {
  const fixtures = runtimeFixtures(input);

  return async () => ({
    workspaceId: "workspace-1",
    projectId,
    compilerDependencies: {
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      harnessRunRepository: {} as DatabaseRuntime["compilerDependencies"]["harnessRunRepository"],
      memoryRepository: {
        async listActiveMemory() {
          return [];
        },
        async listAntiMemoryForProject() {
          return [];
        }
      },
      sourceRepository: {
        async listClaimsForProject(_projectId, limit) {
          return fixtures.claims.slice(0, limit);
        },
        async listSourceClaimEdgesForClaim() {
          return [];
        }
      },
      retrievalRepository: {
        async searchLexical(searchInput) {
          fixtures.onSearchQuery?.(searchInput.query);

          return fixtures.documents;
        },
        async startRetrievalRun() {
          throw new Error("startRetrievalRun should not be called");
        },
        async completeRetrievalRun() {
          throw new Error("completeRetrievalRun should not be called");
        },
        async addCandidate() {
          throw new Error("addCandidate should not be called");
        },
        async recordActivationDecision() {
          throw new Error("recordActivationDecision should not be called");
        },
        async storeContextSelection() {
          throw new Error("storeContextSelection should not be called");
        }
      }
    },
    harnessRunRepository: {} as DatabaseRuntime["harnessRunRepository"],
    memoryRepository: {} as DatabaseRuntime["memoryRepository"],
    sourceRepository: {
      async createSourceArtifact() {
        throw new Error("createSourceArtifact should not be called");
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
      async listSourceClaimEdgesForClaim(sourceClaimIdForReadback) {
        return fixtures.edges.filter((edge) =>
          edge.fromSourceClaimId === sourceClaimIdForReadback ||
          edge.toSourceClaimId === sourceClaimIdForReadback
        );
      },
      async createSourceDecisionEdge() {
        throw new Error("createSourceDecisionEdge should not be called");
      },
      async getSourceDecisionEdgeById() {
        throw new Error("getSourceDecisionEdgeById should not be called");
      },
      async listSourceDecisionEdgesForClaim(sourceClaimIdForReadback) {
        return fixtures.decisionEdges.filter((edge) => edge.sourceClaimId === sourceClaimIdForReadback);
      },
      async createSourceRejection() {
        throw new Error("createSourceRejection should not be called");
      }
    },
    retrievalRepository: {
      async createSearchDocument() {
        throw new Error("createSearchDocument should not be called");
      },
      async searchLexical(searchInput) {
        fixtures.onSearchQuery?.(searchInput.query);

        return fixtures.documents;
      },
      async listSearchDocumentsForSourceLinks() {
        return fixtures.linkedDocuments;
      }
    },
    async close() {
      fixtures.onClose?.();
    }
  });
};

type SourceSearchCommand = Parameters<typeof runSourceSearchCommand>[0];

const parseJsonObject = (text: string): Record<string, unknown> => {
  const parsed: unknown = JSON.parse(text);

  expect(typeof parsed).toBe("object");
  expect(parsed).not.toBeNull();
  expect(Array.isArray(parsed)).toBe(false);

  return parsed as Record<string, unknown>;
};

const objectValue = (
  value: unknown,
  label: string
): Record<string, unknown> => {
  expect(typeof value, label).toBe("object");
  expect(value, label).not.toBeNull();
  expect(Array.isArray(value), label).toBe(false);

  return value as Record<string, unknown>;
};

const arrayValue = (
  value: unknown,
  label: string
): readonly unknown[] => {
  expect(Array.isArray(value), label).toBe(true);

  return value as readonly unknown[];
};

describe("runSourceSearchCommand", () => {
  it("builds missing evidence from visible answer package support", () => {
    expect(buildSourceSearchMissingEvidence({
      supportingClaimCount: 1,
      supportingDocumentCount: 1
    })).toEqual([]);
    expect(buildSourceSearchMissingEvidence({
      supportingClaimCount: 1,
      supportingDocumentCount: 0
    })).toEqual([
      "included SearchDocument evidence for this combined query; topic-specific SearchDocuments may still exist"
    ]);
    expect(buildSourceSearchMissingEvidence({
      supportingClaimCount: 0,
      supportingDocumentCount: 1
    })).toEqual([
      "governed SourceClaim evidence in the answer package for this query"
    ]);
    expect(buildSourceSearchMissingEvidence({
      supportingClaimCount: 0,
      supportingDocumentCount: 0
    })).toEqual([
      "governed SourceClaim evidence in the answer package for this query",
      "included SearchDocument evidence in the answer package for this query"
    ]);
  });

  it("classifies answer usefulness from visible answer package support", () => {
    expect(classifySourceSearchAnswerUsefulness({
      supportingClaimCount: 1,
      supportingDocumentCount: 1
    })).toEqual({
      answerUsefulness: "useful",
      reasons: [
        "Answer package includes governed SourceClaim evidence.",
        "Answer package includes SearchDocument retrieval evidence."
      ]
    });
    expect(classifySourceSearchAnswerUsefulness({
      supportingClaimCount: 1,
      supportingDocumentCount: 0
    }).answerUsefulness).toBe("partly_useful_missing_document");
    expect(classifySourceSearchAnswerUsefulness({
      supportingClaimCount: 0,
      supportingDocumentCount: 1
    }).answerUsefulness).toBe("partly_useful_missing_claim");
    expect(classifySourceSearchAnswerUsefulness({
      supportingClaimCount: 0,
      supportingDocumentCount: 0
    })).toEqual({
      answerUsefulness: "not_useful",
      reasons: [
        "Answer package has no governed SourceClaim evidence.",
        "Answer package has no included SearchDocument evidence."
      ]
    });
  });

  it("builds query-shape diagnostics without changing retrieval semantics", () => {
    expect(buildSourceSearchQueryShapeDiagnostics({
      supportingClaimCount: 1,
      supportingDocumentCount: 0,
      searchResultCount: 0
    })).toEqual([
      "likely over-constrained query shape: SourceClaims matched, but lexical SearchDocument retrieval returned zero results; try a narrower topic-specific query before changing ranking or coverage."
    ]);
    expect(buildSourceSearchQueryShapeDiagnostics({
      supportingClaimCount: 1,
      supportingDocumentCount: 0,
      searchResultCount: 2
    })).toEqual([]);
    expect(buildSourceSearchQueryShapeDiagnostics({
      supportingClaimCount: 1,
      supportingDocumentCount: 1,
      searchResultCount: 1
    })).toEqual([]);
  });

  it("renders read-only source and search candidates with proof boundaries", async () => {
    let closeCount = 0;
    let searchQuery: string | undefined;
    const result = await runSourceSearchCommand({
      cwd: "/repo",
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      command: {
        kind: "sourceSearch",
        query: "krn-source-artifact-preview 991034dc0684e887",
        limit: 10,
        maxInclusions: 2
      },
      createDatabaseRuntime: runtime({
        onSearchQuery(query) {
          searchQuery = query;
        },
        onClose() {
          closeCount += 1;
        }
      })
    });

    expect(result.stdout).toContain("KRN Source Knowledge Search");
    expect(result.stdout).toContain("Persistence: read-only (Postgres)");
    expect(result.stdout).toContain("DB writes: none");
    expect(result.stdout).toContain("Mutation: none");
    expect(result.stdout).toContain("Answer package preview:");
    expect(result.stdout).toContain("answer: Source search found 1 supporting SourceClaim(s) and 1 supporting SearchDocument(s)");
    expect(result.stdout).toContain("answer usefulness: useful");
    expect(result.stdout).toContain("- Answer package includes governed SourceClaim evidence.");
    expect(result.stdout).toContain("- Answer package includes SearchDocument retrieval evidence.");
    expect(result.stdout).toContain("query shape diagnostics:");
    expect(result.stdout).toContain("- none detected by current diagnostics");
    expect(result.stdout).toContain("supporting claims:");
    expect(result.stdout).toContain(`- source_claim:${sourceClaimId}`);
    expect(result.stdout).toContain("supporting documents:");
    expect(result.stdout).toContain(`- search_document:${searchDocumentId}`);
    expect(result.stdout).toContain("source claim document links:");
    expect(result.stdout).toContain(
      `- source_claim:${sourceClaimId} linkedSearchDocumentCount:1 linkedSearchDocumentIds:${searchDocumentId} linkKinds:source_artifact`
    );
    expect(result.stdout).toContain("relation support:");
    expect(result.stdout).toContain("- none");
    expect(result.stdout).toContain("missing evidence:");
    expect(result.stdout).toContain("- none detected by current diagnostics");
    expect(result.stdout).toContain("recommended next action: Use the supporting claims/documents as a Pattern Application Gate");
    expect(result.stdout).toContain(`source_claim:${sourceClaimId}`);
    expect(result.stdout).toContain(`search_document:${searchDocumentId}`);
    expect(result.stdout).toContain("Included candidates:");
    expect(result.stdout).toContain("Excluded candidates:");
    expect(result.stdout).toContain("reviewability: ready");
    expect(result.stdout).toContain("SourceClaim has mechanism.");
    expect(result.stdout).toContain("SourceClaim has doesNotProve boundary.");
    expect(result.stdout).toContain("SearchDocument row matched the query.");
    expect(result.stdout).toContain("doesNotProve: This does not prove product search quality.");
    expect(result.stdout).toContain("doesNotProve: source truth, ranking quality");
    expect(result.stdout).toContain("Crawler: none");
    expect(result.stdout).toContain("Embeddings: not run");
    expect(result.stdout).toContain("Graph runtime: not run");
    expect(closeCount).toBe(1);
    expect(searchQuery).toBe("krn-source-artifact-preview 991034dc0684e887");
    expect(searchQuery).not.toContain("crawler");
  });

  it("renders typed JSON answer package readback without hiding raw candidates", async () => {
    const result = await runSourceSearchCommand({
      cwd: "/repo",
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      command: {
        kind: "sourceSearch",
        query: "krn-source-artifact-preview 991034dc0684e887",
        limit: 10,
        maxInclusions: 2,
        json: true
      },
      createDatabaseRuntime: runtime()
    });

    const output = parseJsonObject(result.stdout);

    expect(output.kind).toBe("source_search_answer_package");
    expect(output.query).toBe("krn-source-artifact-preview 991034dc0684e887");
    expect(output.persistence).toBe("read_only_postgres");
    expect(output.dbWrites).toBe("none");
    expect(output.mutation).toBe("none");

    const answerPackage = objectValue(output.answerPackage, "answerPackage");

    expect(answerPackage.answer).toContain("1 supporting SourceClaim(s) and 1 supporting SearchDocument(s)");
    expect(answerPackage.answerUsefulness).toBe("useful");
    expect(arrayValue(answerPackage.answerUsefulnessReasons, "answerUsefulnessReasons")).toEqual([
      "Answer package includes governed SourceClaim evidence.",
      "Answer package includes SearchDocument retrieval evidence.",
      "Answer package found 1 artifact-linked SearchDocument reference(s) for supporting SourceClaims."
    ]);
    expect(arrayValue(answerPackage.queryShapeDiagnostics, "queryShapeDiagnostics")).toEqual([]);
    expect(answerPackage.recommendedNextAction).toContain("Use the supporting claims/documents as a Pattern Application Gate");
    expect(arrayValue(answerPackage.missingEvidence, "missingEvidence")).toEqual([]);
    expect(arrayValue(answerPackage.doesNotProve, "doesNotProve")).toContain(
      "source truth, answer correctness, ranking quality, product readiness, or Memory Core mutation"
    );

    const supportingClaims = arrayValue(answerPackage.supportingClaims, "supportingClaims");
    const supportingDocuments = arrayValue(answerPackage.supportingDocuments, "supportingDocuments");
    const sourceClaimDocumentLinks = arrayValue(answerPackage.sourceClaimDocumentLinks, "sourceClaimDocumentLinks");
    const firstClaim = objectValue(supportingClaims[0], "first supporting claim");
    const firstDocument = objectValue(supportingDocuments[0], "first supporting document");
    const firstDocumentLink = objectValue(sourceClaimDocumentLinks[0], "first source claim document link");

    expect(firstClaim.label).toBe(`source_claim:${sourceClaimId}`);
    expect(firstClaim.status).toBe("included");
    expect(firstClaim.reviewability).toBe("ready");
    expect(arrayValue(firstClaim.reviewabilityReasons, "claim reviewability reasons")).toContain("SourceClaim has mechanism.");
    expect(firstClaim.claim).toBe("KRN should prove one bounded local ingest loop before building a crawler.");
    expect(firstClaim.mechanism).toBe("A local file can become SourceArtifact, SearchDocument, and SourceClaim.");
    expect(firstClaim.krnImplication).toBe("Product-facing knowledge search should grow from proven readback.");
    expect(firstClaim.consumer).toBe("V341 Product-Facing Knowledge Search Readback Preview");
    expect(firstClaim.falsifier).toBe("The claim cannot be found by a later readback.");
    expect(firstClaim.doesNotProve).toBe("This does not prove product search quality.");
    expect(firstClaim.sourceArtifactId).toBe("f6db868a-4c82-406a-8371-9ab7d8594fc5");
    expect(firstDocument.label).toBe(`search_document:${searchDocumentId}`);
    expect(firstDocument.reviewability).toBe("ready");
    expect(firstDocumentLink.sourceClaimId).toBe(sourceClaimId);
    expect(firstDocumentLink.linkedSearchDocumentCount).toBe(1);
    expect(arrayValue(firstDocumentLink.linkedSearchDocumentIds, "linked ids")).toEqual([
      searchDocumentId
    ]);
    expect(arrayValue(firstDocumentLink.linkKinds, "link kinds")).toEqual(["source_artifact"]);

    const includedCandidates = arrayValue(output.includedCandidates, "includedCandidates");
    const excludedCandidates = arrayValue(output.excludedCandidates, "excludedCandidates");
    const noMatchGuidance = arrayValue(output.noMatchGuidance, "noMatchGuidance");
    const proof = objectValue(output.proof, "proof");
    const runtimeOutput = objectValue(output.runtime, "runtime");

    expect(includedCandidates).toHaveLength(2);
    expect(excludedCandidates).toHaveLength(0);
    expect(noMatchGuidance).toContain("if an expected SearchDocument is excluded, inspect score and budget before changing ranking");
    expect(arrayValue(proof.proves, "proof.proves")).toContain(
      "readback shows inclusion/exclusion, scores, reviewability, and proof boundaries"
    );
    expect(arrayValue(proof.doesNotProve, "proof.doesNotProve")).toContain("product readiness");
    expect(runtimeOutput.memoryMutation).toBe("none");
    expect(runtimeOutput.crawler).toBe("none");
    expect(runtimeOutput.embeddings).toBe("not_run");
    expect(runtimeOutput.graphRuntime).toBe("not_run");
  });

  it("includes read-only SourceClaimEdge relation support in JSON answer packages", async () => {
    const result = await runSourceSearchCommand({
      cwd: "/repo",
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      command: {
        kind: "sourceSearch",
        query: "temporal claim graph",
        limit: 10,
        maxInclusions: 2,
        json: true
      },
      createDatabaseRuntime: runtime({
        edges: [sourceClaimEdge()]
      })
    });

    const output = parseJsonObject(result.stdout);
    const answerPackage = objectValue(output.answerPackage, "answerPackage");
    const relationSupport = arrayValue(answerPackage.relationSupport, "relationSupport");
    const relation = objectValue(relationSupport[0], "first relation support");

    expect(arrayValue(answerPackage.answerUsefulnessReasons, "answerUsefulnessReasons")).toContain(
      "Answer package includes SourceClaimEdge relation support."
    );
    expect(relationSupport).toHaveLength(1);
    expect(relation.sourceClaimId).toBe(sourceClaimId);
    expect(relation.edgeId).toBe("415321b3-4a26-4634-bfbe-38b756777d6a");
    expect(relation.direction).toBe("outgoing");
    expect(relation.relatedSourceClaimId).toBe(relatedSourceClaimId);
    expect(relation.kind).toBe("narrows");
    expect(relation.consumer).toBe("graph mini Brain-QA");
    expect(relation.doesNotProve).toBe("This edge does not prove graph retrieval quality.");
    expect(relation.evidenceRef).toBe("docs/decisions/ADR-0021-temporal-claim-graph.md");
    expect(arrayValue(relation.sourceRanges, "relation sourceRanges")).toEqual([
      "docs/decisions/ADR-0021-temporal-claim-graph.md:112-119"
    ]);

    const graphReadback = objectValue(answerPackage.graphReadback, "graphReadback");
    const relationKinds = arrayValue(graphReadback.relationKinds, "relationKinds");
    const firstRelationKind = objectValue(relationKinds[0], "first relation kind");

    expect(graphReadback.claimNodes).toBe(1);
    expect(graphReadback.relationEdges).toBe(1);
    expect(firstRelationKind.kind).toBe("narrows");
    expect(firstRelationKind.count).toBe(1);
    expect(graphReadback.graphAware).toBe(true);
    expect(arrayValue(graphReadback.caveats, "graph caveats")).toContain(
      "entity extraction is not available in this bounded readback"
    );
  });

  it("scans enough source claims before ranking bounded source-search output", async () => {
    const exactClaim = sourceClaim({
      id: "190f1f72-4621-49b4-b93c-538ea2c581ef" as SourceClaim["id"],
      claim: "IMR-37 heartbeat-routed activation utility candidate is accepted for manual source eval follow-up only.",
      mechanism: "Accepted heartbeat review can be retained as SourceArtifact, SourceClaim, and SourceDecisionEdge follow-up evidence.",
      krnImplication: "Natural source search should surface the retained follow-up evidence before opening new acquisition work.",
      consumer: "IMR-40 natural source recall repair",
      falsifier: "A small-limit natural source search cannot include this exact retained claim."
    });
    const fillerClaims = Array.from({ length: 6 }, (_, index) =>
      sourceClaim({
        id: `00000000-0000-4000-8000-00000000000${index}` as SourceClaim["id"],
        claim: `Unrelated filler claim ${index}`,
        mechanism: "Filler claim should not outrank the exact retained source evidence.",
        krnImplication: "This exists only to prove source claim scan depth.",
        consumer: "IMR-40 source recall regression",
        falsifier: "Filler is selected over exact retained evidence."
      })
    );
    const result = await runSourceSearchCommand({
      cwd: "/repo",
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      command: {
        kind: "sourceSearch",
        query: "IMR-37 heartbeat-routed activation utility candidate accepted manual source eval follow-up",
        limit: 2,
        maxInclusions: 2,
        json: true
      },
      createDatabaseRuntime: runtime({
        claims: [...fillerClaims, exactClaim],
        documents: []
      })
    });
    const output = parseJsonObject(result.stdout);
    const answerPackage = objectValue(output.answerPackage, "answerPackage");
    const supportingClaims = arrayValue(answerPackage.supportingClaims, "supportingClaims");
    const firstClaim = objectValue(supportingClaims[0], "first supporting claim");

    expect(firstClaim.sourceClaimId).toBe("190f1f72-4621-49b4-b93c-538ea2c581ef");
    expect(firstClaim.claim).toBe(
      "IMR-37 heartbeat-routed activation utility candidate is accepted for manual source eval follow-up only."
    );
  });

  it("includes read-only SourceDecisionEdge support for supporting source claims", async () => {
    const result = await runSourceSearchCommand({
      cwd: "/repo",
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      command: {
        kind: "sourceSearch",
        query: "activation utility follow-up",
        limit: 10,
        maxInclusions: 2,
        json: true
      },
      createDatabaseRuntime: runtime({
        decisionEdges: [sourceDecisionEdge()]
      })
    });
    const output = parseJsonObject(result.stdout);
    const answerPackage = objectValue(output.answerPackage, "answerPackage");
    const sourceDecisionSupport = arrayValue(
      answerPackage.sourceDecisionSupport,
      "sourceDecisionSupport"
    );
    const decisionSupport = objectValue(sourceDecisionSupport[0], "first source decision support");

    expect(arrayValue(answerPackage.answerUsefulnessReasons, "answerUsefulnessReasons")).toContain(
      "Answer package includes SourceDecisionEdge decision support."
    );
    expect(sourceDecisionSupport).toHaveLength(1);
    expect(decisionSupport.sourceClaimId).toBe(sourceClaimId);
    expect(decisionSupport.sourceDecisionEdgeId).toBe("73e266bb-e957-4a07-aa62-fe74cb7178a0");
    expect(decisionSupport.targetType).toBe("eval_candidate");
    expect(decisionSupport.targetId).toBe("activation-utility-source-eval-follow-up-imr-38");
    expect(decisionSupport.supportType).toBe("implementation-boundary");
    expect(decisionSupport.confidence).toBe("medium");
    expect(decisionSupport.notes).toBe("Accepted review retained as manual source/eval follow-up evidence.");
    expect(decisionSupport.doesNotProve).toBe("This edge does not prove eval promotion or source truth.");
  });

  it("summarizes temporal, contradiction, duplicate, and invalidation relation edges", async () => {
    const result = await runSourceSearchCommand({
      cwd: "/repo",
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      command: {
        kind: "sourceSearch",
        query: "temporal contradiction duplicate graph",
        json: true
      },
      createDatabaseRuntime: runtime({
        edges: [
          sourceClaimEdge({
            kind: "contradicts",
            metadata: {
              consumer: "graph brain v1",
              doesNotProve: "This edge does not prove contradiction truth."
            }
          }),
          sourceClaimEdge({
            id: "515321b3-4a26-4634-bfbe-38b756777d6a" as SourceClaimEdge["id"],
            kind: "duplicates",
            metadata: {
              consumer: "graph brain v1",
              doesNotProve: "This edge does not prove duplicate truth."
            }
          }),
          sourceClaimEdge({
            id: "615321b3-4a26-4634-bfbe-38b756777d6a" as SourceClaimEdge["id"],
            kind: "invalidates",
            metadata: {
              consumer: "graph brain v1",
              doesNotProve: "This edge does not prove invalidation truth.",
              validFrom: "2026-06-01T00:00:00.000Z",
              invalidatedAt: "2026-06-30T00:00:00.000Z"
            }
          })
        ]
      })
    });
    const output = parseJsonObject(result.stdout);
    const answerPackage = objectValue(output.answerPackage, "answerPackage");
    const graphReadback = objectValue(answerPackage.graphReadback, "graphReadback");

    expect(graphReadback.relationEdges).toBe(3);
    expect(graphReadback.temporalEdges).toBe(1);
    expect(graphReadback.contradictionEdges).toBe(1);
    expect(graphReadback.duplicateEdges).toBe(1);
    expect(graphReadback.invalidationEdges).toBe(1);
  });

  it("prints no-match guidance without mutating when no candidates match", async () => {
    const result = await runSourceSearchCommand({
      cwd: "/repo",
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      command: {
        kind: "sourceSearch",
        query: "missing marker"
      },
      createDatabaseRuntime: runtime({
        claims: [],
        documents: []
      })
    });

    expect(result.stdout).toContain("Included candidates:");
    expect(result.stdout).toContain("- none");
    expect(result.stdout).toContain("Answer package preview:");
    expect(result.stdout).toContain("answer: Source search found 0 supporting SourceClaim(s) and 0 supporting SearchDocument(s)");
    expect(result.stdout).toContain("answer usefulness: not_useful");
    expect(result.stdout).toContain("- governed SourceClaim evidence in the answer package for this query");
    expect(result.stdout).toContain("- included SearchDocument evidence in the answer package for this query");
    expect(result.stdout).toContain("recommended next action: Narrow the query or ingest a bounded local artifact");
    expect(result.stdout).toContain("No-match guidance:");
    expect(result.stdout).toContain("try a narrower marker/hash query");
    expect(result.stdout).toContain("Memory mutation: none");
  });

  it("guides broad queries toward narrower searches when claims exist without documents", async () => {
    const result = await runSourceSearchCommand({
      cwd: "/repo",
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      command: {
        kind: "sourceSearch",
        query: "heartbeat consensus candidate layer"
      },
      createDatabaseRuntime: runtime({
        claims: [sourceClaim()],
        documents: []
      })
    });

    expect(result.stdout).toContain("answer: Source search found 1 supporting SourceClaim(s) and 0 supporting SearchDocument(s)");
    expect(result.stdout).toContain("answer usefulness: partly_useful_missing_document");
    expect(result.stdout).toContain("query shape diagnostics:");
    expect(result.stdout).toContain(
      "- likely over-constrained query shape: SourceClaims matched, but lexical SearchDocument retrieval returned zero results; try a narrower topic-specific query before changing ranking or coverage."
    );
    expect(result.stdout).toContain(
      "- included SearchDocument evidence for this combined query; topic-specific SearchDocuments may still exist"
    );
    expect(result.stdout).toContain(
      "recommended next action: Use the supporting claims cautiously and split broad queries into narrower topic-specific source searches before changing retrieval."
    );
  });

  it("renders query-shape diagnostics in JSON when claims match but document search returns nothing", async () => {
    const result = await runSourceSearchCommand({
      cwd: "/repo",
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      command: {
        kind: "sourceSearch",
        query: "graph sourceclaimedge relation grounded qa temporal source relations",
        json: true
      },
      createDatabaseRuntime: runtime({
        claims: [sourceClaim()],
        documents: []
      })
    });

    const output = parseJsonObject(result.stdout);
    const answerPackage = objectValue(output.answerPackage, "answerPackage");

    expect(answerPackage.answerUsefulness).toBe("partly_useful_missing_document");
    expect(arrayValue(answerPackage.queryShapeDiagnostics, "queryShapeDiagnostics")).toEqual([
      "likely over-constrained query shape: SourceClaims matched, but lexical SearchDocument retrieval returned zero results; try a narrower topic-specific query before changing ranking or coverage."
    ]);
    expect(arrayValue(answerPackage.missingEvidence, "missingEvidence")).toContain(
      "included SearchDocument evidence for this combined query; topic-specific SearchDocuments may still exist"
    );
  });

  it("exposes artifact-linked document evidence when claim text matches but lexical documents are absent", async () => {
    const result = await runSourceSearchCommand({
      cwd: "/repo",
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      command: {
        kind: "sourceSearch",
        query: "Local artifact preview can carry governed source claims",
        json: true
      },
      createDatabaseRuntime: runtime({
        claims: [sourceClaim()],
        documents: [],
        linkedDocuments: [searchDocument()]
      })
    });

    const output = parseJsonObject(result.stdout);
    const answerPackage = objectValue(output.answerPackage, "answerPackage");
    const supportingDocuments = arrayValue(answerPackage.supportingDocuments, "supportingDocuments");
    const sourceClaimDocumentLinks = arrayValue(answerPackage.sourceClaimDocumentLinks, "sourceClaimDocumentLinks");
    const firstDocumentLink = objectValue(sourceClaimDocumentLinks[0], "first source claim document link");

    expect(answerPackage.answerUsefulness).toBe("partly_useful_missing_document");
    expect(supportingDocuments).toHaveLength(0);
    expect(arrayValue(answerPackage.answerUsefulnessReasons, "answerUsefulnessReasons")).toContain(
      "Answer package found 1 artifact-linked SearchDocument reference(s) for supporting SourceClaims."
    );
    expect(arrayValue(answerPackage.missingEvidence, "missingEvidence")).toContain(
      "included SearchDocument evidence for this combined query; artifact-linked SearchDocuments are visible but were not included by lexical retrieval"
    );
    expect(firstDocumentLink.sourceClaimId).toBe(sourceClaimId);
    expect(firstDocumentLink.sourceArtifactId).toBe("f6db868a-4c82-406a-8371-9ab7d8594fc5");
    expect(firstDocumentLink.linkedSearchDocumentCount).toBe(1);
    expect(arrayValue(firstDocumentLink.linkedSearchDocumentIds, "linked ids")).toEqual([
      searchDocumentId
    ]);
    expect(arrayValue(firstDocumentLink.linkKinds, "link kinds")).toEqual(["source_artifact"]);
  });
});
