# V364 Heartbeat Preview CLI Readback

Status: complete source repair with DB-backed operator readback.

## Executive Verdict

V364 moves heartbeat/dreaming from a workers-only pure helper into an operator-facing
CLI readback. `krn heartbeat preview` now reads current Postgres memory/source state,
aggregates the V363 candidate-only heartbeat preview, and renders candidates with
evidence refs, `doesNotProve`, reviewability, next action, and an explicit mutation
boundary. This is product progress, not a guard-only slice.

Brain usefulness: positive. KRN planning selected useful guardrails and heartbeat
source context, but owner-file recall could not name the new CLI files before they
existed. Manual source inspection still found the owning CLI parser/runner pattern.

## Source-To-Decision

- Source: V337 source-relation heartbeat preview, V338 memory-staleness heartbeat
  preview, V363 aggregate brain heartbeat preview, V364 DB-backed plan.
- Mechanism: candidate-only heartbeat helpers already produce reviewable maintenance
  candidates; operators still needed a narrow readback surface to inspect live DB
  state before any daemon/scheduler/autonomous mutation work.
- KRN implication: heartbeat/dreaming should first become visible as read-only
  operator evidence, then later be considered for candidate review/eval/worker paths.
- Decision: add `krn heartbeat preview` as a read-only Postgres CLI command.
- Rejected: DB schema, worker daemon, scheduler, crawler, embeddings, UI/API/MCP,
  broad benchmark, consensus runtime, Memory Core mutation, source truth mutation.
- Consumer: technical operator heartbeat readback and future heartbeat review loop.
- Falsifier: operators still need manual DB/source inspection to see heartbeat
  candidates, evidence refs, reviewability, next action, or mutation boundary.
- Does not prove: candidate usefulness, memory truth, source truth, autonomous
  worker execution, scheduling correctness, consensus quality, or product readiness.

## Changed

- `packages/cli/src/parseHeartbeatArgs.ts`
  - adds `krn heartbeat preview` parser with validated CLI options.
- `packages/cli/src/runHeartbeatPreviewCommand.ts`
  - reads project memory/source state from DB and renders `buildBrainHeartbeatPreview`.
- `packages/cli/src/parseArgs.ts`
  - registers heartbeat command and simplifies top-level parser dispatch.
- `packages/cli/src/runCli.ts`
  - registers heartbeat help output.
- `packages/cli/src/runCliCommand.ts`
  - dispatches heartbeat preview through standard CLI error handling.
- `packages/cli/src/databaseRuntime.ts`
  - exposes existing read methods needed by the readback.
- `packages/cli/package.json`, `pnpm-lock.yaml`
  - adds explicit `@krn/workers` dependency for CLI readback reuse.
- focused parser/runner tests.

No DB schema, worker runtime, scheduler, source truth write, SourceDecision write,
or MemoryRecord mutation was added.

## DB-Backed Run

```txt
executionRun: 18ad49a6-2599-4756-8abe-996850e50065
taskContract: 81366328-17bc-4d0e-ba71-192e3fb4a2a3
contextAssembly: baa816f0-1ad7-4b71-84de-494b9d187c88
evidenceBundle: eaffec05-e0c6-4ba7-8fc3-790e58e786e9
reviewAssessment: 92583c69-4d63-46c7-b2f2-2f38582b4152
feedbackDelta: bb65a9f7-71a3-44e4-908d-eb9e61b3ea3e
observationGroup: 887a579b-bb62-4025-add9-c56b195dd628
reflectionRecord: d2b43a36-4382-480c-a1c9-60a9f7496f19
MemoryRecord created: no
```

## Live Readback

```txt
command:
  krn heartbeat preview --memory-limit 10 --source-claim-limit 10 --max-candidates 5

result:
  memoryRecords: 0
  sourceClaims: 10
  sourceClaimEdges: 3
  memoryStaleness candidates: 0
  sourceRelation candidates: 3
  mutation: none
```

JSON readback also renders `nextAction`.

## Verification

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm db:ready` | passed | local Postgres is reachable, 14/14 migrations applied, pgvector available | CI DB state or product readiness |
| `pnpm --filter @krn/cli test -- parseHeartbeatArgs runHeartbeatPreviewCommand` | passed | parser/runner behavior and read-only fake runtime path work | live DB data quality |
| `pnpm --filter @krn/workers test -- brainHeartbeatPreview` | passed | reused V363 aggregate helper still passes focused tests | CLI wiring by itself |
| `pnpm run typecheck` | passed | workspace TS boundaries compile | runtime usefulness |
| `TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | full workspace tests pass | product readiness |
| `pnpm quality:fallow:ci` | passed | changed files have no Fallow findings after parser simplification | whole-repo perfection |
| `krn heartbeat preview ...` | passed | live DB readback renders candidate-only heartbeat output | candidate usefulness or source truth |
| `git diff --check` | passed | no whitespace errors | semantic correctness |
| `krn evidence capture --persist` | passed | persisted command evidence, changed-file classification, source usefulness feedback | automatic memory/source promotion |
| `krn observe --persist` | passed | final observe persisted 9 new observation items for the run | reflection quality |
| `krn reflect --persist` | passed | reflected after observe, selected 14 observations, wrote one ReflectionRecord with 5 findings and 5 gaps | Memory Core mutation or candidate promotion |

## Dogfood Brain Usefulness

| Area | Verdict | Evidence | Next implication |
|---|---|---|---|
| Activation | mixed positive | DB-backed plan selected heartbeat/source guardrails and exclusions | owner-file recall still trails new surfaces |
| Memory | neutral | current live readback found `0` memory records for selected project window | no memory mutation or usefulness claim |
| Source grounding | positive | selected heartbeat/source claims constrained no daemon/schema/UI/API/MCP work | continue source-to-decision closure |
| Evidence/review | positive | command proof/non-proof and mutation boundary are rendered | use capture/observe/reflect after report |
| Candidate quality | positive | candidates include reviewability/reasons/evidence/next action | future task can review candidate usefulness |
| Brain ROI | positive | V364 exposes heartbeat output without broad platform work | next work should use this readback, not build daemon |

## Candidate Outputs

MemoryCandidate:

```txt
summary: Heartbeat/dreaming work should expose candidate-only readback before
autonomous worker execution or memory/source truth mutation.
evidence: this report, V363 report, `krn heartbeat preview` output.
doesNotProve: a readback surface does not prove candidate usefulness or product
readiness.
reviewability: ready
decision: review
```

EvalCandidate:

```txt
summary: `krn heartbeat preview` should render evidence refs, doesNotProve,
reviewability, nextAction, mutation none, and forbiddenWrites.
evidence: `runHeartbeatPreviewCommand.test.ts`.
doesNotProve: unit coverage does not prove live candidate quality.
reviewability: ready
decision: review
```

AntiMemoryCandidate:

```txt
summary: Do not treat heartbeat preview candidates as permission to mutate
Memory Core, SourceClaims, SourceDecisions, source edges, or worker runtime state.
evidence: V364 mutation boundary and forbidden writes.
doesNotProve: this does not block future reviewed worker work.
reviewability: ready
decision: review
```

## Next Recommended Task

Use V364 readback as an input to a bounded candidate review/eval slice before
building any heartbeat daemon. A likely next task is to add a small golden
behavior proof for `krn heartbeat preview` output shape, unless evidence capture
or reflection from this run exposes a higher-risk blocker.
