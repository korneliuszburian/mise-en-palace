# Operator-Beyond-Author Trial

Status: V01-01 completion report.

Date: 2026-06-25
Mode: constrained handoff simulation
Alpha tag: `v0.1.0-alpha.0`
Fresh checkout: `.local-lab/v01-operator-handoff/mise-en-palace`
DB available: yes

## Executive Verdict

Operator usability is mixed positive. A fresh clone using only checked-in install/runbook and tag instructions can install the alpha, run `pnpm alpha:verify`, start/verify the local DB path, and run a persisted KRN plan. That is enough to say the source-workspace alpha path is repeatable for a technically capable operator.

It is not enough to clear internal alpha by itself. This was a constrained simulation, not a real second operator; `alpha:verify` is long; `pnpm install` shows ignored build-script warnings without runbook explanation; and `pnpm alpha:verify` ends with preview-only `krn doctor` until the DB-specific commands are run separately.

Classification: mixed positive.

## Scope

Question:

```txt
Can an operator use the checked-in runbook/tag instructions without author-only context?
```

Inputs used:

- `GOAL.md`
- `PLAN.md`
- `docs/runbooks/internal-alpha-install.md`
- `docs/releases/v0.1.0-alpha.0.md`

Non-goals:

- no package source changes;
- no new product surface;
- no dashboard/API/MCP/worker/source crawler/broad eval platform;
- no new tag;
- no npm/global binary publishing.

## Transcript Summary

Fresh clone and checkout:

```sh
git clone https://github.com/korneliuszburian/mise-en-palace.git .local-lab/v01-operator-handoff/mise-en-palace
cd .local-lab/v01-operator-handoff/mise-en-palace
git checkout v0.1.0-alpha.0
pnpm install --frozen-lockfile
pnpm alpha:verify
```

Result:

- clone passed;
- checkout tag passed;
- install passed;
- pnpm printed ignored build-script warnings for dependencies;
- `pnpm alpha:verify` passed.

`alpha:verify` ran:

```txt
pnpm typecheck
pnpm test
pnpm krn doctor
```

Observed test proof inside fresh checkout:

```txt
@krn/core: 12 files / 59 tests passed
@krn/schema: 3 files / 26 tests passed
@krn/harness: 21 files / 88 tests passed
@krn/workers: 1 file / 6 tests passed
@krn/codex-adapter: 4 files / 8 tests passed
@krn/db: 23 files / 76 tests passed
@krn/cli: 27 files / 156 tests passed
```

Doctor result without DB:

```txt
Brain store readiness: preview only
Harness persistence readiness: preview only
Target repo readiness: preview only
Forbidden surfaces: absent
```

This is expected from the runbook because DB-backed work is a separate section.

DB-backed commands:

```sh
docker compose up -d krn-postgres
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke
```

Result:

- compose service already running;
- DB readiness passed with reachable Postgres, `14/14` migrations, pgvector available;
- DB smoke passed with project readback matched and cleanup completed.

KRN plan smoke:

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm krn plan --task "operator handoff smoke from fresh alpha checkout" --persist
```

Persisted IDs:

```txt
executionRun: 072d566e-5cd2-4a6f-9e82-ec77ea16ddd2
taskContract: fcf9e486-7966-4fd8-b288-0cea93ecb9c0
harnessPlan: a9db7fdb-019d-4541-9599-9af80377c718
contextAssembly: 1bc4b188-6951-48f3-8349-5df12b14ce20
evidenceBundle: cec1ae2b-63d1-498a-974a-65af4f3f9edd
reviewAssessment: bc71e0df-f0a7-4b0d-94ae-86b5c080ca51
feedbackDelta: 3a018d39-ca61-4f42-8175-1ae03fa66051
observationGroup: 7445388c-3f22-4bbb-9e14-f9d210b65b38
reflectionRecord: 2ed57e56-343c-466c-8732-7be6a974ed7a
```

Observe/reflect result:

```txt
Observation items: 5
Reflection observations selected: 5
Findings: 0
Gaps: 0
Candidate rows written: no
Memory mutation: none
```

## Friction Log

| Friction | Impact | Recommendation |
| --- | --- | --- |
| `pnpm install` prints ignored build-script warnings. | Operator may wonder whether install is safe or incomplete. | Document that these warnings are expected for the alpha unless a later task approves build scripts. |
| `pnpm alpha:verify` is long. | Operator may think it is hung during sequential package tests. | Add expected runtime / package-progress note. |
| `pnpm alpha:verify` doctor is preview-only without DB. | Operator may interpret preview-only as failure. | Runbook already separates DB-backed work; make the relationship clearer in release notes. |
| DB commands require local Docker/Compose. | Non-Docker operator cannot complete DB-backed proof. | Keep as known alpha limitation until hosted/alternate DB posture exists. |
| This was simulated, not a real second person. | Cannot prove actual human usability. | Keep internal alpha deferred until a real second-operator run or stricter delegated session. |

## Support Given

No code-level support was used. The simulated operator used checked-in docs and standard shell commands.

Hidden context that still influenced the run:

- the executor knew where `.local-lab/` is conventionally used;
- the executor knew local Docker/Postgres was already available;
- the executor could interpret preview-only doctor output from prior KRN work.

This is why the classification is `mixed positive`, not `pass`.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `git clone https://github.com/korneliuszburian/mise-en-palace.git` | passed | Public repo clone works. | Does not prove all operators have auth/network configured. |
| `git checkout v0.1.0-alpha.0` | passed | Alpha tag is reachable from clone. | Does not prove tag is sufficient for production. |
| `pnpm install --frozen-lockfile` | passed | Dependencies install from lockfile. | Does not prove ignored build-script warnings are understandable. |
| `pnpm alpha:verify` | passed | Typecheck, tests, and doctor run from fresh alpha checkout. | Does not prove DB-backed readiness by itself. |
| `docker compose up -d krn-postgres` | passed | Local compose service can be started/reused here. | Does not prove non-Docker environments. |
| `pnpm db:ready` | passed | DB reachable, migrations applied, pgvector available. | Does not prove hosted DB or DR. |
| `pnpm db:smoke` | passed | DB write/read/cleanup smoke works. | Does not prove Memory Brain quality. |
| `pnpm krn plan --task ... --persist` | passed | Fresh alpha checkout can create a persisted plan. | Does not prove target task usefulness. |
| `krn evidence capture --persist` | passed | V01-01 report evidence was persisted with command provenance. | Does not prove operator usability by itself. |
| `krn observe --persist` / `krn reflect --persist` | passed | Run observations/reflection were persisted without Memory mutation. | Does not prove reflection extracted useful candidates. |

## Operator Usability Verdict

```txt
mixed positive
```

What passed:

- install instructions;
- root `pnpm krn` command;
- alpha verification;
- DB-ready path;
- persisted plan path.

What remains:

- real second operator proof;
- clearer warning/runtime expectations;
- target trust/redaction evidence;
- internal-alpha re-gate after V01-02/V01-03.

## Next Recommended Action

Continue to:

```txt
V01-02 — Target Trust And Redaction Trial
```

Do not claim internal alpha yet.
