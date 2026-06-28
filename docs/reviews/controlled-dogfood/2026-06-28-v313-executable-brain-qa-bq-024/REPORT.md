# V313 Executable Brain-QA Case BQ-024

Status: complete docs/readback slice.

Date: 2026-06-28.
DB used: no.

## Executive Verdict

BQ-024 is executable through the existing evidence capture golden behavior and
CLI tests. The current readback path distinguishes intended, unrelated, and
unknown changed files, emits dirty-context warnings, and keeps command proof
separate from changed-file classification.

## Question

```txt
Does evidence capture classify intended/unrelated/unknown changed files?
```

## Evidence Readback

Command run:

```sh
rtk pnpm --filter @krn/cli test -- evidenceCaptureGoldenBehavior runCli
```

Result:

```txt
32 test files passed
218 tests passed
```

The targeted test run covers:

- `packages/cli/src/evidenceCaptureGoldenBehavior.test.ts`
- `packages/cli/src/runCli.test.ts`
- `tests/fixtures/golden-tasks/evidence-capture-behavior.json`

Observed behavior from the existing tests:

| State | Evidence | Readback |
|---|---|---|
| intended files | `--intended-file` entries match changed files | `Changed files:\nintended:` |
| unrelated files | changed file not listed as intended | `unrelated:\n- ?? docs/materials/raw-audit.md` |
| unknown files | no `--intended-file` supplied | `Changed files:\nunknown:` |
| dirty-context warning | unrelated file present | `Dirty context: unrelated files present; review burden increased.` |
| unclassified warning | no intended-file input | `Dirty context: unclassified (no --intended-file provided).` |
| command proof separation | explicit verification supplied | `pnpm typecheck: passed | provenance=operator_reported` |
| weak default proof | no verification supplied | `Command provenance is weak: default_template rows are not proof that commands ran.` |

## Existing Coverage

Relevant coverage is already present:

```txt
packages/cli/src/evidenceCaptureGoldenBehavior.test.ts
packages/cli/src/runCli.test.ts
tests/fixtures/golden-tasks/evidence-capture-behavior.json
```

Coverage observed:

- real CLI execution separates intended and unrelated dirty files;
- package-relative and repo-root paths are normalized before rendering;
- unrelated raw material stays visible as review burden;
- missing `--intended-file` keeps changed files unknown;
- default command rows remain weak proof;
- target-repo evidence is rendered separately from KRN changed files.

No new test was added in this slice because BQ-024 is already protected by a
golden behavior fixture and focused CLI assertions.

## Pattern Usefulness

| Pattern | Outcome | Why |
|---|---|---|
| `pattern:evidence-proof-non-proof-boundary` | helped | The readback keeps dirty context, command proof, and proof limits separate. |
| `pattern:active-context-compact-current-truth` | helped | Work resumed from current V313 root state and did not reopen historical plans. |

## Proof Boundaries

What this proves:

- BQ-024 can be executed through current CLI/golden behavior without a new
  runtime, schema, dashboard, API/MCP, source crawler, graph work, or broad eval
  platform.
- Evidence capture can distinguish intended, unrelated, and unknown changed
  files.
- Dirty-context warnings are visible when unrelated or unclassified files exist.
- Existing tests would fail if the guarded CLI readback stopped showing these
  classes.

What this does not prove:

- review judgment is correct;
- every possible path normalization edge case is covered;
- DB persistence or replay for this V313 run;
- product readiness;
- full benchmark quality.

## Mutation Boundary

Memory mutation: none.

No Memory Core, source graph, DB schema, activation, reflection, worker, API, or
MCP behavior was changed.

## Next Action

Move to BQ-025 as the next docs/CLI-only mini brain-QA case:

```txt
BQ-025: Does every proof in a report state what it does not prove?
```

This should inspect recent reports and current report templates without adding
a new runtime/platform.
