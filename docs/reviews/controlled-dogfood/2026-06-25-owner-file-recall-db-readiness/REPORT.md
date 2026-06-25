# DB-Backed Owner-File Recall Dogfood

Status: A-01 report.

Date: 2026-06-25

## Executive Verdict

KRN completed a DB-backed dogfood source repair, but activation did not select
the owner files for the task. The run is useful because it narrows the problem:
activation selected governance/source-graph guardrails, while source inspection
found the actual owner file and test owner manually. This opens A-02 as a
bounded owner-file/raw-recall read-model repair, not a broad activation scoring
rewrite.

## Task

Objective:

```txt
Improve DB readiness reporting so DB-backed dogfood reports can identify the checked Postgres endpoint without exposing secrets, while preserving existing readiness behavior and keeping the source repair minimal.
```

Persisted run:

```txt
executionRun: 1d22a22a-e48f-4327-a8e8-657146394fc8
taskContract: f183a1f2-1fbc-49db-8abf-6c2f0e7979fe
contextAssembly: c25c11d9-b0d0-4313-9b97-6d9c42b0d7d1
evidenceBundle: f3e42ea7-24a6-4e60-8111-9c9d48cdd855
observationGroup: f528e758-eb08-4884-b773-d73563a71c2b
reflectionRecord: e1181fd6-9df7-43f6-ad4d-c59f54cdddb7
```

## Source Repair

| Area | Change | Why final-pattern | What was not changed |
| --- | --- | --- | --- |
| DB readiness CLI output | Added `Postgres endpoint: postgres://localhost:54329/krn` style output with credentials, query, and hash stripped. | Dogfood reports can cite the checked endpoint without leaking secrets. | No readiness semantics changed. |
| CLI helper | Added `redactedPostgresEndpoint`. | Keeps redaction deterministic and locally testable without live DB. | No broad URL policy or config subsystem. |
| Tests | Added helper tests for credential/query/hash redaction and invalid URL handling. | Protects the security-relevant behavior without network dependency. | No snapshot-only or real-DB unit test. |

Changed files:

```txt
packages/cli/src/runDbReadinessCommand.ts
packages/cli/src/runDbReadinessCommand.test.ts
```

## Owner-File Recall Result

Expected owner files after source inspection:

```txt
packages/cli/src/runDbReadinessCommand.ts
packages/cli/src/runDbReadinessCommand.test.ts
```

Activation selected zero owner files. It selected source/memory guardrails
about evidence provenance, source graph storage, and source claim persistence.
Those were relevant to KRN governance, but they did not reduce the source
inspection cost for this concrete CLI output repair.

Verdict:

```txt
owner-file recall: missed
guardrail recall: mixed/useful
repair implication: A-02 owner-file/raw-recall read model repair
```

This is the second DB-backed source-repair pattern where activation helped with
guardrails but did not surface the direct implementation owner. The earlier
RCR-00 report found that the candidate reviewability report and reflection
candidate writer owner had to be found manually.

## KRN Plan Output Summary

DB-backed plan command:

```sh
rtk env KRN_DATABASE_URL=<local Postgres URL> pnpm --filter @krn/cli krn plan --task "Improve DB readiness reporting so DB-backed dogfood reports can identify the checked Postgres endpoint without exposing secrets, while preserving existing readiness behavior and keeping the source repair minimal" --persist
```

Selected context:

| Item | Type | Used? | Helped? | Notes |
| --- | --- | --- | --- | --- |
| `source_claim:f0b5c9ee-01aa-41df-9268-7df3f7437068` | source | yes | helped | Reinforced explicit intended files and command evidence. |
| `source_claim:58e28e58-d4c8-4196-861e-cb14caeb08e1` | source | yes | helped | Reinforced weak-vs-operator command proof boundary. |
| `source_claim:d5ea7024-7d7a-4291-a050-4de1fbebf605` | source | unclear | neutral/noise | Source graph health was not material to this CLI output repair. |
| `memory_record:7dda35fd-b89d-4bd4-94bd-7937022d99e7` | memory | no | noise | Separate graph database/crawler guidance was not needed. |
| `source_claim:3b5540bc-2307-4578-9abb-5bee0805bbdd` | source | no | noise | Source claim add persistence was unrelated. |
| `source_claim:212815bc-477c-4985-8992-31825f5c5897` | source | no | noise | Source graph storage guidance was unrelated. |

Excluded context:

| Item | Type | Notes |
| --- | --- | --- |
| `memory_record:41d1a2ef-3578-4e45-947f-42c6739796de` | memory | Excluded over budget; may have been more useful because it concerns explicit intended files and verification evidence. |
| `memory_record:f950b8b4-5392-4084-9f98-93881fbe961a` | memory | Excluded over budget; likely general Memory Core write-authority guardrail. |
| `source_claim:479b1ce8-9904-42ab-a8d1-393a2bacf685` | source | Excluded over budget. |
| `source_claim:302f88f7-71b0-4a86-8521-330dee4713fe` | source | Excluded over budget; reflection-quality caveat was not needed for the owner-file repair. |

## Verification

| Command | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `rtk pnpm db:ready` | passed | Current-shell Postgres was reachable, 13/13 migrations applied, pgvector available, and output includes a redacted endpoint. | Does not prove production DB or activation quality. |
| `rtk pnpm --filter @krn/cli test -- runDbReadinessCommand runCli` | passed | CLI DB readiness helper and related CLI tests pass. | Does not prove every CLI command. |
| `rtk proxy pnpm typecheck` | passed | Workspace TypeScript checks pass with raw exit code 0. | Does not prove runtime behavior. |
| `rtk pnpm test` | passed | Workspace test suite passes. | Does not prove product readiness or memory usefulness. |
| `rtk pnpm --filter @krn/db db:check` | passed | Drizzle schema check is clean. | Does not prove live DB data semantics. |
| `rtk git diff --check` | passed | Diff has no whitespace errors. | Does not prove correctness. |
| `rtk psql ... count readback` | passed | DB contains one evidence bundle, review assessment, feedback delta, observation group, five observation items, and one reflection record for this run. | Does not prove reflection quality. |

DB readiness output includes:

```txt
Postgres endpoint: postgres://localhost:54329/krn
Brain store readiness: ready
```

## Evidence / Observation / Reflection

- Evidence captured: yes, `f3e42ea7-24a6-4e60-8111-9c9d48cdd855`.
- Review assessment created: yes, `764336a2-ee64-48ed-83c9-c93ba46636f5`.
- Feedback delta created: yes, `d83e5a2d-22c6-4965-a733-58d096b89c63`.
- Observation created: yes, `f528e758-eb08-4884-b773-d73563a71c2b`.
- Reflection created: yes, `e1181fd6-9df7-43f6-ad4d-c59f54cdddb7`.
- Candidate rows written: no.
- Memory mutation: none.
- MemoryRecord created: no.

DB readback:

```txt
execution_run                              evidence_bundles  review_assessments  feedback_deltas  observation_groups  observation_items  reflection_records
1d22a22a-e48f-4327-a8e8-657146394fc8      1                 1                   1                1                   5                  1
```

## Dogfood Brain Usefulness Section

### Brain Usefulness Summary

Brain ROI:
- mixed

Overall verdict:
- KRN was useful as a DB-backed governed workflow and evidence loop, but weak
  at owner-file recall for this concrete source repair.

What this run proves:
- DB-backed plan/evidence/observe/reflect can support a small source repair.
- Evidence capture can classify intended files and command proof for the run.
- DB readiness output can reveal checked endpoint identity without credentials.
- Activation can select governance guardrails.
- Activation did not select direct owner files for this task.

What this run does not prove:
- Product readiness.
- General activation scoring quality.
- Reflection extraction quality.
- Target-repo usefulness.
- That all DB URLs are safe to display beyond the implemented redacted endpoint
  format.

DB used in current shell:
- yes

### Activated Context Usefulness

| Item | Type | Why selected | Used? | Helped? | Missing/Stale/Noise? | Evidence | Follow-up |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `source_claim:f0b5c9ee-01aa-41df-9268-7df3f7437068` | source | Evidence provenance guardrail. | yes | helped | none | KRN plan output; evidence capture command. | keep |
| `source_claim:58e28e58-d4c8-4196-861e-cb14caeb08e1` | source | Weak command proof guardrail. | yes | helped | none | KRN plan output; command proof table. | keep |
| `source_claim:d5ea7024-7d7a-4291-a050-4de1fbebf605` | source | Source graph health. | unclear | neutral | possible noise | KRN plan output. | gather more evidence |
| `memory_record:7dda35fd-b89d-4bd4-94bd-7937022d99e7` | memory | Avoid separate graph DB/crawler. | no | noise | noise | KRN plan output. | improve activation |
| `source_claim:3b5540bc-2307-4578-9abb-5bee0805bbdd` | source | Source claim persistence. | no | noise | noise | KRN plan output. | improve activation |
| `source_claim:212815bc-477c-4985-8992-31825f5c5897` | source | Postgres-backed source graph. | no | noise | noise | KRN plan output. | improve activation |

### Missing Context

