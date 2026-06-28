import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  runKnowledgeCardsCommand
} from "./runKnowledgeCardsCommand.js";

const repoRoot = fileURLToPath(new URL("../../..", import.meta.url));
const cliPackageRoot = fileURLToPath(new URL("..", import.meta.url));
const cardFile = "tests/fixtures/brain-knowledge/cards/ts-boundary-unknown-first-result-state.json";
const patternFile = "docs/patterns/retained-patterns/ts-boundary-unknown-first-result-state.json";
const catalogFile = "docs/brain-knowledge/catalog.json";

describe("runKnowledgeCardsCommand", () => {
  it("renders a read-only knowledge card preview", async () => {
    const result = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [cardFile],
      patternFiles: [],
      catalogFiles: [],
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
      catalogFiles: [],
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
      catalogFiles: [],
      filter: {},
      format: "text"
    })).rejects.toThrow("Invalid BrainKnowledgeReadModel card file: package.json");
  });

  it("renders knowledge cards produced from retained pattern files", async () => {
    const result = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [],
      patternFiles: [patternFile],
      catalogFiles: [],
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
      catalogFiles: [],
      filter: {},
      format: "text"
    })).rejects.toThrow("Invalid retained pattern decision file: package.json");
  });

  it("renders knowledge cards from explicit catalog files", async () => {
    const result = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [],
      patternFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        text: "unknown-first"
      },
      format: "text"
    });

    expect(result.stdout).toContain("Catalog files: docs/brain-knowledge/catalog.json");
    expect(result.stdout).toContain(
      "docs/brain-knowledge/catalog.json:../patterns/retained-patterns/source-to-decision-retention-gate.json"
    );
    expect(result.stdout).toContain(
      "docs/brain-knowledge/catalog.json:../patterns/retained-patterns/ts-boundary-unknown-first-result-state.json"
    );
    expect(result.stdout).toContain("pattern:ts-boundary-unknown-first-result-state");
  });

  it("renders self-contained html preview with proof boundaries", async () => {
    const result = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [],
      patternFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        text: "unknown-first"
      },
      format: "html"
    });

    expect(result.stdout).toContain("<!doctype html>");
    expect(result.stdout).toContain("<title>KRN Brain Knowledge Cards</title>");
    expect(result.stdout).toContain("type=\"search\"");
    expect(result.stdout).toContain("Access: read-only");
    expect(result.stdout).toContain("Mutation: none");
    expect(result.stdout).toContain("pattern:ts-boundary-unknown-first-result-state");
    expect(result.stdout).toContain("Source refs");
    expect(result.stdout).toContain("Evidence refs");
    expect(result.stdout).toContain("Falsifier");
    expect(result.stdout).toContain("Does not prove");
    expect(result.stdout).toContain("Proof Boundaries");
    expect(result.stdout).toContain("does not prove:");
    expect(result.stdout).toContain("search.addEventListener");
  });

  it("renders every catalog card in html with proof-boundary fields", async () => {
    const result = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [],
      patternFiles: [],
      catalogFiles: [catalogFile],
      filter: {},
      format: "html"
    });

    expect(result.stdout).toContain("pattern:evidence-proof-non-proof-boundary");
    expect(result.stdout).toContain("pattern:codex-skill-progressive-disclosure-routing");
    expect(result.stdout).toContain("pattern:source-to-decision-retention-gate");
    expect(result.stdout).toContain("pattern:ts-boundary-unknown-first-result-state");
    expect(result.stdout).toContain("Codex skill progressive-disclosure routing");
    expect(result.stdout).toContain("Evidence proof and non-proof boundary");
    expect(result.stdout).toContain("Source-to-decision retention gate");
    expect(result.stdout).toContain("Unknown-first external boundary with explicit result state");
    expect(result.stdout).toContain("Source refs");
    expect(result.stdout).toContain("Evidence refs");
    expect(result.stdout).toContain("Falsifier");
    expect(result.stdout).toContain("Does not prove");
    expect(result.stdout).toContain("Proof Boundaries");
    expect(result.stdout).toContain("Mutation: none");
    expect(result.stdout).toContain("does not prove:");
    expect(result.stdout).toContain("This card does not prove command truth");
  });

  it("resolves root-relative catalog files from a package cwd", async () => {
    const result = await runKnowledgeCardsCommand({
      cwd: cliPackageRoot,
      cardFiles: [],
      patternFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        text: "unknown-first"
      },
      format: "text"
    });

    expect(result.stdout).toContain("Catalog files: docs/brain-knowledge/catalog.json");
    expect(result.stdout).toContain("pattern:ts-boundary-unknown-first-result-state");
  });

  it("searches the second retained pattern through the catalog", async () => {
    const result = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [],
      patternFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        text: "retention gate"
      },
      format: "text"
    });

    expect(result.stdout).toContain("Results: 1");
    expect(result.stdout).toContain("pattern:source-to-decision-retention-gate");
    expect(result.stdout).toContain("Source-to-decision retention gate");
  });

  it("searches the evidence proof boundary pattern through the catalog", async () => {
    const result = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [],
      patternFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        text: "proof-boundary"
      },
      format: "json"
    });
    const preview = parsePreviewResource(result.stdout);

    expect(cardIds(preview)).toEqual(["pattern:evidence-proof-non-proof-boundary"]);
    expect(preview.proof.doesNotProve).toContain("search ranking quality is good");
    expect(preview.mutation).toBe("none");
  });

  it("searches the Codex skill routing pattern through the catalog", async () => {
    const result = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [],
      patternFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        text: "progressive-disclosure"
      },
      format: "json"
    });
    const preview = parsePreviewResource(result.stdout);

    expect(cardIds(preview)).toEqual(["pattern:codex-skill-progressive-disclosure-routing"]);
    expect(preview.proof.doesNotProve).toContain("KRN is product-ready");
    expect(preview.mutation).toBe("none");
  });

  it("guards deterministic catalog search results and proof boundaries", async () => {
    const typeScriptResult = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [],
      patternFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        text: "unknown-first"
      },
      format: "json"
    });
    const sourceDecisionResult = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [],
      patternFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        text: "retention gate"
      },
      format: "json"
    });

    const typeScriptPreview = parsePreviewResource(typeScriptResult.stdout);
    const sourceDecisionPreview = parsePreviewResource(sourceDecisionResult.stdout);

    expect(cardIds(typeScriptPreview)).toEqual(["pattern:ts-boundary-unknown-first-result-state"]);
    expect(cardIds(sourceDecisionPreview)).toEqual(["pattern:source-to-decision-retention-gate"]);
    expect(typeScriptPreview.proof.doesNotProve).toContain("search ranking quality is good");
    expect(sourceDecisionPreview.proof.doesNotProve).toContain("KRN is product-ready");
    expect(typeScriptPreview.access).toBe("read_only");
    expect(typeScriptPreview.mutation).toBe("none");
    expect(sourceDecisionPreview.access).toBe("read_only");
    expect(sourceDecisionPreview.mutation).toBe("none");
  });

  it("returns every catalog card without a text filter", async () => {
    const result = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [],
      patternFiles: [],
      catalogFiles: [catalogFile],
      filter: {},
      format: "json"
    });
    const preview = parsePreviewResource(result.stdout);

    expect(cardIds(preview).sort()).toEqual([
      "pattern:codex-skill-progressive-disclosure-routing",
      "pattern:evidence-proof-non-proof-boundary",
      "pattern:source-to-decision-retention-gate",
      "pattern:ts-boundary-unknown-first-result-state"
    ]);
  });

  it("rejects invalid catalog files", async () => {
    await expect(runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [],
      patternFiles: [],
      catalogFiles: ["package.json"],
      filter: {},
      format: "text"
    })).rejects.toThrow("Invalid brain knowledge catalog file: package.json");
  });
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

