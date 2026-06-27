# Target-Aware Evidence Capture Current-State Investigation

Status: complete investigation.

Date: 2026-06-27.

Task: V05-01.

## Executive Verdict

Current KRN evidence capture is strong for KRN worktree dirty-context reporting,
but it does not yet model target repo evidence as a first-class/readback-visible
proof boundary. The implementation can persist target evidence without a DB
migration because `evidence_bundles.metadata` is JSONB, but the current CLI,
domain/schema helpers, and run readback do not define or render target repo
mode, dirty state before/after, owned-vs-external changes, allowed/forbidden
writes, or target-specific proof/non-proof boundaries.

V05-02 should implement a minimal typed metadata-backed target evidence shape,
explicit CLI inputs, capture output, readback JSON/text rendering, and focused
tests. It should not run target git commands automatically in this first repair.

## Scope

Inspected:

- `packages/cli/src/parseEvidenceArgs.ts`
- `packages/cli/src/runEvidenceCaptureCommand.ts`
- `packages/cli/src/runRunShowCommand.ts`
- `packages/core/src/evidenceBundle.ts`
- `packages/schema/src/evidenceCapture.ts`
- `packages/db/src/schema/harness.ts`
- `packages/db/src/repositories/DrizzleHarnessRunRepository.ts`
- evidence capture and run readback tests
- `docs/runbooks/target-repo-testing.md`
- V04 target reports

Non-goals:

- no source behavior change in this investigation;
- no target repo reads/writes;
- no DB migration;
- no automatic target git runner;
- no V02-01 claim.

## Current Code Path Map

### CLI parse surface

`parseEvidenceArgs.ts` only exposes:

- `--run-id`
- `--persist`
- `--intended-file`
- `--verification`
- `--command`
- `--status`
- `--exit-code`
- `--output`

Evidence:

- usage string lists only current flags at
  `packages/cli/src/parseEvidenceArgs.ts:12`.
- `--intended-file` is repeatable at
  `packages/cli/src/parseEvidenceArgs.ts:131`.
- `--verification` stores operator-reported command evidence at
  `packages/cli/src/parseEvidenceArgs.ts:66`.

There is no `--target-repo`, `--target-mode`, `--target-dirty-before`,
`--target-dirty-after`, `--target-owned-changes`, or target changed-file input.

### Evidence capture runtime

`EvidenceCaptureRuntime` has `cwd`, `intendedFiles`, `commandOutcomes`, and
`readGitStatus`, but no target evidence input.

Evidence:

- runtime shape is in `packages/cli/src/runEvidenceCaptureCommand.ts:27`.
- default `readGitStatus` runs `git status --short` in `runtime.cwd` at
  `packages/cli/src/runEvidenceCaptureCommand.ts:84`.
- `runEvidenceCaptureCommand` always parses changed files from that one status
  output at `packages/cli/src/runEvidenceCaptureCommand.ts:636`.

This means capture sees the KRN repo worktree by default. It cannot represent a
dirty target checkout unless the operator encodes target facts indirectly in
command strings or report prose.

### KRN changed-file classification

KRN worktree classification is implemented and useful:

- changed files are grouped as `intended`, `unrelated`, and `unknown`;
- dirty-context text increases review burden when unrelated files exist;
- command proof remains separate from command execution.

Evidence:

- changed file classification type is in
  `packages/cli/src/runEvidenceCaptureCommand.ts:49`.
- capture output renders intended/unrelated/unknown at
  `packages/cli/src/runEvidenceCaptureCommand.ts:350`.
- dirty context is rendered at
  `packages/cli/src/runEvidenceCaptureCommand.ts:386`.
- review burden follows classification at
  `packages/cli/src/runEvidenceCaptureCommand.ts:398`.

This is KRN-repo evidence, not target-repo evidence.

### Persistence

Persistence currently writes:

- `changedFiles`;
- `commands`;
- `diffRisk`;
- `reviewBurden`;
- `rollbackPath`;
- `metadata.changedFileClassification`;
- `metadata.dirtyContext`.

Evidence:

- evidence bundle insert passes `changedFiles`, `commands`, and `metadata` at
  `packages/cli/src/runEvidenceCaptureCommand.ts:548`.
- DB schema stores `changed_files`, `commands`, and `metadata` as JSONB at
  `packages/db/src/schema/harness.ts:282`.
- repository insert preserves `metadata` at
  `packages/db/src/repositories/DrizzleHarnessRunRepository.ts:241`.

Conclusion: no DB migration is required for the first V05-02 slice if target
evidence is stored under a schema-validated metadata key.

### Core/schema model

