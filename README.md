# KRN Kernel

KRN is a temporal Memory Core for Codex.

Codex edits code. KRN decides which remembered context is relevant, current,
trusted, rejected, stale, or unknown; renders a bounded decision packet; observes
the result; and feeds review/usefulness evidence back into store-backed memory.

This repo is the kernel workspace, not a dashboard, docs archive, or markdown
memory substrate.

## Start

1. Read `AGENTS.md`.
2. Read `CONTEXT.md` and `CONVENTIONS.md` when changing skill behavior,
   terminology, artifacts, or planning flow.
3. Read `KRN_ROADMAP.md` when product or architecture direction matters.
4. Use Beads for active work.
5. Load repo-local skills only when their trigger matches the task.

## Operating Loop

KRN work uses one small loop:

```txt
Beads issue
  -> roadmap/source-to-decision context
  -> focused skill selection
  -> implementation or review slice
  -> verification
  -> evidence and usefulness feedback
  -> close, follow up, or hand off
```

Codex edits code. KRN supplies governed context and records whether that context
helped. Repo-local skills are operational protocols for repeated work; they are
not runtime memory or product architecture. Their stable operating contract lives
in `CONVENTIONS.md`; shared language lives in `CONTEXT.md`; product direction
lives in `KRN_ROADMAP.md`.

External methods and research enter only through source-to-decision: source,
mechanism, KRN implication, decision or rejection, consumer, falsifier, and
non-proof. A method is adopted only when it changes a current KRN consumer.

## Skill Boundary

Repo-local skills live in `.agents/skills`. They are versioned operating
protocols for repeated KRN work, not runtime memory, broad docs, or architecture
by themselves.

The skill/artifact contract is defined in `CONVENTIONS.md`. Keep README as a
compact onboarding surface, not a second source of product truth. External
methods such as Matt Pocock-style skills and loop engineering enter KRN only
through source-to-decision and only as mechanisms with a current consumer and
falsifier.

## Current Truth

- Shared language: `CONTEXT.md`.
- Skill and artifact conventions: `CONVENTIONS.md`.
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
- complete temporal consensus engine;
- markdown-backed runtime memory.

## Verification

Toolchain contract:

```sh
rtk pnpm toolchain:check
```

The repository supports the Node version in `.node-version` and exact pnpm
version in `package.json`. Local agent commands require the `rtk` proxy because
`AGENTS.md` makes it the shell boundary. CI runs the same check with the
explicit `--allow-missing-rtk` fallback because GitHub-hosted runners execute
their workflow commands through native `run:` steps; this fallback does not
change the local agent rule.

Platform contract:

- Supported: Linux and macOS with `bash`, `sh`, `dash`, or `zsh`; WSL is
  supported through its POSIX Linux environment.
- Native Windows shells are not supported. Use WSL or a POSIX host before
  running repository commands.
- Check the bootstrap boundary with `rtk pnpm platform:check`.

Fast local gate:

```sh
rtk proxy pnpm alpha:verify
```

Full local gate, when Postgres is available:

```sh
rtk proxy pnpm alpha:verify:full
```

Common focused checks:

```sh
rtk proxy pnpm typecheck
rtk proxy pnpm test
rtk proxy pnpm quality:fallow:ci
rtk proxy pnpm --filter @krn/db db:check
rtk proxy pnpm db:smoke:maintenance-queue
rtk git diff --check
```

Do not claim DB runtime truth unless the relevant DB command ran in the current
environment with `KRN_DATABASE_URL` configured or the default local compose DB
was reachable.

### Local Postgres boundary

`compose.yaml` is an internal-alpha development profile, not a production
deployment. It binds Postgres to `127.0.0.1:54329` by default; the `krn/krn`
credentials are local development credentials and are not safe for production.
Remote or container-network access requires the explicit
`KRN_POSTGRES_BIND_ADDRESS` override. The pgvector image is pinned by digest in
both Compose and CI; update that digest only after a reviewed DB gate run.
