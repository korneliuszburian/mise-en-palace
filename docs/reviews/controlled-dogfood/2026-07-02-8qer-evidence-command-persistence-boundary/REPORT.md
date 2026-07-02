# 8QER Evidence Command Persistence Boundary Report

Status: source-to-decision verification; no source repair required.

Date: 2026-07-02

## Executive Verdict

The audit finding is stale against current source. Evidence command normalization
is enforced before DB persistence through the current repository path:

```txt
createEvidenceBundle
-> validateEvidenceBundleInputForPersistence
-> parseEvidenceCaptureInput
-> normalizeEvidenceCommand
-> evidenceCommandsForPersistence
-> JSONB insert
```

DB readback also re-normalizes unknown command rows in `mapEvidenceBundle`.
No DB schema, CLI behavior, provenance redesign, metadata taxonomy, or
review-domain change is needed for this slice.

## Source-To-Decision

```txt
source: packages/db/src/repositories/DrizzleHarnessRunRepository.ts,
  packages/db/src/repositories/mappers.ts,
  packages/schema/src/evidenceCapture.ts,
  packages/core/src/evidenceBundle.ts,
  packages/db/src/repositories/DrizzleHarnessRunRepository.test.ts
mechanism: schema parsing delegates command proof normalization to core; DB
  createEvidenceBundle validates through that schema and persists commands
  through evidenceCommandsForPersistence; mapper readback narrows unknown DB JSON
  and calls normalizeEvidenceCommand again.
KRN implication: raw weak/default command rows cannot persist through the public
  HarnessRunRepository createEvidenceBundle path as strong passed proof.
decision: reject new code repair; keep existing tests and record this as a
  verified stale audit item.
consumer: evidence DB persistence boundary, evidence/readback review, audit task
  graph.
falsifier: createEvidenceBundle stops calling evidenceCommandsForPersistence,
  schema parser stops delegating to normalizeEvidenceCommand, or the DB test
  "does not persist weak default rows as passed command proof" fails.
```

## KRN Plan Used

```txt
executionRun: 04a52f46-51f3-4a67-b885-a303a290ee7f
taskContract: 47de941e-def0-4bb1-b232-99ef02ee8463
contextAssembly: 7eebf270-4a7e-49e7-9652-3cbf7936137b
retainedPattern: evidence-proof-non-proof-boundary
```

Activation was partially useful: it selected the proof/non-proof pattern, but
owner-file recall pointed at plan/run activation files rather than the DB
repository owner. Source inspection found the exact owner files.

## Verification

| Command | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `pnpm --filter @krn/db test -- DrizzleHarnessRunRepository` | passed | DB repository tests cover persistence-boundary command normalization and weak default downgrade. | Does not prove every direct SQL writer is safe. |
| `pnpm --filter @krn/schema test -- index` | passed | Schema parser delegates command validation/normalization and rejects malformed evidence inputs. | Does not prove DB insert path alone. |
| `pnpm --filter @krn/core test -- evidenceBundle` | passed | Core command normalizer keeps proof/non-proof behavior for command kinds. | Does not prove persistence. |
| `pnpm db:ready` | passed | Local DB is reachable with migrations and pgvector. | Does not prove this slice wrote new rows. |
| `pnpm typecheck` | passed | Workspace types still compile. | Does not prove behavior. |
| `TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | Full workspace tests pass. | Does not prove product readiness. |
| `pnpm quality:fallow:ci` | passed | Fallow changed-file gate found no issues; there were no code changes. | Does not prove broad code health. |
| `pnpm --filter @krn/harness test -- activePlanInvariants` | passed | Compact root plan remains structurally valid after moving active task to `t8i`. | Does not prove future plan edits. |
| `git diff --check` | passed | Diff has no whitespace errors after report/root-state edits. | Does not prove behavior. |
| `krn evidence capture --persist` | passed | EvidenceBundle, ReviewAssessment, and FeedbackDelta rows were written for this run. | Does not prove command execution; command rows are operator-reported. |
| `krn observe --persist` | passed | Five run observations were persisted before reflection. | Does not prove reflection quality. |
| `krn reflect --scope run:<id> --persist` | passed | Reflection selected five observations and wrote one ReflectionRecord with no Memory Core mutation. | Does not prove candidate quality or product readiness. |

Note: one stale `krn reflect --run-id <id> --persist` attempt failed with usage
output because the current CLI uses `--scope run:<id>`.

## Persisted Evidence

```txt
evidenceBundle: f49ae91f-786a-4601-991b-8c1491c20bce
reviewAssessment: 1a6be014-a796-4ec1-a730-7cf1c8daec62
feedbackDelta: 9d23adf3-a7a1-4789-8b8b-8b68386cda84
observationGroup: 17a2f668-9881-426c-ab54-cb8a84f98acb
reflectionRecord: 0f8bd0b0-1802-40be-a621-9d5d70296515
```

## Proof Boundary

This slice proves the current public DB repository evidence path normalizes
commands before persistence and that existing tests protect the weak default
command downgrade.

This slice does not prove:

- no private/direct SQL path can ever write malformed JSONB;
- command provenance semantics are product-perfect;
- evidence metadata taxonomy is complete;
- activation owner-file recall is good for DB repository work;
- product readiness.

## Dogfood Brain Usefulness

| Lane | Verdict | Evidence |
| --- | --- | --- |
| Selected retained pattern | helped | `evidence-proof-non-proof-boundary` matched the task and constrained proof claims. |
| Selected owner files | mixed | Activation selected plan/run owner files, not DB repository owner files. Manual `rg` was still required. |
| Local source evidence | helped | Repository source showed create, schema parse, persistence helper, and readback mapper all delegate to core normalization. |
| Review burden | lower | The audit item is now closed as verified stale, avoiding unnecessary code. |
| Brain ROI | mixed positive | KRN supplied useful proof discipline; exact owner-file recall still missed. |

## Candidates

No MemoryCandidate, AntiMemoryCandidate, or EvalCandidate should be promoted from
this slice. The existing regression tests already cover the useful behavior.

## Second-Opinion Prompt

```md
# Second Opinion: 8QER Evidence Command Persistence Boundary

Review the current repo after commit `<fill-sha>`.

Question:
Was the audit finding "evidence command normalization is not enforced at DB write
time" correctly rejected as stale, or is there still a live persistence path that
can write raw `passed` default-template commands as strong proof?

Required read:
- `packages/db/src/repositories/DrizzleHarnessRunRepository.ts`
- `packages/db/src/repositories/mappers.ts`
- `packages/schema/src/evidenceCapture.ts`
- `packages/core/src/evidenceBundle.ts`
- `packages/db/src/repositories/DrizzleHarnessRunRepository.test.ts`
- `docs/reviews/controlled-dogfood/2026-07-02-8qer-evidence-command-persistence-boundary/REPORT.md`

Check specifically:
- `createEvidenceBundle` insert path;
- `validateEvidenceBundleInputForPersistence`;
- `evidenceCommandsForPersistence`;
- schema command transform;
- mapper readback of unknown DB JSON;
- tests covering weak default downgrade.

Return:
- verdict: correct / partially correct / incorrect
- missed persistence paths, if any
- whether a code fix is needed
- what command evidence supports your verdict
- what your review does not prove
```

## Next Recommended Action

Move to `mise-en-palace-t8i`: internal multi-repo operator loop. That is the
right product-facing validation path after this audit item closed without code
changes.
