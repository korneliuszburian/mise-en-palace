# Progress

Current phase: final KRN harness spine complete pending commit/push.

Completed:

- Postgres/pgvector Drizzle schema and migrations for harness, memory, source,
  retrieval, run events, outbox, and worker jobs.
- Zod IO schemas for unknown-input boundaries.
- Pure core domain model with Codex kept at the adapter edge.
- Harness repository ports, activation engine, context assembly, compiler, and
  evidence contract.
- Codex execution brief renderer.
- CLI vertical path: `krn plan --task`, `krn doctor`, and `krn evidence capture`.
- Maintenance worker job skeleton with enqueue/outbox handoff.
- Repo-local operational skills aligned to the harness spine.
- First KRN-on-KRN dogfood run recorded in
  `docs/runs/2026-06-21-first-postgres-backed-harness-dogfood.md`.

Current runtime truth:

- `KRN_DATABASE_URL` is not configured locally, so CLI runtime proof is
  no-store preview, not persisted harness state.
- `krn doctor` reports brain-store readiness as preview-only until Postgres,
  pgvector, and migrations are live.

Final verification:

- `pnpm typecheck`, `pnpm test`, `krn plan`, `krn doctor`, `krn evidence
  capture`, and forbidden-surface checks passed on 2026-06-21.

Next action:

- Commit and push M19, then run goal completion audit.
