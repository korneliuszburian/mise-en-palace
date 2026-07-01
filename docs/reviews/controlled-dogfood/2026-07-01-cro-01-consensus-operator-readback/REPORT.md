# CRO-01 Consensus Relation Review Operator Readback

Date: 2026-07-01

## Verdict

positive

CRO-01 exposed consensus relation review output through the existing
operator-facing `krn heartbeat preview` surface. The implementation reuses the
existing candidate-only consensus preview instead of creating a new command,
runtime, schema, dashboard, or worker daemon.

## KRN Plan

Persisted plan: yes

```txt
operatorIntent: 6c18aca5-99e8-4805-b068-5f5bf7f62a24
taskContract: b90a1177-0466-4adf-af97-bf9debeb7d68
harnessPlan: efd8efbe-4815-403d-a776-8ec4f3e6c045
contextAssembly: 4a3c67bc-b06b-4a5d-8791-f819944d76b3
executionRun: fff56dc1-28a0-46bd-ac1c-971c34eae43f
```

Activation usefulness: mixed positive.

Useful selected context:

- bounded ingest/readback before broad platform work;
- heartbeat-routed candidates stay manual and candidate-only;
- temporal/source relation claims do not prove source truth.

Miss:

- selected owner files were plan/run/activation owners, not heartbeat preview or
  consensus candidate owners. Source inspection found the actual owners.

## Changed

- `@krn/workers` heartbeat preview now accepts consensus candidate inputs and
  includes consensus candidate evaluations in the shared candidate readback.
- `@krn/cli` heartbeat preview now supports:

  ```txt
  --candidate-kind consensus_evaluation
  --consensus-candidate-file <path>
  ```

- Text and JSON output expose:

  ```txt
  relationReviewFocus
  relationReviewQuestion
  consumedBy
  reviewUsefulness
  relation review doesNotProve
  ```

## Source-To-Decision

Source: GCE-01 showed `relationReviewFocus` was preserved in the pure consensus
candidate evaluation preview but source inspection found no operator-facing
consumer.

Mechanism: heartbeat preview is already the read-only candidate-only operator
surface for maintenance/eval/review routing.

KRN implication: consensus relation review should flow into heartbeat preview
instead of spawning a new consensus runtime or broad eval surface.

Decision: add one optional consensus candidate file input to heartbeat preview
and fold the resulting consensus evaluations into the existing candidate
readback.

Consumer: operators reviewing graph relation candidates before consolidation,
rejection, source truth changes, or future eval/golden work.

Falsifier: if a future live readback shows the consensus relation section does
not reduce review burden or hides evidence/proof limits, the route should be
reworked or rejected.

## Verification

Passed:

```txt
pnpm --filter @krn/workers test -- brainHeartbeatPreview consensusCandidateEvaluationPreview
pnpm --filter @krn/cli test -- parseHeartbeatArgs runHeartbeatPreviewCommand
pnpm typecheck
pnpm test
pnpm quality:fallow:ci
git diff --check
krn evidence capture --persist
krn observe --run-id fff56dc1-28a0-46bd-ac1c-971c34eae43f --persist
krn reflect --scope run:fff56dc1-28a0-46bd-ac1c-971c34eae43f --persist
```

Note: root `pnpm typecheck` and filtered typecheck were run through
`rtk proxy` because plain `rtk pnpm ... typecheck` proxies to `tsc` and ignores
pnpm filters.

One incorrect reflection invocation used `--run-id`; it printed usage and made
no state change. The corrected `--scope run:<id>` invocation passed.

Persisted evidence/readback:

```txt
evidenceBundle: 7d98074f-d44e-430d-b707-ed4b367209ff
reviewAssessment: b2522729-0e2b-47ad-8ada-d1cc9cbce2af
feedbackDelta: 8390ad8e-db66-495f-8f2e-c16d3b92e7aa
finalEvidenceBundle: 6104206f-f3fd-4d01-8787-5130c00e8d42
finalReviewAssessment: bc809f6b-841f-4227-bcdf-c207874c2dd3
finalFeedbackDelta: 0f1e78a4-204f-41f6-8884-059fb1714e6c
observationGroup: 93600c83-a275-473f-96b0-09967c3bc24e
reflectionRecord: 724bacf9-f7d9-4c19-bd3a-8346c224a5f9
```

## What Improved

- Consensus relation review is no longer trapped in a pure worker preview.
- Operators can focus heartbeat preview on `consensus_evaluation`.
- Relation review output is visible in text output, not only JSON.
- `reviewEvalClosure` and runtime-loop readback can count consensus evaluations
  as review-ready candidate-only work.
- Fallow caught and forced simplification of new enum/array parsing code.

## What This Does Not Prove

- does not prove source truth;
- does not prove relation edge correctness;
- does not prove consensus correctness;
- does not prove duplicate consolidation quality;
- does not prove graph ranking quality;
- does not prove autonomous worker execution;
- does not prove Memory Core mutation safety beyond this read-only path;
- does not prove product readiness.

## Review Burden Delta

Before: a reviewer had to inspect worker-only consensus preview output or tests
to see whether relation review focus was preserved.

After: a reviewer can run heartbeat preview with a consensus candidate file and
see relation focus, question, usefulness, dissent/risk/support evidence refs,
and proof boundary in one operator-facing readback.

## Candidates

MemoryCandidate:

```txt
Consensus relation review output should flow through an operator-facing
candidate-only heartbeat readback before any consensus runtime, graph ranking,
or Memory Core mutation work.
```

AntiMemoryCandidate:

```txt
Do not treat consensus relation review readback as proof of source truth, edge
correctness, consensus correctness, or duplicate consolidation quality.
```

EvalCandidate:

```txt
Heartbeat preview should regress consensus_evaluation relationReviewFocus and
reviewUsefulness output in text and JSON readbacks.
```

No candidate was promoted.

## Next

`mise-en-palace-afr`: use the new consensus relation readback in one live or
fixture-backed heartbeat review proof and measure whether it reduces review
burden.
