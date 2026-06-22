# Progress

Goal: M23 - MemoryCandidate to reviewed MemoryRecord promotion.

Current slice: Slice 12 anti-rot and handoff complete.

Completed:

- M22 final state is the baseline: source graph persistence, source candidates,
  doctor source graph readiness, dogfood, anti-rot, and global handoff are
  complete and pushed.
- M23 run ledger was created under
  `docs/runs/2026-06-21-memory-governance/`.
- Slice 00 inventoried the current memory governance surface in
  `MEMORY_GOVERNANCE_INVENTORY.md`.
- Slice 01 added/tightened Drizzle memory governance schema for M23:
  candidate run/feedback linkage, source claim IDs, invalidation rule, validity
  fields, review fields, record `currentVersionId`, version
  `createdFromCandidateId`, version invalidation/validity fields, application
  run linkage/outcome/notes, feedback event type/reason/evidence ref, and
  anti-memory rejected-claim/run/source linkage.
- Slice 02 added Zod IO schemas and parse functions for memory candidate,
  promotion, application, feedback event, and anti-memory inputs. Candidate
  input now constrains kind/status, keeps external input unknown until parsed,
  requires application guidance, requires invalidation/source grounding unless
  the candidate is an explicit user preference, and defaults candidate status
  to `proposed`.
- Slice 03 added M23 MemoryRepository methods and typed read models:
  candidate get/promote/reject, record get/list, application feedback, and
  anti-memory list-by-run. Drizzle promotion is explicit and transactional:
  accepted candidates create a MemoryRecord, initial MemoryRecordVersion,
  `currentVersionId`, review metadata, and outbox event. Application feedback
  records `memory_applications` and updates positive/negative counters.
- Slice 04 added `pnpm db:smoke:memory-governance`. The smoke requires DB,
  creates a test project/run/source claim, creates and reads back a
  MemoryCandidate, promotes it into a MemoryRecord and version, records
  application feedback, creates AntiMemoryRecord, reads back linkage, and
  cleans marker rows to zero.
- Slice 05 added `krn memory candidate add`. Preview mode validates operator
  input without DB writes. Persist mode requires `KRN_DATABASE_URL`, validates
  source claim existence when `--source-claim-id` is provided, parses input
  through the schema boundary, and writes through MemoryRepository.
- Slice 06 added `krn memory candidate promote` and
  `krn memory candidate reject`. Preview mode validates review input without
  DB writes. Persist mode requires `KRN_DATABASE_URL`, promotes through
  MemoryRepository, rejects with a stored reason, prints source-claim
  `doesNotProve` limits when promoting sourced candidates, and records no
  memory application.
- Slice 07 added `krn memory record apply`. Preview mode validates application
  feedback without DB writes. Persist mode requires `KRN_DATABASE_URL`, verifies
  the MemoryRecord exists, records MemoryApplication through MemoryRepository,
  and records a MemoryFeedbackEvent for `hurt` or `stale` outcomes.
- Slice 08 added `krn memory anti add`. Preview mode validates AntiMemory input
  without DB writes. Persist mode requires `KRN_DATABASE_URL`, validates the
  invalidating SourceClaim when provided, writes AntiMemoryRecord through
  MemoryRepository, and never creates a positive MemoryRecord.
- Slice 09 updated `krn evidence capture` to emit `memoryCandidates`.
  Changed-file evidence now produces an incomplete proposal in the
  FeedbackDelta proposal surface, marks missing `applicationGuidance`,
  `sourceLineage`, and `invalidationRule`, records no MemoryCandidate row, and
  never creates a MemoryRecord automatically.
- Slice 10 updated `krn doctor` to report memory governance readiness. Doctor
  now checks memory governance schema tables, MemoryRepository read-path
  reachability when DB is configured, memory governance smoke command
  availability, runtime proof ready/unverified status, absence of runtime
  markdown memory, and absence of automatic memory mutation.
- Slice 11 dogfooded memory governance against the live local DB. It created a
  persisted execution run, source-grounded MemoryCandidate, reviewed
  MemoryRecord and version, MemoryApplication, AntiMemoryRecord, persisted
  evidence/review/feedback records, and a dogfood ledger artifact in
  `DOGFOOD.md`.
- Slice 12 ran the M23 anti-rot command set and recorded final status in
  `ANTI_ROT.md`.

Verification:

- `git status --short --branch`: passed with clean `## main...origin/main`
  before M23 ledger creation.
