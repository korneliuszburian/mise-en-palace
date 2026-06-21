# KRN Pattern Selection

Use this gate before adopting mechanisms as KRN primitives.

```yaml
pattern_id:
name:
source_mechanisms:
solves_paradox:
adoption_status: adopt_now | lab | later | reject
krn_primitive:
implementation_boundary:
failure_mode:
falsifier:
dogfood_task:
owner:
removal_condition:
```

## Adopt Now

| Pattern | Primitive | Falsifier |
| --- | --- | --- |
| Small Kernel Contract | `docs/KRN_KERNEL.md`, thin `AGENTS.md`, ADRs | Simple task requires broad historical reread. |
| Raw Material Quarantine | `docs/materials/` as source/audit only | Raw dump becomes default Codex context. |
| Context Supply Chain | `ContextPacket` later | Packet becomes broad dump without non-goals. |
| Memory Is Store-Backed, Files Are Export | `MemoryEntry` and store interface later | Runtime depends on `docs/memory/**`. |
| Source-To-Decision Graph | `SourceRef`, `Decision`, edge later | Sources grow without decisions or rejections. |
| Skills As Engineering Disciplines | `.agents/skills/*` | Skills become marketing docs or stack agents. |
| Built-In Skill Creation Pipeline | `$skill-creator` discipline | Skills are hand-rolled without trigger/validation. |
| Progressive Disclosure Skill Design | small `SKILL.md`, optional resources | Skill body becomes context dump. |
| Read / Propose / Write Boundary | policy gates later | Reviewers/subagents write by default. |
| Sandbox / Approval / Permission Boundary | documented permission model | Config mixes incompatible permission models. |
| Hook Trust And Deterministic Gates | hooks later | Hooks hide semantic architecture. |
| MCP As Typed Tool Boundary | KRN MCP later | MCP is treated as magic memory. |
| Rules As Experimental Command Policy | rules later | Rules encode product semantics. |
| Review Burden + Diff Risk Metrics | `ReviewFeedback` later | More artifacts but review is not easier. |
| Trace To Feedback To Eval Candidate To Handoff | `RunTrace` later | Evals appear without real trace evidence. |
| Review / Repair / Validate Loop | dogfood loop later | Agent speed increases review burden. |
| Evidence-Checked Continuous Goal | compact `GOAL.md` | Goal absorbs product brain. |
| TypeScript Boundary Discipline | strict TS spine later | Type weakening makes implementation easier. |

## Lab Or Later

- plugin packaging and marketplace;
- macro-evals over trace populations;
- Codex GitHub Action or `codex exec` automation;
- KRN MCP server;
- multi-project registry;
- dashboard over typed objects;
- research subagents with fixed budgets.

## Reject Now

- dashboard-first;
- broad benchmark lane;
- custom prompt library;
- broad subagent zoo;
- runtime memory in markdown;
- old repo topology import;
- open network plus powerful skills without allowlists.

