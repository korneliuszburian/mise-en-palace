# SBV-05 Retained Pattern Selection Run Show Readback

Status: complete.

## Outcome

`krn run show` now exposes retained pattern selection metadata that was persisted by `krn plan --persist` in SBV-04.

The readback now shows:

- selected/rejected/unavailable retained pattern selection status;
- query;
- selected retained pattern IDs;
- selected pattern card details;
- reason;
- does-not-prove boundary.

This closes the SBV-04 gap where `krn codex brief` could show selected retained patterns, but `krn run show` only showed later pattern usefulness outcomes.

## Changed

- `packages/cli/src/runRunShowCommand.ts`
- `packages/cli/src/runRunShowCommand.test.ts`

No DB schema, ranking, dashboard, API/MCP, worker runtime, crawler, or Memory Core mutation was added.

## Persisted Readback Proof

Run used for live readback:

```txt
1a6cec97-933c-40c4-bfad-d0a1cd201143
```

Text readback rendered:

```txt
Retained Pattern Selection:
Retained pattern selection: selected
Retained pattern query: source to decision
Retained pattern IDs: source-to-decision-retention-gate
```

JSON readback rendered:

```txt
retainedPatternSelection.selectedPatternIds[0] = source-to-decision-retention-gate
```

The same run still shows downstream `patternUsefulnessOutcomes`, so pre-coding retained pattern selection and post-run usefulness feedback are both visible in one readback.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm --filter @krn/cli test -- runRunShowCommand` | passed | Focused run-show text/JSON tests cover retained selection readback and existing usefulness outcomes. | Does not prove live DB state. |
| `pnpm run typecheck` | passed | TypeScript contracts compile across the workspace. | Does not prove behavior correctness. |
| `TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | Full local test suite passes. | Does not prove product readiness. |
| `pnpm quality:fallow:ci` | passed | Fallow found no issues in changed files. | Does not prove no repo-wide quality debt exists. |
| `git diff --check` | passed | Diff has no whitespace errors. | Does not prove runtime behavior. |
| `pnpm db:ready` | passed | Current shell can reach Postgres with migrations and pgvector ready. | Does not prove this run exists or readback behavior. |
| `KRN_DATABASE_URL=... krn run show --run-id 1a6cec97...` | passed | Text readback exposes persisted retained pattern selection metadata. | Does not prove ranking quality, source truth, or product readiness. |
| `KRN_DATABASE_URL=... krn run show --run-id 1a6cec97... --json` | passed | JSON readback exposes typed `retainedPatternSelection`. | Does not prove API/MCP readiness. |

## Pattern Usefulness

Selected retained pattern lane: helped.

Why: SBV-05 makes the pre-coding retained pattern selection visible at the durable run readback boundary, so future slices can compare:

```txt
selected retained pattern -> implemented change -> pattern usefulness outcome
```

without parsing plan output or Codex brief text.

Does not prove: pattern recall quality, ranking quality, source truth, or that all relevant patterns were selected.

## Follow-Up

The next source repair should be selected from current product evidence and the repo health audit, but only after classification into bounded repairs. Do not run a broad cleanup.
