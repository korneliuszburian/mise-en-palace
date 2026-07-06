import {
  runCli
} from "../../run-cli.js";
import {
  createNoStoreCompilerDependencies
} from "../../no-store-repositories.js";
import type {
  CreateAntiMemoryCandidateInput,
  CreateEvidenceBundleInput,
  CreateExecutionRunInput,
  CreateFeedbackDeltaInput,
  CreateMemoryCandidateInput,
  CreateMemoryFeedbackEventInput,
  CreateReviewAssessmentInput,
  CreateSourceArtifactInput,
  CreateSourceClaimEdgeInput,
  CreateSourceClaimInput,
  CreateSourceDecisionEdgeInput,
  CreateSourceRejectionInput,
  InvalidateMemoryRecordInput,
  PromoteAntiMemoryCandidateInput,
  PromoteMemoryCandidateInput,
  RejectAntiMemoryCandidateInput,
  RejectMemoryCandidateInput,
  RecordMemoryApplicationInput
} from "@krn/harness/repositories/internal";
import type {
  DatabaseRuntimeInput
} from "../../database-runtime.js";

export const now = "2026-06-21T12:00:00.000Z";

export type CapturedPlanRun = {
  result: Awaited<ReturnType<typeof runCli>>;
  executionRunMetadata: Record<string, unknown> | undefined;
};

export const unusedMemoryRepository = {
  async createMemoryCandidate(_input: CreateMemoryCandidateInput): Promise<never> {
    throw new Error("createMemoryCandidate should not be called");
  },
  async getMemoryCandidateById(_id: string): Promise<never> {
    throw new Error("getMemoryCandidateById should not be called");
  },
  async promoteReviewedMemoryCandidate(_input: PromoteMemoryCandidateInput): Promise<never> {
    throw new Error("promoteReviewedMemoryCandidate should not be called");
  },
  async rejectMemoryCandidate(_input: RejectMemoryCandidateInput): Promise<never> {
    throw new Error("rejectMemoryCandidate should not be called");
  },
  async invalidateMemoryRecord(_input: InvalidateMemoryRecordInput): Promise<never> {
    throw new Error("invalidateMemoryRecord should not be called");
  },
  async getMemoryRecordById(_id: string): Promise<never> {
    throw new Error("getMemoryRecordById should not be called");
  },
  async listMemoryRecordsForProject(_projectId: string): Promise<never> {
    throw new Error("listMemoryRecordsForProject should not be called");
  },
  async listActiveMemory(_projectId: string): Promise<never> {
    throw new Error("listActiveMemory should not be called");
  },
  async recordMemoryApplication(_input: RecordMemoryApplicationInput): Promise<never> {
    throw new Error("recordMemoryApplication should not be called");
  },
  async createMemoryFeedbackEvent(_input: CreateMemoryFeedbackEventInput): Promise<never> {
    throw new Error("createMemoryFeedbackEvent should not be called");
  },
  async createAntiMemoryCandidate(_input: CreateAntiMemoryCandidateInput): Promise<never> {
    throw new Error("createAntiMemoryCandidate should not be called");
  },
  async getAntiMemoryCandidateById(_id: string): Promise<never> {
    throw new Error("getAntiMemoryCandidateById should not be called");
  },
  async promoteReviewedAntiMemoryCandidate(_input: PromoteAntiMemoryCandidateInput): Promise<never> {
    throw new Error("promoteReviewedAntiMemoryCandidate should not be called");
  },
  async rejectAntiMemoryCandidate(_input: RejectAntiMemoryCandidateInput): Promise<never> {
    throw new Error("rejectAntiMemoryCandidate should not be called");
  }
};

export const runPersistedPlanWithCapturedMetadata = async (
  task: string
): Promise<CapturedPlanRun> => {
  let executionRunMetadata: Record<string, unknown> | undefined;
  const result = await runCli(
    [
      "plan",
      "--task",
      task,
      "--persist"
    ],
    {
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      createDatabaseRuntime: async (input: DatabaseRuntimeInput) => {
        const dependencies = createNoStoreCompilerDependencies(input);
        const harnessRunRepository = {
          ...dependencies.harnessRunRepository,
          async createExecutionRun(runInput: CreateExecutionRunInput) {
            executionRunMetadata = runInput.metadata ?? {};

            return {
              id: "execution-run-1",
              harnessPlanId: runInput.harnessPlanId,
              adapter: runInput.adapter,
              status: runInput.status ?? "planned",
              metadata: runInput.metadata ?? {},
              createdAt: now,
              updatedAt: now
            };
          },
          async getHarnessRunByExecutionRunId() {
            return undefined;
          },
          async createEvidenceBundle(_input: CreateEvidenceBundleInput): Promise<never> {
            throw new Error("createEvidenceBundle should not be called");
          },
          async createReviewAssessment(_input: CreateReviewAssessmentInput): Promise<never> {
            throw new Error("createReviewAssessment should not be called");
          },
          async createFeedbackDelta(_input: CreateFeedbackDeltaInput): Promise<never> {
            throw new Error("createFeedbackDelta should not be called");
          }
        };
        const sourceRepository = {
          ...dependencies.sourceRepository,
          async createSourceArtifact(_input: CreateSourceArtifactInput): Promise<never> {
            throw new Error("createSourceArtifact should not be called");
          },
          async createSourceClaim(_input: CreateSourceClaimInput): Promise<never> {
            throw new Error("createSourceClaim should not be called");
          },
          async getSourceClaimById(_id: string): Promise<never> {
            throw new Error("getSourceClaimById should not be called");
          },
          async createSourceClaimEdge(_input: CreateSourceClaimEdgeInput): Promise<never> {
            throw new Error("createSourceClaimEdge should not be called");
          },
          async createSourceDecisionEdge(_input: CreateSourceDecisionEdgeInput): Promise<never> {
            throw new Error("createSourceDecisionEdge should not be called");
          },
          async getSourceDecisionEdgeById(_id: string): Promise<never> {
            throw new Error("getSourceDecisionEdgeById should not be called");
          },
          async createSourceRejection(_input: CreateSourceRejectionInput): Promise<never> {
            throw new Error("createSourceRejection should not be called");
          }
        };

        return {
          workspaceId: "workspace-1",
          projectId: "project-1",
          compilerDependencies: {
            ...dependencies,
            harnessRunRepository
          },
          harnessRunRepository,
          sourceRepository,
          memoryRepository: unusedMemoryRepository,
          async close() {
            return undefined;
          }
        };
      }
    }
  );

  return {
    result,
    executionRunMetadata
  };
};
