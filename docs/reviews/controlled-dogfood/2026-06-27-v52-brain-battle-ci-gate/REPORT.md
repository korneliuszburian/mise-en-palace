# V52 Add Brain-Battle Smoke To CI

Status: complete pending CI result.

Date: 2026-06-27.

## Executive Verdict

V52 implements the V51 selected Continuous Pattern Gate application by adding
one CI step:

```txt
Brain-battle smoke
```

The step runs:

```sh
pnpm eval:brain-battle:smoke
```

This keeps Promptfoo smoke as adapter evidence and adds deterministic KRN
behavior smoke as CI evidence.

## Changed

```txt
.github/workflows/ci.yml
```

Added in the `Typecheck, tests, and eval smoke` job after `Test` and before
`Promptfoo smoke`.

## Source-To-Decision Mapping

Source:

```txt
V51 report and local `pnpm eval:brain-battle:smoke` pass.
```

Mechanism:

```txt
Brain-battle smoke runs deterministic KRN behavior guards that are distinct
from Promptfoo adapter smoke.
```

Decision:

```txt
Run brain-battle smoke in CI.
```

Consumer:

```txt
.github/workflows/ci.yml
```

Falsifier:

```txt
The post-push KRN CI run fails or the `Brain-battle smoke` step does not run.
```

Does not prove:

```txt
Product readiness, V02-01, arbitrary target quality, full brain quality, or
broad eval-platform readiness.
```

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm eval:brain-battle:smoke` | passed before implementation | Candidate step currently passes locally | GitHub-hosted CI success |
| `git diff --check` | passed | Workflow/report/plan diff has no whitespace errors | CI success |
| post-push GitHub Actions CI | pending | New CI step works in GitHub-hosted CI when passed | Product readiness |

## Next Required Step

V53 must consume the post-push CI result before unrelated work starts.
