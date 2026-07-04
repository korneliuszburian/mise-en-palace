# Post-Dogfood Kernel Roadmap Synthesis

Bead: `mise-en-palace-ymiz`

## Context

The ready queue was empty after:

- `mise-en-palace-ezbm`: DB-backed brain search smoke;
- `mise-en-palace-6bdg`: retained pattern usefulness evidence gate;
- `mise-en-palace-d09u`: source artifact preview extraction churn rejected by
  code evidence.

CI run `28693081524` passed both lanes:

- typecheck, tests, Fallow, `eval:krn:smoke`, diff check;
- DB readiness/smoke including brain-loop, brain-search, run-show, worker-jobs,
  and source-graph smokes.

## Second Opinion

Ran `second-opinion-claude` with a strategic roadmap prompt:

```txt
.local-lab/second-opinion/post-dogfood-kernel-roadmap/claude.json
verdict: approve_with_fixes
risk: LOW
```

The review rejected worker daemon, skill-package churn, product UI/API/MCP,
naming pass, and broad CLI refactor as next work because the supplied current
state did not prove they outrank brain/retrieval quality measurement.

## Created Beads

```txt
mise-en-palace-myf7  P1  Brain ranking quality eval across query shapes
mise-en-palace-djl0  P1  Source graph hybrid ranking eval across corpora
mise-en-palace-q71d  P2  Audit behavior gate coverage for live kernel primitives
mise-en-palace-5mso  P3  Add live-vs-deprecated primitive ledger
```

## Decision

Start with `mise-en-palace-myf7` unless CI or Beads ordering changes. It is the
closest continuation of the kernel law: make the brain's selection quality
measurable across query shapes before adding new surfaces.

## Proof Boundary

Proves:

- next work was selected after green CI and an empty Beads queue;
- Claude produced concrete Beads-ready priorities;
- Codex rejected broad decorative work in favor of measured brain/retrieval
  quality.

Does not prove:

- the proposed eval metrics are optimal;
- ranking quality is already good;
- the four created Beads are exhaustive;
- product readiness.
