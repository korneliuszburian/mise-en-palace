# Helped Pattern Dogfood Feedback

Slice: `mise-en-palace-uetf`

Finding:
- Natural dogfood task text `unknown first retained pattern dogfood evidence feedback` initially missed retained patterns because query compaction kept meta words `dogfood feedback`.

Change:
- Treat `dogfood` and `feedback` as task/meta terms in `brainKnowledgeQuery`.
- Added a focused query-shaping test proving the compacted query includes `unknown first`.

DB-backed proof:
- `krn plan --persist` selected helped retained patterns for the natural dogfood task.
- Execution run: `8f086705-91ab-4c3a-a43d-a6130cd98e1b`.
- `krn evidence capture --persist` wrote pattern usefulness feedback for:
  - `ts-boundary-unknown-first-result-state`
  - `ts-boundary-brain-knowledge-parser-exemplar`
- FeedbackDelta: `28b3ae31-f8c8-4442-9fa9-8a50297a2cdf`.
- `krn run show --run-id 8f086705-91ab-4c3a-a43d-a6130cd98e1b` read back retained selection, EvidenceBundle, ReviewAssessment, and both helped pattern outcomes.

Verification:
- `pnpm --filter @krn/cli test -- brainKnowledgeQuery plan retainedPatternSelection` passed.
- `pnpm -C packages/cli typecheck` passed.
- `pnpm quality:fallow:ci` passed.
- `git diff --check` passed.

Non-proof:
- This does not prove broad retained-pattern ranking quality, product readiness, or that all dogfood/evidence terms should be globally ignored.
