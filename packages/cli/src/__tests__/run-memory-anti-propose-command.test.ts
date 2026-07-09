import { describe, expect, it } from "vitest";

import type {
  AntiMemoryCandidate,
  AntiMemoryRecord
} from "@krn/core";
import type {
  CreateAntiMemoryCandidateInput,
  RejectedSourceDecisionKnowledgeSource
} from "@krn/core/repositories/internal";

import type { DatabaseRuntime } from "../database-runtime.js";
import { createNoStoreCompilerDependencies } from "../no-store-repositories.js";
import {
  rejectedSourceDecisionToAntiMemoryCandidateInput,
  runMemoryAntiProposeCommand
} from "../run-memory-anti-propose-command.js";
import {
  unusedMemoryRepository
} from "./helpers/test-runtime.js";

const now = "2026-07-09T00:00:00.000Z";

const rejectedKnowledgeSource = (id: string): RejectedSourceDecisionKnowledgeSource => ({
  sourceDecision: {
    id: `source-decision-${id}`,
    projectId: "project-1",
    sourceClaimId: `source-claim-${id}`,
    status: "reject",
    decision: "Do not treat markdown documents as runtime memory.",
    rationale: "Runtime activation must come from store-backed reviewed memory.",
    falsifier: "A rejected source decision creates active memory truth directly.",
    consumer: "memory anti proposal",
    metadata: {},
    createdAt: now,
    updatedAt: now
  },
  sourceClaim: {
    id: `source-claim-${id}`,
    sourceArtifactId: `source-artifact-${id}`,
    claim: "Markdown files are sufficient runtime memory for KRN.",
    mechanism: "Prompt context can read repository documents directly.",
    krnImplication: "KRN would not need store-backed memory activation.",
    doesNotProve: "This does not prove all markdown is useless as source evidence.",
    sourceAuthority: "low",
    supportType: "implementation-boundary",
    consumer: "memory anti proposal",
    falsifier: "Markdown-only runtime memory still beats store-backed activation.",
    status: "rejected",
    metadata: {},
    createdAt: now,
    updatedAt: now
  },
  sourceRejection: {
    id: `source-rejection-${id}`,
    projectId: "project-1",
    sourceArtifactId: `source-artifact-${id}`,
    executionRunId: `execution-run-${id}`,
    sourceClaimId: `source-claim-${id}`,
    title: "Markdown runtime memory rejected",
    attemptedClaim: "Markdown files are sufficient runtime memory for KRN.",
    rejectedBecause: "unsupported",
    reason: "KRN activation must read reviewed memory records, not docs as authority.",
    doesNotProve: "This rejection does not prove docs have no handoff value.",
    consumer: "memory anti proposal",
    metadata: {},
    rejectedAt: now
  }
});

const antiMemoryCandidateWithSourceDecision = (
  sourceDecisionId: string
): AntiMemoryCandidate => ({
  id: `anti-memory-candidate-${sourceDecisionId}`,
  projectId: "project-1",
  proposedBy: "krn memory anti propose",
  key: `rejected-source-decision:${sourceDecisionId}`,
  status: "candidate",
  rejectedClaim: "Existing rejected claim",
  reason: "Existing reason",
  invalidatedBySourceClaimIds: ["source-claim-existing"],
  appliesTo: "memory anti proposal",
  summary: "Existing anti-memory candidate",
  body: "Existing anti-memory candidate",
  owner: "memory anti proposal",
  confidence: 30,
  sourceLineage: [{ sourceId: "source-claim-existing" }],
  validFrom: now,
  metadata: { sourceDecisionId },
  createdAt: now,
  updatedAt: now
});

describe("rejectedSourceDecisionToAntiMemoryCandidateInput", () => {
  it("maps rejected source decisions into reviewable anti-memory candidate input", () => {
    const input = rejectedSourceDecisionToAntiMemoryCandidateInput(
      rejectedKnowledgeSource("1"),
      "project-1",
      now
    );

    expect(input).toMatchObject({
      projectId: "project-1",
      proposedBy: "krn memory anti propose",
      key: "rejected-source-decision:source-decision-1",
      rejectedClaim: "Markdown files are sufficient runtime memory for KRN.",
      reason: "KRN activation must read reviewed memory records, not docs as authority.",
      invalidatedBySourceClaimIds: ["source-claim-1"],
      appliesTo: "memory anti proposal",
      summary: "Markdown runtime memory rejected",
      owner: "memory anti proposal",
      confidence: 25,
      sourceLineage: [
        {
          sourceId: "source-claim-1",
          note: "Markdown files are sufficient runtime memory for KRN."
        },
        {
          sourceId: "source-decision-1",
          note: "Runtime activation must come from store-backed reviewed memory."
        },
        {
          sourceId: "source-rejection-1",
          note: "KRN activation must read reviewed memory records, not docs as authority."
        }
      ],
      validFrom: now,
      metadata: {
        source: "rejected_source_decision_anti_memory_proposal",
        sourceDecisionId: "source-decision-1",
        sourceRejectionId: "source-rejection-1",
        sourceClaimId: "source-claim-1",
        rejectedBecause: "unsupported",
        falsifier: "A rejected source decision creates active memory truth directly.",
        doesNotProve: "This rejection does not prove docs have no handoff value."
      }
    });
  });
});

