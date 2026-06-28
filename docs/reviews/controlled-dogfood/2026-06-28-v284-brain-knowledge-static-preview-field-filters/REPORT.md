# V284 Brain Knowledge Static Preview Field Filters

Status: complete.

## Objective

Reduce noisy static preview searches by adding field/facet filters while staying
inside the self-contained read-only artifact boundary.

## Change

- Added client-side filters to the static HTML preview:
  - `kind`
  - `status`
  - `reviewability`
  - `nextAction`
- Added stable `data-*` attributes to each rendered card.
- Kept the existing free-text search, count, empty state, proof boundaries, and
  read-only/mutation-none metadata.
- Added CLI tests that guard the filter controls and card attributes in HTML
  output.

## Source-To-Decision

- Source: V283 static preview usefulness dogfood.
- Mechanism: broad text queries like `skill` are noisy because text search
  matches every card field equally, including refs and does-not-prove text.
- KRN implication: static preview needs field filters before growing into API,
  MCP, dashboard, or ranking work.
- Decision: add client-side field filters to the existing static artifact.
- Consumer: brain knowledge static preview operator search loop.
- Falsifier: filters fail to reduce noisy broad searches in browser/DOM use, or
  the next step requires server/API/DB mutation to make static search usable.

## Evidence

Commands run:

```sh
pnpm --filter @krn/cli test -- runKnowledgeCardsCommand
pnpm brain:knowledge:preview
grep -q "id=\"kindFilter\"" .local-lab/brain-knowledge-preview.html
grep -q "Kind: pattern" .local-lab/brain-knowledge-preview.html
grep -q "id=\"reviewabilityFilter\"" .local-lab/brain-knowledge-preview.html
grep -q "Reviewability: ready" .local-lab/brain-knowledge-preview.html
grep -q "data-next-action=\"use\"" .local-lab/brain-knowledge-preview.html
grep -q "matchesFilter(card, \"kind\", kindFilter.value)" .local-lab/brain-knowledge-preview.html
pnpm -r --workspace-concurrency=1 typecheck
pnpm test
git diff --check
```

Result:

```txt
targeted CLI tests: passed
artifact generation: passed
artifact filter markup/readback: passed
workspace typecheck: passed
workspace test: passed
git diff --check: passed
```

## What This Proves

- Static brain knowledge preview now renders field filters.
- Cards expose stable client-side fields for deterministic filtering.
- The change stays local, static, read-only, and non-persistent.
- Proof/non-proof boundaries remain visible.

## What This Does Not Prove

- Browser event behavior works end-to-end.
- Search ranking quality.
- Product readiness.
- That static preview is sufficient at larger catalog sizes.
- Need for API, MCP, dashboard, or DB-backed UI.

## Brain Usefulness

Verdict: positive.

The V283 dogfood produced a precise usability finding, and V284 converted it
into a bounded UI improvement without widening architecture.

## Next Task

V285 should execute the static preview filter behavior, not only inspect output
strings:

```txt
Brain Knowledge Static Preview Browser Smoke
```

Expected constraints:

- load `.local-lab/brain-knowledge-preview.html` or generated HTML in a local
  browser/DOM-capable smoke;
- prove text + field filters reduce visible cards;
- keep the artifact static and read-only;
- no dashboard, API, MCP, DB search service, persistence, or mutation.
