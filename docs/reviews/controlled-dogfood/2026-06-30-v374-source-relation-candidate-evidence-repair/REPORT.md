# V374 Source Relation Candidate Evidence Repair

Status: complete source repair and dogfood report.
Date: 2026-06-30.

## Verdict

V374 repaired source-relation heartbeat candidates so a relation candidate with
empty `relationEvidenceRefs` is no longer treated as ready for operator
acceptance.

Before this slice, a real heartbeat candidate could be reviewable because it had
the operator readback evidence ref, while its relation-specific evidence list
was empty. After this slice, empty relation evidence produces:

```txt
reviewability: needs_more_evidence
reviewabilityReasons:
- Missing fields: relationEvidenceRefs.
relationEvidenceRequest: Capture concrete SourceClaimEdge evidenceRefs before accepting relation maintenance.
runtimeLoop.status: needs_candidate_evidence
runtimeLoop.nextAction: improve_candidate_evidence
```

No source truth, SourceClaimEdge row, Memory Core state, schema, scheduler,
daemon, crawler, API, MCP, dashboard, or worker runtime was added or mutated.

## KRN Plan

Persisted plan run:

```txt
executionRun: 315b3855-a01d-453f-bcb9-2eb0ef26e6b3
taskContract: 03188ea3-d5a0-4152-8f75-3aaec04607f9
contextAssembly: 039829d6-e0b1-401e-9f13-06de9007051d
evidenceBundle: e7d1b91d-f17a-40d2-b7b2-2229b5097c69
reviewAssessment: cb1fdafb-9cf4-4162-b4a8-e92a14204b9c
feedbackDelta: b44b840b-480e-4229-a3fe-3aafda10cabf
observationGroup: e4a79ee3-f77b-4ddb-ac15-58492522e881
reflectionRecord: cb4519aa-5888-4a2d-ba5d-98c077592d7c
```

Activation selected useful source graph and bounded-context guardrails. It did
not select the direct owner file; `rg` and source inspection found the owner in
`packages/workers/src/sourceRelationHeartbeatPreview.ts`.

## Change

Changed:

- `packages/workers/src/sourceRelationHeartbeatPreview.ts`
- `packages/workers/src/sourceRelationHeartbeatPreview.test.ts`
- `packages/cli/src/runHeartbeatPreviewCommand.ts`
- `packages/cli/src/runHeartbeatPreviewCommand.test.ts`

The implementation keeps the repair at the source-relation candidate boundary:

- adds `relationEvidenceRequest` to source-relation heartbeat candidates;
- keeps existing `relationEvidenceRefs` readback;
- marks empty relation evidence as missing candidate evidence;
- renders `relationEvidenceRequest` in text output;
- preserves JSON readback through the existing candidate object;
- does not alter persistence or review gates.

## Live Readback

Command:

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn heartbeat preview --max-candidates 1
```

Observed:

```txt
candidate: source-relation-heartbeat:0549c002-d52f-4cf0-a6ba-e5e9a36e2ead:relation_evidence_is_weak
reviewability: needs_more_evidence
reviewabilityReasons:
- Missing fields: relationEvidenceRefs.
relationEvidenceRefs:
- none
relationEvidenceRequest: Capture concrete SourceClaimEdge evidenceRefs before accepting relation maintenance.
Runtime loop:
status: needs_candidate_evidence
nextAction: improve_candidate_evidence
reviewableCandidates: 0
mutation: none
```

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm --filter @krn/workers test -- sourceRelationHeartbeatPreview brainHeartbeatPreview` | passed | Worker candidate behavior covers evidence-present and evidence-missing source relation cases. | Source truth, relation correctness, or product readiness. |
| `pnpm --filter @krn/cli test -- runHeartbeatPreviewCommand` | passed | CLI text output exposes the missing-evidence request and runtime status. | Full second-operator usability. |
| `pnpm db:ready` | passed | Local Postgres is reachable, migrations are applied, pgvector is available. | CI DB readiness or production DB truth. |
| `pnpm --filter @krn/workers run typecheck` | passed | Worker TypeScript boundaries compile. | Runtime correctness. |
| `pnpm --filter @krn/cli run typecheck` | passed | CLI TypeScript boundaries compile. | Runtime correctness. |
| `pnpm quality:fallow:ci` | passed | Fallow found no issues in changed JS/TS files. | Fallow is complete or all repo quality issues are fixed. |
| `pnpm run typecheck` | passed | Workspace TypeScript compiles. | Semantic product quality. |
| `TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | Workspace tests pass. | Product readiness or SOTA quality. |
| `git diff --check` | passed | No whitespace errors in diff. | Behavioral correctness. |
| `krn evidence capture --persist` | passed | EvidenceBundle, ReviewAssessment, and FeedbackDelta were persisted for this run. | Candidate truth, source truth, or product readiness. |
| `krn observe --persist` | passed | Observation group was persisted without Memory Core mutation. | Reflection quality or memory usefulness. |
| `krn reflect --persist` | passed | Reflection selected 5 observations and persisted a reflection record without candidate rows or Memory Core mutation. | That reflection extracted useful findings. |

## Pattern Usefulness

`evidence-proof-non-proof-boundary`: helped. The live candidate now separates
operator readback evidence from relation-specific evidence and states the
remaining missing proof.

`codex-prompt-task-contract-proof-boundary`: helped. The slice stayed within the
forbidden-write boundary and produced proof/non-proof evidence.

`ts-boundary-unknown-first-result-state`: neutral. The slice touched TypeScript
domain/readback types but did not introduce a new external input boundary.

## What This Proves

- Source-relation heartbeat candidates now make missing relation evidence visible.
- Operator text output now tells the operator what evidence to capture before
  accepting relation maintenance.
- The runtime loop no longer counts the empty-relation-evidence candidate as
  review-ready.

## What This Does Not Prove

- SourceClaimEdge truth or relation correctness.
- Automated repair of missing evidence.
- Scheduler, daemon, worker runtime, API, MCP, dashboard, crawler, or product
  readiness.
- Second-operator usability.

## Next

Next product-moving step:

```txt
V375: Pattern Research Brain Intake Trial
```

Goal: take one high-value external or retained engineering pattern and run it
through the full research-to-decision path:

```txt
source -> mechanism -> KRN implication -> decision/rejection -> consumer -> falsifier -> eval/candidate
```

Do not build crawler, broad research platform, dashboard, API, MCP, DB schema,
or autonomous memory mutation from this report.
