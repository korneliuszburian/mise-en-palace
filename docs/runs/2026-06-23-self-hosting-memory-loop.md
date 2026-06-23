# 2026-06-23 Self-Hosting Memory Loop

Scope: P7-00 first governed self-hosting loop for the canonical KRN reset.

Objective:

Use KRN to improve KRN and record whether selected memory reduced review
burden.

## Environment

The first readiness attempt used the current shell without
`KRN_DATABASE_URL` and failed as expected:

```text
Postgres config: missing KRN_DATABASE_URL
Brain store readiness: blocked (database not configured)
```

The local brain store was then started from the repo runbook:

```sh
docker compose up -d krn-postgres
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready
```

Observed:

```text
Postgres config: configured
Postgres: reachable
Migrations expected: 11
Migrations applied: 11
Migrations: applied
pgvector: available
Brain store readiness: ready
```

## Flow

Plan:

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn \
  pnpm --filter @krn/cli krn plan \
  --task "seal Memory Core write authority" \
  --persist
```

Observed:

```text
Project ID: a704c6fa-8b15-4d77-a748-1eb6d5d9f13b
Persistence: enabled (Postgres, explicit --persist)
Context included: 6
Context excluded: 0
Context status: assembled
executionRun: 00d74890-b18d-498b-90bf-f172c26cffb6
```

Selected memory/source context:

```text
sourceClaims:
- f0b5c9ee-01aa-41df-9268-7df3f7437068
- d5ea7024-7d7a-4291-a050-4de1fbebf605
- 3b5540bc-2307-4578-9abb-5bee0805bbdd
- 212815bc-477c-4985-8992-31825f5c5897

memoryRecords:
- 41d1a2ef-3578-4e45-947f-42c6739796de
- 7dda35fd-b89d-4bd4-94bd-7937022d99e7
```

Verification before evidence capture:

```sh
pnpm typecheck
pnpm test
```

Observed:

```text
pnpm typecheck: passed across core, schema, harness, workers, codex-adapter, db, cli
pnpm test: passed across core 8/39, schema 3/25, harness 18/89, workers 1/4,
codex-adapter 3/7, db 24/67, cli 25/142
```

Evidence:

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn \
  pnpm --filter @krn/cli krn evidence capture \
  --run-id 00d74890-b18d-498b-90bf-f172c26cffb6 \
  --persist
```

Observed:

```text
Changed files: none
Diff risk: low
Memory mutation: none
evidenceBundle: 29aaedd2-a005-4f9b-afa3-15d305e779c6
reviewAssessment: ff87f61f-386b-4507-baae-d322e6cbf227
feedbackDelta: 30a815e9-0055-4129-b99c-24662945dc96
```

Important gap: `krn evidence capture` persisted default command rows as
`skipped` even though `pnpm typecheck` and `pnpm test` were run immediately
before capture in this shell. The local command outputs are stronger evidence
than the persisted command status fields for this run.

EVI follow-up: this gap is addressed for future captures by the Evidence
Integrity slices:

- EVI-00 models command status/provenance and generated `doesNotProve`
  semantics.
- EVI-01 adds explicit `--verification <command=status>` operator-reported
  command evidence.
- EVI-02 normalizes command provenance at the DB repository write boundary and
  narrows historical JSON rows at readback.
- EVI-03 adds a CLI regression proof for plan/evidence/observe/reflect
  provenance without MemoryRecord mutation or automatic candidate rows.

The original persisted EvidenceBundle above remains historical evidence and
was not rewritten or migrated.

Observe:

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn \
  pnpm --filter @krn/cli krn observe \
  --run 00d74890-b18d-498b-90bf-f172c26cffb6 \
  --persist
```

Observed:

```text
Observer input items: 5
Redactions: 0
Truncations: 0
Memory mutation: none
MemoryRecord created: no
Observation group: 1ef45c13-f12c-4fb9-a9a8-4693f587333c
Observation items: 5
```

Reflect:

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn \
  pnpm --filter @krn/cli krn reflect \
  --scope run:00d74890-b18d-498b-90bf-f172c26cffb6 \
  --persist
```

Observed:

