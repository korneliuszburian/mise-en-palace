# 2026-06-23 Memory Dogfood — MM-33

Scope: promote one reviewed KRN lesson through MemoryReviewGate and prove it is
later applied by planning context.

Non-goals: no automatic memory promotion, no reflection worker, no new DB
schema/migration, no dashboard/API/MCP/server/plugin, no source crawler, no
broad eval suite, no fuzzy anti-memory matching.

## Lesson

Implementation slice audits must include intended files, verification command
states, semantic DB snapshots, and handoff evidence before they are treated as
review gates.

## Counts Before

```text
execution_runs      14
memory_applications 1
memory_candidates   1
memory_records      1
memory_versions     1
source_claims       2
```

## Dogfood Run

Command:

```bash
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn \
  pnpm --filter @krn/cli krn plan \
  --task "MM-33 dogfood MemoryReviewGate promotion for audit semantic snapshot lesson" \
  --persist
```

Persisted IDs:

```text
taskContract: 894646cd-a3de-40ca-85a4-06115c558143
contextAssembly: 9acf6b72-0ce1-42c1-8e89-f02401b3cc25
executionRun: daafa66b-dd85-4b7c-bcf5-9ccf60c2b170
```

The initial plan assembled existing source/memory context and did not mutate
memory.

## Source Claim

Command shape:

```bash
krn source claim add ... --run-id daafa66b-dd85-4b7c-bcf5-9ccf60c2b170 --persist
```

Persisted IDs:

```text
sourceArtifact: 72800975-5927-4c7b-b801-d13c8d9debf7
sourceClaim: f0b5c9ee-01aa-41df-9268-7df3f7437068
uri: repo://commit/9df7ca3
trustTier: project-decision
supportType: decision
consumer: MM-33 memory dogfood
```

Source claim mechanism:

```text
The MM-32B CLI audit path merges explicit CLI evidence with AuditBundle
evidence, reads DB-backed memory/source/eval/observation/activation snapshots,
derives handoff state from docs/handoff files, and reports findings when
required evidence is missing.
```

Does not prove:

```text
This does not prove golden memory behavior, automatic promotion safety, fuzzy
anti-memory matching, or API/MCP/dashboard readiness.
```

## Memory Candidate

Command shape:

```bash
krn memory candidate add \
  --run-id daafa66b-dd85-4b7c-bcf5-9ccf60c2b170 \
  --kind procedure \
  --confidence high \
  --source-claim-id f0b5c9ee-01aa-41df-9268-7df3f7437068 \
  --invalidation-rule "Revisit after MM-55 rollback enforcement, MM-61 golden memory smoke cases, or a stronger AuditBundle-backed slice gate replaces manual evidence flags." \
  --persist
```

Result:

```text
memoryCandidate: 2b31845c-1e34-4e5e-9862-23d0ce12cb69
kind: procedure
status: proposed
confidence: 90
sourceClaimIds: f0b5c9ee-01aa-41df-9268-7df3f7437068
```

Application guidance:

```text
Use this when closing KRN implementation slices, especially memory/source/eval/
audit slices. Require explicit intended files, verification command outcomes,
rollback/handoff evidence, and project or retrieval identifiers for semantic DB
snapshots before treating the audit as a review gate. Abstain from claiming
semantic memory governance if only file-scan evidence is present.
```

## Promotion

Command:

```bash
krn memory candidate promote \
  --candidate-id 2b31845c-1e34-4e5e-9862-23d0ce12cb69 \
  --reviewer "MM-33 operator review" \
  --decision accepted \
  --evidence-reviewed-ref "docs/plans/memory-ideal-state/PLAN.md#MM-32B;commit:9df7ca3;final-audit-slice-pass" \
  --persist
```

Result:

