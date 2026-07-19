# KRN Context

KRN is a Codex operating layer. It gives an agent bounded, governed context for
one task, records whether that context helped, and feeds useful evidence back
into durable memory/source systems.

This file defines shared language for operators and agents. It is not a roadmap,
task list, scratchpad, runtime memory, or implementation plan.

## Operational Gotcha Index

These are stable, repo-local traps that have repeatedly caused false progress
or invalid evidence. Read the matching detail before entering the workflow.
The durable entries live in [`docs/CONTEXT_GOTCHAS.md`](docs/CONTEXT_GOTCHAS.md);
this index stays short so it can be read every session.

| Workflow | Read before acting | Core boundary |
| --- | --- | --- |
| Live Codex evaluation | [Auth and invocation](docs/CONTEXT_GOTCHAS.md#live-codex-auth-and-invocation) | Use the active Codex profile; a copied fixture auth file is not proof of current auth. |
| Retained paired fixtures | [Fixture lifecycle](docs/CONTEXT_GOTCHAS.md#retained-fixture-lifecycle) | Retain only for capture, then run the guarded cleanup and verify zero owned rows. |
| Trial interpretation | [Invalid versus quality outcome](docs/CONTEXT_GOTCHAS.md#trial-interpretation) | Missing obedience, capability, packet, or auth evidence is not a win/loss/tie. |
| Trial chronology | [First trial versus rerun](docs/CONTEXT_GOTCHAS.md#first-trial-versus-rerun) | Report the original trial separately from reruns and harness debugging. |
| Trial readback | [Aggregate and evidence identity](docs/CONTEXT_GOTCHAS.md#trial-readback) | New eval families and checker revisions must appear in aggregate and persistence readbacks before claims are reused. |
| CLI argument forwarding | [Entrypoint arguments](docs/CONTEXT_GOTCHAS.md#entrypoint-arguments) | Verify what `pnpm` forwards before treating an argument failure as product behavior. |
| Scope control | [Memory Core boundary](docs/CONTEXT_GOTCHAS.md#memory-core-boundary) | Improve governed context/evidence; do not grow an operator/executor platform without a consumer falsifier. |

## Language

**KRN**:
The control plane around Codex execution: context selection, source grounding,
policy, skills, evidence, review gates, and feedback.
_Avoid_: app, dashboard, docs archive

**Codex**:
The executor that reads a bounded task context, edits code, runs commands, and
reports evidence.
_Avoid_: memory owner, source of product truth

**DecisionPacket**:
The bounded packet KRN gives Codex for one task: selected current context,
support, stale or rejected paths, expected use, and falsifiers.
_Avoid_: prompt dump, memory blob, all context

**Source**:
Provenance for claims and decisions. A source can support, reject, stale, or
qualify a path.
_Avoid_: note, random document, context because nearby

**Memory**:
Temporal retained knowledge with lifecycle, promotion, demotion, staleness,
feedback, and forgetting.
_Avoid_: markdown memory folder, TODO list

**Knowledge**:
Durable retained content that has earned reuse through evidence.
_Avoid_: pattern card, vibe, final note

**Skill**:
A versioned operating protocol that changes how an agent performs a repeated
workflow.
_Avoid_: long advice doc, motivational checklist

**Artifact**:
A durable file, issue, record, or evidence output that makes a loop more
predictable.
_Avoid_: chat-only decision, decorative markdown

**Spec**:
A settled description of a change before ticket slicing: problem, solution,
user stories or operator stories, implementation decisions, testing decisions,
out of scope, and open questions.
_Avoid_: loose plan, ticket list

**Ticket**:
An agent-sized Beads issue with acceptance criteria, proof/non-proof boundary,
and blocking edges where needed.
_Avoid_: horizontal layer task, broad epic disguised as work

**Wayfinding**:
A planning protocol for foggy work where the route is not known yet. It names a
destination, records decisions so far, tracks not-yet-specified fog, and exposes
a frontier of answerable tickets.
_Avoid_: implementation plan, generic backlog grooming

**Frontier**:
Open, unblocked, unclaimed work that can be taken by a fresh agent context.
_Avoid_: entire backlog

**Maker**:
The agent or skill that changes code or creates the primary artifact.
_Avoid_: self-reviewer

**Checker**:
The independent review or verification pass that can reject maker output.
_Avoid_: final answer polish

**Proof**:
Command output, tests, typecheck, smoke result, diff evidence, or other
repeatable evidence that supports a claim.
_Avoid_: confidence, green-by-assumption

**Non-proof**:
Evidence that is useful but insufficient to prove the claim, such as a summary,
manual inspection, or narrow smoke that does not cover the behavior.
_Avoid_: pretending partial evidence is complete proof
