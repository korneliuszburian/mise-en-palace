# V237 Activation Abstention Diagnostics And Empty-Store Readback

Status: complete.

Date: 2026-06-28

## Executive Verdict

V237 made activation abstention reviewable. `krn plan` and `krn run show` now expose typed activation retrieval diagnostics, including input status, memory/source/search/owner-file/anti-memory/merged candidate counts, target read-model availability, and a proof boundary.

The DB-backed dogfood run proves the current active project is not suffering from a scoring/ranking failure in this scenario. It is empty:

```txt
inputStatus: empty_activation_store
memory=0 sourceClaims=0 search=0 ownerFile=0 antiMemory=0 merged=0
targetReadModel: not_provided sourceSeeds=0 ownerFiles=0 trustExclusions=0
```

The next bounded step should decide and execute the smallest current-state activation seed/read-model path for the KRN repo. Do not rewrite activation scoring yet.

## Changed

- Added typed activation retrieval diagnostics in harness activation.
- Persisted diagnostics through retrieval/context metadata.
- Rendered diagnostics in `krn plan`.
- Rendered diagnostics in text and JSON `krn run show`.
- Added focused harness and CLI tests.

## DB Dogfood

Persisted run:

```txt
executionRun: 40a21c1e-8b11-4dc3-9788-bdcd487d5c15
taskContract: 5fb83e6b-a772-4c94-b9c6-05544ac37325
contextAssembly: 8f66ba44-0372-402c-8cac-98022158fc68
```

Readback showed:

```txt
Context:
- status: abstained
- inclusions: 0
- exclusions: 0
Activation diagnostics:
- inputStatus: empty_activation_store
- counts: memory=0 sourceClaims=0 search=0 ownerFile=0 antiMemory=0 merged=0
- targetReadModel: not_provided sourceSeeds=0 ownerFiles=0 trustExclusions=0
```

Evidence/readback IDs:

```txt
evidenceBundle: e22ad8e1-02c0-4c5d-812d-4ffd9424f38f
reviewAssessment: c410a352-3ed8-4498-9059-2c740c0c099b
feedbackDelta: 352f8a05-6a67-4746-b120-fa58579dc1da
observationGroup: 93658613-0b81-4676-ae16-496c1afe05c7
reflectionRecord after observe: a5e10c04-519a-40d6-880c-f0e05b5835a8
```

The first reflect command was started in parallel with observe and selected
`0` observations. It is not used as reflection-quality evidence. The repeated
reflect after observe selected `5` observations, wrote no candidate rows, and
created no MemoryRecord.

## Source-To-Decision

```yaml
source_id: v237-empty-store-readback
title: V237 DB-backed activation diagnostics readback
trust_tier: high
source_class: repo-local evidence
mechanism: Activation abstention can now distinguish empty inputs from candidate exclusion by preserving retrieval diagnostics in typed metadata and operator readback.
krn_implication: The next repair should seed or connect current-state activation inputs before scoring/ranking work.
decision_kind: adopt
decision: Append V238 current-state activation seed/read-model decision.
does_not_prove: This does not prove future seeded context will be relevant, product readiness, or activation scoring quality.
consumer: V238 current-state activation seed/read-model decision
falsifier: After current-state seed/read-model exists, DB-backed plans still show empty diagnostics or miss obvious owner-file context without readable reason.
```

## TypeScript Boundary

Boundary classification: internal domain/readback metadata plus CLI rendering.

Validation/narrowing:

- diagnostics are built by harness code before persistence;
- `activationRetrievalDiagnosticsFromMetadata` narrows unknown metadata before CLI use;
- CLI rendering does not trust arbitrary metadata shape.

Type-safety exceptions: none.

## Verification

| Command | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `pnpm --filter @krn/harness test -- activation` | passed | Harness activation diagnostics are covered. | Does not prove CLI rendering. |
| `pnpm --filter @krn/cli test -- runCli runRunShowCommand` | passed | Plan and run-show output render diagnostics. | Does not prove full workspace behavior. |
| `pnpm run typecheck` | passed | Workspace TypeScript types compile. | Does not prove runtime DB readback. |
| `TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | Full workspace tests pass locally. | Does not prove remote CI. |
| `pnpm db:ready` | passed | Local Postgres is reachable with migrations and pgvector. | Does not prove product readiness. |
| `krn plan --persist` | passed | Persisted plan stores/renders diagnostics. | Does not prove selected context quality. |
| `krn run show --run-id 40a21c1e-8b11-4dc3-9788-bdcd487d5c15` | passed | Readback renders persisted diagnostics. | Does not prove memory/source stores are useful. |
| `krn evidence capture --persist` | passed | EvidenceBundle, ReviewAssessment, and FeedbackDelta were persisted with 14 intended files. | Does not prove candidate quality or product readiness. |
| `krn observe --persist` | passed | ObservationGroup with 5 items was persisted without MemoryRecord mutation. | Does not prove observations are useful. |
| `krn reflect --persist` after observe | passed | Reflection selected 5 observations and wrote no MemoryRecord/candidate rows. | Does not prove reflection extraction quality. |
| `git diff --check` | passed | Diff has no whitespace errors. | Does not prove behavior. |

## Condensation Decision

```txt
finding: active project has no activation material and no target read model
frequency: repeated / blocking for activation usefulness
candidate_surface: repair
decision: accept
rationale: diagnostics prove empty inputs; next work should seed/connect current-state activation read model before scoring changes
evidence: V236 report, V237 DB dogfood readback
does_not_prove: seeded context will be useful or complete
falsifier: seeded project still abstains without readable reason
next_task_id: V238-00
```

## Next Task

```txt
V238 Current-State Activation Seed And Read-Model Decision
```

Goal: decide and execute the smallest existing path that gives the current KRN project project kernel/repo installation/source seed/owner-file activation material, then prove `krn plan --persist` no longer reports `empty_activation_store` for a task that should have owner-file context.
