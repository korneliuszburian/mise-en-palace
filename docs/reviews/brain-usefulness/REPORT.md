# KRN Brain Usefulness Report

Status: validation report, not implementation plan.

Date: 2026-06-24
Evaluator: Codex
Repo state: clean before report write; `main` matched `origin/main`.
Latest commit: `d57096d docs(plan): move brain usefulness plan to review file`
Local/remote state: no ahead/behind entries after `git fetch --prune`.
DB available: no. `pnpm db:ready` failed in the current shell with
`CONNECT_TIMEOUT localhost:54329`.

## Executive Verdict

The current KRN Brain is dogfood-useful for KRN-on-KRN work, but not
product-ready. It already helps when the task needs traceability, explicit
evidence boundaries, reviewed memory promotion, source-to-decision linkage, and
small activation prefixes. It is still mostly ledger in candidate quality,
general activation relevance, reflection usefulness, and live DB replay in this
shell. The next step should be one bounded dogfood eval/reporting repair, not a
dashboard, worker runtime, audit scanner, or new memory layer.

## Scope

Selected runs:

| Run | Source | Why selected | DB inspected? |
| --- | --- | --- | --- |
| P7 self-hosting memory loop | `docs/runs/2026-06-23-self-hosting-memory-loop.md` | Required run; covers plan, evidence, observe, reflect, activation review, evidence-provenance gap, and follow-up closures. | No |
| MM-33 memory dogfood | `docs/runs/2026-06-23-memory-dogfood.md` | Covers MemoryCandidate -> MemoryReviewGate -> MemoryRecord -> later activation/application. | No |
| MM-38 source-to-decision dogfood | `docs/runs/2026-06-23-source-to-decision-dogfood.md` | Covers decision-grade SourceClaim and SourceDecisionEdge. | No |
| MM-58 feedback dogfood | `docs/runs/2026-06-23-feedback-dogfood.md` | Covers EvidenceBundle, ReviewAssessment, FeedbackDelta, proposal-only candidates, and a dirty-context finding. | No |
| MM-45 activation observation prefix dogfood | `docs/runs/2026-06-23-activation-observation-prefix-dogfood.md` | Covers activation abstention vs a source-ranged observation prefix without Memory Core mutation. | No |

Non-goals:

- no package source changes;
- no new architecture;
- no dashboard, API, MCP, worker runtime, source crawler, broad eval platform,
  `krn audit`, anti-slop subsystem, or quality scanner;
- no Memory Core mutation, memory promotion, or activation behavior change.

## Method

I read the attached validation plan, root `AGENTS.md`, `docs/KRN_KERNEL.md`,
`README.md`, root `GOAL.md`, root `PLAN.md`, selected run ledgers, current CLI
and package surface docs, and relevant ADRs for evidence proof states and
activation admission control. I ran the required preflight commands, attempted
current-shell DB readiness, selected five dogfood runs, then evaluated each run
across activation, memory, source grounding, evidence/review, observation and
reflection, candidate quality, and Brain ROI.

Commands run:

```sh
rtk git fetch --prune
rtk git status --short --branch
rtk git log --oneline --decorate --left-right origin/main...main
rtk git log --oneline --decorate -20
rtk pnpm db:ready
rtk find docs/runs -maxdepth 2 -type f
rtk rg -n "run_id|Run ID|MemoryRecord|MemoryCandidate|AntiMemory|Activation|EvidenceBundle|ReviewAssessment|FeedbackDelta|ObservationGroup|ReflectionRecord|command|provenance|verification|commit|changed files|selected" docs/runs docs/reviews docs/architecture docs/decisions -g "*.md"
rtk git log --follow --oneline --decorate -- <selected run ledger>
```

## Findings Summary

