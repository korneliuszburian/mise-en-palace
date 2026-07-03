# Retained Pattern Guards

Date: 2026-07-03

## Change

`retainedPatternSelection.ts` no longer narrows retained-pattern metadata values
through a generic `allowedValues.has(value as T)` helper. Reviewability,
nextAction, targetFit, status, and source now use explicit string-backed guards.

## Proof

```sh
pnpm --filter @krn/cli test -- retainedPatternSelection
pnpm -C packages/cli typecheck
rg -n "allowedValues\\.has\\([^\\n]* as|value as TValue|parseSetValue" packages/cli/src/retainedPatternSelection.ts
```

The final `rg` returned no matches.

## Non-Proof

This does not remove every generic cast in retained-pattern parsing. It only
removes the value-domain membership cast and preserves existing metadata parsing
behavior.
