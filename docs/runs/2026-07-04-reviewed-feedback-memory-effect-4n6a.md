# Reviewed Feedback Memory Effect

Status: completed for `mise-en-palace-4n6a`.

## Change

`pnpm eval:memory-advantage` now reports a per-case
`reviewed_feedback_effect` block.

Each block includes:

- prior feedback, evidence, and review refs;
- the later task query;
- required memory/source knowledge id;
- no-memory baseline result;
- simple lexical baseline result and top selected id;
- whether simple lexical retrieval was weaker than KRN;
- KRN memory result;
- selected memory ids and source claim ids;
- selected-context and plan/brief context-size proxies;
- `proofStatus`.

This turns the existing multi-session fixture shape into a direct readback of
test-time learning: a reviewed feedback record from a prior session is visible
beside the later task selection that it is supposed to improve.

## Verification

```sh
rtk pnpm --filter @krn/cli test -- memoryAdvantageEval
rtk pnpm eval:memory-advantage
```

## Proof Boundary

Proves:

- the eval output reports prior reviewed feedback refs beside later selected
  memory/source ids;
- no-memory baseline misses are visible for later tasks that KRN can answer with
  reviewed memory/source context;
- at least one held-out learning case reports simple lexical retrieval as
  weaker while KRN selects the required memory/source packet;
- context-size readback is visible for both brain-search selected context and
  plan/brief context.

Does not prove:

- automatic Memory Core promotion from arbitrary evidence or feedback;
- production retrieval quality;
- broad superiority over vanilla Codex;
- LLM output quality;
- live Postgres runtime behavior.
