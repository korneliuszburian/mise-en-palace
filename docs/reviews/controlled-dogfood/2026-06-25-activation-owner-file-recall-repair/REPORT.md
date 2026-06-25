# Activation Owner-File Recall Repair Dogfood

Status: A-02 report.

Date: 2026-06-25

## Executive Verdict

A-02 repaired the specific owner-file recall gap shown by A-01 without a broad
activation scoring rewrite. The repair adds a small typed owner-file recall
read model that emits owner-file candidates through the existing activation
candidate path. DB-backed `krn plan --persist` now surfaces owner files for a
DB readiness source repair with inclusion reasons.

## Task

Objective:

```txt
Add the smallest typed read model or retrieval cue that helps activation surface owner files/raw recall targets for source repairs.
```

Persisted proving run:

```txt
executionRun: 5611bfde-7d5f-4f35-8332-1e407889dc85
taskContract: 73c0d745-b2f8-40c8-ab86-fb8b6ba8c503
contextAssembly: 1a2bd76d-a984-4f65-a834-295e37da9aea
evidenceBundle: c3afc052-fbec-44cc-a81d-9217491aeb54
observationGroup: 5cb31110-6f47-4d43-9944-7ace067ec60f
reflectionRecord: cd08f447-5266-40d1-a759-294476feae69
```

Earlier failed persisted plan attempts exposed a real DB constraint issue:
synthetic owner-file candidates cannot use arbitrary string `subjectId` values,
because persisted retrieval candidates require UUID subject IDs. The final
implementation uses stable UUID subject IDs and keeps file paths in reason and
metadata.

## Source Repair

| Area | Change | Why final-pattern | What was not changed |
| --- | --- | --- | --- |
| Activation read model | Added `ownerFileRecall` catalog and matcher. | Provides typed owner-file candidates without crawler scope. | No scoring rewrite, no source crawler. |
| Candidate shape | Emits `kind: search`, `subjectType: search_document`, stable UUID `subjectId`, and `metadata.ownerFilePath`. | Reuses existing activation/search path and DB persistence shape. | Does not create fake `searchDocumentId` rows. |
| Activation retrieval | Merges owner-file candidates with memory/source/search candidates before existing filters and ROI selection. | Owner files participate in existing inclusion/exclusion trace. | No new ranking algorithm. |
| Tests | Added owner-file unit tests and compiler integration test. | Guards DB readiness owner-file recall and prevents weak generic readiness matches. | No broad eval platform. |

Changed files:

```txt
packages/harness/src/activation/ownerFileRecall.ts
packages/harness/src/activation/ownerFileRecall.test.ts
packages/harness/src/activation/activationEngine.ts
packages/harness/src/activation/index.ts
packages/harness/src/compiler/index.test.ts
```

## DB-Backed Plan Proof

Command:

```sh
rtk env KRN_DATABASE_URL=<local Postgres URL> pnpm --filter @krn/cli krn plan --task "Improve DB readiness reporting for checked Postgres endpoint output without exposing secrets" --persist
```

Owner-file inclusions:

```txt
search_document:11111111-1111-4111-8111-111111111001
reason=Owner-file recall: packages/cli/src/runDbReadinessCommand.ts
expected_use=Inspect packages/cli/src/runDbReadinessCommand.ts when the task touches db readiness cli command owner.

search_document:11111111-1111-4111-8111-111111111002
reason=Owner-file recall: packages/cli/src/runDbReadinessCommand.test.ts
expected_use=Inspect packages/cli/src/runDbReadinessCommand.test.ts when the task touches db readiness cli command test owner.
```

Verdict:

```txt
owner-file recall: repaired for the A-01 DB readiness case
guardrail recall: still present
scoring rewrite: not justified by this slice
```

## Verification

| Command | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `rtk pnpm --filter @krn/harness test -- ownerFileRecall index` | passed | Owner-file candidates and compiler integration behavior are covered. | Does not prove every future owner file. |
| `rtk env KRN_DATABASE_URL=<local Postgres URL> pnpm --filter @krn/cli krn plan --task ... --persist` | passed | DB-backed plan persists owner-file activation candidates and renders owner-file inclusions. | Does not prove target-repo activation quality. |
| `rtk proxy pnpm typecheck` | passed | Workspace TypeScript checks pass. | Does not prove runtime usefulness. |
| `rtk pnpm test` | passed | Workspace tests pass. | Does not prove product readiness. |
| `rtk pnpm db:ready` | passed | Current-shell Postgres readiness is green. | Does not prove hosted/CI DB state. |
| `rtk git diff --check` | passed | Diff has no whitespace errors. | Does not prove correctness. |
| `rtk psql ... count readback` | passed | DB contains one evidence bundle, review assessment, feedback delta, observation group, five observation items, and two reflection records for the proving run. | Does not prove reflection quality. |

DB readback:

```txt
execution_run                              evidence_bundles  review_assessments  feedback_deltas  observation_groups  observation_items  reflection_records
5611bfde-7d5f-4f35-8332-1e407889dc85      1                 1                   1                1                   5                  2
```

## Evidence / Observation / Reflection

- Evidence captured: yes, `c3afc052-fbec-44cc-a81d-9217491aeb54`.
- Review assessment created: yes, `d5d002f5-13dd-4f47-aef8-9ee232f32060`.
- Feedback delta created: yes, `54c979e9-f1d9-425d-a3b6-cc7c0c6d9228`.
- Observation created: yes, `5cb31110-6f47-4d43-9944-7ace067ec60f`.
- Reflection created: yes, final useful record `cd08f447-5266-40d1-a759-294476feae69`.
- Reflection caveat: an earlier parallel reflect raced ahead of observe and selected 0 observations; the sequential reflect selected 5 observations.
- Candidate rows written: no.
- Memory mutation: none.
- MemoryRecord created: no.

