# Progress

Current phase: M22-M26 Brain Spine complete through final anti-rot and final
handoff.

Completed:

- M22 source graph persistence, CLI write/read surfaces, smoke, doctor
  readiness, dogfood, and anti-rot.
- M23 memory governance schema/repository/CLI promotion surfaces, anti-memory,
  smoke, doctor readiness, dogfood, and anti-rot.
- M24 retrieval/search substrate schema/repository/smoke, doctor readiness,
  dogfood, and anti-rot.
- M25 activation engine, noisy fixture, persisted activation in `krn plan`,
  activation smoke, doctor readiness, dogfood, and anti-rot.
- M26 Codex adapter contracts, execution brief renderer, read-only
  `krn codex brief`, hook expectation projection, Codex adapter smoke, worker
  job schema/repository/smoke, doctor readiness, dogfood, and anti-rot.

Current runtime truth:

- PostgreSQL with pgvector is the canonical local brain-store proof path.
- DB writes require explicit `--persist` or explicit smoke commands.
- `krn doctor` is read-only.
- Codex adapter renders briefs and expectations; it does not invoke Codex.
- Worker jobs are a persistence skeleton; jobs are not executed by a daemon.
- Markdown is docs/export/audit/handoff material, not runtime Memory Core.

Next action:

- Start the next milestone by designing a bounded maintenance worker
  lease/claim contract over the proven `worker_jobs` skeleton.
