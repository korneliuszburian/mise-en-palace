---
name: codex-adapter-plan
description: Use when rendering KRN DecisionPacket or harness output into Codex-facing execution briefs with bounded context, evidence expectations, proof boundaries, and non-mutating adapter behavior.
---

# Codex Adapter Plan

Use this skill at the Codex brief boundary, not inside core domain logic.

## Trigger

- A KRN `DecisionPacket`, harness plan, or task contract must become a Codex
  execution brief.
- A change risks leaking Codex-specific language into `packages/core`.
- A brief change risks treating skills, hooks, MCP, or adapter metadata as the
  product brain instead of tooling around the `DecisionPacket`.

## Workflow

1. Read the bounded input: task contract, context assembly, selected knowledge,
   source support, rejected/stale paths, capability requirements, and evidence
   expectations.
2. Render only bounded instructions needed by Codex to execute the next slice.
3. Include inclusions, exclusions, rejected paths, and non-proof boundaries.
4. Keep adapter output plain, inspectable, and non-mutating.
5. If a proposed section has no current consumer in the brief contract, reject
   it or file a Beads task instead of adding reserved adapter surface.
6. Keep core package imports one-way: adapter may import core/harness; core must
   not import adapter.

## Output

- Execution brief.
- DecisionPacket context inclusion/exclusion section.
- Current knowledge/source support, stale boundaries, and rejected paths.
- Evidence contract.
- Non-goals and stop conditions.
- Proof and non-proof boundary.

## Stop Condition

Stop when the rendered brief is bounded, inspectable, non-mutating, has explicit
proof/non-proof boundaries, and no Codex-specific product authority leaked into
core packages.

## Forbidden

- Do not invoke Codex from the adapter.
- Do not write files, mutate memory, or run shell commands from renderer code.
- Do not make Codex surfaces the product brain.
- Do not render skill, hook, MCP, Goal, or ExecPlan metadata unless a current
  runtime contract consumes it.
- Do not import `@krn/codex-adapter` from `packages/core`.

## Verification

Run typecheck/tests, verify the changed brief output, and search that
`packages/core` has no Codex adapter imports or Codex-specific runtime behavior.
