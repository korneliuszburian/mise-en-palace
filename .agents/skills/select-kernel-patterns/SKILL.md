---
name: select-kernel-patterns
description: Convert source mechanisms, architecture options, or recurring workflow failures into explicit KRN pattern decisions. Use when Codex evaluates whether to adopt, reject, defer, or lab-test a mechanism for the KRN kernel, especially before adding new primitives, skills, policies, evals, dashboards, subagents, hooks, MCP surfaces, or repo topology.
---

# Select Kernel Patterns

Use this skill to decide whether a mechanism should become a KRN pattern.

## Workflow

1. State the candidate mechanism in one sentence.
2. Identify the source or local evidence that produced it.
3. Map it to the Codex paradox or failure mode it addresses.
4. Classify it as `adopt_now`, `lab`, `later`, or `reject`.
5. Name the KRN primitive it would create or modify.
6. Define the implementation boundary.
7. Define the failure mode and falsifier.
8. Define the smallest dogfood task that could prove or disprove it.
9. Add an owner and removal condition.

## Output

Use this shape:

```yaml
pattern_id:
name:
source_mechanisms:
solves_paradox:
adoption_status: adopt_now | lab | later | reject
krn_primitive:
implementation_boundary:
failure_mode:
falsifier:
dogfood_task:
owner:
removal_condition:
```

## Forbidden

- Do not adopt a pattern because it sounds impressive.
- Do not copy source architecture without KRN implication.
- Do not add dashboard, benchmark, MCP, plugin, or subagent surfaces before the
  kernel primitive exists.
- Do not keep decorative sources without decisions or rejections.

## Verification

Check that the decision reduces context waste, stale memory harm, unsupported
decisions, review burden, diff risk, or repeated failures.

