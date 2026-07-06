# Decision Corpus Expansion Taxv

Date: 2026-07-06

Bead: `mise-en-palace-taxv`

## Change

Expanded the compact decision-corpus import fixture from one current decision,
one stale path, one rejected path, and one case to:

- five current decisions;
- two stale decisions;
- two rejected decisions;
- five task cases.

The large notes-baseline corpus fixture was not hand-edited. The added rows
cover DB-backed corpus import, live Codex packet obedience, third-repo
portability, anti-vanity naming, stale recorded-obedience proof, and rejected
product-readiness overclaim paths.

## Verification

```sh
pnpm --filter @krn/cli test -- decisionCorpusImport notesBaselineEval decisionPacketEval
pnpm eval:decision-corpus-import
pnpm eval:decision-packet
pnpm --filter @krn/cli typecheck:tests:clean
pnpm docs:lint
pnpm quality:fallow:ci
git diff --check
```

Result: passed.

`eval:decision-corpus-import` readback:

- imported decisions: 9;
- imported notes: 9;
- imported cases: 5;
- current decisions: 5;
- stale decisions: 2;
- rejected decisions: 2;
- merged corpus: 43 decisions, 43 notes, 22 cases;
- notes-baseline status: pass;
- decision-packet status: pass.

## Proves

- Compact source-to-decision import can grow the decision-packet corpus without
  hand-editing the large notes-baseline fixture.
- Imported current/stale/rejected links stay validated by the importer.
- The expanded merged corpus still passes the notes-baseline and decision-packet
  eval gates.

## Second Opinion

`second-opinion-claude` reviewed the uncommitted diff with
`SECOND_OPINION_BASE=HEAD` and returned `approve` / `LOW`.

Non-blocking notes:

- some stale/rejected imported decisions are reused across multiple cases;
- the duplicate-case-id regression now mutates one case instead of every case;
- the live-obedience current/stale pair intentionally shares one evidence
  report while separating stale recorded-fixture proof from the bounded live
  pilot decision.

## Does Not Prove

- Source truth.
- Live Codex obedience beyond the separate live pilot.
- Arbitrary corpus quality.
- Product readiness.
- DB ingestion; that remains covered by `db:smoke:decision-corpus-import`.
