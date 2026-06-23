# KRN Kernel

KRN is a Codex Operating Layer / AI Engineering Control Plane.

Codex executes. KRN supplies bounded context, service/store-backed memory,
source grounding, policy, skills, eval expectations, traces, review gates, and
feedback.

This repository is a kernel workspace and KRN harness implementation, not a
dashboard-first application.

## Start Here

1. Read `AGENTS.md`.
2. Read `docs/KRN_KERNEL.md`.
3. Use `GOAL.md` as the compact activation contract.
4. Use `PLAN.md` as the canonical living execution map.
5. Treat `docs/materials/` as raw source/audit quarantine, not default context.

`docs/plans/memory-ideal-state/PLAN.md`, QG docs, handoff docs, and review docs
are historical ledgers unless the root `PLAN.md` explicitly names them as
evidence for a slice.

## Current Truth

Root `PLAN.md` is the active plan.

The current reset direction is:

- remove stale current-state surfaces;
- reject productized QG-06 / anti-slop / audit-authority direction;
- classify public operator, governed admin, and internal dev surfaces;
- harden the real Memory Brain spine only through final-pattern slices.

`krn audit` is not a product quality engine. It may survive only as a narrow
internal deterministic guard, or be renamed/deleted by a later slice.

## Built

- Strict pnpm TypeScript workspace with
  `core/schema/db/harness/codex-adapter/cli/workers` packages.
- PostgreSQL/pgvector-oriented brain-store schema, migrations, repositories,
  readiness checks, and DB smoke commands.
- CLI surfaces for planning, doctor/readiness, evidence capture, audit, Codex
  brief rendering, init/connect, manual observation, reflection, source, memory,
  and review workflows.
- AuditBundle contracts and persistence as evidence packaging.
- Observation core contracts, IO schemas, DB schema, repository adapter,
  evidence/source-range linkage, deterministic observer input builder, manual
  `krn observe --run <id> [--persist]`, and observation prefix selection.
- Reflection contracts, records, input selection, gap/contradiction reporting,
  and manual `krn reflect`.
- MemoryCandidate, MemoryReviewGate, AntiMemory, source graph, activation,
  evidence/review feedback, GoldenTask, and Promptfoo adapter primitives.

## Built But Not Proven End-To-End

- The full loop
  `evidence -> observation -> reflection -> candidates -> review -> memory -> activation -> golden proof`
  is not complete as one governed product path.
- Reflection currently records/report candidates but must not be described as
  autonomous memory mutation or dreaming runtime.
- Worker jobs are persisted contracts/skeletons; production background
  execution is not built.
- Promptfoo is adopted only as a bounded eval runner/result adapter. The local
  Promptfoo smoke proves runner integration and result mapping only; it does
  not prove KRN memory behavior.
- DB package code exists, but live DB runtime truth depends on running DB
  commands in the current shell with `KRN_DATABASE_URL` configured.

## Not Built

- Dashboard.
- API server.
- KRN MCP server.
- Plugin package.
- Source crawler or research layer.
- Broad benchmark lane.
- Broad subagent system or runtime agent zoo.
- Runtime memory in markdown or `.krn`.
- Separate vector DB, graph DB, Redis, or Kafka.
- Productized anti-slop subsystem, quality engine, or autonomous audit layer.

## Verification

Common local checks:

```sh
pnpm typecheck
pnpm test
pnpm exec promptfoo --version
pnpm eval:promptfoo:smoke
git diff --check
```

DB runtime checks, only when local DB env is configured:

```sh
pnpm db:ready
pnpm --filter @krn/db db:check
pnpm db:smoke
```

Do not claim DB runtime truth unless DB commands were run in the current
environment.