- Targeted reads of `GOAL.md` M23 sections: passed.
- Targeted reads of `docs/KRN_KERNEL.md`: passed.
- Targeted reads of memory DB schema, memory core types, memory IO parser,
  memory repository port, Drizzle memory adapter, mappers, feedback delta
  schema, evidence capture, smoke scripts, and root package scripts: passed.
- `pnpm typecheck`: passed.
- `git diff --check`: passed.
- Slice 01 RED: `pnpm --filter @krn/db test -- memory.test.ts` failed on
  missing M23 memory governance vocabulary and schema fields.
- `pnpm --filter @krn/db test -- memory.test.ts`: passed.
- `pnpm db:generate`: passed and generated
  `packages/db/src/migrations/0004_cool_toro.sql`.
- SQL inspection of `0004_cool_toro.sql`: passed. It adds M23 memory outcome
  and feedback event enums, extends candidate/record statuses, and adds
  candidate, version, application, feedback, and anti-memory governance fields.
- First live `pnpm db:ready` attempt exposed a Postgres enum/default ordering
  issue when a newly added enum value was used as a default in the same
  migration. The schema kept the old DB default `candidate` while accepting
  `proposed` as an explicit value.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready`:
  passed with migrations expected/applied `5/5`.
- `pnpm --filter @krn/db db:check`: passed.
- Slice 08 RED: `pnpm --filter @krn/cli test -- runCli.test.ts` failed with
  four invalid-args cases because `krn memory anti add` did not exist yet.
- `pnpm --filter @krn/cli test -- runCli.test.ts`: passed with 48 tests.
- First Slice 08 `pnpm typecheck` failed on exact optional typing for
  `sourceLineage.note`; source lineage now strips undefined notes before
  crossing into core `SourceLineageRef`.
- `pnpm typecheck`: passed.
- `pnpm --filter @krn/cli krn memory anti add --run-id execution-run-1
  --rejected-claim "Markdown files are KRN runtime memory" --reason "Files can
  be export/audit/seed/source bank, not Memory Core"
  --invalidated-by-source-claim-id source-claim-1`: passed. The report showed
  no DB writes, rejectedClaim, reason, invalidating source claim, confidence
  `90`, no MemoryRecord created, and anti-memory not positive memory.
- `pnpm --filter @krn/cli krn memory anti add --help`: passed.
- `git diff --check`: passed.
- `pnpm --filter @krn/db db:check`: passed.
- `pnpm test`: passed.
- `pnpm typecheck`: passed.
- `pnpm test`: passed.
- `git diff --check`: passed.
- Slice 02 RED: `pnpm --filter @krn/schema test` failed on missing M23 parser
  exports and missing `proposed` candidate status default.
- `pnpm --filter @krn/schema test`: passed with 8 tests.
- `pnpm typecheck`: passed.
- Slice 03 RED: `pnpm --filter @krn/db test` failed on missing M23 repository
  methods, missing mapper fields, and missing `mapMemoryApplication`.
- `pnpm --filter @krn/db test`: passed with 5 test files and 15 tests.
- `pnpm typecheck`: passed.
- `pnpm --filter @krn/db db:check`: passed.
- `pnpm test`: passed.
- `git diff --check`: passed.
- Slice 04 RED: targeted DB/CLI tests failed on missing
  `runMemoryGovernanceSmokeCheck` export and missing
  `krn db smoke memory-governance` routing.
- `pnpm --filter @krn/db test -- memoryGovernanceSmoke.test.ts`: passed.
- `pnpm --filter @krn/cli test -- runCli.test.ts`: passed with 33 tests.
- `pnpm typecheck`: passed.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:smoke:memory-governance`: passed. Runtime proof included candidate
  readback `matched`, reviewed status `accepted`, memory record readback
  `matched`, run anti-memory records `1`, project memory records `1`, outbox
  events `2`, and cleanup remaining marker count `0`.
- `pnpm --filter @krn/db db:check`: passed.
- `pnpm test`: passed.
- Slice 05 RED: `pnpm --filter @krn/cli test -- runCli.test.ts` failed with
  three invalid-args cases because `krn memory candidate add` did not exist
  yet.
- `pnpm --filter @krn/cli test -- runCli.test.ts`: passed with 36 tests.
- `pnpm typecheck`: passed.
- `pnpm test`: passed.
- `pnpm --filter @krn/cli krn memory candidate add --run-id execution-run-1
  --kind architecture-boundary --content "Source graph should use Postgres
  edge tables first" --source-claim-id source-claim-1 --confidence medium
  --application-guidance "Use when deciding whether to add a separate graph DB"
  --invalidation-rule "Revisit when graph traversal exceeds Postgres edge-table
  performance"`: passed. The report showed no DB writes, kind `constraint`,
  inputKind `architecture-boundary`, status `proposed`, confidence `70`,
  runId `execution-run-1`, and sourceClaimId `source-claim-1`.
