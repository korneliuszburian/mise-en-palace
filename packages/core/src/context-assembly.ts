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
} from "./observations/observation-kinds.js";
import type {
  SourceContextTaxonomy,
  SourceAuthorityLabel,
} from "./source.js";
import type { IsoTimestamp } from "./time.js";

export const contextAssemblyCurrentStatuses = [
  "assembled",
  "abstained"
] as const;

export type ContextAssemblyCurrentStatus = typeof contextAssemblyCurrentStatuses[number];

export const contextAssemblyHistoricalStatuses = [
  "stale",
  "superseded"
] as const;

export type ContextAssemblyHistoricalStatus = typeof contextAssemblyHistoricalStatuses[number];

export const contextAssemblyStatuses = [
  ...contextAssemblyCurrentStatuses,
  ...contextAssemblyHistoricalStatuses
] as const;

export type ContextAssemblyStatus = typeof contextAssemblyStatuses[number];

export const contextSubjectTypes = [
  "source_artifact",
  "source_chunk",
  "source_claim",
  "memory_record",
  "anti_memory_record",
  "task_contract",
  "search_document",
  "owner_file"
] as const;

export type ContextSubjectType = (typeof contextSubjectTypes)[number];

export interface ContextSupportingEvidence {
  searchDocumentId: string;
  sourceArtifactId: string;
  sourceChunkId: string;
  contentHash: string;
  renderedContentHash: string;
  sourceRange?: string | undefined;
  content: string;
  truncated: boolean;
}

export interface ContextInclusion extends SourceContextTaxonomy {
  subjectType: ContextSubjectType;
  subjectId: string;
  reason: string;
  expectedUse: string;
  tokenEstimate?: number;
  sourceAuthority: SourceAuthorityLabel;
  supportingEvidence?: ContextSupportingEvidence | undefined;
}

export interface ContextExclusion extends SourceContextTaxonomy {
  subjectType: ContextSubjectType;
  subjectId: string;
  reason: string;
  explanation: string;
  score?: number;
  sourceAuthority: SourceAuthorityLabel;
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
