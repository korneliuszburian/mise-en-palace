# KRN Sources

Every source retained here must be mapped to mechanism, KRN implication,
decision/rejection, and what it does not prove.

Every retained source should also name source class, decision kind, primary
consumer, and falsifier. If a source has no consumer or cannot be falsified
locally, keep it out of active KRN guidance.

## Codex Native Surfaces

### AGENTS.md

- URL: https://developers.openai.com/codex/guides/agents-md
- Trust tier: high.
- Source class: official docs.
- Decision kind: adopt.
- Mechanism: Codex discovers durable project instructions from `AGENTS.md`
  layers before work.
- KRN implication: keep `AGENTS.md` thin and use it for repo guidance only.
- Decision: active instructions point to `docs/KRN_KERNEL.md` and forbid broad
  rereads.
- Consumer: root `AGENTS.md` and compact `GOAL.md`/`PLAN.md` guidance.
- Falsifier: repeated Codex runs need broad rereads or miss kernel constraints
  because durable repo guidance is too thin or unclear.
- Does not prove: that a giant `AGENTS.md` improves results.

### Skills

- URL: https://developers.openai.com/codex/skills
- Trust tier: high.
- Source class: official docs.
- Decision kind: adopt.
- Mechanism: skills package reusable workflows with progressive disclosure.
- KRN implication: repo-local KRN workflows belong in `.agents/skills/`.
- Decision: create engineering-discipline skills, not custom prompts or stack
  agents.
- Consumer: repo-local `.agents/skills/*` workflows.
- Falsifier: repeated KRN workflows still require copying long prompt blocks
  into chat or root plans instead of loading a targeted skill.
- Does not prove: that many skills are useful by default.

### Subagents

- URL: https://developers.openai.com/codex/subagents
- Trust tier: high.
- Source class: official docs.
- Decision kind: lab_test.
- Mechanism: Codex can explicitly spawn bounded agents with separate context and
  inherited sandbox/approval controls.
- KRN implication: use subagents as organs for bounded review/exploration.
- Decision: start with only `ts-type-critic`.
- Consumer: `.codex/agents/ts-type-critic.toml` and future read-heavy review
  gates only after evidence.
- Falsifier: read-heavy review tasks repeatedly exceed context budget or miss
  TypeScript boundary problems that a read-only critic could catch.
- Does not prove: that broad swarms improve KRN early.

### Hooks

- URL: https://developers.openai.com/codex/hooks
- Trust tier: high.
- Source class: official docs.
- Decision kind: defer.
- Mechanism: lifecycle hooks can run deterministic command handlers and require
  trust review.
- KRN implication: hooks are mechanical gates and audit surfaces.
- Decision: no hidden semantic architecture in hooks.
- Consumer: future hook ADR/policy only when a deterministic command gate is
  accepted.
- Falsifier: a repeated mechanical pre/post action remains manually enforced
  and creates review misses despite a small deterministic hook being available.
- Does not prove: that hooks are sufficient safety control.

### MCP

- URL: https://developers.openai.com/codex/mcp
- Trust tier: high.
- Source class: official docs.
- Decision kind: defer.
- Mechanism: MCP gives Codex tools/resources/prompts with configuration,
  allowlists, auth, and approval modes.
- KRN implication: MCP is a typed tool boundary, not memory.
- Decision: KRN MCP server is later, after CLI/store contracts exist.
- Consumer: future MCP ADR and typed read-model/tool boundary.
- Falsifier: operators repeatedly need structured KRN readback/tool access that
  cannot be served by CLI/DB read models without brittle shell parsing.
- Does not prove: that MCP is safe by default.

### Rules

- URL: https://developers.openai.com/codex/rules
- Trust tier: high.
- Source class: official docs.
- Decision kind: reject.
- Mechanism: rules control command prefixes outside the sandbox and are
  experimental.
- KRN implication: rules are command-policy controls only.
- Decision: do not encode semantic architecture in rules.
- Consumer: local Codex command-policy config only.
- Falsifier: semantic/product behavior is encoded in command rules instead of
  typed KRN plans, skills, tests, or policy gates.
