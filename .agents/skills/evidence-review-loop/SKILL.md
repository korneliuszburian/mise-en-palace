---
name: evidence-review-loop
description: Use when capturing KRN execution evidence with command provenance, proof/non-proof boundaries, review risk, feedback deltas, or memory/source/skill/policy/eval candidates after a run.
---

# Evidence Review Loop

Use this skill after or around execution, when proof must become reviewable
state without mutating memory automatically.

## Trigger

- Capturing changed files, command results, typecheck/test status, diff risk,
  review burden, rollback path, or feedback candidates.
- Turning review findings into memory/source/skill/policy/eval candidates.

## Workflow

1. Record changed files and scope.
2. Record each command with status and provenance; distinguish statuses
   `passed`, `failed`, `skipped`, `missing`, and `not_run`, plus provenance
   `operator_reported`, `captured_output_file`, `command_runner`, and
   `default_template`.
3. State diff risk and review burden.
4. State rollback path.
5. Separate hard evidence from interpretation.
6. If a source, course, paper, docs page, or local evidence shaped the work,
   record source usefulness with `--source-usefulness` or state why it was not
   measured.
7. Create feedback candidates; do not apply them automatically.
8. Append run/outbox evidence only when persistence is configured.

## Output

- Evidence summary.
- Command proof with provenance and what it does not prove.
- Diff risk.
- Review burden.
- Rollback path.
- Feedback candidates.
- Source usefulness outcomes when source/pattern input shaped the run.
- Persistence status.

## Forbidden

- Do not claim skipped commands passed.
- Do not treat default_template, skipped, missing, or not_run command rows
  as strong verification proof.
- Do not mutate Memory Core without explicit acceptance.
- Do not invent execution runs when DB/run IDs are absent.
- Do not promote eval/source/memory candidates as a side effect of capture.

## Verification

Evidence must let a reviewer see what changed, what was actually run, what risk
remains, and how to roll back.
