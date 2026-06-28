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

## Finite-State Exhaustiveness

When a finite union changes behavior, rendering, persistence mapping, review
meaning, or operator output, the handling boundary should narrow the union
explicitly and make missed states visible to TypeScript.

This applies especially to:

- status and lifecycle fields;
- provenance and authority fields;
- candidate/reviewability labels;
- project, source, memory, evidence, and activation readback kinds;
- metadata fields promoted into public or operator-facing resources.

Preferred shape:

```txt
unknown metadata -> parser/type guard -> named union/domain type -> exhaustive
rendering or mapping boundary
```

Do not leave repeated behavior-governing values as ad hoc string checks in
renderers or repository mappers. If a new union member should require a product
decision, the compiler should force the owning boundary to handle it.

Source decision:

```txt
source: docs/KRN_SOURCES.md#typescript-narrowing-and-exhaustiveness
mechanism: TypeScript narrowing and `never` exhaustiveness make finite union
states explicit where behavior changes.
consumer: this standard and future bounded TypeScript repair slices.
falsifier: a behavior-relevant union member can be added while rendering,
persistence mapping, or review logic keeps compiling without handling it.
does_not_prove: every union needs a switch or broad type rewrites are valuable.
```

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

## Boundary Verification

Do not rely on a broad audit subsystem as the source of truth for TypeScript
quality. Current enforcement is intentionally smaller and evidence-based:

- `pnpm typecheck` for compiler-level strictness;
- targeted `rg` scans for unchecked `any`, unchecked `JSON.parse`, double
  assertions, `@ts-ignore`, and undocumented `@ts-expect-error`;
- schema/parser tests for external input boundaries;
- golden behavior tests for typed boundary expectations;
- `ts-type-critic` as a read-only/proposal-only review aid when a slice touches
  TypeScript source, public types, validators, or CLI/file/env input.

If a repeated type-safety drift pattern appears, add a bounded test, parser, or
standard update. Do not reintroduce a broad `krn audit` or semantic quality
engine to compensate for unclear ownership.