describe("runMemoryAntiProposeCommand", () => {
  it("creates only missing anti-memory candidates and never promotes anti-memory records", async () => {
    const capturedCandidates: CreateAntiMemoryCandidateInput[] = [];
    let closeCount = 0;
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    const createDatabaseRuntime = async (): Promise<DatabaseRuntime> => ({
      workspaceId: "workspace-1",
      projectId: "project-1",
      compilerDependencies: dependencies,
      harnessRunRepository: {
        async createExecutionRun(): Promise<never> {
          throw new Error("createExecutionRun should not be called");
        },
        async getHarnessRunByExecutionRunId() {
          return undefined;
        },
        async createEvidenceBundle(): Promise<never> {
          throw new Error("createEvidenceBundle should not be called");
        },
        async createReviewAssessment(): Promise<never> {
          throw new Error("createReviewAssessment should not be called");
        },
        async createFeedbackDelta(): Promise<never> {
          throw new Error("createFeedbackDelta should not be called");
        }
      },
      sourceRepository: {
        async createSourceArtifact(): Promise<never> {
          throw new Error("createSourceArtifact should not be called");
        },
        async createSourceClaim(): Promise<never> {
          throw new Error("createSourceClaim should not be called");
        },
        async getSourceClaimById() {
          return undefined;
        },
        async listClaimsForProject() {
          return [];
        },
        async createSourceClaimEdge(): Promise<never> {
          throw new Error("createSourceClaimEdge should not be called");
        },
        async listSourceClaimEdgesForClaim() {
          return [];
        },
        async createSourceDecisionEdge(): Promise<never> {
          throw new Error("createSourceDecisionEdge should not be called");
        },
        async getSourceDecisionEdgeById() {
          return undefined;
        },
        async listSourceDecisionEdgesForClaim() {
          return [];
        },
        async createSourceRejection(): Promise<never> {
          throw new Error("createSourceRejection should not be called");
        },
        async listRejectedSourceDecisionKnowledgeSources() {
          return [rejectedKnowledgeSource("1"), rejectedKnowledgeSource("2")];
        }
      },
      memoryRepository: {
        ...unusedMemoryRepository,
        async listAntiMemoryCandidates() {
          return [antiMemoryCandidateWithSourceDecision("source-decision-2")];
        },
        async listAntiMemoryForProject(): Promise<AntiMemoryRecord[]> {
          return [];
        },
        async createAntiMemoryCandidate(input) {
          capturedCandidates.push(input);

          return {
            ...antiMemoryCandidateWithSourceDecision(
              String(input.metadata?.["sourceDecisionId"] ?? "unknown")
            ),
            id: `anti-memory-candidate-${capturedCandidates.length}`,
            metadata: input.metadata ?? {}
          };
        },
        async promoteReviewedAntiMemoryCandidate(): Promise<never> {
          throw new Error("memory anti propose must not promote AntiMemoryRecord truth");
        }
      } as DatabaseRuntime["memoryRepository"],
      async close() {
        closeCount += 1;
      }
    });

    const result = await runMemoryAntiProposeCommand({
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      createDatabaseRuntime,
      command: {
        kind: "memoryAntiPropose",
        persist: true,
        limit: 10
      }
    });

    expect(result.stdout).toContain("Created candidates: 1");
    expect(result.stdout).toContain("Skipped duplicates: 1");
    expect(result.stdout).toContain("No AntiMemoryRecord promotion performed.");
    expect(capturedCandidates).toHaveLength(1);
    expect(capturedCandidates[0]?.metadata?.sourceDecisionId).toBe("source-decision-1");
    expect(capturedCandidates[0]?.invalidatedBySourceClaimIds).toEqual(["source-claim-1"]);
    expect(closeCount).toBe(1);
  });
});
