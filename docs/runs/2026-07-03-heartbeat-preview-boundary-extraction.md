# Heartbeat Preview Boundary Extraction

Date: 2026-07-03

Bead: `mise-en-palace-z406`

## Changed

- Extracted heartbeat preview JSON/readback parsing from
  `runHeartbeatPreviewCommand.ts` into `heartbeatPreviewReadback.ts`.
- Extracted heartbeat preview text/JSON output formatting into
  `heartbeatPreviewFormat.ts`.
- Kept `runHeartbeatPreviewCommand.ts` focused on database runtime resolution,
  candidate-kind selection, repository reads, and `buildBrainHeartbeatPreview`.

## Size

Before:

```txt
packages/cli/src/runHeartbeatPreviewCommand.ts: 46,786 bytes
```

After:

```txt
packages/cli/src/runHeartbeatPreviewCommand.ts: 8,684 bytes
packages/cli/src/heartbeatPreviewReadback.ts: 25,266 bytes
packages/cli/src/heartbeatPreviewFormat.ts: 13,359 bytes
```

This is an ownership split, not a net LOC deletion. The value is that command
orchestration is no longer mixed with unknown-first JSON readback parsing and
operator output formatting.

## Verification

```sh
rtk pnpm -C packages/cli typecheck
rtk pnpm --filter @krn/cli test -- runHeartbeatPreviewCommand
```

Both passed before this report was written.

## Proof Boundary

Proves: heartbeat preview command behavior remains covered by the focused CLI
test suite while parsing and formatting are separated from orchestration.

Does not prove: heartbeat candidate quality, worker daemon/runtime behavior,
source truth, Memory Core mutation safety beyond existing readback contracts, or
global CLI architecture cleanup.
