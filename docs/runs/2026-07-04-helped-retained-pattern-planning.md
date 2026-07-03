# Helped Retained Pattern Planning

Slice: `mise-en-palace-42bp`

Change:
- `krn plan` now asks the brain-knowledge catalog for retained patterns with `usefulnessOutcome=helped` before falling back to the unfiltered catalog.
- Helped selections keep the normal retained-pattern payload but explain that helped usefulness feedback drove the match.

Proof:
- `pnpm --filter @krn/cli test -- plan retainedPatternSelection` passed.
- `pnpm -C packages/cli typecheck` passed.
- The plan test proves persisted run metadata and text output carry the helped-feedback selection reason.

Non-proof:
- This does not prove ranking quality, catalog completeness, implementation correctness, or product readiness.
- This does not mutate Memory Core, SourceDecision, or usefulness feedback state.
