# Progress

Current phase: Memory ideal-state execution track after MM-16 and external
harsh-review repair planning.

Completed:

- M27 target repo readiness, DB smokes, evidence capture, anti-rot audit, and
  memory ideal-state goal handoff.
- MM-00 through MM-17A and MM-16R in
  `docs/plans/memory-ideal-state/PLAN.md`.
- MM-16/17 external review repair layer in
  `docs/plans/memory-ideal-state/PLAN.md`, committed as
  `88cbbba docs(memory): add harsh review repair layer`.
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
- Manual `krn observe --run <id> [--persist]` exists, but the observation
  runtime still needs MM-17B dogfood proof before it is treated as proven.
- Observation prefix selector exists as pure harness logic and MM-16R hardened
  relevance/project scoping. It still needs later activation/context
  integration.
- Codex adapter renders briefs and expectations; it does not invoke Codex.
- Worker jobs are a persistence skeleton; jobs are not executed by a daemon.
- Markdown is docs/export/audit/handoff material, not runtime Memory Core.

Next action:

- Continue with MM-17B observation dogfood with raw recall matrix.
