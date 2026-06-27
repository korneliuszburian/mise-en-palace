# V51 Second Continuous Pattern Gate Selection

Status: complete.

Date: 2026-06-27.

## Executive Verdict

V51 selects the second bounded Continuous Pattern Gate application:

```txt
Add `pnpm eval:brain-battle:smoke` to GitHub Actions CI.
```

This is not a broad eval platform and not a research archive. It is a bounded
CI/eval surface repair: the repo already treats brain-battle smoke as
deterministic behavior-gate evidence, while current CI runs typecheck, tests,
Promptfoo smoke, DB readiness, DB smoke, and diff check.

## Gate Output

Selected surface:

```txt
CI / release / eval / Promptfoo
```

Source:

```txt
Local repo evidence:
- `package.json` defines `eval:brain-battle:smoke`.
- prior reports repeatedly classify brain-battle smoke as deterministic KRN
  behavior proof and Promptfoo smoke as adapter evidence.
- `.github/workflows/ci.yml` currently runs Promptfoo smoke but not
  brain-battle smoke.
```

Mechanism:

```txt
Promptfoo smoke proves adapter/config/result mapping. Brain-battle smoke runs
the deterministic KRN behavior guards around golden behavior, run readback, CLI,
and Codex brief behavior. CI should execute both classes if it already claims
eval smoke coverage.
```

KRN implication:

```txt
CI should not rely on Promptfoo adapter smoke alone where deterministic KRN
behavior smoke exists and is cheap enough to run.
```

Decision:

```txt
adopt bounded CI workflow repair
```

Consumer:

```txt
.github/workflows/ci.yml
```

Falsifier:

```txt
The post-push KRN CI run fails or the new `Brain-battle smoke` step is not
executed.
```

Does not prove:

```txt
This does not prove product readiness, V02-01 second-operator usability,
arbitrary target quality, or broad eval-platform readiness.
```

## Local Verification Before Selection

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm eval:brain-battle:smoke` | passed | The candidate CI step currently passes locally and is cheap enough for bounded CI consideration | GitHub-hosted CI success or product readiness |

## Selected Next Task

```txt
V52 — Add Brain-Battle Smoke To CI
```

V52 should add one CI step and let the post-push GitHub Actions run falsify the
decision.
