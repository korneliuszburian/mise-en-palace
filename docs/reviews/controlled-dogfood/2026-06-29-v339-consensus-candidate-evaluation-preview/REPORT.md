# V339 Consensus Candidate Evaluation Preview

Status: complete bounded consensus/eval preview.

## Verdict

V339 adds the first candidate-only consensus/eval preview:

```txt
Candidate input + support/dissent/risk evidence
  -> consensus candidate evaluation preview
  -> preserved dissent
  -> decision options
  -> reviewability + reasons
  -> evidence refs
  -> does-not-prove boundary
  -> mutation: none
```

The preview is a pure `@krn/workers` helper. It does not add consensus agents,
autonomous truth runtime, schema migration, worker daemon, UI/API/MCP, crawler,
broad eval platform, Memory Core mutation, SourceClaim mutation,
SourceDecision mutation, EvalCandidate promotion, or automatic candidate
promotion.

## Source To Decision

```yaml
source_id: v338-memory-staleness-heartbeat-candidate-preview
trust_tier: high
source_class: repo-local evidence
mechanism: V337/V338 proved candidate-only heartbeat previews for source
  relations and stale memory. The next missing brain layer is candidate
  consensus/eval that preserves dissent before any consensus runtime exists.
krn_implication: KRN needs a bounded consensus preview that helps a human
  reviewer distinguish support, dissent, risk, decision options, and
  proof/non-proof boundaries without creating autonomous truth.
decision_kind: adopt
decision: Add a pure consensus candidate evaluation preview helper in
  `@krn/workers`.
does_not_prove: This does not prove candidate truth, consensus correctness,
  promotion readiness, autonomous agent judgment, product readiness, or Memory
  Core mutation.
consumer: V340 Ingest v0 Product Loop Closure.
falsifier: A candidate with support and dissent cannot produce a read-only
  evaluation that preserves dissent, decision options, evidence refs, and
  does-not-prove boundary.
```

## Pattern Gate

Retained pattern search:

```txt
consensus candidate evaluation preview: 0 results
source-to-decision retention gate: 1 result
candidate reviewability: 0 results
```

Applied:

```txt
source-to-decision-retention-gate: helped
V338 repo-local evidence: helped
candidate reviewability primitive: helped
TypeScript explicit exported types: helped
```

Rejected/deferred:

```txt
consensus agent runtime: rejected
autonomous truth runtime: rejected
schema-backed consensus table: rejected
automatic candidate promotion: rejected
```

## Implementation

Changed:

```txt
packages/workers/src/consensusCandidateEvaluationPreview.ts
packages/workers/src/consensusCandidateEvaluationPreview.test.ts
packages/workers/src/index.ts
packages/workers/README.md
```

Added:

```txt
buildConsensusCandidateEvaluationPreview(...)
```

The preview evaluates candidate evidence positions:

```txt
support
dissent
risk
```

Decision options:

```txt
review_candidate
defer_candidate
reject_candidate
request_more_evidence
```

Every evaluation includes:

```txt
supportEvidenceRefs
dissentEvidenceRefs
riskEvidenceRefs
preservedDissent
decisionOptions
doesNotProve
reviewability
reviewabilityReasons
mutation: none
forbiddenWrites: memory/source/eval truth writes
```

## DB Dogfood

Fresh V339 persisted run:

```txt
executionRun: 85ed752e-a716-4ec1-9946-7ba84e224d99
operatorIntent: 8a142b56-62b4-4ba1-97f1-6669cec3cdb4
taskContract: 7aa548b4-bfc0-4e3f-a83c-73f84a114a31
harnessPlan: d1ebc873-6d8f-4165-b8fa-0db74427f495
contextAssembly: e5c76a90-f0e2-4abc-9ff2-d969d7115052
retrievalRun: 4048c637-ec04-4d37-bf95-dbcc3ec8d241
evidenceBundle: 03d44f13-29bc-4725-a968-e4c1dc2889d9
reviewAssessment: b7a7a696-1cae-46cd-9373-6a4fad3ceca6
feedbackDelta: 34e3bf69-ed80-4229-846a-38fd19aac58b
observationGroup: aedfb118-900f-4101-9dc4-86e9047918d2
reflectionRecord: fcc8569b-92cc-4f24-971e-2e17491225ac
```

KRN activation selected useful guardrails and source state:

