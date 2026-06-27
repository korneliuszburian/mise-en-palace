# V10 MCP / Subagent Candidate Gate

Status: V10 completion gate.

Date: 2026-06-27

## Executive Verdict

V10 rejects KRN MCP server implementation and rejects any new subagent framework
now.

Current KRN product questions are still answerable through CLI, files, DB
readback, reports, skills, and existing Git/GitHub tooling. The repo already
has a typed read-only run readback boundary (`krn run show --json`) that future
MCP/API surfaces can adapt later. Building MCP now would duplicate that boundary
before a live external tool/context gap is proven.

For subagents, the only accepted current surface is the existing read-only
`ts-type-critic` custom agent. It is narrow and proposal-only. V10 does not
authorize a generic agent framework, write-heavy subagents, or an agent zoo.

The next stream should be V11 product readiness re-gate.

## Inputs

| Input | Verdict | Evidence |
|---|---|---|
| Codex MCP manual | MCP is for configured live tools/context | `/tmp/openai-docs-cache/codex-manual.md`, lines 7920-8093 |
| Codex subagent manual | subagents are explicit, parallel, cost-bearing workflows | `/tmp/openai-docs-cache/codex-manual.md`, lines 10556-10647 and 12273-12435 |
| Existing KRN read model | sufficient current typed readback | `docs/decisions/ADR-0023-read-only-run-readback-boundary.md` |
| Current subagent config | one narrow read-only critic exists | `.codex/agents/ts-type-critic.toml` |
| Adapter shape | MCP/subagent refs exist but are empty by default | `packages/codex-adapter/src/renderExecutionBrief.ts` |
| V04 screening | MCP/subagents previously deferred | `docs/reviews/controlled-dogfood/2026-06-27-v04-compression-screening/REPORT.md` |
| V09 hook gate | hooks also rejected/deferred | `docs/reviews/controlled-dogfood/2026-06-27-v09-hooks-candidate-decision/REPORT.md` |

## Source To Decision

```yaml
source_id: openai-codex-manual:mcp
title: Codex Model Context Protocol
trust_tier: official
mechanism: MCP connects Codex to configured tools and context through stdio or HTTP servers, auth, tool allowlists/denylists, timeouts, and instructions.
krn_implication: KRN should build an MCP server only when CLI/files/DB readback cannot answer a useful product question or a live external tool/context boundary is required.
decision: reject KRN MCP implementation now; keep MCP as future adapter over typed read models.
does_not_prove: KRN will never need MCP.
consumer: V10 gate and future MCP backlog.
falsifier: repeated scenarios need live typed KRN resources or actions unavailable through CLI/files/DB/readback.
```

```yaml
source_id: openai-codex-manual:subagents
title: Codex Subagents
trust_tier: official
mechanism: Subagent workflows are explicit parallel agents that reduce main-thread context pollution for read-heavy exploration, tests, triage, and summarization, but consume more tokens and need stable prompts/output contracts.
krn_implication: KRN should use subagents only for bounded read-heavy/proposal-only roles with stable output, not write-heavy parallel implementation.
decision: keep existing `ts-type-critic`; reject new subagent framework now.
does_not_prove: subagents cannot help later reviews.
consumer: V10 gate and future subagent backlog.
falsifier: repeated scenario audits become read-heavy, parallelizable, and bottlenecked by the main agent despite skills and reports.
```

```yaml
source_id: adr-0023-read-only-run-readback
title: ADR-0023 Read-Only Run Readback Boundary
trust_tier: high local
mechanism: `krn run show --json` exposes a typed read-only run resource with proof/non-proof boundaries and no mutation.
krn_implication: Future MCP/API surfaces should adapt typed read models; they should not become new memory truth or write surfaces.
decision: use existing JSON readback as the current external-consumer boundary; do not build MCP now.
does_not_prove: JSON readback is sufficient for every future integration.
consumer: V10 MCP decision.
falsifier: consumers repeatedly require direct live read-model access that cannot be served by CLI JSON output.
```

## Candidate Screening

