# V346 Source Search Answer Package Preview

Status: complete.

Date: 2026-06-29
DB available: yes
Execution run: `87cbd38e-77b3-4034-b140-06ebd70645c1`
Task contract: `8bba0b10-3f5b-420a-82c7-56cbd49fa242`
Context assembly: `90e22361-eff6-4c31-9b0c-612290950079`
Evidence bundle: `586aac55-3252-4202-ac51-3097b2cd086b`
Review assessment: `0cd95bc1-7f75-4812-aa6f-57e6255e053e`
Feedback delta: `c3f44a2a-ea27-46a2-8f4f-7e19a4e3de1d`
Observation group: `75501912-4c0c-41d8-aeeb-3c75e0a33295`
Reflection record: `c13ca094-5d38-4eff-9735-657c1f6b2e52`

## Executive Verdict

`krn source search` now renders an operator-facing answer package before the raw
candidate list. This moves the product from "search returns candidates" toward
"search helps a pre-coding decision" without adding crawler, UI/API/MCP, schema,
ranking rewrite, embeddings, graph runtime, worker daemon, or Memory Core
mutation.

The answer package is useful, but it also exposed the next concrete gap:
heartbeat/consensus future-task queries return governed SourceClaims but no
matching SearchDocuments. The next task should close that coverage gap before
changing retrieval.

## Source-To-Decision

Source: V345 usefulness closure and V346 DB readback.

Mechanism: V345 showed repaired source search reduces rereads but still leaves
operators manually synthesizing raw SourceClaim/SearchDocument candidates.
V346 adds a read-only answer package over the existing retrieved candidates.

KRN implication: source search should give operators a compact decision package
while preserving raw candidates and proof/non-proof boundaries.

Decision: adopt the answer package preview in source-search output; do not add a
new product surface yet.

Consumer: technical operators using source search as a Pattern Application Gate.

Falsifier: the answer package hides raw candidates, hides does-not-prove
boundaries, overclaims source truth, or does not reduce rereads compared with raw
candidate output.

Does not prove: source truth, answer correctness, ranking quality, product
readiness, broad corpus coverage, or Memory Core mutation safety.

## What Changed

Changed files:

```txt
packages/cli/src/runSourceSearchCommand.ts
packages/cli/src/runSourceSearchCommand.test.ts
```

The CLI now emits:

```txt
Answer package preview:
answer:
supporting claims:
supporting documents:
neutral/noise:
missing evidence:
doesNotProve:
recommended next action:
```

Raw included/excluded candidates remain visible below the package.

## Dogfood Readback

Source-to-decision query:

```txt
query: source-to-decision retention gate consumer falsifier
sourceClaims: 11
searchResults: 1
answer package: 5 supporting SourceClaims, 1 supporting SearchDocument
recommended next action: use as Pattern Application Gate
```

Future-task query:

```txt
query: heartbeat dreaming candidate generator consensus eval candidate layer
sourceClaims: 11
searchResults: 0
answer package: 6 supporting SourceClaims, 0 supporting SearchDocuments
missing evidence: matching SearchDocument evidence for this query
recommended next action: inspect artifact/SearchDocument coverage before changing retrieval
```

Scratch outputs:

```txt
.local-lab/v346/source-to-decision-answer-package.txt
.local-lab/v346/future-task-answer-package.txt
```

## Review Burden Delta

Before: operator had to read diagnostics and raw included/excluded candidates,
then manually infer the answer, missing evidence, and next action.

After: source search gives the answer package first, keeps raw candidates
inspectable, and explicitly states missing evidence and does-not-prove.

Verdict: review burden reduced for technical operators.

## TypeScript Boundary

Boundary: internal CLI rendering over already typed `RankedActivationCandidate`
and retrieval diagnostics.

No external input parsing changed.
No `any`, double assertion, JSON parse, env, file, MCP, or persistence boundary
was added.

## Verification

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm --filter @krn/cli test -- runSourceSearchCommand` | passed | source-search answer package behavior is covered by focused CLI tests | broad product search quality |
| `pnpm -r --workspace-concurrency=1 --if-present typecheck` | passed | TypeScript source remains type-correct across workspace packages | runtime product value |
| `pnpm test` | passed | workspace tests pass after the CLI rendering change | product readiness |
| `pnpm db:ready` | passed | local DB is reachable with migrations and pgvector | future DB availability |
| `git diff --check` | passed | diff has no whitespace errors | behavior correctness |
| `krn evidence capture --persist` | passed | V346 evidence, command proof, and source-usefulness outcomes were persisted | product readiness |
| `krn observe --persist` | passed | same-run observations were persisted before reflection | reflection quality |
| `krn reflect --persist` | passed | reflection selected 5 observations and did not mutate Memory Core | useful candidate quality |

Note: `rtk pnpm typecheck` currently returns exit code 1 while printing
`TypeScript: No errors found`; the workspace-equivalent command above was used
as the reliable typecheck proof.

## Brain ROI

Brain ROI: positive.

What improved:

- source search now synthesizes supporting claims/documents before raw output;
- missing SearchDocument evidence is visible;
- proof/non-proof boundaries are preserved;
- raw candidates remain inspectable;
- no new retrieval subsystem was added.

What remains weak:

- answer package is plain text, not JSON;
- future-task query has no SearchDocument match;
- ranking quality and broad corpus coverage remain unproven;
- product readiness remains unproven.

## Next Recommended Task

`V347 Heartbeat/Consensus SearchDocument Coverage Closure`

Goal: use the V346 answer package to inspect why heartbeat/consensus future-task
queries have governed SourceClaims but no matching SearchDocuments. Repair only
coverage or query guidance if evidence shows a bounded gap. Do not change
ranking, retrieval, crawler, UI/API/MCP, schema, embeddings, graph runtime,
worker daemon, or Memory Core mutation.
