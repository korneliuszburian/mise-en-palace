# V282 Brain Knowledge Static Web Preview Artifact

Status: complete.

## Objective

Make the first static brain knowledge web preview artifact repeatable from the
repo root.

## Change

- Added root script:
  `pnpm brain:knowledge:preview`
- The script generates:
  `.local-lab/brain-knowledge-preview.html`
- Guarded the script through:
  `packages/harness/src/brainKnowledgeReadModelInvariants.test.ts`

## Source-To-Decision

- Source: ADR-0028, `BrainKnowledgeReadModel`, V273 HTML preview, V275 catalog
  breadth guard, and V281 web-search readiness gate.
- Mechanism: operator-facing brain knowledge search needs a repeatable
  read-only artifact path before API, MCP, dashboard, or DB-backed UI work.
- KRN implication: expose the existing `knowledge cards --html` renderer as a
  root command that generates a local artifact from the explicit catalog.
- Decision: add `brain:knowledge:preview` and guard that it stays catalog-based,
  HTML-producing, local, and non-persistent.
- Consumer: brain knowledge static web preview loop.
- Falsifier: the script stops generating a non-empty local artifact, omits proof
  boundaries, loses catalog breadth, or grows into DB/API/MCP/dashboard work.

## Artifact

```txt
.local-lab/brain-knowledge-preview.html
```

The generated artifact is local lab output, not committed source truth.

## Evidence

Commands run:

```sh
pnpm --filter @krn/harness test -- brainKnowledgeReadModelInvariants
pnpm brain:knowledge:preview
test -s .local-lab/brain-knowledge-preview.html
grep -q "<!doctype html>" .local-lab/brain-knowledge-preview.html
grep -q "KRN Brain Knowledge Cards" .local-lab/brain-knowledge-preview.html
grep -q "Mutation: none" .local-lab/brain-knowledge-preview.html
grep -q "Proof Boundaries" .local-lab/brain-knowledge-preview.html
grep -q "does not prove" .local-lab/brain-knowledge-preview.html
grep -q "pattern:codex-skill-progressive-disclosure-routing" .local-lab/brain-knowledge-preview.html
grep -q "pattern:evidence-proof-non-proof-boundary" .local-lab/brain-knowledge-preview.html
grep -q "pattern:source-to-decision-retention-gate" .local-lab/brain-knowledge-preview.html
grep -q "pattern:ts-boundary-unknown-first-result-state" .local-lab/brain-knowledge-preview.html
wc -c .local-lab/brain-knowledge-preview.html
pnpm -r --workspace-concurrency=1 typecheck
pnpm test
git diff --check
```

Result:

```txt
brainKnowledgeReadModelInvariants: passed
artifact size: 23346 bytes
artifact contains all four retained pattern cards: yes
artifact contains Mutation: none and Proof Boundaries: yes
workspace typecheck: passed
workspace test: passed
git diff --check: passed
```

Note:

```txt
`pnpm typecheck` through the local `rtk` wrapper returned TypeScript help with
exit code 1 despite no type errors. The direct workspace command
`pnpm -r --workspace-concurrency=1 typecheck` is the recorded typecheck proof.
```

## What This Proves

- Operators can regenerate a local static brain knowledge web preview artifact
  from `docs/brain-knowledge/catalog.json` without command tribal knowledge.
- The artifact path remains read-only and local.
- The generated HTML preserves proof/non-proof boundaries and current catalog
  breadth.

## What This Does Not Prove

- Product readiness.
- Search usefulness in a browser session.
- Search ranking quality.
- Completeness of retained brain knowledge.
- Need for API, MCP, dashboard, or DB-backed UI.
- Live DB knowledge readback.

## Brain Usefulness

Verdict: positive.

KRN helped by keeping the slice constrained to a repeatable artifact path after
ADR-0028, instead of jumping to a dashboard/API/MCP surface. The implementation
used the existing CLI HTML renderer and added only the missing operator command
and guard.

## Next Task

V283 should prove the generated static preview is useful enough as an operator
search surface before any wider UI surface:

```txt
Brain Knowledge Static Preview Usefulness Dogfood
```

Expected constraints:

- use the generated artifact or its underlying catalog preview to answer
  concrete operator search questions;
- record whether it reduces rereads;
- do not add dashboard, API, MCP, DB search service, or mutation;
- if the static artifact is insufficient, produce a bounded follow-up with a
  falsifier.
