# ADR-0028: Brain Knowledge Web Search Readiness Gate

Status: accepted

Date: 2026-06-28

## Context

KRN now has a partial pattern brain:

- retained pattern decisions;
- `BrainKnowledgeReadModel`;
- explicit catalog files;
- `krn brain knowledge` text/JSON readback;
- self-contained HTML preview;
- skill hooks that query retained patterns;
- Codex adapter brief skill pattern refs;
- DB-backed adapter smoke proving those refs survive persisted readback.

The next product temptation is to build a dashboard, API, MCP server, or broader
GraphRAG/search surface. That would be premature. The current evidence supports
only a read-only web/search surface over typed brain knowledge readbacks.

## Decision

Adopt a static/read-only web search path before any dashboard, API, MCP server,
or mutation-capable UI.

The first web/search implementation may only render existing
`BrainKnowledgeReadModel` cards from explicit card, retained-pattern, or catalog
inputs. It must preserve:

- source refs;
- evidence refs;
- consumers;
- falsifier;
- reviewability;
- temporal/dissent fields when present;
- `doesNotProve`;
- preview-level proof boundaries;
- `Mutation: none`.

The first surface must not:

- mutate Memory Core;
- must not mutate Memory Core through direct or indirect UI/search actions;
- mutate SourceDecision or candidate state;
- persist cards;
- query DB as a live service;
- crawl source documents;
- claim ranking quality;
- claim product readiness;
- become a dashboard.

## Accepted Next Work

The next valid slice is a bounded static preview step:

```txt
V282 Brain Knowledge Static Web Preview Artifact
```

Acceptable implementation shapes:

1. A package script that generates `.local-lab/brain-knowledge-preview.html`
   from `docs/brain-knowledge/catalog.json`.
2. A small runbook that documents the exact static preview command and proof
   boundaries, guarded by CLI tests.
3. A focused HTML rendering guard that proves catalog breadth, proof boundaries,
   and read-only behavior survive the generated artifact path.

If the static artifact proves insufficient after dogfood, later work may reopen
API/MCP/web-app discussion with a new ADR.

## Rejected Alternatives

- Add dashboard package now.
- Add API solely to serve brain knowledge.
- Add MCP server before static preview usefulness is proven.
- Add source crawler or automatic research ingestion.
- Add mutation actions from the web surface.
- Treat self-contained HTML as product readiness.
- Claim SOTA/GraphRAG behavior without benchmarked, falsifiable evidence.

## Source-To-Decision

- Source: `docs/architecture/observability-read-models.md`,
  `docs/decisions/ADR-0025-dashboard-readiness-gate.md`,
  V273 HTML preview, V275 HTML catalog breadth guard, and V280 pattern brain
  readiness re-gate.
- Mechanism: operator-facing knowledge search only needs typed, read-only cards
  at this stage; adding services or mutation before repeated usefulness proof
  increases surface area and false product confidence.
- KRN implication: build the smallest static/read-only preview path first and
  keep API/MCP/dashboard deferred.
- Decision: accept static/read-only web search readiness; reject live service
  surfaces for now.
- Consumer: V282 static web preview artifact and future UI/search slices.
- Falsifier: operators repeatedly need live DB/API-backed interaction to use
  brain knowledge effectively, and a static artifact cannot reduce rereads or
  review burden in dogfood runs.

## What This Does Not Prove

- Search ranking quality.
- Product readiness.
- Completeness of retained patterns.
- That a web UI is useful without dogfood evidence.
- That API, MCP, dashboard, source crawler, or live DB search should exist.
