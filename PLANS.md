# KRN Continuous Brain Growth Active Ledger

Status: compact active ledger. Date: 2026-06-28.

Root `PLAN.md` is the compact product single source of truth. Root `GOAL.md`
states the active objective. This file carries the current execution queue,
evidence pointers, and compact decision state.

Full historical ledger before V255 is archived at:

```txt
docs/plans/historical-ledgers/2026-06-28-root-plans-before-v255-active-ledger-condensation.md
```

Do not recreate an append-only wall of text here. Reports, ADRs, skills,
source decisions, tests, and commits hold detailed evidence. This file routes
the next work.

## Current State

```txt
controlled-internal-alpha for technical operators: yes / stronger
product-ready: no
widened internal alpha: no
V02-01 real second-operator proof: blocked/deferred
active stream: V284 Brain Knowledge Static Preview Field Filters
current task: V284-00 Brain Knowledge Static Preview Field Filters
latest pushed commit before V283: 5d6f99c chore(ui): add brain knowledge static preview script
latest CI checked before V283: KRN CI success for 5d6f99c6ce5af4fa9f1fe33c812caa8ef8e6a222
```

Known current gap:

```txt
V284-00 Brain Knowledge Static Preview Field Filters is the current gap. V283
proved the static preview/readback path can answer exact retained-pattern
queries, but broad terms such as `skill` are noisy because text search matches
all card fields equally. Improve static field/facet filtering before any wider
UI/search surface.
```

## 2. Product Thesis

KRN is a Codex Operating Layer / AI Engineering Control Plane.

Codex executes. KRN supplies bounded context, store-backed memory, source
grounding, policy, skills, eval expectations, traces, review gates, and
feedback.

Current loop:

```txt
controlled scenario
  -> evidence
  -> finding
  -> condensation decision
  -> rule / skill / guard / eval / memory candidate / source decision / repair
  -> append next bounded task here
  -> continue
```

The near-term goal is not another roadmap. It is the shortest path to a useful
pattern brain:

```txt
replayable target scenarios
  -> pattern intake
  -> pattern enforcement
  -> Codex skills
  -> evidence/readback
  -> UI/search read model
```

## Current Brain Readiness

```txt
repo/current-truth hygiene: strong
evidence/review loop: strong
DB-backed replay: proven
candidate reviewability: core primitive
activation: useful for guardrails, still weak for owner-file recall in some runs
reflection/candidate usefulness: partially proven, not product-grade
pattern brain: partial; gate/skills/standards exist, continuous intake/enforce/eval loop still incomplete
UI/search over brain knowledge: CLI read-only preview exists; web/API/MCP not started
```

Important distinction:

```txt
pattern gate exists != full pattern brain exists
source decision exists != continuous research condensation exists
skill exists != all Codex work is skill-routed
green test != product value
```

## Recent Evidence Ledger

### V250 Product Readiness Re-Gate

- Commit: `029b1c3 docs(review): regate product readiness after activation guards`
- Report:
  `docs/reviews/controlled-dogfood/2026-06-28-v250-product-readiness-regate-after-activation-guards/REPORT.md`
- Outcome: controlled-internal-alpha yes/stronger; product-ready no.

### V251 Fresh Target Trial Gate

- Commit: `9fb4ca2 docs(review): gate target trials on normalized substrate`
- Report:
  `docs/reviews/controlled-dogfood/2026-06-28-v251-fresh-target-trial-gate-after-activation-guards/REPORT.md`
- Outcome: rejected random living `active/` repo as first post-activation target
  proof; normalized target substrate became next best proof surface.

### V252 Normalized Target Substrate

- Commit: `e692cd2 test(target): add normalized weak TypeScript substrate`
- Report:
  `docs/reviews/controlled-dogfood/2026-06-28-v252-normalized-target-trial-substrate/REPORT.md`
- Outcome: added KRN-owned weak TypeScript fixture under
  `tests/fixtures/target-repos/normalized-weak-typescript/`.

### V253 Normalized Target Repair

- Commit: `d4e0aea test(target): repair normalized TypeScript boundary`
- Report:
  `docs/reviews/controlled-dogfood/2026-06-28-v253-normalized-target-repair-trial/REPORT.md`
- Outcome: repaired unknown-first JSON/config/user input boundary with focused
  runtime tests and no unrelated target cleanup.

### V254 Replayable Target Substrate

- Commit: `b2ccbaf test(target): make normalized substrate replayable`
- Report:
  `docs/reviews/controlled-dogfood/2026-06-28-v254-replayable-target-substrate-baseline/REPORT.md`
- Outcome: added scenario materializer and weak baseline overlay:
  `tests/fixtures/target-repos/normalized-weak-typescript/scripts/materialize-scenario.mjs`
  and `scenarios/weak-json-boundary/`.
- CI: `KRN CI` success for
  `b2ccbaf279409f24b01d150dcbecb0f92324b048`.

### V255 Active Ledger Condensation

- Status: complete.
- Goal: archive historical detail and keep this file small enough for reliable
  Codex resume.
- Report:
  `docs/reviews/controlled-dogfood/2026-06-28-v255-active-ledger-condensation/REPORT.md`.

### V256 Replayable Target Repair Trial

- Status: complete.
- Report:
  `docs/reviews/controlled-dogfood/2026-06-28-v256-replayable-target-repair-trial/REPORT.md`.
- Outcome: materialized the weak JSON boundary target into `.local-lab`,
  repaired it with unknown-first JSON and discriminated result states, and
  recorded that `krn init` surfaced target owner files while `krn plan` still
  selected unrelated context without connected target read-model context.

### V257 Pattern Intake Trial

- Status: complete.
- Report:
  `docs/reviews/controlled-dogfood/2026-06-28-v257-pattern-intake-trial/REPORT.md`.
- Outcome: retained `ts-boundary-unknown-first-result-state` in
  `docs/patterns/typescript-boundary-patterns.md` with source mechanisms,
  consumer, falsifier, and eval candidate.

### V258 Pattern Enforcement Gate

- Status: complete.
- Report:
  `docs/reviews/controlled-dogfood/2026-06-28-v258-pattern-enforcement-gate/REPORT.md`.
- Outcome: added `packages/harness/src/typescriptTargetPatternInvariants.test.ts`
  to guard the retained TypeScript pattern, the weak scenario falsifier, and the
  repaired target state.

### V259 Codex Skills Pack Re-Gate

- Status: complete.
- Report:
  `docs/reviews/controlled-dogfood/2026-06-28-v259-codex-skills-pack-regate/REPORT.md`.
- Outcome: kept the minimal skill pack and updated
  `.agents/skills/typescript-type-safety/SKILL.md` to route external input
  boundary work through retained TypeScript patterns.

### V260 Brain Knowledge Read Model Sketch

- Status: complete.
- Report:
  `docs/reviews/controlled-dogfood/2026-06-28-v260-brain-knowledge-read-model-sketch/REPORT.md`.
- Outcome: added `BrainKnowledgeReadModel` to
  `docs/architecture/observability-read-models.md` as the read-only contract
  for future UI/search over brain knowledge.

### V261 Brain Knowledge Read Model Contract Guard

- Status: complete.
- Report:
  `docs/reviews/controlled-dogfood/2026-06-28-v261-brain-knowledge-read-model-contract-guard/REPORT.md`.
- Outcome: added `packages/harness/src/brainKnowledgeReadModelInvariants.test.ts`
  to guard required knowledge card fields and the read-only UI/search boundary.

### V262 Brain Knowledge Card Fixture

- Status: complete.
- Report:
  `docs/reviews/controlled-dogfood/2026-06-28-v262-brain-knowledge-card-fixture/REPORT.md`.
- Outcome: added
  `tests/fixtures/brain-knowledge/cards/ts-boundary-unknown-first-result-state.json`
  and guarded it as a concrete reviewable knowledge card.

### V263 Brain Knowledge Card Readback Helper

- Status: complete.
- Report:
  `docs/reviews/controlled-dogfood/2026-06-28-v263-brain-knowledge-card-readback-helper/REPORT.md`.
- Outcome: added `packages/harness/src/brainKnowledgeReadModel.ts` and tests to
  parse brain knowledge cards from `unknown` and filter by kind, status,
  reviewability, and text.

### V264 Brain Knowledge CLI Readback Preview

- Status: complete.
- Report:
  `docs/reviews/controlled-dogfood/2026-06-28-v264-brain-knowledge-cli-readback-preview/REPORT.md`.
- Outcome: added `krn knowledge cards --card-file ...` as a read-only preview
  over explicit `BrainKnowledgeReadModel` files with text/field filters and
  JSON output. This is not web UI, API, MCP, DB search, ranking, or product
  readiness.

## Active Task Queue

### V255-00 Condense PLANS Active Ledger

Status: complete.

Goal:

```txt
Replace root PLANS.md append-only detail with this compact active ledger while
preserving historical evidence in archive/report paths.
```

Definition of Done:

- historical `PLANS.md` detail is archived;
- root `PLANS.md` is compact and explicit about current state;
- root `PLAN.md` and `GOAL.md` point to the next active task after V255;
- V255 report records before/after size, archive path, preserved decisions, and
  command evidence;
- `git diff --check` passes;
- active plan/context hygiene invariants pass;
- commit is pushed and CI is checked if triggered.

### V256-00 Run Replayable Target Repair Trial

Status: complete.

Goal:

```txt
Use the replayable weak-json-boundary scenario as a fresh target repair trial:
materialize weak baseline -> run KRN plan/evidence -> repair or compare against
expected repaired fixture -> capture evidence/readback -> report Brain ROI.
```

Why now:

```txt
V252/V253/V254 built the normalized target substrate. The next proof is that
KRN can repeatedly drive the repair workflow from a clean weak baseline.
```

Non-goals:

- no living target repo writes;
- no product-ready claim;
- no broad benchmark platform;
- no activation scoring rewrite.

