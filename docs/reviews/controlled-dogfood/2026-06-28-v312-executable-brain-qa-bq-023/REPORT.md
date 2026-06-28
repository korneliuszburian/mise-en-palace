# V312 Executable Brain-QA Case BQ-023

Status: complete docs/readback slice.

Date: 2026-06-28.
DB used: no.

## Executive Verdict

BQ-023 is executable through the existing `krn evidence capture` CLI preview and
domain normalization tests. The operator-facing path distinguishes
`operator_reported`, `captured_output_file`, and weak `default_template/not_run`
command rows, keeps proof/non-proof boundaries visible, and states that evidence
capture records supplied outcomes without running shell commands.

## Question

```txt
Does command evidence distinguish operator-reported, captured output, runner,
default template, missing, and not-run states?
```

## Evidence Readback

Commands run:

```sh
rtk pnpm --filter @krn/cli krn evidence capture
rtk pnpm --filter @krn/cli krn evidence capture --verification "pnpm typecheck=passed" --verification "pnpm test=failed"
rtk pnpm --filter @krn/cli krn evidence capture --command "pnpm typecheck" --status passed --exit-code 0 --output .local-lab/bq-023/typecheck.txt --command "pnpm test" --status missing
```

Observed readback:

| State | Evidence | Readback |
|---|---|---|
| default template | no command evidence supplied | `pnpm typecheck: not_run | provenance=default_template` |
| not run | no command evidence supplied | default rows render `not_run` |
| operator reported | `--verification "pnpm typecheck=passed"` | `provenance=operator_reported` |
| operator reported failure | `--verification "pnpm test=failed"` | `provenance=operator_reported` |
| captured output file | `--command ... --output .local-lab/bq-023/typecheck.txt` | `provenance=captured_output_file`, `exitCode=0`, `output=...` |
| missing without proof | `--command "pnpm test" --status missing` without output/proof fields | normalized to weak `default_template/not_run` |

All preview outputs included:

```txt
Command execution: none (evidence capture records supplied outcomes; it does not run shell commands).
```

Weak default rows also included:

```txt
Command provenance is weak: default_template rows are not proof that commands ran.
```

## Existing Coverage

Relevant existing tests:

```txt
packages/cli/src/runCli.test.ts
packages/cli/src/evidenceCaptureGoldenBehavior.test.ts
packages/core/src/evidenceBundle.test.ts
packages/schema/src/index.test.ts
```

Coverage observed:

- CLI preview covers weak default `not_run` rows and weak-provenance warning.
- CLI preview covers `operator_reported` outcomes from `--verification`.
- CLI preview covers `captured_output_file` outcomes from `--command ... --output`.
- Core normalization covers `command_runner` only when runner proof fields exist.
- Core normalization rejects weak `default_template` rows becoming passed proof.
- Schema tests preserve captured output provenance and default-template
  normalization.

No new test was added in this slice because the current readback path and
existing coverage already exercise the BQ-023 operator-facing states. The
non-operator-facing `command_runner` state remains a domain normalization path,
not a public `krn evidence capture` input.

## Pattern Usefulness

| Pattern | Outcome | Why |
|---|---|---|
| `pattern:evidence-proof-non-proof-boundary` | helped | V312 explicitly checked that every command result renders `doesNotProve` or weak-provenance limits. |
| `pattern:active-context-compact-current-truth` | helped | Work resumed from current V312 root state after compaction without rolling back to stale pasted objectives. |

## Proof Boundaries

What this proves:

- BQ-023 can be executed through current CLI preview without a new runtime,
  schema, dashboard, API/MCP, source crawler, graph work, or broad eval
  platform.
- Evidence capture distinguishes operator-reported outcomes from weak default
  template rows and captured-output rows.
- Weak command rows are not represented as proof that commands ran.
- Missing command proof without output/provenance is normalized to weak
  default-template/not-run evidence.

What this does not prove:

- commands actually ran;
- DB persistence or replay for this V312 run;
- reviewer correctness;
- product readiness;
- command-runner execution through the CLI;
- full benchmark quality.

## Mutation Boundary

Memory mutation: none.

No Memory Core, source graph, DB schema, activation, reflection, worker, API, or
MCP behavior was changed.

## Next Action

Move to BQ-024 as the next docs/CLI-only mini brain-QA case:

```txt
BQ-024: Does evidence capture classify intended/unrelated/unknown changed files?
```

This should reuse the existing dirty-context evidence surface and avoid new
runtime/platform work.
