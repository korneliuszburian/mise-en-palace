# Temporal Stale Source Negative

Bead: `mise-en-palace-s6pv`

## Change

`eval:memory-advantage` now models excluded SourceClaims with explicit
`sourceExclusions` readback. The new held-out `temporal_stale_source_claim`
case gives the simple lexical baseline a stale crawler-first SourceClaim, while
KRN selects the current SourceDecisionEdge-linked SourceClaim and reports the
stale source exclusion reason.

## Proof

Local verification:

```sh
pnpm --filter @krn/cli test -- memoryAdvantageEval
pnpm eval:memory-advantage
pnpm --filter @krn/cli test -- deterministicEval
pnpm run typecheck
pnpm quality:fallow:ci
pnpm --filter @krn/harness test -- activePlanInvariants contextHygieneInvariants
pnpm test
git diff --check
```

The eval output shows:

- `negativeClass: temporal_stale_source_claim`;
- simple retrieval top id: `source:old-crawler-first-without-decision-edge`;
- KRN selected source id: `source:current-source-decision-edge-ranking`;
- KRN source exclusion:
  `source:old-crawler-first-without-decision-edge`;
- reviewed feedback proof status: `pass`.

## Second Opinion

`second-opinion-claude` R1 returned `approve_with_fixes` / LOW. It found one
local hygiene issue: `caseStatus` received source exclusions reshaped as
memory-like exclusions, which could blur memory/source semantics for future
maintainers.

The fix changed `caseStatus` to accept only `hasExplicitExclusion: boolean`.
Memory exclusions and source exclusions now stay in separate readback fields:
`exclusions`, `sourceExclusions`, `excludedMemoryIds`, and
`excludedSourceClaimIds`.

R2 returned `approve` / LOW for the F1-only follow-up.

## Non-Proof

This does not prove runtime stale-source detection for arbitrary SourceClaim
rows, production source ranking quality, source truth, DB runtime behavior, or
worker execution. It is a deterministic local guard for temporal source
exclusion semantics in the memory-advantage eval.