| Area | Verdict | Evidence | Next implication |
| --- | --- | --- | --- |
| Activation | mixed | P7 selected six items but only two materially helped; MM-45 improved abstention to one source-ranged prefix. | Add a dogfood activation usefulness report that records selected/used/helped/missing per run. |
| Memory | good | MM-33 promoted one reviewed candidate into MemoryRecord and later selected/applied it as helped. | Keep reviewed promotion path; improve application guidance and negative/neutral feedback capture. |
| Source grounding | good | MM-38 created a decision-grade SourceClaim and SourceDecisionEdge with does-not-prove and falsifier. | Use source-to-decision for architecture claims; still need quality checks for source selection relevance. |
| Evidence/review | mixed | P7 exposed weak skipped command rows; later EVI closure repaired future provenance. MM-58 recorded dirty context and changes requested. | Evidence capture works, but report ergonomics must make dirty context and command strength easier to compare. |
| Observation/reflection | weak | Observe created sourced staging rows; P7 and MM-25 reflection persisted records but generated zero findings/candidates. | Build a dogfood case with expected useful reflection outputs before claiming reflection quality. |
| Candidate quality | mixed | MM-33 candidate was reviewable and useful; MM-58 proposal correctly stayed proposal-only with missing fields; P7 C5 staged useful candidates later. | Candidate creation needs a bounded quality review lane, not automatic growth. |
| Brain ROI | positive for dogfood, not product-ready | Runs reduced traceability and governance ambiguity, but required ledger reading and current DB was unavailable. | Next goal should validate/repair usefulness reporting and activation/candidate quality, not expand architecture. |

## Run Reviews

### Run 1: P7 Self-Hosting Memory Loop

#### What the run was trying to do

Use KRN to improve KRN by sealing Memory Core write authority and proving a
governed self-hosting loop:

```txt
plan --persist -> evidence capture --persist -> observe --persist -> reflect --persist
```

Run IDs and refs:

- `executionRun: 00d74890-b18d-498b-90bf-f172c26cffb6`
- `evidenceBundle: 29aaedd2-a005-4f9b-afa3-15d305e779c6`
- `Observation group: 1ef45c13-f12c-4fb9-a9a8-4693f587333c`
- `Reflection record: a3c275ef-6aaf-4db6-a09a-44c62c229724`
- related commits: `87cac53`, `cc57a93`, `c8aa69e`, `64a5bed`

#### Activated context

| Item | Type | Helped? | Evidence | Notes |
| --- | --- | --- | --- | --- |
| `sourceClaim:f0b5c9ee-01aa-41df-9268-7df3f7437068` | SourceClaim | helped | Activation relevance review in the run ledger. | Helped expose command-provenance gap but carried obsolete audit wording. |
| `memoryRecord:41d1a2ef-3578-4e45-947f-42c6739796de` | MemoryRecord | helped | Run ledger review table. | Strong evidence-integrity caution; only indirect for Memory Core write authority. |
| `sourceClaim:d5ea7024-7d7a-4291-a050-4de1fbebf605` | SourceClaim | neutral | Run ledger review table. | Adjacent source governance, not material to P7 task. |
| `memoryRecord:7dda35fd-b89d-4bd4-94bd-7937022d99e7` | MemoryRecord | neutral | Run ledger review table. | Correct source graph storage constraint, wrong emphasis for write authority. |
| `sourceClaim:3b5540bc-2307-4578-9abb-5bee0805bbdd` | SourceClaim | neutral | Run ledger review table. | Source persistence doctrine only. |
| `sourceClaim:212815bc-477c-4985-8992-31825f5c5897` | SourceClaim | neutral | Run ledger review table. | Valid but not direct. |

Activation verdict: mixed.

Repair implication: activation scoring and memory guidance. The selected set
was safe and partly useful, but it missed direct Memory Core write-authority
context if such context existed.

#### Memory usefulness

Memory helped with evidence-governance caution, not with the exact write-authority
objective. `memoryRecord:41d1a2ef-3578-4e45-947f-42c6739796de` should be kept
or strengthened around evidence provenance and semantic DB proof. Other selected
memory/source items should not be strengthened for write-authority tasks.

#### Source usefulness

Source grounding supported a conservative decision and later yielded source
claims and memory/anti-memory candidates for the evidence gap. It also added
some review burden because source-graph context was adjacent rather than direct.

#### Evidence/review usefulness

Command evidence was weak for the original persisted bundle: `pnpm typecheck`
and `pnpm test` passed in the shell, but `krn evidence capture --persist`
stored default skipped rows. Review burden was reduced for traceability and
increased for command proof interpretation. Later EVI closures repaired future
captures, but this historical row remains weak.

#### Observation/reflection usefulness

Observe was useful operationally: it created five observation items with no
MemoryRecord mutation. Reflect proved persistence and no mutation, but it
generated zero findings, contradictions, gaps, or candidate rows. This is
correctly ledger/proof of flow, not proof of reflection quality.

#### Candidate quality

