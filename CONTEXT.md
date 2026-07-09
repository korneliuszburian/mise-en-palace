# KRN Context

KRN is a Codex operating layer. It gives an agent bounded, governed context for
one task, records whether that context helped, and feeds useful evidence back
into durable memory/source systems.

This file defines shared language for operators and agents. It is not a roadmap,
task list, scratchpad, runtime memory, or implementation plan.

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
