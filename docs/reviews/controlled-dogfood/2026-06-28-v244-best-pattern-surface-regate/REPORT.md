# V244 Best-Pattern Surface Re-Gate

Status: complete.

Date: 2026-06-28

## Executive Verdict

V244 selected the next surface by current evidence, not by adding more sources.
The strongest repeated gap is activation/read-model owner-file recall for
source-to-decision and pattern-intake work.

Decision:

```txt
next task: V245-00 Source-Decision Owner-File Seed Repair
surface: harness / activation / operator UX
primary consumer: target read model source/owner-file detection and focused activation tests
```

Do not start a new research intake. Do not rewrite activation scoring. The
bounded repair should improve the read-model inputs for source/standard/runbook
work so future KRN plans can select the right owner files without manual `rg` as
the primary discovery path.

## Inputs

Current-state proof:

```txt
branch: main
worktree: clean before V244 edits
latest commit before V244: cf21c19 test(sources): guard Codex process source decisions
db: ready, 14/14 migrations, pgvector available
```

Persisted V244 plan:

```txt
executionRun: 46ea43a6-4e64-4531-a563-88906c7022e7
taskContract: 1d787945-d3c3-4859-a3ea-8360975948e7
projectResolution: connected_repo_path (connected repo path)
evidenceBundle: 0d370731-f598-4c6d-a811-e0fcb6abbcad
reviewAssessment: 8092cf55-6446-4a0c-8947-d736bdc55063
feedbackDelta: 26a01268-2dcc-44ce-8cac-c283d57584d0
observationGroup: 720e85e0-18dd-4659-a114-3e63fa454abb
reflectionRecord: e6df1e27-3696-4746-b8c8-d20c2b514e15
MemoryRecord created: no
```

## Surface Review

| Surface | Current evidence | Verdict | Next implication |
|---|---|---|---|
| Infra / storage / migrations / queues | DB readiness is stable; worker runtime remains intentionally deferred. | defer | No new infra source. |
| Harness / activation / memory / review gates | V241, V243, and V244 all required manual discovery of source-map/runbook/standards owner files. Exact owner-file recall works when owner files are present. | selected | Repair read-model/source seed input before scoring. |
| CI / release / eval / Promptfoo | CI already runs typecheck, tests, brain-battle smoke, Promptfoo smoke, DB readiness/smoke, and diff check. | defer | No broad eval lane. |
| Codex surfaces / skills / hooks / MCP / subagents | V243 added a consumer guard for Goals, ExecPlans, and Prompting Guide. | defer | Do not expand Codex surfaces now. |
| TypeScript boundaries | V241/V242 proved one official TS source can become a standard and code repair. | defer | No broad TS sweep after one bounded success. |
| Security / permissions / trust boundaries | Existing source map has permissions/security decision; no new repeated failure in V241-V244. | defer | No permissions change. |
| Operator UX / CLI / readback | Project resolution readback improved; owner-file/source seed readback still shows why context was weak. | selected secondary | Repair read-model input and output evidence together if needed. |

## Repeated Evidence

### V241

`docs/KRN_SOURCES.md` and `docs/standards/typescript-excellence.md` were the
real owner files, but activation selected `tsconfig.base.json` and CLI owner
files. The useful source/standard files were found through source inspection.

### V243

The real owner files were:

```txt
docs/KRN_SOURCES.md
docs/runbooks/pattern-intake.md
packages/harness/src/sourceMapInvariants.test.ts
```

Activation selected `AGENTS.md` plus current CLI owner files. The exact
source-map/runbook owner files were again found through source inspection.

### V244

The V244 persisted plan selected:

```txt
packages/cli/src/runPlanCommand.ts
packages/cli/src/runRunShowCommand.ts
packages/harness/src/activation/activationEngine.ts
AGENTS.md
tests
trust exclusions
```

It did not select:

```txt
docs/KRN_SOURCES.md
docs/runbooks/pattern-intake.md
docs/standards/typescript-excellence.md
packages/harness/src/sourceMapInvariants.test.ts
docs/reviews/controlled-dogfood/2026-06-28-v241-external-best-pattern-intake/REPORT.md
docs/reviews/controlled-dogfood/2026-06-28-v243-codex-execplan-source-decision/REPORT.md
```

