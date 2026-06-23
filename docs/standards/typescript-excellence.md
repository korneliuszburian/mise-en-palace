# KRN TypeScript Excellence Standard

Status: active

Date: 2026-06-23

This standard is the QG-02 consolidation layer for TypeScript quality. It does
not replace `docs/standards/typescript-boundaries.md` or
`docs/standards/code-vocabulary.md`; it turns them into one merge gate. General
coding, naming, file responsibility, and monolith-boundary rules live in
`docs/standards/code-quality.md`.

## Doctrine

KRN TypeScript should make wrong authority hard to express.

- Domain types come first.
- External data is `unknown` until validated.
- Public surfaces use explicit exported types.
- State-dependent shapes use narrow unions or discriminated unions.
- Runtime authority is visible in the package boundary and in the function
  verb.
- Type weakening is not an implementation strategy.

This is the repo's practical interpretation of Matt Pocock-style discipline:
clear domain vocabulary, strong inference where it helps, explicit boundaries
where it matters, and no cleverness that hides runtime truth.

## Required Compiler Baseline

The root `tsconfig.base.json` must keep:

```txt
strict
exactOptionalPropertyTypes
noUncheckedIndexedAccess
noUnusedLocals
noUnusedParameters
isolatedModules
verbatimModuleSyntax
noImplicitReturns
noImplicitOverride
noFallthroughCasesInSwitch
```

Package configs may narrow runtime libraries or add Node types, but they must
not weaken the base strictness to make a slice pass.

## Public Type Rules

Use:

- named exported interfaces/types at package boundaries;
- narrow literal unions for domain vocabularies;
- discriminated unions when `kind`, `status`, or `subjectType` changes valid
  fields;
- `as const` and `satisfies` for checked literals and fixtures;
- schema-owned parsing for file/env/CLI/JSON input;
- local type guards for unavoidable unknown narrowing.

Avoid:

- anonymous object soup at public boundaries;
- unbounded generics that only make call sites harder to read;
- broad metadata fields for facts that govern behavior;
- `Record<string, unknown>` as a hiding place for repeated product fields;
- type casts that paper over a missing parser or model.

`Record<string, unknown>` remains allowed for explicit metadata, JSON payload,
and persistence-boundary fields. QG-03/QG-04 must identify repeated metadata
keys that deserve promotion into typed fields.

## Hard Bans

Production code must not contain:

- unchecked `any`;
- double assertions such as `value as unknown as Type`;
- `@ts-ignore`;
- undocumented `@ts-expect-error`;
- unchecked `JSON.parse`;
- global `ts-reset` in `packages/core`, `packages/schema`, or public package
  APIs.

`@ts-expect-error` is only acceptable when the line itself explains the
expected compiler failure. It is normally a test-only tool.

## Package Rules

`packages/core`:

- pure domain contracts and pure helpers only;
- no DB, CLI, filesystem, process, network, Zod, Drizzle, or runtime adapter
  authority;
- no global `ts-reset`;
- no `any`.

`packages/schema`:

- owns external IO validation;
- returns typed values after parsing unknown input;
- must not import DB/Drizzle adapters.

`packages/db`:

- owns Drizzle schema, migrations, repository adapters, JSON mapping, and
  persistence invariants;
- JSON values crossing repository boundaries need explicit mapping helpers.

`packages/harness`:

- owns selection, activation, audit, review gates, and orchestration logic;
- should stay pure unless a repository port makes runtime access explicit.

`packages/cli`:

- owns env, filesystem, command args, and terminal IO;
- must parse external values before passing them into core/harness/db logic.

`packages/codex-adapter`:

- renders Codex-facing artifacts;
- does not own domain truth.

`packages/workers`:

- owns bounded job contracts/skeletons only until execution slices explicitly
  accept runtime worker behavior.

## Audit Enforcement

`runTypeSafetyAudit` now reports:

- unchecked `any` usage;
- unchecked `JSON.parse`;
- double assertion shortcuts;
- `@ts-ignore`;
- undocumented `@ts-expect-error`.

QG-03 and QG-04 must extend the quality surface for dead exports, zombie code,
smell/bloat, and over-broad metadata once tooling is selected.
