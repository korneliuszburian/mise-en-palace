# Observability Read Models Report

Status: D-03 completion report.

Date: 2026-06-25

## Executive Verdict

D-03 defined the first observability read models KRN needs before dashboard/API
work: review burden, context ROI, and memory usefulness. This is a docs-only
proposal over existing typed state. It adds no schema, CLI, dashboard, API, MCP,
or worker runtime.

## Scope

Changed:

- `docs/architecture/observability-read-models.md`;
- `PLAN.md`;
- `GOAL.md`.

Not changed:

- package source;
- DB schema;
- CLI behavior;
- memory/source/eval promotion behavior;
- dashboard/API/MCP/worker runtime.

## Read Models Defined

### ReviewBurdenReadModel

Owner:
- evidence/review loop.

Data sources:
- `ExecutionRun`;
- `EvidenceBundle`;
- `ReviewAssessment`;
- `FeedbackDelta`.

Action:
- accept review, request changes, capture missing command proof, split dirty
  context, or reject vague candidates.

Falsifier:
- if command proof strength cannot distinguish operator-reported,
  captured-output, default-template, or missing evidence, the model is not
  useful.

### ContextROIReadModel

Owner:
- activation/readback.

Data sources:
- `ContextAssembly`;
- raw recall/search inclusions;
- dogfood usefulness reports;
- `MemoryApplication`;
- source decision edges.

Action:
- keep activation, add owner-file recall, demote noisy source/memory, or open a
  bounded activation repair.

Falsifier:
- if selected context cannot be classified as used/helped/noise/missing from
  evidence, the model reports unknown.

### MemoryUsefulnessReadModel

Owner:
- memory governance.

Data sources:
- `MemoryRecord`;
- `MemoryCandidate`;
- `MemoryApplication`;
- `MemoryFeedbackEvent`;
- `AntiMemoryRecord`;
- `ContextAssembly`.

Action:
- keep, strengthen, demote, invalidate, or convert to anti-memory.

Falsifier:
- selected memory without application feedback is usefulness unknown.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `pnpm db:ready` | passed | Current shell can reach the KRN Postgres brain store with 14/14 migrations and pgvector available. | Does not prove production DB readiness, CI DB readiness, or read-model implementation. |
| `krn plan --task observability read models --persist` | passed | D-03 has a persisted planning run in the current shell. | Does not prove the read models are implemented or useful at runtime. |
| `krn evidence capture --persist` | passed | D-03 evidence, review assessment, feedback delta, intended file classification, and command proof metadata were persisted. | Does not prove product readiness or memory quality. |
| `krn observe --persist` | passed | D-03 produced persisted observation staging without Memory Core mutation. | Does not prove reflection quality or final memory truth. |
| `krn reflect --persist` | passed | D-03 produced a persisted reflection record without candidate row writes or Memory Core mutation. | Does not prove useful extraction at scale. |
| `git diff --check` | passed | Docs diff has no whitespace errors. | Does not prove read models are implemented. |

## Persistence Evidence

```txt
executionRun: 9bd063ab-70d4-48f1-9243-8c60854b2da7
taskContract: befa25bd-bf2c-450f-b5f2-e788d77d4b54
harnessPlan: 1723e186-d3c2-4e52-83d9-e0bce46e910d
contextAssembly: cc7fd757-60cf-4a19-871c-2ad42c682b27
evidenceBundle: 1a0a5648-ec08-4e8d-8464-58950f2fc8af
reviewAssessment: b2f4e436-3d2c-4742-892c-a50171570048
feedbackDelta: e9126c67-b112-4396-9542-bc1e3fb7c1b7
observationGroup: fb82d9f9-806f-46ac-8d71-a82f526b247e
reflectionRecord: e906e147-a1e3-4023-a1f2-75ce917f2ada
Memory mutation: none
MemoryRecord created: no
```

## Dogfood Brain Usefulness Section

### Brain Usefulness Summary

Brain ROI:
- positive

Overall verdict:
- D-03 reduces future dashboard/API drift by defining read-model owners,
  sources, actions, and falsifiers first.

What this run proves:
- KRN has explicit read-model contracts for three product-readiness signals.

What this run does not prove:
- read models are implemented;
- dashboard/API is ready;
- metrics are aggregated;
- product readiness.

DB used in current shell:
- yes for persisted KRN planning/evidence/observe/reflect proof.
- no package runtime or schema changes were made.

### Activated Context Usefulness

| Item | Type | Used? | Helped? | Notes |
| --- | --- | --- | --- | --- |
| D-02 run readback report | report | yes | helped | Gave the immediate source for review burden readback needs. |
| DOGFOOD reporting standard | report | yes | helped | Supplied selected/used/helped/missing vocabulary. |
| PLAN D-03 task contract | plan | yes | helped | Kept scope docs-only. |

### Evidence And Review Burden

| Evidence item | Strength | What it proves | Review burden impact |
| --- | --- | --- | --- |
| Architecture proposal | medium | Read-model boundaries are explicit. | reduced |
| No package source changed | strong | D-03 stayed design-only. | reduced |

### Candidate Quality

No candidate was promoted. A future implementation candidate is allowed only
for pure read-model helpers over existing aggregates.

## Product Readiness Signal

Verdict:

```txt
observability planning is clearer, not implemented.
```

## Next Recommended Action

Continue to:

```txt
E-00 — Security And Trust Boundary Review
```

E-00 should review security/trust boundaries before policy hooks, worker
runtime, integrations, or product interfaces.
