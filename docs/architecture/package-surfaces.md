# KRN Package Surfaces

Status: narrowing plan, no source export changes yet.
Date: 2026-06-23

This document records package barrel findings for P1-02. It plans which public
entrypoints should stay stable and which exports should become internal or
explicitly dev-only in later code slices.

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

Current root exports:

- database connection helpers;
- readiness and smoke modules;
- audit semantic snapshot helpers;
- every concrete Drizzle repository through `repositories/index.js`;
- every schema table module through `schema/index.js`.

Risk:

- DB smokes/readiness look like product API.
- Concrete repository adapters look like the public persistence contract.
- Schema table modules are exposed as the package default surface.

Planned narrowing:

- keep a small root surface for database connection and intentionally public DB
  runtime factory helpers;
- move smokes/readiness behind explicit dev/runtime paths;
- move concrete Drizzle repositories behind explicit adapter paths;
- keep schema table access explicit and internal-to-DB unless a migration or
  repository boundary needs it.

Later code slice candidate:

- replace root wildcard exports with named exports.
- add `packages/db/src/dev/index.ts` or direct internal imports for smokes only
  if current imports need a stable target.

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

Current root exports:

- parser union and parser;
- command runners for DB readiness/smoke, Codex brief, doctor, evidence,
  observe, init, plan, source claim add/reject/link;
- top-level `runCli`.

Risk:

- command implementation modules look like embeddable product APIs.
- DB smokes are exported from CLI root even though they are internal/dev.
- CLI root omits some governed admin commands while exporting selected command
  runners, so the surface is accidental rather than designed.

Planned narrowing:

- keep `runCli` and explicitly stable CLI input/output types public.
- keep parser types only if they are a stable adapter contract.
- move command implementation runners behind internal paths.
- never expose DB smoke runners as public product API.

## Not In First Narrowing Slice

The `rg` inventory also shows wildcard exports in `packages/core`,
`packages/schema`, `packages/codex-adapter`, `packages/workers`, and nested
domain indexes. P1-02 does not decide those. Later slices may inspect them if
they start leaking internals as product authority.

## Ordered Repair Slices

1. DB root: replace wildcard root exports with named stable exports; move smokes
   and concrete adapters out of the default surface.
2. Harness root: remove audit from root surface and separate canonical golden
   behavior from Promptfoo adapter helpers.
3. CLI root: expose `runCli` and stable adapter types only; move command
   runners and DB smoke runners to internal imports.
4. Repository ports: after P2-00, split public reviewed memory write authority
   from internal persistence ports.

Each code slice must run:

```sh
pnpm typecheck
pnpm test
git diff --check
```

DB runtime truth remains unclaimed unless DB commands are run in that shell.
