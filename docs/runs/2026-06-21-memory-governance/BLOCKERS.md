# Blockers

Hard blockers:

- None through Slice 08.

Known unproven M23 behavior:

- `krn evidence capture` does not yet emit memory candidates.
- `krn doctor` does not yet report memory governance readiness.
- M23 dogfood is not recorded yet.
- M23 final anti-rot and handoff are not recorded yet.

Explicit non-blockers:

- No dashboard UI exists by design.
- No API exists by design.
- No MCP server exists by design.
- No memory crawler exists by design.
- No broad memory worker exists by design.
- No vector embedding pipeline exists yet by design.
- No `.krn` runtime truth exists by design.
- No separate vector, graph, search, or queue store exists by design.
- No runtime markdown memory exists by design.

Closed in Slice 00:

- Current memory governance schema/repository/type/CLI/evidence surface was
  inventoried in `MEMORY_GOVERNANCE_INVENTORY.md`.

Closed in Slice 01:

- Minimal memory governance schema fields now exist for M23 candidate
  run/feedback/source lineage, review, validity, record current version,
  version provenance, application outcome, feedback events, and anti-memory
  rejected-claim/source/run linkage.

Closed in Slice 02:

- Memory governance IO schemas now exist for candidate, promotion,
  application, feedback event, and anti-memory inputs.

Closed in Slice 03:

- MemoryRepository and DrizzleMemoryRepository now expose M23 candidate
  readback, promotion, rejection, record readback/listing, application
  feedback, anti-memory creation, and anti-memory list-by-run methods.
- Mappers now return typed M23 memory read models instead of dropping
  run/source/review/invalidation fields.

Closed in Slice 04:

- `pnpm db:smoke:memory-governance` now proves candidate creation, explicit
  promotion, record/version readback, application feedback, anti-memory
  linkage, and cleanup to zero marker rows against the local DB.

Closed in Slice 05:

- `krn memory candidate add` now previews validated MemoryCandidate input
  without DB writes and can persist through MemoryRepository with source-claim
  existence validation.

Closed in Slice 06:

- `krn memory candidate promote` now previews accepted review input without DB
  writes and can persist through MemoryRepository while surfacing source-claim
  `doesNotProve` limits.
- `krn memory candidate reject` now previews rejected review input without DB
  writes and can persist rejection reviewer/reason through MemoryRepository.

Closed in Slice 07:

- `krn memory record apply` now previews application feedback without DB writes
  and can persist MemoryApplication through MemoryRepository.
- `hurt` and `stale` application outcomes now create MemoryFeedbackEvent
  records linked back to the MemoryApplication evidence ref.

Closed in Slice 08:

- `krn memory anti add` now previews AntiMemory input without DB writes and can
  persist AntiMemoryRecord through MemoryRepository.
- Anti-memory persist validates the invalidating SourceClaim when
  `--invalidated-by-source-claim-id` is provided and does not create a positive
  MemoryRecord.
