# V265 Brain Knowledge Card Producer From Retained Patterns

Status: complete.

Date: 2026-06-28

## Executive Verdict

V265 removed the first manual drift point in the pattern brain readback loop.
The retained TypeScript boundary pattern now has a structured source decision
under `docs/patterns/retained-patterns/`, and harness code can produce the
matching `BrainKnowledgeReadModel` card deterministically. This is not broad
research ingestion, not DB-backed card production, and not UI/search product
readiness.

## Scope

Changed:

- `docs/patterns/retained-patterns/ts-boundary-unknown-first-result-state.json`
- `docs/patterns/typescript-boundary-patterns.md`
- `packages/harness/src/brainKnowledgeReadModel.ts`
- `packages/harness/src/brainKnowledgeReadModel.test.ts`
- `packages/harness/src/brainKnowledgeReadModelInvariants.test.ts`
- root active plan files

Non-goals preserved:

- no markdown/YAML parser;
- no broad knowledge ingestion;
- no source crawler;
- no web UI/API/MCP;
- no DB schema;
- no ranking engine;
- no memory/source mutation.

## KRN Plan Output

Command:

```sh
pnpm --filter @krn/cli krn plan --task "Produce BrainKnowledgeReadModel cards from retained pattern decisions without parsing markdown or building broad ingestion"
```

Result:

- persistence: disabled;
- context included: 0;
- context excluded: 0;
- context status: abstained;
- activation diagnostics: empty activation store;
- expected evidence: `pnpm typecheck`, `pnpm test`, `git diff --check`.

Interpretation:

The KRN plan did not provide owner context in no-store mode. The active stream,
source inspection, and V264/V260/V262/V263 evidence guided the implementation.

## Implementation

Added a structured retained-pattern source:

```txt
docs/patterns/retained-patterns/ts-boundary-unknown-first-result-state.json
```

Added producer/readback primitives:

```ts
parseRetainedPatternDecision(value: unknown)
brainKnowledgeCardFromRetainedPatternDecision(pattern)
```

The producer maps:

```txt
RetainedPatternDecision -> BrainKnowledgeReadModel
```

and test coverage asserts that the generated card equals the current concrete
card fixture.

## Pattern Gate

Source:

- V257 retained pattern decision;
- V260 read-model contract;
- V262 concrete card fixture;
- V263 parser/search helper;
- V264 CLI readback preview.

Mechanism:

Manual card fixtures can drift from retained patterns. A structured source
decision plus deterministic producer gives future CLI/UI/search a stable
read-model source without scraping markdown.

KRN implication:

Pattern brain knowledge should flow from retained decisions into typed cards.
Markdown may document, but it should not be the parsed runtime/card source.

Decision:

Add a structured retained-pattern source and producer. Open V266 to let the CLI
preview consume retained pattern files directly.

Consumer:

- V266 pattern-file CLI preview;
- future durable card catalog;
- future UI/search read model.

Falsifier:

The knowledge card can drift from the retained pattern source while tests still
pass, or future code must parse markdown to produce cards.

## TypeScript Boundary

Boundary classification:

- retained pattern JSON is external/docs input;
- `parseRetainedPatternDecision(value: unknown)` validates it;
- producer accepts a typed `RetainedPatternDecision`;
- no `any`, double assertion, or type weakening added.

Pattern:

- `ts-boundary-unknown-first-result-state` applies to retained-pattern JSON
  parsing: source JSON is unknown until validated.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm --filter @krn/harness test -- brainKnowledgeReadModel brainKnowledgeReadModelInvariants` | passed | Producer, parser, fixture drift guard, and read-model invariants pass. | Does not prove broad pattern coverage. |
| `pnpm -r --workspace-concurrency=1 typecheck` | passed | Workspace TypeScript compiles. | Does not prove runtime product usefulness. |
| `pnpm test` | passed | Full workspace test suite passes locally. | Does not prove CI until pushed. |
| `git diff --check` | passed | Diff has no whitespace errors. | Does not prove behavior. |

## Brain Usefulness

Selected/used/helped context:

- `PLANS.md` and `PLAN.md`: helped preserve the active stream and next action.
- V260/V262/V263 artifacts: directly guided the producer.
- KRN no-store plan: did not select context; useful only as evidence of
  no-store activation abstention.

Brain ROI:

Positive for deterministic pattern-brain growth. Weak for activation selection.

## Outcome

The loop is now:

```txt
retained pattern source JSON
  -> typed retained pattern parser
  -> BrainKnowledgeReadModel producer
  -> concrete card fixture
  -> CLI readback preview
```

The next gap is that CLI still reads card files, not retained-pattern files.

## Next Recommended Action

Proceed to:

```txt
V266-00 Brain Knowledge Pattern-File CLI Preview
```

This should let `krn knowledge cards` accept explicit retained pattern files and
render produced cards, still without DB, ranking, UI, API, MCP, or broad
ingestion.
