import { readFileSync } from "node:fs";

import {
  describe,
  expect,
  it
} from "vitest";

const readRootFile = (path: string): string =>
  readFileSync(new URL(`../../../${path}`, import.meta.url), "utf8");

describe("KRN ADR invariants", () => {
  it("keeps source-backed architecture decisions tied to a consumer before falsifier", () => {
    const codexOperatingLayer = readRootFile("docs/decisions/ADR-0001-codex-operating-layer.md");
    const brainStore = readRootFile("docs/decisions/ADR-0010-brain-store-postgres-pgvector.md");

    expect(codexOperatingLayer).toContain(
      "source -> mechanism -> KRN implication -> decision/rejection -> consumer ->"
    );
    expect(codexOperatingLayer).toContain("falsifier");
    expect(codexOperatingLayer).not.toContain(
      "Architecture decisions must map source -> mechanism -> KRN implication."
    );

    expect(brainStore).toContain(
      "source -> mechanism -> KRN implication -> decision/rejection\n  -> consumer -> falsifier"
    );
    expect(brainStore).not.toContain(
      "verified through source -> mechanism -> KRN implication -> decision/rejection."
    );
  });
});
