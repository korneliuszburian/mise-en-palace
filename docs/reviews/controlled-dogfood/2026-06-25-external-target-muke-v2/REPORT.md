# Controlled External Target Repo Trial: muke-v2

Status: V01-00 completion report.

Date: 2026-06-25
KRN alpha tag: `v0.1.0-alpha.0`
KRN alpha commit: `ff5e3841da5299911856f01b6f82f3a4af8123f9`
Target repo: `/home/krn/coding/vibe-coding/muke-v2`
Target remote: `https://github.com/korneliuszburian/muke-v2.git`
Target repair commit: `05a383e fix(evals): stabilize report artifact tests`
DB available: yes

## Executive Verdict

KRN passed the first controlled external target repo trial as a governed workflow and alpha install/connect surface. It found a real target repo failure, constrained the work to a small target-only repair, produced command evidence, and reduced review burden for the scoped `@muke/evals` proof engine. It did not prove internal-alpha readiness yet: project-scoped activation still failed to select target owner files, full recursive target tests exposed broader timeout caveats outside the selected slice, and this was still author-operated.

Readiness signal: positive but not sufficient for internal alpha.

## Scope

Selected target task:

```txt
Repair muke-v2 eval tests so acceptance report linked surgical proof errors are stable and the INIT_CWD task-report CLI test does not time out, with a minimal target-repo-only change.
```

Non-goals:

- no KRN package source changes;
- no dashboard/API/MCP/worker/source crawler/broad eval platform;
- no activation scoring change;
- no memory/reflection scoring change;
- no npm/global binary publishing;
- no target writes outside the scoped eval repair.

## KRN Alpha Install And Doctor

Alpha checkout:

```txt
.local-lab/v01-alpha-target-trial/krn-alpha
```

Commands:

```sh
git clone --branch v0.1.0-alpha.0 --depth 1 file:///home/krn/coding/krn/active/mise-en-palace .local-lab/v01-alpha-target-trial/krn-alpha
pnpm install --frozen-lockfile
pnpm krn doctor
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm krn doctor
```

Result:

- clean tag checkout installed;
- `pnpm krn doctor` passed in preview mode without DB;
- DB-backed `pnpm krn doctor` passed with reachable Postgres, `14/14` migrations, pgvector, harness schema, source graph, memory governance, retrieval substrate, activation, codex adapter, worker job contracts, and target repo readiness all reported ready.

What this proves:

- tagged source-workspace alpha can be installed and run locally;
- DB-backed doctor works from the tag checkout.

What this does not prove:

- hosted install UX;
- second-operator usability;
- product readiness;
- target task quality by itself.

## Target Init / Connect

Target initial state:

```txt
repo: /home/krn/coding/vibe-coding/muke-v2
branch: main...origin/main
worktree: clean
```

Dry-run command:

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm krn init --dry-run --repo /home/krn/coding/vibe-coding/muke-v2
```

Dry-run result:

- package manager: pnpm;
- TypeScript: present;
- existing `AGENTS.md`: present;
- existing `.agents/skills`: present;
- forbidden surfaces: absent;
- source seed proposal: `package.json`, `README.md`, `AGENTS.md`;
- no files written.

Connect command:

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm krn init --connect --repo /home/krn/coding/vibe-coding/muke-v2 --persist
```

Persisted target IDs:

```txt
Project ID: 11c941f1-26d6-470d-a19e-3d4b15980d33
Repo installation ID: 1c4c3bb7-bfed-45d0-9b95-f78a2117c7c4
ProjectKernel ID: 71e42449-992d-42db-9ee0-ed1531c448da
```

What this proves:

- KRN alpha can detect and register a real external target repo without writing target overlay files.

What this does not prove:

- target trust/redaction safety beyond this source seed;
- second-operator setup;
- good target activation.

## KRN Plan Review

Global plan run:

```txt
executionRun: 99dc47a1-edcc-49af-8746-11928a95b8ce
taskContract: a67948ba-2f5c-4e00-b7ca-ed117f510f60
```

Global activation selected KRN guardrails and target init/connect memory. It was useful for scope discipline but not enough for target owner-file recall.

Project-scoped plan run:

```txt
executionRun: a4e487d0-760c-4dd3-b652-c2f84a0f5231
taskContract: 53442eab-1fc7-4fde-9c80-5f69304106ce
contextAssembly: 9084d9b2-2ac1-491d-91fb-9be19639ea2b
evidenceBundle: 44b8eb1b-79c4-439e-95e5-5d7dc7bd0082
reviewAssessment: 8abf2b52-ee84-41a6-86cc-67648adfc7c2
feedbackDelta: 50362043-9279-4efe-88d7-8ff6f98830da
observationGroup: 37fd5514-bf8e-40c7-81bb-9a47f0dd52d2
reflectionRecord: d860ca43-a741-418e-85e3-110db6eb9d90
```

Project-scoped activation selected one stale/mismatched owner-file recall item:

```txt
search_document:11111111-1111-4111-8111-111111111002
reason: Owner-file recall: packages/cli/src/runDbReadinessCommand.test.ts
```

Verdict:

- global KRN planning helped with guardrails;
- project-scoped KRN activation did not select target owner files;
- source inspection with `rg` still carried owner-file discovery.
- observe persisted 5 observation items with no Memory mutation;
- reflect persisted a record but selected 0 observations and produced 0 findings, 0 gaps, and 0 candidate rows.

## Baseline Target Failure

Command:

```sh
cd /home/krn/coding/vibe-coding/muke-v2
pnpm install --frozen-lockfile
pnpm -r test
```

Baseline result:

- install passed;
- recursive tests failed first in `@muke/evals`.

Observed failures:

