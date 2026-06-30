# V369 End-To-End Product Loop Replay

Status: complete.

## Executive Verdict

V369 replayed one bounded KRN-on-KRN product loop with existing surfaces:
`brain search`, persisted `plan`, `codex brief`, `evidence capture`,
`observe`, `reflect`, `run show`, and next-run `brain search`.

The loop is technically usable and DB-backed, but it still exposes product
gaps: reflection produced no findings, the feedback candidate was too vague,
and next-run brain search had no knowledge-card match for `end-to-end product
loop`.

## Run

```txt
executionRun: 3a74c358-7a0a-403f-9593-8ec7950a3eb5
taskContract: f1b433e0-4876-4513-952e-e7d5c254fea0
harnessPlan: 69f684d4-138b-4812-979e-5ca312f15f7f
contextAssembly: 1e1c174b-162f-4668-bdd5-f79c45876014
evidenceBundle: b3e1d3ae-f697-449e-848e-ee783baf2b80
reviewAssessment: f5b4b0b2-e274-4f2f-af16-0b3eca877673
feedbackDelta: 0a877e52-0da2-4b6d-a2c9-ea9400507aae
observationGroup: 62f2c905-069d-4234-a500-7c501f0d79d9
reflectionRecord: e32ad44e-80b9-4af9-b307-3756122036a8
```

## Loop Steps

| Step | Result | Notes |
|---|---:|---|
| `krn plan --persist` | passed | selected 6 context items and 15 exclusions |
| `krn codex brief --run-id ...` | passed | rendered read-only brief from DB |
| `krn evidence capture --persist` | passed | recorded 7 operator-reported passed commands |
| `krn observe --persist` | passed | wrote 5 observation items, no memory mutation |
| `krn reflect --persist` | passed | wrote 1 reflection record, no findings/candidates |
| `krn run show --json` | passed | read persisted run/evidence/review/feedback |
| `krn brain search --query "end-to-end product loop"` | passed | no knowledge cards, partly useful source-search |

## Activation Usefulness

Activation selected useful guardrails and owner-file candidates:

```txt
included: 6
excluded: 15
owner files: runRunShowCommand, runPlanCommand, activationEngine
source claims: bounded ingest loop, heartbeat preview, source artifact flow
```

Verdict: useful for guardrails and readback owner files, not enough to prove
ranking quality or product readiness.

## Evidence / Review

Evidence was DB-backed and operator-reported. `run show` preserved:

```txt
changed files: .beads/issues.jsonl
classification: unknown
commands: 7 operator_reported / passed
feedback candidate reviewability: too_vague
Memory mutation: none
```

The unknown Beads file was a true dirty-context signal from claiming V369 after
the V368 commit. It should be classified as intended in final evidence capture
for future task-graph-only changes.

## Reflection / Candidate Quality

Reflection persisted successfully:

```txt
observations selected: 5
findings: 0
contradictions: 0
gaps: 0
candidate rows written: no
MemoryRecord created: no
```

Verdict: technically correct, but still weak as a usefulness generator for
this replay. Candidate output also stayed too vague:

```txt
memory-candidate-proposal-1782818120744-1
reviewability: too_vague
reason: Candidate does not name a concrete future use.
```

## Next-Run Readback

Command:

```sh
pnpm --filter @krn/cli krn brain search \
  --query "end-to-end product loop" \
  --limit 3 \
  --max-inclusions 3 \
  --json
```

Observed:

```txt
knowledge cards: 0
sourceSearch.answerUsefulness: partly_useful_missing_document
supportingClaims: 3
supportingDocuments: 0
relationSupport: 3
missingEvidence: included SearchDocument evidence for this combined query
```

This is the main product signal: the loop can replay, but the brain does not
yet retain a strong pattern-card/readback for the end-to-end product loop.

## What This Proves

- KRN can run a DB-backed replay across plan, brief, evidence, observe,
  reflect, run readback, and brain search.
- Existing surfaces preserve no-mutation boundaries.
- Evidence/review/candidate readback is inspectable without ad hoc SQL.
- Brain search can expose missing knowledge-card coverage.

## What This Does Not Prove

- It does not prove product readiness.
- It does not prove activation ranking quality.
- It does not prove reflection usefulness.
- It does not prove candidate quality.
- It does not prove graph retrieval quality.
- It does not prove a second operator can use KRN.

## Next Recommended Action

V370 should move into Graph Brain v1:

```txt
entities / claims / relations / temporal edges / contradictions /
duplicates / graph-aware readback
```

Keep it bounded: use existing source-search/readback paths first, no dashboard,
API, MCP server, crawler, schema rewrite, worker daemon, or broad benchmark.
