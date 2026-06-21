import type {
  ContextAssemblyId,
  HarnessPlanId
} from "./ids.js";
import type { SourceTrustTier } from "./source.js";
import type { IsoTimestamp } from "./time.js";

export type ContextAssemblyStatus = "assembled" | "abstained" | "stale" | "superseded";

export type ContextSubjectType =
  | "source_artifact"
  | "source_chunk"
  | "source_claim"
  | "memory_record"
  | "anti_memory_record"
  | "task_contract"
  | "search_document";

export interface ContextInclusion {
  subjectType: ContextSubjectType;
  subjectId: string;
  reason: string;
  expectedUse: string;
  tokenEstimate?: number;
  trustTier: SourceTrustTier;
}

export interface ContextExclusion {
  subjectType: ContextSubjectType;
  subjectId: string;
  reason: string;
  explanation: string;
  score?: number;
  trustTier: SourceTrustTier;
}

export interface ContextAssembly {
  id: ContextAssemblyId;
  harnessPlanId: HarnessPlanId;
  status: ContextAssemblyStatus;
  tokenBudget?: number;
  inclusions: ContextInclusion[];
  exclusions: ContextExclusion[];
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
}