```text
Observations selected: 5
Source claims selected: 0
Anti-memory records selected: 0
Findings: 0
Contradictions: 0
Gaps: 0
Candidate generation status: ready
Candidate rows written: no
Memory mutation: none
MemoryRecord created: no
Reflection record: a3c275ef-6aaf-4db6-a09a-44c62c229724
```

## Review Burden

Before:

- Without KRN, the reviewer would need to infer whether DB persistence,
  activation context, evidence capture, observation, and reflection all worked
  from separate commands and unstated assumptions.

After:

- The persisted run ties the plan, execution run, evidence bundle, observation
  group, feedback delta, and reflection record together under one run ID.
- Review still requires reading this ledger because this historical run's
  persisted evidence command statuses are too weak (`skipped`), and because the
  selected memory was only partly relevant to P7-00.

Assessment:

- Reduced review burden for traceability: yes.
- Reduced review burden for command proof: partial only.
- Reduced review burden for choosing implementation direction: weak; selected
  memory emphasized governance proof and source graph storage, not the
  self-hosting objective directly.

## Candidates

Anti-memory candidates:

- Do not treat `krn evidence capture --persist` command rows as proof that
  verification commands passed unless the command status provenance is real.

Eval candidates:

- Add a self-hosting regression case that fails if a persisted run cannot be
  planned, evidence-captured, observed, and reflected with MemoryRecord
  mutation still reported as `no`.

Gaps:

- Historical P7 command rows remain weak because the original EvidenceBundle
  was not rewritten.
- Future evidence capture can ingest explicit operator-reported command
  outcomes through `--verification <command=status>` and persists typed command
  provenance.
- The first selected context set contained useful governance warnings, but no
  direct Memory Core write-authority memory.
- Reflection generated no findings, contradictions, gaps, or candidate rows for
  this run, so it proves operational flow rather than candidate quality.

## Activation Relevance Review

This review uses the historical run ledger above plus DB-backed expansion of
the selected context IDs from the P7 execution run.

DB proof:

```sh
docker compose up -d krn-postgres
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready
psql postgres://krn:krn@localhost:54329/krn \
  -c "<join execution_runs -> context_assemblies -> context_items>"
```

Observed:

```text
executionRun: 00d74890-b18d-498b-90bf-f172c26cffb6
harnessPlan: b0d24228-bbbb-4a32-a737-85cfe444e45d
contextAssembly: 72fdc214-54cb-4979-91ca-18551e4833f4
inclusionCount: 6
exclusionCount: 0
status: assembled
```

Review table:

| included item | expected use | actual use | result | action | reason |
| --- | --- | --- | --- | --- | --- |
| `sourceClaim:f0b5c9ee-01aa-41df-9268-7df3f7437068` | Treat implementation-slice audit evidence as a review gate only when intended files, verification command states, semantic DB snapshots, and handoff evidence exist. | Helped expose the exact command-provenance gap later repaired by EVI-00..EVI-04, but it also carried obsolete `krn audit` framing. | helped | demote | Keep the evidence-integrity lesson, but demote/remove the audit-surface wording during source/memory cleanup. |
| `memoryRecord:41d1a2ef-3578-4e45-947f-42c6739796de` | Use explicit intended files, verification outcomes, rollback/handoff evidence, and project/retrieval IDs before treating memory/source/eval/observation governance proof as sufficient. | Directly helped avoid claiming semantic governance from file-only evidence and matches the EVI repair path. It did not directly answer Memory Core write authority. | helped | strengthen | Strengthen around evidence provenance and semantic DB proof; remove `krn audit slice` naming if this memory is updated. |
| `sourceClaim:d5ea7024-7d7a-4291-a050-4de1fbebf605` | Inspect source-graph health for decorative support, stale accepted claims, unlinked accepted claims, and rejected-claim decision support. | Adjacent source-governance context; it did not materially reduce the P7 Memory Core write-authority decision burden. | neutral | keep | Not harmful, but not a strong match for the task. Do not strengthen for self-hosting write-authority tasks. |
| `memoryRecord:7dda35fd-b89d-4bd4-94bd-7937022d99e7` | Keep source graph decisions Postgres-backed relational edges before a separate graph database or crawler. | Useful architectural constraint for source graph/storage direction, but mostly irrelevant to sealing Memory Core write authority. | neutral | keep | Correct constraint; wrong emphasis for this objective. Activation should rank it lower for write-authority tasks. |
| `sourceClaim:3b5540bc-2307-4578-9abb-5bee0805bbdd` | Persist `SourceArtifact` and `SourceClaim` for source claim add. | Confirmed source persistence doctrine only. It did not help the P7 write-authority task. | neutral | demote | Demote for this task family; keep for source-claim CLI/storage tasks. |
| `sourceClaim:212815bc-477c-4985-8992-31825f5c5897` | Model source graph with Postgres-backed relational edges before any separate graph database or crawler. | Reinforced the Postgres/source graph architecture, but did not reduce Memory Core write-authority review burden. | neutral | keep | Still valid architecture context; not direct evidence for Memory Core authority. |

