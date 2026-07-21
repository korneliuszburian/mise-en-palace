---
name: krn-knowledge-admission
description: Admit reviewed specialist knowledge into KRN and close its first ordinary-use loop. Use for external corpora or source-backed decisions that must become bounded DecisionPacket authority; skip raw research analysis and ordinary memory feedback.
---

# KRN Knowledge Admission

Turn reviewed specialist decisions into one inspectable authority path. Raw
material remains external evidence; only reviewed decisions may govern.

## Process

1. **Set the authority boundary.** Name the target repository, recurring task,
   source owner, consumer, and one observable falsifier. Use
   `$source-to-decision` first when the external material has not yet been
   converted into reviewed decisions.

   Done when each proposed decision has a source reference, mechanism, KRN
   implication, disposition, consumer, falsifier, and non-proof.

2. **Capture evidence without promoting it.** Keep the corpus outside the
   repository and persist its content-addressed evidence into the connected
   project:

   ```bash
   pnpm --filter @krn/cli krn source artifact preview \
     --file <external-source> --repo <target-repo> \
     --all-chunks --source-authority <authority> --persist --json
   ```

   Use the returned `krn-source://sha256/<digest>` references in the reviewed
   corpus. Captured chunks are evidence, not governing truth.

   Done when every `current` decision names captured project-scoped evidence;
   stale, rejected, missing, and unsupported evidence remain explicit.

3. **Preview, then persist the minimal corpus.** The corpus contains only
   `version`, `corpusName`, optional coverage, and reviewed decisions with
   title, statement, lifecycle, task scopes or concerns, evidence reference,
   falsifier, non-proof, and operator note.

   ```bash
   pnpm --filter @krn/cli krn source decision import \
     --file <reviewed-corpus.json> --repo <target-repo> --json

   pnpm --filter @krn/cli krn source decision import \
     --file <reviewed-corpus.json> --repo <target-repo> --persist --json
   ```

   Treat an exact active-statement collision as a review decision: replay the
   same corpus, reject the newcomer, or explicitly name every active
   predecessor in `supersedesSourceClaimIds`. Never silently duplicate or
   auto-merge authority.

   Done when persistence returns one import identity and safe retry returns the
   same authority graph.

4. **Reconcile and observe selection.** Use the persisted project ID and a real
   ordinary task:

   ```bash
   pnpm --filter @krn/cli krn source decision reconcile \
     --project <project-id> --json

   pnpm --filter @krn/cli krn plan \
     --repo <target-repo> --task "<ordinary task>" --persist --json

   pnpm --filter @krn/cli krn codex brief --run-id <run-id>
   ```

   Inspect whether the packet selects the intended decision, excludes the
   superseded or rejected path, or abstains for a named evidence gap.

   Done when the packet checksum, selected authority, negative paths, and
   abstention state are observable. Mere retrieval is not success.

5. **Close the first use.** After Codex work and repository verification,
   record the actual result through the current packet-bound
   `krn evidence capture` return channel. Load `$krn-memory-core` for source
   usefulness semantics when a selected decision materially shaped the work.

   Done when the exact packet has an honest helped, neutral, hurt, stale, noise,
   or unmeasured outcome; feedback remains non-authoritative until reviewed.

## Output

- external content-addressed evidence;
- one minimal reviewed corpus and import identity;
- reconciliation receipt;
- one issued packet with an observable selection, exclusion, or abstention;
- packet-bound outcome or one bounded reason it was not measurable.

## Stop Condition

Stop when one reviewed decision reaches its intended packet consumer and its
first use is recorded without creating duplicate authority. Do not continue
bulk ingestion merely because more source material exists.

## Forbidden

- Do not copy raw courses or research archives into the repository.
- Do not make captured chunks, similarity results, or model extraction govern.
- Do not create a domain database, runner, MCP tool, renderer, or autonomous
  promotion path for a new corpus.