- `pnpm --filter @krn/db db:check`: passed.
- Slice 06 RED: `pnpm --filter @krn/cli test -- runCli.test.ts` failed with
  four invalid-args cases because `krn memory candidate promote/reject` did
  not exist yet.
- `pnpm --filter @krn/cli test -- runCli.test.ts`: passed with 40 tests.
- `pnpm typecheck`: passed.
- `git diff --check`: passed.
- `pnpm test`: passed.
- `pnpm --filter @krn/db db:check`: passed.
- `pnpm --filter @krn/cli krn memory candidate promote --candidate-id
  memory-candidate-1 --reviewer operator --decision accepted`: passed. The
  report showed no DB writes, accepted review, no MemoryRecord created, and no
  memory application recorded.
- `pnpm --filter @krn/cli krn memory candidate reject --candidate-id
  memory-candidate-1 --reviewer operator --reason "No source mechanism tied
  the claim to a KRN decision"`: passed. The report showed no DB writes,
  rejected review, reason output, no MemoryRecord created, and no memory
  application recorded.
- `pnpm --filter @krn/cli krn memory candidate promote --help` and
  `pnpm --filter @krn/cli krn memory candidate reject --help`: passed.
- Slice 07 RED: `pnpm --filter @krn/cli test -- runCli.test.ts` failed with
  four invalid-args cases because `krn memory record apply` did not exist yet.
- Slice 07 RED: `pnpm --filter @krn/db test -- DrizzleMemoryRepository.test.ts`
  failed because `DrizzleMemoryRepository.createMemoryFeedbackEvent` did not
  exist yet.
- `pnpm --filter @krn/cli test -- runCli.test.ts`: passed with 44 tests.
- `pnpm --filter @krn/db test -- DrizzleMemoryRepository.test.ts`: passed with
  6 test files and 16 tests.
- `pnpm typecheck`: passed.
- `pnpm --filter @krn/cli krn memory record apply --run-id execution-run-1
  --memory-id memory-record-1 --outcome helped --notes "Guided M23 decision to
  avoid a separate graph DB"`: passed. The report showed no DB writes and no
  feedback event.
- `pnpm --filter @krn/cli krn memory record apply --run-id execution-run-1
  --memory-id memory-record-1 --outcome stale --notes "Graph traversal now
  exceeds Postgres edge-table performance"`: passed. The report showed no DB
  writes and that a feedback event would be recorded.
- `pnpm --filter @krn/cli krn memory record apply --help`: passed.
- `git diff --check`: passed.
- `pnpm test`: passed.
- `pnpm --filter @krn/db db:check`: passed.
- Slice 09 RED: `pnpm --filter @krn/cli test -- runCli.test.ts` failed on
  missing `memoryCandidates` output and empty persisted
  `FeedbackDelta.memoryCandidates`.
- `pnpm --filter @krn/cli test -- runCli.test.ts`: passed with 48 tests.
- `pnpm typecheck`: passed.
- `pnpm test`: passed.
- First `pnpm db:smoke:harness-evidence` attempt failed because
  `KRN_DATABASE_URL` was not configured.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:smoke:harness-evidence`: passed. The report showed evidence bundle,
  review assessment, feedback delta, run events `2`, cleanup remaining marker
  count `0`, and `Harness evidence smoke: passed`.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter
  @krn/cli krn plan --task "M23.09 evidence capture memory candidate
  verification" --persist`: passed and created execution run
  `14af107b-f3c9-4d7e-a97a-83a1326f8f56`.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter
  @krn/cli krn evidence capture --run-id
  14af107b-f3c9-4d7e-a97a-83a1326f8f56 --persist`: passed. The report showed
  `memoryCandidates`, incomplete status, missing
  `applicationGuidance, sourceLineage, invalidationRule`, no MemoryCandidate
  row created, no MemoryRecord created, and persisted evidence/review/feedback
  IDs.
- `git diff --check`: passed.
- Slice 10 RED: `pnpm --filter @krn/cli test -- runCli.test.ts` failed because
  `krn doctor` did not report memory governance checks and
  `deriveMemoryGovernanceReadiness` was missing.
- `pnpm --filter @krn/cli test -- runCli.test.ts`: passed with 49 tests.
- `pnpm typecheck`: passed.
- `pnpm --filter @krn/cli krn doctor`: passed. The report showed memory
  governance schema/read path skipped because DB was not configured, memory
  governance smoke available, runtime markdown memory absent, automatic memory
  mutation absent, and memory governance readiness preview-only.
- `pnpm test`: passed.
- `git diff --check`: passed.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:smoke:memory-governance`: passed with memory candidate readback matched,
  reviewed status `accepted`, memory record readback matched, application,
  anti-memory, outbox events `2`, cleanup remaining marker count `0`, and
  `Memory governance smoke: passed`.
