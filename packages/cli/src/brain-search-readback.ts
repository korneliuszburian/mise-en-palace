import {
  buildActivationUtilityLabReadback
} from "@krn/harness";
import type {
  ActivationUtilityAnswerUsefulness,
  ActivationUtilityLabReadback
} from "@krn/harness";
import {
  classifyTargetFit,
  summarizeTargetFit
} from "@krn/core";
import type {
  TargetFit,
  TargetFitSummary
} from "@krn/core";

export interface JsonRecord {
  readonly [key: string]: unknown;
}

const isJsonRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export interface BrainSearchPreviewResource {
  kind: "krn.memorySearch.preview.v1";
  access: "read_only";
  mutation: "none";
  query: string;
  memoryRecallReadback: "fixture_catalog" | "store_backed";
  memoryRecallQueries: readonly string[];
  knowledgeReadModels: {
    totalReadModels: number;
    returnedReadModels: number;
    readModelIds: readonly string[];
    selectedKnowledge: readonly BrainSearchKnowledgePacket[];
    targetFitSummary: TargetFitSummary;
    doesNotProve: readonly string[];
  };
  sourceSearch: {
    answerUsefulness: string;
    supportingClaims: number;
    supportingClaimIds: readonly string[];
    supportingDocuments: number;
    sourceClaimDocumentLinks: number;
    linkedSearchDocuments: number;
    sourceClaimDocumentLinkCaveats: readonly string[];
    relationSupport: number;
    sourceDecisionSupport: number;
    graphReadback: {
      claimNodes: number;
      relationEdges: number;
      temporalEdges: number;
      contradictionEdges: number;
      duplicateEdges: number;
      invalidationEdges: number;
      graphAware: boolean;
      caveats: readonly string[];
    };
    includedCandidates: number;
    missingEvidence: readonly string[];
    doesNotProve: readonly string[];
  };
  activationUtility: ActivationUtilityLabReadback;
  recommendedNextAction: string;
  proof: {
    proves: readonly string[];
    doesNotProve: readonly string[];
  };
}

export interface BrainSearchKnowledgePacket {
  id: string;
  title: string;
  summary: string;
  mechanism?: string;
  krnImplication?: string;
  source: "catalog_file" | "memory_store" | "source_search";
  targetFit: TargetFit;
  targetFitReasons: readonly string[];
  reviewability: "ready" | "needs_more_evidence";
  reviewabilityReasons: readonly string[];
  consumers: readonly string[];
  falsifier: string;
  doesNotProve: string;
  nextAction: string;
}

interface SourceSearchKnowledgeFields {
  id: string;
  label: string | undefined;
  claimText: string | undefined;
  mechanism: string | undefined;
  krnImplication: string | undefined;
  consumer: string | undefined;
  falsifier: string | undefined;
  doesNotProve: string | undefined;
  reason: string | undefined;
}

type BrainSearchRecommendationResource = Pick<
  BrainSearchPreviewResource,
  "memoryRecallReadback" | "knowledgeReadModels" | "sourceSearch"
>;

export const parseJsonObject = (text: string, label: string): JsonRecord => {
  const parsed: unknown = JSON.parse(text);

  if (!isJsonRecord(parsed)) {
    throw new Error(`${label} JSON output must be an object`);
  }

  return parsed;
};

const recordValue = (
  value: unknown
): JsonRecord | undefined =>
  isJsonRecord(value) ? value : undefined;

const stringValue = (value: unknown, fallback: string): string =>
  typeof value === "string" ? value : fallback;

const nonEmptyStringValue = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;

const numberValue = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

const arrayValue = (value: unknown): readonly unknown[] =>
  Array.isArray(value) ? value : [];

const stringArrayValue = (value: unknown): readonly string[] =>
  arrayValue(value).filter((item): item is string => typeof item === "string");

const booleanValue = (value: unknown): boolean =>
  typeof value === "boolean" ? value : false;