```txt
source_claim:e3a72d7f-0fbf-4263-a2f8-cf8c93cc9c27
source_claim:3afb4c95-eaad-4df1-aa72-e8c739f385dd
source_claim:7769dfc9-fb91-4f80-804f-01a206b7690e
```

Owner-file recall was mixed:

```txt
selected:
  packages/cli/src/runPlanCommand.ts
  packages/cli/src/runRunShowCommand.ts
  packages/harness/src/activation/activationEngine.ts

manual source inspection selected:
  packages/core/src/candidateReviewability.ts
  packages/core/src/eval.ts
  packages/workers/src/sourceRelationHeartbeatPreview.ts
  packages/workers/src/memoryStalenessHeartbeatPreview.ts
  packages/workers/README.md
```

This helped constrain proof boundaries and source state, but it does not prove
owner-file recall quality for worker implementation tasks.

## Usefulness

| Evidence | Verdict | Why |
|---|---|---|
| Consensus candidate preview helper | positive | Adds the first candidate-only support/dissent/risk evaluation surface. |
| Preserved dissent | positive | Dissent remains explicit evidence, not a hidden scoring side effect. |
| Decision options | positive | Human review can see review/defer/reject/more-evidence paths. |
| DB-backed plan/readback | mixed positive | Selected useful guardrails and source context, but not direct worker owner files. |
| Worker boundary | positive | Kept preview pure and avoided consensus/runtime expansion. |

## Commands

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `git fetch --prune` | passed | local refs refreshed | remote CI status |
| `git status --short --branch` | passed | worktree state was understood | correctness |
| `git log --oneline -n 8` | passed | recent commit context was visible | product readiness |
| `krn knowledge cards --text "consensus candidate evaluation preview"` | passed, 0 results | exact retained pattern query had no match | no relevant pattern exists |
| `krn knowledge cards --text "source-to-decision retention gate"` | passed, 1 result | source-to-decision retained pattern was readable | source truth |
| `krn knowledge cards --text "candidate reviewability"` | passed, 0 results | exact retained pattern query had no match | no relevant pattern exists |
| `pnpm db:ready` | passed | current-shell Postgres is reachable, 14/14 migrations applied, pgvector available | product readiness |
| `krn plan --persist` | passed | DB-backed V339 run exists | source truth or consensus quality |
| `krn run show --run-id 85ed752e-a716-4ec1-9946-7ba84e224d99` | passed | persisted activation readback exposes selected context | owner-file recall quality |
| `krn evidence capture --run-id 85ed752e-a716-4ec1-9946-7ba84e224d99 --persist` | passed | persisted command provenance, intended-file classification, review assessment, feedback delta, and source-usefulness outcomes | memory quality, source truth, product readiness |
| `krn observe --run 85ed752e-a716-4ec1-9946-7ba84e224d99 --persist` | passed | persisted observation group with five items and no MemoryRecord mutation | reflection quality |
| `krn reflect --scope run:85ed752e-a716-4ec1-9946-7ba84e224d99 --persist` | passed | persisted reflection record after observe with no MemoryRecord mutation or candidate row writes | candidate quality at scale |
| `pnpm --filter @krn/workers test` | passed | focused workers tests cover consensus candidate evaluation preview | consensus correctness |
| `pnpm --filter @krn/workers run typecheck` | passed | workers package compiles | full workspace behavior |
| `pnpm run typecheck` | passed | TypeScript workspace compiles | product readiness |
| `TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | workspace tests pass | product readiness |
| `pnpm --filter @krn/harness test -- activePlanInvariants` | passed | compact root plan invariants hold after V340 state update | product readiness |
| `git diff --check` | passed | diff has no whitespace errors | behavior correctness |

## Proof Boundary

V339 proves KRN can produce candidate-only consensus/eval previews that preserve
support, dissent, risk, decision options, evidence refs, reviewability, and
does-not-prove boundaries without autonomous truth mutation.

V339 does not prove candidate truth, consensus correctness, autonomous agent
judgment, promotion readiness, product readiness, UI/search readiness, broad
eval quality, or activation owner-file recall quality.

## Next Recommended Task

```txt
V340 Ingest v0 Product Loop Closure
```

Goal: use the existing local artifact, SearchDocument, SourceClaim, activation,
and readback pieces to close one small ingest-to-use product loop without
building a crawler, UI/API/MCP, broad eval platform, worker daemon, or new DB
schema.
