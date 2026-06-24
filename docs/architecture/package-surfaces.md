# KRN Package Surfaces

Status: C1-03 enforced for DB, CLI, harness, and repository package surfaces.
Date: 2026-06-24

This document records package barrel findings for P1-02 and the C1 package
surface enforcement queue. DB and CLI root surfaces now have source-level
enforcement. Harness root now has source-level enforcement. Repository-port
public/internal classification now has source-level enforcement.

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

Current root exports after C1-02:

- activation;
- observation input/prefix helpers;
- compiler helpers;
- canonical golden runner/proof helpers;
- memory review gate;
- reflection input selector.

Explicit subpaths after C1-02:

- `@krn/harness/eval` for Promptfoo adapter export/result helpers;
- `@krn/harness/repositories` for repository ports and persistence-facing
  record/input types.

Risk:

- Promptfoo adapter helpers sit beside canonical golden behavior primitives.
- repository ports are exported as a broad package surface.

C1-02 decision:

- root should prefer task planning, context assembly, execution/evidence, and
  reviewed feedback/memory promotion contracts.
- Promptfoo remains eval-adapter surface under `@krn/harness/eval`, not
  canonical behavior authority.
- repository ports move out of the root package surface to
  `@krn/harness/repositories`.
- root continues to expose canonical GoldenTask behavior proof helpers and
  MemoryReviewGate.

Does not prove:

- repository-port public/internal split;
- that Promptfoo behavior is part of canonical KRN proof;
- broad Memory Brain readiness.

### `packages/harness/src/repositories/index.ts`

Current public exports after C1-03:

- harness run repository port and run/evidence input types;
- reviewed/source-grounded source repository port and source input types;
- reviewed memory candidate/review interfaces:
  `MemoryActivationRepository` and `MemoryCandidateReviewRepository`;
- reviewed anti-memory candidate/review interfaces are included in
  `MemoryCandidateReviewRepository`, while raw anti-memory record creation stays
  internal;
- project/source/run record types needed by public operator flows.

Internal subpath after C1-03:

- `@krn/harness/repositories/internal` exports full repository plumbing:
  event ledger, raw memory persistence, outbox, project, retrieval, source, and
  shared record/input types.

Risk:

- all repository ports are equally public even when they support internal
  plumbing.
- memory write authority is not visually separated from reviewed promotion.

C1-03 decision:

- public repository surface does not export `MemoryRepository`,
  `CreateMemoryRecordInput`, or `CreateAntiMemoryRecordInput`;
- public memory authority is named around activation and reviewed candidate
  promotion;
- raw Memory Core writes remain available only through
  `@krn/harness/repositories/internal` for DB adapters and existing runtime
  internals;
- C2-00 replaces direct public anti-memory writes with reviewed candidate
  storage and promotion before adding more anti-memory behavior.

Does not prove:

- worker runtime authority;
- DB adapter methods are inaccessible to internal packages.

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

## COND-03 Remaining Barrel Decision

COND-03 inspected the remaining wildcard package roots and nested domain
barrels:

```sh
rg -n "export \\*" packages/core/src/index.ts packages/core/src/observations/index.ts packages/schema/src/index.ts packages/codex-adapter/src/index.ts packages/workers/src/index.ts
rg -n "schemaPrimitives" packages/schema/src/index.ts packages/schema/src/*.ts
rg -n "requiresBackgroundLoop|daemon|background|runtime|enqueue" packages/workers/src/*.ts packages/workers/README.md docs/decisions/ADR-0015-worker-runtime-boundary.md
```

The decision is to keep these barrels for now. This is not aesthetic approval
of wildcard exports. It is a source-backed classification that the current
remaining barrels expose stable contracts and do not currently leak the
internal/dev surfaces that C1 removed from DB, CLI, harness, and repository
roots.

