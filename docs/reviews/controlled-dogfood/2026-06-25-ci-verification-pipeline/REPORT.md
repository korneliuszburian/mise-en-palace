# CI Verification Pipeline Report

Status: G-00 completion report.

Date: 2026-06-25

## Executive Verdict

G-00 is complete. KRN now has remote GitHub Actions verification for the core
local proof commands: TypeScript typecheck, workspace tests, Promptfoo smoke,
DB readiness, Drizzle check, DB smoke, and diff whitespace checks.

The first CI run failed usefully because a fresh checkout did not have
`.local-lab/promptfoo/`; the fix moved directory creation into the
`eval:promptfoo:smoke` script so the command owns its output contract. The
second CI run passed.

## Scope

Changed:

- `.github/workflows/ci.yml`;
- `package.json`;
- `docs/reviews/controlled-dogfood/2026-06-25-ci-verification-pipeline/REPORT.md`;
- `PLAN.md`;
- `GOAL.md`.

Not changed:

- package source;
- DB schema;
- Memory Core;
- activation scoring;
- reflection extraction;
- dashboard/API/MCP surfaces;
- worker runtime.

## CI Workflow

Workflow:

```txt
.github/workflows/ci.yml
```

Remote run:

```txt
run_id: 28180925760
commit: b0a6fbda628b03959d13d7fdc3efc401f6be9c80
url: https://github.com/korneliuszburian/mise-en-palace/actions/runs/28180925760
status: passed
```

Jobs:

| Job | Result | Commands |
| --- | --- | --- |
| Typecheck, tests, and eval smoke | passed | `pnpm typecheck`; `pnpm test`; `pnpm exec promptfoo --version`; `pnpm eval:promptfoo:smoke`; `git diff --check` |
| DB readiness and smoke | passed | `pnpm db:ready`; `pnpm --filter @krn/db db:check`; `pnpm db:smoke`; `git diff --check` |

Known annotation:

```txt
GitHub Actions warned that Node.js 20 action runtimes are deprecated and being
forced to Node.js 24 for `actions/setup-node@v4` and `pnpm/action-setup@v4`.
```

This warning does not fail G-00, but future CI maintenance should watch action
runtime updates.

## Useful Failure

The first remote run failed:

```txt
run_id: 28180701854
commit: 1bde496f0eaa1ec90cc67dec2c1a53fa1d6fc6e5
failure: promptfoo could not write .local-lab/promptfoo/krn-golden-smoke-results.jsonl
reason: output directory missing in fresh CI checkout
```

Repair:

```txt
package.json eval:promptfoo:smoke now creates .local-lab/promptfoo before running promptfoo.
```

Decision:

```txt
The script should own its output directory instead of relying on local operator state.
```

## Command Evidence

Persisted IDs:

```txt
executionRun: 05558251-01bc-4df7-a212-5774acb0e731
taskContract: 840ca303-9c79-47e4-bea3-30a2ad77d7ef
harnessPlan: 5bd539e1-3458-464b-af73-6d6de76f8175
contextAssembly: acf39439-6803-4868-a4c6-459c590cbaeb
evidenceBundle: 780b6122-742a-4a74-af69-af187bbf4f22
reviewAssessment: 64428ca0-4d09-4d5b-94c4-d8dd3f185a7b
feedbackDelta: 17f2e78c-a994-4e28-bec0-8325314ef5cb
observationGroup: 2020339d-ae40-4e71-b28a-6fb783f9ca82
reflectionRecord: e05a1547-145f-4b10-8726-efe677ad0402
Memory mutation: none
MemoryRecord created: no
```

