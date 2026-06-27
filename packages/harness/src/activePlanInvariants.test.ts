import { readFileSync } from "node:fs";

import {
  describe,
  expect,
  it
} from "vitest";

const readRootFile = (path: string): string =>
  readFileSync(new URL(`../../../${path}`, import.meta.url), "utf8");

const requiredLine = (body: string, pattern: RegExp, label: string): string => {
  const match = body.match(pattern);
  const value = match?.[1]?.trim();

  if (value === undefined || value.length === 0) {
    throw new Error(`Could not find ${label}`);
  }

  return value;
};

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");

const sectionBody = (body: string, heading: string): string => {
  const start = body.indexOf(heading);

  if (start === -1) {
    throw new Error(`Could not find section ${heading}`);
  }

  const nextHeading = body.indexOf("\n## ", start + heading.length);

  return body.slice(start, nextHeading === -1 ? undefined : nextHeading);
};

describe("KRN active plan invariants", () => {
  it("keeps GOAL, PLAN, and PLANS pointed at the same active stream and task", () => {
    const goal = readRootFile("GOAL.md");
    const plan = readRootFile("PLAN.md");
    const plans = readRootFile("PLANS.md");

    const planActiveStream = requiredLine(plan, /^active stream: (.+)$/mu, "PLAN active stream");
    const planCurrentTask = requiredLine(plan, /^current task: (.+)$/mu, "PLAN current task");
    const plansActiveStream = requiredLine(plans, /^active stream: (.+)$/mu, "PLANS active stream");
    const plansCurrentTask = requiredLine(plans, /^current task: (.+)$/mu, "PLANS current task");

    expect(plansActiveStream).toBe(planActiveStream);
    expect(plansCurrentTask).toBe(planCurrentTask);
    expect(goal).toContain(`${planActiveStream}\n`);
    expect(goal).toContain(`current task: ${planCurrentTask}.`);
    expect(goal).not.toContain(`${planCurrentTask}: complete.`);
    expect(plan).not.toMatch(new RegExp(`^${escapeRegExp(planCurrentTask)}.*complete$`, "mu"));
    expect(plan).not.toMatch(new RegExp(`^${escapeRegExp(planActiveStream)}.*complete$`, "mu"));
  });

  it("keeps the PLANS compact GOAL contract free of stale concrete streams", () => {
    const plans = readRootFile("PLANS.md");
    const compactGoalContract = sectionBody(
      plans,
      "## 22. Compact GOAL.md Contract To Pair With This Plan"
    );

    expect(compactGoalContract).toContain("Active stream: <current active stream from PLAN.md>.");
    expect(compactGoalContract).not.toMatch(/Active stream: V\d+/u);
    expect(compactGoalContract).not.toMatch(/current task: V\d+/iu);
  });

  it("keeps the PLANS known current gap tied to the current task", () => {
    const plans = readRootFile("PLANS.md");
    const plansCurrentTask = requiredLine(plans, /^current task: (.+)$/mu, "PLANS current task");
    const knownCurrentGapStart = plans.indexOf("Known current gap:");
    const sectionTwoStart = plans.indexOf("\n## 2. Product Thesis", knownCurrentGapStart);

    if (knownCurrentGapStart === -1 || sectionTwoStart === -1) {
      throw new Error("Could not find PLANS known current gap section");
    }

    const knownCurrentGap = plans.slice(knownCurrentGapStart, sectionTwoStart);

    expect(knownCurrentGap).toContain(plansCurrentTask);
    expect(knownCurrentGap).not.toContain("V63 recorded");
    expect(knownCurrentGap).not.toContain("current active gap is making");
  });

  it("keeps the PLANS revision note historical instead of active", () => {
    const plans = readRootFile("PLANS.md");
    const revisionNote = sectionBody(plans, "## 23. Plan Revision Note");

    expect(revisionNote).toContain("At creation time");
    expect(revisionNote).not.toContain("as the next active stream");
    expect(revisionNote).not.toMatch(/sets V\d+.*next active stream/u);
  });

  it("keeps the continuous pattern gate visible in active execution surfaces", () => {
    const goal = readRootFile("GOAL.md");
    const plans = readRootFile("PLANS.md");

    expect(goal).toMatch(/For every non-trivial infra, harness, CI[,/]\s+eval/u);
    expect(goal).toContain("Codex-surface, TypeScript");
    expect(goal).toContain("research/paper/course-driven slice");
    expect(goal).toContain("source -> mechanism -> KRN implication -> decision/rejection ->");
    expect(goal).toContain("consumer -> falsifier");
    expect(plans).toContain("docs/runbooks/pattern-intake.md");
    expect(plans).toMatch(
      /source\s*->\s*mechanism\s*->\s*KRN implication\s*->\s*decision\/rejection\s*->\s*consumer\s*->\s*falsifier/u
    );
    expect(plans).toContain("Surface Consumer Matrix");
  });
});
