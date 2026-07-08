import {
  describe,
  expect,
  it
} from "vitest";

import type {
  SourceClaim,
  SourceClaimEdge,
  SourceDecisionEdge,
  SourceRejection
} from "@krn/core";
import type {
  RankedActivationCandidate
} from "@krn/harness";
import type {
  SearchDocumentSearchResult
} from "@krn/core/repositories/internal";
import type {
  DatabaseRuntime,
  DatabaseRuntimeInput
} from "../database-runtime.js";
import {
  classifySourceSearchAnswerUsefulness,
  buildSourceSearchQueryShapeDiagnostics,
  buildSourceSearchMissingEvidence,
  runSourceSearchCommand
} from "../run-source-search-command.js";
import type {
  CreateSourceSearchDatabaseRuntime
} from "../run-source-search-command.js";
import {
  buildSourceSearchAnswerPackage
} from "../source-search-answer-package.js";

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
  sourceAuthority: "project-decision",
  supportType: "implementation-boundary",
  consumer: "V341 Product-Facing Knowledge Search Readback Preview",
  falsifier: "The claim cannot be found by a later readback.",
  status: "accepted",
  metadata: {},
  createdAt: now,
  updatedAt: now,
  ...overrides
});

const searchDocument = (): SearchDocumentSearchResult => ({
  id: searchDocumentId,
  projectId,
  subjectType: "source_artifact",
  subjectId: "f6db868a-4c82-406a-8371-9ab7d8594fc5",
  sourceArtifactId: "f6db868a-4c82-406a-8371-9ab7d8594fc5",
  sourceChunkId: "aeb76503-9798-47dd-b73a-07fb678b3a93",
  sourceAuthority: "source-code",
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
  lexicalScore: 100
});

