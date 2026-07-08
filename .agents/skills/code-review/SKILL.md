---
name: code-review
description: Use when reviewing KRN diffs, PRs, large local changes, migration slices, cleanup slices, or architecture/naming changes for bugs, spec drift, roadmap drift, test theater, speculative generality, shallow modules, and Fowler-style code smells.
---

# Code Review

Review the diff against a fixed point, usually the merge base with `origin/main`.

## First

1. Resolve the fixed point with `git rev-parse`.
2. Inspect `git diff <fixed-point>...HEAD` and relevant commits.
3. Find the Beads issue, `AGENTS.md`, `KRN_ROADMAP.md`, and relevant skills.
4. Do not read historical docs unless a current authority surface references
   them for the reviewed slice.

## Axes

Keep findings separated:

- Standards: repo rules, Roadmap, skills, TypeScript/store boundaries, tests,
  naming, and proof/non-proof boundaries.
- Spec: Beads acceptance criteria, user request, and intended product behavior.

## Smell Baseline

Flag these as judgment calls unless a repo rule makes them hard blockers:

- Mysterious Name
- Duplicated Code
- Feature Envy
- Data Clumps
- Primitive Obsession
- Repeated Switches
- Shotgun Surgery
- Divergent Change
- Speculative Generality
- Message Chains
- Middle Man
- Refused Bequest
- Test Theater
- Prompt/Context Bloat
- Markdown Authority Drift

## Review Rules

- Findings first, severity ordered, with file:line refs.
- Each finding needs evidence and a minimal fix.
- Do not praise green tests as proof of product readiness.
- Reject reviewer claims contradicted by current code or verification output.
- If no issue is found, say so and name residual test or proof gaps.

## Output

- Standards:
- Spec:
- Verification:
- Follow-up Beads:
