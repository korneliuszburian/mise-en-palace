# Goal: Implement KRN Final Harness Spine

This file is the compact Codex Goal activation contract. The full living execution plan is `PLAN.md`; keep `PLAN.md` current as work proceeds.

/goal Implement KRN as a Postgres-backed AI Engineering Harness OS from the current mise-en-palace repository state, verified by a self-contained PLAN.md kept current, passing pnpm typecheck, schema/type tests where introduced, a working krn plan --task vertical slice, a read-only krn doctor, evidence capture, and a recorded dogfood run, while preserving strict TypeScript boundaries, no runtime markdown memory, no .krn truth, no dashboard-first UI, no separate vector/graph/queue stores, no broad subagent system, and no Codex-specific leakage into packages/core. Use the current repository files, official Codex Goal and ExecPlan patterns summarized in PLAN.md, and local source docs only as bounded inputs. Between iterations, update Progress, Surprises & Discoveries, Decision Log, and Outcomes & Retrospective, run the relevant validation command, commit with Conventional Commits, and choose the next smallest slice that advances the canonical harness flow. If blocked, stop with attempted paths, evidence gathered, the blocker, and the exact input that would unlock progress.

## Constraints

- `PLAN.md` is the long-running execution map.
- `GOAL.md` is not the product brain.
- PostgreSQL + pgvector is the canonical KRN brain store.
- Drizzle owns DB schema and migrations.
- Zod owns IO/API/CLI validation boundaries.
- Codex surfaces are adapters.
- Core remains pure and Codex-agnostic.
- CLI is an adapter, not the architecture.
- Do not create dashboard UI, broad eval/benchmark lane, `.krn` truth, runtime markdown memory, MCP server, broad subagent system, or separate vector/graph/queue stores in the first implementation spine.

## Stop Condition

Stop only when the plan is complete with evidence, honestly blocked with attempted paths and unlock conditions, paused by the user, or constrained by a budget/system limit.
