# Naming And Layout Inventory

## Verdict

The user report is live. KRN has real engineering substance, but repo scanning
shows visible naming and layout debt:

- package tests: 131 total, 1 under `__tests__`, 130 colocated beside runtime
  files;
- top noisy package by test colocation: `@krn/cli` with 41 colocated tests;
- long names cluster in workers, CLI run commands, harness invariant/golden
  files, DB smoke/readiness files, and brain-knowledge read-model code;
- `workers` is the safest first topology pilot: 6 colocated tests, no nested
  package-local test directories, and no runtime behavior change required.

The right response is not a giant repo rename. The right response is ordered,
package-by-package migration with tests proving each move.

## Source To Decision

```yaml
source_id: public-polubis-gon-stack-layout
title: gon-stack public package/test layout
url:
  - https://github.com/polubis/gon-stack/tree/d901f7c134b4c0885fd7fe3c099f17b4dca88a78/packages
trust_tier: medium
source_class: practitioner writing / public repo evidence
mechanism: packages use short names and small file names; tests are isolated in package-local src/__tests__ islands; local module docs/recipes sit near the code they guide.
krn_implication: KRN can improve scanability by moving tests out of runtime file rows and shortening over-specific AI/control-plane names, while preserving current package boundaries and product semantics.
decision_kind: adopt
decision: Use package-local __tests__ islands as the preferred test topology for new or migrated tests; start with the smallest high-noise package before touching CLI/harness.
does_not_prove: This does not prove KRN should copy gon-stack topology, remove KRN domain vocabulary, add clone runtime, or rename public CLI behavior without compatibility.
consumer: mise-en-palace-dqqf, mise-en-palace-mvrx, future package-local migrations
falsifier: moving a bounded package's tests to __tests__ makes imports harder, hides tests from Vitest/TypeScript/CI, or reduces maintainability compared with colocation.
```

```yaml
source_id: repo-local-naming-layout-scan
title: KRN current package layout scan
trust_tier: high
source_class: repo-local evidence
mechanism: local file inventory shows 130 colocated package tests, long file names above 32 characters, and repeated vocabulary such as KnowledgeAcquisitionHeartbeatPreview, ConsensusCandidateEvaluationPreview, GoldenObservationReflectionBehavior, and SourceArtifactPreviewCommand.
krn_implication: naming/layout cleanup is not cosmetic; it reduces active scan noise and makes KRN easier to operate as a code-backed brain rather than a prompt/document maze.
decision_kind: adopt
decision: Track layout migration separately from semantic renames; migrate tests first, then rename internal concepts only where behavior and compatibility are clear.
does_not_prove: This scan does not prove every long name is bad, or that short names should replace precise domain names when precision matters.
consumer: this report; Beads issue mise-en-palace-yuvw; follow-up tasks mise-en-palace-dqqf and mise-en-palace-mvrx
falsifier: a proposed rename loses domain meaning, breaks imports/CI, or only shortens a name without reducing cognitive load.
```

## Measured Findings

### Test Topology

```txt
total_tests=131
tests_in___tests__=1
colocated_tests=130
```

Package split for root-level colocated tests:

```txt
cli 41
codex-adapter 4
core 12
db 8
harness 21
schema 3
workers 6
```

Current only positive example:

```txt
packages/harness/src/recipes/__tests__/drift.test.ts
```

### Long File Names

Highest-noise examples:

```txt
packages/workers/src/knowledgeAcquisitionHeartbeatPreview.test.ts
packages/workers/src/consensusCandidateEvaluationPreview.test.ts
packages/harness/src/goldenObservationReflectionBehavior.test.ts
packages/harness/src/typescriptTargetPatternInvariants.test.ts
packages/harness/src/brainKnowledgeReadModelInvariants.test.ts
packages/cli/src/runSourceArtifactPreviewCommand.test.ts
packages/db/src/heartbeatWorkerAuthoritySmoke.test.ts
packages/cli/src/evidenceCaptureGoldenBehavior.test.ts
```

These names are not all wrong. The issue is density: too many files encode full
sentences as filenames, so the source tree reads like a report index instead of
a codebase.

### Large Files

Largest source/test files in the scan:

```txt
cli/src/runCli.test.ts: 6087 lines
cli/src/runSourceArtifactPreviewCommand.ts: 2225 lines
harness/src/activation/index.test.ts: 1670 lines
cli/src/runHeartbeatPreviewCommand.ts: 1454 lines
cli/src/runSourceSearchCommand.ts: 1231 lines
cli/src/runSourceArtifactPreviewCommand.test.ts: 1202 lines
cli/src/runRunShowCommand.ts: 1168 lines
cli/src/runKnowledgeCardsCommand.test.ts: 1158 lines
cli/src/runHeartbeatPreviewCommand.test.ts: 1153 lines
cli/src/parseEvidenceArgs.ts: 1130 lines
```

