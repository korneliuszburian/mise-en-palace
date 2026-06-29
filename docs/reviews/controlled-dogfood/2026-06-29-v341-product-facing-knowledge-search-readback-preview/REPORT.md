# V341 Product-Facing Knowledge Search Readback Preview

Status: complete.
Date: 2026-06-29.

## Executive Verdict

V341 added the smallest product-facing knowledge search readback: `krn source
search --query`. It reads the current Postgres brain store, shows persisted
`SourceClaim` and `SearchDocument` candidates, includes/excludes them with
scores, labels reviewability, and states proof/non-proof boundaries. This is a
real operator preview over existing knowledge substrate, not UI/API/MCP,
crawler, embeddings, graph retrieval, or product search quality.

## Source-to-Decision

source:
`docs/reviews/controlled-dogfood/2026-06-29-v340-ingest-v0-product-loop-closure/REPORT.md`

mechanism:
V340 proved a local artifact could become `SourceArtifact`, `SourceChunk`,
`SearchDocument`, and governed `SourceClaim`, and that the claim could later be
activated by marker query. Operators still lacked a direct read-only query
surface over that substrate.

KRN implication:
Product-facing knowledge search should start as a bounded readback over proven
persisted knowledge, not as a dashboard, API, MCP server, crawler, worker, new
schema, broad eval, or autonomous truth runtime.

decision:
Add `krn source search --query ...` as a read-only CLI preview using existing
activation candidate retrieval and Context ROI filtering.

consumer:
Technical operators validating KRN knowledge search before UI/API/MCP work.

falsifier:
Given the V340 marker query, KRN cannot show reviewable `SourceClaim` and
`SearchDocument` candidates with exclusions and proof/non-proof boundaries.

doesNotProve:
Source truth, ranking quality, embeddings, graph retrieval, crawler readiness,
product readiness, or Memory Core mutation.

## Implementation

Changed:

- `packages/cli/src/parseArgs.ts`
- `packages/cli/src/parseSourceArgs.ts`
- `packages/cli/src/runCli.ts`
- `packages/cli/src/runSourceSearchCommand.ts`
- `packages/cli/src/parseSourceArgs.test.ts`
- `packages/cli/src/runSourceSearchCommand.test.ts`

Behavior:

```txt
krn source search --query <text> [--limit <n>] [--max-inclusions <n>]
```

The command is read-only. It requires `KRN_DATABASE_URL`, resolves the connected
repo project from the repo root, retrieves source/search activation candidates,
applies bounded Context ROI, and renders included/excluded candidates.

## DB Readback

Query:

```txt
krn-source-artifact-preview 991034dc0684e887
```

Result:

| Field | Value |
| --- | --- |
| project | `7d9d103a-1a8e-4492-a4ca-db3a5589bd9b` |
| sourceClaims | `7` |
| searchResults | `1` |
| mergedCandidates | `8` |
| included | `3` |
| excluded | `5` |
| V340 SourceClaim | `3363383c-02d0-4e5a-9674-132c1bc41b51`, included |
| V340 SearchDocument | `6f045cc4-e8c9-4555-8425-167d74e5d319`, included |

Included candidates:

- `source_claim:3363383c-02d0-4e5a-9674-132c1bc41b51`
- `source_claim:e3a72d7f-0fbf-4263-a2f8-cf8c93cc9c27`
- `search_document:6f045cc4-e8c9-4555-8425-167d74e5d319`

Exclusions were visible as `over_budget`, which is the desired behavior for a
bounded readback preview.

## KRN Plan Readback

| Field | Value |
| --- | --- |
| executionRun | `210ab335-d51e-4c92-b4e3-db3a8d68cc5b` |
| taskContract | `c9deed62-8333-496e-b212-454b8fee3161` |
| contextAssembly | `051fcada-f699-4586-ac08-36766db10fcc` |
| included context | `6` |
| excluded context | `14` |

Activation selected useful V340/source-graph guardrails. Owner-file hints were
still indirect (`runPlanCommand`, `runRunShowCommand`, activation engine) rather
than the exact new CLI owner files, so this run is not evidence of strong
owner-file recall.

## Evidence / Observe / Reflect

| Item | ID / result |
| --- | --- |
| evidenceBundle | `a7ebacfd-496c-4b8b-a92f-cd4800cefe83` |
| reviewAssessment | `5cf51dc0-f943-4535-b78b-405d794a0743` |
| feedbackDelta | `3f59ea74-2948-4ee3-b9de-b16353d39f81` |
| changed file classification | intended only; unrelated `none`; unknown `none` |
| observationGroup | `5e1bd9f1-a42c-4e43-a107-f84cbc22903d` |
| observationItems | `5` |
| reflectionRecord | `52953d30-fffc-4a4a-95fc-b5420b2dd74c` |
| reflectionFindings | `0` |
| candidateRowsWritten | `no` |
| MemoryRecord created | `no` |

Operator friction:
`krn reflect --run-id ... --persist` returned usage help because reflection
expects `--scope run:<id>`. The corrected command passed. This does not block
V341, but it is evidence that reflect CLI ergonomics are less consistent than
plan/evidence/observe.

## Pattern Gate

| Pattern | Verdict | Evidence |
| --- | --- | --- |
| `source-to-decision-retention-gate` | helped | preserved mechanism, consumer, falsifier, and does-not-prove boundary |
| `ts-boundary-unknown-first-result-state` | helped | parser/input changes kept typed CLI boundaries and targeted tests |

## Command Evidence

| Command | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `git fetch --prune` | passed | remote refs refreshed before work | CI status |
| `git status --short --branch` | passed | worktree state was understood | future cleanliness |
| `pnpm --filter @krn/cli test -- parseSourceArgs runSourceSearchCommand` | passed | parser/readback behavior has focused CLI coverage | DB runtime truth |
| `pnpm run typecheck` | passed | TypeScript compiles under strict workspace settings | product value |
| `pnpm db:ready` | passed | current shell Postgres is reachable, 14/14 migrations applied, pgvector available | remote/CI DB state |
| `krn source search --query "krn-source-artifact-preview 991034dc0684e887"` | passed | read-only product-facing search can read persisted candidates | search quality, source truth, embeddings, graph retrieval |
| `pnpm test` | passed | workspace test suite passes locally | product readiness |
| `git diff --check` | passed | diff has no whitespace errors | semantic correctness |
| `krn evidence capture --persist` | passed | evidence/review/feedback persisted with intended dirty-context classification | semantic correctness or Memory Core quality |
| `krn observe --run-id ... --persist` | passed | observations were staged without Memory Core mutation | reflection usefulness |
| `krn reflect --scope run:... --persist` | passed | reflection record persisted without Memory Core mutation | candidate quality |

## What This Proves

- A technical operator can query persisted KRN source/search knowledge directly.
- The V340 `SourceClaim` and `SearchDocument` are visible through a product-facing
  readback command.
- Output exposes inclusion, exclusion, scores, reviewability, and proof
  boundaries.
- The command performs no DB writes and no Memory Core mutation.

## What This Does Not Prove

- Source truth.
- Search/ranking quality.
- Broad corpus ingest.
- Embeddings or graph-aware retrieval.
- UI/API/MCP readiness.
- Crawler or worker readiness.
- Product readiness.
- Second-operator usability.

## Next Recommended Task

V342 Product-Facing Knowledge Search Usefulness Closure.

Use `krn source search` on a small set of real KRN knowledge questions and record
whether it reduces rereads/review burden, which candidates were useful, which
were noise, and whether owner-file recall remains the next bottleneck. Do not
add UI/API/MCP/crawler work until this preview proves practical usefulness.
