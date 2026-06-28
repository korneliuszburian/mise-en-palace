# V272 Brain Knowledge UI/Search Readiness Gate

Status: complete.

Date: 2026-06-28

## Executive Verdict

Proceed, but only with a self-contained read-only HTML preview generated from
the existing `krn knowledge cards` resource.

Do not add a dashboard package, API, MCP server, DB schema, ranking engine,
crawler, or mutation path. The smallest useful UI/search surface is:

```txt
krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --html
```

The HTML output should embed the same typed card resource already used by text
and JSON preview, then provide client-side text filtering over those cards. This
gives operators a local web search/readback view without introducing product
server architecture.

## Scope

Inspected:

- root `package.json`;
- `pnpm-workspace.yaml`;
- package topology under `packages/*`;
- `docs/architecture/observability-read-models.md`;
- `docs/decisions/ADR-0025-dashboard-readiness-gate.md`;
- `docs/architecture/cli-surfaces.md`;
- `packages/harness/src/brainKnowledgeReadModelInvariants.test.ts`;
- current `krn knowledge cards` behavior.

Repo topology finding:

```txt
No web/app package exists. Current workspace packages are CLI, core, schema,
harness, workers, codex-adapter, and DB.
```

## Readiness Assessment

Ready:

- `BrainKnowledgeReadModel` defines a read-only card contract;
- invariants protect source refs, evidence refs, consumer, falsifier,
  reviewability, temporal/dissent, next action, and does-not-prove fields;
- `krn knowledge cards` already emits a read-only JSON resource;
- catalog readback supports multiple retained pattern cards;
- skill-routed catalog readback works from natural package cwd after V271.

Not ready:

- dashboard package;
- API server;
- MCP server;
- DB-backed knowledge search;
- ranking engine;
- source crawler;
- mutation or review actions from UI.

## Decision

Authorize the next bounded implementation:

```txt
V273-00 Brain Knowledge Self-Contained HTML Search Preview
```

Implementation boundary:

```txt
existing CLI command
  -> same BrainKnowledgeReadModel resource
  -> --html output
  -> local self-contained read-only search page
```

Rejected alternatives:

- new web package now;
- API route to serve knowledge cards;
- DB-backed search;
- framework-based dashboard;
- ranking engine;
- UI write actions.

## Source-To-Decision

- Source: V260 BrainKnowledgeReadModel, V261 contract guard, V264/V267 CLI
  preview, V269 catalog guard, V270 skill hook, V271 path repair,
  ADR-0025 dashboard readiness gate.
- Mechanism: UI/search should render typed read-only cards only after CLI
  readback and proof boundaries are stable.
- KRN implication: a self-contained HTML CLI output provides useful operator
  search without prematurely creating product architecture.
- Decision: proceed with `--html` on `krn knowledge cards` as the next slice.
- Does not prove: product readiness, ranking quality, DB-backed knowledge,
  broad pattern coverage, or multi-user UI readiness.
- Consumer: V273 self-contained HTML search preview.
- Falsifier: the HTML preview hides proof/non-proof boundaries, mutates memory
  or source truth, requires a server/API, or cannot filter cards locally.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `git status --short --branch` | clean before V272 | V272 started from clean pushed state. | Does not prove future implementation correctness. |
| `pnpm --filter @krn/cli krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --text unknown-first --json` | previously passed after V271 | Typed JSON resource exists and is root-path usable. | Does not prove UI readiness by itself. |
| `sed/read package and architecture docs` | passed | Current topology has no web package and read-model/ADR boundaries are explicit. | Does not prove a generated HTML preview will be ergonomic. |

## Next Recommended Action

Proceed to:

```txt
V273-00 Brain Knowledge Self-Contained HTML Search Preview
```

Add `--html` to `krn knowledge cards`, using the existing resource shape as the
single data source. The output must be self-contained, read-only, local, and
must visibly preserve proof/non-proof boundaries.
