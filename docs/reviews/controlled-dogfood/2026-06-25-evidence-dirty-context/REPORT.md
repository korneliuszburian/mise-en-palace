# Evidence Dirty Context Source Repair Dogfood Report

Status: KRN-on-KRN source repair trial.

Date: 2026-06-25

Evaluator: Codex using KRN plan/reporting discipline

Repo state at start:
- branch: `main...origin/main`
- ahead/behind: none reported by `git log --oneline --decorate --left-right origin/main...main`
- latest commit before edits: `b2a68d2 docs(plan): add KRN source repair trial`
- worktree: clean before edits

DB available in current shell: no. `pnpm db:ready` failed before edits with `CONNECT_TIMEOUT localhost:54329`.

## Executive Verdict

KRN was useful for this source repair, but the usefulness was mixed. The plan and dogfood standard correctly constrained the work to one evidence surface, forced command-proof and dirty-context reporting, and prevented activation/memory/reflection drift. The actual KRN planning command selected no context and persisted no run, so activation usefulness was weak. The strongest product signal came from running the improved `krn evidence capture` on the dirty worktree: the first run exposed a real package-relative path mismatch, and the second run confirmed intended file classification worked for the actual source slice.

Brain usefulness verdict: mixed positive.

## Scope

Objective: improve `krn evidence capture` so future dogfood runs distinguish intended changed files, unrelated dirty files, unknown/unclassified changed files, and command proof strength.

Changed package source:
- `packages/cli/src/parseArgs.ts`
- `packages/cli/src/parseEvidenceArgs.ts`
- `packages/cli/src/runCli.ts`
- `packages/cli/src/runEvidenceCaptureCommand.ts`
- `packages/cli/src/parseEvidenceArgs.test.ts`
- `packages/cli/src/runCli.test.ts`

No KRN package source outside CLI was modified.

Non-goals preserved:
- no activation scoring change;
- no memory scoring change;
- no reflection extraction change;
- no DB schema or migration;
- no dashboard, worker runtime, eval platform, source crawler, `krn audit`, anti-slop scanner, or quality engine.

## KRN Plan Output Summary

Command:

```sh
pnpm --filter @krn/cli krn plan --task "Improve evidence capture dirty-context reporting so future dogfood runs distinguish intended files, unrelated dirty files, command proof strength, and weak default command rows"
```

Result:
- persistence: disabled, no-store preview;
- project: `project:mise-en-palace`;
- selected context: none;
- selected memory: none;
- selected source claims: none;
- exclusions: none;
- raw recall triggers: none reported;
- context status: abstained;
- expected evidence: `pnpm typecheck`, `pnpm test`, `git diff --check`;
- skill hints included `typescript-type-safety`, `evidence-review-loop`, `activation-engine`, and `brain-store-schema`.

Usefulness: weak for activation, useful for execution constraints. It kept the task bounded but did not select the relevant evidence files or report standard.

## Repair Diff Summary

| Area | Change | Why final-pattern | What was not changed |
| --- | --- | --- | --- |
| CLI args | Added repeatable `--intended-file <path>` to `krn evidence capture`. | Intent belongs at operator input boundary. | No hidden command runner or file cleanup. |
| Changed-file reporting | Classified changed files as `intended`, `unrelated`, or `unknown`. | Makes dirty context reviewable without inventing a scanner. | No generic quality classifier or ignore policy. |
| Package-relative matching | Matched repo-root `packages/...` intended paths against package-relative `git status` paths. | Real dogfood capture showed `pnpm --filter @krn/cli krn ...` runs from package cwd. | No broad fuzzy matching outside package-root intent. |
| Persist metadata | Added intended/unrelated/unknown classification counts and metadata to persisted evidence path. | Keeps DB evidence richer without schema migration. | No new table or migration. |
| Tests | Added parser and CLI regression coverage for intended files, unrelated files, package-relative status paths, command proof, and persist metadata. | Protects behavior that reduces review burden. | No snapshot-only test as primary proof. |

## Verification

| Command | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `pnpm --filter @krn/cli test -- parseEvidenceArgs runCli` | passed | CLI parser/output tests pass, including intended/unrelated classification and package-relative matching. | Does not prove DB persistence against live Postgres. |
| `pnpm typecheck` via `rtk proxy pnpm typecheck` | passed | Workspace TypeScript compile succeeds under current strict config. | Does not prove runtime DB availability or product value. |
| `pnpm test` | passed | Full workspace test suite passed: core, schema, harness, workers, codex-adapter, db, cli. | Does not prove activation quality, memory usefulness, or live DB replay. |
| `git diff --check` | passed | Diff has no whitespace errors. | Does not prove behavior correctness. |
| `pnpm db:ready` | failed before edits | Current shell could not reach local DB at `localhost:54329`. | Does not prove DB schema/persistence is broken; DB was unavailable. |

## Evidence Capture

Final dogfood capture command:

```sh
pnpm --filter @krn/cli krn evidence capture \
  --intended-file packages/cli/src/parseEvidenceArgs.ts \
  --intended-file packages/cli/src/runEvidenceCaptureCommand.ts \
  --intended-file packages/cli/src/runCli.ts \
  --intended-file packages/cli/src/parseArgs.ts \
  --intended-file packages/cli/src/parseEvidenceArgs.test.ts \
  --intended-file packages/cli/src/runCli.test.ts \
  --verification "pnpm --filter @krn/cli test -- parseEvidenceArgs runCli=passed" \
  --verification "pnpm typecheck=passed" \
  --verification "pnpm test=passed" \
  --verification "git diff --check=passed"
```

Final output classified:
- intended: six changed CLI files plus `PLAN.md`, `GOAL.md`, and the report
  directory;
- unrelated: none;
- unknown: none;
- dirty context: none detected from intended-file classification;
- command evidence: operator-reported passed outcomes with `doesNotProve`;
- memory mutation: none;
- source decision candidates: none.

Important dogfood finding:
- The first capture run classified the same files as unrelated because `pnpm --filter @krn/cli krn ...` produced package-relative `src/...` paths while the operator supplied repo-root `packages/cli/src/...` intended paths.
- A later capture run classified root docs as unrelated because package-cwd Git
  status produced `../../PLAN.md` and `../../docs/...` paths. The implementation
  was updated to normalize leading parent segments and match untracked
  directory paths against intended files.
- Both edge cases now have regression coverage.

## Dogfood Brain Usefulness Section

### Brain Usefulness Summary

Brain ROI:
- mixed

Overall verdict:
- KRN helped keep scope and evidence boundaries honest, but activation did not select useful context. The source change itself improved future evidence reviewability.

What this run proves:
- `krn evidence capture` can now accept intended files and render intended/unrelated/unknown changed-file groups.
- Operator-reported command outcomes still render provenance and `doesNotProve`.
- The new behavior works on the actual dirty source slice after package-relative normalization.

What this run does not prove:
- It does not prove Memory Brain product readiness.
- It does not prove activation relevance in general.
- It does not prove reflection or candidate quality.
- It does not prove live DB replay because DB was unavailable.

DB used in current shell:
- no

### Activated Context Usefulness

| Item | Type | Why selected | Used? | Helped? | Missing/Stale/Noise? | Evidence | Follow-up |
| --- | --- | --- | --- | --- | --- | --- | --- |
| KRN plan output | other | Requested by goal before coding. | yes | neutral | none | `krn plan` output, no-store preview | keep |
| `DOGFOOD_REPORTING.md` | source | Required report standard. | yes | helped | none | This report follows its required fields. | keep |
| Evidence CLI source files | raw recall | Manually selected from source inspection and plan. | yes | helped | none | Changed files list. | keep |
| Activation selected memory/source | memory/source | KRN plan abstained. | no | unknown | missing | Plan output selected 0 context items. | improve activation only after more dogfood evidence |

### Missing Context

| Missing item | Expected source | Why it mattered | Evidence | Repair implication |
| --- | --- | --- | --- | --- |
| Brain Usefulness Report dirty-context finding | SourceClaim or memory | It directly motivated the slice but was not selected by KRN plan. | Manual reading of `docs/reviews/brain-usefulness/REPORT.md`. | memory guidance / source quality |
| Dogfood reporting standard | SourceClaim or memory | Required fields shaped the final report but were not selected by KRN plan. | Manual reading of `docs/reviews/brain-usefulness/DOGFOOD_REPORTING.md`. | source quality |

### Memory Usefulness

| Memory/Candidate | Selected? | Used? | Outcome | Evidence provenance | Reviewability | Follow-up |
| --- | --- | --- | --- | --- | --- | --- |
| No MemoryRecord selected | no | no | unknown | KRN plan output | unknown | defer |
| Proposed memory candidate: evidence capture should classify intended/unrelated/unknown dirty files | no | yes | helped | operator report + source diff + tests | ready | review |

Rules observed:
- Memory exists was not treated as evidence that memory helped.
- No Memory Core mutation occurred.
- Candidate was not promoted.

### Source Grounding Usefulness

| Source/Claim | Supported decision? | Prevented overclaim? | Decorative/noise? | Missing conflict? | Evidence | Follow-up |
| --- | --- | --- | --- | --- | --- | --- |
| `DOGFOOD_REPORTING.md` | yes | yes | no | no | Required section used here. | keep |
| Brain Usefulness Report | yes | yes | no | no | Motivated dirty-context review burden repair. | keep |
| OpenAI Codex execution guidance as already mapped in `PLAN.md` | yes | yes | no | no | Plan constrained execution to focused source slice. | keep |

### Evidence And Review Burden

