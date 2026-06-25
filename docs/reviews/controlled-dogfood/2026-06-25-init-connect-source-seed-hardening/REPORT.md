# Init Connect Source Seed Hardening Report

Status: C-01 completion report.

Date: 2026-06-25

## Executive Verdict

C-01 hardened `krn init --dry-run` and `krn init --connect` by making command
detection, source seed proposal, project scope, and no-file-write behavior
visible in operator output. Persisted target repo records now carry source seed
metadata through existing JSON metadata fields for Project, RepoInstallation,
and ProjectKernel. No runtime markdown memory, dashboard, API, worker runtime,
or DB migration was added.

## Scope

Changed:

- `packages/cli/src/runInitCommand.ts`
- `packages/cli/src/runCli.test.ts`

Not changed:

- DB schema or migrations;
- project repository query fields;
- target repo file writing;
- dashboard/API/MCP/worker runtime;
- activation scoring;
- memory/source promotion behavior.

## Implementation

Added `SourceSeedProposal` detection for existing target repo surfaces:

```txt
package.json      -> package_manifest
tsconfig.json     -> typescript_config
README.md         -> project_readme
AGENTS.md         -> agent_instructions
src               -> source_root
tests             -> test_root
```

`krn init --dry-run` now renders:

- command detection;
- source seed proposal;
- existing overlay state;
- forbidden surface state;
- no files written.

`krn init --connect --persist` now renders:

- project-scoped boundary;
- command detection;
- source seed;
- files written: none.

For newly connected projects, source seed metadata is stored on:

- Project metadata;
- RepoInstallation metadata;
- ProjectKernel metadata.

This uses existing metadata fields because source seed is unstable connection
metadata, not yet a first-class query model. If later target-repo activation
needs source seed querying, that should become a separate read-model task.

## DB-Backed Proof

### C-01 KRN plan

Execution run:

```txt
886afb4d-07e3-4fff-8aa8-43522b0c86d6
```

Evidence/readback IDs:

```txt
evidenceBundle: 444d1bae-1ac0-4a6e-a97d-53e42df95e5e
reviewAssessment: 853d2af9-dd07-4dd9-aa8f-618d2509f6fa
feedbackDelta: 50e21ac9-a17a-4e00-bc03-7a47e47ab20e
observationGroup: ccb34e20-9e25-4d0f-99bc-0fefeee3340d
reflectionRecord: b505f0a1-e06a-4208-a267-188e06b3796e
```

KRN activation assembled 6 inclusions and 5 exclusions. The useful signal was
mostly governance/source caution; owner-file selection still came from source
inspection.

### Existing target module readout

`packages/workers` was already connected during C-00 and was reused:

```txt
Project ID: 421474cb-d7f5-455e-93ce-5200eb617a4b (reused)
Repo installation ID: 4d0adb42-15b6-4cfe-957c-ffbccdf2bfbf (reused)
ProjectKernel ID: 5a70db86-2744-4c9a-a27a-bda7455f004a (reused)
```

Output now shows:

```txt
Command detection:
- scripts: test, typecheck

Source seed:
- package.json | kind=package_manifest | reason=detect package identity and scripts
- tsconfig.json | kind=typescript_config | reason=detect TypeScript boundary settings
- README.md | kind=project_readme | reason=capture project-facing current truth
- src | kind=source_root | reason=seed source owner-file recall
```

Because this project was reused, it is output proof for C-01 but not fresh
metadata creation proof.

### Fresh target module creation

`packages/schema` was connected after C-01 implementation:

```txt
Project ID: 62dc912e-d4f8-4485-a0fa-4d4d854cdcd6 (created)
Repo installation ID: 7518fce1-8e9f-4c77-b42c-4517458f83c9 (created)
ProjectKernel ID: f4ca92f1-7c31-4319-9a0e-9279cedf0e25 (created)
```

DB readback confirmed `sourceSeeds` metadata on Project, RepoInstallation, and
ProjectKernel:

```txt
[
  {"kind":"package_manifest","path":"package.json","reason":"detect package identity and scripts"},
  {"kind":"typescript_config","path":"tsconfig.json","reason":"detect TypeScript boundary settings"},
  {"kind":"source_root","path":"src","reason":"seed source owner-file recall"}
]
```

## Command Evidence