Expected verification:

```sh
node tests/fixtures/target-repos/normalized-weak-typescript/scripts/materialize-scenario.mjs weak-json-boundary .local-lab/target-substrates/normalized-weak-typescript-v256
pnpm --dir .local-lab/target-substrates/normalized-weak-typescript-v256 test
pnpm typecheck
pnpm test
git diff --check
```

### V257-00 Pattern Intake Trial

Status: complete.

Goal:

```txt
Take one high-value external or repo-local best pattern and run it through:
source -> mechanism -> KRN implication -> decision/rejection -> consumer ->
falsifier -> eval/memory/source/skill candidate.
```

Preferred first pattern class:

```txt
TypeScript external-boundary or finite-state modeling pattern, because the
normalized target substrate already provides falsifiable code evidence.
```

Current target pattern:

```txt
unknown-first JSON/external input boundary + discriminated create-user result
states from V253/V256.
```

Rules:

- do not copy paid/proprietary course material;
- prefer public docs/pages, user-provided notes, repo-local standards, or short
  mechanism summaries;
- use `docs/runbooks/pattern-intake.md` for the fuller intake workflow;
- source without mechanism is decoration;
- mechanism without consumer/falsifier is backlog pressure.

Surface Consumer Matrix:

```txt
standard -> durable coding/review rule
skill -> repeated execution workflow
ADR -> architecture or infrastructure decision
eval/golden candidate -> falsifiable behavior
memory/source candidate -> future recall, still review-gated
CLI/readback/CI behavior -> operator-facing enforcement surface
reject -> decorative, unsupported, stale, or mismatched source
```

Expected output:

- one source decision or candidate;
- one enforcement/eval candidate;
- report showing whether the pattern improved the target repair workflow.

### V258-00 Pattern Enforcement Gate

Status: complete.

Goal:

```txt
Add the smallest falsifiable guard/eval/test that checks whether a selected
pattern is applied in a target repair scenario.
```

Selected pattern:

```txt
ts-boundary-unknown-first-result-state
```

Examples:

- unknown-first JSON boundary guard;
- discriminated result union guard;
- no raw `any` in target external input boundary;
- command evidence proof/non-proof rendering guard.

Non-goals:

- no generic quality scanner;
- no `krn audit`;
- no broad static-analysis platform.

### V259-00 Codex Skills Pack Re-Gate

Status: complete.

Goal:

```txt
Inspect current `.agents/skills` and decide the minimal skills needed to route
future work through the brain: target repair, evidence review, source-to-
decision, TypeScript boundary repair, candidate review, and handoff compact.
```

Expected outcome:

- keep/update/create only skills backed by repeated workflow evidence;
- no skill zoo;
- every skill has trigger, forbidden behavior, verification, and removal signal.

### V260-00 Brain Knowledge Read Model Sketch

Status: complete.

Goal:

```txt
Define the minimal typed read-model shape needed for future web UI/search over
brain knowledge.
```

Candidate fields:

```txt
kind, title, summary, confidence, temporal range, source refs, evidence refs,
doesNotProve, dissent/conflict, consumer, falsifier, reviewability, status.
```

Non-goals:

- no dashboard implementation yet;
- no API/MCP yet;
- no source crawler.

### V261-00 Brain Knowledge Read Model Contract Guard

Status: complete.

Goal:

```txt
Add the smallest guard that fails if BrainKnowledgeReadModel loses required
source/evidence/reviewability/falsifier/does-not-prove fields or if UI/search is
authorized before the read-only contract is protected.
```

Non-goals:

- no UI implementation;
- no API/MCP;
- no dashboard package;
- no new persistence.

### V262-00 Brain Knowledge Card Fixture

Status: complete.

Goal:

```txt
Create one reviewable BrainKnowledgeReadModel fixture/card for
`ts-boundary-unknown-first-result-state` so future UI/search has a concrete
object to render and test.
```

Non-goals:

- no UI implementation;
- no API/MCP;
- no database schema;
- no broad knowledge ingestion.

### V263-00 Brain Knowledge Card Readback Helper

Status: complete.

Goal:

```txt
Add the smallest pure helper or fixture readback test that can load
BrainKnowledgeReadModel card fixtures and filter/search by kind, status,
reviewability, and text without adding UI/API/MCP.
```

Non-goals:

- no web UI;
- no API/MCP;
- no DB schema;
- no ranking engine;
- no source crawler.

### V264-00 Brain Knowledge CLI Readback Preview

Status: complete.

Goal:

```txt
Expose the card fixture through the smallest existing CLI/readback-adjacent
surface or explicitly reject CLI exposure if current CLI ownership would create
a product-surface leak. No web UI/API/MCP.
```

Non-goals:

- no web UI;
- no API/MCP;
- no DB schema;
- no ranking engine;
- no broad knowledge ingestion.

### V265-00 Brain Knowledge Card Producer From Retained Patterns

Status: complete.

Goal:

```txt
Add or reject the smallest deterministic producer/catalog path that turns
retained pattern decisions into BrainKnowledgeReadModel cards without manual
fixture drift.
```

Product rationale:

```txt
V264 proves operators can read explicit cards. The next brain gap is producing
cards from retained knowledge so future CLI/UI/search does not depend on
hand-authored JSON fixtures.
```

Architectural rationale:

```txt
Knowledge readback should flow from retained pattern/source decisions into
typed read models. It must not scrape raw reports or become broad ingestion.
```

Evidence source:

- V257 retained TypeScript boundary pattern.
- V260 BrainKnowledgeReadModel contract.
- V262 card fixture.
- V263 readback helper.
- V264 CLI readback preview.

Official/external sources:

- existing source-to-decision refs in `docs/patterns/typescript-boundary-patterns.md`.

Inputs required:

- `docs/patterns/typescript-boundary-patterns.md`
- `tests/fixtures/brain-knowledge/cards/ts-boundary-unknown-first-result-state.json`
- `packages/harness/src/brainKnowledgeReadModel.ts`
- current CLI/readback tests if output changes.

Files likely touched:

- `packages/harness/src/brainKnowledgeReadModel.ts`
- `packages/harness/src/brainKnowledgeReadModel.test.ts`
- `docs/patterns/typescript-boundary-patterns.md`
- brain knowledge fixture/catalog path if needed.

Allowed writes:

- focused harness/read-model producer tests;
- focused docs/report updates.

Forbidden writes:

- web UI/API/MCP;
- DB schema/migrations;
- source crawler;
- ranking engine;
- broad knowledge ingestion;
- memory/source mutation.

Output requirements:

- either a deterministic producer/catalog path or a written rejection explaining
  why current pattern docs cannot produce cards safely.

Definition of Done:

- retained pattern card production/catalog cannot drift silently from the
  retained pattern evidence;
- tests prove the behavior or the rejection is documented with next unblocker;
- active plans point to the next bounded task.

Verification commands:

```sh
pnpm --filter @krn/harness test -- brainKnowledgeReadModel
pnpm typecheck
pnpm test
git diff --check
```

Acceptance criteria:

- no manual-only fixture growth;
- no broad ingestion;
- no product-ready claim.

Risk:

- overbuilding a knowledge ingestion subsystem too early.

Rollback:

- focused revert of V265 commit.

Condensation expectation:

- one compact outcome block plus linked report.

Next-task synthesis rule:

- if producer exists, next task should add second retained pattern/card or
  durable catalog readback; if rejected, next task should repair the minimal
  source shape blocking production.

Pattern surface:

- source-to-decision -> BrainKnowledgeReadModel.

Primary consumer:

- pattern brain / future CLI/UI/search.

Does not prove:

- ranking quality, broad research condensation, DB-backed card store, or web UI.

Falsifier:

- cards can drift from retained pattern evidence without a failing test or
  catalog rule.

### V266-00 Brain Knowledge Pattern-File CLI Preview

Status: complete.

Goal:

```txt
Add explicit `--pattern-file <path>` support to `krn knowledge cards` so the
CLI preview can render cards produced from retained pattern decisions.
```

Rationale:

```txt
V264 can read card files and V265 can produce cards from retained pattern
decisions. The next smallest integration is CLI readback from explicit pattern
files, not web UI/search, DB persistence, or broad ingestion.
```

Inputs:

- `packages/cli/src/parseKnowledgeArgs.ts`
- `packages/cli/src/runKnowledgeCardsCommand.ts`
- `packages/harness/src/brainKnowledgeReadModel.ts`
- `docs/patterns/retained-patterns/ts-boundary-unknown-first-result-state.json`

Allowed writes:

- focused CLI parser/renderer tests and docs/report updates.

Forbidden writes:

- directory crawling;
- ranking engine;
- DB schema/migration;
- web UI/API/MCP;
- source crawler;
- memory/source mutation.

Verification commands:

```sh
pnpm --filter @krn/cli test -- parseKnowledgeArgs runKnowledgeCardsCommand runCli
pnpm typecheck
pnpm test
git diff --check
```

Next-task synthesis rule:

- if `--pattern-file` works, next task should add a second retained pattern/card
  or a durable card catalog index; if rejected, next task should fix the exact
  surface leak.

Does not prove:

- product search, ranking quality, DB-backed knowledge store, or UI readiness.

Falsifier:

- CLI accepts broad directories, parses markdown, or trusts pattern JSON
  without `parseRetainedPatternDecision`.

### V267-00 Brain Knowledge Explicit Catalog Preview

Status: complete.

Goal:

```txt
Add or reject explicit `--catalog-file <path>` support for `krn knowledge cards`
where the catalog lists exact card/pattern files to read.
```

Rationale:

```txt
V266 can render retained-pattern files, but operators still pass files one by
one. An explicit catalog gives multi-card search without directory crawling,
ranking, DB persistence, UI, API, or MCP.
```

Inputs:

- `packages/cli/src/parseKnowledgeArgs.ts`
- `packages/cli/src/runKnowledgeCardsCommand.ts`
- retained pattern/card fixtures

