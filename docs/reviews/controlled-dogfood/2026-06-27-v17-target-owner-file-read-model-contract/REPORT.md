# V17 Target Owner-File Read-Model Contract Gate

Status: source repair and contract gate.

Date: 2026-06-27.

## Executive Verdict

V17 confirms the previous blocker: target owner-file recall worked when
`ownerFiles` were present, but normal target init/connect did not give operators
a first-class way to provide them. The repair adds an explicit repeatable
`krn init --owner-file "path|root|kind|reason"` contract, persists owner files
through project/repo/kernel metadata, and documents the contract in the target
runbook, second-operator packet, and target-repo testing skill.

Decision:

```txt
owner-file read-model contract: accepted and repaired
source crawler: rejected
activation scoring repair: rejected now
hidden metadata lore: rejected
next stream: V18 Target Owner-File Contract Re-Gate / Trial Application
```

## Scope

Read:

- `GOAL.md`;
- `PLAN.md`;
- `PLANS.md`;
- `docs/KRN_KERNEL.md`;
- `.agents/skills/target-repo-testing/SKILL.md`;
- `docs/runbooks/target-repo-testing.md`;
- `docs/runbooks/second-operator-alpha-trial.md`;
- `packages/cli/src/runInitCommand.ts`;
- `packages/cli/src/runPlanCommand.ts`;
- `packages/cli/src/targetRepoHarnessSmoke.ts`;
- current `ownerFiles` search results across packages/docs.

Changed:

- `packages/cli/src/parseArgs.ts`;
- `packages/cli/src/parseInitArgs.ts`;
- `packages/cli/src/parseInitArgs.test.ts`;
- `packages/cli/src/runCli.ts`;
- `packages/cli/src/runCli.test.ts`;
- `packages/cli/src/runInitCommand.ts`;
- `docs/runbooks/target-repo-testing.md`;
- `docs/runbooks/second-operator-alpha-trial.md`;
- `.agents/skills/target-repo-testing/SKILL.md`;
- `GOAL.md`;
- `PLAN.md`;
- `PLANS.md`.

Non-goals:

- no source crawler;
- no activation scoring rewrite;
- no target repo writes;
- no DB schema migration;
- no dashboard/API/MCP/worker runtime;
- no V02-01 or product-ready claim.

## Findings

| Evidence | Finding | Decision |
|---|---|---|
| `runPlanCommand.ts` | `TargetActivationReadModel.ownerFiles` already loads from project kernel and repo installation metadata. | Keep the read-model shape. |
| `targetRepoHarnessSmoke.ts` | Fixture proof already seeds owner files directly in metadata. | Good fixture, but not an operator contract. |
| `runInitCommand.ts` before this slice | `krn init --connect` persisted `sourceSeeds` but not operator-provided `ownerFiles`. | Add the smallest CLI input. |
| Target runbooks/skill before this slice | They mentioned owner-file support but did not define how operators provide exact owner files. | Document `path|root|kind|reason`. |
| V16 report | Repeated activation miss points to read-model completeness, not scoring. | Reject scoring rewrite. |

## Accepted Repair

`krn init` now accepts repeatable owner-file entries:

```sh
krn init --dry-run --repo <target> \
  --owner-file "src/index.ts|src|implementation_entry|implementation entry point"

krn init --connect --repo <target> --persist \
  --owner-file "src/index.ts|src|implementation_entry|implementation entry point"
```

Each entry is:

```txt
path|root|kind|reason
```

This is an explicit read-model input. It does not crawl the target repo and does
not prove owner-file completeness.

## Live Replay

Current-shell replay used the checked-in target fixture:

```txt
target: tests/fixtures/target-repos/typescript-basic
ownerFiles:
  - src/index.ts|src|implementation_entry|implementation entry point
  - tests/readiness.test.ts|tests|behavior_test|readiness behavior proof
```

Observed output:

```txt
KRN Init Dry Run:
  Owner-file proposal:
  - src/index.ts
  - tests/readiness.test.ts

KRN Init Connect:
  Owner files:
  - src/index.ts
  - tests/readiness.test.ts

KRN Plan:
  Target read model: sourceSeeds=7, ownerFiles=2, trustExclusions=7
  Target owner-file recall: owner_files_available
  Target owner files: src/index.ts, tests/readiness.test.ts
```

