import type {
  MemoryRecord
} from "@krn/core";
import type {
  BrainKnowledgeReadModel
} from "@krn/harness";

const memoryConfidence = (confidence: number): BrainKnowledgeReadModel["confidence"] => {
  if (confidence >= 80) {
    return "high";
  }

  if (confidence >= 50) {
    return "medium";
  }

  return confidence > 0 ? "low" : "unknown";
};

const assertNever = (value: never): never => {
  throw new Error(`Unsupported MemoryRecord status: ${String(value)}`);
};

const memoryStatus = (status: MemoryRecord["status"]): BrainKnowledgeReadModel["status"] => {
  switch (status) {
    case "active":
      return "active";
    case "stale":
      return "stale";
    case "superseded":
      return "superseded";
    case "deprecated":
    case "invalidated":
      return "rejected";
    default:
      return assertNever(status);
  }
};

const metadataString = (
  metadata: Record<string, unknown>,
  key: string
): string | undefined => {
  const value = metadata[key];

  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
};

const sourceLineageEvidenceRefs = (
  memory: MemoryRecord
): string[] =>
  memory.sourceLineage.flatMap((source) =>
    source.note === undefined || source.note.trim().length === 0
      ? []
      : [source.note]
  );

export const memoryRecordToKnowledgeCard = (
  memory: MemoryRecord
): BrainKnowledgeReadModel => {
  const evidenceRefs = sourceLineageEvidenceRefs(memory);
  const knowledgeId = metadataString(memory.metadata, "knowledgeId");

  return {
    id: knowledgeId === undefined ? memory.id : `pattern:${knowledgeId}`,
    kind: knowledgeId === undefined ? "memory" : "pattern",
    status: memoryStatus(memory.status),
    title: memory.summary,
    summary: `${memory.body}\n\nApplication guidance: ${memory.applicationGuidance}`,
    confidence: memoryConfidence(memory.confidence),
    reviewability: "ready",
    sourceRefs: memory.sourceLineage.map((source) => source.sourceId),
    evidenceRefs: evidenceRefs.length > 0 ? evidenceRefs : [`memory:${memory.id}`],
    consumers: [memory.owner],
    falsifier:
      metadataString(memory.metadata, "falsifier") ??
      memory.invalidationRule ??
      "The memory no longer matches the operator task or is invalidated by newer source evidence.",
    doesNotProve:
      metadataString(memory.metadata, "doesNotProve") ??
      "DB-backed MemoryRecord selection does not prove source truth, Codex used it, or broad memory ranking quality.",
    temporal: memory.validUntil === undefined
      ? {
          kind: "current",
          observedAt: memory.validFrom
        }
      : {
          kind: "historical",
          validFrom: memory.validFrom,
          validUntil: memory.validUntil
        },
    dissent: {
      kind: "none"
    },
    nextAction: "use"
  };
};
