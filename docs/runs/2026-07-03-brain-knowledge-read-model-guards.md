# Brain Knowledge Read Model Guards

Date: 2026-07-03

## Change

Replaced the generic `parseSetValue` membership cast in
`brainKnowledgeReadModel.ts` with string-backed predicate functions for:

- brain knowledge kind/status/confidence/reviewability/next action;
- usefulness feedback outcome;
- retained pattern adoption status.

The parser still accepts the same literal values, but the membership guards no
longer need `value as T` casts.

## Proof

```sh
pnpm --filter @krn/harness test -- brainKnowledgeReadModelInvariants
pnpm -C packages/harness typecheck
pnpm quality:fallow:ci
```

## Non-Proof

This does not remove the generic object-field parser cast in the same module.
It only hardens enum-like membership narrowing for this slice.
