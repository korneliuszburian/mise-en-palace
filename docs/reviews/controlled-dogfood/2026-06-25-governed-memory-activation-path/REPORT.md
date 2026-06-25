# Governed Memory Activation Path Report

Status: C-02 completion report.

Date: 2026-06-25

## Executive Verdict

C-02 completed one governed path from C-01 evidence to later activation:

```txt
C-01 evidence/report
  -> SourceClaim
  -> MemoryCandidate
  -> MemoryReviewGate promotion
  -> MemoryRecord
  -> later krn plan activation
  -> MemoryApplication outcome=helped
  -> golden behavior proof commands
```

No direct Memory Core mutation was used. No dashboard, API, MCP, worker runtime,
source crawler, or broad eval platform was added.

## Path IDs

Source:

- SourceArtifact: `536fcf87-693d-4368-bcb3-4660a6e227fc`
- SourceClaim: `0395c917-dac3-4938-b901-c77f93d2e7b9`
- Source report: `docs/reviews/controlled-dogfood/2026-06-25-init-connect-source-seed-hardening/REPORT.md`

Candidate and review:

- MemoryCandidate: `ededd61c-89d5-4bee-b3d2-3f445d81f075`
- MemoryRecord: `c24f8819-66fc-4009-b18f-f033e6b08e9c`
- Evidence reviewed ref: `docs/reviews/controlled-dogfood/2026-06-25-init-connect-source-seed-hardening/REPORT.md`

Later activation and application:

- Later execution run: `17b13857-7787-406a-97c6-c89ea7fc95b9`
- Later task contract: `15c1c488-61fe-4935-b3bc-b2b199e6de39`
- Later context assembly: `31850f32-088a-4fee-ba8c-8bf53fb6748c`
- MemoryApplication: `5adb76a0-eb67-4193-9807-70ecd279adcc`
- Application outcome: `helped`
- Evidence bundle: `9ad5a082-dc42-43a9-95a9-2df95b367a09`
- Review assessment: `89c734a3-ffca-48b8-87bc-c7aafa765720`
- Feedback delta: `eff50f0d-0944-452e-a563-e7a09b0371d9`
- Observation group: `8a845125-5d0c-45f8-8c2b-e293301c44ac`
- Reflection record: `2347c347-2d2d-4439-975d-54104850e549`

## What Was Promoted

Memory summary:

```txt
Target repo init/connect work should preserve explicit command detection,
source seed output, project-scoped boundary text, forbidden surface status,
and Files written: none before project-scoped planning.
```

Application guidance:

```txt
Use when changing krn init dry-run/connect, target repo onboarding, or
project-scoped planning setup; verify output still exposes scripts, source
seeds, project scope, forbidden surfaces, and no target file writes.
```

Invalidation rule:

```txt
Revisit if source seed metadata becomes a first-class read model or if target
repo init/connect starts writing target overlay files.
```

## Review Gate Evidence

The MemoryCandidate carried:

- SourceClaim lineage: `0395c917-dac3-4938-b901-c77f93d2e7b9`
- Candidate evidence provenance: `evidence_bundle`
- Evidence refs:
  - `evidence-bundle:444d1bae-1ac0-4a6e-a97d-53e42df95e5e`
  - `docs/reviews/controlled-dogfood/2026-06-25-init-connect-source-seed-hardening/REPORT.md`
- Does-not-prove:
  - source seed metadata improves activation;
  - external target repo readiness.

Promotion command used `krn memory candidate promote` with explicit
`--evidence-reviewed-ref`. The CLI output reported `Review gate: passed`.

## Later Activation Proof

Later task:

```txt
Review target repo init connect source seed output before changing onboarding behavior
```

The later `krn plan --persist` included both:

```txt
source_claim:0395c917-dac3-4938-b901-c77f93d2e7b9
memory_record:c24f8819-66fc-4009-b18f-f033e6b08e9c
```

The memory expected use in the activation output matched the promoted
application guidance. This is the required C-02 later-activation link.

## Memory Application Proof

`krn memory record apply` recorded:

```txt
memoryApplication: 5adb76a0-eb67-4193-9807-70ecd279adcc
memoryRecord: c24f8819-66fc-4009-b18f-f033e6b08e9c
runId: 17b13857-7787-406a-97c6-c89ea7fc95b9
outcome: helped
Feedback event: none
Follow-up candidate: none
```

Notes:

```txt
Helped: later activation selected the reviewed source-seed memory and it
directly constrained C-02 planning toward preserving command detection, source
seed output, project scope, and no target file writes.
```

## Golden Proof

Existing bounded golden behavior proof commands passed:

```txt
pnpm --filter @krn/harness test -- goldenMemoryBehavior goldenKrnBehaviorGate
pnpm --filter @krn/schema test -- goldenTask
```

