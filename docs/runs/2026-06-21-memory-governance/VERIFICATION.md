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

Slice 09 evidence capture memory candidates:

- RED: `pnpm --filter @krn/cli test -- runCli.test.ts` failed because
  `krn evidence capture` did not print `memoryCandidates`, persisted
  `FeedbackDelta.memoryCandidates` was empty, and clean captures did not print
  `memoryCandidates: - none`.
- GREEN: `pnpm --filter @krn/cli test -- runCli.test.ts` passed with 48
  tests.
- `pnpm typecheck`: passed across workspace projects.
- `pnpm test`: passed across workspace projects.
- First `pnpm db:smoke:harness-evidence` failed because `KRN_DATABASE_URL`
  was not configured. This was a configuration miss, not a smoke failure.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:smoke:harness-evidence`: passed. Runtime proof included evidence bundle,
  review assessment, feedback delta, run events `2`, cleanup remaining marker
  count `0`, and `Harness evidence smoke: passed`.
- Runtime plan persist passed:
  `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter
  @krn/cli krn plan --task "M23.09 evidence capture memory candidate
  verification" --persist`.
- Runtime evidence capture persist passed:
  `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter
  @krn/cli krn evidence capture --run-id
  14af107b-f3c9-4d7e-a97a-83a1326f8f56 --persist`.
- Runtime evidence capture report showed `memoryCandidates`, proposed pattern
  candidate, `completeness: incomplete`, missing `applicationGuidance,
  sourceLineage, invalidationRule`, no MemoryCandidate row created, no
  MemoryRecord created, and persisted evidence/review/feedback IDs.
- `git diff --check`: passed.

Slice 10 doctor memory governance readiness:

- RED: `pnpm --filter @krn/cli test -- runCli.test.ts` failed because
  `krn doctor` did not print memory governance readiness lines and
  `deriveMemoryGovernanceReadiness` was not exported.
- GREEN: `pnpm --filter @krn/cli test -- runCli.test.ts` passed with 49
  tests.
- `pnpm typecheck`: passed across workspace projects.
- Preview doctor passed:
  `pnpm --filter @krn/cli krn doctor`.
- Preview doctor report showed memory governance schema and MemoryRepository
  read path skipped because Postgres was not configured, memory governance
  smoke available, memory governance runtime proof skipped, runtime markdown
  memory absent, automatic memory mutation absent, and memory governance
  readiness preview-only.
- `pnpm test`: passed across workspace projects.
- `git diff --check`: passed.
- Live memory governance smoke passed:
  `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:smoke:memory-governance`.
- Smoke report showed memory candidate readback matched, reviewed status
  `accepted`, memory record readback matched, memory record version,
  memory application, anti-memory record, run anti-memory records `1`, project
  memory records `1`, outbox events `2`, cleanup remaining marker count `0`,
  and `Memory governance smoke: passed`.
- `pnpm --filter @krn/db db:check`: passed.
- DB-backed doctor passed:
  `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter
  @krn/cli krn doctor`.
- DB-backed doctor report showed memory governance schema
  `ready (7/7 tables present)`, MemoryRepository read path `reachable`, memory
  governance smoke available, runtime markdown memory absent, automatic memory
  mutation absent, and runtime proof `unverified`.
- Runtime proof remains unverified by design until Slice 11 creates durable
  dogfood MemoryCandidate/MemoryRecord/Application/AntiMemory records. The
  smoke itself cleans its marker rows to zero.

Slice 11 memory governance dogfood:

- Source claim lookup passed and selected M22 SourceClaim
  `212815bc-477c-4985-8992-31825f5c5897`:
  "M22 should model source graph with Postgres-backed relational edges before
  any separate graph database or crawler."
- Persisted plan passed:
  `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter
  @krn/cli krn plan --task "promote reviewed memory from KRN evidence"
  --persist`.
- Plan output created execution run
  `291bc2c4-7b02-46e7-9b7c-3980fadb9b34`.
- Persisted candidate add passed and created MemoryCandidate
  `221e9838-0cad-42be-b1ec-d8484a8dd14a` with source claim
  `212815bc-477c-4985-8992-31825f5c5897`.
- Persisted candidate promote passed and created MemoryRecord
  `7dda35fd-b89d-4bd4-94bd-7937022d99e7`. The report printed the source
  claim `doesNotProve`: retrieval quality, ranking quality, and long-term graph
  traversal performance remain unproven.
- Persisted memory application passed and created MemoryApplication
  `8fb759f3-a49d-4999-ad4f-5be1ef8b3481` with outcome `helped`.
- No SourceClaim existed for markdown runtime memory, so anti-memory used
  source lineage `docs/KRN_KERNEL.md#runtime-truth` instead of pretending M22
  source graph evidence invalidated markdown memory.
- Persisted anti-memory passed and created AntiMemoryRecord
  `7cb45aea-756a-4e70-a855-cf766c41cf22`.
- Persisted evidence capture passed for run
  `291bc2c4-7b02-46e7-9b7c-3980fadb9b34`, created EvidenceBundle
  `7c0b5701-2f08-495e-992c-3c7eb5e71733`, ReviewAssessment
  `e698b9b5-b403-48ca-8ea0-ca9e8ca5b5c7`, and FeedbackDelta
  `0bf53a6b-f383-49f0-a87d-648679b47086`, with no memory mutation.
- DB readback passed and confirmed MemoryRecordVersion
  `5394b391-5e9c-411b-8acd-996cea7c04a9`, accepted candidate, application,
  and anti-memory linkage.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:smoke:memory-governance`: passed after durable dogfood records existed.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter
  @krn/cli krn doctor`: passed with memory governance runtime proof
  `ready (candidates 1, records 1, applications 1, anti-memory 1)` and memory
  governance readiness ready.
- `DOGFOOD.md` records the IDs, source-to-decision mapping, what was proven,
  and what was not proven.

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
