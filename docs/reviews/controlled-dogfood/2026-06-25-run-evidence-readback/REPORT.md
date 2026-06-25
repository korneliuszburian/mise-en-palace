# Run Evidence Readback Report

Status: D-02 completion report.

Date: 2026-06-25

## Executive Verdict

D-02 added a read-only operator command:

```txt
krn run show --run-id <execution-run-id>
```

The command reads persisted harness run state from Postgres and renders task,
context, evidence classification, command provenance, review assessments,
feedback candidates, candidate reviewability, and proof boundaries without
ad hoc SQL, dashboard/API work, or state mutation.

## Scope

Changed:

- `packages/cli/src/parseRunArgs.ts`;
- `packages/cli/src/parseRunArgs.test.ts`;
- `packages/cli/src/runRunShowCommand.ts`;
- `packages/cli/src/runRunShowCommand.test.ts`;
- `packages/cli/src/parseArgs.ts`;
- `packages/cli/src/runCli.ts`;
- `PLAN.md`;
- `GOAL.md`.

Not changed:

- DB schema;
- repository storage;
- evidence capture semantics;
- memory/source/review gates;
- dashboard/API/MCP/worker runtime.

## Implementation

`krn run show --run-id <id>`:

- requires `KRN_DATABASE_URL`;
- uses existing `getHarnessRunByExecutionRunId`;
- is read-only;
- closes the DB runtime;
- renders proof/non-proof boundaries.

Output includes:

- task and run status;
- context inclusion/exclusion counts;
- evidence bundle count and diff risk;
- changed-file classification counts;
- command status/provenance/doesNotProve;
- review assessment status;
- feedback candidate counts;
- memory candidate reviewability;
- explicit "What This Proves" and "What This Does Not Prove".

## DB-Backed Dogfood

KRN plan run:

```txt
e077684d-ab84-417d-9be0-3813be6c8481
```

Persisted IDs:

```txt
operatorIntent: c404030c-c86b-427d-8a53-e10364dba968
taskContract: 4ee6bdc7-bdbc-47b8-abd0-eb2d225df3bd
harnessPlan: 49a8b4a8-58f3-4dcb-99bc-d84513c6645b
contextAssembly: 6f516789-f724-491b-8da9-b297b8ba2255
executionRun: e077684d-ab84-417d-9be0-3813be6c8481
evidenceBundle: d09bc73e-dba3-420b-a0cd-31741f224b63
reviewAssessment: cb5b02c3-74b5-402d-9d30-f5d60485476c
feedbackDelta: 27aafc9b-c5ce-46eb-b10b-7283fa2bb34f
observationGroup: 39aa0615-a503-48af-b884-232355528248
reflectionRecord: 19451b89-181e-4471-a7ad-39495e40cc39
Memory mutation: none
MemoryRecord created: no
```

Live readback target:

```txt
a5e934e6-87d8-4157-9ec0-b27b719b9f62
```

Readback showed:

```txt
intended=6
unrelated=0
unknown=0
operator_reported command provenance
doesNotProve for every command
memory candidate reviewability: too_vague
Mutation: none
```

## Command Evidence

| Command | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `pnpm --filter @krn/cli test -- parseRunArgs runRunShowCommand runCli` | passed | Parser, readback renderer, and CLI routing are covered. | Does not prove live DB readback. |
| `pnpm --filter @krn/cli typecheck` | passed | CLI types compile with the readback command. | Does not prove full workspace health. |
| `krn plan --task ... --persist` | passed | D-02 was planned through DB-backed KRN path. | Does not prove readback UX quality. |
| `krn run show --run-id a5e934e6-...` | passed | Current shell can read a persisted run and render evidence classification, command provenance, and candidate reviewability. | Does not execute commands or mutate Memory Core. |
| `krn evidence capture --run-id ... --persist` | passed | Persisted D-02 changed-file classification, command provenance, review assessment, and feedback delta. | Does not prove product readiness. |
| `krn observe --run ... --persist` | passed | Persisted observation group without Memory Core mutation. | Does not prove observation extraction quality at scale. |
| `krn reflect --scope run:... --persist` | passed | Persisted reflection record without MemoryRecord creation or candidate rows. | Does not prove reflection candidate quality. |

Final full verification is recorded in the commit evidence.

## Dogfood Brain Usefulness Section

### Brain Usefulness Summary

Brain ROI:
- positive

Overall verdict:
- KRN helped identify the recurring proof-readback burden and D-02 reduced
  operator dependence on ad hoc SQL.

What this run proves:
- Operators can read DB-backed run/evidence/feedback state through CLI.
- Readback distinguishes persisted evidence from proof of product quality.

What this run does not prove:
- dashboard/API readiness;
- metrics aggregation;
- observation/reflection quality;
- Memory Brain product readiness.

DB used in current shell:
- yes

### Activated Context Usefulness

| Item | Type | Used? | Helped? | Notes |
| --- | --- | --- | --- | --- |
| weak evidence source claim | source | yes | helped | Reinforced command provenance and does-not-prove output. |
| owner-file recall for evidence capture | search | partly | neutral | Close to evidence output, but run show owner files were found manually. |
| reflection quality caveat claim | source | yes | helped | Kept readback from overclaiming reflection quality. |
| stale audit exclusion | anti-memory | yes | helped | Prevented dashboard/audit sprawl. |

### Evidence And Review Burden

| Evidence item | Strength | What it proves | Review burden impact |
| --- | --- | --- | --- |
| CLI targeted tests | strong | Parser/renderer behavior is covered. | reduced |
| Live run show | strong | Current shell DB readback works. | reduced |
| Full verification | strong | Workspace still passes after CLI change. | reduced |

### Candidate Quality

No candidate was promoted. The readback command surfaces candidate
reviewability so future promotion/rejection review can happen with less
manual DB inspection.

### Brain ROI

| Dimension | Verdict | Evidence |
| --- | --- | --- |
| Context waste | lower | Operators can inspect one run by ID. |
| Review burden | lower | Evidence/proof boundaries render directly. |
| Resume quality | better | Run IDs can be checked without SQL. |
| Decision grounding | better | Output shows does-not-prove. |
| Memory usefulness | mixed | Candidate reviewability is visible, but no memory was promoted. |
| Operator friction | lower | No ad hoc SQL needed for basic run readback. |

## Product Readiness Signal

Verdict:

```txt
observability/readback UX is stronger, not dashboard-ready.
```

Remaining gaps:

- no aggregated read models;
- no dashboard/API;
- no observation/reflection detail readback;
- no CI proof for DB-backed readback.

## Next Recommended Action

Continue to:

```txt
D-03 — Observability Read Models
```

D-03 should define typed read models for review burden, context ROI, and memory
usefulness without building dashboard/API.