- Does not prove: that rules should be a product brain.

### Permissions And Security

- URLs:
  - https://developers.openai.com/codex/permissions
  - https://developers.openai.com/codex/agent-approvals-security
- Trust tier: high.
- Source class: official docs.
- Decision kind: adopt.
- Mechanism: sandbox, approvals, permission profiles, network policy, and
  destructive tool approval define the local trust boundary.
- KRN implication: do not mix permission profiles and legacy sandbox settings in
  one active config path.
- Decision: bootstrap posture is read/propose for review/subagents,
  workspace-write only for implementation, network off unless explicitly
  allowed.
- Consumer: security/trust-boundary docs, skills, and future permission ADRs.
- Falsifier: a future KRN surface mixes sandbox/approval concepts or grants
  broader execution/network authority without explicit proof and rollback.
- Does not prove: that broad access is acceptable for speed.

### Custom Prompts

- URL: https://developers.openai.com/codex/custom-prompts
- Trust tier: high.
- Source class: official docs.
- Decision kind: reject.
- Mechanism: custom prompts are deprecated in favor of skills.
- KRN implication: reusable KRN workflows should be skills.
- Decision: reject custom prompt library.
- Consumer: skill-first workflow policy and `.agents/skills/*`.
- Falsifier: reusable KRN workflows move into custom prompt snippets instead of
  skills, tests, runbooks, or task contracts.
- Does not prove: that every instruction must become a skill.

## OpenAI Cookbook Patterns

### Goals In Codex

- URL: https://developers.openai.com/cookbook/examples/codex/using_goals_in_codex
- Trust tier: high.
- Source class: official docs.
- Decision kind: adopt.
- Mechanism: goals support continuation with explicit objective and evidence.
- KRN implication: `GOAL.md` should be a current execution contract.
- Decision: keep goal compact and phase-oriented.
- Consumer: root `GOAL.md`.
- Falsifier: `GOAL.md` becomes a ledger/backlog or a completed old slice remains
  the first resume target after compaction.
- Does not prove: that goal should become product brain.

### Iterative Repair Loops

- URL:
  https://developers.openai.com/cookbook/examples/codex/build_iterative_repair_loops_with_codex
- Trust tier: high.
- Source class: official docs.
- Decision kind: adopt.
- Mechanism: review, repair, and validation close the loop.
- KRN implication: KRN needs review capture and small repair loops.
- Decision: later dogfood starts with `krn doctor`.
- Consumer: bounded repair loop tasks and review/evidence commands.
- Falsifier: KRN keeps adding features without a failing check, repair, and
  verification loop tied to one behavior.
- Does not prove: that broad automation should run before kernel spine.

### Agent Improvement Loop

- URL: https://developers.openai.com/cookbook/examples/agents_sdk/agent_improvement_loop
- Trust tier: high.
- Source class: official docs.
- Decision kind: adopt.
- Mechanism: traces and feedback feed eval candidates and improvement.
- KRN implication: eval candidates should come from real traces.
- Decision: no broad benchmark lane before dogfood evidence.
- Consumer: eval/golden candidates and Promptfoo smoke adapter.
- Falsifier: eval cases are added without trace/run evidence or without a
  proof/non-proof boundary.
- Does not prove: that green evals prove product quality.

### Memory And Compaction

- URL:
  https://developers.openai.com/cookbook/examples/agents_sdk/building_reliable_agents_memory_compaction
- Trust tier: high.
- Source class: official docs.
- Decision kind: adopt.
- Mechanism: separate working context from durable memory and compact selected
  state.
- KRN implication: runtime memory must be selected and store-backed.
- Decision: files are export/audit/seed, not Memory Core.
- Consumer: memory/activation architecture and context-condensation rules.
- Falsifier: markdown files become runtime Memory Core or active context grows
  by accumulation instead of selected, store-backed recall.
- Does not prove: that local markdown memory is enough.

### ExecPlans

- URL: https://developers.openai.com/cookbook/articles/codex_exec_plans
- Trust tier: high.
- Source class: official docs.
- Decision kind: adopt.
- Mechanism: ExecPlans preserve objective, discoveries, decisions, validation,
  and next work for long-running implementation.
