# EVD-02 Evidence Command Normalization Report

Status: source repair dogfood.

Date: 2026-07-01

## Executive Verdict

The audit finding was valid: evidence command normalization existed in both
`@krn/core` and `@krn/schema`, duplicating provenance inference and command
proof/non-proof defaults. EVD-02 keeps `@krn/schema` as the unknown-first IO
boundary and delegates command normalization semantics to `@krn/core`, which is
the accepted pure-domain owner.

## Source-To-Decision

```txt
source: packages/core/src/evidenceBundle.ts, packages/schema/src/evidenceCapture.ts, docs/architecture/package-boundaries.md
mechanism: schema validated command input and then repeated core's provenance
  normalization logic locally.
KRN implication: evidence command proof semantics should have one canonical
  owner; duplicated proof/non-proof defaults can drift.
decision: remove the schema-local command normalization waterfall and delegate
  to core normalizeEvidenceCommand after schema validation.
consumer: evidence capture parsing, DB evidence persistence validation, run and
  evidence readbacks.
falsifier: schema and core again diverge for default_template,
  operator_reported, captured_output_file, command_runner, or external_log
  command output.
```

## What Changed

| Area | Change |
| --- | --- |
| Schema | `parseEvidenceCaptureInput` now validates command input and calls `normalizeEvidenceCommand` from `@krn/core`. |
| Package boundary | `@krn/schema` now depends on `@krn/core`, matching the documented `schema -> core types where useful` direction. |
| TypeScript config | Removed schema-local `rootDir` that blocked the accepted workspace source import direction. |
| Tests | Extended schema boundary tests to cover `operator_reported`, `command_runner`, and `external_log`; existing coverage preserves `default_template` and `captured_output_file`. |

## Verification

| Command | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `pnpm install --frozen-lockfile` | passed | Workspace lockfile and dependency links are consistent. | Does not prove behavior. |
| `pnpm run typecheck` | passed | All workspace package typecheck scripts pass with the new schema-to-core dependency. | Does not prove runtime DB persistence. |
| `TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | Full workspace tests pass, including schema evidence command cases. | Does not prove product readiness. |
| `pnpm quality:fallow:ci` | passed | Changed-file Fallow audit found no issues in this slice. | Does not prove broad repo health. |
| `pnpm quality:fallow` | passed | Broad Fallow report was generated for review evidence. | It still reports existing broad duplication findings outside this slice; this was not a mandate for unrelated cleanup. |
| `pnpm db:ready` | failed, then passed after `docker compose up -d krn-postgres` | Local Postgres can be restored and reaches ready state with 14/14 migrations and pgvector. | Initial failure proves DB was not already running; readiness does not prove all persistence paths. |
| `pnpm db:smoke:harness-evidence` | failed while DB was down, then passed | Existing DB-backed harness evidence smoke still persists/readbacks evidence, review, feedback, and run events after DB recovery. | Does not prove every CLI evidence command path is ideal. |
| `git diff --check` | passed | Diff has no whitespace errors. | Does not prove behavior. |

## Proof Boundary

This slice proves schema evidence command parsing now reuses the same canonical
normalizer as core for the covered command kinds.

This slice does not prove:

- core's internal normalizer implementation is minimal;
- every evidence metadata field is fully typed;
- evidence semantics changed;
- DB schema changes are needed;
- broad Fallow duplication findings are fixed;
- product readiness.

## Dogfood Brain Usefulness

| Lane | Verdict | Evidence |
| --- | --- | --- |
| Selected context | helped | `docs/architecture/package-boundaries.md` confirmed `schema -> core` is allowed. |
| Pattern use | helped | Unknown-first schema boundary stayed intact while proof semantics moved to one domain owner. |
| Evidence strength | strong for slice | Full tests, typecheck, changed-file Fallow, broad Fallow report generation, DB readiness, DB smoke, and diff check ran. |
| Review burden | lower | Future evidence command behavior is less likely to drift between schema and core. |
| Brain ROI | positive | The audit item became a bounded deduplication repair without broad validation framework work. |

## Next Recommended Action

Continue with `mise-en-palace-r8d`: simplify the now-canonical core evidence
command normalizer internals if source inspection confirms behavior can remain
identical.
