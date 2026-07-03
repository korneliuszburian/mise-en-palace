# Skill-First KRN

Status: active architecture note.

KRN should condense repeated workflows into small Codex-native skills before
building MCP servers, dashboards, broad subagents, or automation layers.

## Source Decision

KRN adopts the mechanism from Codex skills and Matt Pocock's public skills
repo, not the exact topology.

```txt
source: Codex skills docs
mechanism: reusable workflows load through progressive disclosure
KRN implication: repeated KRN work belongs in small repo-local skills
decision: adopt for stable repeated workflows
consumer: .agents/skills/* and skill invariants
falsifier: operators keep pasting long procedures into chat or root plans
doesNotProve: many skills are useful by default

source: Matt Pocock skills repo
mechanism: small composable skills encode alignment, shared language,
  feedback loops, TDD, debugging, architecture review, and handoff
KRN implication: KRN skills must be engineering disciplines with consumers,
  not decorative prompt scaffolding
decision: adopt the discipline, reject wholesale topology copying
consumer: operational skills now, future brain-backed skill after KRN readbacks
falsifier: a skill cannot name its KRN consumer or reduce repeated work
doesNotProve: KRN should copy another repo's skill list or treat skills as
  runtime authority
```

## Skill Classes

```txt
operational kernel skill
  use when: it routes repeated work needed to build or verify KRN
  consumer: code, migration, test, Beads issue, source decision, or run report
  example: typescript-type-safety, brain-store-schema, source-to-decision
  removal condition: product code or a smaller standard makes the workflow
    unnecessary

future brain skill
  use when: it consumes KRN memory/source/eval/readback state to improve Codex
  consumer: Codex brief, activation/readback, reviewed memory/source state, or
    deterministic eval
  example: a future KRN brain skill that asks the store for relevant accepted
    patterns and proof boundaries before implementation
  removal condition: the same advantage is enforced by the kernel directly

docs-only guidance
  use when: the material explains a decision but does not route execution
  consumer: ADR, standard, architecture note, source map
  action: keep out of `.agents/skills` unless it becomes a repeated workflow

delete or demote
  use when: the skill duplicates another skill, claims authority without an executing consumer,
    exists only to mirror old plans, or cannot be verified
  consumer: none
  action: delete the repo-local skill or move the guidance into docs
```

## Accepted Skills

| Skill | Finding condensed | Evidence | What it does not prove |
|---|---|---|---|
| `target-repo-testing` | Target repos are living checkouts and observation-only target trials must not patch target files after verification failure. | `docs/reviews/controlled-dogfood/2026-06-27-headless-wilq-seo-target-trial/REPORT.md`; `docs/runbooks/target-repo-testing.md`. | Does not prove arbitrary target safety or V02-01 second-operator usability. |

## Skill Criteria

A V04 skill is allowed when:

- the workflow repeated or was high-risk;
- `AGENTS.md` would become too large if it carried the full procedure;
- the skill has a clear trigger;
- the skill states forbidden behavior;
- the skill names verification or evidence output;
- the skill can be removed if future product code makes it unnecessary.

It is rejected when:

- it is only a prompt snippet;
- it restates an ADR, standard, or runbook without routing execution;
- it invents runtime, memory, source, worker, eval, or policy authority that
  code does not enforce;
- it cannot name a consumer and falsifier;
- it expands the active context surface without reducing repeated work.

## Future Brain Skill Boundary

The eventual KRN brain skill is not a larger AGENTS file. It should become a
thin Codex-facing workflow that asks the KRN brain for selected, reviewed,
bounded context before and during implementation.

```txt
normal Codex
  user task
    -> repo instructions
    -> current context
    -> model judgment
    -> code/test attempt

Codex with KRN brain skill
  user task
    -> repo instructions
    -> brain skill trigger
    -> KRN readbacks:
         accepted source decisions
         reviewed memory records
         retained patterns
         proof/non-proof boundaries
         relevant eval failures
    -> bounded Codex brief / execution discipline
    -> code/test attempt
    -> evidence capture / feedback candidates
```

Proof requirement:

```txt
brain skill is useful only if repeated runs show:
  less context waste,
  fewer missed owner files,
  clearer proof/non-proof,
  better source/memory recall,
  or a deterministic gate catching drift.
```

## Deferred Surfaces

MCP, subagents, hooks, dashboards, and broad eval platforms stay deferred until
controlled scenarios show a repeated need that cannot be handled by a small
skill, runbook, test, or CLI/readback improvement.