Initial P7 candidate quality was insufficiently proven. Later C5/EVI closures
staged useful source claims, memory candidates, and one anti-memory candidate:
`anti:p7-weak-command-proof`. Those are reviewable because they name the weak
claim and preserve no MemoryRecord mutation.

#### Review burden delta

Reduced for traceability, mixed for command proof, weak for implementation
direction. The run was valuable because it exposed a real epistemic gap instead
of hiding it.

#### Verdict

Brain ROI: positive. It proved the spine and surfaced a critical weakness, but
it did not prove cognitive quality.

### Run 2: MM-33 Memory Dogfood

#### What the run was trying to do

Promote one reviewed KRN lesson through `MemoryReviewGate` and prove it later
appears in planning context and can be recorded as helped.

Refs:

- `executionRun: daafa66b-dd85-4b7c-bcf5-9ccf60c2b170`
- `memoryCandidate: 2b31845c-1e34-4e5e-9862-23d0ce12cb69`
- `memoryRecord: 41d1a2ef-3578-4e45-947f-42c6739796de`
- later `executionRun: 54f6e3e0-d634-4b61-a67c-cde5d558f822`
- `memoryApplication: 55a8e695-8665-45da-a19e-b8be578708ea`
- related commit: `9fa89b5`

#### Activated context

| Item | Type | Helped? | Evidence | Notes |
| --- | --- | --- | --- | --- |
| `memory_record:41d1a2ef-3578-4e45-947f-42c6739796de` | MemoryRecord | helped | Later plan included the promoted memory and application record stored `outcome: helped`. | Direct match to the next task. |

Activation verdict: good for this narrow task.

#### Memory usefulness

This is the strongest memory-usefulness proof in the inspected set. The
candidate had a source claim, application guidance, confidence, invalidation
rule, review-gate metadata, and MemoryRecordVersion. It was later selected for
a matching task and manually recorded as helped.

#### Source usefulness

Source grounding was useful because the candidate was backed by
`sourceClaim:f0b5c9ee-01aa-41df-9268-7df3f7437068` and review metadata
preserved reviewed source claim IDs. The source does not prove automatic
promotion safety or golden memory behavior.

#### Evidence/review usefulness

Evidence is strong for reviewed promotion and later application, based on the
ledger's before/after counts and persisted IDs. It remains docs-ledger evidence
in this current shell because DB timed out.

#### Observation/reflection usefulness

Not central to this run. Observation/reflection did not create this memory.
That is good: memory promotion was explicit and reviewed.

#### Candidate quality

Ready. The candidate had enough fields for review and was promoted through the
gate. It saved future work in the later matching plan.

#### Review burden delta

Reduced. The lineage and review metadata make the later memory application
auditable without re-deriving the full MM-32/MM-33 decision.

#### Verdict

Brain ROI: strong positive for reviewed dogfood memory. This supports
dogfood-ready status, not product-ready status.

### Run 3: MM-38 Source-To-Decision Dogfood

#### What the run was trying to do

Represent an implementation decision as a decision-grade SourceClaim and link
it to the harness run through SourceDecisionEdge without new runtime behavior.

Refs:

- `executionRun: bba64c9a-eb96-47b7-819a-93937e6d8c5d`
- `sourceClaim: d5ea7024-7d7a-4291-a050-4de1fbebf605`
- `sourceDecisionEdge: a343ebef-2951-4ba6-b0d7-8eb3af586509`
- related commit: `669b917`

#### Activated context

| Item | Type | Helped? | Evidence | Notes |
| --- | --- | --- | --- | --- |
| Source-to-decision doctrine | SourceClaim/decision edge | helped | The run persisted a claim with mechanism, does-not-prove, falsifier, trust tier, consumer, and run linkage. | Good source grounding, not activation quality proof. |

Activation verdict: insufficient evidence. The run proves source linkage, not
whether activation selected the best source context.

#### Memory usefulness

Memory was not the main mechanism. No Memory Core mutation occurred, which is
correct for this source-only decision.

#### Source usefulness

Good. The SourceClaim qualified the decision and explicitly said it does not
prove ActivationEngine v2 trust filters or source graph query quality. That
prevented overclaiming.

#### Evidence/review usefulness

Moderate. The run has persisted IDs and DB proof copied into the ledger, but no
current-shell DB verification. It reduced review burden by making decision
support explicit.

#### Observation/reflection usefulness

Not materially evaluated. No reflection candidate persistence was in scope.

