# KRN Product Push Autopilot PLAN

Status: active root `PLAN.md` and single source of truth for the operator-authorized V02 product-forward continuation while V02-01 is blocked.

Date: 2026-06-26.

Repository target: `/home/krn/coding/krn/active/mise-en-palace`.

This file is the checked-in execution map. Do not create `PLANS.md`, `ROADMAP.md`, or another parallel roadmap.

---

## 1. Operator Intent

The operator explicitly authorizes continuous product-forward execution while `V02-01 — Real Second-Operator Controlled Alpha Trial` remains blocked by missing real external inputs.

The desired mode is:

```txt
keep pushing product evidence
  -> execute bounded slice
  -> verify
  -> commit
  -> push
  -> check CI when relevant
  -> update PLAN.md / GOAL.md compactly
  -> continue to the next unblocked product slice
```

Do not stop just because one task completed. Stop only for a real blocker, missing external input, unsafe scope, unrecoverable verification failure, or explicit operator stop/rescope.

This authorization does **not** allow fake evidence, broad platform creep, or new product surfaces without named tasks.

---

## 2. Product North Star

KRN should keep moving toward the final product:

```txt
krn init turns any repo into an agent-ready, source-grounded,
memory-aware, eval-driven, reviewable Codex CLI working environment.
```

KRN is not trying to win by adding more context, more docs, or more agents.

KRN wins by improving the operating brain around Codex:

- context selection;
- target owner/read-model recall;
- trust exclusions;
- memory application and anti-memory;
- source-to-decision discipline;
- Codex execution briefs;
- evidence capture;
- proof/non-proof readback;
- review burden and diff risk;
- dogfood-derived eval guards.

Every slice should either improve one of those behaviors or prove that the current behavior is good enough for the next gate.

---

## 3. Hard Guardrails

Never mark `V02-01` complete without real external setup:

```txt
operator:
KRN source:
target repo:
DB mode:
support boundary:
operator transcript:
```

Do not build unless a named task in root `PLAN.md` authorizes it:

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
- Codex execution automation.

Prefer small deterministic behavior guards, targeted repairs, CLI/operator UX improvements, and readiness gates over additional planning documents.

---

## 4. Authorized Continuous Queue

### V02-03 — Run Readback And Source Rejection Guard Expansion

Goal: protect two trust-critical boundaries proposed by V02-02.

Status: complete on 2026-06-26.

Required behavior:

1. `krn run show` / JSON readback preserves proof-vs-non-proof separation.
2. Source retention rejects decorative sources or enforces mechanism / KRN implication / consumer / falsifier / does-not-prove discipline.

Expected outputs:

- compact `PLAN.md` and `GOAL.md` updates. Status: complete.
- update `docs/architecture/brain-battle-eval-matrix.md`. Status: complete.
- deterministic guard(s) through existing GoldenTask / Promptfoo / test machinery. Status: complete through `eval:brain-battle:smoke`.
- report: `docs/reviews/controlled-dogfood/2026-06-26-run-readback-source-rejection-guards/REPORT.md`. Status: complete.

Verification:

```sh
pnpm eval:brain-battle:smoke
pnpm typecheck
pnpm test
pnpm eval:promptfoo:smoke
git diff --check
git status --short --branch
```

Non-goals: no broad eval platform, no dashboard/API/MCP, no LLM-as-judge requirement, no fake second-operator proof.

Outcome: `eval:brain-battle:smoke` now runs both harness GoldenGate behavior and CLI run readback guards. GoldenGate protects decorative source rejection through source review signals. CLI readback tests protect proof-vs-non-proof separation so readback proof does not claim command execution, memory quality, source truth, review correctness, product readiness, or Memory Core mutation.

Evidence: `docs/architecture/brain-battle-eval-matrix.md`; `packages/harness/src/goldenKrnBehaviorGate.ts`; `packages/harness/src/goldenKrnBehaviorGate.test.ts`; `packages/cli/src/runRunShowCommand.test.ts`; `docs/reviews/controlled-dogfood/2026-06-26-run-readback-source-rejection-guards/REPORT.md`.

