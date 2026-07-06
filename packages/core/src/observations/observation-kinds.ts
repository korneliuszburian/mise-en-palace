export type ObservationKind =
  | "fact"
  | "decision"
  | "correction"
  | "risk"
  | "procedure"
  | "conflict"
  | "slang"
  | "gap"
  | "preference"
  | "operator_note";

export type ObservationPriority = "low" | "medium" | "high" | "critical";

export type ObservationConfidence = "low" | "medium" | "high";

export type ObservationStatus =
  | "observed"
  | "candidate"
  | "accepted"
  | "contested"
  | "deprecated"
  | "invalidated"
  | "superseded";

export type ObservationProvenanceKind =
  | "run_event"
  | "source_chunk"
  | "tool_trace"
  | "diff"
  | "evidence_bundle"
  | "review_assessment"
  | "feedback_delta"
  | "user_correction"
  | "user_preference"
  | "local_operator_note";