Core has typed command provenance, but no typed target evidence shape.

Evidence:

- `EvidenceCommand` and provenance types are in
  `packages/core/src/evidenceBundle.ts:18`.
- `EvidenceBundle.metadata` is unstructured at
  `packages/core/src/evidenceBundle.ts:80`.
- schema validates command proof states and generic evidence capture input, but
  target evidence is not part of `EvidenceCaptureInputSchema` at
  `packages/schema/src/evidenceCapture.ts:176`.

V05-02 should add typed helpers for target evidence instead of leaving
behavior-governing target facts as undocumented metadata.

### Run readback

Run readback exposes KRN changed-file classification and commands, but no target
evidence resource.

Evidence:

- readback changed-files resource contains only `all` plus
  `classification` at `packages/cli/src/runRunShowCommand.ts:48`.
- readback extracts only `metadata.changedFileClassification` at
  `packages/cli/src/runRunShowCommand.ts:194`.
- text output prints changed file classification counts at
  `packages/cli/src/runRunShowCommand.ts:304`.
- JSON output maps `changedFiles` and `commands`, but no target evidence field,
  at `packages/cli/src/runRunShowCommand.ts:359`.

## Scenario Evidence

The gap is repeated/high-risk, not hypothetical.

Evidence:

- target runbook says KRN evidence capture currently records the KRN repo
  worktree by default and target commands must be labeled explicitly:
  `docs/runbooks/target-repo-testing.md:122`.
- target runbook requires reports to state when KRN EvidenceBundle does not
  classify target changed files:
  `docs/runbooks/target-repo-testing.md:135`.
- target runbook lists target-aware evidence capture as current high-value KRN
  repair:
  `docs/runbooks/target-repo-testing.md:163`.
- headless WILQ SEO target trial recorded that `krn evidence capture` persisted
  operator-reported target command evidence, but did not see target changed
  files because it ran in the KRN repo:
  `docs/reviews/controlled-dogfood/2026-06-27-headless-wilq-seo-target-trial/REPORT.md:131`.
- the same report lists missing target dirty-file classification as a weak or
  missing behavior:
  `docs/reviews/controlled-dogfood/2026-06-27-headless-wilq-seo-target-trial/REPORT.md:155`.
- the same report proposes a ready EvalCandidate for classifying target dirty
  files:
  `docs/reviews/controlled-dogfood/2026-06-27-headless-wilq-seo-target-trial/REPORT.md:192`.
- observation-only WILQ SEO boundary report repeats that KRN EvidenceBundle does
  not classify target dirty files unless recorded manually:
  `docs/reviews/controlled-dogfood/2026-06-27-wilq-seo-observation-boundary/REPORT.md:51`.

## Existing Model Can Represent Target Evidence?

Answer: partially.

Can represent today:

- target command outcomes can be encoded as operator-reported `--verification`
  strings;
- target evidence can be stored in `EvidenceBundle.metadata`;
- readback can retrieve the persisted metadata if code is added.

Cannot represent clearly today:

- target repo path/hint;
- target trial mode;
- target dirty state before/after;
- whether target changes are owned by the current KRN run;
- allowed/forbidden target writes;
- target changed files separated from KRN changed files;
- target evidence proof/non-proof boundaries in run readback;
- a stable JSON resource shape for target evidence.

## Desired Target Evidence Fields

Minimum V05-02 target evidence shape:

```ts
type TargetEvidenceMode =
  | "observation_only"
  | "headless_repair"
  | "real_second_operator"
  | "unknown";

type TargetDirtyState = "clean" | "dirty" | "unknown";

type TargetChangeOwnership =
  | "external"
  | "owned_by_current_krn_run"
  | "partial"
  | "unknown";

type TargetChangedFile = {
  status: string;
  path: string;
  ownership: TargetChangeOwnership;
};

type TargetEvidence = {
  targetRepo: string;
  mode: TargetEvidenceMode;
  dirtyBefore: TargetDirtyState;
  dirtyAfter: TargetDirtyState;
  ownedChanges: TargetChangeOwnership;
  allowedWrites: string[];
  forbiddenWrites: string[];
  changedFiles: TargetChangedFile[];
  commands: string[];
  doesNotProve: string[];
};
```

Naming may adjust during implementation, but the semantics should remain.

## Minimal V05-02 Implementation Slice

Recommended implementation:

1. Add typed target evidence helpers in `@krn/core` or `@krn/schema`:
   - parse/normalize target mode;
   - parse/normalize dirty state;
   - normalize target changed files;
   - default `doesNotProve`.
