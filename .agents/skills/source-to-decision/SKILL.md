---
name: source-to-decision
description: Map sources into mechanisms, KRN implications, decisions, rejections, and falsifiers. Use whenever Codex cites OpenAI docs, Cookbook examples, papers, practitioner writing, competitor docs, local repo evidence, or user-provided material to justify KRN architecture, policy, skill, memory, context, eval, MCP, hook, subagent, or TypeScript decisions.
---

# Source To Decision

Use this skill to prevent source hoarding.

## Workflow

1. Identify the exact source and trust tier.
2. Extract the mechanism, not just the claim.
3. State the KRN implication.
4. Decide: adopt, reject, lab-test, or defer.
5. State what the source does not prove.
6. Name the consumer: doc, ADR, skill, type, policy gate, eval candidate, or CLI
   behavior.
7. Add a falsifier.

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

## Forbidden

- Do not retain decorative links.
- Do not treat practitioner or competitor claims as Codex truth.
- Do not use a source without `does_not_prove`.
- Do not cite raw onboarding material as default context; cite the derived doc
  unless auditing the raw source.

## Verification

The mapped source must change a decision, reject a path, define a risk, create a
testable hypothesis, or constrain implementation.

