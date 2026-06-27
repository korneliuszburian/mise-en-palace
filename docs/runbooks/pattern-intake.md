# Pattern Intake Runbook

Status: operator runbook.

Use this runbook when a course, paper, official doc, practitioner article,
competitor doc, local report, target-repo finding, or user-provided research
might improve KRN.

## Core Rule

Do not store sources because they look smart.

Every retained source must pass:

```txt
source -> mechanism -> KRN implication -> decision/rejection -> consumer -> falsifier
```

If any step is missing, reject or defer the source. Do not create a research
archive, crawler, broad reading backlog, or active-context pile.

## Allowed Sources

```txt
official docs
papers
high-quality public course pages
user-provided course notes or summaries
practitioner writing
competitor docs
repo-local evidence
target-repo evidence
user-provided research
```

## Legal And Content Boundary

Do not copy paid or proprietary course material into KRN.

Allowed:

- public URLs;
- short mechanism summaries;
- user-provided notes when the user explicitly supplies them;
- links plus KRN decisions;
- repo-local evidence and target-run reports.

Forbidden:

- transcripts of paid course lessons;
- source dumps;
- scraped course modules;
- copyrighted long excerpts;
- retaining a source with no consumer.

## Trust Tiers

```txt
high:
  official docs, repo-local evidence, CI evidence, DB readback, target-run
  reports with command proof.

medium:
  respected practitioner writing, public course pages, papers with plausible
  mechanism but no local falsifier yet.

low:
  social posts, unverified claims, stale docs, anecdotal competitor behavior,
  unreviewed notes.
```

Trust tier does not decide adoption by itself. A high-trust source can still be
irrelevant, and a medium-trust source can still create a useful lab-test.

## Intake Workflow

1. Identify the exact source.
2. Classify trust tier.
3. Extract the mechanism, not the vibe.
4. State the KRN implication.
5. Decide one of:
   - adopt;
   - reject;
   - lab-test;
   - defer.
6. Pick exactly one primary consumer.
7. Add a falsifier.
8. State what the source does not prove.
9. Decide whether a candidate should be emitted.
10. Keep the retained note as small as possible.

## Consumer Routing

Choose one primary consumer:

```txt
standard:
  durable coding, review, security, TypeScript, or quality rule.

skill:
  repeated execution workflow for Codex.

ADR:
  architecture, infra, storage, runtime, or package topology decision.

eval/golden candidate:
  behavior can be falsified by a test, fixture, or CI step.

memory/source candidate:
  useful future recall, still review-gated and never automatically promoted.

CLI/readback/CI behavior:
  operator-facing output, command behavior, or enforcement surface.

bounded repair:
  one small source change with verification.

rejection:
  decorative, unsupported, stale, illegal to retain, or mismatched to KRN.
```

If there is no consumer, reject or defer.

## Output Template

```yaml
source_id:
title:
url_or_ref:
trust_tier: high | medium | low
source_class:
mechanism:
krn_implication:
decision_kind: adopt | reject | lab_test | defer
decision:
consumer:
falsifier:
does_not_prove:
candidate_output:
  type: MemoryCandidate | SourceDecision | EvalCandidate | SkillCandidate | none
  reviewability: ready | needs_more_evidence | too_vague | duplicate | not_useful | unknown
next_action:
```

## Rejection Reasons

Use explicit rejection instead of quiet accumulation:

```txt
decorative:
  no mechanism or KRN implication.

no_consumer:
  interesting, but no standard/skill/ADR/eval/memory/CLI/repair target.

no_falsifier:
  cannot be checked locally or in a future controlled scenario.

copyright_or_access:
  source cannot be legally retained or summarized beyond a public mechanism.

stale_or_conflicting:
  contradicted by newer official docs, repo evidence, or target evidence.

too_broad:
  would require a research project instead of one bounded KRN decision.
```

## Examples

### Official Codex Docs To Skill

```yaml
source_id: codex-skills-progressive-disclosure
title: Codex Skills
url_or_ref: docs/KRN_SOURCES.md#skills
trust_tier: high
source_class: official docs
mechanism: Skills expose reusable workflows through progressive disclosure.
krn_implication: Repeated KRN workflows belong in repo-local skills, not giant AGENTS.md.
decision_kind: adopt
decision: Keep skills as the repeated workflow surface.
consumer: skill
falsifier: A repeated workflow cannot be executed from the skill without broad rereads.
does_not_prove: Many skills are useful by default.
candidate_output:
  type: none
  reviewability: ready
next_action: update the relevant skill only when a repeated workflow exists.
```

### TypeScript Course Page To Standard

```yaml
source_id: total-typescript-unions-narrowing
title: Unions, Literals, And Narrowing
url_or_ref: docs/KRN_SOURCES.md#unions-literals-and-narrowing
trust_tier: medium
source_class: high-quality public course page
mechanism: Literal unions constrain finite states and make invalid transitions visible.
krn_implication: KRN status, provenance, lifecycle, and candidate states should use narrow unions when fields differ by state.
decision_kind: adopt
decision: Keep discriminated-union guidance in the TypeScript standards.
consumer: standard
falsifier: A future lifecycle model uses optional object soup and permits invalid state combinations.
does_not_prove: Every object needs a discriminant or a broad type rewrite is valuable.
candidate_output:
  type: EvalCandidate
  reviewability: needs_more_evidence
next_action: create a bounded type-boundary check only when source evidence finds drift.
```

### Target Evidence To Bounded Repair

```yaml
source_id: target-dirty-context-evidence
title: Target dirty state observed before repair
url_or_ref: docs/runbooks/target-repo-testing.md
trust_tier: high
source_class: target-repo evidence
mechanism: Dirty target files can belong to another operator and must not be normalized by KRN.
krn_implication: Target repair must downgrade to observation-only unless current writable scope is explicit.
decision_kind: adopt
decision: Keep target dirty-state and patch lifecycle rules in target repo testing.
consumer: CLI/readback/CI behavior
falsifier: A future target trial edits or commits pre-existing dirty files without owner scope.
does_not_prove: Target repair is never allowed.
candidate_output:
  type: MemoryCandidate
  reviewability: ready
next_action: record owner/stability inputs before target writes.
```

## What To Store

Store only the decision record, not the source body.

Preferred storage:

- `docs/KRN_SOURCES.md` for durable source maps;
- ADR for architecture decisions;
- standards doc for durable coding/review rules;
- skill for repeated workflow;
- report for one controlled scenario;
- eval/golden candidate when behavior is falsifiable;
- memory/source candidate only through review-gated paths.

## Verification

A pattern intake is useful only if it does at least one of:

- changes a decision;
- rejects a path;
- defines a risk;
- creates a testable hypothesis;
- constrains implementation;
- creates a bounded next task.

If it does none of those, delete the intake note or mark it rejected.
