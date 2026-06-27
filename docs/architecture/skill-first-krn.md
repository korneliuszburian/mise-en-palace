# Skill-First KRN

Status: V04 architecture note.

KRN should condense repeated workflows into small Codex-native skills before
building MCP servers, dashboards, broad subagents, or automation layers.

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

## Deferred Surfaces

MCP, subagents, hooks, dashboards, and broad eval platforms stay deferred until
controlled scenarios show a repeated need that cannot be handled by a small
skill, runbook, test, or CLI/readback improvement.
