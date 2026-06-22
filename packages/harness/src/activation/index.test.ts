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
  applyTemporalFilter,
  applyTrustFilter,
  assembleContext,
  buildMemoryQuery,
  buildSourceQuery,
  detectConflicts,
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
