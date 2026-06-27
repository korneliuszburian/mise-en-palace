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
  });
});
