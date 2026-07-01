# SBV-04 Pattern Plan/Brief Bridge Report

Status: completed source slice report.

## Executive Verdict

SBV-04 adds a small pre-coding retained-pattern bridge: `krn plan` now records
selected retained brain-knowledge pattern IDs in `HarnessPlan` and
`ExecutionRun` metadata, and `krn codex brief` renders those IDs before the
execution brief. This closes the SBV-03 gap where post-run pattern usefulness
could be recorded, but the persisted plan/brief did not expose exact retained
pattern IDs before coding.

## Changed

- Added `packages/cli/src/retainedPatternPlanBridge.ts`.
- Updated `packages/cli/src/runPlanCommand.ts` to run bounded catalog-backed
  brain-knowledge readback and persist selected/rejected/unavailable pattern
  selection metadata.
- Updated `packages/cli/src/runCodexBriefCommand.ts` to render retained pattern
  context from persisted plan metadata.
- Updated `packages/cli/src/runCli.test.ts` for plan persistence and brief
  readback behavior.

## DB-Backed Proof

Run:

```txt
executionRun: 1a6cec97-933c-40c4-bfad-d0a1cd201143
evidenceBundle: 2e31ed5c-cc79-4b16-a28a-5c5c7a266ed3
reviewAssessment: fc1577d2-c498-4d02-b9f2-e68fa5150274
feedbackDelta: ae9a2b78-1283-4b96-8da4-18ede1ebedb0
observationGroup: 97fd9fea-0ea8-405a-b02d-1acaaa296742
reflectionRecord: 13d6a784-5102-45c2-b9a4-1fd4006ab5b9
```

Observed persisted plan/brief pattern:

```txt
source-to-decision-retention-gate
```

Pattern usefulness outcome:

```txt
source-to-decision-retention-gate: helped
```

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm --filter @krn/cli test -- runCli` | passed | CLI plan/brief behavior tests pass. | Full product readiness or DB runtime truth. |
| `pnpm run typecheck` | passed | Workspace TypeScript contracts compile. | Runtime correctness or ranking quality. |
| `pnpm test` | passed | Workspace tests pass with this source change. | Source truth, memory quality, or product readiness. |
| `pnpm quality:fallow:ci` | passed | Changed JS/TS files have no Fallow issues. | Broad repo quality is perfect. |
| `pnpm db:ready` | passed | Current shell Postgres, migrations, and pgvector are ready. | CI DB state or product readiness. |
| `krn plan --persist` | passed | Persisted plan can expose selected retained pattern IDs. | Pattern relevance or ranking quality. |
| `krn codex brief --run-id ...` | passed | Brief readback renders persisted pattern context. | Codex used the brief. |
| `krn evidence capture --persist` | passed | Evidence and pattern usefulness metadata persisted. | Commands were run by evidence capture. |
| `krn observe --persist` | passed | Run observations were staged without memory mutation. | Reflection quality. |
| `krn reflect --scope run:... --persist` | passed | Reflection record persisted without Memory Core mutation. | Candidate quality or product readiness. |
| `git diff --check` | passed | Diff has no whitespace errors. | Behavioral completeness. |

## Brain Usefulness

| Area | Verdict | Evidence | Notes |
|---|---|---|---|
| Pattern brain | helped | `source-to-decision-retention-gate` selected and persisted. | The exact ID can now be reused by evidence capture. |
| Plan context | improved | `krn plan --persist` renders retained pattern IDs. | Uses existing metadata, no schema change. |
| Codex brief | improved | `krn codex brief` renders retained pattern context. | Read-only, no Codex invocation. |
| Evidence/review | helped | FeedbackDelta records pattern usefulness outcome. | Evidence capture classified `.beads/issues.jsonl` as unrelated dirty tracking state. |
| Memory mutation | safe | observe/reflect report `MemoryRecord created: no`. | Candidate generation remained non-mutating. |

## What This Does Not Prove

- Pattern search/ranking quality is good.
- The selected retained pattern is always target-specific.
- Codex used the brief.
- Product readiness.
- Memory Core mutation or autonomous learning.

## Next Recommended Action

Open one bounded follow-up: make `krn run show` surface retained pattern
selection metadata directly, so operators can read plan/brief/evidence pattern
continuity from a single run readback without inspecting brief output.
