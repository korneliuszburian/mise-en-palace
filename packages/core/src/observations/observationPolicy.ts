import type {
  ObservationKind,
  ObservationProvenanceKind
} from "./observationKinds.js";

const sourceRangeExemptProvenance = new Set<ObservationProvenanceKind>([
  "user_preference",
  "local_operator_note"
]);

export const requiresObservationSourceRange = (
  _kind: ObservationKind,
  provenanceKind: ObservationProvenanceKind
): boolean => !sourceRangeExemptProvenance.has(provenanceKind);