const activationUtilityAnswerUsefulness = (
  value: string
): ActivationUtilityAnswerUsefulness => {
  switch (value) {
    case "useful":
    case "partly_useful_missing_document":
    case "partly_useful_missing_claim":
    case "not_useful":
      return value;
    default:
      return "unknown";
  }
};

const linkedSearchDocumentCount = (
  sourceClaimDocumentLinks: readonly unknown[]
): number =>
  sourceClaimDocumentLinks.reduce<number>((sum, item) => {
    const link = recordValue(item);

    return sum + (link === undefined ? 0 : numberValue(link["linkedSearchDocumentCount"]));
  }, 0);

const sourceClaimDocumentLinkCaveats = (
  sourceClaimDocumentLinks: readonly unknown[]
): readonly string[] =>
  sourceClaimDocumentLinks.flatMap((item) => {
    const link = recordValue(item);
    const caveat = link === undefined ? undefined : nonEmptyStringValue(link["caveat"]);

    return caveat === undefined ? [] : [caveat];
  });

const sourceClaimIds = (
  supportingClaims: readonly unknown[]
): readonly string[] =>
  supportingClaims.flatMap((claim) => {
    const record = recordValue(claim);

    if (record === undefined) {
      return [];
    }

    return optionalStringArray(sourceSearchKnowledgeId(record));
  });

const firstDefinedString = (values: readonly (string | undefined)[]): string =>
  values.find((value): value is string => value !== undefined) ?? "";

const optionalStringArray = (value: string | undefined): readonly string[] =>
  value === undefined ? [] : [value];

const optionalMechanism = (
  mechanism: string | undefined
): Pick<BrainSearchKnowledgePacket, "mechanism"> | Record<string, never> =>
  mechanism === undefined ? {} : { mechanism };

const optionalKrnImplication = (
  krnImplication: string | undefined
): Pick<BrainSearchKnowledgePacket, "krnImplication"> | Record<string, never> =>
  krnImplication === undefined ? {} : { krnImplication };

const sourceKnowledgeNextAction: Record<
  BrainSearchKnowledgePacket["reviewability"],
  string
> = {
  ready: "use",
  needs_more_evidence: "needs_more_evidence"
};

const packetTargetFitText = (packet: BrainSearchKnowledgePacket): string =>
  [
    packet.id,
    packet.title,
    packet.summary,
    packet.mechanism ?? "",
    packet.krnImplication ?? "",
    packet.source,
    ...packet.consumers,
    packet.falsifier,
    packet.nextAction
  ].join(" ");

const withTargetFit = (
  query: string,
  packet: BrainSearchKnowledgePacket
): BrainSearchKnowledgePacket => ({
  ...packet,
  ...classifyTargetFit({
    query,
    text: packetTargetFitText(packet),
    emptyTextReason: "selectedKnowledge packet has no classifiable text."
  })
});

const proofDoesNotProve = (value: unknown): readonly string[] => {
  const proof = recordValue(value);

  if (proof === undefined) {
    return [];
  }

  return stringArrayValue(proof["doesNotProve"]);
};

const knowledgeReadModelIds = (readModels: readonly unknown[]): readonly string[] =>
  readModels.flatMap((readModel) => {
    const record = recordValue(readModel);
    const id = record === undefined ? undefined : record["id"];

    return typeof id === "string" ? [id] : [];
  });

const reviewabilityReasonsFor = (
  fields: readonly {
    name: string;
    value: string | readonly string[] | undefined;
  }[]
): readonly string[] =>
  fields.map((field) => {
    let present = false;

    if (Array.isArray(field.value)) {
      present = field.value.length > 0;
    } else if (typeof field.value === "string") {
      present = field.value.trim().length > 0;
    }

    return present
      ? `${field.name} present.`
      : `${field.name} missing.`;
  });

const reviewabilityFromReasons = (
  reasons: readonly string[]
): BrainSearchKnowledgePacket["reviewability"] =>
  reasons.some((reason) => reason.includes("missing."))
    ? "needs_more_evidence"
    : "ready";

