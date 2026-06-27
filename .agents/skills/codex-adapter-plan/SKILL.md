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

## Output

- Execution brief.
- Context inclusion/exclusion section.
- Capability or skill hints.
- Evidence contract.
- Non-goals and stop conditions.

## Forbidden

- Do not invoke Codex from the adapter.
- Do not write files, mutate memory, or run shell commands from renderer code.
- Do not make Codex surfaces the product brain.
- Do not import `@krn/codex-adapter` from `packages/core`.

## Verification

Run typecheck/tests and search that `packages/core` has no Codex adapter imports
or Codex-specific runtime behavior.
