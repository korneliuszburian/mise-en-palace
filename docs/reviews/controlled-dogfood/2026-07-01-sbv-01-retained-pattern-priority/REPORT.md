# SBV-01 Retained Pattern Priority Repair

Status: DB-backed source repair report.

Date: 2026-07-01

## Executive Verdict

SBV-01 repaired the immediate retained-pattern priority failure from SBV-00.
When a task explicitly names `source-to-decision`, source activation now expands
the source query with the retained pattern gate terms, so the retained
SourceClaim `125366b1-8bd9-4092-92d8-1aa1d2ed46ae` is selected before unrelated
target-specific context.

This is not a broad activation scoring rewrite. It is a bounded query-shape
repair for a named KRN pattern gate.

## Source To Decision

Source:
`source_claim:125366b1-8bd9-4092-92d8-1aa1d2ed46ae`

Mechanism:
The retained source-to-decision pattern preserves source, mechanism, KRN
implication, decision/rejection, consumer, falsifier, and does-not-prove terms.
The prior source query treated explicit `source-to-decision` naming mostly as
generic lexical text, so unrelated target context could outscore the retained
pattern under tight budget.

KRN implication:
Named retained patterns need enough query shape to retrieve their governed
mechanism, not just nearby task words.

Decision:
Add a small source-query expansion for explicit `source-to-decision` tasks.

Consumer:
`buildSourceQuery` and activation ranking for source/search context.

Falsifier:
A source-to-decision/SBV task that again excludes the retained pattern as
`over_budget` while unrelated target context is included first.

Does not prove:
Broad activation quality, source truth, vector/graph quality, or product
readiness.

## Changed

- `packages/harness/src/activation/sourceQuery.ts`
- `packages/harness/src/activation/index.test.ts`

## Behavior

Before:
The focused regression test selected `claim-ekologus-target` before
`claim-source-to-decision-pattern`.

After:
The same test selects `claim-source-to-decision-pattern`; the unrelated target
packet is excluded as `over_budget`.

Live DB replay:
`krn plan --persist` for the SBV-00 continuation task included
`source_claim:125366b1-8bd9-4092-92d8-1aa1d2ed46ae` as the first context
inclusion. EKOLOGUS context was still visible, but it no longer outranked the
retained pattern.

## Persisted Evidence

Run:
`e0046a9c-956a-4158-b4fc-3d9e6a7183c8`

EvidenceBundle:
`c0d3b825-0847-44f7-8177-7524f0d2f297`

ReviewAssessment:
`8f09ba36-bde9-4a4f-880e-45f6bc28c2d4`

FeedbackDelta:
`2a9cfe3f-0e57-4082-b72a-dd11e4cd480d`

ObservationGroup:
`acd1fb2c-79e8-4ab6-8fde-40b2b945205c`

ReflectionRecord:
`6d96cb40-422a-4202-ba7b-bd3195ec3dad`

Source usefulness:
`claim:125366b1-8bd9-4092-92d8-1aa1d2ed46ae=helped`

Memory mutation:
none.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm --filter @krn/harness test -- activation/index.test.ts` | passed | The regression and activation tests pass in the harness package. | Full product readiness, source truth, future selector quality. |
| `pnpm db:ready` | passed | Current-shell Postgres is reachable, migrations are applied, pgvector is available. | Remote/CI DB state or product readiness. |
| `krn plan --persist ...` | passed | The repaired source query selects the retained source-to-decision SourceClaim first in live DB-backed planning. | Broad activation quality or future task correctness. |
| `pnpm run typecheck` | passed | Workspace TypeScript boundaries compile. | Runtime behavior quality. |
| `TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | Workspace tests pass in the current shell. | Product usefulness or target-repo correctness. |
| `pnpm quality:fallow:ci` | passed | Fallow found no changed-file issues. | All repo code quality or semantic correctness. |
| `git diff --check` | passed | Diff has no whitespace errors. | Behavioral correctness. |
| `krn observe --persist` then `krn reflect --persist` | passed | Same-run observe/reflect sequencing works without Memory Core mutation. | Reflection quality or useful findings. |

## Review Notes

Dirty context classification listed `.beads/issues.jsonl` as unrelated because
the implementation intended files were only the source query and test files.
That file is task-tracking state and belongs to the slice commit, but it is not
runtime source behavior.

## Next Implication

SBV can now continue with retained-pattern reuse as the active driver. The next
slice should use this repaired priority to run a larger vertical over one of the
remaining brain layers, not return to multi-repo bookkeeping or guard-only work.
