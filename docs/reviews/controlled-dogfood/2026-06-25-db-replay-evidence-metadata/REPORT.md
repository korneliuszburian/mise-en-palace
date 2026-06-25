# Current-Shell DB Replay For Evidence Metadata

Status: KRN-on-KRN DB replay proof.

Date: 2026-06-25

Evaluator: Codex using KRN plan/reporting discipline

DB available in current shell: yes.

## Executive Verdict

This slice proves the current shell can run the local Postgres brain store,
persist a KRN plan, persist evidence capture metadata, and read back the stored
evidence classification and candidate reviewability metadata from the live DB.

Brain usefulness verdict: positive for runtime truth and activation proof. This
does not prove product readiness, activation scoring quality, reflection
quality, or candidate quality at scale.

## Scope

Objective: prove current-shell DB replay for evidence capture metadata without
changing activation, reflection, schema, or promotion behavior.

Changed files:
- `PLAN.md`
- `GOAL.md`
- `docs/reviews/controlled-dogfood/2026-06-25-db-replay-evidence-metadata/REPORT.md`

Non-goals preserved:
- no schema migration;
- no activation scoring change;
- no memory scoring change;
- no reflection extraction change;
- no candidate promotion;
- no dashboard, worker runtime, API/MCP server, broad eval platform,
  `krn audit`, or anti-slop scanner.

## Runtime Setup

Local Postgres was started with the existing repo runbook:

```sh
docker compose up -d krn-postgres
```

`pnpm db:ready` passed in the current shell with Postgres reachable, 13/13
migrations applied, and pgvector available.

## KRN Plan Output Summary

Command:

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn plan \
  --task "Prove current-shell DB replay for evidence capture metadata without changing activation, reflection, schema, or promotion behavior" \
  --persist
```

Result:
- persistence: enabled;
- executionRun: `79252723-50ed-484a-a7c6-513366130db5`;
- selected context: 6;
- excluded context: 4;
- context status: assembled;
- expected evidence: `pnpm typecheck`, `pnpm test`, `git diff --check`.

Usefulness: positive. Unlike the prior no-store preview dogfoods, this run used
DB-backed activation and selected persisted source/memory context. Not every
selected item was directly useful, but the run proves current-shell persisted
planning and context assembly are working.

## Persisted Evidence Replay

Evidence capture command:

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn evidence capture \
  --run-id 79252723-50ed-484a-a7c6-513366130db5 \
  --persist \
  --intended-file PLAN.md \
  --intended-file GOAL.md \
  --intended-file docs/reviews/controlled-dogfood/2026-06-25-db-replay-evidence-metadata/REPORT.md \
  --verification "pnpm db:ready=passed" \
  --verification "pnpm --filter @krn/db db:check=passed"
```

Persisted IDs:
- evidenceBundle: `a781548b-721f-4b76-81e6-f0cfd64fa94b`
- reviewAssessment: `68bb9b44-76e8-407e-afd3-2613b4bf799f`
- feedbackDelta: `c4b9c030-b771-4fb6-8697-0194ec2304f9`

Readback query:

```sh
psql postgres://krn:krn@localhost:54329/krn -Atc "<metadata readback query>"
```

Readback result:
- changed file classification: 3 intended, 0 unrelated, 0 unknown;
- command provenance: 7 `operator_reported` / `passed` commands, each with
  `doesNotProve`;
- feedback candidate reviewability: `too_vague` with reason
  `Candidate does not name a concrete future use.`;
- feedback metadata: `memoryCandidateRowCount: 0`;
- MemoryRecord mutation: none expected from evidence/observe/reflect output.

Run replay counts:

```json
{
  "executionRunId": "79252723-50ed-484a-a7c6-513366130db5",
  "evidenceBundles": 1,
  "reviewAssessments": 1,
  "feedbackDeltas": 1,
  "observationGroups": 1,
  "observationItems": 5,
  "reflectionRecords": 1,
  "memoryCandidatesForRun": 0
}
```

## Dogfood Brain Usefulness Section

### Brain Usefulness Summary

Brain ROI:
- positive

Overall verdict:
- Current-shell DB replay removed the biggest recent caveat from dogfood runs:
  DB truth was not available. This run proves the local brain store can persist
  and replay the evidence metadata needed by the latest evidence/review slices.

What this run proves:
- The local Postgres brain store can be started from the existing runbook.
- `pnpm db:ready` passes in the current shell.
- `krn plan --persist` creates a persisted execution run.
- `krn evidence capture --persist` can persist evidence metadata for that run.
- Persisted evidence metadata can be read back from live DB tables.

What this run does not prove:
- It does not prove activation scoring quality.
- It does not prove reflection extraction quality.
- It does not prove candidate quality at scale.
- It does not prove product readiness.
- It does not prove CI or remote DB state.

DB used in current shell:
- yes

### Activated Context Usefulness

| Item | Type | Why selected | Used? | Helped? | Missing/Stale/Noise? | Evidence | Follow-up |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Source claim `58e28e58-d4c8-4196-861e-cb14caeb08e1` | source | Weak default evidence must not be treated as proof. | yes | helped | none | Persisted KRN plan output. | keep |
| Memory `f950b8b4-5392-4084-9f98-93881fbe961a` | memory | MemoryReviewGate seals Memory Core write authority. | yes | neutral | none | Persisted KRN plan output. | keep |
| Source claim `302f88f7-71b0-4a86-8521-330dee4713fe` | source | Reflection persistence is not reflection quality. | yes | helped | none | Persisted KRN plan output. | keep |
| Other selected source claims | source | Related governance/source graph concerns. | unclear | neutral | possible noise | Persisted KRN plan output. | gather more evidence |

