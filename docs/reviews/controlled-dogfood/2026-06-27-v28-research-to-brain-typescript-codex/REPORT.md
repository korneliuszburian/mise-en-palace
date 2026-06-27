# V28 Research-To-Brain TypeScript/Codex Decision Trial

Status: complete.

Date: 2026-06-27.

Mode: research-condensation.

## Executive Verdict

V28 proves the research-to-brain lane is useful only as a strict decision
filter, not as a research archive. The selected Codex and TypeScript sources
mostly confirm existing KRN surfaces: compact `AGENTS.md`, compact `GOAL.md`,
compact root `PLAN.md`, detailed root `PLANS.md`, focused skills, deferred
hooks/MCP/subagents, and unknown-first TypeScript boundaries. The durable
update is therefore a source map and falsifier set, not a new subsystem.

Next work should apply these decisions to current code with a bounded
TypeScript boundary spot-check. Do not build a crawler, Research Foundry,
dashboard, MCP server, worker runtime, broad eval platform, or new memory
subsystem from this research pass.

## Scope

Sources selected:

| Source | Trust | Why selected |
|---|---:|---|
| Codex manual: Agent Skills | high | Defines skill progressive disclosure and trigger design. |
| Codex manual: AGENTS.md | high | Defines durable project instruction loading and size limits. |
| Codex manual: Subagents | high | Defines subagent use as explicit, bounded, read-heavy delegation. |
| Codex manual: Hooks | high | Defines hook lifecycle mechanics and trust boundary. |
| OpenAI Cookbook: Codex Exec Plans | high | Defines long-running execution plan behavior. |
| OpenAI Cookbook: Goals in Codex | high | Defines persistent goal continuation expectations. |
| OpenAI Cookbook: GPT-5 Codex Prompting Guide | high | Defines task clarity and explicit verification expectations for Codex. |
| Total TypeScript: Designing Your Types | medium | Practitioner guidance for using types to communicate domain logic. |
| Total TypeScript: Unions, Literals, and Narrowing | medium | Practitioner guidance for literal unions and narrowing state. |
| Total TypeScript: TS Reset | medium | Practitioner mechanism for making unsafe platform types stricter. |

Non-goals:

- no source crawler;
- no research backlog;
- no Research Foundry;
- no new skill unless a repeated workflow is proven;
- no hook/MCP/subagent implementation;
- no TypeScript source repair in this slice;
- no product-ready claim.

## Source-To-Decision Table

| Source | Mechanism | KRN implication | Decision | Does not prove | Falsifier |
|---|---|---|---|---|---|
| Codex manual: AGENTS.md | Codex layers instruction files and stops when the configured project-doc byte cap is reached. | `AGENTS.md` must stay durable and small; long-run state belongs in `PLAN.md`, `PLANS.md`, reports, or skills. | Adopt/keep. Current root `AGENTS.md` remains a thin rule surface. | Does not prove every rule belongs in `AGENTS.md`. | A repeated global violation remains after skill/plan/test coverage and needs always-on instruction. |
| Codex manual: Agent Skills | Skills use progressive disclosure: initial context gets name/description/path and full `SKILL.md` is read only when selected. | Repeated KRN workflows should become focused skills only when trigger/inputs/outputs are stable. | Adopt/keep. Existing KRN skills remain the preferred workflow surface; do not create a skill zoo. | Does not prove every repeated instruction deserves a skill. | A workflow repeats and needs references/scripts that would bloat `AGENTS.md` or `PLANS.md`. |
| Codex manual: Hooks | Hooks are lifecycle command handlers with trust review and event matchers. | Hooks are mechanical guard candidates, not semantic brain authority. | Keep deferred. Implement only after repeated deterministic failures. | Does not prove hooks are never useful. | Same mechanical violation repeats despite tests/skills and can be blocked by a tiny trusted hook. |
| Codex manual: Subagents | Subagents are explicit parallel workflows best suited to read-heavy exploration, tests, triage, and summarization. | Subagents can be organs for bounded read-heavy work, not another autonomous product brain. | Keep deferred except existing read-only critic style. | Does not prove subagents cannot help later. | Repeated large read-heavy tasks need parallel summaries with stable output contracts. |
| OpenAI Cookbook: Codex Exec Plans | ExecPlans preserve intent, discoveries, decisions, and validation for long-running work. | `PLANS.md` is the detailed continuous ExecPlan; root `PLAN.md` stays compact product truth. | Adopt/keep. Current split is the right surface. | Does not prove `PLANS.md` should carry raw logs or historical noise forever. | Compaction loses active task state despite `GOAL.md`/`PLAN.md`/`PLANS.md` continuation rules. |
| OpenAI Cookbook: Goals in Codex | Goals preserve objective continuity across turns until evidence proves completion. | Continuous KRN goal should not be marked complete after one slice. | Adopt/keep. `GOAL.md` explicitly forbids one-slice completion. | Does not prove a goal should become an unbounded backlog. | Product-ready proof, explicit operator stop, or honest blocker requires closing/replacing the goal. |
| OpenAI Cookbook: GPT-5 Codex Prompting Guide | Codex performs better when tasks, constraints, expected outputs, and verification are explicit. | Every KRN task contract should name non-goals, allowed writes, verification, proof/non-proof, and rollback. | Adopt/keep. Current task schema remains mandatory. | Does not prove verbose prompts improve every small task. | Future tasks become too heavy to execute and evidence shows simpler task contracts preserve safety. |
| Total TypeScript: Designing Your Types | Types should communicate business/domain logic, not just satisfy the compiler. | KRN domain types should encode authority, provenance, and lifecycle meaning. | Adopt/keep in `typescript-excellence.md`. | Does not prove a rewrite of all types is needed. | A simpler parser/test protects the invariant without new domain types. |
| Total TypeScript: Unions, Literals, and Narrowing | Literal unions and narrowing express finite state and valid transitions. | Status/provenance/lifecycle fields should use narrow unions or discriminated unions when fields differ by state. | Adopt/keep in `typescript-excellence.md`. | Does not prove every object needs a discriminant. | The union adds no invalid-state protection or makes review harder. |
| Total TypeScript: TS Reset | Unsafe platform defaults like `JSON.parse` returning `any` can be made stricter, but global scope changes are an application-level tool. | KRN should keep unknown-first IO boundaries, while rejecting global `ts-reset` in core/schema/public APIs. | Adopt existing policy. | Does not prove `ts-reset` is forbidden everywhere. | A private app/CLI/test scope proves global reset reduces risk without leaking public API behavior. |