Forbidden writes:

- directory crawling;
- ranking engine;
- DB schema/migration;
- web UI/API/MCP;
- source crawler;
- memory/source mutation.

Verification commands:

```sh
pnpm --filter @krn/cli test -- parseKnowledgeArgs runKnowledgeCardsCommand runCli
pnpm typecheck
pnpm test
git diff --check
```

Next-task synthesis rule:

- if catalog preview works, next task should add a second retained pattern or a
  basic search-quality/readback fixture; if rejected, fix the exact catalog
  input boundary.

Does not prove:

- ranking quality, DB-backed card store, web UI, or product readiness.

Falsifier:

- catalog support becomes implicit repo scanning or accepts unvalidated JSON.

### V268-00 Add Second Retained Pattern To Brain Knowledge Catalog

Status: complete.

Goal:

```txt
Add one more source-backed retained pattern decision to
`docs/patterns/retained-patterns/` and include it in
`docs/brain-knowledge/catalog.json`.
```

Rationale:

```txt
V267 proves catalog mechanics with one pattern. The next proof is breadth
without broad ingestion: add exactly one high-value retained pattern that passes
source -> mechanism -> KRN implication -> consumer -> falsifier.
```

Candidate pattern class:

- source-to-decision graph discipline; or
- evidence proof/non-proof boundary; or
- progressive-disclosure skill design.

Forbidden writes:

- broad research archive;
- paid/proprietary course copying;
- directory crawling;
- ranking engine;
- DB schema/migration;
- web UI/API/MCP.

Verification commands:

```sh
pnpm --filter @krn/harness test -- brainKnowledgeReadModel brainKnowledgeReadModelInvariants
pnpm --filter @krn/cli test -- runKnowledgeCardsCommand
pnpm typecheck
pnpm test
git diff --check
```

Next-task synthesis rule:

- if second pattern works, next task should add a catalog/readback quality guard
  or lightweight search fixture; if no pattern is defensible, document rejection
  and choose the missing source-decision repair.

### V269-00 Brain Knowledge Catalog Search Guard

Status: complete.

Goal:

```txt
Add a focused behavior guard proving explicit catalog readback returns distinct
cards for distinct query terms and preserves proof/non-proof boundaries.
```

Rationale:

```txt
V267 built catalog preview and V268 added breadth. The next proof is not
ranking; it is deterministic readback quality over the existing catalog.
```

Forbidden writes:

- ranking engine;
- web UI/API/MCP;
- DB schema/migration;
- directory crawling;
- broad ingestion.

Verification commands:

```sh
pnpm --filter @krn/cli test -- runKnowledgeCardsCommand
pnpm typecheck
pnpm test
git diff --check
```

### V270-00 Brain Knowledge Skill Readback Hook

Status: complete.

Goal:

```txt
Update the smallest relevant skill/runbook guidance so TypeScript boundary,
source-to-decision, or pattern-intake work can query
`krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json` before
implementation when retained pattern context is needed.
```

Rationale:

```txt
V269 proves catalog readback works. The next brain step is not UI; it is making
Codex execution workflows use the catalog intentionally.
```

Forbidden writes:

- automatic semantic hooks;
- hidden skill routing;
- broad skill zoo;
- UI/API/MCP;
- DB schema/migration;
- ranking engine.

Verification commands:

```sh
pnpm --filter @krn/harness test -- contextHygieneInvariants activePlanInvariants patternChainInvariants
git diff --check
```

### V271-00 Brain Knowledge Skill Readback Usefulness Trial

Status: complete.

Goal:

```txt
Run one bounded TypeScript-boundary or source-to-decision slice through the
updated skill guidance and record whether the explicit catalog readback card was
selected, used, helped, neutral, noise, or missing.
```

Product rationale:

```txt
V270 made the catalog reachable from skills. The next useful proof is whether a
real slice benefits from that readback before building UI/search.
```

Architectural rationale:

```txt
Pattern brain should grow through measured skill usage, not hidden routing or
dashboard-first surfaces.
```

Evidence source:

- V269 catalog search guard.
- V270 skill readback hook report.
- `.agents/skills/typescript-type-safety/SKILL.md`.
- `.agents/skills/source-to-decision/SKILL.md`.
- `docs/runbooks/pattern-intake.md`.

Official/external sources:

- no new external source required unless the chosen slice introduces one.

Inputs required:

- `docs/brain-knowledge/catalog.json`
- one bounded TypeScript-boundary or source-to-decision task selected from
  current repo evidence.

Files likely touched:

- only files required by the chosen bounded task;
- one V271 report under `docs/reviews/controlled-dogfood/`.

Allowed writes:

- focused source/docs/test changes required by the chosen slice;
- V271 report;
- compact plan updates.

Forbidden writes:

- UI/API/MCP;
- ranking engine;
- hidden semantic hooks;
- broad research ingestion;
- DB schema/migration unless the chosen slice independently requires it;
- memory/source mutation;
- living target repo writes.

Output requirements:

- report records the exact catalog command run;
- report classifies each returned card as helped / neutral / noise / missing;
- report states what the card proved and did not prove.

Definition of Done:

- one bounded slice uses the updated skill/runbook catalog readback;
- verification for touched files passes;
- report explains whether catalog readback reduced review burden or improved
  the decision;
- active plan advances to the next bounded task.

Verification commands:

```sh
pnpm --filter @krn/cli krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --text <chosen-query>
pnpm typecheck
pnpm test
git diff --check
```

Acceptance criteria:

- no claim of product search or product readiness;
- no docs-only assertion without a real catalog command;
- no broad roadmap expansion.

Risk:

- choosing a slice too trivial to measure usefulness.

Rollback:

- revert the focused V271 commit.

Condensation expectation:

- one compact outcome block plus linked report.

Next-task synthesis rule:

- if catalog readback helped, next task may gate UI/search readiness or add one
  more retained pattern; if it did not help, next task should repair catalog
  query/usefulness reporting before UI.

Pattern surface:

- skills / pattern brain / TypeScript or source-to-decision.

Primary consumer:

- future Codex skill execution and UI/search readiness gate.

Does not prove:

- ranking quality, DB-backed knowledge store, UI readiness, product readiness,
  or automatic skill selection.

Falsifier:

- the slice cannot show whether the card was used/helpful, or proceeds without
  running the catalog command.

### V272-00 Brain Knowledge UI/Search Readiness Gate

Status: complete.

Goal:

```txt
Decide whether the explicit brain knowledge catalog is ready for the smallest
read-only UI/search preview, and define or reject the exact bounded
implementation surface.
```

Product rationale:

```txt
The user wants Adam-like searchable brain views. KRN now has explicit cards,
catalog readback, skill routing, and package-cwd path normalization. The next
step is to gate UI/search from evidence instead of dashboard-first ambition.
```

Architectural rationale:

```txt
UI/search must render guarded read-only BrainKnowledgeReadModel resources and
preserve proof/non-proof boundaries. It must not become Memory Core mutation,
ranking, API/MCP, crawler, or broad dashboard scope.
```

Evidence source:

- V260 BrainKnowledgeReadModel contract.
- V261 read-model guard.
- V264 CLI preview.
- V267 catalog preview.
- V269 catalog search guard.
- V270 skill hook.
- V271 skill readback usefulness/path repair.

Official/external sources:

- none required unless the UI surface depends on a framework/doc decision.

Inputs required:

- current package/app topology;
- `packages/cli/src/runKnowledgeCardsCommand.ts`;
- `packages/harness/src/brainKnowledgeReadModel.ts`;
- `docs/brain-knowledge/catalog.json`.

Files likely touched:

- root plan/report files;
- maybe an existing app/package topology doc if UI is rejected or scoped.

Allowed writes:

- readiness report;
- compact plan updates;
- only bounded UI/search implementation files if the gate proves the surface is
  already prepared and the implementation remains read-only.

Forbidden writes:

- Memory Core mutation;
- source/candidate promotion;
- ranking engine;
- DB schema/migration;
- API/MCP server;
- source crawler;
- broad dashboard;
- ingestion pipeline;
- product-ready claim.

Output requirements:

- readiness verdict: proceed / defer / reject;
- exact allowed UI/search surface if proceed;
- proof/non-proof boundary;
- next task either UI preview implementation or missing-readiness repair.

Definition of Done:

- report states whether UI/search preview is authorized;
- if authorized, next task is a bounded implementation slice with allowed files;
- if deferred, next task names the missing proof.

Verification commands:

```sh
pnpm --filter @krn/cli krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --text unknown-first --json
pnpm --filter @krn/cli krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --text source-to-decision --json
git diff --check
```

Acceptance criteria:

- no UI/dashboard work without explicit readiness decision;
- no mutation or ranking hidden under preview;
- no broad roadmap expansion.

Risk:

- starting UI too early and turning readback into product theater.

Rollback:

- revert the focused V272 commit.

Condensation expectation:

- one compact outcome block plus linked report.

Next-task synthesis rule:

- if proceed, append a bounded `Brain Knowledge Read-Only Web Search Preview`
  implementation task; if defer, append the smallest missing proof task.

Pattern surface:

- operator UX / CLI / readback.

Primary consumer:

- future UI/search over brain knowledge.

Does not prove:

- product readiness, ranking quality, DB-backed knowledge, or broad research
  completeness.

Falsifier:

- UI/search is authorized while it can mutate memory/source truth or hide
  does-not-prove boundaries.

### V273-00 Brain Knowledge Self-Contained HTML Search Preview

Status: complete.

Goal:

```txt
Add `--html` to `krn knowledge cards` so operators can open a local
self-contained read-only search page over BrainKnowledgeReadModel cards.
```

Product rationale:

```txt
The user wants visible/searchable brain knowledge. V272 rejects dashboard/API
scope and authorizes the smallest useful UI: HTML generated from the existing
CLI resource.
```

Architectural rationale:

