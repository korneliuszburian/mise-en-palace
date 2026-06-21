---
name: to-kernel-prd
description: Convert a KRN product slice, reset context, or accepted architecture decision into a precise kernel PRD. Use when Codex needs to define a KRN capability before implementation, especially for context packets, memory store behavior, source graphs, policy gates, review capture, init dry-runs, doctor checks, or dogfood workflows.
---

# To Kernel PRD

Use this skill to define a KRN product slice without creating a fake MVP.

## Workflow

1. State the problem and user.
2. State non-goals.
3. Name the kernel primitive.
4. Define public interfaces or observable behavior.
5. Define data boundaries and trust boundaries.
6. Define the dogfood scenario.
7. Define acceptance evidence.
8. Define rollback or removal conditions.

## Output

- Problem.
- User.
- Non-goals.
- Primitive.
- Contracts.
- Data flow.
- Edge/failure modes.
- Dogfood scenario.
- Acceptance evidence.
- Removal condition.

## Forbidden

- Do not write a dashboard-first PRD.
- Do not define acceptance as "works".
- Do not skip source, memory, policy, or review boundaries when they affect the
  feature.
- Do not turn PRD into implementation code.

## Verification

The PRD must let another engineer implement the slice without deciding product
intent.

