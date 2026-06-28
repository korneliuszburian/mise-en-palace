# V299 Brain Knowledge Read-Only UI Boundary Usefulness Feedback

Status: controlled dogfood report.

Date: 2026-06-28

## Executive Verdict

`pattern:brain-knowledge-read-only-ui-boundary` is useful. It repeatedly kept
brain knowledge search on a static/read-only path while rejecting premature
dashboard, API, MCP, DB-backed search, crawler, and mutation-capable surfaces.

This matters because the user wants Adam-like searchable brain knowledge. The
pattern moved KRN toward that goal without letting the first visible surface
become product theater or hidden mutation authority.

This is not product UI readiness proof.

## Scope

Pattern reviewed:

```txt
pattern:brain-knowledge-read-only-ui-boundary
```

Files changed:

```txt
docs/brain-knowledge/usefulness-feedback/v299-read-only-ui-boundary.json
docs/brain-knowledge/catalog.json
packages/cli/src/runKnowledgeCardsCommand.test.ts
GOAL.md
PLAN.md
PLANS.md
```

Non-goals:

- no UI implementation;
- no API/MCP/dashboard;
- no DB-backed search;
- no source crawler;
- no Memory Core mutation;
- no product-ready claim.

## Evidence

V281 accepted only static/read-only web search over `BrainKnowledgeReadModel`
cards and explicitly rejected dashboard, API, MCP, crawler, and mutation-capable
UI for now.

V282 added `pnpm brain:knowledge:preview`, a repeatable local artifact path
that generates `.local-lab/brain-knowledge-preview.html` from the explicit
catalog while preserving `Mutation: none` and proof boundaries.

V285 executed the generated preview behavior through a DOM-capable smoke test,
proving that text and field filters reduce visible cards without server/API/DB
surface.

V291 showed the read-only operator surface reduces rereads for usefulness
selection, while also exposing the next gap: CLI needed missing-feedback
readback instead of broader UI/API/MCP.

## Feedback Added

```txt
cardId: pattern:brain-knowledge-read-only-ui-boundary
outcome: helped
summary: Kept brain knowledge search on a static/read-only preview path while
  rejecting premature dashboard, API, MCP, DB-backed search, crawler, and
  mutation-capable surfaces.
```

Proof boundary:

```txt
This does not prove product UI readiness, semantic ranking quality, catalog
completeness, DB-backed search need, or that API/MCP/dashboard will never be
needed.
```

## Readback Proof

After this slice:

```txt
--usefulness-outcome helped includes pattern:brain-knowledge-read-only-ui-boundary
--usefulness-outcome none excludes pattern:brain-knowledge-read-only-ui-boundary
```

Confirmed count movement:

```txt
helped: 8 -> 9
none: 3 -> 2
```

## Brain Usefulness

Verdict: positive.

What helped:

- gave the future web/search direction a safe static/read-only first surface;
- prevented premature dashboard/API/MCP expansion;
- preserved proof/non-proof and `Mutation: none` boundaries in visible cards;
- let later usefulness filters and missing-feedback triage build on a compact
  read-only surface.

What is still weak:

- this is not polished web UX;
- this is not semantic search;
- this is not live DB-backed knowledge search;
- this is not product readiness.

## Source-To-Decision

Source:

- V281 web search readiness gate;
- V282 static preview artifact;
- V285 browser smoke;
- V291 usefulness outcome dogfood.

Mechanism:

- visible brain knowledge is useful only if it remains a projection of typed
  read models with proof boundaries and no mutation authority;
- static/read-only preview gives operator search value before server, API, MCP,
  crawler, dashboard, or DB-backed surfaces are justified.

KRN implication:

- brain UI/search must stay read-only until static preview usefulness fails or
  clear API/MCP/dashboard need is proven.

Decision:

- mark `pattern:brain-knowledge-read-only-ui-boundary` as `helped`.

Consumer:

- future brain knowledge UI/search slices;
- future web/API/MCP readiness gates;
- future pattern-brain visibility work.

Falsifier:

- future UI/search work needs live DB/API/MCP/dashboard to answer bounded
  operator questions, or the static preview hides proof boundaries or cannot
  reduce rereads.

## Next Recommended Action

Open V300:

```txt
Target Repo Write Authority Boundary Usefulness Feedback
```

Reason:

```txt
The next no-feedback pattern gates KRN use on external or living repos. It is
closer to safe controlled-alpha expansion than another UI surface.
```

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `git fetch --prune && git status --short --branch && git log --oneline -n 6` | passed | local branch was clean and aligned before edits | future CI status |
| `krn knowledge cards --text "read-only" --json` | passed | read-only UI boundary card existed and had no usefulness feedback before this slice | usefulness by itself |
| `krn knowledge cards --usefulness-outcome helped --json` | passed | `helped` readback includes 9 cards including read-only UI boundary | product UI readiness or semantic ranking quality |
| `krn knowledge cards --usefulness-outcome none --json` | passed | no-feedback readback decreased to 2 cards | that remaining cards are unimportant |
| `sed`/`rg` over V281/V282/V285/V291 evidence | passed | local reports contain read-only UI/search boundary evidence | product UI readiness |
| `pnpm --filter @krn/cli test -- runKnowledgeCardsCommand` | passed | CLI readback/filter tests cover the new feedback count | full repo behavior |
| `pnpm --filter @krn/harness test -- contextHygieneInvariants activePlanInvariants patternChainInvariants brainKnowledgeReadModelInvariants brainKnowledgeReadModel` | passed | root-plan, pattern-chain, and read-model invariants still pass | product readiness |
| `pnpm -r --workspace-concurrency=1 --if-present typecheck` | passed | TypeScript packages still typecheck | runtime DB behavior |
| `pnpm test` | passed | full local test suite passed | remote CI status |
| `git diff --check` | passed | diff has no whitespace errors | correctness of the decision |
