# Verification

Slice 00 preflight/inventory:

- `git status --short --branch`: passed with clean `## main...origin/main`
  before M23 ledger creation.
- `GOAL.md` M23 sections were read:
  - objective;
  - memory semantics;
  - target behavior;
  - M23.00 through M23.12 slice list.
- `docs/KRN_KERNEL.md`: read before edits.
- Memory DB schema read:
  - `memory_records`;
  - `memory_record_versions`;
  - `memory_candidates`;
  - `memory_applications`;
  - `memory_feedback_events`;
  - `anti_memory_records`;
  - `memory_activation_traces`.
- Memory repository port and Drizzle adapter read:
  - current create/list methods exist;
  - promote/reject/apply/readback methods required by M23 are missing.
- Core memory types read:
  - `MemoryRecord`;
  - `MemoryCandidate`;
  - `AntiMemoryRecord`.
- Memory IO schema read:
  - current `parseMemoryCandidateInput` exists;
  - M23 CLI input schemas are missing.
- Feedback/evidence surface read:
  - `FeedbackDelta.memoryCandidates` exists as JSONB;
  - `krn evidence capture` currently persists empty memory candidates.
- Smoke surface read:
  - project, harness-plan, harness-evidence, and source-graph smoke paths exist;
  - memory-governance smoke path is missing.
- `pnpm typecheck`: passed across workspace projects.
- `git diff --check`: passed.

Slice 01 memory governance schema:

- RED: `pnpm --filter @krn/db test -- memory.test.ts` failed because M23
  memory governance enum values and schema fields were missing.
- GREEN: `pnpm --filter @krn/db test -- memory.test.ts` passed after schema
  updates.
- `pnpm db:generate`: passed and generated
  `packages/db/src/migrations/0004_cool_toro.sql`.
- SQL inspection of `0004_cool_toro.sql`: passed. It adds
  `memory_application_outcome`, `memory_feedback_event_type`, enum values
  `proposed`, `superseded`, and `deprecated`, M23 candidate linkage/review/
  validity fields, record current-version fields, version provenance/validity
  fields, application run/outcome/notes fields, feedback event type/reason/
  evidence fields, and anti-memory rejected-claim/source/run fields.
- First live `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:ready` attempt failed because the generated migration used newly added
  enum value `proposed` as the `memory_candidates.status` default in the same
  migration. Root cause was Postgres enum/default ordering, not TypeScript.
- After keeping the DB default as `candidate` while allowing explicit
  `proposed` values, `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn
  pnpm db:ready`: passed with migrations expected/applied `5/5`.
- `pnpm --filter @krn/db db:check`: passed.
- `pnpm typecheck`: passed.
- `pnpm test`: passed.
- `git diff --check`: passed.

Slice 02 memory governance IO schemas:

- RED: `pnpm --filter @krn/schema test` failed because
  `parseMemoryPromotionInput`, `parseMemoryApplicationInput`,
  `parseMemoryFeedbackEventInput`, and `parseAntiMemoryInput` were not yet
  exported, and `parseMemoryCandidateInput` did not default status to
  `proposed`.
- GREEN: `pnpm --filter @krn/schema test` passed with 1 test file and 8 tests.
- `pnpm typecheck`: passed across workspace projects.
