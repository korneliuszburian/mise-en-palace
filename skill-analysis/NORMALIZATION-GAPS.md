# Normalization Gaps

This is the current gap analysis between KRN skills and Matt Pocock's v1.1 skill
system. The goal is usefulness in the engineering loop, not matching his repo
file-for-file.

## Current Score

| Layer | KRN State | Gap | Severity |
|---|---|---|---|
| Shared vocabulary | `CONTEXT.md` now exists | Need skills to consume it consistently | medium |
| Skill conventions | `CONVENTIONS.md` now exists | Need skills to reference it instead of hardcoding roadmap rules | high |
| ADR lane | `docs/adr/0001...` now exists | Need domain-modeling/source-to-decision to promote only real ADRs | medium |
| Skill references | Mostly absent | Need references for debug, review, Beads planning modes, source decisions | high |
| Skill templates | Absent | Need templates for spec, ticket, wayfinding map, review output, ADR | high |
| Scripts | Mostly absent | Need only where deterministic helper behavior beats prose | low |
| Review layer | Strong baseline | Need fresh-agent checker discipline in looped PR workflow | medium |
| Debug layer | Missing | Need `diagnosing-bugs` with red-capable repro gate | high |
| Planning lifecycle | Partial | `to-spec` and `to-tickets` can likely be Beads modes | medium |
| Wayfinding | Partial | Needs explicit map issue protocol and frontier rules | high |

## Matt's Mechanism

Matt does not make every skill huge. He keeps `SKILL.md` as the invocation and
process surface, then moves reusable detail into files beside it:

- `domain-modeling/CONTEXT-FORMAT.md`
- `domain-modeling/ADR-FORMAT.md`
- `tdd/tests.md`
- `tdd/mocking.md`
- `diagnosing-bugs/scripts/hitl-loop.template.sh`
- `setup-matt-pocock-skills/issue-tracker-*.md`
- templates embedded in `to-spec`, `to-tickets`, and `wayfinder`

The psychology is not "more docs." It is: make the repeated decision artifact
visible, small, and copyable so a fresh agent does not rebuild the method from
chat history.

## KRN Interpretation

`KRN_ROADMAP.md` is not the right home for skill mechanics. It can change when
the product direction changes. Skills need a more stable operating substrate:

- `CONTEXT.md` for words;
- `CONVENTIONS.md` for artifact rules;
- `docs/adr/` for rare operating decisions;
- skill-local `references/` for branch-specific procedure;
- skill-local `templates/` for shapes agents must reproduce.

## Planning Decision

`to-spec` and `to-tickets` should start as explicit Beads modes because their
natural output is Beads state:

- spec issue or issue body;
- tracer-bullet tickets;
- acceptance criteria;
- dependency edges;
- frontier.

`wayfinder` is different. It is not just ticket generation. It is for foggy work
where the plan is not knowable yet. Its output is a map issue with:

- destination;
- notes;
- decisions so far;
- not yet specified;
- out of scope;
- child decision/research/prototype/task tickets;
- one-ticket-per-session frontier discipline.

This can live inside `beads` first. Split it into a separate skill only if the
Beads skill becomes overloaded or agents prematurely execute instead of
planning.

## Review And Debug Gap

Review is close to useful:

- KRN has `code-review`;
- it separates Standards from Spec;
- it includes Fowler-style smells;
- it names verification gaps.

Missing review piece:

- fresh maker/checker separation in PR loop;
- PR comment back-and-forth protocol;
- reviewer identity and unresolved-thread handling.

Debugging is not close enough:

- `tdd` is not diagnosis;
- no skill requires a red-capable repro before hypotheses;
- no bug loop forces reproduce/minimize/instrument/fix/regression/cleanup.

Next useful skill addition: `diagnosing-bugs`.

## PR Back-And-Forth Idea

The future custom GPT / PR comment loop should be treated as a checker harness:

1. Codex opens or updates a PR.
2. A reviewer agent comments with concrete findings, questions, or requested
   evidence.
3. Codex responds in PR comments, changes code when needed, and posts proof.
4. The loop stops only when unresolved findings are closed or explicitly
   rejected with evidence.

This needs templates and protocol before automation:

- PR review comment template;
- Codex response template;
- unresolved-thread state;
- stop condition;
- token/turn budget;
- maker/checker identity separation.

OpenAI GPT Actions should enter this design as a source-backed integration
decision, not as a guessed mechanism. Relevant official docs:

- `https://developers.openai.com/api/docs/actions/introduction`
- `https://developers.openai.com/api/docs/actions/getting-started`
- `https://developers.openai.com/api/docs/actions/authentication`

The likely shape is: Custom GPT action -> small authenticated KRN/GitHub bridge
API -> GitHub PR comments/review threads -> Codex-visible checker loop.
