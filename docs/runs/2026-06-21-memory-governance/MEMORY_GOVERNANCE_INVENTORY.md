# Memory Governance Inventory

## Scope

Slice 00 inspected the current memory governance schema, migrations,
repository ports/adapters, core types, schema parse boundaries, evidence
feedback behavior, and smoke surface.

Files inspected:

- `GOAL.md`
- `docs/KRN_KERNEL.md`
- `packages/db/src/schema/memory.ts`
- `packages/db/src/schema/harness.ts`
- `packages/db/src/migrations/0001_superb_jetstream.sql`
- `packages/db/src/migrations/0002_shocking_post.sql`
- `packages/db/src/repositories/DrizzleMemoryRepository.ts`
- `packages/db/src/repositories/mappers.ts`
- `packages/db/src/repositories/mappers.test.ts`
- `packages/harness/src/repositories/memoryRepository.ts`
- `packages/core/src/memory.ts`
- `packages/core/src/feedbackDelta.ts`
- `packages/schema/src/memoryCandidate.ts`
- `packages/schema/src/index.test.ts`
- `packages/cli/src/runEvidenceCaptureCommand.ts`
- `packages/db/src/harnessEvidenceSmoke.ts`
- `packages/cli/src/runDbSmokeCommand.ts`
- `package.json`

## Existing Persisted Memory Surface

| M23 concept | Current surface | Status | Notes |
| --- | --- | --- | --- |
| `MemoryCandidate` | `memory_candidates` | exists, needs tightening | Has project, proposedBy, kind, status, summary/body, owner, confidence, application guidance, source lineage, user preference flag, rejection reason, metadata, timestamps. Missing run/evidence/feedback linkage, `proposed` status vocabulary, explicit invalidation rule, valid time fields, and reviewed decision metadata. |
| `MemoryRecord` | `memory_records` | exists, needs tightening | Has project, key, kind, status, summary/body, owner, confidence, application guidance, source lineage, user preference, valid window, invalidation fields, feedback counts, metadata. Missing `currentVersionId` and M23 status vocabulary `deprecated` instead of current `stale/superseded`. |
| `MemoryRecordVersion` | `memory_record_versions` | exists, needs tightening | Has record id, version, summary/body, owner, confidence, application guidance, source lineage, metadata, createdAt. Missing `createdFromCandidateId`, invalidation policy/rule, valid window, and direct review provenance. |
| `MemoryApplication` | `memory_applications` | exists, needs tightening | Has memoryRecordId, taskContractId, contextAssemblyId, expectedUse, outcome, metadata. M23 target needs runId, outcome enum `helped/hurt/neutral/stale`, notes, and command-facing apply behavior. |
| `MemoryFeedbackEvent` | `memory_feedback_events` | exists, needs tightening | Has memoryRecordId, feedbackDeltaId, direction, note, metadata. M23 target needs eventType `strengthened/demoted/invalidated/corrected/stale_detected`, reason, evidenceRef, and run linkage. |
| `AntiMemoryRecord` | `anti_memory_records` | exists, needs tightening | Has key, summary/body, owner, confidence, source lineage, validity, invalidation reason, metadata. M23 target needs rejectedClaim, reason, invalidatedBySourceClaimIds, appliesTo, mayRevisitWhen, runId. |
| `MemoryReviewGate` | no exact table | missing | Review gate is implied by candidate status/rejectionReason but not first-class enough for promote/reject audit. |
| memory activation traces | `memory_activation_traces` | exists, later scope | Useful for M25 activation, not the M23 promotion boundary. |

## Current Vocabulary Mismatch

Current memory candidate status:

```txt
candidate | accepted | rejected | applied
```

M23 target candidate status:

```txt
proposed | accepted | rejected | superseded
```

Current memory record status:

```txt
active | stale | invalidated | superseded
```

M23 target record status:

```txt
active | deprecated | invalidated
```

Current memory feedback direction:

```txt
positive | negative | correction
```

M23 target feedback event type:

```txt
strengthened | demoted | invalidated | corrected | stale_detected
```

Decision:

- Preserve existing vocabulary only where current activation/readback code still
  depends on it.
- Add M23 vocabulary where reviewed promotion, application, and anti-memory
  behavior need explicit semantics.
- Do not model anti-memory as a normal positive MemoryRecord.

## Current Repository Surface

Existing harness repository port:

- `createMemoryRecord(input)`
- `getMemoryRecord(id)`
- `listActiveMemory(projectId, limit)`
- `createMemoryCandidate(input)`
- `listMemoryCandidates(projectId, limit)`
- `createAntiMemoryRecord(input)`

