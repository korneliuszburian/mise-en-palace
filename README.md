# KRN Kernel

KRN is a Codex Operating Layer / AI Engineering Control Plane.

Codex executes. KRN supplies bounded context, service/store-backed memory,
source grounding, policy, skills, eval expectations, traces, review gates, and
feedback.

This repository is a kernel workspace and KRN harness implementation, not a
dashboard-first application. It encodes the language, boundaries,
Codex-native surfaces, DB-backed harness spine, observational memory staging,
reflection staging, governed memory review, activation, audit, and early golden
behavior proof primitives.

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

- GoldenTask contracts, fixtures, behavior tests, pure golden runner, and
  Promptfoo-compatible snapshot export exist, but official Promptfoo integration
  is not adopted or rejected yet.
- The full loop `evidence -> observation -> reflection -> candidates -> review
  -> memory -> activation -> golden proof` is not complete as a single product
  path.
- Worker jobs are persisted skeletons; production job execution is not built.
- Repo-wide quality gates for test topology, zombie/dead-code audit,
  export-surface hygiene, and smell/bloat auditing are active before further
  feature work.

## Not Built Yet

- Official Promptfoo runner/adapter decision and integration.
- EvalCandidate promotion gate.
- Golden eval dogfood regression gate.
- Repo-wide zombie/dead-code/export-surface quality gate.
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

MM-00 through MM-65, MM-16R, and QG-00 through QG-04A are complete. The next
execution track is the blocking QG quality correction gate in
`docs/plans/memory-ideal-state/PLAN.md`: QG-04B through QG-04H repair the
remaining smell/bloat findings, then QG-05 decides official Promptfoo
integration, and QG-06 automates quality gates in `krn audit`. The current
repo-wide inventory is `docs/plans/memory-ideal-state/QG-00-REPO-INVENTORY.md`;
the current smell/bloat audit is
`docs/plans/memory-ideal-state/QG-04-SMELL-BLOAT-AUDIT.md`. Feature work
resumes at MM-66 only after QG-04B through QG-06 pass.

Raw onboarding/research material remains quarantined in `docs/materials/` and is
not runtime truth.
