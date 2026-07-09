# Knowledge Gate

Use this reference when a non-trivial KRN slice touches retained knowledge,
source authority, policy, evals, Codex surfaces, TypeScript boundaries, target
repos, trust, security, or operator-facing readbacks.

## Procedure

1. Classify whether the slice touches one of these knowledge surfaces:

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

2. If it does, choose exactly one path:
   - cite an existing KRN source, standard, architecture decision, or skill and
     state the mechanism;
   - add a bounded source decision;
   - reject or defer source work with a reason.
3. Do not proceed from retained knowledge to implementation unless the consumer
   and falsifier are explicit.

## Allowed Source Classes

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

## Consumer Routing

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

## Legal Boundary

- Do not copy paid/proprietary course material into KRN.
- Use public pages, personal notes supplied by the user, or short source
  summaries that map to mechanisms and decisions.
- Prefer links and mechanisms over transcripts.

## Stop Condition

Stop when the source path is adopted, rejected, or deferred with a consumer,
falsifier, and `does_not_prove`, or when the slice is explicitly classified as
not source-shaped.
