# Blockers

No hard blocker for M26.00.

Known gaps for later M26 slices:

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

Resolved in M26.03:

- standalone `krn codex brief --run-id <id>` exists;
- command uses persisted harness run readback and renders the typed execution
  brief without writes;
- live DB-backed brief rendering passed for M25 dogfood run
  `bb33bd3d-02df-4ff3-839b-6f545de88b4c`.

Resolved in M26.04:

- dedicated hook expectation projection exists in `@krn/codex-adapter`;
- projection covers `SessionStart`, `PreToolUse`, `PostToolUse`,
  `PreCompact`, and `Stop`;
- projection explicitly remains expectations-only and does not create hook
  scripts, execute hooks, invoke Codex, or mutate memory.

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
