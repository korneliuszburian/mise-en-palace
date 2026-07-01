# EJ7 Retained Pattern Query Shaping

Date: 2026-07-02

## Verdict

positive

EJ7 repaired the gap exposed by 9DT: short `krn brain knowledge` queries could
find `pattern:ts-boundary-brain-knowledge-parser-exemplar`, but long
`krn plan` task contracts could still return:

```txt
Retained pattern selection: rejected_or_deferred
Retained pattern IDs: none
```

The repair is intentionally bounded. The plan bridge now retries compact
mechanism-query windows after the full task query misses. This keeps the
search/ranking behavior unchanged and gives long task contracts a deterministic
way to surface local reference-implementation patterns when the matching
mechanism terms are present in the task.

## Source-To-Decision

Source: 9DT report plus live `krn brain knowledge` and `krn plan` readbacks from
this slice.

Mechanism: brain knowledge search requires all query tokens to match. Long task
contracts can put the useful mechanism phrase in the middle of the task after
boilerplate terms like `improve plan query shaping`, so a single prefix compact
query still misses.

KRN implication: pre-coding plan selection should try bounded mechanism windows
before classifying retained pattern selection as rejected/deferred.

Decision: add deterministic 3-token mechanism windows to retained-pattern plan
query retries, while preserving the existing compact query helper behavior used
by brain search.

Consumer: `krn plan`, persisted plan metadata, Codex brief retained-pattern
context, and future parser/metadata boundary tasks.

Falsifier: a future long parser/metadata task reports retained pattern IDs as
none while `krn brain knowledge --text "typescript parser exemplar"` still
selects `pattern:ts-boundary-brain-knowledge-parser-exemplar`.

## Changed

```txt
packages/cli/src/brainKnowledgeQuery.ts
packages/cli/src/runPlanCommand.ts
packages/cli/src/runCli.test.ts
```

The change does not add semantic embeddings, ranking changes, DB schema,
dashboard/API/MCP, crawler, worker daemon, or Memory Core mutation.

## Behavior Proof

Before the repair, the long plan query missed:

```txt
krn plan --task "Use the retained TypeScript parser exemplar in one real EvidenceBundle metadata boundary repair without broad schema work or Memory Core mutation"

Retained pattern selection: rejected_or_deferred
Retained pattern IDs: none
```

After the repair, the same class of long task selects the parser exemplar:

```txt
Retained pattern selection: selected
Retained pattern query: typescript parser exemplar
Retained pattern IDs: ts-boundary-brain-knowledge-parser-exemplar
```

Regression coverage:

```txt
pnpm --filter @krn/cli test -- runBrainSearchCommand runCli
```

This asserts that the long EJ7 task persists:

```txt
retainedPatternSelection.status: selected
retainedPatternSelection.query: typescript parser exemplar
selectedPatternIds:
  - ts-boundary-brain-knowledge-parser-exemplar
```

## Persisted Plan

Command:

```txt
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn \
  pnpm --filter @krn/cli krn plan \
  --task "Improve retained-pattern plan query shaping so long TypeScript parser exemplar metadata-boundary tasks select pattern:ts-boundary-brain-knowledge-parser-exemplar without ranking, schema, or Memory Core changes" \
  --persist
```

Persisted IDs:

```txt
operatorIntent: 1e912f88-e589-405b-be05-acdfd78a092a
taskContract: d526eff2-7eaa-4e10-8cc4-34059452cec0
harnessPlan: ad554cfc-991e-4ae3-9ef5-0672266ab557
contextAssembly: ffe7bb1a-2ff7-493d-a8ce-109527bad540
executionRun: 208f9343-9378-49de-8407-18886f760ea7
```

Plan result:

```txt
Retained pattern selection: selected
Retained pattern query: typescript parser exemplar
Retained pattern IDs: ts-boundary-brain-knowledge-parser-exemplar
```

## Commands

Passed:

