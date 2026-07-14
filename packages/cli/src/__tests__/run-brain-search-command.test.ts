import { describe, expect, it } from "vitest";

import type {
  FeedbackDelta,
  MemoryRecord
} from "@krn/core";
import {
  stampCurrentDecisionPacketAuthorityMetadata
} from "@krn/core";
import {
  runBrainSearchCommand
} from "../run-brain-search-command.js";
import type {
  DatabaseRuntime,
  DatabaseRuntimeInput
} from "../database-runtime.js";

describe("runBrainSearchCommand", () => {
  it("combines memory recall and source search into a read-only brain preview", async () => {
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
        catalogFiles: ["tests/fixtures/brain-knowledge/corpus/catalog.json"],
        storeOnly: false,
        limit: 2,
        maxInclusions: 2,
        format: "json"
      },
      async runBrainRecall(runtime) {
        expect(runtime.catalogFiles).toEqual(["tests/fixtures/brain-knowledge/corpus/catalog.json"]);
        expect(runtime.filter).toEqual({ text: "source-to-decision" });
        expect(runtime.format).toBe("json");

        return {
          stdout: JSON.stringify({
            kind: "krn.memory.recall.readback.v1",
            returnedReadModels: 1,
            totalReadModels: 1,
            readModels: [{
              id: "knowledge:source-to-decision-retention-gate",
              title: "Source-to-decision retention gate",
              summary: "Retained sources must name a mechanism, KRN implication, consumer, and falsifier.",
              consumers: ["knowledge application gate"],
              falsifier: "A future slice retains a source with no consumer.",
              doesNotProve: "This readModel does not prove source truth.",
              nextAction: "use"
            }],
            proof: {
              doesNotProve: ["knowledge catalog completeness"]
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
              sourceDecisionSupport: [{ sourceDecisionEdgeId: "decision-edge-1" }],
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
      kind: "krn.memorySearch.preview.v1",
      access: "read_only",
      mutation: "none",
      query: "source-to-decision",
      memoryRecallReadback: "fixture_catalog",
      knowledgeReadModels: {
        returnedReadModels: 1,
        totalReadModels: 1,
        readModelIds: ["knowledge:source-to-decision-retention-gate"],
        selectedKnowledge: [{
          id: "knowledge:source-to-decision-retention-gate",
          title: "Source-to-decision retention gate",
          summary: "Retained sources must name a mechanism, KRN implication, consumer, and falsifier.",
          consumers: ["knowledge application gate"],
          falsifier: "A future slice retains a source with no consumer.",
          doesNotProve: "This readModel does not prove source truth.",
          nextAction: "use"
        }]
      },
      sourceSearch: {
        answerUsefulness: "useful",
        supportingClaims: 1,
        supportingDocuments: 1,
        relationSupport: 1,
        sourceDecisionSupport: 1,
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
    expect(JSON.stringify(parsed)).toContain("matching knowledge");
    expect(JSON.stringify(parsed)).toContain(
      "existing memory recall fixture catalog readback was executed as bootstrap/fixture input for this query"
    );
    expect(JSON.stringify(parsed)).toContain("fixture catalog knowledge is runtime memory");
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
        query: "missing knowledge",
        catalogFiles: [],
        storeOnly: false,
        format: "text"
      },
      async runBrainRecall() {
        return {
          stdout: JSON.stringify({
            returnedReadModels: 0,
            totalReadModels: 0,
            readModels: [],
            proof: {
              doesNotProve: ["knowledge catalog completeness"]
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

    expect(result.stdout).toContain("KRN Memory Search Preview");
    expect(result.stdout).toContain("Mutation: none");
    expect(result.stdout).toContain("Memory recall readback: store_backed");
    expect(result.stdout).toContain("Recall read models:");
    expect(result.stdout).toContain("readModelIds: none");
    expect(result.stdout).toContain("graphAware: false");
    expect(result.stdout).toContain("sourceDecisionSupport: 0");
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
        catalogFiles: ["tests/fixtures/brain-knowledge/corpus/catalog.json"],
        storeOnly: false,
        limit: 16,
        maxInclusions: 6,
        format: "json"
      },
      async runBrainRecall(runtime) {
        knowledgeQueries.push(runtime.filter.text ?? "");

        if (runtime.filter.text === "graph sourceclaimedge") {
          return {
            stdout: JSON.stringify({
              returnedReadModels: 1,
              totalReadModels: 1,
              readModels: [{
                id: "knowledge:graph-relation-readback-boundary",
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
            returnedReadModels: 0,
            totalReadModels: 0,
            readModels: [],
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
      memoryRecallQueries: [
        "graph sourceclaimedge relation temporal source relations",
        "graph sourceclaimedge"
      ],
      knowledgeReadModels: {
        selectedKnowledge: [{
          id: "knowledge:graph-relation-readback-boundary"
        }]
      },
      recommendedNextAction: "Use the matching knowledge and source-search answer package as evidence before changing code."
    });
  });

  it("retries selected knowledge with a compact mechanism query after a maintenance benchmark miss", async () => {
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
        query: "maintenance dreaming source relation evidence",
        catalogFiles: ["tests/fixtures/brain-knowledge/corpus/catalog.json"],
        storeOnly: false,
        limit: 16,
        maxInclusions: 6,
        format: "json"
      },
      async runBrainRecall(runtime) {
        knowledgeQueries.push(runtime.filter.text ?? "");

        if (runtime.filter.text === "maintenance dreaming") {
          return {
            stdout: JSON.stringify({
              returnedReadModels: 1,
              totalReadModels: 1,
              readModels: [{
                id: "knowledge:maintenance-candidate-only-runtime-boundary",
                title: "Maintenance candidate-only runtime boundary",
                summary: "Heartbeat and dreaming work stays candidate-only before scheduler work.",
                consumers: ["future maintenance preview CLI/readback tests"],
                falsifier: "A maintenance slice adds automatic memory mutation.",
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
            returnedReadModels: 0,
            totalReadModels: 0,
            readModels: [],
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
      "maintenance dreaming source relation evidence",
      "maintenance dreaming"
    ]);
    expect(parsed).toMatchObject({
      memoryRecallQueries: [
        "maintenance dreaming source relation evidence",
        "maintenance dreaming"
      ],
      knowledgeReadModels: {
        selectedKnowledge: [{
          id: "knowledge:maintenance-candidate-only-runtime-boundary"
        }]
      },
      recommendedNextAction: "Use the matching knowledge and source-search answer package as evidence before changing code."
    });
  });

  it("tries later compact mechanism windows after an early compact miss", async () => {
    const knowledgeQueries: string[] = [];
    const result = await runBrainSearchCommand({
      cwd: "/repo",
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => "2026-07-04T02:00:00.000Z",
      createId: (prefix) => `${prefix}-1`,
      command: {
        kind: "brainSearch",
        query:
          "prove retained reference implementation recipe through local code exemplar",
        catalogFiles: ["tests/fixtures/brain-knowledge/corpus/catalog.json"],
        storeOnly: false,
        limit: 16,
        maxInclusions: 6,
        format: "json"
      },
      async runBrainRecall(runtime) {
        knowledgeQueries.push(runtime.filter.text ?? "");

        if (runtime.filter.text === "reference implementation recipe") {
          return {
            stdout: JSON.stringify({
              returnedReadModels: 1,
              totalReadModels: 1,
              readModels: [{
                id: "knowledge:reference-implementation-recipe-clone-boundary",
                title: "Reference implementation recipe boundary",
                summary: "Clone a local exemplar shape only as a bounded implementation recipe.",
                consumers: ["future local exemplar work"],
                falsifier: "A future slice treats the recipe as runtime clone automation.",
                doesNotProve: "This does not prove broad implementation quality.",
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
            returnedReadModels: 0,
            totalReadModels: 0,
            readModels: [],
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
      "prove retained reference implementation recipe through local code exemplar",
      "prove reference implementation recipe",
      "prove reference implementation",
      "reference implementation recipe"
    ]);
    expect(parsed).toMatchObject({
      memoryRecallQueries: [
        "prove retained reference implementation recipe through local code exemplar",
        "prove reference implementation recipe",
        "prove reference implementation",
        "reference implementation recipe"
      ],
      knowledgeReadModels: {
        selectedKnowledge: [{
          id: "knowledge:reference-implementation-recipe-clone-boundary"
        }]
      }
    });
  });

  it("bounds compact retry fan-out when every catalog query misses", async () => {
    const knowledgeQueries: string[] = [];
    await runBrainSearchCommand({
      cwd: "/repo",
      env: {},
      now: () => "2026-07-04T02:00:00.000Z",
      createId: (prefix) => `${prefix}-1`,
      command: {
        kind: "brainSearch",
        query: "alpha beta gamma delta epsilon zeta eta theta",
        catalogFiles: ["tests/fixtures/brain-knowledge/corpus/catalog.json"],
        storeOnly: false,
        format: "json"
      },
      async runBrainRecall(runtime) {
        knowledgeQueries.push(runtime.filter.text ?? "");

        return {
          stdout: JSON.stringify({
            returnedReadModels: 0,
            totalReadModels: 0,
            readModels: [],
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

    expect(knowledgeQueries).toHaveLength(7);
    expect(knowledgeQueries[0]).toBe("alpha beta gamma delta epsilon zeta eta theta");
  });

  it("derives store-backed selected knowledge from source claims in store-backed memory search", async () => {
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
      async runBrainRecall() {
        throw new Error("store-backed memory search should not read file catalogs");
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
                claim: "Store-backed memory search should derive selected knowledge from source evidence.",
                mechanism: "Source search already returns governed SourceClaim fields.",
                krnImplication: "Memory search can surface selected knowledge without file-backed catalog readModels.",
                consumer: "IMR-00 brain knowledge",
                falsifier: "Store-backed search with governed source evidence returns empty selectedKnowledge.",
                doesNotProve: "This does not prove ranking quality.",
                expectedUse: "Use source-backed knowledge as a pre-coding knowledge gate."
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
      memoryRecallReadback: "store_backed",
      knowledgeReadModels: {
        returnedReadModels: 0,
        selectedKnowledge: [{
          id: "claim-1",
          title: "Store-backed memory search should derive selected knowledge from source evidence.",
          summary: "Memory search can surface selected knowledge without file-backed catalog readModels.",
          source: "source_search",
          reviewability: "ready",
          consumers: ["IMR-00 brain knowledge"],
          falsifier: "Store-backed search with governed source evidence returns empty selectedKnowledge.",
          doesNotProve: "This does not prove ranking quality.",
          nextAction: "use"
        }],
        doesNotProve: [
          "memory recall fixture catalog readback is unavailable in product memory search"
        ]
      },
      sourceSearch: {
        answerUsefulness: "useful",
        supportingClaims: 1,
        supportingDocuments: 1
      },
      proof: {
        proves: [
          "memory recall fixture catalog readback is unavailable in product memory search",
          "existing source-search answer package was executed for this query",
          "memory search combined both readbacks without mutating KRN state"
        ]
      }
    });
    expect(JSON.stringify(parsed)).toContain("store-backed source/search evidence");
    expect(JSON.stringify(parsed)).not.toContain("memory_store");
  });

  it("derives store-backed selected knowledge from DB MemoryRecords in store-backed memory search", async () => {
    const memoryRecord: MemoryRecord = {
      id: "memory-record-1",
      projectId: "project-1",
      key: "memory:external-review-loop",
      kind: "procedure",
      status: "active",
      summary: "Treat external review as advisory evidence after larger slices",
      body: "KRN may use external review after larger migration or authority slices, but local code and verification decide factual claims.",
      owner: "kernel-development",
      confidence: 95,
      applicationGuidance:
        "Use this memory when the task asks how to close a large KRN slice.",
      invalidationRule:
        "Invalidate when external review becomes mandatory gatekeeping again.",
      sourceLineage: [{
        sourceId: "source-claim-1",
        note: "source-claim:source-claim-1"
      }],
      isUserPreference: false,
      positiveFeedbackCount: 0,
      negativeFeedbackCount: 0,
      metadata: {
        mechanism: "External review falsifies the local done-claim after a large slice.",
        krnImplication: "Memory search should expose reviewer evidence only as advisory memory beside source-search support.",
        evidenceRefs: ["review:external-loop-1"],
        consumers: ["kernel-development", "slice-closure"],
        falsifier: "Reviewer prose overrides local verification evidence.",
        doesNotProve: "This memory does not prove Claude found every bug."
      },
      validFrom: "2026-07-04T00:00:00.000Z",
      createdAt: "2026-07-04T00:00:00.000Z",
      updatedAt: "2026-07-04T00:00:00.000Z"
    };
    const result = await runBrainSearchCommand({
      cwd: "/repo",
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => "2026-07-04T00:00:00.000Z",
      createId: (prefix) => `${prefix}-1`,
      command: {
        kind: "brainSearch",
        query: "external review after large slice",
        catalogFiles: [],
        storeOnly: true,
        projectId: "project-explicit",
        limit: 6,
        format: "json"
      },
      async createDatabaseRuntime(input: DatabaseRuntimeInput): Promise<DatabaseRuntime> {
        expect(input.databaseUrl).toBe("postgres://krn:krn@localhost:54329/krn");
        expect(input.projectSlug.trim().length).toBeGreaterThan(0);
        expect(input.projectId).toBe("project-explicit");
        expect(input.requireProjectKernelForExplicitProject).toBe(false);

        return {
          workspaceId: "workspace-1",
          projectId: "project-1",
          compilerDependencies: {} as DatabaseRuntime["compilerDependencies"],
          harnessRunRepository: {} as DatabaseRuntime["harnessRunRepository"],
          sourceRepository: {} as DatabaseRuntime["sourceRepository"],
          memoryRepository: {
            async listActiveMemory(projectId, limit, options) {
              expect(projectId).toBe("project-1");
              expect(limit).toBe(6);
              expect(options?.terms).toEqual(expect.arrayContaining(["external", "review"]));

              return [memoryRecord];
            }
          } as DatabaseRuntime["memoryRepository"],
          async close() {}
        };
      },
      async runBrainRecall() {
        throw new Error("store-backed memory search should not read file catalogs");
      },
      async runSourceSearch(runtime) {
        expect(runtime.command.projectId).toBe("project-explicit");

        return {
          stdout: JSON.stringify({
            answerPackage: {
              answerUsefulness: "useful",
              supportingClaims: [{
                sourceClaimId: "source-claim-1",
                claim: "External review can challenge larger KRN slices.",
                mechanism: "A governed source claim names mechanism, implication, consumer, and falsifier.",
                krnImplication: "Memory search should keep source support visible next to selected memory.",
                consumer: "kernel-development",
                falsifier: "The source-search packet is hidden when MemoryRecord readback succeeds.",
                doesNotProve: "This does not prove source truth."
              }],
              supportingDocuments: [],
              sourceDecisionSupport: [],
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
      memoryRecallReadback: "store_backed",
      memoryRecallQueries: ["external review after large slice"],
      knowledgeReadModels: {
        returnedReadModels: 1,
        readModelIds: ["memory-record-1"],
        selectedKnowledge: [{
          id: "memory-record-1",
          source: "memory_store",
          mechanism: "External review falsifies the local done-claim after a large slice.",
          krnImplication: "Memory search should expose reviewer evidence only as advisory memory beside source-search support.",
          reviewability: "ready",
          consumers: ["kernel-development", "slice-closure"],
          falsifier: "Reviewer prose overrides local verification evidence.",
          doesNotProve: "This memory does not prove Claude found every bug.",
          nextAction: "use"
        }, {
          id: "source-claim-1",
          source: "source_search",
          reviewability: "ready"
        }]
      },
      sourceSearch: {
        answerUsefulness: "useful",
        supportingClaims: 1
      }
    });
  });

  it("excludes store-backed knowledge with blocking usefulness feedback", async () => {
    const staleMemoryRecord: MemoryRecord = {
      id: "memory-record-stale",
      projectId: "project-1",
      key: "memory:old-frontend-standard",
      kind: "procedure",
      status: "active",
      summary: "Use the old frontend starter",
      body: "Start new frontend work from the historical starter.",
      owner: "frontend",
      confidence: 90,
      applicationGuidance:
        "Use this memory when a new frontend project starts.",
      invalidationRule:
        "Invalidate when feedback marks this starter stale.",
      sourceLineage: [{
        sourceId: "source-claim-stale",
        note: "source-claim:source-claim-stale"
      }],
      isUserPreference: false,
      positiveFeedbackCount: 0,
      negativeFeedbackCount: 0,
      metadata: {
        evidenceRefs: ["review:stale-standard"],
        consumers: ["frontend-bootstrap"],
        falsifier: "A newer starter becomes the accepted frontend baseline.",
        doesNotProve: "This memory does not prove the starter is still current."
      },
      validFrom: "2026-07-04T00:00:00.000Z",
      createdAt: "2026-07-04T00:00:00.000Z",
      updatedAt: "2026-07-04T00:00:00.000Z"
    };
    const currentMemoryRecord: MemoryRecord = {
      ...staleMemoryRecord,
      id: "memory-record-current",
      key: "memory:current-frontend-standard",
      summary: "Use the current frontend starter",
      body: "Start new frontend work from the current starter.",
      sourceLineage: [{
        sourceId: "source-claim-current",
        note: "source-claim:source-claim-current"
      }],
      metadata: {
        evidenceRefs: ["review:current-standard"],
        consumers: ["frontend-bootstrap"],
        falsifier: "The current starter stops matching new frontend tasks.",
        doesNotProve: "This memory does not prove every frontend task uses the starter."
      }
    };
    const staleFeedbackDelta: FeedbackDelta = {
      id: "feedback-delta-1",
      reviewAssessmentId: "review-assessment-1",
      status: "applied",
      memoryCandidates: [],
      sourceDecisions: [],
      evalCandidates: [],
      metadata: stampCurrentDecisionPacketAuthorityMetadata({
        knowledgeUsefulnessOutcomes: [{
          knowledgeId: "memory-record-stale",
          outcome: "stale",
          reason: "A newer frontend starter replaced this retained memory.",
          evidenceRefs: [
            "packet:brain-search-usefulness-packet",
            "feedback:frontend-starter-rotation"
          ],
          doesNotProve: "This feedback does not prove the newer starter is globally best."
        }]
      }, {
        checksum: "brain-search-usefulness-packet",
        generatedAt: "2026-07-05T00:00:00.000Z",
        sourceRunLifecycleRevision: 1
      }),
      createdAt: "2026-07-05T00:00:00.000Z",
      updatedAt: "2026-07-05T00:00:00.000Z"
    };
    const result = await runBrainSearchCommand({
      cwd: "/repo",
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => "2026-07-05T00:00:00.000Z",
      createId: (prefix) => `${prefix}-1`,
      command: {
        kind: "brainSearch",
        query: "new frontend project starter",
        catalogFiles: [],
        storeOnly: true,
        projectId: "project-explicit",
        limit: 6,
        format: "json"
      },
      async createDatabaseRuntime(): Promise<DatabaseRuntime> {
        return {
          workspaceId: "workspace-1",
          projectId: "project-1",
          compilerDependencies: {} as DatabaseRuntime["compilerDependencies"],
          harnessRunRepository: {
            async listFeedbackDeltasForSubjects(input) {
              expect(input.projectId).toBe("project-1");
              expect(input.limitPerSubject).toBe(100);
              expect(input.subjects).toEqual([
                { kind: "knowledge", id: "memory-record-stale" },
                { kind: "knowledge", id: "memory-record-current" }
              ]);

              return [staleFeedbackDelta];
            }
          } as DatabaseRuntime["harnessRunRepository"],
          sourceRepository: {} as DatabaseRuntime["sourceRepository"],
          memoryRepository: {
            async listActiveMemory(projectId, limit) {
              expect(projectId).toBe("project-1");
              expect(limit).toBe(6);

              return [staleMemoryRecord, currentMemoryRecord];
            }
          } as DatabaseRuntime["memoryRepository"],
          async close() {}
        };
      },
      async runBrainRecall() {
        throw new Error("store-backed memory search should not read file catalogs");
      },
      async runSourceSearch() {
        return {
          stdout: JSON.stringify({
            answerPackage: {
              answerUsefulness: "not_useful",
              supportingClaims: [],
              supportingDocuments: [],
              sourceDecisionSupport: [],
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
      memoryRecallReadback: "store_backed",
      knowledgeReadModels: {
        returnedReadModels: 1,
        readModelIds: ["memory-record-current"],
        selectedKnowledge: [{
          id: "memory-record-current",
          source: "memory_store"
        }]
      }
    });
    expect(JSON.stringify(parsed)).not.toContain("memory-record-stale");
  });

  it("keeps store-backed memory search resilient when DB memory readback is unavailable", async () => {
    const result = await runBrainSearchCommand({
      cwd: "/repo",
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => "2026-07-04T00:00:00.000Z",
      createId: (prefix) => `${prefix}-1`,
      command: {
        kind: "brainSearch",
        query: "configured db is unavailable",
        catalogFiles: [],
        storeOnly: true,
        format: "json"
      },
      async createDatabaseRuntime() {
        throw new Error("database unavailable");
      },
      async runBrainRecall() {
        throw new Error("store-backed memory search should not read file catalogs");
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
      memoryRecallReadback: "store_backed",
      knowledgeReadModels: {
        returnedReadModels: 0,
        selectedKnowledge: [],
        doesNotProve: [
          "memory recall fixture catalog readback is unavailable in product memory search",
          "DB memory-store readback was unavailable: database unavailable"
        ]
      }
    });
    expect(JSON.stringify(parsed)).not.toContain("memory_store");
  });

  it("classifies selected knowledge target fit without changing store-backed selection", async () => {
    const result = await runBrainSearchCommand({
      cwd: "/repo",
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => "2026-07-01T10:00:00.000Z",
      createId: (prefix) => `${prefix}-1`,
      command: {
        kind: "brainSearch",
        query: "EKOLOGUS Brain quality gate",
        catalogFiles: [],
        storeOnly: true,
        format: "json"
      },
      async runBrainRecall() {
        throw new Error("store-backed memory search should not read file catalogs");
      },
      async runSourceSearch() {
        return {
          stdout: JSON.stringify({
            answerPackage: {
              answerUsefulness: "useful",
              supportingClaims: [{
                sourceClaimId: "target-claim",
                claim: "EKOLOGUS Brain README defines the current quality gate.",
                mechanism: "A persisted second-repo README source artifact can be searched directly.",
                krnImplication: "Use target-specific source evidence before generic KRN knowledge.",
                consumer: "IMR-47 multi-repo Brain-QA",
                falsifier: "EKOLOGUS source search returns no target-specific README evidence.",
                doesNotProve: "This does not prove broad target repo readiness."
              }, {
                sourceClaimId: "generic-claim",
                claim: "Retained KRN knowledge must preserve source, mechanism, consumer, and falsifier.",
                mechanism: "Generic governance packets keep source-to-decision decisions reviewable.",
                krnImplication: "Treat this as a guardrail, not target repo evidence.",
                consumer: "knowledge application gate",
                falsifier: "A retained decision omits the falsifier field.",
                doesNotProve: "This does not prove target repo source recall."
              }, {
                sourceClaimId: "adjacent-claim",
                claim: "Graph relation source readback supports selected knowledge review.",
                mechanism: "SourceClaimEdge relation summaries expose adjacent graph evidence.",
                krnImplication: "Use as adjacent context only when target-specific evidence is absent.",
                consumer: "graph brain readback",
                falsifier: "Graph relation readback is treated as target-specific source truth.",
                doesNotProve: "This does not prove target repo source relevance."
              }],
              supportingDocuments: [{ label: "ekologus-readme" }],
              relationSupport: [],
              graphReadback: {
                claimNodes: 3,
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
      knowledgeReadModels: {
        selectedKnowledge: [
          expect.objectContaining({
            id: "target-claim",
            targetFit: "target_specific",
            targetFitReasons: ["matched distinctive query token(s): ekologus."]
          }),
          expect.objectContaining({
            id: "generic-claim",
            targetFit: "generic_guardrail",
            targetFitReasons: expect.arrayContaining([
              "no distinctive query token matched.",
              "generic guardrail token(s): consumer, falsifier, gate, guardrail, must, retained."
            ])
          }),
          expect.objectContaining({
            id: "adjacent-claim",
            targetFit: "adjacent_knowledge",
            targetFitReasons: expect.arrayContaining([
              "no distinctive query token matched."
            ])
          })
        ]
      }
    });
  });

  it("does not treat generic-only selected knowledge as target-specific sufficiency", async () => {
    const result = await runBrainSearchCommand({
      cwd: "/repo",
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => "2026-07-01T10:00:00.000Z",
      createId: (prefix) => `${prefix}-1`,
      command: {
        kind: "brainSearch",
        query: "EKOLOGUS Brain quality gate",
        catalogFiles: [],
        storeOnly: true,
        format: "json"
      },
      async runBrainRecall() {
        throw new Error("store-backed memory search should not read file catalogs");
      },
      async runSourceSearch() {
        return {
          stdout: JSON.stringify({
            answerPackage: {
              answerUsefulness: "useful",
              supportingClaims: [{
                sourceClaimId: "generic-guardrail-1",
                claim: "Retained KRN knowledge must preserve source, mechanism, consumer, and falsifier.",
                mechanism: "Generic governance packets keep source-to-decision decisions reviewable.",
                krnImplication: "Treat this as a guardrail, not target repo evidence.",
                consumer: "knowledge application gate",
                falsifier: "A retained decision omits the falsifier field.",
                doesNotProve: "This does not prove target repo source recall."
              }, {
                sourceClaimId: "generic-guardrail-2",
                claim: "KRN guardrails should keep proof boundaries visible before code changes.",
                mechanism: "Generic proof packets prevent overclaiming.",
                krnImplication: "Use this as a generic review guardrail.",
                consumer: "knowledge application gate",
                falsifier: "A future run treats proof boundaries as target evidence.",
                doesNotProve: "This does not prove EKOLOGUS source evidence."
              }],
              supportingDocuments: [{ label: "ekologus-readme" }],
              relationSupport: [],
              graphReadback: {
                claimNodes: 2,
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
      knowledgeReadModels: {
        targetFitSummary: {
          verdict: "generic_only_selected_knowledge",
          targetSpecific: 0,
          genericGuardrail: 2,
          recommendedUse:
            "Treat selectedKnowledge as generic guardrails; use target/source evidence first before considering selected knowledge sufficient.",
          doesNotProve:
            "Generic-only selectedKnowledge does not prove target-specific context was selected."
        },
        selectedKnowledge: [
          expect.objectContaining({ targetFit: "generic_guardrail" }),
          expect.objectContaining({ targetFit: "generic_guardrail" })
        ]
      },
      activationUtility: {
        verdict: "selected_knowledge_sufficient"
      },
      recommendedNextAction:
        "Treat selectedKnowledge as generic guardrails; use target/source evidence first before considering selected knowledge sufficient."
    });
  });

  it("uses ready source-backed selected knowledge when catalog search misses", async () => {
    const result = await runBrainSearchCommand({
      cwd: "/repo",
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => "2026-07-01T10:00:00.000Z",
      createId: (prefix) => `${prefix}-1`,
      command: {
        kind: "brainSearch",
        query: "activation utility source eval follow-up",
        catalogFiles: ["tests/fixtures/brain-knowledge/corpus/catalog.json"],
        storeOnly: false,
        limit: 12,
        maxInclusions: 8,
        format: "json"
      },
      async runBrainRecall() {
        return {
          stdout: JSON.stringify({
            returnedReadModels: 0,
            totalReadModels: 0,
            readModels: [],
            proof: {
              doesNotProve: ["knowledge catalog completeness"]
            }
          })
        };
      },
      async runSourceSearch() {
        return {
          stdout: JSON.stringify({
            answerPackage: {
              answerUsefulness: "useful",
              supportingClaims: [{
                label: "source_claim:190f1f72-4621-49b4-b93c-538ea2c581ef",
                subjectId: "190f1f72-4621-49b4-b93c-538ea2c581ef",
                sourceClaimId: "190f1f72-4621-49b4-b93c-538ea2c581ef",
                claim: "IMR-37 maintenance-routed activation utility candidate is accepted for manual source eval follow-up only.",
                mechanism: "Accepted maintenance review can be retained as SourceArtifact, SourceClaim, and SourceDecisionEdge follow-up evidence.",
                krnImplication: "Natural source search should surface the retained follow-up evidence before opening new acquisition work.",
                consumer: "IMR-40 natural source recall repair",
                falsifier: "A small-limit natural source search cannot include this exact retained claim.",
                doesNotProve: "This does not prove source truth, eval promotion, or product readiness.",
                expectedUse: "Use retained follow-up evidence as a source-backed knowledge gate."
              }],
              supportingDocuments: [{ label: "doc" }],
              sourceDecisionSupport: [{
                sourceDecisionEdgeId: "73e266bb-e957-4a07-aa62-fe74cb7178a0"
              }],
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
      memoryRecallReadback: "fixture_catalog",
      knowledgeReadModels: {
        returnedReadModels: 0,
        selectedKnowledge: [{
          id: "190f1f72-4621-49b4-b93c-538ea2c581ef",
          source: "source_search",
          reviewability: "ready",
          nextAction: "use"
        }]
      },
      sourceSearch: {
        answerUsefulness: "useful",
        supportingClaims: 1,
        supportingDocuments: 1,
        sourceDecisionSupport: 1
      },
      activationUtility: {
        verdict: "selected_knowledge_sufficient"
      },
      recommendedNextAction:
        "Use source-backed selected knowledge as a Knowledge Application Gate; do not treat it as file-catalog coverage."
    });
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
      async runBrainRecall() {
        throw new Error("store-backed memory search should not read file catalogs");
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
      memoryRecallReadback: "store_backed",
      knowledgeReadModels: {
        returnedReadModels: 0,
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
      async runBrainRecall() {
        throw new Error("store-backed memory search should not read file catalogs");
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
      memoryRecallReadback: "store_backed",
      knowledgeReadModels: {
        returnedReadModels: 0,
        selectedKnowledge: []
      },
      sourceSearch: {
        supportingClaims: 0,
        supportingDocuments: 0
      },
      proof: {
        proves: [
          "memory recall fixture catalog readback is unavailable in product memory search",
          "existing source-search answer package was executed for this query",
          "memory search combined both readbacks without mutating KRN state"
        ]
      }
    });
  });

  it("exposes activation utility when selected knowledge misses but linked evidence is useful", async () => {
    const result = await runBrainSearchCommand({
      cwd: "/repo",
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => "2026-07-01T10:00:00.000Z",
      createId: (prefix) => `${prefix}-1`,
      command: {
        kind: "brainSearch",
        query: "Towards Autonomous Memory Agents semantic-aware Thompson sampling",
        catalogFiles: ["tests/fixtures/brain-knowledge/corpus/catalog.json"],
        storeOnly: false,
        limit: 12,
        maxInclusions: 8,
        format: "json"
      },
      async runBrainRecall() {
        return {
          stdout: JSON.stringify({
            returnedReadModels: 0,
            totalReadModels: 0,
            readModels: [],
            proof: {
              doesNotProve: ["knowledge catalog completeness"]
            }
          })
        };
      },
      async runSourceSearch() {
        return {
          stdout: JSON.stringify({
            answerPackage: {
              answerUsefulness: "partly_useful_missing_document",
              supportingClaims: Array.from({ length: 8 }, (_, index) => ({
                label: `claim-${index + 1}`
              })),
              supportingDocuments: [],
              sourceClaimDocumentLinks: Array.from({ length: 8 }, (_, index) => ({
                sourceClaimId: `claim-${index + 1}`,
                linkedSearchDocumentCount: 1,
                linkedSearchDocumentIds: [`doc-${index + 1}`],
                caveat: "SourceClaim has artifact-linked SearchDocument rows, but lexical source search did not include them."
              })),
              relationSupport: Array.from({ length: 6 }, (_, index) => ({
                edgeId: `edge-${index + 1}`
              })),
              graphReadback: {
                claimNodes: 8,
                relationEdges: 6,
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

    expect(parsed).toMatchObject({
      knowledgeReadModels: {
        selectedKnowledge: []
      },
      sourceSearch: {
        answerUsefulness: "partly_useful_missing_document",
        supportingClaims: 8,
        supportingDocuments: 0,
        sourceClaimDocumentLinks: 8,
        linkedSearchDocuments: 8,
        relationSupport: 6
      },
      activationUtility: {
        selectedKnowledge: {
          signal: "selected_knowledge",
          strength: "missing",
          reasons: ["selectedKnowledge returned no packets."]
        },
        sourceLinkGraph: {
          signal: "source_link_graph",
          strength: "useful",
          reasons: [
            "answerUsefulness is partly_useful_missing_document.",
            "source/link/graph evidence count is 30."
          ]
        },
        verdict: "linked_evidence_exploration_candidate",
        recommendedNextAction:
          "Review linked source/graph evidence as exploration context before treating missing selected knowledge as low utility; do not change production ranking without a bounded eval.",
        doesNotProve:
          "Activation utility lab readback does not prove source truth, ranking quality, semantic-aware Thompson sampling, or product readiness."
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
      async runBrainRecall() {
        throw new Error("store-backed memory search should not read file catalogs");
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
    expect(result.stdout).toContain("Activation utility:");
    expect(result.stdout).toContain("targetFit:");
    expect(result.stdout).toContain("selectedKnowledge: useful");
    expect(result.stdout).toContain("sourceLinkGraph: useful");
  });

  it("contrasts weak baseline with source-grounded useful brain context", async () => {
    const baseline = await runBrainSearchCommand({
      cwd: "/repo",
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => "2026-07-04T14:00:00.000Z",
      createId: (prefix) => `${prefix}-baseline`,
      command: {
        kind: "brainSearch",
        query: "maintenance boundary maintenance contract",
        catalogFiles: [],
        storeOnly: false,
        limit: 4,
        maxInclusions: 2,
        format: "json"
      },
      async runBrainRecall() {
        return {
          stdout: JSON.stringify({
            kind: "krn.memory.recall.readback.v1",
            returnedReadModels: 0,
            totalReadModels: 0,
            readModels: [],
            proof: {
              doesNotProve: ["knowledge catalog completeness"]
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
              sourceClaimDocumentLinks: [],
              relationSupport: [],
              sourceDecisionSupport: [],
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
    const sourceGrounded = await runBrainSearchCommand({
      cwd: "/repo",
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => "2026-07-04T14:00:00.000Z",
      createId: (prefix) => `${prefix}-source-grounded`,
      command: {
        kind: "brainSearch",
        query: "maintenance boundary maintenance contract",
        catalogFiles: [],
        storeOnly: false,
        limit: 4,
        maxInclusions: 2,
        format: "json"
      },
      async runBrainRecall() {
        return {
          stdout: JSON.stringify({
            kind: "krn.memory.recall.readback.v1",
            returnedReadModels: 0,
            totalReadModels: 0,
            readModels: [],
            proof: {
              doesNotProve: ["knowledge catalog completeness"]
            }
          })
        };
      },
      async runSourceSearch() {
        return {
          stdout: JSON.stringify({
            answerPackage: {
              answerUsefulness: "useful",
              supportingClaims: [{
                label: "source_claim:worker-boundary",
                sourceClaimId: "worker-boundary",
                claim: "Maintenance preview exposes maintenance candidates, not Codex execution.",
                mechanism: "Maintenance previews surface reviewable maintenance work without mutating Memory Core.",
                krnImplication: "Worker guidance should block executor/runtime claims until plnv is resolved.",
                consumer: "worker package decision",
                falsifier: "Brain readback claims maintenance preview executes scheduled jobs.",
                doesNotProve: "This does not prove maintenance runtime behavior."
              }],
              supportingDocuments: [{
                label: "search_document:worker-boundary"
              }],
              sourceClaimDocumentLinks: [],
              relationSupport: [],
              sourceDecisionSupport: [{
                sourceDecisionEdgeId: "decision-edge-worker-boundary",
                sourceClaimId: "worker-boundary",
                confidence: "high"
              }],
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
              doesNotProve: ["source truth", "maintenance runtime behavior"]
            }
          })
        };
      }
    });
    const baselineJson: unknown = JSON.parse(baseline.stdout);
    const sourceGroundedJson: unknown = JSON.parse(sourceGrounded.stdout);

    expect(baselineJson).toMatchObject({
      knowledgeReadModels: {
        selectedKnowledge: []
      },
      sourceSearch: {
        answerUsefulness: "not_useful",
        missingEvidence: ["governed SourceClaim evidence"]
      },
      recommendedNextAction:
        "Do not infer product truth from store-backed memory search; seed or persist governed source evidence first."
    });
    expect(sourceGroundedJson).toMatchObject({
      knowledgeReadModels: {
        selectedKnowledge: [{
          id: "worker-boundary",
          source: "source_search",
          reviewability: "ready",
          nextAction: "use"
        }]
      },
      sourceSearch: {
        answerUsefulness: "useful",
        supportingClaims: 1,
        supportingDocuments: 1,
        sourceDecisionSupport: 1,
        missingEvidence: []
      },
      recommendedNextAction:
        "Use the store-backed source/search evidence cautiously; use fixture-catalog memory search only for explicit test/import readbacks."
    });
  });

  it("keeps the fixed brain grounding mini-gate source-backed and decision-linked", async () => {
    const cases = [
      {
        query: "workers are candidate maintenance contracts not codex exec",
        claimId: "claim-workers-boundary",
        claim: "Maintenance preview exposes candidate maintenance contracts, not Codex execution.",
        mechanism: "Maintenance previews produce candidate-only maintenance work and do not execute code.",
        krnImplication: "Brain answers about workers must not imply runtime enforcement before plnv.",
        consumer: "maintenance boundary planning",
        falsifier: "A worker answer claims scheduler or executor behavior without plnv."
      },
      {
        query: "naming standard no vanity rename helper extraction rule",
        claimId: "claim-naming-boundary",
        claim: "KRN naming changes require evidence and must not become vanity sweeps.",
        mechanism: "The code vocabulary standard accepts renames only when they reduce review cost or reveal authority boundaries.",
        krnImplication: "Brain answers about naming should preserve the anti-vanity gate.",
        consumer: "naming-standard implementation",
        falsifier: "A naming task renames broadly without evidence_ref and rollback risk."
      },
      {
        query: "source-to-decision retention gate consumer falsifier",
        claimId: "claim-source-decision",
        claim: "Retained sources must map source to mechanism, KRN implication, decision, consumer, and falsifier.",
        mechanism: "The source-to-decision gate rejects decorative sources without consumers and falsifiers.",
        krnImplication: "Brain answers should cite governed source decisions before treating external material as useful.",
        consumer: "knowledge intake",
        falsifier: "A retained source is used in a slice without a consumer or falsifier."
      },
      {
        query: "typescript boundary unknown first result state",
        claimId: "claim-ts-boundary",
        claim: "External TypeScript inputs stay unknown until a parser or guard narrows them.",
        mechanism: "Unknown-first readback keeps JSON/env/file boundaries from becoming trusted domain objects.",
        krnImplication: "Brain answers about TypeScript repairs should route through parser evidence, not casts.",
        consumer: "TypeScript boundary repair",
        falsifier: "A JSON boundary repair adds unchecked casts instead of parser narrowing."
      }
    ] as const;

    for (const entry of cases) {
      const result = await runBrainSearchCommand({
        cwd: "/repo",
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        now: () => "2026-07-04T12:00:00.000Z",
        createId: (prefix) => `${prefix}-1`,
        command: {
          kind: "brainSearch",
          query: entry.query,
          catalogFiles: [],
          storeOnly: true,
          limit: 8,
          maxInclusions: 4,
          format: "json"
        },
        async runBrainRecall() {
          throw new Error("grounding mini-gate should use store/source evidence");
        },
        async runSourceSearch(runtime) {
          expect(runtime.command.query).toBe(entry.query);

          return {
            stdout: JSON.stringify({
              answerPackage: {
                answerUsefulness: "useful",
                supportingClaims: [{
                  label: `source_claim:${entry.claimId}`,
                  subjectId: entry.claimId,
                  sourceClaimId: entry.claimId,
                  claim: entry.claim,
                  mechanism: entry.mechanism,
                  krnImplication: entry.krnImplication,
                  consumer: entry.consumer,
                  falsifier: entry.falsifier,
                  doesNotProve: "This does not prove broad brain quality.",
                  sourceDecisionSupportState: "linked"
                }],
                supportingDocuments: [{
                  label: `search_document:${entry.claimId}`,
                  title: `${entry.claimId} source document`
                }],
                sourceDecisionSupport: [{
                  sourceDecisionEdgeId: `decision-edge-${entry.claimId}`,
                  sourceClaimId: entry.claimId,
                  confidence: "high"
                }],
                sourceClaimDocumentLinks: [{
                  sourceClaimId: entry.claimId,
                  linkedSearchDocumentCount: 1,
                  linkedSearchDocumentIds: [`doc-${entry.claimId}`],
                  linkKinds: ["same_source_artifact"]
                }],
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
                doesNotProve: ["source truth", "broad brain quality"]
              }
            })
          };
        }
      });
      const parsed: unknown = JSON.parse(result.stdout);

      expect(parsed).toMatchObject({
        query: entry.query,
        memoryRecallReadback: "store_backed",
        knowledgeReadModels: {
          selectedKnowledge: [{
            id: entry.claimId,
            source: "source_search",
            reviewability: "ready",
            nextAction: "use"
          }]
        },
        sourceSearch: {
          answerUsefulness: "useful",
          supportingClaims: 1,
          supportingDocuments: 1,
          sourceDecisionSupport: 1,
          sourceClaimDocumentLinks: 1,
          missingEvidence: []
        }
      });
      expect(JSON.stringify(parsed)).toContain("memory search combined both readbacks without mutating KRN state");
      expect(JSON.stringify(parsed)).not.toContain("governed SourceClaim evidence");
    }
  });
});
