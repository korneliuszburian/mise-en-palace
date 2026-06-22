# Observation Dogfood — MM-17B

Date: 2026-06-22

Scope: dogfood the existing manual observation runtime on a real persisted KRN
execution run. This is evidence for observation staging only. It is not
reflection, memory promotion, worker execution, or Memory Core mutation.

## Inputs

- Database: `postgres://krn:krn@localhost:54329/krn`
- Execution run: `eb16411b-d304-420e-adc7-1fdb86857c1d`
- Run evidence present before observe:
  - `run_events`: 2
  - `evidence_bundles`: 1
- Selected observation group after persist:
  - `efb77ec6-2773-4f4d-a8b7-f1d84b5ff001`
- Project scope:
  - `a704c6fa-8b15-4d77-a748-1eb6d5d9f13b`

## Readiness

Command:

```bash
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready
```

Result:

```txt
Migrations expected: 10
Migrations applied: 10
Migrations: applied
pgvector: available
Brain store readiness: ready
```

## Counts Before

Command:

```bash
psql "$KRN_DATABASE_URL" -c "select 'observation_groups' as table_name, count(*) from observation_groups union all select 'observation_items', count(*) from observation_items union all select 'observation_source_ranges', count(*) from observation_source_ranges union all select 'memory_records', count(*) from memory_records order by table_name;"
```

Result:

```txt
memory_records            1
observation_groups        0
observation_items         0
observation_source_ranges 0
```

## Preview

Command:

```bash
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn observe --run eb16411b-d304-420e-adc7-1fdb86857c1d
```

Result:

```txt
Persistence: disabled (preview only; use --persist to write observations)
Observer input items: 5
Redactions: 0
Truncations: 0
Memory mutation: none
MemoryRecord created: no
Observation group: preview only
Observation items: preview only
```

## Persist

Command:

```bash
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn observe --run eb16411b-d304-420e-adc7-1fdb86857c1d --persist
```

Result:

```txt
Persistence: enabled (Postgres, explicit --persist)
Observer input items: 5
Redactions: 0
Truncations: 0
Memory mutation: none
MemoryRecord created: no
Observation group: efb77ec6-2773-4f4d-a8b7-f1d84b5ff001
Observation items: 5
```

## Counts After

Result:

```txt
memory_records            1
observation_groups        1
observation_items         5
observation_source_ranges 5
```

Interpretation: observe created observation staging rows and did not create or
delete Memory Core rows.

## Source Ranges

The persisted group produced five candidate fact observations with typed source
ranges:

```txt
run_event          2
evidence_bundle    1
review_assessment  1
feedback_delta     1
source_chunk       0
```

Every persisted item has exactly one typed evidence/source FK in this run:

```txt
02daea49-c9f2-4349-98a2-a781ee06b82f run_event         5e5b5e99-a3f9-4409-83d8-2ce2c2b2e549
871c9ba4-ed21-42c6-947a-8df3f8ca45cf review_assessment e6e20c8b-11bd-41a5-adbb-18eadd1cbec0
8be7c331-307a-4e4e-a25b-a0a1f7b1382f evidence_bundle   6c85abdd-7b6d-468a-833e-0e12a445b6a6
9ad97761-3c6e-42f1-b072-becabb010a39 feedback_delta    500f4cf0-3b03-449d-9993-65287808c6d6
fc739d62-0491-4847-b9f6-61d4e20ed2b8 run_event         5b3f30ff-a12a-4a6e-843c-df1a62d77a7f
```

## Raw Evidence Recall

Command shape:

```bash
pnpm --filter @krn/db exec tsx -e '<instantiate DrizzleObservationRepository and call recallRawEvidence for each item>'
```

Note: the first helper command used top-level `await` and failed before any DB
mutation. It was rerun with an async wrapper.

Successful recall covered:

```txt
02daea49-c9f2-4349-98a2-a781ee06b82f -> run_event         "Persisted harness plan created"
871c9ba4-ed21-42c6-947a-8df3f8ca45cf -> review_assessment "Evidence captured; human review still required."
8be7c331-307a-4e4e-a25b-a0a1f7b1382f -> evidence_bundle   "Revert the focused implementation commit or discard uncommitted changes."
9ad97761-3c6e-42f1-b072-becabb010a39 -> feedback_delta    payload keys include memoryCandidates/sourceDecisions/evalCandidates
fc739d62-0491-4847-b9f6-61d4e20ed2b8 -> run_event         "Evidence captured from CLI"
```

## Prefix Sample

Command shape:

```bash
pnpm --filter @krn/cli exec tsx -e '<load persisted observations through DrizzleObservationRepository.findByRun and call selectObservationPrefix>'
```

Input task:

```txt
Review captured evidence and feedback
```

Result summary:

```txt
loadedItems: 5
selected:
- 8be7c331-307a-4e4e-a25b-a0a1f7b1382f evidence captured: 3 commands, 3 changed files
- 871c9ba4-ed21-42c6-947a-8df3f8ca45cf review pending: Evidence captured; human review still required.
- 9ad97761-3c6e-42f1-b072-becabb010a39 feedback candidate: 1 memory candidates, 0 source decisions, 0 eval candidates
exclusions:
- 02daea49-c9f2-4349-98a2-a781ee06b82f low_relevance
- fc739d62-0491-4847-b9f6-61d4e20ed2b8 budget_exceeded
```

Rendered prefix:

```txt
Observation prefix:
- [medium/low] evidence captured: 3 commands, 3 changed files (matched task terms: and, bundle, captured, evidence, review)
- [medium/low] review pending: Evidence captured; human review still required. (matched task terms: captured, evidence, review)
- [medium/low] feedback candidate: 1 memory candidates, 0 source decisions, 0 eval candidates (matched task terms: candidates, feedback, memory)
```

## Verdict

MM-17B dogfood passed for the current scope:

- persisted observations were created from a real KRN run;
- each observation has a source range;
- raw evidence recall works for every persisted source range kind present in
  this run;
- prefix selection can produce a small follow-up task prefix;
- Memory Core row count did not change.

Residual risks intentionally remain for later repair slices:

- deterministic observe still maps every item to `kind: "fact"`;
- this run did not include a `source_chunk` observation;
- typed lineage invariants are still adapter-level and will be hardened in
  MM-17C;
- project scoping still needs MM-17D hardening.
