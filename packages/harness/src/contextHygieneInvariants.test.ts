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
});
