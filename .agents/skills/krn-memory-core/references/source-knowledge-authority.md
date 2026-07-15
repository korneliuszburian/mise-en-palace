# Source And Knowledge Authority

Load this branch only when a slice changes source selection or rejection,
knowledge retention/demotion/forgetting, trust filtering, eval/golden selection,
source usefulness, or authority readback.

## Decision Chain

Preserve this chain through the owning store model or decision surface:

```text
source -> mechanism -> KRN implication -> disposition
       -> owner -> consumer -> falsifier -> does_not_prove
```

The disposition is exactly one of `adopt`, `reject`, `lab-test`, or `defer`.
An adopted mechanism still needs a current consumer. A retained row is not
automatically current, trusted, selected, or useful for the next task.

Use the global `$source-to-decision` workflow when external material must be
turned into this decision. Ordinary code inspection does not become source
authority work merely because it produces evidence.

## Authority Rules

- Prefer official docs for platform mechanics and current APIs.
- Keep proprietary course text and raw corpora out of the repository.
- Store provenance near the claim it supports.
- Preserve rejected, stale, contested, and missing states as first-class
  outcomes.
- Route implementation, eval, CLI/readback, or candidate work to its existing
  owner; do not create a parallel Markdown authority.

## Stop Condition

Stop when the authority path is adopted, rejected, lab-tested, or deferred with
owner, consumer, falsifier, and non-proof, or is explicitly classified as
ordinary engineering outside this branch.
