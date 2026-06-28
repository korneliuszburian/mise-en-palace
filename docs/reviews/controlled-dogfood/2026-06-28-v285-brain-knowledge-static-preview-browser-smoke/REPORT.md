# V285 Brain Knowledge Static Preview Browser Smoke

Status: complete.

## Objective

Execute the static brain knowledge preview filter behavior, not only inspect
rendered strings.

## Change

- Added a DOM-capable smoke test for generated static HTML.
- The smoke uses two controlled knowledge cards with different stable fields.
- It executes the embedded static preview script through a fake DOM and proves:
  - default visible count;
  - free-text search reduces visible cards;
  - `kind` filter reduces visible cards;
  - `reviewability` filter can produce an empty state.
- Added `data-card-id` to rendered cards so executed smoke can assert visible
  card identities.

## Source-To-Decision

- Source: V284 field-filter implementation and report.
- Mechanism: string tests prove markup exists, but not that the embedded
  client-side filter behavior works.
- KRN implication: execute the smallest DOM-capable smoke before claiming the
  static preview is usable as a web/search artifact.
- Decision: add a no-server DOM smoke in CLI tests.
- Consumer: brain knowledge static preview operator search loop.
- Falsifier: rendered filters exist but browser/DOM behavior does not reduce
  visible cards or preserve the empty state.

## Evidence

Commands run:

```sh
pnpm --filter @krn/cli test -- runKnowledgeCardsCommand
pnpm brain:knowledge:preview
pnpm -r --workspace-concurrency=1 typecheck
pnpm test
git diff --check
```

Result:

```txt
targeted CLI tests: passed, 202 tests
artifact generation: passed
workspace typecheck: passed
workspace test: passed
git diff --check: passed
```

## What This Proves

- The generated static preview filter script can execute against DOM-like
  controls.
- Text and field filters reduce visible cards in a controlled scenario.
- Empty-state behavior works in the smoke.
- The preview remains static, read-only, and non-persistent.

## What This Does Not Prove

- Real browser visual polish.
- Accessibility completeness.
- Search ranking quality.
- Larger-catalog usefulness.
- Product readiness.
- Need for API, MCP, dashboard, or DB-backed UI.

## Brain Usefulness

Verdict: positive.

The V283/V284 evidence produced a targeted UX risk, and V285 converted it into a
behavior proof without widening infrastructure.

## Next Task

V286 should increase useful brain knowledge coverage from existing retained
KRN evidence before adding more UI surface:

```txt
Brain Knowledge Catalog Coverage Expansion
```

Expected constraints:

- add a small number of high-value knowledge cards or retained decisions from
  existing reviewed KRN sources/evidence;
- use source-to-decision with consumer and falsifier;
- keep cards read-only and reviewable;
- update catalog and guards;
- do not ingest broad raw materials, crawl sources, build API/MCP/dashboard, or
  claim SOTA/product readiness.
