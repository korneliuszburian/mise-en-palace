import { describe, expect, it } from "vitest";

import type {
  MemoryCandidate,
  MemoryRecord
} from "@krn/core";
import type {
  CreateMemoryCandidateInput,
  SourceDecisionKnowledgeSource
} from "@krn/core/repositories/internal";

import type { DatabaseRuntime } from "../database-runtime.js";
import { createNoStoreCompilerDependencies } from "../no-store-repositories.js";
import {
  runMemoryKnowledgeProposeCommand,
  sourceDecisionKnowledgeSourceToMemoryCandidateInput
} from "../run-memory-knowledge-propose-command.js";
import {
  unusedMemoryRepository
} from "./helpers/test-runtime.js";

const now = "2026-07-09T00:00:00.000Z";

const knowledgeSource = (id: string): SourceDecisionKnowledgeSource => ({
  sourceDecision: {
    id: `source-decision-${id}`,
    projectId: "project-1",
    sourceClaimId: `source-claim-${id}`,
    status: "adopt",
    decision: "Use source decisions to propose reviewed knowledge.",
    rationale: "The source decision has accepted claim support.",
    falsifier: "A source decision becomes MemoryRecord truth without review.",
    consumer: "memory knowledge proposal",
    metadata: {},
    createdAt: now,
    updatedAt: now
  },
  sourceClaim: {
    id: `source-claim-${id}`,
    sourceArtifactId: `source-artifact-${id}`,
    claim: "Store-backed source decisions can seed reviewable knowledge proposals.",
    mechanism: "The read model binds accepted SourceClaim and SourceDecisionEdge.",
    krnImplication: "KRN can propose MemoryCandidate rows without JSON catalog authority.",
    doesNotProve: "This does not prove the proposed knowledge should be promoted.",
    sourceAuthority: "project-decision",
    supportType: "implementation-boundary",
    consumer: "memory knowledge proposal",
    falsifier: "Missing source support still creates a memory candidate.",
    status: "accepted",
    metadata: {},
    createdAt: now,
    updatedAt: now
  },
  sourceDecisionEdge: {
    id: `source-decision-edge-${id}`,
    sourceClaimId: `source-claim-${id}`,
    targetType: "memory_record",
    targetId: `knowledge-${id}`,
    supportType: "implementation-boundary",
    confidence: "high",
    notes: "Decision support for memory candidate proposal.",
    metadata: {},
    createdAt: now
  }
});

const memoryCandidateWithSourceDecision = (sourceDecisionId: string): MemoryCandidate => ({
  id: `memory-candidate-${sourceDecisionId}`,
  projectId: "project-1",
  proposedBy: "krn memory propose",
  kind: "procedure",
  status: "candidate",
  summary: "Existing candidate",
  body: "Existing candidate",
  owner: "memory knowledge proposal",
  confidence: 90,
  applicationGuidance: "Existing candidate",
  sourceClaimIds: ["source-claim-existing"],
  sourceLineage: [{ sourceId: "source-claim-existing" }],
  isUserPreference: false,
  validFrom: now,
  metadata: { sourceDecisionId },
  createdAt: now,
  updatedAt: now
});

describe("sourceDecisionKnowledgeSourceToMemoryCandidateInput", () => {
  it("maps accepted source decision support into a reviewable memory candidate input", () => {
    const input = sourceDecisionKnowledgeSourceToMemoryCandidateInput(
      knowledgeSource("1"),
      "project-1",
      now
    );

    expect(input).toMatchObject({
      projectId: "project-1",
      proposedBy: "krn memory propose",
      kind: "procedure",
      summary: "Use source decisions to propose reviewed knowledge.",
      owner: "memory knowledge proposal",
      confidence: 90,
      sourceClaimIds: ["source-claim-1"],
      sourceLineage: [
        {
          sourceId: "source-claim-1",
          note: "Store-backed source decisions can seed reviewable knowledge proposals."
        },
        {
          sourceId: "source-decision-1",
          note: "The source decision has accepted claim support."
        },
        {
          sourceId: "source-decision-edge-1",
          note: "Decision support for memory candidate proposal."
        }
      ],
      isUserPreference: false,
      validFrom: now,
      metadata: {
        source: "source_decision_knowledge_proposal",
        sourceDecisionId: "source-decision-1",
        sourceDecisionEdgeId: "source-decision-edge-1",
        sourceClaimId: "source-claim-1",
        mechanism: "The read model binds accepted SourceClaim and SourceDecisionEdge.",
        krnImplication: "KRN can propose MemoryCandidate rows without JSON catalog authority.",
        falsifier: "A source decision becomes MemoryRecord truth without review.",
        doesNotProve: "This does not prove the proposed knowledge should be promoted.",
        reflectionCandidateEvidence: {
          provenance: "source_claim",
          evidenceRefs: [
            "source-claim-1",
            "source-decision-1",
            "source-decision-edge-1"
          ],
          doesNotProve: "This does not prove the proposed knowledge should be promoted."
        },
        projectStandardDecision: {
          kind: "krn.projectStandardDecision.v1",
          sourceRefs: ["source-claim-1"],
          mechanism: "The read model binds accepted SourceClaim and SourceDecisionEdge.",
          krnImplication: "KRN can propose MemoryCandidate rows without JSON catalog authority.",
          decision: "Use source decisions to propose reviewed knowledge.",
          consumer: "memory knowledge proposal",
          falsifier: "A source decision becomes MemoryRecord truth without review.",
          doesNotProve: "This does not prove the proposed knowledge should be promoted."
        }
      }
    });
  });
});

describe("runMemoryKnowledgeProposeCommand", () => {
  it("creates only missing memory candidates and never promotes memory records", async () => {
    const capturedCandidates: CreateMemoryCandidateInput[] = [];
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
        async listSourceDecisionKnowledgeSources() {
          return [knowledgeSource("1"), knowledgeSource("2")];
        }
      },
      memoryRepository: {
        ...unusedMemoryRepository,
        async listMemoryCandidates() {
          return [memoryCandidateWithSourceDecision("source-decision-2")];
        },
        async listMemoryRecordsForProject(): Promise<MemoryRecord[]> {
          return [];
        },
        async createMemoryCandidate(input) {
          capturedCandidates.push(input);

          return {
            ...memoryCandidateWithSourceDecision(
              String(input.metadata?.["sourceDecisionId"] ?? "unknown")
            ),
            id: `memory-candidate-${capturedCandidates.length}`,
            metadata: input.metadata ?? {}
          };
        },
        async promoteReviewedMemoryCandidate(): Promise<never> {
          throw new Error("memory propose must not promote MemoryRecord truth");
        }
      } as DatabaseRuntime["memoryRepository"],
      async close() {
        closeCount += 1;
      }
    });

    const result = await runMemoryKnowledgeProposeCommand({
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      createDatabaseRuntime,
      command: {
        kind: "memoryKnowledgePropose",
        persist: true,
        limit: 10
      }
    });

    expect(result.stdout).toContain("Created candidates: 1");
    expect(result.stdout).toContain("Skipped duplicates: 1");
    expect(result.stdout).toContain("No MemoryRecord promotion performed.");
    expect(capturedCandidates).toHaveLength(1);
    expect(capturedCandidates[0]?.metadata?.sourceDecisionId).toBe("source-decision-1");
    expect(closeCount).toBe(1);
  });
});
