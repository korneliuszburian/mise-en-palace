# Placeholder Vocabulary Audit

Date: 2026-07-03.

Beads: `mise-en-palace-ww2s`.

## Scope

Audited active TypeScript source under `packages/**/src`, excluding tests and
historical docs/materials, for misleading placeholder vocabulary:
`normalized`, `final`, `new`, `temp`, `tmp`, `misc`, `stuff`, `data`, `result`,
and `value`.

## Findings

- Patched `packages/cli/src/runKnowledgeCardsCommand.ts`: renamed HTML preview
  payload variable from `data` to `serializedResource`.
- Patched `packages/cli/src/runPlanCommand.ts`: replaced vague proof wording
  with `compacted bridge queries`, matching the actual bridge-query mechanism.
- Rejected broad `value` renames at unknown/input parser boundaries. Those names
  are intentional TypeScript boundary vocabulary.
- Rejected broad `result` renames for command outputs, `safeParse` outputs, and
  DB query rows where the local type or function name already carries the domain.
- Rejected HTML `data-*` attributes and SQL `customType<{ data; driverData }>`
  because those are platform/library vocabulary, not placeholder slop.

## Proof Boundary

Proves a bounded active-source audit happened and two high-confidence
reviewability issues were removed.

Does not prove the repository is free of every weak local name, nor justify a
mass rename of semantically valid parser or platform vocabulary.