Decision:

- Keep all six selected items as historical context for this run.
- Do not create an anti-memory candidate from this review.
- Do not add a ranking subsystem or hard-coded recall from this evidence.
- Create no new audit layer. The useful lesson is evidence provenance and
  semantic DB proof, not `krn audit` as a product surface.
- Carry the real issue into `C0-01`: make the same self-hosting task retrieve
  directly relevant Memory Core write-authority context if such memory exists.

What this proves:

- The P7 selected context was not dangerous or stale based on DB-backed row
  expansion.
- It was only partly useful: it strongly supported evidence-integrity caution,
  but did not directly reduce the Memory Core write-authority decision burden.

What this does not prove:

- It does not prove activation quality in general.
- It does not prove the selected source claims were the best possible source
  claims.
- It does not prove whether direct write-authority memory existed in the store
  at plan time, only that the selected context did not include it.

## Evidence Provenance Repair Closure

The P7 gap was closed for future runs by code and tests after this ledger was
first written. The historical persisted rows were left unchanged.

What changed:

- `EvidenceCommand` now records `passed | failed | skipped | missing | not_run`
  and explicit provenance:
  `default_template | operator_reported | captured_output_file | command_runner | external_log`.
- Default command rows render as weak `not_run` / `default_template` evidence
  and say what they do not prove.
- `krn evidence capture` accepts explicit verification input, for example:

```sh
krn evidence capture \
  --run-id <id> \
  --verification "pnpm typecheck=passed" \
  --verification "pnpm test=passed" \
  --persist
```

- DB persistence uses the existing `evidence_bundles.commands` JSONB field,
  but normalizes command provenance before insert and narrows raw JSON on
  readback.
- A CLI integration regression now proves that explicit command provenance
  reaches observe payloads and that observe/reflect still report no MemoryRecord
  mutation and no automatic candidate rows.

Commands run for the repair:

```sh
pnpm --filter @krn/core test -- evidenceBundle
pnpm --filter @krn/schema test -- index
pnpm --filter @krn/db test -- mappers
pnpm --filter @krn/db test -- DrizzleHarnessRunRepository
pnpm --filter @krn/db test
pnpm --filter @krn/cli test -- parseEvidenceArgs
pnpm --filter @krn/cli test -- runCli -t "explicit verification"
pnpm --filter @krn/cli test -- runCli -t "guards self-hosting evidence provenance"
pnpm --filter @krn/harness test -- golden
pnpm --filter @krn/cli test -- runCli
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready
pnpm typecheck
pnpm test
git diff --check
```

What remains unproved:

- This historical P7 EvidenceBundle row was not migrated, so its persisted
  command rows remain weak historical evidence.
- The regression proof is fixture-backed CLI behavior, not a live end-to-end DB
  replay of P7.
- Evidence provenance repair does not prove candidate quality, activation
  relevance, worker runtime behavior, dashboard/read-model usefulness, or
  Promptfoo memory behavior.

## Reflection Candidate Path Closure

EVI-07 turns the reflection candidate path into a stricter staging boundary.

What changed:

- Reflection candidate proposals now carry typed `evidence` with provenance,
  evidence refs, and `doesNotProve`.
- Candidate generation is blocked when candidate evidence is missing or when a
  high-confidence memory candidate is backed only by `default_template` command
  evidence.
- `writeReflectionCandidates` still writes candidate rows only. It does not
  create or promote MemoryRecord rows.
- Existing stores receive the typed evidence through the explicit
  `reflectionCandidateEvidence` metadata key.
