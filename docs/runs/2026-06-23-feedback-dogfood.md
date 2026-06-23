# MM-58 Feedback Dogfood

Date: 2026-06-23

Purpose:
Dogfood the feedback capture path on one KRN slice after MM-57 introduced
`krn review assess`.

Scope:

- persisted KRN plan run;
- persisted evidence capture;
- persisted review assessment;
- persisted feedback delta;
- proof that candidate proposals are generated;
- proof that review burden and diff risk are recorded;
- proof that Memory Core is not mutated.

Non-goals:

- no MemoryCandidate row creation;
- no MemoryRecord creation;
- no memory promotion;
- no source crawler;
- no dashboard/API/MCP/server/plugin.

## Run

Task:

```txt
MM-58 dogfood feedback capture for review assess slice
```

Persisted run:

```txt
executionRun: 5db6c5aa-3fcf-48bd-b013-f732c7558e33
taskContract: 10833604-d20f-4cc8-9798-3ed40f6b130a
harnessPlan: af77ea43-604a-420f-893d-0f539a159a8b
contextAssembly: 20a17922-a69d-49db-8a4a-acb998b1271c
```

## Before Counts

```txt
evidence_bundles=8
review_assessments=8
feedback_deltas=8
memory_candidates=2
memory_records=4
```

## Evidence Capture

Command:

```bash
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn \
  pnpm --filter @krn/cli krn evidence capture \
  --run-id 5db6c5aa-3fcf-48bd-b013-f732c7558e33 \
  --persist
```

Output summary:

```txt
Evidence captured at: 2026-06-23T06:16:09.573Z
Changed files:
  ?? ../../docs/materials/2026-06-22-big-brain-part-2.md
  ?? ../../docs/materials/2026-06-22-big-brain.md
  ?? ../../docs/runs/2026-06-23-feedback-dogfood.md
Commands:
  pnpm typecheck: skipped
  pnpm test: skipped
  git diff --check: skipped
Diff risk: medium
Review burden: summarize changed files, command proof, residual risk, and rollback path.
Rollback path: revert the focused implementation commit or discard uncommitted changes.
Memory mutation: none
MemoryRecord created: no
```

Persisted IDs:

```txt
evidenceBundle: 4d2e3247-4469-45bc-99a3-0a4b4095110d
reviewAssessment: 99ad79d8-f4b1-4018-9721-79676238e882
feedbackDelta: 0ba61fdd-179d-455d-bac5-af57515b6f87
```

Feedback candidate proposals:

```txt
memoryCandidates=1
sourceDecisions=0
evalCandidates=0
proposalId=memory-candidate-proposal-1782195369332-1
proposalStatus=proposed
proposalKind=pattern
proposalPersistence=feedback-delta-proposal-only
missingFields=applicationGuidance, sourceLineage, invalidationRule
MemoryCandidate rows created: 0
MemoryRecord rows created: 0
```

Caveat:
The candidate proposal correctly stayed proposal-only, but the changed-file
snapshot included the two untracked raw research files in `docs/materials/`.
Those files are dirty local context and were not staged for this slice.

## Review Assess

First live dogfood exposed a runtime-scope bug:

```txt
krn review assess --persist tried to use the broad DB runtime, which requires
workspace/project resolution even though review assessment writes only need the
harness run repository.
```

Fix:

```txt
packages/cli/src/databaseRuntime.ts now exposes createReviewAssessDatabaseRuntime
with only createReviewAssessment/createFeedbackDelta access.
packages/cli/src/runCli.ts routes review assess through this narrow runtime.
packages/cli/src/runReviewAssessCommand.ts no longer bootstraps local/mise-en-palace.
```

Command after the fix:

```bash
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn \
  pnpm --filter @krn/cli krn review assess \
  --evidence-bundle-id 4d2e3247-4469-45bc-99a3-0a4b4095110d \
  --reviewer codex-mm58 \
  --status changes_requested \
  --summary "MM-58 feedback capture produced candidate proposals and recorded review risk, but captured unrelated raw research files because they remain untracked." \
  --finding "medium:Evidence capture included raw docs/materials files in addition to the MM-58 dogfood doc" \
  --outcome changes_requested \
  --review-burden medium \
  --diff-risk medium \
  --correction-label dirty_context \
  --persist
```

Output:

```txt
KRN Review Assess
Persistence: enabled (Postgres, explicit --persist)

Persisted IDs:
reviewAssessment: c6b0130d-c6d0-4db2-95b5-4076201eee4e
feedbackDelta: de8b97e3-1593-4f4c-891a-60c7a3df444c
status: changes_requested
outcome: changes_requested
reviewBurden: medium
diffRisk: medium
correctionLabels: dirty_context
Memory mutation: none
MemoryRecord created: no
```

Persisted metadata proof:

```txt
review_metadata={"outcome": "changes_requested", "diffRisk": "medium", "reviewBurden": "medium", "correctionLabels": ["dirty_context"]}
feedback_metadata={"outcome": "changes_requested", "diffRisk": "medium", "reviewBurden": "medium", "correctionLabels": ["dirty_context"], "memoryRecordMutation": "none"}
manual_feedback_candidates=0,0,0
```

## After Counts

After evidence capture and manual review assess:

```txt
evidence_bundles=9
review_assessments=10
feedback_deltas=10
memory_candidates=2
memory_records=4
```

Delta from before:

```txt
evidence_bundles +1
review_assessments +2
feedback_deltas +2
memory_candidates +0
memory_records +0
```

## Verdict

MM-58 passed.

The feedback path has now been dogfooded on one KRN slice:

- evidence capture persisted one EvidenceBundle, one ReviewAssessment, and one
  FeedbackDelta;
- evidence capture generated one proposal-only memory candidate inside
  FeedbackDelta JSON, not a MemoryCandidate row;
- manual `krn review assess --persist` persisted one additional
  ReviewAssessment and FeedbackDelta;
- review burden and diff risk were recorded as `medium`;
- Memory Core row counts did not change.

Residual risk:
The dogfood was intentionally honest about dirty local context. Untracked raw
research materials appeared in the evidence changed-file snapshot because they
remain in the worktree. They were not committed and should stay quarantined
unless a later source-to-decision slice explicitly promotes their mechanisms.
