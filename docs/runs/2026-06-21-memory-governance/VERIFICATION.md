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

Slice 03 MemoryRepository methods:

- RED: `pnpm --filter @krn/db test` failed because
  `DrizzleMemoryRepository` did not expose M23 repository methods, mappers did
  not return M23 candidate/record/anti-memory fields, and
  `mapMemoryApplication` was missing.
- GREEN: `pnpm --filter @krn/db test` passed with 5 test files and 15 tests.
- `pnpm typecheck`: passed across workspace projects.
- `pnpm --filter @krn/db db:check`: passed.
- `pnpm test`: passed across workspace projects.

Slice 04 memory governance smoke path:

- RED: `pnpm --filter @krn/db test -- memoryGovernanceSmoke.test.ts` failed
  because `runMemoryGovernanceSmokeCheck` was not exported.
- RED: `pnpm --filter @krn/cli test -- runCli.test.ts` failed because
  `krn db smoke memory-governance` returned invalid-args exit `2`.
- GREEN: `pnpm --filter @krn/db test -- memoryGovernanceSmoke.test.ts` passed.
- GREEN: `pnpm --filter @krn/cli test -- runCli.test.ts` passed with 33 tests.
- `pnpm typecheck`: passed across workspace projects.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:smoke:memory-governance`: passed. The report showed source claim,
  memory candidate, accepted review status, memory record/version,
  memory application, anti-memory record, outbox events `2`, and cleanup
  remaining marker count `0`.
- `pnpm --filter @krn/db db:check`: passed.
- `pnpm test`: passed across workspace projects.

Slice 05 CLI memory candidate add:

- RED: `pnpm --filter @krn/cli test -- runCli.test.ts` failed with three
  invalid-args cases because `krn memory candidate add` was not routed yet.
- GREEN: `pnpm --filter @krn/cli test -- runCli.test.ts` passed with 36
  tests.
- `pnpm typecheck`: passed across workspace projects.
- `pnpm test`: passed across workspace projects.
- Preview command passed:
  `pnpm --filter @krn/cli krn memory candidate add --run-id execution-run-1
  --kind architecture-boundary --content "Source graph should use Postgres edge
  tables first" --source-claim-id source-claim-1 --confidence medium
  --application-guidance "Use when deciding whether to add a separate graph DB"
  --invalidation-rule "Revisit when graph traversal exceeds Postgres edge-table
  performance"`.
- Preview report showed `Persistence: disabled`, `DB writes: none`, kind
  `constraint`, inputKind `architecture-boundary`, status `proposed`,
  confidence `70`, runId `execution-run-1`, and sourceClaimId
  `source-claim-1`.
- `pnpm --filter @krn/db db:check`: passed.
- `git diff --check`: passed.

Slice 06 CLI memory candidate review:

- RED: `pnpm --filter @krn/cli test -- runCli.test.ts` failed with four
  invalid-args cases because `krn memory candidate promote/reject` was not
  routed yet.
- GREEN: `pnpm --filter @krn/cli test -- runCli.test.ts` passed with 40
  tests.
- `pnpm typecheck`: passed across workspace projects.
- `git diff --check`: passed.
- `pnpm test`: passed across workspace projects.
- `pnpm --filter @krn/db db:check`: passed.

Slice 08 CLI anti-memory add:

- RED: `pnpm --filter @krn/cli test -- runCli.test.ts` failed with four
  invalid-args cases because `krn memory anti add` was not routed yet.
- GREEN: `pnpm --filter @krn/cli test -- runCli.test.ts` passed with 48
  tests.
- First `pnpm typecheck` failed because parsed source lineage carried
  `note?: string | undefined` across the core `SourceLineageRef` boundary
  under `exactOptionalPropertyTypes`.
- After stripping undefined notes, `pnpm typecheck`: passed across workspace
  projects.
- Preview command passed:
  `pnpm --filter @krn/cli krn memory anti add --run-id execution-run-1
  --rejected-claim "Markdown files are KRN runtime memory" --reason "Files can
  be export/audit/seed/source bank, not Memory Core"
  --invalidated-by-source-claim-id source-claim-1`.
- Preview report showed `Persistence: disabled`, `DB writes: none`,
  rejectedClaim `Markdown files are KRN runtime memory`, the rejection reason,
  invalidatedBySourceClaimId `source-claim-1`, confidence `90`, no MemoryRecord
  created, and anti-memory not positive memory.
- `pnpm --filter @krn/cli krn memory anti add --help`: passed.
- `git diff --check`: passed.
- `pnpm --filter @krn/db db:check`: passed.
- `pnpm test`: passed across workspace projects.
- Promote preview passed:
  `pnpm --filter @krn/cli krn memory candidate promote --candidate-id
  memory-candidate-1 --reviewer operator --decision accepted`.
- Promote preview report showed `Persistence: disabled`, `DB writes: none`,
  candidateId `memory-candidate-1`, reviewer `operator`, decision `accepted`,
  no MemoryRecord created, and no memory application recorded.
- Reject preview passed:
  `pnpm --filter @krn/cli krn memory candidate reject --candidate-id
  memory-candidate-1 --reviewer operator --reason "No source mechanism tied
  the claim to a KRN decision"`.
- Reject preview report showed `Persistence: disabled`, `DB writes: none`,
  decision `rejected`, the rejection reason, no MemoryRecord created, and no
  memory application recorded.
- `pnpm --filter @krn/cli krn memory candidate promote --help`: passed.
- `pnpm --filter @krn/cli krn memory candidate reject --help`: passed.

Slice 07 CLI memory record apply:

- RED: `pnpm --filter @krn/cli test -- runCli.test.ts` failed with four
  invalid-args cases because `krn memory record apply` was not routed yet.
- RED: `pnpm --filter @krn/db test -- DrizzleMemoryRepository.test.ts` failed
  because `DrizzleMemoryRepository.createMemoryFeedbackEvent` was missing.
- GREEN: `pnpm --filter @krn/cli test -- runCli.test.ts` passed with 44
  tests.
- GREEN: `pnpm --filter @krn/db test -- DrizzleMemoryRepository.test.ts`
  passed with 6 test files and 16 tests.
- `pnpm typecheck`: passed across workspace projects.
- Helped preview passed:
  `pnpm --filter @krn/cli krn memory record apply --run-id execution-run-1
  --memory-id memory-record-1 --outcome helped --notes "Guided M23 decision to
  avoid a separate graph DB"`.
- Helped preview report showed `Persistence: disabled`, `DB writes: none`,
  memoryRecordId `memory-record-1`, runId `execution-run-1`, outcome `helped`,
  and `Feedback event: none`.
- Stale preview passed:
  `pnpm --filter @krn/cli krn memory record apply --run-id execution-run-1
  --memory-id memory-record-1 --outcome stale --notes "Graph traversal now
  exceeds Postgres edge-table performance"`.
- Stale preview report showed `Persistence: disabled`, `DB writes: none`,
  outcome `stale`, and `Feedback event: would be recorded`.
- `pnpm --filter @krn/cli krn memory record apply --help`: passed.
- `git diff --check`: passed.
- `pnpm test`: passed across workspace projects.
- `pnpm --filter @krn/db db:check`: passed.
