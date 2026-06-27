# TypeScript Boundary Standard

For the active repo-wide quality gate, use this file together with
`docs/standards/code-vocabulary.md` and
`docs/standards/typescript-excellence.md`. General coding standards live in
`docs/standards/code-quality.md`.

KRN is TypeScript-first, but TypeScript code starts only after Commit 0/1.

## Doctrine

- Use strict mode.
- Preserve type boundaries.
- Keep external data as `unknown` until validated.
- Avoid `any` unless isolated and justified.
- Avoid double assertions unless no better option exists and risk is documented.
- Keep public APIs explicit.
- Run typecheck before claiming completion.
- Keep runtime validation near external boundaries.

## External Data

Treat these as untrusted:

- `JSON.parse`;
- `fetch().json()`;
- file reads;
- env vars;
- CLI args;
- MCP responses;
- app/connector responses;
- plugin output;
- user-provided config.

Pipeline:

```text
unknown input -> schema/validator/parser -> domain type -> business logic
```

## Pattern Intake Decision

Source packet:

- `docs/KRN_SOURCES.md#designing-your-types`
- `docs/KRN_SOURCES.md#unions-literals-and-narrowing`
- `docs/KRN_SOURCES.md#ts-reset`

Surface: TypeScript boundaries.

Mechanism:

- Type design communicates authority and domain lifecycle, not only compiler
  satisfaction.
- Literal unions and narrowing make finite external states visible.
- `ts-reset` demonstrates why unsafe platform defaults should be treated as
  unknown-first, but global type changes are application-scoped.

KRN implication:

- External input boundaries must parse or narrow before domain use.
- Status/provenance values crossing IO boundaries should use narrow unions when
  the accepted values are finite.
- Global `ts-reset` remains rejected for `packages/core`, `packages/schema`, and
  public APIs unless a future ADR proves the boundary is application-only.

Decision: adopt for external TypeScript boundary work.

Consumer: this standard.

Falsifier:

- A future TypeScript slice trusts `JSON.parse`, env, CLI, MCP, app/connector, or
  plugin data before validation.
- A future `ts-reset` decision is made without package-boundary classification.
- A repeated external status/provenance field uses broad strings where finite
  values govern behavior.

Does not prove:

- current source has TypeScript drift;
- broad type rewrites are useful;
- every object needs a discriminant;
- paid/proprietary course material should be copied into KRN.

## `ts-reset` Policy

- `packages/cli`: candidate after explicit decision.
- `packages/core`: avoid global `ts-reset` if public/library API.
- `packages/sdk`: avoid.
- Tests: case-by-case.

The spirit of `ts-reset` applies everywhere: do not trust external data until
validated.

## Critic Gate

Use `ts-type-critic` for TypeScript source, tsconfig, public types, validation,
JSON/fetch/env/CLI input, generics, casts, `any`, `unknown`, or type weakening.
