import type {
  CliCommand
} from "./parseArgs.js";
import {
  buildActivationUtilityLabReadback
} from "@krn/harness";
import type {
  ActivationUtilityAnswerUsefulness,
  ActivationUtilityLabReadback
} from "@krn/harness";
import {
  runKnowledgeCardsCommand
} from "./runKnowledgeCardsCommand.js";
import type {
  KnowledgeCardsCommandRuntime,
  KnowledgeCardsCommandResult
} from "./runKnowledgeCardsCommand.js";
import {
  runSourceSearchCommand
} from "./runSourceSearchCommand.js";
import type {
  CreateSourceSearchDatabaseRuntime,
  SourceSearchCommandRuntime,
  SourceSearchCommandResult
} from "./runSourceSearchCommand.js";

export type BrainSearchCommand = Extract<CliCommand, { kind: "brainSearch" }>;

export interface BrainSearchCommandRuntime {
  cwd: string;
  env: Record<string, string | undefined>;
  now(): string;
  createId(prefix: string): string;
  command: BrainSearchCommand;
  createDatabaseRuntime?: CreateSourceSearchDatabaseRuntime;
  runKnowledgeCards?: (runtime: KnowledgeCardsCommandRuntime) => Promise<KnowledgeCardsCommandResult>;
  runSourceSearch?: (runtime: SourceSearchCommandRuntime) => Promise<SourceSearchCommandResult>;
}

export interface BrainSearchCommandResult {
  stdout: string;
}

interface JsonRecord {
  readonly [key: string]: unknown;
}