2. Add explicit CLI inputs to `krn evidence capture`:
   - `--target-repo <path-or-name>`;
   - `--target-mode observation-only|headless-repair|real-second-operator|unknown`;
   - `--target-dirty-before clean|dirty|unknown`;
   - `--target-dirty-after clean|dirty|unknown`;
   - `--target-owned-changes external|owned-by-current-krn-run|partial|unknown`;
   - repeatable `--target-changed-file "<status> <path>"`;
   - repeatable `--target-allowed-write <path-or-policy>`;
   - repeatable `--target-forbidden-write <path-or-policy>`.
3. Store normalized target evidence under:

   ```txt
   EvidenceBundle.metadata.targetEvidence
   ```

   Do this without migration unless implementation proves JSON metadata is
   insufficient.
4. Render target evidence in `krn evidence capture` text output:
   - target repo;
   - mode;
   - dirty before/after;
   - owned changes;
   - target changed files;
   - allowed/forbidden writes;
   - target proof/non-proof.
5. Render target evidence in `krn run show` text and JSON readback.
6. Add focused tests:
   - parse target evidence flags;
   - capture output renders target evidence and does-not-prove;
   - persisted metadata contains normalized target evidence;
   - run show text renders target evidence;
   - run show JSON includes target evidence.

Files likely touched:

- `packages/core/src/evidenceBundle.ts`
- `packages/schema/src/evidenceCapture.ts` if schema is the better owner
- `packages/cli/src/parseEvidenceArgs.ts`
- `packages/cli/src/runEvidenceCaptureCommand.ts`
- `packages/cli/src/runRunShowCommand.ts`
- `packages/cli/src/parseEvidenceArgs.test.ts`
- `packages/cli/src/runCli.test.ts`
- `packages/cli/src/runRunShowCommand.test.ts`
- `packages/cli/src/evidenceCaptureGoldenBehavior.test.ts` only if a golden
  guard is cheap and directly meaningful

Do not touch:

- DB migrations;
- target repos;
- activation scoring;
- reflection extraction;
- Memory Core mutation paths;
- dashboard/API/MCP/worker/runtime surfaces.

## Rejected Implementation Shapes

Rejected now:

- automatic target git execution inside `krn evidence capture`;
- hidden `git -C <target> status` behavior;
- a generic target repo scanner;
- a DB migration for first target evidence metadata;
- broad EvidenceBundle redesign;
- treating target command strings alone as enough target evidence;
- report-only continuation without V05-02.

Rationale: V05-02 should improve representation and readback first. Automatic
target execution can be considered later only if repeated operator friction
proves explicit inputs are too weak.

## What This Proves

- Current capture/readback lacks target-aware evidence representation.
- Existing DB schema can carry first target evidence via metadata.
- V05-02 has a small implementation path.
- The target evidence gap is repeated in V04 target reports.

## What This Does Not Prove

- Product readiness.
- V02-01 real second-operator usability.
- That automatic target git status capture is required.
- That target repos are safe to write.
- That activation, reflection, memory, or source quality improved.
- That a DB migration will never be needed.

## Condensation Decision

```txt
finding:
  KRN EvidenceBundle/readback separates KRN dirty files, but not target repo
  evidence and target dirty state.

frequency:
  repeated/high-risk.

candidate_surface:
  bounded source repair + deterministic guard.

decision:
  accept V05-02 implementation.

rationale:
  Target trials currently need report prose to explain a core proof boundary.
  Evidence/readback should carry that boundary directly.

evidence:
  runbook target evidence rule;
  WILQ SEO headless target report;
  WILQ SEO observation-only boundary report;
  current CLI/core/schema/readback code.

does_not_prove:
  product readiness, V02-01, or target correctness.

falsifier:
  V05-02 implementation discovers that a stable target evidence shape already
  exists and is rendered in capture/readback.

next_task_id:
  V05-02.
```

## Commands Run

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `rtk git fetch --prune` | passed | Local remote refs were refreshed. | Does not prove CI state for future commits. |
| `rtk git status --short --branch` | passed, clean before edits | Worktree was clean before V05-01 report work. | Does not prove source behavior. |
| `rtk git log --oneline -n 8` | passed | Latest local commit was inspected. | Does not prove completeness. |
| `rtk sed` / `rtk nl` / `rtk rg` code and report inspections | passed | Current code/report paths were inspected for this investigation. | Does not prove implementation exists. |
| `rtk proxy pnpm typecheck` | passed | Workspace TypeScript still compiles after docs/plan update. | Does not prove V05-02 implementation. |
| `rtk proxy git diff --check` | passed | Current V05-01 diff has no whitespace errors. | Does not prove semantic completeness beyond this report slice. |
