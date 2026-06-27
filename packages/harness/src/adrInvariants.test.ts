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
      "source -> mechanism -> KRN implication -> decision/rejection -> consumer -> falsifier"
    );
    expect(brainStore).not.toMatch(
      /verified through source -> mechanism -> KRN implication -> decision\/rejection\./u
    );
  });

  it("keeps worker runtime boundary aligned with retained Postgres row-locking source", () => {
    const workerBoundary = readRootFile("docs/decisions/ADR-0015-worker-runtime-boundary.md");

    expect(workerBoundary).toContain("source_id: postgres-row-locking-skip-locked");
    expect(workerBoundary).toContain("PostgreSQL Row Locking For Queue-Like Tables");
    expect(workerBoundary).toContain("docs/KRN_SOURCES.md#postgresql-row-locking-for-queue-like-tables");
    expect(workerBoundary).toContain("FOR UPDATE ... SKIP LOCKED");
    expect(workerBoundary).toContain("inconsistent view");
    expect(workerBoundary).toContain("consumer: this ADR and any successor worker-runtime ADR");
    expect(workerBoundary).toContain("does_not_prove: worker daemon readiness");
    expect(workerBoundary).toContain("do not treat `SKIP LOCKED` as permission to build a daemon");
  });
});
