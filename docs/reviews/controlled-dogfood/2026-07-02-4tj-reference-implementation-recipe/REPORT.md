# 4tj Reference Implementation Recipe

Date: 2026-07-02

Issue: `mise-en-palace-4tj`

Commit: this commit; final SHA is recorded in the session summary.

## Goal

Apply the retained reference implementation / clone-workflow pattern to one
bounded KRN code-quality slice.

The selected target was:

```txt
packages/cli/src/retainedPatternPlanBridge.ts
```

The local exemplar was:

```txt
packages/harness/src/brainKnowledgeReadModel.ts
docs/patterns/retained-patterns/ts-boundary-brain-knowledge-parser-exemplar.json
```

## Source To Decision

Source:

- user-provided screenshots and links about reference implementations, clone
  workflows, recipe hashing, code-as-up-to-date-documentation, and avoiding
  shallow skill prompts;
- `docs/patterns/retained-patterns/reference-implementation-recipe-clone-boundary.json`;
- `docs/patterns/retained-patterns/ts-boundary-brain-knowledge-parser-exemplar.json`;
- local code in `brainKnowledgeReadModel.ts`.

Mechanism:

- A maintained local exemplar can carry implementation shape better than a
  prose-only skill when the target has the same boundary problem.
- The exemplar pattern here is unknown-first parsing with finite enum fields,
  explicit field parsers, and tests for invalid enum drift.

KRN implication:

- KRN should not create a broad clone runtime or generic skill zoo.
- KRN can apply a retained exemplar to one adjacent parser-boundary surface when
  the source-to-decision chain names the consumer and falsifier.

Decision:

- Use `brainKnowledgeReadModel.ts` as the implementation recipe for
  `retainedPatternPlanBridge.ts`.
- Keep the implementation local to the bridge.
- Tighten retained-pattern plan metadata parsing so `reviewability` and
  `nextAction` must be finite brain-knowledge values.
- Add direct regression tests proving prose `nextAction` and invalid
  `reviewability` are rejected.

Consumer:

- `krn plan --persist` retained-pattern readback metadata;
- `krn run show` retained-pattern readback;
- `krn codex brief` retained-pattern context;
- future pattern/research brain code-quality slices.

Falsifier:

- retained-pattern plan metadata accepts prose `nextAction`;
- retained-pattern plan metadata accepts unknown `reviewability`;
- selected metadata claims `selected` while silently dropping invalid selected
  pattern items;
- future code-quality slices cite the recipe without tests or proof boundaries.

## Changed

- Introduced local field-parser shape in `retainedPatternPlanBridge.ts`.
- Added finite sets for retained-pattern plan selection status/source,
  reviewability, and next action.
- Reused the canonical `BrainKnowledgeReviewability` and
  `BrainKnowledgeNextAction` types instead of creating local vocabulary types.
- Changed metadata parsing so invalid selected pattern items invalidate the
  whole metadata packet instead of silently producing `selectedPatterns: []`.
- Updated stale test fixtures from prose `nextAction` to `use`.
- Added `retainedPatternPlanBridge.test.ts` covering valid cards, invalid prose
  action, invalid reviewability, and valid metadata parsing.

## KRN Plan Readback

Command:

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn \
pnpm --filter @krn/cli krn plan \
  --task "Apply the retained reference implementation recipe to one KRN code-quality slice by using brainKnowledgeReadModel as an exemplar for retained pattern plan metadata parsing, with finite enum validation and tests for drift" \
  --persist
```

Persisted IDs:

```txt
executionRun: cfe18e7a-1224-4a72-b962-175ccf685d3d
taskContract: 2506ed10-0651-4d59-bfcf-18ce67268af1
contextAssembly: e8ae0ebd-2233-4621-aba8-57754db4e354
```

Activation usefulness:

```txt
positive
```

The plan selected both relevant retained patterns:

```txt
reference-implementation-recipe-clone-boundary
ts-boundary-brain-knowledge-parser-exemplar
```

It still selected unrelated owner files for direct source editing, but the
pattern readback materially helped define and verify the implementation shape.

## Verification

Passed:

```sh
pnpm --filter @krn/cli test -- retainedPatternPlanBridge runRunShowCommand runCli
pnpm typecheck
pnpm test
pnpm quality:fallow:ci
pnpm db:ready
git diff --check
```

Fallow:

```txt
Audit scope: 4 changed files vs 4b7986bb288a
No issues in changed files
```

## Persisted Evidence Loop

Persisted evidence capture:

```txt
evidenceBundle: f3e286aa-1776-48e9-b7dc-36f0cb029d05
reviewAssessment: 043dc25d-d837-4bed-b20d-ed16aaf0ea3f
feedbackDelta: 313d5f1b-3611-4685-9364-90f226a4008c
changed files: 7 intended, 0 unrelated, 0 unknown
commands: 6 operator_reported / passed
pattern usefulness:
- reference-implementation-recipe-clone-boundary: helped
- ts-boundary-brain-knowledge-parser-exemplar: helped
```

Persisted observe/reflect:

```txt
observationGroup: bbaffa6a-5abb-4182-bf33-816728b08e8b
observationItems: 13
reflectionRecord: 4ae11f6c-c1da-4ab1-9695-fad5cceb9c16
observationsSelectedByFinalReflect: 18
memoryCandidateRowsWritten: no
memoryMutation: none
```

Note:

```txt
An earlier reflect command was run before observe completed and selected 0
observations. The final persisted reflect above was rerun after observe and is
the readback used for this report.
```

## Proof

This proves:

- a retained reference implementation recipe can guide a real KRN code-quality
  repair without adding a new runtime;
- retained-pattern plan bridge parsing now rejects invalid enum drift;
- stale prose `nextAction` fixtures no longer pass as selected pattern items;
- the selected pattern readback helped this slice.

This does not prove:

- clone workflows outperform skills in general;
- KRN needs a broad recipe runtime;
- semantic ranking quality improved;
- every parser boundary should copy this exact helper structure;
- product readiness.

## Review Burden Delta

Before:

```txt
reviewer had to trust that retained-pattern metadata strings were well-shaped
```

After:

```txt
reviewer can inspect a small parser and tests that reject invalid action/reviewability drift
```

Verdict:

```txt
positive
```