- `pnpm --filter @krn/db db:check`: passed.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter
  @krn/cli krn doctor`: passed. The report showed memory governance schema
  `ready (7/7 tables present)`, MemoryRepository read path `reachable`, smoke
  command available, runtime markdown memory absent, automatic memory mutation
  absent, and memory governance runtime proof `unverified`. This is expected
  until Slice 11 dogfoods durable memory records because the smoke cleans its
  marker rows to zero.
- Slice 11 source selection query found M22 SourceClaim
  `212815bc-477c-4985-8992-31825f5c5897`.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter
  @krn/cli krn plan --task "promote reviewed memory from KRN evidence"
  --persist`: passed and created execution run
  `291bc2c4-7b02-46e7-9b7c-3980fadb9b34`.
- `krn memory candidate add --persist`: passed and created MemoryCandidate
  `221e9838-0cad-42be-b1ec-d8484a8dd14a`.
- `krn memory candidate promote --persist`: passed and created MemoryRecord
  `7dda35fd-b89d-4bd4-94bd-7937022d99e7`; source limits printed the M22
  `doesNotProve` clause.
- `krn memory record apply --persist`: passed and created MemoryApplication
  `8fb759f3-a49d-4999-ad4f-5be1ef8b3481`.
- `krn memory anti add --persist`: passed and created AntiMemoryRecord
  `7cb45aea-756a-4e70-a855-cf766c41cf22`.
- `krn evidence capture --run-id
  291bc2c4-7b02-46e7-9b7c-3980fadb9b34 --persist`: passed and created
  EvidenceBundle `7c0b5701-2f08-495e-992c-3c7eb5e71733`,
  ReviewAssessment `e698b9b5-b403-48ca-8ea0-ca9e8ca5b5c7`, and
  FeedbackDelta `0bf53a6b-f383-49f0-a87d-648679b47086`.
- Runtime DB readback confirmed MemoryRecordVersion
  `5394b391-5e9c-411b-8acd-996cea7c04a9` for the promoted record.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:smoke:memory-governance`: passed after dogfood records existed.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter
  @krn/cli krn doctor`: passed with memory governance runtime proof and
  readiness `ready`.
- Slice 12 `git status --short --branch`: passed with clean
  `## main...origin/main` before docs updates.
- Slice 12 `git log --oneline -12`: passed and showed M23 commits from
  inventory through dogfood.
- `pnpm typecheck`: passed.
- `pnpm test`: passed.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter
  @krn/cli krn doctor`: passed with memory governance readiness ready.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready`:
  passed with migrations expected/applied `5/5` and pgvector available.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke`:
  passed.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:smoke:harness-plan`: passed with cleanup remaining marker count `0`.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:smoke:harness-evidence`: passed with cleanup remaining marker count `0`.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:smoke:source-graph`: passed with cleanup remaining marker count `0`.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:smoke:memory-governance`: passed with cleanup remaining marker count `0`.

Skill gates:

- Used: `brain-store-schema` for memory governance schema/repository inventory.
- Used: `typescript-type-safety` for current core/schema/repository boundary
  inventory.
- Used: `evidence-review-loop` for FeedbackDelta and evidence capture memory
  candidate boundaries.
- Used: `superpowers:test-driven-development` because M23 implementation
  slices must use RED/GREEN.
- Used: `superpowers:verification-before-completion` before committing Slice
  05.
- Used: `superpowers:verification-before-completion` before completing Slice
  09 verification and commit.
- Used: `brain-store-schema` for memory governance readiness table and
  repository read-path checks.
- Used: `typescript-type-safety` for the new readiness report and doctor
  derivation boundaries.
- Used: `superpowers:test-driven-development` for RED/GREEN doctor tests in
  Slice 10.
- Used: `source-to-decision` to tie the dogfood MemoryCandidate to M22
  SourceClaim `212815bc-477c-4985-8992-31825f5c5897` with an explicit
  `doesNotProve` clause.
- Used: `evidence-review-loop` to record evidence, review, feedback, and the
  proof/not-proven split without automatic memory mutation.
- Used: `evidence-review-loop` for Slice 12 anti-rot evidence and handoff
  status.

Next action:

- M24: retrieval/search substrate and activation trace persistence.
