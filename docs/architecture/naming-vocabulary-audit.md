# KRN Naming And Vocabulary Audit

Status: source-to-decision audit for bounded rename work.

Re-verified 2026-07-05 under `mise-en-palace-o67w`: a full source+docs sweep for
the target vocabulary (`final`, `new`, `normalized`, `helper`, `utils`,
`manager`, `data`, `info`, `result`) found no new actionable cluster. Every hit
is already covered by a closed cluster below (E: `normalized`/`final`/`new` via
`mise-en-palace-m59a`; A–D: `heartbeat`, `golden`, legacy alias, `policy` via
`mise-en-palace-pj25`, `mise-en-palace-7tsq`, `mise-en-palace-yq2p`,
`mise-en-palace-woql`) or is a legitimate domain name (`packageManager` =
npm/pnpm; `Metadata` = real metadata layer; `*Result` = operation return types).
`o67w` closed as rejected-by-evidence per its own falsifier; no rename executed.

This report is not a rename sweep. It separates names that hide product truth
from names that are merely imperfect. Follow-up implementation must stay
bounded to one cluster at a time.

## Decision Rule

Adopt this naming bar for new and changed KRN surfaces:

- Names must be descriptive and clear to a new reader.
- Names must name the actual runtime authority: read-only preview, persisted
  smoke, deterministic behavior gate, candidate-only maintenance, or real
  executor.
- Names must not imply enforcement, autonomy, truth, finality, or broad product
  proof unless the code enforces it.
- Public/API vocabulary must not use vague modifier words (`final`, `new`,
  `normalized`, `current`, `latest`) unless the name states a real lifecycle
  state, transformation, or comparison axis. Local helper names may keep those
  words when their scope is small and the transformation is mechanically clear.
- Skills are allowed when they encode a repeated workflow with progressive
  disclosure. A skill without a workflow, verification, or consumer is
  documentation, not architecture.

## Source-To-Decision Records

### descriptive TypeScript identifiers

source_id: `google-ts-descriptive-names`
title: Google TypeScript Style Guide, descriptive names
url: `https://google.github.io/styleguide/tsguide.html#naming`
trust_tier: high
source_class: official docs
mechanism: names should be descriptive and clear to a new reader; ambiguous
abbreviations are rejected outside very small scopes.
krn_implication: exported KRN package names, commands, behavior gates, and
skills should optimize for a new operator understanding what authority the
surface actually has.
decision_kind: adopt
decision: use descriptive-new-reader clarity as the naming acceptance test for
future KRN rename tasks.
does_not_prove: this does not prove every Google style choice fits KRN or that
renaming improves behavior without local falsifiers.
consumer: follow-up rename Beads and future TypeScript review.
falsifier: a proposed rename makes the code shorter but less clear about KRN
authority, or cannot cite a confused consumer.

### readable API names

source_id: `microsoft-readable-names`
title: Microsoft Framework Design Guidelines, general naming conventions
url: `https://learn.microsoft.com/en-us/dotnet/standard/design-guidelines/general-naming-conventions`
trust_tier: high
source_class: official docs
mechanism: identifier names should be easily readable and favor readability
over brevity.
krn_implication: KRN should prefer `maintenanceCandidatePreview` over
ceremonial or overloaded labels when the longer name removes false authority.
decision_kind: adopt
decision: accept longer names when they remove ambiguity about runtime
authority or proof boundary.
does_not_prove: this does not justify enterprise-style prefixes, broad
renames, or changing stable CLI names without migration cost analysis.
consumer: naming follow-up Beads.
falsifier: the longer replacement is harder to scan and does not remove a
specific false authority claim.

### placeholder-free public vocabulary

