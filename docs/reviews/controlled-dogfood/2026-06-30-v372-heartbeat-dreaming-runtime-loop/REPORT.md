# V372 Heartbeat/Dreaming Candidate Runtime Loop

Status: complete source repair and dogfood report.
Date: 2026-06-30.

## Verdict

V372 moved heartbeat/dreaming from a candidate-only preview dump toward a
bounded manual runtime loop. The loop now tells an operator whether current
maintenance candidates are ready for review, how many were inspected, how many
are reviewable, and the next action before any mutation.

This does not add a scheduler, daemon, crawler, API, MCP surface, DB schema,
worker runtime, broad benchmark, or autonomous Memory Core mutation.

## KRN Plan

Persisted plan run:

```txt
executionRun: 042d3ae9-ffa3-4951-a1a0-c5509cf62dc5
evidenceBundle: 490e35f3-05da-47d9-bac1-99c9dba57083
reviewAssessment: 00853da0-9e58-4c94-9a1c-572a3e6e138a
feedbackDelta: 83b52b1e-555c-4df2-bb2d-e580af2f5a3b
observationGroup: 60f426f8-2803-4556-97f0-c53ff739a7a7
reflectionRecord: d7c23950-0b63-41d5-9463-f64c7640e45e
```

Activation selected useful guardrails about bounded context, ingest/readback,
and heartbeat preview. It did not select the direct heartbeat owner files, so
owner-file recall remains a product gap for later work.

## Change

Changed:

- `packages/workers/src/brainHeartbeatPreview.ts`
- `packages/workers/src/brainHeartbeatPreview.test.ts`
- `packages/cli/src/runHeartbeatPreviewCommand.ts`
- `packages/cli/src/runHeartbeatPreviewCommand.test.ts`

Added `BrainHeartbeatRuntimeLoopReadback`:

```txt
mode: manual_candidate_only
status:
  ready_for_operator_review
  needs_candidate_evidence
  no_candidates
nextAction:
  review_candidates_and_capture_evidence
  improve_candidate_evidence
  seed_or_select_heartbeat_candidate_state
mutation: none
forbiddenWrites includes worker_jobs
```

The CLI now renders a compact `Runtime loop` section in
`krn heartbeat preview` output. JSON output includes the same typed readback via
the existing preview object.

## Runtime Readback

Live current-shell command:

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn heartbeat preview --max-candidates 5
```

Observed:

```txt
status: ready_for_operator_review
nextAction: review_candidates_and_capture_evidence
inspectedCandidates: 4
reviewableCandidates: 4
mutation: none
```

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm db:ready` | passed | Local Postgres is reachable, migrations are applied, pgvector is available. | CI DB readiness or production DB truth. |
| `pnpm --filter @krn/workers test -- brainHeartbeatPreview` | passed | Worker heartbeat runtime-loop readback behavior is covered. | Product usefulness or autonomous runtime readiness. |
| `pnpm --filter @krn/cli test -- runHeartbeatPreviewCommand` | passed | CLI renders runtime-loop readback and JSON shape. | Full operator success on another machine. |
| `pnpm --filter @krn/workers run typecheck` | passed | Worker TypeScript boundaries compile. | Runtime correctness. |
| `pnpm --filter @krn/cli run typecheck` | passed | CLI TypeScript boundaries compile. | Runtime correctness. |
| `pnpm run typecheck` | passed | Workspace TypeScript compiles. | Semantic product quality. |
| `pnpm test` | passed | Workspace tests pass. | Product readiness or SOTA quality. |
| `pnpm quality:fallow:ci` | passed | Fallow found no issues in changed JS/TS files. | Fallow is complete or all repo quality issues are fixed. |
| `git diff --check` | passed | No whitespace errors in diff. | Behavioral correctness. |
| `krn observe --persist` | passed | Run evidence was staged into 9 observation items without Memory mutation. | Reflection quality or memory usefulness. |
| `krn reflect --persist` | passed | Run-scoped reflection selected 9 observations and wrote a reflection record without Memory mutation. | Candidate quality at scale or autonomous dreaming readiness. |

## Dogfood Usefulness

KRN helped by preserving scope: candidate-only, reviewable, no mutation, no
runtime platform. The persisted plan selected useful guardrails but missed the
direct owner files, which were found by source inspection.

Brain usefulness verdict: positive for workflow and proof boundary, mixed for
owner-file activation.

## Candidates

MemoryCandidate:

```txt
Candidate-only heartbeat loops should expose a manual runtime-loop readback
before any scheduler, daemon, or autonomous mutation is built.
reviewability: ready
doesNotProve: This does not prove scheduler readiness, candidate truth, or
Memory Core mutation safety.
```

EvalCandidate:

```txt
Heartbeat preview output should fail if runtimeLoop no longer exposes
manual_candidate_only mode, readiness status, reviewable candidate counts, and
worker_jobs as forbidden writes.
reviewability: ready
doesNotProve: This does not prove future operator review quality.
```

## Next

Next product-moving step should stay on the vertical loop:

```txt
V373: Review one heartbeat runtime-loop candidate and capture evidence/result
without mutating final truth automatically.
```

Do not open scheduler, daemon, crawler, MCP/API, dashboard, embeddings, or broad
benchmark work from this report.
