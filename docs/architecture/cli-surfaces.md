# KRN CLI Surfaces

Status: current architecture classification.
Date: 2026-06-23

This document classifies the existing CLI surface before behavior changes.
It does not rename commands, change parser behavior, or certify DB runtime.
P1-01 decision: public `krn audit` is deprecated as product direction; keep the
current command only as a temporary internal/dev mechanical check until a code
slice removes it from the public CLI or moves checks behind an explicit
internal script.

Evidence:

- `packages/cli/src/parseArgs.ts` owns the command union and top-level routing.
- `packages/cli/src/runCli.ts` owns command dispatch and runtime dependency
  wiring.
- `packages/cli/src/parseDbArgs.ts` defines DB readiness and smoke targets.
- `packages/cli/src/parseAuditArgs.ts` defines audit repo/slice options.

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
- `krn audit repo [--repo <path>] [--json]` (temporary internal/dev)
- `krn audit slice --since <ref> [--repo <path>] [--project <id>] [--retrieval-run <id>] [--audit-bundle-id <id>] [--intended-file <path>] [--verification <command=status>] [--fail-on warning] [--json]` (temporary internal/dev)

Boundary:

- DB smokes prove command/runtime integration in the current shell only. They
  are not product workflow commands.
- `krn audit` is not a product quality engine, autonomous anti-slop layer, or
  architectural authority.
- Do not add new audit categories while it remains a public top-level command.
- Audit findings can support local guardrails, but general engineering quality
  must come from architecture, type boundaries, focused tests, naming, and
  review.

## Historical/Delete Candidates

- `krn audit repo`
- `krn audit slice`

P1-01 decision:

- do not retain `krn audit` as public product UX;
- do not implement QG-06 audit automation;
- later code may delete the command or move its deterministic checks to an
  explicitly internal script/surface.

Until that code slice happens, do not add audit categories or present
`krn audit` as the next product feature.
