import type {
  GoldenBehaviorProof,
  GoldenBehaviorProofStatus
} from "./goldenRunner.js";

export interface MapPromptfooJsonlRowsToGoldenBehaviorProofsInput {
  rows: readonly unknown[];
  caseIdsByRow: readonly string[];
  evidenceRef: string;
}

interface PromptfooJsonlRow {
  success: boolean;
  score: number;
  gradingResult?: {
    reason?: string;
  } | null;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value);

const parsePromptfooJsonlRow = (
  value: unknown,
  rowIndex: number
): PromptfooJsonlRow => {
  if (!isRecord(value)) {
    throw new Error(`Promptfoo row ${rowIndex} must be an object`);
  }

  if (typeof value.success !== "boolean") {
    throw new Error(`Promptfoo row ${rowIndex} success must be boolean`);
  }

  if (typeof value.score !== "number" || !Number.isFinite(value.score)) {
    throw new Error(`Promptfoo row ${rowIndex} score must be a finite number`);
  }

  if (
    value.gradingResult !== undefined &&
    value.gradingResult !== null &&
    !isRecord(value.gradingResult)
  ) {
    throw new Error(`Promptfoo row ${rowIndex} gradingResult must be an object or null`);
  }

  const rowBase = {
    success: value.success,
    score: value.score
  };

  if (value.gradingResult === undefined) {
    return rowBase;
  }

  if (value.gradingResult === null) {
    return {
      ...rowBase,
      gradingResult: null
    };
  }

  return {
    ...rowBase,
    gradingResult: typeof value.gradingResult.reason === "string"
      ? { reason: value.gradingResult.reason }
      : {}
  };
};

const statusFromPromptfooSuccess = (success: boolean): GoldenBehaviorProofStatus =>
  success ? "passed" : "failed";

const promptfooSmokeDoesNotProve =
  "Promptfoo smoke proves runner/config/provider/result mapping only; it does not execute KRN behavior.";

export const mapPromptfooJsonlRowsToGoldenBehaviorProofs = (
  input: MapPromptfooJsonlRowsToGoldenBehaviorProofsInput
): GoldenBehaviorProof[] => {
  if (input.rows.length !== input.caseIdsByRow.length) {
    throw new Error("Promptfoo row count must match case id count");
  }

  return input.rows.map((row, rowIndex): GoldenBehaviorProof => {
    const parsedRow = parsePromptfooJsonlRow(row, rowIndex);
    const status = statusFromPromptfooSuccess(parsedRow.success);
    const reason = parsedRow.gradingResult?.reason ?? "No grading reason provided";

    return {
      caseId: input.caseIdsByRow[rowIndex] ?? "",
      status,
      provenance: "promptfoo_integration_smoke",
      summary: `Promptfoo row ${rowIndex} ${status} with score ${parsedRow.score}: ${reason}`,
      evidenceRefs: [input.evidenceRef],
      doesNotProve: promptfooSmokeDoesNotProve
    };
  });
};
