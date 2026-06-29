# V338 Memory-Staleness Heartbeat Candidate Preview

Status: complete bounded heartbeat/dreaming preview.

## Verdict

V338 adds a candidate-only memory maintenance preview:

```txt
MemoryRecord input
  -> memory-staleness maintenance candidate preview
  -> reviewability + reasons
  -> evidence refs + source lineage refs
  -> invalidation/refresh/feedback intent
  -> does-not-prove boundary
  -> mutation: none
```

The preview is a pure `@krn/workers` helper. It does not add a worker daemon,
schema migration, Memory Core mutation, automatic promotion, source truth
mutation, UI/API/MCP, crawler, broad eval platform, consensus runtime, or
ranking rewrite.

## Source To Decision

```yaml
source_id: v337-source-relation-heartbeat-candidate-preview
trust_tier: high
source_class: repo-local evidence
mechanism: V337 proved a candidate-only heartbeat preview for source-relation
  maintenance. The next missing heartbeat/dreaming class was stale memory
  maintenance.
krn_implication: Before autonomous heartbeat/dreaming exists, KRN needs
  reviewable MemoryRecord maintenance candidates that carry source lineage,
  evidence refs, invalidation intent, and proof/non-proof boundaries.
decision_kind: adopt
decision: Add a pure memory-staleness heartbeat preview helper in
  `@krn/workers`.
does_not_prove: This does not prove memory truth, memory usefulness,
  autonomous worker execution, automatic invalidation correctness, product
  readiness, or Memory Core mutation.
consumer: V339 Consensus Candidate Evaluation Preview.
falsifier: Expired, near-expiry, stale high-confidence, or repeatedly
  negative-feedback memory cannot produce a reviewable candidate with evidence
  refs, source lineage refs, application guidance, invalidation intent, and
  does-not-prove boundary.
```

## Pattern Gate

Retained pattern search:

```txt
memory staleness heartbeat candidate: 0 results
source-to-decision retention gate: 1 result
unknown-first: 2 results
```

Applied:

```txt
source-to-decision-retention-gate: helped
V337 repo-local heartbeat evidence: helped
candidate reviewability primitive: helped
TypeScript explicit exported types: helped
```

Rejected/deferred:

```txt
autonomous worker runtime: rejected
schema-backed heartbeat queue: rejected
automatic memory invalidation/promotion: rejected
consensus runtime: deferred to V339 candidate/eval preview only
```

## Implementation

Changed:

```txt
packages/workers/src/memoryStalenessHeartbeatPreview.ts
packages/workers/src/memoryStalenessHeartbeatPreview.test.ts
packages/workers/src/index.ts
packages/workers/README.md
```

Added:

```txt
buildMemoryStalenessHeartbeatPreview(...)
```

The preview proposes `memory_staleness_maintenance_candidate` rows only in
memory/output. It classifies:

```txt
expired_memory
near_expiry_memory
stale_high_confidence
unresolved_negative_feedback
no_application_feedback
```

Candidate actions:

```txt
review_memory_invalidation
review_memory_refresh
review_memory_feedback
```

Every candidate includes:

```txt
evidenceRefs
sourceLineageRefs
applicationGuidance
invalidationIntent
doesNotProve
reviewability
reviewabilityReasons
mutation: none
forbiddenWrites: memory/source truth writes
```

## DB Dogfood

Fresh V338 persisted run:

```txt
executionRun: 068c2028-3f23-4090-87af-b563159f6e0a
operatorIntent: 4d8ad5c3-a456-4dca-9d4f-3f16df8161ec
taskContract: b6b9d310-01ef-4d57-b483-f97a4290a728
harnessPlan: 2020808f-53aa-4deb-86a7-8cf87c003c66
contextAssembly: 7773fa81-83c0-44e8-b20c-bd40efc60784
retrievalRun: 1c89c87c-85ae-4d41-bcd8-69d21ecc44e2
evidenceBundle: 87f4835c-f4b6-4ef6-94c8-890e70c438e7
reviewAssessment: 14a6a704-c9b7-4923-935b-61782c2a588a
feedbackDelta: c2b76f48-ea24-4f99-9326-65d4bc6f90a0
observationGroup: 9f33a3cd-edc6-4ed1-aef5-0d15b993bc0a
reflectionRecord: 1657c15a-5e9e-4788-94c0-8131b93ff86d
```

