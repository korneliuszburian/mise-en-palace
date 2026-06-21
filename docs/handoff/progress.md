# Progress

Current phase: M21 persisted harness spine in progress; Slice 07 complete.

Completed in M21 so far:

- Run ledger created under
  `docs/runs/2026-06-21-persisted-harness-spine/`.
- `GOAL.md` now requires repo-local skills as gates for matching slices.
- Existing harness schema was inventoried; no new migration was needed for the
  primary M21 spine.
- Repository aggregate readback by `executionRunId` exists.
- `krn plan --task "..." --persist` explicitly writes a persisted harness plan
  run and prints IDs.
- `pnpm db:smoke:harness-plan` proves persisted plan readback and cleanup.
- `krn evidence capture --run-id <id> --persist` writes linked evidence,
  review, and feedback candidate records.
- `pnpm db:smoke:harness-evidence` proves marked plan/evidence/readback cleanup
  with live Postgres.

Current runtime truth:

- `krn plan --task "..."` remains no-store preview by default, even when DB is
  configured.
- DB writes require explicit `--persist` or explicit smoke commands.
- With `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn`, the persisted
  harness plan and evidence smoke paths are proven.

Next action:

- Slice 08: update read-only `krn doctor` to report harness persistence
  readiness.
