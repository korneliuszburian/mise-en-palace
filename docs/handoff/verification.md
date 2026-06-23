# Verification

Latest verified slice: MM-58 feedback dogfood capture.

Passed:

- Preflight `git status --short --branch` showed branch `main` aligned with
  `origin/main` plus only the two raw research materials untracked.
- Preflight `git log --oneline -5` showed latest commit
  `8159c06 feat(cli): add review assess command`.
- Local Postgres was restored through `docker compose up -d krn-postgres`.
- Focused `pnpm --filter @krn/cli test -- runCli.test.ts` passed with 6 files
  and 94 tests.
- Focused `pnpm --filter @krn/cli typecheck` passed.
- Final `pnpm typecheck` passed across all workspace packages.
- Final `pnpm test` passed across 49 files and 272 tests.
- Final `git diff --check` passed.
- Final forbidden surface/dependency scan found no forbidden packages,
  `.krn` runtime truth directory, forbidden dependencies, server/listener
  surface, pattern CLI surface, or MCP runtime surface.
- Final `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:ready` passed with 11/11 migrations and pgvector available.
- Final DB-aware `pnpm db:smoke:harness-evidence` passed and created then
  cleaned up one evidence bundle, one review assessment, and one feedback
  delta.
- Final `krn audit slice --since origin/main --repo ../.. --fail-on warning`
  with explicit intended files and verification flags passed with verdict
  `pass` and 0 findings.

MM-58 behavior proof:

- Local Postgres was restored through `docker compose up -d krn-postgres`.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready`
  passed with 11/11 migrations and pgvector available.
- Persisted dogfood ExecutionRun
  `5db6c5aa-3fcf-48bd-b013-f732c7558e33` remained present after DB restart.
- Evidence capture persisted EvidenceBundle
  `4d2e3247-4469-45bc-99a3-0a4b4095110d`, ReviewAssessment
  `99ad79d8-f4b1-4018-9721-79676238e882`, and FeedbackDelta
  `0ba61fdd-179d-455d-bac5-af57515b6f87`.
- The capture FeedbackDelta contains one proposal-only memory candidate, zero
  source decision proposals, and zero eval candidate proposals.
- First live `krn review assess --persist` exposed that the command used the
  over-broad planning DB runtime; MM-58 narrowed it to
  `createReviewAssessDatabaseRuntime`.
- Live `krn review assess --persist` then created ReviewAssessment
  `c6b0130d-c6d0-4db2-95b5-4076201eee4e` and FeedbackDelta
  `de8b97e3-1593-4f4c-891a-60c7a3df444c`.
- Manual review metadata persisted `outcome=changes_requested`,
  `reviewBurden=medium`, `diffRisk=medium`, and
  `correctionLabels=["dirty_context"]`.
- Manual feedback metadata persisted `memoryRecordMutation: "none"`.
- SQL counts moved from `8/8/8/2/4` to `9/10/10/2/4` for
  evidence_bundles/review_assessments/feedback_deltas/memory_candidates/
  memory_records.
- No schema change, DB migration, MemoryCandidate row creation, MemoryRecord
  creation, SourceDecision truth write, candidate promotion,
  dashboard/API/MCP/server/plugin, or source crawler surface was added.

Not proven by MM-58:

- Golden memory behavior remains MM-59+.
- The two raw research materials under `docs/materials/` remain untracked dirty
  context and are intentionally not committed.
