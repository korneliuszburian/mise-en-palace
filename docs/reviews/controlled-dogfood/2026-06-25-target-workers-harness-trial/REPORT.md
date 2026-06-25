# Target Workers Harness Trial Report

Status: C-00 completion report.

Date: 2026-06-25

## Executive Verdict

C-00 completed a DB-backed target-module harness trial using `packages/workers`
as a real target module with separate KRN project identity. KRN connected the
target module, planned a project-scoped task, executed a focused TypeScript
boundary repair, captured evidence, and persisted observe/reflect records. This
is an internal-alpha signal for the harness workflow, not product readiness:
activation abstained for the target project, reflection produced no findings,
and the trial used a repo-local module rather than an external customer repo.

## Trial Setup

- Target module: `packages/workers`
- Target package: `@krn/workers`
- Target repo fingerprint: `sha256:8b6eb6df3f18713b`
- Project ID: `421474cb-d7f5-455e-93ce-5200eb617a4b`
- Repo installation ID: `4d0adb42-15b6-4cfe-957c-ffbccdf2bfbf`
- ProjectKernel ID: `5a70db86-2744-4c9a-a27a-bda7455f004a`
- DB available in current shell: yes
- Execution run: `96488f2b-0015-49fa-8f07-008276183532`
- Evidence bundle: `0547f911-8aef-4ec1-b1f6-f31c850e014f`
- Review assessment: `d1a78b9e-ec0c-4427-a40f-ed14ef35a767`
- Feedback delta: `c8cf520a-e8e2-4fcb-a785-fc14e85ee73a`
- Observation group: `0f7763a9-2250-40bf-a326-f3e7372a5e97`
- Reflection record: `dfe03167-e09e-4d8b-9349-701d2d3801f1`

## Target Task

Task:

```txt
Add unknown-first maintenance job type parsing to the workers target module without building worker runtime.
```

Changed:

- `packages/workers/src/jobTypes.ts`
- `packages/workers/src/index.test.ts`

The repair added:

- `isMaintenanceJobType(value: unknown): value is MaintenanceJobType`
- `parseMaintenanceJobType(value: unknown): MaintenanceJobType | undefined`
- tests proving valid unknown input narrows before domain use;
- tests proving invalid unknown input is rejected.

No worker daemon, background loop, scheduler, DB schema, Memory Core mutation, or
worker runtime behavior was added.

## KRN Flow

### Init dry-run

`krn init --dry-run --repo packages/workers` detected:

- package manager: `package-json`;
- TypeScript: present;
- scripts: `test`, `typecheck`;
- existing target overlays: absent;
- forbidden surfaces: absent;
- files written: none.

### Init connect

`krn init --connect --repo packages/workers --persist` created the target
project, repo installation, and project kernel listed above.

### Project-scoped plan

`krn plan --project 421474cb-d7f5-455e-93ce-5200eb617a4b --task ... --persist`
persisted the execution run.

Activation result:

```txt
Context included: 0
Context excluded: 0
Context status: abstained
```

This is acceptable for C-00 evidence, but it is not a strong activation signal.
The implementation relied on source inspection and TypeScript discipline rather
than selected memory/source context.

### Evidence, Observe, Reflect

Evidence capture classified the changed files as intended:

```txt
intended:
- M ../../GOAL.md
- M ../../PLAN.md
- M ../workers/src/index.test.ts
- M ../workers/src/jobTypes.ts
- ?? ../../docs/reviews/controlled-dogfood/2026-06-25-target-workers-harness-trial/
unrelated:
- none
unknown:
- none
```

Observation persisted 5 items with no Memory Core mutation.

Reflection persisted one record, selected no observations/source/anti-memory,
wrote no candidate rows, and created no MemoryRecord.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `pnpm --filter @krn/workers typecheck` | passed | The workers target module compiles after the parser/guard change. | Does not prove full workspace behavior or product readiness. |
| `pnpm --filter @krn/workers test` | passed | Workers tests cover maintenance job type narrowing and invalid input rejection. | Does not prove worker runtime execution. |
| `pnpm typecheck` | passed | The full workspace typechecks after the target module and plan/report changes. | Does not prove runtime behavior. |
| `pnpm test` | passed | The full workspace test suite passes after the target module and plan/report changes. | Does not prove product readiness. |
| `git diff --check` | passed | The current diff has no whitespace errors. | Does not prove semantic correctness. |
| `pnpm db:ready` | passed | Current-shell Postgres is reachable, 14/14 migrations are applied, and pgvector is available. | Does not prove CI or hosted DB readiness. |
| `pnpm db:smoke:init-connect` | passed | Fixture init/connect smoke still passes with cleanup. | Does not prove this target module task is useful. |
| `pnpm db:smoke:target-repo-harness` | passed | Target repo harness smoke still persists/readbacks the fixture path. | Does not prove external repo product readiness. |
| `krn init --dry-run --repo packages/workers` | passed | KRN can inspect the workers module without writing target files. | Does not prove persisted project isolation. |
| `krn init --connect --repo packages/workers --persist` | passed | KRN can create project/repo/kernel records for the workers module. | Does not prove activation relevance. |
| `krn plan --project ... --persist` | passed | KRN can create a project-scoped persisted execution run. | Does not prove context selection quality because activation abstained. |
| `krn evidence capture --run-id ... --persist` | passed | KRN captured intended-file classification and operator-reported target command evidence. | Does not run shell commands itself. |
| `krn observe --run ... --persist` | passed | KRN staged observations for the target run without Memory Core mutation. | Does not prove observation usefulness. |
| `krn reflect --scope run:... --persist` | passed | KRN persisted a reflection record without candidate/memory mutation. | Does not prove useful reflection extraction. |

