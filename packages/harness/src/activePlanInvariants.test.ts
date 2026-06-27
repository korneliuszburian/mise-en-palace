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
});
