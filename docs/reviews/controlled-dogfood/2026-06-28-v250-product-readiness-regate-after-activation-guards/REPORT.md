# V250 Product Readiness Re-Gate After Activation Guards

Status: readiness re-gate, not product-ready claim.

Date: 2026-06-28
Evaluator: Codex
Repo state: `main...origin/main`, clean before edits
Latest verified input commit: `11e8dcf test(activation): guard source seed budget priority`

## Executive Verdict

KRN is a controlled-internal-alpha brain for technical operators, not a
product-ready tool. The last activation sequence removed several local caveats:
source-decision owner files are seeded, repo-local skills are seeded, observe
must complete before reflect for reflection-quality claims, and a tight-budget
guard now protects strongly matching task-specific source seeds. That makes the
brain materially stronger, but product readiness still requires fresh target
repo evidence and non-author operator proof.

The project is no longer a generic ledger. It is a governed workflow brain with
store-backed evidence, source decisions, skills, activation read-model repairs,
candidate reviewability, and CI/DB-backed regression proof. It is not yet
breakthrough product evidence because the strongest proof is still mostly
KRN-on-KRN and technical-operator dogfood.

## Readiness Matrix

| Dimension | Current evidence | Status | Missing proof | Next implication |
|---|---|---|---|---|
| Evidence and review | Evidence provenance, dirty-context classification, reviewability labels, and DB readback are implemented and guarded. | strong for dogfood | Evidence usefulness on fresh target work. | Use in next target trial. |
| DB-backed loop | Current-shell DB replay has proven plan/evidence/observe/reflect and metadata readback. | strong locally | Repeat on target trial and non-author operator flow. | Keep DB-backed proof as default for product gates. |
| Source-to-decision / research | Pattern gate exists: source -> mechanism -> implication -> decision/rejection -> consumer -> falsifier. Best-pattern intake has been applied to TypeScript and Codex-process surfaces. | good | Repeated external-source use on target work, not only KRN source. | Keep research as decision pipeline, not source hoarding. |
| TypeScript / infra standards | Strict TS boundaries, finite-state exhaustiveness, package surface cleanup, and source-map/usefulness gates are in place. | good | Target-repo transfer proof. | Target trial should test whether KRN exports these standards into real repair. |
| Skills | Repo-local skills are discoverable as read-model seeds after V247. | good | Non-author skill use and friction proof. | Include skills in target trial packet. |
| Activation | V245/V247 fixed read-model seed gaps; V249 budget-priority guard passed without scoring rewrite. | improved | Fresh target trial with current activation inputs; selected/used/helped/missing review. | Do not rewrite scoring yet. Test on target. |
| Reflection | Observe/reflect sequencing is guarded; reflection can select observations after observe completes. | flow proven | Useful extraction/candidate quality on target work. | Measure in target trial before rewriting extraction. |
| Candidate quality | Candidate reviewability is now a core primitive and reflection output uses it. | better | Repeated useful reviewable candidates from target work. | Target trial should inspect candidate reviewability. |
| Target trials | Earlier target/fixture/readiness work exists, but several gates still note missing fresh real target evidence after later activation repairs. | insufficient for product | Fresh observation-first or tightly scoped writable target trial with owner files, rollback, evidence, and usefulness report. | Select target trial as next blocker. |
| Second-operator proof | V02-01 packet exists but remains blocked/deferred. | missing | Real operator transcript or explicit equivalent support proof. | Do not claim widened alpha/product-ready without it. |
| CI/eval | CI and smoke/eval guards have been used and recent commits were green. | good for repo | Release-grade product workflow checks and target-trial regression set. | Keep CI as regression guard, not product proof. |
| Product UX / release | Operator runbooks and packets exist, but workflows are still technical and support-heavy. | not product-ready | Usability, support boundary, failure taxonomy, and non-author completion proof. | Product-ready is after target + operator gates, not after local repairs. |

## Product-Ready Definition

KRN becomes product-ready only when these are all true:

1. A fresh target repo trial with the current brain completes end-to-end with
   explicit target mode, owner files, rollback, evidence, observe/reflect, and
   usefulness reporting.
2. A real second operator, or an explicitly accepted equivalent support
   transcript, can run the workflow without author-only context.
3. Activation review for target work shows selected/used/helped context and
   names missing context honestly.
4. Reflection/candidate output produces reviewable useful candidates in target
   work, not only ledger entries.
5. CI/eval/release checks protect the core product workflows.
6. Known limitations and support boundaries are documented and accepted.

Until then, the honest label is:

```txt
controlled-internal-alpha for technical operators: yes / stronger
widened internal alpha: no
product-ready: no
```

## Are Best Patterns Used?

Yes, but as a decision pipeline rather than decoration. The active standard is:

```txt
source -> mechanism -> KRN implication -> decision/rejection -> consumer -> falsifier
```

That means papers, OpenAI docs, TypeScript guidance, Matt Pocock-style type
modeling, CI/eval practice, or local dogfood reports should become enforceable
choices only after they explain a mechanism and name a falsifier. This is the
right direction for infra: not "we read a good source", but "this source changed
this boundary, this guard, this skill, this type, or this eval, and here is how
future work can falsify it."

## Is The Brain Breakthrough?

It is not breakthrough because it has magic retrieval or autonomous product
judgment. It is potentially strong because it combines several boring pieces
that usually stay disconnected:

- bounded context selection;
- evidence provenance and does-not-prove boundaries;
- source-to-decision records;
- reviewability before promotion;
- DB-backed run ledgers;
- skills as explicit execution organs;
- CI/eval/regression guards;
- compact active plans after context loss.

The current breakthrough risk is positive but unproven: if target trials show
that this loop reliably improves unfamiliar code with less review burden, it
becomes meaningfully different from a normal checklist. If it only helps KRN
maintainers inside KRN, it remains a strong internal engineering harness, not a
product brain.

## Selected Next Blocker

Next task:

```txt
V251-00 Fresh Target Trial Gate After Activation Guards
```

Why:

Activation seed and budget blockers have recent guards. The next missing proof
is not another local activation repair; it is whether the current brain helps on
a fresh target repo with explicit target boundaries.

Scope:

- select one safe target repo and mode;
- record dirty state, owner files, support boundary, rollback, and allowed
  writes;
- prefer observation-only or packet-first if target ownership is unclear;
- do not write to a living target repo until mode, owner files, rollback, and
  allowed files are explicit;
- create a target trial packet/report that can drive the actual trial.

Falsifier:

KRN claims product readiness from self-dogfood or local guards without fresh
target/operator evidence.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `git status --short --branch` | passed before edits | Local branch was aligned and clean before V250 edits. | Product readiness. |
| `rg ... brain-usefulness/REPORT.md` | passed | Historical readiness caveats still name candidate/reflection/activation/DB and product-readiness limits. | Current target behavior. |
| `rg ... v55...REPORT.md` | passed | Prior product re-gate still rejected product-ready and widened alpha without second-operator/target proof. | That the same blocker is unchanged after V250 without this analysis. |
| `rg ... v245..v249 reports` | passed | Recent activation seed/budget work improved local activation/read-model evidence and still disclaimed product readiness. | General activation quality or target readiness. |

## Next Recommended Action

Run V251 as a bounded target trial gate. Do not open dashboard, MCP, worker
runtime, source crawler, broad eval platform, or activation scoring rewrite
before V251 selects the next evidence surface.