#### Candidate quality

No MemoryCandidate or EvalCandidate was expected. The source decision itself
was reviewable.

#### Review burden delta

Reduced for architecture decision review. The reviewer can inspect one claim,
one edge, and one does-not-prove boundary instead of reconstructing the
decision from prose.

#### Verdict

Brain ROI: positive for source grounding. It does not prove source selection
quality or production-scale source graph behavior.

### Run 4: MM-58 Feedback Dogfood

#### What the run was trying to do

Dogfood evidence capture, review assessment, feedback delta, proposal-only
candidates, and review burden/diff risk recording.

Refs:

- `executionRun: 5db6c5aa-3fcf-48bd-b013-f732c7558e33`
- `evidenceBundle: 4d2e3247-4469-45bc-99a3-0a4b4095110d`
- first `reviewAssessment: 99ad79d8-f4b1-4018-9721-79676238e882`
- first `feedbackDelta: 0ba61fdd-179d-455d-bac5-af57515b6f87`
- manual `reviewAssessment: c6b0130d-c6d0-4db2-95b5-4076201eee4e`
- manual `feedbackDelta: de8b97e3-1593-4f4c-891a-60c7a3df444c`
- related commit: `9db4306`

#### Activated context

| Item | Type | Helped? | Evidence | Notes |
| --- | --- | --- | --- | --- |
| Plan context for MM-58 | ContextAssembly | unknown | Ledger records `contextAssembly: 20a17922-a69d-49db-8a4a-acb998b1271c` but does not list selected context. | Insufficient activation evidence. |

Activation verdict: insufficient evidence.

#### Memory usefulness

The run did not create MemoryCandidate rows or MemoryRecords. That was correct.
It produced one proposal-only memory candidate with missing fields, which is
useful as review input but not useful memory yet.

#### Source usefulness

No source decisions were generated. Source grounding was not the main path.

#### Evidence/review usefulness

Mixed but valuable. Evidence capture recorded changed files, diff risk,
review burden, rollback path, and no Memory Core mutation. It also honestly
captured unrelated dirty `docs/materials` files. The subsequent review assessed
the run as `changes_requested` with `dirty_context`, which is exactly useful
feedback rather than a fake green ledger.

Command evidence was weak in the original capture because `pnpm typecheck`,
`pnpm test`, and `git diff --check` were skipped. That means the run proves
feedback plumbing and dirty-context detection, not implementation correctness.

#### Observation/reflection usefulness

Not central. FeedbackDelta proposals are visible, but no observation/reflection
quality is proven here.

#### Candidate quality

Needs more evidence. The proposal had missing
`applicationGuidance`, `sourceLineage`, and `invalidationRule`, and correctly
stayed `feedback-delta-proposal-only`. This is useful review material, not a
promotable candidate.

#### Review burden delta

Reduced for risk visibility, increased slightly by dirty local context. The
important win is that KRN captured and preserved the dirty-context problem.

#### Verdict

Brain ROI: mixed positive. It improved review honesty and burden tracking, but
did not prove command verification or candidate quality.

### Run 5: MM-45 Activation Observation Prefix Dogfood

#### What the run was trying to do

Compare a KRN memory task before and after observation prefix activation using
existing activation APIs and no Memory Core mutation.

Refs:

- selected observation: `observation-mm45-selected`
- source range: `docs/plans/memory-ideal-state/PLAN.md#MM-45`
- related commit: `cb6af1d`

#### Activated context

| Item | Type | Helped? | Evidence | Notes |
| --- | --- | --- | --- | --- |
| `observation-mm45-selected` | Observation prefix item | helped | Before was `abstained/no_candidates`; after was `assembled` with one source-ranged prefix item and score 55. | Narrow context precision improvement. |

Activation verdict: good for prefix gating, insufficient for general activation
quality.

#### Memory usefulness

Memory Core counts were unchanged. That is correct because the run tested
observation prefix admission, not memory promotion.

#### Source usefulness

The prefix item had one source range, which matters because observation prefix
truth must not become unsourced prompt filler. The source was enough for this
dogfood, not proof of broad source quality.

#### Evidence/review usefulness

Evidence is moderate. The before/after JSON and row counts make the behavior
reviewable. There was no EvidenceBundle or ReviewAssessment for this one-off
script path.

#### Observation/reflection usefulness

Observation prefix was useful. Reflection was explicitly out of scope. The run
does not prove automatic DB observation loading into `krn plan`.

