# Second Opinion Prompt: KRN Skill System Normalization

You are reviewing a repo-local AI engineering skill system. Give a critical
second opinion. Do not praise the work by default. Find contradictions, missing
mechanisms, useless abstractions, missing templates/references, and places where
the skill system will fail under fresh-agent loop execution.

## Repo Context

KRN is a Codex operating layer / AI engineering control plane.

Codex executes. KRN supplies bounded context, service/store-backed memory,
source grounding, policy, skills, eval expectations, traces, review gates, and
feedback.

Current product goal: build a temporal Memory Core that gives Codex a governed
DecisionPacket: selected current knowledge, stale/rejected paths, source
support, task-specific use, and falsifiers.

Important distinction:

- `KRN_ROADMAP.md` is product and architecture direction. It can change.
- `CONTEXT.md` should hold shared operating vocabulary.
- `CONVENTIONS.md` should hold stable skill/artifact rules.
- `docs/adr/` should hold rare hard-to-reverse decisions.
- Beads is durable task state: issues, blockers, frontier, claims, follow-ups.
- Store-backed KRN systems are runtime memory/source/evidence/feedback. Markdown
  must not become runtime memory.

## Current Local Artifacts To Review

Read these files first:

- `CONTEXT.md`
- `CONVENTIONS.md`
- `docs/adr/0001-skill-operating-artifact-layer.md`
- `AGENTS.md`
- `README.md`
- `KRN_ROADMAP.md` sections around Artifact Contract / skills
- `.agents/skills/*/SKILL.md`
- `.agents/skills/**/references/*.md`
- `.agents/skills/**/templates/*.md`
- `skill-analysis/NORMALIZATION-GAPS.md`
- `skill-analysis/generated/loop-diagnostics.md`
- `skill-analysis/generated/skill-utility-pl.md`
- `skill-analysis/generated/skill-bundle.md`
- `skill-analysis/dashboard.html`

## External Sources And Links

Use these as the source context. Do not treat any one source as automatically
correct. Extract mechanisms, compare them to KRN's constraints, and say what
should be adopted, rejected, or changed.

### Matt Pocock Videos Provided Earlier

- https://www.youtube.com/watch?v=A8mokin_YOs
- https://www.youtube.com/watch?v=UzMNBN6xLLA
- https://www.youtube.com/watch?v=dtAJ2dOd3ko&t
- https://www.youtube.com/watch?v=xUnRQ9vLXxoz
- https://www.youtube.com/watch?v=6BB6exR8Zd8
- https://youtu.be/llwTBpPqo9A?si=3DWWxlnW0RY0Lzar
- https://www.youtube.com/watch?v=hX7yG1KVYhI
- https://www.youtube.com/watch?v=9VNG0h4pLh0
- https://www.youtube.com/watch?v=3MP8D-mdheA&t=5s

### Matt Pocock Skills

- Skills repo: https://github.com/mattpocock/skills
- Releases: https://github.com/mattpocock/skills/releases
- v1.1 video: https://www.youtube.com/watch?v=A8mokin_YOs
- Wayfinder source: https://github.com/mattpocock/skills/blob/main/skills/engineering/wayfinder/SKILL.md
- AI Hero to-tickets article: https://www.aihero.dev/skills-to-tickets
- Total TypeScript articles index: https://www.totaltypescript.com/articles

Key Matt v1.1 mechanisms to evaluate:

- `/to-prd` became `/to-spec`
- `/to-issues` became `/to-tickets`
- `/wayfinder` maps huge/foggy work into issue maps with blocking edges
- `/code-review` uses Martin Fowler-style smells
- `/research` and `/prototype` support the Wayfinder workflow
- grilling fixes: no self-grilling, no jumping straight to implementation
- lifecycle flow: `grill -> spec -> tickets -> implement -> code review`
- `wayfinder` is a situational on-ramp for greenfield/huge work, not
  necessarily the default spine

### Loop Engineering

- Addy Osmani loop engineering: https://addyosmani.com/blog/loop-engineering/
- Cobus Greyling loop-engineering repo: https://github.com/cobusgreyling/loop-engineering

Loop concepts to evaluate:

- prompt engineering -> context engineering -> harness engineering -> loop
  engineering
- automations, worktrees, skills, MCP/plugins/connectors, sub-agents, memory
- maker/checker separation
- stop condition as contract
- token/turn budgets
- durable state outside chat
- fail loud, not long
- Ralph-style repeated fresh-agent loops against a stable spec

### AI Skill / Agent Docs