```text
Review gate: passed
memoryCandidate: 2b31845c-1e34-4e5e-9862-23d0ce12cb69
memoryRecord: 41d1a2ef-3578-4e45-947f-42c6739796de
reviewer: MM-33 operator review
evidenceReviewedRef: docs/plans/memory-ideal-state/PLAN.md#MM-32B;commit:9df7ca3;final-audit-slice-pass
Reviewed source claims:
sourceClaimId: f0b5c9ee-01aa-41df-9268-7df3f7437068
```

## Memory Record Proof

Persisted MemoryRecord:

```text
id: 41d1a2ef-3578-4e45-947f-42c6739796de
status: active
kind: procedure
confidence: 90
owner: memory-governance
positiveFeedbackCount: 1
negativeFeedbackCount: 0
sourceLineage: [{"sourceId": "f0b5c9ee-01aa-41df-9268-7df3f7437068"}]
invalidationRule: Revisit after MM-55 rollback enforcement, MM-61 golden memory smoke cases, or a stronger AuditBundle-backed slice gate replaces manual evidence flags.
```

Review-gate metadata:

```text
reviewGate.evidenceReviewedRef: docs/plans/memory-ideal-state/PLAN.md#MM-32B;commit:9df7ca3;final-audit-slice-pass
reviewGate.sourceClaimIds: f0b5c9ee-01aa-41df-9268-7df3f7437068
reviewGate.reviewedSourceClaimIds: f0b5c9ee-01aa-41df-9268-7df3f7437068
createdFromCandidateId: 2b31845c-1e34-4e5e-9862-23d0ce12cb69
```

Persisted MemoryRecordVersion:

```text
id: 9200736c-13ac-4ca6-bde9-dc494519cc17
memoryRecordId: 41d1a2ef-3578-4e45-947f-42c6739796de
version: 1
createdFromCandidateId: 2b31845c-1e34-4e5e-9862-23d0ce12cb69
```

## Later Plan Application

Command:

```bash
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn \
  pnpm --filter @krn/cli krn plan \
  --task "close a memory implementation slice with audit semantic snapshots and handoff evidence" \
  --persist
```

Persisted IDs:

```text
taskContract: cae990a8-ad6e-4457-af27-d63988742b59
contextAssembly: 94e890af-a45d-4311-aca0-150950ce848d
executionRun: 54f6e3e0-d634-4b61-a67c-cde5d558f822
```

Context included the promoted memory:

```text
memory_record:41d1a2ef-3578-4e45-947f-42c6739796de
reason=Memory: For implementation slices, run krn audit slice with explicit
intended files, verification command states, handoff evidence, and semantic DB
snapshots when memory/source/eval/observation governance proof matters; treat a
file-only audit as insufficient governance proof.
```

Interpretation: the promoted memory was applied by the next matching KRN plan
instead of being merely stored. No abstention was needed for this matching
task.

## Application Record

Command:

```bash
krn memory record apply \
  --run-id 54f6e3e0-d634-4b61-a67c-cde5d558f822 \
  --memory-id 41d1a2ef-3578-4e45-947f-42c6739796de \
  --outcome helped \
  --task-contract-id cae990a8-ad6e-4457-af27-d63988742b59 \
  --context-assembly-id 94e890af-a45d-4311-aca0-150950ce848d \
  --persist
```

Result:

```text
memoryApplication: 55a8e695-8665-45da-a19e-b8be578708ea
memoryRecord: 41d1a2ef-3578-4e45-947f-42c6739796de
runId: 54f6e3e0-d634-4b61-a67c-cde5d558f822
outcome: helped
```

## Counts After

```text
execution_runs      16
memory_applications 2
memory_candidates   2
memory_records      2
memory_versions     2
source_claims       3
```

## Assessment

- MemoryCandidate was promoted only through MemoryReviewGate.
- The promoted MemoryRecord has lineage, linked SourceClaim, application
  guidance, confidence, owner, invalidation strategy, review-gate metadata, and
  an auditable MemoryRecordVersion.
- A later matching plan selected the memory into context.
- Memory application feedback recorded the use as `helped`.
- This does not prove golden behavior, fuzzy anti-memory, API/MCP/dashboard, or
  automatic promotion safety.
