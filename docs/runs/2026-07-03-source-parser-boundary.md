# Source Parser Boundary

Date: 2026-07-03

## Change

`parseSourceArgs.ts` no longer assigns source command string options through
`sourceCommand[key as ...]` casts. Source claim add/reject and source decision
link/adopt options now use typed setter tables, matching the memory parser
boundary.

## Proof

```sh
pnpm --filter @krn/cli test -- parseSourceArgs
pnpm -C packages/cli typecheck
rg -n "sourceCommand\\[key as|SourceClaim(Add|Reject)StringKey.*as|SourceDecision(Link|Adopt)StringKey.*as| as SourceClaim(Add|Reject)StringKey| as SourceDecision(Link|Adopt)StringKey" packages/cli/src/parseSourceArgs.ts
```

The final `rg` returned no matches.

## Non-Proof

This does not prove full CLI test typecheck coverage, source command runtime
quality, or source graph ranking quality. It only removes one parser-local typed
escape hatch while preserving existing parse behavior.
