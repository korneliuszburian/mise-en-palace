# Internal Alpha Release Gate Report

Status: G-03 completion report.

Date: 2026-06-25

## Executive Verdict

Readiness classification:

```txt
defer
```

KRN is stronger than dogfood-only infrastructure now: it has CI, local
backup/restore policy, a source-workspace alpha tag, root `pnpm krn`, and
DB-backed KRN-on-KRN/target-module evidence.

But it is not ready for internal-alpha use by operators beyond the author yet.
The release gate is deferred because current target evidence is repo-local and
author-operated. There is not yet a controlled external target repo trial or
second operator proof.

This is not product-ready and must not be described as product-ready.

## Scope

Changed:

- `docs/reviews/controlled-dogfood/2026-06-25-internal-alpha-release-gate/REPORT.md`;
- `PLAN.md`;
- `GOAL.md`.

Not changed:

- package source;
- package manifests;
- DB schema;
- dashboard/API/MCP surfaces;
- worker runtime;
- activation scoring;
- memory/source/eval promotion behavior.

## Release Gate Inputs

| Requirement | Evidence | Verdict |
| --- | --- | --- |
| CI verifies core commands | G-00, GitHub Actions run `28182565704` green for `ff5e384` | pass |
| DB backup/restore policy exists | G-01, ADR-0026, scratch restore smoke | pass for local/internal-alpha |
| Packaging/install path exists | G-02, ADR-0027, tag `v0.1.0-alpha.0`, tag clone install/doctor proof | pass for source workspace |
| Safety/trust boundary review has no critical unresolved issue | E-00 | pass for continued dogfood, not public product |
| Target repo evidence exists | C-00 workers target-module trial, C-01 init/connect source-seed hardening | partial |
| Operators beyond author can use it | no current evidence | fail |
| Product readiness | explicitly not expected | fail by design |

## CI And Tag Evidence

```txt
tag: v0.1.0-alpha.0
tag_target: ff5e3841da5299911856f01b6f82f3a4af8123f9
ci_run: https://github.com/korneliuszburian/mise-en-palace/actions/runs/28182565704
ci_status: success
```

The tag clone verification from G-02 passed:

```txt
git clone --branch v0.1.0-alpha.0 --depth 1 ...
pnpm install --frozen-lockfile
pnpm krn doctor
```

## Target Evidence Review

### C-00 Target Workers Harness Trial

Verdict:

```txt
useful internal-alpha signal, not enough for release
```

What it proved:

- KRN connected repo-local `packages/workers` as a separate project.
- KRN planned a project-scoped task.
- A focused TypeScript boundary repair was implemented.
- Evidence, observe, and reflect persisted without Memory Core mutation.

What it did not prove:

- external customer repo readiness;
- operator-beyond-author usability;
- activation relevance for target repos;
- reflection usefulness.

### C-01 Init Connect Source Seed Hardening

Verdict:

```txt
important target onboarding foundation, not enough for release
```

What it proved:

- `krn init --dry-run` and `krn init --connect` expose command detection,
  source seed, project scope, forbidden surfaces, and files-written status.
- Fresh `packages/schema` target records can store source seed metadata.
- No target files are written.

What it did not prove:

- source seed improves activation;
- external repo onboarding is polished;
- another operator can run the flow without author support.

## Readiness Checklist

| Gate | Status | Reason |
| --- | --- | --- |
| Repeatable install | pass | `v0.1.0-alpha.0` source workspace install path exists. |
| Root CLI command | pass | `pnpm krn doctor` works from root and tag clone. |
| CI | pass | Typecheck, tests, Promptfoo smoke, DB readiness/check/smoke pass remotely. |
| DB rollback path | pass for local/internal-alpha | Backup/restore smoke exists; production DR deferred. |
| Target project identity | pass | C-00/C-01 created/reused target project records. |
| Target source repair | partial pass | C-00 repaired repo-local workers package only. |
| Activation target relevance | weak | C-00 activation abstained; later owner-file repair helped KRN repo but external target quality is unproven. |
| Reflection usefulness | weak | Reflection persists but often remains ledger-only. |
| External target repo trial | missing | No external controlled target repo trial yet. |
| Second operator proof | missing | No operator-beyond-author run yet. |

## Decision

```txt
decision: defer internal-alpha release

allowed_next:
  - run one controlled external target repo trial using v0.1.0-alpha.0
  - use root pnpm krn operator command
  - collect DB-backed evidence and dogfood report
  - decide again after target evidence

not_allowed:
  - claim product-ready
  - claim broad internal-alpha readiness
  - publish npm packages
  - add dashboard/API/MCP/worker runtime as release theater
```

