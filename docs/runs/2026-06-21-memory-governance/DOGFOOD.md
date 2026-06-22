# Dogfood

Slice: M23.11 - Dogfood memory governance.

Runtime:

- Database: `postgres://krn:krn@localhost:54329/krn`
- Execution run: `291bc2c4-7b02-46e7-9b7c-3980fadb9b34`
- Source claim: `212815bc-477c-4985-8992-31825f5c5897`

Created records:

- MemoryCandidate: `221e9838-0cad-42be-b1ec-d8484a8dd14a`
- MemoryRecord: `7dda35fd-b89d-4bd4-94bd-7937022d99e7`
- MemoryRecordVersion: `5394b391-5e9c-411b-8acd-996cea7c04a9`
- MemoryApplication: `8fb759f3-a49d-4999-ad4f-5be1ef8b3481`
- AntiMemoryRecord: `7cb45aea-756a-4e70-a855-cf766c41cf22`
- EvidenceBundle: `7c0b5701-2f08-495e-992c-3c7eb5e71733`
- ReviewAssessment: `e698b9b5-b403-48ca-8ea0-ca9e8ca5b5c7`
- FeedbackDelta: `0bf53a6b-f383-49f0-a87d-648679b47086`

Source to decision mapping:

```yaml
source_id: 212815bc-477c-4985-8992-31825f5c5897
title: M22 source graph Postgres edge decision
url: local DB source_claims
trust_tier: project-decision
mechanism: KRN uses Postgres as canonical harness state, so source decisions can be linked transactionally to harness runs and feedback artifacts.
krn_implication: Model source graph decisions with Postgres-backed relational edges before adding a separate graph database or crawler.
decision: adopt as reviewed MemoryRecord
does_not_prove: Retrieval quality, ranking quality, or long-term graph traversal performance.
consumer: MemoryRecord 7dda35fd-b89d-4bd4-94bd-7937022d99e7
falsifier: Revisit when measured source graph traversal or review workloads exceed Postgres edge-table performance.
```

What was proven:

- A live persisted run can create a source-grounded MemoryCandidate.
- A human review command can promote that candidate into a MemoryRecord and
  MemoryRecordVersion.
- A MemoryApplication can record actual use of the promoted MemoryRecord.
- Anti-memory can reject markdown runtime memory without creating a positive
  MemoryRecord.
- Evidence capture can persist evidence, review assessment, and feedback delta
  for the same run without mutating Memory Core.
- `pnpm db:smoke:memory-governance` still passes and cleans marker rows to
  zero after durable dogfood records exist.
- `krn doctor` reports memory governance readiness as ready once durable
  MemoryCandidate, MemoryRecord, MemoryApplication, and AntiMemory records
  exist.

What was not proven:

- Retrieval quality or ranking quality.
- Long-term graph traversal performance.
- Automatic memory activation into future context assemblies.
- Full anti-rot across all smoke/readiness commands; that is Slice 12.
- That markdown can become runtime memory; the dogfood explicitly rejects that.
