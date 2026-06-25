# Internal Alpha Packaging And Versioning Report

Status: G-02 completion report.

Date: 2026-06-25

## Executive Verdict

G-02 adopts a conservative internal-alpha packaging path: a git-tagged pnpm
source workspace with root `pnpm krn ...` as the operator command and
`pnpm alpha:verify` as the local verification command.

This intentionally does not publish npm packages, create a global binary,
generate `dist/` package output, or add a dashboard/API/MCP/plugin/worker
runtime surface.

## Scope

Changed:

- `package.json`;
- `docs/decisions/ADR-0027-internal-alpha-source-packaging.md`;
- `docs/runbooks/internal-alpha-install.md`;
- `docs/releases/v0.1.0-alpha.0.md`;
- `docs/reviews/controlled-dogfood/2026-06-25-internal-alpha-packaging/REPORT.md`;
- `PLAN.md`;
- `GOAL.md`.

Not changed:

- package source;
- package public barrels;
- package `private` flags;
- DB schema;
- dashboard/API/MCP/plugin surfaces;
- worker runtime;
- global binary install.

## Decision

```txt
adopt_now:
  git tag v0.1.0-alpha.0
  source workspace checkout
  pnpm install --frozen-lockfile
  root pnpm krn operator command
  pnpm alpha:verify

reject_now:
  npm publish
  global binary install
  generated dist package output
  Docker image distribution
  plugin package
```

## KRN Plan Summary

Persisted planning run:

```txt
executionRun: f8467f22-62fa-4ffb-bf40-4fbfda36b0f2
taskContract: 7f3b642a-ccab-49e0-ada5-e397b1d6b165
harnessPlan: d23f2863-cb85-4d0b-839c-e4f7d10962a1
contextAssembly: 3e913d23-3493-43d6-8a78-c5d480a0a3bd
```

Activation selected useful broad guardrails around package/source authority,
weak evidence, AGENTS guidance, and Memory Core write authority. Direct package
owner files and manifests were found by source inspection.

## Operator Install Path

```sh
git clone https://github.com/korneliuszburian/mise-en-palace.git
cd mise-en-palace
git checkout v0.1.0-alpha.0
pnpm install --frozen-lockfile
pnpm alpha:verify
pnpm krn doctor
```

Normal operator flow now uses:

```sh
pnpm krn ...
```

instead of:

```sh
pnpm --filter @krn/cli krn ...
tsx packages/cli/src/index.ts ...
```

## Command Evidence

Persisted IDs:

```txt
executionRun: f8467f22-62fa-4ffb-bf40-4fbfda36b0f2
taskContract: 7f3b642a-ccab-49e0-ada5-e397b1d6b165
harnessPlan: d23f2863-cb85-4d0b-839c-e4f7d10962a1
contextAssembly: 3e913d23-3493-43d6-8a78-c5d480a0a3bd
evidenceBundle: 1eff4bc4-2156-4f8a-98af-51a83b6f826b
reviewAssessment: 0fad55b3-2399-4c34-ba3e-1de3f92f92a5
feedbackDelta: 9766467f-d814-40aa-8609-2c20e8407fb8
observationGroup: 43a1a313-603d-4b44-80ee-d08bfaf99127
reflectionRecord: 827a8fd5-88f3-4a04-b484-8100e5a080ef
Memory mutation: none
MemoryRecord created: no
```

| Command | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `pnpm krn doctor` | passed | Root operator command can run CLI doctor. | Does not prove product readiness. |
| `pnpm alpha:verify` | passed | Alpha verification command runs typecheck, tests, and CLI doctor. | Does not prove DB runtime truth. |
| clean candidate `pnpm install --frozen-lockfile` | passed | Fresh source-workspace copy can install reproducibly from lockfile. | Does not prove npm/global binary readiness. |
| clean candidate `pnpm krn doctor` | passed | Fresh source-workspace copy exposes root operator CLI command. | Does not prove DB-backed flows without DB. |
| `pnpm typecheck` | passed through `pnpm alpha:verify` | Workspace compiles. | Does not prove packaging UX. |
| `pnpm test` | passed through `pnpm alpha:verify` | Test suite passes. | Does not prove internal-alpha readiness. |
| `git diff --check` | passed | Diff has no whitespace errors. | Does not prove semantic correctness. |
| `krn evidence capture --run-id f8467f22... --persist` | passed | G-02 evidence, review assessment, feedback delta, command provenance, and changed-file classification were persisted. | Does not prove internal-alpha readiness. |
| `krn observe --run f8467f22... --persist` | passed | G-02 observation staging was persisted without Memory Core mutation. | Does not prove final memory truth. |
| `krn reflect --scope run:f8467f22... --persist` | passed | G-02 reflection selected 5 observations without MemoryRecord creation or candidate row writes. | Does not prove reflection quality at scale. |

## Dogfood Brain Usefulness Section

### Brain Usefulness Summary

Brain ROI:
- positive

Overall verdict:
- KRN helped keep packaging bounded to source-workspace internal alpha rather
  than premature npm publishing or global binary packaging.

What this run proves:
- root `pnpm krn` hides the package-internal CLI command from normal operator
  workflow;
- `pnpm alpha:verify` runs typecheck, tests, and doctor;
- a clean source-workspace candidate can install with `pnpm install
  --frozen-lockfile` and run `pnpm krn doctor`.

What this run does not prove:
- product readiness;
- npm publication readiness;
- target-repo internal-alpha readiness;
- hosted production deployment.

DB used in current shell:
- yes for persisted planning only.

### Activated Context Usefulness

| Item | Type | Used? | Helped? | Notes |
| --- | --- | --- | --- | --- |
| Package surface doctrine | source inspection | yes | helped | Kept packages private and avoided broad public API claims. |
| G-00 CI proof | source inspection | yes | helped | Tag target must be CI-green. |
| G-01 backup policy | source inspection | yes | helped | Stateful alpha claims must point to backup/restore policy. |
| Root package manifest | source inspection | yes | helped | Owned `pnpm krn` and `pnpm alpha:verify` scripts. |
| KRN activation owner-file recall | activation | partial | mixed | Selected useful guardrails but not direct package manifests/runbooks. |

### Evidence And Review Burden

| Evidence item | Strength | What it proves | Review burden impact |
| --- | --- | --- | --- |
| Root `pnpm krn` script | medium | Operator no longer needs package-internal CLI command. | Reduces install/run friction. |
| Install runbook | medium | Alpha install path is explicit. | Reduces onboarding ambiguity. |
| Release notes | medium | Alpha tag claims and limitations are explicit. | Reduces overclaim risk. |

### Candidate Quality

No candidate was promoted.

Potential candidate:

```txt
MemoryCandidate:
  Internal alpha packaging should stay git-tagged and source-workspace based
  until target-repo trials prove npm/global binary needs.
evidence:
  ADR-0027 and G-02 clean clone verification.
doesNotProve:
  Does not prove npm publication readiness.
reviewability:
  ready
decision:
  defer until G-03.
```

## Product Readiness Signal

Verdict:

```txt
internal-alpha packaging path exists; internal-alpha readiness still requires G-03.
```

## Next Recommended Action

Continue to:

```txt
G-03 — Internal Alpha Release Gate
```

G-03 must decide readiness from CI, backup policy, packaging proof, and target
repo evidence. It must not call KRN product-ready.
