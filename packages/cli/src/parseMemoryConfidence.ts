const memoryConfidenceAliases = new Map<string, number>([
  ["low", 40],
  ["medium", 70],
  ["high", 90]
]);

const memoryConfidenceError = "--confidence must be low, medium, high, or an integer 0-100";

export const parseMemoryConfidence = (
  confidence: string | undefined,
  options: {
    defaultValue?: number;
  } = {}
): number | undefined => {
  const candidate = confidence?.trim();

  if (candidate === undefined || candidate.length === 0) {
    return options.defaultValue;
  }

  const aliased = memoryConfidenceAliases.get(candidate);

  if (aliased !== undefined) {
    return aliased;
  }

  const numeric = Number(candidate);

  if (Number.isInteger(numeric) && numeric >= 0 && numeric <= 100) {
    return numeric;
  }

  throw new Error(memoryConfidenceError);
};
