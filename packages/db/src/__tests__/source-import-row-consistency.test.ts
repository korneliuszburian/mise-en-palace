import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

import postgres from "postgres";
import { describe, expect, it } from "vitest";

import { migrateDatabase } from "../migration-readiness.js";

const databaseUrl = process.env.KRN_DATABASE_URL?.trim();
const migrationsFolder = fileURLToPath(new URL("../migrations", import.meta.url));

const databaseUrlFor = (input: string, databaseName: string): string => {
  const parsed = new URL(input);
  parsed.pathname = `/${databaseName}`;
  return parsed.toString();
};

const createDisposableDatabase = async (input: string) => {
  const databaseName = `krn_source_import_consistency_${crypto.randomUUID().replaceAll("-", "")}`;
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

const constraintViolation = (constraintName: string) => ({
  code: "23514",
  constraint_name: constraintName
});

describe("source import row consistency", () => {
  it.skipIf(databaseUrl === undefined || databaseUrl.length === 0)(
    "rejects partial import tuples malformed imported digests and contradictory search validity",
    async () => {
      const disposable = await createDisposableDatabase(databaseUrl!);
      const client = postgres(disposable.databaseUrl, { max: 1, onnotice: () => undefined });

      try {
        await migrateDatabase({ databaseUrl: disposable.databaseUrl, migrationsFolder });
        const [workspace] = await client<{ id: string }[]>`
          insert into workspaces (slug, display_name)
          values ('source-import-consistency', 'Source import consistency')
          returning id
        `;
        const [project] = await client<{ id: string }[]>`
          insert into projects (workspace_id, slug, display_name)
          values (${workspace!.id}, 'source-import-consistency', 'Source import consistency')
          returning id
        `;
        const digest = "a".repeat(64);

        await expect(client`
          insert into source_artifacts (
            project_id, import_id, kind, trust_tier, uri, title, content_hash
          ) values (
            ${project!.id}, 'import-one', 'doc', 'project-decision',
            'consistency://partial', 'partial', ${digest}
          )
        `).rejects.toMatchObject(constraintViolation("source_artifacts_import_tuple_complete"));

        await expect(client`
          insert into source_artifacts (
            project_id, import_id, import_row_id, kind, trust_tier, uri, title, content_hash
          ) values (
            ${project!.id}, 'import-one', 'row-one', 'doc', 'project-decision',
            'consistency://digest', 'digest', 'not-a-digest'
          )
        `).rejects.toMatchObject(constraintViolation("source_artifacts_import_content_hash_sha256"));

        const invalidSearchRows = [
          {
            title: "invalid-window",
            validityStatus: "active",
            validFrom: "2026-07-16T12:00:00.000Z",
            validUntil: "2026-07-16T12:00:00.000Z",
            invalidatedAt: null,
            constraint: "search_documents_validity_window"
          },
          {
            title: "active-invalidated",
            validityStatus: "active",
            validFrom: "2026-07-16T12:00:00.000Z",
            validUntil: null,
            invalidatedAt: "2026-07-16T13:00:00.000Z",
            constraint: "search_documents_validity_status_timestamps"
          },
          {
            title: "expired-invalidated",
            validityStatus: "expired",
            validFrom: "2026-07-16T12:00:00.000Z",
            validUntil: null,
            invalidatedAt: "2026-07-16T13:00:00.000Z",
            constraint: "search_documents_validity_status_timestamps"
          },
          {
            title: "invalidated-without-time",
            validityStatus: "invalidated",
            validFrom: "2026-07-16T12:00:00.000Z",
            validUntil: null,
            invalidatedAt: null,
            constraint: "search_documents_validity_status_timestamps"
          }
        ] as const;

        for (const row of invalidSearchRows) {
          await expect(client`
            insert into search_documents (
              project_id, subject_type, subject_id, trust_tier, validity_status,
              title, body, search_text, valid_from, valid_until, invalidated_at
            ) values (
              ${project!.id}, 'owner_file', ${crypto.randomUUID()}, 'project-decision',
              ${row.validityStatus}, ${row.title}, 'body', ${row.title}, ${row.validFrom},
              ${row.validUntil}, ${row.invalidatedAt}
            )
          `).rejects.toMatchObject(constraintViolation(row.constraint));
        }

        const validArtifact = await client<{ id: string }[]>`
          insert into source_artifacts (
            project_id, import_id, import_row_id, kind, trust_tier, uri, title, content_hash
          ) values (
            ${project!.id}, 'import-valid', 'row-valid', 'doc', 'project-decision',
            'consistency://valid', 'valid', ${digest}
          ) returning id
        `;
        const validSearchRows = await client<{ id: string }[]>`
          insert into search_documents (
            project_id, subject_type, subject_id, trust_tier, validity_status,
            title, body, search_text, valid_from, valid_until, invalidated_at
          ) values
            (
              ${project!.id}, 'owner_file', ${crypto.randomUUID()}, 'project-decision', 'active',
              'active', 'body', 'active', '2026-07-16T12:00:00.000Z',
              '2026-07-16T13:00:00.000Z', null
            ),
            (
              ${project!.id}, 'owner_file', ${crypto.randomUUID()}, 'project-decision', 'expired',
              'expired', 'body', 'expired', '2026-07-16T12:00:00.000Z', null, null
            ),
            (
              ${project!.id}, 'owner_file', ${crypto.randomUUID()}, 'project-decision', 'invalidated',
              'invalidated', 'body', 'invalidated', '2026-07-16T12:00:00.000Z', null,
              '2026-07-16T13:00:00.000Z'
            )
          returning id
        `;

        expect(validArtifact).toHaveLength(1);
        expect(validSearchRows).toHaveLength(3);
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
