# Decision Corpus Import Path

Bead: `mise-en-palace-79ae`

## Outcome

Added `eval:decision-corpus-import`, a deterministic product-path bridge from
compact source-to-decision rows into the notes-baseline and decision-packet
corpus shape.

The importer:

- derives SourceClaim, SourceDecisionEdge, SourceRejection, note, and case rows;
- rejects duplicate imported decision/case ids and collisions with the base
  corpus;
- validates that imported task cases point at current, stale, and rejected rows
  in the correct slots;
- runs the merged corpus through notes-baseline and decision-packet evals.

## Result

```txt
status: pass
imported decisions: 3
imported notes: 3
imported cases: 1
merged decisions: 37
merged notes: 37
merged cases: 18
notesBaselineStatus: pass
decisionPacketStatus: pass
```

## Proof

Proves:

- compact source-to-decision import rows can populate the decision-packet corpus
  without hand-editing the large fixture;
- duplicate imported ids, base-corpus collisions, and bad stale/rejected links
  are rejected before merge;
- the dogfood import keeps merged notes-baseline and decision-packet evals
  passing.

Does not prove:

- DB ingestion;
- source truth;
- automatic source promotion;
- live Codex obedience;
- arbitrary corpus quality;
- product readiness.

## Verification

```sh
pnpm --filter @krn/cli test -- decisionCorpusImport
pnpm --filter @krn/cli typecheck:tests:clean
pnpm eval:decision-corpus-import
pnpm docs:lint
pnpm eval:behavior:smoke
pnpm -r --workspace-concurrency=1 --if-present typecheck
pnpm test
pnpm quality:fallow:ci
git diff --check
```

## Second Opinion

`second-opinion-claude` returned `approve_with_fixes` / `LOW`:

- the embedded relative `baseFixturePath` was not exercised by tests;
- the proof wording over-invited note-only collision coverage.

Accepted fixes:

- added a test that runs the importer with the fixture's embedded relative base
  path;
- added a base case-id collision negative test;
- narrowed the proof wording to duplicate imported ids and base-corpus
  collisions.
