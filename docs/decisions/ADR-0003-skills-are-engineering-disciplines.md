# ADR-0003: Skills Are Engineering Disciplines

Status: accepted.

## Context

Skills can standardize excellence or automate mistakes.

## Decision

KRN repo-local skills represent reusable engineering disciplines. Create and
update them through `$skill-creator` discipline. Do not create stack-agent
skills, marketing docs, custom prompts, or arbitrary prompt snippets.

## Consequences

- `SKILL.md` frontmatter uses only `name` and `description`.
- Description carries the trigger boundary.
- Skill bodies stay lean and use references/scripts/assets only when justified.
- `$skill-installer` is for installing existing skills, not authoring these.

