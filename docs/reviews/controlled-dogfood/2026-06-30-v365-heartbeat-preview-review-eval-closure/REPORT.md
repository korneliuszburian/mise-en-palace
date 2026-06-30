# V365 Heartbeat Preview Review/Eval Closure

Status: complete bounded source slice.

## Executive Verdict

V365 closes the heartbeat preview review/eval loop without starting autonomous
runtime work. `buildBrainHeartbeatPreview` now emits a deterministic
`reviewEvalClosure`, and `krn heartbeat preview` renders it for operators. The
current live DB readback says the emitted heartbeat candidates are
`ready_for_behavior_proof` with `nextAction: add_golden_behavior_case`.

This is a product-facing closure, not a daemon, scheduler, crawler, schema,
ranking, UI/API/MCP, consensus runtime, or Memory Core mutation.

## Source To Decision

```yaml
source_id: claim:04b097d5-7338-4b78-be55-e85d0cbb7aff
title: V338 memory-staleness heartbeat preview can propose reviewable maintenance candidates
trust_tier: medium
source_class: repo-local evidence
mechanism: Candidate-only heartbeat previews can expose reviewable maintenance
  pressure without mutating Memory Core.
krn_implication: The next useful heartbeat step is a review/eval closure that
  tells the operator whether preview output is ready for behavior proof.
decision_kind: adopt
decision: Add a read-only reviewEvalClosure to the brain heartbeat preview
  output and CLI readback.
does_not_prove: This does not prove candidate truth, usefulness, scheduler
  readiness, autonomous worker execution, or Memory Core mutation.
consumer: packages/workers/src/brainHeartbeatPreview.ts and
  packages/cli/src/runHeartbeatPreviewCommand.ts
falsifier: Heartbeat preview starts mutating memory/source state, starts
  daemon/scheduler work, or fails to distinguish no candidates from
  proof-ready candidates.
```

## Changed

- `packages/workers/src/brainHeartbeatPreview.ts`
  - adds `BrainHeartbeatReviewEvalClosure`;
  - classifies preview output as `ready_for_behavior_proof`,
    `needs_more_evidence`, or `no_reviewable_candidates`;
  - emits `nextAction` without mutating state.
- `packages/cli/src/runHeartbeatPreviewCommand.ts`
  - renders review/eval closure in text output;
  - preserves JSON readback through the existing preview object.
- Tests:
  - workers coverage for ready and no-candidate closure;
  - CLI coverage for text and JSON closure readback.

## Persisted Plan

```txt
operatorIntent: bb0ac937-dbb4-4586-8845-38c20bc342db
taskContract: 695f486c-7631-4b33-be38-ad24a7caed73
harnessPlan: 64165e5f-ed75-4065-936d-d49b72da57ff
contextAssembly: fb60af5a-4c23-466c-960b-770d5af0858c
executionRun: b0fac210-53d0-41a2-89c2-51871db816f9
```

Persisted evidence loop:

```txt
evidenceBundle: 367e224c-ef98-4c2f-820f-ba7a537e93a4
reviewAssessment: afc5cfa6-3bb8-4249-9b02-3ed8dc56a0d8
feedbackDelta: 5bd16562-870b-40cd-9e28-92a9c68e03b6
observationGroup: 109fa60c-c317-4cdd-bebd-a10ea879b69c
reflectionRecord: 93a350e6-03b9-4bbc-9d7e-3a3b61aff2b9
```

Selected context helped:

- `claim:04b097d5-7338-4b78-be55-e85d0cbb7aff` helped define the closure.
- Heartbeat/source graph guardrails helped preserve the no-runtime boundary.
- Owner-file activation was imperfect: it did not directly select
  `brainHeartbeatPreview.ts`, so source inspection still carried owner-file
  discovery.

## Live DB Readback

Command:

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn \
pnpm --filter @krn/cli krn heartbeat preview \
  --memory-limit 10 \
  --source-claim-limit 10 \
  --max-candidates 5
```

Result:

```txt
decision: ready_for_behavior_proof
nextAction: add_golden_behavior_case
mutation: none
memoryRecords: 0
sourceClaims: 10
sourceClaimEdges: 3
memoryStaleness: 0
sourceRelation: 3
```

JSON readback also preserved `preview.reviewEvalClosure`.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm db:ready` | passed | local Postgres is reachable, migrations are applied, pgvector is available | CI DB state or product readiness |
| `pnpm --filter @krn/workers test -- brainHeartbeatPreview` | passed | worker preview tests cover review/eval closure behavior | live DB content quality |
| `pnpm --filter @krn/cli test -- runHeartbeatPreviewCommand parseHeartbeatArgs` | passed | CLI text/JSON readback preserves closure output | full product UX |
| `pnpm run typecheck` | passed | workspace TypeScript compiles under strict package configs | runtime usefulness |
| `TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | full workspace tests pass locally | CI status until checked |
| `pnpm quality:fallow:ci` | passed | changed JS/TS files pass Fallow quality gate | architectural optimality |
| `git diff --check` | passed | diff has no whitespace errors | behavior correctness |
| `krn heartbeat preview ...` | passed | live DB readback renders review/eval closure and candidate-only output | candidate truth, scheduler readiness, autonomous mutation |
| `krn observe --run b0fac210... --persist` | passed | same-run observations were staged before reflection | observation usefulness |
| `krn reflect --scope run:b0fac210... --persist` | passed | reflection completed after observe with no Memory Core mutation | reflection quality or candidate usefulness |

## Review Burden Delta

Before: the operator could see heartbeat candidates but had to infer whether the
preview should become an eval/golden proof or gather more evidence.

After: the preview itself states the review/eval closure decision, next action,
candidate ids, evidence refs, mutation boundary, forbidden writes, and
does-not-prove boundary.

Delta: reduced for heartbeat preview review/eval decisions.

## Candidate Outputs

No candidate was promoted.

EvalCandidate:

```txt
summary: Heartbeat preview output should be protected by a bounded behavior
  proof when reviewEvalClosure is ready_for_behavior_proof.
evidence: this report, packages/workers/src/brainHeartbeatPreview.test.ts,
  packages/cli/src/runHeartbeatPreviewCommand.test.ts
doesNotProve: Does not prove heartbeat candidates are true, useful, or ready
  for autonomous execution.
reviewability: ready
decision: review
```

## What This Proves

- Heartbeat preview now has a deterministic review/eval closure decision.
- Operators can see whether the next step is behavior proof, more evidence, or
  candidate-state seeding.
- The closure preserves candidate-only, no-mutation boundaries.

## What This Does Not Prove

- Candidate truth.
- Memory/source truth.
- Production usefulness.
- Autonomous worker execution.
- Scheduler readiness.
- Consensus correctness.
- Product readiness.

## Next Recommended Task

V366 Heartbeat Preview Golden Behavior Proof.

Goal: add one bounded behavior proof that fails if heartbeat preview stops
emitting candidate-only review/eval closure output with evidence refs,
doesNotProve, reviewability, nextAction, and no mutation.
