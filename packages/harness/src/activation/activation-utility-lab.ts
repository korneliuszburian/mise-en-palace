export type ActivationUtilityAnswerUsefulness =
  | "useful"
  | "partly_useful_missing_document"
  | "partly_useful_missing_claim"
  | "not_useful"
  | "unknown";

export type ActivationUtilitySignal = "selected_knowledge" | "source_link_graph";

export type ActivationUtilityStrength = "useful" | "weak" | "missing";

export type ActivationUtilityVerdict =
  | "linked_evidence_exploration_candidate"
  | "selected_knowledge_sufficient"
  | "insufficient_evidence";

export interface ActivationUtilityLabInput {
  targetSpecificKnowledgeCount: number;
  answerUsefulness: ActivationUtilityAnswerUsefulness;
  supportingClaims: number;
  supportingDocuments: number;
  sourceClaimDocumentLinks: number;
  linkedSearchDocuments: number;
  relationSupport: number;
}

export interface ActivationUtilitySignalReadback {
  signal: ActivationUtilitySignal;
  strength: ActivationUtilityStrength;
  reasons: readonly string[];
}

export interface ActivationUtilityLabReadback {
  selectedKnowledge: ActivationUtilitySignalReadback;
  sourceLinkGraph: ActivationUtilitySignalReadback;
  verdict: ActivationUtilityVerdict;
  recommendedNextAction: string;
  doesNotProve: string;
}

const positiveEvidenceCount = (input: ActivationUtilityLabInput): number =>
  input.supportingClaims +
  input.supportingDocuments +
  input.sourceClaimDocumentLinks +
  input.linkedSearchDocuments +
  input.relationSupport;

const usefulAnswerStatuses = new Set<ActivationUtilityAnswerUsefulness>([
  "useful",
  "partly_useful_missing_document",
  "partly_useful_missing_claim"
]);

const selectedKnowledgeSignal = (
  input: ActivationUtilityLabInput
): ActivationUtilitySignalReadback => input.targetSpecificKnowledgeCount > 0
  ? {
      signal: "selected_knowledge",
      strength: "useful",
      reasons: [
        `selectedKnowledge returned ${input.targetSpecificKnowledgeCount} target-specific packet(s).`
      ]
    }
  : {
      signal: "selected_knowledge",
      strength: "missing",
      reasons: ["selectedKnowledge returned no target-specific packets."]
    };

const sourceLinkGraphSignal = (
  input: ActivationUtilityLabInput
): ActivationUtilitySignalReadback => {
  const evidenceCount = positiveEvidenceCount(input);
  const usefulAnswer = usefulAnswerStatuses.has(input.answerUsefulness);

  if (usefulAnswer && evidenceCount > 0) {
    return {
      signal: "source_link_graph",
      strength: "useful",
      reasons: [
        `answerUsefulness is ${input.answerUsefulness}.`,
        `source/link/graph evidence count is ${evidenceCount}.`
      ]
    };
  }

  if (evidenceCount > 0) {
    return {
      signal: "source_link_graph",
      strength: "weak",
      reasons: [
        `answerUsefulness is ${input.answerUsefulness}.`,
        `source/link/graph evidence count is ${evidenceCount}.`
      ]
    };
  }

  return {
    signal: "source_link_graph",
    strength: "missing",
    reasons: ["No source/link/graph evidence was present."]
  };
};

export const buildActivationUtilityLabReadback = (
  input: ActivationUtilityLabInput
): ActivationUtilityLabReadback => {
  const selectedKnowledge = selectedKnowledgeSignal(input);
  const sourceLinkGraph = sourceLinkGraphSignal(input);

  if (
    selectedKnowledge.strength === "missing" &&
    sourceLinkGraph.strength === "useful"
  ) {
    return {
      selectedKnowledge,
      sourceLinkGraph,
      verdict: "linked_evidence_exploration_candidate",
      recommendedNextAction:
        "Review linked source/graph evidence as exploration context before treating missing selected knowledge as low utility; do not change production ranking without a bounded eval.",
      doesNotProve:
        "Activation utility lab readback does not prove source truth, ranking quality, semantic-aware Thompson sampling, or product readiness."
    };
  }

  if (selectedKnowledge.strength === "useful") {
    return {
      selectedKnowledge,
      sourceLinkGraph,
      verdict: "selected_knowledge_sufficient",
      recommendedNextAction:
        "Use selected knowledge first; linked evidence can remain supporting context.",
      doesNotProve:
        "Activation utility lab readback does not prove source truth, ranking quality, semantic-aware Thompson sampling, or product readiness."
    };
  }

  return {
    selectedKnowledge,
    sourceLinkGraph,
    verdict: "insufficient_evidence",
    recommendedNextAction:
      "Do not change activation utility; gather stronger source or brain evidence first.",
    doesNotProve:
      "Activation utility lab readback does not prove source truth, ranking quality, semantic-aware Thompson sampling, or product readiness."
  };
};