These are not rename-only problems. They are future split/refactor candidates.

## Concrete Offender Inventory

| # | Current path / symbol | Decision | Risk | Verification | Track |
| - | --- | --- | --- | --- | --- |
| 1 | `packages/cli/src/runSourceArtifactPreviewCommand.ts` | split before rename; likely `commands/sourceArtifactPreview/*` | high | focused CLI tests + `alpha:verify:full` | future CLI cleanup |
| 2 | `packages/cli/src/runCli.test.ts` | split by command group; do not move first | high | `pnpm --filter @krn/cli test -- runCli` | `lx3s` |
| 3 | `packages/cli/src/runHeartbeatPreviewCommand.ts` | inventory responsibilities; consider `commands/heartbeat/preview.ts` | medium | heartbeat CLI tests | `lx3s` / `mvrx` |
| 4 | `packages/cli/src/runKnowledgeCardsCommand.ts` | rename only after vocabulary decision; likely `brainKnowledgeCommand` | medium | knowledge CLI tests | `mvrx` |
| 5 | `packages/cli/src/runMemoryCandidateReviewCommand.ts` | leave until memory lifecycle names settle | medium | memory CLI tests | `mvrx` |
| 6 | `packages/cli/src/runMemoryRecordApplyCommand.ts` | leave until memory lifecycle names settle | medium | memory CLI tests | `mvrx` |
| 7 | `packages/cli/src/runSourceArtifactPreviewCommand.test.ts` | move with source-artifact command group, not alone | high | source artifact preview tests | `lx3s` |
| 8 | `packages/cli/src/runSourceClaimEdgesCommand.test.ts` | move with source command group | medium | source claim edge tests | `lx3s` |
| 9 | `packages/cli/src/retainedPatternPlanBridge.ts` | rename/split after retained-pattern flow inventory | medium | run show + plan bridge tests | `mvrx` |
| 10 | `packages/cli/src/projectResolutionReadback.ts` | rename `readback` away if not user-facing | low | target repo tests | `mvrx` |
| 11 | `packages/cli/src/parseEvidenceArgs.ts` | split by subcommand/options; no behavior change | medium | parse evidence tests | future CLI cleanup |
| 12 | `packages/cli/src/parseSourceArgs.ts` | split by source command family | medium | parse source tests | future CLI cleanup |
| 13 | `packages/harness/src/brainKnowledgeReadModel.ts` | split parser/search/read-model helpers before rename | medium | brain knowledge tests | `mvrx` |
| 14 | `packages/harness/src/brainKnowledgeReadModelInvariants.test.ts` | move to harness `__tests__` with smoke-filter check | medium | brain-battle smoke | `o5xg` |
| 15 | `packages/harness/src/goldenKrnBehaviorGate.ts` | do not delete; split by behavior domain later | high | brain-battle smoke | future harness cleanup |
| 16 | `packages/harness/src/goldenObservationReflectionBehavior.test.ts` | move/split with golden group | medium | golden behavior tests | `o5xg` |
| 17 | `packages/harness/src/evalProofBoundaryManifest.ts` | leave name for now; already domain-specific | low | eval manifest tests | leave |
| 18 | `packages/harness/src/typescriptTargetPatternInvariants.test.ts` | move with TS invariant group | medium | TS invariant tests | `o5xg` |
| 19 | `packages/harness/src/securityTrustBoundaryInvariants.test.ts` | move with security invariant group | medium | security invariant tests | `o5xg` |
| 20 | `packages/harness/src/activation/relationGroundedQaReadback.ts` | consider `relationQa.ts` after consumer inventory | medium | activation tests | `mvrx` |
| 21 | `packages/workers/src/brainHeartbeatPreview.ts` | rename after worker terminology decision, not in topology pilot | medium | workers tests | `mvrx` |
| 22 | `packages/workers/src/knowledgeAcquisitionHeartbeatPreview.ts` | candidate for `acquisitionPreview.ts` | medium | workers tests | `mvrx` |
| 23 | `packages/workers/src/consensusCandidateEvaluationPreview.ts` | candidate for `consensusPreview.ts` | medium | workers tests | `mvrx` |
| 24 | `packages/workers/src/memoryStalenessHeartbeatPreview.ts` | candidate for `stalenessPreview.ts` | medium | workers tests | `mvrx` |
| 25 | `packages/workers/src/sourceRelationHeartbeatPreview.ts` | candidate for `relationsPreview.ts` | medium | workers tests | `mvrx` |
| 26 | `packages/db/src/heartbeatWorkerAuthoritySmoke.test.ts` | move/simplify after DB smoke topology plan | medium | DB smoke CI | future DB cleanup |
| 27 | `packages/db/src/memoryGovernanceReadiness.ts` | leave until DB readiness vocabulary changes together | medium | DB readiness/smoke | leave |
| 28 | `packages/db/src/retrievalSubstrateReadiness.ts` | leave until DB readiness vocabulary changes together | medium | DB readiness/smoke | leave |
| 29 | `packages/core/src/evidenceBundle.ts` | split only after metadata/schema decision; no vanity rename | high | core tests + full gate | future evidence cleanup |
| 30 | `packages/core/src/codexAdapterPlanRef.ts` | verify consumers; delete or inline if truly tiny/orphaned | low | typecheck + rg import proof | future dead-code audit |

