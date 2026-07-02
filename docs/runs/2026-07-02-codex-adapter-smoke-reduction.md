# Codex Adapter Smoke Reduction

Date: 2026-07-02

## Scope

Beads: `mise-en-palace-euos`

Goal: reduce `packages/cli/src/codexAdapterSmoke.ts` ceremony while preserving the
real adapter boundary smoke:

```txt
persisted harness readback -> Codex brief render -> boundary assertions -> cleanup
```

## Changed

- Collapsed the smoke report from a many-field boolean dashboard into one bounded
  `boundaryChecks` readback.
- Replaced proof-shape helpers with one adapter-boundary assertion:
  persisted readback, rendered contract, bounded selected context, stale memory
  exclusion, hook phases, and zero Codex invocation.
- Removed fixture-only anti-memory and search-document setup from this smoke.
  The smoke still proves accepted source context, active memory context, stale
  memory exclusion, hook projection, evidence contract rendering, and no Codex
  execution.
- Updated the formatter test to assert the compact proof surface.

## Size

Before:

```txt
packages/cli/src/codexAdapterSmoke.ts: 25,303 bytes / 698 lines
```

After implementation:

```txt
packages/cli/src/codexAdapterSmoke.ts: 17,884 bytes / 528 lines
```

The `<=5 KB` target was not forced because that would require hiding the DB
seed/readback/cleanup fixture in a second file rather than deleting ceremony.
This slice chose a smaller honest smoke over a move-only size win.

## Proof

Commands run:

```sh
rtk pnpm --filter @krn/cli test -- codexAdapterSmoke
rtk pnpm --filter @krn/harness test -- skillInvariants activePlanInvariants contextHygieneInvariants
rtk pnpm quality:fallow:ci
rtk proxy pnpm --filter @krn/cli typecheck
rtk proxy pnpm typecheck
rtk pnpm test
rtk git diff --check
```

All passed locally.

## Non-Proof

- `KRN_DATABASE_URL` was not set locally, so `db:smoke:codex-adapter` was not run
  before commit.
- This does not prove Codex executed, followed, or improved from the rendered
  brief.
- This does not reduce `targetRepoHarnessSmoke.ts` or other DB smoke fixture
  mass.
- This does not change Codex adapter behavior or prompt sections.

## Decision

Keep the DB-backed smoke in CLI for now, but do not pursue `<=5 KB` through
file shuffling. A future reduction should first move common DB smoke scaffold
into a stable shared helper used by multiple smokes, not create a
Codex-adapter-specific hiding place.
