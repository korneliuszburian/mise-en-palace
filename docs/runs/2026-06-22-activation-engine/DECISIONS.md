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

Slice 02 skill record:

- `superpowers:test-driven-development`: used for RED/GREEN compiler behavior
  covering search candidates and anti-memory conflict exclusions.
- `activation-engine`: used to keep search retrieval, anti-memory blocking,
  conflict decisions, context ROI, inclusions, exclusions, and abstention
  explicit.
- `brain-store-schema`: used for the project-level anti-memory repository read
  path and retrieval/context trace persistence.
- `typescript-type-safety`: used to preserve strict repository ports and avoid
  weakening no-store preview types.
- `superpowers:systematic-debugging`: used when full tests revealed the
  no-store preview `searchLexical` regression.

Slice 02 type-safety notes:

- Boundary classification: harness domain/runtime orchestration plus repository
  port extension.
- Validation/narrowing: no new external input boundary; repository data remains
  typed read models.
- Public type changes: `MemoryRepository.listAntiMemoryForProject` added.
- Type-safety exceptions: none; no `any` or double assertions.

Slice 03 skill record:

- `superpowers:test-driven-development`: used for RED/GREEN noisy fixture
  coverage before changing activation safety behavior.
- `activation-engine`: used to prove bounded inclusions, stale exclusion,
  anti-memory conflict exclusion, source safety, and budget behavior.
- `typescript-type-safety`: used for JSON fixture boundary narrowing and the
  source-candidate `hasMechanism` contract.

Slice 03 decisions:

- Source: `tests/fixtures/activation/noisy-brain-selection.json`.
  Mechanism: one noisy task includes memory, stale memory, source claims,
  search, anti-memory, and a small inclusion budget.
  KRN implication: activation can now prove it compresses context rather than
  merely retrieving nearby records.
  Decision: keep the noisy corpus as a JSON fixture under `tests/fixtures`
  and drive harness behavior through a focused test.
  Rejection/falsifier: if the fixture can pass without explicit exclusions or
  conflict flags, it is too weak for M25.
- Source: `packages/harness/src/activation/assembleContext.ts`.
  Mechanism: source claims require `doesNotProve`; Slice 03 adds explicit
  mechanism safety.
  KRN implication: decorative source claims without a source-to-mechanism link
  must not enter active context.
  Decision: source safety can override `over_budget` and `low_context_roi`, but
  must preserve stronger trust, temporal, and anti-memory unsafe exclusions.
  Rejection/falsifier: if low-trust or anti-memory exclusions are rewritten into
  generic source-safety reasons, the audit trail loses the real cause.

Slice 03 type-safety notes:

- Boundary classification: test JSON fixture plus harness-internal activation
  candidate contract.
- Validation/narrowing: `JSON.parse` is assigned to `unknown` and narrowed by a
  small fixture-shape assertion before use.
- Public type changes: `RankedActivationCandidate` now carries optional
  `hasMechanism` through `ActivationCandidate`.
- Type-safety exceptions: one narrowed test-fixture assertion remains after the
  runtime shape check; no `any` or double assertions were added.
