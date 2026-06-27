# V12 Widened Alpha Trial Launch Packet

Status: launch packet refresh, not trial completion.

Date: 2026-06-27.

## Executive Verdict

V12 refreshed the existing second-operator alpha packet instead of creating a
parallel launch plan.

Artifact:

```txt
docs/runbooks/second-operator-alpha-trial.md
```

The packet now includes the missing post-V11 pieces:

- V12 intake form;
- explicit trial modes and claim boundaries;
- target repo mode and dirty-state fields;
- transcript schema;
- support classification;
- failure taxonomy;
- evidence checklist;
- expanded verdict labels.

This prepares a real operator or widened-alpha trial. It does not complete
`V02-01`, does not prove widened internal alpha, and does not prove product
readiness.

## Scope

Read:

- `docs/reviews/controlled-dogfood/2026-06-27-v11-product-readiness-re-gate/REPORT.md`;
- `docs/runbooks/second-operator-alpha-trial.md`;
- `docs/runbooks/target-repo-testing.md`;
- `docs/runbooks/local-brain-store.md`;
- previous packet reports from 2026-06-25 and 2026-06-26.

Changed:

- `docs/runbooks/second-operator-alpha-trial.md`.

Non-goals:

- no real operator transcript was invented;
- no target repo was touched;
- no KRN source was changed;
- no dashboard/API/MCP/hook/subagent surface was added;
- no product-ready or widened-alpha claim was made.

## What Changed

| Area | Change | Why |
|---|---|---|
| Intake | Added V12 required fields for operator, machine, target repo, target mode, DB mode, support boundary, bounded task, success criteria, and stop conditions. | V11 found missing real operator inputs are the blocker. |
| Claim boundaries | Added trial modes: `real-second-operator`, `widened-alpha`, `headless-engineering`, `observation-only`. | Prevents renaming local/headless evidence into V02-01 or widened-alpha proof. |
| Transcript | Added normalized transcript schema and support classification. | Makes support burden and hidden-author-context risk auditable. |
| Failure taxonomy | Added primary failure categories for environment, DB runtime, target state, docs, CLI behavior, context selection, support boundary, and inconclusive evidence. | Lets the next failed trial produce a repair candidate instead of vague frustration. |
| Evidence | Added preflight/target/DB/KRN/review checklist. | Preserves proof/non-proof boundaries required by target-repo testing and V11. |
| Verdicts | Added DB runtime, target repo state, and support boundary breach verdict labels. | Makes blocked trials explicit without overclaiming. |

## Readiness Impact

V12 removes the nearest launch-packet ambiguity. A future operator should not
need chat history to know:

- which fields must exist before starting;
- which trial mode is being run;
- whether target writes are allowed;
- how to classify support;
- how to report failures;
- which evidence is required for DB-backed and target-backed claims.

This is enough to attempt a real operator or widened-alpha trial when inputs
exist.

## What This Proves

- The launch packet has current post-V11 intake and stop conditions.
- The packet distinguishes real-second-operator, widened-alpha,
  headless-engineering, and observation-only modes.
- The packet gives a structured transcript and failure taxonomy for the next
  trial.
- V12 avoided creating a parallel roadmap or fake proof.

## What This Does Not Prove

- A real operator completed the trial.
- A widened-alpha trial succeeded.
- The packet is sufficient in practice.
- DB setup works on another machine.
- Target repo onboarding works for arbitrary repos.
- Product readiness.

## Missing Inputs For V02-01 Or Widened Alpha

The next real trial still requires:

```txt
operator_name:
operator_machine_os:
operator_timezone:
trial_date:
support_channel:
KRN source:
target_repo:
target_repo_mode:
DB mode:
support boundary:
bounded target task:
operator transcript:
```

If these inputs are absent, do not start the real-second-operator path and do
not substitute another local run.

## Command Evidence

| Command | Result | What It Proves | What It Does Not Prove |
|---|---|---|---|
| `rtk sed ... second-operator-alpha-trial.md` | passed | Existing packet was inspected before editing. | Does not prove operator usability. |
| `rtk sed ... target-repo-testing.md` | passed | Target mode/write-boundary skill/runbook was inspected. | Does not prove target safety. |
| `rtk sed ... local-brain-store.md` | passed | DB mode/runbook guidance was inspected. | Does not prove DB is ready in this shell. |
| `rtk git diff --check` | passed | Diff whitespace is clean. | Does not prove packet usability. |

## Condensation Decision

```txt
finding:
  Existing second-operator packet was the owning surface, but it lacked explicit
  post-V11 intake, claim-boundary, transcript, failure-taxonomy, and evidence
  checklist detail.

frequency:
  recurring blocker across V02, V04, V11.

candidate_surface:
  runbook refresh.

decision:
  complete V12-00 as packet refresh.

rationale:
  The next real trial can now start or block from checked-in docs without
  reconstructing chat context.

evidence:
  V11 report, target-repo testing runbook, local brain-store runbook, refreshed
  second-operator packet.

does_not_prove:
  second-operator success, widened-alpha readiness, product readiness.

falsifier:
  A future real operator still cannot start or cleanly block the trial from the
  packet without hidden author context.
```

## Next Recommended Action

Do not append another local substitute for `V02-01`.

If real operator inputs are available, run the packet.

If real operator inputs remain unavailable, the continuous KRN engineering loop
may continue only on explicitly labeled engineering tasks that do not claim
second-operator, widened-alpha, or product-ready evidence.
