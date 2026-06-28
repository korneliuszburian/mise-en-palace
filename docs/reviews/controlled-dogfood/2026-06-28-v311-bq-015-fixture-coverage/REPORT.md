# V311 BQ-015 Fixture Coverage

Status: complete focused test slice.

Date: 2026-06-28.
DB used: no.

## Executive Verdict

V311 turned the first executable mini brain-QA case into focused CLI test
coverage. BQ-015 now fails if `krn knowledge cards` stops showing no-match
guidance for an over-broad query or stops recovering a retained
source-to-decision pattern through a shorter mechanism query.

## What Changed

Updated:

```txt
packages/cli/src/runKnowledgeCardsCommand.test.ts
```

Added one focused test:

```txt
guards BQ-015 broad no-match retrying with a shorter mechanism query
```

The test covers:

- broad query returns `totalCards: 0` and no-match guidance;
- shorter `source-to-decision` query returns a retained pattern hit;
- proof/non-proof boundaries stay present;
- mutation remains `none`.

## Verification

Command:

```sh
rtk pnpm --filter @krn/cli test -- runKnowledgeCardsCommand
```

Result:

```txt
32 test files passed
218 tests passed
```

## Pattern Usefulness

| Pattern | Outcome | Why |
|---|---|---|
| `pattern:evidence-proof-non-proof-boundary` | helped | test asserts proof/non-proof boundary remains visible |
| `pattern:source-to-decision-retention-gate` | helped | test asserts shorter query recovers source-to-decision retained pattern |
| `pattern:active-context-compact-current-truth` | helped | slice stayed on current V311 state and did not widen scope |

## Proof Boundaries

What this proves:

- BQ-015 is now regression-protected in existing CLI tests.
- The first mini brain-QA case can become executable without a broad eval
  platform.

What this does not prove:

- semantic retrieval quality;
- ranking quality;
- retained-pattern completeness;
- live DB-backed search;
- graph retrieval quality;
- product readiness.

## Next Action

Open V312 as another executable brain-QA case that exercises a different lane:
evidence command provenance readback. It should reuse existing evidence
surfaces and avoid new DB schema or runtime platforms.