source_id: `rust-api-placeholder-free-names`
title: Rust API Guidelines checklist, naming
url: `https://rust-lang.github.io/api-guidelines/checklist.html`
trust_tier: high
source_class: official docs
mechanism: public API names should avoid placeholder words and keep consistent
word order so callers can predict what a name means before reading the
implementation.
krn_implication: KRN exported package names, CLI headings, active docs, and
operator-facing readbacks should reject vague modifiers such as `final`, `new`,
`normalized`, `current`, or `latest` unless the modifier names a concrete
lifecycle state, transformation, or comparison axis.
decision_kind: adopt
decision: add a source-only follow-up audit for exported/public vague
modifiers; do not rename local helper variables or historical prose by regex.
does_not_prove: this does not prove Rust casing or crate conventions apply to
TypeScript, and it does not justify changing stable public names without a
consumer-pain proof.
consumer: `mise-en-palace-m59a` and future public/API review.
falsifier: a proposed rename removes a vague word but makes the public name
less predictive, or the vague word is purely local to a parse/mapper helper.

### progressive-disclosure skills

source_id: `anthropic-agent-skills-progressive-disclosure`
title: Anthropic Agent Skills overview
url: `https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview`
trust_tier: high
source_class: official docs
mechanism: skill metadata is loaded cheaply, detailed instructions are loaded
only when triggered, and extra resources/scripts are loaded on demand.
krn_implication: KRN repo-local skills are valid if they route repeated work
without bloating root prompts and if each skill has a trigger, workflow, and
verification path.
decision_kind: adopt
decision: preserve operational KRN skills that encode repeated workflows; do
not delete skills only because they are markdown.
does_not_prove: this does not prove every current KRN skill is useful or that a
skill should substitute for typed code, tests, Beads, or source decisions.
consumer: skill audit follow-up tasks.
falsifier: a skill has no repeated workflow, no verification, and no consumer
but still affects architecture claims.

### practitioner engineering skills

source_id: `matt-pocock-skills-real-engineering`
title: Matt Pocock skills repository
url: `https://github.com/mattpocock/skills`
trust_tier: medium
source_class: practitioner writing
mechanism: skills are framed as workflows for real engineering, not vibe
coding; individual skills keep short descriptions and task-specific bodies.
krn_implication: KRN should use skills as operational workflow compression,
not as a second architecture layer or a replacement for code evidence.
decision_kind: adopt
decision: keep KRN's skill-first direction, but require each skill to point at
the KRN primitive or workflow it improves.
does_not_prove: this does not prove Matt Pocock's exact repo layout should be
copied or that KRN needs more skills.
consumer: skill audit follow-up tasks and `docs/architecture/skill-first-krn.md`.
falsifier: a KRN skill exists only to restate broad aspirations and cannot
reduce tokens, prevent a repeated mistake, or improve a Codex workflow.

### local kernel law

source_id: `krn-kernel-law`
title: KRN Kernel Contract
url: `docs/KRN_KERNEL.md`
trust_tier: high
source_class: repo-local evidence
mechanism: KRN should build machinery that selects, applies, verifies, and
forgets context; it rejects broad context, dashboards, generic multi-agent
frameworks, and archive-of-intentions behavior.
krn_implication: names that describe non-executing layers as authority,
runtime, gates, or product proof violate current product law.
decision_kind: adopt
decision: rank rename/downscope tasks by whether the name currently overstates
select/apply/verify/forget authority.
does_not_prove: this does not prove all current names are bad or that renames
alone improve KRN behavior.
consumer: this audit and follow-up Beads.
falsifier: a proposed naming task cannot point to a live primitive,
supporting surface, or reduced/deprecated boundary in the primitive ledger.

## Local Inventory

### Keep

| Vocabulary | Decision | Evidence | Reason |
| --- | --- | --- | --- |
| `readback` | keep | `PLAN.md`; `docs/architecture/behavior-gate-matrix.md`; CLI source/brain/run surfaces | It names an operator-facing output that reads current state without claiming truth. It is dense but accurate in this repo. |
| `smoke` for DB scripts | keep | `package.json`; `packages/db/src/*Smoke.ts`; `evalProofBoundaryManifest.ts` | DB smoke names are conventional and paired with explicit `doesNotProve` boundaries. |
| `preview` for source artifact extraction | keep | `packages/core/src/sourceArtifactPreviewExtraction.ts`; `packages/cli/src/sourceArtifactPreviewView.ts` | It correctly marks local extraction output as reviewable candidate output, not source truth. |
| repo-local skills | keep with guardrails | `.agents/skills/*/SKILL.md`; `skillInvariants` | Operational skills fit progressive disclosure when they have workflow and verification. |

