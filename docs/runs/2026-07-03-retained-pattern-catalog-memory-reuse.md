# Retained Pattern Catalog + Store-Backed Memory Reuse

Date: 2026-07-03

Bead: `mise-en-palace-n4i7`

## Objective

Prove whether a next KRN planning task can use both:

- the store-backed MemoryRecord created from the Shared Brain Vertical reuse
  slice; and
- retained-pattern catalog selection for the related TypeScript/code-quality
  task.

This is a dogfood proof. It does not add runtime machinery.

## Runtime Readback

Command:

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn \
pnpm --filter @krn/cli krn plan \
  --task "Apply the remembered CLI review help pattern and retained unknown-first TypeScript parser boundary to choose the next small KRN code-quality repair; prove whether store-backed memory and retained-pattern catalog selection cooperate before implementation; no dashboard API MCP worker runtime broad ranking rewrite or docs ledger expansion" \
  --persist
```

Persisted IDs:

- operatorIntent: `38030d0d-d798-4323-975b-4ae2a0c02618`
- taskContract: `6c03df24-2a6b-440c-b228-3e52fe0b1106`
- harnessPlan: `83fa5a88-005f-4ce2-832b-50f0b1d4a276`
- contextAssembly: `8ba5976a-5ec5-402b-ad43-0d4ba50df3ad`
- executionRun: `e98c2ec2-941a-4e68-8243-e491f952827f`

The plan selected the retained-pattern catalog readback:

- query: `unknown first typescript`
- pattern: `ts-boundary-brain-knowledge-parser-exemplar`
- pattern: `ts-boundary-unknown-first-result-state`

The same plan included the store-backed memory:

- memoryRecord: `3b3b3ea5-3145-4bba-b762-1061921cffbd`
- expected use: add explicit CLI help variants and test successful help output
  only when a task actually touches CLI help behavior.

Memory application recorded:

- memoryApplication: `df299af2-9bd3-4136-ba63-5246c341c7ab`
- outcome: `helped`

## Result

The prior gap is closed for this bounded path: a persisted next-task plan can
surface both the promoted store-backed memory and the retained-pattern catalog
selection.

No code change was needed. The existing compact mechanism retry selected the
retained TypeScript patterns, and the earlier project-lineage fix let the same
plan include the promoted MemoryRecord.

## Evidence

- plan output: `.local-lab/n4i7/plan.txt`
- run-show JSON: `.local-lab/n4i7/run-show.json`
- memory application output: `.local-lab/n4i7/memory-application.txt`
- evidenceBundle: `797f266b-8fa7-4f64-a329-3bb6c95392c3`
- reviewAssessment: `b0710d02-71ee-4d44-b4f3-baf4e6e5f529`
- feedbackDelta: `cbf0f97a-0a58-4513-9efc-c4d1170feebe`

## Proof Boundary

Proves:

- one persisted next-task plan can include store-backed memory and retained
  pattern catalog selection together;
- run-show JSON preserves the retained-pattern selection readback;
- MemoryRecord application can record the outcome as helped.

Does not prove:

- semantic ranking quality;
- retained-pattern catalog completeness;
- automatic memory recall for unrelated tasks;
- implementation correctness of any future code-quality repair;
- product readiness.

## Rollback Risk

Low. This slice records evidence and closes a Beads gap; it does not change
runtime code or database schema.
