# Blockers

No hard blocker for M26.00.

Known gaps for later M26 slices:

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

Resolved in M26.02:

- execution brief rendering now starts from a typed `ExecutionBrief` artifact;
- rendered brief includes explicit source claims used, memory records used,
  anti-memory warnings, stop condition, rollback expectation, next action, and
  what-this-does-not-prove;
- hook expectations are phase-aware in the brief output, while still remaining
  expectations rather than hook scripts.

Remaining hook work:

- M26.04 still needs a dedicated hook expectation projection slice before
  doctor/smoke readiness can claim hook projection coverage.

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
