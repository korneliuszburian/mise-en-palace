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
active stream: V266 Brain Knowledge Pattern-File CLI Preview
current task: V266-00 Brain Knowledge Pattern-File CLI Preview
latest pushed commit before V265: e227ff0 feat(readmodel): preview brain knowledge cards
latest CI checked before V265: KRN CI success for e227ff047610a3ecbbb700d4e65f48ab5b76b823
```

Known current gap:

```txt
V266-00 Brain Knowledge Pattern-File CLI Preview is the current gap. V265 added
a deterministic retained-pattern -> BrainKnowledgeReadModel producer; now the
CLI preview should read explicit retained-pattern files directly, or reject
that surface if it would become broad ingestion.
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

Status: active.

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
- V266-00 active: connect explicit retained pattern files to CLI readback.

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