| Evidence item | Strength | What it proves | What it does not prove | Review burden impact |
| --- | --- | --- | --- | --- |
| Targeted CLI tests | strong | Parser/output behavior works in focused tests. | Does not prove all runtime environments. | reduced |
| Full test suite | strong | Existing workspace tests pass after change. | Does not prove product value or live DB. | reduced |
| Final evidence capture preview | strong | Real dirty worktree is classified as intended/unrelated/unknown. | Does not persist DB evidence. | reduced |
| Earlier evidence capture previews | strong | Exposed package-relative and root-parent path mismatches. | Does not mean unrelated files were truly dirty. | increased initially, then reduced |
| DB readiness | missing | DB was unavailable in current shell. | Does not prove DB path failed in CI or another shell. | unchanged |

### Observation And Reflection Usefulness

| Observation/Reflection | Output | Useful? | Evidence refs | Follow-up |
| --- | --- | --- | --- | --- |
| Observation | not run | ledger-only | DB unavailable; no persisted run. | no action |
| Reflection | not run | ledger-only | DB unavailable; no persisted run. | no action |

Rules observed:
- No ObservationGroup or ReflectionRecord was claimed.
- No candidate rows were written.
- Reflection absence is not treated as reflection quality evidence.

### Candidate Quality

| Candidate | Type | Evidence refs | Reviewability | Decision | Follow-up |
| --- | --- | --- | --- | --- | --- |
| Evidence capture should classify intended, unrelated, and unknown dirty files before review. | MemoryCandidate | Source diff, tests, final evidence capture output. | ready | review | Could become memory after another dogfood confirms reuse. |
| Do not hide unrelated dirty files during evidence capture. | AntiMemoryCandidate | Dirty-context goal, reporting standard, output behavior. | ready | review | Keep as anti-memory candidate if repeated. |
| Evidence capture output should include regression coverage for package-relative and root-parent `git status` paths under package scripts. | EvalCandidate | Earlier misleading captures and added tests. | ready | review | Add to future golden behavior if evidence capture gets golden lane. |

### Brain ROI

| Dimension | Verdict | Evidence |
| --- | --- | --- |
| Context waste | lower | Scope stayed inside evidence CLI source and tests. |
| Review burden | lower | Output now separates intended/unrelated/unknown and command proof. |
| Resume quality | better | Report records commands, caveats, first-capture issue, and final state. |
| Decision grounding | better | The package-relative matching fix came from real capture evidence. |
| Memory usefulness | unknown | No memory selected or applied. |
| Operator friction | lower | Future dogfood capture can pass intended files explicitly. |

Brain ROI verdict:
- mixed positive

### Command Evidence

| Command | Result | Proof strength | What it proves | What it does not prove |
| --- | --- | --- | --- | --- |
| `git fetch --prune` | passed | strong | Remote refs refreshed before work. | Does not prove clean after final commit. |
| `git status --short --branch` | passed | strong | Worktree was clean before edits. | Does not prove remote CI. |
| `git log --oneline --decorate --left-right origin/main...main` | passed, no entries | strong | Local and remote had no ahead/behind entries before edits. | Does not prove future remote state. |
| `pnpm db:ready` | failed | strong | DB unavailable in current shell. | Does not prove DB system is generally broken. |
| `pnpm --filter @krn/cli test -- parseEvidenceArgs runCli` | passed | strong | Focused CLI tests pass. | Does not prove product readiness. |
| `pnpm typecheck` | passed | strong | Strict TypeScript compile passes. | Does not prove runtime DB. |
| `pnpm test` | passed | strong | Full test suite passes. | Does not prove activation/memory/reflection quality. |
| `git diff --check` | passed | strong | Diff whitespace is clean. | Does not prove logic correctness. |
| `krn evidence capture ... --intended-file ...` | passed | strong | New capture output works on this dirty worktree, including package source, root docs, and untracked report directory. | Does not persist DB evidence. |

### Next Slice Candidates

| Candidate slice | Why | Evidence | Non-goals | Verification |
| --- | --- | --- | --- | --- |
| Add one golden behavior fixture for evidence dirty-context capture. | This behavior now protects future dogfood review burden. | Tests and final capture output. | No broad eval platform. | CLI/harness fixture test plus `pnpm test`. |
| Improve KRN plan context selection for active dogfood reporting docs. | KRN plan abstained despite obvious relevant docs. | Plan output selected no context. | No activation scoring rewrite yet. | Two more dogfood runs with usefulness reporting before scoring change. |
| Add DB replay proof for evidence capture metadata once DB is available. | DB was unavailable in this shell, so persisted metadata was only unit-tested. | `pnpm db:ready` timeout. | No schema migration unless persistence fails. | `pnpm db:ready` plus persisted evidence capture smoke. |

## Product Readiness Signal

This trial strengthens dogfood readiness, not product readiness. It shows KRN can improve a real KRN source surface and that dogfood evidence can catch an implementation edge case. It does not move KRN to internal-alpha-ready by itself because activation did not select useful context and DB replay was unavailable.

Recommended next action:
- run one more bounded KRN-on-KRN source repair with this reporting format before changing activation scoring.