- Claude Skills overview: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview
- Claude Skills best practices: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
- Vercel Agent docs: https://vercel.com/docs/agent
- Vercel AGENTS.md eval: https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals

Evaluate the tension between:

- always-loaded `AGENTS.md` / repo guidance;
- progressively disclosed skills;
- skill-local references/templates/scripts;
- context cost and invocation reliability.

### OpenAI / GPT Actions Future PR Loop

- GPT Actions intro: https://developers.openai.com/api/docs/actions/introduction
- GPT Actions getting started: https://developers.openai.com/api/docs/actions/getting-started
- GPT Actions authentication: https://developers.openai.com/api/docs/actions/authentication

Future idea to evaluate:

We may build a custom GPT action that can talk back and forth with Codex through
GitHub PR comments/review threads. The goal is not generic chat. The goal is a
checker harness:

1. Codex opens or updates a PR.
2. A reviewer agent comments with concrete findings, questions, or requested
   evidence.
3. Codex responds in PR comments, changes code when needed, and posts proof.
4. The loop stops only when unresolved findings are closed or explicitly
   rejected with evidence.

Please identify the minimal protocol and artifacts needed before automating
this: comment template, response template, unresolved-thread state,
authentication boundary, stop condition, turn/token budget, and maker/checker
identity separation.

## Current Hypotheses To Challenge

Challenge these. Do not accept them unless the repo evidence supports them.

1. `to-spec` and `to-tickets` should probably begin as explicit modes inside
   the existing `beads` skill, because the output is Beads issues, acceptance
   criteria, dependency edges, and frontier.
2. `wayfinder` is a different mechanism from `to-tickets`: it is for foggy work
   where the plan is not knowable yet. It may start as a Beads mode but could
   deserve a separate skill if it overloads `beads` or causes premature
   implementation.
3. `diagnosing-bugs` is the clearest missing skill because KRN has TDD but no
   red-capable repro gate before hypotheses.
4. `domain-modeling` should become the place that updates `CONTEXT.md`,
   `CONVENTIONS.md`, and rare ADRs when terminology or operating decisions are
   resolved.
5. `source-to-decision` may be too broad because it mixes research intake,
   mechanism extraction, KRN decision capture, falsifiers, and learning
   candidates.
6. `code-review` is relatively strong already because it separates Standards
   from Spec and includes smell review, but it may still lack PR-thread
   back-and-forth protocol.

## What I Need From You

Return a structured review with these sections:

1. **Executive Verdict**
   - Is this skill system becoming more useful, or just more documented?
   - What is the single biggest architectural risk?

2. **Matt Pocock Alignment**
   - Which Matt mechanisms are captured well?
   - Which Matt mechanisms are misunderstood or missing?
   - Where are we copying shape but missing psychology?

3. **Loop Engineering Readiness**
   - Score L0-L4 maturity.
   - Identify missing pieces for L1, L2, L3, L4.
   - Say what must not be automated yet.

4. **Artifact Layer Review**
   - Assess `CONTEXT.md`, `CONVENTIONS.md`, ADR lane, skill references,
     templates, and dashboard/bundle.
   - Identify duplication, authority conflicts, and places where roadmap is
     still too coupled to skill behavior.

5. **Skill-By-Skill Utility Review**
   For every `.agents/skills/*` skill, classify:
   - keep;
   - rewrite;
   - split;
   - merge into another skill;
   - delete/defer.

   For each classification, explain the exact repeated behavior it should
   change and the deterministic stop condition.

6. **Planning Flow Decision**
   - Should `to-spec`, `to-tickets`, and `wayfinder` be Beads modes or separate
     skills?
   - Give a concrete decision tree for when to use each.

7. **Review And Debugging Gap**
   - What is missing in review?
   - What is missing in debugging?
   - Should `diagnosing-bugs` be added now? If yes, draft its minimal shape.

8. **Custom GPT PR Comment Loop**
   - Is the proposed GPT Action -> bridge API -> GitHub PR comments -> Codex
     loop coherent?
   - What are the security/auth risks?
   - What exact protocol should exist before code?
   - What is the minimum proof-of-concept?

9. **Recommended Next 5 Changes**
   Order them by leverage and risk reduction. Each should include:
   - file(s) to change;
   - expected benefit;
   - stop condition;
   - verification command or review method.

10. **Red Flags**
    List anything that feels over-engineered, under-specified, contradictory,
    or likely to waste time.

Be direct. Prefer concrete file-level recommendations over generic advice.
