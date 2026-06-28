# V275 Brain Knowledge HTML Catalog Breadth Guard

Status: complete.

## Objective

Guard that the self-contained HTML preview over `docs/brain-knowledge/catalog.json`
renders all current retained pattern cards and keeps proof-boundary fields
visible.

## Change

- Added a focused CLI behavior test for `krn knowledge cards --html` over the
  full catalog with no text filter.
- The guard asserts that the HTML includes all current retained pattern IDs:
  - `pattern:evidence-proof-non-proof-boundary`
  - `pattern:source-to-decision-retention-gate`
  - `pattern:ts-boundary-unknown-first-result-state`
- The guard also asserts source refs, evidence refs, falsifier, does-not-prove,
  mutation boundary, and proof boundaries remain visible.

## Evidence

Commands run:

```sh
rtk pnpm --filter @krn/cli test -- runKnowledgeCardsCommand
```

Result:

```txt
32 passed
200 tests passed
```

## What This Proves

- The current brain knowledge HTML preview renders the complete retained pattern
  catalog.
- The HTML path exposes proof/non-proof fields instead of hiding them behind
  JSON-only readback.
- The preview remains read-only: `Mutation: none`.

## What This Does Not Prove

- Search ranking quality.
- DB-backed card production.
- Web app readiness.
- Product readiness.
- Completeness of retained patterns.

## Finding

The first test attempt used an assumed title for the TypeScript pattern. The
test failed and showed the real card title. The assertion was corrected to the
actual retained pattern title:

```txt
Unknown-first external boundary with explicit result state
```

This is useful evidence that the guard is reading real catalog content, not a
hand-waved expectation.

## Next Task

V276 should add the next retained pattern that directly connects Codex skill
routing to the pattern brain:

```txt
Codex skill progressive-disclosure routing pattern
```

This keeps the fast path toward a useful brain focused on:

```txt
pattern -> retained card -> skill/readback hook -> Codex execution behavior
```
