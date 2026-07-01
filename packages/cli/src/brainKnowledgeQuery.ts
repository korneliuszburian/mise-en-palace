const brainKnowledgeBridgeTerms = new Set([
  "evidence",
  "relation",
  "relations",
  "source",
  "sources",
  "temporal"
]);

const brainKnowledgeTaskNoiseTerms = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "be",
  "bounded",
  "changes",
  "classify",
  "current",
  "for",
  "in",
  "is",
  "it",
  "mini",
  "miss",
  "next",
  "no",
  "of",
  "or",
  "pattern",
  "patterns",
  "record",
  "retained",
  "selected",
  "select",
  "task",
  "the",
  "to",
  "use",
  "verify",
  "whether",
  "with",
  "without",
  "work"
]);

export const brainKnowledgeQueryTokens = (query: string): readonly string[] =>
  [...query.toLowerCase().matchAll(/[\p{L}\p{N}]+/gu)].map((match) => match[0]);

const compactBrainKnowledgeBridgeTokens = (query: string): readonly string[] =>
  brainKnowledgeQueryTokens(query).filter(
    (token) =>
      !brainKnowledgeBridgeTerms.has(token) &&
      !brainKnowledgeTaskNoiseTerms.has(token)
  );

const compactBrainKnowledgeBridgeQueryWithLimit = (
  query: string,
  limit: number,
  minimumTokenCount = 2
): string | undefined => {
  const compactTokens = compactBrainKnowledgeBridgeTokens(query);
  const compactQuery = compactTokens.slice(0, limit).join(" ");

  return compactTokens.length >= minimumTokenCount && compactQuery !== query.trim().toLowerCase()
    ? compactQuery
    : undefined;
};

export const compactBrainKnowledgeBridgeQuery = (
  query: string
): string | undefined => compactBrainKnowledgeBridgeQueryWithLimit(query, 4);

export const compactBrainKnowledgeBridgeQueries = (
  query: string
): readonly string[] => {
  const compactTokens = compactBrainKnowledgeBridgeTokens(query);
  const compactQueries = [
    compactBrainKnowledgeBridgeQueryWithLimit(query, 4),
    compactBrainKnowledgeBridgeQueryWithLimit(query, 3, 3),
    ...compactTokens.flatMap((_, index) => {
      const mechanismTokens = compactTokens.slice(index, index + 3);

      return mechanismTokens.length === 3 ? [mechanismTokens.join(" ")] : [];
    })
  ];

  return [...new Set(compactQueries.filter((item): item is string => item !== undefined))];
};
