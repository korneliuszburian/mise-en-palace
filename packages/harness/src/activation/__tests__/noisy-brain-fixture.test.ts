import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type {
  AntiMemoryRecord,
  MemoryRecord,
  SourceClaim,
  TaskContract
} from "@krn/core";
import type {
  SearchDocumentSearchResult
} from "../../repositories/index.js";
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
} from "../index.js";

interface NoisyBrainFixture {
  now: string;
  policy: {
    tokenBudget: number;
    maxInclusions: number;
  };
  task: TaskContract;
  memoryRecords: MemoryRecord[];
  sourceClaims: SourceClaim[];
  searchDocuments: SearchDocumentSearchResult[];
  antiMemoryRecords: AntiMemoryRecord[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const assertPolicyShape = (value: Record<string, unknown>): void => {
  if (!isRecord(value.policy)) {
    throw new Error("Noisy brain fixture policy shape is invalid.");
  }

  if (
    typeof value.policy.tokenBudget !== "number" ||
    typeof value.policy.maxInclusions !== "number"
  ) {
    throw new Error("Noisy brain fixture policy shape is invalid.");
  }
};

const assertCollectionShapes = (value: Record<string, unknown>): void => {
  if (
    !Array.isArray(value.memoryRecords) ||
    !Array.isArray(value.sourceClaims) ||
    !Array.isArray(value.searchDocuments) ||
    !Array.isArray(value.antiMemoryRecords)
  ) {
    throw new Error("Noisy brain fixture collection shape is invalid.");
  }
};

const assertNoisyBrainFixture = (value: unknown): NoisyBrainFixture => {
  if (!isRecord(value)) {
    throw new Error("Noisy brain fixture must be an object.");
  }

  if (typeof value.now !== "string" || !isRecord(value.task)) {
    throw new Error("Noisy brain fixture shape is invalid.");
  }

  assertPolicyShape(value);
  assertCollectionShapes(value);

  return value as NoisyBrainFixture;
};

const loadFixture = (): NoisyBrainFixture => {
  const fixtureUrl = new URL(
    "../../../../../tests/fixtures/activation/noisy-brain-selection.json",
    import.meta.url
  );

  const parsed: unknown = JSON.parse(readFileSync(fixtureUrl, "utf8"));

  return assertNoisyBrainFixture(parsed);
};

describe("noisy brain activation fixture", () => {
  it("compresses noisy source, memory, search, and anti-memory into bounded context", () => {
    const fixture = loadFixture();
    const memoryQuery = buildMemoryQuery(fixture.task);
    const sourceQuery = buildSourceQuery(fixture.task);
    const memoryCandidates = rankCandidates(
      fixture.memoryRecords.map(toMemoryCandidate),
      memoryQuery
    );
    const sourceCandidates = rankCandidates(
      fixture.sourceClaims.map(toSourceClaimCandidate),
      sourceQuery
    );
    const searchCandidates = rankCandidates(
      fixture.searchDocuments.map(toSearchCandidate),
      sourceQuery
    );
    const conflictResult = detectConflicts(
      [...memoryCandidates, ...sourceCandidates, ...searchCandidates],
      fixture.antiMemoryRecords
    );
    const bounded = applyContextROI(
      applyTemporalFilter(
        applyTrustFilter(conflictResult.candidates, { minimumTrustTier: "medium" }),
        fixture.now
      ),
      {
        tokenBudget: fixture.policy.tokenBudget,
        maxInclusions: fixture.policy.maxInclusions
      }
    );
    const context = assembleContext({
      id: "context-noisy-fixture",
      harnessPlanId: "plan-noisy-fixture",
      candidates: bounded,
      tokenBudget: fixture.policy.tokenBudget,
      createdAt: fixture.now
    });

    expect(context.inclusions).toHaveLength(2);
    expect(context.inclusions.map((item) => item.subjectId)).toEqual(
      expect.arrayContaining(["search-activation-smoke", "memory-activation-high"])
    );
    expect(context.exclusions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          subjectId: "memory-stale-dashboard",
          reason: "stale"
        }),
        expect.objectContaining({
          subjectId: "claim-crawler",
          reason: "unsafe",
          explanation: expect.stringContaining("anti-memory")
        }),
        expect.objectContaining({
          subjectId: "claim-no-mechanism",
          reason: "unsafe",
          explanation: expect.stringContaining("mechanism")
        })
      ])
    );
    expect(conflictResult.conflictSets).toEqual([
      expect.objectContaining({
        reason: "anti_memory_block",
        candidateIds: expect.arrayContaining(["claim-crawler", "anti-crawler"])
      })
    ]);
  });
});
