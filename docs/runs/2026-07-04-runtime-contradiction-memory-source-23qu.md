# Runtime Contradiction Memory Source Proof

Bead: `mise-en-palace-23qu`

## Change

`eval:memory-advantage` now includes
`runtime-memory-source-contradiction-review-context`, a held-out forgetting
case where an active-looking memory carries runtime contradiction metadata
against an accepted SourceClaim.

The case intentionally omits `excludedMemoryCards` and `excludedSourceClaims`.
The simple lexical baseline selects the conflicting memory first. KRN excludes
that memory from selection and reports the contradiction reason from the memory
card's explicit runtime metadata.

## Proof

Local verification:

```sh
pnpm --filter @krn/cli test -- memoryAdvantageEval
pnpm eval:memory-advantage
```

The eval output shows:

- `negativeClass: runtime_memory_source_contradiction`;
- simple retrieval top id:
  `pattern:paste-secrets-from-old-memory-runtime-conflict`;
- KRN selected source id: `source:runtime-secret-context-denylist`;
- KRN excluded memory id:
  `memory:pattern:paste-secrets-from-old-memory-runtime-conflict`;
- exclusion reason:
  `contradicts_source_claim source:runtime-secret-context-denylist: accepted source evidence forbids sending secret-bearing file bodies to review context`;
- raw fixture assertion: no `excludedMemoryCards` or `excludedSourceClaims` keys
  on the case.
- second-opinion-claude verdict:
  `approve`, `LOW`, no findings.

## Non-Proof

This does not prove arbitrary contradiction discovery. The contradiction is
explicit runtime metadata in the deterministic fixture. It does not prove
production ranking quality, source truth, DB runtime behavior, worker
execution, or arbitrary Codex output quality.
