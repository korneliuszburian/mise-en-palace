# V315 Executable Brain-QA Case BQ-028

Status: complete docs/readback slice.

Date: 2026-06-28.
DB used: no.
Historical ledgers read: no.

## Executive Verdict

BQ-028 is executable from compact root state. `GOAL.md`, `PLAN.md`, and
`PLANS.md` are sufficient to recover the main unresolved product gaps without
opening historical ledgers. The compact state identifies KRN as stronger
controlled internal alpha, not product-ready, and points to the next product
work: move from docs/readback mini brain-QA into a bounded Ingest v0 slice.

## Question

```txt
Can KRN identify the main unresolved product gaps from compact root state and
reports without reading historical ledgers?
```

## Evidence Readback

Commands run:

```sh
rtk bash -lc 'rg -n "Current Brain Readiness|Remaining Product Gaps|product-ready|widened internal alpha|V02-01|Ingest v0|Graph brain v0|Heartbeat|Consensus|Product surfaces|pattern brain|UI/search" GOAL.md PLAN.md PLANS.md'
rtk sed -n '1,180p' docs/reviews/controlled-dogfood/2026-06-28-v314-executable-brain-qa-bq-025/REPORT.md
```

Historical ledger check:

```txt
Historical ledgers were not opened for this readback.
```

## Recovered Product State

| Area | Current compact-state readback | Source |
|---|---|---|
| Product readiness | `product-ready: no` | `GOAL.md`, `PLAN.md`, `PLANS.md` |
| Widened alpha | `widened internal alpha: no` | `GOAL.md`, `PLAN.md`, `PLANS.md` |
| Second-operator proof | `V02-01 real second-operator proof: blocked/deferred` | `GOAL.md`, `PLAN.md` |
| Pattern brain | partial; continuous intake/enforce/eval loop incomplete | `PLANS.md` |
| Evidence/review | strong; DB-backed replay proven | `PLANS.md` |
| Candidate reviewability | core primitive | `PLAN.md`, `PLANS.md` |
| Activation | useful for guardrails; owner-file recall still weak in some runs | `PLANS.md` |
| Reflection/candidate usefulness | partially proven, not product-grade | `PLANS.md` |
| UI/search over brain knowledge | CLI read-only preview exists; web/API/MCP not started | `PLANS.md` |

## Recovered Remaining Product Gaps

| Gap | Compact-state wording | Next implication |
|---|---|---|
| Pattern brain execution/readback | keep future search changes usefulness-backed | continue evidence-backed pattern changes only |
| Research/paper/course source decisions | future sources still require consumer, falsifier, and does-not-prove | keep source-to-decision gate |
| Mini brain-QA benchmark | BQ-015 covered; BQ-023/BQ-024/BQ-025 executed | stop extending docs/readback indefinitely |
| Ingest v0 | source artifact -> content hash -> chunk -> source range -> claim -> embedding/search document with permission and temporal metadata | next highest-ROI bounded product slice |
| Graph brain v0 | entities, events, claims, relations, duplicates, contradictions, supersession, temporal slices | defer until ingest/source substrate is clearer |
| Heartbeat/dreaming v0 | candidate generator only; no final Memory Core mutation without review | defer until source/memory candidate substrate is broader |
| Consensus v0 | eval/candidate layer with preserved dissent, not autonomous truth runtime | defer until conflicting source/claim examples exist |
| Product surfaces | web UI/search/API/MCP only after usefulness/security/read-model gates | defer product surface expansion |

## Source-To-Decision

- Source: compact root `GOAL.md`, `PLAN.md`, `PLANS.md`, plus V314 report.
- Mechanism: active root state carries product readiness, current gaps, and next
  task synthesis without historical ledger rereads.
- KRN implication: the active state is sufficient for continuation and can now
  select a product-facing next slice instead of extending defensive report
  readbacks.
- Decision: close BQ-028 and activate a bounded Ingest v0 slice.
- Rejection: do not jump to graph, heartbeat, consensus, UI, API, MCP, source
  crawler, broad eval, or DB schema before a minimal source artifact ingest path
  is defined or proven.
- Consumer: V316 Ingest v0 local source artifact readback/preview.
- Falsifier: V316 discovers there is no usable existing substrate and the task
  cannot proceed without broad schema/runtime work.

## Pattern Usefulness

| Pattern | Outcome | Why |
|---|---|---|
| `pattern:active-context-compact-current-truth` | helped | Root state was enough to recover current gaps and next product direction. |
| `pattern:evidence-proof-non-proof-boundary` | helped | The report distinguishes compact-state readback from product readiness proof. |

## Proof Boundaries

What this proves:

- The compact root state identifies the main unresolved product gaps without
  historical ledger rereads.
- BQ-028 can execute through docs/readback artifacts without new runtime,
  schema, dashboard, API/MCP, source crawler, graph work, or broad eval
  platform.
- The next highest-ROI product-facing gap is Ingest v0, not another defensive
  report-readback task.

What this does not prove:

- arbitrary corpus QA;
- graph retrieval quality;
- product readiness;
- second-operator usability;
- that Ingest v0 is already implemented;
- that root state captures every historical nuance.

## Mutation Boundary

Memory mutation: none.

No Memory Core, source graph, DB schema, activation, reflection, worker, API, or
MCP behavior was changed.

## Next Action

Move to a bounded Ingest v0 slice:

```txt
V316 Ingest v0 Local Source Artifact Preview
```

The slice should inspect current source/search/code substrate and implement or
record the smallest local source artifact -> hash -> chunk/source-range preview
path without a source crawler, DB schema migration, API, MCP, dashboard, or
runtime worker.
