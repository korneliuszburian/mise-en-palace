# Blockers

No hard blocker for M26.00.

Known gaps for later M26 slices:

- hook expectations are currently command hints, not phase-aware projections;
- no standalone `krn codex brief --run-id <id>`;
- no `pnpm db:smoke:codex-adapter`;
- worker job types are missing `embed_memory_record`;
- worker status vocabulary is not aligned with `GOAL.md` `skipped`;
- no DB-backed WorkerJobRepository transition methods;
- no `pnpm db:smoke:worker-jobs`;
- doctor does not yet report Codex adapter or worker readiness.

Resolved in M26.01:

- typed Codex adapter contracts named in `GOAL.md` are exported from
  `@krn/codex-adapter`;
- full Codex adapter contracts remain out of `packages/core`;
- adapter contracts include explicit does-not-prove, stop condition, rollback,
  skill hint, hook expectation, MCP ref, goal/ExecPlan ref, and subagent probe
  shapes.

Non-goals that remain intentionally blocked:

- KRN MCP server;
- dashboard;
- public API;
- broad worker runtime;
- agent runner;
- sandbox orchestration;
- actual Codex invocation;
- plugin packaging;
- broad subagent system;
- Redis/Kafka queue.
