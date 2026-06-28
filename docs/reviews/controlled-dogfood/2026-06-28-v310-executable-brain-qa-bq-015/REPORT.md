# V310 Executable Brain-QA Case BQ-015

Status: complete read-only CLI brain-QA case.

Date: 2026-06-28.
DB used: no.

## Executive Verdict

BQ-015 passed as a manual read-only CLI case:

```txt
broad no-match query -> shorter mechanism query -> retained pattern hit
```

This is the first executable case from the V309 Mini Brain-QA sketch. It proves
only deterministic CLI readback behavior over explicit files, not semantic
retrieval quality or product readiness.

## Commands

Broad query:

```sh
rtk pnpm --filter @krn/cli krn knowledge cards \
  --catalog-file docs/brain-knowledge/catalog.json \
  --text "brain qa source decision retrieval memory anti memory evidence graph" \
  --json
```

Result:

```txt
totalCards: 0
returnedCards: 0
noMatchGuidance: present
mutation: none
```

Shorter mechanism query:

```sh
rtk pnpm --filter @krn/cli krn knowledge cards \
  --catalog-file docs/brain-knowledge/catalog.json \
  --text "source-to-decision" \
  --json
```

Result:

```txt
totalCards: 3
returnedCards: 3
matched:
  - pattern:codex-skill-progressive-disclosure-routing
  - pattern:evidence-proof-non-proof-boundary
  - pattern:source-to-decision-retention-gate
mutation: none
```

## Pattern Usefulness

| Pattern | Outcome | Why |
|---|---|---|
| `pattern:source-to-decision-retention-gate` | helped | confirmed a shorter mechanism query can recover a retained source-decision pattern |
| `pattern:evidence-proof-non-proof-boundary` | helped | forced the report to keep proof/non-proof explicit |
| `pattern:active-context-compact-current-truth` | helped | kept the case on current root state and V309 sketch |

## Proof Boundaries

What this proves:

- the current `krn knowledge cards` read-only CLI can show no-match guidance for
  an over-broad query;
- a shorter mechanism query can retrieve a relevant retained pattern;
- the output preserves proof/non-proof and no-mutation boundaries.

What this does not prove:

- semantic retrieval quality;
- ranking quality;
- retained-pattern completeness;
- live DB-backed search;
- graph retrieval quality;
- product readiness.

## Next Action

Open V311 as a focused fixture/test guard for BQ-015 if source inspection shows
the behavior is not already covered by tests. If existing tests already cover
both sides of BQ-015, record that and move to the next docs/CLI-only brain-QA
case instead.
