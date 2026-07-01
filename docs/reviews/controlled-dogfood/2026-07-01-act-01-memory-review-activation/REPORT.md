# ACT-01 Memory Review Activation Report

Status: source repair dogfood.

Date: 2026-07-01

## Executive Verdict

The current repository health audit finding was valid in the activation path:
`assessMemoryRecordReviewSignals()` could emit blocking memory review signals,
but activation ranking and compiler filtering did not consume those signals as
structural exclusions.

ACT-01 makes memory review signals part of activation candidate safety. Blocking
signals now exclude memory candidates before temporal/context selection can
include them. Warning signals remain visible for review but do not block
activation.

## Source-To-Decision

```txt
source: current user-provided repository health audit; packages/core/src/memory.ts;
  packages/harness/src/activation/activationFilters.ts;
  packages/harness/src/compiler/compileHarnessPlan.ts
mechanism: Memory Core already classifies high-risk memory review conditions as
  blocking, but the activation path only ranked memory candidates and applied
  trust/temporal filters.
KRN implication: memory safety cannot rely on prose or later review if the
  unsafe memory packet can already enter Codex context.
decision: adopt a small activation filter that maps blocking memory review
  signals to explicit activation exclusions; preserve warning signals as
  reviewable metadata.
consumer: activation filters, compiler context assembly, persisted retrieval
  candidates/activation decisions, Codex brief context.
falsifier: a memory candidate with `unresolved_negative_feedback` or
  `stale_high_confidence` can still be included by the compiled activation
  context.
```

## What Changed

| Area | Change |
| --- | --- |
| Harness activation | `toMemoryCandidate` now carries `memoryReviewSignals` on the candidate and metadata. |
| Harness activation | Added `applyMemoryReviewSignalFilter` before trust/temporal filtering. |
| Compiler | The compiler activation pipeline now applies the memory review signal filter before context ROI selection. |
| Tests | Added coverage for stale high-confidence blocking, unresolved negative feedback blocking, warning-only non-blocking memory, and compiler exclusion/persistence behavior. |

## Verification

| Command | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `pnpm --filter @krn/harness test -- activation/index.test.ts compiler/index.test.ts` | passed | Focused activation/compiler behavior is covered. | Does not prove broad workspace health. |
| `pnpm run typecheck` | passed | All workspace TypeScript packages compile with the new candidate field. | Does not prove runtime DB behavior. |
| `TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | Full workspace tests pass. | Does not prove product readiness. |
| `pnpm quality:fallow:ci` | passed | Changed-file Fallow gate found no issues in this slice. | Does not prove broad repo health; it reports one inherited changed-file duplication group outside the gate. |
| `pnpm quality:fallow` | passed | Broad Fallow report was generated for review evidence. | Broad report still contains existing duplication findings outside this slice. |
| `pnpm db:ready` | passed | Local Postgres is reachable, 14 migrations are applied, and pgvector is available. | Does not prove production DB state. |
| `pnpm db:smoke:activation` | passed | DB-backed activation smoke still persists/replays context inclusions, exclusions, decisions, and cleanup. | Does not specifically prove every memory review signal path in DB. |
| `git diff --check` | passed | Diff has no whitespace errors. | Does not prove behavior. |

## Proof Boundary

This slice proves:

- blocking memory review signals can no longer enter activation context through
  the tested filter/compiler path;
- warning-only memory review signals remain reviewable and non-blocking;
- persisted activation smoke still works after the safety gate.

This slice does not prove:

- activation ranking quality;
- activation budget policy correctness;
- trust-tier canonicalization;
- Memory Core promotion safety beyond this activation filter;
- product readiness.

## Dogfood Brain Usefulness

| Lane | Verdict | Evidence |
| --- | --- | --- |
| Current audit | helped | The newer audit identified a real structural gap rather than a cosmetic cleanup. |
| Selected context | helped | `memory.ts`, activation filters, compiler, and tests were sufficient owner files. |
| Pattern use | helped | Simplicity-first kept the repair to one filter and two call sites. |
| Evidence strength | strong for slice | Focused tests, full tests, typecheck, Fallow, DB readiness, activation smoke, and diff check ran. |
| Review burden | lower | Activation exclusions now explain the exact memory review signal that blocked inclusion. |
| Brain ROI | positive | A high-risk audit item became a structural gate without scoring, DB schema, or broad retrieval work. |

## Next Recommended Action

Open ACT-02 for the next activation safety item from the same current audit:
canonicalize activation/source trust-tier usage enough to remove type drift risk
between activation policy, source trust tiers, and context rendering. Keep it
bounded; do not rewrite activation scoring.
