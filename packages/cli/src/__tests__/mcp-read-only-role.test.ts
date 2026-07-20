import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { describe, expect, it } from "vitest";
import { createKrnDatabase } from "@krn/db";
import { createCompiledSmokeExecution, migrateDatabase } from "@krn/db/dev";
import { defaultProjectSlug } from "../database-runtime.js";
import { handleDecisionPacketMcpMessage } from "../internal/mcp/decision-packet-mcp-server.js";

const operatorDatabaseUrl = process.env.KRN_DATABASE_URL?.trim();
const repoRoot = fileURLToPath(new URL("../../../../", import.meta.url));
const migrationsFolder = path.join(repoRoot, "packages", "db", "src", "migrations");

const databaseUrlFor = (
  input: string,
  databaseName: string,
  credentials?: { readonly username: string; readonly password: string }
): string => {
  const parsed = new URL(input);
  parsed.pathname = `/${databaseName}`;
  if (credentials !== undefined) {
    parsed.username = credentials.username;
    parsed.password = credentials.password;
  }
  return parsed.toString();
};

const sqlStateFrom = (error: unknown): string | undefined => {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return undefined;
  }
  return typeof error.code === "string" ? error.code : undefined;
};

describe("DecisionPacket MCP PostgreSQL role boundary", () => {
  it.skipIf(operatorDatabaseUrl === undefined || operatorDatabaseUrl.length === 0)(
    "reads an issued packet with SELECT-only grants and rejects a controlled write",
    async () => {
      const suffix = crypto.randomUUID().replaceAll("-", "");
      const databaseName = `krn_mcp_read_only_${suffix}`;
      const roleName = `krn_mcp_reader_${suffix}`;
      const rolePassword = crypto.randomBytes(24).toString("base64url");
      const adminClient = postgres(databaseUrlFor(operatorDatabaseUrl!, "postgres"), {
        max: 1,
        onnotice: () => undefined
      });
      let databaseCreated = false;
      let roleCreated = false;

      try {
        await adminClient.unsafe(`create database ${databaseName}`);
        databaseCreated = true;
        const [createRole] = await adminClient<{ statement: string }[]>`
          select format(
            'create role %I login password %L',
            ${roleName}::text,
            ${rolePassword}::text
          )
            as statement
        `;
        if (createRole === undefined) {
          throw new Error("PostgreSQL did not render the disposable read-only role statement");
        }
        await adminClient.unsafe(createRole.statement);
        roleCreated = true;
        await adminClient`grant connect on database ${adminClient(databaseName)} to ${adminClient(roleName)}`;

        const ownerDatabaseUrl = databaseUrlFor(operatorDatabaseUrl!, databaseName);
        await migrateDatabase({ databaseUrl: ownerDatabaseUrl, migrationsFolder });
        const ownerClient = postgres(ownerDatabaseUrl, { max: 1, onnotice: () => undefined });

        try {
          const compiled = await createCompiledSmokeExecution({
            acceptance: "read an issued DecisionPacket through a SELECT-only PostgreSQL role",
            command: "mcp-read-only-role-test",
            db: createKrnDatabase(ownerClient),
            marker: `mcp-read-only-role-${suffix}`,
            projectSlug: defaultProjectSlug,
            task: "prove the DecisionPacket MCP database role cannot write",
            workspaceSlug: `mcp-read-only-role-${suffix}`
          });
          await compiled.harnessRunRepository.issueDecisionPacketForExecutionRun(
            compiled.executionRun.id
          );

          await ownerClient`revoke all on schema public from ${ownerClient(roleName)}`;
          await ownerClient`grant usage on schema public to ${ownerClient(roleName)}`;
          await ownerClient`grant select on all tables in schema public to ${ownerClient(roleName)}`;

          const readOnlyDatabaseUrl = databaseUrlFor(operatorDatabaseUrl!, databaseName, {
            username: roleName,
            password: rolePassword
          });
          const mcpReply = await handleDecisionPacketMcpMessage({
            jsonrpc: "2.0",
            id: "read-only-role-proof",
            method: "tools/call",
            params: {
              name: "krn_decision_packet",
              arguments: { runId: compiled.executionRun.id }
            }
          }, {
            env: { KRN_DATABASE_URL: readOnlyDatabaseUrl },
            now: () => "2026-07-16T12:00:00.000Z",
            createId: (prefix) => `${prefix}-read-only-role-proof`,
            session: { phase: "ready" }
          });

          expect(mcpReply).toMatchObject({
            jsonrpc: "2.0",
            id: "read-only-role-proof",
            result: {
              isError: false,
              structuredContent: {
                checksumAlgorithm: "sha256"
              },
              _meta: {
                decisionPacketReadback: {
                  kind: "krn.decisionPacketReadback.v1",
                  access: "read_only",
                  mutation: "none",
                  request: { runId: compiled.executionRun.id }
                }
              }
            }
          });

          const readOnlyClient = postgres(readOnlyDatabaseUrl, { max: 1, onnotice: () => undefined });
          try {
            const [roleReadback] = await readOnlyClient<{
              currentUser: string;
              selectedTableCount: number;
            }[]>`
              select current_user::text as "currentUser", count(*)::int as "selectedTableCount"
              from information_schema.role_table_grants
              where grantee = current_user
                and privilege_type = 'SELECT'
                and table_schema = 'public'
            `;
            let writeSqlState: string | undefined;
            try {
              await readOnlyClient`
                insert into workspaces (slug, display_name, metadata)
                values (${`forbidden-${suffix}`}, 'forbidden read-only write', '{}'::jsonb)
              `;
            } catch (error) {
              writeSqlState = sqlStateFrom(error);
            }

            const proofArtifact = {
              kind: "krn.mcpReadOnlyRoleProof.v1",
              role: roleReadback?.currentUser,
              grants: {
                connect: true,
                schemaUsage: true,
                selectedTableCount: roleReadback?.selectedTableCount
              },
              operations: {
                decisionPacketMcpRead: "passed",
                controlledWorkspaceInsert: "denied",
                writeSqlState
              },
              proves: "DB-level least privilege for the tested DecisionPacket MCP read path.",
              doesNotProve:
                "This does not prove broad MCP readiness, network authentication, packet truth, or product usefulness."
            };

            expect(roleReadback).toMatchObject({
              currentUser: roleName,
              selectedTableCount: expect.any(Number)
            });
            expect(roleReadback?.selectedTableCount).toBeGreaterThan(0);
            expect(writeSqlState).toBe("42501");
            expect(JSON.stringify(proofArtifact)).not.toContain(rolePassword);
            expect(JSON.stringify(proofArtifact)).not.toContain("postgres://");
            console.info(JSON.stringify(proofArtifact));
          } finally {
            await readOnlyClient.end();
          }
        } finally {
          await ownerClient.end();
        }
      } finally {
        if (databaseCreated) {
          await adminClient.unsafe(`drop database if exists ${databaseName} with (force)`);
        }
        if (roleCreated) {
          await adminClient`drop role if exists ${adminClient(roleName)}`;
        }
        await adminClient.end();
      }
    },
    120_000
  );
});
