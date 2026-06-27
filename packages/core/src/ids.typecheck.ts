import type {
  AntiMemoryCandidateId,
  AntiMemoryRecordId,
  EvidenceBundleId,
  EvalCandidateId,
  ExecutionRunId,
  FeedbackDeltaId,
  GoldenCaseId,
  GoldenTaskId,
  MemoryCandidateId,
  MemoryRecordId,
  PolicyGateId,
  ProtectedFailureModeId,
  ReviewAssessmentId,
  SourceClaimId,
  SourceDecisionId,
  SourceRejectionId
} from "./ids.js";

type IsAssignable<TValue, TTarget> = [TValue] extends [TTarget] ? true : false;
type IsNotAssignable<TValue, TTarget> =
  IsAssignable<TValue, TTarget> extends true ? false : true;
type Assert<TValue extends true> = TValue;

export type BrandedKrnIdCompatibilityProof = [
  Assert<IsAssignable<string, ExecutionRunId>>,
  Assert<IsAssignable<ExecutionRunId, string>>,
  Assert<IsAssignable<string, EvidenceBundleId>>,
  Assert<IsAssignable<string, ReviewAssessmentId>>,
  Assert<IsAssignable<string, FeedbackDeltaId>>,
  Assert<IsAssignable<string, MemoryRecordId>>,
  Assert<IsAssignable<string, MemoryCandidateId>>,
  Assert<IsAssignable<string, AntiMemoryCandidateId>>,
  Assert<IsAssignable<string, AntiMemoryRecordId>>,
  Assert<IsAssignable<string, SourceClaimId>>,
  Assert<IsAssignable<string, SourceDecisionId>>,
  Assert<IsAssignable<string, SourceRejectionId>>,
  Assert<IsAssignable<string, PolicyGateId>>,
  Assert<IsAssignable<string, EvalCandidateId>>,
  Assert<IsAssignable<string, GoldenTaskId>>,
  Assert<IsAssignable<string, GoldenCaseId>>,
  Assert<IsAssignable<string, ProtectedFailureModeId>>
];

export type BrandedKrnIdSeparationProof = [
  Assert<IsNotAssignable<ExecutionRunId, SourceClaimId>>,
  Assert<IsNotAssignable<SourceClaimId, ExecutionRunId>>,
  Assert<IsNotAssignable<EvidenceBundleId, ReviewAssessmentId>>,
  Assert<IsNotAssignable<ReviewAssessmentId, EvidenceBundleId>>,
  Assert<IsNotAssignable<ReviewAssessmentId, FeedbackDeltaId>>,
  Assert<IsNotAssignable<FeedbackDeltaId, ReviewAssessmentId>>,
  Assert<IsNotAssignable<EvidenceBundleId, FeedbackDeltaId>>,
  Assert<IsNotAssignable<MemoryRecordId, MemoryCandidateId>>,
  Assert<IsNotAssignable<MemoryCandidateId, MemoryRecordId>>,
  Assert<IsNotAssignable<MemoryRecordId, SourceClaimId>>,
  Assert<IsNotAssignable<SourceClaimId, SourceDecisionId>>,
  Assert<IsNotAssignable<SourceDecisionId, SourceClaimId>>,
  Assert<IsNotAssignable<SourceDecisionId, SourceRejectionId>>,
  Assert<IsNotAssignable<SourceRejectionId, SourceDecisionId>>,
  Assert<IsNotAssignable<PolicyGateId, EvalCandidateId>>,
  Assert<IsNotAssignable<EvalCandidateId, PolicyGateId>>,
  Assert<IsNotAssignable<EvalCandidateId, GoldenTaskId>>,
  Assert<IsNotAssignable<GoldenTaskId, GoldenCaseId>>,
  Assert<IsNotAssignable<GoldenCaseId, ProtectedFailureModeId>>,
  Assert<IsNotAssignable<ProtectedFailureModeId, GoldenCaseId>>,
  Assert<IsNotAssignable<MemoryCandidateId, AntiMemoryCandidateId>>,
  Assert<IsNotAssignable<AntiMemoryCandidateId, MemoryCandidateId>>,
  Assert<IsNotAssignable<AntiMemoryRecordId, MemoryRecordId>>
];
