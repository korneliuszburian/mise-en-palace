# Decisions

- Treat `GOAL.md` M25 as the active execution contract.
- Use `docs/runs/2026-06-22-activation-engine/` as the compact M25 run ledger.
  It is audit/handoff material only, not runtime memory.
- Source: `docs/KRN_KERNEL.md`.
  Mechanism: KRN must select, apply, verify, and forget bounded context.
  KRN implication: M25 must improve activation quality and auditability, not
  add more context surfaces.
  Decision: extend the existing deterministic activation path; do not build a
  broad retrieval dump, dashboard, API, source crawler, LLM ranker, or worker
  runtime.
  Rejection/falsifier: if M25 output grows context without explicit exclusions
  and trace records, the milestone is incomplete.
- Source: `packages/harness/src/activation/*`.
  Mechanism: deterministic query building, trust/temporal/context-ROI filters,
  source safety, and bounded assembly already exist.
  KRN implication: replacing the activation engine would increase churn without
  improving the final spine.
  Decision: keep the existing harness activation modules as the v1 seed and
  tighten contracts/tests around them.
  Rejection/falsifier: if noisy fixture cannot be satisfied by extending these
  modules, revisit the shape before adding ad hoc policy elsewhere.
- Source: `packages/harness/src/compiler/compileHarnessPlan.ts`.
  Mechanism: persisted plan compilation already starts a retrieval run,
  retrieves source/memory candidates, persists candidates, activation decisions,
  context selection, and completes the retrieval run.
  KRN implication: M25.05 should extend this compiler path rather than create a
  parallel activation command.
  Decision: wire search candidates, anti-memory, conflict handling, and richer
  output through `compileHarnessPlan`.
  Rejection/falsifier: if `krn plan --persist` does not persist inclusions and
  exclusions through this path, M25 is incomplete.
- Source: `packages/db/src/schema/retrieval.ts`.
  Mechanism: `retrieval_runs`, `retrieval_candidates`,
  `activation_decisions`, `context_items`, and `context_exclusions` already
  persist the source/memory/search activation trail.
  KRN implication: M25 does not need a new general activation trace table before
  proving the v1 path.
  Decision: use retrieval and context tables as the primary M25 activation
  trace persistence; keep `memory_activation_traces` as memory-specific legacy
  surface for now.
  Rejection/falsifier: if M25 needs trace state that cannot be represented for
  source/search candidates, add schema deliberately in a later slice.
- Source: `packages/core/src/contextAssembly.ts`.
  Mechanism: core already owns `ContextAssembly`, `ContextInclusion`, and
  `ContextExclusion` as adapter-independent output shapes.
  KRN implication: M25.01 can add stable activation domain contracts without
  adding DB, CLI, Codex skill IDs, or `requiredSkills` into core.
  Decision: keep core pure; put runtime orchestration in harness.
  Rejection/falsifier: any M25 contract that imports DB/CLI/Codex adapter code
  into core violates the boundary.
- Source: runtime probe of `krn plan --task "improve KRN doctor source graph
  readiness" --persist`.
  Mechanism: current DB-backed plan included three source/memory items and
  persisted three retrieval candidates plus three activation decisions, but
  zero exclusions.
  KRN implication: the current path is useful but not yet M25-complete because
  it does not prove noisy corpus compression or explicit rejection in live DB
  data.
  Decision: M25.03/M25.04 must create noisy fixtures/smoke that force explicit
  exclusions.
  Rejection/falsifier: if activation smoke can pass with zero exclusions, it is
  too weak.

Slice 00 skill record:

- `activation-engine`: used to inventory query, ranking, filter, context ROI,
  inclusion, exclusion, and abstention behavior.
- `brain-store-schema`: used to map activation trace persistence to existing
  Postgres retrieval/context tables.
- `typescript-type-safety`: used to classify current activation contracts and
  the core-vs-harness boundary for upcoming TS changes.
- `source-to-decision`: used to convert local code evidence into decisions and
  falsifiers.

Slice 01 skill record:

- `superpowers:test-driven-development`: used for RED/GREEN activation domain
  contract coverage before production code.
- `typescript-type-safety`: used to keep activation contracts in core pure and
  exported without weakening strictness or adding `any`.
- `activation-engine`: used to keep the vocabulary aligned with candidate
  kinds, decisions, exclusions, abstention, conflict, and context budget.

Slice 01 type-safety notes:

- Boundary classification: public core domain API consumed by harness.
- Validation/narrowing: no external input parsing added in this slice; runtime
  parsing remains later schema/CLI work.
- Public type changes: `@krn/core` now exports activation contracts and
  vocabulary constants.
- Type-safety exceptions: none; no `any`, no double assertions, no DB/CLI/Codex
  imports into core, and no `requiredSkills` field.