#### Candidate quality

No candidates were expected or created. Correctly empty.

#### Review burden delta

Reduced for this narrow activation question: one sourced prefix item is easier
to review than broad context dumping. Not enough to prove activation relevance
across real plan runs.

#### Verdict

Brain ROI: positive for activation prefix mechanics. Product value remains
bounded until runtime fetching and golden behavior proof exist.

## Cross-Run Patterns

- Useful pattern: reviewed memory promotion works best when the candidate has
  source lineage, application guidance, invalidation, review metadata, and a
  later application record.
- Useful pattern: source claims reduce overclaiming when they include mechanism,
  does-not-prove, falsifier, trust tier, and consumer.
- Useful pattern: evidence/review artifacts are valuable when they preserve
  dirty context or weak proof instead of laundering it into success.
- Repeated weakness: activation ledgers often record context assembly IDs but
  not enough selected/used/helped/missing analysis.
- Repeated weakness: reflection persistence is proven, but reflection output
  quality is mostly unproven. Zero findings may be correct, but current dogfood
  evidence does not distinguish correct emptiness from weak extraction.
- Repeated weakness: candidate paths can be structurally correct while still
  too vague or under-evidenced for promotion.
- Repeated operational gap: DB truth is historical for this report because
  current `pnpm db:ready` timed out.

## What The Brain Already Does Well

- It preserves task/run/evidence/review IDs well enough to reconstruct many
  dogfood paths. Evidence: P7 ties plan, EvidenceBundle, ObservationGroup,
  FeedbackDelta, and ReflectionRecord to one run.
- It can promote reviewed memory and later select/apply it for a matching
  task. Evidence: MM-33 `memoryRecord:41d1a2ef-3578-4e45-947f-42c6739796de`
  and `memoryApplication:55a8e695-8665-45da-a19e-b8be578708ea`.
- It can represent architecture decisions as source-grounded records with
  does-not-prove and falsifier fields. Evidence: MM-38
  `sourceClaim:d5ea7024-7d7a-4291-a050-4de1fbebf605`.
- It can keep candidate/proposal paths from mutating Memory Core without
  review. Evidence: MM-58 proposal-only candidate and P7 observe/reflect
  outputs.
- It can improve context precision with sourced observation prefix material
  instead of padding context. Evidence: MM-45 before/after activation result.

## What Is Still Mostly Ledger

- Reflection quality. Records exist, but inspected reflection runs produced
  zero findings or candidates and do not prove useful extraction.
- General activation quality. Some selected context helped, but P7 shows only
  partial relevance and several neutral inclusions.
- Candidate quality at scale. One strong candidate exists, but other proposals
  remain missing key fields or require later staging.
- Live DB reproducibility in this shell. Historical ledgers record DB proofs,
  but current readiness failed with `CONNECT_TIMEOUT`.
- Product readiness. The inspected evidence is KRN dogfood evidence, not target
  repository product validation.

## Highest-Value Next Repairs

Repair candidate:
Activation usefulness reporting.
Why:
Selected context is not enough; every dogfood run needs selected/used/helped/
missing/stale classification.
Evidence:
P7 had six selected items but only two helped materially; MM-58 has a
ContextAssembly ID without selected item analysis.
Files likely touched:
docs/run/report template or CLI evidence/review output, not activation scoring
first.
Non-goals:
no ranking rewrite, no dashboard, no new memory layer.
Verification:
one report fixture or dogfood ledger with selected/used/helped/missing rows.

Repair candidate:
Reflection quality dogfood case.
Why:
Reflection persistence is proven, but useful findings/candidates are not.
Evidence:
P7 and MM-25 reflection recorded zero findings/candidates and explicitly warn
not to assume candidate quality.
Files likely touched:
docs/reviews or a bounded fixture/golden behavior test if implementation is
chosen later.
Non-goals:
no autonomous memory mutation, no worker runtime.
Verification:
a dogfood case with expected useful gap/contradiction/candidate output and
reviewable evidence refs.

Repair candidate:
Candidate reviewability checklist.
Why:
Proposals need a cheap way to show ready vs missing evidence before review.
Evidence:
MM-33 was ready; MM-58 proposal was useful but missing application guidance,
source lineage, and invalidation rule.
Files likely touched:
review/evidence docs or candidate rendering code in a later implementation
slice.
Non-goals:
no automatic promotion.
Verification:
candidate output labels ready / needs more evidence / duplicate / too vague.

