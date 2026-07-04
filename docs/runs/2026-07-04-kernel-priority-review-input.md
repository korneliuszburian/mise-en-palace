# Kernel Priority Review

Status: priority decision record for `mise-en-palace-vyqf`.

## Pre-Slice Baseline

- Beads queue is empty: no open, ready, or in-progress issues.
- Cleanup wave is already applied: `@krn/schema` is gone, phantom policy gate
  surface is gone, promptfoo/eval public export cleanup is gone, vector search
  requires `embeddingModelId`, and the residual capability binding types are
  already absent from `packages/core/src/capabilityPlan.ts`.
- Latest closed slices proved DB-backed brain search can miss before seeded
  evidence, then select a promoted `MemoryRecord` plus accepted `SourceClaim`,
  `SearchDocument`, and `SourceDecisionEdge` support.
- `krn brain search --store-only --project <id>` can target an explicit DB
  project and pass that project into nested source search.

## Product Direction

KRN should be a governed memory/source/review layer around Codex, not a fancy
agent zoo. The next work should increase real Codex advantage: better memory
retrieval, learning from prior reviewed feedback, long-range recall, selective
forgetting, or proof that KRN beats no-memory/simple-retrieval baselines on
local coding tasks.

## Current Active Design

`docs/architecture/memory-eval-design.md` says the next meaningful memory
quality work is:

- multi-session memory advantage;
- memory competency matrix;
- temporal/adversarial recall;
- cost and evidence readback.

`docs/architecture/primitive-ledger.md` says current live surfaces include:

- select/apply/verify/forget primitives;
- company-pattern memory advantage proxy eval;
- DB-backed memory advantage smoke;
- governed second-opinion Claude reviewer.

## Review Questions

1. Is the next highest-ROI Beads work the multi-session memory advantage eval,
   or is there a stronger current-state priority?
2. Which concrete Beads should exist next, with dependencies and verification?
3. What should be explicitly rejected to avoid reverting into decorative brain
   work?
4. What proof would make the next slice meaningful rather than another narrow
   smoke?

## Decision

Selected next priority: `mise-en-palace-bvwi` — DB-backed multi-session memory
advantage through live repositories.

Reason: the current kernel already has an in-memory multi-session proxy
(`mise-en-palace-jmfl`), competency matrix expansion (`mise-en-palace-87w0`),
cost/evidence readback (`mise-en-palace-ebxq`), and one DB-backed seeded
brain-search smoke (`mise-en-palace-yb62`). The next useful proof is their
intersection: Session A reviewed evidence must persist through live
repositories and Session B must retrieve that store-backed memory/source without
active-doc context.

## Beads Created

- `mise-en-palace-bvwi`: prove multi-session memory advantage through live
  repositories.
  - open P1;
  - advances beyond already-closed `jmfl/87w0/ebxq/yb62`;
  - verification: `pnpm db:smoke:brain-search` or a new narrow DB smoke,
    `pnpm typecheck`, `pnpm quality:fallow:ci`, `git diff --check`.
- `mise-en-palace-lheq`, `mise-en-palace-hiz6`, `mise-en-palace-1bgy`, and
  `mise-en-palace-mklo` were created by the first planning pass but closed as
  duplicate/premature after checking existing closed Beads.

## Beads Readback

```txt
post-slice queue:
bd ready -> mise-en-palace-bvwi only
bd list --status=open -> mise-en-palace-bvwi only

mise-en-palace-bvwi
status: open
priority: P1
title: db: prove multi-session memory advantage through live repositories
acceptance: baseline before Session A memory/source cannot select the answer;
Session B DB-backed run selects expected MemoryRecord and source ids; output
reports selected ids, baseline class, proof/non-proof, and cleanup; test/smoke
fails if selected knowledge omits Session A memory/source id.
verification: pnpm db:smoke:brain-search or a new narrow DB smoke; pnpm
eval:memory-advantage if fixture touched; pnpm typecheck; pnpm
quality:fallow:ci; git diff --check.

corrected duplicate/premature planning artifacts:
mise-en-palace-lheq -> closed, duplicate/superseded by already-closed
  mise-en-palace-jmfl in-memory multi-session proxy.
mise-en-palace-hiz6 -> closed, duplicate/superseded by already-closed
  mise-en-palace-87w0 memory competency matrix.
mise-en-palace-1bgy -> closed, duplicate/superseded by already-closed
  mise-en-palace-ebxq cost and baseline readback.
mise-en-palace-mklo -> closed as premature worker decision planning until a
  non-duplicate DB-backed multi-session proof exists.
```

## Rejected Next Moves

- Broad worker daemon: rejected until a named product loop needs execution.
- Dashboard/API/MCP: rejected before memory advantage is materially stronger.
- Naming sweep: rejected unless tied to active confusion in executable code.
- External benchmark platform: rejected before deterministic local cases are
  strong.
- More doc-prose eval: rejected; next proof must exercise executable eval or
  smoke code.

## Proof Boundary

Proves:

- Beads queue has a non-duplicate next product task;
- the next direction is concrete and not a duplicate of closed proxy work;
- the first slice targets real memory advantage beyond the latest DB smoke.

Does not prove:

- KRN already beats plain Codex on broad tasks;
- memory retrieval quality is solved;
- worker execution is needed;
- Claude is correct about the priority.
- non-duplication is executable-proofed; it is a code-review judgment from
  Beads titles/descriptions and closed-work readback.

## Non-Goals

- No dashboard/API/MCP.
- No worker daemon unless a named product loop demands it.
- No broad benchmark platform.
- No naming sweep unless it removes proven confusion in active code.
- No doc-prose eval theater.
- No recreating deleted schema/policy surfaces.
