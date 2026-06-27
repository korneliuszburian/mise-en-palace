import type {
  AntiMemoryCandidateId,
  AntiMemoryRecordId,
  ExecutionRunId,
  MemoryCandidateId,
  MemoryRecordId,
  SourceClaimId
} from "./ids.js";

type IsAssignable<TValue, TTarget> = [TValue] extends [TTarget] ? true : false;
type IsNotAssignable<TValue, TTarget> =
  IsAssignable<TValue, TTarget> extends true ? false : true;
type Assert<TValue extends true> = TValue;

export type BrandedKrnIdCompatibilityProof = [
  Assert<IsAssignable<string, ExecutionRunId>>,
  Assert<IsAssignable<ExecutionRunId, string>>,
  Assert<IsAssignable<string, MemoryRecordId>>,
  Assert<IsAssignable<string, MemoryCandidateId>>,
  Assert<IsAssignable<string, AntiMemoryCandidateId>>,
  Assert<IsAssignable<string, AntiMemoryRecordId>>,
  Assert<IsAssignable<string, SourceClaimId>>
];

export type BrandedKrnIdSeparationProof = [
  Assert<IsNotAssignable<ExecutionRunId, SourceClaimId>>,
  Assert<IsNotAssignable<SourceClaimId, ExecutionRunId>>,
  Assert<IsNotAssignable<MemoryRecordId, MemoryCandidateId>>,
  Assert<IsNotAssignable<MemoryCandidateId, MemoryRecordId>>,
  Assert<IsNotAssignable<MemoryRecordId, SourceClaimId>>,
  Assert<IsNotAssignable<MemoryCandidateId, AntiMemoryCandidateId>>,
  Assert<IsNotAssignable<AntiMemoryCandidateId, MemoryCandidateId>>,
  Assert<IsNotAssignable<AntiMemoryRecordId, MemoryRecordId>>
];
