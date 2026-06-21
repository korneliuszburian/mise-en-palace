# TypeScript Boundary Standard

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

