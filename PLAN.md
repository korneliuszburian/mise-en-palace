# KRN Product Push V03 Plan

Status: active root `PLAN.md` and single source of truth for the
operator-authorized V03 product-forward continuation while V02-01 is blocked.

Date: 2026-06-26.

Repository target: `/home/krn/coding/krn/active/mise-en-palace`.

This file is the checked-in execution map. Do not create `PLANS.md`,
`ROADMAP.md`, or another parallel roadmap.

---

## 1. Current Baseline

The previous product autopilot queue is complete:

- V02-03 through V02-08 are complete, pushed, and CI-confirmed.
- KRN remains `controlled-internal-alpha for technical operators`.
- KRN is not product-ready.
- KRN is not widened-internal-alpha.
- V02-01 remains blocked/deferred because it requires real external inputs.

V02-01 must not be marked complete without:

```txt
operator:
KRN source:
target repo:
DB mode:
support boundary:
operator transcript:
```

Latest product friction: local `pnpm db:ready` failed with
`CONNECT_TIMEOUT localhost:54329` during V02-08, while remote CI DB readiness
and smoke passed. Treat this as product evidence: local operator bootstrap is
still too fragile or insufficiently guided.

---

## 2. V03 Product Thesis

V03 is a product-reality push, not another planning layer.

The sequence is:

```txt
local DB bootstrap clarity
  -> target fixture battle harness
  -> exact target owner-file recall below roots
  -> target evidence/readback loop
  -> target memory usefulness loop
  -> first-run/operator friction repair
  -> re-gate
```

This continues the product north star:

```txt
krn init turns any repo into an agent-ready, source-grounded,
memory-aware, eval-driven, reviewable Codex CLI working environment.
```

---

## 3. Hard Guardrails

Do not build unless a named V03 task authorizes it:

- dashboard;
- API server;
- MCP server;
- worker daemon/background loop;
- source crawler;
- broad eval platform;
- broad benchmark lane;
- `krn audit` resurrection;
- anti-slop scanner;
- generic multi-agent framework;
- stack-specific agent zoo;
- LLM-as-judge release gate;
- automatic memory/source mutation;
- npm/global distribution;
- alpha tag movement;
- Codex execution automation;
- fake second-operator proof.

Do not fake local DB truth. If local Postgres is unavailable, KRN must say that
honestly and provide the smallest next command/remediation.

Do not fake external target-repo proof. A local fixture repo is allowed only as
a deterministic product behavior guard, not as V02-01 or broad external proof.

---

## 4. Authorized V03 Queue

### V03-00 — Local DB Bootstrap And Doctor Recovery

Goal: reduce the most recent operator friction: local DB readiness failed with
`CONNECT_TIMEOUT localhost:54329` even though CI DB passed.

Status: complete on 2026-06-26.

Required behavior:

1. Inspect current DB readiness, DB smoke, doctor, `compose.yaml`, runbooks,
   package scripts, and CI DB workflow.
2. Improve the operator-facing diagnosis for missing/unreachable local Postgres.
3. Ensure output distinguishes preview/no-DB mode, DB configured but
   unreachable, DB connected but migrations/extensions not ready, and DB ready.
4. Provide actionable next commands without mutating state unexpectedly.
5. Add deterministic tests where possible.

Expected outputs:

- compact `PLAN.md` and `GOAL.md` updates. Status: complete.
- source or docs changes only where product friction requires them. Status: complete.
- report:
  `docs/reviews/controlled-dogfood/2026-06-26-local-db-bootstrap-doctor-recovery/REPORT.md`.
  Status: complete.

Verification:

```sh
pnpm typecheck
pnpm test
pnpm alpha:verify
pnpm eval:brain-battle:smoke
pnpm eval:promptfoo:smoke
git diff --check
git status --short --branch
```

Optional if local DB is available:

```sh
pnpm db:ready
pnpm db:smoke
```

If local DB remains unreachable, record it honestly and rely on remote CI DB
after push.

Acceptance:

- Missing local Postgres no longer looks like ambiguous product failure. Status: complete.
- Operator sees exactly what to run next. Status: complete.
- No DB mutation is hidden inside doctor/diagnosis. Status: complete.
- No product-ready or external-proof claim. Status: complete.

Outcome: `krn db readiness` now reports `DB mode` and recovery commands for
preview/no-DB, configured-but-unreachable, connected-but-not-ready, and ready
states. `krn doctor` now reports `Postgres mode` and `Postgres next action`.
The V02-08 local `CONNECT_TIMEOUT localhost:54329` state was reproduced and
recovered by starting `krn-postgres`; local `pnpm db:ready`, `pnpm db:smoke`,
and DB-backed doctor then passed.

Evidence: `packages/cli/src/dbRecoveryGuidance.ts`;
`packages/cli/src/runDbReadinessCommand.ts`;
`packages/cli/src/doctorDbChecks.ts`; `docs/runbooks/local-brain-store.md`;
`docs/reviews/controlled-dogfood/2026-06-26-local-db-bootstrap-doctor-recovery/REPORT.md`.

---

### V03-01 — Target Fixture Battle Harness

Goal: create a deterministic, local target-repo fixture that protects target
init/connect/plan behavior without pretending it is a real external operator
trial.

Status: complete on 2026-06-26.

Expected outputs:

- fixture/test/guard updates;
  Status: complete.
- optional brain-battle matrix update;
  Status: complete.
- report:
  `docs/reviews/controlled-dogfood/2026-06-26-target-fixture-battle-harness/REPORT.md`.
  Status: complete.

Acceptance:

- Fixture guard is deterministic and CI-runnable.
  Status: complete.
