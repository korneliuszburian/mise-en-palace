# GCR-01 Graph Contradiction And Duplicate Candidate Readback

Date: 2026-07-01

## Summary

GCR-01 improves the existing graph/source-relation heartbeat candidate lane.

Before this slice, source relation candidates exposed `edgeKind`, but the
operator still had to infer the review intent from generic relation maintenance
text. Contradiction and duplicate edges now produce explicit review focus and a
review question:

```txt
relationReviewFocus: contradiction | duplicate | ...
relationReviewQuestion: ...
```

The change uses the existing `SourceClaimEdge` and heartbeat preview surfaces.
It does not add a crawler, entity extractor, DB schema, worker daemon, graph
ranking rewrite, Memory Core mutation, dashboard, API, or MCP surface.

## KRN Plan

Persisted plan:

```txt
executionRun: f3e56b9c-5df9-4562-95da-c36f8053ff71
operatorIntent: 3891b90e-6d50-4fd4-b649-031f79737555
taskContract: acd441bf-1c9a-485d-aae3-63bc4c9f47a3
harnessPlan: 5f522b19-f962-4d4c-8296-aabf96adb516
contextAssembly: 1900aa5e-73de-487b-8be7-38af0aa1912c
```

Activation usefulness: mixed.

KRN selected useful graph/source/ingest guardrails, including source claims
around source relation readback, but owner-file recall was still weak. The
direct owning surface was found by source inspection:

```txt
packages/workers/src/sourceRelationHeartbeatPreview.ts
packages/workers/src/sourceRelationHeartbeatPreview.test.ts
packages/workers/src/brainHeartbeatPreview.test.ts
packages/cli/src/runHeartbeatPreviewCommand.ts
packages/cli/src/runHeartbeatPreviewCommand.test.ts
```

Retained pattern query:

```txt
krn brain knowledge --catalog-file docs/brain-knowledge/catalog.json --text "graph relation contradiction duplicate candidate readback"
```

Result: zero matches. This was treated as no retained-pattern help, not as proof
that no relevant pattern exists.

## Source To Decision

Source:

```txt
packages/workers/src/sourceRelationHeartbeatPreview.ts
packages/cli/src/runHeartbeatPreviewCommand.ts
packages/cli/src/runHeartbeatPreviewCommand.test.ts
packages/workers/src/sourceRelationHeartbeatPreview.test.ts
existing source-search graph readback for contradiction/duplicate edge counts
GCR-01 Beads issue: mise-en-palace-pyr
```

Mechanism:

```txt
SourceClaimEdge already carries graph relation kind. Heartbeat preview already
turns maintenance-class relation edges into candidate-only operator work. The
missing part was an explicit review focus/question for contradiction and
duplicate cases.
```

KRN implication:

```txt
Graph-brain usefulness improves when relation edges become reviewable candidate
intent, not just generic relation maintenance.
```

Decision:

```txt
Add typed relationReviewFocus and relationReviewQuestion fields to existing
source relation heartbeat candidates. Render the fields in heartbeat preview CLI
output. Use typed lookup tables with `satisfies` to keep relation coverage
checked without complex control flow.
```

Rejected:

```txt
New graph subsystem, DB schema, source crawler, entity extraction, graph-aware
ranking, worker runtime, Memory Core mutation, and broad eval platform.
```

Consumer:

```txt
source-relation heartbeat candidates
brain heartbeat aggregate candidates
heartbeat preview CLI text/JSON output
future graph candidate review and mini Brain-QA work
```

Falsifier:

```txt
A contradiction or duplicate SourceClaimEdge still produces only generic
relation maintenance output, heartbeat CLI hides the review focus/question, or
the candidate mutates source truth/Memory Core.
```

## Changed

```txt
packages/workers/src/sourceRelationHeartbeatPreview.ts
  Added typed relation review focus/question to source relation candidates.
  Mapped contradiction, duplicate, supersession, invalidation, expiration,
  stale-claim, and weak-evidence cases through typed lookup tables.

packages/cli/src/runHeartbeatPreviewCommand.ts
  Rendered relationReviewFocus and relationReviewQuestion for source relation
  heartbeat candidates.

packages/workers/src/sourceRelationHeartbeatPreview.test.ts
  Added contradiction and duplicate behavior coverage.

packages/workers/src/brainHeartbeatPreview.test.ts
  Proved duplicate review focus survives brain heartbeat aggregation.

packages/cli/src/runHeartbeatPreviewCommand.test.ts
  Proved CLI output exposes relation review focus/question.
```

## Verification

Passed:

```txt
pnpm --filter @krn/workers test -- sourceRelationHeartbeatPreview brainHeartbeatPreview
pnpm --filter @krn/cli test -- runHeartbeatPreviewCommand
pnpm run typecheck
TMPDIR=/home/krn/.cache/krn-tmp pnpm test
pnpm quality:fallow:ci
pnpm quality:fallow
git diff --check
```

Fallow note:

```txt
The first changed-files Fallow run flagged the initial switch-based helper as a
complexity true positive. The helper was simplified to typed lookup tables, and
the changed-files plus broad Fallow checks then passed.
```

Persisted run evidence:

```txt
evidenceBundle: ae5c363c-0d7f-4c19-afc4-e579f74406b0
reviewAssessment: 110d7383-8d1a-46ba-a435-209def148dd6
feedbackDelta: 1da8b581-22a9-42b9-be7c-9cd14e6eba22
changedFiles: 10 intended, 0 unrelated, 0 unknown
commandProof: 7 operator_reported/passed commands
memoryMutation: none
feedbackCandidateReviewability: too_vague
observationGroup: a436efb4-1cbf-47f4-9132-827b4dda90ba
observationItems: 5
reflectionRecord: 34a096e7-eecb-4dc4-8ca2-f9feec80945b
reflectionObservationsSelected: 5
candidateRowsWritten: no
reflectSequencingCaveat: first parallel reflect ran before observe completed and selected 0 observations; rerun after observe selected 5.
```

## Proof

This proves:

```txt
Existing SourceClaimEdge relation kind can be surfaced as reviewable candidate
intent for contradiction and duplicate graph edges.
Heartbeat preview CLI now shows the review focus/question operators need before
changing source truth or Memory Core state.
The behavior is covered by worker, aggregate heartbeat, CLI, typecheck, tests,
and Fallow.
```

This does not prove:

```txt
Source relation truth is correct.
Graph retrieval/ranking quality improved.
Entity extraction, duplicate consolidation, contradiction resolution, worker
runtime, or Memory Core mutation exists.
Codex will always use the readback correctly.
```

## Brain Usefulness Verdict

```txt
positive
```

KRN helped as a workflow and evidence discipline. DB-backed planning selected
some useful guardrail context, but not the exact owner files. Local source
inspection still carried the owner-file discovery.

## Candidate Outputs

Allowed candidate outputs from this slice:

```txt
MemoryCandidate:
  Graph relation heartbeat candidates should expose relation review focus and
  review question for contradiction/duplicate edges.

EvalCandidate:
  Source relation heartbeat preview should regress contradiction vs duplicate
  candidate focus and CLI readback.

AntiMemoryCandidate:
  Do not treat relation maintenance candidates as source truth, graph retrieval
  quality proof, or Memory Core mutation.
```

No candidate was promoted in this slice.

## Next Recommended Action

Continue the shared brain vertical with `mise-en-palace-0e1` / GRE-01: use the
new relation focus in one bounded eval or mini Brain-QA contradiction/duplicate
readback, without a broad eval platform or multi-agent runtime.
