# Heartbeat Parser Boundary

Date: 2026-07-03

## Change

`parseHeartbeatArgs.ts` no longer casts `state.candidateKinds` into the
non-empty tuple required by `heartbeatPreview`. It now uses a local non-empty
candidate-kind guard while preserving the same command shape.

## Proof

```sh
pnpm --filter @krn/cli test -- parseHeartbeatArgs
pnpm -C packages/cli typecheck
rg -n "candidateKinds as \\[HeartbeatCandidateKind|state\\.candidateKinds as" packages/cli/src/parseHeartbeatArgs.ts
```

The final `rg` returned no matches.

## Non-Proof

This does not remove all computed-key casts in CLI parsers. It only closes the
heartbeat candidate-kind tuple escape hatch.
