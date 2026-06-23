import { describe, expect, it } from "vitest";
import type {
  AntiMemoryRecord,
  MemoryRecord,
  SourceClaim,
  TaskContract
} from "@krn/core";
import type {
  SearchDocumentSearchResult
} from "../repositories/types.js";

import {
  applyContextROI,
  applyActivationFilters,
  applyTemporalFilter,
  applyTrustFilter,
  assembleContext,
  buildActivationRawRecallTriggers,
  buildActivationQuery,
  buildMemoryQuery,
  buildSourceQuery,
  detectConflicts,
  mergeActivationCandidates,
  rankCandidates,
  toMemoryCandidate,
  toSearchCandidate,
  toSourceClaimCandidate
} from "./index.js";

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
  status: "proposed",
  metadata: {},
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
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
      graphScore: 15
    });
    expect(merged[0]?.lexicalScore).toBeGreaterThanOrEqual(70);
    expect(merged[0]?.metadata).toMatchObject({
      mergedCandidateIds: expect.arrayContaining(["claim-duplicate", "search-duplicate"]),
      mergedKinds: expect.arrayContaining(["source", "search"]),
      searchDocumentIds: ["search-duplicate"]
    });
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
        exclusion: expect.objectContaining({ reason: "unsafe" }),
        metadata: expect.objectContaining({
          antiMemoryRecordId: "anti-crawler",
          searchDocumentIds: ["search-blocked"]
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

  it("excludes invalidated memory with an explicit reason", () => {
    const query = buildMemoryQuery(task);
    const ranked = rankCandidates(
      [
        toMemoryCandidate(
          memoryRecord({
            status: "invalidated",
            invalidatedAt: "2026-06-10T00:00:00.000Z",
            invalidationReason: "Superseded by ADR-0010"
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
    expect(context.metadata.activationAbstention).toMatchObject({
      reason: "weak_context",
      explanation: expect.stringContaining("weak"),
      metadata: expect.objectContaining({
        candidateCount: 1,
        exclusionReasons: ["low_trust"]
      })
    });
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
      exclusion: {
        reason: "unsafe",
        explanation: expect.stringContaining("anti-memory")
      },
      metadata: {
        conflictReason: "anti_memory_block",
        antiMemoryRecordId: "anti-memory-1"
      }
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
        exclusion: expect.objectContaining({ reason: "unsafe" }),
        metadata: expect.objectContaining({
          antiMemoryRecordId: "anti-source",
          conflictReason: "anti_memory_block"
        })
      }),
      expect.objectContaining({
        subjectId: "search-from-memory",
        exclusion: expect.objectContaining({ reason: "unsafe" }),
        metadata: expect.objectContaining({
          antiMemoryRecordId: "anti-memory",
          conflictReason: "anti_memory_block"
        })
      })
    ]));
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
});
