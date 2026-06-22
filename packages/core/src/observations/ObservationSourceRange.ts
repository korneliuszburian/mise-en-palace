import type {
  EvidenceBundleId,
  ExecutionRunId,
  FeedbackDeltaId,
  ObservationSourceRangeId,
  ReviewAssessmentId,
  SourceChunkId
} from "../ids.js";
import type { IsoTimestamp } from "../time.js";

export type ObservationSourceRangeType =
  | "run_event"
  | "source_chunk"
  | "tool_trace"
  | "diff"
  | "evidence_bundle"
  | "review_assessment"
  | "feedback_delta"
  | "operator_input";

export interface ObservationSourceRange {
  id: ObservationSourceRangeId;
  sourceType: ObservationSourceRangeType;
  sourceId:
    | ExecutionRunId
    | SourceChunkId
    | EvidenceBundleId
    | ReviewAssessmentId
    | FeedbackDeltaId
    | string;
  locator: string;
  excerpt?: string;
  capturedAt: IsoTimestamp;
}