## Accepted Decisions

1. Keep `AGENTS.md` small and durable.
   Consumer: existing root `AGENTS.md`, `GOAL.md` continuation rules, and
   `PLANS.md` policy.

2. Keep root `PLAN.md` as compact product SSOT and root `PLANS.md` as detailed
   continuous ExecPlan.
   Consumer: current root plan structure.

3. Keep skills as the preferred reusable workflow surface, with progressive
   disclosure and focused triggers.
   Consumer: `.agents/skills/*` and `PLANS.md` Codex surface selection policy.

4. Keep hooks, MCP, and new subagent frameworks deferred until repeated bounded
   evidence proves the need.
   Consumer: `PLANS.md` non-goals and prior V09/V10 decisions.

5. Keep TypeScript unknown-first boundary policy and narrow/discriminated union
   discipline.
   Consumer: `docs/standards/typescript-excellence.md` and
   `docs/standards/typescript-boundaries.md`.

6. Add the durable source mappings to `docs/KRN_SOURCES.md`.
   Consumer: future source-to-decision runs.

## Rejected Or Deferred Decisions

| Candidate | Decision | Reason | Falsifier |
|---|---|---|---|
| Research Foundry / crawler | rejected | No source in this trial requires autonomous source intake. | Repeated manual source ingestion blocks delivery and can be bounded by typed source claims. |
| New broad research skill | deferred | `source-to-decision` already owns the workflow. | Multiple future runs need additional scripts/references not covered by current skill. |
| Global `ts-reset` in core/schema/public APIs | rejected | Public/library surfaces should not change global platform types. | A scoped package proves benefit without public API leakage. |
| Activation scoring rewrite from research | rejected | V28 contains no activation evidence. | Future DB-backed scenarios show repeated owner-file or source-selection misses after read-model fixes. |
| Promptfoo broad eval lane | rejected | V28 did not produce behavior requiring broad eval expansion. | A small behavior invariant cannot be protected by unit/golden tests and needs Promptfoo adapter coverage. |

## Durable Surface Updates

Updated:

- `docs/KRN_SOURCES.md`

Not updated:

- `docs/standards/typescript-excellence.md`, because the accepted TypeScript
  decisions are already present there.
- `.agents/skills/*`, because the existing `source-to-decision` skill already
  contains the required gate.
- package source, because this slice is research-condensation only.

## Product Readiness Impact

```txt
controlled-internal-alpha for technical operators: unchanged / stronger source discipline
widened internal alpha: no
product-ready: no
V02-01: still blocked/deferred
```

V28 strengthens how KRN ingests research and practitioner material. It does not
prove product readiness, second-operator usability, target-repo success, or
runtime memory quality.

## Next Recommended Task

Promote:

```txt
V29 — TypeScript Boundary Research Application Gate
```

Goal:

Apply the accepted V28 TypeScript source decisions to current code with a
bounded spot-check. This is not `krn audit` and not broad cleanup. It should
scan only the high-risk boundary patterns named by the standards:

- unchecked `JSON.parse`;
- `as any`;
- `as unknown as`;
- `@ts-ignore`;
- undocumented `@ts-expect-error`;
- public anonymous object soup only if discovered in the touched boundary.

The output should classify each finding as accepted boundary, test-only,
repair candidate, or no issue. Implement a source repair only if the spot-check
finds one tiny high-confidence boundary bug.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `rtk git fetch --prune` | passed | Remote refs were refreshed before V28 work. | Does not prove CI status for future commits. |
| `rtk git status --short --branch` | passed, clean, `main...origin/main` | Worktree started clean and local main matched remote. | Does not prove V28 completion. |
| `rtk git log --oneline -n 8` | passed | Latest local history began at `e8fb5f3`. | Does not prove source decisions are correct. |
| `rtk node /home/krn/.codex/skills/.system/openai-docs/scripts/fetch-codex-manual.mjs` | passed | Codex manual cache was current and available. | Does not prove non-Codex web sources. |

Final verification for this docs-only slice is recorded in the commit
verification after plan updates.

## Source Pointers

- https://developers.openai.com/cookbook/articles/codex_exec_plans
- https://developers.openai.com/cookbook/examples/codex/using_goals_in_codex
- https://developers.openai.com/cookbook/examples/gpt-5/codex_prompting_guide
- https://developers.openai.com/codex/skills
- https://developers.openai.com/codex/guides/agents-md
- https://developers.openai.com/codex/hooks
- https://developers.openai.com/codex/subagents
- https://www.totaltypescript.com/books/total-typescript-essentials/designing-your-types-in-typescript
- https://www.totaltypescript.com/books/total-typescript-essentials/unions-literals-and-narrowing
- https://www.totaltypescript.com/ts-reset
