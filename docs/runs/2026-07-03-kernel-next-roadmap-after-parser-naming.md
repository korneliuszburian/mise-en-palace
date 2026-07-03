# Kernel Next Roadmap After Parser/Naming Cleanup

Date: 2026-07-03

## Context

After `oez2` and `ieec`, Beads had no ready/open work except deferred
`mise-en-palace-plnv`. The second-opinion-claude review correctly blocked the
roadmap slice because it had produced no durable next-task output and no
stale-claim rejection artifact.

## Current-Code Checks

- `@krn/schema` deletion is already solved: no source importers remain after the
  cleanup wave.
- Promptfoo as behavior authority is already solved: active package scripts use
  `eval:krn:smoke`; `eval:brain-battle:smoke` is a legacy alias; promptfoo is
  documented as non-authoritative adapter evidence only.
- DB smoke coverage is no longer the old audit state: CI runs `db:smoke`,
  `db:smoke:brain-loop`, `db:smoke:worker-jobs`, and
  `db:smoke:source-graph`.
- Target-fit ranking is not three independent implementations anymore:
  `@krn/core` owns `targetFit`, and CLI surfaces consume it.
- Remaining large CLI surfaces are real: `codexAdapterSmoke.ts` is 17,888 bytes;
  `runHeartbeatPreviewCommand.ts` is 46,786 bytes; `runRunShowCommand.ts` is
  37,668 bytes; `runBrainSearchCommand.ts` is 29,469 bytes.
- CLI test strictness remains partial: package source typecheck excludes
  `src/**/*.test.ts`, while `typecheck:tests:clean` still relies on
  `tsconfig.tests.clean.json`.

## Reseeded Beads Queue

- `mise-en-palace-lr94` P1: reduce `codexAdapterSmoke.ts` ceremony to the real
  adapter boundary.
- `mise-en-palace-dwsz` P1: make CLI package-local tests strictly typechecked
  without a whitelist.
- `mise-en-palace-z406` P2: extract heartbeat preview readback
  parsing/formatting boundary.
- `mise-en-palace-be1t` P2: extract shared CLI command runtime contracts.
- `mise-en-palace-u6ux` P2: require or record embedding model scope for vector
  search.

Deferred human decision remains `mise-en-palace-plnv`: worker package branch
decision. Do not implement a worker daemon or delete worker authority readback
until that branch decision is explicit.

## Decision

Start with `mise-en-palace-lr94`. It is a bounded cleanup of proof machinery
that was explicitly requested earlier, has current measured size evidence, and
does not require product or DB schema decisions.

## Proof Boundary

Proves: the post-cleanup queue is no longer empty, stale audit claims were
checked against current code before task creation, and the next slice is
bounded.

Does not prove: the selected tasks are globally optimal, CLI architecture is
clean, DB runtime smokes passed locally, vector retrieval quality, or product
readiness.