## Dogfood Brain Usefulness Section

### Brain Usefulness Summary

Brain ROI:
- positive

Overall verdict:
- KRN helped by preserving A-01 evidence, enforcing DB-backed proof, and proving
  the repaired owner-file recall path in the current shell.

What this run proves:
- Owner-file recall can surface file paths through activation output.
- The repair persists through DB-backed plan/evidence/observe/reflect.
- Existing activation scoring/filtering can include owner-file candidates
  without a scoring rewrite.

What this run does not prove:
- Broad owner-file recall coverage.
- Target-repo usefulness.
- Temporal knowledge quality.
- Reflection extraction quality.

DB used in current shell:
- yes

### Activated Context Usefulness

| Item | Type | Why selected | Used? | Helped? | Missing/Stale/Noise? | Evidence | Follow-up |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `search_document:11111111-1111-4111-8111-111111111001` | raw recall / owner file | DB readiness command owner. | yes | helped | none | DB-backed plan output. | keep |
| `search_document:11111111-1111-4111-8111-111111111002` | raw recall / owner test | DB readiness command test owner. | yes | helped | none | DB-backed plan output. | keep |
| Evidence provenance source claims | source | Command proof guardrails. | yes | helped | none | DB-backed plan output. | keep |
| Other selected guardrails | memory/source | Governance context. | unclear | neutral | possible noise | DB-backed plan output. | gather more evidence |

### Missing Context

| Missing item | Expected source | Why it mattered | Evidence | Repair implication |
| --- | --- | --- | --- | --- |
| Broader package owner map | owner-file read model | Current catalog is intentionally small. | This slice only covers selected KRN owner surfaces. | Expand only from future misses. |

### Memory Usefulness

| Memory/Candidate | Selected? | Used? | Outcome | Evidence provenance | Reviewability | Follow-up |
| --- | --- | --- | --- | --- | --- | --- |
| MemoryReviewGate write authority memory | yes | no/unclear | neutral | DB-backed plan output | unknown | keep |
| Owner-file recall invariant | no | yes | helped | A-01 and A-02 reports | ready | review |

### Source Grounding Usefulness

| Source/Claim | Supported decision? | Prevented overclaim? | Decorative/noise? | Missing conflict? | Evidence | Follow-up |
| --- | --- | --- | --- | --- | --- | --- |
| A-01 report | yes | yes | no | no | `docs/reviews/controlled-dogfood/2026-06-25-owner-file-recall-db-readiness/REPORT.md` | keep |
| Activation-engine skill | yes | yes | no | no | Skill instructions used for no scoring rewrite boundary. | keep |

### Evidence And Review Burden

| Evidence item | Strength | What it proves | What it does not prove | Review burden impact |
| --- | --- | --- | --- | --- |
| DB-backed plan output | strong | Owner files are included in activation output. | Does not prove broad recall. | reduced |
| Focused harness tests | strong | Owner-file matching and compiler integration are protected. | Does not prove DB persistence alone. | reduced |
| Failed persisted attempts | useful negative evidence | Synthetic string subject IDs do not fit DB retrieval schema. | Does not imply schema should change. | reduced |

### Observation And Reflection Usefulness

| Observation/Reflection | Output | Useful? | Evidence refs | Follow-up |
| --- | --- | --- | --- | --- |
| Observation group `5cb31110-6f47-4d43-9944-7ace067ec60f` | 5 items | useful evidence staging | observe output | keep |
| Reflection record `bd5d1eee-1b7f-42a9-9238-025817607506` | 0 selected observations | noise/race artifact | parallel reflect output | do not run observe/reflect in parallel |
| Reflection record `cd08f447-5266-40d1-a759-294476feae69` | 5 selected observations | ledger-only/useful proof | sequential reflect output | keep |

### Candidate Quality

| Candidate | Type | Evidence refs | Reviewability | Decision | Follow-up |
| --- | --- | --- | --- | --- | --- |
| Owner-file recall should use stable persisted subject IDs and file paths in metadata/reasons. | MemoryCandidate | A-02 source diff, failed DB attempts, DB-backed plan success. | ready | review | Keep if more owner-file catalog entries are added. |
| Do not use arbitrary path strings as persisted retrieval `subjectId`. | AntiMemoryCandidate | Failed DB-backed plan attempts. | ready | review | Keep as persistence-shape boundary. |
| Do not run observe and reflect in parallel when reflect depends on fresh observations. | AntiMemoryCandidate | First A-02 reflect selected 0 observations; sequential reflect selected 5. | ready | review | Keep as operator workflow rule. |

### Brain ROI

| Dimension | Verdict | Evidence |
| --- | --- | --- |
| Context waste | lower | Owner files entered the top six inclusions. |
| Review burden | lower | Operator no longer needs manual `rg` for the DB readiness owner case. |
| Resume quality | better | Run IDs, evidence, and report preserve the proof. |
| Decision grounding | better | A-01 evidence directly caused A-02. |
| Memory usefulness | mixed | Existing memory was neutral; new candidate is useful. |
| Operator friction | lower | DB-backed plan now names owner files in output reasons. |

## Product Readiness Signal

A-02 strengthens dogfood readiness. It does not prove internal-alpha or product
readiness, because the owner-file catalog is deliberately small and KRN has not
yet been tested on a target repo task.

## Next Recommended Action

Proceed to B-00:

```txt
Temporal Claim Graph ADR
```

Reason: Phase A DB-backed activation stabilization now has a bounded owner-file
recall repair. The next roadmap item is the temporal knowledge design gate.
