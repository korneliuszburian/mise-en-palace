# Brain Search Code-Quality Dogfood

Date: 2026-07-03

## Verdict

Retained pattern selection now preserves target-fit evidence in plan and run
readback. A code-quality planning query can show whether selected retained
patterns are target-specific guidance or only generic/adjacent context.

## Behavior Change

- `RetainedPatternPlanItem` now carries `targetFit` and `targetFitReasons`.
- `RetainedPatternPlanSelection` now carries `targetFitSummary` and
  `recommendedNextAction`.
- Plan text and run-show readback expose the target-fit verdict and recommended
  use beside selected pattern IDs.

## Dogfood Evidence

Command:

```sh
pnpm krn plan --task "Improve retained pattern metadata parser boundary using unknown-first TypeScript code-quality guidance; preserve proof and non-proof readback; no dashboard API MCP worker daemon or broad rewrite"
```

Readback excerpt:

```txt
Retained pattern selection: selected
Retained pattern query: unknown first typescript
Retained pattern IDs: ts-boundary-brain-knowledge-parser-exemplar, ts-boundary-unknown-first-result-state
Retained pattern targetFit: target_specific_selected_knowledge
Retained pattern recommended use: Use target-specific selectedKnowledge first, then treat generic or adjacent packets as guardrails.
```

## Proof

- `pnpm --filter @krn/cli test -- retainedPatternSelection plan runRunShowCommand`
- `pnpm --filter @krn/cli typecheck:tests:clean`
- `pnpm -w typecheck`
- `pnpm quality:fallow:ci`
- `pnpm --filter @krn/harness test -- activePlanInvariants`
- `git diff --check`

## Second Opinion

`second-opinion-claude` returned `approve_with_fixes` with LOW risk. Accepted
fixes:

- unavailable retained-pattern readback now derives `recommendedNextAction`
  from `summarizeTargetFit([]).recommendedUse`;
- tests pin unavailable readback target-fit guidance;
- tests prove explicit `targetFitSummary` metadata is parsed instead of
  accidentally recomputed;
- `planItemFromCard` documents that target fit is query-relative plan evidence,
  not authority owned by selectedKnowledge cards.

No second review loop was required by the governed verdict.

## Non-Proof

This does not prove retained-pattern ranking quality, catalog completeness,
source truth, automatic memory recall, Codex adherence, or product readiness.
It proves only that selected retained patterns carry reviewable target-fit
readback through the existing planning/run-readback bridge.
