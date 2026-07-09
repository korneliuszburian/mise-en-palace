# Evidence Review

Use this reference after or around execution, when proof must become reviewable
state without mutating memory automatically.

## Procedure

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
7. For same-run persisted loops, run `krn observe --persist` to completion
   before `krn reflect --persist`. Do not start observe and reflect in parallel
   for the same run.
8. If run-scoped reflect selects `0` observations when the run should have
   persisted evidence, treat it as a sequencing failure until observe
   completion is verified. Do not use that result as reflection-quality
   evidence.
9. Create feedback candidates; do not apply them automatically.
10. Append run/outbox evidence only when persistence is configured.

## Output

- Evidence summary.
- Command proof with provenance and what it does not prove.
- Diff risk.
- Review burden.
- Rollback path.
- Feedback candidates.
- Source usefulness outcomes when source/knowledge input shaped the run.
- Observe-before-reflect sequencing status for persisted same-run loops.
- Persistence status.

## Verification

Evidence must let a reviewer see what changed, what was actually run, what risk
remains, and how to roll back.

For persisted same-run loops, evidence must also show that observe completed
before reflect, or explicitly mark reflection output as sequencing-weak.

## Forbidden

- Do not claim skipped commands passed.
- Do not treat default_template, skipped, missing, or not_run command rows as
  strong verification proof.
- Do not mutate Memory Core without explicit acceptance.
- Do not invent execution runs when DB/run IDs are absent.
- Do not promote eval/source/memory candidates as a side effect of capture.
- Do not run same-run `krn observe --persist` and `krn reflect --persist` in
  parallel.
