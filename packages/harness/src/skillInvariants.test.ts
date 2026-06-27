import {
  readdirSync,
  readFileSync
} from "node:fs";

import {
  describe,
  expect,
  it
} from "vitest";

const skillsRoot = new URL("../../../.agents/skills/", import.meta.url);

interface SkillFile {
  directoryName: string;
  body: string;
}

const skillFiles = (): SkillFile[] =>
  readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({
      directoryName: entry.name,
      body: readFileSync(new URL(`${entry.name}/SKILL.md`, skillsRoot), "utf8")
    }));

const frontmatterValue = (body: string, key: string): string | undefined => {
  const match = body.match(new RegExp(`^${key}: (.+)$`, "mu"));

  return match?.[1]?.trim();
};

describe("KRN skill invariants", () => {
  it("keeps repo-local skills routable and verifiable", () => {
    const findings = skillFiles().flatMap((skill) => {
      const name = frontmatterValue(skill.body, "name");
      const description = frontmatterValue(skill.body, "description");
      const issues: string[] = [];

      if (name !== skill.directoryName) {
        issues.push(`${skill.directoryName}: frontmatter name must match directory`);
      }

      if (description === undefined || description.length === 0) {
        issues.push(`${skill.directoryName}: missing description`);
      } else if (!/\bUse when\b/u.test(description) && !/\bEnforce\b/u.test(description)) {
        issues.push(`${skill.directoryName}: description must route when to use the skill`);
      }

      if (!/^## Workflow$/mu.test(skill.body)) {
        issues.push(`${skill.directoryName}: missing Workflow section`);
      }

      if (!/^## Verification$/mu.test(skill.body)) {
        issues.push(`${skill.directoryName}: missing Verification section`);
      }

      return issues;
    });

    expect(findings).toEqual([]);
  });

  it("keeps handoff compact tied to resumable active-task state", () => {
    const handoff = readFileSync(new URL("handoff-compact/SKILL.md", skillsRoot), "utf8");

    expect(handoff).toContain("active PLANS.md stream/task");
    expect(handoff).toContain("verified commit/push/CI state");
    expect(handoff).toContain("before auto-compaction, resume, pause, or transfer");
    expect(handoff).toContain("For continuous KRN goals, prefer the first incomplete active task");
    expect(handoff).toContain("Do not reread:");

    const requiredOutputFields = [
      "Objective:",
      "Active stream/task:",
      "Last verified state:",
      "Commit/push/CI:",
      "Changed files:",
      "Decisions:",
      "Blockers/risks:",
      "Context selectors:",
      "Next action:",
      "Do not reread:"
    ];

    for (const field of requiredOutputFields) {
      expect(handoff).toContain(field);
    }
  });
});
