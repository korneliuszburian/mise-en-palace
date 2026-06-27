# V66 TypeScript Boundary Spot-Check

Status: source spot-check, not broad audit.

Date: 2026-06-27

## Scope

Pattern surface: TypeScript boundaries.

Primary consumer: defer decision in `PLANS.md`.

Source packet:

- `docs/KRN_SOURCES.md#designing-your-types`
- `docs/KRN_SOURCES.md#unions-literals-and-narrowing`
- `docs/KRN_SOURCES.md#ts-reset`

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `rg -n "JSON\\.parse\|fetch\\([^\\n]*\\.json\|process\\.env\|as any\|as unknown as\|@ts-ignore\|@ts-expect-error" packages` | passed with matches | The bounded search found the visible risky TypeScript boundary patterns in `packages/`. | It does not prove every boundary is correct or that no unsafe pattern exists under another spelling. |
| `git status --short --branch` | clean before report write | The spot-check started from a clean tracked worktree. | It does not prove CI status for this report. |

## Findings

The search found:

- test and fixture `JSON.parse` calls that parse into `unknown`;
- production `packages/cli/src/cliFileBoundary.ts` parsing JSON into `unknown`
  and narrowing with `isJsonObject`;
- CLI/env wiring in `packages/cli/src/index.ts`, where `process.env` is passed
  into the CLI runtime boundary;
- Drizzle config reading `process.env.KRN_DATABASE_URL` in
  `packages/db/drizzle.config.ts`, which is tool configuration rather than
  domain logic;
- no `as any`, `as unknown as`, `@ts-ignore`, or `@ts-expect-error` hits from
  this search.

## Decision

Decision kind: defer repair.

No immediate TypeScript boundary repair is promoted from this spot-check.

Reason:

- the visible production `JSON.parse` path keeps parsed data as `unknown` before
  narrowing;
- env access appears at runtime/config boundaries instead of hidden domain use;
- no repeated unsafe cast or ignored TypeScript diagnostic pattern was found.

## Falsifier

Reopen a bounded repair or eval candidate if a future source slice finds:

- external input used as domain data before parser/validator/type guard;
- broad finite status/provenance strings crossing IO where narrow values govern
  behavior;
- `as any`, double assertions, or ignored TypeScript diagnostics in production;
- `ts-reset` adoption without package-boundary classification.

## What This Does Not Prove

- full TypeScript quality;
- full source safety;
- product readiness;
- that all package boundaries are ideal;
- that a broader audit subsystem is needed.