Repair candidate:
Evidence capture dirty-context ergonomics.
Why:
Dirty unrelated files are useful signals but increase review burden if not
separated from slice files.
Evidence:
MM-58 captured unrelated raw `docs/materials` files and later required
`changes_requested`.
Files likely touched:
evidence capture output/reporting only if implementation follows.
Non-goals:
no hidden cleanup, no ignored-file policy change without proof.
Verification:
evidence output separates intended files, unrelated dirty files, and command
proof strength.

Repair candidate:
Internal-alpha trial gate.
Why:
Dogfood value is positive, but target-repo product value is unproven.
Evidence:
All inspected value is KRN-on-KRN; README says full governed product loop is
not complete.
Files likely touched:
one future bounded goal/report under docs/reviews.
Non-goals:
no dashboard, no worker runtime, no broad eval platform.
Verification:
one target repo trial with before/after review burden and context usefulness.

## What Not To Build Next

- dashboard;
- worker runtime;
- broad eval platform;
- source crawler;
- new memory subsystem;
- new plan-sprawl;
- `krn audit`;
- anti-slop scanner;
- Promptfoo authority layer;
- generic multi-agent workflow.

## Product Readiness Verdict

dogfood-ready:

The current KRN Brain is useful enough for controlled KRN-on-KRN work where the
operator can read ledgers, verify command proof strength, and reject
overclaims. It is not internal-alpha-ready for target repos yet because
activation quality, reflection usefulness, candidate quality, and live DB
runtime reproducibility were not proven in this report.

## Next Recommended Goal

One bounded repair slice:

```txt
Goal: Add KRN Brain Usefulness Reporting For Dogfood Runs
```

It should not change activation scoring first. It should make future run
ledgers/report output record selected/used/helped/missing/stale context,
candidate reviewability, command proof strength, and review burden delta. If
that report shows repeated activation misses, then follow with an activation
scoring repair.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
| ------- | ------ | -------------- | ---------------------- |
| `rtk git fetch --prune` | passed | Remote refs were refreshed before this report. | GitHub CI status or DB readiness. |
| `rtk git status --short --branch` | passed, clean before report write | Worktree started clean and `main` tracked `origin/main`. | That future edits are clean. |
| `rtk git log --oneline --decorate --left-right origin/main...main` | passed, no entries | No ahead/behind difference after fetch. | Remote CI status. |
| `rtk git log --oneline --decorate -20` | passed | Latest commit and recent history were recorded. | Correctness of the code. |
| `rtk pnpm db:ready` | failed | Current shell could not reach local Postgres at `localhost:54329`. | Historical DB ledger truth is false; only current DB runtime is unverified. |
| `rtk find docs/runs -maxdepth 2 -type f` | passed | Run ledger inventory was available. | Completeness of every historical dogfood artifact. |
| `rtk rg ... docs/runs docs/reviews docs/architecture docs/decisions` | passed | Located relevant evidence terms and pointers. | That every selected row exists in live DB. |
| `rtk git log --follow --oneline --decorate -- <selected run ledger>` | passed | Related documentation commits were identified for selected ledgers. | Runtime behavior of those runs. |

## Appendix: Evidence Pointers

- `docs/reviews/brain-usefulness/PLAN.md`
- `AGENTS.md`
- `docs/KRN_KERNEL.md`
- `README.md`
- `GOAL.md`
- `PLAN.md`
- `docs/runs/2026-06-23-self-hosting-memory-loop.md`
- `docs/runs/2026-06-23-memory-dogfood.md`
- `docs/runs/2026-06-23-source-to-decision-dogfood.md`
- `docs/runs/2026-06-23-feedback-dogfood.md`
- `docs/runs/2026-06-23-activation-observation-prefix-dogfood.md`
- `docs/runs/2026-06-22-observation-dogfood.md`
- `docs/runs/2026-06-22-reflection-dogfood.md`
- `docs/architecture/cli-surfaces.md`
- `docs/architecture/package-surfaces.md`
- `docs/decisions/ADR-0014-activation-is-admission-control.md`
- `docs/decisions/ADR-0019-evidence-command-proof-states.md`
- commits: `d57096d`, `64a5bed`, `c8aa69e`, `cc57a93`, `87cac53`,
  `9fa89b5`, `669b917`, `9db4306`, `cb6af1d`
