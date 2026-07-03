import {
  existsSync,
  readFileSync
} from "node:fs";

import {
  describe,
  expect,
  it
} from "vitest";

const matrixPath = new URL(
  "../../../../docs/architecture/behavior-gate-matrix.md",
  import.meta.url
);
const cliSurfacesPath = new URL(
  "../../../../docs/architecture/cli-surfaces.md",
  import.meta.url
);
const packageJsonPath = new URL("../../../../package.json", import.meta.url);
const promptfooBoundaryPath = new URL(
  "../../../../docs/architecture/promptfoo-adapter-boundary.md",
  import.meta.url
);
const repoRoot = new URL("../../../../", import.meta.url);

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
      throw new Error(`Invalid behavior gate matrix row cell count: ${line}`);
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

const staleRootCliTestPathPattern =
  /packages\/cli\/src\/(?!__tests__\/)[^`\s|;]+\.test\.ts/u;

const sectionBody = (body: string, heading: string): string => {
  const start = body.indexOf(heading);

  if (start === -1) {
    throw new Error(`Could not find section ${heading}`);
  }

  const nextHeading = body.indexOf("\n## ", start + heading.length);

  return body.slice(start, nextHeading === -1 ? undefined : nextHeading);
};

const markdownCodeSpans = (value: string): readonly string[] =>
  [...value.matchAll(/`([^`]+)`/gu)].map((match) => match[1] ?? "");

const packageScripts = (): Record<string, string> => {
  const parsed: unknown = JSON.parse(readFileSync(packageJsonPath, "utf8"));

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    Array.isArray(parsed) ||
    typeof (parsed as { scripts?: unknown }).scripts !== "object" ||
    (parsed as { scripts?: unknown }).scripts === null ||
    Array.isArray((parsed as { scripts?: unknown }).scripts)
  ) {
    throw new Error("package.json scripts must be an object");
  }

  return (parsed as { scripts: Record<string, string> }).scripts;
};

