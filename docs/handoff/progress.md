# Progress

Current phase: M20 local brain-store runtime proof complete; final handoff
commit and push are the remaining repository hygiene step.

Completed in M20:

- Run ledger created under `docs/runs/2026-06-21-brain-store-proof/`.
- DB runtime inventory recorded.
- Local Postgres/pgvector setup path added.
- `pnpm db:ready` added for migration readiness and pgvector proof.
- `krn doctor` refined to report exact read-only brain-store readiness.
- `pnpm db:smoke` added for minimal insert/read/cleanup persistence proof.
- Local live DB proof passed with migrations expected/applied `3/3`, pgvector
  available, doctor ready, and smoke cleanup verified.

Current runtime truth:

- No-store CLI preview remains valid when `KRN_DATABASE_URL` is absent.
- With `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn` and Compose
  Postgres running, the local brain-store runtime path is proven.

Next action:

- Commit and push the final M20 handoff update.
