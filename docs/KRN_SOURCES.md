# KRN Sources

Every source retained here must be mapped to mechanism, KRN implication,
decision/rejection, and what it does not prove.

## Codex Native Surfaces

### AGENTS.md

- URL: https://developers.openai.com/codex/guides/agents-md
- Trust tier: high.
- Mechanism: Codex discovers durable project instructions from `AGENTS.md`
  layers before work.
- KRN implication: keep `AGENTS.md` thin and use it for repo guidance only.
- Decision: active instructions point to `docs/KRN_KERNEL.md` and forbid broad
  rereads.
- Does not prove: that a giant `AGENTS.md` improves results.

### Skills

- URL: https://developers.openai.com/codex/skills
- Trust tier: high.
- Mechanism: skills package reusable workflows with progressive disclosure.
- KRN implication: repo-local KRN workflows belong in `.agents/skills/`.
- Decision: create engineering-discipline skills, not custom prompts or stack
  agents.
- Does not prove: that many skills are useful by default.

### Subagents

- URL: https://developers.openai.com/codex/subagents
- Trust tier: high.
- Mechanism: Codex can explicitly spawn bounded agents with separate context and
  inherited sandbox/approval controls.
- KRN implication: use subagents as organs for bounded review/exploration.
- Decision: start with only `ts-type-critic`.
- Does not prove: that broad swarms improve KRN early.

### Hooks

- URL: https://developers.openai.com/codex/hooks
- Trust tier: high.
- Mechanism: lifecycle hooks can run deterministic command handlers and require
  trust review.
- KRN implication: hooks are mechanical gates and audit surfaces.
- Decision: no hidden semantic architecture in hooks.
- Does not prove: that hooks are sufficient safety control.

### MCP

- URL: https://developers.openai.com/codex/mcp
- Trust tier: high.
- Mechanism: MCP gives Codex tools/resources/prompts with configuration,
  allowlists, auth, and approval modes.
- KRN implication: MCP is a typed tool boundary, not memory.
- Decision: KRN MCP server is later, after CLI/store contracts exist.
- Does not prove: that MCP is safe by default.

### Rules

- URL: https://developers.openai.com/codex/rules
- Trust tier: high.
- Mechanism: rules control command prefixes outside the sandbox and are
  experimental.
- KRN implication: rules are command-policy controls only.
- Decision: do not encode semantic architecture in rules.
- Does not prove: that rules should be a product brain.

### Permissions And Security

- URLs:
  - https://developers.openai.com/codex/permissions
  - https://developers.openai.com/codex/agent-approvals-security
- Trust tier: high.
- Mechanism: sandbox, approvals, permission profiles, network policy, and
  destructive tool approval define the local trust boundary.
- KRN implication: do not mix permission profiles and legacy sandbox settings in
  one active config path.
- Decision: bootstrap posture is read/propose for review/subagents,
  workspace-write only for implementation, network off unless explicitly
  allowed.
- Does not prove: that broad access is acceptable for speed.

### Custom Prompts

- URL: https://developers.openai.com/codex/custom-prompts
- Trust tier: high.
- Mechanism: custom prompts are deprecated in favor of skills.
- KRN implication: reusable KRN workflows should be skills.
- Decision: reject custom prompt library.
- Does not prove: that every instruction must become a skill.

## OpenAI Cookbook Patterns

### Goals In Codex

- URL: https://developers.openai.com/cookbook/examples/codex/using_goals_in_codex
- Trust tier: high.
- Mechanism: goals support continuation with explicit objective and evidence.
- KRN implication: `GOAL.md` should be a current execution contract.
- Decision: keep goal compact and phase-oriented.
- Does not prove: that goal should become product brain.

### Iterative Repair Loops

- URL:
  https://developers.openai.com/cookbook/examples/codex/build_iterative_repair_loops_with_codex
- Trust tier: high.
- Mechanism: review, repair, and validation close the loop.
- KRN implication: KRN needs review capture and small repair loops.
- Decision: later dogfood starts with `krn doctor`.
- Does not prove: that broad automation should run before kernel spine.

### Agent Improvement Loop

- URL: https://developers.openai.com/cookbook/examples/agents_sdk/agent_improvement_loop
- Trust tier: high.
- Mechanism: traces and feedback feed eval candidates and improvement.
- KRN implication: eval candidates should come from real traces.
- Decision: no broad benchmark lane before dogfood evidence.
- Does not prove: that green evals prove product quality.

### Memory And Compaction

- URL:
  https://developers.openai.com/cookbook/examples/agents_sdk/building_reliable_agents_memory_compaction
- Trust tier: high.
- Mechanism: separate working context from durable memory and compact selected
  state.
- KRN implication: runtime memory must be selected and store-backed.
- Decision: files are export/audit/seed, not Memory Core.
- Does not prove: that local markdown memory is enough.