| Command | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `pnpm --filter @krn/cli test -- runCli parseInitArgs` | passed | CLI tests cover init dry-run/connect output and source seed runtime input. | Does not prove live DB metadata persistence. |
| `pnpm --filter @krn/cli typecheck` | passed | CLI public types compile after `SourceSeedProposal` addition. | Does not prove runtime correctness. |
| `krn plan --task ... --persist` | passed | C-01 has a DB-backed execution run and activation evidence. | Does not prove selected context was the owner-file context. |
| `krn init --dry-run --repo packages/workers` | passed | Dry-run output is read-only and renders command detection/source seed proposal. | Does not persist records. |
| `krn init --connect --repo packages/workers --persist` | passed | Reused target project renders source seed and project scope. | Does not prove fresh metadata creation because records were reused. |
| `krn init --dry-run --repo packages/schema` | passed | Fresh target dry-run renders source seed proposal with no files written. | Does not persist records. |
| `krn init --connect --repo packages/schema --persist` | passed | Fresh target project/repo/kernel records were created. | Does not prove activation quality. |
| `psql ... select metadata->'sourceSeeds' ...` | passed | Project, RepoInstallation, and ProjectKernel metadata contain source seed entries for `packages/schema`. | Does not prove source seed is queryable as a first-class read model. |
| `pnpm db:smoke:init-connect` | passed | Existing init-connect smoke still passes with cleanup. | Does not cover the new source seed metadata path directly. |
| `krn evidence capture --run-id 886afb4d-... --persist` | passed | Evidence captured intended files and operator-reported command proof. | Does not execute shell commands itself. |
| `krn observe --run 886afb4d-... --persist` | passed | ObservationGroup persisted with no Memory Core mutation. | Does not prove observation usefulness. |
| `krn reflect --scope run:886afb4d-... --persist` | passed | ReflectionRecord persisted with no candidate rows and no Memory Core mutation. | Does not prove reflection extraction quality. |

## Dogfood Brain Usefulness Section

### Brain Usefulness Summary

Brain ROI:
- positive

Overall verdict:
- KRN helped more than in C-00 because DB-backed activation assembled relevant
  governance context and anti-memory exclusions, while the implementation
  remained bounded by the C-01 task.

What this run proves:
- init/connect output is more honest and reviewable;
- fresh target records can carry source seed metadata without new schema;
- no target files are written by dry-run/connect;
- the path remains DB-backed and project-scoped.

What this run does not prove:
- source seed improves activation yet;
- target repo onboarding is product-polished;
- source seed should remain metadata forever;
- external customer repo readiness.

DB used in current shell:
- yes

### Activated Context Usefulness

| Item | Type | Why selected | Used? | Helped? | Missing/Stale/Noise? | Evidence | Follow-up |
| --- | --- | --- | --- | --- | --- | --- | --- |
| weak command evidence claim | source | Evidence output must remain honest. | yes | helped | none | plan run `886afb4d-07e3-4fff-8aa8-43522b0c86d6` | keep |
| AGENTS compact guidance claim | source | Init/connect must not write runtime markdown memory. | yes | helped | none | plan run `886afb4d-07e3-4fff-8aa8-43522b0c86d6` | keep |
| anti-memory exclusion for old audit slice | anti-memory | Blocks stale audit-governance context. | yes | helped | none | exclusions in plan run `886afb4d-07e3-4fff-8aa8-43522b0c86d6` | keep |
| owner file `runInitCommand.ts` | raw/source | Owning CLI implementation file. | yes | helped | missing from activation | source inspection | raw recall / activation |

### Missing Context

| Missing item | Expected source | Why it mattered | Evidence | Repair implication |
| --- | --- | --- | --- | --- |
| `packages/cli/src/runInitCommand.ts` | raw recall | Main implementation owner. | Manual source inspection required. | improve activation only if repeated |
| `packages/cli/src/runCli.test.ts` | raw recall | Existing init/connect behavior tests. | Manual source inspection required. | improve activation only if repeated |

### Evidence And Review Burden

| Evidence item | Strength | What it proves | What it does not prove | Review burden impact |
| --- | --- | --- | --- | --- |
| CLI tests | strong | Output and runtime input behavior are covered. | Live DB persistence. | reduced |
| DB readback | strong | Source seed metadata was persisted for fresh target records. | First-class source seed query behavior. | reduced |
| init-connect smoke | strong | Existing smoke still passes with cleanup. | New metadata path directly. | unchanged |
| KRN plan | mixed | Governance context and exclusions work. | Owner-file recall. | unchanged |

### Observation And Reflection Usefulness

| Observation/Reflection | Output | Useful? | Evidence refs | Follow-up |
| --- | --- | --- | --- | --- |
| Observation group `ccb34e20-9e25-4d0f-99bc-0fefeee3340d` | 5 items | ledger-only | current-shell observe output | keep as evidence |
| Reflection record `b505f0a1-e06a-4208-a267-188e06b3796e` | empty | ledger-only | current-shell reflect output | no reflection repair from this single run |

### Candidate Quality

No candidate was promoted. Any generic "review changed files" proposal should
remain rejected or deferred unless a later run gives it concrete future use.

### Brain ROI

| Dimension | Verdict | Evidence |
| --- | --- | --- |
| Context waste | lower | anti-memory excluded stale audit context |
| Review burden | lower | source seed and command detection are visible in output |
| Resume quality | better | report records fresh project and DB readback |
| Decision grounding | better | no schema/migration added for unstable metadata |
| Memory usefulness | mixed | selected memory was mostly governance context |
| Operator friction | lower | output now says what was detected and seeded |

## Product Readiness Signal

Verdict:

```txt
target init/connect is closer to internal-alpha, but not complete.
```

Remaining blockers:

- source seed is metadata, not a first-class read model;
- activation still does not reliably surface owner files;
- C-02 must prove evidence -> candidate -> reviewed state -> later activation.

## Next Recommended Action

Continue to:

```txt
C-02 — End-To-End Governed Product Path
```

C-02 should use C-00/C-01 evidence and avoid forcing promotion if the candidate
is not reviewable.
