# V283 Brain Knowledge Static Preview Usefulness Dogfood

Status: complete.

## Objective

Check whether the static brain knowledge preview path helps answer concrete
operator search questions before building any wider UI/search surface.

## Scope

Inputs:

```txt
docs/brain-knowledge/catalog.json
.local-lab/brain-knowledge-preview.html
krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json
```

Non-goals:

```txt
dashboard
API
MCP
DB search
mutation
source crawler
new ranking engine
```

## Method

Generated the static artifact and used the same catalog-backed read model to
answer four operator search questions:

| Question | Query | Expected useful result |
|---|---|---|
| What pattern tells Codex how to use skills? | `skill` | skill routing pattern |
| What pattern protects proof/non-proof boundaries? | `proof` | evidence proof boundary pattern |
| What pattern controls research/pattern retention? | `source-to-decision` | source-to-decision retention gate |
| What TypeScript pattern applies to external inputs? | `unknown-first` | unknown-first result-state pattern |

## Findings

| Query | Result count | Verdict | Notes |
|---|---:|---|---|
| `skill` | 4 | mixed | Finds the skill-routing card, but also matches all current cards through refs/consumers/does-not-prove text. Useful, but noisy. |
| `proof` | 1 | good | Lands directly on `pattern:evidence-proof-non-proof-boundary`. |
| `source-to-decision` | 2 | mixed | Finds the source-to-decision card, but also matches skill routing through source refs. |
| `unknown-first` | 1 | good | Lands directly on the TypeScript boundary pattern. |

## Evidence

Commands run:

```sh
pnpm brain:knowledge:preview
cd packages/cli && pnpm exec tsx src/index.ts knowledge cards --catalog-file docs/brain-knowledge/catalog.json --text skill --json
cd packages/cli && pnpm exec tsx src/index.ts knowledge cards --catalog-file docs/brain-knowledge/catalog.json --text proof --json
cd packages/cli && pnpm exec tsx src/index.ts knowledge cards --catalog-file docs/brain-knowledge/catalog.json --text source-to-decision --json
cd packages/cli && pnpm exec tsx src/index.ts knowledge cards --catalog-file docs/brain-knowledge/catalog.json --text unknown-first --json
```

Observed:

```txt
access: read_only
mutation: none
source: explicit_files
proof boundaries preserved: yes
```

## What This Proves

- The static preview/readback path can answer direct retained-pattern questions.
- The catalog-backed read model preserves source refs, evidence refs,
  consumers, falsifiers, and does-not-prove boundaries.
- The current path is useful enough to continue static preview hardening before
  API/MCP/dashboard work.

## What This Does Not Prove

- Product readiness.
- Browser UX quality.
- Search ranking quality.
- Good relevance at larger catalog sizes.
- That DB/API/MCP is needed now.
- That the retained pattern catalog is complete.

## Usefulness Verdict

Verdict: useful but still primitive.

The static preview reduces rereads for exact pattern queries like `proof` and
`unknown-first`. It is weaker for broad terms like `skill` because current text
search matches every card field equally, including source refs and
does-not-prove text.

## Decision

Do not jump to dashboard/API/MCP.

The next highest-ROI product step is to improve static preview search
ergonomics with field/facet controls over the already loaded read-only cards.

## Next Task

V284 should add static preview field filters/facets before any wider UI surface:

```txt
Brain Knowledge Static Preview Field Filters
```

Expected constraints:

- keep the artifact static and self-contained;
- add client-side filters for stable fields such as `kind`, `status`,
  `reviewability`, and `nextAction`;
- keep proof/non-proof boundaries visible;
- no API, MCP, dashboard package, DB search, persistence, or mutation.
