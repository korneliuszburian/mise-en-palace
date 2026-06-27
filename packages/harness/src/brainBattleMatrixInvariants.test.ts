import { readFileSync } from "node:fs";

import {
  describe,
  expect,
  it
} from "vitest";

const matrixPath = new URL(
  "../../../docs/architecture/brain-battle-eval-matrix.md",
  import.meta.url
);
const packageJsonPath = new URL("../../../package.json", import.meta.url);

interface MatrixRow {
  check: string;
  status: string;
  guard: string;
  evidence: string;
  doesNotProve: string;
}

const markdownTableCells = (line: string): string[] =>
  line
    .trim()
    .replace(/^\|/u, "")
    .replace(/\|$/u, "")
    .split("|")
    .map((cell) => cell.trim());

const isSeparatorRow = (cells: readonly string[]): boolean =>
  cells.every((cell) => /^:?-{3,}:?$/u.test(cell));

const matrixRows = (): MatrixRow[] => {
  const matrix = readFileSync(matrixPath, "utf8");
  const rows: MatrixRow[] = [];

  for (const line of matrix.split("\n")) {
    if (!line.startsWith("|")) {
      continue;
    }

    const cells = markdownTableCells(line);

    if (cells[0] === "Check" || isSeparatorRow(cells)) {
      continue;
    }

    if (cells.length !== 5) {
      throw new Error(`Invalid brain-battle matrix row cell count: ${line}`);
    }

    rows.push({
      check: cells[0],
      status: cells[1],
      guard: cells[2],
      evidence: cells[3],
      doesNotProve: cells[4]
    });
  }

  return rows;
};

const hasSubstantiveText = (value: string): boolean =>
  value.trim().length > 0 && value.trim().toLowerCase() !== "none.";

const sectionBody = (body: string, heading: string): string => {
  const start = body.indexOf(heading);

  if (start === -1) {
    throw new Error(`Could not find section ${heading}`);
  }

  const nextHeading = body.indexOf("\n## ", start + heading.length);

  return body.slice(start, nextHeading === -1 ? undefined : nextHeading);
};

describe("KRN brain-battle eval matrix invariants", () => {
  it("keeps implemented checks tied to a guard, evidence, and proof boundary", () => {
    const findings = matrixRows().flatMap((row) => {
      const issues: string[] = [];

      if (!hasSubstantiveText(row.check)) {
        issues.push("row has empty check");
      }

      if (!hasSubstantiveText(row.status)) {
        issues.push(`${row.check}: missing status`);
      }

      if (!hasSubstantiveText(row.doesNotProve)) {
        issues.push(`${row.check}: missing does-not-prove boundary`);
      }

      if (row.status === "implemented now") {
        if (!hasSubstantiveText(row.guard)) {
          issues.push(`${row.check}: implemented check missing guard`);
        }

        if (!hasSubstantiveText(row.evidence)) {
          issues.push(`${row.check}: implemented check missing evidence`);
        }
      }

      return issues;
    });

    expect(findings).toEqual([]);
  });

  it("keeps the current smoke description aligned with invariant guard filters", () => {
    const matrix = readFileSync(matrixPath, "utf8");
    const packageJson = readFileSync(packageJsonPath, "utf8");
    const currentSmoke = sectionBody(matrix, "## Current Smoke");
    const normalizedCurrentSmoke = currentSmoke.replace(/\s+/gu, " ");

    for (const filter of [
      "activePlanInvariants",
      "contextHygieneInvariants",
      "sourceMapInvariants",
      "skillInvariants",
      "brainBattleMatrixInvariants",
      "typescriptBoundaryInvariants"
    ]) {
      expect(packageJson).toContain(filter);
    }

    for (const phrase of [
      "active plan freshness",
      "active context hygiene",
      "source-map source-to-decision mapping",
      "source location scheme",
      "pattern-intake output contract",
      "repo-local skill routability",
      "source-to-decision skill contract",
      "TypeScript boundary hygiene",
      "matrix guard/proof boundaries"
    ]) {
      expect(normalizedCurrentSmoke).toContain(phrase);
    }
  });
});