### Harmful Or Misleading

| Vocabulary | Decision | Evidence | Consumer pain |
| --- | --- | --- | --- |
| `heartbeat` as the name for maintenance candidate review | rename/downscope after worker decision | `packages/workers/src/*HeartbeatPreview.ts`; `packages/cli/src/runHeartbeatPreviewCommand.ts`; `packages/workers/README.md` | It sounds like an autonomous runtime loop while the README explicitly lists "no worker daemon", "no background loop", and "no job executor". |
| `golden` as behavior gate vocabulary | rename in a bounded compatibility slice | `packages/harness/src/krnBehaviorGate.ts`; `packages/core/src/behaviorFixture.ts`; `package.json` | It suggests canonical truth. The active route is `eval:krn:smoke`, and the behavior matrix calls this deterministic behavior/docs smoke rather than truth. |
| Old active eval alias | fixed by `mise-en-palace-yq2p` | `package.json`; `docs/architecture/primitive-ledger.md`; `docs/architecture/behavior-gate-matrix.md` | The old alias was removed; active verification routes through `eval:krn:smoke`. |
| `policy` in Codex adapter skill binding source | fixed by `mise-en-palace-woql` | `packages/codex-adapter/src/contracts.ts`; `packages/codex-adapter/src/renderSkillHints.ts` | The unused `policy` binding source was removed; skill hints are currently emitted from `capability_plan` only. |
| `Contract` suffix where the object is only validated shape | fixed for BehaviorFixture validation by `mise-en-palace-woql` | `packages/core/src/behaviorFixture.ts:validateBehaviorFixture`; `packages/harness/src/behaviorFixtureRunner.ts:fixtureFindings`; `packages/codex-adapter/src/renderExecutionBrief.ts` headings | BehaviorFixture validation is now named as fixture validation. `TaskContract` and `EvidenceContract` remain because they are execution/review obligations rendered into Codex briefs. |

### Not Currently A Problem

| Vocabulary | Decision | Evidence | Reason |
| --- | --- | --- | --- |
| `normalized` / `normalize` | public review API fixed by `mise-en-palace-m59a`; local helper uses retained | `packages/core/src/reviewOutcome.ts`; `packages/core/src/feedbackDelta.ts`; `packages/cli/src/runReviewAssessCommand.ts`; source grep | Exported review vocabulary now uses `ReviewOutcome`, `ReviewRisk`, `parseReviewOutcome`, `parseReviewRisk`, and `summarizeFeedbackDeltaReview`. Remaining hits are local parsing/standardization helpers or prose with clear transformation scope. |
| `final` / `new` | retained after public-source audit | source grep | Current hits are ordinary lifecycle prose, local control-flow names, fixture wording, or standard constructors such as `new Set` / `new Date`. No exported package symbol or CLI/readback heading was found where the modifier hides a domain boundary. |
| `candidate` | keep | Memory/source/eval/review flows | It is a real lifecycle state in KRN, not decoration. |
| `gate` | keep when enforced | `MemoryReviewGate`, activation filters, invariants | Gate is acceptable only when backed by deterministic enforcement or explicit invariant. |

## Follow-Up Rename Clusters

### Cluster A: worker heartbeat vocabulary (`mise-en-palace-pj25`, active cleanup)

Problem: `heartbeat` implies autonomous periodic execution, while current code
is candidate-only maintenance preview/readback.

Decision: `mise-en-palace-4ums` kept workers contract/readback-only. The first
cleanup added `manualCandidateLoop` as the preferred readback field while
retaining `runtimeLoop` as a legacy JSON alias. Keep CLI aliases unless a
separate deprecation path is justified.