This is not enough to rewrite activation scoring. It is enough to inspect and
repair the read-model/source seed inputs.

## Source-To-Decision

```yaml
source_id: v244-repeated-source-owner-recall-gap
title: Repeated Source-To-Decision Owner-File Recall Gap
url_or_ref: docs/reviews/controlled-dogfood/2026-06-28-v241-external-best-pattern-intake/REPORT.md; docs/reviews/controlled-dogfood/2026-06-28-v243-codex-execplan-source-decision/REPORT.md; V244 persisted plan output
trust_tier: high
source_class: repo-local evidence
mechanism: activation can select exact owner files when the target read model names them, but source-to-decision tasks currently rely on broad source seeds and miss the concrete source-map, standard, runbook, and invariant owner files.
krn_implication: before scoring changes, improve the KRN repo read-model/source seed path so source-to-decision work has explicit owner-file candidates.
decision_kind: adopt
decision: run a bounded source-decision owner-file seed repair as V245.
consumer: target read model / source seed detection, owner-file recall tests, and plan readback evidence.
falsifier: after V245, a source-to-decision task still cannot surface docs/KRN_SOURCES.md, docs/runbooks/pattern-intake.md, relevant standards, or source-map invariant owner files from the read model.
does_not_prove: activation scoring is broken, broad search is needed, or every doc deserves owner-file priority.
candidate_output:
  type: EvalCandidate
  reviewability: ready
source_usefulness_feedback:
  status: not_measured
  outcome: unknown
  reason: V244 is a selection gate; usefulness should be measured by the V245 implementation run.
  evidence_refs:
    - docs/reviews/controlled-dogfood/2026-06-28-v244-best-pattern-surface-regate/REPORT.md
  does_not_prove: selection by evidence does not prove the future repair will improve activation.
```

## Next Task

```txt
V245-00 Source-Decision Owner-File Seed Repair
```

Required direction:

- inspect `runInitCommand` source seed detection and owner-file input path;
- inspect `ownerFileRecall` target read-model candidate generation;
- add the smallest read-model/source seed repair so KRN repo source-to-decision
  tasks can surface:
  - `docs/KRN_SOURCES.md`;
  - `docs/runbooks/pattern-intake.md`;
  - relevant standards docs such as `docs/standards/typescript-excellence.md`;
  - source-map invariant owner file when source map guard work is named;
- add focused tests;
- run DB-backed `krn plan --persist` proof for a source-to-decision task.

Non-goals:

- no activation scoring rewrite;
- no source crawler;
- no broad research ingestion;
- no dashboard/API/MCP/worker;
- no broad TypeScript cleanup;
- no generic quality subsystem.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `git fetch --prune && git status --short --branch && git log --oneline -n 8` | passed | Worktree started clean and main matched origin/main. | Does not prove product readiness. |
| `pnpm db:ready` | passed | Local DB is reachable with 14/14 migrations and pgvector. | Does not prove remote DB state. |
| `krn plan --persist` | passed | V244 has a persisted plan and readback evidence. | Does not prove activation selected sufficient owner files. |
| `krn evidence capture --persist` | passed | Evidence, review assessment, and feedback delta were persisted. | Does not prove the selected next task is sufficient. |
| `krn observe --persist` | passed | Observation group and five items were persisted. | Does not prove observations are complete. |
| `krn reflect --persist` | passed | Second reflect after observe selected five observations and wrote a reflection record without Memory Core mutation. | Does not prove reflection extraction quality. |

Runtime ordering caveat:

```txt
A first reflect command ran in parallel with observe and selected 0 observations.
The final proof uses the second reflect after observe completed.
```

## What This Proves

- The next source-backed task was selected from repeated evidence.
- The selected surface has a concrete consumer and falsifier.
- No new source hoard, research backlog, or broad subsystem is justified by
  V244.

## What This Does Not Prove

- V245 will fix activation quality.
- Activation scoring is broken.
- KRN is product-ready.
- V02-01 second-operator proof is complete.
