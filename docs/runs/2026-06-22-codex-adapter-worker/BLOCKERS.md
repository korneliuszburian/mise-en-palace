# Blockers

No hard blocker for M26.00.

Known gaps for later M26 slices:

- missing typed Codex adapter contracts named in `GOAL.md`;
- hook expectations are currently command hints, not phase-aware projections;
- no standalone `krn codex brief --run-id <id>`;
- no `pnpm db:smoke:codex-adapter`;
- worker job types are missing `embed_memory_record`;
- worker status vocabulary is not aligned with `GOAL.md` `skipped`;
- no DB-backed WorkerJobRepository transition methods;
- no `pnpm db:smoke:worker-jobs`;
- doctor does not yet report Codex adapter or worker readiness.

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
