# ADR-0014: Activation Is Admission Control

Status: Accepted

Date: 2026-06-23

## Context

KRN does not need more context by default. It needs a typed mechanism that
decides which retrieved memory, source, search, and observation material is
allowed into a Codex-facing context assembly.

Retrieval can find candidates. Similarity, lexical match, or a search hit does
not grant permission to use a candidate. Activation is the trust boundary
between recall and context.

## Source Decision

source: `docs/KRN_KERNEL.md`
mechanism: canonical spine renders `ContextAssembly` before Codex adapter
output and states that `ContextPacket` is not the central model.
KRN implication: admission decisions belong in typed activation/context models,
not in prompt assembly.
decision: adopt.
rejection: do not let Codex brief rendering decide what is safe to include.
falsifier: excluded, unsafe, stale, or contradicted candidates reach Codex
without activation exclusion evidence.

source: `docs/reviews/repo-reset-audit/FULL_REPO_AUDIT.md`
mechanism: identifies behavior-governing activation metadata and says project
scope, linked subject identity, abstention, prefix gates, and raw recall
triggers must move to typed models/read models.
KRN implication: activation must record both allowed and rejected context using
typed reasons.
decision: adopt.
rejection: do not treat metadata or smoke output as product proof of activation
behavior.
falsifier: merge, conflict, abstention, or raw recall decisions depend on
generic metadata keys again.

## Decision

Activation is admission control, not prompt assembly.

Activation must filter candidates by:

- trust tier and source support;
- temporal validity and invalidation;
- anti-memory conflicts;
- source-claim mechanism and does-not-prove requirements;
- budget, token cost, and context ROI;
- duplicate linked subject identity;
- observation prefix source-range gates;
- exact-proof and low-trust raw recall requirements.

Activation can abstain. Abstention is a valid result when candidates are absent,
weak, unsafe, stale, over budget, or entirely excluded.

Activation must produce both inclusions and exclusions. Exclusions are not
incidental logs; they are evidence for why context was withheld.

Activation must preserve enough trace to explain:

- why a candidate was included;
- why a candidate was excluded;
- whether anti-memory blocked it;
- whether raw evidence recall is required;
- what the candidate was expected to do in the decision.

Similarity is not permission. A high lexical/vector score may improve ranking,
but it cannot override trust, temporal, source-support, anti-memory, or budget
rules.

Raw recall is part of admission control. Exact proof, low trust, and conflict
signals can require raw evidence recall even when a candidate is included.

## Consequences

- P4-01 must prove activation rejects noisy/bad context instead of dumping all
  retrieved candidates.
- P4-01 must cover stale memory abstention, anti-memory blocks, unsupported
  source decisions, source-ranged observation prefix gates, and raw recall on
  exact proof.
- P4-02 must keep activation trace decisions typed where they affect behavior.
- Codex adapter code receives rendered context after activation; it does not
  make independent safety/admission decisions.

## Rejections

- ranking as permission;
- prompt assembly as the first trust boundary;
- context dump by default;
- hiding exclusions in logs only;
- using generic metadata as behavior authority;
- treating Promptfoo smoke or DB smoke as proof of activation behavior.

## Verification

This ADR is upheld when:

- activation tests prove both inclusion and exclusion behavior;
- anti-memory blocks unsafe candidates;
- stale or weak context can abstain;
- source claims without required support are excluded;
- observation prefix rejects unsourced truth-bearing items;
- exact-proof and low-trust cases emit raw recall triggers;
- context assembly exposes typed inclusions, exclusions, abstention, and prefix
  gate fields.

This ADR is violated when:

- activation admits candidates solely because they rank highly;
- excluded candidates silently disappear without reason;
- Codex adapter decides trust or conflict admission;
- raw recall triggers are lost;
- behavior-governing activation state moves back to generic metadata.
