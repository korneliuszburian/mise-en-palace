# V207 Best-Pattern Intake Applied Proof

Status: complete.

Date: 2026-06-28.

## Executive Verdict

The best-pattern lane is useful only when it selects a concrete local consumer.
For this run, the retained Total TypeScript mechanism maps to one bounded KRN
repair candidate: `krn run show` should preserve candidate reviewability
metadata for non-memory candidates in readback output.

Decision:

```txt
lab-test as bounded repair
do not broaden into TypeScript cleanup
do not index courses or papers
```

## Source Intake

Source:

```txt
docs/KRN_SOURCES.md#designing-your-types
docs/KRN_SOURCES.md#unions-literals-and-narrowing
docs/standards/typescript-excellence.md
docs/standards/typescript-boundaries.md
docs/runbooks/pattern-intake.md
```

Mechanism:

```txt
Types and readback shapes should communicate domain authority, lifecycle, and
finite review states; retained patterns must become a local decision,
rejection, bounded repair, eval/golden candidate, standard, skill, ADR, or
memory/source candidate.
```

KRN implication:

```txt
Operator-facing readback should not collapse existing candidate reviewability
metadata into `unknown` or prose fallback when the metadata already exists.
```

Decision:

```txt
Open a bounded source repair for run readback candidate reviewability metadata.
```

Consumer:

```txt
packages/cli/src/runRunShowCommand.ts
packages/cli/src/runRunShowCommand.test.ts
```

Falsifier:

```txt
`krn run show` already preserves reviewability labels and reasons for
source-decision/eval/anti-memory/other non-memory candidates in both text and
JSON readback, or source inspection proves those summaries cannot carry
metadata without a broader model change.
```

Does not prove:

```txt
Product readiness, exhaustive TypeScript quality, or that broad course/paper
indexing is valuable.
```

## Local Evidence

`packages/cli/src/runRunShowCommand.ts` already exposes a typed
`RunReadbackResource` and renders memory candidate reviewability from metadata.
For other candidate summaries, it currently falls back to:

```txt
reviewability: unknown
reviewabilityReasons:
  Reviewability was not present in the persisted candidate summary.
```

The existing test fixture includes a `sourceDecisions` candidate with
`metadata.reviewability: needs_more_evidence`, but readback expectations do not
require that value to survive into the external JSON shape.

## Rejected Paths

| Path | Decision | Reason |
|---|---|---|
| Broad TypeScript cleanup | reject | V207 found one readback consumer, not repo-wide drift. |
| Course/paper indexing | reject | The source is already retained as public mechanism summary; copying or crawling course material would create context sludge. |
| New research subsystem | reject | Pattern intake already routes sources to consumers and falsifiers. |
| Review gate behavior change | reject | The gap is output/readback clarity, not promotion authority. |

## Next Bounded Repair

```txt
V208 — Run Readback Candidate Reviewability Metadata Repair
```

Task:

```txt
Preserve reviewability labels and reasons for non-memory candidates in
`krn run show` text and JSON output when candidate metadata already carries
those fields.
```

Non-goals:

```txt
no promotion changes
no MemoryReviewGate changes
no reflection extraction changes
no broad TypeScript cleanup
no DB schema migration unless source inspection proves metadata cannot be read
```

Verification:

```txt
pnpm --filter @krn/cli test -- runRunShowCommand
pnpm typecheck
pnpm test
git diff --check
```

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `rtk rg ... pattern-intake/source-to-decision` | passed | Active pattern surfaces and guards exist. | That every future run applies them correctly. |
| `rtk sed ... runRunShowCommand.ts` | passed | Source inspection found a concrete readback consumer. | That the repair is already implemented. |
| `rtk sed ... runRunShowCommand.test.ts` | passed | Existing tests cover readback output but do not require non-memory reviewability metadata preservation. | Product readiness or DB runtime truth. |

## What This Proves

- Pattern intake can reject broad research and select one bounded repair.
- Public TypeScript/course mechanisms can influence KRN without copying course
  content.
- The next useful action is source/readback clarity, not another research layer.

## What This Does Not Prove

- Product readiness.
- Widened internal alpha.
- Exhaustive TypeScript quality.
- That all retained sources are current forever.
- That every candidate type should share one persistence model.
