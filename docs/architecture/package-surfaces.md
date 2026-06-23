# KRN Package Surfaces

Status: C1-01 partially enforced for DB and CLI root surfaces.
Date: 2026-06-23

This document records package barrel findings for P1-02 and the C1 package
surface enforcement queue. DB and CLI root surfaces now have source-level
enforcement; harness and repository-port narrowing remain follow-up work.

## Source Decision

source: `docs/reviews/repo-reset-audit/FULL_REPO_AUDIT.md`
mechanism: broad package barrels make smokes, repository adapters, schema
tables, and command implementations look like stable product APIs.
KRN implication: package entrypoints carry authority. Defaults should expose
contracts and product workflow adapters, not every internal mechanism.
decision: adopt a narrowing plan before source changes.
rejection: do not add compatibility layers for imaginary external consumers.
falsifier: root package barrels keep exporting internal smokes, concrete
repositories, schema tables, and command implementation modules as the easy
default import path.

## Evidence

Inspected files:

- `packages/db/src/index.ts`
- `packages/db/package.json`
- `packages/db/src/dev/index.ts`
- `packages/db/src/repositories/index.ts`
- `packages/db/src/schema/index.ts`
- `packages/harness/src/index.ts`
- `packages/harness/src/repositories/index.ts`
- `packages/cli/src/index.ts`

Verification inventory:

```sh
rg -n "export \\*" packages/*/src/index.ts packages/*/src/**/index.ts
```

## Target Shape

Root package entrypoints should answer: "What is stable for another package to
depend on?"

Internal adapters, smokes, readiness probes, concrete repositories, schema
table modules, and command implementation files should be imported through
explicit internal paths only when a package owns that boundary.

Do not use root barrels to make internals convenient.

## Package Findings

### `packages/db`

Current root exports after C1-01:

- database connection helpers;
- `KrnDatabase` type and `createKrnDatabase`.

Explicit subpaths after C1-01:

- `@krn/db/adapters` for concrete Drizzle repository adapters;
- `@krn/db/dev` for readiness and smoke modules;
- `@krn/db/schema` for schema-table access.

Risk:

- DB smokes/readiness look like product API.
- Concrete repository adapters look like the public persistence contract.
- Schema table modules are exposed as the package default surface.

C1-01 decision:

- keep a small root surface for database connection helpers only;
- move smokes/readiness behind `@krn/db/dev`;
- move concrete Drizzle repositories behind `@krn/db/adapters`;
- keep schema table access explicit through `@krn/db/schema`.

Does not prove:

- DB runtime behavior;
- that concrete adapters are the right long-term public integration contract;
- repository-port authority split, which remains a later slice.

### `packages/db/src/repositories/index.ts`

Current exports:

- all concrete `Drizzle*Repository` adapters;
- `workerJobTypes`.

Risk:

- concrete adapters are easier to import than harness repository ports.
- Memory Core write bypasses remain easy to reach from package consumers.

Planned narrowing:

- keep concrete repository constructors internal to DB wiring.
- expose public persistence through harness/core ports or explicit factories
  only after Memory Core write authority is sealed.

### `packages/db/src/schema/index.ts`

Current exports:

- all schema table modules.

Risk:

- table modules become a casual integration API.
- behavior code can bypass repository/validation boundaries.

Planned narrowing:

- keep schema exports available for migrations/tests/DB internals only.
- avoid importing schema root from harness/core/cli behavior code.

### `packages/harness`

Current root exports:

- audit checks;
- activation;
- observation input/prefix helpers;
- compiler helpers;
- Promptfoo result/export helpers and golden runner;
- memory review gate;
- reflection input selector;
- repository port index.

Risk:

- audit helpers look like harness product API.
- Promptfoo adapter helpers sit beside canonical golden behavior primitives.
- repository ports are exported as a broad package surface.

Planned narrowing:

- root should prefer task planning, context assembly, execution/evidence, and
  reviewed feedback/memory promotion contracts.
- audit remains internal/dev, not root product API.
- Promptfoo remains eval-adapter surface, not canonical behavior authority.
- repository ports should be named by stable use-case boundaries, not dumped
  through a broad wildcard.

### `packages/harness/src/repositories/index.ts`

Current exports:

- event ledger, harness run, memory, outbox, project, retrieval, and source
  repository ports plus shared types.

Risk:

- all repository ports are equally public even when they support internal
  plumbing.
- memory write authority is not visually separated from reviewed promotion.

Planned narrowing:

- split public ports from internal persistence plumbing.
- coordinate with P2-00 so candidate-to-MemoryRecord promotion is exposed only
  through reviewed authority.

### `packages/cli`

Current root exports after C1-01:

- `runCli`;
- `CliRuntime`;
- `CliResult`.

Risk:

- command implementation modules look like embeddable product APIs.
- DB smokes are exported from CLI root even though they are internal/dev.
- CLI root omits some governed admin commands while exporting selected command
  runners, so the surface is accidental rather than designed.

C1-01 decision:

- keep `runCli` and explicitly stable CLI input/output types public.
- move command implementation runners behind internal paths.
- do not expose DB smoke runners as public product API.
- do not expose parser internals as root package API until they are accepted as
  stable adapter contracts.

## Not In First Narrowing Slice

The `rg` inventory also shows wildcard exports in `packages/core`,
`packages/schema`, `packages/codex-adapter`, `packages/workers`, and nested
domain indexes. P1-02 does not decide those. Later slices may inspect them if
they start leaking internals as product authority.

## Ordered Repair Slices

1. DB root: complete in C1-01. Root is database-only; smokes, adapters, and
   schema moved behind explicit subpaths.
2. CLI root: complete in C1-01. Root exports `runCli`, `CliRuntime`, and
   `CliResult` only.
3. Harness root: remove audit from root surface and separate canonical golden
   behavior from Promptfoo adapter helpers.
4. Repository ports: after P2-00, split public reviewed memory write authority
   from internal persistence ports.

Each code slice must run:

```sh
pnpm typecheck
pnpm test
git diff --check
```

DB runtime truth remains unclaimed unless DB commands are run in that shell.
