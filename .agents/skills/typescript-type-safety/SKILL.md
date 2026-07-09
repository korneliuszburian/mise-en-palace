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
7. If the work touches an external input boundary, query the retained knowledge
   catalog before implementation when the catalog is available:

   ```sh
   rtk proxy pnpm --filter @krn/cli krn brain recall --fixture-catalog-file tests/fixtures/brain-knowledge/corpus/catalog.json --text unknown-first
   ```

   Use the catalog result as read-only knowledge context. If the command is not
   available, record that catalog readback was not used; do not fall back to a
   markdown knowledge file as runtime authority.
8. State whether `ts-boundary-unknown-first-result-state` applies.
9. Decide whether `ts-type-critic` should review.
10. Run typecheck before completion.

## Output

- Boundary classification.
- Knowledge ID applied or rejected, when retained TypeScript knowledge is relevant.
- Validation or narrowing location.
- Public type changes.
- Any justified type-safety exception.
- Typecheck result.

## `ts-reset`

- Consider only for application packages.
- Do not use global `ts-reset` in `packages/core` or public SDK packages.
- Never use it to hide missing validation.

## Stop Condition

Stop when each external boundary is narrowed from `unknown`, public type
changes are explicit, any exception is justified, and `rtk proxy pnpm
typecheck` passes or is explicitly unavailable.

## Forbidden

- Do not weaken types to make implementation easier.
- Do not trust `JSON.parse`, `fetch().json()`, file reads, env vars, CLI args,
  MCP responses, connector responses, plugin output, or user config.
- Do not introduce unreviewed `any`.
- Do not apply retained knowledge by vibe; name the knowledge ID, consumer, and
  falsifier or explicitly reject it for the slice.
- Do not claim completion without typecheck once TypeScript exists.

## Verification

The final diff should preserve strict boundaries and include a typecheck result
or an explicit reason typecheck is unavailable.
