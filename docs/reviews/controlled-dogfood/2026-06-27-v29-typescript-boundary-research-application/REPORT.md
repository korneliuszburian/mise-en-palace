# V29 TypeScript Boundary Research Application Gate

Status: complete.

Date: 2026-06-27.

Mode: research-application / boundary spot-check.

## Executive Verdict

V29 applied the V28 TypeScript decisions to current source evidence and found no
high-confidence TypeScript boundary bug to repair in this slice. The production
`JSON.parse` boundary already parses to `unknown` and narrows through a local
object guard. The targeted unsafe-cast and `@ts-*` scans found no matches.

This is not a broad audit and not proof that every public API is ideal. It is a
bounded check that the highest-risk TypeScript boundary patterns named by V28
and the active standards are currently under control.

## Scope

Inputs:

- `docs/reviews/controlled-dogfood/2026-06-27-v28-research-to-brain-typescript-codex/REPORT.md`;
- `docs/KRN_SOURCES.md`;
- `docs/standards/typescript-excellence.md`;
- `docs/standards/typescript-boundaries.md`;
- `.agents/skills/typescript-type-safety/SKILL.md`.

Scanned patterns:

- `JSON.parse`;
- `as any`;
- `as unknown as`;
- `@ts-ignore`;
- `@ts-expect-error`;
- `fetch().json()` / `.json()` command pattern;
- broad `Record<string, unknown>` / `metadata` only as a scoping probe, not as a
  fix list.

Non-goals:

- no `krn audit`;
- no broad cleanup;
- no public API rewrite;
- no global `ts-reset`;
- no source crawler;
- no dashboard/API/MCP/worker runtime;
- no TypeScript source change without a direct boundary bug.

## Scan Results

| Pattern | Command | Result | Classification |
|---|---|---|---|
| `JSON.parse` in `packages` | `rtk rg -n "JSON\\.parse" packages` | test fixtures plus one production CLI boundary | accepted boundary after inspection |
| Production `JSON.parse` | `rtk rg -n "JSON\\.parse" packages -g '!*.test.ts'` | `packages/cli/src/cliFileBoundary.ts:42` only | accepted boundary |
| Unsafe casts / TS suppressions | `rtk rg -n "as any\|as unknown as\|@ts-ignore\|@ts-expect-error" packages` | no matches | no issue |
| Production unsafe casts / TS suppressions | `rtk rg -n "as any\|as unknown as\|@ts-ignore\|@ts-expect-error" packages -g '!*.test.ts'` | no matches | no issue |
| `fetch().json()` / `.json()` | `rtk rg -n "fetch\\([^\\n]*\\)\\.json\\(\|\\.json\\(\\)" packages` | no matches | no issue |
| `Record<string, unknown>` / `metadata` | `rtk rg -n "Record<string, unknown>\|metadata" ...` | intentionally broad, noisy output | not used as repair evidence |

## Boundary Classification

### `packages/cli/src/cliFileBoundary.ts`

Finding:

```ts
const parsed: unknown = JSON.parse(raw);
return isJsonObject(parsed) ? parsed : undefined;
```

Classification: accepted boundary.

Why:

- file/env/JSON input lives in the CLI adapter package;
- raw JSON is parsed into `unknown`;
- a local type guard narrows to `Record<string, unknown>`;
- invalid/non-object JSON resolves to `undefined`;
- no domain object is trusted directly from `JSON.parse`.

Does not prove:

- that every future CLI JSON boundary is safe;
- that `Record<string, unknown>` should stay the final shape if repeated
  product fields emerge;
- that malformed config has ideal operator-facing error messages.

Falsifier:

- a future command relies on values from `readJsonObject` as domain facts
  without schema/parser narrowing.

### Test Fixture `JSON.parse`

Classification: accepted test-boundary pattern.

Why:

- test fixture parses assign to `unknown`;
- golden/schema tests validate or narrow after parse;
- no production trust boundary is introduced.

Falsifier:

- a test fixture begins exporting parsed data as domain truth without schema or
  guard coverage.

### Unsafe Cast / Suppression Patterns

Classification: no issue in current scan.

Why:

- targeted scan found no `as any`, `as unknown as`, `@ts-ignore`, or
  `@ts-expect-error` in `packages`.

Does not prove:

- absence outside `packages`;
- absence of every possible type weakening pattern;
- public type design quality in all package APIs.

## Source-To-Decision Application

| V28 decision | Current evidence | Decision |
|---|---|---|
| External JSON/file input must be `unknown` until narrowed. | production `JSON.parse` uses `const parsed: unknown` and `isJsonObject`. | keep current boundary; no repair |
| Avoid unchecked `any` and double assertions. | targeted scans found no matches. | no repair |
| Do not add global `ts-reset` in public/library packages. | no current need; source code already follows unknown-first pattern for inspected boundary. | keep rejected |
| Do not use research as cleanup pressure. | broad metadata scan was noisy and not tied to a direct bug. | reject cleanup from this scan |

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `rtk git fetch --prune` | passed | Remote refs refreshed before V29. | Does not prove CI for this report. |
| `rtk git status --short --branch` | passed, clean, `main...origin/main` | Worktree started clean after V28 commit. | Does not prove V29 findings. |
| `rtk git log --oneline -n 8` | passed | Latest local history began at `c0c83b1`. | Does not prove source health. |
| `rtk rg -n "JSON\\.parse" packages` | passed with matches | Identified all direct `JSON.parse` matches under `packages`. | Does not prove every parser validates domain semantics. |
| `rtk rg -n "JSON\\.parse" packages -g '!*.test.ts'` | passed with one match | Production direct `JSON.parse` is limited to `cliFileBoundary.ts`. | Does not prove non-package scripts. |
| `rtk rg -n "as any\|as unknown as\|@ts-ignore\|@ts-expect-error" packages` | no matches | Named unsafe cast/suppression patterns are absent in `packages`. | Does not prove all type design is ideal. |
| `rtk rg -n "fetch\\([^\\n]*\\)\\.json\\(\|\\.json\\(\\)" packages` | no matches | No direct fetch/json pattern was found by this bounded regex. | Does not prove every network boundary is impossible. |
| `rtk rg -n "Record<string, unknown>\|metadata" ...` | noisy matches | Broad metadata usage exists and is too broad for V29 repair evidence. | Does not prove those fields are bad or good individually. |

## Product Readiness Impact

```txt
controlled-internal-alpha for technical operators: unchanged / stronger TypeScript boundary confidence
widened internal alpha: no
product-ready: no
V02-01: still blocked/deferred
```

## Next Recommended Task

Promote:

```txt
V30 — Codex Surface Context-Budget Application Gate
```

Goal:

Apply the V28 Codex surface decisions to current `AGENTS.md`, `.agents/skills`,
`GOAL.md`, `PLAN.md`, and `PLANS.md` shape. The task should check whether
durable instruction surfaces are still compact, focused, and triggerable
without bloating initial context. It should not create new skills unless a
specific repeated workflow and trigger gap is found.

Why:

V28 covered two source groups: TypeScript boundary discipline and Codex surface
selection. V29 applied the TypeScript half. V30 should apply the Codex surface
half before moving back to target/product trials.

## Final Decision

No TypeScript source repair in V29.

Reason:

The bounded scans found no direct unsafe cast/suppression pattern and the only
production JSON parse boundary already follows the unknown-first pattern.
