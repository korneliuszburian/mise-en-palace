import { describe, expect, it } from "vitest";

import {
  runBrainSearchCommand
} from "./runBrainSearchCommand.js";

describe("runBrainSearchCommand", () => {
  it("combines knowledge cards and source search into a read-only brain preview", async () => {
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
              doesNotProve: ["knowledge-card completeness"]
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
              doesNotProve: ["knowledge-card completeness"]
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

  it("can skip file catalog readback for store-only brain search", async () => {
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
              supportingClaims: [{ label: "claim" }],
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
        selectedKnowledge: [],
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
});
