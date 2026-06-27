# V22 Persisted CLI DB URL Default Consistency

Status: completed source repair report.

Date: 2026-06-27
Evaluator: Codex
KRN repo: `/home/krn/coding/krn/active/mise-en-palace`
Mode: KRN CLI ergonomics repair
DB available: yes

## Executive Verdict

V22 repaired the DB URL ergonomics gap without silently defaulting direct
persisted CLI writes to local Postgres. Missing `KRN_DATABASE_URL` errors now get
centralized, copyable recovery guidance from `runCli`, while existing explicit
env override behavior remains unchanged.

This is safer than implicit default writes: direct `--persist` commands still
fail when DB config is absent, but the operator gets the exact next action:

```txt
export KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn; docker compose up -d krn-postgres; pnpm db:ready
```

## Source Inspection

Finding:

- root package scripts such as `pnpm db:ready` inject a default local
  `KRN_DATABASE_URL`;
- many direct persisted CLI command runners intentionally check
  `runtime.env.KRN_DATABASE_URL`;
- `run show` already had a richer remediation message;
- `runCli` had many catch blocks returning raw error text.

Decision:

Do not add a hidden default DB URL inside direct persisted CLI commands. Add a
central formatter in `runCli` for errors starting with
`KRN_DATABASE_URL is required`.

Why:

- avoids accidental local DB writes when an operator forgot env;
- preserves explicit override;
- repairs every direct persisted command surfaced through `runCli`;
- avoids DB schema/runtime changes;
- keeps `run show` custom remediation from being duplicated.

## Implementation

Changed:

- `packages/cli/src/runCli.ts`
  - imports `missingDbConfigRecovery`;
  - adds `formatCliError`;
  - appends recovery guidance and does-not-prove boundary for missing DB config
    errors;
  - avoids duplicate guidance when a command already includes `Next action:`.
- `packages/cli/src/runCli.test.ts`
  - asserts init and plan persisted missing-DB errors include copyable recovery
    guidance.

No DB schema, command parser, or target repo behavior changed.

## Verification

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm --filter @krn/cli test -- runCli runRunShowCommand` | passed | CLI error formatting and run show behavior are covered by tests. | Does not prove full workspace. |
| `krn init --connect --repo tests/fixtures/target-repos/typescript-basic --persist` without env | failed with expected guidance | Real CLI stderr now includes exact recovery and does-not-prove boundary. | Does not prove DB is reachable or command should persist. |
| `pnpm typecheck` via `bash -lc 'pnpm typecheck; printf "EXIT:%s\n" "$?"'` | passed, `EXIT:0` | Strict TypeScript compile passes. | Does not prove runtime behavior. |
| `pnpm test` | passed | Full workspace tests pass. | Does not prove product readiness. |
| `git diff --check` | passed | Source/docs diff has no whitespace errors. | Does not prove semantics. |

## KRN Dogfood Evidence

KRN plan:

```txt
executionRun: 3c56703d-9570-4ba1-8e35-71cd935d3427
context status: assembled
context inclusions: 1
selected context: packages/cli/src/runDbReadinessCommand.test.ts
```

Activation verdict: mixed.

The selected context was adjacent to DB readiness behavior, but the actual owner
files were `runCli.ts` and `runCli.test.ts`. This is a useful signal for future
owner-file/read-model work, not enough for activation scoring repair by itself.

Evidence capture:

```txt
evidenceBundle: 22bad4a4-277c-4ed8-a141-b299b1e85661
reviewAssessment: ae6af176-3989-4c97-8faf-69db38e2a1f0
feedbackDelta: 3067ab70-8e2f-417a-965e-dd8322c7f098
changedFiles: 2 intended, 0 unrelated, 0 unknown
```

Observation:

```txt
observationGroup: d4a3d864-1d6d-4492-824b-038ae1f24d63
observationItems: 5
memory mutation: none
```

Reflection:

```txt
reflectionRecord: aca9bfa0-8528-4334-ac3b-6b6d4c554cf8
findings: 0
gaps: 0
candidate rows written: no
memory mutation: none
```

## What Improved

- Missing DB config errors now tell the operator exactly what to run.
- Direct persisted CLI commands still do not silently write to local DB.
- The does-not-prove boundary is visible in stderr.
- The repair is centralized in `runCli`, not duplicated across command runners.

## What Did Not Improve

- Product readiness.
- V02-01 second-operator proof.
- Widened internal alpha.
- Whether owner-file recall selects exact source owners for DB ergonomics work.
- DB reachability itself; this only improves missing-config remediation.

## Next Recommended Action

Promote one bounded proof:

```txt
V23 — Real Target Observation Re-Run After Evidence/DB Ergonomics Repairs
```

Goal:

- rerun a real target observation-only owner-file trial after V21/V22;
- omit explicit target forbidden-write flags once to prove observation-only
  defaults persist correctly;
- use the improved DB recovery guidance if missing-env is encountered, but do
  not claim that remediation itself proves DB readiness;
- preserve no-target-writes and no V02-01 overclaim.

