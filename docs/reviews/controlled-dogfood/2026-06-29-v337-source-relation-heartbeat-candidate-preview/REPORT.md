# V337 Source-Relation Heartbeat Candidate Preview

Status: complete bounded candidate-only heartbeat preview.

## Verdict

V337 adds the first heartbeat/dreaming preview surface for source-relation
maintenance:

```txt
SourceClaim + SourceClaimEdge input
  -> source-relation maintenance candidate preview
  -> reviewability + reasons
  -> evidence refs
  -> does-not-prove boundary
  -> mutation: none
```

The preview is a pure `@krn/workers` helper. It does not add a worker daemon,
schema migration, source truth mutation, Memory Core mutation, graph database,
crawler, UI/API/MCP, broad benchmark platform, consensus runtime, or ranking
rewrite.

## Source To Decision

```yaml
source_id: v336-relation-grounded-qa-readback-closure
trust_tier: high
source_class: repo-local evidence
mechanism: V336 made relation-grounded QA answer deltas reviewable and
  regression-protected, but relation maintenance still had no heartbeat-style
  candidate preview.
krn_implication: Before building autonomous heartbeat/dreaming, KRN needs a
  candidate-only source-relation maintenance preview with reviewability,
  evidence refs, and does-not-prove boundaries.
decision_kind: adopt
decision: Add a pure source-relation heartbeat preview helper in `@krn/workers`
  that proposes reviewable maintenance candidates from SourceClaimEdge context.
does_not_prove: This does not prove source truth, edge correctness, autonomous
  worker execution, production graph retrieval quality, product readiness, or
  Memory Core mutation.
consumer: V338 Memory-Staleness Heartbeat Candidate Preview.
falsifier: A stale, weak, or maintenance-class SourceClaimEdge cannot produce a
  reviewable candidate with evidence refs, application guidance, and
  does-not-prove boundary.
```

## Pattern Gate

Retained pattern search:

```txt
source relation heartbeat candidate preview: 0 results
source-to-decision retention gate: 1 result
candidate only heartbeat dreaming: 0 results
```

Applied:

```txt
source-to-decision-retention-gate: helped
evidence-proof-non-proof-boundary: helped through report/evidence rules
typescript boundary: helped through explicit exported types and typecheck
```

Rejected/deferred:

```txt
autonomous worker runtime: rejected for this slice
schema-backed heartbeat queue: rejected for this slice
source truth mutation: rejected for this slice
```

## Implementation

Changed:

```txt
packages/workers/src/sourceRelationHeartbeatPreview.ts
packages/workers/src/sourceRelationHeartbeatPreview.test.ts
packages/workers/src/index.ts
packages/workers/README.md
```

Added:

```txt
buildSourceRelationHeartbeatPreview(...)
```

The preview proposes `source_relation_maintenance_candidate` rows only in
memory/output. It classifies:

```txt
relation_needs_review
relation_evidence_is_weak
connected_claim_is_stale
```

Every candidate includes:

```txt
evidenceRefs
relationEvidenceRefs
applicationGuidance
doesNotProve
reviewability
reviewabilityReasons
mutation: none
forbiddenWrites: memory/source truth writes
```

## DB Dogfood

Fresh V337 persisted run:

```txt
executionRun: 96880465-1194-46a6-a00e-2281efe0826b
taskContract: 9822e05f-3d54-44de-bc75-e058786a7752
harnessPlan: a319bc8f-afb4-4a36-b3e8-1a180f65c6b7
contextAssembly: 28e05653-cf15-4753-9ccc-2e932d7f85bd
retrievalRun: 75c2a88f-cb5c-4503-8314-89e9d45516fa
evidenceBundle: 370200ba-3112-4494-a4af-f873dfd6e161
reviewAssessment: 872a21d6-fb15-4ba8-a28a-c97912824141
feedbackDelta: e8676a19-5aac-4308-81e4-1846a27f7d8c
observationGroup: bc882c81-d5c3-4714-87fa-d054aa6caafa
reflectionRecord: 29417241-5ff4-41f1-88ab-9cd8a945e460
```

KRN activation selected source/edge guardrails:

```txt
source_claim:e3a72d7f-0fbf-4263-a2f8-cf8c93cc9c27
source_claim:7769dfc9-fb91-4f80-804f-01a206b7690e
source_claim:3afb4c95-eaad-4df1-aa72-e8c739f385dd
```

Owner-file recall was mixed:

```txt
selected:
  packages/cli/src/runPlanCommand.ts
  packages/cli/src/runRunShowCommand.ts
  packages/harness/src/activation/activationEngine.ts

manual source inspection selected:
  packages/workers/src/jobTypes.ts
  packages/workers/src/index.test.ts
  packages/workers/README.md
```

This is acceptable for V337 because the source/edge guardrails helped constrain
scope. It does not prove owner-file recall quality.

Evidence capture classified all changed files as intended, with zero unrelated
or unknown files. Observe and reflect persisted staging records without
MemoryRecord mutation or candidate row writes.

## Usefulness

| Evidence | Verdict | Why |
|---|---|---|
| Source-relation preview helper | positive | Provides the first candidate-only heartbeat output for source relation maintenance. |
| Reviewability output | positive | Candidates expose ready/needs-more-evidence style reasons through the core reviewability primitive. |
| DB-backed plan/readback | mixed positive | Selected relevant source/edge guardrails, but did not select workers owner files. |
| Worker boundary | positive | Kept `requiresBackgroundLoop: false` and avoided executor/runtime expansion. |

## Commands

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `git fetch --prune` | passed | local refs refreshed | remote CI status |
| `git status --short --branch` | passed | worktree state was understood | correctness |
| `git log --oneline -n 8` | passed | recent commit context was visible | product readiness |
| `krn knowledge cards --text "source relation heartbeat candidate preview"` | passed, 0 results | exact retained pattern query had no match | no relevant pattern exists |
| `krn knowledge cards --text "source-to-decision retention gate"` | passed, 1 result | source-to-decision retained pattern was readable | source truth |
| `krn knowledge cards --text "candidate only heartbeat dreaming"` | passed, 0 results | exact retained pattern query had no match | no relevant pattern exists |
| `pnpm db:ready` | passed | current-shell Postgres is reachable, 14/14 migrations applied, pgvector available | product readiness |
| `krn plan --persist` | passed | DB-backed V337 run exists | source truth or heartbeat quality |
| `krn run show --run-id 96880465-1194-46a6-a00e-2281efe0826b` | passed | persisted activation readback exposes selected context | owner-file recall quality |
| `krn evidence capture --run-id 96880465-1194-46a6-a00e-2281efe0826b --persist` | passed | persisted command provenance, intended-file classification, review assessment, feedback delta, and source-usefulness outcomes | memory quality, source truth, product readiness |
| `krn observe --run 96880465-1194-46a6-a00e-2281efe0826b --persist` | passed | persisted observation group with five items and no MemoryRecord mutation | reflection quality |
| `krn reflect --scope run:96880465-1194-46a6-a00e-2281efe0826b --persist` | passed | persisted reflection record with no MemoryRecord mutation or candidate row writes | candidate quality at scale |
| `pnpm --filter @krn/workers test` | passed | focused workers tests cover source-relation heartbeat preview | autonomous worker execution |
| `pnpm --filter @krn/workers run typecheck` | passed | workers package compiles | full workspace behavior |
| `pnpm run typecheck` | passed | TypeScript workspace compiles | product readiness |
| `TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | workspace tests pass | product readiness |
| `git diff --check` | passed | diff has no whitespace errors | behavior correctness |

Note: `rtk pnpm --filter @krn/workers typecheck` emitted a wrapper/filter warning
and returned non-zero despite `TypeScript: No errors found`; the equivalent
package command `pnpm --filter @krn/workers run typecheck` passed.

## Proof Boundary

V337 proves KRN can produce candidate-only source-relation maintenance previews
from SourceClaimEdge context without autonomous mutation.

V337 does not prove source truth, edge correctness, production graph retrieval,
autonomous worker execution, heartbeat scheduling, Memory Core mutation,
product readiness, UI/search readiness, or consensus quality.

## Next Recommended Task

```txt
V338 Memory-Staleness Heartbeat Candidate Preview
```

Goal: add the next heartbeat candidate class for stale memory maintenance,
still candidate-only and review-gated, without building a worker daemon or
mutating Memory Core.