- It does not claim external target proof or V02-01 completion.
  Status: complete.
- It does not introduce a crawler or broad eval platform.
  Status: complete.

Outcome: `tests/fixtures/target-repos/typescript-basic` now includes
target-local agent guidance, README, runbook docs, source, tests,
secret-shaped example config, and generated/runtime-shaped fixture paths.
`db:smoke:target-repo-harness` now persists and readbacks target source seeds
and trust exclusions. `eval:brain-battle:smoke` now includes
`golden-case-target-fixture-battle-001-a` to guard fixture planning behavior.

Evidence: `tests/fixtures/target-repos/typescript-basic/AGENTS.md`;
`packages/cli/src/targetRepoHarnessSmoke.ts`;
`packages/harness/src/goldenKrnBehaviorGate.ts`;
`docs/architecture/brain-battle-eval-matrix.md`;
`docs/reviews/controlled-dogfood/2026-06-26-target-fixture-battle-harness/REPORT.md`.

---

### V03-02 — Target Owner-File Recall Below Named Roots

Goal: address the known remaining limit that target read-model can surface
named roots while exact file recall below roots remains weak/unknown.

Status: complete on 2026-06-26.

Expected outputs:

- targeted implementation or guard-only proof;
  Status: complete.
- tests/brain-battle guard;
  Status: complete.
- report:
  `docs/reviews/controlled-dogfood/2026-06-26-target-owner-file-recall-below-roots/REPORT.md`.
  Status: complete.

Acceptance:

- Target project planning no longer stops at vague root-level hints when a
  bounded owner-file candidate can be inferred.
  Status: complete when `ownerFiles` are present in the target read model.
- If exact owner-file inference is not safe, output explains the missing signal.
  Status: complete.
- No crawler, scoring rewrite, or broad retrieval rewrite.
  Status: complete.

Outcome: `TargetActivationReadModel` now accepts explicit `ownerFiles`.
Target activation emits `targetReadModelKind=owner_file` candidates below named
roots when that signal is present, and `krn plan --project` reports
`ownerFiles=0` plus an unavailable-owner-files warning when exact owner-file
signals are absent. The target harness smoke now persists and readbacks fixture
owner files alongside source seeds and trust exclusions.

Evidence: `packages/harness/src/activation/ownerFileRecall.ts`;
`packages/harness/src/compiler/index.test.ts`;
`packages/harness/src/goldenKrnBehaviorGate.ts`;
`packages/cli/src/runPlanCommand.ts`;
`packages/cli/src/targetRepoHarnessSmoke.ts`;
`docs/reviews/controlled-dogfood/2026-06-26-target-owner-file-recall-below-roots/REPORT.md`.

---

### V03-03 — Target Evidence Capture And Readback Loop

Goal: prove a target-like run can move from plan to evidence capture to readback
with honest proof/non-proof boundaries.

Status: active.

Expected outputs:

- source/test/guard changes if required;
- report:
  `docs/reviews/controlled-dogfood/2026-06-26-target-evidence-readback-loop/REPORT.md`.

Acceptance:

- Target-like evidence can be read back without ad hoc SQL.
- Proof/non-proof boundaries survive the full loop.
- No automatic memory/source mutation.

---

### V03-04 — Target Memory Usefulness Loop

Goal: make memory usefulness measurable for target-like tasks without
auto-promoting memory.

Status: pending.

Expected outputs:

- deterministic tests/guards;
- optional eval matrix update;
- report:
  `docs/reviews/controlled-dogfood/2026-06-26-target-memory-usefulness-loop/REPORT.md`.

Acceptance:

- KRN can measure whether memory helped a target-like task.
- Stale/hurt memory does not silently remain trusted.
- No automatic Memory Core mutation bypasses review.

---

### V03-05 — First-Run Operator Friction Repair

Goal: reduce first-run ambiguity before a real second operator tries V02-01.

Status: pending.

Expected outputs:

- source/docs changes as needed;
- report:
  `docs/reviews/controlled-dogfood/2026-06-26-first-run-operator-friction-repair/REPORT.md`.

Acceptance:

- A technical operator has fewer ambiguous states before V02-01.
- No product-ready, npm/global install, alpha tag move, dashboard, API, MCP, or
  worker runtime.

---

### V03-06 — Controlled Alpha Re-Gate After V03

Goal: convert V03 evidence into the next honest readiness decision.

Status: pending.

Expected outputs:

- compact `PLAN.md` and `GOAL.md` updates;
- report:
  `docs/reviews/controlled-dogfood/2026-06-26-controlled-alpha-re-gate-after-v03/REPORT.md`.

Acceptance:

- Readiness classification is honest.
- The next action is specific.
- No product-ready claim unless evidence actually satisfies product-ready gates.

---

## 5. Shared Verification

Unless a slice states a narrower docs-only verification, run:

```sh
pnpm typecheck
pnpm test
pnpm eval:brain-battle:smoke
pnpm eval:promptfoo:smoke
git diff --check
git status --short --branch
```

Use `pnpm alpha:verify` when operator install/readiness behavior is touched or
when the slice explicitly requires it.

Use DB commands only when meaningful:

```sh
pnpm db:ready
pnpm db:smoke
```

Do not claim current-shell DB truth unless those commands pass in the current
shell.

---

## 6. Completion Rule

This continuous product push is complete only when one of these is true:

- V03-00 through V03-06 are complete, verified, pushed, and CI-confirmed where
  relevant;
- V02-01 receives real external setup and supersedes this rescope queue;
- verification blocks further safe work;
- the next step requires an unauthorized product surface or external input;
- the operator explicitly stops or rescopes.
