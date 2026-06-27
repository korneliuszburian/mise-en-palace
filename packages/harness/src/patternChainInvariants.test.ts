import { readFileSync } from "node:fs";

import {
  describe,
  expect,
  it
} from "vitest";

const readRootFile = (path: string): string =>
  readFileSync(new URL(`../../../${path}`, import.meta.url), "utf8");

const activePatternSurfaces = [
  "GOAL.md",
  "PLAN.md",
  "docs/KRN_KERNEL.md",
  "docs/KRN_SOURCES.md",
  "docs/runbooks/pattern-intake.md",
  "docs/architecture/controlled-scenario-factory.md",
  "docs/decisions/ADR-0001-codex-operating-layer.md",
  "docs/decisions/ADR-0010-brain-store-postgres-pgvector.md",
  ".agents/skills/source-to-decision/SKILL.md",
  ".agents/skills/target-infra-adr/SKILL.md"
] as const;

const fullChainPattern =
  /source\s*->\s*mechanism\s*->\s*KRN implication\s*->\s*decision\/rejection\s*->\s*consumer\s*->\s*falsifier/u;

const staleChainPattern =
  /source\s*->\s*mechanism\s*->\s*KRN implication\s*->\s*decision\/rejection\s*->\s*falsifier/u;

const chainStringAuthority = new Set<(typeof activePatternSurfaces)[number]>([
  "GOAL.md",
  "PLAN.md",
  "docs/KRN_KERNEL.md",
  "docs/KRN_SOURCES.md",
  "docs/runbooks/pattern-intake.md",
  "docs/architecture/controlled-scenario-factory.md",
  "docs/decisions/ADR-0001-codex-operating-layer.md",
  "docs/decisions/ADR-0010-brain-store-postgres-pgvector.md",
  ".agents/skills/target-infra-adr/SKILL.md"
]);

describe("KRN pattern chain invariants", () => {
  it("keeps active pattern surfaces on the consumer-before-falsifier chain", () => {
    const staleFindings = activePatternSurfaces.flatMap((path) => {
      const body = readRootFile(path);
      const hasFullChain = fullChainPattern.test(body);
      const hasShortChain = staleChainPattern.test(body);
      const hasConsumer = body.includes("consumer");
      const hasFalsifier = body.includes("falsifier");

      const findings: string[] = [];

      if (chainStringAuthority.has(path) && !hasFullChain) {
        findings.push(`${path}: missing full consumer/falsifier chain`);
      }

      if (hasShortChain) {
        findings.push(`${path}: contains stale no-consumer chain`);
      }

      if (!hasConsumer || !hasFalsifier) {
        findings.push(`${path}: missing consumer/falsifier discipline`);
      }

      return findings;
    });

    expect(staleFindings).toEqual([]);
  });
});
