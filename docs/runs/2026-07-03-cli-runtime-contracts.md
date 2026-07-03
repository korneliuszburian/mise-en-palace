# CLI Runtime Contracts Extraction

Date: 2026-07-03

Bead: `mise-en-palace-be1t`

## Changed

Command runtime interfaces that exactly shared `env`, `now`, and `createId`
now extend `BaseCommandRuntime` from `commandRuntimeSupport.ts`.

Updated surfaces include plan, brain search, run show, Codex brief, source
search, heartbeat preview, source decision commands, memory review/apply
commands, source-claim relation/rejection commands, and the shared memory
command database input.

## Left Alone

Runtimes that do not exactly match `BaseCommandRuntime` stayed local:

- optional `env` / `now` preview runtimes;
- DB smoke/readiness runtimes that do not carry `now`;
- root `CliRuntime`;
- database/runtime adapter contracts;
- read-only smoke support contracts.

## Verification

Focused checks already run during implementation:

```sh
rtk pnpm -C packages/cli typecheck
```

Additional gate runs are recorded in the closing Beads note.

## Proof Boundary

Proves: repeated exact runtime primitive declarations are reduced without
changing command behavior.

Does not prove: CLI command architecture is fully clean, command runners are
small, parser dispatch is consolidated, or runtime output behavior changed.
