import { readFileSync } from "node:fs";

import {
  describe,
  expect,
  it
} from "vitest";

const readRootFile = (path: string): string =>
  readFileSync(new URL(`../../../../${path}`, import.meta.url), "utf8");

const lineCount = (body: string): number => body.split("\n").length;

describe("KRN context hygiene invariants", () => {
  it("keeps raw materials and broad historical rereads out of active context", () => {
    const agents = readRootFile("AGENTS.md");
    const roadmap = readRootFile("KRN_ROADMAP.md");
    const goal = readRootFile("GOAL.md");
    const plan = readRootFile("PLAN.md");

    expect(agents).toContain("Do not treat historical docs as required reading");
    expect(agents).toContain("If the next step requires broad historical rereads");
    expect(roadmap).toContain("Markdown is not runtime memory.");
    expect(roadmap).toContain("Docs folders are not the brain.");

    const activeTruth = `${goal}\n${plan}`;

    expect(activeTruth).not.toMatch(/docs\/materials\//u);
    expect(activeTruth).not.toMatch(/docs\/plans\/historical-ledgers/u);
  });

  it("keeps the required kernel boundary aligned with current product state", () => {
    const roadmap = readRootFile("KRN_ROADMAP.md");

    expect(roadmap).toContain("## Current Boundary");
    expect(roadmap).toContain("controlled internal alpha");
    expect(roadmap).toContain("Not product-ready");
    expect(roadmap).toContain("no markdown-backed runtime memory");
    expect(roadmap).toContain("`AGENTS.md` for agent operating rules");
    expect(roadmap).toContain("Beads for durable task graph");
    expect(roadmap).toContain("DB/corpus/eval read models for brain memory");
    expect(roadmap).toContain("strict TypeScript package spine");
    expect(roadmap).toContain("source and memory activation");
    expect(roadmap).toContain("DB-backed source/memory/evidence/review paths");

    expect(roadmap).not.toContain("## Current Bootstrap Boundary");
    expect(roadmap).not.toContain("Commit 0/1");
  });

  it("keeps primitive ledger explicit about live, reduced, rejected, and deprecated surfaces", () => {
    const ledger = readRootFile("docs/architecture/primitive-ledger.md");

    expect(ledger).toContain("This ledger is docs guidance, not behavior proof.");

    for (const primitive of [
      "select: activation retrieval, ranking, filtering",
      "apply: compile plan, assemble context, record memory application",
      "verify: evidence, review, feedback, context, activation readback",
      "forget: hurt/stale feedback and anti-memory exclusion"
    ]) {
      expect(ledger).toContain(`| ${primitive} | live |`);
    }

    for (const surface of [
      "| Broad dashboard/API/MCP/product surface | rejected |",
      "| Worker daemon / scheduler / leases / retry runtime | reduced |",
      "| Promptfoo or LLM-as-judge as behavior authority | reduced |",
      "| Old eval alias naming | removed |",
      "| File-backed runtime markdown memory | rejected |",
      "| `@krn/schema` package boundary | deprecated |",
      "| Phantom policy gate surface | deprecated |",
      "| Historical docs/materials as active context | deprecated |"
    ]) {
      expect(ledger).toContain(surface);
    }

    expect(ledger).toContain("broad extractor churn is rejected without new evidence");
    expect(ledger).toContain("Use `pnpm eval:krn:smoke` as the active deterministic behavior/docs gate.");
    expect(ledger).toContain("Do not recreate a duplicate schema package");
  });

  it("keeps README current truth aligned with continuous controlled-internal-alpha work", () => {
    const readme = readRootFile("README.md");

    expect(readme).toContain("Root `PLAN.md` is the active compact product plan.");
    expect(readme).toContain("Root `GOAL.md` is the compact");
    expect(readme).toContain("Root `PLANS.md` carries the compact execution contract");
    expect(readme.replace(/\s+/gu, " ")).toContain("not markdown report forests");
    expect(readme).toContain("controlled-internal-alpha for technical operators");
    expect(readme).toContain("product-ready: no");
    expect(readme).toContain("widened internal alpha: no");
    expect(readme).toContain("The current work loop is continuous and evidence-driven");
    expect(readme).toContain("update Beads and compact root state");
    expect(readme).toContain("The legacy audit/anti-slop direction remains closed.");

    expect(readme).not.toContain("The current reset direction is");
    expect(readme).not.toContain("QG-06");
    expect(readme).not.toContain("audit-authority direction");
  });

  it("keeps root active surfaces compact enough for resume context", () => {
    const goal = readRootFile("GOAL.md");
    const plan = readRootFile("PLAN.md");

    expect(lineCount(goal)).toBeLessThanOrEqual(200);
    expect(lineCount(plan)).toBeLessThanOrEqual(200);
    expect(goal).toContain("Detailed completed history, evidence, outcomes, and next-task synthesis live in");
    expect(plan).toContain("Detailed history stays in Beads");
    expect(plan).toContain("archived ledgers");

    const activeTruth = `${goal}\n${plan}`;

    expect(activeTruth).not.toMatch(/^V\d{3,}-00.*complete\.$/mu);
  });

  it("keeps roadmap aligned with current controlled-internal-alpha state", () => {
    const roadmap = readRootFile("KRN_ROADMAP.md");

    expect(roadmap).toContain("controlled internal alpha");
    expect(roadmap).toContain("Not product-ready");
    expect(roadmap).toContain("no external operator proof");
    expect(roadmap).toContain("`GOAL.md`, `PLAN.md`, and `PLANS.md`");
    expect(roadmap).toContain("governed second-opinion review");
    expect(roadmap).toContain("DB/corpus/eval read models");
    expect(roadmap).toContain(
      "source -> mechanism -> KRN implication -> decision/rejection -> consumer -> falsifier"
    );

    expect(roadmap).not.toContain("This repo currently contains only Commit 0/1 surfaces");
    expect(roadmap).not.toContain("krn context build");
    expect(roadmap).not.toContain("krn review capture");
  });

  it("keeps roadmap aligned with the current harness spine", () => {
    const roadmap = readRootFile("KRN_ROADMAP.md");

    expect(roadmap).toContain("operator intent");
    expect(roadmap).toContain("task contract");
    expect(roadmap).toContain("bounded Codex brief");
    expect(roadmap).toContain("evidence capture");
    expect(roadmap).toContain("review and feedback");
    expect(roadmap).toContain("memory/source/eval candidates");
    expect(roadmap).toContain("controlled internal alpha");

    expect(roadmap).not.toContain("context packet");
    expect(roadmap).not.toContain("review capture");
    expect(roadmap).not.toContain("This is the active project doctrine");
  });
});
