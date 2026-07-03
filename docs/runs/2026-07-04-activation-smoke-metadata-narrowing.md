# Activation Smoke Metadata Narrowing

Date: 2026-07-04

## Change

Replaced `activationSmoke.ts` metadata casts with explicit unknown-first record
narrowing for:

- `rawEvidenceRecallTriggerCount`;
- `observationPrefixSnapshot.itemCount`.

The smoke still returns `0` for missing or malformed metadata.

## Proof

```sh
pnpm --filter @krn/db test -- activationSmoke
pnpm -C packages/db typecheck
pnpm quality:fallow:ci
```

## Non-Proof

This does not prove DB runtime readiness or activation ranking quality. It only
hardens smoke metadata readback narrowing.
