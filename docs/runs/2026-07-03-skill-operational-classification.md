# Skill Operational Classification

## Scope

Classified repo-local `.agents/skills` after the cleanup audit flagged skill
surface as potential prompt scaffolding.

## Decision

Keep the current 10 repo-local skills. They are operational kernel-building
skills, not runtime claims. The standard is now explicit: preserve skills that
route repeated KRN work with triggers, forbidden behavior, outputs, and
verification; delete or demote only when a skill claims authority without a
reviewable workflow.

## Classification

| Skill | Decision | Reason |
|---|---|---|
| `activation-engine` | keep | Routes activation/retrieval/context selection work. |
| `beads` | keep | Routes durable task tracking and handoff state. |
| `brain-store-schema` | keep | Routes DB schema, migration, repository, and SQL-boundary work. |
| `codex-adapter-plan` | keep | Routes Codex brief and adapter-boundary changes. |
| `evidence-review-loop` | keep | Routes proof/non-proof, command provenance, and feedback candidates. |
| `handoff-compact` | keep | Routes compact continuation state. |
| `second-opinion-claude` | keep | Now governed by verdict validator and diff freshness. |
| `source-to-decision` | keep | Prevents decorative source hoarding. |
| `target-repo-testing` | keep | Protects target-repo write authority and dirty-state evidence. |
| `typescript-type-safety` | keep | Protects unknown-first TypeScript boundaries. |

## Proof

- All 10 skills have `name`, `description`, `Workflow`, and `Verification`
  sections enforced by `skillInvariants`.
- `second-opinion-claude` has executable validator scripts, JSON schema, and
  examples.
- Active architecture now records the current skill register and keep/delete
  criteria in `docs/architecture/skill-first-krn.md`.

## Non-Proof

- This does not prove every skill improves Codex behavior in every run.
- This does not create the future brain-backed skill.
- This does not make skill text runtime authority.