- KRN implication: root `PLANS.md` is the detailed continuous ExecPlan, while
  root `PLAN.md` stays compact product truth.
- Decision: keep the current `GOAL.md` + compact `PLAN.md` + detailed
  `PLANS.md` split.
- Consumer: root `PLANS.md`, compact root `PLAN.md`, and handoff/compaction
  rules.
- Falsifier: a fresh Codex continuation cannot resume from compact active task
  state without broad rereads or stale completed slices.
- Does not prove: that `PLANS.md` should carry raw logs, old ledgers, or
  decorative research forever.

### Codex Prompting Guide

- URL:
  https://developers.openai.com/cookbook/examples/gpt-5/codex_prompting_guide
- Trust tier: high.
- Source class: official docs.
- Decision kind: adopt.
- Mechanism: Codex performs better when tasks, constraints, expected outputs,
  and verification are explicit.
- KRN implication: every bounded KRN task needs non-goals, allowed writes,
  forbidden writes, verification, proof/non-proof boundaries, rollback, and
  next-task synthesis.
- Decision: keep `PLANS.md` task contracts mandatory for generated active
  tasks.
- Consumer: generated `PLANS.md` task contracts and Codex-facing goal prompts.
- Falsifier: an active task lacks non-goals, allowed/forbidden writes,
  verification, proof/non-proof boundaries, rollback, or next-task synthesis.
- Does not prove: that every small edit needs a verbose prompt.

## TypeScript Practitioner Sources

### Designing Your Types

- URL:
  https://www.totaltypescript.com/books/total-typescript-essentials/designing-your-types-in-typescript
- Trust tier: medium.
- Source class: high-quality public course page.
- Decision kind: adopt.
- Mechanism: Type design communicates business and domain logic, not just
  compiler satisfaction.
- KRN implication: authority, provenance, lifecycle, and review state should be
  visible in domain types where those facts govern behavior.
- Decision: keep `docs/standards/typescript-excellence.md` doctrine that KRN
  TypeScript should make wrong authority hard to express.
- Consumer: TypeScript standards and future type-boundary repair slices.
- Falsifier: KRN domain types allow wrong authority, provenance, lifecycle, or
  review states to be represented without validation or review.
- Does not prove: that a broad type rewrite is valuable.

### Unions, Literals, And Narrowing

- URL:
  https://www.totaltypescript.com/books/total-typescript-essentials/unions-literals-and-narrowing
- Trust tier: medium.
- Source class: high-quality public course page.
- Decision kind: adopt.
- Mechanism: literal unions and narrowing constrain finite states and valid
  transitions.
- KRN implication: status, provenance, lifecycle, subject type, and candidate
  states should use narrow unions or discriminated unions when valid fields
  differ by state.
- Decision: keep discriminated-union guidance in
  `docs/standards/typescript-excellence.md`.
- Consumer: TypeScript boundary standard and lifecycle model reviews.
- Falsifier: a future lifecycle/status/provenance model uses optional object
  soup where valid fields differ by state.
- Does not prove: that every object needs a discriminant.

### TS Reset

- URL: https://www.totaltypescript.com/ts-reset
- Trust tier: medium.
- Source class: practitioner writing.
- Decision kind: adopt.
- Mechanism: stricter platform typings can turn unsafe defaults such as
  `JSON.parse` returning `any` into safer unknown-first behavior, but global
  type changes are application-scoped.
- KRN implication: use unknown-first parsing at CLI/file/env/JSON boundaries,
  but reject global `ts-reset` in `packages/core`, `packages/schema`, and public
  package APIs.
- Decision: keep the current `ts-reset` policy in
  `docs/standards/typescript-boundaries.md`.
- Consumer: TypeScript boundary standard and package/app-scope type decisions.
- Falsifier: production code trusts `JSON.parse`, `fetch().json()`, env, CLI,
  file, MCP, or connector output without unknown-first validation.
- Does not prove: that `ts-reset` is forbidden in every private app/test scope.
