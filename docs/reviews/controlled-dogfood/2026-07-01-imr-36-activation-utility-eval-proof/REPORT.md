# IMR-36 Activation Utility Eval Proof

Status: complete bounded behavior-proof slice.

Issue: `mise-en-palace-43z`.

## Executive Verdict

The heartbeat-routed activation utility candidate now has a focused behavior
proof. The proof fails if `buildBrainHeartbeatPreview` stops preserving
`activationUtilityEvidence`, stops classifying the candidate as
`ready_for_behavior_proof`, drops proof/non-proof boundaries, or mutates state.

This is an eval/golden-style behavior proof, not Promptfoo proof, ranking proof,
semantic-aware Thompson sampling, crawler work, worker runtime, API/MCP, DB
schema, source truth mutation, or Memory Core mutation.

## Source To Decision

```yaml
source_id: docs/reviews/controlled-dogfood/2026-07-01-imr-35-activation-utility-heartbeat-routing/REPORT.md
title: IMR-35 activation utility heartbeat routing
trust_tier: repo-local evidence
source_class: dogfood report
mechanism: IMR-35 routed a brain-search activationUtility exploration verdict
  into heartbeat knowledge-acquisition candidate output with mutation none.
krn_implication: Before relying on the route for future heartbeat/eval work,
  KRN needs one bounded behavior proof that protects the candidate evidence and
  no-mutation boundary.
decision_kind: adopt
decision: Add a focused worker behavior proof for heartbeat-routed activation
  utility acquisition candidates.
consumer: `packages/workers/src/brainHeartbeatPreview.test.ts`
falsifier: the proof requires DB/schema/worker/API work, drops
  activationUtilityEvidence, omits doesNotProve, stops emitting
  ready_for_behavior_proof, or allows mutation.
does_not_prove: source truth, answer correctness, ranking quality,
  semantic-aware Thompson sampling, autonomous learning, worker daemon
  readiness, DB-backed replay, or product readiness.
```

## Changed

- `packages/workers/src/brainHeartbeatPreview.test.ts`
  - added `guards activation utility acquisition eval proof without mutation`;
  - asserts `reviewEvalClosure.decision: ready_for_behavior_proof`;
  - asserts `runtimeLoop.status: ready_for_operator_review`;
  - asserts one `knowledge_acquisition_candidate`;
  - asserts `activationUtilityEvidence.verdict:
    linked_evidence_exploration_candidate`;
  - asserts `selectedKnowledge: missing`, `sourceLinkGraph: useful`;
  - asserts evidence refs, `doesNotProve`, forbidden writes, and `mutation:
    none`.

No runtime source changed.

## Proof Boundary

Proves:

- heartbeat aggregation preserves routed activation utility evidence in the
  candidate;
- the candidate reaches behavior-proof closure when evidence is reviewable;
- the candidate remains candidate-only and mutation-free;
- the local TypeScript/test/Fallow/brain-battle gates pass.

Does not prove:

- source truth;
- answer correctness;
- ranking quality;
- semantic-aware Thompson sampling;
- autonomous acquisition;
- live DB replay for this exact proof;
- worker daemon readiness;
- product readiness.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `rtk pnpm --filter @krn/workers test -- brainHeartbeatPreview knowledgeAcquisitionHeartbeatPreview` | passed | Worker behavior proof and acquisition candidate behavior pass. | Does not prove CLI output or live DB state. |
| `rtk pnpm run typecheck` | passed | Strict TypeScript workspace compiles. | Does not prove runtime usefulness. |
| `rtk env TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | Full local suite passes, including the new worker behavior proof. | Does not prove product readiness. |
| `rtk pnpm quality:fallow:ci` | passed | Fallow found no issues in changed files. | Does not prove architecture is optimal. |
| `rtk pnpm eval:brain-battle:smoke` | passed | Existing brain-battle/golden/CLI/Codex-adapter smoke gates remain green. | Does not cover this worker proof as a Promptfoo case or prove brain quality. |
| `rtk git diff --check` | passed | Diff has no whitespace errors. | Does not prove behavior. |

## Brain Usefulness

Verdict: positive and narrow.

IMR-36 turns IMR-35's candidate route into a failing behavior proof. That makes
the current brain loop less dependent on report text and more dependent on
executable regression evidence.

## Next

Continue the vertical loop. The next bounded task should use this protected
candidate path for review/promotion/rejection or a small Brain-QA/eval reuse
check. Do not open dashboard/API/MCP/worker/crawler/ranking work from this
proof.
