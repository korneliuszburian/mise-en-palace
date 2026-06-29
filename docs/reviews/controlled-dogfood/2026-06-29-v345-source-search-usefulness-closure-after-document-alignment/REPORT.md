# V345 Source Search Usefulness Closure After Document Alignment

Status: complete.

Date: 2026-06-29
DB available: yes
Execution run: `16f1946d-4758-49ca-9725-3a2ed9d08ca8`
Task contract: `83de6fa6-8c50-4fb1-9fb5-8064d5d7b630`
Context assembly: `175b5012-21ea-4d52-abf4-466d6af6b1c7`
Evidence bundle: `c59290f6-4171-4797-b053-ae66ee533d70`
Review assessment: `1877e544-cb69-47e0-9b15-c184307be87c`
Feedback delta: `e693703c-ed55-42f3-a199-2e3769af70b5`
Observation group: `8749b98a-0a7c-4944-abc4-47ae42aac415`
Reflection record: `da630ae4-006c-44b2-bc7f-d8b7fadc87ad`

## Executive Verdict

Repaired `krn source search` is now useful for a real pre-coding Pattern
Application Gate when the corpus has both governed SourceClaims and matching
SearchDocuments. It reduced rereads for the source-to-decision and search
usefulness questions by putting the retained claim, reviewability, expected use,
does-not-prove boundary, and matching artifact document in one readback.

The next highest-ROI task is not crawler, UI, API, MCP, embeddings, graph
runtime, worker daemon, or ranking rewrite. It is a small operator-facing answer
package over `krn source search` results so operators do not manually synthesize
raw candidate lists into a decision.

## Scope

V345 measured whether V344's document-retrieval alignment actually helped a
Pattern Application Gate after seeded SearchDocuments started appearing in
natural-language source-search results.

Non-goals:

- no crawler;
- no UI/API/MCP;
- no schema or ranking rewrite;
- no embeddings or graph runtime;
- no worker daemon;
- no Memory Core mutation;
- no autonomous truth runtime.

## Commands

```sh
git fetch --prune
git status --short --branch
git log --oneline -n 8
pnpm db:ready
pnpm --filter @krn/cli krn plan --task "V345 source search usefulness closure after document alignment: use repaired krn source search for one real pre-coding Pattern Application Gate, classify returned SourceClaims and SearchDocuments as helped neutral noise missing, decide next highest ROI product-facing brain task from evidence, without crawler UI API MCP schema ranking rewrite embeddings graph runtime worker or Memory Core mutation" --persist
pnpm --filter @krn/cli krn source search --query "source-to-decision retention gate consumer falsifier" --limit 16 --max-inclusions 6
pnpm --filter @krn/cli krn source search --query "product-facing knowledge search usefulness coverage seed" --limit 16 --max-inclusions 6
pnpm --filter @krn/cli krn source search --query "heartbeat dreaming candidate generator consensus eval candidate layer" --limit 16 --max-inclusions 6
pnpm --filter @krn/harness test -- activePlanInvariants
git diff --check
pnpm --filter @krn/cli krn evidence capture --run-id 16f1946d-4758-49ca-9725-3a2ed9d08ca8 --persist
pnpm --filter @krn/cli krn observe --run 16f1946d-4758-49ca-9725-3a2ed9d08ca8 --persist
pnpm --filter @krn/cli krn reflect --scope run:16f1946d-4758-49ca-9725-3a2ed9d08ca8 --persist
```

Local scratch outputs:

```txt
.local-lab/v345/plan.txt
.local-lab/v345/pattern-gate-source-to-decision.txt
.local-lab/v345/product-search-usefulness.txt
.local-lab/v345/future-brain-task-scan.txt
```

## Source-To-Decision

Source: V344 source-search document retrieval alignment report and V345 DB
readback.

Mechanism: V344 changed source search to retrieve SearchDocuments from the
operator query instead of the full synthetic TaskContract text. V345 confirmed
that natural-language queries now return both governed SourceClaims and matching
SearchDocuments for seeded artifacts.

KRN implication: before adding new retrieval features, KRN should expose a small
operator-facing answer package over current source-search results so the human
does not manually assemble candidate lists into a pre-coding decision.

Decision: adopt `V346 Source Search Answer Package Preview` as the next bounded
task.

Consumer: technical operators using source search as a Pattern Application Gate.

Falsifier: an answer package does not reduce rereads/review burden, hides
does-not-prove boundaries, or overclaims source truth from retrieval hits.

Does not prove: source truth, broad product search quality, ranking quality,
embeddings, graph retrieval, crawler readiness, product readiness, or Memory
Core mutation safety.

## Query Results

| Query | SourceClaims | SearchDocuments | Verdict |
|---|---:|---:|---|
| `source-to-decision retention gate consumer falsifier` | 11 | 1 | useful |
| `product-facing knowledge search usefulness coverage seed` | 11 | 1 | useful |
| `heartbeat dreaming candidate generator consensus eval candidate layer` | 11 | 0 | mixed |

