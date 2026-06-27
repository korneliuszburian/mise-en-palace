# V20 Real Target Observation-Only Owner-File Trial

Status: completed target-trial report, not V02-01 proof.

Date: 2026-06-27
Evaluator: Codex
KRN repo: `/home/krn/coding/krn/active/mise-en-palace`
Target repo: `/home/krn/coding/krn/active/krn-elektroinstal-ogar`
Mode: observation-only
DB available: yes

## Executive Verdict

KRN can run a DB-backed owner-file trial against a real target checkout without
writing to the target repo. The owner-file read model selected useful target
owner files for a bounded read-only readiness task, persisted target evidence,
and preserved proof boundaries. This is a positive controlled-internal-alpha
signal for technical operators. It is not V02-01, widened alpha, or product
readiness proof because no second operator participated and the target task was
self-operated.

## Scope

Selected target:

```txt
/home/krn/coding/krn/active/krn-elektroinstal-ogar
```

Why selected:

- real local checkout under `active/`;
- not the current KRN repo;
- clean worktree before the trial;
- contains target instructions, a Bedrock runtime, and a WooHub gateway surface;
- suitable for observation-only commands.

Forbidden:

- target source edits;
- target commits;
- target resets or cleans;
- target production/runtime writes;
- calling this run second-operator proof.

## Preflight

KRN state:

```txt
branch: main
local/remote: main...origin/main
worktree: clean
latest commit before V20: 6bff7c1 docs(readiness): re-gate after owner-file contract
```

Target state before:

```txt
* master...origin/master
clean — nothing to commit
```

DB readiness:

```txt
Postgres: reachable
Migrations expected: 14
Migrations applied: 14
pgvector: available
Brain store readiness: ready
```

## Target Read-Only Inspection

Read target files:

- `AGENTS.md`;
- `bedrock/README.md`;
- `bedrock/composer.json`;
- `woohub_gateway_v1/README.md`;
- `woohub_gateway_v1/main.py`.

Sensitive files were not read. In particular, `.env`, `CREDS.md`, and ignored
runtime secret surfaces were treated as out of scope.

## Owner-File Contract

`krn init --dry-run` and `krn init --connect --persist` used explicit owner
files:

| Owner file | Root | Kind | Reason |
|---|---|---|---|
| `AGENTS.md` | `.` | `agent_guidance` | target operator and safety guidance |
| `bedrock/composer.json` | `bedrock` | `runtime_manifest` | Bedrock runtime scripts and dependency boundary |
| `bedrock/README.md` | `bedrock` | `target_runbook` | local Bedrock runtime runbook |
| `woohub_gateway_v1/main.py` | `woohub_gateway_v1` | `implementation_entry` | WooHub gateway executable entry point |
| `woohub_gateway_v1/README.md` | `woohub_gateway_v1` | `target_runbook` | WooHub gateway read-only safety model |

Persisted IDs:

```txt
project: e83b4509-6889-426c-90e2-bc4e6394ba26
repoInstallation: f08bfff8-cba2-426b-9c0e-18c90774afff
projectKernel: b51aebe5-a85d-4fae-babd-80f81a0db86e
executionRun: dd69eb5a-8552-46d1-89fc-4a7617acb59c
```

## KRN Plan Review

Task:

```txt
Assess Elektroinstal target read-only readiness boundaries for local Bedrock
runtime and WooHub gateway without modifying the target repo
```

Plan output:

```txt
Target read model: sourceSeeds=3, ownerFiles=5, trustExclusions=7
Target owner-file recall: owner_files_available
Context included: 6
Context excluded: 3
Context status: assembled
```

Selected context:

| Item | Type | Used? | Helped? | Notes |
|---|---|---|---|---|
| `woohub_gateway_v1/README.md` | owner file | yes | yes | Directly described read-only gateway safety model. |
| `bedrock/README.md` | owner file | yes | yes | Directly described local Bedrock runtime and first-run checks. |
| `bedrock/composer.json` | owner file | yes | yes | Exposed `lint` and `test` scripts and dependency boundary. |
| `woohub_gateway_v1/main.py` | owner file | yes | yes | Confirmed executable entry point is thin. |
| target trust exclusions | read-model guardrail | yes | yes | Prevented reading `.env` and runtime/secret surfaces. |
| `AGENTS.md` | source seed | yes | yes | Supplied target workflow and safety rules. |

Excluded context:

Three target candidates were excluded for `over_budget`. This is acceptable for
the bounded task, but it shows that target owner-file tasks still need careful
operator-provided owner files rather than broad file inventories.

