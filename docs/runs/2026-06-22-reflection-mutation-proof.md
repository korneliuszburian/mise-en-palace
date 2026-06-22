# 2026-06-22 Reflection Mutation Proof

Scope: MM-24A repository/runtime proof for manual reflection.

Command under proof:

```bash
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn \
  pnpm --filter @krn/cli krn reflect \
  --scope project:a704c6fa-8b15-4d77-a748-1eb6d5d9f13b \
  --persist
```

Before:

```text
before_reflection_records=2
before_memory_records=1
before_memory_candidates=1
```

Output:

```text
KRN Reflect
Persistence: enabled (Postgres, explicit --persist)
Scope: project:a704c6fa-8b15-4d77-a748-1eb6d5d9f13b
Observations selected: 5
Anti-memory records selected: 1
Candidate rows written: no
Memory mutation: none
MemoryRecord created: no
Reflection record: 17fda5ab-10bb-4a0f-9af6-de63bae668d3
```

After:

```text
after_reflection_records=3
after_memory_records=1
after_memory_candidates=1
```

Conclusion:

- `krn reflect --persist` created a ReflectionRecord.
- It did not create a MemoryRecord.
- It did not create a MemoryCandidate.
- This proves the current manual reflection runtime is candidate/report staging,
  not Memory Core mutation.
