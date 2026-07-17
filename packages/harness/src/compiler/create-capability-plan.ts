import type {
  CapabilityPlan,
  CapabilityRequirement,
  HarnessPlan,
  TaskContract
} from "@krn/core";
import {
  capabilityPlanToolBoundaries
} from "@krn/core";

export interface CreateCapabilityPlanInput {
  harnessPlan: HarnessPlan;
  taskContract?: Pick<TaskContract, "title" | "objective" | "constraints" | "nonGoals" | "acceptance">;
  hasContext: boolean;
  createdAt: string;
  createId(prefix: string): string;
}

const requirement = (
  input: Omit<CapabilityRequirement, "priority">
): CapabilityRequirement => ({
  ...input,
  priority: "required"
});

const textTerms = (
  taskContract: CreateCapabilityPlanInput["taskContract"]
): Set<string> => {
  if (taskContract === undefined) {
    return new Set();
  }

  return new Set(
    [
      taskContract.title,
      taskContract.objective,
      ...taskContract.constraints,
      ...taskContract.nonGoals,
      ...taskContract.acceptance
    ]
      .join(" ")
      .toLowerCase()
      .split(/[^a-z0-9]+/u)
      .filter((term) => term.length >= 3)
  );
};

const hasAnyTerm = (terms: ReadonlySet<string>, candidates: readonly string[]): boolean =>
  candidates.some((candidate) => terms.has(candidate));

const pushRequirement = (
  requirements: CapabilityRequirement[],
  next: Omit<CapabilityRequirement, "priority">
): void => {
  if (requirements.some((item) => item.kind === next.kind)) {
    return;
  }

  requirements.push(requirement(next));
};

const replaceRequirement = (
  requirements: CapabilityRequirement[],
  next: Omit<CapabilityRequirement, "priority">
): void => {
  const index = requirements.findIndex((item) => item.kind === next.kind);
  const updated = requirement(next);

  if (index === -1) {
    requirements.push(updated);
    return;
  }

  requirements[index] = updated;
};

export const createCapabilityPlan = (input: CreateCapabilityPlanInput): CapabilityPlan => {
  const requirements: CapabilityRequirement[] = [
    requirement({
      kind: "source_grounding",
      reason: "Compiled work must use selected source and memory context, or record abstention.",
      requiredEvidence: ["context inclusions", "context exclusions"]
    }),
    requirement({
      kind: "type_safety",
      reason: "KRN TypeScript boundaries stay strict across core, schema, harness, and adapters.",
      requiredEvidence: ["pnpm typecheck"]
    }),
    requirement({
      kind: "test_boundary",
      reason: "Compiler output must remain protected by behavior tests.",
      requiredEvidence: ["pnpm test"]
    }),
    requirement({
      kind: "evidence_capture",
      reason: "Execution should be reviewable through explicit commands and diff-risk evidence.",
      requiredEvidence: ["git diff --check", "changed files summary"]
    }),
    requirement({
      kind: "review_capture",
      reason: "Feedback must become candidates, not automatic memory mutation.",
      requiredEvidence: ["review assessment", "feedback delta candidates"]
    })
  ];

  if (!input.hasContext) {
    pushRequirement(requirements, {
      kind: "context_abstention",
      reason: "Weak context requires an abstention path instead of broad rereads.",
      requiredEvidence: ["context abstention", "context exclusions"]
    });
  }

  const terms = textTerms(input.taskContract);
  if (
    hasAnyTerm(terms, [
      "typescript",
      "typecheck",
      "strict",
      "unknown",
      "json",
      "parse",
      "zod",
      "schema",
      "boundary",
      "boundaries",
      "cast",
      "casts"
    ])
  ) {
    replaceRequirement(requirements, {
      kind: "type_safety",
      reason: "TypeScript boundary work must preserve unknown-first parsing, strict types, and no type weakening.",
      requiredEvidence: ["pnpm typecheck", "unknown-first boundary check", "no type weakening"]
    });
  }

  if (
    hasAnyTerm(terms, [
      "review",
      "risk",
      "risky",
      "diff",
      "burden",
      "rollback",
      "audit"
    ])
  ) {
    replaceRequirement(requirements, {
      kind: "evidence_capture",
      reason: "Review-risk work must leave changed-file and diff evidence for a reviewer.",
      requiredEvidence: ["git diff --check", "changed files summary", "diff risk summary"]
    });
    replaceRequirement(requirements, {
      kind: "review_capture",
      reason: "Review-risk work must record review burden and residual risk instead of hiding it in prose.",
      requiredEvidence: ["review assessment", "review-risk notes", "diff risk summary"]
    });
  }

  if (
    hasAnyTerm(terms, [
      "memory",
      "memories",
      "schema",
      "drizzle",
      "postgres",
      "repository",
      "repositories",
      "migration",
      "migrations",
      "core"
    ])
  ) {
    pushRequirement(requirements, {
      kind: "schema_design",
      reason: "Memory/schema tasks must preserve typed domain and IO boundaries before persistence shape changes.",
      requiredEvidence: ["schema/domain tests", "typecheck"]
    });
    pushRequirement(requirements, {
      kind: "db_migration",
      reason: "Memory/schema tasks that touch persistence require brain-store migration readiness evidence.",
      requiredEvidence: ["pnpm db:migrate && pnpm db:ready", "relevant DB smoke"]
    });
  }

  return {
    id: input.createId("capability-plan"),
    harnessPlanId: input.harnessPlan.id,
    requirements,
    toolBoundaries: [...capabilityPlanToolBoundaries],
    metadata: {
      harnessPlanStatus: input.harnessPlan.status
    },
    createdAt: input.createdAt
  };
};