## Target Commands

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `git -C /home/krn/coding/krn/active/krn-elektroinstal-ogar status --short --branch` | passed | Target was clean before and after the trial. | Does not prove target runtime correctness. |
| `composer validate --no-check-lock --strict` in `bedrock/` | passed | `bedrock/composer.json` is structurally valid. | Does not install dependencies, run PHP lint, run Pest, or verify WordPress runtime. |
| Python AST parse for `woohub_gateway_v1/**/*.py` | passed | Gateway Python files parse without syntax errors. | Does not execute gateway actions, validate env vars, or contact Plesk/WP Toolkit. |

Target state after:

```txt
* master...origin/master
clean — nothing to commit
```

## Evidence / Observation / Reflection

Evidence capture:

```txt
evidenceBundle: 7f01243f-cf81-4caa-b819-b4443188177e
reviewAssessment: e0deb067-ae04-4e90-99da-93d2c77dcd42
feedbackDelta: 0dba91ee-f6cd-4291-a2ec-22fb988b93be
```

Target evidence:

```txt
mode: observation_only
dirtyBefore: clean
dirtyAfter: clean
ownedChanges: external
allowedWrites:
  - none
forbiddenWrites:
  - target source edits
  - target commits
  - target resets or cleans
  - target production/runtime writes
changedFiles:
  - none
```

Observation:

```txt
observationGroup: 389ee6a3-4437-43af-861a-1cc57494e9f9
observer input items: 9
observation items: 9
redactions: 0
truncations: 2
memory mutation: none
```

Reflection:

```txt
reflectionRecord: 75dce5dc-6ce8-4ebd-af06-a7f334b64cd0
observations selected: 9
findings: 4
gaps: 4
candidate generation status: ready
candidate rows written: no
memory mutation: none
```

Run readback confirmed persisted evidence/review/feedback records and target
evidence metadata for the run.

## Dogfood Brain Usefulness

### Activation Usefulness

Verdict: good for owner-file recall on this bounded target task.

KRN selected four direct owner files, one trust-exclusion guardrail, and the
target `AGENTS.md` source seed. That was materially better than the previous
fixture-only proof because this was a real checkout with secrets/runtime paths
to avoid.

Limit: `bedrock/README.md` and several other candidates show that inclusion
budget still matters. This does not prove general target discovery without
operator-provided owner files.

### Memory Usefulness

Verdict: unknown / not materially tested.

No MemoryRecords were selected. This run primarily tested target owner-file
read-model behavior, not memory application quality.

### Source Grounding Usefulness

Verdict: positive.

Target docs and manifests supplied the safety boundary:

- Bedrock local runtime is local-only and must not connect to production DB,
  uploads, WP-CLI, or credentials.
- WooHub gateway v1 is read-only and does not support raw commands or write
  operations.
- Target `AGENTS.md` contains explicit frontend/production safety constraints.

### Evidence And Review Burden

Verdict: positive with one repair candidate.

Evidence capture can persist target mode, dirty state, target commands,
allowed/forbidden writes, and does-not-prove boundaries. However, the first
capture omitted explicit forbidden writes and therefore read back
`forbiddenWrites: none`. The second capture corrected this with explicit flags.

This means the model is capable, but the CLI ergonomics are still too easy to
under-specify for observation-only target trials.

### Observation / Reflection Usefulness

Verdict: useful as ledger proof, still not product-quality extraction proof.

Observe and reflect persisted DB records without Memory Core mutation. Reflection
reported 4 findings and 4 gaps, but this report did not inspect detailed
finding quality beyond CLI output. Treat reflection quality as partially
unverified.

### Candidate Quality

Verdict: no candidate rows; manual candidate only.

FeedbackDelta created no candidates because no KRN files changed. The useful
candidate from this run is manual and should remain proposal-only until a
source repair is executed.

### Brain ROI

```txt
context waste: lower
review burden: lower
resume quality: better
decision grounding: better
memory usefulness: unknown
operator friction: mixed
```

Overall Brain ROI: positive.

## Findings

### Finding 1: Real target owner-file recall works when owner files are provided

Evidence:

- `krn init --connect --persist` persisted 5 owner files for
  `krn-elektroinstal-ogar`.
- `krn plan --project ... --persist` reported `owner_files_available`.
- Context inclusions contained direct owner-file entries for gateway README,
  Bedrock README, Composer manifest, gateway entry point, trust exclusions, and
  AGENTS.

Implication:

Owner-file read model is now useful beyond checked-in fixtures.

