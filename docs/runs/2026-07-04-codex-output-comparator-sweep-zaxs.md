# Codex Output Comparator Sweep

Bead: `mise-en-palace-zaxs`

## Change

`pnpm eval:codex-output-comparator` now sweeps every memory-advantage prompt
through two deterministic comparison variants:

- no-memory baseline vs KRN-grounded output evidence;
- simple-retrieval baseline vs KRN-grounded output evidence.

Current readback:

- source prompts: 17
- comparison cases: 34
- passed comparisons: 34
- baseline missing-evidence failures: 34
- KRN valid evidence-shape outputs: 34
- selected-content/proxy deltas: 26
- execution-contract comparisons: 3
- changed execution contracts: 2
- advantage prompt counts: 11 win, 4 neutral, 2 loss
- comparison counts: 22 win, 8 neutral, 4 loss

The four loss comparisons are labeled `loss_reported`; the four
`krn_refuses_harmful_retrieval` comparisons are separate useful-abstention
cases where KRN refused harmful retrieval instead of inflating wins.

Each comparison reports:

- `comparisonId`
- `baselineKind`
- selected baseline and KRN knowledge ids
- explicit `usefulnessLabel`
- `contentDelta`
- `contractSource`
- selected-context size
- exclusions
- evidence-shape validation result

## Proof

- The comparator no longer only covers two execution-contract cases.
- Neutral/no-advantage prompts remain visible as `baseline_already_sufficient`
  instead of being counted as KRN wins.
- Execution-contract cases are separated from selection-proxy comparisons, so
  proxy selected-content changes are not counted as changed execution
  contracts.
- Baseline output proxies fail the shared evidence-shape validator because they
  claim KRN context use without evidence refs.
- KRN output proxies include prior-session evidence refs, verification, changed
  files, `doesNotProve`, and selected memory/source ids when retrieval
  contributed context.

## Non-Proof

- Does not prove live Codex execution.
- Does not prove Codex followed a rendered brief.
- Does not prove LLM output quality.
- Does not prove production retrieval quality.
- Does not prove source truth or product readiness.

## Verification

```sh
pnpm --filter @krn/cli test -- codexOutputComparatorEval memoryAdvantageEval
pnpm eval:codex-output-comparator
pnpm run typecheck
pnpm quality:fallow:ci
pnpm eval:krn:smoke
pnpm docs:lint
git diff --check
```

## Second Opinion

`second-opinion-claude` R1 returned `approve_with_fixes` / MEDIUM. Accepted
fixes:

- label `loss` cases before the no-memory/KRN-hit shortcut so loss comparisons
  cannot become `krn_adds_missing_evidence`;
- add structural test coverage for a `loss_reported` comparison;
- clarify loss labels versus useful `krn_refuses_harmful_retrieval` refusals.

R2 produced a validator failure because Claude's `summary` exceeded the schema
limit, so it is not a governed verdict. Its invalid verdict still contained
evidence-backed LOW notes; accepted fixes:

- qualify proof wording so KRN output proxies claim prior-session evidence refs
  plus selected memory/source ids only when retrieval contributed context;
- remove the unexercised `no_advantage_reported` label/branch.
