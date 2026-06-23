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
- Review still requires reading this ledger because the persisted evidence
  command statuses are too weak (`skipped`), and because the selected memory was
  only partly relevant to P7-00.

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

- Evidence capture cannot ingest actual command outcomes from this shell yet.
- The first selected context set contained useful governance warnings, but no
  direct Memory Core write-authority memory.
- Reflection generated no findings, contradictions, gaps, or candidate rows for
  this run, so it proves operational flow rather than candidate quality.

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
- It does not prove evidence capture has real command-status provenance.
- It does not prove worker runtime execution.
- It does not prove Promptfoo memory behavior.
