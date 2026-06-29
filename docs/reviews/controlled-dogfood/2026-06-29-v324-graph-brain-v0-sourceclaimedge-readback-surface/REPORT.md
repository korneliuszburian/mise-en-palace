# V324 Graph Brain v0 SourceClaimEdge Readback Surface

Status: complete.
Date: 2026-06-29

## Executive Verdict

V324 adds the smallest operator-facing graph-edge readback surface:
`krn source claim edges --source-claim-id <id>`.

The command reads persisted `SourceClaimEdge` rows connected to a
`SourceClaim`, renders edge kind, direction, from/to ids, consumer,
`doesNotProve`, evidence/source-range metadata, and states proof/non-proof
boundaries. It is read-only and does not rank, extract, crawl, run a graph
runtime, mutate Memory Core, or prove graph truth.

## Source To Decision

Source: V323 report and persisted edge
`415321b3-4a26-4634-bfbe-38b756777d6a`.

Mechanism: V323 proved graph-edge creation/readback only at artifact preview
time. A direct source-claim readback command lets operators inspect persisted
edge substrate before graph ranking, extraction, crawler, UI/API/MCP, worker,
or consensus work.

KRN implication: graph brain v0 should expose governed graph substrate before
claiming graph intelligence.

Decision: add `krn source claim edges --source-claim-id <id>` under the
existing source namespace, using the existing repository read method.

Consumer: future graph-aware retrieval, duplicate/contradiction detection,
temporal slices, consensus candidate evaluation, and knowledge search.

Falsifier: a persisted `SourceClaimEdge` exists but cannot be inspected by
claim id with governance metadata, or the readback implies source truth,
ranking quality, graph runtime, or Memory Core mutation.

Does not prove: source truth, edge correctness, graph retrieval quality,
ranking, extraction, product readiness, or UI/search readiness.

## Changed

- `packages/cli/src/parseSourceArgs.ts`
  - added `krn source claim edges --source-claim-id <id>` parsing and usage.
- `packages/cli/src/runSourceClaimEdgesCommand.ts`
  - added read-only DB-backed `SourceClaimEdge` readback.
- `packages/cli/src/runCli.ts`
  - wired the new source readback command and help path.
- `packages/cli/src/parseArgs.ts`
  - added the command to governed admin usage.
- CLI tests
  - cover parser behavior, required input errors, help, readback rendering,
    no write calls, proof/non-proof output, and missing claim behavior.
- `package.json`
  - corrected root `typecheck` to `pnpm -r --workspace-concurrency=1 --if-present typecheck`
    so the root verification command no longer fails on a workspace without a
    typecheck script.

No schema, migration, graph runtime, crawler, UI/API/MCP, worker daemon,
consensus runtime, target-repo write, or Memory Core mutation was added.

## Live DB Proof

DB readiness:

```txt
DB mode: ready
Postgres: reachable
Migrations expected: 14
Migrations applied: 14
pgvector: available
Brain store readiness: ready
```

Persisted KRN plan:

```txt
executionRun: e341ae73-4449-4f83-88eb-7c12f35166e6
taskContract: 9d59b02f-c9f3-4b32-80fd-a0c8c480e814
contextAssembly: 6c1d6691-182b-4d0c-885f-f4a72dce2091
```

Evidence/observe/reflect:

```txt
evidenceBundle: 8361974d-04ed-43c4-8d24-ebe5e640f4ef
reviewAssessment: 4595bf11-e301-4166-a40d-44faa1213956
feedbackDelta: 62d9f6e5-3d7c-4a3a-a07c-f9dc521c37a4
observationGroup: cdc3f3bd-d32b-4711-8c57-df87d20edb91
observationItems: 9
reflectionRecord: 6eaba622-8dbf-47d4-be56-7ae95039ae78
reflectionFindings: 5
reflectionGaps: 5
candidateRowsWritten: no
MemoryRecord created: no
```

Live readback:

```txt
krn source claim edges --source-claim-id 578d247c-caa7-4cf2-8b27-0a211a00c778
```

returned:

```txt
sourceClaimEdge: 415321b3-4a26-4634-bfbe-38b756777d6a
direction: outgoing
fromSourceClaimId: 578d247c-caa7-4cf2-8b27-0a211a00c778
toSourceClaimId: e3a72d7f-0fbf-4263-a2f8-cf8c93cc9c27
kind: narrows
consumer: V323 graph brain v0
doesNotProve: This edge does not prove temporal truth or graph retrieval quality.
evidenceRef: docs/decisions/ADR-0021-temporal-claim-graph.md:lines 1-20
sourceRanges: lines 1-20
```

## Repomix Context Cleanup

The requested previous repomix `docs/context` artifact was not present.

Checked:

```txt
find docs -maxdepth 3 \( -iname "*repomix*" -o -path "docs/context*" -o -path "docs/*context*" \) -print
```

The matches were retained patterns, historical ledger/report paths, and
brain-knowledge usefulness feedback files, not a repomix context pack. No file
was removed.

## Verification

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `pnpm --filter @krn/cli test -- parseSourceArgs runSourceClaimEdgesCommand` | passed | parser and readback behavior are covered | product graph quality |
| `pnpm test` | passed | workspace unit tests pass | product readiness |
| `pnpm typecheck` | passed | strict package typecheck passes from root | runtime graph truth |
| `pnpm db:ready` | passed | current-shell Postgres, migrations, and pgvector are ready | CI/remote DB state |
| `krn plan --persist` | passed | DB-backed run exists | context sufficiency |
| `krn source claim edges --source-claim-id ...` | passed | persisted edge readback works | edge correctness |
| `krn evidence capture --persist` | passed | command/source-usefulness provenance persisted | source truth |
| `krn observe --persist` then `krn reflect --persist` | passed | observe-before-reflect completed without Memory Core mutation | reflection quality |
| `git diff --check` | passed | whitespace diff is clean | behavioral completeness |

## Dogfood Usefulness

Activation selected useful graph-brain source claims:

```txt
source_claim:578d247c-caa7-4cf2-8b27-0a211a00c778
source_claim:931e7faa-a982-498f-a265-6a938800f707
```

They helped keep the slice focused on readback before graph runtime. Owner-file
recall was mixed: the plan selected useful guardrail/source context, but not
the direct source command owner files. `rg` and source inspection still carried
the owner-file discovery.

Brain ROI: positive. KRN preserved the graph-substrate sequence and prevented a
jump to ranking/extraction/UI before readback.

## Candidate Outputs

MemoryCandidate:

```txt
claim: Graph brain v0 should expose direct SourceClaimEdge readback before
graph-aware retrieval or extraction work.
evidence: this report; live readback of edge 415321b3-4a26-4634-bfbe-38b756777d6a
doesNotProve: this does not prove graph retrieval quality.
reviewability: ready
decision: review
```

EvalCandidate:

```txt
claim: `krn source claim edges --source-claim-id <id>` should render connected
edges with kind, direction, consumer, doesNotProve, evidence refs, source
ranges, and Memory mutation none.
evidence: parser/runner tests and live DB readback.
doesNotProve: product graph quality.
reviewability: ready
decision: review
```

## Next Recommended Action

V325 should begin the next bounded graph-brain step only after this readback
surface: a candidate-only local source entity/claim extraction preview that
produces reviewable candidates with source ranges, no autonomous graph truth,
and no Memory Core mutation.
