---
name: codex-adapter-plan
description: Use when rendering KRN harness output into Codex-facing briefs, Goal/ExecPlan references, AGENTS pointers, skill hints, hooks, MCP references, or execution instructions with bounded context, non-goals, proof boundaries, and non-mutating adapter behavior.
---

# Codex Adapter Plan

Use this skill at the Codex boundary, not inside core domain logic.

## Trigger

- A KRN plan must become a Codex brief, skill hint, AGENTS pointer, Goal,
  ExecPlan, hook expectation, or MCP reference.
- A change risks leaking Codex-specific language into `packages/core`.

## Workflow

1. Read the harness output: task contract, context assembly, capability plan,
   Codex adapter plan reference, and evidence contract.
2. Render only bounded instructions needed by Codex to execute the next slice.
3. Include context inclusions and exclusions with reasons.
4. Include capability requirements and evidence expectations.
5. Keep adapter output plain, inspectable, and non-mutating.
6. Keep core package imports one-way: adapter may import core/harness; core must
   not import adapter.
7. If the work changes skill hints, Codex-facing execution instructions,
   `AGENTS.md` pointers, or reusable brief guidance, query the retained skill
   routing pattern first when the catalog is available:

   ```sh
   pnpm --filter @krn/cli krn brain knowledge --catalog-file docs/brain-knowledge/catalog.json --text progressive-disclosure
   ```

   Use the result as read-only context. It can guide skill routing and
   prompt-size decisions, but it does not prove automatic skill selection,
   product readiness, or that broad skill creation is useful.

## Output

- Execution brief.
- Context inclusion/exclusion section.
- Capability or skill hints.
- Evidence contract.
- Non-goals and stop conditions.
- Retained skill-routing pattern applied or explicitly rejected when the brief
  changes skill hints or reusable Codex instructions.

## Forbidden

- Do not invoke Codex from the adapter.
- Do not write files, mutate memory, or run shell commands from renderer code.
- Do not make Codex surfaces the product brain.
- Do not import `@krn/codex-adapter` from `packages/core`.

## Verification

Run typecheck/tests and search that `packages/core` has no Codex adapter imports
or Codex-specific runtime behavior.