const knowledgePackets = (
  readModels: readonly unknown[],
  query: string,
  source: BrainSearchKnowledgePacket["source"] = "catalog_file"
): readonly BrainSearchKnowledgePacket[] =>
  readModels.flatMap((readModel) => {
    const record = recordValue(readModel);

    if (record === undefined) {
      return [];
    }

    const id = record["id"];

    if (typeof id !== "string") {
      return [];
    }
    const consumers = stringArrayValue(record["consumers"]);
    const falsifier = nonEmptyStringValue(record["falsifier"]);
    const doesNotProve = nonEmptyStringValue(record["doesNotProve"]);
    const reviewabilityReasons = reviewabilityReasonsFor([
      { name: "knowledge id", value: id },
      { name: "consumer", value: consumers },
      { name: "falsifier", value: falsifier },
      { name: "doesNotProve", value: doesNotProve }
    ]);

    return [withTargetFit(query, {
      id,
      title: stringValue(record["title"], ""),
      summary: stringValue(record["summary"], ""),
      ...optionalMechanism(nonEmptyStringValue(record["mechanism"])),
      ...optionalKrnImplication(nonEmptyStringValue(record["krnImplication"])),
      source,
      targetFit: "unknown",
      targetFitReasons: [],
      reviewability: reviewabilityFromReasons(reviewabilityReasons),
      reviewabilityReasons,
      consumers,
      falsifier: falsifier ?? "",
      doesNotProve: doesNotProve ?? "",
      nextAction: stringValue(record["nextAction"], "unknown")
    })];
  });

const sourceSearchKnowledgeId = (record: JsonRecord): string | undefined =>
  nonEmptyStringValue(record["sourceClaimId"]) ??
  nonEmptyStringValue(record["subjectId"]) ??
  nonEmptyStringValue(record["id"]) ??
  nonEmptyStringValue(record["label"]);

const sourceSearchKnowledgeFields = (
  record: JsonRecord
): SourceSearchKnowledgeFields | undefined => {
  const id = sourceSearchKnowledgeId(record);

  if (id === undefined) {
    return undefined;
  }
  return {
    id,
    label: nonEmptyStringValue(record["label"]),
    claimText: nonEmptyStringValue(record["claim"]),
    mechanism: nonEmptyStringValue(record["mechanism"]),
    krnImplication:
      nonEmptyStringValue(record["krnImplication"]) ??
      nonEmptyStringValue(record["expectedUse"]),
    consumer: nonEmptyStringValue(record["consumer"]),
    falsifier: nonEmptyStringValue(record["falsifier"]),
    doesNotProve: nonEmptyStringValue(record["doesNotProve"]),
    reason: nonEmptyStringValue(record["reason"])
  };
};

const sourceSearchKnowledgeReviewability = (
  fields: SourceSearchKnowledgeFields
): readonly string[] =>
  reviewabilityReasonsFor([
    { name: "SourceClaim id", value: fields.id },
    { name: "claim", value: fields.claimText },
    { name: "mechanism", value: fields.mechanism },
    { name: "KRN implication", value: fields.krnImplication },
    { name: "consumer", value: fields.consumer },
    { name: "falsifier", value: fields.falsifier },
    { name: "doesNotProve", value: fields.doesNotProve }
  ]);

const sourceSearchKnowledgePacketFromFields = (
  fields: SourceSearchKnowledgeFields
): BrainSearchKnowledgePacket => {
  const reviewabilityReasons = sourceSearchKnowledgeReviewability(fields);
  const reviewability = reviewabilityFromReasons(reviewabilityReasons);

  return {
    id: fields.id,
    title: firstDefinedString([fields.claimText, fields.label, fields.id]),
    summary: firstDefinedString([fields.krnImplication, fields.mechanism, fields.reason]),
    ...optionalMechanism(fields.mechanism),
    ...optionalKrnImplication(fields.krnImplication),
    source: "source_search",
    targetFit: "unknown",
    targetFitReasons: [],
    reviewability,
    reviewabilityReasons,
    consumers: optionalStringArray(fields.consumer),
    falsifier: firstDefinedString([
      fields.falsifier,
      "missing falsifier; do not treat this source evidence as review-ready memory recall"
    ]),
    doesNotProve:
      fields.doesNotProve ??
      "This source-search candidate does not prove a memory recall is review-ready.",
    nextAction: sourceKnowledgeNextAction[reviewability]
  };
};

