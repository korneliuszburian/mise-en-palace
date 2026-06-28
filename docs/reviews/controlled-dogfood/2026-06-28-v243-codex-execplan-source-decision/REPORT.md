# V243 Codex ExecPlan Source Decision Trial

Status: complete.

Date: 2026-06-28

## Executive Verdict

V243 confirmed that KRN already retains the official Codex process sources in
`docs/KRN_SOURCES.md`, then added a focused invariant so those sources remain
tied to executable KRN consumers instead of becoming decorative links.

The bounded consumer is `packages/harness/src/sourceMapInvariants.test.ts`.
No new research archive, prompt framework, MCP surface, or broad docs rewrite was
created.

## Official Source Verification

Current source availability checks:

| Source | Result |
|---|---|
| `https://developers.openai.com/cookbook/articles/codex_exec_plans` | HTTP 200 |
| `https://developers.openai.com/cookbook/examples/codex/using_goals_in_codex` | HTTP 200 |
| `https://developers.openai.com/cookbook/examples/gpt-5/codex_prompting_guide` | HTTP 200 |

The Codex manual helper also reported:

```txt
Manual path: /tmp/openai-docs-cache/codex-manual.md
Outline path: /tmp/openai-docs-cache/codex-manual.outline.md
Manual status: local manual was already current.
```

## Source-To-Decision

### Goals In Codex

```yaml
source_id: codex-goals
title: Goals In Codex
trust_tier: high
source_class: official docs
mechanism: Goals support continuation with explicit objective and evidence.
krn_implication: GOAL.md should remain a compact current execution contract, not a backlog or ledger.
decision_kind: adopt
decision: Guard that the source map ties Goals to compact GOAL.md behavior and its stale-ledger falsifier.
consumer: packages/harness/src/sourceMapInvariants.test.ts
falsifier: GOAL.md becomes a ledger/backlog or a completed old slice remains the first resume target after compaction.
does_not_prove: Goal should become product brain or duplicate PLANS.md.
```

### ExecPlans

```yaml
source_id: codex-execplans
title: Codex ExecPlans
trust_tier: high
source_class: official docs
mechanism: ExecPlans preserve objective, discoveries, decisions, validation, and next work for long-running implementation.
krn_implication: PLANS.md is the detailed continuous ExecPlan while PLAN.md stays compact product truth.
decision_kind: adopt
decision: Guard that the source map ties ExecPlans to the PLAN/PLANS split and fresh-continuation falsifier.
consumer: packages/harness/src/sourceMapInvariants.test.ts
falsifier: a fresh Codex continuation cannot resume from compact active task state without broad rereads or stale completed slices.
does_not_prove: PLANS.md should carry raw logs, old ledgers, or decorative research forever.
```

### Codex Prompting Guide

```yaml
source_id: codex-prompting-guide
title: Codex Prompting Guide
trust_tier: high
source_class: official docs
mechanism: Codex performs better when tasks, constraints, expected outputs, and verification are explicit.
krn_implication: generated KRN tasks need non-goals, allowed writes, forbidden writes, verification, proof/non-proof boundaries, rollback, and next-task synthesis.
decision_kind: adopt
decision: Guard that the source map ties prompting guidance to mandatory PLANS.md task-contract fields.
consumer: packages/harness/src/sourceMapInvariants.test.ts
falsifier: an active task lacks non-goals, allowed/forbidden writes, verification, proof/non-proof boundaries, rollback, or next-task synthesis.
does_not_prove: every small edit needs a verbose prompt.
```

## Change Summary

Added one focused invariant:

```txt
packages/harness/src/sourceMapInvariants.test.ts
```

The new test checks that:

- Goals In Codex remains tied to compact `GOAL.md`, current execution contract,
  and stale-ledger falsifier.
- ExecPlans remains tied to `PLANS.md`, compact `PLAN.md`, and fresh continuation
  without broad rereads.
- Codex Prompting Guide remains tied to explicit task fields: non-goals,
  allowed/forbidden writes, verification, proof/non-proof boundaries, rollback,
  and next-task synthesis.

## KRN Plan Proof

```txt
executionRun: e6dfd56d-8d4e-48a2-8bf0-3c5fe903eefc
taskContract: d33baeae-4449-4d4b-91d0-f9a4d01aff41
projectResolution: connected_repo_path (connected repo path)
context: assembled
evidenceBundle: 08d76a36-ae1a-4b70-9e7e-5e9ba1738ec8
reviewAssessment: 735f3da4-18c0-4354-aa5d-32766c7efde0
feedbackDelta: 5aa74882-9f16-492b-919b-7ebbe021bdca
observationGroup: 5a7598b5-6c51-48b7-8c3b-89c33cc9dbfe
reflectionRecord: 7ddb7e55-2b5b-4c8c-be37-3aad965af1da
MemoryRecord created: no
```

Activation selected `AGENTS.md` plus current CLI owner files. The most useful
local context for this slice was discovered by source inspection:

```txt
docs/KRN_SOURCES.md
docs/runbooks/pattern-intake.md
packages/harness/src/sourceMapInvariants.test.ts
```

This is another owner-file recall note, not enough by itself to trigger
activation scoring work.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `curl -L -I <three official OpenAI Cookbook URLs>` | passed / HTTP 200 | The retained official URLs are reachable in this shell. | Does not prove the local source-map interpretation is complete. |
| `node .../fetch-codex-manual.mjs` | passed | The Codex manual cache is current enough for Codex surface self-knowledge. | Does not prove the three Cookbook pages are fully represented in KRN. |
| `pnpm --filter @krn/harness test -- sourceMapInvariants activePlanInvariants patternChainInvariants` | passed | The source map, active plan, and pattern chain invariants pass with the new Codex process source guard. | Does not prove product readiness. |
| `krn evidence capture --persist` | passed | Evidence, review assessment, feedback delta, and source usefulness outcomes were persisted. | Does not prove source interpretation is complete. |
| `krn observe --persist` | passed | Observation group and five items were persisted. | Does not prove observations are complete. |
| `krn reflect --persist` | passed | Second reflect after observe selected five observations and wrote a reflection record without Memory Core mutation. | Does not prove reflection extraction quality. |

Runtime ordering caveat:

```txt
A first reflect command ran in parallel with observe and selected 0 observations.
The final proof uses the second reflect after observe completed.
```

## What This Proves

- Official Codex process sources are retained as source-to-decision entries with
  local consumers and falsifiers.
- The source map now has a focused regression guard for Goals, ExecPlans, and
  Prompting Guide decisions.
- KRN did not create a research archive or broad prompt framework.

## What This Does Not Prove

- Codex docs alone make KRN product-ready.
- Every process source needs a dedicated invariant.
- Activation owner-file recall is solved.
- V02-01 second-operator proof is complete.

## Condensation Decision

```txt
finding: retained Codex process sources needed a direct consumer guard.
frequency: repeated risk across continuous plan and source-to-decision work.
candidate_surface: eval/golden candidate / source-map invariant.
decision: accept.
rationale: the invariant prevents Goals/ExecPlans/Prompting Guide from becoming decorative links.
evidence: sourceMapInvariants targeted test.
does_not_prove: all Codex surface decisions are complete.
falsifier: an adopted Codex process source can remain in docs/KRN_SOURCES.md without a concrete KRN consumer and falsifier.
next_task_id: V244-00.
```

## Next Recommended Action

Run a short best-pattern surface re-gate. Pick the next source-backed slice from
current evidence across infra, harness, CI/eval, Codex surfaces, TypeScript,
security, and operator UX. Do not choose by vibe; choose the surface with the
clearest missing consumer or falsifier.
