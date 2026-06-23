# KRN Package Boundaries

This document defines the first implementation spine. It prevents the CLI,
database, or Codex adapter from becoming the architecture.

## Import Direction

```text
core
schema -> core types where useful
db -> core, schema
harness -> core, schema
codex-adapter -> core, harness
workers -> core, schema, db
cli -> schema, harness, codex-adapter, db
```

Reverse imports are forbidden. `packages/core` must remain pure and
Codex-agnostic.

## Packages

### `packages/core`

Owns pure domain types, value objects, pure use cases, policy result shapes, and
port interfaces when those interfaces are IO-free abstractions.

Must not import database code, CLI code, filesystem code, shell/process/env
code, network code, Codex-specific code, Drizzle, Zod, or test/runtime adapters.

### `packages/schema`

Owns Zod schemas and parse functions for external IO/API/CLI boundaries.
Public parse functions accept `unknown` and return typed values only after
validation.

Must not import database code, CLI code, Codex adapter code, or filesystem
runtime helpers.

### `packages/db`

Owns Drizzle schema, migrations, SQL helpers, database connection adapters, and
repository implementations backed by PostgreSQL plus pgvector.

May map between database rows and domain types. Must not contain CLI command
behavior, activation ranking logic, Codex rendering, dashboard code, or hidden
in-memory memory architecture.

### `packages/harness`

Owns activation, context assembly, capability planning, evidence contracts, and
the compiler that turns an operator intent into a harness plan.

Must not invoke Codex, spawn agents, mutate memory automatically, render
Codex-specific files, create `.krn` truth, or directly own database schema.

### `packages/codex-adapter`

Owns rendering to Codex-native surfaces: execution briefs, Goal/ExecPlan
references, skill hints, hook expectations, and MCP reference hints when those
surfaces exist.

Must not be imported by `packages/core`. Must not call Codex, mutate memory, or
implement an MCP server.

### `packages/cli`

Owns terminal commands and user-facing output. It validates CLI input through
`packages/schema`, calls harness services, and renders bounded output.

Must not become the product architecture, bypass schema validation, or create
runtime markdown memory.

### `packages/workers`

Owns typed worker job definitions and enqueue contracts for future maintenance
work such as embedding source chunks, compacting memory, detecting
contradictions, expiring stale memory, and promoting eval candidates.

Current worker truth is contract/skeleton only: no daemon, no job executor, no
background maintenance runtime. Future runtime work must use the Postgres
outbox and worker-job tables. It must not introduce Redis, Kafka, or unbounded
background loops in the first spine.

## Later Packages

`packages/api` and `packages/dashboard` are later read-model consumers. Do not
create them until the CLI and brain-store behavior exist and the living plan is
explicitly revised.

## Boundary Checks

- `packages/core` has no Codex adapter imports.
- `packages/core` has no database, CLI, filesystem, process, env, or network
  imports.
- Core task contracts do not contain Codex skill names or `requiredSkills`.
- External data stays `unknown` until parsed by schema code.
- Markdown files and `.krn/**` do not become runtime memory or product truth.
- Dashboard, API, MCP server, broad eval lane, and broad subagent system remain
  absent from the first implementation spine.
