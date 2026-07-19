export const targetFitValues = [
  "target_specific",
  "generic_guardrail",
  "adjacent_knowledge",
  "noise",
  "unknown"
] as const;

export type TargetFit = typeof targetFitValues[number];

export const targetFitSummaryVerdictValues = [
  "target_specific_selected_knowledge",
  "generic_only_selected_knowledge",
  "adjacent_or_unknown_selected_knowledge",
  "no_selected_knowledge"
] as const;

export type TargetFitSummaryVerdict = typeof targetFitSummaryVerdictValues[number];

export interface TargetFitClassification {
  targetFit: TargetFit;
  targetFitReasons: readonly string[];
}

export interface TargetFitSummary {
  verdict: TargetFitSummaryVerdict;
  targetSpecific: number;
  genericGuardrail: number;
  adjacentKnowledge: number;
  noise: number;
  unknown: number;
  recommendedUse: string;
  doesNotProve: string;
}

export interface TargetFitSummaryItem {
  targetFit: TargetFit;
}

const genericQueryTokens = new Set([
  "brain",
  "gate",
  "quality",
  "krn",
  "knowledge",
  "practice",
  "practices",
  "real",
  "standard",
  "standards"
]);

const genericGuardrailTokens = new Set([
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

const adjacentKnowledgeTokens = new Set([
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

const targetFitTokens = (text: string): readonly string[] =>
  [...text.toLowerCase().matchAll(/[\p{L}\p{N}]+/gu)].map((match) => match[0]);

const explicitTargetIdentifierMatches = (
  query: string,
  text: string
): readonly string[] => {
  const textTokens = new Set(targetFitTokens(text));
  const namedIdentifiers = [...query.matchAll(/[\p{L}\p{N}]+/gu)]
    .map((match) => match[0])
    .filter((identifier) => (
      (identifier.length > 6 && identifier === identifier.toUpperCase()) ||
      (
        identifier.length >= 4 &&
        identifier !== identifier.toUpperCase() &&
        /\p{Lu}.*\p{Lu}/u.test(identifier)
      )
    ))
    .map((identifier) => identifier.toLowerCase());
  const matchingNamedIdentifiers = namedIdentifiers.filter((identifier) =>
    textTokens.has(identifier)
  );
  const compoundIdentifiers = [...query.toLowerCase().matchAll(
    /\b[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)+\b/gu
  )].map((match) => match[0]);
  const matchingCompoundIdentifiers = compoundIdentifiers.filter((identifier) =>
    identifier.split("-")
      .filter((token) => token.length >= 3)
      .every((token) => textTokens.has(token))
  );

  return [...new Set([...matchingNamedIdentifiers, ...matchingCompoundIdentifiers])];
};

const distinctiveQueryTokens = (query: string): readonly string[] =>
  targetFitTokens(query).filter(
    (token) => token.length >= 5 && !genericQueryTokens.has(token)
  );

const targetSpecificClassification = (input: {
  distinctiveMatches: readonly string[];
  targetIdentifierMatches: readonly string[];
}): TargetFitClassification | undefined => {
  if (input.targetIdentifierMatches.length === 0 && input.distinctiveMatches.length < 2) {
    return undefined;
  }

  return {
    targetFit: "target_specific",
    targetFitReasons: [
      ...(input.targetIdentifierMatches.length === 0
        ? []
        : [`matched explicit target identifier(s): ${input.targetIdentifierMatches.join(", ")}.`]),
      ...(input.distinctiveMatches.length < 2
        ? []
        : [`matched multiple distinctive query token(s): ${input.distinctiveMatches.join(", ")}.`])
    ]
  };
};

export const classifyTargetFit = (input: {
  query: string;
  text: string;
  emptyTextReason?: string;
}): TargetFitClassification => {
  const queryTokens = distinctiveQueryTokens(input.query);
  const packetTokens = new Set(targetFitTokens(input.text));

  if (packetTokens.size === 0) {
    return {
      targetFit: "unknown",
      targetFitReasons: [
        input.emptyTextReason ?? "target-fit item has no classifiable text."
      ]
    };
  }

  if (queryTokens.length === 0) {
    return {
      targetFit: "unknown",
      targetFitReasons: ["query has no distinctive target token after generic term filtering."]
    };
  }

  const distinctiveMatches = [...new Set(
    queryTokens.filter((token) => packetTokens.has(token))
  )];
  const targetIdentifierMatches = explicitTargetIdentifierMatches(input.query, input.text);
  const targetSpecific = targetSpecificClassification({
    distinctiveMatches,
    targetIdentifierMatches
  });

  if (targetSpecific !== undefined) return targetSpecific;

  const allQueryTokenMatches = targetFitTokens(input.query).filter(
    (token) => token.length >= 4 && packetTokens.has(token)
  );
  const guardrailMatches = [...genericGuardrailTokens].filter((token) =>
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

  const adjacentMatches = [...adjacentKnowledgeTokens].filter((token) =>
    packetTokens.has(token)
  );

  if (allQueryTokenMatches.length > 0 || adjacentMatches.length > 0) {
    return {
      targetFit: "adjacent_knowledge",
      targetFitReasons: [
        "no distinctive query token matched.",
        ...(allQueryTokenMatches.length === 0
          ? []
          : [`generic query token overlap: ${allQueryTokenMatches.join(", ")}.`]),
        ...(adjacentMatches.length === 0
          ? []
          : [`adjacent knowledge token(s): ${adjacentMatches.join(", ")}.`])
      ]
    };
  }

  return {
    targetFit: "noise",
    targetFitReasons: ["no distinctive, generic, or adjacent knowledge signal matched."]
  };
};

export const summarizeTargetFit = (
  items: readonly TargetFitSummaryItem[]
): TargetFitSummary => {
  const targetSpecific = items.filter((item) => item.targetFit === "target_specific").length;
  const genericGuardrail = items.filter((item) => item.targetFit === "generic_guardrail").length;
  const adjacentKnowledge = items.filter((item) => item.targetFit === "adjacent_knowledge").length;
  const noise = items.filter((item) => item.targetFit === "noise").length;
  const unknown = items.filter((item) => item.targetFit === "unknown").length;

  if (items.length === 0) {
    return {
      verdict: "no_selected_knowledge",
      targetSpecific,
      genericGuardrail,
      adjacentKnowledge,
      noise,
      unknown,
      recommendedUse:
        "Do not infer selected knowledge sufficiency; use source/search evidence or acquire governed evidence first.",
      doesNotProve:
        "No selectedKnowledge packets does not prove the query has no relevant KRN knowledge."
    };
  }

  if (targetSpecific > 0) {
    return {
      verdict: "target_specific_selected_knowledge",
      targetSpecific,
      genericGuardrail,
      adjacentKnowledge,
      noise,
      unknown,
      recommendedUse:
        "Use target-specific selectedKnowledge first, then treat generic or adjacent packets as guardrails.",
      doesNotProve:
        "Target-specific selectedKnowledge does not prove source truth, ranking quality, or product readiness."
    };
  }

  if (genericGuardrail > 0 && genericGuardrail === items.length) {
    return {
      verdict: "generic_only_selected_knowledge",
      targetSpecific,
      genericGuardrail,
      adjacentKnowledge,
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
    adjacentKnowledge,
    noise,
    unknown,
    recommendedUse:
      "Review selectedKnowledge targetFit before treating selected knowledge as sufficient; prefer target-specific source evidence.",
    doesNotProve:
      "Adjacent, noisy, or unknown selectedKnowledge does not prove target-specific context was selected."
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isSummaryVerdict = (value: unknown): value is TargetFitSummaryVerdict =>
  typeof value === "string" &&
  targetFitSummaryVerdictValues.some((verdict) => verdict === value);

const finiteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export const parseTargetFitSummary = (
  value: unknown
): TargetFitSummary | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const verdict = value["verdict"];
  const targetSpecific = value["targetSpecific"];
  const genericGuardrail = value["genericGuardrail"];
  const adjacentKnowledge = value["adjacentKnowledge"];
  const noise = value["noise"];
  const unknown = value["unknown"];
  const recommendedUse = value["recommendedUse"];
  const doesNotProve = value["doesNotProve"];

  if (
    !isSummaryVerdict(verdict) ||
    !finiteNumber(targetSpecific) ||
    !finiteNumber(genericGuardrail) ||
    !finiteNumber(adjacentKnowledge) ||
    !finiteNumber(noise) ||
    !finiteNumber(unknown) ||
    typeof recommendedUse !== "string" ||
    typeof doesNotProve !== "string"
  ) {
    return undefined;
  }

  return {
    verdict,
    targetSpecific,
    genericGuardrail,
    adjacentKnowledge,
    noise,
    unknown,
    recommendedUse,
    doesNotProve
  };
};

export const genericOnlyTargetFitSummary = (
  value: unknown
): TargetFitSummary | undefined => {
  const summary = parseTargetFitSummary(value);

  return summary?.verdict === "generic_only_selected_knowledge"
    ? summary
    : undefined;
};