source_id: `packages/core/src/index.ts`,
`packages/core/src/observations/index.ts`
trust_tier: high live source.
mechanism: the root exports core domain contracts for capability planning,
activation, context assembly, evidence, execution runs, feedback, golden tasks,
memory, policy, review, source, task contracts, IDs, and time; the nested
observations barrel exports observation domain contracts, policy, and
validation.
KRN implication: core is the domain contract package, so a broad root is
acceptable while it stays contract-only.
decision: keep the current core root and observations barrel.
does_not_prove: every exported core type is perfectly modeled or that future
internal helpers cannot drift into the root.
consumer: package surface contract.
falsifier: the root or nested observation barrel exports tests, fixtures,
adapters, smokes, command runners, or implementation helpers that are not core
domain contracts.

source_id: `packages/schema/src/index.ts`,
`packages/schema/src/schemaPrimitives.ts`
trust_tier: high live source.
mechanism: schema root exports public Zod IO parser modules, while shared
`schemaPrimitives.ts` is imported by schema modules and tests but not exported
from the package root.
KRN implication: schema entrypoint can remain a parser-surface barrel if
primitive construction details stay internal.
decision: keep the current schema root; do not export schema primitives as
public API.
does_not_prove: every parser is complete or every JSON/file/CLI boundary is
fully hardened.
consumer: schema package surface.
falsifier: `schemaPrimitives`, test fixtures, or boundary-bypass helpers become
root exports.

source_id: `packages/codex-adapter/src/index.ts`
trust_tier: high live source.
mechanism: codex-adapter root exports Codex-facing contracts and renderers for
goal references, execution briefs, hook expectations, skill hints, and exec
plan references.
KRN implication: adapter root can expose rendering contracts because it is the
boundary that turns typed KRN state into Codex-facing instructions.
decision: keep the current codex-adapter root.
does_not_prove: rendered briefs are sufficient for all Codex workflows or that
Codex execution quality is proven.
consumer: Codex adapter public surface.
falsifier: root exports execution mutators, tool runners, local agent runtime,
or internal helper modules that bypass the typed harness/core contracts.

source_id: `packages/workers/src/index.ts`,
`docs/decisions/ADR-0015-worker-runtime-boundary.md`,
`packages/workers/README.md`
trust_tier: high live source and accepted ADR.
mechanism: workers root exports typed job descriptions and enqueue contracts;
ADR-0015 and the package README state there is no worker daemon, background
loop, job executor, or autonomous maintenance runtime, and job descriptions use
`requiresBackgroundLoop: false`.
KRN implication: the worker package is a contract surface, not a runtime claim.
decision: keep `enqueueMaintenanceJob` and `jobTypes` in the workers root for
now, with the ADR/README as the authority boundary.
does_not_prove: job execution, throughput, background processing, production
maintenance, or Memory Core mutation exists.
consumer: worker package contract and ADR-0015.
falsifier: workers root exports a daemon, poller, executor, scheduler,
background loop, or Memory Core mutator before a future runtime ADR accepts it.

## Ordered Repair Slices

1. DB root: complete in C1-01. Root is database-only; smokes, adapters, and
   schema moved behind explicit subpaths.
2. CLI root: complete in C1-01. Root exports `runCli`, `CliRuntime`, and
   `CliResult` only.
3. Harness root: complete in C1-02. Root keeps canonical harness behavior;
   Promptfoo helpers move to `@krn/harness/eval`; repository ports move to
   `@krn/harness/repositories`.
4. Repository ports: complete in C1-03. Public repository surface is curated;
   full persistence plumbing moved to `@krn/harness/repositories/internal`.
5. Remaining core/schema/codex-adapter/workers barrels: complete in COND-03.
   Current barrels stay because they expose stable domain/schema/adapter/
   worker-contract surfaces; falsifiers above define when to reopen the slice.

Each code slice must run:

```sh
pnpm typecheck
pnpm test
git diff --check
```

DB runtime truth remains unclaimed unless DB commands are run in that shell.
