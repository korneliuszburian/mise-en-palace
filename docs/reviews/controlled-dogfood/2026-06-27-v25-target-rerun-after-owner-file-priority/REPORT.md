# V25 Real Target Observation Re-Run After Owner-File Priority Repair

Status: completed target-trial report, not V02-01 proof.

Date: 2026-06-27
Evaluator: Codex
KRN repo: `/home/krn/coding/krn/active/mise-en-palace`
Target repo: `/home/krn/coding/krn/active/krn-elektroinstal-ogar`
Mode: observation-only
DB available: yes

## Executive Verdict

V25 proved the full real target observation-only workflow after V24 repaired
owner-file priority. The target project plan now includes all five explicit
owner files plus target trust exclusions, target commands remained
observation-only, target repo state stayed clean before and after, persisted
target evidence preserved safe observation-only defaults, and run readback
showed the target proof/non-proof boundary clearly.

This strengthens controlled-internal-alpha evidence for technical operators. It
is not V02-01 second-operator proof, widened alpha, product readiness, full
target runtime verification, or general activation scoring proof.

## Scope

Target:

```txt
/home/krn/coding/krn/active/krn-elektroinstal-ogar
```

Mode:

```txt
observation-only
```

Target writes:

```txt
none
```

## Preflight

KRN repo before V25:

```txt
main...origin/main
clean
latest commit: 8bf1159 fix(activation): prioritize target owner files
CI: passed, run 28287597771
```

Target repo before:

```txt
master...origin/master
clean
```

DB readiness:

```txt
Postgres: reachable
Migrations expected: 14
Migrations applied: 14
pgvector: available
Brain store readiness: ready
```

## Owner-File Contract

`krn init --connect --persist` reused:

```txt
project: e83b4509-6889-426c-90e2-bc4e6394ba26
repoInstallation: f08bfff8-cba2-426b-9c0e-18c90774afff
projectKernel: b51aebe5-a85d-4fae-babd-80f81a0db86e
```

Owner files supplied:

- `AGENTS.md`;
- `bedrock/composer.json`;
- `bedrock/README.md`;
- `woohub_gateway_v1/main.py`;
- `woohub_gateway_v1/README.md`.

## KRN Plan Review

Execution run:

```txt
ca9cfa4d-ab52-49cd-b6cc-de8a3e4289cf
```

Plan summary:

```txt
Target read model: sourceSeeds=3, ownerFiles=5, trustExclusions=7
Target owner-file recall: owner_files_available
Context included: 6
Context excluded: 1
Context status: assembled
```

Included context:

| Item | Helped? | Notes |
|---|---|---|
| `woohub_gateway_v1/README.md` owner file | yes | Direct gateway safety/runbook context. |
| `bedrock/README.md` owner file | yes | Direct Bedrock runtime runbook. |
| `woohub_gateway_v1/main.py` owner file | yes | Direct gateway implementation entry point; this was absent in V23. |
| `AGENTS.md` owner file | yes | Target operator and safety guidance. |
| `bedrock/composer.json` owner file | yes | Direct Bedrock runtime scripts/dependency boundary; this was absent in V23. |
| target trust exclusions | yes | Preserved `.env`, `.muke`, `.git`, dependencies, build, runtime exclusions. |

Excluded:

- one over-budget candidate.

Owner-file recall verdict: strong for this target trial.

V25 specifically proves the V24 repair changed the real target plan from
adjacent/duplicate guidance pressure to direct owner-file inclusion.

## Target Commands

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `git status --short --branch` in target | passed | Target was clean before and after. | Does not prove runtime correctness. |
| `composer validate --no-check-lock --strict` in `bedrock/` | passed | Composer manifest is structurally valid. | Does not install dependencies, run PHP lint, run Pest, or boot WordPress. |
| Python AST parse for `woohub_gateway_v1/**/*.py` | passed | Gateway Python files parse. | Does not execute gateway actions, verify credentials, or test API behavior. |

Target repo after:

```txt
master...origin/master
clean
```

## Evidence / Observation / Reflection

Evidence capture:

```txt
evidenceBundle: 3ad10356-a3af-4f1f-a627-e374066bff56
reviewAssessment: 668eb302-823d-45ce-ac14-327055cd812a
feedbackDelta: de8974ea-1ef8-4680-9ee4-5010ef87c0e0
```

Readback target evidence:

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
observationGroup: cdf863bd-027f-40ae-9b8e-a013543be14c
observationItems: 5
memory mutation: none
```

Reflection:

```txt
reflectionRecord: 673a08e7-a4b3-4e49-9264-b62cfc82ccf6
observations selected: 5
candidate rows written: no
memory mutation: none
```

## Dogfood Brain Usefulness

Activation usefulness: strong positive for this target trial.

V25 selected every explicit owner file and preserved trust exclusions. This is
the exact behavior V24 intended to repair.

Evidence usefulness: strong positive.

The run readback clearly shows target mode, dirty state, write boundaries,
command proof, does-not-prove boundaries, and no Memory Core mutation.

Review burden: lower.

The operator no longer needs to infer why direct owner files are missing from
context; they are visible in the plan.

Brain ROI: positive.

The loop produced evidence -> repair -> real target rerun -> improved context
selection.

## Friction Found

Two small CLI ergonomics issues appeared across V24/V25:

```txt
krn evidence capture uses --run-id while krn observe uses --run.
--target-changed-file none is invalid; absence means none.
```

These did not block the target trial, but they are low-risk operator-friction
candidates.

## What This Proves

- V24 owner-file priority repair works in a real target project plan.
- The real target workflow can run observation-only with no target writes.
- Target evidence defaults remain safe and readable.
- Current-shell DB plan/evidence/observe/reflect/readback works.

## What This Does Not Prove

- V02-01 second-operator usability.
- Product readiness.
- Widened internal alpha.
- Full target runtime verification.
- General activation scoring quality beyond this owner-file read-model case.

## Next Recommended Action

Promote one bounded operator-friction repair:

```txt
V26 — CLI Run Reference And Empty Target Changed Files Ergonomics
```

Why:

The next biggest observed friction is not activation quality. It is tiny CLI
inconsistency exposed by actual dogfood:

- `evidence capture --run-id` vs `observe --run`;
- no explicit accepted spelling for zero target changed files.

This should be repaired only as CLI ergonomics, without changing evidence
semantics, target policy, DB schema, or activation scoring.