const sourceSearchKnowledgePacket = (
  record: JsonRecord
): BrainSearchKnowledgePacket | undefined => {
  const fields = sourceSearchKnowledgeFields(record);

  return fields === undefined ? undefined : sourceSearchKnowledgePacketFromFields(fields);
};

const sourceSearchKnowledgePackets = (
  supportingClaims: readonly unknown[],
  query: string
): readonly BrainSearchKnowledgePacket[] =>
  supportingClaims.flatMap((claim) => {
    const record = recordValue(claim);

    if (record === undefined) {
      return [];
    }
    const packet = sourceSearchKnowledgePacket(record);

    return packet === undefined ? [] : [withTargetFit(query, packet)];
  });

const selectedKnowledgePackets = (input: {
  memoryRecallReadback: BrainSearchPreviewResource["memoryRecallReadback"];
  readModels: readonly unknown[];
  supportingClaims: readonly unknown[];
  query: string;
}): readonly BrainSearchKnowledgePacket[] => {
  const sourcePackets = sourceSearchKnowledgePackets(input.supportingClaims, input.query);

  if (input.memoryRecallReadback === "store_backed") {
    const storePackets = knowledgePackets(input.readModels, input.query, "memory_store");

    return storePackets.length > 0
      ? [...storePackets, ...sourcePackets]
      : sourcePackets;
  }

  const catalogPackets = knowledgePackets(input.readModels, input.query);

  return catalogPackets.length > 0
    ? catalogPackets
    : sourcePackets.filter((packet) => packet.reviewability === "ready");
};

const sourceEvidenceCount = (
  sourceSearch: BrainSearchPreviewResource["sourceSearch"]
): number => sourceSearch.supportingClaims + sourceSearch.supportingDocuments;

const nonTargetSpecificRecommendation = (
  targetFit: TargetFitSummary
): string | undefined => {
  if (
    targetFit.verdict === "generic_only_selected_knowledge" ||
    targetFit.verdict === "adjacent_or_unknown_selected_knowledge"
  ) {
    return targetFit.recommendedUse;
  }

  return undefined;
};

const storeBackedRecommendation = (
  resource: BrainSearchRecommendationResource
): string | undefined => {
  if (resource.memoryRecallReadback !== "store_backed") {
    return undefined;
  }

  const hasStoreMemory = resource.knowledgeReadModels.selectedKnowledge.some(
    (packet) => packet.source === "memory_store"
  );

  if (hasStoreMemory && sourceEvidenceCount(resource.sourceSearch) > 0) {
    return "Use the store-backed memory with source-search evidence; treat this as controlled KRN context, not broad product truth.";
  }

  if (hasStoreMemory) {
    return "Use the store-backed memory cautiously; add source-search evidence before claiming source-grounded implementation authority.";
  }

  return sourceEvidenceCount(resource.sourceSearch) > 0
    ? "Use the store-backed source/search evidence cautiously; use fixture-catalog memory search only for explicit test/import readbacks."
    : "Do not infer product truth from store-backed memory search; seed or persist governed source evidence first.";
};

const catalogRecommendation = (
  resource: BrainSearchRecommendationResource
): string => {
  const hasReturnedReadModels = resource.knowledgeReadModels.returnedReadModels > 0;
  const hasSelectedKnowledge = resource.knowledgeReadModels.selectedKnowledge.length > 0;
  const hasSourceEvidence = sourceEvidenceCount(resource.sourceSearch) > 0;

  if (hasReturnedReadModels && hasSourceEvidence) {
    return "Use the matching knowledge and source-search answer package as evidence before changing code.";
  }

  if (!hasReturnedReadModels && hasSelectedKnowledge) {
    return "Use source-backed selected knowledge as a Knowledge Application Gate; do not treat it as file-catalog coverage.";
  }

  if (hasSourceEvidence) {
    return "Use source-search evidence cautiously and run a narrower memory recall query before retaining knowledge.";
  }

  if (hasReturnedReadModels) {
    return "Use the matching knowledge as guidance, but gather source evidence before implementation claims.";
  }

  return "Do not infer product truth; narrow the query or ingest/review source evidence first.";
};

