import type {
  ObservationGroupId,
  ObservationItemId,
  SourceClaimId
} from "../ids.js";
import type { IsoTimestamp } from "../time.js";
import type {
  ObservationConfidence,
  ObservationKind,
  ObservationPriority,
  ObservationProvenanceKind,
  ObservationStatus
} from "./observation-kinds.js";
import type { ObservationScope } from "./observation-scope.js";
import type { ObservationSourceRange } from "./observation-source-range.js";
import type { ObservationTemporalScope } from "./observation-temporal-scope.js";

export const observationEntityKinds = [
  "workspace",
  "project",
  "repo",
  "file",
  "package",
  "source",
  "memory",
  "policy",
  "eval"
] as const;

export type ObservationEntityKind = (typeof observationEntityKinds)[number];

export const observationClaimRelations = [
  "supports",
  "contradicts",
  "qualifies",
  "supersedes"
] as const;

export interface ObservationEntityLink {
  entityKind: ObservationEntityKind;
  entityId: string;
  relation: string;
}

export interface ObservationClaimLink {
  sourceClaimId: SourceClaimId;
  relation: "supports" | "contradicts" | "qualifies" | "supersedes";
}

export interface ObservationItem {
  id: ObservationItemId;
  groupId: ObservationGroupId;
  scope: ObservationScope;
  kind: ObservationKind;
  status: ObservationStatus;
  priority: ObservationPriority;
  confidence: ObservationConfidence;
  provenanceKind: ObservationProvenanceKind;
  subject: string;
  summary: string;
  body: string;
  temporalScope: ObservationTemporalScope;
  sourceRanges: ObservationSourceRange[];
  entityLinks: ObservationEntityLink[];
  claimLinks: ObservationClaimLink[];
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}
