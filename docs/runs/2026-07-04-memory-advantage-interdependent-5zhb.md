# Memory Advantage Interdependent Case

Date: 2026-07-04
Bead: `mise-en-palace-5zhb`

## Scope

Extended `eval:memory-advantage` with one MemoryArena-inspired interdependent
case. Session A records reviewed Codex-output evidence-shape feedback. Session B
asks whether a final Codex answer can simply claim KRN context use in a concise
summary.

## Behavior Change

The eval now reports:

- 13 total company-pattern cases;
- 9 held-out cases;
- all four memory competencies still passing;
- `interdependentSessionCaseCount: 1`;
- 2 execution-contract decision cases.

The new held-out case proves:

- no-memory baseline misses;
- simple lexical baseline selects `pattern:summary-only-krn-context-claim`;
- KRN selects `source:codex-output-evidence-shape-required`;
- the deterministic execution contract changes from
  `contract:summary-only-krn-context-claim` to
  `contract:evidence-shaped-krn-context-claim`.

## Verification

```sh
pnpm --filter @krn/cli test -- memoryAdvantageEval
pnpm eval:memory-advantage
pnpm run typecheck
pnpm quality:fallow:ci
pnpm eval:krn:smoke
git diff --check
```

Second opinion:

- R1: `approve_with_fixes`, MEDIUM. Accepted the request for stronger
  interdependent fixture drift proof and explicit hit-count math.
- R2: `approve`, LOW. No findings or evidence gaps after adding the missing
  drift/readback assertions.

## Non-Proof

This does not prove arbitrary task superiority over vanilla Codex, production
retrieval quality, live Codex execution, source truth, prompt adherence, or
product readiness.
