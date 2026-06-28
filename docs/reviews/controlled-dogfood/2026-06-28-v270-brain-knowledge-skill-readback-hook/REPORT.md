# V270 Brain Knowledge Skill Readback Hook

Status: complete.

Date: 2026-06-28

## Executive Verdict

V270 connected the explicit brain knowledge catalog to the smallest repeated
Codex execution surfaces: TypeScript boundary work, source-to-decision work, and
the pattern intake runbook. This makes retained patterns discoverable during
execution without adding hidden hooks, automatic semantic routing, UI, API, MCP,
DB persistence, ranking, or memory mutation.

This is a workflow hook, not product search.

## Scope

Changed:

- `.agents/skills/typescript-type-safety/SKILL.md`
- `.agents/skills/source-to-decision/SKILL.md`
- `docs/runbooks/pattern-intake.md`
- `packages/harness/src/skillInvariants.test.ts`

Non-goals preserved:

- no automatic semantic hooks;
- no hidden skill routing;
- no broad skill zoo;
- no UI/API/MCP;
- no DB schema or migration;
- no ranking engine;
- no memory/source mutation.

## Behavior Added

TypeScript boundary work now routes external input tasks through:

```sh
pnpm --filter @krn/cli krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --text unknown-first
```

Source-to-decision work now routes retained source/pattern decisions through:

```sh
pnpm --filter @krn/cli krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --text source-to-decision
```

Pattern intake now tells operators to query the catalog for a matching retained
pattern before retaining another source or pattern.

All three surfaces state that catalog output is read-only context and does not
prove ranking, product search, DB truth, memory promotion, or source authority.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm --filter @krn/cli krn knowledge cards --catalog-file ../../docs/brain-knowledge/catalog.json --text unknown-first --json` | passed | The TypeScript skill command returns the retained unknown-first pattern card. | Does not prove automatic skill usage or product search. |
| `pnpm --filter @krn/cli krn knowledge cards --catalog-file ../../docs/brain-knowledge/catalog.json --text source-to-decision --json` | passed | The source-to-decision skill command returns the retained source-to-decision pattern card. | Does not prove ranking quality or research completeness. |
| `pnpm --filter @krn/harness test -- skillInvariants` | passed | Skill invariant guards the new catalog readback guidance. | Does not prove future Codex will always choose the right skill. |
| `pnpm --filter @krn/harness test -- skillInvariants patternChainInvariants activePlanInvariants contextHygieneInvariants` | passed | Core skill/plan/context invariants still pass. | Does not prove full workspace health. |
| `git diff --check` | passed | Diff has no whitespace errors. | Does not prove behavior beyond formatting. |

## Source-To-Decision

- Source: V267 explicit catalog preview, V268 second retained pattern, V269
  catalog search guard, `source-to-decision` skill, `typescript-type-safety`
  skill, and `docs/runbooks/pattern-intake.md`.
- Mechanism: retained patterns only improve future Codex work if execution
  workflows query the typed catalog before implementation or retention
  decisions.
- KRN implication: pattern brain should route skills to read-only catalog
  context before UI/search and before hidden routing.
- Decision: add explicit catalog readback guidance to the two smallest relevant
  skills and the pattern intake runbook; guard it with `skillInvariants`.
- Does not prove: automatic skill selection, product readiness, UI/search,
  ranking quality, DB-backed knowledge, or broad research condensation.
- Consumer: V271 skill readback usefulness trial and future UI/search readiness
  gate.
- Falsifier: future TypeScript/source-to-decision work cannot show whether the
  catalog was queried, used, helped, or rejected.

## Brain Usefulness

Positive for workflow wiring:

- retained patterns are now reachable from the skill path that should consume
  them;
- the readback commands are explicit and repeatable;
- the guard prevents silent regression of the skill guidance.

Still unproven:

- whether Codex uses this guidance in a real source repair;
- whether catalog cards reduce review burden;
- whether more patterns are needed before UI/search is worthwhile.

## Next Recommended Action

Proceed to:

```txt
V271-00 Brain Knowledge Skill Readback Usefulness Trial
```

Run one bounded TypeScript or source-to-decision task that must query the
catalog through the updated skill guidance, then record whether the returned
card was selected, used, helped, neutral, noise, or missing.
