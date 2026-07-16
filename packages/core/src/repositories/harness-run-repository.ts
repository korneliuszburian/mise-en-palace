import type {
  ContextAssembly,
  ContextAssemblyCurrentStatus,
  ContextExclusion,
  ContextInclusion,
  DecisionPacketContractReadback,
  EvidenceBundle,
  EvidenceCommand,
  ExecutionRun,
  ExecutionRunId,
  ExecutionRunStatus,
  UpdateExecutionRunStatusResult,
  FeedbackDelta,
  FeedbackDeltaCreateStatus,
  HarnessPlan,
  IsoTimestamp,
  KnowledgeUsefulnessOutcomeFeedback,
  OperatorIntent,
  ProjectId,
  ReviewAssessment,
  ReviewFinding,
  SourceUsefulnessOutcomeFeedback,
  TaskContract,
  UsefulnessApplicationEvidence,
  UsefulnessApplicationEvidenceIdentity
} from "@krn/core";

import type {
  CreateHarnessPlanInput,
  CreateOperatorIntentInput,
  CreateTaskContractInput,
  ActivationDecisionRecord,
  RetrievalCandidateRecord,
  RepositoryMetadata,
  OrdinaryRunEventInput,
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
  status?: "planned";
  startedAt?: never;
}

export interface UpdateExecutionRunStatusInput {
  executionRunId: string;
  expectedStatus: ExecutionRunStatus;
  status: ExecutionRunStatus;
  startedAt?: string;
  completedAt?: string;
}

export type CreateEvidenceBundleStatus = Extract<EvidenceBundle["status"], "draft" | "captured">;

