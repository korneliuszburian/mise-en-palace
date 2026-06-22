# 2026-06-22 Reflection Dogfood

Scope: MM-25 reflection over MM-17 observation data.

Command:

```bash
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn \
  pnpm --filter @krn/cli krn reflect \
  --scope project:a704c6fa-8b15-4d77-a748-1eb6d5d9f13b \
  --persist
```

Before:

```text
before_reflection_records=3
before_memory_records=1
before_memory_candidates=1
```

Output:

```text
KRN Reflect
Persistence: enabled (Postgres, explicit --persist)
Scope: project:a704c6fa-8b15-4d77-a748-1eb6d5d9f13b
Project ID: a704c6fa-8b15-4d77-a748-1eb6d5d9f13b
Observations selected: 5
Source claims selected: 0
Anti-memory records selected: 1
Findings: 0
Contradictions: 0
Gaps: 0
Candidate generation status: ready
Candidate rows written: no
Memory mutation: none
MemoryRecord created: no
Reflection record: dbe98bf2-e9e0-4aa6-89b0-05b30082a60f
```

After:

```text
after_reflection_records=4
after_memory_records=1
after_memory_candidates=1
```

Persisted output array counts:

```text
findings=0
contradictions=0
gaps=0
memoryCandidates=0
sourceClaimCandidates=0
antiMemoryCandidates=0
evalCandidates=0
```

Assessment:

- Reflection can read the MM-17 observation project scope and persist a
  ReflectionRecord.
- Contradiction/gap/candidate surfaces are visible and reviewable in the
  persisted output, but this observation set produced zero findings and zero
  candidate proposals.
- No MemoryRecord or MemoryCandidate rows changed.

Follow-up:

- MM-26+ must not assume this dogfood proves candidate quality.
- A later slice needs either richer observation fixtures or deterministic
  candidate proposal rules before claiming reviewed memory growth.