- DB reflection readback preserves candidate proposal arrays from
  `reflection_records.output` instead of silently dropping them.

Commands run:

```sh
pnpm --filter @krn/core test -- reflection
pnpm --filter @krn/harness test -- reflectionCandidateWriter goldenObservationReflectionBehavior
pnpm --filter @krn/db test -- DrizzleReflectionRepository
pnpm typecheck
```

What remains unproved:

- This does not prove the full candidate -> MemoryReviewGate -> MemoryRecord ->
  activation loop. That is owned by EVI-08.
- This does not prove reflection candidate quality.

## Candidate Review Loop Closure

EVI-08 proves the next small governed loop after reflection staging.

What changed:

- `MemoryReviewGate` now requires candidate evidence provenance before
  promotion.
- Missing candidate evidence and weak `default_template` provenance are rejected
  before `promoteReviewedMemoryCandidate` is called.
- Review-gate metadata now carries the reviewed candidate evidence together
  with `evidenceReviewedRef` and reviewed source claim IDs.
- A harness behavior proof promotes a reviewed, source-grounded
  MemoryCandidate into MemoryRecord and then shows that MemoryRecord can
  influence later activation.
- Anti-memory stays separate: rejected claims remain first-class activation
  blockers, not automatic side effects of memory promotion.

Commands run:

```sh
pnpm --filter @krn/harness test -- memory
pnpm --filter @krn/cli test -- runCli -t "memory candidate promote"
pnpm --filter @krn/cli test -- runCli
pnpm typecheck
pnpm test
git diff --check
```

What remains unproved:

- This does not prove candidate quality.
- This does not prove automatic anti-memory creation for rejected candidates.
- This does not prove the loop against live Postgres in this slice.

## Promptfoo / GoldenTask Boundary Closure

EVI-09 closes the self-hosting eval-boundary gap without making Promptfoo a
behavior authority.

What changed:

- `GoldenBehaviorProof` now carries explicit provenance and `doesNotProve`.
- `runGoldenTaskFixtures` accepts `krn_behavior_execution` proof for behavior
  gates.
- Promptfoo result rows are mapped as `promptfoo_integration_smoke`.
- `promptfoo_integration_smoke` rows are rejected as GoldenTask behavior proof
  even when the Promptfoo eval passes.

Commands run:

```sh
pnpm --filter @krn/harness test -- golden
pnpm exec promptfoo --version
pnpm eval:promptfoo:smoke
pnpm typecheck
```

Observed:

- harness golden tests passed: 17 files, 73 tests;
- Promptfoo version was `0.121.17`;
- Promptfoo smoke passed 2/2 and emitted `doesNotExecuteKrnBehavior=true`;
- Promptfoo wrote `.local-lab/promptfoo/krn-golden-smoke-results.jsonl`;
- Promptfoo printed `telemetry.shutdown() timed out during shutdown` after the
  successful eval, but exited with code 0;
- typecheck passed.

What remains unproved:

- This does not prove self-hosting behavior through Promptfoo.
- This does not prove Memory Brain readiness.
- This does not prove candidate quality.
- This does not prove the loop against live Postgres in this slice.

## Rollback

This run created persisted local DB records and this checked-in run ledger.
Rollback for repository state is a focused revert of the documentation commit.
Rollback for local runtime state is to discard the local Postgres volume or
remove the run-scoped records in a dedicated cleanup script; no cleanup script
was run in this slice.

## What This Proves

- The local Postgres brain store was reachable in this shell with 11/11
  migrations applied and pgvector available.
- `krn plan --persist` created a persisted execution run.
- `krn evidence capture --persist` created persisted evidence/review/feedback
  rows for that run.
- `krn observe --persist` created observation staging for that run without
  MemoryRecord mutation.
- `krn reflect --persist` created a ReflectionRecord for that run without
  MemoryRecord mutation or candidate row writes.

## What This Does Not Prove

- It does not prove automatic memory promotion.
- It does not prove candidate quality.
- This historical run does not prove its own persisted command-status
  provenance, because the original EvidenceBundle rows were left unchanged.
- It does not prove candidate quality or activation relevance after provenance
  repair.
- It does not prove worker runtime execution.
- It does not prove Promptfoo memory behavior.
