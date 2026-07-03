# Brain Search Multi Compact Retry

Slice: `mise-en-palace-ykp8`

Change:
- `krn brain search` now tries the full `compactBrainKnowledgeBridgeQueries` sequence after the primary catalog query misses.
- This aligns brain-search retained-pattern recall with the planning path instead of stopping after one compact query.

Proof:
- Added a focused brain-search test where the primary query and first compact query miss, but a later mechanism window `reference implementation recipe` selects the retained recipe pattern.
- Existing graph and heartbeat compact retry tests still pass.

Verification:
- `pnpm --filter @krn/cli test -- runBrainSearchCommand brainKnowledgeQuery` passed.
- `pnpm -C packages/cli typecheck` passed.
- `pnpm quality:fallow:ci` passed.
- `git diff --check` passed.

Non-proof:
- This does not prove semantic ranking quality, catalog completeness, or product readiness.
- This does not change source-search, DB retrieval, Memory Core, or activation ranking.
