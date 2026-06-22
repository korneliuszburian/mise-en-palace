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
- MM-01 in the controlled plan is the docs-only plan correction slice.
- Pre-plan observation-domain contracts exist at commit `acca6d2`; do not mark
  controlled MM-08 complete until that slice audits and reconciles them.

## Next Action

Read `docs/plans/memory-ideal-state/PLAN.md` top to bottom and continue from
the first unchecked Progress item.

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