const buildRecommendedNextAction = (
  resource: BrainSearchRecommendationResource
): string => {
  const targetFitRecommendation = nonTargetSpecificRecommendation(
    resource.knowledgeReadModels.targetFitSummary
  );

  if (targetFitRecommendation !== undefined) {
    return targetFitRecommendation;
  }

  const storeBacked = storeBackedRecommendation(resource);

  if (storeBacked !== undefined) {
    return storeBacked;
  }

  return catalogRecommendation(resource);
};

export const returnedKnowledgeReadModelCount = (knowledgeJson: JsonRecord): number =>
  numberValue(knowledgeJson["returnedReadModels"]);

export const buildBrainSearchPreviewResource = (
  input: {
    query: string;
    memoryRecallReadback: BrainSearchPreviewResource["memoryRecallReadback"];
    memoryRecallQueries: readonly string[];
    knowledgeJson: JsonRecord;
    sourceJson: JsonRecord;
  }
): BrainSearchPreviewResource => {
  const readModels = arrayValue(input.knowledgeJson["readModels"]);
  const answerPackage = recordValue(input.sourceJson["answerPackage"]) ?? {};
  const supportingClaims = arrayValue(answerPackage["supportingClaims"]);
  const supportingDocuments = arrayValue(answerPackage["supportingDocuments"]);
  const sourceClaimDocumentLinks = arrayValue(answerPackage["sourceClaimDocumentLinks"]);
  const relationSupport = arrayValue(answerPackage["relationSupport"]);
  const sourceDecisionSupport = arrayValue(answerPackage["sourceDecisionSupport"]);
  const graphReadback = recordValue(answerPackage["graphReadback"]) ?? {};
  const includedCandidates = arrayValue(input.sourceJson["includedCandidates"]);
  const selectedKnowledge = selectedKnowledgePackets({
    memoryRecallReadback: input.memoryRecallReadback,
    readModels,
    supportingClaims,
    query: input.query
  });
  const targetFitSummary = summarizeTargetFit(selectedKnowledge);
  const answerUsefulness = stringValue(answerPackage["answerUsefulness"], "unknown");
  const linkedSearchDocuments = linkedSearchDocumentCount(sourceClaimDocumentLinks);
  const activationUtility = buildActivationUtilityLabReadback({
    targetSpecificKnowledgeCount: targetFitSummary.targetSpecific,
    answerUsefulness: activationUtilityAnswerUsefulness(answerUsefulness),
    supportingClaims: supportingClaims.length,
    supportingDocuments: supportingDocuments.length,
    sourceClaimDocumentLinks: sourceClaimDocumentLinks.length,
    linkedSearchDocuments,
    relationSupport: relationSupport.length
  });
  const resource: BrainSearchPreviewResource = {
    kind: "krn.memorySearch.preview.v1",
    access: "read_only",
    mutation: "none",
    query: input.query,
    memoryRecallReadback: input.memoryRecallReadback,
    memoryRecallQueries: input.memoryRecallQueries,
    knowledgeReadModels: {
      totalReadModels: numberValue(input.knowledgeJson["totalReadModels"]),
      returnedReadModels: numberValue(input.knowledgeJson["returnedReadModels"]),
      readModelIds: knowledgeReadModelIds(readModels),
      selectedKnowledge,
      targetFitSummary,
      doesNotProve: proofDoesNotProve(input.knowledgeJson["proof"])
    },
    sourceSearch: {
      answerUsefulness,
      supportingClaims: supportingClaims.length,
      supportingClaimIds: sourceClaimIds(supportingClaims),
      supportingDocuments: supportingDocuments.length,
      sourceClaimDocumentLinks: sourceClaimDocumentLinks.length,
      linkedSearchDocuments,
      sourceClaimDocumentLinkCaveats: sourceClaimDocumentLinkCaveats(sourceClaimDocumentLinks),
      relationSupport: relationSupport.length,
      sourceDecisionSupport: sourceDecisionSupport.length,
      graphReadback: {
        claimNodes: numberValue(graphReadback["claimNodes"]),
        relationEdges: numberValue(graphReadback["relationEdges"]),
        temporalEdges: numberValue(graphReadback["temporalEdges"]),
        contradictionEdges: numberValue(graphReadback["contradictionEdges"]),
        duplicateEdges: numberValue(graphReadback["duplicateEdges"]),
        invalidationEdges: numberValue(graphReadback["invalidationEdges"]),
        graphAware: booleanValue(graphReadback["graphAware"]),
        caveats: stringArrayValue(graphReadback["caveats"])
      },
      includedCandidates: includedCandidates.length,
      missingEvidence: stringArrayValue(answerPackage["missingEvidence"]),
      doesNotProve: proofDoesNotProve(input.sourceJson["proof"])
    },
    activationUtility,
    recommendedNextAction: "",
    proof: {
      proves: [
        input.memoryRecallReadback === "store_backed"
          ? "memory recall fixture catalog readback is unavailable in product memory search"
          : "existing memory recall fixture catalog readback was executed as bootstrap/fixture input for this query",
        "existing source-search answer package was executed for this query",
        "memory search combined both readbacks without mutating KRN state"
      ],
      doesNotProve: [
        "source truth",
        "memory recall catalog completeness",
        ...(input.memoryRecallReadback === "fixture_catalog"
          ? ["fixture catalog knowledge is runtime memory"]
          : []),
        "ranking quality",
        "semantic search quality",
        "product readiness",
        "Memory Core mutation"
      ]
    }
  };

  return {
    ...resource,
    recommendedNextAction: buildRecommendedNextAction(resource)
  };
};

