# ADR-0011: Observational Memory As Staging Layer

Status: Accepted

Date: 2026-06-22

## Context

KRN has completed the M27 infrastructure spine: project-scoped target repo
planning, Codex brief rendering, evidence capture, DB readiness, pgvector, and
the Memory/Source/Retrieval/Event substrate are proven.

The next memory direction is not "better RAG". The required operating pattern
is:

```txt
raw event -> observation -> reflection -> candidates -> reviewed memory/source/eval
```

The decision chain for every retained source is:

```txt
source -> mechanism -> KRN implication -> decision/rejection/hypothesis -> consumer -> falsifier
```

MM-00 is a decision and planning slice only. It must not implement
Observational Memory runtime, DB tables, workers, API surfaces, source crawlers,
or dashboards.

## Sources

- Mastra Observational Memory research:
  `https://mastra.ai/research/observational-memory`
- Mastra Observational Memory blog:
  `https://mastra.ai/blog/observational-memory`
- Adam/Bobbin/Astropolis demo analysis from the operator prompt.
- KRN doctrine in `docs/KRN_KERNEL.md` and `docs/STATE_OF_THE_ART.md`.
- Store-backed memory doctrine in
  `docs/decisions/ADR-0002-memory-is-store-not-files.md`.
- Canonical harness spine in `docs/decisions/ADR-0009-canonical-harness-spine.md`.
- Postgres brain store decision in
  `docs/decisions/ADR-0010-brain-store-postgres-pgvector.md`.
- Local raw research quarry:
  `docs/materials/2026-06-22-big-brain.md` and
  `docs/materials/2026-06-22-big-brain-part-2.md`.

The Mastra sources are treated as mechanism evidence, not product proof for
KRN. Their reported LongMemEval numbers are source-reported benchmark results
for Mastra's setup. They do not justify copying Mastra architecture one-to-one.

## Decision

Observational Memory is not Memory Core.

KRN will define Observational Memory as an event-derived, source-ranged,
temporal staging layer between the existing run/source/tool/review history and
the governed Memory Core.

Observations are typed records about what happened, changed, was decided, was
corrected, became uncertain, or must not be inferred. Factual observations
require source ranges. User preference or local operator-note observations may
omit source ranges only when explicitly marked as preference/operator note and
scoped.

Reflections are offline synthesis records over observations. They may create
reviewable candidates:

- `MemoryCandidate`
- `SourceClaim`
- `AntiMemoryCandidate`
- `PolicyCandidate`
- `EvalCandidate`

Reflections must not directly mutate `MemoryRecord`, `AntiMemoryRecord`, source
decisions, policy, or runtime truth.

Raw evidence remains canonical for exact claims. Observation and reflection
records must retain recall paths back to run events, source chunks, diffs, tool
traces, review assessments, feedback deltas, or other canonical source ranges.

Anti-memory is first-class. The memory layer must support reviewable negative
knowledge that blocks stale, unsafe, contradicted, or overconfident inference.

Stable observation prefix is an activation primitive, not a context dump. It is
a small, budgeted, review-aware working set selected by activation. It must not
hide contradictions, anti-memory, raw evidence needs, or trust/TTL limits.

## Rejections

KRN rejects these paths for MM-00 and as default architecture:

- treating Observational Memory as approved Memory Core;
- storing chain-of-thought;
- using markdown or `.krn/**` as runtime memory;
- adopting a text-only observation log as final truth;
- source hoarding without source-to-decision mapping;
- an observer worker in MM-00;
- a reflector worker in MM-00;
- new DB tables in MM-00;
- a source crawler in MM-00;
- dashboard, API, MCP server, plugin, or broad eval suite work in MM-00;
- separate first-spine vector or graph databases;
- reflection auto-promotion to Memory Core;
- hidden autonomous agents as the memory architecture.

## Consequences

MM-01 and later slices may design and implement the schema, repositories,
activation integration, observer input builder, reflector path, candidate gates,
anti-memory integration, dogfood runs, and golden tasks.

MM-00's output is the decision frame:

- source ledger;
- accepted decisions;
- kill-list/rejections;
- falsifiers;
- MM roadmap.

Any later schema or runtime work must cite the relevant MM-00 decision and
falsifier before implementation.

## Falsifiers

This ADR is violated if any later slice does one of the following:

- stores a factual observation without a source range;
- lets reflection create or update a `MemoryRecord` directly;
- cannot recall exact raw evidence for an exact claim;
- treats markdown files as runtime memory;
- stores chain-of-thought;
- lets stable observation prefix grow into an unbounded context dump;
- treats source-reported benchmark results as proof of KRN product quality;
- adds observer/reflector workers before manual contracts, fixtures, and
  review gates exist;
- creates anti-memory warnings without lineage and review status;
- builds dashboard/API/MCP/server/plugin surfaces before the memory spine is
  proven by dogfood and golden tasks.
