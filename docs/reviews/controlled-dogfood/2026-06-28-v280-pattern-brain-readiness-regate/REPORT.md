# V280 Pattern Brain Readiness Re-Gate

Status: complete.

## Executive Verdict

Pattern brain is no longer just an idea. It now has retained patterns, typed
read models, CLI/HTML readback, skill hooks, Codex adapter pattern refs, and a
DB-backed adapter smoke proof.

It is still not a full autonomous quality brain. It is an internal-alpha pattern
execution spine.

```txt
pattern brain readiness: internal-alpha spine
product-ready: no
web search UI: not built
continuous research condensation: partial
automatic skill selection: not proven
```

## What Became Real In V275-V279

| Area | State | Evidence |
|---|---|---|
| Full-catalog HTML readback | guarded | V275 report, `runKnowledgeCardsCommand` HTML catalog breadth test |
| Skill-routing retained pattern | added | V276 report, `codex-skill-progressive-disclosure-routing` card |
| Adapter skill readback hook | guarded | V277 report, `skillInvariants` |
| Codex brief skill pattern refs | implemented | V278 report, `CodexSkillBindingHint.patternRefs` |
| DB-backed adapter smoke readback | proven | V279 report, `Skill pattern refs present: yes` |

## What This Means

KRN can now express this loop:

```txt
source / repo evidence / docs
  -> retained pattern
  -> brain knowledge card
  -> CLI/HTML readback
  -> skill hook
  -> Codex adapter brief pattern refs
  -> DB-backed smoke proof
```

That is the first credible skeleton of the pattern brain.

## What Is Still Missing

### 1. Web Search Surface

Current state:

```txt
CLI readback: yes
self-contained HTML preview: yes
web app/API search: no
```

Needed:

```txt
read-only static/search surface over BrainKnowledgeReadModel
no mutation
no DB write authority
proof boundaries visible
catalog breadth guard reused
```

### 2. Continuous Research Condensation

Current state:

```txt
source-to-decision gate exists
pattern intake runbook exists
some retained patterns exist
course/paper/practitioner intake is not continuous yet
```

Needed:

```txt
bounded research intake lane:
source -> mechanism -> KRN implication -> decision/rejection -> consumer -> falsifier
```

Every useful paper/course/practitioner rule must end as one of:

```txt
retained pattern
skill update
standard
ADR
eval/golden candidate
bounded repair
rejection
```

### 3. Enforcement Coverage

Current state:

```txt
some patterns are guarded
not every retained pattern has an eval/golden/usefulness proof
```

Needed:

```txt
for each high-value retained pattern:
  readback guard
  execution-surface hook
  at least one falsifier/eval/golden or smoke proof
```

### 4. Real UI/UX

Current state:

```txt
HTML preview exists
operator-grade web UX does not
```

Needed only after:

```txt
catalog contract remains stable
knowledge cards have enough breadth
search/readback is useful in at least 2-3 dogfoods
```

### 5. Product Proof

Still missing:

```txt
real second-operator proof
target repo proof beyond controlled substrates
workflow usefulness over repeated tasks
automatic skill/context selection quality
```

## Readiness Decision

```txt
Repo hygiene: strong
DB-backed replay: proven
evidence/review: strong
pattern readback: working
skill integration: working
Codex adapter integration: working
web UI/search: preview only
research condensation: partial
product readiness: no
```

## Next Highest-ROI Slice

V281 should not add another abstract pattern.

Next slice:

```txt
V281 Brain Knowledge Web Search Readiness Gate
```

Goal:

Decide and guard the smallest path from self-contained HTML preview to a
read-only web/search surface.

Rules:

- no dashboard product;
- no write authority;
- no Memory Core mutation;
- no API/MCP unless the gate proves a static surface is insufficient;
- preserve proof/non-proof fields;
- preserve catalog breadth;
- make it useful for searching retained patterns during work.

Why:

The fastest path toward the “Adam-style” knowledge view is not a full dashboard.
It is a guarded read-only search surface over existing brain cards.

## What Not To Build Next

- automatic research crawler;
- broad GraphRAG/SOTA claims;
- hidden semantic skill router;
- agent zoo;
- mutation-capable web UI;
- dashboard-first product;
- worker daemon;
- MCP server before read-only web/search contract is proven useful.

## Command Evidence

Commands already proved in V275-V279:

```txt
pnpm typecheck
pnpm test
pnpm db:ready
pnpm db:smoke:codex-adapter
GitHub KRN CI for V275, V276, V277, V278, V279
```

This re-gate is docs-only and relies on those immediately preceding proofs.

## What This Does Not Prove

- Product readiness.
- Search ranking quality.
- Automatic skill selection.
- Completeness of retained patterns.
- That the next UI will be useful without dogfood evidence.
