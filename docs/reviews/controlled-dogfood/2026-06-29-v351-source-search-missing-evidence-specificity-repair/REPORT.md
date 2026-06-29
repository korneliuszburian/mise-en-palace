# V351 Source Search Missing-Evidence Specificity Repair

Status: complete.

## Executive Verdict

V351 repaired source-search answer-package `missingEvidence` diagnostics so the
field is derived from visible answer-package support instead of raw retrieval
diagnostic totals. This prevents V350-style cases with included supporting
documents from still looking like generic no-document cases, while preserving
the real graph-relations no-document gap.

No ranking, schema, retrieval semantics, UI/API/MCP, crawler, worker, graph
runtime, broad benchmark, or Memory Core mutation was added.

## Scope

Changed source:

```txt
packages/cli/src/runSourceSearchCommand.ts
packages/cli/src/runSourceSearchCommand.test.ts
```

Committed report:

```txt
docs/reviews/controlled-dogfood/2026-06-29-v351-source-search-missing-evidence-specificity-repair/REPORT.md
```

Local artifacts:

```txt
.local-lab/v351-plan.txt
.local-lab/v351/evidence-proof.json
.local-lab/v351/graph-relations.json
.local-lab/v351/heartbeat-consensus.json
```

## Source-To-Decision

```txt
source: V350 mini Brain-QA JSON batch report
mechanism: JSON answer packages can expose answer support and missing evidence
  without text parsing, but V350 showed missing-evidence diagnostics could be
  broader than the visible answer package.
KRN implication: missingEvidence should describe the visible answer-package
  support state that operators review, not an internal diagnostic count that
  makes supported-document cases look unsupported.
decision: repair the smallest CLI answer-package owner.
consumer: technical operators consuming `krn source search --json`.
falsifier: evidence-proof or heartbeat-consensus still reports a generic
  no-document gap while supporting documents are present, or graph-relations
  stops surfacing its real no-document gap.
doesNotProve: answer correctness, source truth, ranking quality, broad
  benchmark quality, product readiness, or UI/API/MCP readiness.
```

## Pattern Gate

| Pattern | Outcome | Evidence | Does not prove |
|---|---|---|---|
| `ts-boundary-unknown-first-result-state` | helped | The repair kept JSON parsing in tests as `unknown` before narrowing and added a finite helper over counts. | Does not prove complete TypeScript quality or product readiness. |
| `evidence-proof-non-proof-boundary` | helped | Report and evidence capture preserve proof/non-proof and do not claim ranking or answer correctness. | Does not prove source truth. |
| read-only source-search boundary | helped | The repair changed CLI readback wording/JSON only; no mutation-capable surface was added. | Does not prove future UI/API/MCP readiness. |

The first broad knowledge-card query returned zero results, so retained
patterns were selected by direct known pattern readback plus current root
evidence. Zero results did not prove no relevant pattern existed.

## Implementation

Before:

```txt
missingEvidence used diagnostics.sourceClaimCount/searchResultCount.
```

After:

```txt
missingEvidence uses visible answer-package support:
  supportingClaimCount
  supportingDocumentCount
```

New helper:

```txt
buildSourceSearchMissingEvidence
```

This keeps the diagnostic aligned with what the operator sees in
`answerPackage.supportingClaims` and `answerPackage.supportingDocuments`.

## DB Readback

V351 persisted plan:

```txt
executionRun: 26d4576a-14b2-4347-b4a8-8c3577859b5b
taskContract: 06b15c04-a125-4631-8d95-0e90bb703b77
contextAssembly: 9ca242da-db6d-4900-90d0-46b363e244de
evidenceBundle: 6d66fc88-4122-4c7a-9edd-f240a2e62554
reviewAssessment: 0ba39da6-c28f-4dc3-93f8-d15be6df05e2
feedbackDelta: a6c47d8b-ad75-4595-b3a9-352120b082a5
observationGroup: df192e7a-4634-4157-ab74-be583bf252d6
reflectionRecord: 858e2e27-8c54-4655-a427-0750ae4b0551
MemoryRecord created: no
```

Activation usefulness:

```txt
helped:
  - guardrails against crawler/UI/API/MCP/schema/ranking drift
  - source graph and bounded ingest context

missing:
  - direct owner file `packages/cli/src/runSourceSearchCommand.ts`
  - direct V350 report

verdict:
  mixed positive for guardrails, weak for owner-file recall
```

## Repaired Query Readback

| Case | Claims | Documents | Missing evidence after V351 |
|---|---:|---:|---|
| evidence-proof | 5 | 1 | none |
| graph-relations | 6 | 0 | included SearchDocument evidence for this combined query; topic-specific SearchDocuments may still exist |
| heartbeat-consensus | 4 | 2 | none |

This satisfies the V351 acceptance criteria: supported-document cases no longer
look like no-document cases, while the real graph-relations document gap remains
visible.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm --filter @krn/cli test -- runSourceSearchCommand` | passed | Focused CLI behavior and helper tests pass. | Does not prove full workspace behavior. |
| `pnpm typecheck` | passed | Workspace TypeScript compiles under strict settings. | Does not prove runtime behavior or product value. |
| `TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | Workspace test suite passes with repo temp-dir policy. | Does not prove product readiness. |
| `pnpm db:ready` | passed | Current shell can reach Postgres, migrations, and pgvector. | Does not prove CI DB state or answer correctness. |
| V351 JSON readback queries | passed | Repaired JSON output appears in live DB-backed source-search results. | Does not prove ranking quality or broad benchmark quality. |
| `git diff --check` | passed | Diff has no whitespace errors. | Does not prove behavior. |

## What This Proves

- `missingEvidence` now matches visible answer-package support.
- Supported-document cases avoid misleading generic document-gap diagnostics.
- Real no-document graph-relations gap still surfaces.
- No retrieval/ranking/schema/product-surface change was required.

## What This Does Not Prove

- answer correctness;
- source truth;
- ranking quality;
- broad benchmark quality;
- product readiness;
- UI/API/MCP readiness;
- Memory Core mutation safety beyond this read-only flow.

## Next Recommended Task

```txt
V352 Source Search JSON Diagnostics Usefulness Closure
```

Run one small JSON batch/readback closure after V351 to verify the repaired
diagnostic reduces operator ambiguity across the same cases. Do not add product
surfaces or retrieval changes.