```txt
git fetch --prune
git status --short --branch
bd prime
bd show mise-en-palace-ej7 --json
bd update mise-en-palace-ej7 --claim
pnpm --filter @krn/cli krn brain knowledge --catalog-file docs/brain-knowledge/catalog.json --text "parser exemplar" --limit 5 --json
pnpm --filter @krn/cli krn brain knowledge --catalog-file docs/brain-knowledge/catalog.json --text "typescript parser exemplar" --limit 5 --json
pnpm --filter @krn/cli krn brain knowledge --catalog-file docs/brain-knowledge/catalog.json --text "consensus heartbeat review" --limit 5 --json
pnpm --filter @krn/cli krn plan --task "Use the retained TypeScript parser exemplar in one real EvidenceBundle metadata boundary repair without broad schema work or Memory Core mutation"
pnpm --filter @krn/cli test -- runBrainSearchCommand runCli
pnpm typecheck
pnpm test
pnpm quality:fallow:ci
git diff --check
pnpm db:ready
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn plan --task "Improve retained-pattern plan query shaping so long TypeScript parser exemplar metadata-boundary tasks select pattern:ts-boundary-brain-knowledge-parser-exemplar without ranking, schema, or Memory Core changes" --persist
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn evidence capture --persist --run-id 208f9343-9378-49de-8407-18886f760ea7 ...
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn observe --run-id 208f9343-9378-49de-8407-18886f760ea7 --persist
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn reflect --scope run:208f9343-9378-49de-8407-18886f760ea7 --persist
```

Expected initial misses:

```txt
pnpm --filter @krn/cli krn brain knowledge --catalog-file docs/brain-knowledge/catalog.json --text "Use the retained TypeScript parser exemplar in one real EvidenceBundle metadata boundary repair without broad schema work or Memory Core mutation" --limit 5 --json
pnpm --filter @krn/cli krn brain knowledge --catalog-file docs/brain-knowledge/catalog.json --text "typescript parser exemplar one" --limit 5 --json
```

The misses confirmed that the repair needed a shorter mechanism window, not a
broader ranking rewrite.

## Evidence, Observe, Reflect

Evidence capture:

```txt
evidenceBundle: 6361ada1-1bfd-46d5-8455-18c0f8662d45
reviewAssessment: 98e8cba1-6501-4546-b224-b4e4b60ede79
feedbackDelta: 9ca1dac9-4c2f-4287-8083-5a9e32c260c6
changed files: intended=8, unrelated=0, unknown=0
patternUsefulness: ts-boundary-brain-knowledge-parser-exemplar=helped
Memory mutation: none
```

Observe:

```txt
observationGroup: 2093bc25-d4e2-489a-b73d-30b454dd52f4
observationItems: 5
Memory mutation: none
```

Reflect:

```txt
reflectionRecord: f279e84f-e119-4469-9f60-f6bfa600eb07
observationsSelected: 5
findings: 0
candidateRowsWritten: no
Memory mutation: none
```

## Pattern Usefulness

`pattern:ts-boundary-brain-knowledge-parser-exemplar` was useful as a retained
reference-implementation pattern. It named the intended parser-boundary shape:
unknown-first external input, finite field narrowing, explicit proof boundaries,
and regression tests.

This does not prove that KRN has a runtime clone workflow, recipe hashing,
semantic pattern ranking, or general TypeScript quality enforcement. It proves
one plan bridge can now surface the retained exemplar before coding.

## What This Does Not Prove

This does not prove:

```txt
activation scoring quality
semantic search quality
owner-file recall completeness
Memory Core mutation safety
DB schema correctness beyond the current persisted plan
that all retained patterns should be recalled through 3-token windows
that KRN is product-ready
```

## Next

Use the repaired retained-pattern plan bridge in the next product-facing shared
brain slice. Prefer real pattern application or audit cleanup that changes code
quality over another guard-only task.
