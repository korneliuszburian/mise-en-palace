import {
  mkdtemp,
  writeFile
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

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
    expect(result.stdout).toContain("id=\"kindFilter\"");
    expect(result.stdout).toContain("id=\"statusFilter\"");
    expect(result.stdout).toContain("id=\"reviewabilityFilter\"");
    expect(result.stdout).toContain("id=\"usefulnessOutcomeFilter\"");
    expect(result.stdout).toContain("id=\"nextActionFilter\"");
    expect(result.stdout).toContain("Kind: pattern");
    expect(result.stdout).toContain("Status: active");
    expect(result.stdout).toContain("Reviewability: ready");
    expect(result.stdout).toContain("Next action: use");
    expect(result.stdout).toContain("Access: read-only");
    expect(result.stdout).toContain("Mutation: none");
    expect(result.stdout).toContain("pattern:ts-boundary-unknown-first-result-state");
    expect(result.stdout).toContain("data-kind=\"pattern\"");
    expect(result.stdout).toContain("data-status=\"active\"");
    expect(result.stdout).toContain("data-reviewability=\"ready\"");
    expect(result.stdout).toContain("data-usefulness-outcome=");
    expect(result.stdout).toContain("data-next-action=\"use\"");
    expect(result.stdout).toContain("Source refs");
    expect(result.stdout).toContain("Evidence refs");
    expect(result.stdout).toContain("Falsifier");
    expect(result.stdout).toContain("Does not prove");
    expect(result.stdout).toContain("Proof Boundaries");
    expect(result.stdout).toContain("does not prove:");
    expect(result.stdout).toContain("matchesFilter(card, \"kind\", kindFilter.value)");
    expect(result.stdout).toContain("matchesFilter(card, \"usefulnessOutcome\", usefulnessOutcomeFilter.value)");
    expect(result.stdout).toContain("search.addEventListener");
    expect(result.stdout).toContain("kindFilter.addEventListener");
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
    expect(result.stdout).toContain("pattern:active-context-compact-current-truth");
    expect(result.stdout).toContain("pattern:brain-knowledge-read-only-ui-boundary");
    expect(result.stdout).toContain("pattern:codex-execplan-living-validation-loop");
    expect(result.stdout).toContain("pattern:codex-goal-continuation-evidence-contract");
    expect(result.stdout).toContain("pattern:codex-prompt-task-contract-proof-boundary");
    expect(result.stdout).toContain("pattern:codex-skill-progressive-disclosure-routing");
    expect(result.stdout).toContain("pattern:source-to-decision-retention-gate");
    expect(result.stdout).toContain("pattern:target-repo-write-authority-boundary");
    expect(result.stdout).toContain("pattern:untrusted-context-warning-boundary");
    expect(result.stdout).toContain("pattern:ts-boundary-unknown-first-result-state");
    expect(result.stdout).toContain("Active context stays compact and current-truth routed");
    expect(result.stdout).toContain("Brain knowledge UI/search remains read-only until usefulness proof");
    expect(result.stdout).toContain("Codex ExecPlan living validation loop");
    expect(result.stdout).toContain("Codex goal continuation evidence contract");
    expect(result.stdout).toContain("Codex prompt task contract proof boundary");
    expect(result.stdout).toContain("Codex skill progressive-disclosure routing");
    expect(result.stdout).toContain("Evidence proof and non-proof boundary");
    expect(result.stdout).toContain("Source-to-decision retention gate");
    expect(result.stdout).toContain("Target repo writes require explicit authority and rollback");
    expect(result.stdout).toContain("Untrusted selected context is labeled before Codex use");
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

  it("executes static html text and field filters in a DOM-capable smoke", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "krn-knowledge-preview-"));
    const patternCardPath = path.join(directory, "pattern-card.json");
    const memoryCardPath = path.join(directory, "memory-card.json");

    await writeFile(patternCardPath, JSON.stringify(knowledgeCard({
      id: "pattern:skill-routing",
      kind: "pattern",
      status: "active",
      title: "Skill routing",
      summary: "Use progressive-disclosure skills for repeated workflows.",
      reviewability: "ready",
      usefulnessOutcome: "helped",
      nextAction: "use"
    })));
    await writeFile(memoryCardPath, JSON.stringify(knowledgeCard({
      id: "memory:stale-dashboard",
      kind: "memory",
      status: "stale",
      title: "Stale dashboard plan",
      summary: "Do not treat old dashboard plans as active product truth.",
      reviewability: "needs_more_evidence",
      nextAction: "defer"
    })));

    const result = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [patternCardPath, memoryCardPath],
      patternFiles: [],
      catalogFiles: [],
      filter: {},
      format: "html"
    });
    const smoke = executeKnowledgePreviewHtml(result.stdout);

    expect(smoke.count()).toBe("Results: 2");

    smoke.setSearch("skill");
    expect(smoke.visibleIds()).toEqual(["pattern:skill-routing"]);
    expect(smoke.count()).toBe("Results: 1");

    smoke.setSearch("");
    smoke.setFilter("usefulnessOutcomeFilter", "helped");
    expect(smoke.visibleIds()).toEqual(["pattern:skill-routing"]);
    expect(smoke.count()).toBe("Results: 1");

    smoke.setFilter("usefulnessOutcomeFilter", "");
    smoke.setFilter("kindFilter", "memory");
    expect(smoke.visibleIds()).toEqual(["memory:stale-dashboard"]);
    expect(smoke.count()).toBe("Results: 1");

    smoke.setFilter("reviewabilityFilter", "ready");
    expect(smoke.visibleIds()).toEqual([]);
    expect(smoke.count()).toBe("Results: 0");
    expect(smoke.emptyDisplay()).toBe("block");
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
        text: "command provenance"
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

  it("searches external Codex workflow patterns through the catalog", async () => {
    const goalsResult = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [],
      patternFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        text: "goal continuation"
      },
      format: "json"
    });
    const execPlanResult = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [],
      patternFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        text: "living validation loop"
      },
      format: "json"
    });
    const taskContractResult = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [],
      patternFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        text: "task contract proof boundary"
      },
      format: "json"
    });

    const goalsPreview = parsePreviewResource(goalsResult.stdout);
    const execPlanPreview = parsePreviewResource(execPlanResult.stdout);
    const taskContractPreview = parsePreviewResource(taskContractResult.stdout);

    expect(cardIds(goalsPreview)).toEqual([
      "pattern:codex-goal-continuation-evidence-contract"
    ]);
    expect(cardIds(execPlanPreview)).toEqual([
      "pattern:codex-execplan-living-validation-loop"
    ]);
    expect(cardIds(taskContractPreview)).toEqual([
      "pattern:codex-prompt-task-contract-proof-boundary"
    ]);
    expect(goalsPreview.proof.doesNotProve).toContain("KRN is product-ready");
    expect(execPlanPreview.proof.doesNotProve).toContain("search ranking quality is good");
    expect(taskContractPreview.proof.doesNotProve).toContain("KRN is product-ready");
  });

  it("renders retained pattern usefulness feedback through catalog readback", async () => {
    const result = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [],
      patternFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        text: "goal continuation"
      },
      format: "text"
    });

    expect(result.stdout).toContain(
      "Usefulness feedback files: docs/brain-knowledge/catalog.json:usefulness-feedback/v288-external-codex-workflow-patterns.json"
    );
    expect(result.stdout).toContain("pattern:codex-goal-continuation-evidence-contract");
    expect(result.stdout).toContain("usefulnessOutcome: helped");
    expect(result.stdout).toContain(
      "usefulnessSummary: Prevented stale pasted V05 objective from rolling the active stream backward from V288."
    );
    expect(result.stdout).toContain(
      "usefulnessDoesNotProve: This feedback does not prove automatic resume correctness or product readiness."
    );
  });

  it("filters retained pattern cards by usefulness outcome", async () => {
    const helpedResult = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [],
      patternFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        usefulnessOutcome: "helped"
      },
      format: "json"
    });
    const noiseResult = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [],
      patternFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        usefulnessOutcome: "noise"
      },
      format: "json"
    });

    const helpedPreview = parsePreviewResource(helpedResult.stdout);
    const noisePreview = parsePreviewResource(noiseResult.stdout);

    expect(cardIds(helpedPreview).sort()).toEqual([
      "pattern:active-context-compact-current-truth",
      "pattern:brain-knowledge-read-only-ui-boundary",
      "pattern:codex-execplan-living-validation-loop",
      "pattern:codex-goal-continuation-evidence-contract",
      "pattern:codex-prompt-task-contract-proof-boundary",
      "pattern:codex-skill-progressive-disclosure-routing",
      "pattern:evidence-proof-non-proof-boundary",
      "pattern:source-to-decision-retention-gate",
      "pattern:target-repo-write-authority-boundary",
      "pattern:ts-boundary-unknown-first-result-state",
      "pattern:untrusted-context-warning-boundary"
    ].sort());
    expect(cardIds(noisePreview)).toEqual([]);
  });

  it("limits filtered catalog readback without hiding total result count", async () => {
    const result = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [],
      patternFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        usefulnessOutcome: "helped"
      },
      format: "json",
      limit: 2
    });
    const preview = parsePreviewResource(result.stdout);

    expect(preview.totalCards).toBe(11);
    expect(preview.returnedCards).toBe(2);
    expect(preview.limit).toBe(2);
    expect(preview.cards).toHaveLength(2);
    expect(preview.proof.doesNotProve).toContain("search ranking quality is good");
    expect(preview.mutation).toBe("none");
  });

  it("renders text preview limit with total filtered result boundary", async () => {
    const result = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [],
      patternFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        usefulnessOutcome: "helped"
      },
      format: "text",
      limit: 1
    });

    expect(result.stdout).toContain("Results: 1");
    expect(result.stdout).toContain("Total filtered results: 11");
    expect(result.stdout).toContain("Limit: 1");
    expect(result.stdout).toContain("does not prove: search ranking quality is good");
  });

  it("filters retained pattern cards with no usefulness feedback", async () => {
    const result = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [],
      patternFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        usefulnessOutcome: "none"
      },
      format: "json"
    });
    const preview = parsePreviewResource(result.stdout);

    expect(cardIds(preview)).toEqual([]);
  });

  it("combines missing usefulness feedback and text filters", async () => {
    const result = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [],
      patternFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        usefulnessOutcome: "none",
        text: "untrusted"
      },
      format: "json"
    });
    const preview = parsePreviewResource(result.stdout);

    expect(cardIds(preview)).toEqual([]);
  });

  it("renders no-match guidance for over-filtered pattern queries", async () => {
    const result = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [],
      patternFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        usefulnessOutcome: "helped",
        text: "knowledge cards pattern gate source slice operator UX TypeScript"
      },
      format: "json"
    });
    const preview = parsePreviewResource(result.stdout);

    expect(preview.totalCards).toBe(0);
    expect(preview.returnedCards).toBe(0);
    expect(cardIds(preview)).toEqual([]);
    expect(preview.noMatchGuidance).toContain("No cards matched the current filters.");
    expect(preview.noMatchGuidance).toContain(
      "Try a shorter --text query or split the query into one mechanism term."
    );
    expect(preview.noMatchGuidance).toContain(
      "Remove one structured filter such as --kind, --status, --reviewability, or --usefulness-outcome and retry."
    );
    expect(preview.noMatchGuidance).toContain(
      "If no retained pattern applies after retry, record an explicit rejected_or_deferred_patterns reason before coding."
    );
    expect(preview.noMatchGuidance).toContain(
      "Zero results do not prove that no relevant pattern exists or that search ranking is good."
    );
    expect(preview.proof.doesNotProve).toContain("search ranking quality is good");
    expect(preview.mutation).toBe("none");
  });

  it("renders text no-match guidance with proof boundaries", async () => {
    const result = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [],
      patternFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        usefulnessOutcome: "helped",
        text: "knowledge cards pattern gate source slice operator UX TypeScript"
      },
      format: "text"
    });

    expect(result.stdout).toContain("Results: 0");
    expect(result.stdout).toContain("Total filtered results: 0");
    expect(result.stdout).toContain("No-match guidance:");
    expect(result.stdout).toContain("Try a shorter --text query");
    expect(result.stdout).toContain("record an explicit rejected_or_deferred_patterns reason");
    expect(result.stdout).toContain("does not prove: search ranking quality is good");
  });

  it("includes no-match guidance in the static html preview", async () => {
    const result = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [],
      patternFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        usefulnessOutcome: "helped",
        text: "knowledge cards pattern gate source slice operator UX TypeScript"
      },
      format: "html"
    });

    expect(result.stdout).toContain("<!doctype html>");
    expect(result.stdout).toContain("No cards match the current filters.");
    expect(result.stdout).toContain("Try a shorter --text query");
    expect(result.stdout).toContain("Zero results do not prove");
    expect(result.stdout).toContain("Mutation: none");
  });

  it("guards deterministic catalog search results and proof boundaries", async () => {
    const typeScriptResult = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [],
      patternFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        text: "explicit result state"
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

  it("matches natural multi-token catalog queries without semantic ranking claims", async () => {
    const result = await runKnowledgeCardsCommand({
      cwd: repoRoot,
      cardFiles: [],
      patternFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        text: "unknown first result state"
      },
      format: "json"
    });
    const preview = parsePreviewResource(result.stdout);

    expect(cardIds(preview)).toEqual(["pattern:ts-boundary-unknown-first-result-state"]);
    expect(preview.totalCards).toBe(1);
    expect(preview.returnedCards).toBe(1);
    expect(preview.proof.doesNotProve).toContain("search ranking quality is good");
    expect(preview.access).toBe("read_only");
    expect(preview.mutation).toBe("none");
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
      "pattern:active-context-compact-current-truth",
      "pattern:brain-knowledge-read-only-ui-boundary",
      "pattern:codex-execplan-living-validation-loop",
      "pattern:codex-goal-continuation-evidence-contract",
      "pattern:codex-prompt-task-contract-proof-boundary",
      "pattern:codex-skill-progressive-disclosure-routing",
      "pattern:evidence-proof-non-proof-boundary",
      "pattern:source-to-decision-retention-gate",
      "pattern:target-repo-write-authority-boundary",
      "pattern:untrusted-context-warning-boundary",
      "pattern:ts-boundary-unknown-first-result-state"
    ].sort());
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
  totalCards?: number;
  returnedCards?: number;
  limit?: number;
  noMatchGuidance?: string[];
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
  const totalCards = parsed["totalCards"];
  const returnedCards = parsed["returnedCards"];
  const limit = parsed["limit"];
  const noMatchGuidance = parsed["noMatchGuidance"];
  const cards = parsed["cards"];
  const proof = parsed["proof"];

  if (access !== "read_only" || mutation !== "none" || !Array.isArray(cards) || !isRecord(proof)) {
    throw new Error("knowledge cards JSON output does not match preview resource shape");
  }

  if (
    totalCards !== undefined &&
    (typeof totalCards !== "number" || !Number.isSafeInteger(totalCards))
  ) {
    throw new Error("knowledge cards JSON output totalCards must be an integer when present");
  }

  if (
    returnedCards !== undefined &&
    (typeof returnedCards !== "number" || !Number.isSafeInteger(returnedCards))
  ) {
    throw new Error("knowledge cards JSON output returnedCards must be an integer when present");
  }

  if (limit !== undefined && (typeof limit !== "number" || !Number.isSafeInteger(limit))) {
    throw new Error("knowledge cards JSON output limit must be an integer when present");
  }

  if (
    noMatchGuidance !== undefined &&
    (!Array.isArray(noMatchGuidance) || !noMatchGuidance.every((item) => typeof item === "string"))
  ) {
    throw new Error("knowledge cards JSON output noMatchGuidance must be string array when present");
  }

  const doesNotProve = proof["doesNotProve"];

  if (!Array.isArray(doesNotProve) || !doesNotProve.every((item) => typeof item === "string")) {
    throw new Error("knowledge cards JSON output must include doesNotProve proof boundaries");
  }

  return {
    access,
    mutation,
    ...(totalCards === undefined ? {} : { totalCards }),
    ...(returnedCards === undefined ? {} : { returnedCards }),
    ...(limit === undefined ? {} : { limit }),
    ...(noMatchGuidance === undefined ? {} : { noMatchGuidance }),
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

type KnowledgeCardInputForTest = {
  id: string;
  kind: string;
  status: string;
  title: string;
  summary: string;
  reviewability: string;
  usefulnessOutcome?: string;
  nextAction: string;
};

function knowledgeCard(input: KnowledgeCardInputForTest): Record<string, unknown> {
  return {
    ...input,
    confidence: "high",
    sourceRefs: ["test:source"],
    evidenceRefs: ["test:evidence"],
    consumers: ["test consumer"],
    falsifier: "A filter smoke cannot find this card by its stable fields.",
    doesNotProve: "This card does not prove product readiness.",
    temporal: {
      kind: "current",
      observedAt: "2026-06-28"
    },
    dissent: {
      kind: "none"
    },
    ...(input.usefulnessOutcome === undefined ? {} : {
      usefulnessFeedback: {
        cardId: input.id,
        outcome: input.usefulnessOutcome,
        summary: `Usefulness outcome for ${input.id}.`,
        evidenceRefs: ["test:usefulness"],
        doesNotProve: "This usefulness feedback does not prove product readiness.",
        observedAt: "2026-06-28"
      }
    })
  };
}

type FakeControl = {
  value: string;
  textContent: string;
  style: {
    display: string;
  };
  addEventListener: (event: string, listener: () => void) => void;
  dispatch: (event: string) => void;
};

type FakeCard = {
  hidden: boolean;
  dataset: {
    id: string;
    search: string;
    kind: string;
    status: string;
    reviewability: string;
    usefulnessOutcome: string;
    nextAction: string;
  };
};

type KnowledgePreviewSmoke = {
  count: () => string;
  emptyDisplay: () => string;
  setFilter: (id: string, value: string) => void;
  setSearch: (value: string) => void;
  visibleIds: () => string[];
};

function executeKnowledgePreviewHtml(html: string): KnowledgePreviewSmoke {
  const scriptStart = html.indexOf("<script>\n    const cards");
  const scriptEnd = html.indexOf("\n  </script>", scriptStart);

  if (scriptStart === -1 || scriptEnd === -1) {
    throw new Error("Expected knowledge preview HTML to include executable filter script.");
  }

  const script = html.slice(scriptStart + "<script>\n".length, scriptEnd);
  const cards: FakeCard[] = [...html.matchAll(/<article data-card ([^>]+)>/gu)].map((match) => {
    const attributes = match[1] ?? "";

    return {
      hidden: false,
      dataset: {
        id: attr(attributes, "data-card-id"),
        search: attr(attributes, "data-search"),
        kind: attr(attributes, "data-kind"),
        status: attr(attributes, "data-status"),
        reviewability: attr(attributes, "data-reviewability"),
        usefulnessOutcome: attr(attributes, "data-usefulness-outcome"),
        nextAction: attr(attributes, "data-next-action")
      }
    };
  });

  const controls: Record<string, FakeControl> = {
    search: fakeControl(),
    kindFilter: fakeControl(),
    statusFilter: fakeControl(),
    reviewabilityFilter: fakeControl(),
    usefulnessOutcomeFilter: fakeControl(),
    nextActionFilter: fakeControl(),
    count: fakeControl(),
    empty: fakeControl()
  };

  runInNewContext(script, {
    document: {
      querySelectorAll: (selector: string): FakeCard[] => selector === "[data-card]" ? cards : [],
      getElementById: (id: string): FakeControl => controls[id] ?? fakeControl()
    }
  });

  return {
    count: () => controls.count.textContent,
    emptyDisplay: () => controls.empty.style.display,
    setFilter: (id, value) => {
      controls[id]!.value = value;
      controls[id]!.dispatch("change");
    },
    setSearch: (value) => {
      controls.search.value = value;
      controls.search.dispatch("input");
    },
    visibleIds: () => cards.filter((card) => !card.hidden).map((card) => card.dataset.id)
  };
}

function fakeControl(): FakeControl {
  const listeners = new Map<string, () => void>();

  return {
    value: "",
    textContent: "",
    style: {
      display: ""
    },
    addEventListener: (event, listener) => {
      listeners.set(event, listener);
    },
    dispatch: (event) => {
      listeners.get(event)?.();
    }
  };
}

function attr(attributes: string, name: string): string {
  const match = new RegExp(`${name}="([^"]*)"`, "u").exec(attributes);

  return match?.[1] ?? "";
}
