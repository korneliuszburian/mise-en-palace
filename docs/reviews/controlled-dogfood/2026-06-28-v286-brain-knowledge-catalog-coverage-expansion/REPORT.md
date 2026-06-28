# V286 Brain Knowledge Catalog Coverage Expansion

Status: complete.

## Objective

Increase useful brain knowledge coverage from existing reviewed KRN evidence
before adding any wider UI/search surface.

## Change

Added four retained pattern decisions:

```txt
docs/patterns/retained-patterns/active-context-compact-current-truth.json
docs/patterns/retained-patterns/brain-knowledge-read-only-ui-boundary.json
docs/patterns/retained-patterns/target-repo-write-authority-boundary.json
docs/patterns/retained-patterns/untrusted-context-warning-boundary.json
```

Updated:

```txt
docs/brain-knowledge/catalog.json
packages/harness/src/brainKnowledgeReadModelInvariants.test.ts
packages/cli/src/runKnowledgeCardsCommand.test.ts
```

Catalog breadth moved from 4 retained pattern cards to 8 retained pattern
cards.

## Source-To-Decision

### active-context-compact-current-truth

- Source: root active surfaces, `docs/KRN_KERNEL.md`, V255 active ledger
  condensation report, active/context hygiene invariants.
- Mechanism: small active truth prevents stale prompts, historical ledgers, and
  completed task walls from becoming default context.
- KRN implication: compact/resume work must route through current root state.
- Decision: retain as active pattern.
- Consumer: future compact/resume runs and plan edits.
- Falsifier: a compact/resume flow follows stale pasted objective or historical
  ledger while tests still pass.

### brain-knowledge-read-only-ui-boundary

- Source: `BrainKnowledgeReadModel`, ADR-0025, ADR-0028, V281-V285 reports.
- Mechanism: UI/search can show read-only cards and proof boundaries before
  creating API/MCP/dashboard/mutation authority.
- KRN implication: keep brain knowledge web/search static and read-only until
  usefulness proof requires a larger surface.
- Decision: retain as active pattern.
- Consumer: future UI/search/API/MCP readiness gates.
- Falsifier: a future UI/search slice mutates Memory Core, SourceDecision,
  candidate status, or evidence.

### target-repo-write-authority-boundary

- Source: `target-repo-testing` skill, target trial reports, brain-battle
  matrix, root plan non-goals.
- Mechanism: target work is safe only when mode, dirty state, write authority,
  allowed/forbidden writes, rollback, verification, and proof boundaries are
  explicit.
- KRN implication: do not write to living target repos by default.
- Decision: retain as active pattern.
- Consumer: future target-repo trials and second-operator gates.
- Falsifier: target writes happen without explicit authority and rollback while
  tests still pass.

### untrusted-context-warning-boundary

- Source: security/trust boundaries, Codex adapter renderer/tests, golden
  behavior evidence.
- Mechanism: selected context can still contain untrusted external text; the
  Codex brief must label that risk instead of treating selection as trust.
- KRN implication: Codex-facing briefs need deterministic untrusted-context
  warnings and proof boundaries.
- Decision: retain as active pattern.
- Consumer: future Codex adapter changes and target-repo trials.
- Falsifier: a future brief renders untrusted context without warning and tests
  still pass.

## Evidence

Commands run:

```sh
pnpm --filter @krn/harness test -- brainKnowledgeReadModelInvariants brainKnowledgeReadModel
cd packages/cli && pnpm exec tsx src/index.ts knowledge cards --catalog-file docs/brain-knowledge/catalog.json --text target-repo --json
cd packages/cli && pnpm exec tsx src/index.ts knowledge cards --catalog-file docs/brain-knowledge/catalog.json --text read-only --json
cd packages/cli && pnpm exec tsx src/index.ts knowledge cards --catalog-file docs/brain-knowledge/catalog.json --text untrusted --json
cd packages/cli && pnpm exec tsx src/index.ts knowledge cards --catalog-file docs/brain-knowledge/catalog.json --text compact --json
pnpm brain:knowledge:preview
grep -q "pattern:active-context-compact-current-truth" .local-lab/brain-knowledge-preview.html
grep -q "pattern:brain-knowledge-read-only-ui-boundary" .local-lab/brain-knowledge-preview.html
grep -q "pattern:target-repo-write-authority-boundary" .local-lab/brain-knowledge-preview.html
grep -q "pattern:untrusted-context-warning-boundary" .local-lab/brain-knowledge-preview.html
```

Result:

```txt
new retained pattern files parse: yes
catalog readback includes 8 pattern files: yes
query target-repo finds target-repo write authority pattern: yes
query read-only finds brain knowledge UI boundary pattern: yes
query untrusted finds untrusted context warning pattern: yes
query compact finds active context current-truth pattern: yes
static preview includes new pattern ids: yes
```

## What This Proves

- The brain knowledge catalog now covers four additional high-value KRN
  operating patterns.
- Each added pattern has source refs, evidence refs, consumers, falsifier, and
  does-not-prove boundary.
- The catalog-backed read model can retrieve the new patterns.
- The static preview includes the new cards.

## What This Does Not Prove

- Product readiness.
- Catalog completeness.
- Search ranking quality.
- That external research/course/paper intake is complete.
- That future Codex runs automatically apply every retained pattern.

## Brain Usefulness

Verdict: positive.

The static preview shell is now backed by a broader, still reviewable knowledge
catalog. The next bottleneck is not more UI chrome; it is the controlled
addition of external/public best-practice patterns through source-to-decision.

## Next Task

V287 should run the first bounded external/public pattern intake into the brain
knowledge catalog:

```txt
Brain Knowledge External Pattern Intake Trial
```

Expected constraints:

- use only public/legal source summaries or official docs;
- map source -> mechanism -> KRN implication -> decision/rejection -> consumer
  -> falsifier;
- add at most a small number of high-value retained decisions;
- update catalog/readback guards;
- do not ingest paid/proprietary course material, crawl broad sources, build
  Research Foundry, API, MCP, dashboard, or claim SOTA/product readiness.
