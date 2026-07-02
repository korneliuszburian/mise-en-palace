# 9sg Brain Knowledge CLI Filter Values

Date: 2026-07-02

Issue: `mise-en-palace-9sg`

Commit: this commit; final SHA is recorded in the session summary.

## Goal

Remove the remaining local BrainKnowledge CLI filter vocabulary copies after
3dy.

Target:

```txt
packages/harness/src/brainKnowledgeReadModel.ts
packages/cli/src/parseKnowledgeArgs.ts
packages/cli/src/parseKnowledgeArgs.test.ts
```

## Source To Decision

Source:

- `packages/harness/src/brainKnowledgeReadModel.ts`;
- `packages/cli/src/parseKnowledgeArgs.ts`;
- `docs/reviews/controlled-dogfood/2026-07-02-3dy-brain-knowledge-vocabulary-values/REPORT.md`.

Mechanism:

- 3dy exported canonical `reviewability` and `nextAction` value tuples.
- Source inspection showed the same drift shape still existed for CLI
  `kind`, `status`, and `usefulnessOutcome` filters.
- Exported `as const` value tuples let runtime validators and public union types
  share one source.

KRN implication:

- BrainKnowledge CLI filters should consume canonical runtime values from the
  read-model owner instead of maintaining local literal arrays.

Decision:

- Export `brainKnowledgeKindValues`, `brainKnowledgeStatusValues`,
  `brainKnowledgeUsefulnessOutcomeValues`, and
  `brainKnowledgeUsefulnessOutcomeFilterValues`.
- Derive corresponding public types from those value tuples where applicable.
- Reuse the canonical values in `parseKnowledgeArgs`.
- Add a negative status-filter test.

Consumer:

- `parseKnowledgeArgs`;
- BrainKnowledge read-model parsers;
- future CLI filter consumers that need the same vocabulary.

Falsifier:

- a future BrainKnowledge CLI filter accepts a value rejected by
  `brainKnowledgeReadModel.ts`;
- a future vocabulary edit changes a public union without changing runtime
  parser values;
- invalid `status`, `kind`, or `usefulnessOutcome` filters stop failing closed.

## KRN Plan Readback

Command:

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn \
pnpm --filter @krn/cli krn plan \
  --task "Canonicalize remaining brain-knowledge CLI filter vocabulary values so kind, status, and usefulness outcome filters reuse canonical BrainKnowledgeReadModel runtime value sources where source inspection proves sharing is safe" \
  --persist
```

Persisted IDs:

```txt
executionRun: 7531cc09-ae82-4720-8f72-6ac869369858
taskContract: 45a72968-aed9-4ffe-a8da-43fbcd618e0e
contextAssembly: 6f38a6b9-3bd6-4434-b120-e29980c78ca4
```

Activation usefulness:

```txt
weak for owner-file recall
```

The DB-backed plan selected guardrail/source context but missed the direct
owner files for this parser-boundary slice. Source inspection with `rg` found
the owner files.

## Changed

- Exported canonical BrainKnowledge kind/status/usefulness runtime values.
- Derived public BrainKnowledge kind/status/usefulness union types from those
  values.
- Removed local kind/status/usefulness filter arrays from `parseKnowledgeArgs`.
- Added invalid status-filter coverage.

## Verification

Passed:

```sh
pnpm --filter @krn/cli test -- parseKnowledgeArgs runKnowledgeCardsCommand
pnpm --filter @krn/harness test -- brainKnowledgeReadModel
pnpm --filter @krn/harness test -- activePlanInvariants
pnpm typecheck
pnpm test
pnpm quality:fallow:ci
pnpm db:ready
git diff --check
```

Fallow:

```txt
Audit scope: 4 changed files vs 984bdae8748f
No issues in changed files
```

## Persisted Evidence Loop

Persisted evidence capture:

```txt
evidenceBundle: 05fcf693-fb57-4ddf-b062-8d94c5ad21d7
reviewAssessment: b518b7bf-5fb7-4ccc-88b7-c4434fcf63ef
feedbackDelta: d9e79969-e3bf-4cdc-a83e-39e1fb0715ec
changed files: 9 intended, 0 unrelated, 0 unknown
commands: 8 operator_reported / passed
sourceUsefulnessOutcomes: none
patternUsefulnessOutcomes: none
```

Persisted observe/reflect:

```txt
observationGroup: bee7941d-0608-4a1d-8f84-25d0c75d0456
observationItems: 5
reflectionRecord: a03da7a2-24e4-4285-b04f-acce9a531b32
observationsSelectedByReflect: 5
memoryCandidateRowsWritten: no
memoryMutation: none
```

## Proof

This proves:

- the remaining product-facing BrainKnowledge CLI filter vocabularies reuse
  canonical read-model runtime values;
- invalid status filters now have explicit regression coverage;
- the change did not add a parser framework, DB schema, dashboard, API, MCP, or
  broad vocabulary rewrite.

This does not prove:

- ranking quality improved;
- all possible BrainKnowledge vocabularies are globally canonicalized;
- activation owner-file recall is sufficient;
- product readiness.

## Review Burden Delta

Before:

```txt
reviewer had to compare copied CLI kind/status/usefulness arrays with
BrainKnowledge read-model parser sets
```

After:

```txt
reviewer can inspect one read-model vocabulary source and small CLI consumers
that import it
```

Verdict:

```txt
positive
```
