import type {
  ContextAssembly,
  ContextAssemblyCurrentStatus,
  ContextExclusion,
  ContextInclusion,
  EvidenceBundle,
  EvidenceCommand,
  ExecutionRun,
  ExecutionRunId,
  ExecutionRunStatus,
  FeedbackDelta,
  FeedbackDeltaCreateStatus,
  HarnessPlan,
  OperatorIntent,
  ReviewAssessment,
  ReviewFinding,
  TaskContract
} from "@krn/core";

import type {
  CreateHarnessPlanInput,
  CreateOperatorIntentInput,
  CreateTaskContractInput,
  NewRunEvent,
  RepositoryMetadata,
  RunEventRecord
} from "./types.js";

export type CreateContextAssemblyStatus = ContextAssemblyCurrentStatus;

export interface CreateContextAssemblyInput extends RepositoryMetadata {
  harnessPlanId: string;
  status?: CreateContextAssemblyStatus;
  tokenBudget?: number;
  inclusions: ContextInclusion[];
  exclusions: ContextExclusion[];
}

export interface CreateExecutionRunInput extends RepositoryMetadata {
  harnessPlanId: string;
  adapter: string;
  status?: ExecutionRunStatus;
  startedAt?: string;
  initialEvent: NewRunEvent;
}

export interface UpdateExecutionRunStatusInput {
  executionRunId: string;
  status: ExecutionRunStatus;
  completedAt?: string;
  event: NewRunEvent;
  metadata?: Record<string, unknown>;
}

export type CreateEvidenceBundleStatus = Extract<EvidenceBundle["status"], "draft" | "captured">;

export interface CreateEvidenceBundleInput extends RepositoryMetadata {
  executionRunId: string;
  status?: CreateEvidenceBundleStatus;
  changedFiles: string[];
  commands: EvidenceCommand[];
  diffRisk: EvidenceBundle["diffRisk"];
  reviewBurden: string;
  rollbackPath: string;
  event: NewRunEvent;
}

export interface CreateReviewAssessmentInput extends RepositoryMetadata {
  evidenceBundleId: string;
  status?: ReviewAssessment["status"];
  reviewer: string;
  summary: string;
  findings: ReviewFinding[];
}

export interface CreateFeedbackDeltaInput extends RepositoryMetadata {
  reviewAssessmentId: string;
  status?: FeedbackDeltaCreateStatus;
  memoryCandidates: FeedbackDelta["memoryCandidates"];
  sourceDecisions: FeedbackDelta["sourceDecisions"];
  evalCandidates: FeedbackDelta["evalCandidates"];
}

export interface HarnessRunAggregate {
  operatorIntent: OperatorIntent;
  taskContract: TaskContract;
  harnessPlan: HarnessPlan;
  contextAssembly?: ContextAssembly;
  executionRun: ExecutionRun;
  evidenceBundles: EvidenceBundle[];
  reviewAssessments: ReviewAssessment[];
  feedbackDeltas: FeedbackDelta[];
  runEvents: RunEventRecord[];
}

export interface HarnessRunRepository {
  createOperatorIntent(input: CreateOperatorIntentInput): Promise<OperatorIntent>;
  createTaskContract(input: CreateTaskContractInput): Promise<TaskContract>;
  createHarnessPlan(input: CreateHarnessPlanInput): Promise<HarnessPlan>;
  createContextAssembly(input: CreateContextAssemblyInput): Promise<ContextAssembly>;
  createExecutionRun(input: CreateExecutionRunInput): Promise<ExecutionRun>;
  updateExecutionRunStatus(input: UpdateExecutionRunStatusInput): Promise<ExecutionRun>;
  createEvidenceBundle(input: CreateEvidenceBundleInput): Promise<EvidenceBundle>;
  createReviewAssessment(input: CreateReviewAssessmentInput): Promise<ReviewAssessment>;
  createFeedbackDelta(input: CreateFeedbackDeltaInput): Promise<FeedbackDelta>;
  getHarnessRunByExecutionRunId(
    executionRunId: ExecutionRunId
  ): Promise<HarnessRunAggregate | undefined>;
}
