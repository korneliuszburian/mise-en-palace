# x4c4 Reference Recipe Code-Quality Repair

Date: 2026-07-02

Issue: `mise-en-palace-x4c4`

Commit: this commit; final SHA is recorded in the session summary.

## Goal

Apply the retained reference-implementation recipe to one real code-quality
repair from the current audit stream, without broad refactor, clone runtime,
dashboard, API, MCP, DB schema, package topology work, or mass file deletion.

## Source To Decision

Source:

- user-provided screenshots about reference implementations, clone workflows,
  code-as-up-to-date-documentation, recipe/hash manifests, and shallow skills;
- `docs/patterns/retained-patterns/reference-implementation-recipe-clone-boundary.json`;
- `docs/patterns/retained-patterns/ts-boundary-brain-knowledge-parser-exemplar.json`;
- `packages/cli/src/runCli.test.ts`;
- recent audit finding: repeated persisted-plan metadata capture boilerplate in
  adjacent retained-pattern plan tests.

Mechanism:

- A good local exemplar should reduce repeated markdown/process instructions by
  making the desired shape executable in code.
- The three adjacent retained-pattern plan tests repeated the same persisted
  plan metadata capture harness, which made future pattern-readback tests more
  expensive to review.

KRN implication:

- The recipe should first improve KRN's own code in a small, falsifiable place.
  It should not become a clone runtime, package topology rewrite, or broad
  automation story before it proves local usefulness.

Decision:

- Add one local test helper,
  `runPersistedPlanWithCapturedMetadata(task)`, and use it only for the three
  adjacent retained-pattern plan tests that share the same boilerplate.
- Keep production behavior unchanged.
- Do not refactor unrelated `runCli` tests.

Consumer:

- retained-pattern plan tests in `packages/cli/src/runCli.test.ts`;
- future code-quality recipe slices.

Falsifier:

- focused `runCli` tests fail;
- retained pattern plan assertions stop checking selected IDs/usefulness;
- the helper hides behavior-specific setup;
- the diff expands into broad test rewrites or production changes.

## KRN Plan Readback

Command:

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn \
pnpm --filter @krn/cli krn plan \
  --task "Apply the retained reference-implementation recipe to one real code-quality repair by simplifying repeated persisted-plan metadata capture boilerplate in runCli tests without changing production behavior or broad refactoring" \
  --persist
```

Persisted IDs:

```txt
executionRun: 96990fb3-5fe4-4a45-b318-b69df6836128
taskContract: 91f7df35-c6b1-4926-b04c-b8bc7fb77b32
contextAssembly: cc37b542-b916-4f00-ab82-5d4cfa056a3c
```

Selected retained patterns:

```txt
- reference-implementation-recipe-clone-boundary
- ts-boundary-brain-knowledge-parser-exemplar
```

Activation usefulness:

```txt
positive for retained pattern selection; weak for direct owner-file recall
```

The plan selected the right retained patterns but still selected generic owner
files. Source inspection found the test owner in `runCli.test.ts`.

## Changed

- Added `runPersistedPlanWithCapturedMetadata(task)` as a local helper in
  `packages/cli/src/runCli.test.ts`.
- Replaced three repeated persisted-plan metadata capture blocks with the
  helper.
- Net effect in the touched file before final formatting:

```txt
73 insertions
153 deletions
```

## Verification

Focused verification passed:

```sh
pnpm --filter @krn/cli test -- runCli
```

Observed:

```txt
Test Files: 41 passed
Tests: 322 passed
```

Full verification passed:

```txt
pnpm typecheck
pnpm test
pnpm quality:fallow:ci
pnpm db:ready
git diff --check
pnpm --filter @krn/harness test -- activePlanInvariants
```

Notes:

```txt
rtk pnpm typecheck printed "TypeScript: No errors found" through the wrapper
but returned a wrapper-level non-zero code. `rtk proxy pnpm typecheck` then ran
the workspace typecheck directly and passed.
```

Full test result:

```txt
@krn/core: 14 files / 73 tests passed
@krn/harness: 34 files / 188 tests passed
@krn/schema: 3 files / 27 tests passed
@krn/workers: 6 files / 40 tests passed
@krn/codex-adapter: 4 files / 9 tests passed
@krn/db: 27 files / 84 tests passed
@krn/cli: 41 files / 322 tests passed
```

Fallow:

```txt
Audit scope: 2 changed files vs 2a3d8082c875
No issues in changed files
```

DB readiness:

```txt
Postgres reachable
14/14 migrations applied
pgvector available
Brain store readiness ready
```

## Proof

This proves:

- the retained recipe can guide one real code-quality repair in the KRN repo;
- duplicated test harness setup can be collapsed without changing production
  code;
- retained-pattern plan assertions still run through the same focused CLI test
  suite.

This does not prove:

- clone workflows outperform skills generally;
- the recipe should become runtime automation;
- all audit findings are true positives;
- KRN is product-ready;
- owner-file recall is solved.

## Review Burden Delta

Before:

```txt
three adjacent plan-pattern tests repeated the same persisted metadata capture
runtime setup, so a reviewer had to compare boilerplate to see the real
behavioral difference
```

After:

```txt
the repeated setup is named once; the tests now foreground the task text and
the selected retained-pattern assertions
```

Verdict:

```txt
positive
```

## Second-Opinion Prompt

Use this prompt after the commit to force critical review:

```md
# Review Prompt: x4c4 Reference Recipe Code-Quality Repair

Review commit `<sha>` in `mise-en-palace`.

Focus only on:

1. Did `runPersistedPlanWithCapturedMetadata(task)` reduce real boilerplate
   without hiding behavior-specific setup?
2. Do the three updated `runCli` tests still prove the same retained-pattern
   selection and usefulness metadata as before?
3. Was the slice too narrow, too broad, or correctly bounded for the retained
   reference-implementation recipe?
4. Did the implementation avoid production behavior changes, DB schema changes,
   clone runtime work, dashboard/API/MCP work, and package topology changes?
5. Are there any type-safety, test-readability, or Fallow concerns in the final
   diff?

Return findings first, ordered by severity. If there are no issues, say that
clearly and name the remaining risk.
```

## Evidence Loop

Persisted evidence capture:

```txt
evidenceBundle: d033fab4-24b2-41da-9574-6f4632312ce1
reviewAssessment: e8ee8c6e-4a8b-40e5-826d-1e68a897a5d3
feedbackDelta: 0cd0e673-c8a6-46cf-b8af-33c2d295900b
changed files: 7 intended, 0 unrelated, 0 unknown
commands: 7 operator_reported / passed
patternUsefulnessOutcomes:
- reference-implementation-recipe-clone-boundary: helped
- ts-boundary-brain-knowledge-parser-exemplar: helped
```

Persisted observe/reflect:

```txt
observationGroup: dc425463-6dfc-4b1c-be69-d261b910a9b3
observationItems: 5
reflectionRecord: d5b5a9ca-6c1c-497c-bb16-d5ff12282a37
observationsSelectedByReflect: 5
findings: 0
candidateRowsWritten: no
memoryMutation: none
```

## Next Task

Created follow-up:

```txt
mise-en-palace-tnvb Simplify evidence enum normalization with one local factory
```

Why:

```txt
x4c4 applied the reference recipe in tests; the next higher-ROI audit-driven
repair should touch one bounded production code hotspot if the finding is still
current.
```