This protects the general behavior that source-linked memory can enter context,
stale/unsafe memory is excluded, and GoldenTask cases require behavior proof.
It does not prove this exact DB row will always be selected for every future
target repo task.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `krn source claim add ... --persist` with `support-type supports` | failed as expected | SourceClaim schema rejects unsupported support type vocabulary. | Does not prove source claim creation failed when valid. |
| `krn source claim add ... --support-type mechanism --persist` | passed | C-01 report became a persisted SourceClaim with source-to-decision fields. | Does not prove the claim is generally useful. |
| `krn memory candidate add ... --persist` | passed | A reviewable MemoryCandidate was created from C-01 evidence and SourceClaim lineage. | Does not promote memory. |
| `krn memory candidate promote ... --persist` | passed | MemoryReviewGate promoted the candidate and created MemoryRecord `c24f8819-...`. | Does not prove every candidate should be promoted. |
| `krn plan --task "Review target repo init connect source seed output..." --persist` | passed | Later activation included the promoted MemoryRecord and its SourceClaim. | Does not prove activation relevance at scale. |
| `krn memory record apply ... --outcome helped --persist` | passed | The later run recorded helped feedback for the promoted memory. | Does not prove long-term memory quality. |
| `pnpm --filter @krn/harness test -- goldenMemoryBehavior goldenKrnBehaviorGate` | passed | Existing real behavior gates for memory/activation pass. | Does not prove the exact DB record behavior in CI. |
| `pnpm --filter @krn/schema test -- goldenTask` | passed | GoldenTask fixtures/contracts still validate. | Does not prove product readiness. |
| `pnpm db:ready` | passed | Current-shell DB is reachable with 14/14 migrations and pgvector. | Does not prove hosted/CI DB readiness. |
| `krn evidence capture --run-id 17b13857-... --persist` | passed | Final C-02 report/plan diff and command proof were captured. | Does not run commands itself. |
| `krn observe --run 17b13857-... --persist` | passed | ObservationGroup persisted with no Memory Core mutation. | Does not prove observation usefulness. |
| `krn reflect --scope run:17b13857-... --persist` | passed | ReflectionRecord persisted with no candidate rows and no Memory Core mutation. | Does not prove reflection usefulness. |

## Dogfood Brain Usefulness Section

### Brain Usefulness Summary

Brain ROI:
- strong positive

Overall verdict:
- C-02 is the first compact proof that KRN can turn one run's evidence into a
  reviewed MemoryRecord that helps a later run.

What this run proves:
- governed source-to-memory promotion path works;
- MemoryReviewGate is the public promotion boundary;
- later activation can include newly reviewed memory;
- memory application feedback can record `helped`.

What this run does not prove:
- product readiness;
- repeated usefulness across target repos;
- activation quality at scale;
- reflection extraction quality;
- automatic promotion should exist.

DB used in current shell:
- yes

### Activated Context Usefulness

| Item | Type | Why selected | Used? | Helped? | Missing/Stale/Noise? | Evidence | Follow-up |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `memory_record:c24f8819-66fc-4009-b18f-f033e6b08e9c` | memory | Lexically and semantically matched target init/connect source seed task. | yes | helped | none | plan run `17b13857-7787-406a-97c6-c89ea7fc95b9`; application `5adb76a0-eb67-4193-9807-70ecd279adcc` | keep |
| `source_claim:0395c917-dac3-4938-b901-c77f93d2e7b9` | source | Source lineage for the promoted memory. | yes | helped | none | plan run `17b13857-7787-406a-97c6-c89ea7fc95b9` | keep |
| old `krn audit` memory/source | anti-memory exclusion | Unsafe stale context. | no | helped by exclusion | stale blocked | activation exclusions | keep |

### Evidence And Review Burden

| Evidence item | Strength | What it proves | What it does not prove | Review burden impact |
| --- | --- | --- | --- | --- |
| SourceClaim add | strong | source-to-decision fields persisted | general usefulness | reduced |
| MemoryCandidate add | strong | candidate has lineage, guidance, evidence refs | should be promoted | reduced |
| MemoryReviewGate promotion | strong | reviewed promotion path works | all promotions are good | reduced |
| Later activation | strong | promoted memory selected in later run | activation quality at scale | reduced |
| MemoryApplication helped | strong | application feedback recorded | long-term value | reduced |
| Golden tests | medium | existing behavior gates pass | exact DB row regression | unchanged |

### Candidate Quality

| Candidate | Type | Evidence refs | Reviewability | Decision | Follow-up |
| --- | --- | --- | --- | --- | --- |
| `ededd61c-89d5-4bee-b3d2-3f445d81f075` | MemoryCandidate | C-01 report, evidence bundle, source claim | ready | promoted | monitor future applications |

### Brain ROI

| Dimension | Verdict | Evidence |
| --- | --- | --- |
| Context waste | lower | later plan selected the exact promoted memory/source |
| Review burden | lower | reviewer sees source claim, candidate, promotion, application IDs |
| Resume quality | better | full path IDs are recorded |
| Decision grounding | better | memory has source lineage and does-not-prove caveats |
| Memory usefulness | better | outcome `helped` recorded |
| Operator friction | lower | no source/code change was required to prove the path |

## Product Readiness Signal

Verdict:

```txt
dogfood-to-internal-alpha bridge proven for one memory path.
```

Still not product-ready because:

- only one newly promoted memory path is proven;
- no external target repo repeated trial exists;
- golden proof is general memory behavior, not exact DB replay in CI;
- reflection still did not create the candidate automatically.

## Next Recommended Action

Continue to:

```txt
C-03 — Codex Brief And Execution Contract Hardening
```

C-03 should use the C-02 proof to ensure Codex briefs show reviewed memory,
source lineage, evidence expectations, rollback, and does-not-prove boundaries
without prompt bloat.
