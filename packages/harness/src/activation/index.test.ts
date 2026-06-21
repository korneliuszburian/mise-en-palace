import { describe, expect, it } from "vitest";
import type {
  MemoryRecord,
  SourceClaim,
  TaskContract
} from "@krn/core";

import {
  applyContextROI,
  applyTemporalFilter,
  applyTrustFilter,
  assembleContext,
  buildMemoryQuery,
  buildSourceQuery,
  rankCandidates,
  toMemoryCandidate,
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
  metadata: {},
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
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
