# Post-Refactor Pattern Usefulness Feedback

Date: 2026-07-03.

Beads: `mise-en-palace-fusx`.

## Change

Added `docs/brain-knowledge/usefulness-feedback/post-refactor-kernel-slices.json`
to retain usefulness feedback for two recent dogfood paths:

- `pattern:ts-boundary-unknown-first-result-state` helped the brain-search JSON
  readback boundary repair.
- `pattern:graph-relation-readback-boundary` helped keep source graph ranking
  work bounded to reviewable SourceClaimEdge readback, explicit relation support,
  and proof caveats.

Registered the file in `docs/brain-knowledge/catalog.json`.

## Verification

- `pnpm --filter @krn/cli krn brain knowledge --catalog-file docs/brain-knowledge/catalog.json --text ts-boundary-unknown-first-result-state --json`
- `pnpm --filter @krn/cli krn brain knowledge --catalog-file docs/brain-knowledge/catalog.json --text "graph relation readback" --json`
- `pnpm --filter @krn/cli test -- runKnowledgeCardsCommand brainSearchReadback runSourceSearchCommand`

## Proof Boundary

Proves the post-refactor pattern feedback parses and is queryable through the
brain knowledge readback.

Does not prove automatic pattern selection, semantic ranking quality, source
truth, graph retrieval quality, or KRN product readiness.
