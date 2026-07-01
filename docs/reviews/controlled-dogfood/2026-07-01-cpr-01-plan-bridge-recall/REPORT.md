# CPR-01 Plan Bridge Recall

Date: 2026-07-01

## Verdict

positive

CPR-01 repaired the gap where `krn brain knowledge` and `krn brain search`
could select `pattern:consensus-relation-heartbeat-review-boundary`, but
`krn plan --persist` selected no retained pattern for the equivalent long task.

The fix is intentionally small: the brain-knowledge compact query retry now
lives in a shared helper, and the retained-pattern plan bridge retries the same
compact mechanism query before giving up.

## Source-To-Decision

Source: CQR-01 report plus live plan/readback evidence from this slice.

Mechanism: the retained pattern is discoverable with the short mechanism query
`consensus heartbeat review boundary`, but long task contracts include enough
task boilerplate to miss exact token matching.

KRN implication: the plan bridge should retry a compact mechanism query after
the full task query misses, so retained pattern context can reach the Codex brief
before execution.

Decision: adopt a shared compact brain-knowledge bridge query helper for both
`krn brain search` and `krn plan`.

Consumer: persisted `krn plan`, `krn run show`, Codex brief rendering, and future
pattern/research-brain slices that rely on retained pattern reuse.

Falsifier: a future equivalent consensus relation task reports retained pattern
IDs as none while `krn brain knowledge` still selects the pattern through a short
mechanism query.

## Changed

```txt
packages/cli/src/brainKnowledgeQuery.ts
packages/cli/src/runBrainSearchCommand.ts
packages/cli/src/runPlanCommand.ts
packages/cli/src/runCli.test.ts
```

The repair did not change ranking, schema, runtime workers, graph scoring,
Memory Core mutation, dashboard, API, MCP, crawler, or product server behavior.

## Behavior Proof

Before the repair, this regression failed:

```txt
pnpm --filter @krn/cli test -- runCli --testNamePattern "retries retained-pattern planning"
```

Failure mode:

```txt
Retained pattern selection: rejected_or_deferred
Retained pattern IDs: none
```

After the repair, the same regression passed and asserted:

```txt
Retained pattern selection: selected
Retained pattern IDs: consensus-relation-heartbeat-review-boundary
executionRun.metadata.retainedPatternSelection.selectedPatternIds:
  - consensus-relation-heartbeat-review-boundary
```

## Persisted Plan

Command:

```txt
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn \
  pnpm --filter @krn/cli krn plan \
  --task "Use the retained consensus relation heartbeat review boundary in a bounded mini Brain-QA or consensus-lane readback; verify whether pattern:consensus-relation-heartbeat-review-boundary is selected or classify the miss; record whether it changes the next source-to-decision decision; no runtime schema dashboard API MCP worker daemon crawler graph ranking rewrite or Memory Core mutation work" \
  --persist
```

Persisted IDs:

```txt
operatorIntent: 136e3c53-5d39-41d3-b469-94f04996bb38
taskContract: a3357268-b080-44a1-8044-9824a4c6d22f
harnessPlan: 4127790e-8913-4e27-985a-0c734d2e975f
contextAssembly: e2079617-000a-426f-8460-126ab04d139e
executionRun: cfc2f77d-c9f7-4cf2-be92-1bc513df7f46
```

Plan result:

```txt
Retained pattern selection: selected
Retained pattern query: consensus heartbeat review boundary
Retained pattern IDs: consensus-relation-heartbeat-review-boundary
```

## Run And Brief Readback

`krn run show --json` preserved the retained pattern selection:

```txt
retainedPatternSelection.status: selected
selectedPatternIds:
  - consensus-relation-heartbeat-review-boundary
```

`krn codex brief` rendered the same plan context:

```txt
Retained Pattern Context:
Retained pattern selection: selected
Retained pattern query: consensus heartbeat review boundary
Retained pattern IDs: consensus-relation-heartbeat-review-boundary
```

## Commands

Passed:

```txt
git fetch --prune
git status --short --branch
bd prime
bd show mise-en-palace-9ck
bd update mise-en-palace-9ck --claim
pnpm --filter @krn/cli test -- runCli --testNamePattern "retries retained-pattern planning"
pnpm --filter @krn/cli test -- runBrainSearchCommand --testNamePattern "compact mechanism"
pnpm --filter @krn/cli krn plan --persist
pnpm --filter @krn/cli krn run show --run-id cfc2f77d-c9f7-4cf2-be92-1bc513df7f46 --json
pnpm --filter @krn/cli krn codex brief --run-id cfc2f77d-c9f7-4cf2-be92-1bc513df7f46
pnpm run typecheck
pnpm test
pnpm --filter @krn/harness test -- activePlanInvariants contextHygieneInvariants
pnpm quality:fallow:ci
git diff --check
pnpm db:ready
krn evidence capture --persist
krn observe --persist
krn reflect --persist
```

Reflect was first run in parallel with observe and selected zero observations
because observe had not finished persisting yet. It was rerun after observe, then
rerun again after final evidence capture.

Persisted evidence/readback IDs:

```txt
evidenceBundle: eaeafb29-ef33-4335-b2f1-20637cc1da5e
reviewAssessment: 0d06d8fc-c834-4545-a9e2-ae451539d0d7
feedbackDelta: cfd42213-6016-4e8a-9383-56d36a7800e4
observationGroup: ac11f2cd-cd47-4779-98ad-c441355250f6
observationItems: 9
reflectionRecord: e2950421-51e8-4a8e-9e36-6d25ff7c9bfa
reflectionObservationsSelected: 14
reflectionFindings: 5
reflectionGaps: 5
```

## What This Proves

- The plan bridge can now select the retained consensus relation pattern from a
  long task contract.
- The selected pattern persists into execution run metadata.
- `krn run show` and `krn codex brief` can read back the selected retained
  pattern before Codex execution.
- The repair is covered by a focused CLI regression.

## What This Does Not Prove

- It does not prove ranking quality for all retained patterns.
- It does not prove source truth or relation correctness.
- It does not prove graph scoring, crawler, worker runtime, dashboard, API, MCP,
  or product readiness.
- It does not mutate Memory Core or promote new memory.
- It does not prove the compact query heuristic is globally optimal.

## Brain Usefulness

Verdict: positive.

The retained pattern was the right target and the previous dogfood report
isolated the exact gap. KRN helped by making the miss visible at the plan bridge
instead of burying it in implementation work.

The implementation was still carried by source inspection and tests. This is a
bounded recall repair, not proof of autonomous reasoning.

## Next Recommended Action

Use the repaired plan bridge in one bounded consensus/source-to-decision slice
where the selected retained pattern must change or constrain the next decision.
Do not open dashboard, API, MCP, worker daemon, crawler, schema, or broad ranking
work for this follow-up.
