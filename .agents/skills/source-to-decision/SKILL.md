---
name: source-to-decision
description: Use when external docs, papers, practitioner writing, competitor docs, local evidence, or user material must become a KRN decision with mechanism, consumer, falsifier, and does-not-prove.
---

# Source To Decision

Use this skill to prevent source hoarding.

## Trigger

- A decision depends on external docs, papers, competitor/practitioner writing,
  local repo evidence, or user-provided material.
- A source might otherwise become decorative context.

## Steps

1. Identify the exact source and trust tier.
2. Extract the mechanism, not just the claim.
3. State the KRN implication.
4. Decide: adopt, reject, lab-test, or defer.
5. State what the source does not prove.
6. Name the consumer: roadmap decision, Beads issue, store-backed source or
   memory candidate, skill, type, eval candidate, CLI/readback behavior, or
   runtime contract.
7. Add a falsifier.
8. After execution, close source usefulness feedback or record why it was not
   measured.

## Research Intake Rules

Use this lane for official docs, papers, practitioner writing, course material,
competitor docs, local evidence, and user-provided research.

Before retaining or applying a source or knowledge decision, query the explicit
brain knowledge catalog when retained knowledge context is relevant:

```sh
rtk proxy pnpm --filter @krn/cli krn brain recall --fixture-catalog-file tests/fixtures/brain-knowledge/corpus/catalog.json --text source-to-decision
```

Use catalog results as read-only context. They can guide adoption, rejection,
consumer routing, and falsifiers, but they do not promote memory, mutate source
truth, rank knowledge, or prove product readiness.

For multi-source, course, paper, practitioner method, or operator-facing
intake, keep this skill as the trigger/gate and route durable follow-up through
Beads, store-backed source candidates, eval candidates, or a focused skill
update. Do not create a markdown research runbook as the source of truth.

Keep the gate strict:

- Source without mechanism is decoration.
- Mechanism without KRN implication is a note.
- Implication without decision or rejection is backlog pressure.
- Decision without falsifier is dogma.
- Practitioner or course guidance can shape style, but it does not override
  repo evidence, tests, or KRN architecture law.
- Papers can create hypotheses, eval candidates, or architecture-decision
  evidence, but they do not become product truth without local falsifiers.
- Official docs can define current product mechanics, but still need a KRN
  implication and a proof/non-proof boundary.

Preferred consumers:

- `KRN_ROADMAP.md` for compact product and architecture direction.
- Beads for durable follow-up work and blockers.
- Store-backed source, memory, feedback, and eval candidates for runtime
  learning paths.
- Skills for repeated execution workflows.
- Eval candidates for behavior that can be falsified.
- Memory/source candidates for future review, never automatic promotion.

Reject or defer sources when the consumer is unclear.

## Output

```yaml
source_id:
title:
url:
trust_tier: high | medium | low
source_class: official docs | papers | high-quality public course page | practitioner writing | competitor docs | repo-local evidence | target-repo evidence | user-provided research
mechanism:
krn_implication:
decision_kind: adopt | reject | lab_test | defer
decision:
does_not_prove:
consumer:
falsifier:
```

Optional when useful:

```yaml
candidate_output:
  type: MemoryCandidate | SourceDecision | EvalCandidate | SkillCandidate | none
  reviewability: ready | needs_more_evidence | too_vague | duplicate | not_useful | unknown
source_usefulness_feedback:
  status: measured_with_evidence_capture | not_measured
  outcome: selected | used | helped | neutral | noise | stale | unknown
  reason:
  evidence_refs:
  does_not_prove:
```

## Forbidden

- Do not retain decorative links.
- Do not treat practitioner or competitor claims as Codex truth.
- Do not use a source without `does_not_prove`.
- Do not cite raw onboarding material as default context; cite the derived doc
  unless auditing the raw source.
- Do not create a research archive, source crawler, or broad research backlog
  from a source that has no immediate consumer.

## Continuous Knowledge Gate

Use this gate at every non-trivial KRN slice, not only research-labeled tasks.

Before adopting, rejecting, or implementing retained knowledge, classify whether
the slice touches one of these knowledge surfaces:

```txt
infra / storage / migrations / queues
harness / activation / memory / review gates
CI / release / eval / Promptfoo
Codex surfaces / skills / hooks / MCP / subagents
target-repo workflow
TypeScript boundaries
security / permissions / trust boundaries
operator UX / CLI / readback
```

If it does, either:

- cite an existing KRN source, standard, architecture decision, or skill and
  state the mechanism; or
- add a bounded source decision; or
- explicitly reject/defer source work with a reason.

Allowed source classes:

```txt
official docs
papers
high-quality public course page
practitioner writing
competitor docs
repo-local evidence
target-repo evidence
user-provided research
```

Legal/content boundary:

- Do not copy paid/proprietary course material into KRN.
- Use public pages, personal notes supplied by the user, or short source
  summaries that map to mechanisms and decisions.
- Prefer links and mechanisms over transcripts.

Consumer routing:

```txt
standard:
  durable coding or review rule

skill:
  repeated execution workflow

architecture decision:
  rare source-backed decision; prefer roadmap, Beads, or store-backed
  SourceDecision over markdown ADR files

eval/golden candidate:
  behavior can be falsified

memory/source candidate:
  useful future recall, still review-gated

CLI/readback/CI behavior:
  operator-facing or enforcement surface

bounded repair:
  one small source change with verification

reject:
  source is decorative, unsupported, stale, or mismatched to KRN
```

Do not proceed from retained knowledge to implementation unless the consumer and falsifier
are explicit.

## Usefulness Feedback Closure

If a source materially shaped code, infra, harness, CI, eval, TypeScript,
operator UX, or Codex-surface work, close the loop after execution:

```txt
krn evidence capture --source-usefulness "claim:<source-id>=helped|reason|evidence-ref[,ref]|doesNotProve"
```

Use `decision:<id>` instead of `claim:<id>` when the retained object is a
SourceDecision.

If usefulness is not measured, record why in the report or plan outcome. Accept
only bounded reasons:

```txt
no persisted run
source was rejected
source was background context only
no implementation/review decision used it
legal/content boundary
```

Do not leave a course, paper, docs page, practitioner claim, or repo-local
source as decorative authority after it influences implementation.

## Verification

The mapped source must change a decision, reject a path, define a risk, create a
testable hypothesis, constrain implementation, or be closed by source
usefulness feedback with a proof/non-proof boundary.

## Stop Condition

Stop when every used source has a mechanism, KRN implication, decision or
rejection, consumer, falsifier, `does_not_prove`, and usefulness closure or a
bounded reason usefulness was not measured.
