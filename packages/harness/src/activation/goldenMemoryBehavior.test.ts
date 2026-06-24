import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type {
  AntiMemoryRecord,
  MemoryRecord,
  SourceClaim,
  TaskContract
} from "@krn/core";

import {
  applyActivationFilters,
  applyContextROI,
  applyTemporalFilter,
  applyTrustFilter,
  assembleContext,
  buildActivationRawRecallTriggers,
  buildMemoryQuery,
  buildSourceQuery,
  rankCandidates,
  toMemoryCandidate,
  toSourceClaimCandidate
} from "./index.js";

const now = "2026-06-23T10:00:00.000Z";

const task = (overrides: Partial<TaskContract>): TaskContract => ({
  id: "task-1",
  operatorIntentId: "intent-1",
  projectId: "project-1",
  title: "Use reviewed memory safely",
  objective: "Select source-linked memory and avoid stale weak context.",
  constraints: ["no runtime markdown memory"],
  nonGoals: ["do not add broad eval suite"],
  acceptance: ["golden memory behavior is protected"],
  status: "active",
  metadata: {},
  createdAt: now,
  updatedAt: now,
  ...overrides
});

const memoryRecord = (overrides: Partial<MemoryRecord>): MemoryRecord => ({
  id: "memory-1",
  projectId: "project-1",
  key: "reviewed-memory",
  kind: "procedure",
  status: "active",
  summary: "Reviewed memory supports safe activation",
  body: "Source-linked memory should be selected only while current and trustworthy.",
  owner: "memory-eval",
  confidence: 95,
  applicationGuidance: "Use when planning memory behavior work.",
  sourceLineage: [{ sourceId: "source-claim-1" }],
  isUserPreference: false,
  positiveFeedbackCount: 0,
  negativeFeedbackCount: 0,
  metadata: {},
  validFrom: "2026-06-01T00:00:00.000Z",
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
  ...overrides
});

const antiMemoryRecord = (overrides: Partial<AntiMemoryRecord>): AntiMemoryRecord => ({
  id: "anti-memory-1",
  projectId: "project-1",
  key: "stale-pattern",
  rejectedClaim: "Use stale memory update patterns as trusted guidance.",
  reason: "The pattern was rejected by reviewed anti-memory.",
  invalidatedBySourceClaimIds: [],
  appliesTo: "stale-pattern",
  summary: "Block stale memory pattern",
  body: "Activation must exclude this stale memory key.",
  owner: "memory-eval",
  confidence: 95,
  sourceLineage: [{ sourceId: "source-claim-anti-memory-1" }],
  metadata: {},
  validFrom: "2026-06-01T00:00:00.000Z",
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
  ...overrides
});

const sourceClaim = (overrides: Partial<SourceClaim>): SourceClaim => ({
  id: "source-claim-exact-proof",
  sourceArtifactId: "source-artifact-1",
  claim: "Exact source proof is required before using this activation claim.",
  mechanism: "The claim affects implementation safety and needs raw evidence recall.",
  krnImplication: "Activation may include the claim only with a raw recall trigger.",
  doesNotProve: "The implementation is already correct.",
  trustTier: "high",
  supportType: "supports",
  consumer: "golden-memory-behavior-test",
  status: "proposed",
  metadata: {},
  createdAt: now,
  updatedAt: now,
  ...overrides
});

const isJsonObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const goldenFixtureCaseIds = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((goldenTask) => {
    if (!isJsonObject(goldenTask) || !Array.isArray(goldenTask.cases)) {
      return [];
    }

    return goldenTask.cases.flatMap((goldenCase) =>
      isJsonObject(goldenCase) && typeof goldenCase.id === "string"
        ? [goldenCase.id]
        : []
    );
  }).sort();
};

const goldenCaseIds = (): string[] => {
  const fixtureUrl = new URL(
    "../../../../tests/fixtures/golden-tasks/memory-behavior.json",
    import.meta.url
  );
  const parsed: unknown = JSON.parse(readFileSync(fixtureUrl, "utf8"));

  return goldenFixtureCaseIds(parsed);
};