export const formatBrainSearchPreviewText = (resource: BrainSearchPreviewResource): string =>
  [
    "KRN Memory Search Preview",
    "Access: read-only",
    "Mutation: none",
    `Query: ${resource.query}`,
    `Memory recall readback: ${resource.memoryRecallReadback}`,
    `Memory recall queries: ${resource.memoryRecallQueries.length === 0 ? "none" : resource.memoryRecallQueries.join(" -> ")}`,
    "",
    "Recall read models:",
    `- returned: ${resource.knowledgeReadModels.returnedReadModels}`,
    `- total: ${resource.knowledgeReadModels.totalReadModels}`,
    ...(resource.knowledgeReadModels.readModelIds.length === 0
      ? ["- readModelIds: none"]
      : resource.knowledgeReadModels.readModelIds.map((id) => `- readModelId: ${id}`)),
    ...resource.knowledgeReadModels.selectedKnowledge.flatMap((readModel) => [
      `- selectedKnowledge: ${readModel.id}`,
      `  title: ${readModel.title}`,
      `  summary: ${readModel.summary}`,
      `  source: ${readModel.source}`,
      `  targetFit: ${readModel.targetFit}`,
      ...(readModel.targetFitReasons.length === 0
        ? ["  targetFitReason: none"]
        : readModel.targetFitReasons.map((reason) => `  targetFitReason: ${reason}`)),
      `  reviewability: ${readModel.reviewability}`,
      ...(readModel.reviewabilityReasons.length === 0
        ? ["  reviewabilityReason: none"]
        : readModel.reviewabilityReasons.map((reason) => `  reviewabilityReason: ${reason}`)),
      `  consumers: ${readModel.consumers.length === 0 ? "none" : readModel.consumers.join(", ")}`,
      `  falsifier: ${readModel.falsifier}`,
      `  doesNotProve: ${readModel.doesNotProve}`,
      `  nextAction: ${readModel.nextAction}`
    ]),
    "- targetFitSummary:",
    `  verdict: ${resource.knowledgeReadModels.targetFitSummary.verdict}`,
    `  targetSpecific: ${resource.knowledgeReadModels.targetFitSummary.targetSpecific}`,
    `  genericGuardrail: ${resource.knowledgeReadModels.targetFitSummary.genericGuardrail}`,
    `  adjacentKnowledge: ${resource.knowledgeReadModels.targetFitSummary.adjacentKnowledge}`,
    `  noise: ${resource.knowledgeReadModels.targetFitSummary.noise}`,
    `  unknown: ${resource.knowledgeReadModels.targetFitSummary.unknown}`,
    `  recommendedUse: ${resource.knowledgeReadModels.targetFitSummary.recommendedUse}`,
    `  doesNotProve: ${resource.knowledgeReadModels.targetFitSummary.doesNotProve}`,
    "",
    "Source search:",
    `- answerUsefulness: ${resource.sourceSearch.answerUsefulness}`,
    `- supportingClaims: ${resource.sourceSearch.supportingClaims}`,
    `- supportingDocuments: ${resource.sourceSearch.supportingDocuments}`,
    `- sourceClaimDocumentLinks: ${resource.sourceSearch.sourceClaimDocumentLinks}`,
    `- linkedSearchDocuments: ${resource.sourceSearch.linkedSearchDocuments}`,
    ...(resource.sourceSearch.sourceClaimDocumentLinkCaveats.length === 0
      ? ["- sourceClaimDocumentLinkCaveats: none"]
      : resource.sourceSearch.sourceClaimDocumentLinkCaveats.map(
          (item) => `- sourceClaimDocumentLinkCaveat: ${item}`
        )),
    `- relationSupport: ${resource.sourceSearch.relationSupport}`,
    `- sourceDecisionSupport: ${resource.sourceSearch.sourceDecisionSupport}`,
    `- graphAware: ${resource.sourceSearch.graphReadback.graphAware}`,
    `- graphRelationEdges: ${resource.sourceSearch.graphReadback.relationEdges}`,
    `- graphTemporalEdges: ${resource.sourceSearch.graphReadback.temporalEdges}`,
    `- graphContradictionEdges: ${resource.sourceSearch.graphReadback.contradictionEdges}`,
    `- graphDuplicateEdges: ${resource.sourceSearch.graphReadback.duplicateEdges}`,
    `- graphInvalidationEdges: ${resource.sourceSearch.graphReadback.invalidationEdges}`,
    ...(resource.sourceSearch.graphReadback.caveats.length === 0
      ? ["- graphCaveats: none"]
      : resource.sourceSearch.graphReadback.caveats.map((item) => `- graphCaveat: ${item}`)),
    `- includedCandidates: ${resource.sourceSearch.includedCandidates}`,
    ...(resource.sourceSearch.missingEvidence.length === 0
      ? ["- missingEvidence: none"]
      : resource.sourceSearch.missingEvidence.map((item) => `- missingEvidence: ${item}`)),
    "",
    "Activation utility:",
    `- selectedKnowledge: ${resource.activationUtility.selectedKnowledge.strength}`,
    ...(resource.activationUtility.selectedKnowledge.reasons.length === 0
      ? ["  selectedKnowledgeReason: none"]
      : resource.activationUtility.selectedKnowledge.reasons.map(
          (reason) => `  selectedKnowledgeReason: ${reason}`
        )),
    `- sourceLinkGraph: ${resource.activationUtility.sourceLinkGraph.strength}`,
    ...(resource.activationUtility.sourceLinkGraph.reasons.length === 0
      ? ["  sourceLinkGraphReason: none"]
      : resource.activationUtility.sourceLinkGraph.reasons.map(
          (reason) => `  sourceLinkGraphReason: ${reason}`
        )),
    `- verdict: ${resource.activationUtility.verdict}`,
    `- recommendedNextAction: ${resource.activationUtility.recommendedNextAction}`,
    `- doesNotProve: ${resource.activationUtility.doesNotProve}`,
    "",
    `Recommended next action: ${resource.recommendedNextAction}`,
    "",
    "Proof:",
    ...resource.proof.proves.map((item) => `- proves: ${item}`),
    ...resource.proof.doesNotProve.map((item) => `- does not prove: ${item}`)
  ].join("\n");
