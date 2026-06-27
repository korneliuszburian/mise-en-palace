# V23 Real Target Observation Re-Run After Evidence/DB Ergonomics Repairs

Status: completed target-trial report, not V02-01 proof.

Date: 2026-06-27
Evaluator: Codex
KRN repo: `/home/krn/coding/krn/active/mise-en-palace`
Target repo: `/home/krn/coding/krn/active/krn-elektroinstal-ogar`
Mode: observation-only
DB available: yes

## Executive Verdict

V23 proved the V21/V22 ergonomics repairs in the real target workflow. KRN
reran a DB-backed observation-only owner-file trial on `krn-elektroinstal-ogar`
without target writes. Evidence capture deliberately omitted
`--target-allowed-write` and `--target-forbidden-write`, and persisted/readback
target evidence still showed:

```txt
allowedWrites:
  - none
forbiddenWrites:
  - target source edits
  - target commits
  - target resets or cleans
  - target production/runtime writes
```

This is a positive controlled-internal-alpha signal. It is not V02-01, widened
alpha, product readiness, or full target verification.

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

KRN repo:

```txt
main...origin/main
clean
```

Target repo before:

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
43e08455-6123-465b-990b-5d7abaf842b3
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
| `woohub_gateway_v1/README.md` | yes | Directly supports gateway read-only safety model. |
| target trust exclusions | yes | Kept `.env`, `.git`, runtime/build surfaces out of context. |
| `AGENTS.md` source seed | yes | Target workflow and safety guidance. |
| `CLAUDE.md` source seed | neutral/noise | It is adjacent agent guidance and likely duplicates `AGENTS.md` in this target. |
| `AGENTS.md` owner file | yes | Direct target operator guidance. |
| `bedrock/README.md` | yes | Local Bedrock runtime runbook. |

Excluded:

- one over-budget candidate.

Owner-file recall verdict: good but not ideal.

The plan selected useful safety/runbook context, but did not include every direct
owner file from the supplied set. `bedrock/composer.json` and
`woohub_gateway_v1/main.py` were useful in V20 source inspection and target
commands, but not included in V23 context. The likely issue is owner-file budget
priority/deduplication rather than broad activation scoring.

## Target Commands

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `git status --short --branch` in target | passed | Target stayed clean. | Does not prove runtime correctness. |
| `composer validate --no-check-lock --strict` in `bedrock/` | passed | Composer manifest is structurally valid. | Does not install dependencies, run PHP lint, run Pest, or boot WordPress. |
| Python AST parse for `woohub_gateway_v1/**/*.py` | passed | Gateway Python files parse. | Does not execute gateway actions or validate credentials. |

Target repo after:

```txt
* master...origin/master
clean — nothing to commit
```

## Evidence / Observation / Reflection

Evidence capture intentionally omitted:

```txt
--target-allowed-write
--target-forbidden-write
```

Persisted evidence:

```txt
evidenceBundle: 42d6853a-367a-4dfc-993e-10457f0751cb
reviewAssessment: 84e1208f-3f28-46e5-bd2e-8718d92aa826
feedbackDelta: 5c9f1dd7-700f-4c85-bd15-5929e6fb1441
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
observationGroup: a6cd29fa-003f-4628-ae8c-56dc68814c83
observationItems: 5
memory mutation: none
```

Reflection:

```txt
first reflectionRecord: c0a6924e-4800-4361-9adb-c0bfecf93065
first reflection observations selected: 0
rerun reflectionRecord: 49be01ca-aa00-4a29-a203-03a35233dff9
rerun reflection observations selected: 5
memory mutation: none
```

The first reflect was accidentally run in parallel with observe and selected
zero observations. It was rerun after observe completed. The second reflect is
the valid proof for this report.

## Dogfood Brain Usefulness

Activation usefulness: positive with owner-file precision caveat.

KRN selected useful target safety and runbook context. It still appears to spend
budget on adjacent/duplicate agent guidance before some direct owner files.

Evidence usefulness: strong positive.

The exact V21 behavior was proven in persisted target evidence and readback.

DB ergonomics usefulness: positive.

No missing-env blocker occurred because DB was already configured. V22 remains
validated by its own source repair and CLI preview, not by a missing-env event
in this run.

Review burden: lower.

The run show output is readable and makes observation-only write boundaries
explicit.

Brain ROI: positive.

## What This Improves

- V21 target evidence defaults are proven in a real target flow.
- V22 did not regress persisted target flow.
- Target repo stayed clean before and after.
- Readback shows nested target evidence lists clearly.

## What This Does Not Prove

- V02-01 second-operator usability.
- Product readiness.
- Widened internal alpha.
- Full target runtime verification.
- General activation quality.
- Reflection extraction quality.

## Next Recommended Action

Promote one bounded source repair:

```txt
V24 — Target Owner-File Recall Deduplication And Budget Priority
```

Why:

V23 selected useful context, but budget went to adjacent agent guidance while
some direct owner files were not selected. This should be treated as a bounded
owner-file recall/read-model precision repair, not a broad activation scoring
rewrite.

Expected shape:

- inspect target owner-file candidate assembly and source seed interaction;
- deduplicate equivalent agent guidance where possible;
- ensure explicit owner files get priority over broad/adjacent seeds for
  owner-file-heavy target tasks;
- add focused tests;
- do not add source crawler or rewrite scoring broadly.