```txt
HTML output should reuse the same typed resource already used by text/JSON
preview. The UI must not become source of truth, mutation authority, server
architecture, ranking, or DB-backed search.
```

Evidence source:

- V260 BrainKnowledgeReadModel.
- V261 read-model invariant.
- V264/V267 CLI preview.
- V269 catalog search guard.
- V271 package-cwd path normalization.
- V272 UI/search readiness gate.

Official/external sources:

- none required unless implementation imports a new frontend dependency.

Inputs required:

- `packages/cli/src/parseKnowledgeArgs.ts`
- `packages/cli/src/runKnowledgeCardsCommand.ts`
- `packages/cli/src/runKnowledgeCardsCommand.test.ts`
- `docs/brain-knowledge/catalog.json`

Files likely touched:

- CLI parser/renderer/tests;
- V273 report;
- compact plan updates.

Allowed writes:

- add `--html` output mode;
- client-side local search/filter in generated HTML;
- focused tests for HTML proof/read-only boundaries.

Forbidden writes:

- new web package;
- API/MCP server;
- DB schema/migration;
- ranking engine;
- source crawler;
- Memory Core, SourceDecision, candidate, or evidence mutation;
- dashboard product claim.

Output requirements:

- generated HTML includes search/filter controls;
- generated HTML includes card title, summary, kind/status/reviewability,
  source refs, evidence refs, consumer, falsifier, and does-not-prove boundary;
- generated HTML states access is read-only and mutation is none;
- output is self-contained and local.

Definition of Done:

- `--html` parses and renders;
- tests prove HTML contains search UI and proof/non-proof fields;
- manual command produces HTML from `docs/brain-knowledge/catalog.json`;
- full verification passes.

Verification commands:

```sh
pnpm --filter @krn/cli test -- parseKnowledgeArgs runKnowledgeCardsCommand runCli
pnpm --filter @krn/cli krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --html > .local-lab/brain-knowledge-preview.html
pnpm typecheck
pnpm test
git diff --check
```

Acceptance criteria:

- no server/runtime dependency;
- no mutation controls;
- no hidden ranking;
- no product-ready claim.

Risk:

- UI becomes decorative if it hides proof/non-proof boundaries or cannot search
  locally.

Rollback:

- revert the focused V273 commit.

Condensation expectation:

- one compact outcome block plus linked report.

Next-task synthesis rule:

- if HTML preview works, next task should add a focused visual/ergonomic guard
  or add one more retained pattern card; if it fails, repair the exact HTML
  readback issue before broader UI.

Pattern surface:

- operator UX / CLI / readback.

Primary consumer:

- local brain knowledge search UX.

Does not prove:

- product readiness, ranking quality, DB-backed knowledge, API/MCP readiness,
  or broad research completeness.

Falsifier:

- generated HTML cannot search/filter locally or omits source/evidence/falsifier
  /does-not-prove fields.

### V274-00 Add Evidence Proof Boundary Retained Pattern

Status: complete.

Goal:

```txt
Add one retained pattern for evidence proof/non-proof boundary discipline and
include it in the explicit brain knowledge catalog.
```

Product rationale:

```txt
The HTML preview exists; product value now comes from searchable high-value
patterns. Evidence proof boundaries are one of KRN's strongest repeated
standards and should be searchable as a card.
```

Architectural rationale:

```txt
KRN knowledge should grow through structured retained pattern decisions, not UI
copy or decorative docs.
```

Evidence source:

- evidence-review-loop skill;
- V0/V evidence integrity reports;
- CLI evidence capture proof/non-proof behavior;
- current command evidence reports.

Official/external sources:

- repo-local evidence is sufficient unless a new external source is introduced.

Inputs required:

- `.agents/skills/evidence-review-loop/SKILL.md`
- `docs/reviews/controlled-dogfood/*evidence*`
- `docs/brain-knowledge/catalog.json`
- retained pattern schema examples.

Files likely touched:

- `docs/patterns/retained-patterns/evidence-proof-boundary.json`
- `docs/brain-knowledge/catalog.json`
- harness/CLI readback tests if catalog breadth guard needs updating;
- V274 report;
- compact plan updates.

Allowed writes:

- one retained pattern JSON;
- catalog update;
- focused readback guard/test if needed;
- report and plan updates.

Forbidden writes:

- broad research archive;
- source crawler;
- UI polish;
- dashboard/API/MCP;
- DB schema/migration;
- memory/source mutation.

Output requirements:

- pattern includes mechanism, KRN implication, decision, consumer, falsifier,
  source refs, evidence refs, does-not-prove, reviewability, and next action;
- catalog readback finds it by a distinct query.

Definition of Done:

- retained pattern exists and is in catalog;
- readback command returns it;
- tests/invariants pass;
- report records source-to-decision mapping.

Verification commands:

```sh
pnpm --filter @krn/cli krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --text proof --json
pnpm --filter @krn/harness test -- brainKnowledgeReadModel brainKnowledgeReadModelInvariants
pnpm --filter @krn/cli test -- runKnowledgeCardsCommand
pnpm typecheck
pnpm test
git diff --check
```

Acceptance criteria:

- no decorative source;
- no copied external content;
- no product-ready claim.

Risk:

- making a vague "always state does-not-prove" card without concrete evidence
  refs and falsifier.

Rollback:

- revert the focused V274 commit.

Condensation expectation:

- one compact outcome block plus linked report.

Next-task synthesis rule:

- if the third pattern works, next task may add a small HTML/catalog usability
  guard or another high-value pattern; if it fails, repair retained-pattern
  schema/readback before adding more cards.

Pattern surface:

- evidence/review loop / pattern brain.

Primary consumer:

- future evidence capture, review, and UI/search readback.

Does not prove:

- product readiness, ranking quality, DB-backed card store, or complete evidence
  quality.

Falsifier:

- evidence-related tasks can omit proof/non-proof boundaries while the retained
  pattern and tests still pass.

### V275-00 Brain Knowledge HTML Catalog Breadth Guard

Status: active.

Goal:

```txt
Add a focused guard that generated HTML over `docs/brain-knowledge/catalog.json`
renders all current retained pattern cards and preserves proof-boundary fields.
```

Product rationale:

```txt
The catalog now has three cards and a local HTML preview. The next risk is
readback drift: the UI/search preview could miss cards or hide proof boundaries.
```

Architectural rationale:

```txt
Brain UI/search must remain a faithful read-only projection over typed cards,
not a hand-selected subset or decorative shell.
```

Evidence source:

- V273 HTML preview.
- V274 evidence proof-boundary retained pattern.
- `docs/brain-knowledge/catalog.json`.

Official/external sources:

- none.

Inputs required:

- `packages/cli/src/runKnowledgeCardsCommand.test.ts`
- `docs/brain-knowledge/catalog.json`
- retained pattern IDs.

Files likely touched:

- CLI readback tests;
- V275 report;
- compact plan updates.

Allowed writes:

- focused HTML/catalog breadth guard;
- report and plan updates.

Forbidden writes:

- UI polish;
- ranking engine;
- API/MCP server;
- DB schema/search;
- source crawler;
- memory/source mutation.

Output requirements:

- test proves HTML contains all three current pattern IDs;
- test proves HTML contains source refs, evidence refs, falsifier, does-not-prove,
  mutation none, and proof boundaries.

Definition of Done:

- focused test passes;
- full verification passes;
- report records what the guard proves and does not prove.

Verification commands:

```sh
pnpm --filter @krn/cli test -- runKnowledgeCardsCommand
pnpm typecheck
pnpm test
git diff --check
```

Acceptance criteria:

- no broad UI changes;
- no ranking;
- no product-ready claim.

Risk:

- snapshot-like HTML test that protects markup noise instead of meaningful
  readback fields.

Rollback:

- revert focused V275 commit.

Condensation expectation:

- one compact outcome block plus linked report.

Next-task synthesis rule:

- if HTML breadth is guarded, next task may add another high-value retained
  pattern or a small catalog freshness guard; if not, repair HTML readback.

Pattern surface:

- operator UX / readback / pattern brain.

Primary consumer:

- future local brain knowledge search.

Does not prove:

- visual quality, ranking quality, product readiness, or DB-backed search.

Falsifier:

- generated HTML can omit a catalog card or proof-boundary field while tests
  still pass.

## Decision Log

- Root `PLAN.md` remains compact product SSOT.
- Root `GOAL.md` remains compact active objective.
- Root `PLANS.md` is a compact active ledger, not a full transcript.
- Historical detail belongs in archives and reports, not active context.
- V02-01 remains blocked/deferred until real second-operator inputs exist.
- Self/headless scenarios are engineering proof, not second-operator proof.
- Use KRN-owned normalized target substrates before writing to living target
  repos.
- Pattern work must use source-to-decision with consumer and falsifier.
- Pattern brain is partial until intake, enforcement, skills, evidence, and
  readback are connected in repeatable scenarios.
- stale attachment objective guard: attachments are evidence, not authority to
  roll the active stream backward.

## 9. Task Contract Schema

Every new task appended to `Active Task Queue` or `Generated Task Backlog` must use this schema.
If a task cannot satisfy the schema, it is not ready for execution.

ID:
Name:
Status:
Goal:
Product rationale:
Architectural rationale:
Evidence source:
Official/external sources:
Inputs required:
Files likely touched:
Allowed writes:
Forbidden writes:
Output requirements:
Definition of Done:
Verification commands:
Acceptance criteria:
Risk:
Rollback:
Condensation expectation:
Next-task synthesis rule:

## 13. Generated Task Backlog

Template:

### <ID> — <Name>

Status:
Goal:
Product rationale:
Architectural rationale:
Evidence source:
Official/external sources:
Inputs required:
Files likely touched:
Allowed writes:
Forbidden writes:
Output requirements:
Definition of Done:
Verification commands:
Acceptance criteria:
Risk:
Rollback:
Condensation expectation:
Next-task synthesis rule:
Pattern surface:
Primary consumer:
Does not prove:
Falsifier:

