import {
  describe,
  expect,
  it
} from "vitest";

import type {
  SourceClaim
} from "@krn/core";
import type {
  SearchDocumentSearchResult
} from "@krn/harness/repositories/internal";
import type {
  DatabaseRuntime
} from "./databaseRuntime.js";
import {
  buildSourceSearchMissingEvidence,
  runSourceSearchCommand
} from "./runSourceSearchCommand.js";

const now = "2026-06-29T12:00:00.000Z";
const projectId = "7d9d103a-1a8e-4492-a4ca-db3a5589bd9b";
const sourceClaimId = "3363383c-02d0-4e5a-9674-132c1bc41b51" as SourceClaim["id"];
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

const runtime = (input?: {
  claims?: readonly SourceClaim[];
  documents?: readonly SearchDocumentSearchResult[];
  onSearchQuery?(query: string): void;
  onClose?(): void;
}): SourceSearchCommand["createDatabaseRuntime"] => async () => {
  const claims = input?.claims ?? [sourceClaim()];
  const documents = input?.documents ?? [searchDocument()];

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
        async listClaimsForProject() {
          return claims;
        },
        async listSourceClaimEdgesForClaim() {
          return [];
        }
      },
      retrievalRepository: {
        async searchLexical(searchInput) {
          input?.onSearchQuery?.(searchInput.query);

          return documents;
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
      async listSourceClaimEdgesForClaim() {
        return [];
      },
      async createSourceDecisionEdge() {
        throw new Error("createSourceDecisionEdge should not be called");
      },
      async getSourceDecisionEdgeById() {
        throw new Error("getSourceDecisionEdgeById should not be called");
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
        input?.onSearchQuery?.(searchInput.query);

        return documents;
      }
    },
    async close() {
      input?.onClose?.();
    }
  };
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
    expect(result.stdout).toContain("supporting claims:");
    expect(result.stdout).toContain(`- source_claim:${sourceClaimId}`);
    expect(result.stdout).toContain("supporting documents:");
    expect(result.stdout).toContain(`- search_document:${searchDocumentId}`);
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
    expect(answerPackage.recommendedNextAction).toContain("Use the supporting claims/documents as a Pattern Application Gate");
    expect(arrayValue(answerPackage.missingEvidence, "missingEvidence")).toEqual([]);
    expect(arrayValue(answerPackage.doesNotProve, "doesNotProve")).toContain(
      "source truth, answer correctness, ranking quality, product readiness, or Memory Core mutation"
    );

    const supportingClaims = arrayValue(answerPackage.supportingClaims, "supportingClaims");
    const supportingDocuments = arrayValue(answerPackage.supportingDocuments, "supportingDocuments");
    const firstClaim = objectValue(supportingClaims[0], "first supporting claim");
    const firstDocument = objectValue(supportingDocuments[0], "first supporting document");

    expect(firstClaim.label).toBe(`source_claim:${sourceClaimId}`);
    expect(firstClaim.status).toBe("included");
    expect(firstClaim.reviewability).toBe("ready");
    expect(arrayValue(firstClaim.reviewabilityReasons, "claim reviewability reasons")).toContain("SourceClaim has mechanism.");
    expect(firstDocument.label).toBe(`search_document:${searchDocumentId}`);
    expect(firstDocument.reviewability).toBe("ready");

    const includedCandidates = arrayValue(output.includedCandidates, "includedCandidates");
    const excludedCandidates = arrayValue(output.excludedCandidates, "excludedCandidates");
    const proof = objectValue(output.proof, "proof");
    const runtimeOutput = objectValue(output.runtime, "runtime");

    expect(includedCandidates).toHaveLength(2);
    expect(excludedCandidates).toHaveLength(0);
    expect(arrayValue(proof.proves, "proof.proves")).toContain(
      "readback shows inclusion/exclusion, scores, reviewability, and proof boundaries"
    );
    expect(arrayValue(proof.doesNotProve, "proof.doesNotProve")).toContain("product readiness");
    expect(runtimeOutput.memoryMutation).toBe("none");
    expect(runtimeOutput.crawler).toBe("none");
    expect(runtimeOutput.embeddings).toBe("not_run");
    expect(runtimeOutput.graphRuntime).toBe("not_run");
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
    expect(result.stdout).toContain(
      "- included SearchDocument evidence for this combined query; topic-specific SearchDocuments may still exist"
    );
    expect(result.stdout).toContain(
      "recommended next action: Use the supporting claims cautiously and split broad queries into narrower topic-specific source searches before changing retrieval."
    );
  });
});
