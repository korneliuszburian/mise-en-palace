import type {
  SourceDecisionImportReconciliationItems,
  SourceDecisionImportReconciliationReport
} from "@krn/core/repositories/internal";
import {
  sourceDecisionImportReconciliationLimitMaximum
} from "@krn/core/repositories/internal";

import type {
  BaseCommandRuntime
} from "./command-runtime-support.js";
import {
  createDatabaseRuntime
} from "./database-runtime.js";
import type {
  DatabaseRuntime,
  DatabaseRuntimeInput
} from "./database-runtime.js";
import type {
  CliCommand
} from "./parse-args.js";
import {
  createSourceCommandDatabaseRuntime
} from "./source-database-runtime-support.js";

export type SourceDecisionReconcileCommand = Extract<
  CliCommand,
  { kind: "sourceDecisionReconcile" }
>;

export interface SourceDecisionReconcileCommandRuntime extends BaseCommandRuntime {
  cwd: string;
  command: SourceDecisionReconcileCommand;
  createDatabaseRuntime?: CreateSourceDecisionReconcileDatabaseRuntime;
}

export interface SourceDecisionReconcileCommandResult {
  stdout: string;
}

export type CreateSourceDecisionReconcileDatabaseRuntime = (
  input: DatabaseRuntimeInput
) => Promise<DatabaseRuntime>;

interface SourceDecisionReconciliationReport extends SourceDecisionImportReconciliationReport {
  kind: "source_decision_import_reconciliation";
  projectId: string;
  persistence: "read_only_postgres";
  snapshotConsistency: "repeatable_read";
  dbWrites: "none";
  mutation: "none";
  proof: {
    proves: readonly string[];
    doesNotProve: readonly string[];
  };
}

const defaultLimit = sourceDecisionImportReconciliationLimitMaximum;

const formatBoundedIds = (
  label: string,
  values: SourceDecisionImportReconciliationItems<string>
): string => `${label}:${values.totalCount}[${values.items.join(", ") || "none"}]${
  values.truncated ? " (truncated)" : ""
}`;

const formatText = (report: SourceDecisionReconciliationReport): string => [
  "KRN Source Decision Import Reconciliation",
  "Persistence: read-only (Postgres)",
  "Snapshot consistency: repeatable read",
  "DB writes: none",
  "Mutation: none",
  `Project: ${report.projectId}`,
  `List limit: ${report.limit}`,
  `After import: ${report.afterImportId ?? "start"}`,
  `Next after import: ${report.nextAfterImportId ?? "none"}`,
  `Inspected imports: ${report.imports.returnedCount}/${report.imports.totalCount}`,
  `Truncated: ${report.imports.truncated ? "yes" : "no"}`,
  "",
  "Imports:",
  ...(report.imports.items.length === 0
    ? ["- none"]
    : report.imports.items.flatMap((item) => [
        `- import:${item.importId} lifecycle:${item.lifecycle} rows:${item.rowCount} complete:${item.completeRowCount} partial:${item.partialRowCount}`,
        `  corpusDigest:${item.corpusDigest}`,
        `  ${formatBoundedIds("equivalentImportIds", item.equivalentImportIds)}`,
        `  returnedRows:${item.rows.returnedCount}/${item.rows.totalCount}${item.rows.truncated ? " (truncated)" : ""}`,
        ...item.rows.items.flatMap((row) => [
          `  row:${row.decisionId ?? "missing"} lifecycle:${row.lifecycle} sourceArtifact:${row.sourceArtifactId} contentHash:${row.contentHash}`,
          `    violations:${row.violations.join(", ") || "none"}`,
          `    ${[
            formatBoundedIds("chunks", row.components.sourceChunks),
            formatBoundedIds("claims", row.components.sourceClaims),
            formatBoundedIds("decisions", row.components.sourceDecisions),
            formatBoundedIds("decisionEdges", row.components.sourceDecisionEdges),
            formatBoundedIds("searchDocuments", row.components.searchDocuments),
            formatBoundedIds("rejections", row.components.sourceRejections)
          ].join(" ")}`
        ])
      ])),
  "",
  "Proof:",
  ...report.proof.proves.map((item) => `- proves: ${item}`),
  ...report.proof.doesNotProve.map((item) => `- doesNotProve: ${item}`)
].join("\n");

export const runSourceDecisionReconcileCommand = async (
  runtime: SourceDecisionReconcileCommandRuntime
): Promise<SourceDecisionReconcileCommandResult> => {
  const databaseUrl = runtime.env.KRN_DATABASE_URL?.trim();

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error("KRN_DATABASE_URL is required for krn source decision reconcile");
  }

  if (runtime.command.projectId === undefined) {
    throw new Error("--project is required for read-only source decision reconciliation");
  }

  const databaseRuntime = await createSourceCommandDatabaseRuntime({
    createRuntime: runtime.createDatabaseRuntime ?? createDatabaseRuntime,
    databaseUrl,
    commandProjectId: runtime.command.projectId,
    cwd: runtime.cwd,
    requireProjectKernelForExplicitProject: false,
    now: runtime.now,
    createId: runtime.createId
  });

  try {
    const withReadSnapshot = databaseRuntime.withSourceDecisionImportReadSnapshot;

    if (withReadSnapshot === undefined) {
      throw new Error("source decision import repeatable-read snapshot is unavailable");
    }

    const reconciliation = await withReadSnapshot((repository) =>
      repository.listSourceDecisionImportReconciliation({
        projectId: databaseRuntime.projectId,
        limit: runtime.command.limit ?? defaultLimit,
        ...(runtime.command.afterImportId === undefined
          ? {}
          : { afterImportId: runtime.command.afterImportId })
      })
    );
    const report: SourceDecisionReconciliationReport = {
      kind: "source_decision_import_reconciliation",
      projectId: databaseRuntime.projectId,
      persistence: "read_only_postgres",
      snapshotConsistency: "repeatable_read",
      dbWrites: "none",
      mutation: "none",
      ...reconciliation,
      proof: {
        proves: [
          "bounded project-scoped readback names exact incomplete tuple IDs, counts, and violations",
          "one repeatable-read read-only snapshot keeps counts, rows, and equivalent IDs consistent",
          "equivalent import IDs share the same exact decision ID and content-hash corpus digest"
        ],
        doesNotProve: [
          "source truth",
          "safe automated duplicate repair",
          "designated-store authority",
          "Memory Core mutation",
          "product readiness"
        ]
      }
    };

    return {
      stdout: runtime.command.json === true
        ? `${JSON.stringify(report, null, 2)}\n`
        : formatText(report)
    };
  } finally {
    await databaseRuntime.close();
  }
};
