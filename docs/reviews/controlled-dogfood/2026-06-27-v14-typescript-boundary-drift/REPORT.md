# V14 TypeScript Boundary Drift Gate

Status: boundary drift gate and standards repair.

Date: 2026-06-27.

## Executive Verdict

V14 found no current production TypeScript boundary drift requiring a source
repair. The current drift was documentation authority drift: the TypeScript
standard still claimed `runTypeSafetyAudit` enforcement even though that broad
audit surface is no longer present in current package source.

Decision:

```txt
source repair: no
standards repair: yes
new audit subsystem: no
product-ready impact: none
next stream: V15 Promptfoo / Golden Behavior Role Gate
```

## Scope

Read:

- `.agents/skills/typescript-type-safety/SKILL.md`;
- `docs/standards/typescript-excellence.md`;
- `docs/standards/typescript-boundaries.md`;
- `packages/cli/src/cliFileBoundary.ts`;
- current package search results for unsafe casts, `any`, suppressions, and
  `JSON.parse`.

Changed:

- `docs/standards/typescript-excellence.md`.

Non-goals:

- no broad cleanup;
- no package-wide refactor;
- no source API churn;
- no `krn audit` resurrection;
- no semantic quality engine;
- no TypeScript strictness weakening.

## Drift Evidence

| Check | Result | Decision |
|---|---|---|
| Production `as any`, `as unknown as`, `@ts-ignore`, `@ts-expect-error`, explicit `any` scan | no package source hits | No source repair. |
| Production `JSON.parse` scan | one production boundary in `packages/cli/src/cliFileBoundary.ts` | No source repair: parsed value is `unknown` and narrowed to object. |
| Test `JSON.parse` scan | fixtures/readback tests assign parsed values to `unknown` | No source repair. |
| Type-safety audit source search | no current package source for `runTypeSafetyAudit` | Repair docs: remove false enforcement claim. |
| TypeScript standards | claimed `runTypeSafetyAudit` now reports unsafe patterns | Replace with current boundary verification policy. |

## What Changed

`docs/standards/typescript-excellence.md` now says current enforcement is:

- `pnpm typecheck`;
- targeted `rg` scans;
- schema/parser tests;
- golden behavior tests;
- `ts-type-critic` as read-only/proposal-only review aid.

It also states that repeated drift should produce a bounded test, parser, or
standard update, not a broad `krn audit` or semantic quality engine.

## What This Proves

- Current package source did not show obvious unsafe `any`, double assertion,
  TypeScript suppression, or unchecked production `JSON.parse` drift in the
  scanned patterns.
- The standard no longer claims a missing broad audit surface.
- TypeScript boundary enforcement remains tied to targeted evidence.

## What This Does Not Prove

- All TypeScript code is perfect.
- Every public type boundary has been manually reviewed.
- Future changes cannot introduce unsafe casts or unchecked parsing.
- Product readiness.
- Widened internal alpha.
- V02-01 second-operator usability.

## Command Evidence

| Command | Result | What It Proves | What It Does Not Prove |
|---|---|---|---|
| `rtk rg -n "as any\|as unknown as\|@ts-ignore\|@ts-expect-error\|:\\s*any\\b..." packages --glob '*.ts'` | no matches | No obvious unsafe casts/suppressions/explicit any in current package source. | Does not prove all type design is ideal. |
| `rtk rg -n "JSON\\.parse" packages --glob '*.ts'` | matched tests and `cliFileBoundary.ts` | JSON parsing locations are known. | Does not prove every parsed shape is semantically valid. |
| `rtk sed -n '1,140p' packages/cli/src/cliFileBoundary.ts` | passed | Production JSON parse is assigned to `unknown` and narrowed. | Does not prove every file boundary in future code is safe. |
| `rtk rg -n "runTypeSafetyAudit..." packages` | no matches | The old broad audit function is not current package authority. | Does not prove no docs mention it. |
| `rtk git diff --check` | passed | Diff whitespace is clean. | Does not prove semantic completeness. |

## Condensation Decision

```txt
finding:
  TypeScript source scan did not reveal current production boundary drift, but
  the standard had false authority by naming a missing `runTypeSafetyAudit`.

frequency:
  one current standards mismatch with high confusion risk.

candidate_surface:
  standards repair.

decision:
  complete V14-00 as docs/standards repair.

rationale:
  Reintroducing a broad audit subsystem would violate current KRN direction;
  standards should describe actual targeted verification.

evidence:
  current package scans, `cliFileBoundary.ts`, TypeScript standards.

does_not_prove:
  product readiness or exhaustive TypeScript quality.

falsifier:
  future package source introduces repeated unsafe casts/unchecked parsing that
  targeted scans/tests/ts-type-critic fail to catch.
```

## Next Recommended Action

Move to a bounded Promptfoo / Golden Behavior role gate.

Reason:

KRN CI already runs Promptfoo smoke, while recent work relies more on golden
behavior tests and source-backed reports. The next useful question is not to
build a broad eval platform, but to decide the exact role of Promptfoo versus
golden behavior gates in the continuous product loop.
