# Knowledge Gate

Use this reference only for source-shaped authority work: selecting, retaining,
rejecting, measuring, or changing source, knowledge, trust, eval, or readback
semantics.

Do not use this gate for ordinary TypeScript, target-repo, Codex-surface, or
readback work unless that work changes source/knowledge authority.

## Procedure

1. Classify whether the slice changes one of these authority surfaces:

   ```txt
   source selection / source rejection
   knowledge retention / demotion / forgetting
   trust or safety filtering
   eval/golden selection semantics
   evidence/source usefulness measurement
   operator readback of source or knowledge authority
   target-repo or TypeScript behavior that changes source/knowledge authority
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

Stop when the source-shaped authority path is adopted, rejected, or deferred
with a consumer, falsifier, and `does_not_prove`, or when the slice is
explicitly classified as ordinary implementation/review work.