export interface CreateEvidenceBundleInput extends RepositoryMetadata {
  executionRunId: string;
  status?: CreateEvidenceBundleStatus;
  changedFiles: string[];
  commands: EvidenceCommand[];
  commandOutputArtifacts?: NonNullable<EvidenceBundle["commandOutputArtifacts"]>;
  diffRisk: EvidenceBundle["diffRisk"];
  reviewBurden: string;
  rollbackPath: string;
  event: OrdinaryRunEventInput;
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

export interface CreateReviewFeedbackOnceInput extends RepositoryMetadata {
  evidenceBundleId: string;
  requestIdentity: string;
  review: Omit<CreateReviewAssessmentInput, "evidenceBundleId">;
  feedback: Omit<CreateFeedbackDeltaInput, "reviewAssessmentId">;
}

export interface CreateReviewFeedbackOnceResult {
  reviewAssessment: ReviewAssessment;
  feedbackDelta: FeedbackDelta;
  created: boolean;
}

export class ReviewFeedbackIdentityConflictError extends Error {
  constructor(
    readonly evidenceBundleId: string,
    readonly requestIdentity: string
  ) {
    super(
      `review feedback identity conflict for ${requestIdentity} on evidence bundle ${evidenceBundleId}: immutable review request differs`
    );
    this.name = "ReviewFeedbackIdentityConflictError";
  }
}

export type FeedbackSubjectKind =
  | "memory_record"
  | "knowledge"
  | "source_claim"
  | "source_decision";

export interface FeedbackSubjectReference {
  kind: FeedbackSubjectKind;
  id: string;
}

export interface ListFeedbackDeltasForSubjectsInput {
  projectId: ProjectId;
  subjects: readonly FeedbackSubjectReference[];
  limitPerSubject?: number;
}

export type FeedbackDeltaProjectLookup =
  | { status: "found"; feedbackDelta: FeedbackDelta }
  | { status: "missing" }
  | { status: "wrong_project" };

export interface FeedbackDeltaLookupRepository {
  getFeedbackDeltaForProject(
    projectId: ProjectId,
    feedbackDeltaId: string
  ): Promise<FeedbackDeltaProjectLookup>;
}

export interface CreateEvalFeedbackDeltaOnceInput extends RepositoryMetadata {
  executionRunId: ExecutionRunId;
  sourceRunLifecycleRevision: number;
  projectId: ProjectId;
  executionIdentity: string;
  evidence: Omit<CreateEvidenceBundleInput, "executionRunId">;
  review: Omit<CreateReviewAssessmentInput, "evidenceBundleId">;
  feedback: Omit<CreateFeedbackDeltaInput, "reviewAssessmentId">;
}

export interface CreateEvalFeedbackDeltaOnceResult {
  evidenceBundle: EvidenceBundle;
  reviewAssessment: ReviewAssessment;
  feedbackDelta: FeedbackDelta;
  created: boolean;
}

export interface DecisionPacketClaim {
  checksum: string;
  generatedAt: IsoTimestamp;
}

export interface RecordUsefulnessApplicationOnceResult {
  application: UsefulnessApplicationEvidence;
  created: boolean;
}

export interface CreateEvidenceFeedbackOnceInput extends RepositoryMetadata {
  executionRunId: ExecutionRunId;
  sourceRunLifecycleRevision: number;
  projectId: ProjectId;
  captureIdentity: string;
  semanticRequest?: {
    decisionPacketClaim?: DecisionPacketClaim;
    sourceUsefulnessOutcomes?: readonly SourceUsefulnessOutcomeFeedback[];
    knowledgeUsefulnessOutcomes?: readonly KnowledgeUsefulnessOutcomeFeedback[];
    maintenance?: {
      reason: string;
    };
  };
  decisionPacketClaim?: DecisionPacketClaim;
  sourceUsefulnessOutcomes?: readonly SourceUsefulnessOutcomeFeedback[];
  knowledgeUsefulnessOutcomes?: readonly KnowledgeUsefulnessOutcomeFeedback[];
  evidence: Omit<CreateEvidenceBundleInput, "executionRunId">;
  review: Omit<CreateReviewAssessmentInput, "evidenceBundleId">;
  feedback: Omit<CreateFeedbackDeltaInput, "reviewAssessmentId">;
  maintenance?: {
    reason: string;
  };
}

export interface CreateEvidenceFeedbackOnceResult {
  evidenceBundle: EvidenceBundle;
  reviewAssessment: ReviewAssessment;
  feedbackDelta: FeedbackDelta;
  feedbackMaintenanceQueueRecordId?: string;
  created: boolean;
}

export class EvidenceFeedbackIdentityConflictError extends Error {
  constructor(
    readonly executionRunId: ExecutionRunId,
    readonly captureIdentity: string
  ) {
    super(
      `evidence feedback identity conflict for ${captureIdentity} in run ${executionRunId}: immutable capture request differs`
    );
    this.name = "EvidenceFeedbackIdentityConflictError";
  }
}

export interface HarnessRunAggregate {
  operatorIntent: OperatorIntent;
  taskContract: TaskContract;
  harnessPlan: HarnessPlan;
  contextAssembly?: ContextAssembly;
  activationTrace?: {
    retrievalRunId: string;
    candidates: RetrievalCandidateRecord[];
    decisions: ActivationDecisionRecord[];
  };
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
  updateExecutionRunStatus(
    input: UpdateExecutionRunStatusInput
  ): Promise<UpdateExecutionRunStatusResult>;
  issueDecisionPacketForExecutionRun?(
    executionRunId: ExecutionRunId
  ): Promise<DecisionPacketContractReadback>;
  getIssuedDecisionPacketForExecutionRun?(
    executionRunId: ExecutionRunId
  ): Promise<DecisionPacketContractReadback | undefined>;
  createEvidenceBundle(input: CreateEvidenceBundleInput): Promise<EvidenceBundle>;
  createReviewAssessment(input: CreateReviewAssessmentInput): Promise<ReviewAssessment>;
  createFeedbackDelta(input: CreateFeedbackDeltaInput): Promise<FeedbackDelta>;
  createReviewFeedbackOnce?(
    input: CreateReviewFeedbackOnceInput
  ): Promise<CreateReviewFeedbackOnceResult>;
  createEvidenceFeedbackOnce?(
    input: CreateEvidenceFeedbackOnceInput
  ): Promise<CreateEvidenceFeedbackOnceResult>;
  recordUsefulnessApplicationOnce?(
    input: UsefulnessApplicationEvidenceIdentity
  ): Promise<RecordUsefulnessApplicationOnceResult>;
  createEvalFeedbackDeltaOnce?(
    input: CreateEvalFeedbackDeltaOnceInput
  ): Promise<CreateEvalFeedbackDeltaOnceResult>;
  listFeedbackDeltasForProject(projectId: string, limit?: number): Promise<FeedbackDelta[]>;
  listFeedbackDeltasForSubjects?(
    input: ListFeedbackDeltasForSubjectsInput
  ): Promise<FeedbackDelta[]>;
  getFeedbackDeltaForProject?(
    projectId: ProjectId,
    feedbackDeltaId: string
  ): Promise<FeedbackDeltaProjectLookup>;
  getHarnessRunByExecutionRunId(
    executionRunId: ExecutionRunId
  ): Promise<HarnessRunAggregate | undefined>;
}