## DB-Backed Dogfood

Persisted KRN run:

```txt
executionRun: 3ed57081-d4b3-45a1-b7f4-92c56425b857
evidenceBundle: 6b877aa6-43c0-493b-af70-15f3c46b5a68
reviewAssessment: 98e65e77-0903-4bd4-8b81-e8979f160ee7
feedbackDelta: 89b3a6ee-a36f-43e6-84a3-9b66bd242a89
observationGroup: 8d2e6863-6b92-4cd0-aa26-96f12643ef91
reflectionRecord: 98d12524-490c-4eda-9e21-1d040d70d463
```

KRN plan for this source repair abstained on context:

```txt
Context included: 0
Context excluded: 0
Context status: abstained
```

That does not block V17 because the owner-file contract was found through
source inspection and verified through source tests plus live CLI replay. It
does mean activation quality remains partial for default KRN planning.

## Command Evidence

| Command | Result | What It Proves | What It Does Not Prove |
|---|---|---|---|
| `rtk pnpm --filter @krn/cli test -- parseInitArgs runCli` | passed | Parser and CLI behavior cover owner-file input/output and project read-model metadata. | Does not prove real external target correctness. |
| `rtk bash -lc 'pnpm typecheck; ... EXIT:0'` | passed | TypeScript accepts the new parser/runtime types. | Does not prove product readiness. |
| `rtk pnpm test` | passed | Current package tests pass with the new init contract. | Does not prove owner-file completeness. |
| `rtk docker compose up -d krn-postgres` | passed | Local Postgres container was running. | Does not prove remote/CI DB state. |
| `rtk pnpm db:ready` | passed | Current-shell DB is reachable, 14/14 migrations applied, pgvector available. | Does not prove target trial usability. |
| `rtk pnpm db:smoke:target-repo-harness` | passed | Existing target fixture still proves source seeds, owner files, readback, evidence, and cleanup. | Does not prove arbitrary repo inference. |
| `krn init/plan owner-file replay` | passed | Operator-facing `--owner-file` persists through init and is visible to `plan --project`. | Does not prove the listed owner files are complete or correct. |
| `rtk git diff --check` | passed | Diff whitespace is clean. | Does not prove behavior beyond changed files. |

## What This Proves

- Target owner files are no longer hidden fixture/operator lore.
- Operators can provide exact owner files during `krn init`.
- `krn plan --project` can read those owner files from persisted metadata and
  report `owner_files_available`.
- Missing owner files remain typed read-model incompleteness, not scoring proof.
- No target repo writes or source crawler were introduced.

## What This Does Not Prove

- Owner-file completeness on arbitrary repositories.
- Activation scoring quality.
- Product readiness.
- Widened internal alpha.
- V02-01 second-operator proof.
- That a non-author operator will supply good owner files without friction.

## Condensation Decision

```txt
finding:
  Owner-file recall had a read-model input gap: fixture metadata supported
  ownerFiles, but operator init/connect did not expose them.

frequency:
  repeated/high-risk after V06, V11, V16, and target trial reports.

candidate_surface:
  CLI init contract + runbook + skill + tests.

decision:
  accept and implement.

rationale:
  Explicit owner-file input is smaller and more honest than a crawler or scoring
  rewrite.

evidence:
  parser/CLI tests, full test suite, DB readiness, target harness smoke, live
  init/connect/plan replay.

does_not_prove:
  owner-file discovery completeness or product readiness.

falsifier:
  future target trials provide owner files but KRN still reports
  missing_owner_file_read_model, or operators cannot use the contract from
  checked-in docs.
```

## Next Recommended Action

Move to:

```txt
V18 — Target Owner-File Contract Re-Gate / Trial Application
```

V18 should not build a crawler. It should run or re-gate one bounded target
trial using the explicit `--owner-file` contract and decide whether the
remaining blocker is operator friction, owner-file quality, or activation
selection after owner files are available.
