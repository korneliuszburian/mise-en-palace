# Relation-Linked Memory/Source Usefulness

Date: 2026-07-04
Bead: `mise-en-palace-pz6l`

## Summary

Extended `pnpm eval:source-graph-ranking` with a bounded relation-linked
comparison. The `graph-relation` case now runs the same source-search path with
SourceClaimEdge support and a flat path with SourceClaimEdge support withheld.

## Proof

The eval now reports:

```txt
relationLinkedCaseCount: 1
flatBaselineWeakerCases: 1
flatBaselineMissingExpectedRelationSupportCases: 1
```

For the linked case, the expected SourceClaim remains selected and relation
support is visible:

```txt
id: graph-relation
expectedHitRelationSupport: 2
flatComparison.expectedHitRelationSupport: 0
flatComparison.weakness: missing_expected_relation_support
```

This proves the current source-search readback can expose useful relation
support that a flat memory/source packet cannot explain. The flat path is weaker
in relation-support readback, not in this case's top-k retrieval.

## Non-Proof

This does not prove source truth, broad semantic ranking quality, live pgvector
quality, graph database need, autonomous memory evolution, crawler/API/MCP
readiness, or product readiness. It is one controlled A-MEM-inspired local
falsifier for relation usefulness.

## Verification

```sh
pnpm --filter @krn/cli test -- sourceGraphRankingEval
pnpm eval:source-graph-ranking
pnpm typecheck
pnpm quality:fallow:ci
pnpm --filter @krn/harness test -- activePlanInvariants contextHygieneInvariants
git diff --check
```

## Second Opinion

`second-opinion-claude` returned `approve_with_fixes` twice.

Accepted fixes:

- reworded proof from generic flat weakness to relation-support readback
  weakness;
- added explicit non-proofs for graph database need, autonomous memory
  evolution, API/MCP readiness, and crawler readiness;
- added a negative fixture proving a relation-linked case without relation
  support advantage fails;
- removed the unused `missing_expected_hit` weakness branch so the eval
  contract stays relation-support-only.

No third Claude loop was run; the skill caps fix/review loops and the remaining
state is covered by local verification above.
