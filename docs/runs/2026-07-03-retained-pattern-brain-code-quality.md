# Retained Pattern Brain Code-Quality Slice

Date: 2026-07-03.

Bead: `mise-en-palace-w4px`.

## Pattern Application

Selected retained pattern:

```txt
pattern:ts-boundary-unknown-first-result-state
```

Readback command:

```sh
pnpm --filter @krn/cli krn brain knowledge --catalog-file docs/brain-knowledge/catalog.json --text unknown-first --json
```

Result: deterministic readback returned 3 cards, including
`pattern:ts-boundary-unknown-first-result-state` and
`pattern:ts-boundary-brain-knowledge-parser-exemplar`.

## Code Change

Boundary classified: CLI child-process JSON readback.

Changed `packages/cli/src/brainSearchReadback.ts` so `parseJsonObject` and
`recordValue` use an explicit `isJsonRecord` guard instead of validating and
then returning through `as JsonRecord`.

Added `packages/cli/src/__tests__/brainSearchReadback.test.ts` to prove:

- object JSON parses as an indexable readback record;
- array JSON is rejected;
- `null` JSON is rejected.

## Verification

```txt
pnpm --filter @krn/cli test -- brainSearchReadback runBrainSearchCommand
pnpm -C packages/cli typecheck
pnpm --filter @krn/cli typecheck:tests:clean
pnpm -w typecheck
pnpm quality:fallow:ci
git diff --check
```

## Proof Boundary

Proves:

- one retained TypeScript boundary pattern was selected through brain-knowledge
  readback before implementation;
- the selected pattern changed an active CLI JSON boundary;
- non-object brain-search child output is rejected by focused tests;
- strict TypeScript and Fallow passed locally.

Does not prove:

- brain-knowledge selection quality is generally good;
- DB-backed brain recall selected the pattern;
- implementation correctness outside this readback boundary;
- KRN product readiness.
