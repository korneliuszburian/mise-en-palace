# Goal: Use KRN Brain To Improve KRN Source Code

You are working in:

```txt
/home/krn/coding/krn/active/mise-en-palace
```

KRN is a Codex Operating Layer / AI Engineering Control Plane.

Codex executes. KRN supplies bounded context, store-backed memory, source
grounding, policy, skills, eval expectations, traces, review gates, and
feedback.

## Attached Plan

Use the active root execution plan:

```txt
PLAN.md
```

First unchecked slice:

```txt
KRN-SR-00: Improve Evidence Dirty-Context Reporting
```

Do not create a parallel root `PLANS.md`. OpenAI's ExecPlan guidance is used as
execution discipline, but this repo's canonical living plan is `PLAN.md`.

## Current Context

The repo/reset/continuous-hardening goals are complete.

The Brain Usefulness Report exists at:

```txt
docs/reviews/brain-usefulness/REPORT.md
```

It concluded:

```txt
Brain readiness: dogfood-ready
Product readiness: not yet
```

The Dogfood Brain Usefulness Reporting standard exists at:

```txt
docs/reviews/brain-usefulness/DOGFOOD_REPORTING.md
```

This goal is the first real KRN-on-KRN source repair trial after that report.
The objective is not to create a fake weak repo. The objective is to use KRN to
improve this actual repo.

## Mission

Use KRN Brain to implement one bounded source improvement in `mise-en-palace`:

```txt
Improve evidence capture dirty-context reporting.
```

The Brain Usefulness Report found that dirty context and weak command proof are
useful signals, but they increase review burden when not separated clearly.

This slice should make evidence capture/reporting better at distinguishing:

- intended files;
- unrelated dirty files;
- unknown/unclassified changed files;
- command proof strength;
- default/weak command rows;
- operator-reported command evidence.

## Non-Goals

Do not:

- change activation scoring;
- change activation ranking;
- change memory retrieval;
- change memory scoring;
- change reflection extraction;
- change candidate generation;
- build dashboard;
- build worker runtime;
- build API/MCP server;
- build source crawler;
- build broad eval platform;
- add `krn audit`;
- add anti-slop scanner;
- add quality engine;
- hide dirty files;
- auto-clean unrelated dirty files;
- make evidence capture run shell commands automatically.

Do not mutate Memory Core.
Do not promote candidates.
Do not create a large new plan.
Do not read the archived historical root plan unless a live file explicitly
requires it.

## Required Read Order

1. `AGENTS.md`
2. `docs/KRN_KERNEL.md`
3. `README.md`
4. `GOAL.md`
5. `PLAN.md`
6. `docs/reviews/brain-usefulness/REPORT.md`
7. `docs/reviews/brain-usefulness/DOGFOOD_REPORTING.md`
8. `docs/runs/2026-06-23-feedback-dogfood.md`
9. `docs/runs/2026-06-23-self-hosting-memory-loop.md`
10. `packages/core/src/evidenceBundle.ts`
11. `packages/schema/src/evidenceBundle.ts`
12. `packages/cli/src/parseEvidenceArgs.ts`
13. `packages/cli/src/runEvidenceCaptureCommand.ts`
14. relevant tests for evidence capture and CLI parsing.

## Preflight

Run:

```sh
rtk git fetch --prune
rtk git status --short --branch
rtk git log --oneline --decorate --left-right origin/main...main
rtk pnpm typecheck
rtk pnpm test
rtk git diff --check
```

If local DB is available:

```sh
rtk pnpm db:ready
```

If DB is unavailable, continue without claiming DB runtime truth.

## KRN Planning Step

Before editing source, use KRN's own planning path if available.

Preferred:

```sh
rtk pnpm --filter @krn/cli krn plan \
  --task "Improve evidence capture dirty-context reporting so future dogfood runs distinguish intended files, unrelated dirty files, command proof strength, and weak default command rows"
```

If DB is available and `--persist` is appropriate, use:

```sh
rtk pnpm --filter @krn/cli krn plan \
  --task "Improve evidence capture dirty-context reporting so future dogfood runs distinguish intended files, unrelated dirty files, command proof strength, and weak default command rows" \
  --persist
```

Record:

- selected context;
- selected memory;
- selected source claims;
- exclusions;
- raw recall triggers;
- expected evidence;
- whether the selected context was useful.

If KRN plan output is weak, proceed but record that in the final dogfood
usefulness section.

## Assumptions

Record before coding:

- evidence capture is the owning surface for command proof and dirty context
  reporting;
- the first repair should improve reporting/classification, not scoring or
  cleanup behavior;
- unrelated dirty files should be visible, not hidden;
- no package source outside evidence CLI/schema/core should be touched unless
  tests reveal a direct need.

## Target Behavior

Improved evidence capture should support or clearly report:

```txt
changed files:
  intended:
    - ...
  unrelated:
    - ...
  unknown:
    - ...

command proof:
  - operator_reported passed/failed
  - captured_output_file
  - command_runner if already supported
  - default_template / not_run as weak proof

review burden:
  - dirty context warning when unrelated files are present
  - clear "what this proves / does not prove"
```

Preferred CLI example:

```sh
rtk pnpm --filter @krn/cli krn evidence capture \
  --run-id <id> \
  --intended-file packages/cli/src/runEvidenceCaptureCommand.ts \
  --intended-file packages/cli/src/parseEvidenceArgs.ts \
  --verification "pnpm typecheck=passed" \
  --verification "pnpm test=passed" \
  --persist
```