## Usefulness Classification

| Item | Type | Query | Classification | Evidence | Notes |
|---|---|---|---|---|---|
| `125366b1-8bd9-4092-92d8-1aa1d2ed46ae` | SourceClaim | source-to-decision | helped | `.local-lab/v345/pattern-gate-source-to-decision.txt` | Directly states retained KRN knowledge must preserve source, mechanism, implication, decision/rejection, consumer, falsifier, and does-not-prove boundary. |
| `64d78b2b-bb04-4039-a4ad-c72ecf2f6d47` | SearchDocument | source-to-decision | helped | `.local-lab/v345/pattern-gate-source-to-decision.txt` | Matching artifact document surfaced next to the governed claim. This reduces report rereads. |
| `5b1e25a1-c01e-44d8-849b-1e1ec233a835` | SourceClaim | search usefulness | helped | `.local-lab/v345/product-search-usefulness.txt` | Directly preserves V342 outcome: search helps where coverage exists, but weak queries need bounded coverage before product surfaces. |
| `e4028fde-2a3b-418c-a429-62cd2c697079` | SearchDocument | search usefulness | helped | `.local-lab/v345/product-search-usefulness.txt` | Matching usefulness artifact surfaced with reviewability and expected use. |
| `04b097d5-7338-4b78-be55-e85d0cbb7aff` | SourceClaim | future task scan | helped | `.local-lab/v345/future-brain-task-scan.txt` | Heartbeat preview claim was useful for deciding not to jump to autonomous dreaming yet. |
| `55e3d7ea-b97d-4495-bec2-1154a8a10b09` | SourceClaim | future task scan | helped | `.local-lab/v345/future-brain-task-scan.txt` | Consensus/eval preview claim was useful for preserving candidate/dissent boundaries. |
| SearchDocument for future task scan | SearchDocument | future task scan | missing | `.local-lab/v345/future-brain-task-scan.txt` | The query returned no SearchDocument. This does not block usefulness, but shows artifact document coverage is still uneven. |
| Graph preview SourceClaims | SourceClaim | pattern/future scans | neutral | search outputs | Relevant to long-term graph brain, but not needed for the V345 decision. |

## Review Burden Delta

Before V344/V345, the operator had to inspect reports manually to connect a
retained pattern claim to its artifact source. After alignment, source search
returns a ready SourceClaim and a matching SearchDocument for seeded
source-to-decision and usefulness questions.

Review burden: reduced for seeded Pattern Application Gate questions.

Remaining burden: the output is still a raw candidate list. The operator must
manually synthesize the answer, classify helped/neutral/noise, and choose the
next task. That is the next product-facing gap.

## Brain ROI

Brain ROI: positive.

What improved:

- governed SourceClaims and SearchDocuments are now visible together;
- reviewability and does-not-prove boundaries are preserved in readback;
- useful claims shaped the next task decision;
- no new product surface or autonomous truth runtime was needed.

What stayed weak:

- search result synthesis is manual;
- future-task scan returned no SearchDocument;
- ranking quality and broad corpus coverage remain unproven;
- product readiness remains unproven.

## Next Recommended Task

`V346 Source Search Answer Package Preview`

Goal: add a bounded read-only CLI preview or report path that takes current
`krn source search` results and renders a compact answer package:

```txt
answer:
supporting claims:
supporting documents:
neutral/noise:
missing evidence:
doesNotProve:
recommended next action:
```

Rules:

- use existing source-search outputs and types;
- preserve reviewability and does-not-prove boundaries;
- no crawler, UI/API/MCP, schema, ranking rewrite, embeddings, graph runtime,
  worker daemon, or Memory Core mutation;
- do not hide raw candidates.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm db:ready` | passed | local Postgres was reachable with migrations and pgvector in the current shell | CI DB state, product readiness, or future availability |
| `krn plan --persist` | passed | V345 persisted a TaskContract, ContextAssembly, and ExecutionRun | activation sufficiency or source truth |
| `krn source search` source-to-decision query | passed | repaired search can return SourceClaims and one matching SearchDocument for the seeded pattern artifact | broad search quality |
| `krn source search` usefulness query | passed | repaired search can return SourceClaims and one matching SearchDocument for the seeded usefulness artifact | ranking quality |
| `krn source search` future-task scan | passed, mixed | source claims for heartbeat/consensus are retrievable | SearchDocument coverage for every query |
| `krn evidence capture --persist` | passed | V345 command proof and source-usefulness outcomes were persisted | product readiness or source truth |
| `krn observe --persist` | passed | same-run observations were persisted before reflection | reflection quality |
| `krn reflect --persist` | passed | reflection read 5 observations and did not mutate Memory Core | candidate quality or useful findings |

## Product Readiness

KRN remains controlled-internal-alpha for technical operators.

V345 moves the product forward because source search is now useful enough to
drive a pre-coding Pattern Application Gate for seeded knowledge. It does not
make KRN product-ready. The next product-facing move is answer-package
synthesis over existing search results.
