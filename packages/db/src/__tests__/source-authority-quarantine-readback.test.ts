import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

import postgres from "postgres";
import { describe, expect, it } from "vitest";

import { migrateDatabase } from "../migration-readiness.js";
import { listSourceAuthorityQuarantines } from "../source-authority-quarantine-readback.js";

const databaseUrl = process.env.KRN_DATABASE_URL?.trim();
const migrationsFolder = fileURLToPath(new URL("../migrations", import.meta.url));

const databaseUrlFor = (input: string, databaseName: string): string => {
  const parsed = new URL(input);
  parsed.pathname = `/${databaseName}`;
  return parsed.toString();
};

const createDisposableDatabase = async (input: string) => {
  const databaseName = `krn_quarantine_readback_${crypto.randomUUID().replaceAll("-", "")}`;
  const admin = postgres(databaseUrlFor(input, "postgres"), { max: 1, onnotice: () => undefined });
  await admin.unsafe(`create database ${databaseName}`);

  return {
    databaseUrl: databaseUrlFor(input, databaseName),
    async cleanup() {
      try {
        await admin.unsafe(`drop database if exists ${databaseName} with (force)`);
      } finally {
        await admin.end();
      }
    }
  };
};

describe("source authority quarantine readback", () => {
  it.skipIf(databaseUrl === undefined || databaseUrl.length === 0)(
    "paginates project-scoped governing and resolved quarantine rows without writing",
    async () => {
      const disposable = await createDisposableDatabase(databaseUrl!);
      const client = postgres(disposable.databaseUrl, { max: 1, onnotice: () => undefined });

      try {
        await migrateDatabase({ databaseUrl: disposable.databaseUrl, migrationsFolder });
        const [workspace] = await client<{ id: string }[]>`
          insert into workspaces (slug, display_name) values ('quarantine-readback', 'Quarantine readback') returning id
        `;
        const [project] = await client<{ id: string }[]>`
          insert into projects (workspace_id, slug, display_name)
          values (${workspace!.id}, 'quarantine-readback', 'Quarantine readback') returning id
        `;
        const [otherProject] = await client<{ id: string }[]>`
          insert into projects (workspace_id, slug, display_name)
          values (${workspace!.id}, 'quarantine-readback-other', 'Quarantine readback other') returning id
        `;
        const [artifact] = await client<{ id: string }[]>`
          insert into source_artifacts (project_id, kind, trust_tier, uri, title, content_hash)
          values (${project!.id}, 'doc', 'project-decision', 'quarantine://artifact', 'artifact', 'sha256:artifact') returning id
        `;
        const [otherArtifact] = await client<{ id: string }[]>`
          insert into source_artifacts (project_id, kind, trust_tier, uri, title, content_hash)
          values (${otherProject!.id}, 'doc', 'project-decision', 'quarantine://other', 'other', 'sha256:other') returning id
        `;
        const [claim] = await client<{ id: string }[]>`
          insert into source_claims (
            source_artifact_id, claim, mechanism, krn_implication, does_not_prove,
            trust_tier, support_type, consumer, status
          ) values (
            ${artifact!.id}, 'claim', 'mechanism', 'implication', 'non-proof',
            'project-decision', 'implementation-boundary', 'quarantine test', 'accepted'
          ) returning id
        `;
        const [decision] = await client<{ id: string }[]>`
          insert into source_decisions (project_id, source_claim_id, status, decision, rationale, falsifier, consumer)
          values (${project!.id}, ${claim!.id}, 'adopt', 'decision', 'rationale', 'falsifier', 'quarantine test') returning id
        `;
        const [edge] = await client<{ id: string }[]>`
          insert into source_decision_edges (
            source_claim_id, source_decision_id, target_type, target_id, support_type, confidence, notes
          ) values (
            ${claim!.id}, ${decision!.id}, 'architecture_decision', 'quarantine-target',
            'implementation-boundary', 'high', 'quarantine test'
          ) returning id
        `;
        await client`
          insert into source_authority_quarantines (id, entity_type, entity_id, reason, metadata)
          values
            ('10000000-0000-4000-8000-000000000001', 'source_decision', ${decision!.id}, 'test_decision', '{}'::jsonb),
            ('20000000-0000-4000-8000-000000000002', 'source_decision_edge', ${edge!.id}, 'test_edge', ${client.json({ source_claim_id: claim!.id })}),
            ('30000000-0000-4000-8000-000000000003', 'source_artifact', ${otherArtifact!.id}, 'other_project', '{}'::jsonb)
        `;

        const beforeCount = await client<{ count: number }[]>`select count(*)::int as count from source_authority_quarantines`;
        const firstPage = await listSourceAuthorityQuarantines({
          databaseUrl: disposable.databaseUrl,
          projectId: project!.id,
          limit: 1
        });

        expect(firstPage).toMatchObject({
          totalCount: 2,
          unresolvedCount: 2,
          returnedCount: 1,
          truncated: true,
          nextAfterId: "10000000-0000-4000-8000-000000000001",
          items: [{ currentAuthority: "governing", resolution: "unresolved", projectId: project!.id }]
        });

        await client`delete from source_decision_edges where id = ${edge!.id}`;
        await client`update source_decisions set status = 'defer' where id = ${decision!.id}`;
        await client`update source_claims set status = 'deprecated' where id = ${claim!.id}`;

        const secondPage = await listSourceAuthorityQuarantines({
          databaseUrl: disposable.databaseUrl,
          projectId: project!.id,
          limit: 1,
          afterId: firstPage.nextAfterId!
        });
        const afterCount = await client<{ count: number }[]>`select count(*)::int as count from source_authority_quarantines`;

        expect(secondPage).toMatchObject({
          totalCount: 2,
          unresolvedCount: 0,
          returnedCount: 1,
          truncated: false,
          nextAfterId: null,
          items: [{ currentAuthority: "absent", resolution: "resolved", projectId: project!.id }]
        });
        expect(afterCount).toEqual(beforeCount);
      } finally {
        try {
          await client.end();
        } finally {
          await disposable.cleanup();
        }
      }
    },
    60_000
  );
});