### Finding 2: Observation-only target trial can stay target-clean

Evidence:

- target status before: clean;
- target status after: clean;
- target commands were read/status/validation only;
- no target files changed.

Implication:

KRN can run target observation trials without becoming a target repo writer.

### Finding 3: Target evidence capture needs safer observation-only ergonomics

Evidence:

- first evidence capture with `--target-mode observation-only` but no explicit
  write flags persisted `forbiddenWrites: none`;
- second evidence capture with explicit `--target-forbidden-write` flags
  persisted the correct boundary.

Implication:

The next source repair should make observation-only target evidence harder to
under-specify, likely through defaults, warnings, or clearer output/readback.

### Finding 4: DB env ergonomics remain inconsistent

Evidence:

- `pnpm db:ready` succeeded using its default database URL;
- `krn init --connect --persist` failed until `KRN_DATABASE_URL` was set
  explicitly.

Implication:

This is operator friction, but not the highest-risk next repair compared with
target safety evidence defaults.

## Product Readiness Implication

```txt
controlled-internal-alpha for technical operators: yes / stronger
widened internal alpha: no
product-ready: no
V02-01 second-operator proof: no
```

This run moves KRN from fixture-only owner-file proof to real-target,
self-operated, observation-only proof. It does not prove that another operator
can run the flow or that target repair is safe without supervision.

## Candidate Outputs

Repair candidate:

```txt
Name: Target evidence observation-only defaults and readback clarity
Why: V20 showed that target evidence can persist forbidden writes, but only if
  the operator passes explicit flags. Observation-only mode should be harder to
  under-specify.
Evidence: first capture persisted forbiddenWrites none; second capture persisted
  explicit forbidden writes; run readback shows the difference.
Files likely touched:
  - packages/cli/src/parseEvidenceArgs.ts
  - packages/cli/src/runEvidenceCaptureCommand.ts
  - packages/cli/src/runRunShowCommand.ts
  - CLI tests / golden behavior tests
Non-goals:
  - no target writes
  - no activation scoring
  - no source crawler
  - no DB schema unless proven necessary
Verification:
  - targeted CLI tests
  - pnpm typecheck
  - pnpm test
  - git diff --check
```

## Next Recommended Action

Promote one bounded source repair:

```txt
V21 — Target Evidence Observation-Only Defaults And Readback Clarity
```

Goal:

- make `observation-only` target evidence safer and clearer when write-boundary
  flags are omitted;
- improve `run show` target evidence rendering if source inspection confirms the
  current nested list output is ambiguous;
- preserve existing explicit target evidence fields and persistence.

Do not move to activation scoring, target repair, or V02-01 until this target
evidence safety issue is handled or explicitly rejected.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `rtk git status --short --branch` | passed | KRN repo started clean and synced with origin. | Does not prove product readiness. |
| `rtk pnpm db:ready` | passed | Local Postgres brain store was reachable with 14/14 migrations and pgvector. | Does not prove memory/source quality. |
| `rtk pnpm --filter @krn/cli krn init --dry-run ...` | passed | Owner-file handoff can be previewed without writing target files. | Does not prove persistence. |
| `KRN_DATABASE_URL=... krn init --connect ... --persist` | passed | Real target project, repo installation, kernel, seeds, and owner files were persisted. | Does not prove owner files are complete. |
| `KRN_DATABASE_URL=... krn plan --project ... --persist` | passed | DB-backed activation selected owner-file context for the target task. | Does not prove general activation quality. |
| `composer validate --no-check-lock --strict` in target `bedrock/` | passed | Composer manifest is valid. | Does not run PHP lint/tests/runtime. |
| Python AST parse for target gateway | passed | Gateway Python files parse. | Does not execute gateway actions or validate credentials. |
| `KRN_DATABASE_URL=... krn evidence capture ... --persist` | passed | Target evidence metadata can be persisted and read back. | Does not execute commands itself. |
| `KRN_DATABASE_URL=... krn observe ... --persist` | passed | ObservationGroup persisted with no Memory Core mutation. | Does not prove observation quality. |
| `KRN_DATABASE_URL=... krn reflect ... --persist` | passed | ReflectionRecord persisted with no Memory Core mutation. | Does not prove reflection extraction quality. |
| `KRN_DATABASE_URL=... krn run show --run-id ...` | passed | Persisted run/evidence/review/feedback records can be read back. | Does not prove commands ran during readback. |
| `rtk git diff --check` | passed | Final V20 docs/plans diff has no whitespace errors. | Does not prove product readiness or target runtime correctness. |
