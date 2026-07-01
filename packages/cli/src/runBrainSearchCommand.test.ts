import { describe, expect, it } from "vitest";

import {
  runBrainSearchCommand
} from "./runBrainSearchCommand.js";

describe("runBrainSearchCommand", () => {
  it("combines brain knowledge and source search into a read-only brain preview", async () => {
    const result = await runBrainSearchCommand({
      cwd: "/repo",
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => "2026-06-30T13:00:00.000Z",
      createId: (prefix) => `${prefix}-1`,
      command: {
        kind: "brainSearch",
        query: "source-to-decision",
        catalogFiles: ["docs/brain-knowledge/catalog.json"],
        storeOnly: false,
        limit: 2,
        maxInclusions: 2,
        format: "json"
      },
      async runKnowledgeCards(runtime) {
        expect(runtime.catalogFiles).toEqual(["docs/brain-knowledge/catalog.json"]);
        expect(runtime.filter).toEqual({ text: "source-to-decision" });
        expect(runtime.format).toBe("json");

        return {
          stdout: JSON.stringify({
            kind: "krn.brainKnowledge.cards.preview.v1",
            returnedCards: 1,
            totalCards: 1,
            cards: [{
              id: "pattern:source-to-decision-retention-gate",
              title: "Source-to-decision retention gate",
              summary: "Retained sources must name a mechanism, KRN implication, consumer, and falsifier.",
              consumers: ["pattern application gate"],
              falsifier: "A future slice retains a source with no consumer.",
              doesNotProve: "This card does not prove source truth.",
              nextAction: "use"
            }],
            proof: {
              doesNotProve: ["brain-knowledge catalog completeness"]
            }
          })
        };
      },
      async runSourceSearch(runtime) {
        expect(runtime.command).toMatchObject({
          kind: "sourceSearch",
          query: "source-to-decision",
          limit: 2,
          maxInclusions: 2,
          json: true
        });

        return {
          stdout: JSON.stringify({
            kind: "source_search_answer_package",
            answerPackage: {
              answerUsefulness: "useful",
              supportingClaims: [{ label: "claim" }],
              supportingDocuments: [{ label: "doc" }],
              relationSupport: [{ edgeId: "edge-1" }],
              graphReadback: {
                claimNodes: 1,
                relationEdges: 1,
                temporalEdges: 1,
                contradictionEdges: 0,
                duplicateEdges: 0,
                invalidationEdges: 1,
                graphAware: true,
                caveats: ["graph readback summarizes existing SourceClaimEdge rows only"]
              },
              missingEvidence: []
            },
            includedCandidates: [{ subjectId: "claim-1" }],
            proof: {
              doesNotProve: ["source truth"]
            }
          })
        };
      }
    });
    const parsed: unknown = JSON.parse(result.stdout);

    expect(parsed).toMatchObject({
      kind: "krn.brainSearch.preview.v1",
      access: "read_only",
      mutation: "none",
      query: "source-to-decision",
      brainKnowledgeReadback: "catalog_files",
      knowledgeCards: {
        returnedCards: 1,
        totalCards: 1,
        cardIds: ["pattern:source-to-decision-retention-gate"],
        selectedKnowledge: [{
          id: "pattern:source-to-decision-retention-gate",
          title: "Source-to-decision retention gate",
          summary: "Retained sources must name a mechanism, KRN implication, consumer, and falsifier.",
          consumers: ["pattern application gate"],
          falsifier: "A future slice retains a source with no consumer.",
          doesNotProve: "This card does not prove source truth.",
          nextAction: "use"
        }]
      },
      sourceSearch: {
        answerUsefulness: "useful",
        supportingClaims: 1,
        supportingDocuments: 1,
        relationSupport: 1,
        graphReadback: {
          claimNodes: 1,
          relationEdges: 1,
          temporalEdges: 1,
          invalidationEdges: 1,
          graphAware: true
        },
        includedCandidates: 1
      }
    });
    expect(JSON.stringify(parsed)).toContain("matching brain knowledge");
    expect(JSON.stringify(parsed)).toContain("Memory Core mutation");
  });

  it("renders text proof and no-match guidance", async () => {
    const result = await runBrainSearchCommand({
      cwd: "/repo",
      env: {},
      now: () => "2026-06-30T13:00:00.000Z",
      createId: (prefix) => `${prefix}-1`,
      command: {
        kind: "brainSearch",
        query: "missing pattern",
        catalogFiles: [],
        storeOnly: false,
        format: "text"
      },
      async runKnowledgeCards() {
        return {
          stdout: JSON.stringify({
            returnedCards: 0,
            totalCards: 0,
            cards: [],
            proof: {
              doesNotProve: ["brain-knowledge catalog completeness"]
            }
          })
        };
      },
      async runSourceSearch() {
        return {
          stdout: JSON.stringify({
            answerPackage: {
              answerUsefulness: "not_useful",
              supportingClaims: [],
              supportingDocuments: [],
              relationSupport: [],
              graphReadback: {
                claimNodes: 0,
                relationEdges: 0,
                temporalEdges: 0,
                contradictionEdges: 0,
                duplicateEdges: 0,
                invalidationEdges: 0,
                graphAware: false,
                caveats: ["entity extraction is not available in this bounded readback"]
              },
              missingEvidence: ["governed SourceClaim evidence"]
            },
            includedCandidates: [],
            proof: {
              doesNotProve: ["source truth"]
            }
          })
        };
      }
    });

    expect(result.stdout).toContain("KRN Brain Search Preview");
    expect(result.stdout).toContain("Mutation: none");
    expect(result.stdout).toContain("Brain knowledge readback: catalog_files");
    expect(result.stdout).toContain("Brain knowledge:");
    expect(result.stdout).toContain("cardIds: none");
    expect(result.stdout).toContain("graphAware: false");
    expect(result.stdout).toContain("graphCaveat: entity extraction is not available in this bounded readback");
    expect(result.stdout).toContain("missingEvidence: governed SourceClaim evidence");
    expect(result.stdout).toContain("Do not infer product truth");
    expect(result.stdout).toContain("does not prove: product readiness");
  });

  it("retries selected knowledge with a compact mechanism query after a graph benchmark miss", async () => {
    const knowledgeQueries: string[] = [];
    const result = await runBrainSearchCommand({
      cwd: "/repo",
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => "2026-07-01T10:00:00.000Z",
      createId: (prefix) => `${prefix}-1`,
      command: {
        kind: "brainSearch",
        query: "graph sourceclaimedge relation temporal source relations",
        catalogFiles: ["docs/brain-knowledge/catalog.json"],
        storeOnly: false,
        limit: 16,
        maxInclusions: 6,
        format: "json"
      },
      async runKnowledgeCards(runtime) {
        knowledgeQueries.push(runtime.filter.text ?? "");

        if (runtime.filter.text === "graph sourceclaimedge") {
          return {
            stdout: JSON.stringify({
              returnedCards: 1,
              totalCards: 1,
              cards: [{
                id: "pattern:graph-relation-readback-boundary",
                title: "Graph relation readback boundary",
                summary: "Expose graph readback without treating it as source truth.",
                consumers: ["future Brain-QA graph relation cases"],
                falsifier: "A graph slice treats relationSupport as source truth.",
                doesNotProve: "This does not prove graph ranking quality.",
                nextAction: "use"
              }],
              proof: {
                doesNotProve: ["search ranking quality is good"]
              }
            })
          };
        }

        return {
          stdout: JSON.stringify({
            returnedCards: 0,
            totalCards: 0,
            cards: [],
            proof: {
              doesNotProve: ["search ranking quality is good"]
            }
          })
        };
      },
      async runSourceSearch() {
        return {
          stdout: JSON.stringify({
            answerPackage: {
              answerUsefulness: "partly_useful_missing_document",
              supportingClaims: [{ label: "claim-1" }],
              supportingDocuments: [],
              relationSupport: [{ edgeId: "edge-1" }],
              graphReadback: {
                claimNodes: 1,
                relationEdges: 1,
                temporalEdges: 0,
                contradictionEdges: 0,
                duplicateEdges: 0,
                invalidationEdges: 0,
                graphAware: true,
                caveats: ["graph readback summarizes existing SourceClaimEdge rows only"]
              },
              missingEvidence: ["included SearchDocument evidence"]
            },
            includedCandidates: [],
            proof: {
              doesNotProve: ["source truth"]
            }
          })
        };
      }
    });
    const parsed: unknown = JSON.parse(result.stdout);

    expect(knowledgeQueries).toEqual([
      "graph sourceclaimedge relation temporal source relations",
      "graph sourceclaimedge"
    ]);
    expect(parsed).toMatchObject({
      brainKnowledgeQueries: [
        "graph sourceclaimedge relation temporal source relations",
        "graph sourceclaimedge"
      ],
      knowledgeCards: {
        selectedKnowledge: [{
          id: "pattern:graph-relation-readback-boundary"
        }]
      },
      recommendedNextAction: "Use the matching brain knowledge as pattern guidance and the source-search answer package as evidence before changing code."
    });
  });

  it("retries selected knowledge with a compact mechanism query after a heartbeat benchmark miss", async () => {
    const knowledgeQueries: string[] = [];
    const result = await runBrainSearchCommand({
      cwd: "/repo",
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => "2026-07-01T10:00:00.000Z",
      createId: (prefix) => `${prefix}-1`,
      command: {
        kind: "brainSearch",
        query: "heartbeat dreaming source relation evidence",
        catalogFiles: ["docs/brain-knowledge/catalog.json"],
        storeOnly: false,
        limit: 16,
        maxInclusions: 6,
        format: "json"
      },
      async runKnowledgeCards(runtime) {
        knowledgeQueries.push(runtime.filter.text ?? "");

        if (runtime.filter.text === "heartbeat dreaming") {
          return {
            stdout: JSON.stringify({
              returnedCards: 1,
              totalCards: 1,
              cards: [{
                id: "pattern:heartbeat-candidate-only-runtime-boundary",
                title: "Heartbeat candidate-only runtime boundary",
                summary: "Heartbeat and dreaming work stays candidate-only before scheduler work.",
                consumers: ["future heartbeat preview CLI/readback tests"],
                falsifier: "A heartbeat slice adds automatic memory mutation.",
                doesNotProve: "This does not prove autonomous dreaming.",
                nextAction: "use"
              }],
              proof: {
                doesNotProve: ["search ranking quality is good"]
              }
            })
          };
        }

        return {
          stdout: JSON.stringify({
            returnedCards: 0,
            totalCards: 0,
            cards: [],
            proof: {
              doesNotProve: ["search ranking quality is good"]
            }
          })
        };
      },
      async runSourceSearch() {
        return {
          stdout: JSON.stringify({
            answerPackage: {
              answerUsefulness: "partly_useful_missing_document",
              supportingClaims: [{ label: "claim-1" }],
              supportingDocuments: [],
              relationSupport: [{ edgeId: "edge-1" }],
              graphReadback: {
                claimNodes: 1,
                relationEdges: 1,
                temporalEdges: 0,
                contradictionEdges: 0,
                duplicateEdges: 0,
                invalidationEdges: 0,
                graphAware: true,
                caveats: ["graph readback summarizes existing SourceClaimEdge rows only"]
              },
              missingEvidence: ["included SearchDocument evidence"]
            },
            includedCandidates: [],
            proof: {
              doesNotProve: ["source truth"]
            }
          })
        };
      }
    });
    const parsed: unknown = JSON.parse(result.stdout);

    expect(knowledgeQueries).toEqual([
      "heartbeat dreaming source relation evidence",
      "heartbeat dreaming"
    ]);
    expect(parsed).toMatchObject({
      brainKnowledgeQueries: [
        "heartbeat dreaming source relation evidence",
        "heartbeat dreaming"
      ],
      knowledgeCards: {
        selectedKnowledge: [{
          id: "pattern:heartbeat-candidate-only-runtime-boundary"
        }]
      },
      recommendedNextAction: "Use the matching brain knowledge as pattern guidance and the source-search answer package as evidence before changing code."
    });
  });

  it("derives store-backed selected knowledge from source claims in store-only brain search", async () => {
    const result = await runBrainSearchCommand({
      cwd: "/repo",
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => "2026-06-30T13:00:00.000Z",
      createId: (prefix) => `${prefix}-1`,
      command: {
        kind: "brainSearch",
        query: "source-to-decision",
        catalogFiles: [],
        storeOnly: true,
        format: "json"
      },
      async runKnowledgeCards() {
        throw new Error("store-only brain search should not read file catalogs");
      },
      async runSourceSearch() {
        return {
          stdout: JSON.stringify({
            answerPackage: {
              answerUsefulness: "useful",
              supportingClaims: [{
                label: "source_claim:claim-1",
                subjectId: "claim-1",
                sourceClaimId: "claim-1",
                claim: "Store-only brain search should derive selected knowledge from source evidence.",
                mechanism: "Source search already returns governed SourceClaim fields.",
                krnImplication: "Brain search can surface selected knowledge without file-backed catalog cards.",
                consumer: "IMR-00 pattern brain",
                falsifier: "Store-only search with governed source evidence returns empty selectedKnowledge.",
                doesNotProve: "This does not prove ranking quality.",
                expectedUse: "Use source-backed knowledge as a pre-coding pattern gate."
              }],
              supportingDocuments: [{ label: "doc" }],
              relationSupport: [],
              graphReadback: {
                claimNodes: 1,
                relationEdges: 0,
                temporalEdges: 0,
                contradictionEdges: 0,
                duplicateEdges: 0,
                invalidationEdges: 0,
                graphAware: false,
                caveats: []
              },
              missingEvidence: []
            },
            includedCandidates: [],
            proof: {
              doesNotProve: ["source truth"]
            }
          })
        };
      }
    });
    const parsed: unknown = JSON.parse(result.stdout);

    expect(parsed).toMatchObject({
      brainKnowledgeReadback: "store_only",
      knowledgeCards: {
        returnedCards: 0,
        selectedKnowledge: [{
          id: "claim-1",
          title: "Store-only brain search should derive selected knowledge from source evidence.",
          summary: "Brain search can surface selected knowledge without file-backed catalog cards.",
          source: "source_search",
          reviewability: "ready",
          consumers: ["IMR-00 pattern brain"],
          falsifier: "Store-only search with governed source evidence returns empty selectedKnowledge.",
          doesNotProve: "This does not prove ranking quality.",
          nextAction: "use"
        }],
        doesNotProve: [
          "brain knowledge catalog readback was explicitly skipped by --store-only"
        ]
      },
      sourceSearch: {
        answerUsefulness: "useful",
        supportingClaims: 1,
        supportingDocuments: 1
      },
      proof: {
        proves: [
          "brain knowledge catalog readback was explicitly skipped for this query",
          "existing source-search answer package was executed for this query",
          "brain search combined both readbacks without mutating KRN state"
        ]
      }
    });
    expect(JSON.stringify(parsed)).toContain("store-backed source/search evidence");
  });

  it("keeps weak store-backed selected knowledge visibly not review-ready", async () => {
    const result = await runBrainSearchCommand({
      cwd: "/repo",
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => "2026-06-30T13:00:00.000Z",
      createId: (prefix) => `${prefix}-1`,
      command: {
        kind: "brainSearch",
        query: "weak source evidence",
        catalogFiles: [],
        storeOnly: true,
        format: "json"
      },
      async runKnowledgeCards() {
        throw new Error("store-only brain search should not read file catalogs");
      },
      async runSourceSearch() {
        return {
          stdout: JSON.stringify({
            answerPackage: {
              answerUsefulness: "partly_useful_missing_document",
              supportingClaims: [{
                label: "source_claim:weak-claim",
                subjectId: "weak-claim",
                sourceClaimId: "weak-claim",
                claim: "Weak source evidence should remain visible.",
                expectedUse: "Use only after adding mechanism and falsifier."
              }],
              supportingDocuments: [],
              relationSupport: [],
              graphReadback: {
                claimNodes: 1,
                relationEdges: 0,
                temporalEdges: 0,
                contradictionEdges: 0,
                duplicateEdges: 0,
                invalidationEdges: 0,
                graphAware: false,
                caveats: []
              },
              missingEvidence: ["SearchDocument evidence"]
            },
            includedCandidates: [],
            proof: {
              doesNotProve: ["source truth"]
            }
          })
        };
      }
    });
    const parsed: unknown = JSON.parse(result.stdout);

    expect(parsed).toMatchObject({
      brainKnowledgeReadback: "store_only",
      knowledgeCards: {
        returnedCards: 0,
        selectedKnowledge: [{
          id: "weak-claim",
          source: "source_search",
          reviewability: "needs_more_evidence",
          nextAction: "needs_more_evidence"
        }]
      }
    });
    expect(JSON.stringify(parsed)).toContain("mechanism missing.");
    expect(JSON.stringify(parsed)).toContain("falsifier missing.");
  });

  it("returns no store-backed selected knowledge when source evidence is empty", async () => {
    const result = await runBrainSearchCommand({
      cwd: "/repo",
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => "2026-06-30T13:00:00.000Z",
      createId: (prefix) => `${prefix}-1`,
      command: {
        kind: "brainSearch",
        query: "empty source evidence",
        catalogFiles: [],
        storeOnly: true,
        format: "json"
      },
      async runKnowledgeCards() {
        throw new Error("store-only brain search should not read file catalogs");
      },
      async runSourceSearch() {
        return {
          stdout: JSON.stringify({
            answerPackage: {
              answerUsefulness: "not_useful",
              supportingClaims: [],
              supportingDocuments: [],
              relationSupport: [],
              graphReadback: {
                claimNodes: 0,
                relationEdges: 0,
                temporalEdges: 0,
                contradictionEdges: 0,
                duplicateEdges: 0,
                invalidationEdges: 0,
                graphAware: false,
                caveats: []
              },
              missingEvidence: ["governed SourceClaim evidence"]
            },
            includedCandidates: [],
            proof: {
              doesNotProve: ["source truth"]
            }
          })
        };
      }
    });
    const parsed: unknown = JSON.parse(result.stdout);

    expect(parsed).toMatchObject({
      brainKnowledgeReadback: "store_only",
      knowledgeCards: {
        returnedCards: 0,
        selectedKnowledge: []
      },
      sourceSearch: {
        supportingClaims: 0,
        supportingDocuments: 0
      },
      proof: {
        proves: [
          "brain knowledge catalog readback was explicitly skipped for this query",
          "existing source-search answer package was executed for this query",
          "brain search combined both readbacks without mutating KRN state"
        ]
      }
    });
  });

  it("surfaces source claim linked document evidence in source-search summaries", async () => {
    const result = await runBrainSearchCommand({
      cwd: "/repo",
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => "2026-07-01T10:00:00.000Z",
      createId: (prefix) => `${prefix}-1`,
      command: {
        kind: "brainSearch",
        query: "artifact-linked evidence",
        catalogFiles: [],
        storeOnly: true,
        format: "text"
      },
      async runKnowledgeCards() {
        throw new Error("store-only brain search should not read file catalogs");
      },
      async runSourceSearch() {
        return {
          stdout: JSON.stringify({
            answerPackage: {
              answerUsefulness: "partly_useful_missing_document",
              supportingClaims: [
                { label: "claim-1" },
                { label: "claim-2" },
                { label: "claim-3" },
                { label: "claim-4" },
                { label: "claim-5" }
              ],
              supportingDocuments: [],
              sourceClaimDocumentLinks: [{
                sourceClaimId: "claim-1",
                linkedSearchDocumentCount: 2,
                linkedSearchDocumentIds: ["doc-1", "doc-2"],
                linkKinds: ["same_source_artifact"],
                caveat: "SourceClaim has artifact-linked SearchDocument rows, but lexical source search did not include them."
              }],
              relationSupport: [],
              graphReadback: {
                claimNodes: 5,
                relationEdges: 0,
                temporalEdges: 0,
                contradictionEdges: 0,
                duplicateEdges: 0,
                invalidationEdges: 0,
                graphAware: false,
                caveats: []
              },
              missingEvidence: ["included SearchDocument evidence"]
            },
            includedCandidates: [],
            proof: {
              doesNotProve: ["source truth"]
            }
          })
        };
      }
    });

    expect(result.stdout).toContain("supportingClaims: 5");
    expect(result.stdout).toContain("supportingDocuments: 0");
    expect(result.stdout).toContain("sourceClaimDocumentLinks: 1");
    expect(result.stdout).toContain("linkedSearchDocuments: 2");
    expect(result.stdout).toContain(
      "sourceClaimDocumentLinkCaveat: SourceClaim has artifact-linked SearchDocument rows, but lexical source search did not include them."
    );
    expect(result.stdout).toContain("missingEvidence: included SearchDocument evidence");
  });
});
