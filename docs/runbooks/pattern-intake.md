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

## Surface Consumer Matrix

Use this matrix before adopting a source for a non-trivial KRN slice. Pick one
primary surface first, then one primary consumer. If the source does not fit a
surface and consumer, reject or defer it.

| Surface | Preferred source classes | Preferred consumers | Proof / falsifier | Reject when |
|---|---|---|---|---|
| Infra / storage / migrations / queues | official docs, repo evidence, CI/DB evidence, target-run reports, papers as hypotheses | ADR, bounded repair, CI/readback behavior, eval/golden candidate | DB readiness, migration check, repository test, rollback path, or ADR falsifier proves the mechanism matters locally | it only names a tool, changes topology broadly, or lacks rollback/failure evidence |
| Harness / activation / memory / review gates | repo evidence, dogfood reports, target evidence, papers as hypotheses, official docs for runtime mechanics | skill, eval/golden candidate, memory/source candidate, bounded repair | future run shows lower context waste, better recall, clearer reviewability, or a failing golden catches drift | it optimizes scoring without run evidence or treats persisted data as useful by default |
| CI / release / eval / Promptfoo | official docs, CI evidence, repo evidence, controlled scenario reports | CI/readback behavior, eval/golden candidate, ADR when topology changes | CI catches a real regression or smoke result has a stated proof/non-proof boundary | it creates benchmark theater, broad lanes, or checks that do not protect a named behavior |
| Codex surfaces / skills / hooks / MCP / subagents | official Codex docs, repo-local skill evidence, operator reports, controlled target reports | skill, ADR, CLI/readback behavior, bounded repair | repeated workflow becomes executable with less context, or a hook/MCP/subagent decision has a clear trust boundary | it expands AGENTS.md, creates agent zoo, or treats guardrails as full enforcement |
| Target-repo workflow | target evidence, owner/operator input, repo evidence, CI evidence | skill, CLI/readback behavior, memory/source candidate, bounded repair | target trial preserves owner scope, dirty-state rules, patch lifecycle, and command proof | it writes to living repos without explicit scope or calls self/headless work second-operator proof |
| TypeScript boundaries | repo evidence, TypeScript standards, public course pages, practitioner writing, compiler/test evidence | standard, bounded repair, eval/golden candidate, memory/source candidate | typecheck/tests prove unknown-first parsing, narrow unions, exported public types, or invalid-state prevention | it causes broad type rewrites, weakens types to pass, or adopts style without lifecycle evidence |
| Security / permissions / trust boundaries | official docs, repo evidence, target evidence, CI evidence, papers as risk hypotheses | ADR, standard, skill, CI/readback behavior | permission boundary, sandbox rule, secret handling, or external IO path has explicit proof and rollback | it relies on convention, hidden behavior, or a claim that cannot be tested locally |
| Operator UX / CLI / readback | operator reports, dogfood reports, target-run reports, CLI evidence, official docs for mechanics | CLI/readback behavior, skill, bounded repair, memory/source candidate | output reduces review burden, separates proof from non-proof, and survives a focused CLI test | it adds wording without changing a decision, hides weak evidence, or requires broad rereads |

Matrix rules:

- One retained source gets one primary surface and one primary consumer.
- Cross-surface implications are notes, not extra consumers, unless a later slice
  promotes them.
- A course or paper normally starts as `lab_test` unless repo/target evidence
  already falsifies or confirms the mechanism.
- A source that only says "use best practices" is decorative.
- A source that cannot name a local proof, falsifier, or rejection condition is
  not ready.

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
