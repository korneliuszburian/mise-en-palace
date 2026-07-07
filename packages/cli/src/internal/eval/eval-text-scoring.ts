const evalTextTokens = (value: string): readonly string[] =>
  [...value.toLowerCase().matchAll(/[\p{L}\p{N}]+/gu)].map((match) => match[0]);

export const tokenOverlapScore = (
  query: string,
  text: string
): number => {
  const queryTokens = new Set(evalTextTokens(query).filter((token) => token.length >= 4));
  const textTokens = new Set(evalTextTokens(text));
  let score = 0;

  for (const token of queryTokens) {
    if (textTokens.has(token)) {
      score += 20;
    }
  }

  return score;
};
