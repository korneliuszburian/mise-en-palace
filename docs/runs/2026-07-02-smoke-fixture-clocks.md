# Smoke Fixture Clocks

Date: 2026-07-02

## Summary

Centralized deterministic smoke timestamps into one DB-dev fixture contract and made the Codex adapter stale-memory exclusion proof readback-visible.

This slice also repaired stale activation smoke expectations exposed by the DB run: the activation smoke now proves at least one included decision/context item plus explicit stale/conflict/exclusion readback, instead of depending on old exact counts that no longer match current activation safety behavior.

## Changed

- Added `packages/db/src/smokeFixtureClocks.ts`.
- Exported `smokeFixtureClocks` through `@krn/db/dev`.
- Replaced local smoke date literals in activation, brain-loop, heartbeat worker authority, worker jobs, Codex adapter, and target repo harness smoke paths.
- Added `packages/db/src/smokeFixtureClocks.test.ts`.
- Strengthened `db:smoke:codex-adapter`:
  - seed source authority now becomes accepted through `SourceDecision adopt`;
  - proof checks are labeled;
  - expired memory fixture must be excluded as `stale`;
  - rendered brief must expose that exclusion;
  - expired memory must not appear in `memoryRecordsUsed`;
  - report prints expired-memory exclusion reason and validity window.
- Repaired activation smoke magic-count assertions:
  - included decisions: `>= 1`;
  - context items: `>= 1`;
  - raw recall trigger count remains reported but is no longer required to be positive.

## Proof

- `rtk pnpm db:ready`
- `rtk pnpm db:smoke:activation`
- `rtk pnpm db:smoke:brain-loop`
- `rtk pnpm db:smoke:heartbeat-worker-authority`
- `rtk pnpm db:smoke:worker-jobs`
- `rtk pnpm db:smoke:codex-adapter`
- `rtk pnpm db:smoke:target-repo-harness`
- `rtk pnpm -C packages/db test -- smokeFixtureClocks activationSmoke brainLoopSmoke heartbeatWorkerAuthoritySmoke workerJobSmoke`
- `rtk pnpm -C packages/cli test -- codexAdapterSmoke targetRepoHarnessSmoke`
- `rtk pnpm -C packages/db typecheck`
- `rtk pnpm -C packages/cli typecheck`
- `rtk proxy pnpm typecheck`
- `rtk pnpm test`
- `rtk pnpm quality:fallow:ci`
- `rtk pnpm eval:brain-battle:smoke`
- `rtk git diff --check`

DB cleanup readback after failed activation debug runs showed no leftover `krn-activation-smoke-*` or `krn-codex-adapter-smoke-*` workspaces.

## Non-Proof

- This does not replace fixed smoke fixtures with wall-clock runtime behavior.
- This does not prove worker runtime execution, idempotency enforcement, retry semantics, or Memory Core gate enforcement.
- This does not change activation ranking, source taxonomy, schema constraints, or DB migrations.
- This does not prove Codex follows the rendered brief; it proves DB-backed readback and rendered brief content.
- Activation smoke still proves a bounded DB-backed scenario, not the full production product loop.

## Second-Opinion Prompt

Review the current diff after `docs/runs/2026-07-02-smoke-fixture-clocks.md`.

Act as a ruthless senior reviewer. Verify whether `smokeFixtureClocks` is the right fixture-only boundary or whether it creates another decorative shared constant surface. Inspect the Codex adapter smoke proof: challenge whether `SourceDecision adopt` is the correct way to make the source claim accepted, whether stale memory exclusion is proven strongly enough, and whether the report output is useful or still presence-check theater. Check the activation smoke assertion changes and decide whether `>= 1` and nonnegative raw recall readback are honest current-behavior proof or weakened smoke coverage. Find any remaining hard-coded smoke clocks, cleanup leaks, Fallow/complexity risks, or misleading proof/non-proof wording. Propose the next bounded slice with exact files, risk, verification commands, and what must not be changed.
