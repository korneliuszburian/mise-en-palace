# Eval Proof-Boundary Manifest Scope

Date: 2026-07-03

## Verdict

`evalProofBoundaryManifest` remains useful as harness docs-lint/test evidence,
but it is not a public `@krn/harness` runtime API. The public harness barrel no
longer exports it.

## Behavior Change

- Removed `evalProofBoundaryManifest` from `packages/harness/src/index.ts`.
- Added a focused invariant that fails if the public harness barrel re-exports
  the manifest again.
- README now describes the manifest as harness docs-lint evidence rather than
  runtime API.

## Proof

- `pnpm --filter @krn/harness test -- evalProofBoundaryManifest behaviorGateMatrixInvariants`

## Non-Proof

This does not prove eval quality is complete, KRN behavior is sufficient, or
all proof-boundary wording is perfect. It only prevents a test/docs-lint
manifest from masquerading as a public runtime surface.