Current generated backlog is represented by queued tasks V257..V260 above.

## 15. Progress

- V255-00 complete: root `PLANS.md` was condensed and historical detail was
  archived.
- V256-00 complete: replayed and repaired the weak TypeScript target in
  `.local-lab`.
- V257-00 complete: turned the repeated TypeScript boundary pattern into a
  source-to-decision object and enforcement/eval candidate.
- V258-00 complete: added a focused harness invariant for the retained
  TypeScript boundary pattern.
- V259-00 complete: re-gated the minimal Codex skills pack and updated the
  TypeScript skill to route retained patterns.
- V260-00 complete: sketched the minimal brain knowledge read model for future
  UI/search.
- V261-00 complete: guarded the brain knowledge read-model contract.
- V262-00 complete: created one concrete brain knowledge card fixture.
- V263-00 complete: added a pure card readback/search helper.
- V264-00 complete: added the read-only `krn knowledge cards` preview.
- V265-00 complete: added retained-pattern source JSON and deterministic card
  producer.
- V266-00 complete: connected explicit retained pattern files to CLI readback.
- V267-00 complete: added explicit catalog-file preview.
- V268-00 complete: added a second retained pattern to the catalog.
- V269-00 complete: guarded deterministic catalog search/readback behavior.
- V270-00 complete: routed TypeScript/source-to-decision/pattern-intake
  workflows to explicit brain knowledge catalog readback.
- V271-00 complete: skill-routed catalog readback found and fixed package-cwd
  root path resolution for knowledge catalog files.
- V272-00 complete: authorized self-contained read-only HTML generated from the
  existing `krn knowledge cards` resource; rejected new dashboard/API/MCP.
- V273-00 complete: implemented `--html` as a local self-contained search
  preview over the existing knowledge cards resource.
- V274-00 complete: added `evidence-proof-non-proof-boundary` as the third
  retained pattern card in the catalog.
- V275-00 active: guard that HTML readback renders all current cards and
  proof-boundary fields.

## Outcome V274-00 Add Evidence Proof Boundary Retained Pattern

Summary:
- added `docs/patterns/retained-patterns/evidence-proof-non-proof-boundary.json`;
- added it to `docs/brain-knowledge/catalog.json`;
- extended catalog invariants and CLI search guard for `proof-boundary`;
- verified readback returns `pattern:evidence-proof-non-proof-boundary`.

Source-to-decision:
- Source: `.agents/skills/evidence-review-loop/SKILL.md`,
  `packages/core/src/evidenceBundle.ts`, and
  `packages/schema/src/evidenceCapture.ts`.
- Mechanism: evidence can shape review/memory/source/eval decisions only when
  provenance and proof/non-proof boundaries stay visible.
- KRN implication: proof-boundary discipline should be searchable retained
  knowledge, not only implicit skill text.
- Decision: retain `evidence-proof-non-proof-boundary`; open V275 to guard HTML
  breadth after catalog growth.
- Does not prove: command truth, review correctness, memory quality, source
  truth, ranking quality, or product readiness.
- Consumer: future evidence capture/review and brain knowledge UI/search.
- Falsifier: evidence/candidate/card output can influence decisions while
  omitting command provenance or does-not-prove boundary and tests still pass.

## Outcome V273-00 Brain Knowledge Self-Contained HTML Search Preview

Summary:
- added `--html` to `krn knowledge cards`;
- rendered the existing read-only card resource as self-contained local HTML;
- included client-side search, cards, source refs, evidence refs, consumers,
  falsifier, does-not-prove, and proof boundaries;
- updated CLI surface docs;
- generated `.local-lab/brain-knowledge-preview.html` as uncommitted local
  proof.

Source-to-decision:
- Source: V260/V261 read-model contract and guard, V264/V267/V269 CLI readback,
  V271 path normalization, and V272 readiness gate.
- Mechanism: the safest first UI is a presentation of the existing read-only
  resource, not a server/dashboard/API.
- KRN implication: operators can now search brain knowledge in a browser while
  KRN keeps mutation and ranking deferred.
- Decision: add `--html`; keep API/MCP/DB search/ranking/dashboard deferred.
- Does not prove: product readiness, ranking quality, DB-backed knowledge, or
  broad pattern coverage.
- Consumer: local operator brain knowledge review and V274 catalog growth.
- Falsifier: HTML output hides source/evidence/falsifier/does-not-prove fields
  or adds mutation authority.

## Outcome V272-00 Brain Knowledge UI/Search Readiness Gate

Summary:
- inspected repo topology and confirmed there is no existing web/app package;
- inspected BrainKnowledgeReadModel, CLI surface docs, and ADR-0025 dashboard
  gate;
- rejected dashboard/API/MCP/DB/ranking/crawler scope;
- authorized `krn knowledge cards --html` as the smallest local read-only
  UI/search preview over the same typed card resource.

Source-to-decision:
- Source: V260/V261 read-model contract and guard, V264/V267/V269 CLI/catalog
  proof, V270 skill hook, V271 path repair, and ADR-0025.
- Mechanism: UI/search can be useful once it renders typed cards with proof
  boundaries, but a server/dashboard would create premature product architecture.
- KRN implication: local HTML output from existing CLI gives operator search UX
  without widening trust boundaries.
- Decision: proceed to V273 `--html`; reject new web package/API/MCP/DB/ranking
  in this step.
- Does not prove: product readiness, ranking quality, DB-backed knowledge, or
  broad pattern coverage.
- Consumer: V273 self-contained HTML search preview.
- Falsifier: HTML output omits read-only/proof boundaries or adds mutation
  controls/server dependencies.

## Outcome V271-00 Brain Knowledge Skill Readback Usefulness Trial

Summary:
- running the exact V270 skill command failed from natural
  `pnpm --filter @krn/cli` execution because `docs/brain-knowledge/catalog.json`
  was resolved relative to `packages/cli`;
- repaired `krn knowledge cards` input resolution to try command cwd first and
  nearest repo root second;
- added a regression test for root-relative catalog files from a package cwd;
- verified both `unknown-first` and `source-to-decision` skill queries now work.

Source-to-decision:
- Source: V270 skill readback hook and the failed V271 command.
- Mechanism: executable skill guidance requires root-relative files to resolve
  from package execution cwd.
- KRN implication: catalog readback must be path-normalized before UI/search or
  later surfaces inherit fragile path assumptions.
- Decision: repair explicit input file resolution in `runKnowledgeCardsCommand`
  and open V272 to gate read-only UI/search readiness.
- Does not prove: UI/search readiness, ranking quality, DB-backed knowledge,
  broad pattern coverage, or product readiness.
- Consumer: V272 brain knowledge UI/search readiness gate.
- Falsifier: `pnpm --filter @krn/cli krn knowledge cards --catalog-file
  docs/brain-knowledge/catalog.json ...` fails from repo root.

## Outcome V270-00 Brain Knowledge Skill Readback Hook

Summary:
- updated `typescript-type-safety` to query the catalog for unknown-first
  boundary context;
- updated `source-to-decision` to query the catalog before retaining or applying
  source/pattern context;
- updated `docs/runbooks/pattern-intake.md` to query the catalog before
  retaining another pattern;
- guarded the skill guidance in `skillInvariants`.

Source-to-decision:
- Source: V267 explicit catalog preview, V268 second retained pattern, V269
  catalog search guard, existing TypeScript and source-to-decision skills, and
  the pattern intake runbook.
- Mechanism: retained patterns only influence future work when execution
  workflows read them before implementation or retention decisions.
- KRN implication: skills should route to read-only catalog context before
  UI/search or hidden automation.
- Decision: add explicit catalog readback guidance to the smallest relevant
  skills/runbook and open V271 to measure usefulness in a real slice.
- Does not prove: automatic skill selection, product readiness, ranking,
  DB-backed knowledge, UI/search, or broad research condensation.
- Consumer: V271 skill readback usefulness trial.
- Falsifier: future slices cannot say whether the catalog card was used,
  helped, neutral, noise, or missing.

## Outcome V264-00 Brain Knowledge CLI Readback Preview

Summary:
- added `krn knowledge cards --card-file <path>` as a read-only CLI preview;
- added text, kind, status, reviewability, and JSON filters;
- reused `BrainKnowledgeReadModel` parser/search helper through the harness
  public root;
- kept the surface explicit-file only, with no DB, ranking, UI, API, MCP, or
  mutation authority.

Source-to-decision:
- Source: V260 read-model contract, V262 card fixture, V263 parser/search
  helper, and current CLI surface classification.
- Mechanism: operators need a cheap readback loop before web UI/search, but a
  preview must not imply product search or mutate Memory Core.
- KRN implication: expose explicit typed cards through read-only CLI preview
  with proof/non-proof boundaries.
- Decision: add `krn knowledge cards` and open V265 to remove manual fixture
  drift by producing/cataloging cards from retained patterns.
- Does not prove: product readiness, ranking quality, live DB card production,
  broad knowledge ingestion, or web UI readiness.
- Consumer: V265 card producer/catalog and future UI/search read-model work.
- Falsifier: CLI starts scanning/ranking/mutating knowledge or operators treat
  explicit card-file preview as product search.

## Outcome V265-00 Brain Knowledge Card Producer From Retained Patterns

Summary:
- added a structured retained pattern source at
  `docs/patterns/retained-patterns/ts-boundary-unknown-first-result-state.json`;
- added `parseRetainedPatternDecision` and
  `brainKnowledgeCardFromRetainedPatternDecision`;
- guarded that the generated card equals the concrete card fixture;
- documented that markdown is not the runtime/card source.

Source-to-decision:
- Source: V257 retained pattern, V260 card contract, V262 fixture, V263 helper,
  and V264 CLI preview.
- Mechanism: manual card fixtures drift unless generated from structured
  retained decisions.
