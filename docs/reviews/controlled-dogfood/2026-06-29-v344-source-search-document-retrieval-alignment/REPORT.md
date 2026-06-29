# V344 Source Search Document Retrieval Alignment

Status: complete.

## Executive Verdict

V344 found and repaired a bounded owner-file issue in `krn source search`: the
SearchDocument lexical query was built from the whole synthetic TaskContract,
including proof-boundary constraints and non-goals, instead of the operator's
`--query` text. That made V343 seeded SearchDocuments hash-readable but absent
from natural-language source-search results. The repair keeps the normal
TaskContract for CLI/proof framing while passing a query-only source activation
query into retrieval.

## Source To Decision

```txt
source:
  V343 coverage seed report and current DB readback.
mechanism:
  SourceArtifact preview persisted SearchDocument rows with searchable text and
  hash readback, but source search called activation with full TaskContract text.
  PostgreSQL FTS therefore searched extra terms from CLI proof boundaries,
  acceptance, and non-goals.
KRN implication:
  Operator-facing source search should search documents by the operator query,
  while CLI output separately reports proof/non-proof boundaries.
decision:
  Add a query-only source ActivationQuery for `krn source search`; do not change
  schema, ranking, embeddings, graph runtime, crawler, UI, API, MCP, or Memory Core.
consumer:
  `krn source search` readback for technical operators.
falsifier:
  V343 natural-language queries still return `searchResults: 0` or miss seeded
  SearchDocument IDs after the repair.
doesNotProve:
  This does not prove product search quality, broad corpus coverage, embeddings,
  graph retrieval, crawler readiness, or product readiness.
```

## Owner Files

| Surface | Owner file | Finding |
|---|---|---|
| Source search CLI | `packages/cli/src/runSourceSearchCommand.ts` | Built a TaskContract for readback and delegated to activation. |
| Artifact persistence | `packages/cli/src/runSourceArtifactPreviewCommand.ts` | Persisted SearchDocument `searchText` with artifact content and hash marker. |
| Retrieval repository | `packages/db/src/repositories/DrizzleRetrievalRepository.ts` | Uses `websearch_to_tsquery` over `searchVector`. |
| Activation retrieval | `packages/harness/src/activation/activationEngine.ts` | Uses `sourceQuery.text` for lexical document search. |

## Change

`runSourceSearchCommand` now builds a dedicated query-only source activation
query and passes it to `retrieveActivationCandidates`. This keeps SourceClaim and
SearchDocument activation bounded to the operator query without polluting FTS
with CLI proof wording.

Test coverage now asserts that `searchLexical` receives the exact operator query
and not non-goal terms such as `crawler`.

## DB Readback

Before V344, V343 natural-language reruns reported `searchResults: 0` for the
same seeded artifacts.

After V344:

| Query | SearchDocument result |
|---|---|
| `memory staleness heartbeat candidate MemoryRecord` | `e0cbc2e9-fdef-41e9-aacc-2262c64ae152` |
| `consensus candidate dissent decision options` | `3eb44f5a-bc41-4630-ab82-cfbf552c270d` |
| `source-to-decision retention gate consumer falsifier` | `64d78b2b-bb04-4039-a4ad-c72ecf2f6d47` |
| `product-facing knowledge search usefulness coverage seed` | `e4028fde-2a3b-418c-a429-62cd2c697079` |

Each rerun reported `searchResults: 1` and included the seeded SearchDocument.

## Pattern Usefulness

| Pattern/source | Outcome | Evidence |
|---|---|---|
| Source-to-decision gate | helped | Forced bounded owner-file decision and falsifier instead of ranking/schema work. |
| Evidence proof/non-proof boundary | helped | Search output continues to state what readback proves and does not prove. |
| TypeScript boundary discipline | helped | No `any`, no schema change, and typecheck passed. |
| Knowledge card pre-query | neutral | The catalog query returned zero results; local repo evidence carried the slice. |

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `rtk git fetch --prune` | passed | Remote refs refreshed. | CI status or product readiness. |
| `rtk git status --short --branch` | passed | Worktree was clean before V344 edits. | Future cleanliness after commit. |
| `rtk pnpm db:ready` | passed | Current shell reached Postgres with 14/14 migrations and pgvector. | Remote/CI DB state. |
| `rtk pnpm --filter @krn/cli test -- runSourceSearchCommand` | passed | CLI behavior test covers query-only lexical search input. | Broad product search quality. |
| `rtk pnpm run typecheck` | passed | Workspace TypeScript still typechecks. | Runtime search relevance. |
| `rtk env TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | Workspace tests pass after the repair. | Product readiness or second-operator usability. |
| Four `krn source search` reruns | passed | Seeded SearchDocuments now appear for V343 natural-language queries. | Embeddings, graph retrieval, crawler readiness, or ranking quality. |
| `krn evidence capture --persist` | passed | EvidenceBundle, ReviewAssessment, FeedbackDelta, and source usefulness feedback were persisted. | Memory promotion or product readiness. |
| `krn observe --persist` | passed | Observation group was persisted for the run. | Reflection quality. |
| `krn reflect --persist` | passed | Reflection selected the completed observations without Memory Core mutation. | Candidate quality or broad reflection usefulness. |

Persisted IDs:

```txt
executionRun: c9d52cdf-cb48-4ef7-9e0e-1a215f3fe716
evidenceBundle: 114cc144-da04-4acb-b119-2e18ea984ab3
reviewAssessment: 3379de9e-8732-406d-ac7b-a8fa4a9de3d5
feedbackDelta: bfd3e67a-68e7-49a4-9ea7-9910ba12fb39
observationGroup: 002d0674-5376-4d17-85d7-abd8f84eca83
reflectionRecord: 304d33f1-f11b-4dba-b44b-8f025807d471
Memory mutation: none
```

## Review Burden

Review burden decreased for source search diagnostics: an operator can now see
both governed SourceClaims and matching SearchDocuments for the same seeded
knowledge query, instead of interpreting `searchResults: 0` as an ambiguous
coverage, ranking, or persistence failure.

## Residual Risk

- Search is still PostgreSQL lexical readback, not SOTA retrieval.
- `searchResults: 1` on four seeded artifacts does not prove broad corpus
  coverage.
- SourceClaims can still dominate budgeted inclusions; V345 should measure
  usefulness after the alignment rather than adding another feature.

## Next Recommended Action

Run `V345 Source Search Usefulness Closure After Document Alignment`: measure
whether the repaired product-facing source search helps a real pre-coding
Pattern Application Gate and identify the next highest-ROI product-facing brain
task from evidence.
