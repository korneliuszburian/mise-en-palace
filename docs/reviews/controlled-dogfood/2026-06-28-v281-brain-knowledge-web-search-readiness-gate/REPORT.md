# V281 Brain Knowledge Web Search Readiness Gate

Status: complete.

## Objective

Decide and guard the smallest path from self-contained HTML preview to a
read-only web/search surface over brain knowledge cards.

## Change

- Added:
  `docs/decisions/ADR-0028-brain-knowledge-web-search-readiness-gate.md`
- Guarded it through:
  `packages/harness/src/brainKnowledgeReadModelInvariants.test.ts`

## Decision

Accepted:

```txt
static/read-only web search over BrainKnowledgeReadModel cards first
```

Rejected for now:

```txt
dashboard package
API solely to serve cards
MCP server before static preview usefulness
source crawler
mutation-capable UI
SOTA/GraphRAG claims without falsifiable evidence
```

## Source-To-Decision

- Source: `docs/architecture/observability-read-models.md`,
  `docs/decisions/ADR-0025-dashboard-readiness-gate.md`,
  V273 HTML preview, V275 HTML catalog breadth guard, and V280 pattern brain
  readiness re-gate.
- Mechanism: operator-facing knowledge search currently needs typed,
  read-only cards; services and mutation add product surface before usefulness
  proof.
- KRN implication: build the static/read-only preview path first.
- Decision: accept ADR-0028 and open V282 for a static web preview artifact.
- Consumer: V282 Brain Knowledge Static Web Preview Artifact.
- Falsifier: static artifact cannot reduce rereads or review burden in dogfood,
  while operators repeatedly need live DB/API-backed interaction.

## Evidence

Guard added:

```txt
brainKnowledgeReadModelInvariants checks ADR-0028 for static/read-only path,
BrainKnowledgeReadModel, Mutation: none, no Memory Core mutation, rejected
dashboard/API/MCP, and V282 next work.
```

## What This Proves

- KRN has a current decision gate for brain knowledge web/search.
- The next UI/search step is constrained to static/read-only behavior.
- API/MCP/dashboard remain deferred until a static preview usefulness proof
  fails or becomes insufficient.

## What This Does Not Prove

- Product readiness.
- Search ranking quality.
- Web UI usefulness.
- Completeness of retained knowledge.
- Live DB/API/MCP need.

## Next Task

V282 should implement or guard the first static web preview artifact path:

```txt
Brain Knowledge Static Web Preview Artifact
```

Expected constraints:

- generate from `docs/brain-knowledge/catalog.json`;
- write only to `.local-lab/` or document a local command;
- preserve proof/non-proof fields;
- no mutation path;
- no API/MCP/dashboard package.