The exact output can differ, but it must preserve the same semantics.

## Implementation Rules

- Choose the smallest final-pattern implementation after inspecting current
  code.
- Prefer adding repeatable `--intended-file <path>` to `krn evidence capture`
  plus a small changed-file classification function and focused rendering.
- If an intended-file mechanism already exists, improve rendering/tests only.
- Do not invent a generic file classifier.
- Do not add ignore policy.
- Do not create a quality system.
- Do not hide dirty files.
- Do not run shell commands automatically inside evidence capture.
- Every changed line must trace to this goal.
- No adjacent cleanup.
- No broad formatting.
- No speculative abstraction.

## Files Likely Touched

Likely:

- `packages/core/src/evidenceBundle.ts`
- `packages/schema/src/evidenceBundle.ts`
- `packages/cli/src/parseEvidenceArgs.ts`
- `packages/cli/src/runEvidenceCaptureCommand.ts`
- focused CLI/evidence tests
- `docs/reviews/controlled-dogfood/<date>-evidence-dirty-context/REPORT.md`
- `PLAN.md`
- `GOAL.md`

Only touch what the implementation actually requires.

## Tests Required

Add or update focused tests proving:

- `--intended-file` parses as repeatable input;
- intended changed files classify as intended;
- dirty changed files not listed as intended classify as unrelated;
- no intended-file input keeps files unclassified/unknown or preserves old
  behavior safely;
- operator-reported command proof still renders provenance and does-not-prove;
- default not-run command rows remain weak proof.

Use existing test style.

## Verification

Run targeted tests first:

```sh
rtk pnpm --filter @krn/cli test -- parseEvidenceArgs runEvidenceCaptureCommand
```

Then run:

```sh
rtk pnpm typecheck
rtk pnpm test
rtk git diff --check
```

If DB persistence is touched, also run:

```sh
rtk pnpm db:ready
rtk pnpm --filter @krn/db db:check
rtk pnpm db:smoke:harness-evidence
```

Do not claim DB runtime truth unless these pass in the current shell.

## Evidence Capture For This Slice

After implementation and verification, run KRN evidence capture on this slice
if possible.

Example:

```sh
rtk pnpm --filter @krn/cli krn evidence capture \
  --intended-file packages/cli/src/parseEvidenceArgs.ts \
  --intended-file packages/cli/src/runEvidenceCaptureCommand.ts \
  --verification "pnpm --filter @krn/cli test -- parseEvidenceArgs runEvidenceCaptureCommand=passed" \
  --verification "pnpm typecheck=passed" \
  --verification "pnpm test=passed" \
  --verification "git diff --check=passed"
```

If a persisted run exists, add `--run-id <id> --persist`.

Record what the command proves and does not prove.

## Dogfood Brain Usefulness Section

Create a run report:

```txt
docs/reviews/controlled-dogfood/<date>-evidence-dirty-context/REPORT.md
```

Use:

```txt
docs/reviews/brain-usefulness/DOGFOOD_REPORTING.md
```

The report must include:

- KRN plan output summary;
- selected context;
- selected memory/source;
- whether selected context was used/helped/noise/missing;
- what code changed;
- command evidence strength;
- review burden delta;
- candidate reviewability;
- Brain ROI.

Especially answer:

- Did KRN Brain help this source repair?
- Did it select useful context?
- Did it miss important context?
- Did evidence capture become more reviewable?
- Did this reduce future dogfood review burden?

## Candidate Outputs

The report may propose candidates, but must not promote them.

Allowed:

- MemoryCandidate;
- AntiMemoryCandidate;
- SourceClaim;
- EvalCandidate.

Every candidate must include:

- evidence refs;
- doesNotProve;
- reviewability: ready / needs more evidence / too vague / duplicate / not
  useful.

## Success Criteria

This goal is complete when:

1. KRN was used to plan or guide this source repair, or the report explains why
   KRN planning could not be used.
2. Evidence capture dirty-context reporting is improved in package source.
3. Tests prove the new behavior.
4. `rtk pnpm typecheck` passes.
5. `rtk pnpm test` passes.
6. `rtk git diff --check` passes.
7. A dogfood report exists under:
   `docs/reviews/controlled-dogfood/<date>-evidence-dirty-context/REPORT.md`.
8. The dogfood report includes a full Dogfood Brain Usefulness Section.
9. No dashboard, worker runtime, eval platform, source crawler, audit scanner,
   or anti-slop system was added.
10. Commit is focused and pushed.
11. Worktree is clean after push.

## Suggested Commit

```sh
rtk git add packages docs PLAN.md GOAL.md
rtk git commit -m "feat(evidence): classify dirty context in capture output"
rtk git push
```

If the final change is smaller or docs-only, adjust the commit message
honestly.

## Final Response Required

Respond with:

```txt
Read:
- ...

KRN plan used:
- yes/no
- run id if persisted

Changed:
- ...

Commands run:
- ...

Dogfood report:
- docs/reviews/controlled-dogfood/<date>-evidence-dirty-context/REPORT.md

Brain usefulness verdict:
- strong positive / positive / mixed / weak / insufficient evidence

What improved:
- ...

What this does not prove:
- ...

Candidates proposed:
- ...

Next recommended action:
- ...
```
