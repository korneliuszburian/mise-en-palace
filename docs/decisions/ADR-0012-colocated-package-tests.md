# ADR-0012: Colocated Package Tests With Runtime-Leak Enforcement

Status: accepted

Date: 2026-06-23

## Context

The current repo keeps package tests next to the code they verify:

```txt
packages/*/src/**/*.test.ts
```

QG-00 counted 56 colocated test files:

```txt
cli             6
codex-adapter   3
core            7
db             23
harness        14
schema          2
workers         1
```

This was a real source-layout ambiguity. Colocation can improve behavior
proximity, but without explicit rules it can also leak test helpers, fixtures,
or fake data into runtime APIs.

## Decision

KRN adopts colocated package tests as the default package test topology.

Rules:

- Tests may live in `packages/*/src/**/*.test.ts` or
  `packages/*/src/**/*.spec.ts`.
- Production code must not import `.test`, `.spec`, or `__tests__` modules.
- Public package barrels must not export test helpers, fixture helpers, spec
  modules, or colocated test modules.
- Production code must not import `tests/fixtures/**` or package-local
  `fixtures/**` paths as runtime truth.
- Fixtures remain test/seed material. If a runtime path needs durable truth,
  it must go through schema, DB, source, memory, or an explicit seed/import
  boundary.
- Production package `tsconfig.json` files continue to exclude tests from
  production typecheck output; Vitest owns test execution.
- Smell/bloat audit must review tests too. Colocation is not a license for
  decorative tests, fake behavior, or zombie helpers.

## Rationale

Colocation fits this repo better than a separate top-level unit-test tree
because KRN packages are small domain/runtime boundaries and most tests verify
package-local behavior. Moving all tests out would add navigation cost without
fixing the real risk.

The real risk is authority leakage:

- runtime code importing test files;
- package barrels exposing test helpers;
- fixtures becoming runtime truth;
- tests normalizing fake or placeholder concepts.

QG-01 therefore accepts colocation only together with audit enforcement.

## Enforcement

`runBoundaryAudit` now emits blocking findings for:

- production imports from colocated test files;
- public package barrels that export test helpers;
- production imports from fixture paths.

The focused audit test suite proves all three failure modes.

## Consequences

Good:

- tests stay near the behavior they protect;
- production builds remain clean;
- runtime leakage is now a blocking audit finding;
- QG-03 and QG-04 can focus on dead exports, zombie code, and test smell
  instead of first debating topology.

Tradeoff:

- audit scanning must remain aware of test and fixture boundaries;
- package index files need export-surface review because broad barrels can hide
  accidental public APIs.

## Falsifiers

Revisit this decision if:

- production imports from tests become common despite audit;
- package barrels repeatedly leak test helpers;
- Vitest/test colocation slows package work or obscures ownership;
- QG-03 proves broad barrels make colocated tests harder to police than a
  separate test tree.

