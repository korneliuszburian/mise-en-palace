# Read-Only Run Readback Boundary Report

Status: F-00 completion report.

Date: 2026-06-25

## Executive Verdict

F-00 did not build an MCP server or HTTP API. It implemented the smallest
read-only typed external boundary over existing persisted run state:

```txt
krn run show --run-id <execution-run-id> --json
```

The output is a typed `krn.run.readback.v1` JSON resource with `access:
read_only` and `mutation: none`. It lets external consumers read run summaries
without ad hoc SQL or terminal-text parsing while preserving Memory Core and
source-decision write boundaries.

## Scope

Changed:

- `packages/cli/src/parseRunArgs.ts`;
- `packages/cli/src/parseRunArgs.test.ts`;
- `packages/cli/src/parseArgs.ts`;
- `packages/cli/src/runCli.ts`;
- `packages/cli/src/runRunShowCommand.ts`;
- `packages/cli/src/runRunShowCommand.test.ts`;
- `docs/decisions/ADR-0023-read-only-run-readback-boundary.md`;
- `docs/reviews/controlled-dogfood/2026-06-25-read-only-run-readback-boundary/REPORT.md`;
- `PLAN.md`;
- `GOAL.md`.

Not changed:

- DB schema;
- repository adapters;
- Memory Core;
- source decision mutation;
- review gates;
- MCP server;
- HTTP API;
- dashboard;
- worker runtime.

## Implementation

`krn run show --json` returns:

```txt
kind: krn.run.readback.v1
access: read_only
mutation: none
```

The resource includes:

- run status and adapter;
- task title/objective/status;
- context inclusion/exclusion counts;
- evidence changed-file classification;
- command status/provenance/doesNotProve;
- review assessment status;
- feedback candidate counts;
- candidate reviewability and reasons where persisted;
- proof and does-not-prove boundaries.

Text output remains the default.

## Live DB Readback

F-00 run:

```txt
executionRun: 5656af12-b8df-4cf2-8578-656506c33211
taskContract: a3365a5d-ffc0-41da-9d5b-7af49139bb6d
harnessPlan: 2fb5c742-78c7-47c4-b8b8-8e88b8540cc7
contextAssembly: 21993d3e-55ac-412a-b772-c2175f7579d4
```

Command:

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn run show --run-id 150d5cb2-cace-4146-9251-eb946c82a1e1 --json
```

Result:

```txt
kind: krn.run.readback.v1
access: read_only
mutation: none
changedFileClassification.source: metadata
command provenance: operator_reported
candidate reviewability: too_vague
```

Self-readback after evidence capture:

```txt
executionRun: 5656af12-b8df-4cf2-8578-656506c33211
evidenceBundle: 2d939f0f-3dc5-4981-9c16-92eff77e9896
reviewAssessment: 625ba760-84dc-4432-9fa4-482df8d885ce
feedbackDelta: 722e7f04-b344-4f4f-998d-ac6de4828723
observationGroup: c6b27488-1f99-402c-a55e-d81d5b21c19f
reflectionRecord: 3f6618fc-5614-4a5f-9af6-569851dfead0
Memory mutation: none
MemoryRecord created: no
```

## Command Evidence

| Command | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `pnpm db:ready` | passed | Current shell can reach Postgres, 14/14 migrations are applied, and pgvector is available. | Does not prove remote/CI DB state. |
| `pnpm --filter @krn/cli test -- parseRunArgs runRunShowCommand` | passed | Parser and run readback JSON/text behavior are covered by tests. | Does not prove live DB state. |
| `pnpm --filter @krn/cli typecheck` | passed | CLI types compile with the JSON readback resource. | Does not prove full workspace health. |
| `krn run show --run-id 150d5cb2... --json` | passed | Current shell can read persisted DB run state as typed JSON without write authority. | Does not execute commands, mutate memory, or prove product readiness. |
| `pnpm typecheck` | passed | Full workspace typecheck passes. | Does not prove runtime/product behavior. |
| `pnpm test` | passed | Full workspace tests pass. | Does not prove external integration readiness. |
| `git diff --check` | passed | Diff has no whitespace errors. | Does not prove semantic correctness. |
| `krn evidence capture --run-id 5656af12... --persist` | passed | F-00 evidence, review assessment, feedback delta, command provenance, and changed-file classification were persisted. | Does not prove product readiness or command execution by KRN. |
| `krn observe --run 5656af12... --persist` | passed | F-00 observation staging was persisted without Memory Core mutation. | Does not prove final memory truth. |
| `krn reflect --scope run:5656af12... --persist` | passed | F-00 reflection record was persisted without MemoryRecord creation or candidate row writes. | Does not prove reflection extraction quality. |

## Dogfood Brain Usefulness Section

### Brain Usefulness Summary

Brain ROI:
- positive

Overall verdict:
- KRN helped keep F-00 from becoming an MCP/API build. The useful product move
  was a typed read-only boundary over existing run readback.

What this run proves:
- External consumers can read a persisted run summary as JSON without direct DB
  access or terminal-text parsing.
- The new surface exposes no write action and carries proof boundaries.

What this run does not prove:
- MCP server readiness;
- HTTP API readiness;
- dashboard readiness;
- production deployment;
- Memory Brain product readiness.

DB used in current shell:
- yes.

### Activated Context Usefulness

| Item | Type | Used? | Helped? | Notes |
| --- | --- | --- | --- | --- |
| F-00 plan task | plan | yes | helped | Scoped the work to read-only external boundary proof. |
| D-02 run readback report | report | yes | helped | Showed existing readback command was the right owner surface. |
| E-00 trust-boundary review | report | yes | helped | Kept write endpoints and MCP/API creep out of scope. |
| Current CLI source inspection | source | yes | helped | Identified parser/runtime/renderer owner files. |

### Evidence And Review Burden

| Evidence item | Strength | What it proves | Review burden impact |
| --- | --- | --- | --- |
| Targeted CLI tests | strong | Text and JSON readback behavior are covered. | reduced |
| Live DB readback JSON | strong | Current shell can read persisted state as typed JSON. | reduced |
| Full workspace verification | strong | Workspace still passes after the CLI change. | reduced |

### Candidate Quality

No candidate was promoted. The JSON readback exposes candidate reviewability
and reasons where persisted so future operators can review candidates without
ad hoc SQL.

### Brain ROI

| Dimension | Verdict | Evidence |
| --- | --- | --- |
| Context waste | lower | External consumers can parse one typed resource. |
| Review burden | lower | Proof boundaries are embedded in JSON. |
| Resume quality | better | Run summaries can be replayed by run ID. |
| Decision grounding | better | Output states what readback proves and does not prove. |
| Memory usefulness | mixed | Candidate reviewability is exposed, but no memory was promoted. |
| Operator friction | lower | No direct SQL or text scraping for basic run summary. |

## Product Readiness Signal

Verdict:

```txt
read-only integration boundary signal, not product API readiness.
```

F-00 moves KRN toward future MCP/API integration by proving the read model
shape first. It intentionally does not build MCP/API.

## Next Recommended Action

Continue to:

```txt
F-01 — Codex Automation Integration
```

F-01 should decide whether Codex automation is justified after the readback
boundary. It must not bypass review or write policies.
