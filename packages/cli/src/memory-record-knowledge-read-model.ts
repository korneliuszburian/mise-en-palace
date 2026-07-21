import type {
  MemoryRecord
} from "@krn/core";
import type {
  KnowledgeReadModel
} from "@krn/harness";

const memoryConfidence = (confidence: number): KnowledgeReadModel["confidence"] => {
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

const memoryStatus = (status: MemoryRecord["status"]): KnowledgeReadModel["status"] => {
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

const uniqueStrings = (values: readonly string[]): string[] => [...new Set(values)];

const metadataStringArray = (
  metadata: Record<string, unknown>,
  key: string
): string[] | undefined => {
  const value = metadata[key];

  if (!Array.isArray(value)) {
    return undefined;
  }

  const strings = uniqueStrings(
    value.flatMap((item) =>
      typeof item === "string" && item.trim().length > 0 ? [item.trim()] : []
    )
  );

  return strings.length === 0 ? undefined : strings;
};

const sourceLineageEvidenceRefs = (
  memory: MemoryRecord
): string[] =>
  uniqueStrings(memory.sourceLineage.flatMap((source) =>
    source.note === undefined || source.note.trim().length === 0
      ? []
      : [source.note]
  ));

export const memoryRecordToKnowledgeReadModel = (
  memory: MemoryRecord
): KnowledgeReadModel => {
  const evidenceRefs =
    metadataStringArray(memory.metadata, "evidenceRefs") ??
    sourceLineageEvidenceRefs(memory);
  const knowledgeId = metadataString(memory.metadata, "knowledgeId");
  const mechanism = metadataString(memory.metadata, "mechanism");
  const krnImplication = metadataString(memory.metadata, "krnImplication");

  return {
    id: knowledgeId === undefined ? memory.id : `knowledge:${knowledgeId}`,
    memoryRecordId: memory.id,
    kind: knowledgeId === undefined ? "memory" : "procedure",
    status: memoryStatus(memory.status),
    title: memory.summary,
    summary: `${memory.body}\n\nApplication guidance: ${memory.applicationGuidance}`,
    ...(mechanism === undefined ? {} : { mechanism }),
    ...(krnImplication === undefined ? {} : { krnImplication }),
    confidence: memoryConfidence(memory.confidence),
    reviewability: "ready",
    sourceRefs:
      metadataStringArray(memory.metadata, "sourceRefs") ??
      memory.sourceLineage.map((source) => source.sourceId),
    evidenceRefs: evidenceRefs.length > 0 ? evidenceRefs : [`memory:${memory.id}`],
    consumers: metadataStringArray(memory.metadata, "consumers") ?? [memory.owner],
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
