# Reflection Membership Narrowing

Date: 2026-07-03

## Change

`DrizzleReflectionRepository` no longer narrows reflection finding kinds,
severities, candidate link target types, or candidate evidence provenance
through membership casts. The repository now uses string-backed predicates and
keeps the same readback behavior.

## Proof

```sh
pnpm --filter @krn/db test -- DrizzleReflectionRepository
pnpm -C packages/db typecheck
rg -n "reflectionFindingKinds\\.has\\([^\\n]* as|reflectionSeverities\\.has\\([^\\n]* as|reflectionCandidateLinkTargetTypes\\.has\\([^\\n]* as|provenance as ReflectionCandidateEvidence" packages/db/src/repositories/DrizzleReflectionRepository.ts
```

The final `rg` returned no matches.

## Non-Proof

This does not wire reflection candidate writeback into CLI flows or prove
reflection product usefulness. It only tightens the persisted reflection readback
boundary.
