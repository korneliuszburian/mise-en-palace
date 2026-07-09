export const evalProofBoundaryManifest = [
  {
    id: "workspace-typecheck",
    command: "pnpm typecheck",
    scriptName: "typecheck",
    owner: "TypeScript package boundaries",
    tier: "required",
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
    tier: "required",
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
    tier: "required",
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
    id: "krn-smoke",
    command: "pnpm eval:krn:smoke",
    scriptName: "eval:krn:smoke",
    owner: "deterministic KRN behavior and docs guard matrix",
    tier: "required",
    requiredFor: ["ci-fast", "handoff"],
    proves: [
      "behavior smoke and docs lint guards pass for active plan, context hygiene, source-map, skills, behavior-gate matrix, TypeScript-boundary, CLI run-readback, and Codex brief golden invariants",
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
    id: "db-readiness",
    command: "pnpm db:ready",
    scriptName: "db:ready",
    owner: "live Postgres/pgvector runtime readiness",
    tier: "db",
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
    tier: "db",
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
    tier: "db",
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
    id: "memory-loop-db-smoke",
    command: "pnpm db:smoke:memory-loop",
    scriptName: "db:smoke:memory-loop",
    owner: "DB-backed product-loop proof",
    tier: "db",
    requiredFor: ["product-loop", "db-runtime", "handoff"],
    proves: [
      "live DB evidence/review/feedback/SourceDecision/MemoryReviewGate/memory/activation/Codex-brief readback works for the bounded memory-loop scenario",
      "feedback can change later activation by including helped memory and excluding hurt memory in persisted next-run decisions",
      "marker cleanup completed for that scenario"
    ],
    doesNotProve: [
      "activation ranking quality is good",
      "maintenance runtime execution exists",
      "autonomous reflection quality is good",
      "KRN is product-ready"
    ]
  },
  {
    id: "real-recall-advantage-eval",
    command: "pnpm eval:real-recall",
    scriptName: "eval:real-recall",
    owner: "DB-backed decision-linked recall falsifier",
    tier: "db",
    requiredFor: ["product-loop", "db-runtime", "handoff"],
    proves: [
      "live DB source recall can seed lexical distractors and decision-linked governing claims in the current shell",
      "every predeclared real-recall case makes baseline lexical recall pick the distractor and grounded recall pick the governing claim",
      "marker cleanup completed for the real-recall scenario"
    ],
    doesNotProve: [
      "general source ranking quality is good",
      "raw recall beats a comprehensive notes dump",
      "live Codex behavior is good",
      "KRN is product-ready"
    ]
  },
  {
    id: "decision-packet-engine-eval",
    command: "pnpm eval:decision-packet",
    scriptName: "eval:decision-packet",
    owner: "deterministic decision-packet fixture engine",
    tier: "required",
    requiredFor: ["local-static", "product-loop", "handoff"],
    proves: [
      "predeclared decision-packet cases run through the real activation/filtering/assembly/brief engine path",
      "the fixture packets include governing decisions, SourceDecisionEdge refs, rejected-path readback, falsifiers, and non-proof boundaries",
      "the fixture corpus satisfies the configured useful-rate, noise, and stale-authority thresholds"
    ],
    doesNotProve: [
      "live Codex execution or obedience",
      "source truth",
      "broad arbitrary-repo packet quality",
      "KRN is product-ready"
    ]
  },
  {
    id: "recorded-codex-decision-packet-obedience-eval",
    command: "pnpm eval:codex-decision-packet-obedience",
    scriptName: "eval:codex-decision-packet-obedience",
    owner: "recorded Codex output evidence-shape comparator",
    tier: "required",
    requiredFor: ["local-static", "handoff"],
    proves: [
      "recorded Codex output fixtures preserve the expected governing decision, stale boundary, rejected path, and non-proof signals",
      "recorded output evidence has the expected public evidence shape",
      "the paired decision-packet fixture still passes before recorded-output comparison"
    ],
    doesNotProve: [
      "Codex will obey future briefs",
      "the recorded output was generated in the current shell",
      "the implementation was correct",
      "KRN is product-ready"
    ]
  },
  {
    id: "recorded-codex-live-pilot-eval",
    command: "pnpm eval:codex-decision-packet-obedience:live-pilot",
    scriptName: "eval:codex-decision-packet-obedience:live-pilot",
    owner: "recorded live-pilot Codex output comparator",
    tier: "live_manual",
    requiredFor: ["local-static"],
    proves: [
      "the recorded live-pilot fixture still satisfies the Codex decision-packet obedience evidence-shape comparator",
      "the paired decision-packet fixture still passes before recorded live-pilot comparison"
    ],
    doesNotProve: [
      "a live Codex call ran in the current shell",
      "future Codex output will obey KRN briefs",
      "the live-pilot sample generalizes",
      "KRN is product-ready"
    ]
  },
  {
    id: "second-repo-decision-packet-eval",
    command: "pnpm eval:second-repo-decision-packet",
    scriptName: "eval:second-repo-decision-packet",
    owner: "deterministic target-repo decision-packet fixtures",
    tier: "required",
    requiredFor: ["local-static", "product-loop", "handoff"],
    proves: [
      "target-repo fixture corpora pass the decision-packet eval path",
      "each target corpus includes repo-specific governing decisions, reusable KRN knowledge, stale decisions, and rejected-path readback",
      "the target corpora avoid self-repo KRN plan/architecture evidence references"
    ],
    doesNotProve: [
      "arbitrary repository portability",
      "live target-repo execution",
      "commercial validation",
      "KRN is product-ready"
    ]
  },
  {
    id: "decision-corpus-import-eval",
    command: "pnpm eval:decision-corpus-import",
    scriptName: "eval:decision-corpus-import",
    owner: "source-to-decision corpus import fixture",
    tier: "required",
    requiredFor: ["local-static", "handoff"],
    proves: [
      "compact source-to-decision import rows convert into decision-packet corpus rows",
      "the importer rejects duplicate ids and collisions with the base corpus before merge",
      "imported current, stale, and rejected decision links keep the merged decision-packet eval passing"
    ],
    doesNotProve: [
      "DB ingestion",
      "source truth",
      "automatic source promotion",
      "KRN is product-ready"
    ]
  },
  {
    id: "corpus-closure-eval",
    command: "pnpm eval:corpus-closure",
    scriptName: "eval:corpus-closure",
    owner: "DB-backed source decision closure smoke",
    tier: "db",
    requiredFor: ["db-runtime", "product-loop"],
    proves: [
      "the current dogfood DB corpus has accepted SourceClaims and no pending unadopted SourceClaims in source-decision gaps readback",
      "the current dogfood DB corpus has no accepted SourceClaims missing SourceDecisionEdge readback",
      "canonical source-search queries surface at least one SourceDecisionEdge-linked supporting claim in the top 3"
    ],
    doesNotProve: [
      "source truth",
      "broad arbitrary-repo retrieval quality",
      "Codex obedience",
      "KRN is product-ready"
    ]
  },
  {
    id: "decision-packet-determinism-eval",
    command: "pnpm eval:determinism",
    scriptName: "eval:determinism",
    owner: "decision-packet family deterministic regression check",
    tier: "required",
    requiredFor: ["local-static", "handoff"],
    proves: [
      "decision-packet, target-repo decision-packet, and recorded Codex obedience fixtures are bit-identical across consecutive runs",
      "the decision-packet family evals are stable enough to serve as deterministic regression gates"
    ],
    doesNotProve: [
      "production retrieval quality",
      "source truth",
      "LLM output quality",
      "KRN is product-ready"
    ]
  },
  {
    id: "alpha-verify-fast",
    command: "pnpm alpha:verify",
    scriptName: "alpha:verify",
    owner: "local fast alpha check",
    tier: "required",
    requiredFor: ["local-static"],
    proves: [
      "workspace typecheck, workspace tests, and krn doctor completed for the current shell"
    ],
    doesNotProve: [
      "Fallow changed-file audit passed",
      "KRN behavior/docs smoke passed",
      "DB runtime truth exists",
      "KRN is product-ready"
    ]
  },
  {
    id: "alpha-verify-full",
    command: "pnpm alpha:verify:full",
    scriptName: "alpha:verify:full",
    owner: "local full alpha verification gate",
    tier: "db",
    requiredFor: ["db-runtime", "product-loop", "handoff"],
    proves: [
      "workspace typecheck, workspace tests, krn doctor, Fallow changed-file audit, KRN behavior/docs smoke, DB readiness, Drizzle check, baseline DB smoke, DB memory-loop smoke, and diff check completed in the current shell",
      "the local full gate aggregated the current deterministic static, eval-adapter, DB-runtime, and product-loop smoke boundaries"
    ],
    doesNotProve: [
      "maintenance runtime execution exists",
      "all DB smoke targets passed",
      "real LLM behavior is good",
      "KRN is product-ready"
    ]
  },
  {
    id: "diff-whitespace-check",
    command: "git diff --check",
    owner: "git diff hygiene",
    tier: "required",
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
] as const satisfies readonly {
  id: string;
  command: string;
  scriptName?: string;
  owner: string;
  tier: "required" | "db" | "live_manual";
  requiredFor: readonly (
    | "local-static"
    | "ci-fast"
    | "ci-db"
    | "db-runtime"
    | "product-loop"
    | "handoff"
  )[];
  proves: readonly string[];
  doesNotProve: readonly string[];
}[];