---

### V02-04 — Memory Feedback And Anti-Memory Guard Expansion

Goal: protect the memory learning loop from poisoning and silent mutation.

Status: complete on 2026-06-26.

Required behavior:

1. helped/neutral feedback does not create unsafe follow-up mutation;
2. stale/hurt feedback with lineage creates reviewable candidate semantics, not direct Memory Core mutation;
3. reviewed anti-memory blocks stale/unsafe context or surfaces explicit exclusion/warning during activation.

Expected outputs:

- update brain-battle matrix. Status: complete.
- deterministic guard(s) through existing test/eval machinery. Status: complete through `eval:brain-battle:smoke`.
- report: `docs/reviews/controlled-dogfood/2026-06-26-memory-anti-memory-guards/REPORT.md`. Status: complete.

Verification:

```sh
pnpm eval:brain-battle:smoke
pnpm typecheck
pnpm test
pnpm eval:promptfoo:smoke
git diff --check
git status --short --branch
```

Non-goals: no memory scoring rewrite, no reflection rewrite, no automatic memory/source mutation, no new DB architecture.

Outcome: `krn memory record apply` now reports `Memory Core mutation: none` in preview and persisted output. CLI guards cover helped feedback producing no feedback event or follow-up candidate, and stale/hurt feedback producing negative feedback plus a reviewable anti-memory candidate without Memory Core mutation. The brain-battle smoke now includes the CLI memory feedback guards alongside GoldenGate and run readback guards.

Evidence: `packages/cli/src/runMemoryRecordApplyCommand.ts`; `packages/cli/src/runCli.test.ts`; `package.json`; `docs/architecture/brain-battle-eval-matrix.md`; `docs/reviews/controlled-dogfood/2026-06-26-memory-anti-memory-guards/REPORT.md`.

---

### V02-05 — Codex Brief And Context ROI Guard Expansion

Goal: protect the Codex-facing execution contract and context discipline.

Status: complete on 2026-06-26.

Required behavior:

1. Codex brief includes objective, constraints, non-goals, selected context, exclusions, expected evidence, review burden, rollback, and proof boundaries.
2. Context assembly rejects broad dumps and requires reason + expectedUse for included context.
3. Excluded context keeps explicit reasons where supported: trust, stale, over-budget, duplicate, irrelevant, unsafe, superseded.

Expected outputs:

- update brain-battle matrix. Status: complete.
- deterministic guard(s) through GoldenTask / brain-battle smoke / unit tests. Status: complete through `eval:brain-battle:smoke`.
- report: `docs/reviews/controlled-dogfood/2026-06-26-codex-brief-context-roi-guards/REPORT.md`. Status: complete.

Verification:

```sh
pnpm eval:brain-battle:smoke
pnpm typecheck
pnpm test
pnpm eval:promptfoo:smoke
git diff --check
git status --short --branch
```

Non-goals: no prompt bloat rewrite, no activation scoring rewrite unless a failing guard proves a focused defect, no source crawler.

Outcome: `eval:brain-battle:smoke` now runs Codex adapter golden behavior for brief contract fields and GoldenGate ContextROI behavior. The guard verifies Codex brief context keeps reason, expected use, explicit exclusion explanation, rollback, stop condition, and proof boundaries. ContextROI guard verifies a one-item budget keeps only bounded selected context and records over-budget exclusions.

Evidence: `package.json`; `packages/codex-adapter/src/codexBriefGoldenBehavior.test.ts`; `packages/harness/src/goldenKrnBehaviorGate.ts`; `packages/harness/src/goldenKrnBehaviorGate.test.ts`; `docs/architecture/brain-battle-eval-matrix.md`; `docs/reviews/controlled-dogfood/2026-06-26-codex-brief-context-roi-guards/REPORT.md`.

---

### V02-06 — Operator-Facing Readback / Doctor Friction Repair

Goal: reduce known operator ambiguity without building a dashboard or changing packaging.

