import { describe, expect, it } from "vitest";
import type {
  AntiMemoryRecord,
  ObservationItem,
  SourceClaim
} from "@krn/core";

import { selectReflectionInput } from "./reflectionInputSelector.js";

const now = "2026-06-22T21:00:00.000Z";

const observation = (
  overrides: Partial<ObservationItem>
): ObservationItem => ({
  id: "observation-1",
  groupId: "group-1",
  scope: {
    projectId: "project-1"
  },
  kind: "fact",
  status: "candidate",
  priority: "medium",
  confidence: "medium",
  provenanceKind: "run_event",
  subject: "reflection",
  summary: "Reflection input candidate.",
  body: "Reflection should see this observation.",
  temporalScope: {
    observedAt: now,
    ingestedAt: now
  },
  sourceRanges: [],
  entityLinks: [],
  claimLinks: [],
  metadata: {},
  createdAt: now,
  updatedAt: now,
  ...overrides
});

const sourceClaim = (
  overrides: Partial<SourceClaim>
): SourceClaim => ({
  id: "source-claim-1",
  sourceArtifactId: "source-artifact-1",
  claim: "Reflection input uses source claims.",
  mechanism: "Source claims provide mechanism context.",
  krnImplication: "Reflection can propose candidates with source context.",
  doesNotProve: "This does not approve final truth.",
  trustTier: "project-decision",
  supportType: "mechanism",
  consumer: "reflection",
  status: "proposed",
  metadata: {},
  createdAt: now,
  updatedAt: now,
  ...overrides
});

const antiMemory = (
  overrides: Partial<AntiMemoryRecord>
): AntiMemoryRecord => ({
  id: "anti-memory-1",
  projectId: "project-1",
  key: "do-not-promote-unsourced-observations",
  summary: "Do not promote unsourced observations.",
  body: "Reflection should consider this anti-memory.",
  owner: "memory-review",
  confidence: 90,
  invalidatedBySourceClaimIds: [],
  sourceLineage: [],
  metadata: {},
  createdAt: now,
  updatedAt: now,
  ...overrides
});

describe("reflection input selector", () => {
  it("selects scoped observations and anti-memory while preserving repository-scoped source claims", () => {
    const input = selectReflectionInput({
      projectId: "project-1",
      executionRunId: "run-1",
      taskContractId: "task-1",
      observationGroupIds: ["group-2", "group-1", "group-1"],
      observations: [
        observation({ id: "observation-project-1" }),
        observation({
          id: "observation-project-2",
          scope: {
            projectId: "project-2"
          }
        }),
        observation({
          id: "observation-unscoped",
          scope: {}
        })
      ],
      sourceClaims: [
        sourceClaim({ id: "source-claim-project-1" }),
        sourceClaim({ id: "source-claim-project-2" })
      ],
      antiMemoryRecords: [
        antiMemory({ id: "anti-project-1", key: "anti-project-1" }),
        antiMemory({ id: "anti-project-2", projectId: "project-2", key: "anti-project-2" })
      ],
      generatedAt: now
    });

    expect(input.scope).toEqual({
      projectId: "project-1",
      executionRunId: "run-1",
      taskContractId: "task-1",
      observationGroupIds: ["group-1", "group-2"]
    });
    expect(input.observationItemIds).toEqual(["observation-project-1"]);
    expect(input.sourceClaimIds).toEqual(["source-claim-project-1", "source-claim-project-2"]);
    expect(input.antiMemoryKeys).toEqual(["anti-project-1"]);
  });

  it("keeps contradiction and gap observations visible for reflection", () => {
    const input = selectReflectionInput({
      projectId: "project-1",
      observations: [
        observation({ id: "fact-1", kind: "fact" }),
        observation({ id: "conflict-1", kind: "conflict" }),
        observation({ id: "contested-1", status: "contested" }),
        observation({ id: "gap-1", kind: "gap" })
      ],
      sourceClaims: [],
      antiMemoryRecords: [],
      generatedAt: now
    });

    expect(input.observationItemIds).toEqual([
      "conflict-1",
      "contested-1",
      "fact-1",
      "gap-1"
    ]);
    expect(input.metadata).toMatchObject({
      contradictionObservationIds: ["conflict-1", "contested-1"],
      gapObservationIds: ["gap-1"],
      observationKinds: ["conflict", "fact", "gap"]
    });
  });

  it("does not use SourceClaim metadata for project scoping", () => {
    const input = selectReflectionInput({
      projectId: "project-1",
      observations: [],
      sourceClaims: [
        sourceClaim({
          id: "source-claim-typed-scope",
          metadata: {
            note: "project scope is derived before reflection selection"
          }
        })
      ],
      antiMemoryRecords: [],
      generatedAt: now
    });

    expect(input.sourceClaimIds).toEqual(["source-claim-typed-scope"]);
  });
});
