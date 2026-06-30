# V373 Heartbeat Runtime Candidate Review Result

Status: complete source repair and dogfood report.
Date: 2026-06-30.

## Verdict

V373 reviewed one heartbeat runtime-loop maintenance candidate and recorded the
result without mutating final truth.

Reviewed candidate:

```txt
source-relation-heartbeat:0549c002-d52f-4cf0-a6ba-e5e9a36e2ead:relation_evidence_is_weak
```

Decision:

```txt
defer_pending_evidence
nextAction: request_more_candidate_evidence
```

Reason: the candidate is reviewable, but the current `relationEvidenceRefs`
list is empty. KRN should request source-edge evidence before changing source
truth or source relation state.

## KRN Plan

Persisted plan run:

```txt
executionRun: 6cd988b0-1f89-4436-a892-adaca45816bb
evidenceBundle: b5b56306-cda7-4a2b-a453-d4733fd13439
reviewAssessment: 373c1a13-5b4b-4e20-888e-381b766062c6
feedbackDelta: 689d724b-88f8-4813-aee5-c91ad2e08d95
observationGroup: b1edcbba-e952-4917-8154-9a00e32b5f9a
reflectionRecord: 80d34eab-495b-42f4-9f7d-459efc27c249
```

Activation selected useful guardrails about bounded context, ingest/readback,
and heartbeat preview. It did not select the direct heartbeat owner files, so
owner-file recall remains a later product gap.

## Change

Changed:

- `packages/workers/src/brainHeartbeatPreview.ts`
- `packages/workers/src/brainHeartbeatPreview.test.ts`
- `packages/cli/src/parseArgs.ts`
- `packages/cli/src/parseHeartbeatArgs.ts`
- `packages/cli/src/parseHeartbeatArgs.test.ts`
- `packages/cli/src/runHeartbeatPreviewCommand.ts`
- `packages/cli/src/runHeartbeatPreviewCommand.test.ts`

Added optional heartbeat preview review input:

```txt
--review-candidate-id <id>
--review-decision accept_for_manual_followup|defer_pending_evidence|reject_not_actionable
--review-reason <text>
--review-evidence-ref <ref>
--reviewer <name>
```

The parser requires a complete review input set. The command output now renders
`Candidate review result` when review fields are supplied. JSON output includes
the same readback as `preview.candidateReviewResult`.

No DB schema, scheduler, daemon, crawler, UI/API/MCP, worker runtime, broad
benchmark, SourceClaim mutation, SourceClaimEdge mutation, or Memory Core
mutation was added.

## Live Readback

Command:

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn heartbeat preview \
  --max-candidates 1 \
  --review-candidate-id "source-relation-heartbeat:0549c002-d52f-4cf0-a6ba-e5e9a36e2ead:relation_evidence_is_weak" \
  --review-decision defer_pending_evidence \
  --review-reason "Relation candidate is reviewable but current relationEvidenceRefs are empty; request source-edge evidence before changing source truth." \
  --review-evidence-ref docs/reviews/controlled-dogfood/2026-06-30-v373-heartbeat-runtime-candidate-review-result/REPORT.md \
  --reviewer krn-operator
```

Observed:

```txt
candidateFound: true
decision: defer_pending_evidence
nextAction: request_more_candidate_evidence
candidateReviewability: ready
mutation: none
```

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm db:ready` | passed | Local Postgres is reachable, migrations are applied, pgvector is available. | CI DB readiness or production DB truth. |
| `pnpm --filter @krn/workers test -- brainHeartbeatPreview` | passed | Worker review-result readback behavior is covered. | Candidate truth or promotion readiness. |
| `pnpm --filter @krn/cli test -- parseHeartbeatArgs runHeartbeatPreviewCommand` | passed | CLI parsing/rendering for heartbeat review-result input is covered. | Full operator success on another machine. |
| `pnpm --filter @krn/workers run typecheck` | passed | Worker TypeScript boundaries compile. | Runtime correctness. |
| `pnpm --filter @krn/cli run typecheck` | passed | CLI TypeScript boundaries compile. | Runtime correctness. |
| `pnpm run typecheck` | passed | Workspace TypeScript compiles. | Semantic product quality. |
| `pnpm test` | passed | Workspace tests pass. | Product readiness or SOTA quality. |
| `pnpm quality:fallow:ci` | passed | Fallow found no issues in changed JS/TS files after normalization. | Fallow is complete or all repo quality issues are fixed. |
| `git diff --check` | passed | No whitespace errors in diff. | Behavioral correctness. |
| `krn evidence capture --persist` | passed | EvidenceBundle, ReviewAssessment, and FeedbackDelta were persisted for this run. | Candidate truth, source truth, or product readiness. |
| `krn observe --persist` | passed | Observation group was persisted without Memory Core mutation. | Reflection quality or memory usefulness. |
| `krn reflect --persist` | passed | Reflection record was persisted without candidate rows or Memory Core mutation. | That reflection extracted useful findings. |

## Pattern Usefulness

`ts-boundary-unknown-first-result-state`: helped. The CLI parser rejects
partial or unknown review decisions and returns explicit parse errors.

`evidence-proof-non-proof-boundary`: helped. The review result records
`doesNotProve` and `mutation: none`.

## Next

Next product-moving step:

```txt
V374: Source Relation Candidate Evidence Repair
```

Goal: make source-relation heartbeat candidates expose or request concrete
`relationEvidenceRefs` before operator review can accept source relation
maintenance.

Do not promote source truth, mutate SourceClaimEdge rows, add scheduler/daemon,
or build UI/API/MCP from this report.
