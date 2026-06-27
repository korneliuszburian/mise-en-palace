# V18 Target Owner-File Contract Re-Gate / Trial Application

Status: target fixture application, source repair, and re-gate.

Date: 2026-06-27.

## Executive Verdict

V18 applied the V17 `--owner-file` contract in a bounded observation-only target
fixture path. The contract is usable enough for the next target trial step:
`krn init --connect` can reuse an existing target project, `krn plan --project`
can see `ownerFiles=2`, and an owner-file-heavy task selected
`tests/readiness.test.ts` as the first context inclusion.

V18 also found and fixed one operator-friction bug: `krn init --dry-run`
showed owner-file proposals but its generated `Next command` omitted the
`--owner-file` flags. That could cause an operator to copy the next command and
lose exact owner-file data. The dry-run next command now preserves owner-file
flags, with a regression test.

Decision:

```txt
owner-file contract usability: positive for controlled target fixture
owner-file-heavy activation: positive when task names the owner file
operator friction: one bug found and fixed
source crawler: still rejected
activation scoring rewrite: still rejected
V02-01/product-ready: still not proven
next stream: V19 Product Readiness Re-Gate After Owner-File Contract
```

## Scope

Read:

- `GOAL.md`;
- `PLAN.md`;
- `PLANS.md`;
- `.agents/skills/target-repo-testing/SKILL.md`;
- `docs/runbooks/target-repo-testing.md`;
- `docs/reviews/controlled-dogfood/2026-06-27-v17-target-owner-file-read-model-contract/REPORT.md`;
- `tests/fixtures/target-repos/typescript-basic/AGENTS.md`;
- `tests/fixtures/target-repos/typescript-basic/README.md`;
- `tests/fixtures/target-repos/typescript-basic/package.json`;
- CLI init source/tests touched by the friction repair.

Changed:

- `packages/cli/src/runInitCommand.ts`;
- `packages/cli/src/runCli.test.ts`;
- `GOAL.md`;
- `PLAN.md`;
- `PLANS.md`;
- this report.

Non-goals:

- no target fixture source edits;
- no living target repo writes;
- no V02-01 claim;
- no product-ready claim;
- no source crawler;
- no activation scoring rewrite;
- no dashboard/API/MCP/worker runtime.

## Trial Mode

```txt
mode: observation-only target fixture
target: tests/fixtures/target-repos/typescript-basic
target_dirty_before: clean
allowed_writes: none
forbidden_writes: target source, target tests, target docs, target commits
target_dirty_after: clean
```

The target is a checked-in fixture, not a real external target repo. This makes
the trial useful for engineering proof and knowledge distillation, but not for
V02-01 or product readiness.

## Target Owner-File Inputs

```txt
src/index.ts|src|implementation_entry|implementation entry point
tests/readiness.test.ts|tests|behavior_test|readiness behavior proof
```

## Observed Flow

### Init Dry Run

`krn init --dry-run` displayed:

```txt
Owner-file proposal:
- src/index.ts
- tests/readiness.test.ts
```

Before the V18 repair, the generated `Next command` omitted these flags. After
the repair, it renders:

```txt
Next command: krn init --connect --repo <fixture> --owner-file "src/index.ts|src|implementation_entry|implementation entry point" --owner-file "tests/readiness.test.ts|tests|behavior_test|readiness behavior proof" --persist
```

### Init Connect

`krn init --connect --persist` reused the existing project, repo installation,
and project kernel:

```txt
Project ID: e27f9ecb-2f70-4f23-8085-02db2cb0af9c (reused)
Repo installation ID: 0287c24c-ac16-4995-a1da-2c5e0a99f2c1 (reused)
ProjectKernel ID: a9cef50f-d7fb-481e-8ff9-11ae4deb0284 (reused)
Owner files:
- src/index.ts
- tests/readiness.test.ts
```

### Generic Target Task

Run:

```txt
executionRun: c7aadb3a-43e9-4cfd-ac5e-3250a886d41e
```

The plan reported owner files available:

```txt
Target read model: sourceSeeds=7, ownerFiles=2, trustExclusions=7
Target owner-file recall: owner_files_available
```

For a generic task, context selected source seeds and trust exclusions, not the
exact owner file. This is not a scoring failure by itself because the task did
not name a specific owner-file need.

### Owner-File-Heavy Target Task

Run:

```txt
executionRun: d833dfa0-eb8f-40e8-8e3e-eeddde9ee303
```

Task:

```txt
inspect tests/readiness.test.ts owner file for target fixture readiness behavior
```

The plan selected exact owner-file context first:

```txt
Context inclusions:
- Target owner file: tests/readiness.test.ts
- Target source seed: tests
- Target trust exclusions
- Target source seed: src
- Target source seed: AGENTS.md
- Target source seed: docs
```

This is the most important V18 signal: once owner files are present and the task
asks for an exact owner file, activation surfaces the exact owner-file candidate
without a scoring rewrite.

## Target Verification

Command:

```sh
pnpm --dir tests/fixtures/target-repos/typescript-basic test
```

Result:

```txt
passed
```

What it proves:

- the fixture TypeScript test command currently passes;
- observation-only target command can be recorded as target evidence;
- target dirty state stayed clean.

What it does not prove:

- KRN source correctness;
- full external target repo verification;
- product readiness;
- second-operator usability.

