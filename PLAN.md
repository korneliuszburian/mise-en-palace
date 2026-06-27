# KRN Active Plan

Status: active compact root plan.

Date: 2026-06-27.

Repository: `/home/krn/coding/krn/active/mise-en-palace`.

Root `PLAN.md` is the product single source of truth. Detailed continuous
execution lives in:

```txt
PLANS.md
```

Do not create another parallel roadmap.

## Current Product State

Completed:

- V02-03 through V02-08 product-forward slices.
- V03-00 through V03-06 controlled-internal-alpha hardening.
- V04-00 through V04-07 internal brain utility, scenario factory, skill-first
  KRN, surface screening, and re-gate.

Current readiness:

```txt
controlled-internal-alpha for technical operators: yes / stronger
product-ready: no
widened internal alpha: no
V02-01 real second-operator proof: blocked/deferred
active stream: V05 target-aware evidence capture repair
```

V02-01 can resume only with real second-operator inputs:

```txt
operator:
KRN source:
target repo:
DB mode:
support boundary:
operator transcript:
```

Do not substitute self/headless scenarios for V02-01.

## Active Stream: V05

V05 repairs the current target-trial evidence gap:

```txt
KRN evidence capture and readback must distinguish:
  KRN repo changes
  target repo evidence
  target dirty state before/after
  owned vs external target changes
  allowed/forbidden target writes
  target command proof
  what target evidence proves and does not prove
```

This is a KRN source/product repair stream. It is not a target repo repair, not
V02-01, and not product-readiness proof.

## V05 Queue

### V05-00 — Baseline Audit And Goal/Plan Reconciliation

Status: complete on 2026-06-27.

Goal: replace the completed V04 goal state with compact continuous V05 state and
check in root `PLANS.md` as the detailed long-run ExecPlan.

Evidence:

- root `GOAL.md`;
- root `PLAN.md`;
- root `PLANS.md`.

### V05-01 — Target Evidence Capture Current-State Investigation

Status: complete on 2026-06-27.

Goal: inspect current evidence capture, run readback, target repo testing skill,
and V04 target reports to define the smallest target-aware evidence repair.

Expected output:

- `docs/reviews/controlled-dogfood/2026-06-27-target-aware-evidence-current-state/REPORT.md`;
- minimal V05-02 implementation file set or explicit rejection.

### V05-02 — Implement Minimal Target-Aware Evidence Capture

Status: active.

Goal: add the smallest typed support for target-repo evidence capture/readback if
V05-01 confirms the code gap.

### V05-03 — Target Evidence Guard And Replay Scenario

Status: pending.

Goal: add deterministic guard coverage and a controlled replay scenario proving
target-aware evidence capture preserves proof/non-proof boundaries.

### V05-04 — Target-Aware Evidence Re-Gate

Status: pending.

Goal: decide whether V05 materially improved target trials and append the next
active stream to `PLANS.md`.

## Hard Non-Goals

Do not build or claim:

- fake V02-01 proof;
- product-ready status;
- dashboard;
- API server;
- MCP server;
- worker daemon;
- source crawler;
- broad eval platform;
- generic multi-agent system;
- runtime markdown memory;
- hidden semantic hooks;
- living target repo writes without explicit scope.

## Verification Policy

Use the narrowest relevant verification for each slice. For source changes, run:

```sh
pnpm typecheck
pnpm test
git diff --check
```

For DB/eval-affecting changes, add relevant commands:

```sh
pnpm db:ready
pnpm db:smoke
pnpm eval:brain-battle:smoke
pnpm eval:promptfoo:smoke
```

After each bounded slice, commit, push, and confirm CI when appropriate.
