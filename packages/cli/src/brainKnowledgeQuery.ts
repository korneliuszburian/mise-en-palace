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

export const compactBrainKnowledgeBridgeQuery = (
  query: string
): string | undefined => {
  const compactTokens = brainKnowledgeQueryTokens(query).filter(
    (token) =>
      !brainKnowledgeBridgeTerms.has(token) &&
      !brainKnowledgeTaskNoiseTerms.has(token)
  );
  const compactQuery = compactTokens.slice(0, 4).join(" ");

  return compactTokens.length >= 2 && compactQuery !== query.trim().toLowerCase()
    ? compactQuery
    : undefined;
};
