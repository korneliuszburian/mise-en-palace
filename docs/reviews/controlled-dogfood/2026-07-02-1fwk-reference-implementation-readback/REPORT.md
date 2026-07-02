# 1fwk Reference Implementation Recipe Readback

Date: 2026-07-02

Issue: `mise-en-palace-1fwk`

Commit: this commit; final SHA is recorded in the session summary.

## Goal

Prove the retained reference-implementation recipe pattern through one
executable/readback brain surface without building a clone runtime, dashboard,
API, MCP, broad ingestion, DB schema, or hash-manifest system.

## Source To Decision

Source:

- user-provided screenshots and links about reference implementations, clone
  workflows, recipe hashing, code-as-up-to-date-documentation, and avoiding
  shallow skills;
- `docs/patterns/retained-patterns/reference-implementation-recipe-clone-boundary.json`;
- `docs/patterns/retained-patterns/ts-boundary-brain-knowledge-parser-exemplar.json`;
- `packages/cli/src/runCli.test.ts`;
- `packages/cli/src/runKnowledgeCardsCommand.test.ts`.

Mechanism:

- A local reviewed exemplar can carry implementation shape better than repeated
  markdown instructions, but only if KRN keeps it source-to-decision mapped,
  tested, reviewable, and bounded by proof/non-proof.
- Existing brain knowledge readback already exposes the retained recipe and
  parser exemplar; the missing proof was deterministic plan selection for the
  long "reference implementation recipe" task shape.

KRN implication:

- KRN should make recipe/exemplar patterns retrievable in plan/readback surfaces
  before any clone runtime, manifest hashing, broad skill, or subagent work.

Decision:

- Add one deterministic CLI plan test proving that a long reference
  implementation recipe task selects:
  - `reference-implementation-recipe-clone-boundary`;
  - `ts-boundary-brain-knowledge-parser-exemplar`.
- Use live `krn brain knowledge` readback as operator-facing evidence that the
  same patterns are returned as read-only, mutation-free cards with usefulness
  feedback and proof boundaries.

Consumer:

- retained-pattern planning;
- BrainKnowledge readback;
- future code-quality pattern gates;
- future reference implementation recipe trials.

Falsifier:

- a future long reference-implementation task no longer selects the recipe
  boundary and parser exemplar;
- a future readback marks recipe patterns ready while missing source refs,
  evidence refs, falsifier, or proof boundary;
- a future implementation treats the recipe as runtime clone authority without
  local tests/evidence/review.

## KRN Plan Readback

Command:

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn \
pnpm --filter @krn/cli krn plan \
  --task "Prove the retained reference-implementation recipe pattern through one executable/readback brain surface so future KRN work can retrieve and apply a local code exemplar without building a clone runtime or more markdown instructions" \
  --persist
```

Persisted IDs:

```txt
executionRun: aac52429-69ad-4ede-b9c0-429cff4c467d
taskContract: 1ff94806-b288-41f0-8350-3b71548cf073
contextAssembly: 265c7cc0-f39d-428f-bdd8-feb2ca8c9022
```

Activation usefulness:

```txt
positive for retained pattern selection; weak for direct owner-file recall
```

The plan selected the right retained patterns but still selected generic
owner-file candidates. Source inspection found the test owner.

## Changed

- Added a deterministic `runCli` plan test for reference implementation recipe
  selection.

## Brain Readback

Command:

```sh
pnpm --filter @krn/cli krn brain knowledge \
  --catalog-file docs/brain-knowledge/catalog.json \
  --text "reference implementation recipe TypeScript" \
  --limit 5 \
  --json
```

Observed:

```txt
returnedCards: 2
cards:
- pattern:reference-implementation-recipe-clone-boundary
- pattern:ts-boundary-brain-knowledge-parser-exemplar
access: read_only
mutation: none
usefulnessFeedback: helped for both cards
```

## Verification

Passed:

```sh
pnpm --filter @krn/cli test -- runCli
pnpm --filter @krn/cli krn brain knowledge --catalog-file docs/brain-knowledge/catalog.json --text "reference implementation recipe TypeScript" --limit 5 --json
pnpm --filter @krn/harness test -- activePlanInvariants
pnpm typecheck
pnpm test
pnpm quality:fallow:ci
pnpm db:ready
git diff --check
```

Fallow:

```txt
Audit scope: 2 changed files vs 29ddc7060934
No issues in changed files
```

## Persisted Evidence Loop

Persisted evidence capture:

```txt
evidenceBundle: 05dc5c5c-45e3-4a32-a524-b26165557abe
reviewAssessment: 518883ac-4ba2-492b-a5bf-8871b1c0ca16
feedbackDelta: 573d083d-c6ae-4f31-af65-a45913420b8c
changed files: 7 intended, 0 unrelated, 0 unknown
commands: 8 operator_reported / passed
patternUsefulnessOutcomes:
- reference-implementation-recipe-clone-boundary: helped
- ts-boundary-brain-knowledge-parser-exemplar: helped
```

Persisted observe/reflect:

```txt
observationGroup: e8c8db0c-bff8-4911-91ac-9eba72690da5
observationItems: 5
reflectionRecord: 39c7c172-4ba2-450b-8358-2203c4029711
observationsSelectedByReflect: 5
memoryCandidateRowsWritten: no
memoryMutation: none
```

## Proof

This proves:

- plan/readback can select retained reference-implementation recipe patterns for
  a long task shape;
- the operator-facing brain knowledge readback returns the recipe boundary and
  parser exemplar as read-only cards with proof/non-proof boundaries;
- no clone runtime, dashboard, API, MCP, broad ingestion, DB schema, or
  hash-manifest system was added.

This does not prove:

- clone workflows outperform skills;
- semantic ranking quality is broadly good;
- the exemplar transfers to every TypeScript/code-quality task;
- product readiness.

## Review Burden Delta

Before:

```txt
reviewer had to trust that recipe/exemplar patterns were searchable from prior
reports, without a plan-level regression for the long task shape
```

After:

```txt
reviewer can inspect one deterministic plan test plus live brain knowledge
readback showing the retained recipe and exemplar selection
```

Verdict:

```txt
positive
```