KRN activation selected relevant guardrails and graph/source state:

```txt
source_claim:e3a72d7f-0fbf-4263-a2f8-cf8c93cc9c27
source_claim:931e7faa-a982-498f-a265-6a938800f707
source_claim:578d247c-caa7-4cf2-8b27-0a211a00c778
```

Owner-file recall was mixed:

```txt
selected:
  packages/cli/src/runPlanCommand.ts
  packages/cli/src/runRunShowCommand.ts
  packages/harness/src/activation/activationEngine.ts

manual source inspection selected:
  packages/core/src/memory.ts
  packages/workers/src/jobTypes.ts
  packages/workers/src/sourceRelationHeartbeatPreview.ts
  packages/workers/src/sourceRelationHeartbeatPreview.test.ts
  packages/workers/README.md
```

This helped constrain the boundary, but does not prove owner-file recall
quality for worker implementation tasks.

## Usefulness

| Evidence | Verdict | Why |
|---|---|---|
| Memory-staleness preview helper | positive | Adds the missing heartbeat candidate class for stale MemoryRecord maintenance. |
| Reviewability output | positive | Uses the core candidate reviewability primitive with evidence/source lineage. |
| DB-backed plan/readback | mixed positive | Selected useful guardrails and persisted activation trace, but not direct worker owner files. |
| Worker boundary | positive | Kept preview pure and avoided daemon/runtime expansion. |

## Commands

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `git fetch --prune` | passed | local refs refreshed | remote CI status |
| `git status --short --branch` | passed | worktree state was understood | correctness |
| `git log --oneline -n 8` | passed | recent commit context was visible | product readiness |
| `krn knowledge cards --text "memory staleness heartbeat candidate"` | passed, 0 results | exact retained pattern query had no match | no relevant pattern exists |
| `krn knowledge cards --text "source-to-decision retention gate"` | passed, 1 result | source-to-decision retained pattern was readable | source truth |
| `krn knowledge cards --text "unknown-first"` | passed, 2 results | TypeScript boundary patterns were readable | this slice changed external input parsing |
| `pnpm db:ready` | passed | current-shell Postgres is reachable, 14/14 migrations applied, pgvector available | product readiness |
| `krn plan --persist` | passed | DB-backed V338 run exists | source truth or heartbeat quality |
| `krn run show --run-id 068c2028-3f23-4090-87af-b563159f6e0a` | passed | persisted activation readback exposes selected context | owner-file recall quality |
| `krn evidence capture --run-id 068c2028-3f23-4090-87af-b563159f6e0a --persist` | passed | persisted command provenance, intended-file classification, review assessment, feedback delta, and source-usefulness outcomes | memory quality, source truth, product readiness |
| `krn observe --run 068c2028-3f23-4090-87af-b563159f6e0a --persist` | passed | persisted observation group with five items and no MemoryRecord mutation | reflection quality |
| `krn reflect --scope run:068c2028-3f23-4090-87af-b563159f6e0a --persist` | passed | persisted reflection record after observe with no MemoryRecord mutation or candidate row writes | candidate quality at scale |
| `pnpm --filter @krn/workers test` | passed | focused workers tests cover memory-staleness heartbeat preview | autonomous worker execution |
| `pnpm --filter @krn/workers run typecheck` | passed | workers package compiles | full workspace behavior |
| `pnpm run typecheck` | passed | TypeScript workspace compiles | product readiness |
| `TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | workspace tests pass | product readiness |
| `pnpm --filter @krn/harness test -- activePlanInvariants` | passed | compact root plan invariants hold after V339 state update | product readiness |
| `git diff --check` | passed | diff has no whitespace errors | behavior correctness |

## Proof Boundary

V338 proves KRN can produce candidate-only stale-memory maintenance previews
from MemoryRecord validity/review signals without autonomous Memory Core
mutation.

V338 does not prove memory truth, memory usefulness, automatic invalidation
correctness, autonomous worker execution, heartbeat scheduling, product
readiness, UI/search readiness, consensus quality, or activation owner-file
recall quality.

## Next Recommended Task

```txt
V339 Consensus Candidate Evaluation Preview
```

Goal: add the first bounded consensus/eval preview layer that can evaluate a
candidate with preserved dissent and proof/non-proof boundaries, without
building consensus agents, autonomous truth runtime, UI/API/MCP, worker daemon,
or broad benchmark platform.