Inventory rule: long names with live public or persisted meaning are not
automatically renamed. Rename only when it reduces cognitive load without
weakening domain precision.

## Pilot Completed In This Slice

`workers` test topology was migrated as the first bounded package pilot:

```txt
before:
  total_tests=131
  tests_in___tests__=1
  colocated_tests=130

after:
  total_tests=131
  tests_in___tests__=7
  colocated_tests=124
```

Moved:

```txt
packages/workers/src/__tests__/brainHeartbeatPreview.test.ts
packages/workers/src/__tests__/consensusCandidateEvaluationPreview.test.ts
packages/workers/src/__tests__/index.test.ts
packages/workers/src/__tests__/knowledgeAcquisitionHeartbeatPreview.test.ts
packages/workers/src/__tests__/memoryStalenessHeartbeatPreview.test.ts
packages/workers/src/__tests__/sourceRelationHeartbeatPreview.test.ts
```

Only relative imports changed from `./x.js` to `../x.js`. Runtime files were not
renamed or edited.

The latest second-opinion audit also flagged `hash` naming in the recipe drift
lab as misleading. That was corrected in this slice:

```txt
hash -> checksum
expected/actual -> expectedChecksum/actualChecksum
hashRecipe -> checksumRecipe
```

The checksum remains a drift detector over selected code/docs only. It is not a
security hash, provenance proof, semantic quality signal, or source/proof
metadata integrity check.

## Remaining Migration Order

1. Low-risk small packages.
   Migrate `schema`, `codex-adapter`, and selected `core` root tests to
   package-local `__tests__` islands where imports stay simple.

2. Harness root tests.
   Move invariant/golden tests into `src/__tests__/` or domain-local
   `__tests__` directories after checking current Vitest filters used by
   `eval:brain-battle:smoke`.

3. CLI parser tests.
   Move parser tests by group only after confirming `runCli` and filtered
   command tests still resolve fixture paths.

4. Naming batches.
   Rename only after topology settles. First candidates are internal terms with
   obvious shorter names:

   ```txt
   *HeartbeatPreview -> *Plan or *Preview only where no worker runtime exists
   KnowledgeAcquisitionHeartbeatPreview -> acquisitionPreview/acquirePreview
   ConsensusCandidateEvaluationPreview -> consensusPreview
   GoldenObservationReflectionBehavior -> observationReflectionGolden
   SourceArtifactPreviewCommand -> sourceArtifactPreview
   ```

   Public CLI command names and persisted DB/table names need compatibility
   plans before any change.

## Rejected Moves

- No mass file move across all packages in one commit.
- No public CLI rename without compatibility and tests.
- No package rename from `codex-adapter`, `workers`, or `harness` in this slice.
- No deletion of long-named files merely because the name is ugly.
- No copying gon-stack topology wholesale.

## Proof Boundary

Proves:

- The repo has measurable test topology debt.
- The worst scan-noise classes are identified and ordered.
- The first migration was bounded to workers tests and passed focused checks.
- The polubis/gon-stack comparison produced a concrete mechanism, not a style
  cargo-cult.

Does not prove:

- Repo-wide naming/layout has been fixed.
- All long names are wrong.
- Workers runtime semantics are healthy.
- CLI parser/run-command sprawl has been repaired.
- KRN is product-ready.

## Verification

```txt
rtk pnpm --filter @krn/workers test
rtk pnpm -C packages/workers typecheck
rtk pnpm --filter @krn/harness test -- recipes contextHygieneInvariants
rtk pnpm -C packages/harness typecheck
rtk pnpm quality:fallow:ci
rtk proxy pnpm typecheck
rtk pnpm test
rtk pnpm eval:brain-battle:smoke
rtk git diff --check
```

Result:

- Workers tests: 6 files passed, 40 tests passed.
- Workers typecheck: passed.
- Recipe drift/context-hygiene tests: 36 files passed, 200 tests passed after
  checksum naming repair and compact `PLAN.md` update.
- Harness typecheck: passed.
- Fallow changed-files audit: passed on 14 changed files.
- Workspace typecheck: passed through `rtk proxy pnpm typecheck`.
- Workspace tests: 131 files passed, 757 tests passed.
- Brain-battle smoke: passed.
- Diff check: passed.
