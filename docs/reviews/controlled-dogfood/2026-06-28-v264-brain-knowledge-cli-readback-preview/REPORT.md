# V264 Brain Knowledge CLI Readback Preview

Status: complete.

Date: 2026-06-28

## Executive Verdict

V264 added the smallest acceptable readback preview for brain knowledge cards:
`krn knowledge cards --card-file <path>`. It is useful as a pre-UI operator
surface because it parses explicit `BrainKnowledgeReadModel` files, filters
them, and renders proof boundaries. It does not make KRN product-ready, does not
create web UI/search, and does not produce cards from live DB or retained
patterns yet.

## Scope

Changed:

- `packages/harness/src/index.ts`
- `packages/cli/src/parseArgs.ts`
- `packages/cli/src/parseKnowledgeArgs.ts`
- `packages/cli/src/runCli.ts`
- `packages/cli/src/runKnowledgeCardsCommand.ts`
- CLI tests for parser, command, and dispatcher
- `docs/architecture/cli-surfaces.md`
- root active plan files

Non-goals preserved:

- no web UI;
- no API/MCP;
- no DB schema;
- no ranking engine;
- no broad knowledge ingestion;
- no Memory Core mutation.

## KRN Plan Output

Command:

```sh
pnpm --filter @krn/cli krn plan --task "Expose brain knowledge cards through a bounded read-only CLI preview without building UI API MCP DB schema or ranking engine"
```

Result:

- persistence: disabled;
- context included: 0;
- context excluded: 0;
- context status: abstained;
- activation diagnostics: empty activation store;
- expected evidence: `pnpm typecheck`, `pnpm test`, `git diff --check`.

Interpretation:

The active plan and local source inspection carried the slice. KRN activation
did not select useful context for this no-store preview. This is useful evidence
for the recurring pattern: the workflow and standards help, while activation is
not yet a reliable owner-context selector in no-store mode.

## Implementation

The new preview command is:

```sh
krn knowledge cards \
  --card-file tests/fixtures/brain-knowledge/cards/ts-boundary-unknown-first-result-state.json \
  --text unknown-first
```

It supports:

- repeatable explicit card files;
- `--kind`;
- `--status`;
- `--reviewability`;
- `--text`;
- `--json`.

Boundary:

- reads explicit card files only;
- parses file JSON as unknown through the existing card parser;
- filters locally with the harness search helper;
- renders `access: read_only` and `mutation: none`;
- states what the preview proves and does not prove.

## Pattern Gate

Source:

- `docs/architecture/observability-read-models.md`
- `tests/fixtures/brain-knowledge/cards/ts-boundary-unknown-first-result-state.json`
- `packages/harness/src/brainKnowledgeReadModel.ts`
- `docs/architecture/cli-surfaces.md`

Mechanism:

Typed readback should happen over explicit knowledge cards before building web
UI/search. CLI args and card JSON are external inputs, so the implementation
keeps CLI parsing explicit and narrows card JSON through
`parseBrainKnowledgeReadModel`.

KRN implication:

The pattern brain needs operator-visible readback before UI/search, but the
surface must remain read-only and must not imply ranking, persistence, or Memory
Core authority.

Decision:

Add `krn knowledge cards` as a bounded read-only preview and open V265 to
produce or catalog cards from retained patterns so cards do not remain manual
fixtures.

Consumer:

- future card producer/catalog;
- future UI/search read-model work;
- operator pattern-brain readback loop.

Falsifier:

The CLI starts scanning/ranking/mutating knowledge, or operators treat explicit
card-file preview as product search.

## TypeScript Boundary

Boundary classification:

- CLI args: external input parsed by `parseKnowledgeArgs`;
- JSON card files: external input read by `readJsonObject`;
- domain narrowing: `parseBrainKnowledgeReadModel`;
- public type change: `BrainKnowledgeReadModel` helper is exported through
  `@krn/harness`.

Pattern:

- `ts-boundary-unknown-first-result-state` applies to card file parsing:
  JSON is not trusted directly.
- The result-state part is not expanded here because the command throws a
  focused CLI error for invalid card files and does not create a new domain
  mutation workflow.

Type-safety exceptions:

- none.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm --filter @krn/cli test -- parseKnowledgeArgs runKnowledgeCardsCommand runCli` | passed | CLI parser/command/dispatcher behavior passes focused tests. | Does not prove product search or DB-backed card production. |
| `pnpm --filter @krn/harness test -- brainKnowledgeReadModel` | passed | Harness card parser/search tests still pass after public export. | Does not prove broad knowledge coverage. |
| `pnpm -r --workspace-concurrency=1 typecheck` | passed | Workspace TypeScript boundaries compile. | Does not prove runtime usefulness. |
| `pnpm test` | passed | Full workspace test suite passes locally. | Does not prove CI or product readiness. |
| `pnpm --filter @krn/cli krn knowledge cards --card-file ../../tests/fixtures/brain-knowledge/cards/ts-boundary-unknown-first-result-state.json --text unknown-first` | passed | Text preview can read and filter the card fixture. | Does not prove ranking, DB, or UI. |
| `pnpm --filter @krn/cli krn knowledge cards --card-file ../../tests/fixtures/brain-knowledge/cards/ts-boundary-unknown-first-result-state.json --json` | passed | JSON preview emits read-only resource shape. | Does not prove API/MCP readiness. |

One manual invocation with an extra package-script `--` failed before the
correct invocation. That failure only proves package-script arg forwarding must
be used correctly.

## Brain Usefulness

Selected/used/helped context:

- `GOAL.md`, `PLAN.md`, `PLANS.md`: helped keep the active stream bounded.
- `docs/architecture/cli-surfaces.md`: helped classify the preview boundary.
- `BrainKnowledgeReadModel` helper and fixture: directly used.
- KRN no-store plan: abstained; useful as evidence of weak activation in this
  mode, not as implementation guidance.

Missing context:

- a durable producer/catalog source for cards. This becomes V265.

Brain ROI:

Positive for workflow and readback discipline. Weak for activation selection in
no-store preview.

## Outcome

V264 makes the brain knowledge loop visibly queryable in CLI form:

```txt
retained card fixture -> typed parser/search helper -> read-only CLI preview
```

This is still not the final brain. The next gap is:

```txt
retained pattern/source decision -> deterministic BrainKnowledgeReadModel card
```

## Next Recommended Action

Proceed to:

```txt
V265-00 Brain Knowledge Card Producer From Retained Patterns
```

Do not build web UI/API/MCP yet.
