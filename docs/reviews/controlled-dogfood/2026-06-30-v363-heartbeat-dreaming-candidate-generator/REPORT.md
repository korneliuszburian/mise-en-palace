# V363 Heartbeat/Dreaming Candidate Generator V0

Status: implementation complete, evidence pending.

## Executive Verdict

V363 adds the smallest candidate-only brain heartbeat primitive: a pure
`@krn/workers` preview that aggregates existing memory-staleness and
source-relation maintenance candidates into one reviewable brain heartbeat
output. It does not start a daemon, scheduler, crawler, embedding job,
consensus runtime, or Memory Core mutation.

## Source-To-Decision

- Source: V338 memory-staleness heartbeat preview, V337 source-relation heartbeat
  preview, V362 second local artifact ingest/readback, and the V363 DB-backed
  plan.
- Mechanism: existing previews already emit reviewable maintenance candidates;
  the product gap was a single brain heartbeat surface with shared budget,
  proof/non-proof, and mutation boundary.
- KRN implication: heartbeat/dreaming should begin as candidate-only review
  output before autonomous worker execution or memory/source truth mutation.
- Decision: add `buildBrainHeartbeatPreview` in `@krn/workers` and export it.
- Consumer: future heartbeat CLI/readback, consensus candidate evaluation, and
  maintenance-review workflows.
- Falsifier: the new preview emits MemoryRecord, SourceClaim, SourceDecision, DB
  schema, worker, scheduler, crawler, embedding, UI/API/MCP, broad benchmark, or
  consensus runtime side effects.
- Does not prove: candidate usefulness, source truth, memory truth, autonomous
  dreaming, consensus correctness, product readiness, or operator UX.

## Changed

- `packages/workers/src/brainHeartbeatPreview.ts`
  - aggregates memory-staleness and source-relation heartbeat previews;
  - preserves mutation=`none`, forbidden writes, proof, doesNotProve, and global
    max candidate budget.
- `packages/workers/src/brainHeartbeatPreview.test.ts`
  - covers aggregate output, global budget, ready reviewability, no mutation, and
    empty healthy-input output.
- `packages/workers/src/index.ts`
  - exports the new preview surface.
- `packages/workers/README.md`
  - records the new current-truth capability.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `krn plan --persist` | passed | DB-backed V363 run `ef6bcf83-6850-4af9-9a7b-bd56d69720f4` selected heartbeat/staleness source claims | Owner-file recall sufficiency |
| `pnpm --filter @krn/workers test -- brainHeartbeatPreview` | passed | Workers preview tests cover aggregate heartbeat behavior | Full product quality |
| `pnpm --filter @krn/workers run typecheck` | passed | Workers TypeScript boundaries compile | Runtime usefulness |
| `pnpm quality:fallow:ci` | passed | Changed JS/TS files pass Fallow changed-file quality gate | Whole-repo quality beyond configured gates |
| `git diff --check` | passed | Current diff has no whitespace errors | Product readiness |
| `TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | Full workspace tests pass | CI or production readiness |
| `pnpm run typecheck` | passed | Workspace TypeScript compiles through package scripts | Runtime usefulness |
| `krn evidence capture --persist` | passed | Final bundle preserved intended files and command proof with unrelated/unknown = none | That evidence capture executed the commands |
| `krn observe --persist` | passed | Same-run observation persisted 5 items before reflection | Reflection quality |
| `krn reflect --persist` | passed | Same-run reflection selected 5 observations without Memory mutation or candidate row writes | Candidate usefulness at scale |

## Persisted IDs

```txt
executionRun: ef6bcf83-6850-4af9-9a7b-bd56d69720f4
evidenceBundle: 29b2ce4c-0741-4c13-aad3-9a232bf0c03a
reviewAssessment: f14093ce-7c0a-4240-a155-1069904ce053
feedbackDelta: c4cad9da-32b7-46e2-886d-daf9a3785e36
observationGroup: 791c2ac8-6231-4b11-bd08-4903bf0b355d
observationItems: 5
reflectionRecord: 1fd8114c-ffe7-4c7d-9ca3-9ecc05e9e2ba
reflectionFindings: 0
MemoryRecord created: no
Candidate rows written: no
```

## Brain Usefulness

Positive:

- DB-backed planning selected the V338 heartbeat/staleness source claim.
- Source inspection showed V363 should aggregate existing preview primitives, not
  invent a new dreaming subsystem.
- The implementation moved the project toward heartbeat/dreaming without
  crossing the autonomous mutation boundary.

Weakness:

- Owner-file recall still pointed mostly at plan/run/activation files, not
  `packages/workers/src/*HeartbeatPreview.ts`.

## Next Recommended Action

Proceed to:

```txt
V364 Heartbeat Preview CLI Readback
```

Boundary: expose the V363 pure preview through the smallest operator-facing
readback path, still with no daemon, scheduler, Memory Core mutation, DB schema,
crawler, embeddings, UI/API/MCP, or broad benchmark.
