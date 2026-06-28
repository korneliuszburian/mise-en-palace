import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  runKnowledgeCardsCommand
} from "./runKnowledgeCardsCommand.js";

const repoRoot = fileURLToPath(new URL("../../..", import.meta.url));
const cardFile = "tests/fixtures/brain-knowledge/cards/ts-boundary-unknown-first-result-state.json";
const patternFile = "docs/patterns/retained-patterns/ts-boundary-unknown-first-result-state.json";

describe("runKnowledgeCardsCommand", () => {
  it("renders a read-only knowledge card preview", async () => {
    const result = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [cardFile],
      patternFiles: [],
      filter: {
        kind: "pattern",
        status: "active",
        reviewability: "ready",
        text: "unknown-first"
      },
      format: "text"
    });

    expect(result.stdout).toContain("KRN Brain Knowledge Cards Preview");
    expect(result.stdout).toContain("Access: read-only");
    expect(result.stdout).toContain("Mutation: none");
    expect(result.stdout).toContain("Source: explicit files");
    expect(result.stdout).toContain("Results: 1");
    expect(result.stdout).toContain("pattern:ts-boundary-unknown-first-result-state");
    expect(result.stdout).toContain("reviewability: ready");
    expect(result.stdout).toContain("sourceRefs:");
    expect(result.stdout).toContain("evidenceRefs:");
    expect(result.stdout).toContain("falsifier:");
    expect(result.stdout).toContain("doesNotProve:");
    expect(result.stdout).toContain("does not prove: KRN is product-ready");
  });

  it("renders json preview without mutation authority", async () => {
    const result = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [cardFile],
      patternFiles: [],
      filter: {
        text: "unknown-first"
      },
      format: "json"
    });
    const parsed: unknown = JSON.parse(result.stdout);

    if (!isRecord(parsed)) {
      throw new Error("knowledge cards JSON output must be an object");
    }

    expect(parsed).toMatchObject({
      kind: "krn.brainKnowledge.cards.preview.v1",
      access: "read_only",
      mutation: "none",
      source: "explicit_files"
    });

    const cards = parsed["cards"];
    const proof = parsed["proof"];

    expect(Array.isArray(cards)).toBe(true);
    expect(cards).toHaveLength(1);
    expect(isRecord(cards[0]) ? cards[0]["id"] : undefined).toBe(
      "pattern:ts-boundary-unknown-first-result-state"
    );
    expect(isRecord(proof) && Array.isArray(proof["doesNotProve"])
      ? proof["doesNotProve"]
      : []).toContain("KRN is product-ready");
  });

  it("rejects invalid card files", async () => {
    await expect(runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: ["package.json"],
      patternFiles: [],
      filter: {},
      format: "text"
    })).rejects.toThrow("Invalid BrainKnowledgeReadModel card file: package.json");
  });

  it("renders knowledge cards produced from retained pattern files", async () => {
    const result = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [],
      patternFiles: [patternFile],
      filter: {
        text: "unknown-first"
      },
      format: "text"
    });

    expect(result.stdout).toContain("Pattern files: docs/patterns/retained-patterns/ts-boundary-unknown-first-result-state.json");
    expect(result.stdout).toContain("pattern:ts-boundary-unknown-first-result-state");
    expect(result.stdout).toContain("reviewability: ready");
    expect(result.stdout).toContain("does not prove: knowledge cards were produced from live DB state");
  });

  it("rejects invalid retained pattern files", async () => {
    await expect(runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [],
      patternFiles: ["package.json"],
      filter: {},
      format: "text"
    })).rejects.toThrow("Invalid retained pattern decision file: package.json");
  });
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
