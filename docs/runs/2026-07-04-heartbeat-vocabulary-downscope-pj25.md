# Heartbeat Vocabulary Downscope

Date: 2026-07-04
Bead: `mise-en-palace-pj25`

## Scope

After the worker boundary decision kept `@krn/workers` contract/readback-only,
this slice downscoped the most misleading active readback name without breaking
legacy consumers.

## Behavior Change

`BrainHeartbeatPreview` now exposes:

- `manualCandidateLoop`: preferred readback name for candidate-only operator
  routing;
- `runtimeLoop`: legacy alias retained for existing JSON consumers and tests.

CLI text formatting and the DB heartbeat worker boundary smoke now read
`manualCandidateLoop`. JSON output still carries both fields.

## Leave

- `krn heartbeat preview` command and legacy alias remain unchanged. Renaming
  the command would need a deprecation path and would be larger than this slice.
- `*HeartbeatPreview` file/type names remain for now because they are broad
  public internal surfaces with many docs/tests. The new readback field removes
  the highest-risk runtime implication first.

## Verification

```sh
pnpm --filter @krn/workers test -- brainHeartbeatPreview
pnpm --filter @krn/cli test -- runHeartbeatPreviewCommand
pnpm -C packages/db test -- heartbeatWorkerBoundarySmoke
pnpm run typecheck
pnpm quality:fallow:ci
git diff --check
```

## Non-Proof

This does not implement a worker daemon, scheduler, leases, retries, runtime
idempotency, Memory Core mutation safety, or a full heartbeat vocabulary rename.
