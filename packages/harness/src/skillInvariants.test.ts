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
    expect(sourceToDecision).toContain("Usefulness Feedback Closure");
    expect(sourceToDecision).toContain("krn evidence capture --source-usefulness");
    expect(sourceToDecision).toContain("Do not leave a course, paper, docs page, practitioner claim, or repo-local");

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
      "falsifier:",
      "source_usefulness_feedback:"
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

  it("keeps codex adapter planning tied to bounded proof-aware rendering", () => {
    const codexAdapterPlan = readFileSync(
      new URL("codex-adapter-plan/SKILL.md", skillsRoot),
      "utf8"
    );

    expect(codexAdapterPlan).toContain("bounded context");
    expect(codexAdapterPlan).toContain("non-goals");
    expect(codexAdapterPlan).toContain("proof boundaries");
    expect(codexAdapterPlan).toContain("non-mutating adapter behavior");
    expect(codexAdapterPlan).toContain("evidence contract");
    expect(codexAdapterPlan).toContain("Keep adapter output plain, inspectable, and non-mutating.");
    expect(codexAdapterPlan).toContain("Do not make Codex surfaces the product brain.");
  });

  it("keeps activation skill routed to owner-file read-model recall and abstention", () => {
    const activationEngine = readFileSync(
      new URL("activation-engine/SKILL.md", skillsRoot),
      "utf8"
    );

    expect(activationEngine).toContain("owner-file/read-model recall");
    expect(activationEngine).toContain("abstention");
    expect(activationEngine).toContain("## Owner-File Recall Gate");
    expect(activationEngine).toContain("Prefer explicit owner-file/read-model evidence");
    expect(activationEngine).toContain("missing-read-model or abstention");
    expect(activationEngine).toContain("not a broad activation scoring rewrite");
  });

  it("keeps brain store schema routed to DB boundary evidence and rollback risk", () => {
    const brainStoreSchema = readFileSync(
      new URL("brain-store-schema/SKILL.md", skillsRoot),
      "utf8"
    );

    expect(brainStoreSchema).toContain("unknown narrowing");
    expect(brainStoreSchema).toContain("migration evidence");
    expect(brainStoreSchema).toContain("rollback risk");
    expect(brainStoreSchema).toContain("use JSONB only for unstable metadata");
    expect(brainStoreSchema).toContain("narrow `unknown` before domain");
    expect(brainStoreSchema).toContain("Do not make markdown or `.krn` runtime truth.");
    expect(brainStoreSchema).toContain("Do not trust raw DB JSON as a domain object.");
    expect(brainStoreSchema).toContain("SQL inspection");
  });

  it("keeps target repo testing routed through mode, dirty state, write authority, and handoff", () => {
    const targetRepoTesting = readFileSync(
      new URL("target-repo-testing/SKILL.md", skillsRoot),
      "utf8"
    );

    expect(targetRepoTesting).toContain("explicit mode");
    expect(targetRepoTesting).toContain("dirty-state");
    expect(targetRepoTesting).toContain("write-authority");
    expect(targetRepoTesting).toContain("proof/non-proof");
    expect(targetRepoTesting).toContain("handoff boundaries");
    expect(targetRepoTesting).toContain("observation-only");
    expect(targetRepoTesting).toContain("headless-repair");
    expect(targetRepoTesting).toContain("real-second-operator");
    expect(targetRepoTesting).toContain("allowed_writes:");
    expect(targetRepoTesting).toContain("forbidden_writes:");
    expect(targetRepoTesting).toContain("target_patch_lifecycle:");
  });

  it("keeps TypeScript skill routed to unknown-first boundaries and no type weakening", () => {
    const typeSafety = readFileSync(
      new URL("typescript-type-safety/SKILL.md", skillsRoot),
      "utf8"
    );

    expect(typeSafety).toContain("unknown narrowing");
    expect(typeSafety).toContain("any usage");
    expect(typeSafety).toContain("fixes that might weaken type safety");
    expect(typeSafety).toContain("Keep external data as `unknown` until validated.");
    expect(typeSafety).toContain("Avoid `any`; isolate and justify it if unavoidable.");
    expect(typeSafety).toContain("Do not trust `JSON.parse`, `fetch().json()`, file reads, env vars, CLI args");
    expect(typeSafety).toContain("Do not introduce unreviewed `any`.");
    expect(typeSafety).toContain("Do not claim completion without typecheck");
  });
});
