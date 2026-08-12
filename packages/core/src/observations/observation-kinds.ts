export const observationKinds = [
  "fact",
  "decision",
  "correction",
  "risk",
  "procedure",
  "conflict",
  "slang",
  "gap",
  "preference",
  "operator_note"
] as const;

export type ObservationKind = (typeof observationKinds)[number];

export const observationPriorities = ["low", "medium", "high", "critical"] as const;

export type ObservationPriority = (typeof observationPriorities)[number];

export const observationConfidences = ["low", "medium", "high"] as const;

export type ObservationConfidence = (typeof observationConfidences)[number];

export const observationStatuses = [
  "observed",
  "candidate",
  "accepted",
  "contested",
  "deprecated",
  "invalidated",
  "superseded"
] as const;

export type ObservationStatus = (typeof observationStatuses)[number];

export const observationProvenanceKinds = [
  "run_event",
  "source_chunk",
  "tool_trace",
  "diff",
  "evidence_bundle",
  "review_assessment",
  "feedback_delta",
  "user_correction",
  "user_preference",
  "local_operator_note"
] as const;

export type ObservationProvenanceKind = (typeof observationProvenanceKinds)[number];
