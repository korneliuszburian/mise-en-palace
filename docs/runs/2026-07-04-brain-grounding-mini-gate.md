# Brain Grounding Mini-Gate

## Slice

Bead: `mise-en-palace-8mjf`

## Change

Added a focused CLI regression in
`packages/cli/src/__tests__/runBrainSearchCommand.test.ts` that exercises four
fixed brain grounding queries:

- workers are candidate maintenance contracts, not Codex exec;
- naming standard / no vanity rename / helper extraction rule;
- source-to-decision retention gate;
- TypeScript unknown-first boundary.

Each query uses store-only brain search with a controlled source-search corpus.
The test requires:

- ready `selectedKnowledge` derived from source-search evidence;
- at least one supporting SourceClaim;
- at least one supporting SearchDocument;
- visible SourceDecision support;
- no missing-evidence signal for the fixed grounded corpus.

## Proof

```txt
pnpm --filter @krn/cli test -- runBrainSearchCommand
58 files passed, 371 tests passed

pnpm typecheck
git diff --check
```

## Non-Proof

This is a focused CLI mini-gate, not a live DB smoke. It does not prove source
truth, broad retrieval ranking quality, pgvector quality, or product readiness.
It proves the brain-search readback cannot silently package the fixed
source-looking selectedKnowledge examples without SourceClaim, SearchDocument,
and SourceDecision support in the controlled corpus.

## Rollback Risk

Low. This is a test-only grounding gate. If it fails later, the failure should
indicate either a deliberate readback contract change or a real grounding
regression.