- KRN implication: pattern brain cards should be produced from typed retained
  pattern decisions, not scraped markdown.
- Decision: add retained-pattern JSON source and producer; open V266 to let CLI
  read explicit pattern files directly.
- Does not prove: broad research condensation, DB-backed card store, ranking
  quality, or UI readiness.
- Consumer: V266 pattern-file CLI preview and future catalog/index work.
- Falsifier: cards drift from retained pattern source while tests pass.

## Outcome V266-00 Brain Knowledge Pattern-File CLI Preview

Summary:
- added `--pattern-file` to `krn knowledge cards`;
- retained-pattern files are parsed through `parseRetainedPatternDecision`;
- produced cards reuse the same read-only CLI filter/output path;
- kept the surface explicit-file only with no directory crawling, ranking, DB,
  UI, API, MCP, or mutation authority.

Source-to-decision:
- Source: V264 CLI preview and V265 retained-pattern producer.
- Mechanism: operators should inspect retained knowledge without hand-authored
  card files, but preview inputs must stay explicit and typed.
- KRN implication: CLI readback can consume retained pattern decisions directly
  before product UI/search exists.
- Decision: add `--pattern-file`; open V267 for an explicit catalog file so
  multi-card readback does not require manual file repetition.
- Does not prove: product search, ranking quality, DB-backed card store, or UI
  readiness.
- Consumer: V267 explicit catalog preview.
- Falsifier: CLI starts crawling directories or trusting unparsed pattern JSON.

## Outcome V267-00 Brain Knowledge Explicit Catalog Preview

Summary:
- added `docs/brain-knowledge/catalog.json`;
- added `--catalog-file` to `krn knowledge cards`;
- catalog entries list exact card/pattern files and resolve relative to the
  catalog file;
- kept the surface read-only with no directory crawling, ranking, DB, UI, API,
  MCP, or mutation authority.

Source-to-decision:
- Source: V264 card-file preview, V265 retained-pattern producer, and V266
  pattern-file preview.
- Mechanism: an explicit catalog supports multi-card readback without implicit
  repo scan or product search claims.
- KRN implication: future UI/search can begin from a typed catalog, not raw
  docs crawling.
- Decision: add explicit catalog-file preview; open V268 to add a second
  retained pattern and prove breadth.
- Does not prove: ranking quality, DB-backed card store, UI readiness, or
  broad research condensation.
- Consumer: V268 second retained pattern and future search/readback quality
  guards.
- Falsifier: catalog support becomes directory crawling or accepts unvalidated
  JSON.

## Outcome V268-00 Add Second Retained Pattern To Brain Knowledge Catalog

Summary:
- added `source-to-decision-retention-gate` as a structured retained pattern;
- added it to `docs/brain-knowledge/catalog.json`;
- extended CLI/catalog tests to find the second pattern by text query;
- extended harness invariants to keep catalog entries pointed at retained
  pattern sources.

Source-to-decision:
- Source: `docs/KRN_KERNEL.md`, `docs/patterns/KRN_PATTERN_SELECTION.md`, and
  `.agents/skills/source-to-decision/SKILL.md`.
- Mechanism: retained knowledge requires mechanism, implication, decision or
  rejection, consumer, falsifier, and does-not-prove.
- KRN implication: the catalog should retain reviewable pattern decisions, not
  decorative source notes.
- Decision: adopt `source-to-decision-retention-gate` and open V269 for a
  catalog search/readback guard.
- Does not prove: research completeness, source truth, ranking quality, DB
  card store, UI readiness, or product readiness.
- Consumer: future pattern intake, research condensation, and catalog reviews.
- Falsifier: retained pattern cards can omit source-to-decision requirements
  while tests still pass.

## Outcome V269-00 Brain Knowledge Catalog Search Guard

Summary:
- added a JSON readback guard in `runKnowledgeCardsCommand.test.ts`;
- verified `unknown-first` returns the TypeScript boundary pattern card;
- verified `source-to-decision` returns the source-to-decision retention card;
- verified read-only/no-mutation/proof boundaries are preserved.

Source-to-decision:
- Source: V267 catalog preview and V268 second retained pattern.
- Mechanism: multi-card catalog search needs deterministic readback guards
  before future UI/search or skill usage.
- KRN implication: the catalog can be used by operators/skills as a bounded
  readback surface, but not as ranking/product search.
- Decision: guard deterministic catalog readback and open V270 to route relevant
  skills to use the catalog intentionally.
- Does not prove: ranking quality, DB-backed card store, UI readiness, or
  product readiness.
- Consumer: V270 skill readback guidance and future search/readback fixtures.
- Falsifier: distinct queries return wrong cards or lose proof boundaries while
  tests still pass.

## Outcome V255-00 Active Ledger Condensation

Summary:
- root `PLANS.md` was condensed from 20,736 lines to a compact active ledger;
- historical detail was archived at
  `docs/plans/historical-ledgers/2026-06-28-root-plans-before-v255-active-ledger-condensation.md`;
- active pointers moved to V256.

Source-to-decision:
- Source: operator rule to stop accumulating active plan/progress walls plus
  V254 replayable substrate outcome.
- Mechanism: active context must route work cheaply; detailed evidence belongs
  in reports, commits, archives, tests, ADRs, and skills.
- KRN implication: a useful brain needs compact active state plus linked
  evidence, not unlimited ledger rereads.
- Decision: condense root `PLANS.md` and keep only current evidence pointers,
  next tasks, and invariants.
- Does not prove: product readiness, UI/search readiness, or full pattern brain
  enforcement.
- Consumer: continuation protocol, active plan invariants, future UI/search
  read-model work.
- Falsifier: `PLANS.md` again becomes an append-only wall that blocks quick
  resume or hides the current task.

## Outcome V256-00 Replayable Target Repair Trial

Summary:
- materialized `weak-json-boundary` into
  `.local-lab/target-substrates/normalized-weak-typescript-v256`;
- confirmed weak baseline markers: `any`, raw `JSON.parse`, and
  `CreatedUser | null`;
- repaired the local target with unknown-first parsing, `UserRole`, and
  discriminated `CreateUserResult`;
- verified target tests and forbidden-smell search;
- recorded that root evidence capture does not classify ignored `.local-lab`
  file diffs.

Source-to-decision:
- Source: V252 normalized substrate, V253 TypeScript repair, V254 replayable
  baseline, target-repo-testing skill, TypeScript type safety skill.
- Mechanism: replayable weak targets let KRN apply and verify the same
  best-pattern pressure repeatedly instead of relying on prose standards.
- KRN implication: pattern brain needs source decisions and enforcement
  candidates backed by replayable target falsifiers.
- Decision: open V257 to formalize the unknown-first external boundary /
  discriminated result-state pattern as a reviewable source-to-decision object.
- Does not prove: product readiness, real target transfer, second-operator
  usability, or automatic activation quality.
- Consumer: V257 pattern intake, V258 enforcement gate, future target repair
  trials.
- Falsifier: future target repairs cannot reproduce or verify the pattern
  without manual source archaeology.

## Outcome V257-00 Pattern Intake Trial

Summary:
- added `docs/patterns/typescript-boundary-patterns.md`;
- registered `Unknown-First External Boundary With Explicit Result State` in
  `docs/patterns/KRN_PATTERN_SELECTION.md`;
- selected V258 as the enforcement consumer.

Source-to-decision:
- Source: TypeScript official narrowing/exhaustiveness source, public Total
  TypeScript pattern sources already retained in `docs/KRN_SOURCES.md`, TS Reset
  source, V253 local repair report, and V256 replay repair report.
- Mechanism: external inputs should enter as `unknown`, narrow near the
  boundary, and return explicit finite states when caller behavior depends on
  failure reason.
- KRN implication: pattern brain needs small durable pattern objects plus
  enforcement candidates, not repeated prose explanations.
- Decision: adopt `ts-boundary-unknown-first-result-state` as active pattern
  knowledge and open V258 to guard it.
- Does not prove: automated enforcement, product readiness, real target
  transfer, or UI/search readiness.
- Consumer: V258 Pattern Enforcement Gate.
- Falsifier: the replayable target can retain raw `any`/trusted `JSON.parse` or
  nullable invalid-input result while the future pattern gate passes.

## Outcome V258-00 Pattern Enforcement Gate

Summary:
- added `packages/harness/src/typescriptTargetPatternInvariants.test.ts`;
- guarded the retained pattern object, weak scenario falsifier, and repaired
  target state;
- kept the gate bounded to one pattern and one normalized substrate.

Source-to-decision:
- Source: V257 retained pattern object and V253/V256 repair evidence.
- Mechanism: a replayable weak scenario plus repaired target fixture can falsify
  whether a retained pattern is still applied.
- KRN implication: pattern brain should grow by small enforcement gates tied to
  retained patterns, not broad quality scanners.
- Decision: add a harness invariant for
  `ts-boundary-unknown-first-result-state` and open V259 to re-gate Codex skill
  routing.
- Does not prove: real target transfer, product readiness, full TypeScript
  quality, or UI/search readiness.
- Consumer: future normalized target trials and V259 skills pack re-gate.
- Falsifier: the normalized target can regress to raw `any`/nullable invalid
  input state while `typescriptTargetPatternInvariants` still passes.

## Outcome V259-00 Codex Skills Pack Re-Gate

Summary:
- reviewed the repo-local skill pack;
- did not create a new skill;
- updated `typescript-type-safety` to check
  `docs/patterns/typescript-boundary-patterns.md` for external input boundary
  work and require pattern ID/consumer/falsifier when relevant.

Source-to-decision:
- Source: V257 retained pattern, V258 enforcement gate, and existing repo-local
  skills.
- Mechanism: skills are the progressive-disclosure bridge from retained brain
  knowledge to Codex execution.
- KRN implication: pattern brain should route repeated work through a small
  skill pack instead of long prompt dumps or a skill zoo.
