import {
  describe,
  expect,
  it
} from "vitest";

import type {
  ProjectId,
  SourceClaim,
  SourceDecisionEdge,
  SourceRejection
} from "@krn/core";
import type {
  DatabaseRuntime,
  DatabaseRuntimeInput
} from "../database-runtime.js";
import {
  runSourceDecisionGapsCommand
} from "../run-source-decision-gaps-command.js";
import type {
  CreateSourceDecisionGapsDatabaseRuntime
} from "../run-source-decision-gaps-command.js";

const now = "2026-07-03T19:00:00.000Z";
const projectId = "7d9d103a-1a8e-4492-a4ca-db3a5589bd9b";
const missingClaimId = "8beef0cc-6251-4c09-a3b8-b97383b4f234" as SourceClaim["id"];
const linkedClaimId = "470d0876-8d18-468e-b8d2-f4715cd83354" as SourceClaim["id"];
const proposedClaimId = "1f0c6e2a-9d77-4104-8bb1-2c7e9a0f5512" as SourceClaim["id"];
const rejectedProposedClaimId = "09876ce2-6d3f-4b03-9ae0-f250435abed4" as SourceClaim["id"];

const sourceClaim = (overrides: Partial<SourceClaim> = {}): SourceClaim => ({
  id: missingClaimId,
  sourceArtifactId: "f6db868a-4c82-406a-8371-9ab7d8594fc5" as SourceClaim["sourceArtifactId"],
  claim: "Accepted SourceClaims should expose missing SourceDecisionEdge readback.",
  mechanism: "A read-only project scan can compare accepted claims to decision edges.",
  krnImplication: "Operators can find decision-link gaps without mutating Beads or CI.",
  doesNotProve: "This does not prove the claim is false.",
  sourceAuthority: "project-decision",
  supportType: "implementation-boundary",
  consumer: "source decision gap detector",
  falsifier: "The accepted claim with no edge is absent from gap output.",
  status: "accepted",
  metadata: {},
  createdAt: now,
  updatedAt: now,
  ...overrides
});

const sourceDecisionEdge = (
  overrides: Partial<SourceDecisionEdge> = {}
): SourceDecisionEdge => ({
  id: "12317af1-4090-4c1c-8f07-203180b59792" as SourceDecisionEdge["id"],
  sourceClaimId: linkedClaimId,
  targetType: "harness_run",
  targetId: "run-1",
  supportType: "implementation-boundary",
  confidence: "high",
  notes: "Linked decision support exists.",
  metadata: {},
  createdAt: now,
  ...overrides
});

const sourceRejection = (
  overrides: Partial<SourceRejection> = {}
): SourceRejection => ({
  id: "4fc26da7-4b0c-4449-a052-8e5f876de871" as SourceRejection["id"],
  sourceClaimId: rejectedProposedClaimId,
  title: "Rejected non-governing proposed claim",
  attemptedClaim: "Rejected proposed claim should not stay pending.",
  rejectedBecause: "unsupported",
  reason: "Not a current governing KRN decision.",
  doesNotProve: "This rejection does not prove the claim is false.",
  consumer: "source decision gap detector",
  metadata: {},
  rejectedAt: now,
  ...overrides,
  projectId: projectId as ProjectId
});

interface RuntimeInput {
  claims?: readonly SourceClaim[];
  decisionEdges?: readonly SourceDecisionEdge[];
  rejections?: readonly SourceRejection[];
  onRuntimeInput?(input: DatabaseRuntimeInput): void;
  onClose?(): void;
}

const runtime = (input: RuntimeInput = {}): CreateSourceDecisionGapsDatabaseRuntime => {
  const claims = input.claims ?? [
    sourceClaim(),
    sourceClaim({
      id: linkedClaimId,
      claim: "Linked SourceClaim should not appear as a gap."
    })
  ];
  const decisionEdges = input.decisionEdges ?? [sourceDecisionEdge()];
  const rejections = input.rejections ?? [];

  return async (runtimeInput) => {
    input.onRuntimeInput?.(runtimeInput);

    return {
      workspaceId: "workspace-1",
      projectId,
      compilerDependencies: {} as DatabaseRuntime["compilerDependencies"],
      harnessRunRepository: {} as DatabaseRuntime["harnessRunRepository"],
      memoryRepository: {} as DatabaseRuntime["memoryRepository"],
      retrievalRepository: {} as NonNullable<DatabaseRuntime["retrievalRepository"]>,
      sourceRepository: {
        async createSourceArtifact() {
          throw new Error("createSourceArtifact should not be called");
        },
        async createSourceChunk() {
          throw new Error("createSourceChunk should not be called");
        },
        async createSourceClaim() {
          throw new Error("createSourceClaim should not be called");
        },
        async getSourceClaimById() {
          throw new Error("getSourceClaimById should not be called");
        },
        async listClaimsForProject(_projectId, limit) {
          return claims.slice(0, limit);
        },
        async listSourceClaimsForRun() {
          throw new Error("listSourceClaimsForRun should not be called");
        },
        async createSourceDecision() {
          throw new Error("createSourceDecision should not be called");
        },
        async createSourceClaimEdge() {
          throw new Error("createSourceClaimEdge should not be called");
        },
        async listSourceClaimEdgesForClaim() {
          throw new Error("listSourceClaimEdgesForClaim should not be called");
        },
        async createSourceDecisionEdge() {
          throw new Error("createSourceDecisionEdge should not be called");
        },
        async getSourceDecisionEdgeById() {
          throw new Error("getSourceDecisionEdgeById should not be called");
        },
        async listSourceDecisionEdgesForClaim(sourceClaimId) {
          return decisionEdges.filter((edge) => edge.sourceClaimId === sourceClaimId);
        },
        async listSourceDecisionEdgesForRun() {
          throw new Error("listSourceDecisionEdgesForRun should not be called");
        },
        async createSourceRejection() {
          throw new Error("createSourceRejection should not be called");
        },
        async listSourceRejectionsForClaim(sourceClaimId) {
          return rejections.filter((rejection) => rejection.sourceClaimId === sourceClaimId);
        }
      },
      async close() {
        input.onClose?.();
      }
    };
  };
};

