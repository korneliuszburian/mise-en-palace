# KRN CLI Surfaces

Status: current architecture classification and implemented help contract.
Date: 2026-06-23

This document classifies the existing CLI surface and the top-level help
contract.
P1-03 update: public `krn audit` has been removed from the CLI. The old audit
scanner mixed real Memory/Source/Evidence invariants with a wrong product-shaped
surface; those invariants must be re-homed into their native mechanisms instead
of preserved as an audit layer.

Evidence:

- `packages/cli/src/parseArgs.ts` owns the command union and top-level routing.
- `packages/cli/src/runCli.ts` owns command dispatch and runtime dependency
  wiring.
- `packages/cli/src/parseDbArgs.ts` defines DB readiness and smoke targets.
- `krn --help` groups commands as public operator, governed admin, and
  internal/dev.
- `krn db --help` labels DB readiness/smoke commands as internal/dev runtime
  plumbing proof, not product workflow or quality authority.

## Classification Rule

Public operator commands are normal workflow entry points for using KRN around a
Codex task.

Governed admin commands mutate or review durable governance records. They
require explicit operator intent and must keep preview/non-persist behavior
visible.

Internal/dev commands prove local readiness, repository hygiene, or adapter
plumbing. They are not product UX and must not be treated as KRN's architecture
or quality authority.

Historical/delete candidates are commands or command meanings that conflict
with the reset direction and need later code removal or internalization.

## Public Operator

- `krn init --dry-run --repo <path>`
- `krn init --connect --repo <path> --persist`
- `krn doctor`
- `krn plan [--project <project-id>] --task "..." [--persist]`
- `krn evidence capture [--run-id <id>] [--persist]`
- `krn observe --run <id> [--project <id>] [--persist]`
- `krn reflect --scope run:<id>|project:<id>|topic:<name> [--project <id>] [--persist]`
- `krn codex brief --run-id <id>`

Boundary:

- `observe` and `reflect` may stage records, reports, and candidates only.
  They must not promote Memory Core truth directly.
- `codex brief` renders Codex-facing output. It does not invoke Codex.
- `doctor` reports readiness. It does not prove DB runtime unless the current
  shell has the required DB configuration and DB commands are run.

## Governed Admin

- `krn memory candidate add ... [--persist]`
- `krn memory candidate promote ... [--persist]`
- `krn memory candidate reject ... [--persist]`
- `krn memory record apply ... [--persist]`
- `krn memory anti add ... [--persist]`
- `krn source claim add ... [--persist]`
- `krn source claim reject ... [--persist]`
- `krn source decision link ... [--persist]`
- `krn review assess ... [--persist]`

Boundary:

- Memory promotion requires an explicit review action.
- Source decisions must preserve mechanism, KRN implication, does-not-prove,
  consumer, and falsifier semantics.
- Review assessment may emit FeedbackDelta records, but review does not mutate
  Memory Core by itself.

## Internal/Dev

- `krn db readiness`
- `krn db smoke`
- `krn db smoke harness-plan`
- `krn db smoke harness-evidence`
- `krn db smoke source-graph`
- `krn db smoke memory-governance`
- `krn db smoke retrieval-substrate`
- `krn db smoke activation`
- `krn db smoke codex-adapter`
- `krn db smoke worker-jobs`
- `krn db smoke init-connect`
- `krn db smoke target-repo-harness`

Boundary:

- DB smokes prove command/runtime integration in the current shell only. They
  are not product workflow commands.

## Removed

- `krn audit repo`
- `krn audit slice`

P1-03 decision:

- do not retain `krn audit` as public product UX or internal guardrail UX;
- do not implement QG-06 audit automation;
- re-home retained Memory/Source/Evidence invariants into native domain,
  repository, schema, or review mechanisms.
