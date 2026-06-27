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

  it("keeps source-to-decision skill strict enough to prevent source hoarding", () => {
    const sourceToDecision = readFileSync(
      new URL("source-to-decision/SKILL.md", skillsRoot),
      "utf8"
    );

    expect(sourceToDecision).toContain("decisions with a consumer and falsifier");
    expect(sourceToDecision).toContain("docs/runbooks/pattern-intake.md");
    expect(sourceToDecision).toContain("Source without mechanism is decoration.");
    expect(sourceToDecision).toContain("Decision without falsifier is dogma.");
    expect(sourceToDecision).toContain("Do not copy paid/proprietary course material into KRN.");
    expect(sourceToDecision).toContain("Do not create a research archive, source crawler, or broad research backlog");
    expect(sourceToDecision).toContain("Do not proceed from pattern to implementation unless the consumer and falsifier");

    const requiredOutputFields = [
      "source_id:",
      "title:",
      "url:",
      "trust_tier: high | medium | low",
      "source_class: official docs | papers | high-quality public course page | practitioner writing | competitor docs | repo-local evidence | target-repo evidence | user-provided research",
      "mechanism:",
      "krn_implication:",
      "decision_kind: adopt | reject | lab_test | defer",
      "decision:",
      "does_not_prove:",
      "consumer:",
      "falsifier:"
    ];

    for (const field of requiredOutputFields) {
      expect(sourceToDecision).toContain(field);
    }

    expect(sourceToDecision).toContain("high-quality public course page");
    expect(sourceToDecision).toContain(
      "reviewability: ready | needs_more_evidence | too_vague | duplicate | not_useful | unknown"
    );
  });

  it("keeps target infra ADR decisions tied to a consumer before falsifier", () => {
    const targetInfraAdr = readFileSync(
      new URL("target-infra-adr/SKILL.md", skillsRoot),
      "utf8"
    );

    expect(targetInfraAdr).toContain(
      "source -> mechanism -> KRN implication -> decision/rejection -> consumer -> falsifier"
    );
    expect(targetInfraAdr).toContain("explicit adoption, rejection, consumer, and falsifier");
    expect(targetInfraAdr).toContain("consumer:");
    expect(targetInfraAdr).toContain("falsifier:");
  });

  it("keeps evidence review loop tied to command provenance and proof boundaries", () => {
    const evidenceReviewLoop = readFileSync(
      new URL("evidence-review-loop/SKILL.md", skillsRoot),
      "utf8"
    );

    expect(evidenceReviewLoop).toContain("command provenance");
    expect(evidenceReviewLoop).toContain("proof/non-proof boundaries");
    expect(evidenceReviewLoop).toContain("operator_reported");
    expect(evidenceReviewLoop).toContain("captured_output_file");
    expect(evidenceReviewLoop).toContain("command_runner");
    expect(evidenceReviewLoop).toContain("default_template");
    expect(evidenceReviewLoop).toContain("not_run");
    expect(evidenceReviewLoop).toContain("missing");
    expect(evidenceReviewLoop).toContain("what it does not prove");
    expect(evidenceReviewLoop).toContain(
      "Do not treat default_template, skipped, missing, or not_run command rows"
    );
  });
});
