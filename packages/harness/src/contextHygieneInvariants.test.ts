import { readFileSync } from "node:fs";

import {
  describe,
  expect,
  it
} from "vitest";

const readRootFile = (path: string): string =>
  readFileSync(new URL(`../../../${path}`, import.meta.url), "utf8");

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
});