const includedSearchCandidate = (
  overrides: Partial<RankedActivationCandidate> = {}
): RankedActivationCandidate => ({
  id: "candidate-owner-file",
  kind: "search",
  subjectType: "search_document",
  subjectId: "owner-file:packages/harness/src/activation/activation-engine.ts",
  text: "Owner-file recall for activation-engine.ts",
  sourceAuthority: "project-decision",
  reason: "Owner-file recall: packages/harness/src/activation/activation-engine.ts",
  expectedUse: "Inspect activation-engine.ts when the task touches activation retrieval.",
  tokenEstimate: 20,
  metadata: {},
  lexicalScore: 60,
  vectorScore: 0,
  graphScore: 0,
  temporalScore: 0,
  contextRoiScore: 0,
  feedbackScore: 0,
  totalScore: 90,
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
    evidenceRef: "KRN_ROADMAP.md",
    sourceDecisionRef: "source-decision:temporal-claim-graph",
    sourceRanges: [
      "KRN_ROADMAP.md:112-119",
      "",
      "  ",
      123
    ],
    validFrom: "2026-06-01T00:00:00.000Z",
    validUntil: "2026-12-31T00:00:00.000Z"
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

const sourceRejection = (
  overrides: Partial<SourceRejection> = {}
): SourceRejection => ({
  id: "9e57ce15-37c5-4638-8f6f-d4c43685d402" as SourceRejection["id"],
  sourceClaimId,
  title: "Reject stale source claim",
  attemptedClaim: "Rejected claim should not govern source search.",
  rejectedBecause: "conflicting",
  reason: "Conflicts with current source decision support.",
  doesNotProve: "This rejection does not prove all future claims are invalid.",
  consumer: "source search consensus readback",
  metadata: {},
  rejectedAt: now,
  ...overrides
});

interface SourceSearchRuntimeInput {
  claims?: readonly SourceClaim[];
  documents?: readonly SearchDocumentSearchResult[];
  linkedDocuments?: readonly SearchDocumentSearchResult[];
  edges?: readonly SourceClaimEdge[];
  decisionEdges?: readonly SourceDecisionEdge[];
  rejections?: readonly SourceRejection[];
  onRuntimeInput?(input: DatabaseRuntimeInput): void;
  onSearchQuery?(query: string): void;
  onClose?(): void;
}

interface SourceSearchRuntimeFixtures {
  claims: readonly SourceClaim[];
  documents: SearchDocumentSearchResult[];
  linkedDocuments: SearchDocumentSearchResult[];
  edges: readonly SourceClaimEdge[];
  decisionEdges: readonly SourceDecisionEdge[];
  rejections: readonly SourceRejection[];
  onRuntimeInput(input: DatabaseRuntimeInput): void;
  onSearchQuery(query: string): void;
  onClose(): void;
}

const ignoreRuntimeInput = (_input: DatabaseRuntimeInput): void => {};

const ignoreSearchQuery = (_query: string): void => {};

const ignoreClose = (): void => {};

const fixtureDocuments = (
  input: SourceSearchRuntimeInput
): SearchDocumentSearchResult[] => [...(input.documents ?? [searchDocument()])];

const fixtureLinkedDocuments = (
  input: SourceSearchRuntimeInput,
  documents: readonly SearchDocumentSearchResult[]
): SearchDocumentSearchResult[] => [...(input.linkedDocuments ?? documents)];

const fixtureClaims = (input: SourceSearchRuntimeInput): readonly SourceClaim[] =>
  input.claims ?? [sourceClaim()];

const fixtureEdges = (input: SourceSearchRuntimeInput): readonly SourceClaimEdge[] =>
  input.edges ?? [];

const fixtureDecisionEdges = (input: SourceSearchRuntimeInput): readonly SourceDecisionEdge[] =>
  input.decisionEdges ?? [];

const fixtureRejections = (input: SourceSearchRuntimeInput): readonly SourceRejection[] =>
  input.rejections ?? [];

const runtimeFixtures = (input: SourceSearchRuntimeInput = {}): SourceSearchRuntimeFixtures => {
  const documents = fixtureDocuments(input);

  return {
    claims: fixtureClaims(input),
    documents,
    linkedDocuments: fixtureLinkedDocuments(input, documents),
    edges: fixtureEdges(input),
    decisionEdges: fixtureDecisionEdges(input),
    rejections: fixtureRejections(input),
    onRuntimeInput: input.onRuntimeInput ?? ignoreRuntimeInput,
    onSearchQuery: input.onSearchQuery ?? ignoreSearchQuery,
    onClose: input.onClose ?? ignoreClose
  };
};

const runtime = (input?: SourceSearchRuntimeInput): CreateSourceSearchDatabaseRuntime => {
  const fixtures = runtimeFixtures(input);

  return async (runtimeInput) => {
    fixtures.onRuntimeInput(runtimeInput);

    return {
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
          async listSourceClaimEdgesForClaim(sourceClaimIdForReadback) {
            return fixtures.edges.filter((edge) =>
              edge.fromSourceClaimId === sourceClaimIdForReadback ||
              edge.toSourceClaimId === sourceClaimIdForReadback
            );
          },
          async listSourceDecisionEdgesForClaim(sourceClaimIdForReadback) {
            return fixtures.decisionEdges.filter((edge) => edge.sourceClaimId === sourceClaimIdForReadback);
          }
        },
        retrievalRepository: {
          async searchLexical(searchInput) {
            fixtures.onSearchQuery(searchInput.query);

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
        async listClaimsForProject() {
          throw new Error("listClaimsForProject should not be called");
        },
        async getSourceClaimById(sourceClaimIdForReadback) {
          return fixtures.claims.find((claim) => claim.id === sourceClaimIdForReadback);
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
        },
        async listSourceRejectionsForClaim(sourceClaimIdForReadback) {
          return fixtures.rejections.filter((rejection) =>
            rejection.sourceClaimId === sourceClaimIdForReadback
          );
        }
      },
      retrievalRepository: {
        async createSearchDocument() {
          throw new Error("createSearchDocument should not be called");
        },
        async searchLexical(searchInput) {
            fixtures.onSearchQuery(searchInput.query);

          return fixtures.documents;
        },
        async listSearchDocumentsForSourceLinks() {
          return fixtures.linkedDocuments;
        }
      },
      async close() {
        fixtures.onClose();
      }
    };
  };
};

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
  it("passes explicit source search project to the database runtime resolver", async () => {
    let runtimeInput: DatabaseRuntimeInput | undefined;
    const result = await runSourceSearchCommand({
      cwd: "/repo",
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      command: {
        kind: "sourceSearch",
        query: "bounded ingest loop",
        projectId: "project-explicit",
        limit: 5,
        maxInclusions: 2,
        json: true
      },
      createDatabaseRuntime: runtime({
        onRuntimeInput(input) {
          runtimeInput = input;
        }
      })
    });

    expect(result.stdout).toContain("\"kind\": \"source_search_answer_package\"");
    expect(runtimeInput?.projectId).toBe("project-explicit");
    expect(runtimeInput?.requireProjectKernelForExplicitProject).toBe(false);
  });

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
      "SourceClaim evidence in the answer package for this query"
    ]);
    expect(buildSourceSearchMissingEvidence({
      supportingClaimCount: 0,
      supportingDocumentCount: 0
    })).toEqual([
      "SourceClaim evidence in the answer package for this query",
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
        "Answer package includes accepted SourceClaim evidence without decision-linked authority.",
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
        "Answer package has no SourceClaim evidence.",
        "Answer package has no included SearchDocument evidence."
      ]
    });
  });

  it("does not count search candidates without SearchDocument id as supporting documents", () => {
    const answerPackage = buildSourceSearchAnswerPackage({
      query: "worker embedding model scope source chunk memory record",
      included: [includedSearchCandidate()],
      diagnostics: {
        projectScoped: true,
        inputStatus: "candidates_available",
        memoryRecordCount: 0,
        sourceClaimCount: 0,
        searchResultCount: 0,
        ownerFileCandidateCount: 1,
        antiMemoryRecordCount: 0,
        mergedCandidateCount: 1,
        targetReadModelStatus: "provided",
        sourceSeedCount: 0,
        targetOwnerFileCount: 1,
        trustExclusionCount: 0,
        doesNotProve:
          "Activation diagnostics do not prove selected context is sufficient."
      },
      relationSupport: [],
      sourceDecisionSupport: [],
      sourceClaimDocumentLinks: []
    });

    expect(answerPackage.supportingDocuments).toEqual([]);
    expect(answerPackage.neutralOrNoise).toHaveLength(1);
    expect(answerPackage.answerUsefulness).toBe("not_useful");
    expect(answerPackage.answerUsefulnessReasons).toEqual([
      "Answer package has no SourceClaim evidence.",
      "Answer package has no included SearchDocument evidence."
    ]);
    expect(answerPackage.missingEvidence).toEqual([
      "SourceClaim evidence in the answer package for this query",
      "included SearchDocument evidence in the answer package for this query"
    ]);
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
    expect(result.stdout).toContain("- Answer package includes accepted SourceClaim evidence without decision-linked authority.");
    expect(result.stdout).toContain("- Answer package includes SearchDocument retrieval evidence.");
    expect(result.stdout).toContain("query shape diagnostics:");
    expect(result.stdout).toContain("- none detected by current diagnostics");
    expect(result.stdout).toContain("supporting claims:");
    expect(result.stdout).toContain(`- source_claim:${sourceClaimId}`);
    expect(result.stdout).toContain("sourceDecisionSupport:missing");
    expect(result.stdout).toContain(
      `caveat:Accepted SourceClaim ${sourceClaimId} has no SourceDecisionEdge support in this readback`
    );
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
      "Answer package includes accepted SourceClaim evidence without decision-linked authority.",
      "Answer package includes SearchDocument retrieval evidence.",
      "Answer package found 1 artifact-linked SearchDocument reference(s) for supporting SourceClaims.",
      "Answer package includes accepted SourceClaim evidence without SourceDecisionEdge readback."
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
    expect(firstClaim.sourceDecisionSupportState).toBe("missing");
    expect(firstClaim.sourceDecisionSupportCaveat).toBe(
      `Accepted SourceClaim ${sourceClaimId} has no SourceDecisionEdge support in this readback; treat it as accepted claim evidence, not decision-linked authority.`
    );
    expect(arrayValue(answerPackage.answerUsefulnessReasons, "answerUsefulnessReasons")).toContain(
      "Answer package includes accepted SourceClaim evidence without SourceDecisionEdge readback."
    );
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

  it("excludes non-accepted source claims from source-search authority", async () => {
    const proposedSourceClaimId = "d05913a9-4ac2-4564-aa59-1194fbac4561" as SourceClaim["id"];
    const rejectedSourceClaimId = "d7e0d503-3d55-4c72-80f8-0a6089cdb3af" as SourceClaim["id"];
    const deprecatedSourceClaimId = "f9bf59fc-9815-4f14-abbd-b527464fa6ac" as SourceClaim["id"];
    const result = await runSourceSearchCommand({
      cwd: "/repo",
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      command: {
        kind: "sourceSearch",
        query: "bounded local ingest loop crawler authority",
        limit: 10,
        maxInclusions: 5,
        json: true
      },
      createDatabaseRuntime: runtime({
        claims: [
          sourceClaim(),
          sourceClaim({
            id: proposedSourceClaimId,
            status: "proposed"
          }),
          sourceClaim({
            id: rejectedSourceClaimId,
            status: "rejected"
          }),
          sourceClaim({
            id: deprecatedSourceClaimId,
            status: "deprecated"
          })
        ],
        documents: [searchDocument()]
      })
    });

    const output = parseJsonObject(result.stdout);
    const answerPackage = objectValue(output.answerPackage, "answerPackage");
    const supportingClaims = arrayValue(answerPackage.supportingClaims, "supportingClaims");
    const supportingClaimIds = supportingClaims.map((candidate) =>
      objectValue(candidate, "supporting claim").sourceClaimId
    );

    expect(supportingClaimIds).toEqual([sourceClaimId]);

    const supportingDocuments = arrayValue(answerPackage.supportingDocuments, "supportingDocuments");
    const excludedCandidates = arrayValue(output.excludedCandidates, "excludedCandidates");
    const excludedByClaimId = new Map(excludedCandidates.map((candidate) => {
      const outputCandidate = objectValue(candidate, "excluded candidate");

      return [outputCandidate.sourceClaimId, outputCandidate];
    }));

    expect(supportingDocuments).toHaveLength(1);
    for (const [id, status] of [
      [proposedSourceClaimId, "proposed"],
      [rejectedSourceClaimId, "rejected"],
      [deprecatedSourceClaimId, "deprecated"]
    ] as const) {
      const excluded = excludedByClaimId.get(id);

      expect(excluded, `${status} claim should be excluded`).toBeDefined();
      expect(excluded?.status).toBe("excluded");
      expect(excluded?.exclusionReason).toBe("unsafe");
      expect(excluded?.exclusionExplanation).toContain(
        `Source claims require accepted status before activation; ${status} claims remain review candidates`
      );
      expect(excluded?.sourceDecisionSupportState).toBeUndefined();
      expect(excluded?.sourceDecisionSupportCaveat).toBeUndefined();
    }
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
    expect(relation.evidenceRef).toBe("KRN_ROADMAP.md");
    expect(relation.sourceDecisionRef).toBe("source-decision:temporal-claim-graph");
    expect(relation.validFrom).toBe("2026-06-01T00:00:00.000Z");
    expect(relation.validUntil).toBe("2026-12-31T00:00:00.000Z");
    expect(arrayValue(relation.sourceRanges, "relation sourceRanges")).toEqual([
      "KRN_ROADMAP.md:112-119"
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
      "relation support does not prove source truth, edge correctness, or ranking quality"
    );
  });

  it("filters blank and non-string SourceClaimEdge relation metadata in JSON readback", async () => {
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
        edges: [
          sourceClaimEdge({
            metadata: {
              consumer: " ",
              doesNotProve: 123,
              evidenceRef: "",
              validFrom: " ",
              validUntil: false,
              invalidatedAt: "2026-06-30T00:00:00.000Z",
              sourceRanges: ["", " docs/example.md:1-2 ", 42]
            }
          })
        ]
      })
    });

    const output = parseJsonObject(result.stdout);
    const answerPackage = objectValue(output.answerPackage, "answerPackage");
    const relationSupport = arrayValue(answerPackage.relationSupport, "relationSupport");
    const relation = objectValue(relationSupport[0], "first relation support");

    expect(relation.consumer).toBeUndefined();
    expect(relation.doesNotProve).toBeUndefined();
    expect(relation.evidenceRef).toBeUndefined();
    expect(relation.validFrom).toBeUndefined();
    expect(relation.validUntil).toBeUndefined();
    expect(relation.invalidatedAt).toBe("2026-06-30T00:00:00.000Z");
    expect(arrayValue(relation.sourceRanges, "relation sourceRanges")).toEqual([
      "docs/example.md:1-2"
    ]);
  });

  it("scans enough source claims before ranking bounded source-search output", async () => {
    const exactClaim = sourceClaim({
      id: "190f1f72-4621-49b4-b93c-538ea2c581ef" as SourceClaim["id"],
      claim: "IMR-37 maintenance-routed activation utility candidate is accepted for manual source eval follow-up only.",
      mechanism: "Accepted maintenance review can be retained as SourceArtifact, SourceClaim, and SourceDecisionEdge follow-up evidence.",
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
        query: "IMR-37 maintenance-routed activation utility candidate accepted manual source eval follow-up",
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
      "IMR-37 maintenance-routed activation utility candidate is accepted for manual source eval follow-up only."
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
      "Answer package includes decision-linked SourceClaim evidence."
    );
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

    const supportingClaims = arrayValue(answerPackage.supportingClaims, "supportingClaims");
    const firstClaim = objectValue(supportingClaims[0], "first supporting claim");

    expect(firstClaim.sourceDecisionSupportState).toBe("linked");
    expect(firstClaim.sourceDecisionSupportCaveat).toBeUndefined();
  });

  it("prioritizes decision-linked SourceClaims over accepted-only peers", async () => {
    const unlinkedSourceClaimId = "13e1965e-d872-4de8-bf82-0da352ea6a41" as SourceClaim["id"];
    const linkedSourceClaimId = "c38d1740-a049-4514-b2b0-0d53525fa615" as SourceClaim["id"];
    const unlinkedClaim = sourceClaim({
      id: unlinkedSourceClaimId,
      claim: "Source search should prefer decision linked source claim evidence for bounded kernel work.",
      mechanism: "The claim is accepted but has no SourceDecisionEdge readback.",
      krnImplication: "Accepted-only claims remain useful but should not outrank linked decision support.",
      falsifier: "A max-inclusions=1 search selects this accepted-only claim over a linked peer."
    });
    const linkedClaim = sourceClaim({
      id: linkedSourceClaimId,
      claim: "Source search should prefer decision linked source claim evidence for bounded kernel work.",
      mechanism: "The claim is accepted and has SourceDecisionEdge readback.",
      krnImplication: "Decision-linked claims are better operator evidence when relevance is otherwise equal.",
      falsifier: "A max-inclusions=1 search fails to select the decision-linked peer."
    });
    const result = await runSourceSearchCommand({
      cwd: "/repo",
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      command: {
        kind: "sourceSearch",
        query: "source search prefer decision linked source claim evidence bounded kernel work",
        limit: 10,
        maxInclusions: 1,
        json: true
      },
      createDatabaseRuntime: runtime({
        claims: [
          unlinkedClaim,
          linkedClaim
        ],
        documents: [],
        decisionEdges: [
          sourceDecisionEdge({
            sourceClaimId: linkedSourceClaimId
          })
        ]
      })
    });
    const output = parseJsonObject(result.stdout);
    const answerPackage = objectValue(output.answerPackage, "answerPackage");
    const supportingClaims = arrayValue(answerPackage.supportingClaims, "supportingClaims");
    const firstClaim = objectValue(supportingClaims[0], "first supporting claim");
    const sourceDecisionSupport = arrayValue(
      answerPackage.sourceDecisionSupport,
      "sourceDecisionSupport"
    );

    expect(supportingClaims).toHaveLength(1);
    expect(firstClaim.sourceClaimId).toBe(linkedSourceClaimId);
    expect(firstClaim.sourceDecisionSupportState).toBe("linked");
    expect(String(firstClaim.reason)).toContain("Decision-linked source support");
    expect(sourceDecisionSupport).toHaveLength(1);
    expect(objectValue(sourceDecisionSupport[0], "decision support").sourceClaimId).toBe(
      linkedSourceClaimId
    );
  });

  it("weights SourceDecisionEdge confidence when choosing linked SourceClaims", async () => {
    const lowConfidenceClaimId = "cf703560-3a2b-42a7-8949-2867e9529e67" as SourceClaim["id"];
    const highConfidenceClaimId = "916adabc-c8a3-4e08-bb55-f11443b739fe" as SourceClaim["id"];
    const sharedClaim = "Source search should rank decision linked evidence by decision-edge confidence.";
    const lowConfidenceClaim = sourceClaim({
      id: lowConfidenceClaimId,
      claim: sharedClaim,
      mechanism: "The claim has low-confidence SourceDecisionEdge readback.",
      krnImplication: "Low-confidence linked claims stay eligible but should not outrank stronger decision support.",
      falsifier: "A max-inclusions=1 search selects the low-confidence linked claim."
    });
    const highConfidenceClaim = sourceClaim({
      id: highConfidenceClaimId,
      claim: sharedClaim,
      mechanism: "The claim has high-confidence SourceDecisionEdge readback.",
      krnImplication: "High-confidence linked claims should be preferred when relevance is otherwise equal.",
      falsifier: "A max-inclusions=1 search fails to select the high-confidence linked claim."
    });
    const result = await runSourceSearchCommand({
      cwd: "/repo",
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      command: {
        kind: "sourceSearch",
        query: "source search rank decision linked evidence decision-edge confidence",
        limit: 10,
        maxInclusions: 1,
        json: true
      },
      createDatabaseRuntime: runtime({
        claims: [
          lowConfidenceClaim,
          highConfidenceClaim
        ],
        documents: [],
        decisionEdges: [
          sourceDecisionEdge({
            id: "4e64e3cf-f925-423b-a95c-65b6959e8cdd" as SourceDecisionEdge["id"],
            sourceClaimId: lowConfidenceClaimId,
            confidence: "low"
          }),
          sourceDecisionEdge({
            id: "ea41a2c6-aa14-4d2d-9a62-23b1862a5762" as SourceDecisionEdge["id"],
            sourceClaimId: highConfidenceClaimId,
            confidence: "high"
          })
        ]
      })
    });
    const output = parseJsonObject(result.stdout);
    const answerPackage = objectValue(output.answerPackage, "answerPackage");
    const supportingClaims = arrayValue(answerPackage.supportingClaims, "supportingClaims");
    const firstClaim = objectValue(supportingClaims[0], "first supporting claim");
    const sourceDecisionSupport = arrayValue(
      answerPackage.sourceDecisionSupport,
      "sourceDecisionSupport"
    );

    expect(supportingClaims).toHaveLength(1);
    expect(firstClaim.sourceClaimId).toBe(highConfidenceClaimId);
    expect(firstClaim.sourceDecisionSupportState).toBe("linked");
    expect(sourceDecisionSupport).toHaveLength(1);
    expect(objectValue(sourceDecisionSupport[0], "decision support").confidence).toBe("high");
  });

  it("ranks down source claims invalidated by accepted graph relations", async () => {
    const currentClaimId = "ca3f5b36-f68c-445d-831b-5db6d3e601d3" as SourceClaim["id"];
    const staleClaimId = "ea072f26-8977-4c80-a42c-375a6f7310cf" as SourceClaim["id"];
    const currentClaim = sourceClaim({
      id: currentClaimId,
      claim: "Current source-search readback should precede stale crawler claims.",
      mechanism: "Accepted graph relation evidence invalidates the stale crawler-first claim.",
      krnImplication: "Prefer current source-search evidence before building crawler surfaces.",
      falsifier: "The invalidated stale claim is selected first."
    });
    const staleClaim = sourceClaim({
      id: staleClaimId,
      claim: "KRN should build crawler surfaces before proving source-search readback.",
      mechanism: "The claim matched crawler query terms before graph invalidation evidence existed.",
      krnImplication: "This stale claim should rank below the current invalidating claim.",
      falsifier: "The stale claim remains first after an invalidates SourceClaimEdge."
    });
    const result = await runSourceSearchCommand({
      cwd: "/repo",
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      command: {
        kind: "sourceSearch",
        query: "source-search readback crawler surfaces graph invalidation",
        limit: 10,
        maxInclusions: 1,
        json: true
      },
      createDatabaseRuntime: runtime({
        claims: [
          staleClaim,
          currentClaim
        ],
        documents: [],
        edges: [
          sourceClaimEdge({
            id: "7a46180f-0809-40db-9ead-0ef098988230" as SourceClaimEdge["id"],
            fromSourceClaimId: currentClaimId,
            toSourceClaimId: staleClaimId,
            kind: "invalidates"
          })
        ]
      })
    });
    const output = parseJsonObject(result.stdout);
    const answerPackage = objectValue(output.answerPackage, "answerPackage");
    const supportingClaims = arrayValue(answerPackage.supportingClaims, "supportingClaims");
    const firstClaim = objectValue(supportingClaims[0], "first supporting claim");
    const relationSupport = arrayValue(answerPackage.relationSupport, "relationSupport");
    const relation = objectValue(relationSupport[0], "first relation support");
    const sourceDecisionSupport = arrayValue(
      answerPackage.sourceDecisionSupport,
      "sourceDecisionSupport"
    );
    const graphReadback = objectValue(answerPackage.graphReadback, "graphReadback");
    const excludedCandidates = arrayValue(output.excludedCandidates, "excludedCandidates");
    const excludedStaleClaim = excludedCandidates
      .map((candidate) => objectValue(candidate, "excluded candidate"))
      .find((candidate) => candidate.sourceClaimId === staleClaimId);

    expect(supportingClaims).toHaveLength(1);
    expect(firstClaim.sourceClaimId).toBe(currentClaimId);
    expect(firstClaim.sourceDecisionSupportState).toBe("missing");
    expect(firstClaim.sourceDecisionSupportCaveat).toContain("has no SourceDecisionEdge support");
    expect(relationSupport).toHaveLength(1);
    expect(relation.sourceClaimId).toBe(currentClaimId);
    expect(relation.relatedSourceClaimId).toBe(staleClaimId);
    expect(relation.kind).toBe("invalidates");
    expect(relation.sourceDecisionRef).toBe("source-decision:temporal-claim-graph");
    expect(sourceDecisionSupport).toEqual([]);
    expect(graphReadback.graphAware).toBe(true);
    expect(graphReadback.invalidationEdges).toBe(1);
    expect(excludedStaleClaim?.reason).toContain("Source graph rank-down");
    expect(excludedStaleClaim?.graphScore).toBeLessThan(0);
  });

  it("includes temporal consensus readback in source search answer packages", async () => {
    const currentClaimId = "3d66d870-5556-4d56-8554-cf602a1e1201" as SourceClaim["id"];
    const staleClaimId = "061e9341-bb5c-48d5-95db-4eb4c07bf361" as SourceClaim["id"];
    const acceptedOnlyClaimId = "be7f08d8-9062-4eda-83fa-d1eb08a0945" as SourceClaim["id"];
    const rejectedClaimId = "de0f20a8-a574-4f37-bfcc-d99bb6504d2d" as SourceClaim["id"];
    const currentClaim = sourceClaim({
      id: currentClaimId,
      claim: "Temporal consensus readback should use the current governed template.",
      mechanism: "The current claim has SourceDecisionEdge support and supersedes stale guidance.",
      krnImplication: "Source search can expose this claim as current authority for decision packets.",
      falsifier: "Consensus readback omits this claim from currentSourceClaimIds.",
      createdAt: "2026-06-22T08:00:00.000Z",
      updatedAt: "2026-06-22T08:00:00.000Z"
    });
    const staleClaim = sourceClaim({
      id: staleClaimId,
      claim: "Temporal consensus readback can keep using the old template.",
      mechanism: "The claim predates the current governed template and is past revisitWhen.",
      krnImplication: "Source search should show this as historical, not governing authority.",
      falsifier: "Consensus readback presents this stale claim as current authority.",
      revisitWhen: "2026-06-01T00:00:00.000Z",
      createdAt: "2026-05-22T08:00:00.000Z",
      updatedAt: "2026-05-22T08:00:00.000Z"
    });
    const acceptedOnlyClaim = sourceClaim({
      id: acceptedOnlyClaimId,
      claim: "Temporal consensus readback accepted-only evidence still needs decision support.",
      mechanism: "The claim is accepted but has no SourceDecisionEdge support.",
      krnImplication: "Source search can show it as caveated evidence, not current authority.",
      falsifier: "Consensus readback treats accepted-only evidence as current authority.",
      createdAt: "2026-06-23T08:00:00.000Z",
      updatedAt: "2026-06-23T08:00:00.000Z"
    });
    const rejectedClaim = sourceClaim({
      id: rejectedClaimId,
      claim: "Temporal consensus readback should use the rejected template.",
      mechanism: "The claim conflicts with current governed source support.",
      krnImplication: "Source search should expose it as rejected history.",
      falsifier: "Consensus readback omits the rejected path.",
      status: "rejected",
      sourceAuthority: "hypothesis",
      createdAt: "2026-06-24T08:00:00.000Z",
      updatedAt: "2026-06-24T08:00:00.000Z"
    });
    const result = await runSourceSearchCommand({
      cwd: "/repo",
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      command: {
        kind: "sourceSearch",
        query: "temporal consensus readback current template stale accepted-only rejected",
        limit: 10,
        maxInclusions: 4,
        json: true
      },
      createDatabaseRuntime: runtime({
        claims: [
          staleClaim,
          currentClaim,
          acceptedOnlyClaim,
          rejectedClaim
        ],
        documents: [],
        edges: [
          sourceClaimEdge({
            id: "ec9cd321-4537-4b3c-9e8c-8c5eb3436a46" as SourceClaimEdge["id"],
            fromSourceClaimId: currentClaimId,
            toSourceClaimId: staleClaimId,
            kind: "supersedes",
            metadata: {
              evidenceRef: "KRN_ROADMAP.md#phase-5-temporal-consensus",
              sourceDecisionRef: "source-decision:temporal-claim-graph"
            }
          }),
          sourceClaimEdge({
            id: "93c0eb08-fc5a-4a7d-aa79-a930d42f8062" as SourceClaimEdge["id"],
            fromSourceClaimId: rejectedClaimId,
            toSourceClaimId: currentClaimId,
            kind: "contradicts",
            metadata: {}
          })
        ],
        decisionEdges: [
          sourceDecisionEdge({
            id: "9f87a7f4-0bf1-4796-8a46-3bda94cbb221" as SourceDecisionEdge["id"],
            sourceClaimId: currentClaimId,
            confidence: "high"
          })
        ],
        rejections: [
          sourceRejection({
            id: "51a3f795-fd7d-4cc4-ac0f-407603cd5ae2" as SourceRejection["id"],
            sourceClaimId: rejectedClaimId
          })
        ]
      })
    });
    const output = parseJsonObject(result.stdout);
    const answerPackage = objectValue(output.answerPackage, "answerPackage");
    const consensusReadback = objectValue(
      answerPackage.consensusReadback,
      "consensusReadback"
    );
    const entries = arrayValue(consensusReadback.entries, "consensus entries")
      .map((entry, index) => objectValue(entry, `consensus entry ${index}`));
    const entryFor = (sourceClaimId: SourceClaim["id"]) =>
      entries.find((entry) => entry.sourceClaimId === sourceClaimId);

    expect(arrayValue(consensusReadback.currentSourceClaimIds, "currentSourceClaimIds"))
      .toContain(currentClaimId);
    expect(arrayValue(consensusReadback.historicalSourceClaimIds, "historicalSourceClaimIds"))
      .toContain(staleClaimId);
    expect(arrayValue(consensusReadback.staleSourceClaimIds, "staleSourceClaimIds"))
      .toContain(staleClaimId);
    expect(arrayValue(consensusReadback.supersededSourceClaimIds, "supersededSourceClaimIds"))
      .toContain(staleClaimId);
    expect(arrayValue(consensusReadback.caveatedSourceClaimIds, "caveatedSourceClaimIds"))
      .toContain(acceptedOnlyClaimId);
    expect(arrayValue(consensusReadback.unknownSourceClaimIds, "unknownSourceClaimIds"))
      .toContain(acceptedOnlyClaimId);
    expect(arrayValue(consensusReadback.rejectedSourceClaimIds, "rejectedSourceClaimIds"))
      .toContain(rejectedClaimId);
    expect(arrayValue(consensusReadback.currentSourceClaimIds, "currentSourceClaimIds"))
      .not.toContain(acceptedOnlyClaimId);
    expect(entryFor(currentClaimId)).toMatchObject({
      state: "current_authority",
      decisionSupportEdgeIds: ["9f87a7f4-0bf1-4796-8a46-3bda94cbb221"],
      dissentingSourceClaimIds: [rejectedClaimId],
      supersedesSourceClaimIds: [staleClaimId],
      relationEvidence: expect.arrayContaining([
        expect.objectContaining({
          sourceClaimEdgeId: "ec9cd321-4537-4b3c-9e8c-8c5eb3436a46",
          direction: "outgoing",
          kind: "supersedes",
          relatedSourceClaimId: staleClaimId,
          metadataEvidenceRefs: ["KRN_ROADMAP.md#phase-5-temporal-consensus"],
          metadataSourceDecisionRef: "source-decision:temporal-claim-graph",
          evidenceGaps: []
        }),
        expect.objectContaining({
          sourceClaimEdgeId: "93c0eb08-fc5a-4a7d-aa79-a930d42f8062",
          direction: "incoming",
          kind: "contradicts",
          relatedSourceClaimId: rejectedClaimId,
          evidenceGaps: ["missing_relation_support_ref"]
        })
      ])
    });
    expect(entryFor(staleClaimId)).toMatchObject({
      state: "historical",
      supersededBySourceClaimIds: [currentClaimId],
      relationEvidence: expect.arrayContaining([
        expect.objectContaining({
          sourceClaimEdgeId: "ec9cd321-4537-4b3c-9e8c-8c5eb3436a46",
          direction: "incoming",
          kind: "supersedes",
          relatedSourceClaimId: currentClaimId,
          metadataEvidenceRefs: ["KRN_ROADMAP.md#phase-5-temporal-consensus"],
          metadataSourceDecisionRef: "source-decision:temporal-claim-graph",
          evidenceGaps: []
        })
      ]),
      caveats: expect.arrayContaining([
        "stale",
        `superseded_by:${currentClaimId}`
      ])
    });
    expect(entryFor(acceptedOnlyClaimId)).toMatchObject({
      state: "caveated_authority",
      caveats: ["missing_source_decision_support"]
    });
    expect(entryFor(rejectedClaimId)).toMatchObject({
      state: "rejected",
      rejectionIds: ["51a3f795-fd7d-4cc4-ac0f-407603cd5ae2"]
    });
  });

  it("lets duplicate SourceClaimEdge influence change source-search selection", async () => {
    const lexicalOnlyClaimId = "0dfdb50b-73cb-4a1a-9e89-c146a2580f80" as SourceClaim["id"];
    const duplicateSeedClaimId = "f78adfcb-caa0-41cb-a0db-70fcf0d829ac" as SourceClaim["id"];
    const duplicatePeerClaimId = "a376b335-d76b-40e7-82ec-928acb99fb80" as SourceClaim["id"];
    const duplicateQuery = "duplicate relation quality";
    const lexicalOnlyClaim = sourceClaim({
      id: lexicalOnlyClaimId,
      claim: "Duplicate relation quality should not be inferred without graph support.",
      mechanism: "This claim matches the query but has no SourceClaimEdge.",
      krnImplication: "Use as the no-edge baseline competitor.",
      falsifier: "A duplicate edge changes selection even when this claim has no relation support."
    });
    const duplicateSeedClaim = sourceClaim({
      id: duplicateSeedClaimId,
      claim: "Duplicate relation quality should surface the reviewed duplicate source relation.",
      mechanism: "A SourceClaimEdge marks this source as a duplicate relation seed.",
      krnImplication: "Prefer edge-connected source context when the graph relation is visible.",
      falsifier: "A duplicate SourceClaimEdge does not change source-search selection."
    });
    const duplicatePeerClaim = sourceClaim({
      id: duplicatePeerClaimId,
      claim: "Duplicate relation quality should keep the peer claim visible as graph context.",
      mechanism: "A SourceClaimEdge links this peer claim to the duplicate relation seed.",
      krnImplication: "Use only as relation support, not as source truth by itself.",
      falsifier: "Duplicate relation support is absent from source-search readback."
    });
    const claims = [
      lexicalOnlyClaim,
      duplicateSeedClaim,
      duplicatePeerClaim
    ];
    const baseRuntime = {
      cwd: "/repo",
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      createId: (prefix: string) => `${prefix}-1`,
      command: {
        kind: "sourceSearch",
        query: duplicateQuery,
        limit: 10,
        maxInclusions: 1,
        json: true
      } as const
    };
    const baseline = await runSourceSearchCommand({
      ...baseRuntime,
      createDatabaseRuntime: runtime({
        claims,
        documents: []
      })
    });
    const edgeAware = await runSourceSearchCommand({
      ...baseRuntime,
      createDatabaseRuntime: runtime({
        claims,
        documents: [],
        edges: [
          sourceClaimEdge({
            id: "58719d9b-f5be-49a5-8a4f-a1eac6873430" as SourceClaimEdge["id"],
            fromSourceClaimId: duplicateSeedClaimId,
            toSourceClaimId: duplicatePeerClaimId,
            kind: "duplicates",
            metadata: {
              consumer: "source-search duplicate relation ranking proof",
              doesNotProve: "This edge does not prove duplicate truth or broad graph retrieval quality."
            }
          })
        ]
      })
    });
    const baselineOutput = parseJsonObject(baseline.stdout);
    const baselineAnswerPackage = objectValue(baselineOutput.answerPackage, "baseline answerPackage");
    const baselineSupportingClaims = arrayValue(baselineAnswerPackage.supportingClaims, "baseline supportingClaims");
    const baselineFirstClaim = objectValue(baselineSupportingClaims[0], "baseline first claim");
    const edgeOutput = parseJsonObject(edgeAware.stdout);
    const edgeAnswerPackage = objectValue(edgeOutput.answerPackage, "edge answerPackage");
    const edgeSupportingClaims = arrayValue(edgeAnswerPackage.supportingClaims, "edge supportingClaims");
    const edgeFirstClaim = objectValue(edgeSupportingClaims[0], "edge first claim");
    const relationSupport = arrayValue(edgeAnswerPackage.relationSupport, "relationSupport");
    const relation = objectValue(relationSupport[0], "first relation support");
    const graphReadback = objectValue(edgeAnswerPackage.graphReadback, "graphReadback");

    expect(baselineFirstClaim.sourceClaimId).toBe(lexicalOnlyClaimId);
    expect(edgeFirstClaim.sourceClaimId).toBe(duplicatePeerClaimId);
    expect(edgeFirstClaim.graphScore).toBeGreaterThan(0);
    expect(String(edgeFirstClaim.reason)).toContain("Edge-aware source graph context: duplicates.");
    expect(relationSupport).toHaveLength(1);
    expect(relation.kind).toBe("duplicates");
    expect(relation.direction).toBe("incoming");
    expect(relation.relatedSourceClaimId).toBe(duplicateSeedClaimId);
    expect(graphReadback.duplicateEdges).toBe(1);
    expect(graphReadback.invalidationEdges).toBe(0);
  });

  it("lets positive SourceClaimEdge support influence source-search selection", async () => {
    const lexicalOnlyClaimId = "f25a9541-97f2-4c47-8458-b18f84864ce9" as SourceClaim["id"];
    const supportSeedClaimId = "4cb34f5e-8b3d-4027-9017-93a8d885e76e" as SourceClaim["id"];
    const supportPeerClaimId = "6093b365-b4d6-44a7-89e7-e4b17361859e" as SourceClaim["id"];
    const supportQuery = "positive relation quality";
    const lexicalOnlyClaim = sourceClaim({
      id: lexicalOnlyClaimId,
      claim: "Positive relation quality should not be inferred without graph support.",
      mechanism: "This claim matches the query but has no SourceClaimEdge.",
      krnImplication: "Use as the no-edge baseline competitor.",
      falsifier: "A positive support edge changes selection even when this claim has no relation support."
    });
    const supportSeedClaim = sourceClaim({
      id: supportSeedClaimId,
      claim: "Positive relation quality should surface support relation seed evidence.",
      mechanism: "A SourceClaimEdge marks this source as the support relation seed.",
      krnImplication: "Prefer edge-connected source context when positive graph support is visible.",
      falsifier: "A supports SourceClaimEdge does not change source-search selection."
    });
    const supportPeerClaim = sourceClaim({
      id: supportPeerClaimId,
      claim: "Positive relation quality should keep the supported peer visible as graph context.",
      mechanism: "A SourceClaimEdge links this peer claim to the support relation seed.",
      krnImplication: "Use only as relation support, not as source truth by itself.",
      falsifier: "Positive relation support is absent from source-search readback."
    });
    const claims = [
      lexicalOnlyClaim,
      supportSeedClaim,
      supportPeerClaim
    ];
    const baseRuntime = {
      cwd: "/repo",
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      createId: (prefix: string) => `${prefix}-1`,
      command: {
        kind: "sourceSearch",
        query: supportQuery,
        limit: 10,
        maxInclusions: 1,
        json: true
      } as const
    };
    const baseline = await runSourceSearchCommand({
      ...baseRuntime,
      createDatabaseRuntime: runtime({
        claims,
        documents: []
      })
    });
    const edgeAware = await runSourceSearchCommand({
      ...baseRuntime,
      createDatabaseRuntime: runtime({
        claims,
        documents: [],
        edges: [
          sourceClaimEdge({
            id: "7082ca98-d4e0-4efa-9eca-cd657db2ef6d" as SourceClaimEdge["id"],
            fromSourceClaimId: supportSeedClaimId,
            toSourceClaimId: supportPeerClaimId,
            kind: "supports",
            metadata: {
              consumer: "source-search positive relation ranking proof",
              doesNotProve: "This edge does not prove support truth or broad graph retrieval quality."
            }
          })
        ]
      })
    });
    const baselineOutput = parseJsonObject(baseline.stdout);
    const baselineAnswerPackage = objectValue(baselineOutput.answerPackage, "baseline answerPackage");
    const baselineSupportingClaims = arrayValue(baselineAnswerPackage.supportingClaims, "baseline supportingClaims");
    const baselineFirstClaim = objectValue(baselineSupportingClaims[0], "baseline first claim");
    const edgeOutput = parseJsonObject(edgeAware.stdout);
    const edgeAnswerPackage = objectValue(edgeOutput.answerPackage, "edge answerPackage");
    const edgeSupportingClaims = arrayValue(edgeAnswerPackage.supportingClaims, "edge supportingClaims");
    const edgeFirstClaim = objectValue(edgeSupportingClaims[0], "edge first claim");
    const relationSupport = arrayValue(edgeAnswerPackage.relationSupport, "relationSupport");
    const relation = objectValue(relationSupport[0], "first relation support");
    const graphReadback = objectValue(edgeAnswerPackage.graphReadback, "graphReadback");
    const relationKinds = arrayValue(graphReadback.relationKinds, "relationKinds")
      .map((item) => objectValue(item, "relation kind count"));

    expect(baselineFirstClaim.sourceClaimId).toBe(lexicalOnlyClaimId);
    expect(edgeFirstClaim.sourceClaimId).toBe(supportPeerClaimId);
    expect(edgeFirstClaim.graphScore).toBeGreaterThan(0);
    expect(String(edgeFirstClaim.reason)).toContain("Edge-aware source graph context: supports.");
    expect(edgeFirstClaim.sourceDecisionSupportState).toBe("missing");
    expect(String(edgeFirstClaim.sourceDecisionSupportCaveat)).toContain("has no SourceDecisionEdge support");
    expect(relationSupport).toHaveLength(1);
    expect(relation.kind).toBe("supports");
    expect(relation.direction).toBe("incoming");
    expect(relation.relatedSourceClaimId).toBe(supportSeedClaimId);
    expect(relationKinds).toContainEqual({
      kind: "supports",
      count: 1
    });
    expect(graphReadback.relationEdges).toBe(1);
    expect(graphReadback.invalidationEdges).toBe(0);
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
    expect(result.stdout).toContain("- SourceClaim evidence in the answer package for this query");
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
