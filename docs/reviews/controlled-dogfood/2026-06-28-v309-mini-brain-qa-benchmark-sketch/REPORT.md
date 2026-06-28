# V309 Mini Brain-QA Benchmark Sketch Report

Status: complete docs-only benchmark-shape slice.

Date: 2026-06-28.
DB used: no.

## Executive Verdict

V309 converted retained source decisions into a 30-question KRN brain-QA sketch
without building a broad eval platform. The sketch gives KRN a concrete next
validation surface for context/memory, source grounding, adaptive retrieval,
temporal/anti-memory, evidence/review, graph/global QA, and multi-hop behavior.

## Pattern Gate

Pre-coding readback:

| Query | Result | Usefulness |
|---|---|---|
| `brain qa source decision retrieval memory anti memory evidence graph` | 0 cards | helped as a no-match signal; broad semantic search is not proven |
| `source-to-decision` | 3 cards | helped |
| `evidence proof` | 3 cards | helped |
| `active context` | 1 card | helped |

Selected patterns:

- `pattern:source-to-decision-retention-gate`: helped.
- `pattern:evidence-proof-non-proof-boundary`: helped.
- `pattern:active-context-compact-current-truth`: helped.
- `pattern:brain-knowledge-read-only-ui-boundary`: helped.
- `pattern:codex-prompt-task-contract-proof-boundary`: helped.

Rejected/deferred:

- broad eval platform: rejected;
- Promptfoo expansion: rejected;
- graph runtime: deferred;
- ingest runtime: deferred;
- dashboard/API/MCP: deferred;
- DB schema: rejected for this slice.

## What Changed

Created:

```txt
docs/benchmarks/brain-qa/V309_BRAIN_QA_SKETCH.md
```

The sketch contains 30 questions grouped by:

- context/memory;
- feedback/candidates;
- source grounding;
- adaptive retrieval;
- temporal/anti-memory;
- evidence/review;
- graph/global QA;
- multi-hop.

Each question names source/pattern, expected evidence, future execution mode,
and a proof/non-proof boundary.

## Reviewability

Ready:

- BQ-015 is the recommended first executable case because it uses existing
  read-only `krn knowledge cards` behavior and tests adaptive query narrowing
  without new runtime.

Needs more evidence:

- graph/global QA and multi-hop questions need graph/ingest v0 before execution.

Too vague:

- none retained; each question names an evidence type and future mode.

## Proof Boundaries

What this proves:

- retained source decisions can become local falsifiable questions;
- V309 did not widen the product surface;
- the next task can be one executable mini brain-QA case, not another roadmap.

What this does not prove:

- product readiness;
- SOTA quality;
- retrieval ranking quality;
- graph retrieval quality;
- citation accuracy;
- benchmark execution.

## Next Action

Open V310 as one executable mini brain-QA case:

```txt
V310-00 Executable Brain-QA Case BQ-015
```

It should prove whether existing `krn knowledge cards` can support:

```txt
broad no-match query -> shorter mechanism query -> retained pattern hit
```

without building a broad eval platform.
