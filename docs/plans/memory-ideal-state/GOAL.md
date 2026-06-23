# Goal: Controlled Memory Brain Execution

The canonical execution plan for the Memory Brain is:

```txt
docs/plans/memory-ideal-state/PLAN.md
```

Use that file as the living ExecPlan. It owns:

- current status;
- progress checkboxes;
- gate and slice order;
- operating protocol;
- forbidden surfaces;
- verification requirements;
- recovery and rollback rules.

## Current Status

- M27 is complete.
- MM-00 is complete at commit `80f9ef9`.
- MM-00 through MM-56A and MM-16R are complete in the controlled plan.
- MM-56A added the KRN code vocabulary and TypeScript elegance standard at
  `docs/standards/code-vocabulary.md`.

## Next Action

Read `docs/plans/memory-ideal-state/PLAN.md` top to bottom and continue from
the first unchecked Progress item: MM-57 review assess CLI.

## Hard Non-Goals

Do not create:

- Research Foundry;
- Pattern Vault;
- meta-researcher runtime;
- autoresearch product behavior;
- research DB/CLI;
- pattern inspect/promote CLI;
- broad eval suite before dogfood/golden memory cases;
- source crawler;
- runtime markdown memory;
- `.krn` runtime truth;
- hidden chain-of-thought storage.

Golden memory behavior tests are allowed only inside the normal eval lane
described by `PLAN.md`.
