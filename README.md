# KRN Kernel

KRN is a Codex Operating Layer / AI Engineering Control Plane.

Codex executes. KRN supplies bounded context, service/store-backed memory,
source grounding, policy, skills, eval expectations, traces, review gates, and
feedback.

This repository is a kernel workspace and early KRN harness implementation, not
a dashboard-first application. It encodes the language, boundaries,
Codex-native surfaces, DB-backed harness spine, and the first observational
memory staging primitives that keep implementation work small, source-grounded,
and reviewable.

## Start Here

1. Read `AGENTS.md`.
2. Read `docs/KRN_KERNEL.md`.
3. Use `GOAL.md` as the compact activation contract.
4. Use `PLAN.md` as the living execution map for complex implementation work.
5. Treat `docs/materials/` as raw source quarantine, not default context.

## Built

- Strict pnpm TypeScript workspace with core/schema/db/harness/codex-adapter/cli/workers packages.
- PostgreSQL/pgvector brain-store schema, migrations, repositories, readiness checks, and DB smokes.
- CLI surfaces for planning, doctor/readiness, evidence capture, audit, Codex brief rendering, init/connect, and manual observation preview/persist.
- AuditBundle contracts, persistence, pure audit checks, and audit CLI.
- Observation core contracts, IO schemas, DB schema, repository adapter, evidence/source-range linkage, deterministic observer input builder, manual `krn observe --run <id> [--persist]`, and pure observation prefix selector.
- Target-repo init/connect and project-scoped persisted plan dogfood smokes.

## Built But Not Proven End-To-End

- Manual observation runtime exists, but MM-17 dogfood evidence is not committed yet.
- Observation prefix selection exists as pure harness logic, but it is not wired into context assembly or activation runtime.
- Memory schema/repository/governance scaffolding exists, but governed MemoryReviewGate promotion is not the completed product path yet.
- Worker jobs are persisted skeletons; production job execution is not built.

## Not Built Yet

- Reflection contracts, persistence, repository, CLI, worker, and candidate generation.
- MemoryReviewGate product path, memory invalidation/demotion behavior, and broad anti-memory enforcement.
- Golden memory behavior runner.
- No dashboard.
- No benchmark lane.
- No runtime memory in markdown.
- No broad subagent system.
- No plugin package.
- No KRN MCP server.
- No API server.
- No source crawler/research layer.

## Current Phase

The memory ideal-state plan is the active execution track:

```txt
docs/plans/memory-ideal-state/PLAN.md
```

MM-00 through MM-17A are complete. The latest planning repair layer from the
external harsh reviews is committed, public current-state docs are reconciled,
and the next execution slice is MM-16R: observation prefix relevance and
project-scope hardening.

Raw onboarding/research material remains quarantined in `docs/materials/` and is
not runtime truth.
