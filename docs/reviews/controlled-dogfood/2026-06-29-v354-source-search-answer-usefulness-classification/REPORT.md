# V354 Source Search Answer Usefulness Classification

Status: complete.

## Executive Verdict

`krn source search --json` now exposes deterministic answer-usefulness
classification and reasons. V353 proved the classification could be derived by a
local consumer; V354 moved it into the operator-facing answer package so future
mini Brain-QA consumers do not need ad hoc post-processing.

## Scope

Changed source:

```txt
packages/cli/src/runSourceSearchCommand.ts
packages/cli/src/runSourceSearchCommand.test.ts
```

Non-goals preserved:

- no ranking change;
- no retrieval semantics change;
- no DB schema change;
- no UI/API/MCP;
- no crawler;
- no embeddings;
- no graph runtime;
- no worker runtime;
- no broad benchmark;
- no Memory Core mutation.

## KRN Plan

Persisted run:

```txt
executionRun: 159f83f6-3745-42eb-804b-0af68efea152
taskContract: 09e4c5f5-d5c5-4683-95ab-6424a0318cf2
contextAssembly: f50bc63e-1c85-40af-8fb2-3f8bd1b69b68
```

Activation selected useful guardrails but did not directly select the source
search owner file. Source owner discovery came from focused `rg` and inspection.
This should inform future owner-file recall work, but V354 did not change
activation.

## Source-To-Decision

Source: V353 answer-usefulness batch report.

Mechanism: existing JSON answer-package fields expose supporting claim count,
supporting document count, and missing evidence. Those are enough to classify
bounded answer usefulness without claiming answer correctness.

KRN implication: answer usefulness should be an explicit readback field in
`krn source search --json`.

Decision: implement a deterministic helper and render `answerUsefulness` plus
`answerUsefulnessReasons` in JSON and text output.

Consumer: technical operators and V355 mini Brain-QA loop.

Falsifier: useful/missing/unsupported cases cannot be classified from current
answer-package fields without overclaiming answer correctness or ranking
quality.

Does not prove: answer correctness, source truth, ranking quality, product
readiness, UI/API/MCP readiness, or Memory Core mutation.

## Behavior

New labels:

```txt
useful
partly_useful_missing_document
partly_useful_missing_claim
not_useful
unknown
```

Classification is derived only from visible answer-package support:

```txt
claims > 0 and documents > 0 -> useful
claims > 0 and documents = 0 -> partly_useful_missing_document
claims = 0 and documents > 0 -> partly_useful_missing_claim
claims = 0 and documents = 0 -> not_useful
```

## Readback

A live DB query after the change returned:

```json
{
  "answerUsefulness": "useful",
  "reasons": [
    "Answer package includes governed SourceClaim evidence.",
    "Answer package includes SearchDocument retrieval evidence."
  ],
  "claims": 5,
  "docs": 1,
  "missing": []
}
```

Artifact:

```txt
.local-lab/v354/source-to-decision.json
```

## Command Evidence

| Command | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `pnpm --filter @krn/cli test -- runSourceSearchCommand` | passed | focused source-search behavior tests pass | full repo health or product readiness |
| `pnpm -r --workspace-concurrency=1 --if-present typecheck` | passed | workspace TypeScript project checks pass | runtime behavior or product value |
| `pnpm test` | passed | workspace tests pass with this source change | source truth, ranking quality, or product readiness |
| `git diff --check` | passed | no whitespace errors in current diff | behavior correctness |
| live `krn source search --json` readback | passed | JSON includes answerUsefulness for one DB-backed query | broad benchmark quality or answer correctness |

Note: `rtk pnpm typecheck` surfaced TypeScript help with exit code 1 in this
shell, so it is not used as verification proof. The direct workspace typecheck
command above is the proof used for this slice.

## Evidence / Observation / Reflection

Persisted IDs:

```txt
executionRun: 159f83f6-3745-42eb-804b-0af68efea152
evidenceBundle: a55cd161-e3ec-431b-8a48-c5be64515512
reviewAssessment: 51f7ad9d-8884-4fc5-81d0-f1f7905ebd85
feedbackDelta: dafed123-bcee-4341-ad9a-8dc4202ef4b1
observationGroup: 78945737-1121-4696-b0cb-4d33e742e0a3
observationItems: 5
reflectionRecord: 1712f763-461e-4461-8d54-22eca815a505
reflectionObservationsSelected: 5
reflectionFindings: 0
reflectionGaps: 0
candidateRowsWritten: no
MemoryRecord created: no
```

Source usefulness:

```txt
sourceClaim: v353-answer-usefulness-batch
outcome: helped
reason: V353 evidence drove V354 answerUsefulness labels without changing answer correctness or ranking semantics.
doesNotProve: answer correctness, source truth, ranking quality, product readiness, UI/API/MCP readiness, or Memory Core mutation.
```

## Review Burden Delta

Before: a consumer had to derive usefulness from counts and missing evidence.

After: the answer package gives a label and reasons directly.

Delta: reduced for JSON consumers and terminal operators; still bounded to
readback usefulness, not answer correctness.

## Candidate Outputs

EvalCandidate:

```txt
candidate: source-search JSON answer packages should classify answer usefulness.
evidence: V354 tests and live .local-lab/v354/source-to-decision.json readback
reviewability: ready
doesNotProve: answer correctness, source truth, ranking quality, product readiness
decision: review
```

MemoryCandidate:

```txt
candidate: Treat answer usefulness as decision support, not correctness proof.
evidence: V353/V354 reports
reviewability: ready
doesNotProve: retrieval quality or product readiness
decision: review
```

## Next Recommended Action

Run V355 using the built-in `answerUsefulness` field across the mini Brain-QA
batch. If the field reduces consumer logic and keeps proof boundaries clear,
move to the next product vertical: a bounded ingest/graph answer loop rather
than another guard-only repair.
