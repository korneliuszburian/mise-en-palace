# IMR-03 Brain Knowledge Vocabulary Migration

Status: complete source slice.

## Verdict

KRN now exposes the preferred readback surface as:

```txt
krn brain knowledge
```

The old command remains available as a compatibility alias:

```txt
krn knowledge cards
```

This is a language and operator-surface repair, not a new brain subsystem. The
goal is to make the product model accurate: brain knowledge is a readback of
the KRN brain substrate, while card/catalog files remain bootstrap, preview,
seed, compatibility, and audit surfaces.

## Source To Decision

Source: current IMR-00 direction, `docs/KRN_KERNEL.md`, IMR-02 store-only
readback, active skill instructions, and current CLI/operator copy.

Mechanism: agents and operators route behavior through the names they see in
help text, skills, runbooks, scripts, and reports. If the primary surface is
called "knowledge cards", it encourages a false product model where cards are a
separate artifact layer instead of a read-only projection of brain knowledge.

KRN implication: the preferred command, help text, skills, runbooks, and preview
copy should say "brain knowledge"; compatibility aliases can remain where
renaming would create avoidable breakage.

Decision: add `krn brain knowledge` as the preferred CLI surface and keep
`krn knowledge cards` as a documented legacy alias. Update current skills,
runbooks, CLI docs, package script, and tests to prefer brain-knowledge
language.

Consumer: source-to-decision skill, TypeScript boundary skill, Codex adapter
skill, pattern intake workflow, brain search, and future pattern/research brain
slices.

Falsifier: a future operator-facing prompt, help screen, skill, or runbook still
teaches agents to treat "knowledge cards" as the primary brain surface instead
of as a legacy/compatibility readback.

Does not prove: store-backed pattern ontology, semantic ranking quality,
automatic pattern application, Memory Core mutation, full vocabulary migration
for historical reports, or product readiness.

## Changed

- preferred `krn brain knowledge` route added;
- root CLI help and `brain --help` now list `krn brain knowledge`;
- `krn knowledge cards` is explicitly labeled as a legacy alias;
- text/HTML output now says `KRN Brain Knowledge Readback`;
- active skills and runbooks now query `krn brain knowledge`;
- package preview script uses the preferred command;
- focused CLI/harness tests now guard the preferred surface and legacy alias.

No DB schema, Memory Core, source crawler, API, MCP, dashboard, or worker runtime
changes.

## Verification

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm --filter @krn/cli test -- runCli runKnowledgeCardsCommand parseKnowledgeArgs parseBrainArgs runBrainSearchCommand` | passed | CLI parser, help, preferred alias, legacy alias, and readback copy match tests | product readiness or semantic ranking |
| `pnpm --filter @krn/harness test -- skillInvariants brainKnowledgeReadModel brainKnowledgeReadModelInvariants` | passed | active skill/read-model invariants now point at the preferred brain-knowledge language | full repo behavior |
| `krn brain knowledge --catalog-file docs/brain-knowledge/catalog.json --text source-to-decision --limit 1 --json` | passed | preferred command can read the current catalog and emit read-only brain knowledge JSON | live DB truth, ranking quality, Memory Core mutation |

## Readback Caveat

The live `source-to-decision` query returned a matching hook pattern first
because source refs and retained text include source-to-decision material. That
is acceptable for this slice: it proves the preferred command works, not that
ranking is solved. Ranking remains a separate product problem.

## Remaining Gap

The internal TypeScript names and JSON compatibility fields still contain
`KnowledgeCards` / `knowledgeCards`. Those names are retained deliberately for
compatibility. A future bounded API migration can rename them only with an
explicit compatibility plan and proof boundary.
