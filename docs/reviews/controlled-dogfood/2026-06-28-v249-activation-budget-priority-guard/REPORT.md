# V249 Activation Budget Priority Guard

Status: complete.

Date: 2026-06-28

## Executive Verdict

V249 added a focused behavior guard for the remaining activation risk selected
by V248: task-specific source seeds should not be crowded out by generic owner
files under tight context budget.

The guard passed without a runtime source repair. Current activation scoring and
ContextROI behavior already keep a strongly matching target source seed ahead of
a generic default owner file in the tested scenario.

This means V249 closes the immediate post-seed budget-priority concern without
opening a broad scoring rewrite.

## Source-To-Decision

```yaml
source_id: v248-post-seed-budget-priority-risk
title: Task-specific source seed versus generic owner-file budget priority
trust_tier: high
source_class: repo-local evidence
mechanism: target source seeds and owner files both enter activation as search candidates; under tight maxInclusions, total score decides which context survives over_budget exclusion.
krn_implication: guard that a strongly task-matching source seed survives tight budget over a weaker generic owner file before changing scoring.
decision_kind: adopt
decision: add a focused ownerFileRecall behavior guard; no runtime repair needed because current behavior passes.
consumer: packages/harness/src/activation/ownerFileRecall.test.ts
falsifier: a strongly matching target source seed is excluded over_budget while a weaker generic owner file is included.
does_not_prove: activation quality globally, product readiness, or that budget behavior is correct for every target repo.
```

## Changed

```txt
packages/harness/src/activation/ownerFileRecall.test.ts
```

Added a test proving:

```txt
task:
  Apply TypeScript finite-state standard and best-pattern source decision

target source seed:
  docs/standards/typescript-excellence.md

generic owner file:
  packages/cli/src/runPlanCommand.ts

policy:
  maxInclusions: 1

expected:
  include docs/standards/typescript-excellence.md
  exclude packages/cli/src/runPlanCommand.ts as over_budget
```

No activation scoring, ContextROI implementation, seed class, retrieval rewrite,
DB schema, crawler, or broad eval platform was changed.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm --filter @krn/harness test -- ownerFileRecall` | passed | Owner-file recall budget-priority guard passes for the V249 case. | Does not prove activation quality globally. |

## What This Proves

- Strongly matching task-specific source seeds can survive tight budget over a
  weaker generic owner file.
- V248's budget-priority risk has a regression guard.
- No runtime activation scoring repair is currently justified by this case.

## What This Does Not Prove

- Product readiness.
- General activation scoring quality.
- That every source seed beats every owner file.
- That future target repos will have adequate read-model inputs.

## Condensation Decision

```txt
finding: current budget behavior already protects the tested task-specific source seed.
frequency: verified once as a guard after V245/V247 seed repairs.
candidate_surface: behavior guard.
decision: accept guard, reject runtime scoring change for now.
rationale: changing scoring after a passing guard would be speculative.
evidence: ownerFileRecall focused test.
does_not_prove: all activation budget issues are solved.
falsifier: future DB-backed task shows a strongly matching task-specific seed excluded over_budget behind weaker generic context.
next_task_id: V250-00.
```

## Next Recommended Action

```txt
V250-00 Product Readiness Re-Gate After Activation Seed/Budget Guards
```

Reason: V245, V247, and V249 closed the immediate read-model and budget-priority
activation concerns without scoring rewrites. The next step should re-gate
product readiness and choose whether the next work is another target trial,
second-operator launch, candidate/reflection quality, or a specific product
blocker.
