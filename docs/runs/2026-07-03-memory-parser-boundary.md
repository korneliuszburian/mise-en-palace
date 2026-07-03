# Memory Parser Boundary Proof

Date: 2026-07-03

Bead: `mise-en-palace-9qwr`

## Scope

Verify whether the audit finding about dynamic memory option assignment still
applies to `packages/cli/src/parseMemoryArgs.ts`.

## Result

No implementation change was needed.

Current parser code already uses `mapStringOptionAssignment` with typed setter
tables for memory candidate add, anti-memory add, promote, reject, and record
apply commands. The stale dynamic assignment shape was not present in active
code.

Negative grep:

```txt
rg "memoryCommand\\[|MemoryCandidateAddStringKey.*as| as Memory.*StringKey|dynamic memoryCommand" packages/cli/src/parseMemoryArgs.ts
```

returned no matches.

## Verification

```txt
pnpm --filter @krn/cli test -- parseMemoryArgs
```

## Proof Boundary

Proves:

- active memory parser string-option routing does not use dynamic
  `memoryCommand[key]` assignment;
- existing parser tests cover the memory command option surfaces.

Does not prove:

- every CLI parser is free of casts;
- memory command runtime behavior;
- memory governance quality;
- KRN product readiness.