- Decision: update `typescript-type-safety`; do not create a new TypeScript
  boundary repair skill yet.
- Does not prove: automatic skill selection quality, product readiness, or real
  target transfer.
- Consumer: V260 read model sketch and future target repair trials.
- Falsifier: future TypeScript boundary work ignores retained pattern IDs and
  reverts to untracked prose.

## Outcome V260-00 Brain Knowledge Read Model Sketch

Summary:
- added `BrainKnowledgeReadModel` to
  `docs/architecture/observability-read-models.md`;
- kept it read-only and explicitly pre-UI/pre-API/pre-MCP;
- selected V261 as the guard before future UI/search.

Source-to-decision:
- Source: user UI/search requirement, V257 retained pattern object, V258
  enforcement gate, V259 skill routing, and ADR-0025 dashboard readiness gate.
- Mechanism: searchable brain knowledge needs typed read-only cards with source
  refs, evidence refs, consumer, falsifier, reviewability, and does-not-prove
  boundary.
- KRN implication: future UI/search should render read models, not mutate memory
  or scrape raw reports.
- Decision: add docs/contract-only `BrainKnowledgeReadModel` and open V261 to
  guard required fields.
- Does not prove: UI/search implementation, product readiness, or ranking
  quality.
- Consumer: V261 read-model contract guard and future UI/search slices.
- Falsifier: UI/search can display knowledge without source/evidence refs,
  consumer, falsifier, reviewability, or does-not-prove boundary.

## Outcome V261-00 Brain Knowledge Read Model Contract Guard

Summary:
- added `packages/harness/src/brainKnowledgeReadModelInvariants.test.ts`;
- protected required `BrainKnowledgeReadModel` fields;
- kept UI/search behind read-only cards.

Source-to-decision:
- Source: V260 read-model contract and ADR-0025 dashboard readiness gate.
- Mechanism: future UI/search needs a protected read-only knowledge card
  contract before implementation.
- KRN implication: brain UI/search should render guarded read models, not raw
  reports or mutable memory surfaces.
- Decision: add a harness invariant for `BrainKnowledgeReadModel` and open V262
  for one concrete card fixture.
- Does not prove: UI/search implementation, search ranking, product readiness,
  or real operator usefulness.
- Consumer: V262 Brain Knowledge Card Fixture.
- Falsifier: a future UI/search slice can remove required fields or introduce a
  mutation path while the invariant still passes.

## Outcome V262-00 Brain Knowledge Card Fixture

Summary:
- added one JSON `BrainKnowledgeReadModel` card fixture for
  `pattern:ts-boundary-unknown-first-result-state`;
- extended `brainKnowledgeReadModelInvariants` to guard the fixture.

Source-to-decision:
- Source: V260 read-model contract, V261 guard, V257 retained pattern, and V258
  pattern enforcement gate.
- Mechanism: UI/search needs concrete read-only knowledge cards before any
  rendering or ranking surface.
- KRN implication: brain knowledge should become reviewable cards derived from
  retained evidence, not scraped report prose.
- Decision: add one fixture and open V263 for pure readback/filter/search helper.
- Does not prove: UI/search implementation, ranking quality, product readiness,
  or broad knowledge coverage.
- Consumer: V263 Brain Knowledge Card Readback Helper.
- Falsifier: future readback/search must scrape raw reports because no helper
  can load card fixtures.

## Outcome V263-00 Brain Knowledge Card Readback Helper

Summary:
- added `packages/harness/src/brainKnowledgeReadModel.ts`;
- added parser/search tests over the concrete card fixture;
- kept implementation pure and UI/API/MCP-free.

Source-to-decision:
- Source: V260 read-model contract, V261 guard, and V262 card fixture.
- Mechanism: typed card search needs a pure readback helper before UI/API.
- KRN implication: brain knowledge search starts as typed card readback, not raw
  report grep or dashboard-first work.
- Decision: add pure harness helper and open V264 to decide or expose the
  smallest CLI/readback preview.
- Does not prove: CLI surface, web UI, ranking quality, DB-backed card
  production, or product readiness.
- Consumer: V264 Brain Knowledge CLI Readback Preview.
- Falsifier: future card search must parse raw JSON/reports ad hoc because the
  helper cannot load or filter the fixture.

## Outcome V275-00 Brain Knowledge HTML Catalog Breadth Guard

Summary:
- added a focused `runKnowledgeCardsCommand` HTML guard over the full
  `docs/brain-knowledge/catalog.json`;
- protected all current retained pattern cards from disappearing from HTML
  readback;
- guarded visible source refs, evidence refs, falsifier, does-not-prove,
  mutation boundary, and proof boundaries.

Report:
`docs/reviews/controlled-dogfood/2026-06-28-v275-brain-knowledge-html-catalog-breadth-guard/REPORT.md`.

Source-to-decision:
- Source: V273 HTML preview, V274 evidence proof-boundary card, current catalog.
- Mechanism: a pattern brain needs card readback that renders the full retained
  catalog and keeps proof/non-proof boundaries visible.
- KRN implication: UI/search progress should be guarded by catalog breadth and
  proof-boundary tests before adding API/MCP/web surfaces.
- Decision: add a focused HTML catalog breadth guard and open V276 to retain the
  Codex skill-routing mechanism as a cataloged pattern.
- Does not prove: DB-backed card production, ranking quality, web app readiness,
  completeness of retained patterns, or product readiness.
- Consumer: V276 Codex Skill Progressive-Disclosure Pattern Card.
- Falsifier: a future HTML/readback change can omit a retained pattern or hide
  proof boundaries while tests still pass.

## Outcome V276-00 Codex Skill Progressive-Disclosure Pattern Card

Summary:
- added retained pattern
  `docs/patterns/retained-patterns/codex-skill-progressive-disclosure-routing.json`;
- added it to `docs/brain-knowledge/catalog.json`;
- guarded catalog presence and CLI search/readback;
- updated the HTML catalog breadth guard to include the new card.

Report:
`docs/reviews/controlled-dogfood/2026-06-28-v276-codex-skill-progressive-disclosure-pattern-card/REPORT.md`.

Source-to-decision:
- Source: `docs/KRN_SOURCES.md#skills`,
  `docs/runbooks/pattern-intake.md#official-codex-docs-to-skill`,
  `.agents/skills/source-to-decision/SKILL.md`, and
  `.agents/skills/typescript-type-safety/SKILL.md`.
- Mechanism: Codex skills package reusable workflows through progressive
  disclosure; KRN skills can query retained brain knowledge before
  implementation.
- KRN implication: repeated workflows should live in narrow repo-local skills
  with retained-pattern readback, not giant prompts, root plans, or `AGENTS.md`.
- Decision: retain `codex-skill-progressive-disclosure-routing` and open V277
  to route Codex adapter/brief work through the card.
- Does not prove: automatic skill selection, that many skills are useful by
  default, or product readiness.
- Consumer: V277 Codex Adapter Skill Routing Readback Hook.
- Falsifier: repeated KRN workflows still require copying long prompt blocks
  into chat/root plans/`AGENTS.md`, or relevant skills cannot query retained
  brain knowledge before implementation.

## Outcome V277-00 Codex Adapter Skill Routing Readback Hook

Summary:
- updated `.agents/skills/codex-adapter-plan/SKILL.md` to query the retained
  `codex-skill-progressive-disclosure-routing` card before skill-hint,
  `AGENTS.md` pointer, reusable brief, or Codex-facing instruction changes;
- guarded the readback hook in `packages/harness/src/skillInvariants.test.ts`.

Report:
`docs/reviews/controlled-dogfood/2026-06-28-v277-codex-adapter-skill-routing-readback-hook/REPORT.md`.

Source-to-decision:
- Source: V276 retained pattern card, V270 skill readback hook, and
  `.agents/skills/codex-adapter-plan/SKILL.md`.
- Mechanism: Codex adapter/brief work is where skill hints and reusable
  execution guidance are rendered.
- KRN implication: adapter work should read the retained skill-routing pattern
  before changing brief/skill guidance.
- Decision: add a read-only catalog hook to the Codex adapter skill, not hidden
  automatic routing.
- Does not prove: automatic skill selection, better briefs by default, or
  product readiness.
- Consumer: V278 Codex Adapter Skill Routing Dogfood.
- Falsifier: adapter/brief work can change skill hints or reusable instructions
  without reading or explicitly rejecting the skill-routing card.

## Outcome V278-00 Codex Adapter Skill Routing Dogfood

Summary:
- used the `progressive-disclosure` catalog card before changing Codex adapter
  skill hints;
- added `patternRefs` to `CodexSkillBindingHint`;
- rendered `pattern:codex-skill-progressive-disclosure-routing` in execution
  brief skill hints;
- guarded typed artifact and text output in codex-adapter tests.

Report:
`docs/reviews/controlled-dogfood/2026-06-28-v278-codex-adapter-skill-routing-dogfood/REPORT.md`.

Source-to-decision:
- Source: V276 retained pattern card and V277 adapter skill readback hook.
- Mechanism: skill hints reach Codex through execution briefs; without pattern
  refs, retained knowledge is invisible at the execution boundary.
- KRN implication: Codex-facing skill hints should expose the retained pattern
  that justifies routing.
- Decision: add read-only `patternRefs` to skill hints and render them.
- Does not prove: automatic skill selection, DB-backed smoke coverage, or
  product readiness.
- Consumer: V279 Codex Adapter Skill Pattern Smoke Readback.
- Falsifier: DB-backed adapter smoke/readback can render skill hints without
  retained pattern refs and tests still pass.

## Outcome V279-00 Codex Adapter Skill Pattern Smoke Readback

Summary:
- added `renderedSkillPatternRefs` to `CodexAdapterSmokeReport`;
- made DB-backed Codex adapter smoke fail if rendered execution briefs omit
  `pattern:codex-skill-progressive-disclosure-routing`;
