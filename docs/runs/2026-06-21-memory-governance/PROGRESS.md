# Progress

Goal: M23 - MemoryCandidate to reviewed MemoryRecord promotion.

Current slice: Slice 05 CLI memory candidate add complete.

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

Next action:

- Slice 06: add CLI `krn memory candidate promote/reject`.
