import type {
  ContextAssemblyId,
  HarnessPlanId
} from "./ids.js";
import type {
  ActivationAbstention
} from "./activation.js";
import type {
  ObservationConfidence,
  ObservationPriority
} from "./observations/observationKinds.js";
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

export type ContextObservationPrefixExclusionReason =
  | "project_mismatch"
  | "invalidated"
  | "stale"
  | "low_relevance"
  | "anti_memory"
  | "budget_exceeded";

export interface ContextObservationPrefixItem {
  observationId: string;
  kind: string;
  confidence: ObservationConfidence;
  priority: ObservationPriority;
  summary: string;
  sourceRangeCount: number;
  reason: string;
  score: number;
}

export interface ContextObservationPrefixExclusion {
  observationId: string;
  reason: ContextObservationPrefixExclusionReason;
  explanation: string;
}

export interface ContextObservationPrefixWarning {
  observationId: string;
  warning: "contested" | "conflict" | "gap";
  summary: string;
}

export interface ContextObservationPrefix {
  projectId: string;
  taskContractId: string;
  text: string;
  itemCount: number;
  warningCount: number;
  exclusionCount: number;
  items: ContextObservationPrefixItem[];
  warnings: ContextObservationPrefixWarning[];
  exclusions: ContextObservationPrefixExclusion[];
}

export interface ContextObservationPrefixGate {
  status: "rejected";
  reasons: readonly "missing_source_ranges"[];
  rejectedObservationIds: string[];
}

export interface ContextAssembly {
  id: ContextAssemblyId;
  harnessPlanId: HarnessPlanId;
  status: ContextAssemblyStatus;
  tokenBudget?: number;
  inclusions: ContextInclusion[];
  exclusions: ContextExclusion[];
  observationPrefix?: ContextObservationPrefix;
  observationPrefixGate?: ContextObservationPrefixGate;
  activationAbstention?: ActivationAbstention;
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
}
