---
name: source-to-decision
description: Use when Codex cites OpenAI docs, Cookbook examples, papers, practitioner writing, competitor docs, local repo evidence, or user-provided material to justify KRN architecture, policy, skill, memory, context, eval, MCP, hook, subagent, or TypeScript decisions.
---

# Source To Decision

Use this skill to prevent source hoarding.

## Trigger

- A decision depends on external docs, papers, competitor/practitioner writing,
  local repo evidence, or user-provided material.
- A source might otherwise become decorative context.

## Workflow

1. Identify the exact source and trust tier.
2. Extract the mechanism, not just the claim.
3. State the KRN implication.
4. Decide: adopt, reject, lab-test, or defer.
5. State what the source does not prove.
6. Name the consumer: doc, ADR, skill, type, policy gate, eval candidate, or CLI
   behavior.
7. Add a falsifier.

## Research Intake Rules

Use this lane for official docs, papers, practitioner writing, course material,
competitor docs, local evidence, and user-provided research.

For multi-source, course, paper, practitioner-pattern, or operator-facing
intake, use `docs/runbooks/pattern-intake.md` as the fuller procedure. Keep
this skill as the trigger/gate; keep the runbook as the workflow.

Keep the gate strict:

- Source without mechanism is decoration.
- Mechanism without KRN implication is a note.
- Implication without decision or rejection is backlog pressure.
- Decision without falsifier is dogma.
- Practitioner or course guidance can shape style, but it does not override
  repo evidence, tests, or KRN architecture law.
- Papers can create hypotheses, eval candidates, or ADR evidence, but they do
  not become product truth without local falsifiers.
- Official docs can define current product mechanics, but still need a KRN
  implication and a proof/non-proof boundary.

Preferred consumers:

- `docs/KRN_SOURCES.md` for durable source maps.
- ADRs for architecture decisions.
- Standards docs for coding rules.
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
mechanism:
krn_implication:
decision:
does_not_prove:
consumer:
falsifier:
```

Optional when useful:

```yaml
decision_kind: adopt | reject | lab_test | defer
candidate_output:
  type: MemoryCandidate | SourceDecision | EvalCandidate | SkillCandidate | none
  reviewability: ready | needs_more_evidence | too_vague | duplicate | not_useful | unknown
```

## Forbidden

- Do not retain decorative links.
- Do not treat practitioner or competitor claims as Codex truth.
- Do not use a source without `does_not_prove`.
- Do not cite raw onboarding material as default context; cite the derived doc
  unless auditing the raw source.
- Do not create a research archive, source crawler, or broad research backlog
  from a source that has no immediate consumer.

## Continuous Pattern Gate

Use this gate at every non-trivial KRN slice, not only research-labeled tasks.

Before adopting, rejecting, or implementing a pattern, classify whether the
slice touches one of these pattern surfaces:

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

- cite an existing KRN source/standard/ADR/skill and state the mechanism; or
- add a bounded source decision; or
- explicitly reject/defer source work with a reason.

Allowed source classes:

```txt
official docs
papers
high-quality courses
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

ADR:
  architecture or infrastructure decision

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

Do not proceed from pattern to implementation unless the consumer and falsifier
are explicit.

## Verification

The mapped source must change a decision, reject a path, define a risk, create a
testable hypothesis, or constrain implementation.
