# Evidence And Feedback

Load this branch when execution evidence becomes reviewable, persisted feedback
or a future Memory Core candidate.

## Invariants

1. Record each command status as `passed`, `failed`, `skipped`, `missing`, or
   `not_run`, with provenance such as `operator_reported`,
   `captured_output_file`, `command_runner`, or `default_template`.
2. Separate captured evidence from interpretation and state what it does not
   prove.
3. For the same persisted run, complete `krn observe --persist` before starting
   `krn reflect --persist`.
4. If reflect selects zero observations where evidence should exist, treat the
   result as sequencing-weak until observe completion is proven.
5. Create feedback, eval, source, or memory candidates; never promote them as a
   side effect of capture or review.
6. Append run/outbox state only when persistence is configured and owned by the
   contract.

When a retained source shaped the work, load
[source-usefulness.md](source-usefulness.md).

## Proof

Evidence must expose status, provenance, remaining risk, and rollback. A
same-run loop must also prove observe-before-reflect ordering or label the
reflection non-proof explicitly.

Default templates, skipped/missing commands, reviewer prose, and candidate rows
are never strong behavioral proof by themselves.
