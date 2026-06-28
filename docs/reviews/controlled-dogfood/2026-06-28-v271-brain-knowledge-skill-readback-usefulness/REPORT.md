# V271 Brain Knowledge Skill Readback Usefulness Trial

Status: complete.

Date: 2026-06-28

## Executive Verdict

V271 proved the new skill readback hook was useful immediately: running the
exact catalog command documented in V270 failed from the natural
`pnpm --filter @krn/cli` execution path because the CLI resolved
`docs/brain-knowledge/catalog.json` relative to `packages/cli`.

The repair made `krn knowledge cards` resolve explicit input files from the
current package cwd first and then from the nearest repo root. After the repair,
both skill-guidance commands work without changing the skill examples.

## Scope

Changed:

- `packages/cli/src/runKnowledgeCardsCommand.ts`
- `packages/cli/src/runKnowledgeCardsCommand.test.ts`

Non-goals preserved:

- no UI/API/MCP;
- no ranking engine;
- no directory crawling;
- no DB schema or migration;
- no memory/source mutation;
- no hidden semantic hooks.

## Finding

Before repair:

```sh
pnpm --filter @krn/cli krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --text unknown-first
```

failed with:

```txt
Invalid brain knowledge catalog file: docs/brain-knowledge/catalog.json
```

Mechanism:

```txt
pnpm --filter @krn/cli
  -> executes the CLI package from packages/cli
  -> root-relative docs/... path does not exist there
```

KRN implication:

```txt
Skill-routed catalog readback must support root-relative repo paths, otherwise
Codex and operators cannot use the documented command in the normal package
execution path.
```

## Repair

`runKnowledgeCardsCommand` now resolves card, pattern, and catalog input files
with this order:

```txt
1. path relative to command cwd;
2. path relative to nearest pnpm workspace root.
```

This keeps the surface explicit-file only. It does not scan directories or rank
knowledge.

## Card Usefulness

| Card/query | Before | After | Usefulness |
|---|---|---|---|
| `unknown-first` | missing because command failed | returned `pattern:ts-boundary-unknown-first-result-state` | helped: exposed the path-resolution bug and confirmed the skill command now works |
| `source-to-decision` | expected to fail for the same reason | returned `pattern:source-to-decision-retention-gate` | helped: confirmed both V270 skill commands are executable |

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm --filter @krn/cli krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --text unknown-first` before repair | failed | V270 skill command was not executable through natural package cwd. | Does not prove the catalog content was wrong. |
| `pnpm --filter @krn/cli test -- runKnowledgeCardsCommand` | passed | Regression covers root-relative catalog resolution from a package cwd. | Does not prove UI/search readiness. |
| `pnpm --filter @krn/cli krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --text unknown-first` after repair | passed | Skill command returns the TypeScript pattern card. | Does not prove ranking quality or product readiness. |
| `pnpm --filter @krn/cli krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --text source-to-decision` after repair | passed | Skill command returns the source-to-decision pattern card. | Does not prove research completeness. |

## Source-To-Decision

- Source: V270 skill readback hook and the failed V271 command.
- Mechanism: executable skill guidance requires root-relative paths to resolve
  from package execution cwd.
- KRN implication: catalog readback must be normalized before UI/search, or
  future surfaces will inherit fragile path assumptions.
- Decision: repair explicit input file resolution in the CLI readback command
  and guard package-cwd catalog resolution.
- Does not prove: UI/search readiness, ranking quality, broad pattern coverage,
  DB-backed knowledge, or product readiness.
- Consumer: V272 brain knowledge UI/search readiness gate.
- Falsifier: a future `pnpm --filter @krn/cli krn knowledge cards --catalog-file
  docs/brain-knowledge/catalog.json ...` command fails from repo root.

## Next Recommended Action

Proceed to:

```txt
V272-00 Brain Knowledge UI/Search Readiness Gate
```

The CLI catalog is now explicit, guarded, skill-routed, and root-path usable.
The next decision should be whether the smallest web/search preview can safely
render the same read-only card resource without adding mutation, API/MCP,
ranking, or dashboard scope.
