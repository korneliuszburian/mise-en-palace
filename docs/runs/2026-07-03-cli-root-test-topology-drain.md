# CLI Root Test Topology Drain

Date: 2026-07-03

## Summary

This slice drained CLI root-level test clutter into `packages/cli/src/__tests__/`.

Before this overnight batch, `packages/cli/src` still had large colocated tests after the earlier monolith split. After this slice:

```txt
packages/cli/src/*.test.ts: 0
packages/cli/src/__tests__/**/*.test.ts: 55
```

The migration preserved test basenames so existing Vitest filters remain usable. Most changes were path-only moves. The only non-import proof updates were current evidence references for:

- `packages/cli/src/__tests__/evidenceCaptureGoldenBehavior.test.ts`
- `packages/cli/src/__tests__/runRunShowCommand.test.ts`

Historical review ledgers were intentionally left untouched.

## Commits

```txt
8749b21 test(cli): move knowledge cards coverage
32b94ce test(cli): move brain search coverage
0be50f8 test(cli): move source search coverage
ef6c430 test(cli): move source parser coverage
664c0a3 test(cli): move memory and evidence parser coverage
e812906 test(cli): move knowledge parser coverage
c120992 test(cli): move remaining parser coverage
7aa3b0b test(cli): move observe and reflect command coverage
82efbc6 test(cli): move doctor coverage
cb1e7f4 test(cli): move support and smoke coverage
9f3b5e6 test(cli): move target repo skill coverage
23760d5 test(cli): move evidence golden coverage
671e209 test(cli): move run show coverage
```

Each code slice was pushed before Beads closure metadata.

## Verification

Focused local gates were run per slice:

```txt
pnpm --filter @krn/cli test -- <moved test filters>
pnpm -C packages/cli typecheck
pnpm quality:fallow:ci
git diff --check
```

Run-show proof-reference migration additionally ran:

```txt
pnpm --filter @krn/harness test -- brainBattleMatrixInvariants
pnpm eval:brain-battle:smoke
pnpm -r --workspace-concurrency=1 --if-present typecheck
```

GitHub Actions passed on the relevant code checkpoints, including:

```txt
28628255220  ef6c430  success
28628433744  e812906  success
28628579391  c120992  success
28628717435  7aa3b0b  success
28628852391  82efbc6  success
28629022808  cb1e7f4  success
28629150299  9f3b5e6  success
28629264837  23760d5 success
28629440375  671e209 success
```

## Proof

This proves:

- CLI root test files were drained into `packages/cli/src/__tests__/`.
- Focused moved-test filters still run.
- CLI typecheck still passes for runtime source.
- Current brain-battle proof references for run-show readback use the new path.
- Current evidence-capture golden proof refs use the new test path.

## Non-Proof

This does not prove:

- test files are covered by package `tsconfig.json`; package typecheck still excludes `*.test.ts`;
- assertion-for-assertion equivalence by a generated manifest;
- any runtime behavior improvement;
- CLI command parser/handler complexity is fixed;
- `runSourceArtifactPreviewCommand.ts`, `runRunShowCommand.ts`, or other large runtime files are simpler.

## Remaining Gaps

The next highest-value cleanup should be selected by fresh evidence, not by continuing topology mechanically. Current known candidates:

- add a test-typecheck lane or scoped `tsconfig.test.json` if stale imports keep recurring;
- split large runtime command files only with behavior-preserving tests and clear ownership;
- reduce `codexAdapterSmoke.ts` ceremony only if the result improves adapter-boundary proof rather than moving fixture mass elsewhere;
- keep source/decision authority surfaces higher priority than naming cleanup if new authority leaks appear.

## Second-Opinion Prompt

```txt
You are reviewing the current state of korneliuszburian/mise-en-palace after
the CLI root test topology drain.

Inspect the current repo state, not just this report.

Questions:
1. Is packages/cli/src now genuinely free of root-level *.test.ts clutter?
2. Did moving tests into packages/cli/src/__tests__/ preserve current Vitest
   filters, especially eval:brain-battle:smoke and evidenceCaptureGoldenBehavior?
3. Are any evidence/proof paths now stale outside intentionally historical docs?
4. Is the remaining risk mainly test typecheck exclusion, runtime command size,
   or another authority-boundary issue?
5. What is the next bounded slice with the best senior-grade ROI?

Reject:
- broad CLI rewrite;
- naming vanity;
- dashboard/API/MCP/worker daemon expansion;
- moving historical docs only to make grep look clean.

Return:
- findings ordered by severity;
- delete/rename/leave decisions;
- proof/non-proof of the topology drain;
- one next bounded implementation slice with exact files and verification.
```
