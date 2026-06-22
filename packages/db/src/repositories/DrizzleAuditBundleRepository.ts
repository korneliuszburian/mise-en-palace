import { eq, sql } from "drizzle-orm";
import type {
  AuditBundle,
  AuditCandidateUpdate,
  AuditCommandResult,
  AuditFinding,
  ExecutionRunId,
  ProjectId
} from "@krn/core";

import type { KrnDatabase } from "../database.js";
import {
  auditBundles,
  auditFindings
} from "../schema/index.js";
import {
  requireReturnedRow,
  toIsoTimestamp
} from "./common.js";

type AuditFindingInput = Omit<AuditFinding, "id" | "createdAt">;

export interface CreateAuditBundleInput {
  projectId?: ProjectId;
  executionRunId?: ExecutionRunId;
  sliceId: string;
  commitCandidate?: string;
  changedFiles: string[];
  intendedFiles: string[];
  unexpectedFiles: string[];
  verificationCommands: AuditCommandResult[];
  verificationResults: string;
  architecturalDelta: string;
  boundaryFindings: AuditFindingInput[];
  typeSafetyFindings: AuditFindingInput[];
  memorySemanticsFindings: AuditFindingInput[];
  sourceGroundingFindings: AuditFindingInput[];
  policyFindings: AuditFindingInput[];
  evalFindings: AuditFindingInput[];
  reviewBurdenEstimate: AuditBundle["reviewBurdenEstimate"];
  diffRiskEstimate: AuditBundle["diffRiskEstimate"];
  rollbackPath: string;
  candidateUpdates: AuditCandidateUpdate[];
  selfCritiqueSummary: string;
  finalVerdict: AuditBundle["finalVerdict"];
  metadata?: Record<string, unknown>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const metadataOrEmpty = (value: unknown): Record<string, unknown> =>
  isRecord(value) ? value : {};

const stringListOrEmpty = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

const auditCommandsOrEmpty = (value: unknown): AuditCommandResult[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is AuditCommandResult => {
    if (!isRecord(item) || typeof item.command !== "string") {
      return false;
    }

    return item.status === "passed" || item.status === "failed" || item.status === "skipped";
  });
};

const auditCandidateUpdatesOrEmpty = (value: unknown): AuditCandidateUpdate[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is AuditCandidateUpdate => {
    if (!isRecord(item) || typeof item.summary !== "string") {
      return false;
    }

    return (
      item.kind === "memory_candidate" ||
      item.kind === "source_claim_candidate" ||
      item.kind === "anti_memory_candidate" ||
      item.kind === "eval_candidate" ||
      item.kind === "policy_candidate" ||
      item.kind === "none"
    );
  });
};

const groupFindings = (findings: AuditFindingInput[]): AuditFindingInput[] => findings;

const allFindingInputs = (input: CreateAuditBundleInput): AuditFindingInput[] => [
  ...groupFindings(input.boundaryFindings),
  ...groupFindings(input.typeSafetyFindings),
  ...groupFindings(input.memorySemanticsFindings),
  ...groupFindings(input.sourceGroundingFindings),
  ...groupFindings(input.policyFindings),
  ...groupFindings(input.evalFindings)
];

const findingsByCategory = (
  findings: AuditFinding[],
  category: AuditFinding["category"]
): AuditFinding[] => findings.filter((finding) => finding.category === category);

export class DrizzleAuditBundleRepository {
  constructor(private readonly db: KrnDatabase) {}