| Candidate | Decision | Evidence | Falsifier |
|---|---|---|---|
| KRN MCP server | reject now | CLI/files/DB/readback cover current product questions; `krn run show --json` exists as read-only boundary. | Repeated scenarios need live typed KRN resources/actions unavailable through CLI/files/DB. |
| OpenAI Docs MCP | use as external source, not KRN product surface | Manual helper / docs path works for source-to-decision; useful as research input. | KRN must expose its own state to Codex as live resources. |
| GitHub MCP / connector | defer | `git`, `gh`, and CI checks are sufficient for current commit/push/CI evidence. | Repeated PR/issue metadata work cannot be handled by `gh`/available connector without high context cost. |
| Generic subagent framework | reject | Explicit non-goal and no stable broad multi-agent output contract. | None under current doctrine; would need a new product objective. |
| `ts-type-critic` custom agent | keep | Existing read-only/proposal-only TypeScript boundary critic matches subagent guidance. | It repeatedly fails to catch boundary risks or starts requiring write authority. |
| Repo explorer/test failure subagents | defer | Candidate roles are plausible but not yet repeated bottlenecks in V05-V10. | Repeated large read-heavy audits or test triage overload the main thread and have stable summary schemas. |

## What This Proves

- V10 inspected MCP/subagent candidates against current official Codex guidance
  and local KRN evidence.
- Current work does not justify a KRN MCP server.
- Current work does not justify a new subagent framework or agent zoo.
- Existing `ts-type-critic` remains the only accepted custom subagent-style
  surface and is read-only/proposal-only.

## What This Does Not Prove

- MCP will never be useful.
- Subagents will never be useful.
- `ts-type-critic` is enough for all future TypeScript review.
- Product readiness.
- V02-01 second-operator usability.

## Condensation Decision

```txt
finding: MCP/subagent surfaces remain candidates only; no current product
  question proves CLI/files/DB or single-agent workflow insufficient.
frequency: repeated candidate, not repeated implementation need.
candidate_surface: MCP / subagent
decision: reject/defer implementation now.
rationale: MCP is live tool/context integration and subagents are explicit
  parallel workflows with cost; current KRN state is still served by CLI,
  files, DB readback, reports, skills, and one narrow read-only custom agent.
evidence: Codex manual MCP/subagent sections; ADR-0023; `.codex/agents/ts-type-critic.toml`;
  V04 compression screening; V09 hook candidate decision.
does_not_prove: future MCP/subagent need is impossible.
falsifier: repeated scenarios need live typed resources or parallel read-heavy
  roles with stable output contracts.
next_task_id: V11-00.
```

## Next Recommended Stream

Move to:

```txt
V11 — Product Readiness Re-Gate
```

V05-V10 have now repaired or rejected the major candidate surfaces after V04.
The next useful step is not another surface. It is a readiness re-gate:
controlled-internal-alpha, widened internal alpha, product-ready, or blocked.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `node /home/krn/.codex/skills/.system/openai-docs/scripts/fetch-codex-manual.mjs` | passed | Codex manual cache was current and available for official surface decisions. | Does not prove future Codex docs will not change. |
| `sed -n '7920,8095p' /tmp/openai-docs-cache/codex-manual.md` | passed | MCP mechanism and configuration model were inspected. | Does not prove KRN needs MCP. |
| `sed -n '10556,10647p' /tmp/openai-docs-cache/codex-manual.md` and `sed -n '12273,12435p' ...` | passed | Subagent concept/setup/tradeoff guidance was inspected. | Does not prove KRN needs more subagents. |
| `sed -n '1,220p' .codex/agents/ts-type-critic.toml` | passed | Existing custom agent is read-only/proposal-only and TypeScript-focused. | Does not prove it has been useful in every run. |
| `sed -n '1,120p' docs/decisions/ADR-0023-read-only-run-readback-boundary.md` | passed | Existing read-only JSON readback boundary was inspected. | Does not prove it is sufficient forever. |
| `rg -n "MCP\|mcp\|subagent\|subagents" ...` | passed | Current candidate/history surfaces were inspected. | Does not prove no future candidate exists. |
| `git diff --check` | passed | Diff whitespace is clean. | Does not prove semantic correctness. |
