---
name: to-issues
description: Split an accepted KRN PRD, ADR, or continuous goal into implementation-ready issue contracts. Use after product intent is stable and before coding, especially when a KRN slice must preserve non-goals, evidence requirements, stop conditions, rollback paths, and review boundaries.
---

# To Issues

Use this skill to convert a decision-complete plan into issue-sized execution
contracts.

## Workflow

1. Identify the accepted source: PRD, ADR, or goal.
2. Split by behavioral contract, not by arbitrary files.
3. For each issue, state objective, non-goals, likely touched surfaces, expected
   evidence, stop condition, and rollback path.
4. Keep dependencies explicit.
5. Keep each issue small enough for review.

## Output

```yaml
title:
objective:
non_goals:
likely_surfaces:
expected_evidence:
stop_condition:
rollback_path:
depends_on:
```

## Forbidden

- Do not create broad issues without verification.
- Do not convert future/lab ideas into current work.
- Do not skip kernel primitives to chase UI, benchmark, or automation surfaces.
- Do not make issues that require rediscovering product intent.

## Verification

Each issue should have one clear acceptance path and a bounded diff.