- report output now includes `Skill pattern refs present: yes/no`.

Report:
`docs/reviews/controlled-dogfood/2026-06-28-v279-codex-adapter-skill-pattern-smoke-readback/REPORT.md`.

Source-to-decision:
- Source: V278 adapter skill routing dogfood and current DB-backed adapter
  smoke.
- Mechanism: DB-backed adapter smoke is the strongest local proof that
  persisted KRN state can be rendered into a bounded Codex execution brief.
- KRN implication: retained pattern refs must survive persisted
  plan/readback/render, not only unit renderers.
- Decision: add skill-pattern-ref readback to adapter smoke proof.
- Does not prove: automatic skill selection, that Codex follows the hint,
  pattern ranking quality, or product readiness.
- Consumer: V280 Pattern Brain Readiness Re-Gate.
- Falsifier: adapter smoke can pass while rendered skill hints omit retained
  pattern refs.

## Outcome V280-00 Pattern Brain Readiness Re-Gate

Summary:
- classified pattern brain as an internal-alpha spine, not product-ready;
- confirmed V275-V279 connected retained patterns to HTML/CLI readback, skill
  hooks, adapter pattern refs, and DB-backed adapter smoke;
- selected V281 Brain Knowledge Web Search Readiness Gate as the next
  highest-ROI slice.

Report:
`docs/reviews/controlled-dogfood/2026-06-28-v280-pattern-brain-readiness-regate/REPORT.md`.

Source-to-decision:
- Source: V275-V279 reports, current `BrainKnowledgeReadModel` readback, skill
  hooks, adapter pattern refs, and DB-backed adapter smoke proof.
- Mechanism: the pattern brain now has a retained-pattern-to-brief spine, but
  web/search and continuous research condensation remain separate product
  surfaces.
- KRN implication: the next slice should gate the smallest read-only web/search
  path instead of adding random patterns or jumping to dashboard/API/MCP.
- Decision: open V281 Brain Knowledge Web Search Readiness Gate.
- Does not prove: product readiness, search ranking quality, automatic skill
  selection, or completeness of retained patterns.
- Consumer: V281 Brain Knowledge Web Search Readiness Gate.
- Falsifier: the project jumps from HTML preview to dashboard/API/MCP without a
  read-only web/search readiness decision and falsifier.

## Outcome V281-00 Brain Knowledge Web Search Readiness Gate

Summary:
- added `docs/decisions/ADR-0028-brain-knowledge-web-search-readiness-gate.md`;
- guarded ADR-0028 through
  `packages/harness/src/brainKnowledgeReadModelInvariants.test.ts`;
- accepted static/read-only web search over `BrainKnowledgeReadModel` cards as
  the next valid UI/search step;
- kept dashboard/API/MCP/source-crawler/mutation surfaces rejected for now.

Report:
`docs/reviews/controlled-dogfood/2026-06-28-v281-brain-knowledge-web-search-readiness-gate/REPORT.md`.

Source-to-decision:
- Source: `docs/architecture/observability-read-models.md`,
  `docs/decisions/ADR-0025-dashboard-readiness-gate.md`, V273 HTML preview,
  V275 HTML catalog breadth guard, and V280 pattern brain readiness re-gate.
- Mechanism: operator-facing knowledge search currently needs typed read-only
  cards; services and mutation add product surface before usefulness proof.
- KRN implication: build the static/read-only preview path first.
- Decision: accept ADR-0028 and open V282 for a static web preview artifact.
- Does not prove: product readiness, search ranking quality, web UI usefulness,
  completeness of retained knowledge, or live DB/API/MCP need.
- Consumer: V282 Brain Knowledge Static Web Preview Artifact.
- Falsifier: static artifact cannot reduce rereads or review burden in dogfood,
  while operators repeatedly need live DB/API-backed interaction.

## Outcome V282-00 Brain Knowledge Static Web Preview Artifact

Summary:
- added root script `pnpm brain:knowledge:preview`;
- the script generates `.local-lab/brain-knowledge-preview.html` from
  `docs/brain-knowledge/catalog.json`;
- guarded the script in `brainKnowledgeReadModelInvariants` so it remains
  catalog-backed, HTML-producing, local, non-persistent, and not a
  dashboard/API/MCP surface;
- generated artifact readback confirmed non-empty HTML with all four current
  retained pattern cards plus `Mutation: none` and proof boundaries.

Report:
`docs/reviews/controlled-dogfood/2026-06-28-v282-brain-knowledge-static-web-preview-artifact/REPORT.md`.

Source-to-decision:
- Source: ADR-0028, `BrainKnowledgeReadModel`, V273 HTML preview, V275 catalog
  breadth guard, and V281 web-search readiness gate.
- Mechanism: operator-facing brain knowledge search needs a repeatable
  read-only artifact path before API, MCP, dashboard, or DB-backed UI work.
- KRN implication: expose the existing `knowledge cards --html` renderer as a
  root command that generates a local artifact from the explicit catalog.
- Decision: open V283 to test static preview usefulness before wider UI/search
  surfaces.
- Does not prove: product readiness, search usefulness in a browser session,
  search ranking quality, knowledge completeness, or need for API/MCP/dashboard.
- Consumer: V283 Brain Knowledge Static Preview Usefulness Dogfood.
- Falsifier: the static preview does not help operators answer real pattern or
  proof-boundary questions faster than CLI/grep/rereads.

## Outcome V283-00 Brain Knowledge Static Preview Usefulness Dogfood

Summary:
- generated `.local-lab/brain-knowledge-preview.html`;
- queried the catalog-backed read model for `skill`, `proof`,
  `source-to-decision`, and `unknown-first`;
- confirmed direct queries like `proof` and `unknown-first` land on one useful
  retained pattern card;
- found broad terms like `skill` are noisy because current text search matches
  all card fields equally.

Report:
`docs/reviews/controlled-dogfood/2026-06-28-v283-brain-knowledge-static-preview-usefulness-dogfood/REPORT.md`.

Source-to-decision:
- Source: generated V282 static artifact and catalog-backed `knowledge cards`
  readback queries.
- Mechanism: exact retained-pattern lookup reduces rereads, but unrestricted
  full-field text matching creates noisy results as the catalog grows.
- KRN implication: improve static preview ergonomics with field/facet controls
  before adding API, MCP, dashboard, or DB search.
- Decision: open V284 Brain Knowledge Static Preview Field Filters.
- Does not prove: product readiness, browser UX quality, ranking quality,
  larger-catalog relevance, DB/API/MCP need, or catalog completeness.
- Consumer: V284 Brain Knowledge Static Preview Field Filters.
- Falsifier: field filters do not reduce noisy broad searches or require a
  non-static server/API/DB path.

## Condensation Rules

After every bounded slice:

1. Add at most one compact outcome block here.
2. Link the detailed report instead of pasting it.
3. Keep only active blockers and next tasks.
4. Archive if this file grows beyond useful resume size.
5. Never hide evidence deletion as condensation.
6. Update `PLAN.md` / `GOAL.md` only with compact active pointers.

## Verification Policy

Use the narrowest relevant verification for each slice.

Docs/plan-only changes:

```sh
git diff --check
pnpm --filter @krn/harness test -- contextHygieneInvariants activePlanInvariants patternChainInvariants
```

Source changes:

```sh
pnpm typecheck
pnpm test
git diff --check
```

DB/eval-affecting changes:

```sh
pnpm db:ready
pnpm db:smoke
pnpm eval:promptfoo:smoke
```

If Vitest or workspace tests fail with a temporary-directory write error, set
`TMPDIR` outside this repository, for example:

```sh
TMPDIR=/home/krn/.cache/krn-tmp pnpm test
```

After each bounded slice: commit, push, and confirm CI when appropriate.

## Continuation Protocol

After auto-compact, resume, or a new `/goal` continuation:

1. Read `GOAL.md`, `PLAN.md`, and `PLANS.md`.
2. Run:

   ```sh
   git fetch --prune
   git status --short --branch
   git log --oneline -n 8
   ```

3. If a previous slice was committed but not pushed or CI-checked, finish that
   before unrelated work.
4. Return to the first incomplete active task in this file.
5. If a pasted objective or conversation summary conflicts with current root
   active state, treat it as historical evidence and do not roll the stream
   backward.

## 21. Final Response Format For Codex Runs

Every continuation or completed slice must end with:

```txt
Read:
- ...

Changed:
- ...

Commands run:
- ...

Reports/artifacts:
- ...

DB used:
- yes/no; if yes, commands and DB URL class

Commits/CI:
- ...

What this proves:
- ...

What this does not prove:
- ...

Condensation decisions:
- ...

Tasks appended to PLANS.md:
- ...

Next active task:
- ...

Blocked/budget-limited:
- yes/no; if yes, what unlocks progress
```

## 22. Compact GOAL.md Contract To Pair With This Plan

The root `GOAL.md` should not duplicate this file. It should say only:

```txt
Current objective: execute KRN Continuous Brain Growth from PLANS.md.
Active stream: <current active stream from PLAN.md>.
Read: PLAN.md, GOAL.md, PLANS.md.
Continue by evidence. After every slice, update PLANS.md and append next tasks.
For every non-trivial infra, harness, CI, eval, Codex-surface, TypeScript,
target-workflow, or research/paper/course-driven slice, apply the pattern gate:
source -> mechanism -> KRN implication -> decision/rejection -> consumer -> falsifier.
If pasted objectives, attachments, old prompts, or summaries conflict with root
active state, read them as historical evidence and do not roll the active stream backward.
Do not mark complete after one slice. Complete only on explicit operator stop,
product-ready gate, or budget/blocker handoff.
```

## 23. Plan Revision Note

2026-06-27: Created generic continuous `PLANS.md` after V04 completed. At creation time it converted KRN from one-off long-run batches into a continuously growing evidence-driven product plan.

2026-06-28: V255 condensed the active ledger and archived historical detail.
