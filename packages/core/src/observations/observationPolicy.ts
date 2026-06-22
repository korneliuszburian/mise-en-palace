import type {
  ObservationKind,
  ObservationProvenanceKind
} from "./observationKinds.js";

type ObservationSourceRangePolicy = Record<
  ObservationKind,
  Record<ObservationProvenanceKind, boolean>
>;

const sourceRequired = {
  run_event: true,
  source_chunk: true,
  tool_trace: true,
  diff: true,
  evidence_bundle: true,
  review_assessment: true,
  feedback_delta: true,
  user_correction: true,
  user_preference: false,
  local_operator_note: false
} as const satisfies Record<ObservationProvenanceKind, boolean>;

export const OBSERVATION_SOURCE_RANGE_POLICY = {
  fact: sourceRequired,
  decision: sourceRequired,
  correction: sourceRequired,
  risk: sourceRequired,
  procedure: sourceRequired,
  conflict: sourceRequired,
  slang: sourceRequired,
  gap: sourceRequired,
  preference: sourceRequired,
  operator_note: sourceRequired
} as const satisfies ObservationSourceRangePolicy;

export const requiresObservationSourceRange = (
  kind: ObservationKind,
  provenanceKind: ObservationProvenanceKind
): boolean => OBSERVATION_SOURCE_RANGE_POLICY[kind][provenanceKind];
