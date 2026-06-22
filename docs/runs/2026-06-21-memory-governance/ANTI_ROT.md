# Anti-Rot

Slice: M23.12 - Memory governance anti-rot and handoff.

Commands:

- `git status --short --branch`: passed with clean `## main...origin/main`
  before Slice 12 docs updates.
- `git log --oneline -12`: passed and showed M23 commits from inventory
  through dogfood.
- `pnpm typecheck`: passed across workspace projects.
- `pnpm test`: passed across workspace projects.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter
  @krn/cli krn doctor`: passed with memory governance readiness ready.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready`:
  passed with migrations expected/applied `5/5` and pgvector available.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke`:
  passed with project readback matched and cleanup completed.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:smoke:harness-plan`: passed with readback matched, run events `1`, and
  cleanup remaining marker count `0`.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:smoke:harness-evidence`: passed with evidence/review/feedback counts `1`
  and cleanup remaining marker count `0`.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:smoke:source-graph`: passed with source claim readback matched, source
  decision edge, source rejection, outbox events `2`, and cleanup remaining
  marker count `0`.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:smoke:memory-governance`: passed with memory candidate readback matched,
  reviewed status `accepted`, memory record readback matched, memory
  application, anti-memory record, outbox events `2`, and cleanup remaining
  marker count `0`.

M23 complete evidence:

- Memory candidates persist through `krn memory candidate add --persist`.
- Explicit promotion creates MemoryRecord and MemoryRecordVersion.
- Memory application feedback persists through `krn memory record apply
  --persist`.
- Anti-memory persists through `krn memory anti add --persist` without creating
  a positive MemoryRecord.
- Evidence capture persists EvidenceBundle, ReviewAssessment, and
  FeedbackDelta without automatic memory mutation.
- Memory governance smoke passes and cleans marker rows to zero.
- Doctor reports memory governance schema ready, MemoryRepository reachable,
  runtime proof ready, runtime markdown memory absent, automatic memory
  mutation absent, and memory governance readiness ready.

Residual risk:

- Retrieval quality, ranking quality, source graph traversal performance, and
  activation into future context assemblies are not proven by M23. They are
  later milestone concerns.
