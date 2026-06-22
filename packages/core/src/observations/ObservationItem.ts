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
} from "./observationKinds.js";
import type { ObservationScope } from "./ObservationScope.js";
import type { ObservationSourceRange } from "./ObservationSourceRange.js";
import type { ObservationTemporalScope } from "./ObservationTemporalScope.js";

export type ObservationEntityKind =
  | "workspace"
  | "project"
  | "repo"
  | "file"
  | "package"
  | "source"
  | "memory"
  | "policy"
  | "eval";

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