| Command | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `pnpm typecheck` | passed locally and in CI | Current workspace TypeScript compilation succeeds. | Does not prove runtime/product readiness. |
| `pnpm test` | passed locally and in CI | Current test suite succeeds. | Does not prove missing tests are sufficient. |
| `pnpm exec promptfoo --version` | passed locally and in CI | Promptfoo CLI is installed and runnable. | Does not prove KRN behavior. |
| `pnpm eval:promptfoo:smoke` | passed locally and in CI | Promptfoo fixture/provider/output path works in a fresh checkout. | Does not prove GoldenTask behavior or Memory Brain quality. |
| `pnpm db:ready` | passed locally and in CI | DB is reachable, migrations are applied, and pgvector is available in the tested environments. | Does not prove production DB operations. |
| `pnpm --filter @krn/db db:check` | passed locally and in CI | Drizzle schema check passes. | Does not prove backup/restore safety. |
| `pnpm db:smoke` | passed locally and in CI | DB smoke path works against current schema. | Does not prove all DB workflows. |
| `gh run watch 28180925760 --exit-status` | passed | Remote GitHub Actions run is green for commit `b0a6fbd`. | Does not prove future CI will remain green. |
| `git diff --check` | passed locally and in CI | No whitespace errors in checked diff. | Does not prove semantic correctness. |
| `krn evidence capture --run-id 05558251... --persist` | passed | G-00 evidence, review assessment, feedback delta, command provenance, and changed-file classification were persisted. | Does not prove production release readiness. |
| `krn observe --run 05558251... --persist` | passed | G-00 observation staging was persisted without Memory Core mutation. | Does not prove final memory truth. |
| `krn reflect --scope run:05558251... --persist` | passed | G-00 reflection record selected 5 observations without MemoryRecord creation or candidate row writes. | Does not prove reflection quality at scale. |

## Dogfood Brain Usefulness Section

### Brain Usefulness Summary

Brain ROI:
- positive

Overall verdict:
- CI turned local-only proof into remote repeatable proof and caught a real
  fresh-checkout assumption in the Promptfoo smoke script.

What this run proves:
- Core verification can run in GitHub Actions.
- DB readiness and smoke can run against a CI Postgres/pgvector service.
- Promptfoo smoke no longer depends on pre-existing local `.local-lab` state.

What this run does not prove:
- production deployment readiness;
- backup/restore safety;
- target repo internal-alpha readiness;
- Memory Brain cognitive quality;
- future action runtime compatibility.

DB used in current shell:
- yes for local verification and persisted planning.

### Activated Context Usefulness

| Item | Type | Used? | Helped? | Notes |
| --- | --- | --- | --- | --- |
| G-00 task contract | plan | yes | helped | Kept CI scope to typecheck/tests/Promptfoo/DB/diff. |
| Promptfoo bounded-adapter doctrine | source/project rule | yes | helped | Promptfoo stays smoke/proof adapter, not product authority. |
| DB runtime truth rule | project rule | yes | helped | DB truth is claimed only for commands that ran locally and in CI. |
| Fresh checkout CI failure | remote evidence | yes | helped | Found missing output-dir ownership in the script. |

### Evidence And Review Burden

| Evidence item | Strength | What it proves | Review burden impact |
| --- | --- | --- | --- |
| GitHub Actions run `28180925760` | strong for CI wiring | Remote workflow passes on pushed commit. | Reduces reliance on local shell reports. |
| Failed run `28180701854` | strong for bug discovery | Fresh checkout exposed missing promptfoo output directory. | Prevents future hidden local-state dependence. |
| Local command replay | medium | Local commands still match CI intent. | Helps debug CI failure. |

### Candidate Quality

No candidate was promoted.

Potential candidate:

```txt
MemoryCandidate:
  Verification scripts that write artifacts should create their own output directories.
evidence:
  failed CI run 28180701854 and fix commit b0a6fbd.
doesNotProve:
  Does not prove every artifact-writing command is robust.
reviewability:
  ready
decision:
  defer until a second similar script/output-dir case appears.
```

## Product Readiness Signal

Verdict:

```txt
CI foundation complete; production release still depends on migration/backup policy,
packaging/versioning, and internal-alpha evidence.
```

## Next Recommended Action

Continue to:

```txt
G-01 — Migration And Backup Policy
```

The next production risk is durable brain-store operation: backup, restore,
migration, rollback, and replay policy.
