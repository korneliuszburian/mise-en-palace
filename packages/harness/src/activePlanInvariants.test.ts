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

const latestOutcomeBody = (body: string): string => {
  const finalResponseStart = body.indexOf("\n## 21. Final Response Format For Codex Runs");
  const searchable = finalResponseStart === -1 ? body : body.slice(0, finalResponseStart);
  const lastOutcomeStart = searchable.lastIndexOf("\n## Outcome ");

  if (lastOutcomeStart === -1) {
    throw new Error("Could not find latest PLANS outcome");
  }

  return searchable.slice(lastOutcomeStart);
};

const expectFieldLines = (body: string, fields: string[]): void => {
  for (const field of fields) {
    expect(body).toMatch(new RegExp(`^${escapeRegExp(field)}:?`, "mu"));
  }
};

const sourceClassVocabulary = [
  "official docs",
  "papers",
  "high-quality public course page",
  "practitioner writing",
  "competitor docs",
  "repo-local evidence",
  "target-repo evidence",
  "user-provided research"
] as const;

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
    expect(compactGoalContract).toContain("read them as historical evidence");
    expect(compactGoalContract).toContain("do not roll the active stream backward");
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

  it("keeps stale pasted objectives subordinate to root active state", () => {
    const goal = readRootFile("GOAL.md");
    const plan = readRootFile("PLAN.md");
    const plans = readRootFile("PLANS.md");
    const planCurrentTask = requiredLine(plan, /^current task: (.+)$/mu, "PLAN current task");
    const normalizedPlans = plans.replace(/\s+/gu, " ");

    expect(goal).toContain("If a pasted objective, attachment, old prompt, or conversation summary");
    expect(goal).toContain("read it as historical evidence");
    expect(goal).toContain("Do not roll the active stream backward");
    expect(goal).toContain(planCurrentTask);
    expect(plans).toContain("stale attachment objective guard");
    expect(normalizedPlans).toContain("attachments are evidence, not authority to roll the active stream backward");
  });

  it("keeps pattern intake decision-oriented, reviewable, and legally bounded", () => {
    const runbook = readRootFile("docs/runbooks/pattern-intake.md");
    const outputTemplate = sectionBody(runbook, "## Output Template");
    const rejectionReasons = sectionBody(runbook, "## Rejection Reasons");

    expect(runbook).toContain("Do not copy paid or proprietary course material into KRN.");
    expect(runbook).toContain("Forbidden:");
    expect(runbook).toContain("transcripts of paid course lessons");
    expect(runbook).toContain("source dumps");
    expect(runbook).toContain("scraped course modules");
    expect(runbook).toContain("retaining a source with no consumer");
    expect(runbook).toContain("source -> mechanism -> KRN implication -> decision/rejection -> consumer -> falsifier");
    expect(runbook).toContain("Surface Consumer Matrix");

    expectFieldLines(outputTemplate, [
      "source_id",
      "title",
      "url_or_ref",
      "trust_tier",
      "source_class",
      "mechanism",
      "krn_implication",
      "decision_kind",
      "decision",
      "consumer",
      "falsifier",
      "does_not_prove",
      "candidate_output",
      "next_action"
    ]);
    expect(outputTemplate).toContain("decision_kind: adopt | reject | lab_test | defer");
    expect(outputTemplate).toContain(
      "reviewability: ready | needs_more_evidence | too_vague | duplicate | not_useful | unknown"
    );
    expect(outputTemplate).toContain("type: MemoryCandidate | SourceDecision | EvalCandidate | SkillCandidate | none");

    expect(rejectionReasons).toContain("decorative:");
    expect(rejectionReasons).toContain("no_consumer:");
    expect(rejectionReasons).toContain("no_falsifier:");
    expect(rejectionReasons).toContain("copyright_or_access:");
    expect(rejectionReasons).toContain("stale_or_conflicting:");
    expect(rejectionReasons).toContain("too_broad:");
  });

  it("keeps source-class vocabulary aligned across intake, skills, and source guidance", () => {
    const runbook = readRootFile("docs/runbooks/pattern-intake.md");
    const sourceSkill = readRootFile(".agents/skills/source-to-decision/SKILL.md");
    const sourceMapInvariant = readRootFile("packages/harness/src/sourceMapInvariants.test.ts");
    const sourceMap = readRootFile("docs/KRN_SOURCES.md");
    const expectedInline = sourceClassVocabulary.join(" | ");

    expect(sourceSkill).toContain(`source_class: ${expectedInline}`);
    expect(runbook).toContain("source_class:");
    expect(sourceMapInvariant).toContain(sourceClassVocabulary.join("|"));

    for (const sourceClass of sourceClassVocabulary) {
      expect(runbook).toContain(sourceClass);
      expect(sourceSkill).toContain(sourceClass);
      expect(sourceMapInvariant).toContain(sourceClass);
    }

    expect(sourceMap).toContain("- Source class: official docs.");
    expect(sourceMap).toContain("- Source class: high-quality public course page.");
    expect(sourceMap).toContain("- Source class: practitioner writing.");
  });

  it("keeps future task contracts explicit enough for Codex continuation", () => {
    const plans = readRootFile("PLANS.md");
    const taskContract = sectionBody(plans, "## 9. Task Contract Schema");
    const backlog = sectionBody(plans, "## 13. Generated Task Backlog");
    const requiredFields = [
      "ID",
      "Name",
      "Status",
      "Goal",
      "Product rationale",
      "Architectural rationale",
      "Evidence source",
      "Official/external sources",
      "Inputs required",
      "Files likely touched",
      "Allowed writes",
      "Forbidden writes",
      "Output requirements",
      "Definition of Done",
      "Verification commands",
      "Acceptance criteria",
      "Risk",
      "Rollback",
      "Condensation expectation",
      "Next-task synthesis rule"
    ];

    expect(taskContract).toContain("Every new task appended to `Active Task Queue` or `Generated Task Backlog` must use this schema.");
    expect(taskContract).toContain("If a task cannot satisfy the schema, it is not ready for execution.");
    expectFieldLines(taskContract, requiredFields);
    expect(backlog).toContain("Template:");
    expect(backlog).toMatch(/^### <ID> — <Name>$/mu);
    expectFieldLines(backlog, [
      ...requiredFields.filter((field) => field !== "ID" && field !== "Name"),
      "Pattern surface",
      "Primary consumer",
      "Does not prove",
      "Falsifier"
    ]);
  });

  it("keeps the final response contract proof-oriented", () => {
    const plans = readRootFile("PLANS.md");
    const finalResponse = sectionBody(plans, "## 21. Final Response Format For Codex Runs");

    expect(finalResponse).toContain("Every continuation or completed slice must end with:");
    expect(finalResponse).toContain("DB used:");
    expect(finalResponse).toContain("Commands run:");
    expect(finalResponse).toContain("Reports/artifacts:");
    expect(finalResponse).toContain("Commits/CI:");
    expect(finalResponse).toContain("What this proves:");
    expect(finalResponse).toContain("What this does not prove:");
    expect(finalResponse).toContain("Condensation decisions:");
    expect(finalResponse).toContain("Tasks appended to PLANS.md:");
    expect(finalResponse).toContain("Next active task:");
    expect(finalResponse).toContain("Blocked/budget-limited:");
  });

  it("keeps local TMPDIR verification guidance outside the repo workspace", () => {
    const plan = readRootFile("PLAN.md");
    const verificationPolicy = sectionBody(plan, "## Verification Policy");
    const normalizedVerificationPolicy = verificationPolicy.replace(/\s+/gu, " ");

    expect(verificationPolicy).toContain("temporary-directory write error");
    expect(verificationPolicy).toContain("TMPDIR=/home/krn/.cache/krn-tmp pnpm test");
    expect(verificationPolicy).toContain("Do not set `TMPDIR` under the repo checkout");
    expect(normalizedVerificationPolicy).toContain(
      "CLI boundary tests rely on outside-workspace temporary directories"
    );
  });

  it("keeps the latest PLANS outcome tied to a reviewable source-to-decision record", () => {
    const plans = readRootFile("PLANS.md");
    const latestOutcome = latestOutcomeBody(plans);

    expect(latestOutcome).toContain("Source-to-decision:");
    expect(latestOutcome).toContain("- Source:");
    expect(latestOutcome).toContain("- Mechanism:");
    expect(latestOutcome).toContain("- KRN implication:");
    expect(latestOutcome).toContain("- Decision:");
    expect(latestOutcome).toContain("- Does not prove:");
    expect(latestOutcome).toContain("- Consumer:");
    expect(latestOutcome).toContain("- Falsifier:");
  });
});
