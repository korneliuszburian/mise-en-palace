import { describe, expect, it } from "vitest";
import type {
  AntiMemoryRecord,
  MemoryRecord,
  ObservationItem,
  SourceClaim,
  SourceDecisionEdge,
  SourceClaimEdge,
  TaskContract
} from "@krn/core";
import type {
  SearchDocumentSearchResult
} from "../../repositories/types.js";
import {
  selectObservationPrefix
} from "../../observations/observation-prefix.js";

import {
  applyContextROI,
  applySourceClaimEdgeInfluence,
  applySourceClaimEdgeRankDown,
  applyActivationFilters,
  applyTemporalFilter,
  applyTrustFilter,
  assembleContext,
  buildActivationUtilityLabReadback,
  buildRelationGroundedQaReadback,
  buildActivationRawRecallTriggers,
  buildActivationQuery,
  buildMemoryQuery,
  buildSourceQuery,
  detectConflicts,
  mergeActivationCandidates,
  rankCandidates,
  retrieveActivationCandidates,
  toMemoryCandidate,
  toSearchCandidate,
  toSourceClaimCandidate
} from "../index.js";

const now = "2026-06-21T12:00:00.000Z";

const task: TaskContract = {
  id: "task-1",
  operatorIntentId: "intent-1",
  projectId: "project-1",
  title: "Improve KRN doctor brain store readiness",
  objective: "Make doctor report Postgres memory and source graph readiness",
  constraints: ["no dashboard", "no runtime markdown memory"],
  nonGoals: ["do not add a benchmark lane"],
  acceptance: ["doctor output identifies missing Postgres configuration"],
  status: "active",
  metadata: {},
  createdAt: now,
  updatedAt: now
};

const memoryRecord = (overrides: Partial<MemoryRecord>): MemoryRecord => ({
  id: "memory-1",
  projectId: "project-1",
  key: "brain-store",
  kind: "constraint",
  status: "active",
  summary: "Brain store is PostgreSQL plus pgvector",
  body: "KRN memory and source graph readiness depends on the Postgres brain store.",
  owner: "kernel",
  confidence: 95,
  applicationGuidance: "Use when doctor checks persistence readiness.",
  sourceLineage: [{ sourceId: "adr-0010" }],
  isUserPreference: false,
  positiveFeedbackCount: 0,
  negativeFeedbackCount: 0,
  metadata: {},
  validFrom: "2026-06-01T00:00:00.000Z",
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
  ...overrides
});

const sourceClaim = (overrides: Partial<SourceClaim>): SourceClaim => ({
  id: "claim-1",
  sourceArtifactId: "artifact-1",
  claim: "Doctor must report brain-store readiness honestly.",
  mechanism: "Readiness checks compare expected Postgres state with configured runtime state.",
  krnImplication: "Doctor cannot imply memory exists before a configured Postgres store exists.",
  doesNotProve: "The exact production deployment posture is correct.",
  trustTier: "high",
  supportType: "supports",
  consumer: "activation-engine-test",
  status: "accepted",
  metadata: {},
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
  ...overrides
});

const sourceDecisionEdge = (
  overrides: Partial<SourceDecisionEdge>
): SourceDecisionEdge => ({
  id: "source-decision-edge-1",
  sourceClaimId: "claim-1",
  targetType: "task_contract",
  targetId: "task-1",
  supportType: "implementation-boundary",
  confidence: "high",
  notes: "Decision edge supports activation authority for this test claim.",
  metadata: {},
  createdAt: now,
  ...overrides
});

const antiMemoryRecord = (overrides: Partial<AntiMemoryRecord>): AntiMemoryRecord => ({
  id: "anti-memory-1",
  projectId: "project-1",
  key: "anti:brain-store",
  rejectedClaim: "Brain store guidance should use dashboard markdown as runtime memory.",
  reason: "Runtime memory must be store-backed.",
  invalidatedBySourceClaimIds: [],
  appliesTo: "brain-store",
  summary: "Block stale brain-store memory",
  body: "Do not activate memory matching the stale brain-store key.",
  owner: "operator",
  confidence: 90,
  sourceLineage: [{ sourceId: "source-claim-1" }],
  metadata: {},
  validFrom: now,
  createdAt: now,
  updatedAt: now,
  ...overrides
});

const observation = (
  overrides: Partial<ObservationItem>
): ObservationItem => ({
  id: "observation-1",
  groupId: "observation-group-1",
  scope: {
    projectId: "project-1",
    taskContractId: "task-1"
  },
  kind: "fact",
  status: "candidate",
  priority: "high",
  confidence: "high",
  provenanceKind: "run_event",
  subject: "doctor brain store readiness",
  summary: "Doctor readiness observations are source-ranged.",
  body: "Observation prefix should remain a small source-ranged activation artifact.",
  temporalScope: {
    observedAt: now,
    ingestedAt: now,
    validFrom: now
  },
  sourceRanges: [{
    id: "range-1",
    sourceType: "run_event",
    sourceId: "run-event-1",
    locator: "run_events.sequence:1",
    capturedAt: now
  }],
  entityLinks: [],
  claimLinks: [],
  metadata: {},
  createdAt: now,
  updatedAt: now,
  ...overrides
});

const searchDocument = (
  overrides: Partial<SearchDocumentSearchResult>
): SearchDocumentSearchResult => ({
  id: "search-document-1",
  projectId: "project-1",
  subjectType: "source_claim",
  subjectId: "source-claim-1",
  sourceClaimId: "source-claim-1",
  trustTier: "project-decision",
  validityStatus: "active",
  language: "en",
  title: "Source graph crawler guidance",
  body: "Crawler guidance was rejected by anti-memory.",
  searchText: "source graph crawler guidance",
  metadataFilters: {},
  validFrom: now,
  metadata: {},
  createdAt: now,
  updatedAt: now,
  lexicalScore: 50,
  ...overrides
});