### Missing Context

| Missing item | Expected source | Why it mattered | Evidence | Repair implication |
| --- | --- | --- | --- | --- |
| Local brain-store runbook | SourceClaim or raw file | It directly explains how to start the DB runtime. | Manual read of `docs/runbooks/local-brain-store.md`. | source quality |
| Candidate reviewability dogfood report | SourceClaim or memory | It motivated the DB replay proof. | Manual read of prior dogfood report. | memory guidance |

### Memory Usefulness

| Memory/Candidate | Selected? | Used? | Outcome | Evidence provenance | Reviewability | Follow-up |
| --- | --- | --- | --- | --- | --- | --- |
| Memory Core write-authority memory | yes | yes | neutral | DB-backed activation | ready | keep |

### Source Grounding Usefulness

| Source/Claim | Supported decision? | Prevented overclaim? | Decorative/noise? | Missing conflict? | Evidence | Follow-up |
| --- | --- | --- | --- | --- | --- | --- |
| Weak command evidence claim | yes | yes | no | no | KRN plan inclusion and evidence capture command provenance. | keep |
| Reflection quality caveat claim | yes | yes | no | no | KRN plan inclusion and non-goal boundary. | keep |
| Local brain-store runbook | yes | yes | no | no | `docker compose up -d krn-postgres`, `pnpm db:ready`. | consider SourceClaim if reused |

### Evidence And Review Burden

| Evidence item | Strength | What it proves | What it does not prove | Review burden impact |
| --- | --- | --- | --- | --- |
| `docker compose up -d krn-postgres` | strong | Existing local pgvector Postgres runtime can start. | Does not prove migrations. | reduced |
| `pnpm db:ready` | strong | Current-shell DB reachability, 13/13 migrations, pgvector. | Does not prove product behavior. | reduced |
| `krn plan --persist` | strong | Persisted run and DB-backed activation work. | Does not prove activation quality. | reduced |
| `krn evidence capture --persist` | strong | Evidence metadata persists for the run. | Does not prove final product readiness. | reduced |
| DB readback query | strong | Stored JSONB metadata can be read back. | Does not prove API/CLI read UX. | reduced |
| `krn observe --run ... --persist` | strong | Observation group/items persist for this run. | Does not prove memory usefulness. | reduced |
| `krn reflect --scope run:... --persist` | strong | Reflection record persists with zero candidate rows and no MemoryRecord creation. | Does not prove reflection quality. | reduced |

### Observation And Reflection Usefulness

| Observation/Reflection | Output | Useful? | Evidence refs | Follow-up |
| --- | --- | --- | --- | --- |
| Observation | not run | correctly empty | This DB replay proof did not need observation mutation. | no action |
| Reflection | not run | correctly empty | Reflection quality was an explicit non-goal. | no action |

### Candidate Quality

| Candidate | Type | Evidence refs | Reviewability | Decision | Follow-up |
| --- | --- | --- | --- | --- | --- |
| DB replay should be required before judging activation scoring. | MemoryCandidate | This report, DB ready output, persisted plan output. | ready | review | Use when deciding whether to repair activation. |
| Do not treat no-store planning abstention as activation scoring failure. | AntiMemoryCandidate | Prior dogfood reports plus this DB-backed run. | ready | review | Keep as candidate until another DB-backed run confirms. |

### Brain ROI

| Dimension | Verdict | Evidence |
| --- | --- | --- |
| Context waste | lower | DB-backed plan selected relevant evidence/source caveats. |
| Review burden | lower | DB replay removes manual caveat around persisted metadata. |
| Resume quality | better | Persisted run/evidence IDs provide concrete anchors. |
| Decision grounding | better | Activation scoring repair remains deferred until DB-backed evidence accumulates. |
| Memory usefulness | mixed | One MemoryRecord was selected; it reinforced non-mutation boundaries. |
| Operator friction | lower | The previous DB timeout was resolved with existing runbook steps. |

Brain ROI verdict:
- positive

### Command Evidence

| Command | Result | Proof strength | What it proves | What it does not prove |
| --- | --- | --- | --- | --- |
| `git fetch --prune` | passed | strong | Remote refs refreshed. | Does not prove CI. |
| `git status --short --branch` | clean before edits | strong | Started from clean worktree. | Does not prove final push. |
| `docker compose up -d krn-postgres` | passed | strong | Existing DB service can start. | Does not prove migrations. |
| `pnpm db:ready` | passed | strong | Current-shell DB ready, migrations applied, pgvector available. | Does not prove product readiness. |
| `pnpm --filter @krn/db db:check` | passed | strong | Drizzle schema/migration files are consistent. | Does not prove live data semantics. |
| `krn plan --persist` | passed | strong | Persisted KRN plan/run and activation assembly work. | Does not prove activation quality. |
| `krn evidence capture --persist` | passed | strong | Evidence metadata persisted for the run. | Does not prove product readiness. |
| `psql ... metadata readback` | passed | strong | Persisted evidence classification and candidate reviewability metadata can be read back. | Does not prove a polished operator read UI. |
| `krn observe --run ... --persist` | passed | strong | Observation persistence works for this run. | Does not prove memory usefulness. |
| `krn reflect --scope run:... --persist` | passed | strong | Reflection record persists with no MemoryRecord creation. | Does not prove useful extraction. |

## Next Recommended Action

Run one more DB-backed KRN-on-KRN source repair before changing activation
scoring. If DB-backed activation continues to miss obvious context, then open a
bounded activation relevance repair.
