# Progress

Current phase: M21 persisted harness spine in progress; Slice 10 complete.

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
- `krn doctor` now reports harness persistence schema readiness, smoke command
  availability, and overall harness persistence readiness without writing to
  the database.
- Persisted harness loop dogfood is recorded in
  `docs/runs/2026-06-21-persisted-harness-spine/DOGFOOD.md`.
- Anti-rot audit is recorded in
  `docs/runs/2026-06-21-persisted-harness-spine/ANTI_ROT.md`.

Current runtime truth:

- `krn plan --task "..."` remains no-store preview by default, even when DB is
  configured.
- DB writes require explicit `--persist` or explicit smoke commands.
- With `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn`, the persisted
  harness plan/evidence smoke paths and read-only doctor harness readiness are
  proven.
- Dogfood execution run `66626e90-0cf5-4803-9bc7-f477b28b47c4` has linked
  evidence/review/feedback records and SQL readback proof.
- Slice 10 re-verified typecheck, tests, no-env/live doctor, DB readiness,
  project smoke, harness plan smoke, harness evidence smoke, cleanup, forbidden
  surfaces, forbidden dependencies, core library safety, and no-`any` scans.

Next action:

- Slice 11: update final M21 handoff and completion status.