type PreviewResourceForTest = {
  access: "read_only";
  mutation: "none";
  cards: {
    id: string;
  }[];
  proof: {
    doesNotProve: string[];
  };
};

function parsePreviewResource(value: string): PreviewResourceForTest {
  const parsed: unknown = JSON.parse(value);

  if (!isRecord(parsed)) {
    throw new Error("knowledge cards JSON output must be an object");
  }

  const access = parsed["access"];
  const mutation = parsed["mutation"];
  const cards = parsed["cards"];
  const proof = parsed["proof"];

  if (access !== "read_only" || mutation !== "none" || !Array.isArray(cards) || !isRecord(proof)) {
    throw new Error("knowledge cards JSON output does not match preview resource shape");
  }

  const doesNotProve = proof["doesNotProve"];

  if (!Array.isArray(doesNotProve) || !doesNotProve.every((item) => typeof item === "string")) {
    throw new Error("knowledge cards JSON output must include doesNotProve proof boundaries");
  }

  return {
    access,
    mutation,
    cards: cards.map((card) => {
      if (!isRecord(card) || typeof card["id"] !== "string") {
        throw new Error("knowledge cards JSON output cards must include ids");
      }

      return {
        id: card["id"]
      };
    }),
    proof: {
      doesNotProve
    }
  };
}

function cardIds(resource: PreviewResourceForTest): string[] {
  return resource.cards.map((card) => card.id);
}
