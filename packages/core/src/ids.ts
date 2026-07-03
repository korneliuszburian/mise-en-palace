declare const krnIdBrand: unique symbol;

/**
 * Nominal-only KRN id marker.
 *
 * Plain strings intentionally remain assignable so repository rows, CLI inputs,
 * and fixture literals do not need a repo-wide minting migration. The marker is
 * only a compile-time separation aid once a value is already typed as a
 * specific KRN id. It is not runtime validation, provenance, or an IO-boundary
 * parser.
 *
 * Do not add stricter branded ids piecemeal. Move to required brands only with
 * explicit parse/mint functions at external boundaries.
 */
export type BrandedKrnId<TBrand extends string> = string & {
  readonly [krnIdBrand]?: TBrand;
};

export type WorkspaceId = string;
export type ProjectId = string;
export type RepoInstallationId = string;
export type ProjectKernelId = string;
export type OperatorIntentId = string;
export type TaskContractId = string;
export type HarnessPlanId = string;
export type ContextAssemblyId = string;
export type CapabilityPlanId = string;
export type CodexAdapterPlanRefId = string;
export type ExecutionRunId = BrandedKrnId<"ExecutionRunId">;
export type EvidenceBundleId = BrandedKrnId<"EvidenceBundleId">;
export type ReviewAssessmentId = BrandedKrnId<"ReviewAssessmentId">;
export type FeedbackDeltaId = BrandedKrnId<"FeedbackDeltaId">;
export type MemoryRecordId = BrandedKrnId<"MemoryRecordId">;
export type MemoryRecordVersionId = string;
export type MemoryCandidateId = BrandedKrnId<"MemoryCandidateId">;
export type MemoryApplicationId = string;
export type MemoryFeedbackEventId = string;
export type AntiMemoryCandidateId = BrandedKrnId<"AntiMemoryCandidateId">;
export type AntiMemoryRecordId = BrandedKrnId<"AntiMemoryRecordId">;
export type ObservationGroupId = string;
export type ObservationItemId = string;
export type ObservationSourceRangeId = string;
export type SourceArtifactId = string;
export type SourceChunkId = string;
export type SourceClaimId = BrandedKrnId<"SourceClaimId">;
export type SourceClaimEdgeId = string;
export type SourceDecisionId = BrandedKrnId<"SourceDecisionId">;
export type SourceDecisionEdgeId = string;
export type SourceRejectionId = BrandedKrnId<"SourceRejectionId">;
export type EvalCandidateId = BrandedKrnId<"EvalCandidateId">;
export type GoldenTaskId = BrandedKrnId<"GoldenTaskId">;
export type GoldenCaseId = BrandedKrnId<"GoldenCaseId">;
export type ProtectedFailureModeId = BrandedKrnId<"ProtectedFailureModeId">;