## Dogfood Brain Usefulness Section

### Brain Usefulness Summary

Brain ROI:
- mixed positive

Overall verdict:
- KRN was useful as a governed target-module workflow and evidence/review spine.
  It was weak as a context selector for this target project because activation
  abstained.

What this run proves:
- KRN can connect a real repo-local target module with separate project identity.
- KRN can plan, execute, capture evidence, observe, and reflect against that
  project in the current shell.
- Evidence capture can classify target-module changed files as intended.
- A small TypeScript boundary repair can be verified through target module
  typecheck and tests.

What this run does not prove:
- external customer repo readiness;
- activation relevance for target repos;
- reflection usefulness;
- worker runtime execution;
- product readiness.

DB used in current shell:
- yes

### Activated Context Usefulness

| Item | Type | Why selected | Used? | Helped? | Missing/Stale/Noise? | Evidence | Follow-up |
| --- | --- | --- | --- | --- | --- | --- | --- |
| none | other | Activation abstained | no | unknown | missing | execution run `96488f2b-0015-49fa-8f07-008276183532` | improve activation later only if repeated target runs show the same miss |

### Missing Context

| Missing item | Expected source | Why it mattered | Evidence | Repair implication |
| --- | --- | --- | --- | --- |
| `packages/workers/src/jobTypes.ts` owner file | raw recall / source file | The task directly changed maintenance job type parsing. | Manual source inspection found the owner file after activation abstained. | raw recall / target-project activation |
| `packages/workers/src/index.test.ts` owner test file | raw recall / source file | Target verification required focused tests. | Manual source inspection and target tests. | raw recall / target-project activation |

### Memory Usefulness

| Memory/Candidate | Selected? | Used? | Outcome | Evidence provenance | Reviewability | Follow-up |
| --- | --- | --- | --- | --- | --- | --- |
| none | no | no | unknown | DB run | unknown | no action |

### Source Grounding Usefulness

| Source/Claim | Supported decision? | Prevented overclaim? | Decorative/noise? | Missing conflict? | Evidence | Follow-up |
| --- | --- | --- | --- | --- | --- | --- |
| `packages/workers/README.md` current truth | yes | yes | no | no | states no daemon/background runtime is built | keep |
| `packages/workers/src/jobTypes.ts` domain source | yes | yes | no | no | owner file for `MaintenanceJobType` union | keep |

### Evidence And Review Burden

| Evidence item | Strength | What it proves | What it does not prove | Review burden impact |
| --- | --- | --- | --- | --- |
| Target typecheck | strong | target package compiles | full product readiness | reduced |
| Target tests | strong | valid/invalid parser behavior is covered | worker runtime behavior | reduced |
| Intended-file evidence capture | strong | changed files were intended and no unrelated dirty files were present at capture | correctness of the change | reduced |
| Project-scoped persisted plan | mixed | project identity and execution run exist | activation relevance | unchanged |
| Observe/reflect | weak | records persist without Memory Core mutation | useful extraction | unchanged |

### Observation And Reflection Usefulness

| Observation/Reflection | Output | Useful? | Evidence refs | Follow-up |
| --- | --- | --- | --- | --- |
| Observation group `0f7763a9-2250-40bf-a326-f3e7372a5e97` | 9 items | ledger-only | current-shell observe output | keep as evidence |
| Reflection record `dfe03167-e09e-4d8b-9349-701d2d3801f1` | empty | ledger-only | current-shell reflect output | improve only after repeated target runs show missing findings |

### Candidate Quality

| Candidate | Type | Evidence refs | Reviewability | Decision | Follow-up |
| --- | --- | --- | --- | --- | --- |
| Evidence feedback proposal | MemoryCandidate proposal | evidence capture output | too vague | reject/defer | do not promote |

### Brain ROI

| Dimension | Verdict | Evidence |
| --- | --- | --- |
| Context waste | same | activation selected nothing; manual source inspection still required |
| Review burden | lower | intended-file evidence, target command proof, and project IDs are explicit |
| Resume quality | better | report records IDs, commands, changed files, and limitations |
| Decision grounding | better | no worker runtime was built; README/source boundaries constrained scope |
| Memory usefulness | unknown | no memory selected |
| Operator friction | mixed | DB/project flow worked, but activation abstention required manual file discovery |

## Product Readiness Signal

Verdict:

```txt
internal-alpha signal, not internal-alpha-ready.
```

Why:

- A DB-backed target-module trial exists.
- KRN improved one real coding task with clearer review burden.
- Evidence capture, observe, and reflect ran against a project-scoped execution
  run.

Why not ready:

- activation did not select target owner files;
- reflection did not extract useful findings;
- this was a repo-local module, not an external target repo;
- no later activation link from this target repair has been proven.

## Next Recommended Action

Continue to:

```txt
C-01 — Target Repo Registry And Init/Connect Hardening
```

C-01 should use this report as input, especially the fact that init/connect
worked for `packages/workers` but target project activation abstained.
