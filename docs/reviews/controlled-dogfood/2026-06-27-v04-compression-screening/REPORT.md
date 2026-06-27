# V04 Compression, Surface Screening, And Internal Utility Metrics

Status: complete.
Date: 2026-06-27.
Milestones: M11, M12, M13, M14.

## Executive Verdict

KRN should keep the current V04 surface stack: compact `AGENTS.md`, compact root
`PLAN.md`/`GOAL.md`, detailed V04 ExecPlan, small repo skills, scenario reports,
and deterministic guards. Current evidence does not justify hooks, MCP servers,
or subagents yet. Those remain candidates only.

## Sources Used

| Source | Trust tier | Mechanism | Decision impact |
|---|---:|---|---|
| Codex manual, `Agent Skills` (`/codex/skills.md`) | high | Skills package reusable workflows and use progressive disclosure; descriptions drive implicit invocation. | Keep repeated KRN workflows in skills before building heavier surfaces. |
| Codex manual, `Custom instructions with AGENTS.md` (`/codex/guides/agents-md.md`) | high | Codex builds an instruction chain and has an instruction size limit. | Keep `AGENTS.md` tiny and move workflow detail into skills/runbooks. |
| Codex manual, `Model Context Protocol` (`/codex/mcp.md`) | high | MCP connects Codex to external tools/context and requires configured servers/tools. | Defer MCP until CLI/files/DB cannot answer a useful product question. |
| Codex manual, `Hooks` (`/codex/hooks.md`) | high | Hooks are lifecycle command handlers with trust review, concurrent matching, and event-specific matchers. | Defer hooks until a deterministic repeated enforcement boundary exists. |
| Codex manual, `Subagents` (`/codex/subagents.md`) | high | Subagents run explicitly requested parallel workflows and consume extra tokens/resources. | Defer subagents until stable read-heavy roles and output contracts exist. |
| Local V04 scenario reports | high local | Concrete evidence from DB, target, skill, and evidence-review scenarios. | Use reports as the source of condensation decisions. |

## AGENTS And Skill Surface Compression

Measured line counts:

| File | Lines | Verdict |
|---|---:|---|
| `AGENTS.md` | 36 | good; durable kernel rules only |
| `GOAL.md` | 116 | acceptable; active goal and continuation rules |
| `PLAN.md` | 226 | acceptable; compact product state and V04 queue |
| `docs/plans/v04-internal-brain-utility/PLANS.md` | 1367 | acceptable as detailed long-run ExecPlan, not startup guidance |
| `.agents/skills/target-repo-testing/SKILL.md` | 127 | acceptable; workflow surface for target testing |
| `.agents/skills/evidence-review-loop/SKILL.md` | 47 | good; compact evidence workflow |

Compression decision:

```txt
Do not add more to AGENTS.md.
Keep target testing detail in $target-repo-testing.
Keep evidence/report detail in $evidence-review-loop plus scenario reports.
Keep V04 long-run state in docs/plans/v04-internal-brain-utility/PLANS.md.
```

Contradiction scan:

- Root guidance consistently forbids product-ready claims, fake V02-01 proof,
  dashboards, MCP, broad subagents, hidden semantic hooks, runtime markdown
  memory, and living target writes without explicit scope.
- `target-repo-testing` and `docs/runbooks/target-repo-testing.md` agree:
  observation-only target trials must not edit target files.
- `evidence-review-loop` agrees with V04 reports: command proof, diff risk,
  rollback, feedback candidates, and no automatic Memory Core mutation.

## Source-To-Decision Mappings

```yaml
source_id: codex-skills
title: Codex Agent Skills
url: /codex/skills.md
trust_tier: high
mechanism: Skills are reusable workflow packages with progressive disclosure and concise trigger descriptions.
krn_implication: KRN should encode repeated workflows as small repo skills before heavier automation.
decision: adopt for target-repo-testing; reuse existing evidence-review-loop.
does_not_prove: Skills enforce runtime safety automatically.
consumer: .agents/skills/target-repo-testing/SKILL.md; .agents/skills/evidence-review-loop/SKILL.md
falsifier: repeated future scenarios miss the skill or require fields the skill cannot express.
```

```yaml
source_id: codex-agents-md
title: Codex AGENTS.md
url: /codex/guides/agents-md.md
trust_tier: high
mechanism: Codex loads instruction files into the prompt chain and stops at configured size limits.
krn_implication: AGENTS must remain small; long workflows should move to skills/runbooks/ExecPlans.
decision: reject adding V04 workflow detail to AGENTS.md.
does_not_prove: current AGENTS wording is perfect forever.
consumer: AGENTS.md; GOAL.md; PLAN.md
falsifier: future compact/resume failures caused by missing root-level guidance.
```

```yaml
source_id: codex-mcp
title: Codex MCP
url: /codex/mcp.md
trust_tier: high
mechanism: MCP gives Codex access to external tools/context through configured servers.
krn_implication: KRN should add MCP only when a live external/tool context cannot be handled by CLI, files, or DB readback.
decision: defer MCP server work in V04.
does_not_prove: KRN will never need MCP.
consumer: V04 M13 screening; future MCP candidate queue.
falsifier: a repeated scenario needs live external state/action that CLI/files/DB cannot provide.
```

