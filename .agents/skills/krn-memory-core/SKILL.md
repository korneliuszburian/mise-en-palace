---
name: krn-memory-core
description: Apply KRN Memory Core invariants when changes affect DecisionPacket selection, source or memory authority, persisted feedback, Codex rendering, or KRN activation and target-evidence read models. Use beside the global workflow owner; skip generic engineering procedure.
---

# KRN Memory Core

This is KRN domain knowledge, not another maker, reviewer, or diagnosis
workflow. Let the applicable global skill own the process; use this companion
to keep the product model true.

## Select The Branch

| Changed domain surface | Load |
|---|---|
| selection, ranking, temporal/trust filters, exclusions, abstention | [activation.md](references/activation.md) |
| persisted lifecycle, lineage, migrations, JSON boundaries, outbox | [store-boundary.md](references/store-boundary.md) |
| `DecisionPacket` or Codex brief rendering | [codex-adapter.md](references/codex-adapter.md) |
| evidence provenance, observe/reflect ordering, feedback candidates | [evidence-feedback.md](references/evidence-feedback.md) |
| source or knowledge retention, rejection, trust, promotion | [source-knowledge-authority.md](references/source-knowledge-authority.md) |
| measuring whether retained source material helped | [source-usefulness.md](references/source-usefulness.md) |
| explicit target owner files or missing read-model evidence | [owner-file-read-model.md](references/owner-file-read-model.md) |
| target work becoming KRN evidence, lifecycle, or second-operator proof | [target-trial-evidence.md](references/target-trial-evidence.md) |

Load more than one reference only when the same vertical slice crosses those
authority surfaces.

## Domain Gate

Before the global workflow edits or decides, name:

```text
Consumer:
Authority owner:
Changed Memory Core invariant:
Caller -> public seam -> observable result:
Falsifier:
Does not prove:
```

Keep selected, stale, rejected, unsupported, and missing states distinct. A
new record, source, test, reviewer claim, or feedback row remains a candidate
until its owning policy promotes it.

## Output

- branch and reference used;
- consumer and authority owner;
- changed domain invariant and public seam;
- behavior of stale, rejected, unsupported, or missing evidence;
- focused proof and explicit non-proof.

## Stop Condition

Stop when the named consumer observes the intended Memory Core behavior, the
authority boundary remains singular, the relevant negative state is preserved,
and proof can falsify the changed invariant without treating more context as
success by itself.

## Hard Boundaries

- Runtime memory stays store-backed; Markdown is not the brain.
- Raw evidence, sources, tests, and reviewer output are not promoted truth.
- A `DecisionPacket` is bounded task guidance, not a prompt or notes dump.
- Missing owner-file data is incompleteness, not proof that the file is absent.
- Codex executes; KRN owns governed selection, evidence, and feedback.
