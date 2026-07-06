# CLI Parser Naming W88x

Date: 2026-07-06

Bead: `mise-en-palace-w88x`

## Rename Plan

Audited CLI parser `handler` / `manager` vocabulary. The only low-risk parser
batch found was in option parse tables:

- `parseBrainArgs.ts`;
- `parseKnowledgeArgs.ts`;
- `parseHeartbeatArgs.ts`.

Renamed local parser-table vocabulary from `*OptionHandler(s)` and local
`handler` variables to `*OptionParser(s)` and `parser`.

## Verification

```sh
pnpm --filter @krn/cli test -- parseBrainArgs parseKnowledgeArgs parseHeartbeatArgs
pnpm --filter @krn/cli typecheck:tests:clean
pnpm -C packages/cli typecheck
git diff --check
```

Result: passed.

## Proves

- The renamed symbols describe parser tables instead of command handlers.
- CLI parser behavior remains covered by the focused parser tests.
- No command routing or parser validation behavior changed.

## Does Not Prove

- All KRN naming is ideal.
- A broad naming sweep is safe or useful.
- Runtime command size is improved.
