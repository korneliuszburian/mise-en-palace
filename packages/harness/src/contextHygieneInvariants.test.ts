import { readFileSync } from "node:fs";

import {
  describe,
  expect,
  it
} from "vitest";

const readRootFile = (path: string): string =>
  readFileSync(new URL(`../../../${path}`, import.meta.url), "utf8");

const lineCount = (body: string): number => body.split("\n").length;

describe("KRN context hygiene invariants", () => {
  it("keeps raw materials and broad historical rereads out of active context", () => {
    const agents = readRootFile("AGENTS.md");
    const kernel = readRootFile("docs/KRN_KERNEL.md");
    const goal = readRootFile("GOAL.md");
    const plan = readRootFile("PLAN.md");

    expect(agents).toContain("Do not treat `docs/materials/` as required reading");
    expect(agents).toContain("If the next step requires broad historical rereads");
    expect(kernel).toContain("Raw onboarding material is quarantined in `docs/materials/`.");
    expect(kernel).toContain("Active context must be small, selected, and task-specific.");

    const activeTruth = `${goal}\n${plan}`;

    expect(activeTruth).not.toMatch(/docs\/materials\//u);
    expect(activeTruth).not.toMatch(/docs\/plans\/historical-ledgers/u);
  });

  it("keeps the required kernel boundary aligned with current product state", () => {
    const kernel = readRootFile("docs/KRN_KERNEL.md");

    expect(kernel).toContain("## Current Product Boundary");
    expect(kernel).toContain("controlled-internal-alpha");
    expect(kernel).toContain("not product-ready");
    expect(kernel).toContain("not widened internal alpha");
    expect(kernel).toContain("compact root `GOAL.md` and `PLAN.md`");
    expect(kernel).toContain("PLANS.md");
    expect(kernel).toContain("source-to-decision and pattern-intake gates");
    expect(kernel).toContain("typed harness spine");
    expect(kernel).toContain("store-backed memory/source/evidence/review behavior");

    expect(kernel).not.toContain("## Current Bootstrap Boundary");
    expect(kernel).not.toContain("Commit 0/1");
  });

  it("keeps README current truth aligned with continuous controlled-internal-alpha work", () => {
    const readme = readRootFile("README.md");

    expect(readme).toContain("Root `PLAN.md` is the active compact product plan.");
    expect(readme).toContain("Root `GOAL.md` is the compact");
    expect(readme).toContain("Root `PLANS.md` carries detailed continuous execution");
    expect(readme).toContain("controlled-internal-alpha for technical operators");
    expect(readme).toContain("product-ready: no");
    expect(readme).toContain("widened internal alpha: no");
    expect(readme).toContain("The current work loop is continuous and evidence-driven");
    expect(readme).toContain("append next task to PLANS.md");
    expect(readme).toContain("The legacy audit/anti-slop direction remains closed.");

    expect(readme).not.toContain("The current reset direction is");
    expect(readme).not.toContain("QG-06");
    expect(readme).not.toContain("audit-authority direction");
  });

  it("keeps root active surfaces compact enough for resume context", () => {
    const goal = readRootFile("GOAL.md");
    const plan = readRootFile("PLAN.md");

    expect(lineCount(goal)).toBeLessThanOrEqual(130);
    expect(lineCount(plan)).toBeLessThanOrEqual(170);
    expect(goal).toContain("Detailed completed history, evidence, outcomes, and next-task synthesis live in");
    expect(plan).toContain("Detailed history stays in `PLANS.md`.");

    const activeTruth = `${goal}\n${plan}`;

    expect(activeTruth).not.toMatch(/^V\d{3,}-00.*complete\.$/mu);
  });

  it("keeps onboarding aligned with current controlled-internal-alpha state", () => {
    const onboarding = readRootFile("docs/KRN_ONBOARDING.md");

    expect(onboarding).toContain("controlled-internal-alpha");
    expect(onboarding).toContain("not product-ready");
    expect(onboarding).toContain("not widened internal alpha");
    expect(onboarding).toContain("GOAL.md` / `PLAN.md");
    expect(onboarding).toContain("PLANS.md");
    expect(onboarding).toContain("source-to-decision and pattern-intake gates");
    expect(onboarding).toContain("DB-backed replay and smoke paths");
    expect(onboarding).toContain("External second-operator proof remains blocked/deferred");
    expect(onboarding).toContain(
      "source -> mechanism -> KRN implication -> decision/rejection -> consumer -> falsifier"
    );

    expect(onboarding).not.toContain("This repo currently contains only Commit 0/1 surfaces");
    expect(onboarding).not.toContain("krn context build");
    expect(onboarding).not.toContain("krn review capture");
  });

  it("keeps state-of-the-art doctrine aligned with the current harness spine", () => {
    const doctrine = readRootFile("docs/STATE_OF_THE_ART.md");

    expect(doctrine).toContain("Root `GOAL.md` and");
    expect(doctrine).toContain("`PLAN.md` remain active execution truth");
    expect(doctrine).toContain("source-to-decision / pattern gate");
    expect(doctrine).toContain("typed harness spine");
    expect(doctrine).toContain("evidence bundle");
    expect(doctrine).toContain("review assessment");
    expect(doctrine).toContain("feedback delta");
    expect(doctrine).toContain("reviewable Memory/Source/Eval candidates");
    expect(doctrine).toContain("Controlled Internal Alpha Before Product Readiness");

    expect(doctrine).not.toContain("context packet");
    expect(doctrine).not.toContain("review capture");
    expect(doctrine).not.toContain("This is the active project doctrine");
  });
});