Status: complete on 2026-06-26.

Required behavior:

- inspect `krn run show`, `krn doctor`, runbooks, and release notes. Status: complete.
- repair only evidence-backed confusion around proof boundaries, DB/preview mode, verification commands, ignored install warnings, or stale alpha language. Status: complete.
- add/update tests only where behavior changed. Status: complete.
- report: `docs/reviews/controlled-dogfood/2026-06-26-operator-readback-doctor-friction/REPORT.md`. Status: complete.

Verification:

```sh
pnpm typecheck
pnpm test
pnpm eval:brain-battle:smoke
pnpm eval:promptfoo:smoke
git diff --check
git status --short --branch
```

Non-goals: no npm/global install, no tag movement, no dashboard/API/MCP, no source workspace packaging rewrite unless a blocker proves it.

Outcome: `krn run show` now gives an operator-facing DB unblock path when `KRN_DATABASE_URL` is missing, and `krn run --help` names the persisted-run / DB prerequisite plus `pnpm db:ready`. This keeps readback read-only and does not change persistence or doctor semantics.

Evidence: `packages/cli/src/runRunShowCommand.ts`; `packages/cli/src/parseRunArgs.ts`; `packages/cli/src/runCli.test.ts`; `docs/reviews/controlled-dogfood/2026-06-26-operator-readback-doctor-friction/REPORT.md`.

---

### V02-07 — Target Battle Trial Packet Refresh

Goal: make the next real target/second-operator trial fast, measurable, and hard to fake.

Required behavior:

- update or add a runbook only if it reduces execution ambiguity;
- define 3–5 bounded target trial scenarios with expected context roots, trust exclusions, allowed writes, verification commands, review-burden fields, and does-not-prove boundary;
- do not claim this completes V02-01;
- report: `docs/reviews/controlled-dogfood/2026-06-26-target-battle-trial-packet-refresh/REPORT.md`.

Verification:

```sh
git diff --check
pnpm typecheck
pnpm test
git status --short --branch
```

Non-goals: no fake operator proof, no broad benchmark lane, no source crawler, no new target writes.

---

### V02-08 — Controlled Alpha Re-Gate After Brain Battle Guards

Goal: decide whether current `main` is still controlled-internal-alpha ready, widened-alpha deferred, dogfood-only, or not-ready after V02-02 through V02-07.

Required behavior:

- inspect V01/V02 reports, CI status, runbooks, release notes, brain-battle matrix, and completion gates;
- classify readiness honestly;
- list exact blockers and next allowed action;
- state what this does not prove;
- do not claim product-ready;
- do not move tags unless explicitly authorized later;
- report: `docs/reviews/controlled-dogfood/2026-06-26-controlled-alpha-re-gate-after-brain-battle/REPORT.md`.

Verification:

```sh
pnpm alpha:verify
pnpm eval:brain-battle:smoke
pnpm eval:promptfoo:smoke
git diff --check
git status --short --branch
```

DB verification:

- If local DB is available, run `pnpm db:ready` and `pnpm db:smoke`.
- If local DB is unavailable, do not claim current-shell DB truth. Rely only on remote CI DB status and mark local DB as unverified.

---

## 5. Allowed Repair Rule

If a deterministic guard fails, implement the smallest source repair needed to make the real behavior pass only when all are true:

- the guard protects an existing KRN behavior boundary;
- the repair does not introduce a forbidden product surface;
- the repair does not broaden scope beyond the failing boundary;
- package/public surfaces remain consistent;
- the report explains failure, repair, verification, and what remains unproven.

Do not perform broad rewrites. Do not turn one failing guard into a subsystem.

---

## 6. Completion Rule

This continuous product push is complete only when one of these is true:

- V02-03 through V02-08 are complete, verified, pushed, and CI-confirmed where relevant;
- V02-01 receives real external setup and supersedes the rescope queue;
- verification blocks further safe work;
- the next step requires an unauthorized product surface;
- the operator explicitly stops or rescopes.
