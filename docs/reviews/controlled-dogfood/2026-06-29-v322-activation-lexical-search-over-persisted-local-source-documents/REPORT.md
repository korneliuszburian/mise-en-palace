# V322 Activation Lexical Search Over Persisted Local Source Documents

Status: complete.

## Executive Verdict

V322 closed the V321 falsifier. `krn plan --persist` can now surface persisted
local artifact `SearchDocument` rows when the task query carries explicit
marker/hash terms. The repair is a bounded activation retry: the primary full
source query remains unchanged; only an empty primary search triggers a retry
with high-signal marker terms.

This improves ingest v0 because persisted local source state can now flow into
activation/readback instead of remaining visible only through direct source
artifact preview.

## Scope

Changed files:

```txt
packages/harness/src/activation/activationEngine.ts
packages/harness/src/activation/index.test.ts
```

No DB schema, crawler, embedding path, graph runtime, ranking rewrite, UI,
API/MCP, worker daemon, target repo write, or Memory Core mutation was added.

No `docs/context` or repomix context file was present to remove.

## Source / Mechanism / Decision

Source:
V321 report and live DB evidence showed direct lexical readback worked for
`SearchDocument` `ccc44d6d-18ae-4b15-81cb-d948ea09b721`, but plan activation
still reported `search=0` for the same artifact marker.

Mechanism:
`krn plan` searched with the full source query text, which includes task text
plus default constraints/non-goals/acceptance. That can make Postgres
`websearch_to_tsquery` too narrow for a local artifact marker.

KRN implication:
Activation needs a bounded local artifact marker fallback before broader
ingest, graph, or UI work; otherwise persisted source artifacts cannot reliably
enter the selected/excluded context set.

Decision:
When primary lexical search returns zero results, retry with at most five
explicit marker terms: lowercase alphanumeric tokens at least eight characters
long containing a digit. This targets hashes/IDs without widening normal
ranking behavior.

Falsifier:
Given a persisted local artifact `SearchDocument` and a task query containing
its marker/hash terms, activation diagnostics still report `search=0`, or run
readback cannot expose the selected/excluded `SearchDocument`.

## Implementation

`retrieveActivationCandidates` now calls a small lexical search helper. The
helper:

- runs the existing full source query first;
- returns immediately when primary search finds results;
- retries only when primary search is empty and explicit marker terms exist;
- reuses the existing retrieval repository and ranking path.

The focused test proves a broad full query can return empty while the marker
fallback returns a `SearchDocument` candidate and diagnostics report
`searchResultCount: 1`.

## Live DB Proof

DB:

```txt
pnpm db:ready
Postgres: reachable
Migrations: 14/14 applied
pgvector: available
```

Persisted run:

```txt
executionRun: 2d548b12-1737-44f7-b4f8-f94c2b22f9fb
taskContract: ffd0f509-23fa-4a29-8966-2b331bdf8d5a
contextAssembly: d3b5cc65-2790-45b1-af03-61eeee5b5d4f
```

Marker query:

```txt
krn-source-artifact-preview 55568e9ec7a48a12
```

Readback result:

```txt
Activation diagnostics:
memory=0 sourceClaims=3 search=5 ownerFile=7 antiMemory=0 merged=15
```

The V321 local artifact `SearchDocument` appeared in context exclusions:

```txt
search_document:ccc44d6d-18ae-4b15-81cb-d948ea09b721
reason: over_budget
trustTier: source-code
score: 130
```

This is sufficient for V322 because the done condition allowed selected or
excluded readback exposure.

## Evidence / Observation / Reflection

```txt
evidenceBundle: e8bb8739-8669-45a6-ab62-cedacbddbbea
reviewAssessment: c07c3c1f-a628-4a2c-9588-35a72db270b0
feedbackDelta: 3b6bf843-f814-4eea-87ba-863f7d263458
observationGroup: 9f567ef8-d4a9-4697-af3d-15a00426ab32
reflectionRecord: 1cb70b1f-f422-4ef7-b8c8-9b518d76bd46
```

Evidence capture classified dirty context as:

```txt
intended=2
unrelated=0
unknown=0
```

Observe selected 5 input items and created 5 observation items. Reflect selected
5 observations, wrote no candidate rows, and created no `MemoryRecord`.

## Commands

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm --filter @krn/harness test -- activation` | passed | Focused activation behavior is covered. | Does not prove live DB state or product readiness. |
| `pnpm --filter @krn/cli test -- runRunShowCommand` | passed | Readback tests still pass. | Does not prove activation quality. |
| `pnpm run typecheck` | passed | TypeScript workspace compiles. | Does not prove runtime correctness. |
| `pnpm run test -- --runInBand` | passed | Workspace tests pass. | Does not prove product value. |
| `pnpm db:ready` | passed | Current shell DB is reachable with migrations and pgvector. | Does not prove remote/CI DB state. |
| `krn plan --persist` marker query | passed | Persisted activation sees search results for marker/hash terms. | Does not prove ranking is sufficient. |
| `krn run show` | passed | Persisted context/evidence readback exposes selected/excluded documents. | Does not prove source truth. |

One initial `krn plan --persist` attempt failed without explicit
`KRN_DATABASE_URL`; this was an operator/env proof gap, not a product proof.

## Dogfood Brain Usefulness

Selected context:

- `activationEngine.ts`: helped; direct owner file.
- `runPlanCommand.ts` and `runRunShowCommand.ts`: neutral/helped for readback
  proof and output interpretation.
- persisted local artifact `SearchDocument`s: helped; proved V322.

Missing/noise:

- No MemoryRecords were selected.
- Some source artifact hits were useful but over budget. This is acceptable for
  V322 because readback exposure, not inclusion ranking, was the slice target.

Review burden:

- Lower for future ingest work: `search=0` no longer hides persisted local
  artifact search documents when marker terms are present.
- Still medium because ranking and budget behavior can exclude relevant local
  artifacts.

Brain ROI:

```txt
positive
```

KRN helped by preserving the V321 falsifier, enforcing DB-backed proof, and
requiring readback evidence. It did not independently prove ranking quality.

## What This Does Not Prove

- General activation ranking quality.
- Embedding/vector retrieval.
- Graph-aware retrieval.
- Ingest at corpus scale.
- Reflection/candidate quality.
- Product readiness.

## Next Recommended Action

Move to graph brain v0 as the next product-forward gap:

```txt
V323 Graph Brain v0 Bounded Source Entity/Claim Edge Preview
```

Start with one small, persisted source artifact corpus and produce reviewable
entity/claim/edge candidates with source ranges. Do not build crawler, UI, API,
MCP, worker daemon, consensus runtime, or automatic Memory Core mutation.