interface BrainSearchPreviewResource {
  kind: "krn.brainSearch.preview.v1";
  access: "read_only";
  mutation: "none";
  query: string;
  brainKnowledgeReadback: "catalog_files" | "store_only";
  brainKnowledgeQueries: readonly string[];
  knowledgeCards: {
    totalCards: number;
    returnedCards: number;
    cardIds: readonly string[];
    selectedKnowledge: readonly BrainSearchKnowledgePacket[];
    targetFitSummary: BrainSearchSelectedKnowledgeTargetFitSummary;
    doesNotProve: readonly string[];
  };
  sourceSearch: {
    answerUsefulness: string;
    supportingClaims: number;
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

interface BrainSearchKnowledgePacket {
  id: string;
  title: string;
  summary: string;
  source: "catalog_file" | "source_search";
  targetFit: BrainSearchKnowledgeTargetFit;
  targetFitReasons: readonly string[];
  reviewability: "ready" | "needs_more_evidence";
  reviewabilityReasons: readonly string[];
  consumers: readonly string[];
  falsifier: string;
  doesNotProve: string;
  nextAction: string;
}

type BrainSearchKnowledgeTargetFit =
  | "target_specific"
  | "generic_guardrail"
  | "adjacent_pattern"
  | "noise"
  | "unknown";

type BrainSearchSelectedKnowledgeTargetFitVerdict =
  | "target_specific_selected_knowledge"
  | "generic_only_selected_knowledge"
  | "adjacent_or_unknown_selected_knowledge"
  | "no_selected_knowledge";

interface BrainSearchSelectedKnowledgeTargetFitSummary {
  verdict: BrainSearchSelectedKnowledgeTargetFitVerdict;
  targetSpecific: number;
  genericGuardrail: number;
  adjacentPattern: number;
  noise: number;
  unknown: number;
  recommendedUse: string;
  doesNotProve: string;
}

type BrainSearchRecommendationResource = Pick<
  BrainSearchPreviewResource,
  "brainKnowledgeReadback" | "knowledgeCards" | "sourceSearch"
>;

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

type BrainKnowledgeReadback = {
  result: KnowledgeCardsCommandResult;
  queries: readonly string[];
};

const defaultCatalogFile = "docs/brain-knowledge/catalog.json";

const brainKnowledgeBridgeTerms = new Set([
  "evidence",
  "relation",
  "relations",
  "source",
  "sources",
  "temporal"
]);

const parseJsonObject = (text: string, label: string): JsonRecord => {
  const parsed: unknown = JSON.parse(text);

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(`${label} JSON output must be an object`);
  }

  return parsed as JsonRecord;
};

const recordValue = (
  value: unknown
): JsonRecord | undefined =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as JsonRecord
    : undefined;

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

const brainKnowledgeQueryTokens = (query: string): readonly string[] =>
  [...query.toLowerCase().matchAll(/[\p{L}\p{N}]+/gu)].map((match) => match[0]);

const targetFitGenericQueryTokens = new Set([
  "brain",
  "gate",
  "quality",
  "krn",
  "knowledge",
  "pattern",
  "patterns"
]);

const targetFitGenericGuardrailTokens = new Set([
  "boundary",
  "consumer",
  "falsifier",
  "gate",
  "governed",
  "guardrail",
  "must",
  "proof",
  "retained",
  "should"
]);

const targetFitAdjacentPatternTokens = new Set([
  "activation",
  "artifact",
  "candidate",
  "claim",
  "evidence",
  "graph",
  "heartbeat",
  "ingest",
  "memory",
  "readback",
  "relation",
  "search",
  "source"
]);

const targetFitDistinctiveQueryTokens = (query: string): readonly string[] =>
  brainKnowledgeQueryTokens(query).filter(
    (token) => token.length >= 4 && !targetFitGenericQueryTokens.has(token)
  );

const targetFitTextTokens = (text: string): ReadonlySet<string> =>
  new Set(brainKnowledgeQueryTokens(text));

const compactBrainKnowledgeQuery = (query: string): string | undefined => {
  const compactTokens = brainKnowledgeQueryTokens(query).filter(
    (token) => !brainKnowledgeBridgeTerms.has(token)
  );
  const compactQuery = compactTokens.join(" ");

  return compactQuery.length > 0 && compactQuery !== query.trim().toLowerCase()
    ? compactQuery
    : undefined;
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

const firstDefinedString = (values: readonly (string | undefined)[]): string =>
  values.find((value): value is string => value !== undefined) ?? "";

const optionalStringArray = (value: string | undefined): readonly string[] =>
  value === undefined ? [] : [value];

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
    packet.source,
    ...packet.consumers,
    packet.falsifier,
    packet.nextAction
  ].join(" ");

const targetFitForPacket = (
  query: string,
  packet: BrainSearchKnowledgePacket
): Pick<BrainSearchKnowledgePacket, "targetFit" | "targetFitReasons"> => {
  const distinctiveQueryTokens = targetFitDistinctiveQueryTokens(query);
  const packetTokens = targetFitTextTokens(packetTargetFitText(packet));

  if (packetTokens.size === 0) {
    return {
      targetFit: "unknown",
      targetFitReasons: ["selectedKnowledge packet has no classifiable text."]
    };
  }

  if (distinctiveQueryTokens.length === 0) {
    return {
      targetFit: "unknown",
      targetFitReasons: ["query has no distinctive target token after generic term filtering."]
    };
  }

  const distinctiveMatches = distinctiveQueryTokens.filter((token) => packetTokens.has(token));

  if (distinctiveMatches.length > 0) {
    return {
      targetFit: "target_specific",
      targetFitReasons: [
        `matched distinctive query token(s): ${distinctiveMatches.join(", ")}.`
      ]
    };
  }

  const allQueryTokenMatches = brainKnowledgeQueryTokens(query).filter(
    (token) => token.length >= 4 && packetTokens.has(token)
  );
  const guardrailMatches = [...targetFitGenericGuardrailTokens].filter((token) =>
    packetTokens.has(token)
  );

  if (guardrailMatches.length > 0) {
    return {
      targetFit: "generic_guardrail",
      targetFitReasons: [
        "no distinctive query token matched.",
        `generic guardrail token(s): ${guardrailMatches.join(", ")}.`
      ]
    };
  }

  const adjacentMatches = [...targetFitAdjacentPatternTokens].filter((token) =>
    packetTokens.has(token)
  );

  if (allQueryTokenMatches.length > 0 || adjacentMatches.length > 0) {
    return {
      targetFit: "adjacent_pattern",
      targetFitReasons: [
        "no distinctive query token matched.",
        ...(allQueryTokenMatches.length === 0
          ? []
          : [`generic query token overlap: ${allQueryTokenMatches.join(", ")}.`]),
        ...(adjacentMatches.length === 0
          ? []
          : [`adjacent pattern token(s): ${adjacentMatches.join(", ")}.`])
      ]
    };
  }

  return {
    targetFit: "noise",
    targetFitReasons: ["no distinctive, generic, or adjacent query/pattern signal matched."]
  };
};

const withTargetFit = (
  query: string,
  packet: BrainSearchKnowledgePacket
): BrainSearchKnowledgePacket => ({
  ...packet,
  ...targetFitForPacket(query, packet)
});

const proofDoesNotProve = (value: unknown): readonly string[] => {
  const proof = recordValue(value);

  if (proof === undefined) {
    return [];
  }

  return stringArrayValue(proof["doesNotProve"]);
};

const knowledgeCardIds = (cards: readonly unknown[]): readonly string[] =>
  cards.flatMap((card) => {
    const record = recordValue(card);
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
  cards: readonly unknown[],
  query: string
): readonly BrainSearchKnowledgePacket[] =>
  cards.flatMap((card) => {
    const record = recordValue(card);

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
      { name: "catalog id", value: id },
      { name: "consumer", value: consumers },
      { name: "falsifier", value: falsifier },
      { name: "doesNotProve", value: doesNotProve }
    ]);

    return [withTargetFit(query, {
      id,
      title: stringValue(record["title"], ""),
      summary: stringValue(record["summary"], ""),
      source: "catalog_file",
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
    source: "source_search",
    targetFit: "unknown",
    targetFitReasons: [],
    reviewability,
    reviewabilityReasons,
    consumers: optionalStringArray(fields.consumer),
    falsifier: firstDefinedString([
      fields.falsifier,
      "missing falsifier; do not treat this source evidence as review-ready brain knowledge"
    ]),
    doesNotProve:
      fields.doesNotProve ??
      "This source-search candidate does not prove a retained pattern is review-ready.",
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
  brainKnowledgeReadback: BrainSearchPreviewResource["brainKnowledgeReadback"];
  cards: readonly unknown[];
  supportingClaims: readonly unknown[];
  query: string;
}): readonly BrainSearchKnowledgePacket[] => {
  const sourcePackets = sourceSearchKnowledgePackets(input.supportingClaims, input.query);

  if (input.brainKnowledgeReadback === "store_only") {
    return sourcePackets;
  }

  const catalogPackets = knowledgePackets(input.cards, input.query);

  return catalogPackets.length > 0
    ? catalogPackets
    : sourcePackets.filter((packet) => packet.reviewability === "ready");
};

const selectedKnowledgeTargetFitSummary = (
  packets: readonly BrainSearchKnowledgePacket[]
): BrainSearchSelectedKnowledgeTargetFitSummary => {
  const targetSpecific = packets.filter((packet) => packet.targetFit === "target_specific").length;
  const genericGuardrail = packets.filter((packet) => packet.targetFit === "generic_guardrail").length;
  const adjacentPattern = packets.filter((packet) => packet.targetFit === "adjacent_pattern").length;
  const noise = packets.filter((packet) => packet.targetFit === "noise").length;
  const unknown = packets.filter((packet) => packet.targetFit === "unknown").length;

  if (packets.length === 0) {
    return {
      verdict: "no_selected_knowledge",
      targetSpecific,
      genericGuardrail,
      adjacentPattern,
      noise,
      unknown,
      recommendedUse:
        "Do not infer brain knowledge sufficiency; use source/search evidence or acquire governed evidence first.",
      doesNotProve:
        "No selectedKnowledge packets does not prove the query has no relevant KRN knowledge."
    };
  }

  if (targetSpecific > 0) {
    return {
      verdict: "target_specific_selected_knowledge",
      targetSpecific,
      genericGuardrail,
      adjacentPattern,
      noise,
      unknown,
      recommendedUse:
        "Use target-specific selectedKnowledge first, then treat generic or adjacent packets as guardrails.",
      doesNotProve:
        "Target-specific selectedKnowledge does not prove source truth, ranking quality, or product readiness."
    };
  }

  if (genericGuardrail > 0 && genericGuardrail === packets.length) {
    return {
      verdict: "generic_only_selected_knowledge",
      targetSpecific,
      genericGuardrail,
      adjacentPattern,
      noise,
      unknown,
      recommendedUse:
        "Treat selectedKnowledge as generic guardrails; use target/source evidence first before considering selected knowledge sufficient.",
      doesNotProve:
        "Generic-only selectedKnowledge does not prove target-specific context was selected."
    };
  }

  return {
    verdict: "adjacent_or_unknown_selected_knowledge",
    targetSpecific,
    genericGuardrail,
    adjacentPattern,
    noise,
    unknown,
    recommendedUse:
      "Review selectedKnowledge targetFit before treating selected knowledge as sufficient; prefer target-specific source evidence.",
    doesNotProve:
      "Adjacent, noisy, or unknown selectedKnowledge does not prove target-specific context was selected."
  };
};

const sourceEvidenceCount = (
  sourceSearch: BrainSearchPreviewResource["sourceSearch"]
): number => sourceSearch.supportingClaims + sourceSearch.supportingDocuments;

const nonTargetSpecificRecommendation = (
  targetFit: BrainSearchSelectedKnowledgeTargetFitSummary
): string | undefined => {
  if (
    targetFit.verdict === "generic_only_selected_knowledge" ||
    targetFit.verdict === "adjacent_or_unknown_selected_knowledge"
  ) {
    return targetFit.recommendedUse;
  }

  return undefined;
};

const storeOnlyRecommendation = (
  resource: BrainSearchRecommendationResource
): string | undefined => {
  if (resource.brainKnowledgeReadback !== "store_only") {
    return undefined;
  }

  return sourceEvidenceCount(resource.sourceSearch) > 0
    ? "Use the store-backed source/search evidence cautiously; run catalog-backed brain search only when file-retained pattern context is explicitly needed."
    : "Do not infer product truth from store-only brain search; seed or persist governed source evidence first.";
};

const catalogRecommendation = (
  resource: BrainSearchRecommendationResource
): string => {
  const hasReturnedCards = resource.knowledgeCards.returnedCards > 0;
  const hasSelectedKnowledge = resource.knowledgeCards.selectedKnowledge.length > 0;
  const hasSourceEvidence = sourceEvidenceCount(resource.sourceSearch) > 0;

  if (hasReturnedCards && hasSourceEvidence) {
    return "Use the matching brain knowledge as pattern guidance and the source-search answer package as evidence before changing code.";
  }

  if (!hasReturnedCards && hasSelectedKnowledge) {
    return "Use source-backed selected brain knowledge as a Pattern Application Gate; do not treat it as file-catalog coverage.";
  }

  if (hasSourceEvidence) {
    return "Use source-search evidence cautiously and run a narrower brain knowledge query before retaining a pattern.";
  }

  if (hasReturnedCards) {
    return "Use the matching brain knowledge as guidance, but gather source evidence before implementation claims.";
  }

  return "Do not infer product truth; narrow the query or ingest/review source evidence first.";
};

const buildRecommendedNextAction = (
  resource: BrainSearchRecommendationResource
): string => {
  const targetFitRecommendation = nonTargetSpecificRecommendation(
    resource.knowledgeCards.targetFitSummary
  );

  if (targetFitRecommendation !== undefined) {
    return targetFitRecommendation;
  }

  const storeOnly = storeOnlyRecommendation(resource);

  if (storeOnly !== undefined) {
    return storeOnly;
  }

  return catalogRecommendation(resource);
};

const buildResource = (
  input: {
    query: string;
    brainKnowledgeReadback: BrainSearchPreviewResource["brainKnowledgeReadback"];
    brainKnowledgeQueries: readonly string[];
    knowledgeJson: JsonRecord;
    sourceJson: JsonRecord;
  }
): BrainSearchPreviewResource => {
  const cards = arrayValue(input.knowledgeJson["cards"]);
  const answerPackage = recordValue(input.sourceJson["answerPackage"]) ?? {};
  const supportingClaims = arrayValue(answerPackage["supportingClaims"]);
  const supportingDocuments = arrayValue(answerPackage["supportingDocuments"]);
  const sourceClaimDocumentLinks = arrayValue(answerPackage["sourceClaimDocumentLinks"]);
  const relationSupport = arrayValue(answerPackage["relationSupport"]);
  const sourceDecisionSupport = arrayValue(answerPackage["sourceDecisionSupport"]);
  const graphReadback = recordValue(answerPackage["graphReadback"]) ?? {};
  const includedCandidates = arrayValue(input.sourceJson["includedCandidates"]);
  const selectedKnowledge = selectedKnowledgePackets({
    brainKnowledgeReadback: input.brainKnowledgeReadback,
    cards,
    supportingClaims,
    query: input.query
  });
  const answerUsefulness = stringValue(answerPackage["answerUsefulness"], "unknown");
  const linkedSearchDocuments = linkedSearchDocumentCount(sourceClaimDocumentLinks);
  const activationUtility = buildActivationUtilityLabReadback({
    selectedKnowledgeCount: selectedKnowledge.length,
    answerUsefulness: activationUtilityAnswerUsefulness(answerUsefulness),
    supportingClaims: supportingClaims.length,
    supportingDocuments: supportingDocuments.length,
    sourceClaimDocumentLinks: sourceClaimDocumentLinks.length,
    linkedSearchDocuments,
    relationSupport: relationSupport.length
  });
  const targetFitSummary = selectedKnowledgeTargetFitSummary(selectedKnowledge);
  const resource: BrainSearchPreviewResource = {
    kind: "krn.brainSearch.preview.v1",
    access: "read_only",
    mutation: "none",
    query: input.query,
    brainKnowledgeReadback: input.brainKnowledgeReadback,
    brainKnowledgeQueries: input.brainKnowledgeQueries,
    knowledgeCards: {
      totalCards: numberValue(input.knowledgeJson["totalCards"]),
      returnedCards: numberValue(input.knowledgeJson["returnedCards"]),
      cardIds: knowledgeCardIds(cards),
      selectedKnowledge,
      targetFitSummary,
      doesNotProve: proofDoesNotProve(input.knowledgeJson["proof"])
    },
    sourceSearch: {
      answerUsefulness,
      supportingClaims: supportingClaims.length,
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
        input.brainKnowledgeReadback === "store_only"
          ? "brain knowledge catalog readback was explicitly skipped for this query"
          : "existing brain-knowledge catalog readback was executed for this query",
        "existing source-search answer package was executed for this query",
        "brain search combined both readbacks without mutating KRN state"
      ],
      doesNotProve: [
        "source truth",
        "brain-knowledge catalog completeness",
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

const knowledgeReturnedCards = (knowledgeJson: JsonRecord): number =>
  numberValue(knowledgeJson["returnedCards"]);

const runCatalogKnowledgeReadback = async (
  input: {
    runtime: BrainSearchCommandRuntime;
    runKnowledge: (runtime: KnowledgeCardsCommandRuntime) => Promise<KnowledgeCardsCommandResult>;
    catalogFiles: readonly string[];
    query: string;
  }
): Promise<KnowledgeCardsCommandResult> =>
  input.runKnowledge({
    cwd: input.runtime.cwd,
    cardFiles: [],
    patternFiles: [],
    catalogFiles: input.catalogFiles,
    filter: {
      text: input.query
    },
    format: "json",
    ...(input.runtime.command.limit === undefined
      ? {}
      : { limit: input.runtime.command.limit })
  });

const runBrainKnowledgeReadback = async (
  input: {
    runtime: BrainSearchCommandRuntime;
    runKnowledge: (runtime: KnowledgeCardsCommandRuntime) => Promise<KnowledgeCardsCommandResult>;
    catalogFiles: readonly string[];
    query: string;
  }
): Promise<BrainKnowledgeReadback> => {
  if (input.runtime.command.storeOnly) {
    return {
      result: {
        stdout: JSON.stringify({
          totalCards: 0,
          returnedCards: 0,
          cards: [],
          proof: {
            doesNotProve: [
              "brain knowledge catalog readback was explicitly skipped by --store-only"
            ]
          }
        })
      },
      queries: []
    };
  }

  const primaryResult = await runCatalogKnowledgeReadback(input);
  const primaryJson = parseJsonObject(primaryResult.stdout, "brain knowledge");

  if (knowledgeReturnedCards(primaryJson) > 0) {
    return {
      result: primaryResult,
      queries: [input.query]
    };
  }

  const compactQuery = compactBrainKnowledgeQuery(input.query);

  if (compactQuery === undefined) {
    return {
      result: primaryResult,
      queries: [input.query]
    };
  }

  const compactResult = await runCatalogKnowledgeReadback({
    ...input,
    query: compactQuery
  });
  const compactJson = parseJsonObject(compactResult.stdout, "brain knowledge compact retry");

  return knowledgeReturnedCards(compactJson) > 0
    ? {
      result: compactResult,
      queries: [input.query, compactQuery]
    }
    : {
      result: primaryResult,
      queries: [input.query, compactQuery]
    };
};

const formatText = (resource: BrainSearchPreviewResource): string =>
  [
    "KRN Brain Search Preview",
    "Access: read-only",
    "Mutation: none",
    `Query: ${resource.query}`,
    `Brain knowledge readback: ${resource.brainKnowledgeReadback}`,
    `Brain knowledge queries: ${resource.brainKnowledgeQueries.length === 0 ? "none" : resource.brainKnowledgeQueries.join(" -> ")}`,
    "",
    "Brain knowledge:",
    `- returned: ${resource.knowledgeCards.returnedCards}`,
    `- total: ${resource.knowledgeCards.totalCards}`,
    ...(resource.knowledgeCards.cardIds.length === 0
      ? ["- cardIds: none"]
      : resource.knowledgeCards.cardIds.map((id) => `- cardId: ${id}`)),
    ...resource.knowledgeCards.selectedKnowledge.flatMap((card) => [
      `- selectedKnowledge: ${card.id}`,
      `  title: ${card.title}`,
      `  summary: ${card.summary}`,
      `  source: ${card.source}`,
      `  targetFit: ${card.targetFit}`,
      ...(card.targetFitReasons.length === 0
        ? ["  targetFitReason: none"]
        : card.targetFitReasons.map((reason) => `  targetFitReason: ${reason}`)),
      `  reviewability: ${card.reviewability}`,
      ...(card.reviewabilityReasons.length === 0
        ? ["  reviewabilityReason: none"]
        : card.reviewabilityReasons.map((reason) => `  reviewabilityReason: ${reason}`)),
      `  consumers: ${card.consumers.length === 0 ? "none" : card.consumers.join(", ")}`,
      `  falsifier: ${card.falsifier}`,
      `  doesNotProve: ${card.doesNotProve}`,
      `  nextAction: ${card.nextAction}`
    ]),
    "- targetFitSummary:",
    `  verdict: ${resource.knowledgeCards.targetFitSummary.verdict}`,
    `  targetSpecific: ${resource.knowledgeCards.targetFitSummary.targetSpecific}`,
    `  genericGuardrail: ${resource.knowledgeCards.targetFitSummary.genericGuardrail}`,
    `  adjacentPattern: ${resource.knowledgeCards.targetFitSummary.adjacentPattern}`,
    `  noise: ${resource.knowledgeCards.targetFitSummary.noise}`,
    `  unknown: ${resource.knowledgeCards.targetFitSummary.unknown}`,
    `  recommendedUse: ${resource.knowledgeCards.targetFitSummary.recommendedUse}`,
    `  doesNotProve: ${resource.knowledgeCards.targetFitSummary.doesNotProve}`,
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

export const runBrainSearchCommand = async (
  runtime: BrainSearchCommandRuntime
): Promise<BrainSearchCommandResult> => {
  const query = runtime.command.query.trim();
  const catalogFiles =
    runtime.command.catalogFiles.length === 0
      ? [defaultCatalogFile]
      : runtime.command.catalogFiles;
  const runKnowledge = runtime.runKnowledgeCards ?? runKnowledgeCardsCommand;
  const runSource = runtime.runSourceSearch ?? runSourceSearchCommand;
  const knowledgeResultPromise = runBrainKnowledgeReadback({
    runtime,
    runKnowledge,
    catalogFiles,
    query
  });
  const [knowledgeResult, sourceResult] = await Promise.all([
    knowledgeResultPromise,
    runSource({
      cwd: runtime.cwd,
      env: runtime.env,
      now: runtime.now,
      createId: runtime.createId,
      command: {
        kind: "sourceSearch",
        query,
        json: true,
        ...(runtime.command.limit === undefined ? {} : { limit: runtime.command.limit }),
        ...(runtime.command.maxInclusions === undefined
          ? {}
          : { maxInclusions: runtime.command.maxInclusions })
      },
      ...(runtime.createDatabaseRuntime === undefined
        ? {}
        : { createDatabaseRuntime: runtime.createDatabaseRuntime })
    })
  ]);
  const resource = buildResource({
    query,
    brainKnowledgeReadback: runtime.command.storeOnly ? "store_only" : "catalog_files",
    brainKnowledgeQueries: knowledgeResult.queries,
    knowledgeJson: parseJsonObject(knowledgeResult.result.stdout, "brain knowledge"),
    sourceJson: parseJsonObject(sourceResult.stdout, "source search")
  });

  return {
    stdout:
      runtime.command.format === "json"
        ? `${JSON.stringify(resource, null, 2)}\n`
        : `${formatText(resource)}\n`
  };
};