## Persisted Evidence

Generic target run:

```txt
executionRun: c7aadb3a-43e9-4cfd-ac5e-3250a886d41e
evidenceBundle: f73ff782-ed88-4e3b-a61a-ec0f84960c1f
observationGroup: e2ce747d-e759-4da8-bc73-801a964bbe27
reflectionRecord: 856e1fbe-227f-4682-a892-80148d9239ae
```

Owner-file-heavy run:

```txt
executionRun: d833dfa0-eb8f-40e8-8e3e-eeddde9ee303
evidenceBundle: a550bf24-9966-4043-b5a1-9026cdf13b85
observationGroup: d2119ac1-1cfd-408c-9f2a-2bc689a91ddb
reflectionRecord: 30a548d5-58cf-48f6-bc24-a2334ff4e16d
```

Final V18 source/report evidence on the same owner-file-heavy run:

```txt
evidenceBundle: e3528e5a-b355-4b8e-a792-0296b00e2d44
reviewAssessment: 0b356440-4a09-482b-a978-112d26b5eac2
feedbackDelta: b14ab6be-6daf-48e3-960a-1d2ce033514e
observationGroup: 1b54818c-1708-4295-924f-49a4a03a43e9
reflectionRecord: 32c20652-4b64-4b3d-af59-3a74d4303136
```

Both runs preserved:

```txt
Memory mutation: none
MemoryRecord created: no
targetEvidence mode: observation_only
target dirty before/after: clean/clean
```

## Command Evidence

| Command | Result | What It Proves | What It Does Not Prove |
|---|---|---|---|
| `git status --short --branch -- tests/fixtures/target-repos/typescript-basic` | passed / clean | Target fixture had no dirty target files before/after commands. | Does not prove external target cleanliness. |
| `pnpm db:ready` | passed | Current-shell DB ready, migrations applied, pgvector available. | Does not prove CI/remote DB state by itself. |
| `krn init --dry-run --owner-file ...` | passed | Dry-run renders owner-file proposals and, after repair, preserves flags in `Next command`. | Does not prove operator comprehension. |
| `krn init --connect --owner-file ... --persist` | passed | Existing target project can be reused with visible owner-file contract. | Does not prove owner-file completeness. |
| `krn plan --project ... generic task --persist` | passed | Plan sees `ownerFiles=2` and assembles target context. | Does not prove exact owner file is always selected. |
| `krn plan --project ... owner-file-heavy task --persist` | passed | Exact `tests/readiness.test.ts` owner file is selected first when task requires it. | Does not prove activation quality on arbitrary repos. |
| `pnpm --dir tests/fixtures/target-repos/typescript-basic test` | passed | Fixture typecheck/test command passes. | Does not prove KRN source correctness or product readiness. |
| `krn evidence capture --persist` | passed | Target evidence/proof boundaries were persisted. | Does not prove command execution happened inside capture. |
| `krn observe --persist` | passed | Observation records can be created without memory mutation. | Does not prove reflection quality. |
| `krn reflect --persist` | passed | Reflection record can be created without memory mutation. | Does not prove candidate quality. |
| `pnpm --filter @krn/cli test -- runCli parseInitArgs` | passed | CLI owner-file parser/rendering behavior is covered. | Does not prove full product readiness. |
| `pnpm typecheck` | passed | TypeScript accepts the repair. | Does not prove runtime target usability. |
| `pnpm test` | passed | Current package tests pass. | Does not prove V02-01. |
| `git diff --check` | passed | Diff whitespace is clean. | Does not prove behavior beyond checked diff. |

## What This Proves

- The V17 owner-file contract is usable in a bounded DB-backed target fixture
  flow.
- Owner-file-heavy target tasks can surface exact owner-file context first.
- Observation-only target evidence can record target mode, dirty state, command
  proof, and proof boundaries.
- The dry-run next-command friction is fixed and tested.

## What This Does Not Prove

- A non-author operator can use the contract unaided.
- Owner-file entries will be correct or complete for arbitrary repos.
- Activation scoring is product-quality.
- Reflection/candidate quality is product-ready.
- Widened internal alpha.
- V02-01.
- Product readiness.

## Condensation Decision

```txt
finding:
  Explicit owner-file contract works in target fixture, and exact owner files
  are selected when the task asks for them.

frequency:
  first full application after V17, but high-value because it directly tests the
  active blocker.

candidate_surface:
  product readiness re-gate.

decision:
  accept V19 readiness re-gate; reject source crawler and activation scoring
  rewrite now.

rationale:
  V18 removes the immediate owner-file contract blocker. The next honest step is
  to re-gate readiness and decide whether more local substitutes are useful, or
  whether the next proof must be real operator / real target.

evidence:
  DB-backed init/connect/plan/evidence/observe/reflect, target fixture test,
  run readback, CLI tests.

does_not_prove:
  product readiness or real operator usability.

falsifier:
  future target run provides owner files and names an exact owner-file task but
  activation repeatedly fails to select that owner file.
```

## Next Recommended Action

Move to:

```txt
V19 — Product Readiness Re-Gate After Owner-File Contract
```

V19 should decide whether KRN can move from controlled-internal-alpha toward
widened-alpha readiness, or whether the next required proof is a real
second-operator / real target trial. It should not add another local substitute
unless V18 evidence exposes a specific repair.
