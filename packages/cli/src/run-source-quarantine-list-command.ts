import {
  listSourceAuthorityQuarantines,
  sourceAuthorityQuarantineReadbackLimitMaximum,
  type SourceAuthorityQuarantineReadbackInput,
  type SourceAuthorityQuarantineReadbackReport
} from "@krn/db/dev";

import type { CliCommand } from "./parse-args.js";

type SourceQuarantineListCommand = Extract<CliCommand, { kind: "sourceQuarantineList" }>;

export interface SourceQuarantineListCommandRuntime {
  readonly env: Record<string, string | undefined>;
  readonly command: SourceQuarantineListCommand;
  readonly listQuarantines?: (
    input: SourceAuthorityQuarantineReadbackInput
  ) => Promise<SourceAuthorityQuarantineReadbackReport>;
}

export interface SourceQuarantineListCommandResult {
  readonly stdout: string;
}

interface SourceQuarantineListReport extends SourceAuthorityQuarantineReadbackReport {
  readonly kind: "source_authority_quarantine_readback";
  readonly persistence: "read_only_postgres";
  readonly snapshotConsistency: "repeatable_read";
  readonly dbWrites: "none";
  readonly mutation: "none";
  readonly proof: {
    readonly proves: readonly string[];
    readonly doesNotProve: readonly string[];
  };
}

const formatQuarantineItem = (
  item: SourceAuthorityQuarantineReadbackReport["items"][number]
): string =>
  `- ${item.id} entity:${item.entityType}/${item.entityId} reason:${item.reason} project:${item.projectId ?? "unknown"} authority:${item.currentAuthority} resolution:${item.resolution} at:${item.quarantinedAt}`;

const formatQuarantineItems = (report: SourceQuarantineListReport): readonly string[] =>
  report.items.length === 0 ? ["- none"] : report.items.map(formatQuarantineItem);

const formatText = (report: SourceQuarantineListReport): string => [
  "KRN Source Authority Quarantine Readback",
  "Persistence: read-only (Postgres)",
  "Snapshot consistency: repeatable read",
  "DB writes: none",
  "Mutation: none",
  `Project: ${report.projectId ?? "all"}`,
  `List limit: ${report.limit}`,
  `After quarantine: ${report.afterId ?? "start"}`,
  `Next after quarantine: ${report.nextAfterId ?? "none"}`,
  `Returned: ${report.returnedCount}/${report.totalCount}`,
  `Unresolved: ${report.unresolvedCount}`,
  `Truncated: ${report.truncated ? "yes" : "no"}`,
  "",
  "Quarantines:",
  ...formatQuarantineItems(report),
  "",
  "Proof:",
  ...report.proof.proves.map((item) => `- proves: ${item}`),
  ...report.proof.doesNotProve.map((item) => `- doesNotProve: ${item}`)
].join("\n");

const createReport = (
  readback: SourceAuthorityQuarantineReadbackReport
): SourceQuarantineListReport => ({
  kind: "source_authority_quarantine_readback",
  persistence: "read_only_postgres",
  snapshotConsistency: "repeatable_read",
  dbWrites: "none",
  mutation: "none",
  ...readback,
  proof: {
    proves: [
      "bounded keyset readback exposes quarantine reason, entity, time, project, current authority, and resolution",
      "one repeatable-read read-only snapshot keeps counts and rows consistent"
    ],
    doesNotProve: ["source truth", "safe automatic restore or deletion", "production readiness"]
  }
});

const renderReport = (report: SourceQuarantineListReport, json: boolean): string =>
  json ? `${JSON.stringify(report, null, 2)}\n` : `${formatText(report)}\n`;

export const runSourceQuarantineListCommand = async (
  runtime: SourceQuarantineListCommandRuntime
): Promise<SourceQuarantineListCommandResult> => {
  const databaseUrl = runtime.env.KRN_DATABASE_URL?.trim();

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error("KRN_DATABASE_URL is required for krn source quarantine list");
  }

  const readback = await (runtime.listQuarantines ?? listSourceAuthorityQuarantines)({
    databaseUrl,
    limit: runtime.command.limit ?? sourceAuthorityQuarantineReadbackLimitMaximum,
    ...(runtime.command.projectId === undefined ? {} : { projectId: runtime.command.projectId }),
    ...(runtime.command.afterId === undefined ? {} : { afterId: runtime.command.afterId })
  });

  return {
    stdout: renderReport(createReport(readback), runtime.command.json === true)
  };
};
