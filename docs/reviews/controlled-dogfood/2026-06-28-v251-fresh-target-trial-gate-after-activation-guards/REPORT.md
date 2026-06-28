# V251 Fresh Target Trial Gate After Activation Guards

Status: target trial gate, no target writes.

Date: 2026-06-28
Evaluator: Codex
KRN repo state before target discovery: `main...origin/main`, clean

## Executive Verdict

V251 rejects using a random living `active/` repository as the next product
proof. Several target candidates exist, and `wilq-seo` is clean and realistic,
but using a live evolving repo as the first post-activation target trial would
mix KRN product evidence with unrelated target evolution and operator context.

The better next move is to create a KRN-owned normalized target trial substrate:
a controlled worktree/repo/fixture that can encode known weaknesses, expected
best-pattern repairs, owner files, rollback, command evidence, and
source-to-decision intake without touching a living external project.

This does not replace future real target trials. It creates the standardized
test bed that makes later real target trials meaningful instead of ad hoc.

## Target Discovery

Mode used:

```txt
observation-only
```

No target files were edited, committed, cleaned, reset, or pushed.

Candidates discovered under `/home/krn/coding/krn/active`:

| Candidate | State | Notes | Decision |
|---|---|---|---|
| `wilq-seo` | clean, `main...origin/main` | Real product repo with strict Python/TS rules, active WILQ cleanup goal, local secrets, own recovery docs and skills. | Defer as real target candidate; not first standardized substrate. |
| `seo` | dirty | Real SEO repo with active `TASK.md` change. | Reject for first target trial; living dirty context. |
| `krn-ekologus` | dirty/untracked `GOAL.md` | Brand knowledge OS repo, active project context. | Reject for first target trial; dirty and branch-specific. |
| Other `active/` repos | many dirty/ahead/untracked | Useful later for observation-only trials. | Do not use before normalized substrate. |

## Why Living Target First Is Wrong

A living target repo can prove realism, but it is poor as the first post-V250
trial because:

- pre-existing dirty state can be mistaken for KRN-created evidence;
- target operator goals may change while KRN measures itself;
- exact expected repairs are not controlled;
- source-to-decision pattern intake becomes hard to falsify;
- failed tests may be target setup noise rather than KRN workflow failure;
- a clean read now can become stale by the next turn.

The point of the next step is not to avoid real targets. It is to make the next
real target proof comparable, repeatable, and reviewable.

## Selected Next Blocker

Next task:

```txt
V252-00 Normalized Target Trial Substrate
```

Goal:

Create a KRN-owned target trial substrate that can be used to test whether KRN
forces better engineering behavior on controlled weak code before touching a
living target repo.

Required properties:

- lives under a clearly owned lab/fixture path;
- is reproducible from committed KRN instructions or generator;
- has explicit target mode, write authority, rollback, owner files, and
  verification commands;
- includes known weak patterns relevant to KRN standards:
  - unsafe external input handling;
  - weak TypeScript/Python boundaries;
  - missing proof/non-proof boundaries;
  - mixed domain/IO concerns;
  - poor candidate/reviewability output;
  - unclear command evidence;
- includes expected best-pattern pressure:
  - unknown-first validation;
  - discriminated unions/finite states where appropriate;
  - typed API/schema/view-model boundary;
  - evidence IDs/source connector requirements where applicable;
  - source-to-decision mapping for any external pattern/course/paper;
- can be run headlessly and reset safely;
- does not become benchmark theater or a broad eval platform.

## Source To Decision

```yaml
source_id: v251-target-gate-user-correction
title: Normalize target trials before using living active repos
trust_tier: high
source_class: user-provided research
mechanism: Living repos contain evolving operator context, dirty state, secrets, and unknown ownership boundaries; a normalized KRN-owned target substrate makes expected weaknesses, allowed writes, rollback, and best-pattern application falsifiable.
krn_implication: KRN should test target-transfer behavior first in a controlled target substrate, then use real active repos after the workflow is repeatable.
decision_kind: adopt
decision: Open V252 to create a normalized target trial substrate before a living target trial.
does_not_prove: The normalized substrate will predict arbitrary real repo success or product readiness.
consumer: PLAN.md, GOAL.md, PLANS.md, V252 target substrate.
falsifier: V252 cannot create a substrate that catches real KRN workflow failures or becomes a decorative fixture with no reset/verification path.
```

## What This Proves

- KRN can inspect target candidates without writing to them.
- `wilq-seo` is a plausible future real target, but not the right first
  standardized product proof.
- The next missing product evidence is a normalized target substrate, not
  another local KRN-only source repair.

## What This Does Not Prove

- Product readiness.
- Real target success.
- Second-operator usability.
- That `wilq-seo` should never be used.
- That a normalized substrate is enough without later real target trials.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `git fetch --prune` | passed | KRN local remote refs refreshed. | Product readiness. |
| `git status --short --branch` | passed, clean before target discovery | KRN repo started V251 clean. | Target readiness. |
| target `git status --short --branch` loop | passed | Active target candidates and dirty states were inspected. | That any target is safe to edit. |
| `wilq-seo git status --short --branch` | passed, clean | `wilq-seo` was clean at inspection time. | That it remains clean later or is the right first substrate. |
| `krn init --dry-run --repo /home/krn/coding/krn/active/wilq-seo ...` | passed | KRN can produce a dry-run target packet with owner-file seeds for `wilq-seo`. | That KRN should write to `wilq-seo` now. |

## Next Recommended Action

Execute V252:

```txt
Create normalized KRN-owned target trial substrate.
```

Do not write to living target repos before V252 creates repeatable target
setup, reset, owner-file, evidence, and verification boundaries.