describe("golden memory behavior cases", () => {
  it("declares the required MM-61 memory behavior cases as fixtures", () => {
    expect(goldenCaseIds()).toEqual([
      "golden-case-evidence-001-a",
      "golden-case-memory-001-a",
      "golden-case-memory-002-a",
      "golden-case-memory-002-b",
      "golden-case-memory-003-a",
      "golden-case-memory-004-a",
      "golden-case-memory-005-a",
      "golden-case-memory-smoke-001",
      "golden-case-memory-smoke-002",
      "golden-case-observation-prefix-001-a",
      "golden-case-source-smoke-001"
    ]);
  });

  it("selects source-linked memory", () => {
    const query = buildMemoryQuery(task({
      objective: "Use reviewed source-linked memory for safe activation."
    }));
    const ranked = rankCandidates([
      toMemoryCandidate(memoryRecord({
        id: "memory-source-linked",
        summary: "Reviewed source-linked memory supports activation."
      }))
    ], query);
    const context = assembleContext({
      id: "context-source-linked",
      harnessPlanId: "plan-1",
      candidates: applyContextROI(ranked, { maxInclusions: 1 }),
      createdAt: now
    });

    expect(context.inclusions.map((item) => item.subjectId)).toEqual(["memory-source-linked"]);
  });

  it("rejects stale memory and abstains when only stale memory remains", () => {
    const ranked = rankCandidates([
      toMemoryCandidate(memoryRecord({
        id: "memory-stale",
        validUntil: "2026-06-01T00:00:00.000Z"
      }))
    ], buildMemoryQuery(task({})));
    const context = assembleContext({
      id: "context-stale",
      harnessPlanId: "plan-1",
      candidates: applyTemporalFilter(ranked, now),
      createdAt: now
    });

    expect(context.status).toBe("abstained");
    expect(context.exclusions[0]).toMatchObject({
      subjectId: "memory-stale",
      reason: "stale"
    });
  });

  it("abstains when memory support is weak", () => {
    const ranked = rankCandidates([
      toMemoryCandidate(memoryRecord({
        id: "memory-weak",
        confidence: 35
      }))
    ], buildMemoryQuery(task({})));
    const context = assembleContext({
      id: "context-weak",
      harnessPlanId: "plan-1",
      candidates: applyTrustFilter(ranked, { minimumTrustTier: "medium" }),
      createdAt: now
    });

    expect(context.status).toBe("abstained");
    expect(context.activationAbstention).toMatchObject({
      reason: "weak_context"
    });
    expect(context.metadata["activationAbstention"]).toBeUndefined();
  });

  it("respects temporal validity by selecting current memory over expired memory", () => {
    const ranked = rankCandidates([
      toMemoryCandidate(memoryRecord({
        id: "memory-expired",
        validUntil: "2026-06-01T00:00:00.000Z"
      })),
      toMemoryCandidate(memoryRecord({
        id: "memory-current",
        validUntil: "2026-07-01T00:00:00.000Z"
      }))
    ], buildMemoryQuery(task({})));
    const context = assembleContext({
      id: "context-temporal",
      harnessPlanId: "plan-1",
      candidates: applyContextROI(applyTemporalFilter(ranked, now), {
        maxInclusions: 1
      }),
      createdAt: now
    });

    expect(context.inclusions.map((item) => item.subjectId)).toEqual(["memory-current"]);
    expect(context.exclusions.map((item) => item.subjectId)).toContain("memory-expired");
  });

  it("uses application guidance as activation text and expected use", () => {
    const guidance = "Use when planning rollback path for memory dogfood.";
    const ranked = rankCandidates([
      toMemoryCandidate(memoryRecord({
        id: "memory-guidance",
        summary: "Generic implementation lesson",
        body: "The detailed applicability is in guidance.",
        applicationGuidance: guidance
      }))
    ], buildMemoryQuery(task({
      objective: "Plan rollback path for memory dogfood."
    })));

    expect(ranked[0]).toMatchObject({
      subjectId: "memory-guidance",
      expectedUse: guidance
    });
    expect(ranked[0]?.lexicalScore).toBeGreaterThan(0);
  });

  it("requires raw recall when exact source proof is needed", () => {
    const ranked = rankCandidates([
      toSourceClaimCandidate(sourceClaim({}))
    ], buildSourceQuery(task({
      objective: "Use exact source proof before implementing activation safety."
    })));
    const context = assembleContext({
      id: "context-exact-proof",
      harnessPlanId: "plan-1",
      candidates: applyContextROI(ranked, { maxInclusions: 1 }),
      createdAt: now
    });
    const triggers = buildActivationRawRecallTriggers({
      candidates: ranked,
      contextAssembly: context,
      requireExactProof: true
    });

    expect(context.inclusions).toEqual([expect.objectContaining({
      subjectType: "source_claim",
      subjectId: "source-claim-exact-proof"
    })]);
    expect(triggers).toEqual([expect.objectContaining({
      subjectType: "source_claim",
      subjectId: "source-claim-exact-proof",
      reasons: ["exact_proof_required"],
      evidenceHints: expect.arrayContaining(["source_claim:source-claim-exact-proof"])
    })]);
  });

  it("smoke case: stale memory abstains instead of entering context confidently", () => {
    const ranked = rankCandidates([
      toMemoryCandidate(memoryRecord({
        id: "memory-smoke-stale",
        confidence: 95,
        validUntil: "2026-06-01T00:00:00.000Z"
      }))
    ], buildMemoryQuery(task({
      objective: "Use the stale memory update pattern."
    })));
    const context = assembleContext({
      id: "context-smoke-stale",
      harnessPlanId: "plan-1",
      candidates: applyTemporalFilter(ranked, now),
      createdAt: now
    });

    expect(context.status).toBe("abstained");
    expect(context.inclusions).toHaveLength(0);
    expect(context.exclusions).toEqual([expect.objectContaining({
      subjectId: "memory-smoke-stale",
      reason: "stale"
    })]);
  });

  it("smoke case: active anti-memory blocks a tempting stale pattern", () => {
    const ranked = rankCandidates([
      toMemoryCandidate(memoryRecord({
        id: "memory-stale-pattern",
        key: "stale-pattern",
        summary: "Stale pattern appears highly relevant for memory updates.",
        body: "This stale pattern should be tempting but blocked.",
        confidence: 98
      }))
    ], buildMemoryQuery(task({
      objective: "Use stale pattern guidance for a memory update."
    })));
    const filtered = applyActivationFilters({
      candidates: ranked,
      antiMemoryRecords: [antiMemoryRecord({})],
      minimumTrustTier: "low",
      now
    });
    const context = assembleContext({
      id: "context-smoke-anti-memory",
      harnessPlanId: "plan-1",
      candidates: filtered.candidates,
      createdAt: now
    });

    expect(context.inclusions).toHaveLength(0);
    expect(context.exclusions).toEqual([expect.objectContaining({
      subjectId: "memory-stale-pattern",
      reason: "unsafe"
    })]);
    expect(filtered.conflictSets).toEqual([expect.objectContaining({
      reason: "anti_memory_block",
      candidateIds: expect.arrayContaining(["memory-stale-pattern", "anti-memory-1"])
    })]);
  });

});
