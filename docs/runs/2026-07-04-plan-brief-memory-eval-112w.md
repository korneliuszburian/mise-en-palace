# Plan/Brief Memory Eval Comparator

Status: completed for `mise-en-palace-112w`.

## Change

`pnpm eval:memory-advantage` now reports plan/brief consumer-surface evidence
beside the existing no-memory, simple-retrieval, and KRN brain/source command
readbacks.

Each case now includes:

- `baseline_plan_brief`: real harness compiler + Codex brief renderer with no
  memory/source store;
- `krn_plan_brief`: the same compiler/renderer with the governed memory/source
  fixture available;
- selected `MemoryRecord` and `SourceClaim` ids;
- rendered brief `MemoryRecord` and `SourceClaim` ids;
- context inclusion count;
- approximate selected evidence payload size and rendered brief size.

The named company-pattern retrieval case now proves:

- baseline plan/brief: `miss`;
- KRN plan/brief: `hit`;
- required memory id:
  `memory:pattern:second-opinion-after-large-slice`;
- required source id:
  `source:second-opinion-after-large-slice`.

The forgetting case still requires `miss` for the obsolete memory id.

## Second Opinion

`second-opinion-claude` reviewed the slice twice.

First verdict:

- `approve_with_fixes`, risk `MEDIUM`;
- accepted finding: the first context pack had an empty diff because it was
  built with the wrong base before commit;
- action: reran the review with visible uncommitted diff and concrete eval
  output evidence.

Second verdict:

- `approve_with_fixes`, risk `LOW`;
- accepted finding: `contextSize` measured selected ids, which could mislead
  consumers into reading it as selected context payload size;
- action: changed `contextSize` to measure selected memory/source payload text.

No further review loop was required.

## Verification

```sh
rtk pnpm --filter @krn/cli test -- memoryAdvantageEval
rtk pnpm eval:memory-advantage
rtk pnpm run typecheck
rtk pnpm quality:fallow:ci
rtk pnpm --filter @krn/harness test -- activePlanInvariants contextHygieneInvariants
rtk git diff --check
```

## Proof Boundary

Proves:

- controlled company-pattern cases can fail a no-memory plan/brief baseline and
  pass when KRN memory/source context reaches the rendered Codex brief;
- output exposes baseline class, selected memory/source ids, rendered brief ids,
  and approximate selected evidence/brief size;
- the existing memory-advantage eval now checks the plan/brief consumer surface,
  not only brain-search selected knowledge.

Does not prove:

- arbitrary Codex output quality;
- production ranking quality;
- broad memory retrieval quality;
- source truth;
- live Postgres behavior;
- product readiness.
