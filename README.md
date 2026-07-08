# KRN Kernel

KRN is a temporal Memory Core for Codex.

Codex edits code. KRN decides which remembered context is relevant, current,
trusted, rejected, stale, or unknown; renders a bounded decision packet; observes
the result; and feeds review/usefulness evidence back into store-backed memory.

This repo is the kernel workspace, not a dashboard, docs archive, or markdown
memory substrate.

## Start

1. Read `AGENTS.md`.
2. Read `KRN_ROADMAP.md`.
3. Use Beads for active work.
4. Load repo-local skills only when their trigger matches the task.

## Current Truth

- Product direction: `KRN_ROADMAP.md`.
- Operating rules: `AGENTS.md`.
- Durable task graph: Beads.
- Runtime memory: DB/corpus/eval read models, not markdown folders.
- Local scratch: `.local-lab/` is ignored and disposable.

Current status: controlled internal alpha for technical operators. Not
product-ready.

Built enough to keep:

- strict pnpm TypeScript workspace;
- DB-backed source, memory, evidence, review, retrieval, feedback, and
  maintenance paths;
- activation and DecisionPacket read models;
- Codex brief rendering;
- minimal read-only `krn_decision_packet` MCP transport;
- deterministic behavior gates and DB smokes.

Still not built:

- dashboard or product API;
- broad MCP product server;
- autonomous worker daemon;
- large-scale ingest pipeline;
- final temporal consensus engine;
- markdown-backed runtime memory.

## Verification

Fast local gate:

```sh
pnpm alpha:verify
```

Full local gate, when Postgres is available:

```sh
pnpm alpha:verify:full
```

Common focused checks:

```sh
pnpm typecheck
pnpm test
pnpm quality:fallow:ci
pnpm --filter @krn/db db:check
pnpm db:smoke:maintenance-queue
git diff --check
```

Do not claim DB runtime truth unless the relevant DB command ran in the current
environment with `KRN_DATABASE_URL` configured or the default local compose DB
was reachable.