```yaml
source_id: codex-hooks
title: Codex Hooks
url: /codex/hooks.md
trust_tier: high
mechanism: Hooks run lifecycle command handlers, require trust review, and matching hooks can run concurrently.
krn_implication: hooks are appropriate for deterministic mechanical enforcement, not semantic brain policy.
decision: defer hook implementation; keep target write prevention as hook candidate only.
does_not_prove: hooks are unsafe or useless.
consumer: V04 M12 screening; hook candidate queue.
falsifier: repeated deterministic target-write violations occur despite skills/runbooks and can be blocked with a tiny trusted hook.
```

```yaml
source_id: codex-subagents
title: Codex Subagents
url: /codex/subagents.md
trust_tier: high
mechanism: subagents are explicit parallel workflows that consume extra tokens/resources.
krn_implication: subagents need stable read-heavy roles and output contracts before adoption.
decision: defer subagents in V04.
does_not_prove: subagents cannot help later scenario analysis.
consumer: V04 M13 screening; future subagent candidate queue.
falsifier: repeated scenario analysis becomes read-heavy, parallelizable, and bottlenecked by single-agent context.
```

## Hook Candidate Screening

| Candidate | Decision | Why | Falsifier |
|---|---|---|---|
| Target repo write prevention before shell/edit commands | deferred | High-risk, but current durable surfaces are skill + runbook + deterministic text guard. Hook would need reliable target-mode state and trust review. | Another target scenario attempts writes in observation-only mode after skill/runbook guidance. |
| Compact recovery hook | rejected now | Current `GOAL.md` and V04 ExecPlan already define compact recovery. A hook would be semantic and brittle. | Repeated resume failures where Codex ignores current slice despite root plan. |
| Secret/prompt scanning hook | deferred outside V04 | Important generally, but no V04 scenario exposed a new secret-paste failure in KRN. | A KRN scenario prints or persists secret-shaped target evidence. |

M12 verdict:

```txt
No hook implementation in V04 now.
Keep target write prevention as a hook candidate, not a built hook.
```

## MCP And Subagent Candidate Screening

| Surface | Decision | Why | Falsifier |
|---|---|---|---|
| KRN MCP server | deferred | Current scenarios were served by CLI, files, DB, reports, and GitHub CLI. No live external context/action gap requires MCP. | Repeated scenarios need typed live read models unavailable through CLI/DB/files. |
| OpenAI Docs MCP | use as external source when needed, not KRN product surface | It is useful for source-to-decision research, but does not justify building a KRN MCP server. | KRN needs to expose its own read model to Codex as live tools. |
| Custom subagents | deferred | V04 work is still single-threaded enough; roles are not stable enough for custom agents. | Repeated read-heavy scenario audits become parallel and have stable output schemas. |
| Generic multi-agent workflow | rejected | Explicitly non-goal; would add orchestration before stable contracts. | None for V04; would require a new product objective. |

M13 verdict:

```txt
No MCP/subagent implementation in V04 now.
Capture future candidates only when a scenario proves CLI/files/DB are insufficient.
```

## Internal Brain Utility Metrics

Qualitative metrics after V04-SC-001 through V04-SC-004:

| Area | Before V04 | After current V04 work | Verdict |
|---|---|---|---|
| Scenario discipline | ad hoc reports and runbooks | six-scenario batch plan and required scenario contract | improved |
| Proof/non-proof clarity | present but repeated manually | required report section and condensation decision | improved |
| Knowledge condensation | findings often stayed in reports | target testing skill + deterministic guard + scenario factory | improved |
| Target repo safety | headless trial overstepped observation boundary | target-repo-testing skill and no-write scenario proof | improved |
| Evidence review workflow | existing skill, not explicitly re-gated for V04 | reused and rejected duplicate skill | improved |
| Hook/MCP/subagent restraint | policy-level non-goal | source-backed defer/reject decisions | improved |
| Product readiness | not product-ready | still not product-ready | unchanged |
| V02-01 second operator proof | blocked/deferred | still blocked/deferred | unchanged |

Counts:

```txt
controlled scenarios planned: 6
controlled scenarios executed/replayed: 4
implemented condensations: 3
  - controlled scenario factory / condensation gate
  - target-repo-testing skill
  - targetRepoTestingSkill deterministic guard
rejected/deferred surface decisions:
  - new evidence-review-loop skill rejected
  - hooks deferred
  - MCP deferred
  - subagents deferred
```

## What This Proves

- KRN V04 now has a compact internal learning loop, not just a one-off report.
- Current evidence supports skills and deterministic guards before hooks, MCP,
  or subagents.
- AGENTS remains compact enough to stay durable startup guidance.

## What This Does Not Prove

- Product readiness.
- V02-01 second-operator usability.
- That KRN will never need hooks, MCP, or subagents.
- That target-aware evidence capture is implemented.
- That final V04 re-gate is complete.

## Next Recommended Action

Create the final V04 internal brain usefulness re-gate report, using this report
plus V04-SC-001 through V04-SC-004 as evidence. If the re-gate identifies one
more small source repair with stronger ROI than reporting, do that repair before
marking V04 complete.

