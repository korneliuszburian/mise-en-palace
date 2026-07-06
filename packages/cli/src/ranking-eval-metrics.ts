export const roundRankingMetric = (value: number): number =>
  Math.round(value * 10000) / 10000;

const dcg = (
  selectedIds: readonly string[],
  expectedIds: ReadonlySet<string>,
  topK: number
): number =>
  selectedIds.slice(0, topK).reduce((score, id, index) =>
    score + (expectedIds.has(id) ? 1 / Math.log2(index + 2) : 0), 0);

const idealDcg = (
  expectedCount: number,
  topK: number
): number => {
  let score = 0;

  for (let index = 0; index < Math.min(expectedCount, topK); index += 1) {
    score += 1 / Math.log2(index + 2);
  }

  return score;
};

export const ndcgAtK = (
  selectedIds: readonly string[],
  expectedIds: ReadonlySet<string>,
  topK: number
): number => {
  const ideal = idealDcg(expectedIds.size, topK);

  return ideal === 0 ? 0 : dcg(selectedIds, expectedIds, topK) / ideal;
};
