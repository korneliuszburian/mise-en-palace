# IMR-46 Second Repo Source Artifact Readback

Status: complete bounded multi-repo readback.

Issue: `mise-en-palace-wl5`.

## Executive Verdict

The existing KRN source artifact readback path works on a second internal repo
without modifying that target repo.

Target: `/home/krn/coding/krn/active/krn-ekologus/README.md`.

Result: `krn source artifact preview --persist --json` wrote the target README
as SourceArtifact, two SourceChunks, and one SearchDocument into the KRN brain
store. Source search by generated marker and by natural query both returned
`answerUsefulness: useful`, one included SearchDocument, and `missingEvidence:
[]`. Brain search also selected source-backed ingest/source-artifact knowledge.
Heartbeat over the persisted JSON emitted no acquisition candidate.

## Target Boundary

```txt
mode: observation-only
target_repo: /home/krn/coding/krn/active/krn-ekologus
target_file: README.md
target_dirty_before: yes
target_status_freshness: fresh_current_task
target_patch_lifecycle: none
allowed_writes: KRN Postgres brain store, KRN report/plan/beads state
forbidden_writes: target repo files, target commits, target pushes, target reset/clean
handoff_artifact: this report
```

Target status before and after:

```txt
## v1.3d28-polish-marketing-language-pack...origin/v1.3d28-polish-marketing-language-pack
?? GOAL.md
```

The target dirty file was external operator context. This slice did not create,
modify, stage, commit, push, reset, or clean target files.

## Source To Decision

- Source: IMR-45 proved source artifact persisted readback inside
  `mise-en-palace`; IMR-00 requires one shared KRN brain across multiple real
  repos.
- Mechanism: `krn source artifact preview --persist --json` can ingest a local
  file path into KRN SourceArtifact, SourceChunk, and SearchDocument rows without
  target repo writes.
- KRN implication: the shared brain can start accumulating multi-repo evidence
  through the existing bounded ingest/readback path before crawler, API/MCP,
  worker daemon, or broad ingestion work.
- Decision: adopt the second-repo persisted readback as proof that the bounded
  path works across repo boundaries in observation-only mode.
- Rejection: do not call this product readiness, source truth, crawler
  readiness, ranking quality, or Memory Core mutation.
- Consumer: multi-repo internal operator loop and future multi-repo Brain-QA.
- Falsifier: a second repo file cannot be persisted/read back, target dirty
  state changes, or natural source/brain search cannot find the persisted
  SearchDocument.

## Readback Result

| Readback | Result | Evidence |
|---|---|---|
| Source artifact persist | resolved | SourceArtifact `1131f5bd-9b0a-4e2f-9820-5392974c0b17`, SourceChunks `27086e91-657c-497e-a5dc-f66d34e393f1`, `9a6fdb88-227f-4c36-9a46-0c68746c37e4`, SearchDocument `6008c660-7e4e-4727-8d51-784fd8315639`. |
| Marker source search | resolved | Query `krn-source-artifact-preview 10c59894a0bbc546`; `answerUsefulness: useful`, `supportingDocuments: 1`, `missingEvidence: []`. |
| Natural source search | resolved | Query `EKOLOGUS Brain quality gate`; included SearchDocument `6008c660-7e4e-4727-8d51-784fd8315639`; `missingEvidence: []`. |
| Marker brain search | useful | Store-only brain search selected source-backed ingest/source-artifact knowledge and sourceSearch evidence. |
| Natural brain search | useful | `selectedKnowledge: 4`, sourceSearch `supportingDocuments: 1`, activationUtility `selected_knowledge: useful`. |
| Heartbeat over persisted JSON | resolved | `knowledgeAcquisition: 0`; no missing readback candidate emitted. |

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `rtk git -C /home/krn/coding/krn/active/krn-ekologus status --short --branch` | passed | Target dirty state was captured before and after. | Does not prove target correctness. |
| `rtk pnpm db:ready` | passed | Current KRN DB is reachable with migrations applied and pgvector available. | Does not prove source truth or product readiness. |
| `rtk env KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --silent --filter @krn/cli krn source artifact preview --file /home/krn/coding/krn/active/krn-ekologus/README.md --chunk-lines 20 --limit-chunks 2 --persist --json` | passed | A second repo file can be persisted into KRN SourceArtifact/SourceChunk/SearchDocument rows. | Does not prove crawler readiness, broad ingest, source truth, or Memory Core mutation. |
| `rtk env KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --silent --filter @krn/cli krn source search --query "krn-source-artifact-preview 10c59894a0bbc546" --limit 10 --max-inclusions 5 --json` | passed | Marker source search can find the persisted target SearchDocument with no missing evidence. | Does not prove ranking quality beyond this marker. |
| `rtk env KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --silent --filter @krn/cli krn source search --query "EKOLOGUS Brain quality gate" --limit 10 --max-inclusions 5 --json` | passed | Natural source search can find the persisted target SearchDocument. | Does not prove robust semantic retrieval across repos. |
| `rtk env KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --silent --filter @krn/cli krn brain search --query "EKOLOGUS Brain quality gate" --store-only --limit 10 --max-inclusions 5 --json` | passed | Brain search composes source-backed selected knowledge and target SearchDocument evidence. | Does not prove product readiness. |
| `rtk env KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --silent --filter @krn/cli krn heartbeat preview --candidate-kind knowledge_acquisition --acquisition-readback-file /tmp/krn-imr46-ekologus-readme-artifact.json --max-candidates 1 --json` | passed | Persisted JSON does not emit a missing-evidence acquisition candidate. | Does not prove autonomous heartbeat/dreaming runtime. |

## Brain Usefulness

| Area | Verdict | Evidence |
|---|---|---|
| Multi-repo brain | helped | A non-KRN repo README is now queryable through the KRN brain store. |
| Ingest v0/v1 | helped | Artifact/chunk/SearchDocument readback worked without target writes. |
| Source/brain search | helped | Both marker and natural queries included the target SearchDocument. |
| Target safety | helped | Target status before/after is unchanged; writes stayed in KRN. |

## Next Action

Run a compact multi-repo Brain-QA batch that asks at least one KRN question and
one `krn-ekologus` question against the shared brain. Classify recall,
precision, context waste, and whether source-backed selected knowledge helps
without opening crawler, ranking, API/MCP, worker, schema, or target-repo repair
work.