```txt
evals/test/verify-acceptance-report.test.ts
- expected "Linked surgical diff report is missing."
- got ENOENT realpath '/tmp/.../.muke/evals'

evals/test/verify-acceptance-report.test.ts
- expected "Linked surgical diff report must live under the current repo .muke/evals directory."
- got ENOENT realpath '/tmp/.../.muke/evals'

evals/test/write-task-report-cli.test.ts
- package-script INIT_CWD test timed out at 5000ms
```

## Repair Diff Summary

Target files changed:

```txt
evals/src/report-artifacts.ts
evals/test/write-report.test.ts
evals/test/write-task-report-cli.test.ts
```

Changes:

- `readSurgicalDiffArtifact` now uses the canonical `.muke/evals` path for boundary checking instead of requiring the directory to already exist before checking the linked file.
- spawned-process package-script tests that legitimately exceed 5s on this machine now use a `15_000` ms timeout.

Why this is final-pattern:

- missing linked surgical proof now returns the domain error instead of leaking filesystem `ENOENT`;
- outside-directory proof still fails with the explicit boundary message;
- no production behavior was weakened;
- no broad timeout config was changed;
- no new framework or abstraction was added.

## Target Verification

| Command | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `pnpm vitest run test/verify-acceptance-report.test.ts test/write-task-report-cli.test.ts` in `evals` | passed, 23 tests | Original failing acceptance/report CLI tests pass. | Does not prove full target suite. |
| `pnpm test` in `evals` | passed, 40 files / 287 tests | Scoped `@muke/evals` package is green after repair. | Does not prove other workspace packages. |
| `pnpm build` in `evals` | passed | TypeScript compile for scoped package passes. | Does not prove runtime correctness beyond types. |
| `git diff --check` in target repo | passed | Target diff has no whitespace errors. | Does not prove behavior. |
| `pnpm -r build` in target repo | passed | Workspace packages compile. | Does not prove test stability. |
| `pnpm -r test` in target repo | failed with other timeout tests | Broader recursive test suite still has timeout sensitivity in spawned-process tests. | Does not invalidate the scoped `@muke/evals` fix, but blocks claiming full target green. |

Broader recursive test caveat:

```txt
mcp/execute/test/sandbox.test.ts timed out at 5000ms.
mcp/facts/test/bootstrap-probe.test.ts timed out at 5000ms.
Earlier parallel evals run also showed timeout sensitivity in root-wedge/surgical-diff spawned tests.
```

These were not expanded in this trial because V01-00 required one bounded target task, not a full target test-infra cleanup.

## Target Commit

Committed and pushed to target remote:

```txt
05a383e fix(evals): stabilize report artifact tests
```

## Dogfood Brain Usefulness Section

### Selected / Used / Helped Context

| Item | Type | Used? | Helped? | Notes |
| --- | --- | --- | --- | --- |
| Target init/connect memory/source seed guidance | memory/source | yes | helped | Kept init/connect read-only and made source seed evidence explicit. |
| Weak evidence provenance guidance | source | yes | helped | Report separates passed scoped proof from failed broader recursive proof. |
| Project-scoped owner-file recall item for KRN DB readiness | search document | no | noise | Not relevant to `muke-v2`; demonstrates target recall weakness. |
| `muke-v2` `AGENTS.md` | target source | yes | helped | Preserved small, scoped, no-broad-framework target repair discipline. |
| `evals/src/report-artifacts.ts` | target source | yes | helped | Actual owner file found through `rg` and failing tests, not KRN activation. |

### Missing Context

- target owner files for `@muke/evals` report artifact helpers;
- target package scripts/test-owner hints;
- previous target failures for spawned-process timeout tests.

### Evidence Strength

Strong for:

- tag checkout install;
- DB-backed alpha doctor;
- target init dry-run/connect;
- scoped target package repair;
- target commit/push.

Weak or incomplete for:

- full target suite green status;
- target activation relevance;
- reflection extraction usefulness;
- second-operator usability;
- target trust/redaction safety.

### Review Burden Delta

Before:

```txt
Target repo had failing eval tests with leaked filesystem ENOENT and too-tight spawned-process timeouts.
```

After:

```txt
Scoped eval package has stable domain errors and enough timeout budget for package-script spawned-process tests. Broader workspace timeout caveats are explicit.
```

Delta: reduced for the selected `@muke/evals` slice; unchanged for broader workspace timeout sensitivity.

### Candidate Reviewability

MemoryCandidate:

```txt
summary: Target repo trials should distinguish scoped target proof from broader target-suite caveats.
evidence refs:
- this report
- target commit 05a383e
doesNotProve: Does not prove product readiness or full target suite health.
reviewability: ready
decision: review
```

EvalCandidate:

```txt
summary: Target-trial reports should fail readiness overclaims when project-scoped activation selects non-target owner files.
evidence refs:
- project-scoped executionRun a4e487d0-760c-4dd3-b652-c2f84a0f5231
doesNotProve: Does not prove activation scoring should be rewritten; source seed/indexing may be the issue.
reviewability: ready
decision: review
```

### Brain ROI

Verdict: mixed positive.

KRN improved the workflow boundary and target onboarding evidence, but did not yet provide good target owner-file recall. The trial still required manual source inspection to find the real repair files.

## Product Readiness Implication

KRN is not internal-alpha-ready yet.

This trial moves KRN closer because it proves a tagged alpha can connect to and guide one real external target repo task. It also exposes the next blockers:

- target owner-file recall is weak;
- broader target suite caveats must be separated from scoped proof;
- second-operator evidence is still missing;
- target trust/redaction behavior remains unproven.

## Next Recommended Action

Continue to:

```txt
V01-01 — Operator-Beyond-Author Trial
```

Do not claim internal alpha before V01-01, V01-02, and V01-03 are addressed or explicitly deferred with evidence.
