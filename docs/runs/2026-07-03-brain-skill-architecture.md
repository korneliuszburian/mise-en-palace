# Brain Skill Architecture

## Verdict

Repo-local skills remain valid KRN organs only when they route repeated,
verified work. They are not runtime authority, not a replacement for memory,
and not a decorative prompt zoo.

The future KRN brain skill should be a thin Codex-facing workflow that consumes
reviewed KRN readbacks: accepted source decisions, reviewed memory records,
retained patterns, proof/non-proof boundaries, and relevant eval failures.

## Source Decision

Source:

- `https://developers.openai.com/codex/skills`
- `https://github.com/mattpocock/skills`

Mechanism:

- Codex skills use progressive disclosure for reusable workflows.
- Matt Pocock's skills repo emphasizes small, adaptable, composable engineering
  workflows, shared language, issue routing, TDD, debugging, architecture
  review, and handoff.

KRN implication:

- Operational skills are allowed when they reduce repeated kernel-building work
  with a clear consumer and verification.
- Future brain skills are allowed only when they consume actual KRN brain state.
- Skills that only restate docs, duplicate another skill, or claim authority
  without an executing consumer should be deleted or demoted.

Decision:

- Adopt the skill discipline.
- Reject copying another repo's skill topology wholesale.
- Keep skills as workflow surfaces, not product proof.

Consumer:

- `docs/KRN_SOURCES.md`
- `docs/architecture/skill-first-krn.md`
- `packages/harness/src/__tests__/skillInvariants.test.ts`

Falsifier:

- A retained skill cannot reduce repeated work, name a KRN consumer, or provide
  verification evidence.
- A brain skill cannot demonstrate better context selection, recall, or
  proof/non-proof handling through KRN readbacks.

## Proof

- Skill architecture now classifies skills as operational kernel skill, future
  brain skill, docs-only guidance, or delete/demote.
- Source map records Matt Pocock's skills repo as practitioner evidence with
  mechanism, implication, decision, consumer, falsifier, and non-proof.
- Skill invariant now guards the source-backed skill-first doctrine.

## Non-Proof

- This does not prove every current repo-local skill is useful.
- This does not prove the future KRN brain skill is built.
- This does not prove Matt Pocock's skill topology should be copied.
- This does not prove KRN is product-ready.
