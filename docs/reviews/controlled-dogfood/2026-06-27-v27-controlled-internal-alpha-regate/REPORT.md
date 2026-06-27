# V27 Controlled Internal Alpha Re-Gate After Target Loop Repairs

Status: completed readiness re-gate.

Date: 2026-06-27
Evaluator: Codex
KRN repo: `/home/krn/coding/krn/active/mise-en-palace`

## Executive Verdict

KRN remains **controlled-internal-alpha for technical operators: yes / stronger**.

KRN is still:

```txt
product-ready: no
widened internal alpha: no
V02-01 real second-operator proof: blocked/deferred
```

V20 through V26 materially improved the target loop. KRN can now run a
current-shell DB-backed, observation-only target workflow with explicit owner
files, safe target evidence defaults, readable run readback, no target writes,
and lower CLI friction. That is a stronger internal engineering proof.

It is not enough to claim second-operator usability or product readiness.

## Evidence Reviewed

| Slice | Evidence | Verdict |
|---|---|---|
| V20 | Real target observation-only trial | Proved safe target checkout can be used without writes. |
| V21 | Target evidence defaults/readback repair | Proved observation-only mode has safe default write boundaries. |
| V22 | Persisted CLI DB recovery guidance | Reduced DB setup friction without hidden default mutation. |
| V23 | Real target rerun after V21/V22 | Proved defaults in real target workflow; exposed owner-file precision gap. |
| V24 | Owner-file priority source repair | Proved explicit owner files outrank covered seeds/adjacent guidance. |
| V25 | Real target rerun after V24 | Proved repaired owner-file priority in full observation-only target loop. |
| V26 | CLI run/target-none ergonomics | Repaired repeated command-friction items from V24/V25. |

Remote CI:

```txt
8bf1159 fix(activation): prioritize target owner files — passed
b847df6 docs(target): rerun after owner-file priority repair — passed
fe13efd fix(cli): smooth run evidence ergonomics — passed
```

## What Is Now Strong

- DB-backed plan/evidence/observe/reflect/readback loop.
- Target observation-only safety boundary.
- Target evidence proof/non-proof boundaries.
- Explicit owner-file read model.
- Owner-file priority over duplicate/adjacent guidance.
- CLI ergonomics for repeated dogfood loops.
- Continuous plan condensation after each slice.

## What Remains Unproved

- A real second operator can run KRN without author help.
- KRN is product-ready.
- Widened internal alpha should start.
- Target runtime correctness beyond bounded commands.
- Activation is generally strong outside the owner-file read-model case.
- Research-to-brain decisions consistently improve future code.

## Readiness Decision

```txt
controlled-internal-alpha for technical operators: yes / stronger
product-ready: no
widened internal alpha: no
V02-01 real second-operator proof: blocked/deferred until real operator inputs exist
```

Reason:

The target loop is now coherent enough for technical self-dogfood and controlled
operator-supervised work, but the product still lacks a real second-operator
transcript and broader target diversity.

## Next Recommended Action

Promote:

```txt
V28 — Research-To-Brain TypeScript/Codex Decision Trial
```

Why:

The target loop repair batch is done. The next self-improving loop should test
whether KRN can ingest external/source knowledge and convert it into concrete
KRN decisions, falsifiers, skills, standards, or eval candidates without source
hoarding.

The trial should use the existing source-to-decision rule:

```txt
source -> mechanism -> KRN implication -> decision/rejection -> falsifier
```

Candidate sources:

- official OpenAI Codex docs / Cookbook guidance;
- KRN local standards;
- TypeScript boundary material such as Total TypeScript / Matt Pocock-style
  discipline;
- selected research papers only if they map to an implementable KRN decision.

Non-goal:

Do not build a Research Foundry, crawler, dashboard, MCP server, broad eval
platform, or new memory subsystem.
