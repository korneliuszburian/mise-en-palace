# Automatic Memory Recall Brain Loop

Bead: `mise-en-palace-a1r4`

## Change

`db:smoke:brain-loop` now proves a second planning activation after
MemoryReviewGate promotion and memory application. The smoke creates a second
TaskContract through `compileHarnessPlan`, then verifies the promoted
MemoryRecord is automatically included in the next context assembly and has a
matching included activation decision.

## Proof

Commands:

```sh
rtk pnpm -C packages/db typecheck
rtk pnpm -C packages/cli typecheck
rtk pnpm db:smoke:brain-loop
```

Observed DB smoke readback:

```txt
Next-run memory inclusions: 1
Next-run included memory decisions: 1
Cleanup remaining marker count: 0
Brain loop smoke: passed
```

## Non-Proof

This proves one DB-backed next-planning recall path for a reviewed MemoryRecord.
It does not prove ranking quality, autonomous reflection quality, product
readiness, worker runtime behavior, or multi-repo memory usefulness.