describe("KRN behavior gate matrix invariants", () => {
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

  it("keeps behavior smoke and docs lint descriptions aligned with guard filters", () => {
    const matrix = readFileSync(matrixPath, "utf8");
    const packageJson = readFileSync(packageJsonPath, "utf8");
    const behaviorSmoke = sectionBody(matrix, "## Behavior Smoke");
    const docsLint = sectionBody(matrix, "## Docs Lint");
    const behaviorSmokeText = behaviorSmoke.replace(/\s+/gu, " ");
    const docsLintText = docsLint.replace(/\s+/gu, " ");

    for (const filter of [
      "goldenKrnBehaviorGate",
      "sourceMapInvariants",
      "typescriptBoundaryInvariants"
    ]) {
      expect(packageJson).toContain(filter);
      expect(behaviorSmokeText).toContain(filter);
    }

    for (const filter of [
      "activePlanInvariants",
      "contextHygieneInvariants",
      "skillInvariants",
      "behaviorGateMatrixInvariants"
    ]) {
      expect(packageJson).toContain(filter);
      expect(docsLintText).toContain(filter);
    }

    for (const phrase of [
      "active plan freshness",
      "active context hygiene",
      "repo-local skill routability",
      "source-to-decision skill contract",
      "root PLAN pattern-gate visibility",
      "matrix guard/proof boundaries"
    ]) {
      expect(docsLintText).toContain(phrase);
    }
  });

  it("does not cite missing repo-local skill files as active evidence", () => {
    const missingSkillRefs = matrixRows().flatMap((row) =>
      markdownCodeSpans(row.evidence)
        .filter((reference) =>
          reference.startsWith(".agents/skills/") &&
          reference.endsWith("/SKILL.md") &&
          !reference.includes("*")
        )
        .filter((reference) => !existsSync(new URL(reference, repoRoot)))
        .map((reference) => `${row.check}: ${reference}`)
    );

    expect(missingSkillRefs).toEqual([]);
  });

  it("keeps the old brain-battle command as a compatibility alias only", () => {
    const scripts = packageScripts();
    const legacyAlias = scripts["eval:brain-battle:smoke"];

    expect(scripts["eval:krn:smoke"]).toBe("pnpm eval:behavior:smoke && pnpm docs:lint");
    expect(legacyAlias).toContain("legacy compatibility alias");
    expect(legacyAlias).toContain("use eval:krn:smoke");
    expect(legacyAlias).toContain("pnpm eval:krn:smoke");

    for (const [name, command] of Object.entries(scripts)) {
      if (name === "eval:brain-battle:smoke") {
        continue;
      }

      expect(`${name}: ${command}`).not.toContain("eval:brain-battle:smoke");
    }
  });

  it("keeps active CLI proof routing on current package-local test paths", () => {
    const packageJson = readFileSync(packageJsonPath, "utf8");
    const matrix = readFileSync(matrixPath, "utf8");
    const cliSurfaces = readFileSync(cliSurfacesPath, "utf8");
    const currentCliSmokeFilter = "runRunShowCommand evidenceCaptureGoldenBehavior";
    const staleCliSmokeFilter = [
      "runRunShowCommand",
      "runCli"
    ].join(" ");

    expect(packageJson).toContain(`pnpm --filter @krn/cli test -- ${currentCliSmokeFilter}`);
    expect(packageJson).not.toContain(`pnpm --filter @krn/cli test -- ${staleCliSmokeFilter}`);

    for (const activeProofSurface of [matrix, cliSurfaces]) {
      expect(activeProofSurface).not.toMatch(staleRootCliTestPathPattern);
    }
  });

  it("does not cite deleted policy gate surfaces as implemented evidence", () => {
    const activeProofSurfaces = [
      readFileSync(matrixPath, "utf8"),
      readFileSync(cliSurfacesPath, "utf8")
    ];

    for (const activeProofSurface of activeProofSurfaces) {
      expect(activeProofSurface).not.toContain("packages/core/src/policy.ts");
      expect(activeProofSurface).not.toContain("PolicyGateId");
      expect(activeProofSurface).not.toContain("PolicyGate");
    }
  });

  it("keeps run readback matrix coverage tied to candidate reviewability metadata", () => {
    const runReadbackRow = matrixRows().find((row) =>
      row.check.includes("Run readback distinguishes proof from non-proof")
    );

    expect(runReadbackRow).toBeDefined();
    expect(runReadbackRow?.check).toContain("candidate reviewability metadata");
    expect(runReadbackRow?.guard).toContain("reviewability labels and reasons");
    expect(runReadbackRow?.evidence).toContain("packages/cli/src/__tests__/runRunShowCommand.test.ts");
    expect(runReadbackRow?.evidence).toContain(
      "docs/reviews/controlled-dogfood/2026-06-28-v207-best-pattern-intake-applied-proof/REPORT.md"
    );
    expect(runReadbackRow?.doesNotProve).toContain("candidate quality at scale");
    expect(runReadbackRow?.doesNotProve).toContain("promotion readiness");
  });

  it("keeps Promptfoo bounded as a non-authority adapter", () => {
    const packageJson = readFileSync(packageJsonPath, "utf8");
    const boundary = readFileSync(promptfooBoundaryPath, "utf8");

    expect(packageJson).not.toContain("eval:promptfoo:smoke");

    expect(boundary).toContain("bounded runner/result adapter");
    expect(boundary).toContain("not a\nKRN behavior proof authority");
    expect(boundary).toContain("prove runner/config/provider/result mapping");
    expect(boundary).toContain("promptfoo_integration_smoke");
    expect(boundary).toContain("Only `krn_behavior_execution` can satisfy GoldenTask behavior proof today.");
    expect(boundary).toContain("imply Memory Brain product readiness");
  });
});