## Command Evidence

Persisted IDs:

```txt
executionRun: cc83d88f-9ad4-40f5-92a5-b36752c0961d
taskContract: 90199781-60e0-463c-afef-747350562283
harnessPlan: a0b3bcc5-0bde-4ae9-8696-f1d0c013841d
contextAssembly: dac11079-e3e4-48b0-a4ff-365b5951bcb4
evidenceBundle: 36b7c884-f044-43cb-b7ef-44ed0c1ece1a
reviewAssessment: 7b9fe497-c7ee-4b7a-8e79-a58274227257
feedbackDelta: ce39d205-9b5b-4a0c-ba60-c6f2bee72864
observationGroup: 0c87dbd1-6aab-40bf-804c-c8c8388e8231
reflectionRecord: d34c9726-298c-4ec0-a283-bf9f9a5b829a
Memory mutation: none
MemoryRecord created: no
```

| Command | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `gh run view 28182565704 --json ...` | passed, success | Latest G-02 commit has green CI. | Does not prove future CI or product readiness. |
| `git show-ref --tags v0.1.0-alpha.0` | passed | The first internal-alpha tag exists and points to `ff5e384`. | Does not prove release readiness by itself. |
| tag clone `pnpm install --frozen-lockfile` | passed in G-02 | Tagged source workspace can install. | Does not prove npm/global binary readiness. |
| tag clone `pnpm krn doctor` | passed in G-02 | Root operator CLI works from the tag. | Does not prove DB-backed target workflows. |
| `git diff --check` | passed | Diff has no whitespace errors. | Does not prove decision quality. |
| `krn evidence capture --run-id cc83d88f... --persist` | passed | G-03 evidence, review assessment, feedback delta, command provenance, and changed-file classification were persisted. | Does not prove internal-alpha readiness. |
| `krn observe --run cc83d88f... --persist` | passed | G-03 observation staging was persisted without Memory Core mutation. | Does not prove final memory truth. |
| `krn reflect --scope run:cc83d88f... --persist` | passed | G-03 reflection selected 5 observations without MemoryRecord creation or candidate row writes. | Does not prove reflection quality at scale. |

## Dogfood Brain Usefulness Section

### Brain Usefulness Summary

Brain ROI:
- positive

Overall verdict:
- KRN helped keep the release gate honest. The evidence supports stronger
  dogfood/internal-alpha foundations, but not release to operators beyond the
  author.

What this run proves:
- KRN can use current reports/ADRs/CI/tag evidence to make a bounded go/no-go
  decision without adding product surfaces.

What this run does not prove:
- product readiness;
- external target-repo readiness;
- another operator can use KRN successfully;
- activation/reflection quality is sufficient.

DB used in current shell:
- yes for persisted planning.

### Activated Context Usefulness

| Item | Type | Used? | Helped? | Notes |
| --- | --- | --- | --- | --- |
| Target init/connect memory/source | memory/source | yes | helped | Anchored target onboarding requirements. |
| Weak evidence source claim | source | yes | helped | Prevented CI/tag proof from becoming product proof. |
| AGENTS guidance source claim | source | yes | helped | Kept goal state in PLAN/GOAL, not AGENTS. |
| Source graph health claim | source | partly | neutral | Relevant to future alpha, not this release gate. |
| Direct release reports | source inspection | yes | helped | G-00/G-01/G-02/C-00/C-01/E-00 carried the decision. |

### Evidence And Review Burden

| Evidence item | Strength | What it proves | Review burden impact |
| --- | --- | --- | --- |
| CI run `28182565704` | strong | Latest alpha tag target has green CI. | reduces |
| Tag clone proof | strong for install | Tagged source workspace can install and run doctor. | reduces |
| C-00/C-01 target evidence | medium | Repo-local target-module flows work. | reduces but incomplete |
| Missing external/operator proof | strong negative | Release gate must defer. | prevents overclaim |

### Candidate Quality

No candidate was promoted.

Potential candidate:

```txt
EvalCandidate:
  Internal-alpha readiness requires one controlled external target repo trial
  from v0.1.0-alpha.0 with DB-backed plan/evidence/observe/reflect and review
  burden assessment.
evidence:
  G-03 release gate.
doesNotProve:
  Does not prove the trial will pass.
reviewability:
  ready
decision:
  review in G-04.
```

## Next Recommended Action

Continue to:

```txt
G-04 — v0.1 Production Roadmap Gate
```

G-04 should convert this deferred internal-alpha gate into the next bounded
roadmap. The first likely blocker is a controlled external target repo trial
using `v0.1.0-alpha.0`.
