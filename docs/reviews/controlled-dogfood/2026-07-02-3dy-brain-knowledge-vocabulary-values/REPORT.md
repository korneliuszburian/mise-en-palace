# 3dy Brain Knowledge Vocabulary Values

Date: 2026-07-02

Issue: `mise-en-palace-3dy`

Commit: this commit; final SHA is recorded in the session summary.

## Goal

Remove the remaining retained-pattern parser vocabulary drift exposed by 4tj.

The selected target was:

```txt
packages/harness/src/brainKnowledgeReadModel.ts
packages/cli/src/retainedPatternPlanBridge.ts
packages/cli/src/parseKnowledgeArgs.ts
```

## Source To Decision

Source:

- `docs/patterns/retained-patterns/ts-boundary-brain-knowledge-parser-exemplar.json`;
- `docs/patterns/retained-patterns/ts-boundary-unknown-first-result-state.json`;
- `packages/harness/src/brainKnowledgeReadModel.ts`;
- `docs/reviews/controlled-dogfood/2026-07-02-4tj-reference-implementation-recipe/REPORT.md`.

Mechanism:

- The retained brain knowledge parser is already the canonical code exemplar for
  unknown-first brain knowledge boundaries.
- Types alone do not prevent runtime parser drift when each consumer copies its
  own allowed-value arrays.
- Exported `as const` value tuples let runtime validators and exported union
  types share the same vocabulary source.

KRN implication:

- Brain knowledge parser consumers should import the canonical runtime value
  source instead of copying literal enum arrays.
- This improves the pattern/research brain without adding a clone runtime,
  dashboard, API, MCP, DB schema, or broad parser framework.

Decision:

- Export `brainKnowledgeReviewabilityValues` and
  `brainKnowledgeNextActionValues` from `brainKnowledgeReadModel.ts`.
- Derive `BrainKnowledgeReviewability` and `BrainKnowledgeNextAction` from those
  value tuples.
- Reuse the exported values in retained-pattern plan metadata parsing and
  knowledge CLI argument parsing.

Consumer:

- `retainedPatternSelectionFromKnowledgeJson`;
- `retainedPatternSelectionFromMetadata`;
- `parseKnowledgeArgs` `--reviewability`;
- future parser-boundary work using BrainKnowledgeReadModel vocabulary.

Falsifier:

- a future parser consumer can accept a reviewability or nextAction value that
  `brainKnowledgeReadModel.ts` rejects;
- a future change edits `BrainKnowledgeReviewability` or
  `BrainKnowledgeNextAction` without updating the runtime parser vocabulary;
- retained-pattern metadata again accepts prose `nextAction`.

## KRN Plan Readback

Command:

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn \
pnpm --filter @krn/cli krn plan \
  --task "Canonicalize brain-knowledge reviewability and nextAction allowed-value sources for parser consumers so retained-pattern plan metadata cannot drift from BrainKnowledgeReadModel vocabulary" \
  --persist
```

Persisted IDs:

```txt
executionRun: 3acce949-4365-44f2-b368-71648de66622
taskContract: 848f8776-e24e-4aea-badb-1f6e601d9449
contextAssembly: 86d3ec79-08e6-46cd-b269-c4cf486188aa
```

Activation usefulness:

```txt
mixed positive
```

The plan selected a relevant retained reference-implementation pattern, but
owner-file recall did not identify `brainKnowledgeReadModel.ts` or
`retainedPatternPlanBridge.ts`. Direct `krn brain knowledge --text
unknown-first` did select the parser exemplar and unknown-first pattern used by
the slice.

## Changed

- Added exported `brainKnowledgeReviewabilityValues` and
  `brainKnowledgeNextActionValues`.
- Derived `BrainKnowledgeReviewability` and `BrainKnowledgeNextAction` from
  those values.
- Reused the canonical values in retained-pattern plan bridge validation.
- Reused canonical reviewability values in `parseKnowledgeArgs`.
- Kept invalid reviewability and prose nextAction tests passing.

## Verification

Passed:

```sh
pnpm --filter @krn/cli test -- retainedPatternPlanBridge parseKnowledgeArgs runKnowledgeCardsCommand
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
Audit scope: 10 changed files vs ec979e09d2bd
No issues in changed files
```

## Persisted Evidence Loop

Persisted evidence capture:

```txt
evidenceBundle: 2c9d32b1-12f4-41ec-98a7-73e57074889e
reviewAssessment: ed3a3f09-6c43-437e-845a-e07e5f7c7475
feedbackDelta: c96e2228-7b60-48c1-8393-f22cef711c91
changed files: 10 intended, 0 unrelated, 0 unknown
commands: 8 operator_reported / passed
pattern usefulness:
- ts-boundary-brain-knowledge-parser-exemplar: helped
- ts-boundary-unknown-first-result-state: helped
```

Persisted observe/reflect:

```txt
observationGroup: be8188d1-76e5-4f81-8c9c-dd93665f2b29
observationItems: 9
reflectionRecord: 3cb1996b-930d-4cfb-b285-5c22e1859a37
observationsSelectedByReflect: 14
memoryCandidateRowsWritten: no
memoryMutation: none
```

## Proof

This proves:

- the relevant BrainKnowledge reviewability and nextAction runtime vocabularies
  now have one exported source in `brainKnowledgeReadModel.ts`;
- retained-pattern plan metadata still rejects invalid reviewability and prose
  nextAction;
- the knowledge CLI reviewability parser no longer carries its own reviewability
  copy.

This does not prove:

- all brain knowledge vocabularies are canonicalized;
- semantic ranking quality improved;
- every parser boundary should import these exact values;
- product readiness.

## Review Burden Delta

Before:

```txt
reviewer had to compare copied reviewability/nextAction literal arrays across
harness and CLI parser consumers
```

After:

```txt
reviewer can inspect one exported value source and small parser consumers that
reuse it
```

Verdict:

```txt
positive
```
