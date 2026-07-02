# tsa4 Evidence Metadata Readback Typing

Date: 2026-07-02

Issue: `mise-en-palace-tsa4`

Commit: this commit; final SHA is recorded in the session summary.

## Goal

Inspect the current `EvidenceBundle.metadata` typing gap and apply the smallest
safe known-field boundary without changing DB JSON storage, CLI behavior, command
provenance, review-domain types, or metadata taxonomy.

## Source To Decision

Source:

- current repo source: `packages/core/src/evidenceBundle.ts`;
- current tests: `packages/core/src/evidenceBundle.test.ts`;
- audit finding: `EvidenceBundle.metadata` was a bare `Record<string, unknown>`;
- local evidence: `parseEvidenceBundleMetadataReadback` already validates known
  readback fields defensively.

Mechanism:

- DB/JSON metadata remains untrusted, so typing known fields as `string` or
  `string[]` at the `EvidenceBundle` boundary would overclaim validation.
- The safe improvement is to name the known metadata keys while keeping their
  values `unknown` until `parseEvidenceBundleMetadataReadback` validates them.

KRN implication:

- KRN can improve evidence-domain readability and type locality without
  pretending the persistence boundary is validated.

Decision:

- Add `EvidenceBundleMetadata extends Record<string, unknown>` with known
  `diffSummary`, `sourceRefs`, and `targetEvidence` fields typed as `unknown`.
- Change `EvidenceBundle.metadata` to `EvidenceBundleMetadata`.
- Keep `parseEvidenceBundleMetadataReadback(input: unknown)` as the validator.
- Do not introduce DB schema, migration, full metadata taxonomy, command
  provenance changes, or CLI behavior changes.

Consumer:

- `assessEvidenceBundleCompleteness`;
- `parseEvidenceBundleMetadataReadback`;
- future evidence metadata boundary repairs.

Falsifier:

- focused evidence bundle tests fail;
- typecheck fails in DB/CLI mappers;
- untrusted metadata becomes trusted without parser validation;
- the patch expands into full metadata taxonomy work.

## KRN Plan Readback

Command:

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn \
pnpm --filter @krn/cli krn plan \
  --task "Tighten EvidenceBundle metadata readback typing by inspecting current EvidenceBundle metadata usage and introducing the smallest safe known-field type boundary if the Record<string, unknown> escape hatch is still actionable; preserve DB JSON storage and parseEvidenceBundleMetadataReadback behavior; no DB schema, full metadata taxonomy, command provenance rewrite, CLI behavior change, or review-domain consolidation" \
  --persist
```

Persisted IDs:

```txt
executionRun: 007deaf4-c2e8-4af5-8ad9-2d214597d224
taskContract: 6f116aa3-bbfe-42e1-b8a0-509200b8ee06
contextAssembly: d65cc7f7-2be2-4b2e-9d5c-0b57187fb66c
```

Activation usefulness:

```txt
weak for owner-file recall; source inspection found evidenceBundle.ts
```

Retained pattern selection:

```txt
none selected
```

## Changed

- Added `EvidenceBundleMetadata` as the known-field metadata boundary.
- Changed `EvidenceBundle.metadata` from bare `Record<string, unknown>` to
  `EvidenceBundleMetadata`.
- Made `parseEvidenceBundleMetadataReadback` narrow the input through
  `EvidenceBundleMetadata` only after `isRecord(input)` succeeds.

Net production diff before final docs:

```txt
10 insertions
3 deletions
```

## Verification

Focused verification passed:

```sh
pnpm --filter @krn/core test -- evidenceBundle
pnpm typecheck
```

Observed:

```txt
@krn/core evidenceBundle focused run: 14 files / 73 tests passed
workspace typecheck: passed
```

Full verification passed:

```txt
pnpm test
pnpm quality:fallow:ci
pnpm db:ready
pnpm --filter @krn/harness test -- activePlanInvariants
git diff --check
```

Full test result:

```txt
@krn/core: 14 files / 73 tests passed
@krn/harness: 34 files / 188 tests passed
@krn/schema: 3 files / 27 tests passed
@krn/workers: 6 files / 40 tests passed
@krn/codex-adapter: 4 files / 9 tests passed
@krn/db: 27 files / 84 tests passed
@krn/cli: 41 files / 322 tests passed
```

Fallow:

```txt
Audit scope: 2 changed files vs bf73f777e0fb
No issues in changed files
```

DB readiness:

```txt
Postgres reachable
14/14 migrations applied
pgvector available
Brain store readiness ready
```

## Proof

This proves:

- known evidence metadata keys are now named in the `EvidenceBundle` type;
- the validator still handles untrusted metadata defensively;
- existing evidence behavior and workspace typecheck still pass.

This does not prove:

- all metadata bags across KRN are typed;
- DB JSON persistence validates every evidence metadata key;
- a full metadata taxonomy is needed or implemented;
- product readiness.

## Review Burden Delta

Before:

```txt
EvidenceBundle.metadata looked like an anonymous escape hatch even for known
readback keys
```

After:

```txt
known readback keys are named, but still unknown until parser validation
```

Verdict:

```txt
positive, intentionally narrow
```

## Second-Opinion Prompt

Use this prompt after the commit to force critical review:

```md
# Review Prompt: tsa4 Evidence Metadata Readback Typing

Review commit `<sha>` in `mise-en-palace`.

Focus only on:

1. Does `EvidenceBundleMetadata` improve the known-field boundary without
   pretending DB JSON is validated?
2. Are `diffSummary`, `sourceRefs`, and `targetEvidence` correctly typed as
   `unknown` at this boundary?
3. Does `parseEvidenceBundleMetadataReadback` remain the validation point?
4. Is this patch too small to matter, or correctly bounded for the audit item?
5. Did the slice avoid DB schema, metadata taxonomy, CLI behavior, command
   provenance, and review-domain changes?

Return findings first, ordered by severity. If there are no issues, say that
clearly and name the remaining risk.
```

## Evidence Loop

Persisted evidence capture:

```txt
evidenceBundle: 15e46c31-7ae3-4f77-9fe9-630ee2c340dd
reviewAssessment: 411ffbd9-8c63-41ea-8613-4830327633bd
feedbackDelta: ed9240ef-8ca4-4aca-a160-64613d1ef32f
changed files: 7 intended, 0 unrelated, 0 unknown
commands: 7 operator_reported / passed
sourceUsefulnessOutcomes: none
patternUsefulnessOutcomes: none
```

Persisted observe/reflect:

```txt
observationGroup: b14acec2-e1b6-40ab-9e6c-1c6b358d69e1
observationItems: 5
reflectionRecord: 241bda29-aa16-413d-8132-8d3b9d100895
observationsSelectedByReflect: 5
findings: 0
candidateRowsWritten: no
memoryMutation: none
```

## Next Task

Created follow-up:

```txt
mise-en-palace-8qer Verify evidence command normalization at persistence boundary
```

Why:

```txt
tsa4 tightened known EvidenceBundle metadata typing; the next high-impact audit
item is whether evidence command normalization is enforced before DB persistence,
not only available in core.
```