| Missing item | Expected source | Why it mattered | Evidence | Repair implication |
| --- | --- | --- | --- | --- |
| `packages/cli/src/runDbReadinessCommand.ts` | raw recall / owner file | It owned the command output being changed. | `rg "KRN DB Readiness"` found the owner file after KRN plan. | raw recall / owner-file read model |
| `packages/cli/src/runDbReadinessCommand.test.ts` | raw recall / owner test | It now protects credential redaction behavior. | Source repair required a new focused test adjacent to owner file. | raw recall / owner-file read model |
| `packages/cli/src/runCli.test.ts` | existing CLI behavior test | It contained existing DB readiness command assertions. | Source inspection found current DB readiness coverage here. | raw recall / owner-file read model |

### Memory Usefulness

| Memory/Candidate | Selected? | Used? | Outcome | Evidence provenance | Reviewability | Follow-up |
| --- | --- | --- | --- | --- | --- | --- |
| `memory_record:7dda35fd-b89d-4bd4-94bd-7937022d99e7` | yes | no | noise | DB-backed KRN plan output | unknown | improve activation |
| Evidence intended-files memory excluded over budget | no | yes conceptually | helped if manually applied | KRN plan exclusion plus evidence capture behavior | unknown | strengthen or improve ranking |

### Source Grounding Usefulness

| Source/Claim | Supported decision? | Prevented overclaim? | Decorative/noise? | Missing conflict? | Evidence | Follow-up |
| --- | --- | --- | --- | --- | --- | --- |
| `source_claim:f0b5c9ee-01aa-41df-9268-7df3f7437068` | yes | yes | no | no | KRN plan output | keep |
| `source_claim:58e28e58-d4c8-4196-861e-cb14caeb08e1` | yes | yes | no | no | KRN plan output | keep |
| Source graph/source claim selected claims | no | no | yes | no | KRN plan output | improve activation |

### Evidence And Review Burden

| Evidence item | Strength | What it proves | What it does not prove | Review burden impact |
| --- | --- | --- | --- | --- |
| DB-backed plan | strong | Run was persisted and activation selected context. | Does not prove selected context was useful. | reduced |
| Source diff | strong | DB readiness output now includes redacted endpoint. | Does not prove every URL form is meaningful. | reduced |
| Command proof | strong | Commands were operator-reported with explicit provenance. | Does not prove product value. | reduced |
| DB readback | strong | Evidence/review/feedback/observe/reflect rows exist for the run. | Does not prove reflection quality. | reduced |

### Observation And Reflection Usefulness

| Observation/Reflection | Output | Useful? | Evidence refs | Follow-up |
| --- | --- | --- | --- | --- |
| Observation group `f528e758-eb08-4884-b773-d73563a71c2b` | 5 items | ledger-only/useful evidence staging | observe output, DB readback | keep |
| Reflection record `e1181fd6-9df7-43f6-ad4d-c59f54cdddb7` | 0 findings, 0 gaps, 0 contradictions | correctly empty or weak | reflect output | gather more evidence |

### Candidate Quality

| Candidate | Type | Evidence refs | Reviewability | Decision | Follow-up |
| --- | --- | --- | --- | --- | --- |
| Review changed files for reusable memory | MemoryCandidate proposal in FeedbackDelta output | Evidence capture output | too vague | reject/defer | Current feedback candidate remains intentionally not persisted as MemoryCandidate row. |
| Activation should surface owner files or raw recall targets for command-specific source repairs. | MemoryCandidate / EvalCandidate | This report; RCR-00 report | ready | review | Use as input to A-02. |
| Do not treat guardrail context as sufficient owner-file recall. | AntiMemoryCandidate | This report; selected context table | ready | review | Use as input to A-02. |

### Brain ROI

| Dimension | Verdict | Evidence |
| --- | --- | --- |
| Context waste | higher | 3 selected items were noise for this source repair. |
| Review burden | lower | Evidence and DB readback were strong; output redaction reduces future DB report ambiguity. |
| Resume quality | better | Run IDs and report preserve the exact state. |
| Decision grounding | mixed | Guardrails helped evidence discipline; owner files were missing. |
| Memory usefulness | weak | Selected memory was not used. |
| Operator friction | mixed | DB-backed flow worked, but owner files still required manual `rg`. |

## Product Readiness Signal

This run does not move KRN to product-ready. It strengthens dogfood readiness and
gives concrete evidence for A-02: activation should expose owner-file/raw-recall
candidates with typed inclusion or exclusion reasons.

## Next Recommended Action

Proceed to A-02:

```txt
Activation Owner-File / Raw-Recall Read Model Repair
```

Do not start with a scoring rewrite. The evidence points first to missing
owner-file/raw-recall surfacing and explainability.
