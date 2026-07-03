# CLI Membership Narrowing

Date: 2026-07-03

## Change

CLI parsing/support code no longer uses the touched membership/indexing casts:

- `memoryCommandSupport.ts` now validates candidate evidence provenance through
  a string-backed guard.
- `parseDbArgs.ts` now resolves DB smoke targets through a typed `Map` instead
  of indexing with `rest[1] as keyof ...`.

## Proof

```sh
pnpm --filter @krn/cli test -- parseDbArgs parseMemoryArgs memory
pnpm -C packages/cli typecheck
rg -n "candidateEvidenceProvenances\\.has\\([^\\n]* as|rest\\[1\\] as keyof typeof dbSmokeTargets" packages/cli/src/memoryCommandSupport.ts packages/cli/src/parseDbArgs.ts
```

The final `rg` returned no matches.

## Non-Proof

This does not remove all CLI casts. It only closes two current parser/support
membership escape hatches without changing command behavior.