Acceptance:

- README, CLI help, exported types, and tests agree on candidate-only language.
- No name implies daemon, scheduling, autonomous execution, or Memory Core
  mutation.
- Existing `doesNotProve` boundaries remain visible.

### Cluster B: behavior fixture vocabulary (`mise-en-palace-7tsq`, closed)

Problem: `golden` suggests canonical truth, while current behavior is a
deterministic fixture gate.

Proposed direction: rename user-facing docs/scripts toward `behavior gate` and
code internals toward `BehaviorFixture` / `BehaviorGate` only in one bounded
compatibility slice. Avoid changing fixture IDs unless the slice provides a
migration map.

Acceptance:

- `pnpm eval:krn:smoke` still passes.
- Behavior matrix names deterministic fixture proof, not source truth.
- Public fixture IDs either stay compatible or are migrated with explicit tests.

Tracking: `mise-en-palace-7tsq`, closed. Active routing keeps
deterministic behavior fixture/gate wording; compatibility fixture IDs were
handled in the bounded slice.

### Cluster C: legacy eval alias removal (`mise-en-palace-yq2p`, closed)

Problem: the active proof route is `eval:krn:smoke`; the old smoke route was
already deprecated as a compatibility alias.

Resolution: after a green compatibility CI window, delete the alias and active
references outside historical docs.

Tracking: `mise-en-palace-yq2p`, closed. Active scripts use
`eval:krn:smoke`; historical docs remain historical.

Acceptance:

- No active script or active architecture doc recommends the old smoke route.
- `eval:krn:smoke` remains the only active deterministic behavior/docs gate.

### Cluster D: policy/contract residue inspection (`mise-en-palace-woql`, closed)

Problem: phantom policy gates were deprecated, but small naming residues
remained.

Resolution: `mise-en-palace-woql` removed the unused `policy` value from
`CodexSkillBindingSource` and renamed BehaviorFixture validation/readback from
contract language to fixture language. Retained `TaskContract`,
`EvidenceContract`, `MemoryReviewGate`, activation/context gates, and pattern
gate wording remain because they name execution obligations, deterministic
enforcement, or bounded workflow gates with active consumers.

Tracking: `mise-en-palace-woql`.

Acceptance:

- Each retained `policy`, `gate`, or `contract` name cites its enforcing
  consumer.
- Misleading residues are renamed to `constraint`, `shape`, `input`, or
  `requirement` as appropriate.

### Cluster E: public vague modifier audit (`mise-en-palace-m59a`, closed)

Problem: local helper words such as `normalized`, `final`, `new`, `current`,
and `latest` are acceptable in tiny scopes, but the same words become
misleading when exported or shown to operators without a concrete lifecycle or
transformation axis.

Decision: source-only audit exported package symbols, CLI/readback headings, and
active docs. Rename only proven-public misleading cases. Keep local
parse/mapper/control-flow helpers when their scope and transformation are
obvious.

Result: renamed the exported review outcome API from vague `Normalized*` /
`normalize*` vocabulary to concrete review outcome/risk and parse/summarize
vocabulary. No broad sweep was done for local helpers, constructors, fixtures,
or historical prose.

Acceptance:

- Each changed public name cites consumer pain and replacement semantics.
- Local helper names may be retained with evidence.
- No repo-wide regex rename or historical docs churn.

## Rejected Work

- No repo-wide regex rename for `readback`, `smoke`, `preview`, `candidate`,
  `gate`, `normalized`, `final`, or `new`.
- No historical docs rewrite for grep cleanliness.
- No skill deletion wave without checking workflow, consumer, and verification.
- No worker daemon just to make the old `heartbeat` name true.

## Proof Boundary

Proves:

- local inventory found the main current vocabulary risks;
- external and local sources map to concrete KRN naming decisions;
- follow-up work is sliced by authority risk instead of cosmetic preference.

Does not prove:

- every poor name in the repo is listed;
- every proposed rename is worth its churn;
- skills improve Codex output by default;
- KRN is product-ready.
