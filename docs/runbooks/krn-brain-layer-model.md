# KRN Brain Layer Model

Status: active runbook.

KRN is not a second executor. Codex executes. KRN is the governed brain around
Codex: a bounded context, memory, source, review, and feedback layer that makes
each run less random without turning the repo into prompt sludge.

## Simple Model

For a newcomer, KRN is a governed RAG plus memory and review loop:

```txt
task -> select context -> use memory/source evidence -> render Codex brief
     -> Codex executes -> capture evidence -> review -> update candidates
```

The product bet is not "more context." The product bet is better selection,
better rejection, better proof boundaries, and better reuse of verified patterns.

## Layer Verdicts

| Layer | What It Is | Current Verdict | Keep It If | Downscope If |
| --- | --- | --- | --- | --- |
| Codex execution | The agent that edits files, runs commands, and ships slices. | Necessary, external to KRN. | KRN keeps feeding better briefs and evidence. | KRN starts pretending to execute instead of guide. |
| KRN brain | Context selection, memory/source grounding, review gates, and feedback. | Necessary core. | It improves real task quality and prevents false authority. | It becomes a vocabulary layer with no behavior. |
| Store | Postgres-backed memory, source, evidence, retrieval, and run readbacks. | Necessary core. | Records are queried by current CLI/harness flows. | Tables have no writer, reader, or falsifier. |
| Harness | Plan compilation, activation, filters, context assembly, review gates. | Necessary core. | It chooses and excludes context before Codex sees it. | It only mirrors CLI formatting or doc claims. |
| CLI/readback | Dogfood UI and operator inspection surface. | Necessary for alpha, too large long-term. | It remains a thin command/readback layer. | Domain logic stays trapped in command runners. |
| Skills | Reusable operating workflows for Codex. | Necessary if operational. | A skill has trigger, workflow, forbidden behavior, and verification. | A skill is just inspirational text or fake runtime. |
| Workers | Maintenance/acquisition candidate contracts and previews. | Deferred organ, not Codex exec. | It stays candidate-only or gets a human-approved executor slice. | It claims runtime enforcement without an executor. |
| Eval/docs gates | Deterministic falsifiers and compact active truth. | Necessary when behavior-backed. | They catch behavior or active-context regressions. | They become prose sentinels or progress theatre. |

## Function And Helper Rule

Do not extract functions because extraction is possible.

Extract only when at least one is true:

- it removes real duplication across two or more live consumers;
- it names a domain concept that should be reviewed once;
- it moves boundary logic to the owner package;
- it reduces unsafe casts, hidden authority, or parser drift.

Keep code inline when a helper would only hide a simple branch, create a fake
abstraction, or make the call site less direct.

## Worker Boundary

Workers are not Codex execution. Today they are maintenance/readback contracts
and candidate previews. They can suggest work such as stale memory review,
source acquisition, relation review, or consensus evaluation.

Do not claim worker runtime, scheduling, leases, retries, idempotency
enforcement, or Memory Core write enforcement until a human explicitly
un-defers that branch and an executor exists.

## Simplification Order

1. Measure whether selected context and source grounding help real tasks.
2. Name and remove confusing vocabulary only when it has review cost.
3. Move reusable domain logic out of CLI when it has multiple live consumers.
4. Keep workers candidate-only or make an explicit human product decision.
5. Delete only with consumer evidence, not audit vibes.

`mise-en-palace-sefh`, `mise-en-palace-qzai`, `mise-en-palace-g1cg`, and
`mise-en-palace-td3u` do not unblock worker execution. `mise-en-palace-plnv`
remains deferred and human-controlled before any worker executor, scheduler, or
runtime-enforcement implementation starts.

## Proof Boundary

This runbook proves only the intended mental model and layer ownership. It does
not prove retrieval quality, source truth, product readiness, worker runtime,
or that every current file already matches the model.
