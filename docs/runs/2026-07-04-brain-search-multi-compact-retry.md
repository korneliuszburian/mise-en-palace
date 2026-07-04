# Brain Search Multi Compact Retry

Slice: `mise-en-palace-ykp8`

Change:
- `krn brain search` now tries the full `compactBrainKnowledgeBridgeQueries` sequence after the primary catalog query misses.
- This aligns brain-search retained-pattern recall with the planning path instead of stopping after one compact query.

Proof:
- Added a focused brain-search test where the primary query and first compact query miss, but a later mechanism window `reference implementation recipe` selects the retained recipe pattern.
- Added exact retry-order assertions and a runner-level compact retry fan-out cap.
- Added query-shaping tests proving feedback can remain a substantive mechanism token and long parser-exemplar planning recall is preserved.
- Existing graph and heartbeat compact retry tests still pass.
- Real catalog check selected `reference-implementation-recipe-clone-boundary` and `ts-boundary-brain-knowledge-parser-exemplar` for `prove retained reference implementation recipe pattern through local code exemplar`.

Verification:
- `pnpm --filter @krn/cli test -- runBrainSearchCommand brainKnowledgeQuery` passed.
- `pnpm --filter @krn/cli test -- runBrainSearchCommand brainKnowledgeQuery plan retainedPatternSelection` passed after second-opinion fixes.
- `pnpm -C packages/cli typecheck` passed.
- `pnpm quality:fallow:ci` passed.
- `git diff --check` passed.

Non-proof:
- This does not prove semantic ranking quality, catalog completeness, or product readiness.
- This does not change source-search, DB retrieval, Memory Core, or activation ranking.
