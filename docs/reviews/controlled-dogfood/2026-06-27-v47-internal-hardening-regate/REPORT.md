# V47 Internal Hardening Re-Gate After Target Coordination

Status: complete.

Date: 2026-06-27.

Mode: internal hardening re-gate.

## Executive Verdict

The next task should be:

```txt
V48 — Continuous Pattern Source-To-Decision Gate
```

Target repair and V02-01 remain gated by owner/operator inputs. KRN should not
create another local target substitute. The highest-ROI internal hardening task
is to make pattern/source condensation a standing gate across every KRN stage:
infra, harness, CI, memory, skills, target workflow, TypeScript, Codex surfaces,
evals, and research/papers.

This is not a broad research archive and not a quality scanner. It is a bounded
gate for converting source-backed patterns into decisions, falsifiers, and
durable consumers.

## Inputs Inspected

- `GOAL.md`
- `PLAN.md`
- `PLANS.md`
- `docs/KRN_SOURCES.md`
- `docs/standards/typescript-excellence.md`
- `.agents/skills/source-to-decision/SKILL.md`
- `.agents/skills/typescript-type-safety/SKILL.md`
- `.agents/skills/target-repo-testing/SKILL.md`
- `docs/reviews/controlled-dogfood/2026-06-27-v46-target-owner-coordination-packet/PACKET.md`

## Current State

```txt
target repair:
  waiting for owner/stability input

V02-01:
  waiting for real second-operator inputs

internal hardening:
  allowed

product-ready:
  no
```

## Candidate Tasks Considered

| Candidate | Decision | Reason |
|---|---|---|
| Run another target substitute | rejected | V46 explicitly says missing owner/operator inputs should not be replaced by another local proof |
| Activation scoring repair | deferred | recent evidence shows target/owner blockers are more immediate than scoring changes |
| Reflection extraction rewrite | deferred | too broad without a fresh source-backed narrow case |
| Dashboard/API/MCP/worker | rejected | hard non-goals and no evidence-backed need |
| Continuous Pattern Source-To-Decision Gate | accepted | directly answers how KRN absorbs high-quality engineering patterns without source hoarding |

## Source-To-Decision Basis

Existing retained sources already include Codex, Cookbook, TypeScript,
target-workflow, and KRN local evidence sources:

```txt
docs/KRN_SOURCES.md:
  Codex native surfaces
  OpenAI Cookbook patterns
  Designing Your Types
  Unions, Literals, And Narrowing
  TS Reset
```

Mechanisms already accepted:

```txt
ExecPlans preserve objective, discoveries, decisions, validation, and next work
skills package reusable workflows with progressive disclosure
target repos require fresh status and lifecycle evidence
types communicate business/domain logic
literal unions and narrowing constrain finite state
unknown-first IO prevents unsafe platform defaults
global ts-reset is not appropriate in core/schema/public package APIs
```

Current gap:

```txt
These sources exist as standards and source decisions, but the next source
repair or scenario should make their application explicit:
  selected pattern
  expected code/workflow effect
  evidence that it was used or intentionally rejected
  falsifier when code still permits the bad state
```

## Selected V48 Task

```txt
V48-00 — Continuous Pattern Source-To-Decision Gate
```

Goal:

Create a standing gate for applying source-backed patterns to every KRN stage.

V48 should define source categories and routing for:

```txt
official docs
high-quality courses
papers
practitioner writing
repo-local evidence
target-repo evidence
infra/harness/CI/eval patterns
```

Output should be a compact report and one small durable consumer update if
needed, such as:

```txt
PLANS.md operating rule
.agents/skills/source-to-decision/SKILL.md
standards/runbook/ADR/eval candidate
an EvalCandidate/golden behavior candidate
```

Do not rewrite source unless the gate finds one tiny, directly supported repair.

## What V48 Should Prove

V48 should prove:

- KRN can convert strong patterns into concrete decisions;
- future slices can state which patterns were activated;
- missing pattern application can become a candidate, test, or skill update;
- source-backed standards can be used without reintroducing broad audit theater
  or research hoarding.

V48 should not claim:

- full codebase perfection;
- product readiness;
- that any course/paper overrides repo evidence;
- that paid/course material should be copied into KRN memory;
- that broad source crawling is needed.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `rtk git fetch --prune` | passed | remote refs refreshed before V47 | product readiness |
| `rtk git status --short --branch` | clean before V47 | KRN started clean | source quality |
| `rtk git log --oneline -n 6` | passed | latest V46 commit is local head | CI state by itself |
| `rtk gh run watch 28291273368 --exit-status` | passed | V46 CI passed including typecheck/tests/Promptfoo smoke/DB smoke | V48 correctness |
| `rtk sed ... docs/KRN_SOURCES.md` | passed | source decisions already exist with mechanism/decision boundaries | those decisions are fully applied in every slice |
| `rtk sed ... source-to-decision skill` | passed | KRN already has a reusable anti-source-hoarding workflow | it is applied by default at every stage |
| `rtk git diff --check` | passed | V47 docs diff has no whitespace errors | semantic correctness |

## Condensation Decision

```txt
finding:
  KRN needs a reusable way to activate source-backed patterns during every
  non-trivial slice

frequency:
  repeated user direction + V13/V28/V29 prior source decisions + current V47
  planning question

candidate_surface:
  source-to-decision report + operating rule/skill/standard/eval candidate

decision:
  accept as V48

rationale:
  this improves internal code, infra, harness, CI, eval, and workflow quality
  while target proof waits for external owner/operator inputs

evidence:
  docs/KRN_SOURCES.md; docs/standards/typescript-excellence.md;
  source-to-decision skill; target-repo-testing skill; user direction

does_not_prove:
  product readiness, whole-system perfection, or that sources should be copied
  wholesale into memory

falsifier:
  V48 cannot name a concrete consumer, falsifier, or future slice effect for
  selected patterns

next_task_id:
  V48-00
```

## Next Recommended Task

```txt
V48-00 — Continuous Pattern Source-To-Decision Gate
```

Do not browse or ingest broad course material unless a specific public/legal
source is used and mapped through source -> mechanism -> KRN implication ->
decision/rejection -> falsifier.
