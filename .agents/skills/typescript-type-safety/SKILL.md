---
name: typescript-type-safety
description: Enforce KRN TypeScript boundary discipline. Use for TypeScript source, tsconfig, public exported types, validators, JSON/fetch/file/env/CLI/MCP inputs, generics, casts, unknown narrowing, any usage, double assertions, ts-reset decisions, or fixes that might weaken type safety to move faster.
---

# TypeScript Type Safety

Use this skill before or during TypeScript changes.

## Trigger

- A change touches TypeScript source, tsconfig, validators, public exports,
  CLI/env/file/JSON boundaries, generics, casts, or dependency declarations.
- A shortcut would weaken strictness to move faster.

## Workflow

1. Classify the boundary: public API, external input, internal domain type,
   persistence, CLI, MCP/app connector, test fixture, or config.
2. Keep external data as `unknown` until validated.
3. Prefer explicit exported types.
4. Avoid `any`; isolate and justify it if unavoidable.
5. Avoid double assertions unless no better option exists.
6. Put runtime validation near external boundaries.
7. Decide whether `ts-type-critic` should review.
8. Run typecheck before completion.

## Output

- Boundary classification.
- Validation or narrowing location.
- Public type changes.
- Any justified type-safety exception.
- Typecheck result.

## `ts-reset`

- Consider only for application packages.
- Do not use global `ts-reset` in `packages/core` or public SDK packages.
- Never use it to hide missing validation.

## Forbidden

- Do not weaken types to make implementation easier.
- Do not trust `JSON.parse`, `fetch().json()`, file reads, env vars, CLI args,
  MCP responses, connector responses, plugin output, or user config.
- Do not introduce unreviewed `any`.
- Do not claim completion without typecheck once TypeScript exists.

## Verification

The final diff should preserve strict boundaries and include a typecheck result
or an explicit reason typecheck is unavailable.