Existing Drizzle adapter:

- Implements the methods above.
- `createMemoryRecord` also creates version `1`.
- `createMemoryCandidate` emits `memory.candidate.created` outbox event.
- Does not expose `getMemoryCandidateById`.
- Does not expose `promoteMemoryCandidate`.
- Does not expose `rejectMemoryCandidate`.
- Does not expose `getMemoryRecordById` by the M23 name.
- Does not expose `createMemoryApplication` or record application outcomes.
- Does not expose `createMemoryFeedbackEvent` in M23 event vocabulary.
- Does not expose anti-memory invalidated-by source claim linkage.

## Current Core Types

Existing:

- `MemoryRecord`
- `MemoryCandidate`
- `AntiMemoryRecord`
- `MemoryRecordKind`
- `MemoryRecordStatus`
- `MemoryCandidateStatus`
- `SourceLineageRef`

Gaps against M23:

- No `MemoryRecordVersion` core type.
- No `MemoryApplication` core type.
- No `MemoryFeedbackEvent` core type.
- No `MemoryReviewGate` or review decision type.
- `MemoryCandidate` has source lineage and application guidance but no
  invalidation rule or validity window.
- `AntiMemoryRecord` is key/summary/body-shaped, not rejectedClaim/reason-shaped.

## Current IO Schemas

Existing:

- `parseMemoryCandidateInput`
- `MemoryCandidateInputSchema`

Current parser requires:

- summary
- body
- owner
- confidence
- applicationGuidance
- sourceLineage unless `isUserPreference` is true

Missing:

- memory candidate kind
- run id / feedback delta linkage
- source claim ids
- invalidation rule
- validFrom / validUntil
- candidate add input matching CLI target behavior
- candidate promote/reject input
- memory record apply input
- anti-memory add input

## Current Evidence Feedback Behavior

`FeedbackDelta.memoryCandidates` exists as JSONB on `feedback_deltas`, and
`mapFeedbackDelta` narrows JSON values before returning domain types.

Current `krn evidence capture` persists:

- evidence bundle
- review assessment
- feedback delta
- empty `memoryCandidates`
- source decision candidates when source/decision-like files changed

M23 requires evidence capture to emit memory candidates while still preserving
the rule that MemoryRecord promotion is never automatic.

## Current Smoke / Doctor Surface

Existing smoke scripts:

- `pnpm db:smoke`
- `pnpm db:smoke:harness-plan`
- `pnpm db:smoke:harness-evidence`
- `pnpm db:smoke:source-graph`

Missing for M23:

- `pnpm db:smoke:memory-governance`
- `krn db smoke memory-governance`

Current `krn doctor` reports:

- brain store readiness
- harness persistence readiness
- source graph readiness

Missing for M23:

- memory governance schema readiness
- MemoryRepository promotion/readback readiness
- memory smoke command availability
- no memory crawler/runtime markdown memory checks specific to M23

## Schema Decision For Next Slice

M23 should not replace all existing memory tables. The smallest honest path is:

1. Keep `memory_records`, `memory_record_versions`, `memory_candidates`,
   `memory_applications`, `memory_feedback_events`, `anti_memory_records`, and
   `memory_activation_traces`.
2. Add or tighten the minimal fields needed for M23 semantics:
   - candidate run/feedback linkage;
   - invalidation rule / validity fields on candidates and versions;
   - `current_version_id` on memory records;
   - `created_from_candidate_id` on memory record versions;
   - reviewed promotion/rejection fields;
   - application run linkage and outcome enum;
   - feedback event type/reason/evidence refs;
   - anti-memory rejected claim/reason/source-claim/run linkage.
3. Keep source lineage JSONB for flexible lineage refs, but keep stable query
   fields relational where the plan requires them.
4. Do not add runtime markdown memory, crawler, dashboard, API, worker runtime,
   or separate memory/vector/graph store in M23.

## Source To Decision Mapping

source: `GOAL.md` M23
mechanism: Requires governed candidate review/promotion to MemoryRecord and
anti-memory, with explicit proof from evidence/review/feedback.
KRN implication: Existing memory tables are a foundation but not enough; M23
must add reviewed promotion and application semantics before memory can be
trusted as runtime context.
decision: Tighten the current Postgres/Drizzle memory schema and repository
surface instead of creating a new memory store.
rejection: Do not treat `FeedbackDelta.memoryCandidates` JSON or markdown docs
as runtime Memory Core.
falsifier: If M23.01 cannot add the required relational fields without breaking
existing activation/readback contracts, record an ADR before changing storage
topology.
