export type EvalProofBoundaryScope =
  | "local-static"
  | "ci-fast"
  | "ci-db"
  | "db-runtime"
  | "product-loop"
  | "handoff";

export interface EvalProofBoundaryEntry {
  id: string;
  command: string;
  scriptName?: string;
  owner: string;
  requiredFor: readonly EvalProofBoundaryScope[];
  proves: readonly string[];
  doesNotProve: readonly string[];
}

export const evalProofBoundaryManifest = [
  {
    id: "workspace-typecheck",
    command: "pnpm typecheck",
    scriptName: "typecheck",
    owner: "TypeScript package boundaries",
    requiredFor: ["local-static", "ci-fast", "handoff"],
    proves: [
      "workspace packages compile under their configured strict TypeScript settings",
      "public type contracts remain internally consistent"
    ],
    doesNotProve: [
      "runtime behavior is correct",
      "database migrations apply",
      "Codex follows rendered briefs",
      "KRN is product-ready"
    ]
  },
  {
    id: "workspace-tests",
    command: "pnpm test",
    scriptName: "test",
    owner: "deterministic package behavior",
    requiredFor: ["local-static", "ci-fast", "handoff"],
    proves: [
      "Vitest unit and deterministic harness tests pass",
      "registered golden and invariant fixtures still match expected behavior"
    ],
    doesNotProve: [
      "real model behavior is good",
      "live DB runtime truth exists unless DB smokes also ran",
      "all product workflows are useful",
      "KRN is product-ready"
    ]
  },
  {
    id: "fallow-changed-files",
    command: "pnpm quality:fallow:ci",
    scriptName: "quality:fallow:ci",
    owner: "changed-file quality audit",
    requiredFor: ["ci-fast", "handoff"],
    proves: [
      "Fallow found no configured issues in changed JS/TS files",
      "the changed-file quality gate is clean"
    ],
    doesNotProve: [
      "the whole repository has no dead code or duplication",
      "every Fallow finding would be semantically true",
      "architecture is minimal",
      "KRN is product-ready"
    ]
  },
  {
    id: "brain-battle-smoke",
    command: "pnpm eval:brain-battle:smoke",
    scriptName: "eval:brain-battle:smoke",
    owner: "deterministic KRN invariant matrix",
    requiredFor: ["ci-fast", "handoff"],
    proves: [
      "active plan, context hygiene, source-map, skill, pattern-chain, brain-battle, TypeScript-boundary, CLI run-readback, and Codex brief golden invariants pass",
      "implemented matrix rows keep proof/non-proof boundaries"
    ],
    doesNotProve: [
      "LLM outputs are correct",
      "source or memory quality is sufficient at scale",
      "DB runtime truth exists",
      "KRN is product-ready"
    ]
  },
  {
    id: "promptfoo-smoke",
    command: "pnpm eval:promptfoo:smoke",
    scriptName: "eval:promptfoo:smoke",
    owner: "Promptfoo adapter boundary",
    requiredFor: ["ci-fast"],
    proves: [
      "Promptfoo can run the local smoke fixture",
      "runner/config/provider/result mapping emits integration evidence"
    ],
    doesNotProve: [
      "KRN behavior passed",
      "Memory Core mutated correctly",
      "GoldenTask behavior proof exists",
      "KRN is product-ready"
    ]
  },
  {
    id: "db-readiness",
    command: "pnpm db:ready",
    scriptName: "db:ready",
    owner: "live Postgres/pgvector runtime readiness",
    requiredFor: ["ci-db", "db-runtime"],
    proves: [
      "the current DB connection can be reached",
      "required database runtime checks respond in the current environment"
    ],
    doesNotProve: [
      "schema migrations are current",
      "repositories preserve all invariants",
      "DB-backed product loops are useful",
      "KRN is product-ready"
    ]
  },
  {
    id: "drizzle-check",
    command: "pnpm --filter @krn/db db:check",
    scriptName: "db:check",
    owner: "Drizzle schema/migration consistency",
    requiredFor: ["ci-db", "db-runtime"],
    proves: [
      "Drizzle can validate the current schema/migration state",
      "schema metadata is consistent enough for migration tooling"
    ],
    doesNotProve: [
      "live repositories behave correctly",
      "data already in a deployed DB satisfies new invariants",
      "DB smokes passed",
      "KRN is product-ready"
    ]
  },
  {
    id: "db-persistence-smoke",
    command: "pnpm db:smoke",
    scriptName: "db:smoke",
    owner: "baseline DB persistence smoke",
    requiredFor: ["ci-db", "db-runtime", "handoff"],
    proves: [
      "the baseline DB persistence smoke can create, read back, and clean marker rows",
      "current-shell DB runtime truth exists for the baseline persistence path"
    ],
    doesNotProve: [
      "all DB smoke targets passed",
      "Memory Core governance is sufficient",
      "activation or source ranking quality is good",
      "KRN is product-ready"
    ]
  },
  {
    id: "brain-loop-db-smoke",
    command: "pnpm db:smoke:brain-loop",
    scriptName: "db:smoke:brain-loop",
    owner: "DB-backed product-loop proof",
    requiredFor: ["product-loop", "db-runtime", "handoff"],
    proves: [
      "live DB evidence/review/feedback/SourceDecision/MemoryReviewGate/memory/activation readback works for the bounded brain-loop scenario",
      "marker cleanup completed for that scenario"
    ],
    doesNotProve: [
      "activation ranking quality is good",
      "worker runtime execution exists",
      "autonomous reflection quality is good",
      "KRN is product-ready"
    ]
  },
  {
    id: "alpha-verify-fast",
    command: "pnpm alpha:verify",
    scriptName: "alpha:verify",
    owner: "local fast alpha check",
    requiredFor: ["local-static"],
    proves: [
      "workspace typecheck, workspace tests, and krn doctor completed for the current shell"
    ],
    doesNotProve: [
      "Fallow changed-file audit passed",
      "Promptfoo smoke passed",
      "brain-battle smoke passed",
      "DB runtime truth exists",
      "KRN is product-ready"
    ]
  },
  {
    id: "alpha-verify-full",
    command: "pnpm alpha:verify:full",
    scriptName: "alpha:verify:full",
    owner: "local full alpha verification gate",
    requiredFor: ["db-runtime", "product-loop", "handoff"],
    proves: [
      "workspace typecheck, workspace tests, krn doctor, Fallow changed-file audit, brain-battle smoke, Promptfoo smoke, DB readiness, Drizzle check, baseline DB smoke, DB brain-loop smoke, and diff check completed in the current shell",
      "the local full gate aggregated the current deterministic static, eval-adapter, DB-runtime, and product-loop smoke boundaries"
    ],
    doesNotProve: [
      "worker runtime execution exists",
      "all DB smoke targets passed",
      "real LLM behavior is good",
      "KRN is product-ready"
    ]
  },
  {
    id: "diff-whitespace-check",
    command: "git diff --check",
    owner: "git diff hygiene",
    requiredFor: ["ci-fast", "ci-db", "handoff"],
    proves: [
      "the current diff has no git-detected whitespace errors"
    ],
    doesNotProve: [
      "code is correct",
      "formatting is globally consistent",
      "quality gates passed",
      "KRN is product-ready"
    ]
  }
] as const satisfies readonly EvalProofBoundaryEntry[];

export const renderEvalProofBoundaryReadback = (
  entries: readonly EvalProofBoundaryEntry[] = evalProofBoundaryManifest
): string => {
  const lines = [
    "# Evaluation Proof Boundary Manifest",
    "",
    "| Gate | Command | Required For | Proves | Does Not Prove |",
    "| --- | --- | --- | --- | --- |"
  ];

  for (const entry of entries) {
    lines.push(
      `| ${entry.id} | \`${entry.command}\` | ${entry.requiredFor.join(", ")} | ${entry.proves.join("; ")} | ${entry.doesNotProve.join("; ")} |`
    );
  }

  return `${lines.join("\n")}\n`;
};
