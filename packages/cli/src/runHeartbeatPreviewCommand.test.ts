import {
  describe,
  expect,
  it
} from "vitest";

import type {
  MemoryRecord,
  ProjectId,
  SourceArtifactId,
  SourceClaim,
  SourceClaimEdge
} from "@krn/core";

import {
  runHeartbeatPreviewCommand
} from "./runHeartbeatPreviewCommand.js";

const now = "2026-06-30T12:00:00.000Z";
const projectId = "11111111-1111-4111-8111-111111111111" as ProjectId;
const memoryRecordId = "22222222-2222-4222-8222-222222222222" as MemoryRecord["id"];
const sourceClaimId = "33333333-3333-4333-8333-333333333333" as SourceClaim["id"];
const relatedSourceClaimId = "44444444-4444-4444-8444-444444444444" as SourceClaim["id"];
const sourceClaimEdgeId = "55555555-5555-4555-8555-555555555555" as SourceClaimEdge["id"];

const memoryRecord: MemoryRecord = {
  id: memoryRecordId,
  projectId,
  key: "heartbeat-preview-memory",
  kind: "pattern",
  status: "active",
  summary: "Heartbeat preview should inspect stale or near-expiry memory.",
  body: "A bounded memory record for heartbeat CLI readback.",
  owner: "krn",
  confidence: 80,
  applicationGuidance: "Use for heartbeat preview tests only.",
  invalidationRule: "Refresh before July 2026.",
  sourceLineage: [
    {
      sourceId: "docs/reviews/controlled-dogfood/v364.md",
      note: "test lineage"
    }
  ],
  isUserPreference: false,
  positiveFeedbackCount: 0,
  negativeFeedbackCount: 0,
  metadata: {},
  validFrom: "2026-06-01T00:00:00.000Z",
  validUntil: "2026-07-02T00:00:00.000Z",
  createdAt: now,
  updatedAt: now
};

const sourceClaim = (
  id: SourceClaim["id"],
  claim: string
): SourceClaim => ({
  id,
  sourceArtifactId: `${id}-artifact` as SourceArtifactId,
  claim,
  mechanism: "SourceClaimEdge rows can produce heartbeat maintenance candidates.",
  krnImplication: "Operators need relation maintenance readback before autonomous graph maintenance.",
  doesNotProve: "This does not prove source truth.",
  trustTier: "project-decision",
  supportType: "implementation-boundary",
  consumer: "heartbeat preview test",
  status: "accepted",
  metadata: {},
  createdAt: now,
  updatedAt: now
});

const sourceClaimEdge: SourceClaimEdge = {
  id: sourceClaimEdgeId,
  fromSourceClaimId: sourceClaimId,
  toSourceClaimId: relatedSourceClaimId,
  kind: "supports",
  metadata: {
    consumer: "heartbeat preview test"
  },
  createdAt: now
};

describe("runHeartbeatPreviewCommand", () => {
  it("renders read-only heartbeat candidates from persisted memory and source state", async () => {
    let closeCount = 0;
    const result = await runHeartbeatPreviewCommand({
      cwd: "/repo",
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      command: {
        kind: "heartbeatPreview",
        projectId,
        memoryLimit: 5,
        sourceClaimLimit: 5,
        maxCandidates: 5,
        evidenceRef: "docs/reviews/controlled-dogfood/v364.md",
        format: "text"
      },
      createDatabaseRuntime: async () => ({
        projectId,
        projectResolution: {
          kind: "explicit_project",
          reason: "Resolved from explicit --project.",
          doesNotProve: "Explicit project resolution does not prove readback quality."
        },
        memoryRepository: {
          async listMemoryRecordsForProject(readProjectId, limit) {
            expect(readProjectId).toBe(projectId);
            expect(limit).toBe(5);
            return [memoryRecord];
          }
        },
        sourceRepository: {
          async listClaimsForProject(readProjectId, limit) {
            expect(readProjectId).toBe(projectId);
            expect(limit).toBe(5);
            return [
              sourceClaim(sourceClaimId, "Heartbeat preview can inspect source edges."),
              sourceClaim(relatedSourceClaimId, "Heartbeat preview can inspect related claims.")
            ];
          },
          async listSourceClaimEdgesForClaim(id) {
            return id === sourceClaimId ? [sourceClaimEdge] : [sourceClaimEdge];
          }
        },
        async close() {
          closeCount += 1;
        }
      })
    });

    expect(result.stdout).toContain("KRN Brain Heartbeat Preview");
    expect(result.stdout).toContain("Persistence: read-only (Postgres)");
    expect(result.stdout).toContain("DB writes: none");
    expect(result.stdout).toContain(`Project: ${projectId}`);
    expect(result.stdout).toContain("Project resolution: explicit_project (explicit project)");
    expect(result.stdout).toContain("Review/eval closure:");
    expect(result.stdout).toContain("decision: ready_for_behavior_proof");
    expect(result.stdout).toContain("nextAction: add_golden_behavior_case");
    expect(result.stdout).toContain("candidateIds:");
    expect(result.stdout).toContain(`memory-staleness-heartbeat:${memoryRecordId}:near_expiry_memory`);
    expect(result.stdout).toContain(`source-relation-heartbeat:${sourceClaimEdgeId}:relation_evidence_is_weak`);
    expect(result.stdout).toContain("memoryRecords: 1");
    expect(result.stdout).toContain("sourceClaims: 2");
    expect(result.stdout).toContain("sourceClaimEdges: 1");
    expect(result.stdout).toContain(`candidate: memory-staleness-heartbeat:${memoryRecordId}:near_expiry_memory`);
    expect(result.stdout).toContain(`candidate: source-relation-heartbeat:${sourceClaimEdgeId}:relation_evidence_is_weak`);
    expect(result.stdout).toContain("reviewability:");
    expect(result.stdout).toContain("evidenceRefs:");
    expect(result.stdout).toContain("doesNotProve:");
    expect(result.stdout).toContain("Mutation boundary:");
    expect(result.stdout).toContain("mutation: none");
    expect(result.stdout).toContain("forbiddenWrites:");
    expect(result.stdout).toContain("Brain heartbeat preview aggregates existing candidate-only maintenance previews");
    expect(closeCount).toBe(1);
  });

  it("requires database configuration", async () => {
    await expect(runHeartbeatPreviewCommand({
      cwd: "/repo",
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      command: {
        kind: "heartbeatPreview",
        format: "text"
      }
    })).rejects.toThrow("KRN_DATABASE_URL is required for krn heartbeat preview");
  });

  it("renders nextAction in json output", async () => {
    const result = await runHeartbeatPreviewCommand({
      cwd: "/repo",
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      command: {
        kind: "heartbeatPreview",
        projectId,
        memoryLimit: 1,
        sourceClaimLimit: 0,
        maxCandidates: 1,
        evidenceRef: "docs/reviews/controlled-dogfood/v364.md",
        format: "json"
      },
      createDatabaseRuntime: async () => ({
        projectId,
        memoryRepository: {
          async listMemoryRecordsForProject() {
            return [memoryRecord];
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
        async close() {}
      })
    });
    const parsed: unknown = JSON.parse(result.stdout);

    expect(parsed).toMatchObject({
      preview: {
        reviewEvalClosure: {
          decision: "ready_for_behavior_proof",
          nextAction: "add_golden_behavior_case",
          mutation: "none"
        },
        candidates: [
          {
            action: "review_memory_invalidation",
            nextAction: "review_memory_invalidation"
          }
        ]
      }
    });
  });
});
