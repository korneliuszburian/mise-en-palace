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
active stream: V257 Pattern Intake Trial
current task: V257-00 Pattern Intake Trial
latest pushed commit: b2ccbaf test(target): make normalized substrate replayable
latest CI checked: KRN CI success for b2ccbaf279409f24b01d150dcbecb0f92324b048
```

Known current gap:

```txt
V257-00 Pattern Intake Trial is the current gap. V256 proved the replayable
target substrate can drive a weak-baseline repair; now the repeated TypeScript
boundary pattern must become durable brain knowledge with consumer, falsifier,
and enforcement/eval candidate.
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
UI/search over brain knowledge: not started as product surface
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

Status: active.

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

Status: queued.

Goal:

```txt
Add the smallest falsifiable guard/eval/test that checks whether a selected
pattern is applied in a target repair scenario.
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

Status: queued.

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

Status: queued.

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
- V257-00 active: turn the repeated TypeScript boundary pattern into a
  source-to-decision object and enforcement/eval candidate.

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
