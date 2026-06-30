# IMR-09 Heartbeat Candidate-Kind Focus

Status: source/product slice.

Date: 2026-06-30

## Executive Verdict

`krn heartbeat preview` can now focus on a candidate lane with
`--candidate-kind`. The motivating case was IMR-08: a ready
`knowledge_acquisition_candidate` was present, but the aggregate heartbeat
closure stayed `needs_more_evidence` because a separate source-relation lane
emitted a weaker candidate.

Focused acquisition preview now emits only the acquisition lane, avoids reading
memory/source repositories for unrelated lanes, and reports
`ready_for_behavior_proof` for the ready acquisition candidate. This reduces
review burden without changing review gates, DB schema, ranking, crawler
behavior, worker runtime, or Memory Core authority.

## Scope

Beads issue:

```txt
mise-en-palace-xe2: Focus heartbeat preview by candidate kind.
```

Changed source:

```txt
packages/cli/src/parseArgs.ts
packages/cli/src/parseHeartbeatArgs.ts
packages/cli/src/runHeartbeatPreviewCommand.ts
packages/cli/src/parseHeartbeatArgs.test.ts
packages/cli/src/runHeartbeatPreviewCommand.test.ts
```

New CLI input:

```sh
krn heartbeat preview --candidate-kind knowledge_acquisition
```

Allowed values:

```txt
memory_staleness
source_relation
knowledge_acquisition
```

## Source-To-Decision

```yaml
source: IMR-08 live bridge dogfood
mechanism: >
  Multiple heartbeat lanes can emit candidates with different reviewability.
  Aggregate closure can be correct globally while obscuring a ready candidate in
  the lane the operator is trying to inspect.
krn_implication: >
  Heartbeat preview needs focused lane readback so one ready candidate does not
  get hidden behind unrelated weaker candidates.
decision: >
  Add a CLI candidate-kind focus filter and make the runner skip unrelated lane
  reads before building the preview.
consumer: packages/cli/src/runHeartbeatPreviewCommand.ts
falsifier: >
  Focused knowledge_acquisition preview still emits source_relation or
  memory_staleness candidates, touches unrelated repositories, or changes
  mutation/review-gate behavior.
does_not_prove: >
  Candidate truth, acquisition quality, source truth, ranking quality,
  scheduler readiness, autonomous worker execution, or Memory Core mutation.
```

## What Changed

- Added `--candidate-kind <kind>` parser support.
- Kept candidate kind values as a narrow literal union.
- Made the heartbeat runner load memory rows only for `memory_staleness`.
- Made the heartbeat runner load source claims/edges only for `source_relation`.
- Made acquisition readback loading conditional on `knowledge_acquisition`.
- Added JSON/text readback of selected candidate kinds.
- Added focused tests proving knowledge-acquisition output does not touch
  memory/source repositories and emits only the acquisition candidate.

## Live Readback

Command:

```sh
rtk env KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn \
  pnpm --silent --filter @krn/cli krn heartbeat preview \
  --candidate-kind knowledge_acquisition \
  --max-candidates 10 \
  --evidence-ref docs/reviews/controlled-dogfood/2026-06-30-imr-09-heartbeat-candidate-kind-focus/REPORT.md \
  --acquisition-readback-file .local-lab/imr-08-missing-evidence-bridge/brain-search-missing-evidence.json \
  --json
```

Observed:

```txt
candidateKinds: knowledge_acquisition
memoryRecordCount: 0
sourceClaimCount: 0
sourceClaimEdgeCount: 0
candidateCounts:
  memoryStaleness: 0
  sourceRelation: 0
  knowledgeAcquisition: 1
reviewEvalClosure: ready_for_behavior_proof -> add_golden_behavior_case
runtimeLoop: ready_for_operator_review -> review_candidates_and_capture_evidence
candidate kind emitted: knowledge_acquisition_candidate
mutation: none
```

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `rtk pnpm --filter @krn/cli test -- parseHeartbeatArgs runHeartbeatPreviewCommand` | passed | Parser/runner tests cover candidate-kind focus and existing heartbeat behavior. | Live DB content quality or product readiness. |
| `rtk pnpm --filter @krn/cli run typecheck` | passed | CLI TypeScript boundaries compile. | Runtime usefulness. |
| `rtk pnpm -r --workspace-concurrency=1 --if-present typecheck` | passed | Workspace TypeScript boundaries compile. | Behavior correctness by itself. |
| `rtk pnpm quality:fallow:ci` | failed, then passed after simplification | Fallow caught complexity in the parser/runner; helper extraction removed the changed-files findings. | Fallow does not prove product usefulness or semantic correctness. |
| `rtk pnpm db:ready` | passed | Current-shell DB, migrations, and pgvector are ready. | Production DB state or source truth. |
| `rtk pnpm test` | passed | Full workspace tests pass after focused heartbeat readback. | Product readiness. |
| focused live heartbeat command above | passed | Current-shell DB-backed heartbeat preview can isolate acquisition candidates from unrelated lanes. | Candidate truth, acquisition quality, or Memory Core mutation. |
| `rtk git diff --check` | passed | Diff has no whitespace errors. | Behavior correctness by itself. |

## Brain Usefulness

Verdict: positive.

The previous slice produced a real observation, not a hypothetical concern:
operator review of the acquisition lane was noisier because source-relation
maintenance was mixed into the same aggregate closure. This slice lets the
operator focus the heartbeat readback on the lane being reviewed.

## Next Repair

Use the focused acquisition candidate for a bounded source/evidence follow-up:

```txt
source/brain missingEvidence
-> focused heartbeat acquisition candidate
-> source/evidence follow-up or explicit rejection
-> captured evidence
-> candidate remains review-gated
```

Do not add crawler, DB schema, ranking rewrite, worker daemon, API/MCP, or
Memory Core mutation.