describe("activation engine", () => {
  it("builds a unified activation query model from task scope, needs, budget, and risk", () => {
    const query = buildActivationQuery(task, {
      focus: "mixed",
      needs: ["memory", "source", "observation"],
      budget: {
        maxItems: 4,
        maxTokens: 900,
        reserveTokens: 120
      },
      risk: "high",
      extraTerms: ["pgvector", "source-health"]
    });

    expect(query).toMatchObject({
      taskContractId: "task-1",
      projectId: "project-1",
      focus: "mixed",
      needs: ["memory", "source", "observation"],
      scope: {
        taskContractId: "task-1",
        projectId: "project-1"
      },
      budget: {
        maxItems: 4,
        maxTokens: 900,
        reserveTokens: 120
      },
      risk: "high"
    });
    expect(query.terms).toEqual(expect.arrayContaining([
      "doctor",
      "brain",
      "store",
      "readiness",
      "pgvector",
      "source",
      "health"
    ]));
  });

  it("merges duplicate source candidates across source and search channels", () => {
    const query = buildSourceQuery(task);
    const source = toSourceClaimCandidate(
      sourceClaim({
        id: "claim-duplicate",
        claim: "Doctor brain store readiness must use Postgres source graph evidence."
      })
    );
    const search = toSearchCandidate(
      searchDocument({
        id: "search-duplicate",
        subjectType: "source_claim",
        subjectId: "claim-duplicate",
        sourceClaimId: "claim-duplicate",
        title: "Postgres source graph evidence",
        body: "Doctor readiness source graph evidence for Postgres.",
        lexicalScore: 70,
        graphScore: 15
      })
    );

    const merged = mergeActivationCandidates(
      rankCandidates([source, search], query)
    );

    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({
      subjectType: "source_claim",
      subjectId: "claim-duplicate",
      graphScore: 15,
      searchDocumentIds: ["search-duplicate"]
    });
    expect(merged[0]?.lexicalScore).toBeGreaterThanOrEqual(70);
    expect(merged[0]?.metadata).toMatchObject({
      mergedCandidateIds: expect.arrayContaining(["claim-duplicate", "search-duplicate"]),
      mergedKinds: expect.arrayContaining(["source", "search"])
    });
    expect(merged[0]?.metadata["searchDocumentIds"]).toBeUndefined();
  });

  it("preserves embedding model provenance on search activation candidates", () => {
    const search = toSearchCandidate(
      searchDocument({
        vectorScore: 80,
        embeddingModel: {
          embeddingModelId: "embedding-model-1",
          provider: "local-smoke",
          model: "smoke-1536",
          dimensions: 1536
        }
      })
    );

    expect(search.metadata).toMatchObject({
      embeddingModel: {
        embeddingModelId: "embedding-model-1",
        provider: "local-smoke",
        model: "smoke-1536",
        dimensions: 1536
      }
    });
  });

  it("carries source taxonomy projections from SourceClaim into activation context", () => {
    const query = buildSourceQuery(task);
    const source = toSourceClaimCandidate(sourceClaim({
      id: "claim-taxonomy",
      trustTier: "source-code",
      supportType: "implementation-boundary"
    }));
    const [ranked] = rankCandidates([source], query);

    expect(ranked).toMatchObject({
      sourceAuthorityRank: "high",
      sourceKind: "source-code",
      sourceSupportRelation: "not_applicable",
      sourceUse: "implementation-boundary",
      metadata: {
        authorityRank: "high",
        sourceKind: "source-code",
        supportRelation: "not_applicable",
        sourceUse: "implementation-boundary",
        decisionGrade: true
      }
    });

    const context = assembleContext({
      id: "context-taxonomy",
      harnessPlanId: "plan-1",
      candidates: ranked === undefined ? [] : [ranked],
      tokenBudget: 200,
      createdAt: now
    });

    expect(context.inclusions).toEqual([
      expect.objectContaining({
        subjectType: "source_claim",
        subjectId: "claim-taxonomy",
        trustTier: "source-code",
        sourceAuthorityRank: "high",
        sourceKind: "source-code",
        sourceSupportRelation: "not_applicable",
        sourceUse: "implementation-boundary"
      })
    ]);
  });

  it("represents SourceClaimEdge influence as bounded graph-aware source candidate input", () => {
    const query = buildSourceQuery({
      ...task,
      objective: "Use edge-aware source claim context for graph brain readback"
    });
    const seedSourceClaim = sourceClaim({
      id: "claim-seed",
      claim: "KRN should expose SourceClaimEdge readback before graph ranking.",
      krnImplication: "Use direct edge readback before production graph retrieval."
    });
    const connectedSourceClaim = sourceClaim({
      id: "claim-connected",
      claim: "Connected source claims can influence graph-aware activation input.",
      mechanism: "A SourceClaimEdge links the seed claim to the connected claim.",
      krnImplication: "Represent edge-connected context as graphScore input in a bounded lab."
    });
    const disconnectedSourceClaim = sourceClaim({
      id: "claim-disconnected",
      claim: "Disconnected claims should not receive graph influence.",
      mechanism: "There is no SourceClaimEdge from the seed to this claim."
    });
    const edge: SourceClaimEdge = {
      id: "edge-1",
      fromSourceClaimId: seedSourceClaim.id,
      toSourceClaimId: connectedSourceClaim.id,
      kind: "narrows",
      metadata: {
        consumer: "V330 edge-aware ranking lab",
        doesNotProve: "This edge does not prove graph retrieval quality."
      },
      createdAt: now
    };

    const influenced = applySourceClaimEdgeInfluence([
      toSourceClaimCandidate(seedSourceClaim),
      toSourceClaimCandidate(connectedSourceClaim),
      toSourceClaimCandidate(disconnectedSourceClaim)
    ], {
      edges: [edge],
      seedSourceClaimIds: [seedSourceClaim.id],
      graphScore: 12
    });
    const ranked = rankCandidates(influenced, query);
    const connected = ranked.find((candidate) => candidate.subjectId === connectedSourceClaim.id);
    const disconnected = ranked.find((candidate) => candidate.subjectId === disconnectedSourceClaim.id);

    expect(connected).toMatchObject({
      subjectType: "source_claim",
      subjectId: "claim-connected",
      graphScore: 9
    });
    expect(connected?.reason).toContain("Edge-aware source graph context: narrows.");
    expect(connected?.expectedUse).toContain("Review with connected SourceClaimEdge context");
    expect(connected?.metadata).toMatchObject({
      sourceClaimEdgeInfluence: {
        edgeIds: ["edge-1"],
        edgeKinds: ["narrows"],
        seedSourceClaimIds: ["claim-seed"],
        doesNotProve: "SourceClaimEdge influence does not prove source truth, edge correctness, ranking quality, or product graph retrieval quality."
      }
    });
    expect(disconnected?.graphScore).toBe(0);
    expect(disconnected?.metadata).not.toHaveProperty("sourceClaimEdgeInfluence");
  });

  it("proves SourceClaimEdge influence can change bounded selection against a no-edge baseline", () => {
    const query = buildSourceQuery({
      ...task,
      objective: "Use edge-aware source claim context for graph brain selection delta"
    });
    const seedSourceClaim = sourceClaim({
      id: "claim-seed",
      claim: "Graph brain v0 should keep SourceClaimEdge relations reviewable.",
      krnImplication: "Use edge-aware source context only with a proof boundary."
    });
    const edgeConnectedSourceClaim = sourceClaim({
      id: "claim-edge-connected",
      claim: "Edge-adjacent source context should be selected when a reviewed SourceClaimEdge makes it relevant.",
      mechanism: "A SourceClaimEdge connects this lower-lexical claim to the selected graph-brain seed.",
      krnImplication: "Prefer edge-adjacent source context when it changes bounded selection with reviewable metadata."
    });
    const lexicalOnlySourceClaim = sourceClaim({
      id: "claim-lexical-only",
      claim: "Lexical graph brain context is useful but has no SourceClaimEdge support.",
      mechanism: "It matches task terms without a reviewed source relation.",
      krnImplication: "Use as the no-edge baseline competitor."
    });
    const edge: SourceClaimEdge = {
      id: "edge-selection-delta",
      fromSourceClaimId: seedSourceClaim.id,
      toSourceClaimId: edgeConnectedSourceClaim.id,
      kind: "supports",
      metadata: {
        consumer: "V334 edge-aware activation selection delta proof",
        doesNotProve: "This edge does not prove graph retrieval quality."
      },
      createdAt: now
    };
    const baselineRanked = rankCandidates([
      {
        ...toSourceClaimCandidate(seedSourceClaim),
        lexicalScore: 5
      },
      {
        ...toSourceClaimCandidate(edgeConnectedSourceClaim),
        lexicalScore: 20
      },
      {
        ...toSourceClaimCandidate(lexicalOnlySourceClaim),
        lexicalScore: 35
      }
    ], query);
    const baselineContext = assembleContext({
      id: "context-no-edge",
      harnessPlanId: "plan-1",
      candidates: applyContextROI(baselineRanked, { maxInclusions: 1 }),
      createdAt: now
    });
    const edgeAwareRanked = rankCandidates(
      applySourceClaimEdgeInfluence([
        {
          ...toSourceClaimCandidate(seedSourceClaim),
          lexicalScore: 5
        },
        {
          ...toSourceClaimCandidate(edgeConnectedSourceClaim),
          lexicalScore: 20
        },
        {
          ...toSourceClaimCandidate(lexicalOnlySourceClaim),
          lexicalScore: 35
        }
      ], {
        edges: [edge],
        seedSourceClaimIds: [seedSourceClaim.id],
        graphScore: 30
      }),
      query
    );
    const edgeAwareContext = assembleContext({
      id: "context-edge-aware",
      harnessPlanId: "plan-1",
      candidates: applyContextROI(edgeAwareRanked, { maxInclusions: 1 }),
      createdAt: now
    });

    expect(baselineContext.inclusions.map((item) => item.subjectId)).toEqual([
      "claim-lexical-only"
    ]);
    expect(baselineContext.exclusions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        subjectId: "claim-edge-connected",
        reason: "over_budget"
      })
    ]));
    expect(edgeAwareContext.inclusions.map((item) => item.subjectId)).toEqual([
      "claim-edge-connected"
    ]);
    expect(edgeAwareContext.exclusions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        subjectId: "claim-lexical-only",
        reason: "over_budget"
      })
    ]));
    expect(edgeAwareRanked.find((candidate) =>
      candidate.subjectId === "claim-edge-connected"
    )).toMatchObject({
      graphScore: 30,
      metadata: {
        sourceClaimEdgeInfluence: {
          edgeIds: ["edge-selection-delta"],
          edgeKinds: ["supports"],
          seedSourceClaimIds: ["claim-seed"],
          doesNotProve: "SourceClaimEdge influence does not prove source truth, edge correctness, ranking quality, or product graph retrieval quality."
        }
      }
    });
  });

  it("ranks down source claims invalidated by accepted source graph edges", () => {
    const activeClaim = sourceClaim({
      id: "claim-active-invalidator",
      claim: "Current source graph evidence invalidates the stale KRN crawler claim.",
      mechanism: "An accepted SourceClaimEdge can mark a connected claim stale.",
      krnImplication: "Prefer the current graph evidence over stale accepted claims."
    });
    const staleClaim = sourceClaim({
      id: "claim-stale-invalidated",
      claim: "KRN should build a crawler before proving source-search readback.",
      mechanism: "This older claim matched query terms before the graph relation existed.",
      krnImplication: "This should rank below the accepted invalidating claim."
    });
    const proposedInvalidator = sourceClaim({
      id: "claim-proposed-invalidator",
      claim: "A proposed invalidator should not change source ranking.",
      mechanism: "Proposed claims are review candidates, not authority.",
      krnImplication: "Do not let proposed graph edges demote accepted source claims.",
      status: "proposed"
    });
    const invalidatesEdge: SourceClaimEdge = {
      id: "edge-invalidates-stale",
      fromSourceClaimId: activeClaim.id,
      toSourceClaimId: staleClaim.id,
      kind: "invalidates",
      metadata: {
        consumer: "source graph ranking",
        doesNotProve: "This edge does not prove source truth."
      },
      createdAt: now
    };
    const proposedEdge: SourceClaimEdge = {
      id: "edge-proposed-invalidates-active",
      fromSourceClaimId: proposedInvalidator.id,
      toSourceClaimId: activeClaim.id,
      kind: "invalidates",
      metadata: {
        consumer: "source graph ranking",
        doesNotProve: "This edge does not prove source truth."
      },
      createdAt: now
    };
    const ranked = rankCandidates(
      applySourceClaimEdgeRankDown([
        {
          ...toSourceClaimCandidate(activeClaim),
          lexicalScore: 40
        },
        {
          ...toSourceClaimCandidate(staleClaim),
          lexicalScore: 45
        },
        {
          ...toSourceClaimCandidate(proposedInvalidator),
          lexicalScore: 50
        }
      ], {
        edges: [
          invalidatesEdge,
          proposedEdge
        ],
        sourceClaims: [
          activeClaim,
          staleClaim,
          proposedInvalidator
        ],
        graphPenalty: 30
      }),
      buildSourceQuery(task)
    );
    const activeRank = ranked.find((candidate) => candidate.subjectId === activeClaim.id);
    const staleRank = ranked.find((candidate) => candidate.subjectId === staleClaim.id);

    expect(activeRank?.graphScore).toBe(0);
    expect(staleRank).toMatchObject({
      graphScore: -30,
      metadata: {
        sourceClaimEdgeRankDown: {
          edgeIds: ["edge-invalidates-stale"],
          edgeKinds: ["invalidates"],
          governingSourceClaimIds: ["claim-active-invalidator"],
          graphPenalty: 30
        }
      }
    });
    expect(ranked.map((candidate) => candidate.subjectId).indexOf(activeClaim.id)).toBeLessThan(
      ranked.map((candidate) => candidate.subjectId).indexOf(staleClaim.id)
    );
  });

  it("uses edge-selected source context to ground a tiny graph-brain QA answer", () => {
    const query = buildSourceQuery({
      ...task,
      objective: "Answer which related source claim grounds the small graph brain QA case"
    });
    const seedSourceClaim = sourceClaim({
      id: "claim-qa-seed",
      claim: "Graph-brain QA should answer from source relations only when the relation is explicit.",
      mechanism: "The seed claim states the question boundary but does not contain the answer.",
      krnImplication: "Use it as the reviewed source relation seed for a tiny QA case."
    });
    const answerSourceClaim = sourceClaim({
      id: "claim-qa-answer",
      claim: "The answer grounding claim is the edge-connected SourceClaimEdge target.",
      mechanism: "A reviewed SourceClaimEdge links the graph-brain QA seed to this answer claim.",
      krnImplication: "Use this relation-selected source claim to ground the small QA answer."
    });
    const lexicalOnlySourceClaim = sourceClaim({
      id: "claim-qa-lexical-only",
      claim: "Small graph-brain QA remains bounded and should not become a graph platform.",
      mechanism: "This claim matches graph-brain QA task terms but has no relation to the answer seed.",
      krnImplication: "Use as the no-relation baseline competitor."
    });
    const edge: SourceClaimEdge = {
      id: "edge-qa-answer",
      fromSourceClaimId: seedSourceClaim.id,
      toSourceClaimId: answerSourceClaim.id,
      kind: "duplicates",
      metadata: {
        consumer: "GRE-01 relation focus graph QA case",
        doesNotProve: "This edge does not prove duplicate truth or graph QA quality."
      },
      createdAt: now
    };
    const baselineRanked = rankCandidates([
      {
        ...toSourceClaimCandidate(seedSourceClaim),
        lexicalScore: 5
      },
      {
        ...toSourceClaimCandidate(answerSourceClaim),
        lexicalScore: 15
      },
      {
        ...toSourceClaimCandidate(lexicalOnlySourceClaim),
        lexicalScore: 35
      }
    ], query);
    const baselineContext = assembleContext({
      id: "context-qa-no-edge",
      harnessPlanId: "plan-1",
      candidates: applyContextROI(baselineRanked, { maxInclusions: 1 }),
      createdAt: now
    });
    const edgeAwareRanked = rankCandidates(
      applySourceClaimEdgeInfluence([
        {
          ...toSourceClaimCandidate(seedSourceClaim),
          lexicalScore: 5
        },
        {
          ...toSourceClaimCandidate(answerSourceClaim),
          lexicalScore: 15
        },
        {
          ...toSourceClaimCandidate(lexicalOnlySourceClaim),
          lexicalScore: 35
        }
      ], {
        edges: [edge],
        seedSourceClaimIds: [seedSourceClaim.id],
        graphScore: 30
      }),
      query
    );
    const edgeAwareContext = assembleContext({
      id: "context-qa-edge-aware",
      harnessPlanId: "plan-1",
      candidates: applyContextROI(edgeAwareRanked, { maxInclusions: 1 }),
      createdAt: now
    });
    const readback = buildRelationGroundedQaReadback({
      baselineContext,
      edgeAwareContext,
      sourceClaims: [seedSourceClaim, answerSourceClaim, lexicalOnlySourceClaim],
      answerSourceClaimId: answerSourceClaim.id,
      relationReview: {
        sourceClaimEdgeId: edge.id,
        edgeKind: edge.kind,
        relationReviewFocus: "duplicate",
        relationReviewQuestion:
          "Review whether these claims are true duplicates before consolidation, suppression, or source truth changes."
      }
    });

    expect(baselineContext.inclusions.map((item) => item.subjectId)).toEqual([
      "claim-qa-lexical-only"
    ]);
    expect(edgeAwareContext.inclusions.map((item) => item.subjectId)).toEqual([
      "claim-qa-answer"
    ]);
    expect(readback).toMatchObject({
      baseline: {
        verdict: "insufficient",
        reviewUsefulness: "weak",
        includedSourceClaimIds: ["claim-qa-lexical-only"],
        usedSourceClaimIds: []
      },
      edgeAware: {
        verdict: "grounded",
        answer: "The answer grounding claim is the edge-connected SourceClaimEdge target.",
        reviewUsefulness: "improved",
        includedSourceClaimIds: ["claim-qa-answer"],
        usedSourceClaimIds: ["claim-qa-answer"]
      },
      relationReview: {
        sourceClaimEdgeId: "edge-qa-answer",
        edgeKind: "duplicates",
        relationReviewFocus: "duplicate",
        relationReviewQuestion:
          "Review whether these claims are true duplicates before consolidation, suppression, or source truth changes.",
        consumedBy: "relation_grounded_qa_readback",
        reviewUsefulness: "used",
        doesNotProve:
          "Relation review focus consumption does not prove source truth, edge correctness, contradiction resolution, duplicate consolidation, or production graph QA quality."
      },
      outcome: "improved",
      doesNotProve: "Relation-grounded QA readback does not prove source truth, edge correctness, production graph retrieval quality, corpus-scale graph QA, or product readiness."
    });
    expect(edgeAwareRanked.find((candidate) =>
      candidate.subjectId === "claim-qa-answer"
    )).toMatchObject({
      graphScore: 23,
      metadata: {
        sourceClaimEdgeInfluence: {
          edgeIds: ["edge-qa-answer"],
          edgeKinds: ["duplicates"],
          seedSourceClaimIds: ["claim-qa-seed"],
          doesNotProve: "SourceClaimEdge influence does not prove source truth, edge correctness, ranking quality, or product graph retrieval quality."
        }
      }
    });
  });

  it("applies SourceClaimEdge influence during activation retrieval without duplicate candidates", async () => {
    const seedSourceClaim = sourceClaim({
      id: "claim-seed",
      claim: "KRN should expose SourceClaimEdge readback before graph ranking.",
      krnImplication: "Use direct edge readback before production graph retrieval."
    });
    const connectedSourceClaim = sourceClaim({
      id: "claim-connected",
      claim: "Connected source claims can influence graph-aware activation input.",
      mechanism: "A SourceClaimEdge links the seed claim to the connected claim.",
      krnImplication: "Represent edge-connected context as graphScore input without duplicate rows."
    });
    const edge: SourceClaimEdge = {
      id: "edge-1",
      fromSourceClaimId: seedSourceClaim.id,
      toSourceClaimId: connectedSourceClaim.id,
      kind: "narrows",
      metadata: {
        consumer: "V332 edge-aware source candidate refinement",
        doesNotProve: "This edge does not prove graph retrieval quality."
      },
      createdAt: now
    };

    const result = await retrieveActivationCandidates({
      taskContract: {
        ...task,
        objective: "Use edge-aware source claim context for graph brain readback"
      },
      limits: {
        memory: 25,
        source: 25,
        search: 25,
        antiMemory: 25
      },
      repositories: {
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
            return [seedSourceClaim, connectedSourceClaim];
          },
          async listSourceClaimEdgesForClaim() {
            return [edge];
          },
          async listSourceDecisionEdgesForClaim() {
            return [];
          }
        },
        retrievalRepository: {
          async searchLexical() {
            return [];
          }
        }
      }
    });

    const sourceCandidates = result.candidates.filter((candidate) =>
      candidate.subjectType === "source_claim"
    );
    const connected = sourceCandidates.find((candidate) =>
      candidate.subjectId === connectedSourceClaim.id
    );

    expect(sourceCandidates).toHaveLength(2);
    expect(connected).toMatchObject({
      subjectType: "source_claim",
      subjectId: "claim-connected",
      graphScore: 8
    });
    expect(connected?.metadata).toMatchObject({
      sourceClaimEdgeInfluence: {
        edgeIds: ["edge-1"],
        edgeKinds: ["narrows"],
        seedSourceClaimIds: ["claim-seed"],
        doesNotProve: "SourceClaimEdge influence does not prove source truth, edge correctness, ranking quality, or product graph retrieval quality."
      }
    });
    expect(result.diagnostics).toMatchObject({
      sourceClaimCount: 2,
      mergedCandidateCount: 2
    });
  });

  it("classifies AMA-shaped selectedKnowledge misses with useful linked evidence as an exploration candidate", () => {
    const readback = buildActivationUtilityLabReadback({
      selectedKnowledgeCount: 0,
      answerUsefulness: "partly_useful_missing_document",
      supportingClaims: 8,
      supportingDocuments: 0,
      sourceClaimDocumentLinks: 8,
      linkedSearchDocuments: 8,
      relationSupport: 6
    });

    expect(readback).toMatchObject({
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
    });
  });

  it("keeps selected brain knowledge as the primary utility signal when present", () => {
    const readback = buildActivationUtilityLabReadback({
      selectedKnowledgeCount: 1,
      answerUsefulness: "useful",
      supportingClaims: 1,
      supportingDocuments: 1,
      sourceClaimDocumentLinks: 1,
      linkedSearchDocuments: 1,
      relationSupport: 1
    });

    expect(readback).toMatchObject({
      selectedKnowledge: {
        signal: "selected_knowledge",
        strength: "useful",
        reasons: ["selectedKnowledge returned 1 packet(s)."]
      },
      verdict: "selected_knowledge_sufficient",
      recommendedNextAction:
        "Use selected brain knowledge first; linked evidence can remain supporting context."
    });
  });

  it("rejects activation utility changes when both signals are missing", () => {
    const readback = buildActivationUtilityLabReadback({
      selectedKnowledgeCount: 0,
      answerUsefulness: "not_useful",
      supportingClaims: 0,
      supportingDocuments: 0,
      sourceClaimDocumentLinks: 0,
      linkedSearchDocuments: 0,
      relationSupport: 0
    });

    expect(readback).toMatchObject({
      selectedKnowledge: {
        signal: "selected_knowledge",
        strength: "missing"
      },
      sourceLinkGraph: {
        signal: "source_link_graph",
        strength: "missing",
        reasons: ["No source/link/graph evidence was present."]
      },
      verdict: "insufficient_evidence",
      recommendedNextAction:
        "Do not change activation utility; gather stronger source or brain evidence first."
    });
  });

  it("reports empty activation inputs before ranking repairs are considered", async () => {
    const result = await retrieveActivationCandidates({
      taskContract: task,
      limits: {
        memory: 25,
        source: 25,
        search: 25,
        antiMemory: 25
      },
      repositories: {
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
            return [];
          },
          async listSourceClaimEdgesForClaim() {
            return [];
          }
        },
        retrievalRepository: {
          async searchLexical() {
            return [];
          }
        }
      }
    });

    expect(result.candidates).toHaveLength(0);
    expect(result.diagnostics).toMatchObject({
      projectScoped: true,
      inputStatus: "empty_activation_store",
      memoryRecordCount: 0,
      sourceClaimCount: 0,
      searchResultCount: 0,
      ownerFileCandidateCount: 0,
      antiMemoryRecordCount: 0,
      mergedCandidateCount: 0,
      targetReadModelStatus: "not_provided"
    });
    expect(result.diagnostics.doesNotProve).toContain("ranking quality");
  });

  it("retries lexical search with explicit marker terms when the full source query is empty", async () => {
    const queries: string[] = [];
    const markerTask: TaskContract = {
      ...task,
      title: "krn-source-artifact-preview 55568e9ec7a48a12",
      objective: "Find the persisted local artifact SearchDocument for this marker.",
      constraints: ["preserve strict TypeScript boundaries"],
      nonGoals: ["do not add broad ranking"],
      acceptance: ["activation diagnostics report a search result"]
    };
    const result = await retrieveActivationCandidates({
      taskContract: markerTask,
      limits: {
        memory: 25,
        source: 25,
        search: 25,
        antiMemory: 25
      },
      repositories: {
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
            return [];
          },
          async listSourceClaimEdgesForClaim() {
            return [];
          }
        },
        retrievalRepository: {
          async searchLexical(input) {
            queries.push(input.query);

            return input.query === "55568e9ec7a48a12"
              ? [
                  searchDocument({
                    id: "search-document-marker",
                    subjectType: "source_artifact",
                    subjectId: "source-artifact-1",
                    sourceArtifactId: "source-artifact-1",
                    title: "Local artifact preview marker",
                    body: "krn-source-artifact-preview 55568e9ec7a48a12",
                    searchText: "krn-source-artifact-preview 55568e9ec7a48a12",
                    lexicalScore: 95
                  })
                ]
              : [];
          }
        }
      }
    });

    expect(queries).toHaveLength(2);
    expect(queries[0]).toContain("preserve strict TypeScript boundaries");
    expect(queries[1]).toBe("55568e9ec7a48a12");
    expect(result.diagnostics).toMatchObject({
      inputStatus: "candidates_available",
      searchResultCount: 1,
      mergedCandidateCount: 1
    });
    expect(result.candidates).toEqual([
      expect.objectContaining({
        kind: "search",
        subjectType: "search_document",
        subjectId: "search-document-marker",
        searchDocumentId: "search-document-marker"
      })
    ]);
  });

  it("ranks Memory Core write-authority memory above adjacent source-graph memory", () => {
    const query = buildMemoryQuery({
      ...task,
      title: "seal Memory Core write authority",
      objective: "seal Memory Core write authority"
    });
    const ranked = rankCandidates([
      toMemoryCandidate(memoryRecord({
        id: "memory-source-graph",
        key: "source-graph-postgres",
        summary: "Source graph decisions should remain Postgres-backed",
        body: "Use relational source graph edges before adding a separate graph database.",
        applicationGuidance: "Use when deciding whether source graph work needs a graph database."
      })),
      toMemoryCandidate(memoryRecord({
        id: "memory-write-authority",
        key: "memory-core-write-authority",
        summary: "MemoryReviewGate seals Memory Core write authority",
        body:
          "Public Memory Core promotion must go through MemoryReviewGate and promoteReviewedMemoryCandidate.",
        applicationGuidance:
          "Use when sealing Memory Core write authority or reviewing public MemoryRecord promotion paths."
      }))
    ], query);

    expect(ranked.map((candidate) => candidate.subjectId)).toEqual([
      "memory-write-authority",
      "memory-source-graph"
    ]);
  });

  it("applies trust, temporal, invalidation, and anti-memory filters after merge", () => {
    const query = buildSourceQuery(task);
    const mergedBlocked = mergeActivationCandidates(rankCandidates([
      toSourceClaimCandidate(
        sourceClaim({
          id: "claim-blocked",
          claim: "Activation readiness should add a source crawler."
        })
      ),
      toSearchCandidate(
        searchDocument({
          id: "search-blocked",
          subjectType: "source_claim",
          subjectId: "claim-blocked",
          sourceClaimId: "claim-blocked",
          title: "Crawler source claim search hit"
        })
      )
    ], query));
    const ranked = [
      ...mergedBlocked,
      ...rankCandidates([
        toMemoryCandidate(
          memoryRecord({
            id: "memory-expired",
            validUntil: "2026-06-10T00:00:00.000Z"
          })
        ),
        toMemoryCandidate(
          memoryRecord({
            id: "memory-low-trust",
            confidence: 20
          })
        )
      ], buildMemoryQuery(task))
    ];
    const result = applyActivationFilters({
      candidates: ranked,
      antiMemoryRecords: [
        antiMemoryRecord({
          id: "anti-crawler",
          invalidatedBySourceClaimIds: ["claim-blocked"],
          appliesTo: "crawler-only"
        })
      ],
      minimumTrustTier: "medium",
      now
    });

    expect(result.candidates).toEqual(expect.arrayContaining([
      expect.objectContaining({
        subjectId: "claim-blocked",
        antiMemoryRecordId: "anti-crawler",
        conflictReason: "anti_memory_block",
        searchDocumentIds: ["search-blocked"],
        exclusion: expect.objectContaining({ reason: "unsafe" }),
        metadata: expect.not.objectContaining({
          antiMemoryRecordId: expect.any(String),
          searchDocumentIds: expect.any(Array)
        })
      }),
      expect.objectContaining({
        subjectId: "memory-expired",
        exclusion: expect.objectContaining({ reason: "stale" })
      }),
      expect.objectContaining({
        subjectId: "memory-low-trust",
        exclusion: expect.objectContaining({ reason: "low_trust" })
      })
    ]));
    expect(result.conflictSets).toEqual([
      expect.objectContaining({
        reason: "anti_memory_block",
        candidateIds: expect.arrayContaining(["claim-blocked", "anti-crawler"])
      })
    ]);
  });

  it("uses core source trust ranking for rich activation trust tiers", () => {
    const query = buildSourceQuery(task);
    const ranked = rankCandidates([
      toSourceClaimCandidate(sourceClaim({
        id: "claim-official",
        trustTier: "official"
      })),
      toSourceClaimCandidate(sourceClaim({
        id: "claim-paper",
        trustTier: "paper"
      })),
      toSourceClaimCandidate(sourceClaim({
        id: "claim-secondary",
        trustTier: "secondary"
      })),
      toSourceClaimCandidate(sourceClaim({
        id: "claim-hypothesis",
        trustTier: "hypothesis"
      }))
    ], query);

    const highThreshold = new Map(
      applyTrustFilter(ranked, { minimumTrustTier: "high" })
        .map((candidate) => [candidate.subjectId, candidate])
    );
    const mediumThreshold = new Map(
      applyTrustFilter(ranked, { minimumTrustTier: "medium" })
        .map((candidate) => [candidate.subjectId, candidate])
    );

    expect(highThreshold.get("claim-official")?.exclusion).toBeUndefined();
    expect(highThreshold.get("claim-paper")?.exclusion).toBeUndefined();
    expect(highThreshold.get("claim-secondary")).toMatchObject({
      exclusion: expect.objectContaining({ reason: "low_trust" })
    });
    expect(mediumThreshold.get("claim-secondary")?.exclusion).toBeUndefined();
    expect(mediumThreshold.get("claim-hypothesis")).toMatchObject({
      exclusion: expect.objectContaining({ reason: "low_trust" })
    });
  });

  it("filters non-accepted source claims before activation authority", () => {
    const query = buildSourceQuery(task);
    const ranked = rankCandidates([
      toSourceClaimCandidate(sourceClaim({
        id: "claim-accepted",
        status: "accepted"
      })),
      toSourceClaimCandidate(sourceClaim({
        id: "claim-proposed",
        status: "proposed"
      })),
      toSourceClaimCandidate(sourceClaim({
        id: "claim-rejected",
        status: "rejected"
      })),
      toSourceClaimCandidate(sourceClaim({
        id: "claim-deprecated",
        status: "deprecated"
      }))
    ], query);
    const result = applyActivationFilters({
      candidates: ranked,
      antiMemoryRecords: [],
      minimumTrustTier: "medium",
      now
    });
    const bySubjectId = new Map(
      result.candidates.map((candidate) => [candidate.subjectId, candidate])
    );

    expect(bySubjectId.get("claim-accepted")?.exclusion).toBeUndefined();
    expect(bySubjectId.get("claim-proposed")).toMatchObject({
      sourceClaimStatus: "proposed",
      exclusion: {
        reason: "unsafe",
        explanation: expect.stringContaining("proposed claims remain review candidates")
      }
    });
    expect(bySubjectId.get("claim-rejected")).toMatchObject({
      sourceClaimStatus: "rejected",
      exclusion: {
        reason: "unsafe",
        explanation: expect.stringContaining("rejected claims remain review candidates")
      }
    });
    expect(bySubjectId.get("claim-deprecated")).toMatchObject({
      sourceClaimStatus: "deprecated",
      exclusion: {
        reason: "unsafe",
        explanation: expect.stringContaining("deprecated claims remain review candidates")
      }
    });
  });

  it("blocks accepted source claims without decision-edge support from activation authority", async () => {
    const linkedClaim = sourceClaim({
      id: "claim-linked",
      claim: "Decision-linked source claims can guide activation.",
      supportType: "implementation-boundary",
      falsifier: "A linked claim is excluded despite SourceDecisionEdge support."
    });
    const unlinkedClaim = sourceClaim({
      id: "claim-unlinked",
      claim: "Accepted-only source claims should not guide activation.",
      supportType: "implementation-boundary",
      falsifier: "An accepted-only claim is included as activation authority."
    });
    const linkedEdge = sourceDecisionEdge({
      id: "edge-linked",
      sourceClaimId: linkedClaim.id
    });
    const retrieved = await retrieveActivationCandidates({
      taskContract: task,
      limits: {
        memory: 0,
        source: 10,
        search: 0,
        antiMemory: 0
      },
      repositories: {
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
            return [linkedClaim, unlinkedClaim];
          },
          async listSourceClaimEdgesForClaim() {
            return [];
          },
          async listSourceDecisionEdgesForClaim(sourceClaimId) {
            return sourceClaimId === linkedClaim.id ? [linkedEdge] : [];
          }
        },
        retrievalRepository: {
          async searchLexical() {
            return [];
          }
        }
      }
    });
    const result = applyActivationFilters({
      candidates: retrieved.candidates,
      antiMemoryRecords: retrieved.antiMemoryRecords,
      minimumTrustTier: "medium",
      now
    });
    const bySubjectId = new Map(result.candidates.map((candidate) => [
      candidate.subjectId,
      candidate
    ]));

    expect(bySubjectId.get("claim-linked")?.exclusion).toBeUndefined();
    expect(bySubjectId.get("claim-unlinked")).toMatchObject({
      sourceClaimReviewSignals: expect.arrayContaining([
        expect.objectContaining({
          kind: "accepted_claim_without_decision",
          severity: "blocking"
        })
      ]),
      exclusion: {
        reason: "unsafe",
        explanation: expect.stringContaining("accepted_claim_without_decision")
      }
    });
  });

  it("selects a small high-signal working set from noisy candidates", () => {
    const query = buildMemoryQuery(task);
    const candidates = [
      toMemoryCandidate(
        memoryRecord({
          id: "memory-high",
          summary: "Doctor checks Postgres brain store readiness"
        })
      ),
      toMemoryCandidate(
        memoryRecord({
          id: "memory-low",
          summary: "Dashboard color palette notes",
          body: "Unrelated visual planning details.",
          confidence: 20
        })
      ),
      toSourceClaimCandidate(
        sourceClaim({
          id: "claim-high",
          claim: "Postgres readiness is required for the doctor command."
        })
      )
    ];

    const ranked = rankCandidates(candidates, query);
    const trusted = applyTrustFilter(ranked, { minimumTrustTier: "medium" });
    const current = applyTemporalFilter(trusted, now);
    const bounded = applyContextROI(current, { tokenBudget: 160, maxInclusions: 2 });
    const context = assembleContext({
      id: "context-1",
      harnessPlanId: "plan-1",
      candidates: bounded,
      tokenBudget: 160,
      createdAt: now
    });

    expect(context.inclusions).toHaveLength(2);
    expect(context.inclusions.map((item) => item.subjectId)).toEqual([
      "memory-high",
      "claim-high"
    ]);
    expect(context.exclusions.map((item) => item.subjectId)).toContain("memory-low");
  });

  it("prioritizes explicitly named retained source-to-decision pattern claims over unrelated target context", () => {
    const sourceQuery = buildSourceQuery({
      ...task,
      id: "task-sbv-pattern-priority",
      title: "Continue SBV retained pattern priority",
      objective: "Continue SBV-00 after source-to-decision usefulness feedback: choose the next implementation slice for the shared brain vertical using retained pattern evidence, not multi-repo bookkeeping",
      constraints: ["use retained source-to-decision pattern evidence"],
      nonGoals: ["do not continue EKOLOGUS target-specific work"],
      acceptance: ["retained source-to-decision SourceClaim is included before unrelated target context"]
    });
    const retainedPattern = toSourceClaimCandidate(
      sourceClaim({
        id: "claim-source-to-decision-pattern",
        claim: "Retained KRN knowledge must preserve source, mechanism, KRN implication, decision or rejection, consumer, falsifier, and does-not-prove boundary.",
        mechanism: "The source-to-decision pattern turns research and local evidence into a reviewable decision chain instead of decorative source notes.",
        krnImplication: "Use this retained pattern when a shared brain vertical task explicitly names source-to-decision reuse.",
        doesNotProve: "This does not prove the retained pattern is product truth or that every source claim should be selected."
      })
    );
    const unrelatedTargetPacket = toSourceClaimCandidate(
      sourceClaim({
        id: "claim-ekologus-target",
        claim: "EKOLOGUS target context improved a previous implementation slice with evidence and usefulness feedback.",
        mechanism: "The target packet matched prior multi-repo work and implementation evidence.",
        krnImplication: "Use only for EKOLOGUS-specific target work, not shared brain vertical pattern priority.",
        doesNotProve: "This does not prove EKOLOGUS context is relevant to non-EKOLOGUS shared-brain tasks."
      })
    );

    const bounded = applyContextROI(
      rankCandidates([unrelatedTargetPacket, retainedPattern], sourceQuery),
      { maxInclusions: 1 }
    );

    expect(bounded.find((candidate) => candidate.exclusion === undefined)?.subjectId)
      .toBe("claim-source-to-decision-pattern");
    expect(bounded.find((candidate) => candidate.subjectId === "claim-ekologus-target"))
      .toMatchObject({
        exclusion: expect.objectContaining({
          reason: "over_budget"
        })
      });
  });

  it("deduplicates and preserves type diversity before filling ContextROI budget", () => {
    const query = buildActivationQuery(task, {
      focus: "mixed",
      needs: ["memory", "source", "search"],
      budget: {
        maxItems: 3,
        maxTokens: 240,
        reserveTokens: 0
      }
    });
    const ranked = rankCandidates([
      {
        ...toMemoryCandidate(
          memoryRecord({
            id: "memory-primary",
            summary: "Doctor Postgres readiness must stay store-backed"
          })
        ),
        contextRoiScore: 150
      },
      {
        ...toSearchCandidate(
          searchDocument({
            id: "search-duplicate-memory",
            subjectType: "memory_record",
            subjectId: "memory-primary",
            memoryRecordId: "memory-primary",
            sourceClaimId: undefined,
            title: "Duplicate memory search hit",
            body: "Search hit pointing at the same memory record.",
            contextRoiScore: 120
          })
        )
      },
      {
        ...toMemoryCandidate(
          memoryRecord({
            id: "memory-secondary",
            summary: "Secondary memory is useful but less diverse"
          })
        ),
        contextRoiScore: 110
      },
      {
        ...toSourceClaimCandidate(
          sourceClaim({
            id: "claim-diverse",
            claim: "Doctor readiness needs source graph evidence."
          })
        ),
        contextRoiScore: 100
      },
      {
        ...toSearchCandidate(
          searchDocument({
            id: "search-independent",
            subjectType: "source_claim",
            subjectId: "claim-independent",
            title: "Independent search support",
            body: "Search result with independent source support.",
            contextRoiScore: 90
          })
        )
      }
    ], query);

    const bounded = applyContextROI(ranked, {
      tokenBudget: 240,
      maxInclusions: 3,
      minimumScore: 25,
      minimumDiverseKinds: ["memory", "source", "search"]
    });
    const context = assembleContext({
      id: "context-diverse",
      harnessPlanId: "plan-1",
      candidates: bounded,
      tokenBudget: 240,
      createdAt: now
    });

    expect(context.inclusions.map((item) => item.subjectId)).toEqual([
      "memory-primary",
      "claim-diverse",
      "search-independent"
    ]);
    expect(context.exclusions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        subjectId: "search-duplicate-memory",
        reason: "duplicate"
      }),
      expect.objectContaining({
        subjectId: "memory-secondary",
        reason: "over_budget"
      })
    ]));
  });

  it("triggers raw evidence recall for exact-proof and low-trust inclusions", () => {
    const query = buildActivationQuery(task, {
      focus: "mixed",
      needs: ["source", "memory"],
      risk: "high"
    });
    const ranked = rankCandidates([
      {
        ...toSourceClaimCandidate(
          sourceClaim({
            id: "claim-exact-proof",
            claim: "Doctor readiness requires exact persisted evidence."
          })
        ),
        contextRoiScore: 120
      },
      {
        ...toMemoryCandidate(
          memoryRecord({
            id: "memory-low-confidence",
            confidence: 40,
            summary: "Low-confidence memory still needs proof before use"
          })
        ),
        contextRoiScore: 110
      }
    ], query);
    const context = assembleContext({
      id: "context-raw-recall",
      harnessPlanId: "plan-1",
      candidates: applyContextROI(ranked, {
        maxInclusions: 2,
        minimumScore: 25
      }),
      createdAt: now
    });

    const triggers = buildActivationRawRecallTriggers({
      candidates: ranked,
      contextAssembly: context,
      requireExactProof: true
    });

    expect(triggers).toEqual(expect.arrayContaining([
      expect.objectContaining({
        subjectId: "claim-exact-proof",
        reasons: ["exact_proof_required"],
        evidenceHints: expect.arrayContaining(["source_claim:claim-exact-proof"])
      }),
      expect.objectContaining({
        subjectId: "memory-low-confidence",
        reasons: ["low_trust"],
        evidenceHints: expect.arrayContaining(["memory_record:memory-low-confidence"])
      })
    ]));
  });

  it("attaches a small source-ranged observation prefix as context metadata", () => {
    const prefix = selectObservationPrefix({
      task,
      projectId: "project-1",
      observations: [
        observation({ id: "observation-selected" }),
        observation({
          id: "observation-unrelated",
          subject: "marketing calendar",
          summary: "Marketing calendar changed.",
          body: "Campaign launch dates changed."
        })
      ],
      maxItems: 1,
      now
    });
    const context = assembleContext({
      id: "context-observation-prefix",
      harnessPlanId: "plan-1",
      candidates: [],
      observationPrefix: prefix,
      createdAt: now
    });

    expect(context.status).toBe("assembled");
    expect(context.inclusions).toHaveLength(0);
    expect(context.observationPrefix).toMatchObject({
      text: expect.stringContaining("Observation prefix:"),
      itemCount: 1,
      items: [
        expect.objectContaining({
          observationId: "observation-selected",
          sourceRangeCount: 1
        })
      ],
      exclusions: [
        expect.objectContaining({
          observationId: "observation-unrelated",
          reason: "low_relevance"
        })
      ]
    });
    expect(context.metadata["observationPrefix"]).toBeUndefined();
  });

  it("rejects observation prefix metadata when selected items are not source-ranged", () => {
    const prefix = selectObservationPrefix({
      task,
      projectId: "project-1",
      observations: [
        observation({
          id: "observation-unsourced",
          sourceRanges: []
        })
      ],
      maxItems: 1,
      now
    });
    const context = assembleContext({
      id: "context-unsourced-observation-prefix",
      harnessPlanId: "plan-1",
      candidates: [],
      observationPrefix: prefix,
      createdAt: now
    });

    expect(context.status).toBe("abstained");
    expect(context.observationPrefix).toBeUndefined();
    expect(context.observationPrefixGate).toMatchObject({
      status: "rejected",
      reasons: ["missing_source_ranges"],
      rejectedObservationIds: ["observation-unsourced"]
    });
    expect(context.metadata["observationPrefixGate"]).toBeUndefined();
  });

  it("excludes invalidated memory with an explicit reason", () => {
    const query = buildMemoryQuery(task);
    const ranked = rankCandidates(
      [
        toMemoryCandidate(
          memoryRecord({
            status: "invalidated",
            invalidatedAt: "2026-06-10T00:00:00.000Z",
            invalidationReason: "Superseded by KRN_ROADMAP store-backed memory rule"
          })
        )
      ],
      query
    );

    const context = assembleContext({
      id: "context-2",
      harnessPlanId: "plan-1",
      candidates: applyTemporalFilter(ranked, now),
      createdAt: now
    });

    expect(context.inclusions).toHaveLength(0);
    expect(context.exclusions[0]).toMatchObject({
      subjectId: "memory-1",
      reason: "invalidated"
    });
  });

  it("abstains with a weak-context warning when memory support is below policy", () => {
    const query = buildMemoryQuery(task);
    const ranked = rankCandidates(
      [
        toMemoryCandidate(
          memoryRecord({
            id: "weak-memory",
            summary: "Doctor checks Postgres brain store readiness",
            confidence: 35
          })
        )
      ],
      query
    );
    const context = assembleContext({
      id: "context-weak",
      harnessPlanId: "plan-1",
      candidates: applyTrustFilter(ranked, { minimumTrustTier: "medium" }),
      createdAt: now
    });

    expect(context.status).toBe("abstained");
    expect(context.activationAbstention).toMatchObject({
      reason: "weak_context",
      explanation: expect.stringContaining("weak"),
      metadata: expect.objectContaining({
        candidateCount: 1,
        exclusionReasons: ["low_trust"]
      })
    });
    expect(context.metadata["activationAbstention"]).toBeUndefined();
  });

  it("penalizes memory records with negative application feedback during ranking", () => {
    const query = buildMemoryQuery(task);
    const ranked = rankCandidates(
      [
        toMemoryCandidate(
          memoryRecord({
            id: "memory-negative",
            summary: "Doctor checks Postgres brain store readiness",
            negativeFeedbackCount: 4
          })
        ),
        toMemoryCandidate(
          memoryRecord({
            id: "memory-clean",
            summary: "Doctor checks Postgres brain store readiness"
          })
        )
      ],
      query
    );

    expect(ranked.map((candidate) => candidate.subjectId)).toEqual([
      "memory-clean",
      "memory-negative"
    ]);
    expect(ranked[1]?.metadata).toMatchObject({
      feedbackPenalty: -60,
      negativeFeedbackCount: 4
    });
  });

  it("does not inflate feedback score when merging duplicate activation candidates", () => {
    const query = buildMemoryQuery(task);
    const ranked = rankCandidates(
      [
        {
          ...toMemoryCandidate(memoryRecord({
            id: "memory-feedback",
            summary: "Doctor checks Postgres brain store readiness",
            positiveFeedbackCount: 15
          })),
          feedbackScore: 30
        },
        {
          ...toSearchCandidate(searchDocument({
            id: "search-memory-feedback",
            subjectType: "memory_record",
            subjectId: "memory-feedback",
            memoryRecordId: "memory-feedback",
            title: "Doctor checks Postgres brain store readiness"
          })),
          feedbackScore: 30
        }
      ],
      query
    );
    const [merged] = mergeActivationCandidates(ranked);

    expect(merged).toMatchObject({
      subjectType: "memory_record",
      subjectId: "memory-feedback",
      feedbackScore: 30
    });
    expect(merged?.totalScore).toBeLessThan(
      (ranked[0]?.totalScore ?? 0) + 30
    );
  });

  it("excludes memory records with blocking review signals during activation filtering", () => {
    const query = buildMemoryQuery(task);
    const ranked = rankCandidates(
      [
        toMemoryCandidate(
          memoryRecord({
            id: "memory-stale-review",
            status: "stale",
            confidence: 95
          })
        ),
        toMemoryCandidate(
          memoryRecord({
            id: "memory-negative-review",
            positiveFeedbackCount: 1,
            negativeFeedbackCount: 3
          })
        ),
        toMemoryCandidate(
          memoryRecord({
            id: "memory-warning-only",
            positiveFeedbackCount: 0,
            negativeFeedbackCount: 0
          })
        )
      ],
      query
    );

    const result = applyActivationFilters({
      candidates: ranked,
      antiMemoryRecords: [],
      minimumTrustTier: "medium",
      now
    });
    const bySubjectId = new Map(result.candidates.map((candidate) => [
      candidate.subjectId,
      candidate
    ]));

    expect(bySubjectId.get("memory-stale-review")).toMatchObject({
      exclusion: {
        reason: "stale",
        explanation: expect.stringContaining("stale_high_confidence")
      },
      memoryReviewSignals: expect.arrayContaining([
        expect.objectContaining({
          kind: "stale_high_confidence",
          severity: "blocking"
        })
      ]),
      metadata: {
        memoryReviewSignals: expect.arrayContaining([
          expect.objectContaining({
            kind: "stale_high_confidence",
            severity: "blocking"
          })
        ])
      }
    });
    expect(bySubjectId.get("memory-negative-review")).toMatchObject({
      exclusion: {
        reason: "unsafe",
        explanation: expect.stringContaining("unresolved_negative_feedback")
      },
      memoryReviewSignals: expect.arrayContaining([
        expect.objectContaining({
          kind: "unresolved_negative_feedback",
          severity: "blocking"
        })
      ])
    });
    expect(bySubjectId.get("memory-warning-only")?.exclusion).toBeUndefined();
    expect(bySubjectId.get("memory-warning-only")).toMatchObject({
      memoryReviewSignals: expect.arrayContaining([
        expect.objectContaining({
          kind: "no_application_feedback",
          severity: "warning"
        })
      ])
    });
  });

  it("blocks memory records by explicit anti-memory key", () => {
    const query = buildMemoryQuery(task);
    const ranked = rankCandidates(
      [
        toMemoryCandidate(
          memoryRecord({
            id: "memory-blocked",
            key: "brain-store"
          })
        )
      ],
      query
    );
    const result = detectConflicts(ranked, [antiMemoryRecord({ id: "anti-memory-1" })]);

    expect(result.candidates[0]).toMatchObject({
      subjectId: "memory-blocked",
      antiMemoryRecordId: "anti-memory-1",
      conflictReason: "anti_memory_block",
      exclusion: {
        reason: "unsafe",
        explanation: expect.stringContaining("anti-memory")
      },
      metadata: expect.not.objectContaining({
        conflictReason: expect.any(String),
        antiMemoryRecordId: expect.any(String)
      })
    });
    expect(result.conflictSets).toEqual([
      expect.objectContaining({
        reason: "anti_memory_block",
        candidateIds: expect.arrayContaining(["memory-blocked", "anti-memory-1"])
      })
    ]);
  });

  it("blocks search documents linked to anti-memory source or memory ids", () => {
    const query = buildSourceQuery(task);
    const ranked = rankCandidates(
      [
        toSearchCandidate(
          searchDocument({
            id: "search-from-source",
            sourceClaimId: "source-claim-1",
            subjectId: "source-claim-1"
          })
        ),
        toSearchCandidate(
          searchDocument({
            id: "search-from-memory",
            subjectType: "memory_record",
            subjectId: "memory-blocked",
            sourceClaimId: undefined,
            memoryRecordId: "memory-blocked"
          })
        )
      ],
      query
    );
    const result = detectConflicts(ranked, [
      antiMemoryRecord({
        id: "anti-source",
        invalidatedBySourceClaimIds: ["source-claim-1"]
      }),
      antiMemoryRecord({
        id: "anti-memory",
        key: "memory-blocked",
        appliesTo: "memory-blocked"
      })
    ]);

    expect(result.candidates).toEqual(expect.arrayContaining([
      expect.objectContaining({
        subjectId: "search-from-source",
        antiMemoryRecordId: "anti-source",
        conflictReason: "anti_memory_block",
        exclusion: expect.objectContaining({ reason: "unsafe" }),
        metadata: expect.not.objectContaining({
          antiMemoryRecordId: expect.any(String),
          conflictReason: expect.any(String)
        })
      }),
      expect.objectContaining({
        subjectId: "search-from-memory",
        antiMemoryRecordId: "anti-memory",
        conflictReason: "anti_memory_block",
        exclusion: expect.objectContaining({ reason: "unsafe" }),
        metadata: expect.not.objectContaining({
          antiMemoryRecordId: expect.any(String),
          conflictReason: expect.any(String)
        })
      })
    ]));
  });

  it("uses the strongest anti-memory record for repeated source invalidations", () => {
    const query = buildSourceQuery(task);
    const ranked = rankCandidates(
      [
        toSourceClaimCandidate(
          sourceClaim({
            id: "source-claim-repeat"
          })
        )
      ],
      query
    );

    const lowerConfidence = antiMemoryRecord({
      id: "anti-low",
      confidence: 20,
      invalidatedBySourceClaimIds: ["source-claim-repeat"],
      updatedAt: "2026-06-23T00:00:00.000Z"
    });
    const higherConfidence = antiMemoryRecord({
      id: "anti-high",
      confidence: 95,
      invalidatedBySourceClaimIds: ["source-claim-repeat"],
      updatedAt: "2026-06-22T00:00:00.000Z"
    });

    for (const antiMemoryRecords of [
      [lowerConfidence, higherConfidence],
      [higherConfidence, lowerConfidence]
    ]) {
      const result = detectConflicts(ranked, antiMemoryRecords);

      expect(result.candidates[0]).toMatchObject({
        subjectId: "source-claim-repeat",
        antiMemoryRecordId: "anti-high",
        conflictReason: "anti_memory_block",
        exclusion: expect.objectContaining({ reason: "unsafe" })
      });
      expect(result.conflictSets).toEqual([
        expect.objectContaining({
          candidateIds: expect.arrayContaining(["source-claim-repeat", "anti-high"])
        })
      ]);
    }
  });

  it("excludes source claims without doesNotProve", () => {
    const query = buildSourceQuery(task);
    const ranked = rankCandidates(
      [
        toSourceClaimCandidate(
          sourceClaim({
            doesNotProve: ""
          })
        )
      ],
      query
    );

    const context = assembleContext({
      id: "context-3",
      harnessPlanId: "plan-1",
      candidates: ranked,
      createdAt: now
    });

    expect(context.inclusions).toHaveLength(0);
    expect(context.exclusions[0]).toMatchObject({
      subjectId: "claim-1",
      reason: "unsafe"
    });
  });

  it("excludes proposed source claims from implementation authority context", () => {
    const query = buildSourceQuery(task);
    const ranked = rankCandidates(
      [
        toSourceClaimCandidate(
          sourceClaim({
            id: "claim-proposed",
            status: "proposed"
          })
        )
      ],
      query
    );

    const context = assembleContext({
      id: "context-proposed-source-claim",
      harnessPlanId: "plan-1",
      candidates: ranked,
      createdAt: now
    });

    expect(context.status).toBe("abstained");
    expect(context.inclusions).toHaveLength(0);
    expect(context.exclusions).toEqual([expect.objectContaining({
      subjectId: "claim-proposed",
      reason: "unsafe",
      explanation: expect.stringContaining("accepted status")
    })]);
  });
});