const parseJsonObject = (text: string): Record<string, unknown> => {
  const parsed: unknown = JSON.parse(text);

  expect(typeof parsed).toBe("object");
  expect(parsed).not.toBeNull();
  expect(Array.isArray(parsed)).toBe(false);

  return parsed as Record<string, unknown>;
};

const arrayValue = (
  value: unknown,
  label: string
): readonly unknown[] => {
  expect(Array.isArray(value), label).toBe(true);

  return value as readonly unknown[];
};

const objectValue = (
  value: unknown,
  label: string
): Record<string, unknown> => {
  expect(typeof value, label).toBe("object");
  expect(value, label).not.toBeNull();
  expect(Array.isArray(value), label).toBe(false);

  return value as Record<string, unknown>;
};

describe("runSourceDecisionGapsCommand", () => {
  it("reports accepted SourceClaims missing SourceDecisionEdge support without writes", async () => {
    let runtimeInput: DatabaseRuntimeInput | undefined;
    let closed = false;
    const result = await runSourceDecisionGapsCommand({
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      cwd: "/repo",
      command: {
        kind: "sourceDecisionGaps",
        projectId: "project-explicit",
        limit: 10,
        json: true
      },
      createDatabaseRuntime: runtime({
        claims: [
          sourceClaim(),
          sourceClaim({
            id: linkedClaimId,
            claim: "Linked SourceClaim should not appear as a gap."
          }),
          sourceClaim({
            id: proposedClaimId,
            status: "proposed",
            claim: "Proposed SourceClaim was never adopted and has no SourceDecision."
          }),
          sourceClaim({
            id: rejectedProposedClaimId,
            status: "proposed",
            claim: "Rejected proposed SourceClaim should show explicit disposition."
          })
        ],
        rejections: [sourceRejection()],
        onRuntimeInput(input) {
          runtimeInput = input;
        },
        onClose() {
          closed = true;
        }
      })
    });
    const output = parseJsonObject(result.stdout);
    const gaps = arrayValue(output.missingDecisionEdgeClaims, "missingDecisionEdgeClaims");
    const firstGap = objectValue(gaps[0], "first gap");
    const unadopted = arrayValue(output.unadoptedClaims, "unadoptedClaims");
    const firstUnadopted = objectValue(unadopted[0], "first unadopted");
    const secondUnadopted = objectValue(unadopted[1], "second unadopted");

    expect(output.kind).toBe("source_decision_gaps");
    expect(output.projectId).toBe(projectId);
    expect(output.dbWrites).toBe("none");
    expect(output.mutation).toBe("none");
    expect(output.acceptedSourceClaimCount).toBe(2);
    expect(output.linkedSourceClaimCount).toBe(1);
    expect(output.missingDecisionEdgeCount).toBe(1);
    expect(firstGap.sourceClaimId).toBe(missingClaimId);
    expect(firstGap.caveat).toContain("has no SourceDecisionEdge support");
    expect(output.unadoptedSourceClaimCount).toBe(2);
    expect(output.resolvedUnadoptedSourceClaimCount).toBe(1);
    expect(output.pendingUnadoptedSourceClaimCount).toBe(1);
    expect(firstUnadopted.sourceClaimId).toBe(proposedClaimId);
    expect(firstUnadopted.status).toBe("proposed");
    expect(firstUnadopted.explicitDisposition).toBe("pending_review");
    expect(secondUnadopted.sourceClaimId).toBe(rejectedProposedClaimId);
    expect(secondUnadopted.explicitDisposition).toBe("rejected");
    expect(secondUnadopted.dispositionReason).toBe("Not a current governing KRN decision.");
    expect(runtimeInput?.projectId).toBe("project-explicit");
    expect(runtimeInput?.requireProjectKernelForExplicitProject).toBe(false);
    expect(runtimeInput?.repoPathHint).toBe("/repo");
    expect(closed).toBe(true);
  });

  it("renders an empty text report when every accepted SourceClaim is linked", async () => {
    const result = await runSourceDecisionGapsCommand({
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      cwd: "/repo",
      command: {
        kind: "sourceDecisionGaps"
      },
      createDatabaseRuntime: runtime({
        claims: [
          sourceClaim({
            id: linkedClaimId
          })
        ],
        decisionEdges: [sourceDecisionEdge()]
      })
    });

    expect(result.stdout).toContain("KRN Source Decision Gaps");
    expect(result.stdout).toContain("missingDecisionEdgeClaims: 0");
    expect(result.stdout).toContain("unadoptedSourceClaims: 0");
    expect(result.stdout).toContain("pendingUnadoptedSourceClaims: 0");
    expect(result.stdout).toContain("- none");
  });
});
