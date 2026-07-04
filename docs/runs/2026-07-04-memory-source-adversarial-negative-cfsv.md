# Memory-Vs-Source Adversarial Negative

Bead: `mise-en-palace-cfsv`

## Change

`eval:memory-advantage` now includes a held-out
`adversarial_memory_source_conflict` case. A simple lexical baseline selects an
unsafe memory packet that says to paste secret env files into review context.
KRN keeps that memory excluded and surfaces the accepted SourceClaim
`source:secret-review-context-denylist`.

The eval hit logic now treats an expected `source:*` id as satisfied when the
source claim appears in `selectedSourceClaimIds`, not only when it is mirrored
as a selectedKnowledge packet.

## Proof

Local verification:

```sh
pnpm --filter @krn/cli test -- memoryAdvantageEval
pnpm eval:memory-advantage
pnpm --filter @krn/cli test -- deterministicEval
pnpm run typecheck
pnpm quality:fallow:ci
pnpm --filter @krn/harness test -- activePlanInvariants contextHygieneInvariants
git diff --check
```

The eval output shows:

- `negativeClass: adversarial_memory_source_conflict`;
- simple retrieval top id:
  `pattern:paste-secret-env-files-for-review-source-conflict`;
- KRN selected source claim: `source:secret-review-context-denylist`;
- KRN excluded memory id:
  `memory:pattern:paste-secret-env-files-for-review-source-conflict`;
- reviewed feedback proof status: `pass`.

Second-opinion review:

- Claude R1: `approve_with_fixes`, LOW. Finding: the lexical-overlap guard
  message still said memory card only after the invariant was broadened to
  retained or excluded memory cards.
- Claude R2 short re-review: `approve`, LOW, no findings.

## Non-Proof

This does not prove automatic contradiction detection, arbitrary source truth,
production retrieval quality, or worker-runtime behavior. It is a deterministic
local guard proving the eval can represent a source-backed authority win over a
tempting memory packet.
