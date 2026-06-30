# IMR-11 Acquisition Diagnostics In Candidates

Status: complete.
Date: 2026-07-01.
Issue: `mise-en-palace-294`.

## Executive Verdict

Acquisition candidates now preserve the bounded diagnostics needed to act on a
missing-evidence gap without reopening raw source-search JSON. Candidates
created from source/brain search readbacks include `queryShapeDiagnostics` and
`recommendedFollowUp` when those fields are present, while remaining
candidate-only with `mutation: none`.

## What Changed

Changed source:

```txt
packages/workers/src/knowledgeAcquisitionHeartbeatPreview.ts
packages/cli/src/runHeartbeatPreviewCommand.ts
packages/workers/src/knowledgeAcquisitionHeartbeatPreview.test.ts
packages/cli/src/runHeartbeatPreviewCommand.test.ts
```

Behavior:

```txt
source/brain search readback
-> missingEvidence
-> queryShapeDiagnostics / recommended follow-up
-> knowledge_acquisition_candidate
-> acquisitionEvidenceRequest includes diagnostics
-> mutation: none
```

No DB schema, crawler, ranking, worker daemon, API/MCP, source truth mutation, or
Memory Core mutation was added.

## Source-To-Decision

```txt
source:
  IMR-10 focused acquisition source/evidence follow-up report and live
  source-search readbacks.

mechanism:
  source search already emits query-shape diagnostics and recommended next
  action; losing those fields in the heartbeat acquisition bridge forces raw
  JSON inspection and increases review burden.

KRN implication:
  acquisition candidates should carry enough bounded diagnostic context for the
  operator to choose a follow-up without broadening runtime authority.

decision:
  preserve query diagnostics and recommended follow-up in the candidate output.

rejection:
  do not change ranking, add crawler/schema/worker/API/MCP, or mutate Memory
  Core/source truth.

consumer:
  heartbeat/dreaming acquisition preview and operator review workflow.

falsifier:
  a source/brain search readback with diagnostics creates a candidate that omits
  them, or the output changes mutation/review-gate authority.
```

## Type Boundary

Boundary:

```txt
external JSON/file readback -> CLI narrowing -> worker domain request -> preview candidate
```

Applied pattern:

```txt
ts-boundary-unknown-first-result-state
```

Readback JSON still enters as `unknown`, narrows through existing local guards,
and is passed to worker code as typed `KnowledgeAcquisitionRequest`. Optional
diagnostic fields remain optional for existing callers; CLI readbacks pass empty
arrays when diagnostics are absent.

## Live Readback

Input:

```txt
.local-lab/imr-08-missing-evidence-bridge/source-search-missing-evidence.json
```

Command output:

```txt
.local-lab/imr-11-acquisition-diagnostics/heartbeat-source-readback-diagnostics.json
```

Observed candidate:

| Field | Result |
| --- | --- |
| kind | `knowledge_acquisition_candidate` |
| source | `source_search` |
| reviewability | `ready` |
| mutation | `none` |
| queryShapeDiagnostics | over-constrained query; try narrower topic-specific query before changing ranking or coverage |
| recommendedFollowUp | split broad queries into narrower topic-specific source searches before changing retrieval |

## Command Evidence

| Command | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `krn brain knowledge --catalog-file docs/brain-knowledge/catalog.json --text unknown-first` | passed | retained TypeScript/source-to-decision patterns were available as read-only context | live DB brain knowledge or automatic pattern selection |
| `pnpm --filter @krn/workers test -- knowledgeAcquisitionHeartbeatPreview` | passed | worker candidate builder preserves diagnostics/follow-up and mutation boundary in focused tests | full product loop quality |
| `pnpm --filter @krn/cli test -- runHeartbeatPreviewCommand` | passed | CLI bridge preserves diagnostics from source/brain readback fixtures | live DB retrieval quality |
| `pnpm --filter @krn/cli run typecheck` | passed | CLI TypeScript boundary remains valid | runtime source truth |
| `pnpm --filter @krn/workers run typecheck` | passed | worker TypeScript boundary remains valid | runtime source truth |
| `pnpm db:ready` | passed | current shell can reach Postgres with migrations and pgvector | CI DB state or product readiness |
| `krn heartbeat preview --candidate-kind knowledge_acquisition --acquisition-readback-file ... --json` | passed | live readback candidate carries diagnostics/follow-up with `mutation: none` | that the missing evidence is solved |

## Brain Usefulness

| Area | Verdict | Evidence |
| --- | --- | --- |
| Acquisition candidate | improved | output carries missing evidence, diagnostics, and recommended follow-up |
| Operator burden | reduced | no need to inspect raw source-search JSON for the query-shape hint |
| Safety boundary | preserved | candidate output remains read-only and mutation-free |
| Pattern application | helped | unknown-first readback guided the JSON/file boundary |

## Next Recommended Action

Run one bounded dogfood use of the richer acquisition candidate:

```txt
use diagnostic-bearing acquisition output to perform or reject one narrower
source/evidence follow-up, then decide whether SearchDocument coverage or source
claim/document linkage needs the next repair.
```

Do not build crawler, schema, ranking rewrite, worker daemon, API/MCP, or Memory
Core mutation from this slice alone.

## What This Does Not Prove

- It does not prove the missing SearchDocument evidence exists.
- It does not prove source-search ranking quality.
- It does not prove autonomous acquisition readiness.
- It does not prove product readiness.