  async createAuditBundle(input: CreateAuditBundleInput): Promise<AuditBundle> {
    return this.db.transaction(async (tx) => {
      const bundleRow = requireReturnedRow(
        await tx
          .insert(auditBundles)
          .values({
            ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
            ...(input.executionRunId === undefined
              ? {}
              : { executionRunId: input.executionRunId }),
            sliceId: input.sliceId,
            ...(input.commitCandidate === undefined
              ? {}
              : { commitCandidate: input.commitCandidate }),
            changedFiles: input.changedFiles,
            intendedFiles: input.intendedFiles,
            unexpectedFiles: input.unexpectedFiles,
            verificationCommands: input.verificationCommands,
            verificationResults: input.verificationResults,
            architecturalDelta: input.architecturalDelta,
            reviewBurdenEstimate: input.reviewBurdenEstimate,
            diffRiskEstimate: input.diffRiskEstimate,
            rollbackPath: input.rollbackPath,
            candidateUpdates: input.candidateUpdates,
            selfCritiqueSummary: input.selfCritiqueSummary,
            finalVerdict: input.finalVerdict,
            metadata: input.metadata ?? {}
          })
          .returning(),
        "createAuditBundle"
      );

      const findingInputs = allFindingInputs(input);

      if (findingInputs.length > 0) {
        await tx.insert(auditFindings).values(
          findingInputs.map((finding) => ({
            auditBundleId: bundleRow.id,
            category: finding.category,
            severity: finding.severity,
            title: finding.title,
            summary: finding.summary,
            evidenceRefs: finding.evidenceRefs,
            recommendation: finding.recommendation,
            status: finding.status
          }))
        );
      }

      const findingRows = await tx.query.auditFindings.findMany({
        where: eq(auditFindings.auditBundleId, bundleRow.id)
      });

      return mapAuditBundle(bundleRow, findingRows.map(mapAuditFinding));
    });
  }

  async getAuditBundleById(id: string): Promise<AuditBundle | undefined> {
    const bundleRow = await this.db.query.auditBundles.findFirst({
      where: eq(auditBundles.id, id)
    });

    if (bundleRow === undefined) {
      return undefined;
    }

    const findingRows = await this.db.query.auditFindings.findMany({
      where: eq(auditFindings.auditBundleId, id)
    });

    return mapAuditBundle(bundleRow, findingRows.map(mapAuditFinding));
  }

  async cleanupTestAuditBundles(smokeId: string): Promise<number> {
    const rows = await this.db
      .delete(auditBundles)
      .where(sql`${auditBundles.metadata}->>'smokeId' = ${smokeId}`)
      .returning({ id: auditBundles.id });

    return rows.length;
  }
}

type AuditBundleRow = typeof auditBundles.$inferSelect;
type AuditFindingRow = typeof auditFindings.$inferSelect;

const mapAuditFinding = (row: AuditFindingRow): AuditFinding => ({
  id: row.id,
  category: row.category,
  severity: row.severity,
  title: row.title,
  summary: row.summary,
  evidenceRefs: stringListOrEmpty(row.evidenceRefs),
  recommendation: row.recommendation,
  status: row.status,
  createdAt: toIsoTimestamp(row.createdAt)
});

const mapAuditBundle = (
  row: AuditBundleRow,
  findings: AuditFinding[]
): AuditBundle => ({
  id: row.id,
  ...(row.projectId === null ? {} : { projectId: row.projectId }),
  ...(row.executionRunId === null ? {} : { executionRunId: row.executionRunId }),
  sliceId: row.sliceId,
  ...(row.commitCandidate === null ? {} : { commitCandidate: row.commitCandidate }),
  changedFiles: stringListOrEmpty(row.changedFiles),
  intendedFiles: stringListOrEmpty(row.intendedFiles),
  unexpectedFiles: stringListOrEmpty(row.unexpectedFiles),
  verificationCommands: auditCommandsOrEmpty(row.verificationCommands),
  verificationResults: row.verificationResults,
  architecturalDelta: row.architecturalDelta,
  boundaryFindings: findingsByCategory(findings, "boundary"),
  typeSafetyFindings: findingsByCategory(findings, "type_safety"),
  memorySemanticsFindings: findingsByCategory(findings, "memory_semantics"),
  sourceGroundingFindings: findingsByCategory(findings, "source_grounding"),
  policyFindings: findingsByCategory(findings, "policy"),
  evalFindings: findingsByCategory(findings, "eval"),
  reviewBurdenEstimate: row.reviewBurdenEstimate,
  diffRiskEstimate: row.diffRiskEstimate,
  rollbackPath: row.rollbackPath,
  candidateUpdates: auditCandidateUpdatesOrEmpty(row.candidateUpdates),
  selfCritiqueSummary: row.selfCritiqueSummary,
  finalVerdict: row.finalVerdict,
  metadata: metadataOrEmpty(row.metadata),
  createdAt: toIsoTimestamp(row.createdAt),
  updatedAt: toIsoTimestamp(row.updatedAt)
});
