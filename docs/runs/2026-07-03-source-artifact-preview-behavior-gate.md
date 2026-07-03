# Source Artifact Preview Behavior Gate

Date: 2026-07-03
Bead: `mise-en-palace-ww5l`

## Change

Added `golden-case-source-artifact-preview-reuse-001-a` to the deterministic
KRN behavior gate.

The case executes the real source artifact preview extractor, turns the ready
claim candidate into a SourceClaim activation candidate, applies activation
filters and ContextROI, and asserts the claim reaches ContextAssembly as bounded
source context.

## Proof

Proves:

- source artifact preview extraction can produce a reviewable local claim;
- that claim can shape later source activation context through the existing
  activation and context assembly path;
- `eval:krn:smoke` now includes this CLI-adjacent behavior instead of relying
  only on command readback tests.

Does not prove:

- source truth;
- DB persistence;
- crawler readiness;
- embedding/vector quality;
- broad artifact extraction quality;
- ranking quality at scale.

## Verification

Passed:

```sh
pnpm --filter @krn/harness test -- goldenKrnBehaviorGate behaviorGateMatrixInvariants
pnpm eval:krn:smoke
pnpm -w typecheck
pnpm quality:fallow:ci
git diff --check
```
