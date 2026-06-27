# V59 First Pattern Intake Runbook Application

Status: complete.

Date: 2026-06-27.

## Executive Verdict

The new pattern intake runbook was applied to one existing source decision:

```txt
docs/KRN_SOURCES.md#unions-literals-and-narrowing
```

The application produced one bounded consumer update:

```txt
docs/architecture/brain-battle-eval-matrix.md
```

The consumer is an eval/golden candidate, not an implemented guard. This is the
right level because the source supports a local falsifier, but does not by
itself prove current source drift or justify a broad TypeScript rewrite.

## Pattern Intake Record

```yaml
source_id: total-typescript-unions-narrowing
title: Unions, Literals, And Narrowing
url_or_ref: docs/KRN_SOURCES.md#unions-literals-and-narrowing
trust_tier: medium
source_class: high-quality public course page
mechanism: Literal unions and narrowing constrain finite states and make invalid transitions visible.
krn_implication: KRN lifecycle, provenance, reviewability, candidate, and target-status states should not regress to optional object soup when valid fields differ by state.
decision_kind: lab_test
decision: Add a candidate KRN behavior check for lifecycle/state-dependent model drift.
consumer: docs/architecture/brain-battle-eval-matrix.md
falsifier: A bounded TypeScript lifecycle spot-check finds no repeated optional-object state drift, or the candidate cannot be expressed as a deterministic guard.
does_not_prove: Current source has drift, every object needs a discriminant, or broad TypeScript refactoring is valuable.
candidate_output:
  type: EvalCandidate
  reviewability: ready
next_action: Run a bounded TypeScript lifecycle union drift spot-check before implementing any guard.
```

## Consumer Update

Added a `candidate` row to `docs/architecture/brain-battle-eval-matrix.md`:

```txt
KRN lifecycle/state-dependent domain models should use narrow unions or
discriminated unions when valid fields differ by state.
```

This candidate is intentionally not marked implemented.

## Rejected Alternatives

| Alternative | Decision | Reason |
|---|---|---|
| Broad TypeScript rewrite | reject | Source does not prove current source drift or justify sweeping changes. |
| Add a guard immediately | defer | Need one bounded source spot-check first. |
| Add more TypeScript course sources | reject for now | V59 tests the runbook on one existing source only. |
| Store course content | reject | Runbook requires mechanism summaries and links, not copied material. |

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `git diff --check` | passed | Checks whitespace for the docs diff. | Candidate quality or source drift. |
| `git status --short --branch` | expected docs/plan changes only | Shows local worktree state before commit. | CI success. |

## Next Recommended Task

Promote:

```txt
V60 — TypeScript Lifecycle Union Drift Spot-Check
```

Goal:

Inspect a small set of current KRN lifecycle/state-dependent TypeScript models
and decide whether the new eval/golden candidate should become an implemented
guard, a standard-only reminder, or a rejected/no-op finding.

## What This Proves

- The pattern intake runbook can turn one existing source into a concrete
  consumer update.
- The output remained bounded to one source and one consumer.
- The source was not copied into KRN as raw course material.

## What This Does Not Prove

- Product readiness.
- V02-01.
- Current TypeScript source drift.
- That the eval/golden candidate should be implemented.
- That broader research intake is warranted.
